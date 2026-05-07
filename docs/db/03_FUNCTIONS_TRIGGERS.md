> File ini bagian dari docs/db/ split. Lihat 00_INDEX.md untuk navigasi lengkap.
> Last updated: 2026-05-06 — DB Audit v3 Sync
>
> 🤖 **AI: Cek trigger yang sudah ada di sini sebelum CREATE TRIGGER.**
> WAJIB pakai `public.table_name` di dalam function body. Jangan implicit schema.

# ⚙️ 03 — Logic & Enforcement (Functions & Triggers)

Sumber: Audit live DB `2026-05-06`. Query: `pg_proc`, `pg_trigger`, `information_schema`.

---

## ⚡ FUNGSI DATABASE (Lengkap)

### 🔑 Auth & Tenant

| Fungsi | Security | Argumen | Return | Deskripsi |
|--------|----------|---------|--------|-----------|
| `my_tenant_id()` | INVOKER | — | `uuid` | Tenant ID profil aktif berdasarkan `auth.uid()`. ⚠️ Hanya return 1 tenant — berisiko di multi-tenant. |
| `my_role()` | INVOKER | — | `text` | Role user aktif di tenant (`owner`/`staff`/dll). |
| `is_superadmin()` | INVOKER | — | `boolean` | Cek apakah ada profil dengan `role = 'superadmin'` untuk `auth.uid()`. Dieksekusi per-row. |
| `auth_user_tenant_ids()` | INVOKER | — | `uuid[]` | Semua `tenant_id` dari seluruh profil user aktif. ✅ Aman untuk multi-tenant. |
| `create_new_business()` | **SECURITY DEFINER** | `p_business_name`, `p_vertical`, `p_phone`, `p_location` | `uuid` | Buat tenant + profile owner dalam satu transaksi atomik. Dipanggil saat registrasi mandiri. |
| `handle_new_user()` | **SECURITY DEFINER** | — | `trigger` | Trigger function on `auth.users`. Cek `invite_token` di metadata: ada token → join tenant, tidak ada → buat tenant baru. |

### 💰 Billing & Subscription

| Fungsi | Security | Argumen | Return | Deskripsi |
|--------|----------|---------|--------|-----------|
| `activate_plan_trial()` | **SECURITY DEFINER** | `p_tenant_id uuid`, `p_plan text DEFAULT 'pro'`, `p_days int DEFAULT 7` | `void` | Aktifkan trial plan. Set `trial_ends_at` dan `plan`. |
| `activate_plan_on_invoice_paid()` | **SECURITY DEFINER** | — | `trigger` | Trigger function on `subscription_invoices`. Jika `status → 'paid'`, update `tenants.plan` dan `plan_expires_at`. |
| `auto_update_tenant_plan()` | **SECURITY DEFINER** | — | `trigger` | Trigger function — update plan otomatis berdasarkan perubahan invoice status. |
| `downgrade_expired_plans()` | **SECURITY DEFINER** | — | `void` | Downgrade tenant yang `plan_expires_at < now()` ke `'starter'`. Dipanggil pg_cron harian. |
| `get_kandang_limit()` | INVOKER | `p_tenant_id uuid` | `integer` | Batas maksimal kandang berdasarkan plan aktif tenant. |
| `get_active_ternak_count()` | INVOKER | `p_tenant_id uuid`, `p_species_group text` | `integer` | Hitung ternak aktif per tenant. `p_species_group`: `'domba_kambing'` \| `'sapi'`. |
| `get_ternak_limit()` | INVOKER | `p_tenant_id uuid`, `p_species_group text` | `integer` nullable | Limit ternak per plan. `NULL` = unlimited. |

### 📈 Market & Harga

| Fungsi | Security | Argumen | Return | Deskripsi |
|--------|----------|---------|--------|-----------|
| `aggregate_daily_market_price()` | **SECURITY DEFINER** | `p_date date` | `void` | Agregasi data transaksi ke `market_prices` untuk tanggal tertentu. Dipanggil scraper/cron. |
| `get_province_price_trends()` | INVOKER | `p_province text`, `p_start_date date`, `p_end_date date` | `TABLE` | Tren harga per provinsi — dipakai grafik dashboard harga. |
| `get_public_market_stats()` | INVOKER | — | `json` | Statistik agregat harga untuk landing page/halaman publik. |
| `increment_listing_view()` | **SECURITY DEFINER** | `row_id uuid` | `void` | Atomic increment `market_listings.view_count`. **Wajib pakai RPC, jangan `.update()` langsung.** |

### 🐾 Livestock & Operasional

| Fungsi | Security | Argumen | Return | Deskripsi |
|--------|----------|---------|--------|-----------|
| `increment_sapi_batch_animal_count()` | INVOKER | `p_batch_id uuid` | `void` | Sinkronisasi `animal_count` di batch sapi setelah insert ekor baru. |
| `update_sapi_batch_summary()` | **SECURITY DEFINER** | — | `trigger` | Update ringkasan batch sapi (total berat, adg, dll) — dipanggil trigger. |
| `update_sembako_product_avg_price()` | **SECURITY DEFINER** | — | `trigger` | Recalculate `avg_buy_price` dan `current_stock` di `sembako_products` setelah batch berubah. |
| `recalc_sembako_customer_balance()` | **SECURITY DEFINER** | — | `trigger` | Recalculate saldo outstanding customer sembako. |
| `auto_resolve_loss_reports()` | **SECURITY DEFINER** | — | `trigger` | Jika `sales.payment_status → 'lunas'`: set `loss_reports.resolved = true`. Jika dibatalkan: `resolved = false`. |

### 📄 Invoice & Reporting

| Fungsi | Security | Argumen | Return | Deskripsi |
|--------|----------|---------|--------|-----------|
| `generate_egg_invoice_number()` | INVOKER | `p_tenant_id uuid` | `text` | Invoice number broker telur: `EP-YYYYMM-XXX` (sequential, per tenant). |
| `generate_sembako_invoice_number()` | INVOKER | `p_tenant_id uuid` | `text` | Invoice number sembako: `SMB-YYYYMMDD-XXXX`. |

---

## 🪝 TRIGGER LENGKAP (Dari Audit Aktual)

### Auth & Onboarding

| Trigger | Tabel | Event | Timing | Fungsi |
|---------|-------|-------|--------|--------|
| `on_auth_user_created` | `auth.users` | INSERT | AFTER | `handle_new_user()` |

**Logic `handle_new_user()`:**
1. Cek `raw_user_meta_data->>'invite_token'`
2. Jika token valid di `team_invitations` (status=pending, belum expired) → insert profil ke tenant yang mengundang, set status invitation = 'accepted'
3. Jika tidak ada token → panggil `create_new_business()` → buat tenant baru + profil owner

### AI System

| Trigger | Tabel | Event | Timing | Fungsi |
|---------|-------|-------|--------|--------|
| `trg_ai_conversations_updated_at` | `ai_conversations` | UPDATE | BEFORE | Set `updated_at = now()` |
| `trg_ai_pending_entries_updated_at` | `ai_pending_entries` | UPDATE | BEFORE | Set `updated_at = now()` |

### Peternak Ayam

| Trigger | Tabel | Event | Timing | Fungsi |
|---------|-------|-------|--------|--------|
| `upd_cycles` | `breeding_cycles` | UPDATE | BEFORE | Set `updated_at = now()` |
| `upd_batches` | `chicken_batches` | UPDATE | BEFORE | Set `updated_at = now()` |
| `t_cycle_summary` | `daily_records` | INSERT, UPDATE | AFTER | Update `breeding_cycles.total_feed_kg` dan `total_mortality` |

### Broker Ayam & Keuangan

| Trigger | Tabel | Event | Timing | Fungsi |
|---------|-------|-------|--------|--------|
| `upd_deliveries` | `deliveries` | UPDATE | BEFORE | Set `updated_at = now()` |
| `trg_auto_resolve_loss` | `sales` | UPDATE OF `payment_status` | AFTER | `auto_resolve_loss_reports()` |

### Sembako

| Trigger | Tabel | Event | Timing | Fungsi |
|---------|-------|-------|--------|--------|
| `trg_sembako_avg_price` | `sembako_stock_batches` | INSERT, UPDATE, DELETE | AFTER | `update_sembako_product_avg_price()` — recalc `avg_buy_price` + `current_stock` |
| `trg_sembako_stock_out` | `sembako_stock_out` | INSERT | AFTER | Kurangi `qty_sisa` di `sembako_stock_batches` |
| `trg_sembako_customer_balance` | `sembako_payments` | INSERT, UPDATE, DELETE | AFTER | `recalc_sembako_customer_balance()` |

### Billing

| Trigger | Tabel | Event | Timing | Fungsi |
|---------|-------|-------|--------|--------|
| `trg_invoice_paid` | `subscription_invoices` | UPDATE OF `status` | AFTER | `activate_plan_on_invoice_paid()` — jika status → 'paid' |

### Sapi Penggemukan

| Trigger | Tabel | Event | Timing | Fungsi |
|---------|-------|-------|--------|--------|
| `trg_sapi_weight_sync` | `sapi_penggemukan_weight_records` | INSERT, UPDATE | AFTER | Update `latest_weight_kg` + `latest_weight_date` di `sapi_penggemukan_animals` |
| `trg_sapi_breeding_weight_sync` | `sapi_breeding_weight_records` | INSERT, UPDATE | AFTER | Update `latest_weight_kg` di `sapi_breeding_animals` |
| `trg_sapi_mating_defaults` | `sapi_breeding_mating_records` | INSERT | BEFORE | Set `est_partus_date = mating_date + 285 days` |
| `trg_sapi_batch_animal_count` | `sapi_penggemukan_animals` | INSERT | AFTER | Call `increment_sapi_batch_animal_count(batch_id)` |
| `trg_sapi_batch_summary` | `sapi_penggemukan_animals` | INSERT, UPDATE, DELETE | AFTER | `update_sapi_batch_summary()` |

### Domba Penggemukan & Breeding

| Trigger | Tabel | Event | Timing | Fungsi |
|---------|-------|-------|--------|--------|
| `trg_domba_penggemukan_weight_sync` | `domba_penggemukan_weight_records` | INSERT, UPDATE | AFTER | Update `latest_weight_kg` di `domba_penggemukan_animals` |
| `trg_domba_breeding_weight_sync` | `domba_breeding_weight_records` | INSERT, UPDATE | AFTER | Update `latest_weight_kg` di `domba_breeding_animals` |
| `trg_domba_mating_defaults` | `domba_breeding_mating_records` | INSERT | BEFORE | Set `est_partus_date = mating_date + 150 days` |

### Kambing Penggemukan & Breeding

| Trigger | Tabel | Event | Timing | Fungsi |
|---------|-------|-------|--------|--------|
| `trg_kambing_penggemukan_weight_sync` | `kambing_penggemukan_weight_records` | INSERT, UPDATE | AFTER | Update `latest_weight_kg` di `kambing_penggemukan_animals` |
| `trg_kambing_breeding_weight_sync` | `kambing_breeding_weight_records` | INSERT, UPDATE | AFTER | Update `latest_weight_kg` di `kambing_breeding_animals` |
| `trg_kambing_mating_defaults` | `kambing_breeding_mating_records` | INSERT | BEFORE | Set `est_partus_date = mating_date + 150 days` |

### Kambing Perah

| Trigger | Tabel | Event | Timing | Fungsi |
|---------|-------|-------|--------|--------|
| `trg_kambing_perah_weight_sync` | `kambing_perah_breeding_weight_records` | INSERT, UPDATE | AFTER | Update `latest_weight_kg` di `kambing_perah_breeding_animals` |
| `trg_kambing_perah_mating_defaults` | `kambing_perah_breeding_mating_records` | INSERT | BEFORE | Set `est_partus_date = mating_date + 150 days` |
| `trg_kambing_perah_penggemukan_weight_sync` | `kambing_perah_penggemukan_weight_records` | INSERT, UPDATE | AFTER | Update `latest_weight_kg` di `kambing_perah_penggemukan_animals` |

---

## 📋 GENERATED COLUMNS (DILARANG INSERT)

```
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
kambing_perah_penggemukan_feed_logs.consumed_kg
kambing_perah_breeding_births.total_born_dead
```

---

## ⏱️ CRON JOBS (pg_cron)

| Job Name | Jadwal | Fungsi | Status |
|----------|--------|--------|--------|
| `downgrade-expired-plans` | Daily (malam) | `downgrade_expired_plans()` | ✅ Terverifikasi aktif di audit |
| `aggregate-market-price` | Daily | `aggregate_daily_market_price(CURRENT_DATE)` | Dijalankan Arboge scraper / pg_cron |
| Cleanup expired invitations | Daily | (belum terdokumentasi) | ⚠️ Perlu audit di Supabase Dashboard → Cron Jobs |

> Cek live: Supabase Dashboard → **Database → Extensions (pg_cron)** → `SELECT * FROM cron.job;`

---

## 🔐 RPC CALLS DARI FRONTEND

Fungsi yang dapat dipanggil via `supabase.rpc('nama', params)`:

```javascript
// Auth
supabase.rpc('my_tenant_id')
supabase.rpc('my_role')
supabase.rpc('is_superadmin')
supabase.rpc('auth_user_tenant_ids')

// Market
supabase.rpc('get_province_price_trends', { p_province, p_start_date, p_end_date })
supabase.rpc('get_public_market_stats')
supabase.rpc('increment_listing_view', { row_id })

// Livestock limits
supabase.rpc('get_kandang_limit', { p_tenant_id })
supabase.rpc('get_active_ternak_count', { p_tenant_id, p_species_group })
supabase.rpc('get_ternak_limit', { p_tenant_id, p_species_group })

// Sapi
supabase.rpc('increment_sapi_batch_animal_count', { p_batch_id })

// Invoice
supabase.rpc('generate_egg_invoice_number', { p_tenant_id })
supabase.rpc('generate_sembako_invoice_number', { p_tenant_id })
```

> ⚠️ Fungsi `SECURITY DEFINER` (billing, plan) — **JANGAN panggil dari frontend**. Dipanggil oleh trigger atau Edge Function saja.
