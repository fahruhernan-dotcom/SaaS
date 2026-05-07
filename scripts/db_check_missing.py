"""
db_check_missing.py - Quick check tabel operational_costs & kambing_perah
"""
import urllib.request
import urllib.parse
import json
import ssl

SUPABASE_URL = "https://llgqxzrlcewugufzwyer.supabase.co"
ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxsZ3F4enJsY2V3dWd1Znp3eWVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM1MTM3ODAsImV4cCI6MjA4OTA4OTc4MH0.O3vb0nYXjBFlxlLUJEmqoIWG-V0HZrgNDS0GIq27CnQ"

TABLES_TO_CHECK = [
    # Operational costs - 3 tabel terpisah
    "domba_penggemukan_operational_costs",
    "sapi_penggemukan_operational_costs",
    "kambing_penggemukan_operational_costs",
    # vaccination_records
    "vaccination_records",
    # health_treatment_costs - kolom di health_logs, bukan tabel sendiri
    # Cek kolom di health logs (ambil 1 baris tiap tabel)
    "domba_penggemukan_health_logs",
    "sapi_penggemukan_health_logs",
    "kambing_penggemukan_health_logs",
    # kambing perah - belum ada?
    "kambing_perah_animals",
    "kambing_perah_milk_records",
]

def check(table):
    url = f"{SUPABASE_URL}/rest/v1/{table}?limit=1"
    req = urllib.request.Request(url)
    req.add_header("apikey", ANON_KEY)
    req.add_header("Authorization", f"Bearer {ANON_KEY}")
    req.add_header("Content-Type", "application/json")
    ctx = ssl.create_default_context()
    try:
        with urllib.request.urlopen(req, context=ctx, timeout=10) as resp:
            data = json.loads(resp.read().decode())
            if isinstance(data, list) and len(data) > 0:
                return "EXISTS", list(data[0].keys())
            return "EXISTS (empty)", []
    except urllib.error.HTTPError as e:
        body = e.read().decode()
        if "does not exist" in body.lower() or e.code == 404:
            return "NOT FOUND", []
        if e.code in (401, 403, 406):
            return f"EXISTS (RLS {e.code})", []
        return f"ERROR {e.code}", []
    except Exception as ex:
        return f"ERROR: {ex}", []

print("=" * 70)
print("QUICK CHECK - Missing Tables from Audit")
print("=" * 70)

for t in TABLES_TO_CHECK:
    status, cols = check(t)
    if cols:
        print(f"  {status:<25} {t}")
        print(f"    Columns: {', '.join(cols)}")
    else:
        print(f"  {status:<25} {t}")

print("=" * 70)
