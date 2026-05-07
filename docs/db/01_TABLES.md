> Last updated: 2026-05-06 — DB Audit v3 (Full Sync)
> Audit result: 141 tabel terkonfirmasi, RLS ✅ ALL ON
> File ini bagian dari docs/db/ split. Lihat 00_INDEX.md untuk navigasi lengkap.
>
> 🤖 **AI: BACA FILE INI sebelum generate query atau ALTER TABLE.**
> Verifikasi nama kolom, tipe data, dan FK di sini. JANGAN asumsikan.

# 🧠 01 — Tables (Data Access Layer)

Definisi lengkap semua tabel produksi TernakOS.

---

## SYSTEM CORE

### `tenants`
> Root tabel — semua data bisnis terikat ke sini

| Kolom | Tipe | Notes |
|-------|------|-------|
| `id` | uuid PK | |
| `business_name` | text | NOT NULL |
| `owner_name` | text | nullable |
| `phone` | text | nullable |
| `plan` | text | `'starter'` `'pro'` `'business'` |
| `business_vertical` | text | `'poultry_broker'` \| `'egg_broker'` \| `'peternak'` \| `'rumah_potong'` \| `'sembako_broker'` |
| `sub_type` | text NOT NULL | `'broker_ayam'` \| `'broker_telur'` \| `'distributor_sembako'` \| `'peternak_broiler'` \| `'peternak_sapi'` \| `'peternak_domba'` \| `'peternak_kambing'` \| `'rpa'` |
| `kandang_limit` | integer | default 1 |
| `chicken_types` | text[] | nullable |
| `animal_types` | text[] | nullable |
| `base_livestock_type` | text | nullable |
| `addon_livestock_types` | text[] | nullable |
| `is_active` | boolean | default true |
| `trial_ends_at` | timestamptz | default now()+14 days |
| `plan_expires_at` | timestamptz | nullable — null = still on trial |
| `province` | text | nullable |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

---

### `profiles`
> Satu user (auth.users) bisa punya banyak profile (satu per tenant)

| Kolom | Tipe | Notes |
|-------|------|-------|
| `id` | uuid PK | |
| `tenant_id` | uuid FK → tenants | NOT NULL |
| `auth_user_id` | uuid FK → auth.users | NOT NULL |
| `full_name` | text | nullable |
| `role` | text | `'owner'` `'staff'` `'superadmin'` `'view_only'` `'sopir'` |
| `user_type` | text | nullable — `'broker'` \| `'peternak'` \| `'rpa'` |
| `avatar_url` | text | nullable |
| `phone` | text | nullable |
| `onboarded` | boolean | default false |
| `is_active` | boolean | default true |
| `last_seen_at` | timestamptz | nullable |
| `created_at` | timestamptz | |

**Hook**: `useAuth()` → `supabase.from('profiles').select('*, tenants(*)')`

---

### `tenant_memberships` 🆕
> Alternatif profiles — satu user bisa akses banyak tenant

| Kolom | Tipe | Notes |
|-------|------|-------|
| `id` | uuid PK | |
| `auth_user_id` | uuid FK → auth.users | NOT NULL |
| `tenant_id` | uuid FK → tenants | NOT NULL |
| `role` | text | `'owner'` `'staff'` `'view_only'` `'sopir'` |
| `full_name` | text | nullable |
| `created_at` | timestamptz | |

---

### `team_invitations`

| Kolom | Tipe | Notes |
|-------|------|-------|
| `id` | uuid PK | |
| `tenant_id` | uuid FK → tenants | NOT NULL |
| `invited_by` | uuid FK → profiles | NOT NULL |
| `email` | text | **nullable** — tidak diisi saat generate kode |
| `role` | text | `'owner'` `'staff'` `'view_only'` `'sopir'` |
| `token` | text | 32-byte hex (64 karakter) |
| `status` | text | `'pending'` `'accepted'` `'expired'` |
| `expires_at` | timestamptz | default now()+7 days |

⚠️ Gunakan `expires_at` bukan `expired_at`
⚠️ Tidak ada `is_deleted`

---

### `notifications`

| Kolom | Tipe | Notes |
|-------|------|-------|
| `id` | uuid PK | |
| `tenant_id` | uuid FK → tenants | NOT NULL |
| `type` | text | `'piutang_jatuh_tempo'` \| `'kandang_siap_panen'` \| `'subscription_expires'` \| `'system'` dll |
| `title` | text | NOT NULL |
| `body` | text | nullable |
| `is_read` | boolean | default false |
| `action_url` | text | nullable |
| `metadata` | jsonb | nullable |

---

## POULTRY BROKER VERTICAL

### `farms`
> Kandang ayam milik peternak, dikelola broker

| Kolom | Tipe | Notes |
|-------|------|-------|
| `id` | uuid PK | |
| `tenant_id` | uuid FK → tenants | NOT NULL |
| `farm_name` | text | NOT NULL |
| `owner_name` | text | NOT NULL |
| `chicken_type` | text | `'broiler'` `'kampung'` `'pejantan'` `'layer'` `'petelur'` |
| `capacity` | integer | nullable |
| `available_stock` | integer | default 0 |
| `harvest_date` | date | nullable |
| `status` | text | `'ready'` `'growing'` `'empty'` |
| `quality_rating` | smallint | 1–5, nullable |
| `is_deleted` | boolean | default false |

**Hook**: `useFarms()` — queryKey `['farms', tenant.id]`

---

### `purchases`

| Kolom | Tipe | Notes |
|-------|------|-------|
| `id` | uuid PK | |
| `tenant_id` | uuid FK → tenants | NOT NULL |
| `farm_id` | uuid FK → farms | NOT NULL |
| `quantity` | integer | NOT NULL |
| `avg_weight_kg` | numeric | NOT NULL |
| `total_weight_kg` | numeric | NOT NULL |
| `price_per_kg` | integer | NOT NULL |
| `total_cost` | bigint | NOT NULL |
| `transport_cost` | integer | default 0 |
| `other_cost` | integer | default 0 |
| `total_modal` | bigint | ⚠️ **GENERATED** — NEVER INSERT |
| `transaction_date` | date | NOT NULL |
| `is_deleted` | boolean | default false |

---

### `sales`

| Kolom | Tipe | Notes |
|-------|------|-------|
| `id` | uuid PK | |
| `tenant_id` | uuid FK → tenants | NOT NULL |
| `rpa_id` | uuid FK → rpa_clients | NOT NULL |
| `purchase_id` | uuid FK → purchases | NOT NULL |
| `total_revenue` | bigint | NOT NULL |
| `delivery_cost` | integer | default 0 |
| `net_revenue` | bigint | ⚠️ **GENERATED** — NEVER INSERT |
| `payment_status` | text | `'lunas'` `'belum_lunas'` `'sebagian'` |
| `paid_amount` | bigint | default 0 |
| `remaining_amount` | bigint | ⚠️ **GENERATED** — NEVER INSERT |
| `transaction_date` | date | NOT NULL |
| `is_deleted` | boolean | default false |

---

### `deliveries`

| Kolom | Tipe | Notes |
|-------|------|-------|
| `id` | uuid PK | |
| `tenant_id` | uuid FK → tenants | NOT NULL |
| `sale_id` | uuid FK → sales | NOT NULL |
| `vehicle_id` | uuid FK → vehicles | nullable |
| `driver_id` | uuid FK → drivers | nullable |
| `initial_count` | integer | NOT NULL |
| `arrived_count` | integer | nullable |
| `shrinkage_kg` | numeric | ⚠️ **GENERATED** — NEVER INSERT |
| `status` | text | `'preparing'` `'loading'` `'on_route'` `'arrived'` `'completed'` |
| `is_deleted` | boolean | default false |

---

### `payments`
> Pembayaran dari RPA ke broker

| Kolom | Tipe | Notes |
|-------|------|-------|
| `id` | uuid PK | |
| `tenant_id` | uuid FK → tenants | NOT NULL |
| `sale_id` | uuid FK → sales | NOT NULL |
| `amount` | bigint | NOT NULL |
| `payment_date` | date | NOT NULL |
| `payment_method` | text | `'transfer'` `'cash'` `'giro'` `'qris'` |

⚠️ **Tidak ada `is_deleted`** — JANGAN filter `is_deleted = false`

---

### `rpa_clients`

| Kolom | Tipe | Notes |
|-------|------|-------|
| `id` | uuid PK | |
| `tenant_id` | uuid FK → tenants | NOT NULL |
| `rpa_name` | text | NOT NULL |
| `buyer_type` | text | `'rpa'` `'pedagang_pasar'` `'restoran'` `'pengepul'` dll |
| `payment_terms` | text | `'cash'` `'net3'` `'net7'` `'net14'` `'net30'` |
| `credit_limit` | bigint | default 0 |
| `is_deleted` | boolean | default false |

---

### `loss_reports`

| Kolom | Tipe | Notes |
|-------|------|-------|
| `id` | uuid PK | |
| `tenant_id` | uuid FK → tenants | NOT NULL |
| `sale_id` | uuid FK → sales | nullable |
| `delivery_id` | uuid FK → deliveries | nullable |
| `loss_type` | text | `'mortality'` `'underweight'` `'shrinkage'` dll |
| `financial_loss` | bigint | nullable |
| `resolved` | boolean | default false |
| `report_date` | date | NOT NULL |
| `is_deleted` | boolean | default false |

**Auto-created**: `useUpdateDelivery.updateTiba()` insert loss_report jika mortality > 0

---

### `vehicles` & `drivers` & `vehicle_expenses`

`vehicles`: `vehicle_type` (`'truk'`/`'pickup'`/`'l300'`/`'motor'`), `vehicle_plate` (UPPERCASE), `status` (`'aktif'`/`'nonaktif'`/`'servis'`)
`drivers`: `full_name`, `phone`, `sim_type` (`'A'`/`'B1'`/`'B2'`/`'C'`), `status` (`'aktif'`/`'nonaktif'`/`'cuti'`)
`vehicle_expenses`: `expense_type` (`'bbm'`/`'servis'`/`'pajak'`/`'sewa'`), `amount`, `expense_date`

---

### `orders` & `chicken_batches`

`orders`: PO dari RPA ke broker. Status: `'open'`/`'matched'`/`'partial'`/`'completed'`/`'cancelled'`
`chicken_batches`: Stok virtual per kandang. Status: `'growing'`/`'ready'`/`'booked'`/`'sold'`/`'cancelled'`

---

### `market_prices`
> GLOBAL — tidak ada tenant_id

| Kolom | Tipe | Notes |
|-------|------|-------|
| `price_date` | date | NOT NULL — pakai `price_date` bukan `date` |
| `chicken_type` | text | default `'broiler'` |
| `region` | text | default `'nasional'` |
| `farm_gate_price` | integer | nullable |
| `buyer_price` | integer | nullable |
| `broker_margin` | integer | ⚠️ **GENERATED** |
| `price_delta` | integer | nullable — selisih harga hari sebelumnya |

**Unique**: `(price_date, chicken_type, region)`

---

### `extra_expenses`

`category`: `'tenaga_kerja'` \| `'sewa'` \| `'administrasi'` \| `'komunikasi'` \| `'lainnya'`

---

## EGG BROKER VERTICAL

### `egg_inventory`, `egg_suppliers`, `egg_customers`
`egg_inventory`: stok per grade (`'hero'`/`'standard'`/`'salted'`). `cost_per_pack` = **GENERATED**.
`egg_suppliers`: name, phone, address, is_deleted
`egg_customers`: name, phone, total_spent, total_orders, is_deleted

### `egg_sales`

| Kolom | Tipe | Notes |
|-------|------|-------|
| `invoice_number` | text | UNIQUE (`EP-YYYYMMDD-001`) |
| `net_profit` | bigint | ⚠️ **GENERATED** |
| `payment_status` | text | `'pending'` \| `'lunas'` \| `'piutang'` |
| `fulfillment_status` | text | `'processing'` \| `'on_delivery'` \| `'completed'` |
| `is_deleted` | boolean | |

`egg_sale_items`: `subtotal` = **GENERATED** (`qty_pack * price_per_pack`)
`egg_stock_logs`: `log_type` `'in'`/`'out'`/`'adj'`

---

## SEMBAKO VERTICAL (Fase 4)

> ⚠️ RLS Bulletproof Pattern: `tenant_id IN (SELECT tenant_id FROM profiles WHERE auth_user_id = auth.uid())`

### `sembako_products`

| Kolom | Tipe | Notes |
|-------|------|-------|
| `category` | text | `'beras'`\|`'minyak'`\|`'gula'`\|`'tepung'`\|`'rokok'`\|`'lainnya'` dll |
| `unit` | text | `'kg'`\|`'liter'`\|`'pcs'`\|`'karung'`\|`'karton'`\|`'sak'` dll |
| `avg_buy_price` | integer | HPP rata-rata (auto-update trigger) |
| `current_stock` | numeric | auto-update dari batch trigger |
| `secondary_unit` | text | nullable |
| `conversion_rate` | numeric | nullable — konversi empty string ke null sebelum insert |

### `sembako_stock_batches`

| Kolom | Tipe | Notes |
|-------|------|-------|
| `qty_masuk` | numeric | |
| `qty_sisa` | numeric | dikurangi saat FIFO |
| `buy_price` | integer | |
| `total_cost` | integer | ⚠️ **GENERATED** — NEVER INSERT |
| `purchase_date` | date | |

### `sembako_stock_out`

| Kolom | Tipe | Notes |
|-------|------|-------|
| `qty_keluar` | numeric | ✅ BUKAN `qty_out` |
| `batch_id` | uuid FK | |
| `sale_id` | uuid FK | |
| `buy_price` | integer | |

❌ Kolom `reason` TIDAK ADA — jangan insert
⚠️ WAJIB insert saat FIFO penjualan — tanpa ini delete sale tidak bisa restore stok

### `sembako_sales`

| Kolom | Tipe | Notes |
|-------|------|-------|
| `invoice_number` | text | `SMB-YYYYMMDD-XXXX` |
| `gross_profit` | integer | ⚠️ **GENERATED** |
| `net_profit` | integer | ⚠️ **GENERATED** |
| `remaining_amount` | integer | ⚠️ **GENERATED** |
| `payment_status` | text | `'belum_lunas'`\|`'sebagian'`\|`'lunas'` |

`sembako_sale_items`: `subtotal` & `cogs_total` = **GENERATED**

### `sembako_payments`

✅ `is_deleted` ADA — filter `.eq('is_deleted', false)`
✅ Gunakan `reference_number` (bukan `reference_no`)

### `sembako_employees`

| `status` | text | `'aktif'`\|`'nonaktif'` — BUKAN `is_active` boolean |
✅ Filter aktif: `.eq('status', 'aktif')`

### `sembako_payroll`

`total_pay` = **GENERATED** (`base + commission + bonus - deduction`)
⚠️ `is_deleted` ADA — filter saat read

### `sembako_deliveries`

❌ NEVER insert `customer_id` — kolom sudah dihapus
✅ Kolom `delivery_area` (BUKAN `destination`)
✅ `is_deleted` ADA — filter saat read

### `sembako_expenses`, `sembako_suppliers`, `sembako_customers`, `sembako_supplier_payments`

Semua pakai `tenant_id` + `is_deleted`. `sembako_customers` punya `credit_limit`, `total_outstanding`.

---

## PETERNAK VERTICAL

### `peternak_farms`

| Kolom | Tipe | Notes |
|-------|------|-------|
| `livestock_type` | text | `'ayam_broiler'`\|`'ayam_petelur'` |
| `business_model` | text | `'mandiri_murni'`\|`'mitra_penuh'`\|`'mitra_pakan'` dll |
| `mitra_company` | text | nullable |
| `mitra_contract_price` | integer | nullable |
| `is_active` | boolean | default true |

### `breeding_cycles`

| Kolom | Tipe | Notes |
|-------|------|-------|
| `doc_count` | integer | jumlah DOC masuk |
| `total_feed_kg` | numeric | kumulatif pakan |
| `total_mortality` | integer | kumulatif mortalitas |
| `status` | text | `'active'`\|`'harvested'`\|`'failed'`\|`'cancelled'` |

⚠️ Tidak ada `current_count` — gunakan `doc_count - total_mortality`

### `daily_records`, `cycle_expenses`, `harvest_records`

`cycle_expenses.expense_type`: `'doc'`\|`'pakan'`\|`'obat'`\|`'vaksin'`\|`'listrik'`\|`'air'`\|`'litter'`\|`'lainnya'`
`harvest_records`: kolom `total_ekor_panen` (BUKAN `total_count`)

### `kandang_workers` & `worker_payments`

`kandang_workers.salary_type`: `'flat_bonus'` (satu-satunya nilai saat ini)
`worker_payments`: ✅ **ADA `is_deleted`** — filter `.eq('is_deleted', false)` saat read

### `kandang_worker_payments` 🆕
> Pembayaran mandiri untuk kandang workers (berbeda dari worker_payments di peternak ayam)

| Kolom | Tipe | Notes |
|-------|------|-------|
| `id` | uuid PK | |
| `tenant_id` | uuid FK → tenants | NOT NULL |
| `worker_id` | uuid FK → kandang_workers | NOT NULL |
| `payment_type` | text | `'gaji'` \| `'bonus'` \| `'lainnya'` |
| `amount` | bigint | NOT NULL |
| `payment_date` | date | NOT NULL |
| `is_deleted` | boolean | default false |

### `feed_stocks`

Upsert logic: cek existing by `(tenant_id, peternak_farm_id, feed_type)` → UPDATE qty jika ada
Threshold: ≥500 Aman, 100–499 Cukup, <100 Menipis

---

## MARKET & CONNECTIONS

### `market_listings`

| Kolom | Tipe | Notes |
|-------|------|-------|
| `listing_type` | text | `'stok_ayam'`\|`'penawaran_broker'`\|`'permintaan_rpa'` |
| `view_count` | integer | ✅ pakai RPC `increment_listing_view`, BUKAN `.update()` |
| `status` | text | `'active'`\|`'closed'`\|`'expired'` |

### `broker_connections`

| Kolom | Tipe | Notes |
|-------|------|-------|
| `requester_tenant_id` | uuid FK → tenants | ✅ PAKAI INI |
| `target_tenant_id` | uuid FK → tenants | ✅ PAKAI INI |
| `status` | text | `'pending'`\|`'active'`\|`'rejected'`\|`'blocked'` |

⚠️ `peternak_tenant_id` & `broker_tenant_id` — DEPRECATED (pending cleanup)
⚠️ Tidak ada `is_deleted` — delete langsung jika cancel
⚠️ UNIQUE constraint: `(requester_tenant_id, target_tenant_id)`

### `stock_listings`

| Kolom | Tipe | Notes |
|-------|------|-------|
| `peternak_tenant_id` | uuid FK → tenants | ✅ Ini kolom di stock_listings (bukan deprecated) |
| `visible_to` | text | `'connected'`\|`'public'` |
| `status` | text | `'available'`\|`'booked'`\|`'sold'`\|`'expired'` |

---

## RPA DISTRIBUTION VERTICAL

`rpa_products`: karkas, fillet, ceker dll. `is_deleted` ada.
`rpa_clients`: pembeli ayam dari broker (RPA, pedagang, restoran). `is_deleted` ada.
`rpa_invoices`: `net_profit` & `remaining_amount` = **GENERATED**
`rpa_invoice_items`: `subtotal` = **GENERATED**
`rpa_customer_payments`: `is_deleted` ADA — filter saat read

### `rpa_customers` 🆕
> Customer di sisi RPA (bukan rpa_clients)

| Kolom | Tipe | Notes |
|-------|------|-------|
| `id` | uuid PK | |
| `tenant_id` | uuid FK → tenants | NOT NULL |
| `customer_name` | text | NOT NULL |
| `credit_limit` | bigint | default 0 |
| `total_outstanding` | bigint | diupdate via trigger |
| `reliability_score` | numeric | nullable |
| `is_deleted` | boolean | default false |

### `rpa_payments` 🆕 (Cross-Tenant)
> Pembayaran dari RPA ke broker — lintas tenant

| Kolom | Tipe | Notes |
|-------|------|-------|
| `id` | uuid PK | |
| `rpa_tenant_id` | uuid FK → tenants | tenant RPA |
| `broker_tenant_id` | uuid FK → tenants | tenant broker |
| `amount` | bigint | NOT NULL |
| `payment_date` | date | NOT NULL |
| `is_deleted` | boolean | default false |

### `rpa_purchase_orders` 🆕 (Cross-Tenant)
> PO dari RPA ke broker

| Kolom | Tipe | Notes |
|-------|------|-------|
| `id` | uuid PK | |
| `rpa_tenant_id` | uuid FK → tenants | |
| `broker_tenant_id` | uuid FK → tenants | |
| `status` | text | `'open'` \| `'matched'` \| `'completed'` \| `'cancelled'` |
| `is_deleted` | boolean | default false |

---

## SAPI PENGGEMUKAN

| Tabel | Key Info |
|-------|---------|
| `sapi_penggemukan_batches` | `avg_adg_gram` (KPI) |
| `sapi_penggemukan_animals` | `latest_weight_kg` GENERATED via trigger, `ear_tag` NOT NULL |
| `sapi_penggemukan_feed_logs` | `consumed_kg` GENERATED |
| `sapi_kandangs` | `luas_m2` GENERATED (`panjang * lebar`) |

---

## DOMBA & KAMBING (prefix: `domba_` atau `kambing_`)

| Tabel | Key Info |
|-------|---------|
| `[prefix]_penggemukan_batches` | status: `aktif`/`selesai`/`dibatalkan` |
| `[prefix]_penggemukan_animals` | `latest_weight_kg` GENERATED via trigger |
| `[prefix]_breeding_animals` | pedigree self-ref `dam_id`/`sire_id` |
| `[prefix]_breeding_births` | `total_born_dead` GENERATED — NEVER INSERT |
| `[prefix]_breeding_mating_records` | `est_partus_date` = mating_date + 150 days |

---

## SAPI BREEDING

| Tabel | Key Info |
|-------|---------|
| `sapi_breeding_animals` | `latest_weight_kg` GENERATED, `parity` integer |
| `sapi_breeding_mating_records` | `est_partus_date` = mating_date + **285** days |
| `sapi_breeding_health_logs` | `log_type`: vaksinasi/obat_cacing/sakit/kematian |

---

## GLOBAL CONFIG & BILLING

### `pricing_plans`
GLOBAL — tidak ada `tenant_id`. **Unique**: `(role, plan)`.

### `discount_codes`
GLOBAL. `discount_type`: `'percent'`\|`'flat'`

### `plan_configs`
GLOBAL key-value store. Keys: `kandang_limit`, `addon_pricing`, `trial_config`, `annual_discount`, `team_limit`, `ternak_limit`

### `subscription_invoices`
`xendit_invoice_id` & `xendit_payment_url` nullable — payment gateway Xendit

### `payment_settings`
Rekening bank penerima (global, is_active)

### `waitlist_signups`
GLOBAL. Kolom: `email`, `vertical`. ❌ Tidak ada `name` atau `interest`

### `invite_rate_limits`
UNIQUE: `ip_address`. Tidak ada `is_deleted`.

### `xendit_config`
`secret_key_encrypted` — jangan expose ke frontend

### `generated_invoices`
`invoice_type`: `'sale'`\|`'purchase'`\|`'delivery'`\|`'peternak_invoice'`\|`'rpa_to_toko'`

### `global_audit_logs`
`actor_profile_id`, `action`, `entity_type`, `old_data`/`new_data` jsonb

---

## AI INFRASTRUCTURE

| Tabel | Key Info |
|-------|----------|
| `ai_conversations` | `tenant_id`, `profile_id`, `title`, `updated_at` (trigger) |
| `ai_pending_entries` | `status`: pending/validated/committed/rejected/error. `updated_at` (trigger) |
| `ai_staged_transactions` | `transaction_type`: sale/purchase/expense/feed_log |
| `ai_anomaly_logs` | `severity`: low/medium/high |

### `ai_error_logs` 🆕

| Kolom | Tipe | Notes |
|-------|------|-------|
| `id` | uuid PK | |
| `tenant_id` | uuid | **NULLABLE** — error bisa terjadi sebelum auth |
| `profile_id` | uuid | nullable |
| `error_msg` | text | NOT NULL |
| `provider` | text | `'openai'` \| `'gemini'` \| dll |
| `user_message` | text | nullable |
| `context_page` | text | nullable |
| `created_at` | timestamptz | |

### `ai_feedback` 🆕

| Kolom | Tipe | Notes |
|-------|------|-------|
| `id` | uuid PK | |
| `pending_entry_id` | uuid FK → ai_pending_entries | NOT NULL |
| `tenant_id` | uuid FK → tenants | NOT NULL |
| `profile_id` | uuid FK → profiles | NOT NULL |
| `rating` | smallint | 1–5 |
| `correction_notes` | text | nullable |
| `corrected_data` | jsonb | nullable — data koreksi dari user |
| `created_at` | timestamptz | |

---

## PROFIL VERTICAL

`broker_profiles`: detail bisnis broker (chicken_types, egg_types, area_operasi)
`peternak_profiles`: detail peternak (animal_types, ruminansia_types, kandang_count)
`rpa_profiles`: detail RPA (kapasitas_potong_per_hari, area_distribusi)

---

## KAMBING PERAH VERTICAL (21 Tabel) ✅ SUDAH ADA
> ⚠️ Docs lama salah catat sebagai "belum ada". Semua tabel berikut AKTIF di DB.

| Tabel | Key Info |
|-------|----------|
| `kambing_perah_kandangs` | Kandang kambing perah, `tenant_id` |
| `kambing_perah_animal_groups` | Kelompok ternak, `group_type` |
| `kambing_perah_feed_formulations` | Formulasi pakan per kelompok |
| `kambing_perah_inventory_items` | Stok pakan/obat/supplies |
| `kambing_perah_inventory_transactions` | Mutasi stok keluar/masuk |
| `kambing_perah_customer_registry` | Pelanggan susu |
| `kambing_perah_milk_sales` | Penjualan susu ke customer |
| `kambing_perah_breeding_animals` | Induk betina perah, FK → `group_id`, `kandang_id` |
| `kambing_perah_breeding_mating_records` | Kawin IB/alami, `est_partus_date` = mating + 150 days |
| `kambing_perah_breeding_births` | Kelahiran, `total_born_dead` = **GENERATED** |
| `kambing_perah_breeding_weight_records` | Rekam berat, trigger sync ke animals |
| `kambing_perah_breeding_health_logs` | Vaksinasi, obat, sakit, kematian |
| `kambing_perah_lactation_cycles` | Siklus laktasi per induk |
| `kambing_perah_milk_logs` | Log pemerahan harian per induk |
| `kambing_perah_milk_quality_logs` | Kualitas susu (lemak, protein, dll) |
| `kambing_perah_breeding_feed_logs` | Log pakan per kelompok + formulasi |
| `kambing_perah_penggemukan_batches` | Batch penggemukan jantan/afkir |
| `kambing_perah_penggemukan_animals` | Individual ternak batch penggemukan |
| `kambing_perah_penggemukan_weight_records` | Rekam berat penggemukan |
| `kambing_perah_penggemukan_health_logs` | Kesehatan batch penggemukan |
| `kambing_perah_penggemukan_feed_logs` | Pakan penggemukan, `consumed_kg` = **GENERATED** |
| `kambing_perah_penggemukan_sales` | Penjualan dari batch penggemukan |

---

## TABEL TANPA `is_deleted` — JANGAN FILTER

| Tabel | Catatan |
|-------|--------|
| `payments` | Pembayaran broker ayam |
| `team_invitations` | Expired = cek `expires_at` |
| `plan_configs` | Global config |
| `broker_connections` | Delete = putus koneksi |
| `invite_rate_limits` | Per IP |
| `market_prices` | Data harga global |
| `notifications` | Hard delete |

---

## FOREIGN KEY QUICK REFERENCE

> Lihat 00_INDEX.md → DEPENDENCY MAP untuk urutan insert.

Key FK chains:
- `profiles.auth_user_id` → `auth.users.id`
- `profiles.tenant_id` → `tenants.id`
- `farms.tenant_id` → `tenants.id`
- `purchases.farm_id` → `farms.id`
- `sales.purchase_id` → `purchases.id`
- `deliveries.sale_id` → `sales.id`
- `sembako_stock_out.batch_id` → `sembako_stock_batches.id`
- `broker_connections.requester_tenant_id` → `tenants.id`
- `broker_connections.target_tenant_id` → `tenants.id`
