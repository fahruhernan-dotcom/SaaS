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
import time
import schedule    # type: ignore
from dotenv import load_dotenv # type: ignore

# ── Load env ──────────────────────────────────────────────
# Load from root directory if running from scripts/
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

SUPABASE_URL    = os.getenv("SUPABASE_URL", os.getenv("VITE_SUPABASE_URL", "https://llgqxzrlcewugufzwyer.supabase.co"))
SUPABASE_KEY    = os.getenv("SUPABASE_SERVICE_KEY", os.getenv("VITE_SUPABASE_ANON_KEY"))

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


def normalize_region(name: str) -> str:
    """
    Standardize region names to match TernakOS frontend.
    Example: 'Jawa Tengah DIY' -> 'Jawa Tengah'
    """
    name_clean = name.strip()
    if "Jawa Tengah" in name_clean:
        return "Jawa Tengah"
    if "Yogyakarta" in name_clean or name_clean == "DIY":
        return "DIY"
    return name_clean


def fetch_harga_from_chickin() -> list:
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

    rows             = table.find_all("tr")
    regional_data    = {}
    current_region   = "Nasional"

    for row in rows:
        cells = row.find_all(["td", "th"])
        texts = [c.get_text(strip=True) for c in cells]
        if not texts or len(texts) < 2:
            continue

        # Detect Region
        first_cell = texts[0]
        if first_cell and any(k in first_cell for k in [
            "Jawa", "Bali", "Kalimantan", "Sulawesi", "Sumatera",
            "Lampung", "Jabodetabek", "Banten", "NTB", "NTT", "DIY",
            "Riau", "Jambi", "Bengkulu", "Gorontalo", "Aceh"
        ]):
            current_region = first_cell

        # Look for weight categories
        berat = texts[-2]
        harga = texts[-1]
        
        # Check if it's a valid weight category (Livebird < 2.0)
        is_small_weight = any(w in berat for w in ["<", "1,", "1.", "0,"]) or ("2," not in berat and "2." not in berat)
        if "> 2" in berat or ">2" in berat:
            is_small_weight = False

        if is_small_weight:
            nilai = parse_harga(harga)
            if nilai > 0:
                if current_region not in regional_data:
                    regional_data[current_region] = []
                regional_data[current_region].append(nilai)

    results = []
    for region, prices in regional_data.items():
        avg_farm_gate = sum(prices) // len(prices)
        norm_region = normalize_region(region)
        
        results.append({
            "farm_gate_price": avg_farm_gate,
            "buyer_price":     avg_farm_gate + BUYER_MARGIN,
            "region":          norm_region,
            "source_url":      SOURCE_URL,
            "original_region": region # For logging
        })
        log.info(f"✓ {norm_region} (from {region}): Rp {avg_farm_gate:,} ({len(prices)} data)")

    return results


# ══════════════════════════════════════════════════════════
# SUPABASE
# ══════════════════════════════════════════════════════════

def get_previous_price(region: str) -> int:
    """Fetch the latest price for this region to calculate delta."""
    url = (
        f"{SUPABASE_URL}/rest/v1/market_prices"
        f"?region=eq.{region}&source=eq.auto_scraper&order=price_date.desc&limit=1&select=farm_gate_price"
    )
    headers = {
        "apikey":        SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
    }
    try:
        res = requests.get(url, headers=headers, timeout=10)
        if res.ok and len(res.json()) > 0:
            return res.json()[0]["farm_gate_price"]
    except Exception as e:
        log.warning(f"Gagal fetch previous price for {region}: {e}")
    return 0


def already_exists_today(region: str) -> bool:
    today = datetime.now(WIB).strftime("%Y-%m-%d")
    url   = (
        f"{SUPABASE_URL}/rest/v1/market_prices"
        f"?price_date=eq.{today}&region=eq.{region}&source=eq.auto_scraper&select=id&limit=1"
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
    
    # Calculate Delta
    prev_price = get_previous_price(harga["region"])
    price_delta = harga["farm_gate_price"] - prev_price if prev_price > 0 else 0

    payload = {
        "price_date":        today,
        "chicken_type":      "broiler",
        "farm_gate_price":   harga["farm_gate_price"],
        "buyer_price":       harga["buyer_price"],
        "price_delta":       price_delta,
        "region":            harga["region"],
        "source":            "auto_scraper",
        "source_url":        harga["source_url"],
        "transaction_count": 0,
    }

    log.info(f"  -> Inserting {harga['region']}...")

    headers = {
        "apikey":        SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type":  "application/json",
        "Prefer":        "return=minimal",
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
    log.info("TernakOS Harga Scraper — START (UNIVERSAL REGIONS)")

    dry_run = "--dry-run" in sys.argv

    if not dry_run and not SUPABASE_KEY:
        log.error("SUPABASE_SERVICE_KEY tidak ada di .env — abort")
        log.info("Gunakan --dry-run untuk mengetes scraping saja.")
        return

    try:
        results = fetch_harga_from_chickin()
    except Exception as e:
        log.error(f"Fetch gagal: {e}")
        log.info("═" * 55)
        return

    if dry_run:
        log.info(f"DRY RUN — Hasil Scraping ({len(results)} wilayah):")
        log.info(json.dumps(results, indent=2))
        log.info("═" * 55)
        return

    count_ok = 0
    for harga in results:
        # Check if already exists for this specific region today
        if already_exists_today(harga["region"]):
            log.info(f"Data {harga['region']} hari ini sudah ada — skip")
            continue
            
        if insert_to_supabase(harga):
            count_ok += 1

    log.info(f"✓ SELESAI ({count_ok}/{len(results)} berhasil diupdate)")
    log.info("═" * 55)


if __name__ == "__main__":
    if "--daemon" in sys.argv:
        log.info("Memulai mode DAEMON")
        main() # Jalankan sekali saat start
        
        # Jadwalkan 2x sehari WIB
        schedule.every().day.at("12:00").do(main)
        schedule.every().day.at("18:00").do(main)
        
        log.info("Daemon aktif — jadwal scrape: 12:00 & 18:00 WIB")
        try:
            while True:
                schedule.run_pending()
                time.sleep(60)
        except KeyboardInterrupt:
            log.info("Daemon dihentikan (KeyboardInterrupt)")
    else:
        main()
