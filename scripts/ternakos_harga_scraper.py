"""
TernakOS — Auto Fetch Harga Pasar Broiler
==========================================
Sumber: https://chickin.id/blog/update/harga-ayam/
Update: setiap hari kerja pukul 06:00 WIB via cron

Data yang diambil:
  - farm_gate_price : harga livebird Jawa Tengah (dari chickin.id)
  - buyer_price     : estimasi = farm_gate_price + BUYER_MARGIN

SETUP:
  pip install requests beautifulsoup4 python-dotenv

CRON (crontab -e):
  0 6 * * 1-5 /usr/bin/python3 /path/to/ternakos_harga_scraper.py >> /var/log/ternakos_scraper.log 2>&1
"""

import requests # type: ignore
from bs4 import BeautifulSoup # type: ignore
from datetime import datetime, timezone, timedelta
import sys
import json
import os
import logging
from dotenv import load_dotenv # type: ignore

# ── Load env ──────────────────────────────────────────────
# Load from root directory if running from scripts/
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

SUPABASE_URL    = os.getenv("SUPABASE_URL", "https://llgqxzrlcewugufzwyer.supabase.co")
SUPABASE_KEY    = os.getenv("SUPABASE_SERVICE_KEY")

# ── Config ────────────────────────────────────────────────
SOURCE_URL      = "https://chickin.id/blog/update/harga-ayam/"
TARGET_REGION   = "Jawa Tengah"
TARGET_WEIGHT   = "< 2,0"
BUYER_MARGIN    = 2500   # Rp/kg — ubah sesuai kondisi lapangan

# ── Timezone WIB ──────────────────────────────────────────
WIB = timezone(timedelta(hours=7))

# ── Logging ───────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S"
)
log = logging.getLogger(__name__)


# ══════════════════════════════════════════════════════════
# FETCH & PARSE
# ══════════════════════════════════════════════════════════

def parse_harga(text: str) -> int:
    """
    Parse harga dari string.
    "25000-25500" → nilai tengah (25250)
    "25000"       → 25000
    """
    text = text.strip().replace(".", "").replace(",", "")
    if "-" in text:
        parts = [int(p.strip()) for p in text.split("-") if p.strip().isdigit()]
        return sum(parts) // len(parts) if parts else 0
    return int(text) if text.isdigit() else 0


def fetch_harga_from_chickin() -> dict:
    headers = {
        "User-Agent": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/120.0.0.0 Safari/537.36"
        ),
        "Accept-Language": "id-ID,id;q=0.9",
    }

    log.info(f"Fetching: {SOURCE_URL}")
    response = requests.get(SOURCE_URL, headers=headers, timeout=15)
    response.raise_for_status()

    soup  = BeautifulSoup(response.text, "html.parser")
    table = soup.find("table")
    if not table:
        raise ValueError("Tabel tidak ditemukan di halaman")

    rows           = table.find_all("tr")
    collected_prices = []
    current_region = ""

    for row in rows:
        cells = row.find_all(["td", "th"])
        texts = [c.get_text(strip=True) for c in cells]
        if not texts or len(texts) < 2:
            continue

        # Detect Region
        # Row structure can vary: [Wilayah, Kota, Berat, Harga] or just [Berat, Harga]
        first_cell = texts[0]
        if first_cell and any(k in first_cell for k in [
            "Jawa", "Bali", "Kalimantan", "Sulawesi", "Sumatera",
            "Lampung", "Jabodetabek", "Banten", "NTB", "NTT",
            "Riau", "Jambi", "Bengkulu", "Gorontalo", "Aceh"
        ]):
            current_region = first_cell

        # Only process targeted regions (Jawa Tengah / DIY)
        region_str = str(current_region)
        is_target = any(t in region_str for t in ["Jawa Tengah", "DIY"])
        if not is_target:
            continue

        # Look for weight categories under 2kg
        berat = texts[-2]
        harga = texts[-1]
        
        # Log every row in target region for debugging
        log.info(f"  ? Found row: {current_region} | {berat} | {harga}")

        # Check if it's a valid weight category we want to average
        # We target weights < 2.0. This includes "< 1", "1.0", "1.2", etc.
        # But we exclude "> 2" or very large weights.
        is_small_weight = any(w in berat for w in ["<", "1,", "1.", "0,"]) or ("2," not in berat and "2." not in berat)
        
        # Explicit exclusion for > 2.0
        if "> 2" in berat or ">2" in berat:
            is_small_weight = False

        if is_small_weight:
            nilai = parse_harga(harga)
            if nilai > 0:
                collected_prices.append(nilai)
                log.info(f"    => Match added! (Current avg: {sum(collected_prices)/len(collected_prices):,.0f})")

    if not collected_prices:
        raise ValueError("Tidak ada data harga valid ditemukan untuk wilayah target")

    avg_farm_gate = sum(collected_prices) // len(collected_prices)
    log.info(f"✓ Rata-rata ditemukan: Rp {avg_farm_gate:,} (dari {len(collected_prices)} baris)")

    return {
        "farm_gate_price": avg_farm_gate,
        "buyer_price":     avg_farm_gate + BUYER_MARGIN,
        "region":          "Jawa Tengah",
        "source_url":      SOURCE_URL,
    }


# ══════════════════════════════════════════════════════════
# SUPABASE
# ══════════════════════════════════════════════════════════

def already_exists_today() -> bool:
    today = datetime.now(WIB).strftime("%Y-%m-%d")
    url   = (
        f"{SUPABASE_URL}/rest/v1/market_prices"
        f"?price_date=eq.{today}&source=eq.auto_scraper&select=id&limit=1"
    )
    headers = {
        "apikey":        SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
    }
    try:
        res = requests.get(url, headers=headers, timeout=10)
        return res.ok and len(res.json()) > 0
    except Exception:
        return False


def insert_to_supabase(harga: dict) -> bool:
    today   = datetime.now(WIB).strftime("%Y-%m-%d")
    payload = {
        "price_date":      today,
        "chicken_type":    "broiler",
        "farm_gate_price": harga["farm_gate_price"],
        "avg_buy_price":   harga["farm_gate_price"],
        "buyer_price":     harga["buyer_price"],
        "avg_sell_price":  harga["buyer_price"],
        "region":          harga["region"],
        "source":          "auto_scraper",
        "source_url":      harga["source_url"],
        "transaction_count": 0,
        "is_deleted":      False,
        "created_at":      datetime.now(WIB).isoformat(),
    }

    headers = {
        "apikey":        SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type":  "application/json",
        "Prefer":        "resolution=merge-duplicates",
    }

    try:
        res = requests.post(
            f"{SUPABASE_URL}/rest/v1/market_prices",
            headers=headers,
            data=json.dumps(payload),
            timeout=10
        )
        res.raise_for_status()
        log.info(
            f"✓ Insert OK [{today}] — "
            f"Beli: Rp {harga['farm_gate_price']:,} | "
            f"Jual est.: Rp {harga['buyer_price']:,}"
        )
        return True
    except requests.RequestException as e:
        log.error(f"Gagal insert: {e}")
        if hasattr(e, "response") and e.response is not None:
            log.error(f"Detail: {e.response.text}")
        return False


# ══════════════════════════════════════════════════════════
# MAIN
# ══════════════════════════════════════════════════════════

def main():
    log.info("═" * 55)
    log.info("TernakOS Harga Scraper — START")

    dry_run = "--dry-run" in sys.argv

    if not dry_run and not SUPABASE_KEY:
        log.error("SUPABASE_SERVICE_KEY tidak ada di .env — abort")
        log.info("Gunakan --dry-run untuk mengetes scraping saja.")
        return

    if not dry_run and already_exists_today():
        log.info("Data hari ini sudah ada — skip")
        log.info("═" * 55)
        return

    try:
        harga = fetch_harga_from_chickin()
    except Exception as e:
        log.error(f"Fetch gagal: {e}")
        log.info("═" * 55)
        return

    if dry_run:
        log.info("DRY RUN — Hasil Scraping:")
        log.info(json.dumps(harga, indent=2))
        log.info("═" * 55)
        return

    success = insert_to_supabase(harga)
    log.info("✓ SELESAI" if success else "✗ GAGAL")
    log.info("═" * 55)


if __name__ == "__main__":
    main()
