# -*- coding: utf-8 -*-
"""
db_audit.py - Supabase Schema Auditor
======================================
Mengambil skema aktual dari Supabase menggunakan service_role key
lalu menghasilkan laporan tabel/kolom yang ada di DB tapi tidak di docs,
dan sebaliknya.

Cara pakai:
  python scripts/db_audit.py

Output:
  scripts/db_audit_report.md   — Laporan perbedaan skema
  DATABASE_STRUCTURE.md        — Diperbarui dengan skema terbaru
"""

import os
import json
import urllib.request
import urllib.parse
import ssl
import re
from datetime import datetime

# ── Config ──────────────────────────────────────────────────────────────────
SUPABASE_URL = "https://llgqxzrlcewugufzwyer.supabase.co"
# Gunakan anon key (read-only, hanya bisa akses tabel yang di-allow)
# Untuk full schema introspection, butuh service_role key atau pg_catalog access
ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxsZ3F4enJsY2V3dWd1Znp3eWVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM1MTM3ODAsImV4cCI6MjA4OTA4OTc4MH0.O3vb0nYXjBFlxlLUJEmqoIWG-V0HZrgNDS0GIq27CnQ"

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_DIR = os.path.dirname(SCRIPT_DIR)
DB_STRUCTURE_PATH = os.path.join(PROJECT_DIR, "docs", "db", "01_TABLES.md")
REPORT_PATH = os.path.join(SCRIPT_DIR, "db_audit_report.md")

# ── Daftar tabel yang kita expect ada di public schema ───────────────────────
# (diparsing dari docs/db/01_TABLES.md)
KNOWN_TABLES_FROM_DOCS = [
    # Auth / Core
    "tenants", "profiles", "team_invitations", "notifications",
    "subscription_invoices", "pricing_plans", "discount_codes",
    "plan_configs", "payment_settings", "global_audit_logs",
    "generated_invoices",
    # Poultry Broker
    "farms", "purchases", "sales", "deliveries", "loss_reports",
    "payments", "extra_expenses", "vehicles", "drivers",
    "vehicle_expenses", "rpa_clients", "chicken_batches", "orders",
    "market_prices",
    # Peternak
    "peternak_farms", "breeding_cycles", "daily_records",
    "cycle_expenses", "harvest_records", "kandang_workers",
    "worker_payments", "feed_stocks",
    # Marketplace
    "market_listings", "broker_connections", "stock_listings",
    # Egg Broker
    "egg_suppliers", "egg_customers", "egg_inventory",
    "egg_sales", "egg_sale_items", "egg_stock_logs",
    # Sembako Broker
    "sembako_products", "sembako_suppliers", "sembako_customers",
    "sembako_stock_batches", "sembako_stock_out", "sembako_sales",
    "sembako_sale_items", "sembako_payments", "sembako_employees",
    "sembako_payroll", "sembako_deliveries", "sembako_expenses",
    "sembako_supplier_payments",
    # Sapi
    "sapi_penggemukan_batches", "sapi_penggemukan_animals",
    "sapi_penggemukan_feed_logs", "sapi_penggemukan_weight_records",
    "sapi_penggemukan_health_logs", "sapi_penggemukan_sales",
    "sapi_kandangs",
    "sapi_breeding_animals", "sapi_breeding_mating_records",
    "sapi_breeding_births", "sapi_breeding_weight_records",
    "sapi_breeding_health_logs", "sapi_breeding_sales",
    "sapi_breeding_feed_logs",
    # Domba
    "domba_penggemukan_batches", "domba_penggemukan_animals",
    "domba_penggemukan_feed_logs", "domba_penggemukan_weight_records",
    "domba_penggemukan_health_logs", "domba_penggemukan_sales",
    "domba_kandangs",
    "domba_breeding_animals", "domba_breeding_mating_records",
    "domba_breeding_births", "domba_breeding_weight_records",
    "domba_breeding_health_logs", "domba_breeding_sales",
    # Kambing
    "kambing_penggemukan_batches", "kambing_penggemukan_animals",
    "kambing_penggemukan_feed_logs", "kambing_penggemukan_weight_records",
    "kambing_penggemukan_health_logs", "kambing_penggemukan_sales",
    "kambing_kandangs",
    "kambing_breeding_animals", "kambing_breeding_mating_records",
    "kambing_breeding_births", "kambing_breeding_weight_records",
    "kambing_breeding_health_logs", "kambing_breeding_sales",
    # Kambing Perah
    "kambing_perah_animals", "kambing_perah_milk_records",
    "kambing_perah_health_logs", "kambing_perah_weight_records",
    "kambing_perah_mating_records", "kambing_perah_births",
    "kambing_perah_sales",
    # Task System
    "peternak_task_templates", "peternak_task_instances",
    # AI
    "ai_conversations", "ai_pending_entries", "ai_staged_transactions",
    "ai_anomaly_logs", "ai_error_logs",
    # RPA / Market B2B
    "rpa_profiles", "rpa_purchase_orders", "rpa_payments",
    "rpa_invoices", "rpa_invoice_items", "rpa_customer_payments",
    # Operational
    "operational_costs",
    # Kandang multi-level
    "kd_kandangs", "kd_penggemukan_batches", "kd_penggemukan_animals",
    "kd_penggemukan_feed_logs", "kd_penggemukan_weight_records",
    "kd_penggemukan_health_logs", "kd_penggemukan_sales",
    "kd_breeding_animals", "kd_breeding_mating_records",
    "kd_breeding_births", "kd_breeding_weight_records",
    "kd_breeding_health_logs", "kd_breeding_sales", "kd_breeding_feed_logs",
    # Vaccination
    "vaccination_records",
]


def supabase_request(path, params=None):
    """Kirim GET request ke Supabase REST API."""
    url = f"{SUPABASE_URL}/rest/v1/{path}"
    if params:
        url += "?" + urllib.parse.urlencode(params)
    
    req = urllib.request.Request(url)
    req.add_header("apikey", ANON_KEY)
    req.add_header("Authorization", f"Bearer {ANON_KEY}")
    req.add_header("Content-Type", "application/json")
    req.add_header("Prefer", "count=exact")
    
    ctx = ssl.create_default_context()
    try:
        with urllib.request.urlopen(req, context=ctx, timeout=15) as resp:
            data = json.loads(resp.read().decode())
            return data, None
    except urllib.error.HTTPError as e:
        body = e.read().decode()
        return None, f"HTTP {e.code}: {body}"
    except Exception as e:
        return None, str(e)


def get_columns_via_api(table_name):
    """
    Ambil kolom dari sebuah tabel via Supabase REST API.
    Menggunakan HEAD request dengan limit=0 untuk dapat column info dari header.
    Alternatif: ambil 1 baris dan inspect key names.
    """
    url = f"{SUPABASE_URL}/rest/v1/{table_name}"
    params = "select=*&limit=1"
    
    req = urllib.request.Request(f"{url}?{params}")
    req.add_header("apikey", ANON_KEY)
    req.add_header("Authorization", f"Bearer {ANON_KEY}")
    req.add_header("Content-Type", "application/json")
    
    ctx = ssl.create_default_context()
    try:
        with urllib.request.urlopen(req, context=ctx, timeout=15) as resp:
            data = json.loads(resp.read().decode())
            if isinstance(data, list) and len(data) > 0:
                return list(data[0].keys()), "has_data"
            elif isinstance(data, list) and len(data) == 0:
                return [], "empty_table"
            return None, "unexpected_response"
    except urllib.error.HTTPError as e:
        body = e.read().decode()
        if e.code == 401:
            return None, "unauthorized"
        elif e.code == 404:
            return None, "not_found"
        elif e.code == 406:
            return None, "rls_blocked"
        return None, f"HTTP {e.code}: {body[:100]}"
    except Exception as e:
        return None, str(e)


def get_schema_via_introspection():
    """
    Gunakan Supabase RPC atau pg_catalog untuk introspect schema.
    Mencoba beberapa endpoint yang mungkin accessible.
    """
    print("  [INFO] Mencoba introspeksi via pg_catalog...")
    
    # Coba via RPC get_table_list jika ada
    url = f"{SUPABASE_URL}/rest/v1/rpc/get_schema_info"
    req = urllib.request.Request(url, data=b'{}', method='POST')
    req.add_header("apikey", ANON_KEY)
    req.add_header("Authorization", f"Bearer {ANON_KEY}")
    req.add_header("Content-Type", "application/json")
    
    ctx = ssl.create_default_context()
    try:
        with urllib.request.urlopen(req, context=ctx, timeout=10) as resp:
            return json.loads(resp.read().decode())
    except:
        pass
    
    return None


def check_table_exists(table_name):
    """Cek apakah tabel ada dan accessible di Supabase."""
    url = f"{SUPABASE_URL}/rest/v1/{table_name}"
    
    req = urllib.request.Request(f"{url}?limit=0")
    req.add_header("apikey", ANON_KEY)
    req.add_header("Authorization", f"Bearer {ANON_KEY}")
    req.add_header("Content-Type", "application/json")
    req.add_header("Range", "0-0")
    
    ctx = ssl.create_default_context()
    try:
        with urllib.request.urlopen(req, context=ctx, timeout=10) as resp:
            resp.read()
            return "exists", resp.headers.get("Content-Range", "")
    except urllib.error.HTTPError as e:
        body = e.read().decode()
        if e.code == 404:
            return "not_found", ""
        elif e.code in (401, 403):
            return "unauthorized", ""
        elif e.code == 406:
            # 406 = RLS blocked but table exists
            return "rls_blocked", ""
        elif "does not exist" in body.lower():
            return "not_found", ""
        return "error", f"{e.code}"
    except Exception as e:
        return "error", str(e)


def audit_all_tables():
    """Audit semua tabel yang diharapkan ada."""
    results = {
        "exists": [],
        "not_found": [],
        "rls_blocked": [],  # Table ada tapi RLS prevent akses
        "error": [],
        "columns": {}
    }
    
    total = len(KNOWN_TABLES_FROM_DOCS)
    for i, table in enumerate(KNOWN_TABLES_FROM_DOCS, 1):
        print(f"  [{i:3}/{total}] Checking: {table:<50}", end="", flush=True)
        status, info = check_table_exists(table)
        
        if status == "exists":
            results["exists"].append(table)
            # Coba ambil kolom
            cols, col_status = get_columns_via_api(table)
            if cols is not None and len(cols) > 0:
                results["columns"][table] = cols
                print(f"[OK] ({len(cols)} cols)")
            elif col_status == "empty_table":
                results["columns"][table] = []
                print(f"[OK] (empty)")
            else:
                print(f"[OK] (cols: {col_status})")
        elif status == "rls_blocked":
            results["rls_blocked"].append(table)
            print(f"[RLS] (RLS blocked)")
        elif status == "not_found":
            results["not_found"].append(table)
            print(f"[MISS] NOT FOUND")
        else:
            results["error"].append((table, info))
            print(f"[ERR] {info}")
    
    return results


def check_new_tables_in_supabase():
    """
    Cek tabel baru yang mungkin ada di Supabase tapi belum di docs.
    Kita check beberapa pattern nama yang mungkin.
    """
    # Coba beberapa tabel yang mungkin baru dibuat
    potential_new = [
        # Potential new tables berdasarkan migrations terbaru
        "health_treatment_costs",
        "operational_costs",
        "sembako_return_items",
        "sembako_returns",
        "sembako_purchase_orders",
        "sembako_purchase_order_items",
        "sembako_gudang_locations",
        "sembako_stock_transfers",
        "subscription_plans",
        "plan_features",
        "user_sessions",
        "app_settings",
        "admin_logs",
        "pricing_configs",
        "ternak_limits",
        "kandang_tenant_limits",
        # Task system
        "task_assignments",
        "task_logs",
        # Payment
        "payment_proofs",
        "xendit_webhooks",
    ]
    
    found_new = []
    print("\n  Checking potential new tables...")
    for table in potential_new:
        status, _ = check_table_exists(table)
        if status in ("exists", "rls_blocked"):
            found_new.append((table, status))
            print(f"  [NEW] {table} -- {status}")
    
    return found_new


def parse_docs_tables():
    """Parse tabel-tabel yang disebutkan dalam DATABASE_STRUCTURE.md."""
    with open(DB_STRUCTURE_PATH, "r", encoding="utf-8") as f:
        content = f.read()
    
    # Extract table names dari heading ### `table_name`
    pattern = r"###\s+`([a-z_]+)`"
    tables = re.findall(pattern, content)
    return list(dict.fromkeys(tables))  # deduplicate, preserve order


def generate_report(results, new_tables, docs_tables, start_time):
    """Generate laporan audit."""
    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    duration = (datetime.now() - start_time).total_seconds()
    
    lines = []
    lines.append(f"# 🗄️ Database Audit Report")
    lines.append(f"")
    lines.append(f"> Generated: {now} WIB  ")
    lines.append(f"> Duration: {duration:.1f}s  ")
    lines.append(f"> Supabase Project: `llgqxzrlcewugufzwyer`  ")
    lines.append(f"")
    lines.append(f"---")
    lines.append(f"")
    
    # Summary
    total_checked = len(KNOWN_TABLES_FROM_DOCS)
    total_ok = len(results["exists"]) + len(results["rls_blocked"])
    lines.append(f"## 📊 Summary")
    lines.append(f"")
    lines.append(f"| Status | Count |")
    lines.append(f"|--------|-------|")
    lines.append(f"| ✅ Tabel ditemukan (ada data/kolom) | {len(results['exists'])} |")
    lines.append(f"| 🔒 Tabel ada (RLS blocked) | {len(results['rls_blocked'])} |")
    lines.append(f"| ❌ Tidak ditemukan di DB | {len(results['not_found'])} |")
    lines.append(f"| ⚠️ Error saat check | {len(results['error'])} |")
    lines.append(f"| 🆕 Tabel baru (belum di docs) | {len(new_tables)} |")
    lines.append(f"| **Total dicek** | **{total_checked}** |")
    lines.append(f"")
    lines.append(f"---")
    lines.append(f"")
    
    # Tables NOT FOUND
    if results["not_found"]:
        lines.append(f"## ❌ Tabel Tidak Ditemukan di Supabase")
        lines.append(f"> Tabel ini ada di dokumentasi lokal tapi **tidak ditemukan** di database Supabase.")
        lines.append(f"> Kemungkinan: belum di-migrate, sudah dihapus, atau nama berbeda.")
        lines.append(f"")
        for t in sorted(results["not_found"]):
            lines.append(f"- `{t}`")
        lines.append(f"")
        lines.append(f"---")
        lines.append(f"")
    
    # NEW TABLES found in Supabase
    if new_tables:
        lines.append(f"## 🆕 Tabel Baru di Supabase (Belum di Docs)")
        lines.append(f"> Tabel ini **ada di Supabase** tapi belum terdokumentasi di `DATABASE_STRUCTURE.md`.")
        lines.append(f"> Perlu ditambahkan ke dokumentasi.")
        lines.append(f"")
        for t, status in new_tables:
            lines.append(f"- `{t}` ({status})")
        lines.append(f"")
        lines.append(f"---")
        lines.append(f"")
    
    # Columns found
    if results["columns"]:
        lines.append(f"## 📋 Kolom Aktual per Tabel")
        lines.append(f"> Kolom yang berhasil diintrospeksi dari data aktual (tabel dengan data).")
        lines.append(f"> Tabel kosong atau RLS-blocked tidak bisa diintrospeksi kolomnya.")
        lines.append(f"")
        for table in sorted(results["columns"].keys()):
            cols = results["columns"][table]
            if cols:
                lines.append(f"### `{table}`")
                lines.append(f"Kolom aktual: `{'`, `'.join(cols)}`")
                lines.append(f"")
    
    # RLS blocked (exists but can't read)
    if results["rls_blocked"]:
        lines.append(f"## 🔒 Tabel Ada tapi RLS Blocked")
        lines.append(f"> Tabel ini **ada** di Supabase tapi anon key tidak bisa membacanya.")
        lines.append(f"> Ini **normal** untuk tabel sensitif. Keberadaannya sudah dikonfirmasi.")
        lines.append(f"")
        for t in sorted(results["rls_blocked"]):
            lines.append(f"- `{t}`")
        lines.append(f"")
    
    # Full list of confirmed tables
    lines.append(f"---")
    lines.append(f"")
    lines.append(f"## ✅ Tabel Terkonfirmasi Ada di Supabase")
    lines.append(f"")
    all_confirmed = sorted(results["exists"] + results["rls_blocked"])
    lines.append(f"**Total: {len(all_confirmed)} tabel**")
    lines.append(f"")
    for t in all_confirmed:
        lines.append(f"- `{t}`")
    
    return "\n".join(lines)


def update_database_structure_header(results, new_tables):
    """Update header DATABASE_STRUCTURE.md dengan timestamp audit terbaru."""
    with open(DB_STRUCTURE_PATH, "r", encoding="utf-8") as f:
        content = f.read()
    
    today = datetime.now().strftime("%Y-%m-%d")
    confirmed = len(results["exists"]) + len(results["rls_blocked"])
    missing = len(results["not_found"])
    new = len(new_tables)
    
    new_header = f"> Last updated: {today} — DB Audit Sync\n"
    new_header += f"> Audit result: {confirmed} tabel terkonfirmasi, {missing} tidak ditemukan, {new} tabel baru\n"
    new_header += f"> Previous: " 
    
    # Ambil baris pertama yang ada
    first_line = content.split('\n')[0]
    new_header += first_line.replace('> ', '') + "\n"
    
    # Replace baris pertama
    lines = content.split('\n')
    if lines[0].startswith('>'):
        lines[0] = new_header.rstrip('\n')
        content = '\n'.join(lines)
    else:
        content = new_header + content
    
    with open(DB_STRUCTURE_PATH, "w", encoding="utf-8") as f:
        f.write(content)
    
    print(f"\n[OK] DATABASE_STRUCTURE.md header diperbarui")


def main():
    start_time = datetime.now()
    print("=" * 70)
    print("[DB AUDIT] SUPABASE DATABASE SCHEMA AUDIT")
    print(f"   Project: {SUPABASE_URL}")
    print(f"   Time: {start_time.strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 70)
    
    # Parse tabel dari docs
    print("\n[READ] Parsing DATABASE_STRUCTURE.md...")
    docs_tables = parse_docs_tables()
    print(f"   Ditemukan {len(docs_tables)} tabel di dokumentasi")
    
    # Audit semua tabel known
    print(f"\n[CHECK] Mengaudit {len(KNOWN_TABLES_FROM_DOCS)} tabel yang diharapkan...")
    print("-" * 70)
    results = audit_all_tables()
    
    # Check tabel baru
    new_tables = check_new_tables_in_supabase()
    
    # Generate report
    print("\n[WRITE] Membuat laporan...")
    report = generate_report(results, new_tables, docs_tables, start_time)
    
    with open(REPORT_PATH, "w", encoding="utf-8") as f:
        f.write(report)
    print(f"   Laporan disimpan: {REPORT_PATH}")
    
    # Update DATABASE_STRUCTURE.md header
    update_database_structure_header(results, new_tables)
    
    # Summary
    print("\n" + "=" * 70)
    print("HASIL AUDIT:")
    print(f"   [OK] Tabel ditemukan    : {len(results['exists'])}")
    print(f"   [RLS] RLS blocked        : {len(results['rls_blocked'])}")
    print(f"   [MISS] Tidak ditemukan   : {len(results['not_found'])}")
    print(f"   [NEW] Tabel baru di DB   : {len(new_tables)}")
    
    if results["not_found"]:
        print(f"\n[WARN] Tabel TIDAK DITEMUKAN di Supabase:")
        for t in results["not_found"]:
            print(f"   - {t}")
    
    if new_tables:
        print(f"\n[NEW] Tabel BARU di Supabase (belum di docs):")
        for t, s in new_tables:
            print(f"   - {t} ({s})")
    
    print(f"\n[DONE] Selesai! Lihat laporan lengkap di:")
    print(f"   {REPORT_PATH}")
    print("=" * 70)


if __name__ == "__main__":
    main()
