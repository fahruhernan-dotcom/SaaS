"""
TernakOS — Auto Fetch Harga Pasar Broiler (Arboge)
==================================================
Sumber: https://arboge.com/harga-ayam-broiler-hari-ini/
Update: Manual atau via cron

Data yang diambil:
  - farm_gate_price : harga terendah per provinsi (dari realisasi arboge)
  - buyer_price     : farm_gate_price + BUYER_MARGIN

SETUP:
  pip install requests beautifulsoup4 python-dotenv schedule
"""

import requests
from bs4 import BeautifulSoup
from datetime import datetime, timezone, timedelta
import sys
import json
import os
import logging
import time
import re
import schedule
from dotenv import load_dotenv

# ── Load env ──────────────────────────────────────────────
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

SUPABASE_URL    = os.getenv("SUPABASE_URL", os.getenv("VITE_SUPABASE_URL", "https://llgqxzrlcewugufzwyer.supabase.co"))
SUPABASE_KEY    = os.getenv("SUPABASE_SERVICE_KEY", os.getenv("VITE_SUPABASE_ANON_KEY"))

# ── Config ────────────────────────────────────────────────
SOURCE_URL      = "https://arboge.com/harga-ayam-broiler-hari-ini/"
BUYER_MARGIN    = 2500   # Rp/kg
WIB = timezone(timedelta(hours=7))

# ── Logging ───────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S"
)
log = logging.getLogger(__name__)

# ══════════════════════════════════════════════════════════
# PARSING UTILS
# ══════════════════════════════════════════════════════════

def parse_harga(text: str) -> int:
    """Extract standard numeric price from arboge format."""
    text = text.strip().replace(".", "").replace(",", "")
    if "-" in text:
        parts = [int(p.strip()) for p in text.split("-") if p.strip().isdigit()]
        return min(parts) if parts else 0
    return int(text) if text.isdigit() else 0

def normalize_region(name: str) -> str:
    """Standardize region names to match TernakOS system."""
    name_clean = name.strip()
    if "Jawa Tengah" in name_clean: return "Jawa Tengah"
    if "Jawa Timur" in name_clean: return "Jawa Timur"
    if "Jawa Barat" in name_clean: return "Jawa Barat"
    if "Sumatera" in name_clean: return "Sumatera"
    if "Kalimantan" in name_clean: return "Kalimantan"
    if "Sulawesi" in name_clean: return "Sulawesi"
    if "Banten" in name_clean: return "Banten"
    if "Bali" in name_clean: return "Bali"
    if "Lombok" in name_clean or "NTB" in name_clean: return "NTB"
    if "Kupang" in name_clean or "NTT" in name_clean: return "NTT"
    return name_clean

# ══════════════════════════════════════════════════════════
# CORE FETCHER
# ══════════════════════════════════════════════════════════

def fetch_harga_from_arboge() -> list:
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    }

    log.info(f"Fetching Arboge: {SOURCE_URL}")
    response = requests.get(SOURCE_URL, headers=headers, timeout=15)
    response.raise_for_status()

    soup = BeautifulSoup(response.text, "html.parser")
    regions_of_interest = ["Sumatera", "Banten", "Jawa Barat", "Jawa Tengah", "Jawa Timur", "Bali", "NTB", "NTT", "Kalimantan", "Sulawesi", "Jakarta", "Lampung"]
    date_regex = re.compile(r'(\d{1,2})\s+(Januari|Februari|Maret|April|Mei|Juni|Juli|Agustus|September|Oktober|November|Desember)\s+(\d{4})')
    price_regex = re.compile(r'(\d{1,2}\.000)')
    
    months_map = {
        "Januari": "01", "Februari": "02", "Maret": "03", "April": "04", "Mei": "05", "Juni": "06",
        "Juli": "07", "Agustus": "08", "September": "09", "Oktober": "10", "November": "11", "Desember": "12"
    }

    results = []
    
    # We'll iterate through elements to maintain state
    current_source = None
    current_date = None
    
    # We look at all tags that might contain useful info
    for tag in soup.find_all(['strong', 'b', 'h3', 'p', 'span', 'tr', 'li']):
        text = tag.get_text().strip()
        if not text: continue
        
        # 1. Detect Header / Source change
        is_real = "Realisasi" in text and ("Harga" in text or "Ayam" in text)
        is_ref = "Referensi" in text and ("Harga" in text or "Ayam" in text)
        
        # Fallback if the tag is very small (e.g. just <strong>Referensi</strong>)
        if not (is_real or is_ref) and text in ["Referensi", "Realisasi"]:
             is_real = text == "Realisasi"
             is_ref = text == "Referensi"
        
        if is_real or is_ref:
            current_source = "arboge_realisasi" if is_real else "arboge_referensi"
            # Reset date when header changes to ensure we find a fresh one
            current_date = None 
            log.info(f"Section detected: {current_source}")
            continue
            
        # 2. Detect Date (if source is active and date not yet found)
        if current_source and not current_date:
            d_match = date_regex.search(text)
            if d_match:
                d, m, y = d_match.groups()
                current_date = f"{y}-{months_map.get(m)}-{int(d):02d}"
                log.info(f"   Date found for {current_source}: {current_date}")
                continue
                
        # 3. Detect Regional Price (if source and date are locked)
        if current_source and current_date:
            # Check if this tag contains a region of interest
            matched_region = None
            for r in regions_of_interest:
                if r.lower() in text.lower():
                    matched_region = normalize_region(r)
                    break
            
            if matched_region:
                # Find the price in this tag or children
                prices = price_regex.findall(text)
                if not prices:
                    # If it's a table row, the price might be in next cells
                    if tag.name == 'tr':
                        prices = price_regex.findall(tag.get_text())
                
                if prices:
                    valid_prices = [parse_harga(p) for p in prices if 15000 <= parse_harga(p) <= 40000]
                    if valid_prices:
                        min_p = min(valid_prices)
                        # Check if we already have this region for this source/date combo
                        existing = next((x for x in results if x['region'] == matched_region and x['source'] == current_source and x['price_date'] == current_date), None)
                        if not existing:
                            results.append({
                                "price_date":      current_date,
                                "farm_gate_price": min_p,
                                "buyer_price":     min_p + BUYER_MARGIN,
                                "region":          matched_region,
                                "source":          current_source,
                                "source_url":      SOURCE_URL
                            })
                            log.debug(f"      Matched: {matched_region} -> {min_p}")

    return results

# ══════════════════════════════════════════════════════════
# SUPABASE SYNC (Mirroring ternakos_harga_scraper.py)
# ══════════════════════════════════════════════════════════

def get_previous_price(region: str, source: str) -> int:
    url = f"{SUPABASE_URL}/rest/v1/market_prices?region=eq.{region}&source=eq.{source}&order=price_date.desc&limit=1&select=farm_gate_price"
    headers = {"apikey": SUPABASE_KEY, "Authorization": f"Bearer {SUPABASE_KEY}"}
    try:
        res = requests.get(url, headers=headers, timeout=10)
        if res.ok and len(res.json()) > 0:
            return res.json()[0]["farm_gate_price"]
    except: pass
    return 0

def already_exists_today(region: str, date_str: str, source: str) -> bool:
    url = f"{SUPABASE_URL}/rest/v1/market_prices?price_date=eq.{date_str}&region=eq.{region}&source=eq.{source}&select=id&limit=1"
    headers = {"apikey": SUPABASE_KEY, "Authorization": f"Bearer {SUPABASE_KEY}"}
    try:
        res = requests.get(url, headers=headers, timeout=10)
        return res.ok and len(res.json()) > 0
    except: return False

def insert_to_supabase(harga: dict) -> bool:
    prev_price = get_previous_price(harga["region"], harga["source"])
    price_delta = harga["farm_gate_price"] - prev_price if prev_price > 0 else 0

    payload = {
        "price_date":        harga["price_date"],
        "chicken_type":      "broiler",
        "farm_gate_price":   harga["farm_gate_price"],
        "buyer_price":       harga["buyer_price"],
        "price_delta":       price_delta,
        "region":            harga["region"],
        "source":            harga["source"],
        "source_url":        harga["source_url"],
        "transaction_count": 0,
    }

    headers = {
        "apikey":        SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type":  "application/json",
        "Prefer":        "return=minimal",
    }
    
    try:
        res = requests.post(f"{SUPABASE_URL}/rest/v1/market_prices", headers=headers, data=json.dumps(payload), timeout=10)
        res.raise_for_status()
        return True
    except Exception as e:
        log.error(f"Failed to insert {harga['region']}: {e}")
        return False

# ══════════════════════════════════════════════════════════
# MAIN
# ══════════════════════════════════════════════════════════

def main():
    log.info("═" * 55)
    log.info("TernakOS Harga Scraper (ARBOGE) — START")
    
    dry_run = "--dry-run" in sys.argv
    if not dry_run and not SUPABASE_KEY:
        log.error("SUPABASE_SERVICE_KEY missing — abort")
        return

    try:
        results = fetch_harga_from_arboge()
    except Exception as e:
        log.error(f"Fetch failed: {e}")
        return

    if dry_run:
        log.info(f"DRY RUN — Results ({len(results)} regions):")
        print(json.dumps(results, indent=2))
        return

    count_ok = 0
    for harga in results:
        if already_exists_today(harga["region"], harga["price_date"], harga["source"]):
            log.info(f"Data {harga['region']} ({harga['source']}) for {harga['price_date']} already exists — skip")
            continue
        if insert_to_supabase(harga):
            count_ok += 1
            log.info(f"✓ Inserted {harga['region']} ({harga['source']}) for {harga['price_date']}")

    log.info(f"DONE ({count_ok}/{len(results)} updated)")
    log.info("═" * 55)

if __name__ == "__main__":
    if "--daemon" in sys.argv:
        log.info("Memulai mode DAEMON (Arboge)")
        main() # Jalankan sekali saat start
        
        # Jadwalkan setiap 3 jam
        schedule.every(3).hours.do(main)
        
        log.info("Daemon aktif — setiap 3 jam")
        try:
            while True:
                schedule.run_pending()
                time.sleep(60)
        except KeyboardInterrupt:
            log.info("Daemon dihentikan (KeyboardInterrupt)")
    else:
        main()
