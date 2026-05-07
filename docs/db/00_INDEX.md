> Last updated: 2026-05-07 — RLS Hardening Phase 1
> Audit result: 141 tabel terkonfirmasi, 200+ RLS policies, RLS: ✅ ALL ON
> 2026-05-07: Auth mapping bug fixed (deliveries, drivers, sapi_kandangs). 9 tabel di-hardening ke explicit CRUD.
> Security: 8.8/10 | Maintainability: 6.5/10 | Auth Consistency: 7/10

# TernakOS Database Reference

---

## 🤖 INSTRUKSI UNTUK AI (Claude Code, Antigravity, Cursor, dll)

**Folder `docs/db/` ini adalah SINGLE SOURCE OF TRUTH untuk state database TernakOS.**

Sebelum kamu melakukan APAPUN yang berhubungan dengan database — generate query, buat migration, tambah fitur, fix bug, atau modifikasi RLS policy — **WAJIB BACA file-file di folder ini dulu**.

### ❌ YANG DILARANG KERAS (Anti-Pattern)

```
1. JANGAN DROP policy RLS tanpa cek 02_SECURITY_RLS.md dulu.
   → Satu tabel bisa punya 3-11 policy aktif yang saling tergantung.
   → DROP satu policy bisa bikin fitur lain hilang akses data.

2. JANGAN INSERT ke generated columns (lihat daftar di bawah dan 06_HIGH_RISK.md).
   → PostgreSQL akan ERROR. Kolom ini dihitung otomatis.

3. JANGAN CREATE POLICY baru tanpa cek policy yang sudah ada.
   → market_prices sudah punya 10 policy. Jangan tambah lagi.
   → Cek dulu apakah sudah ada policy serupa.

4. JANGAN pakai kolom deprecated (lihat 06_HIGH_RISK.md).
   → broker_connections.peternak_tenant_id DEPRECATED.
   → Pakai requester_tenant_id / target_tenant_id.

5. JANGAN asumsikan struktur tabel — SELALU verifikasi di 01_TABLES.md.
   → Ada 141 tabel. Banyak yang mirip namanya tapi beda struktur.
```

### ✅ YANG WAJIB DILAKUKAN

```
1. BACA 02_SECURITY_RLS.md sebelum modifikasi policy atau tambah fitur baru.
2. BACA 03_FUNCTIONS_TRIGGERS.md sebelum buat trigger/function baru.
3. BACA 06_HIGH_RISK.md untuk tau area berbahaya dan deprecated.
4. CEK dependency map di bawah sebelum ALTER TABLE atau DROP.
5. Kalau buat migration SQL, SELALU pakai IF EXISTS / IF NOT EXISTS.
6. Setelah modifikasi DB, UPDATE docs ini agar tetap sinkron.
```

### 📖 URUTAN BACA YANG DIREKOMENDASIKAN

```
Fitur baru      → 01_TABLES → 02_SECURITY_RLS → 03_FUNCTIONS
Fix RLS/policy  → 02_SECURITY_RLS → 06_HIGH_RISK → 03_FUNCTIONS
Fix bug data    → 01_TABLES → 03_FUNCTIONS → 06_HIGH_RISK
Migration SQL   → 06_HIGH_RISK → 01_TABLES → 02_SECURITY_RLS
```

---

## 📂 Struktur Dokumen

| File | Domain | Isi |
|------|--------|-----|
| [01_TABLES.md](./01_TABLES.md) | 🧠 Data Access Layer | 141 tabel: kolom, tipe, FK, generated columns |
| [02_SECURITY_RLS.md](./02_SECURITY_RLS.md) | 🔐 Core Security | 200+ RLS policies, 5 pattern, anomali & bug |
| [03_FUNCTIONS_TRIGGERS.md](./03_FUNCTIONS_TRIGGERS.md) | ⚙️ Logic & Enforcement | Functions/RPC, Triggers, pg_cron, generated cols |
| [04_AUTH_SYSTEM.md](./04_AUTH_SYSTEM.md) | 🔑 Auth System | Auth flow, JWT, session, invite system |
| [05_STORAGE.md](./05_STORAGE.md) | 📦 Storage | Bucket & storage policies |
| [06_HIGH_RISK.md](./06_HIGH_RISK.md) | ⚠️ High Risk | BUG aktif, SECURITY DEFINER, deprecated, cleanup |

---

## ⚠️ CRITICAL RULES (Entry Point — Baca Ini Dulu)

```
❌ NEVER INSERT generated columns:
   purchases.total_modal
   sales.net_revenue, sales.remaining_amount
   deliveries.shrinkage_kg
   market_prices.broker_margin
   rpa_invoices.net_profit, rpa_invoices.remaining_amount
   rpa_invoice_items.subtotal
   egg_sales.net_profit
   egg_inventory.cost_per_pack
   egg_sale_items.subtotal
   sembako_sales.gross_profit, sembako_sales.net_profit, sembako_sales.remaining_amount
   sembako_stock_batches.total_cost
   sembako_sale_items.subtotal, sembako_sale_items.cogs_total
   sembako_payroll.total_pay
   sapi_kandangs.luas_m2
   [prefix]_breeding_births.total_born_dead
   [prefix]_penggemukan_feed_logs.consumed_kg

❌ NEVER use implicit schema in Functions/Triggers:
   Semua tabel/obyek dalam SQL Function/Trigger WAJIB pakai `public.table_name`.

❌ NEVER use broker_connections.peternak_tenant_id (deprecated kolom)
❌ NEVER use broker_connections.broker_tenant_id (deprecated kolom)
   ⚠️ TAPI kolom ini masih ada di DB dan masih ada RLS policy aktif — lihat 06_HIGH_RISK.md

❌ NEVER insert sembako_deliveries.customer_id (column removed)

✅ broker_connections: pakai requester_tenant_id + target_tenant_id
✅ sembako_payments: pakai reference_number (bukan reference_no)
   ⚠️ KECUALI rpa_payments: kolom-nya memang reference_no (bukan reference_number)
✅ market_listings view_count: pakai RPC, bukan .update() langsung
✅ sembako_employees status: pakai kolom status ('aktif'|'nonaktif'), BUKAN is_active
✅ Semua payment tables punya is_deleted — filter .eq('is_deleted', false) saat read
✅ worker_payments PUNYA is_deleted — filter saat read (docs lama salah)
✅ kambing_perah_* (21 tabel) SUDAH ADA & AKTIF — docs lama salah catat sebagai belum ada
```

---

## 🗺️ DEPENDENCY MAP (Urutan Insert)

```
auth.users
  └── tenants
        ├── profiles       (tenant_id, auth_user_id)
        ├── tenant_memberships (auth_user_id, tenant_id, role)  ← NEW
        ├── team_invitations (tenant_id, invited_by)
        ├── subscription_invoices (tenant_id)
        ├── notifications (tenant_id)
        ├── ai_conversations (tenant_id, profile_id)
        │     └── ai_pending_entries (conversation_id)
        │           └── ai_staged_transactions (pending_entry_id)
        │                 └── ai_anomaly_logs (staged_transaction_id)
        ├── ai_error_logs (tenant_id nullable, profile_id)       ← NEW
        ├── ai_feedback (pending_entry_id, tenant_id, profile_id) ← NEW
        │
        ├── 🏢 ROLE: BROKER
        │     ├── [BROKER AYAM VERTICAL]
        │     │     ├── farms           (tenant_id)
        │     │     │     ├── purchases (tenant_id, farm_id)
        │     │     │     │     └── sales (tenant_id, purchase_id, rpa_id)
        │     │     │     │           ├── deliveries (tenant_id, sale_id)
        │     │     │     │           │     └── loss_reports (delivery_id)
        │     │     │     │           ├── payments (tenant_id, sale_id)
        │     │     │     │           └── loss_reports (sale_id)
        │     │     │     └── chicken_batches (tenant_id, farm_id)
        │     │     │           └── orders (matched_batch_id)
        │     │     ├── vehicles        (tenant_id)
        │     │     │     └── vehicle_expenses (vehicle_id)
        │     │     └── drivers         (tenant_id)
        │     ├── [RPA CROSS-TENANT]
        │     │     ├── rpa_payments (rpa_tenant_id, broker_tenant_id) ← NEW
        │     │     └── rpa_purchase_orders (rpa_tenant_id, broker_tenant_id) ← NEW
        │     ├── [SEMBAKO VERTICAL]
        │     │     ├── sembako_suppliers (tenant_id)
        │     │     ├── sembako_customers (tenant_id)
        │     │     ├── sembako_employees (tenant_id)
        │     │     │     ├── sembako_payroll (employee_id)
        │     │     │     └── sembako_deliveries (employee_id, sale_id)
        │     │     └── sembako_products (tenant_id)
        │     │           └── sembako_stock_batches (product_id, supplier_id)
        │     │                 └── sembako_sales (customer_id)
        │     │                       ├── sembako_sale_items (sale_id, product_id)
        │     │                       │     └── sembako_stock_out (batch_id, sale_id)
        │     │                       └── sembako_payments (sale_id, customer_id)
        │     └── [EGG BROKER VERTICAL]
        │           ├── egg_suppliers   (tenant_id)
        │           ├── egg_customers   (tenant_id)
        │           └── egg_inventory   (tenant_id)
        │                 └── egg_stock_logs (inventory_id, supplier_id, sale_id)
        │                       └── egg_sales (customer_id)
        │
        ├── 🚜 ROLE: PETERNAK
        │     ├── [SAPI VERTICAL]
        │     │     ├── sapi_penggemukan_batches (tenant_id)
        │     │     │     ├── sapi_penggemukan_feed_logs (batch_id)
        │     │     │     ├── sapi_penggemukan_operational_costs (batch_id)
        │     │     │     └── sapi_kandangs (batch_id)
        │     │     ├── sapi_penggemukan_animals (batch_id, kandang_id)
        │     │     │     ├── sapi_penggemukan_weight_records (animal_id)
        │     │     │     ├── sapi_penggemukan_health_logs (animal_id)
        │     │     │     └── sapi_penggemukan_sales (animal_id)
        │     │     ├── sapi_breeding_animals (tenant_id)
        │     │     │     ├── sapi_breeding_mating_records (dam_id, sire_id)
        │     │     │     │     └── sapi_breeding_births (mating_id, dam_id)
        │     │     │     ├── sapi_breeding_weight_records (animal_id)
        │     │     │     ├── sapi_breeding_health_logs (animal_id)
        │     │     │     └── sapi_breeding_sales (animal_id)
        │     │     └── sapi_breeding_feed_logs (tenant_id)
        │     ├── [DOMBA VERTICAL]
        │     │     ├── domba_penggemukan_batches (tenant_id)
        │     │     │     ├── domba_penggemukan_feed_logs (batch_id)
        │     │     │     └── domba_penggemukan_operational_costs (batch_id)
        │     │     ├── domba_kandangs (tenant_id, batch_id)
        │     │     ├── domba_penggemukan_animals (batch_id, kandang_id)
        │     │     │     ├── domba_penggemukan_weight_records (animal_id)
        │     │     │     ├── domba_penggemukan_health_logs (animal_id)
        │     │     │     └── domba_penggemukan_sales (animal_id)
        │     │     └── domba_breeding_animals (tenant_id)
        │     │           ├── domba_breeding_mating_records (dam_id, sire_id)
        │     │           │     └── domba_breeding_births (mating_id)
        │     │           ├── domba_breeding_weight_records (animal_id)
        │     │           ├── domba_breeding_health_logs (animal_id)
        │     │           ├── domba_breeding_feed_logs (tenant_id)  ← NEW
        │     │           └── domba_breeding_sales (animal_id)
        │     ├── [KAMBING VERTICAL]
        │     │     ├── kambing_penggemukan_batches (tenant_id)
        │     │     │     ├── kambing_penggemukan_feed_logs (batch_id)
        │     │     │     └── kambing_penggemukan_operational_costs (batch_id)
        │     │     ├── kambing_kandangs (tenant_id, batch_id)
        │     │     ├── kambing_penggemukan_animals (batch_id, kandang_id)
        │     │     │     ├── kambing_penggemukan_weight_records (animal_id)
        │     │     │     ├── kambing_penggemukan_health_logs (animal_id)
        │     │     │     └── kambing_penggemukan_sales (animal_id)
        │     │     └── kambing_breeding_animals (tenant_id)
        │     │           ├── kambing_breeding_mating_records (dam_id, sire_id)
        │     │           │     └── kambing_breeding_births (mating_id)
        │     │           ├── kambing_breeding_weight_records (animal_id)
        │     │           ├── kambing_breeding_health_logs (animal_id)
        │     │           └── kambing_breeding_sales (animal_id)
        │     ├── [KAMBING PERAH VERTICAL] ← BARU TERDOKUMENTASI (21 tabel)
        │     │     ├── kambing_perah_kandangs (tenant_id)
        │     │     ├── kambing_perah_animal_groups (tenant_id)
        │     │     ├── kambing_perah_feed_formulations (tenant_id)
        │     │     ├── kambing_perah_inventory_items (tenant_id)
        │     │     │     └── kambing_perah_inventory_transactions (item_id)
        │     │     ├── kambing_perah_customer_registry (tenant_id)
        │     │     │     └── kambing_perah_milk_sales (customer_id)
        │     │     ├── kambing_perah_breeding_animals (tenant_id, group_id, kandang_id)
        │     │     │     ├── kambing_perah_breeding_mating_records (dam_id, sire_id)
        │     │     │     │     └── kambing_perah_breeding_births (dam_id, mating_id)
        │     │     │     ├── kambing_perah_breeding_weight_records (animal_id)
        │     │     │     ├── kambing_perah_breeding_health_logs (animal_id)
        │     │     │     └── kambing_perah_lactation_cycles (animal_id)
        │     │     │           ├── kambing_perah_milk_logs (animal_id, lactation_id)
        │     │     │           └── kambing_perah_milk_quality_logs (animal_id, lactation_id)
        │     │     ├── kambing_perah_breeding_feed_logs (tenant_id, group_id, formulation_id)
        │     │     └── [PENGGEMUKAN JANTAN/AFKIR]
        │     │           ├── kambing_perah_penggemukan_batches (tenant_id)
        │     │           │     ├── kambing_perah_penggemukan_animals (batch_id)
        │     │           │     │     ├── kambing_perah_penggemukan_weight_records (animal_id)
        │     │           │     │     └── kambing_perah_penggemukan_health_logs (animal_id)
        │     │           │     ├── kambing_perah_penggemukan_feed_logs (batch_id)
        │     │           │     └── kambing_perah_penggemukan_sales (batch_id)
        │     ├── [AYAM PETERNAK VERTICAL]
        │     │     ├── peternak_farms (tenant_id)
        │     │     │     └── breeding_cycles (farm_id)
        │     │     │           ├── daily_records (cycle_id)
        │     │     │           ├── cycle_expenses (cycle_id)
        │     │     │           ├── harvest_records (cycle_id)
        │     │     │           ├── vaccination_records (cycle_id) ← SUDAH ADA
        │     │     │           └── worker_payments (cycle_id, worker_id)
        │     │     └── feed_stocks (tenant_id, peternak_farm_id)
        │     └── [TASK SYSTEM]
        │           ├── kandang_workers (tenant_id, peternak_farm_id)
        │           │     └── kandang_worker_payments (worker_id) ← NEW
        │           ├── peternak_task_templates (tenant_id)
        │           └── peternak_task_instances (template_id)
        │
        └── 🏭 ROLE: RPA
              ├── rpa_clients (tenant_id)
              ├── rpa_customers (tenant_id)
              │     └── rpa_invoices (tenant_id, rpa_id)
              │           ├── rpa_invoice_items (invoice_id)
              │           └── rpa_customer_payments (tenant_id, customer_id)
              └── rpa_products (tenant_id)
```

---

## ⚠️ DB AUDIT NOTES (2026-05-06 — v3 Final)

```
✅ kambing_perah_* (21 tabel) — SUDAH ADA di Supabase (sebelumnya salah dicatat sebagai "belum ada")
✅ vaccination_records — SUDAH ADA (cycle_id FK → breeding_cycles)
✅ domba_breeding_feed_logs — SUDAH ADA (hijauan/konsentrat/dedak per hari)
✅ domba/sapi/kambing_penggemukan_operational_costs ada (3 tabel terpisah)
✅ tenants.plan_expires_at (timestamptz, nullable)
✅ market_prices.price_delta (integer, nullable)
✅ worker_payments.is_deleted ADA — filter saat read (docs lama SALAH)
✅ market_prices.source ada — dipakai RLS scraper policy

🆕 Tabel baru terkonfirmasi (belum ada di docs lama):
   - tenant_memberships (auth_user_id, tenant_id, role, full_name)
   - ai_error_logs (tenant_id nullable, profile_id, error_msg, provider)
   - ai_feedback (pending_entry_id, rating, correction_notes, corrected_data jsonb)
   - rpa_customers (customer_name, credit_limit, total_outstanding, reliability_score)
   - rpa_payments (rpa_tenant_id, broker_tenant_id — cross-tenant)
   - rpa_purchase_orders (rpa_tenant_id, broker_tenant_id, status: open/matched/completed)
   - kandang_worker_payments (worker_id, payment_type, amount, is_deleted)

🗑️ Tabel kd_* (14 tabel) — DEPRECATED, sudah di-DROP via sync SQL ✅

⚠️ HIGH RISK — broker_connections:
   Kolom deprecated peternak_tenant_id & broker_tenant_id MASIH ADA
   DAN masih ada 3 RLS policy aktif yang pakai kolom itu:
   connections_insert, connections_select, connections_update
   → Cleanup via: supabase/20260506_risk4_final.sql

⚠️ HIGH RISK — market_prices:
   Ada 8+ overlapping RLS policies, termasuk hardcoded email
   'fahruhernansakti@gmail.com' dalam policy "Allow admins to manage market prices"
   → Lihat 06_HIGH_RISK.md untuk detail

✅ RESOLVED 2026-05-07:
   - Auth mapping bug profiles.id=auth.uid() → fixed di deliveries, drivers, sapi_kandangs
   - 9 tabel hardened ke explicit CRUD: farms, generated_invoices, ai_conversations,
     cycle_expenses, feed_stocks, daily_records, extra_expenses, harvest_records, ai_pending_entries
   - ai_pending_entries UPDATE hidden bug fixed (auth.uid() vs profile_id mismatch)

⚠️ STILL PENDING:
   - kandang_workers: kemungkinan masih punya auth mapping bug — verify dulu
   - ai_staged_transactions, ai_feedback: masih hybrid pattern
   - market_prices: 2 BYPASS policy masih ada
   - broker_connections: deprecated columns + policy overlap

⚠️ RLS DUPLIKAT — broker_connections:
   Ada policy lama (connections_*) dan policy baru (Tenant can *) yang overlap
   Policy lama pakai deprecated columns → harus di-drop setelah kolom cleanup
```
