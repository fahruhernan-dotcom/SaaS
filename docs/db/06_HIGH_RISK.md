> File ini bagian dari docs/db/ split. Lihat 00_INDEX.md untuk navigasi lengkap.
> Last updated: 2026-05-07 — RLS Hardening Phase 1
>
> 🤖 **AI: Baca file ini SEBELUM menyentuh tabel yang ada di sini.**
> Ada BUG aktif, kolom deprecated, dan generated columns yang DILARANG di-INSERT.

# ⚠️ 06 — High Risk & Deprecated Objects

Dokumen ini mendata area berisiko tinggi di database, bypass RLS, serta kolom/tabel usang yang sedang dalam proses deprecation atau cleanup. **Baca ini sebelum modifikasi modul terkait.**

---

## 🚫 GENERATED COLUMNS (DILARANG INSERT)

Kolom ini dikalkulasi PostgreSQL (`GENERATED ALWAYS AS ... STORED`). INSERT/UPDATE manual → **error**.

| Tabel | Kolom Generated |
|-------|----------------|
| `purchases` | `total_modal` |
| `sales` | `net_revenue`, `remaining_amount` |
| `deliveries` | `shrinkage_kg` |
| `market_prices` | `broker_margin` |
| `rpa_invoices` | `net_profit`, `remaining_amount` |
| `rpa_invoice_items` | `subtotal` |
| `egg_sales` | `net_profit` |
| `egg_inventory` | `cost_per_pack` |
| `egg_sale_items` | `subtotal` |
| `sembako_sales` | `gross_profit`, `net_profit`, `remaining_amount` |
| `sembako_stock_batches` | `total_cost` |
| `sembako_sale_items` | `subtotal`, `cogs_total` |
| `sembako_payroll` | `total_pay` |
| `sapi_kandangs` | `luas_m2` |
| `[prefix]_breeding_births` | `total_born_dead` |
| `[prefix]_penggemukan_feed_logs` | `consumed_kg` |

---

## 🛑 SECURITY DEFINER & SERVICE ROLE

Fungsi dengan `SECURITY DEFINER` berjalan sebagai role pembuat (postgres), **bypass RLS tabel**.

### Daftar Fungsi SECURITY DEFINER (Audit 2026-05-06)

| Fungsi | Risk Level | Catatan |
|--------|-----------|---------|
| `activate_plan_on_invoice_paid` | 🔴 HIGH | Webhook Xendit — validasi signature wajib |
| `activate_plan_trial` | 🟡 MEDIUM | Tidak ada limit call per tenant |
| `aggregate_daily_market_price` | 🟡 MEDIUM | Hanya dipanggil scraper/cron |
| `create_new_business` | 🟡 MEDIUM | Dipanggil saat registrasi (atomik) |
| `handle_new_user` | 🟡 MEDIUM | Trigger auth.users |
| `increment_listing_view` | 🟡 MEDIUM | Potensial abuse tanpa rate limit |
| `auto_update_tenant_plan` | 🟡 MEDIUM | Auto-upgrade/downgrade plan |
| `update_sembako_product_avg_price` | 🟢 LOW | Dipanggil trigger internal |
| `update_sapi_batch_summary` | 🟢 LOW | Dipanggil trigger internal |

### Penggunaan `service_role` (Bypass ALL RLS)

Hanya boleh dipakai di:
1. Edge Functions: `verify-invite-code`, `fetch-harga`, `ai-commit`
2. Scraper/Cron: Arboge scraper Python script

❌ **Aplikasi React WAJIB pakai `anon` key** — autentikasi via JWT session.

---

## 🔴 HIGH RISK: market_prices — 10 Overlapping Policies

**Status**: Belum cleanup — perlu normalisasi.

Tabel `market_prices` memiliki **10 RLS policy** yang tumpang tindih:
- ❌ **2 policy bypass total** (`true`/`true`) — `Allow service role full access` & `Authenticated Insert/Update`
- ❌ Hardcoded email `'fahruhernansakti@gmail.com'`
- ❌ 3 duplikat READ, 3 duplikat superadmin ALL

**Target cleanup: Keep #1, #4, #6, #9 — Drop sisanya.** Detail di `02_SECURITY_RLS.md`.

---

## ~~🔴 HIGH RISK~~ ✅ RESOLVED: profiles.id = auth.uid() BUG

**Tabel yang sudah difix (2026-05-07):** `deliveries`, `drivers`, `sapi_kandangs`

Bug-nya adalah penggunaan `profiles.id = auth.uid()` padahal `auth.uid()` mengembalikan `auth.users.id`, bukan `profiles.id`. Semua policy yang terdampak sudah difix ke `profiles.auth_user_id = auth.uid()`.

> ⚠️ **`kandang_workers` — belum diverifikasi.** Policy `kandang_workers_tenant_isolation` masih perlu dicek apakah masih pakai `profiles.id = auth.uid()`. Jika ya, fix sama seperti yang sudah dilakukan.

```sql
-- ✅ Standard yang benar setelah fix:
USING (tenant_id = (
  SELECT profiles.tenant_id FROM profiles
  WHERE profiles.auth_user_id = auth.uid()
  LIMIT 1
))
WITH CHECK (
  tenant_id = (
    SELECT profiles.tenant_id FROM profiles
    WHERE profiles.auth_user_id = auth.uid()
    LIMIT 1
  )
);
```

---

## 🟡 MEDIUM RISK: profiles — 11 Overlapping Policies

`profiles` punya 11 policy aktif yang banyak duplikat:
- `#6 profile_select` dan `#7 superadmin_read_all_profiles` **identik**
- `#1`, `#2`, `#3` saling overlap untuk own-profile access
- 3 fungsi berbeda dipakai: `get_my_tenant_ids()`, `auth_user_tenant_ids()`, `auth.uid()`

Detail lengkap di `02_SECURITY_RLS.md` → section `profiles`.

---

## 🟢 LOW RISK: payment_settings — 3 Identical Superadmin Policies

`payment_settings` punya 3 policy ALL identik: `pay_settings_write`, `superadmin_manage_payment_settings`, `superadmin_payment_settings`. Hapus 2.

---

## 🗑️ DEPRECATION & CLEANUP (Mei 2026)

### 1. `broker_connections` — Kolom Deprecated

Tabel ini dirombak untuk model _bidirectional_ connection.

| Kolom | Status | Pengganti |
|-------|--------|-----------|
| `peternak_tenant_id` | ❌ DEPRECATED — masih ada di DB | `requester_tenant_id` |
| `broker_tenant_id` | ❌ DEPRECATED — masih ada di DB | `target_tenant_id` |

**Policy RLS lama yang masih aktif pakai kolom deprecated:**
- `connections_insert` → pakai `peternak_tenant_id`
- `connections_select` → pakai `peternak_tenant_id` + `broker_tenant_id`
- `connections_update` → pakai `peternak_tenant_id` + `broker_tenant_id`

**Status Cleanup**: Script `supabase/20260506_risk4_final.sql` sudah disiapkan.
> ⚠️ Jangan jalankan sebelum verifikasi semua frontend sudah pakai kolom baru.

### 2. `sembako_deliveries.customer_id`

- ❌ **SUDAH DIHAPUS** dari database.
- ✅ Gunakan: `sale_id` → `sembako_sales.customer_id`

### 3. Tabel Legacy `kd_*`

- ❌ 14 tabel `kd_*` (arsitektur lama Kambing/Domba campuran) **sudah di-DROP** di live DB.
- Jangan buat referensi baru ke `kd_*`.

---

## ✅ RLS HARDENING LOG (2026-05-07)

Tabel-tabel berikut sudah di-refactor ke explicit CRUD architecture:

| Tabel | Sebelum | Sesudah |
|-------|---------|---------|
| `farms` | FOR ALL + mixed pattern | explicit CRUD, blueprint tenant-shared |
| `generated_invoices` | FOR ALL + overlap | explicit CRUD, blueprint financial-grade |
| `ai_conversations` | FOR ALL + tenant override ownership | explicit CRUD, blueprint ownership-isolated |
| `cycle_expenses` | Pattern A + D overlap | explicit CRUD |
| `feed_stocks` | FOR ALL + Pattern B | explicit CRUD |
| `daily_records` | FOR ALL + Pattern B | explicit CRUD |
| `extra_expenses` | FOR ALL + Pattern B | explicit CRUD |
| `harvest_records` | Pattern A + D overlap | explicit CRUD |
| `ai_pending_entries` | tenant-wide override + UPDATE bug | explicit CRUD, UPDATE bug fixed |

**Hidden bug yang ditemukan di `ai_pending_entries`:** Policy UPDATE lama menggunakan `auth.uid() = profile_id` (mismatch type — `auth.uid()` adalah UUID auth, `profile_id` adalah FK ke `profiles.id`). Sudah difix menggunakan relasi `profiles.auth_user_id = auth.uid()`.

---

## ✅ KOREKSI DOCS LAMA (Audit 2026-05-06)

| Item | Docs Lama | Aktual DB |
|------|-----------|-----------|
| `kambing_perah_*` | ❌ "Belum ada, jangan query" | ✅ **21 tabel SUDAH ADA & aktif** |
| `worker_payments.is_deleted` | ❌ "Tidak ada is_deleted" | ✅ **Ada — filter `.eq('is_deleted', false)`** |
| `vaccination_records` | Tidak terdokumentasi | ✅ **Ada, FK ke `cycle_id`** |
| Tabel `kd_*` | Masih terdaftar | ✅ **Sudah di-DROP** |

---

## ⚠️ PERINGATAN INTEGRITAS DATA

### Tabel dengan `is_deleted` (Soft Delete)
Selalu tambahkan `.eq('is_deleted', false)` saat SELECT:
- Semua tabel bisnis utama (farms, purchases, sales, deliveries, dll)
- `worker_payments` ← **koreksi: is_deleted ADA**
- `sembako_payments`, `rpa_customer_payments`, dll

### Tabel TANPA `is_deleted` (Hard Delete — Data Hilang Selamanya)

| Tabel | Keterangan |
|-------|-----------|
| `payments` | Pembayaran broker ayam |
| `team_invitations` | Token habis = expired, bukan deleted |
| `plan_configs` | Global config |
| `broker_connections` | Delete = putus koneksi |
| `invite_rate_limits` | Rate limit per IP |
| `market_prices` | Data harga global |
| `notifications` | Notifikasi — hard delete |
