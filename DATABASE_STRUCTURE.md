# TernakOS — Database Structure
> Generated from Supabase schema. Gunakan sebagai referensi Antigravity.
> Last updated: 2026-03-25 (Superadmin & Phase 6 Global Stats)

---

## ⚠️ CRITICAL RULES

```
❌ NEVER INSERT generated columns:
   purchases.total_modal
   sales.net_revenue
   sales.remaining_amount
   deliveries.shrinkage_kg
   market_prices.broker_margin

✅ ALWAYS filter: .eq('is_deleted', false) (Except for `payments` and `team_invitations`)
✅ ALL enum values are LOWERCASE
```

---

## 🔐 AUTH SCHEMA (Supabase Managed — Jangan Diubah)

Tabel `auth.*` dikelola penuh oleh Supabase. **Tidak perlu di-query langsung.**
Satu-satunya relasi yang relevan ke kode TernakOS:

```
auth.users.id → profiles.auth_user_id (FK)
```

Akses auth hanya via:
```js
supabase.auth.getUser()         // get current user
supabase.auth.signInWithPassword()
supabase.auth.signUp()
supabase.auth.signOut()
```

> Jangan pernah query `auth.users` langsung — gunakan `profiles` tabel sebagai gantinya.

---

## 🗺️ DEPENDENCY MAP (Urutan Insert)

```
auth.users
  └── tenants
        ├── profiles          (tenant_id, auth_user_id)
        ├── farms             (tenant_id)
        │     └── purchases   (tenant_id, farm_id)
        │           └── sales (tenant_id, purchase_id, rpa_id)
        │                 ├── deliveries    (tenant_id, sale_id)
        │                 │     └── loss_reports (delivery_id)
        │                 ├── payments      (tenant_id, sale_id)
        │                 └── loss_reports  (sale_id)
        ├── rpa_clients       (tenant_id)  ← referenced by sales.rpa_id
        ├── vehicles          (tenant_id)  ← referenced by deliveries.vehicle_id
        │     └── vehicle_expenses
        ├── drivers           (tenant_id)  ← referenced by deliveries.driver_id
        ├── chicken_batches   (tenant_id, farm_id)
        │     └── orders      (matched_batch_id)
        ├── orders            (tenant_id, rpa_id)
        ├── extra_expenses    (tenant_id)
        ├── notifications     (tenant_id)
        ├── team_invitations  (tenant_id, invited_by)
        ├── subscription_invoices (tenant_id)
        ├── peternak_farms    (tenant_id)
        │     ├── breeding_cycles (peternak_farm_id)
        │     │     ├── daily_records
        │     │     └── stock_listings
        │     └── feed_stocks
        ├── rpa_profiles      (tenant_id)
        ├── broker_connections (peternak_tenant_id / broker_tenant_id)
        └── rpa_purchase_orders (rpa_tenant_id / broker_tenant_id)

---

### `EGG BROKER` Dependencies
```
tenants
  ├── egg_suppliers
  ├── egg_customers
  └── egg_inventory
        └── egg_sales
              ├── egg_sale_items
              └── egg_stock_logs
```

market_prices   ← GLOBAL, tidak ada tenant_id
payment_settings ← GLOBAL
```

---

## 📋 TABLES DETAIL

---

### `tenants`
> Root tabel — semua data bisnis terikat ke sini

| Kolom | Tipe | Notes |
|-------|------|-------|
| `id` | uuid PK | |
| `business_name` | text | NOT NULL |
| `owner_name` | text | nullable |
| `phone` | text | nullable |
| `location` | text | nullable |
| `plan` | text | `'starter'` `'pro'` `'business'` |
| `business_vertical` | text | `'poultry_broker'` (default) \| `'egg_broker'` \| `'peternak'` \| `'rpa'` |
| `is_hidden_beta` | boolean | default false |
| `is_active` | boolean | default true |
| `trial_ends_at` | timestamptz | default now()+14 days |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

---

## 🥚 EGG BROKER VERTICAL (Fase 2)

### `egg_suppliers`
> Daftar supplier pakan/telur untuk broker telur

| Kolom | Tipe | Notes |
|-------|------|-------|
| `id` | uuid PK | |
| `tenant_id` | uuid FK → tenants | |
| `name` | text | NOT NULL |
| `phone` | text | nullable |
| `address` | text | nullable |
| `is_deleted` | boolean | |

---

### `egg_inventory`
> Stok telur per grade/produk

| Kolom | Tipe | Notes |
|-------|------|-------|
| `id` | uuid PK | |
| `tenant_id` | uuid FK → tenants | |
| `product_name` | text | |
| `egg_grade` | text | `'hero'` \| `'standard'` \| `'salted'` |
| `current_stock_butir` | integer | |
| `cost_per_egg` | integer | (HPP per butir) |
| `packaging_cost` | integer | |
| `eggs_per_pack` | integer | default 10 |
| `sell_price_per_pack` | integer | |
| `cost_per_pack` | integer | ⚠️ **GENERATED** (`cost_per_egg * eggs_per_pack + packaging_cost`) |
| `low_stock_threshold` | integer | |
| `is_deleted` | boolean | |

---

### `egg_customers`
> Database pembeli telur (CRM)

| Kolom | Tipe | Notes |
|-------|------|-------|
| `id` | uuid PK | |
| `tenant_id` | uuid FK → tenants | |
| `name` | text | |
| `phone` | text | |
| `total_spent` | bigint | automated via sales trigger |
| `total_orders` | integer | automated via sales trigger |
| `is_deleted` | boolean | |

---

### `egg_sales`
> Penjualan telur (Header)

| Kolom | Tipe | Notes |
|-------|------|-------|
| `id` | uuid PK | |
| `tenant_id` | uuid FK → tenants | |
| `customer_id` | uuid FK → egg_customers | nullable |
| `invoice_number` | text | UNIQUE (format `EP-YYYYMMDD-001`) |
| `customer_name` | text | NOT NULL (denormalized for quick search) |
| `total_price` | bigint | |
| `total_cost` | bigint | (total HPP) |
| `net_profit` | bigint | ⚠️ **GENERATED** (`total_price - total_cost`) |
| `payment_status` | text | `'pending'` \| `'lunas'` \| `'piutang'` |
| `fulfillment_status`| text | `'processing'` \| `'on_delivery'` \| `'completed'` |
| `transaction_date` | date | |
| `is_deleted` | boolean | |

---

### `egg_sale_items`
> Item produk dalam satu invoice penjualan

| Kolom | Tipe | Notes |
|-------|------|-------|
| `id` | uuid PK | |
| `sale_id` | uuid FK → egg_sales | |
| `inventory_id` | uuid FK → egg_inventory | |
| `qty_pack` | integer | |
| `price_per_pack` | integer | |
| `subtotal` | bigint | ⚠️ **GENERATED** (`qty_pack * price_per_pack`) |

---

### `egg_stock_logs`
> Histori mutasi stok (In/Out/Adj)

| Kolom | Tipe | Notes |
|-------|------|-------|
| `id` | uuid PK | |
| `tenant_id` | uuid FK → tenants | |
| `inventory_id` | uuid FK → egg_inventory | |
| `sale_id` | uuid FK → egg_sales | nullable |
| `supplier_id` | uuid FK → egg_suppliers | nullable |
| `log_type` | text | `'in'` \| `'out'` \| `'adj'` |
| `qty_butir` | integer | (+/-) |
| `unit_price` | integer | nullable |
| `created_by` | uuid FK → profiles | |

---

### `profiles`
> Satu user (`auth.users`) bisa punya banyak profile (satu per tenant) untuk mendukung multi-tenancy.

| Kolom | Tipe | Notes |
|-------|------|-------|
| `id` | uuid PK | |
| `tenant_id` | uuid FK → tenants | NOT NULL |
| `auth_user_id` | uuid FK → auth.users | NOT NULL (Bisa duplikat antar tenant) |
| `full_name` | text | nullable |
| `role` | text | `'owner'` `'staff'` `'superadmin'` `'view_only'` `'sopir'` |
| `user_type` | text | `'broker'` `'peternak'` `'rpa'` `'superadmin'` |
| `phone` | text | nullable |
| `avatar_url` | text | nullable |
| `is_active` | boolean | default true |
| `onboarded` | boolean | default false |
| `business_model_selected` | boolean | default false |
| `last_seen_at` | timestamptz | nullable |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

**Hook**: `useAuth()` → `supabase.from('profiles').select('*, tenants(*)')`

---

### `farms`
> Kandang ayam milik peternak, dikelola oleh broker

| Kolom | Tipe | Notes |
|-------|------|-------|
| `id` | uuid PK | |
| `tenant_id` | uuid FK → tenants | NOT NULL |
| `farm_name` | text | NOT NULL |
| `owner_name` | text | NOT NULL |
| `phone` | text | nullable |
| `location` | text | nullable |
| `address` | text | nullable |
| `latitude` | numeric | nullable |
| `longitude` | numeric | nullable |
| `chicken_type` | text | `'broiler'` `'kampung'` `'pejantan'` `'layer'` `'petelur'` |
| `capacity` | integer | nullable |
| `available_stock` | integer | default 0 |
| `avg_weight_kg` | numeric | nullable |
| `harvest_date` | date | nullable |
| `status` | text | `'ready'` `'growing'` `'empty'` |
| `quality_rating` | smallint | 1–5, nullable |
| `quality_notes` | text | nullable |
| `last_transaction_date` | date | nullable |
| `notes` | text | nullable |
| `is_deleted` | boolean | default false |

**Hook**: `useFarms()` — queryKey `['farms', tenant.id]`

---

### `purchases`
> Pembelian ayam dari kandang

| Kolom | Tipe | Notes |
|-------|------|-------|
| `id` | uuid PK | |
| `tenant_id` | uuid FK → tenants | NOT NULL |
| `farm_id` | uuid FK → farms | NOT NULL |
| `batch_id` | uuid FK → chicken_batches | nullable |
| `quantity` | integer | NOT NULL, > 0 |
| `avg_weight_kg` | numeric | NOT NULL, > 0 |
| `total_weight_kg` | numeric | NOT NULL |
| `price_per_kg` | integer | NOT NULL, > 0 |
| `total_cost` | bigint | NOT NULL |
| `transport_cost` | integer | default 0 |
| `other_cost` | integer | default 0 |
| `total_modal` | bigint | ⚠️ **GENERATED** — NEVER INSERT |
| `transaction_date` | date | NOT NULL |
| `notes` | text | nullable |
| `is_deleted` | boolean | default false |

**Hook**: `usePurchases()` — queryKey `['purchases', tenant.id]`
**Join**: `.select('*, farms(farm_name)')`

---

### `sales`
> Penjualan ayam ke RPA/buyer

| Kolom | Tipe | Notes |
|-------|------|-------|
| `id` | uuid PK | |
| `tenant_id` | uuid FK → tenants | NOT NULL |
| `rpa_id` | uuid FK → rpa_clients | NOT NULL |
| `purchase_id` | uuid FK → purchases | NOT NULL |
| `order_id` | uuid FK → orders | nullable |
| `quantity` | integer | NOT NULL, > 0 |
| `avg_weight_kg` | numeric | NOT NULL |
| `total_weight_kg` | numeric | NOT NULL |
| `price_per_kg` | integer | NOT NULL, > 0 |
| `total_revenue` | bigint | NOT NULL |
| `delivery_cost` | integer | default 0 |
| `net_revenue` | bigint | ⚠️ **GENERATED** — NEVER INSERT |
| `payment_status` | text | `'lunas'` `'belum_lunas'` `'sebagian'` |
| `paid_amount` | bigint | default 0 |
| `remaining_amount` | bigint | ⚠️ **GENERATED** — NEVER INSERT |
| `transaction_date` | date | NOT NULL |
| `due_date` | date | nullable |
| `notes` | text | nullable |
| `is_deleted` | boolean | default false |

**Hook**: `useSales()` — queryKey `['sales', tenant.id]`
**Join**: `.select('*, rpa_clients(rpa_name), purchases(total_cost, farm_id, farms(farm_name)), deliveries(status)')`

---

### `deliveries`
> Pengiriman ayam dari kandang ke buyer

| Kolom | Tipe | Notes |
|-------|------|-------|
| `id` | uuid PK | |
| `tenant_id` | uuid FK → tenants | NOT NULL |
| `sale_id` | uuid FK → sales | NOT NULL |
| `vehicle_id` | uuid FK → vehicles | nullable |
| `driver_id` | uuid FK → drivers | nullable |
| `vehicle_type` | text | nullable |
| `vehicle_plate` | text | nullable |
| `driver_name` | text | nullable |
| `driver_phone` | text | nullable |
| `load_time` | timestamptz | nullable |
| `departure_time` | timestamptz | nullable |
| `arrival_time` | timestamptz | nullable |
| `initial_count` | integer | NOT NULL |
| `arrived_count` | integer | nullable |
| `mortality_count` | integer | default 0 |
| `initial_weight_kg` | numeric | nullable |
| `arrived_weight_kg` | numeric | nullable |
| `shrinkage_kg` | numeric | ⚠️ **GENERATED** — NEVER INSERT |
| `delivery_cost` | integer | default 0 |
| `status` | text | `'preparing'` `'loading'` `'on_route'` `'arrived'` `'completed'` |
| `notes` | text | nullable |
| `is_deleted` | boolean | default false |

**Hook**: `useDeliveries(statusFilter)` — queryKey `['deliveries', statusFilter]`
**Note**: `load_time` & `departure_time` simpan sebagai timestamptz — hati-hati timezone WIB (UTC+7)

---

### `rpa_clients`
> Daftar buyer/pembeli (RPA, pasar, restoran, dll)

| Kolom | Tipe | Notes |
|-------|------|-------|
| `id` | uuid PK | |
| `tenant_id` | uuid FK → tenants | NOT NULL |
| `rpa_name` | text | NOT NULL |
| `buyer_type` | text | `'rpa'` `'pedagang_pasar'` `'restoran'` `'pengepul'` `'supermarket'` `'lainnya'` |
| `contact_person` | text | nullable |
| `phone` | text | nullable |
| `location` | text | nullable |
| `address` | text | nullable |
| `payment_terms` | text | `'cash'` `'net3'` `'net7'` `'net14'` `'net30'` |
| `credit_limit` | bigint | default 0 |
| `total_outstanding` | bigint | default 0 |
| `avg_volume_per_order` | integer | nullable |
| `preferred_chicken_size` | text | nullable |
| `preferred_chicken_type` | text | default `'broiler'` |
| `last_deal_price` | integer | nullable |
| `reliability_score` | smallint | 1–5, nullable |
| `notes` | text | nullable |
| `is_deleted` | boolean | default false |

**Hook**: `useRPA()` — queryKey `['rpa-clients', tenant.id]`

---

### `vehicles`
> Kendaraan pengiriman

| Kolom | Tipe | Notes |
|-------|------|-------|
| `id` | uuid PK | |
| `tenant_id` | uuid FK → tenants | NOT NULL |
| `vehicle_type` | text | `'truk'` `'pickup'` `'l300'` `'motor'` `'lainnya'` |
| `vehicle_plate` | text | NOT NULL — selalu UPPERCASE |
| `brand` | text | nullable |
| `year` | integer | nullable |
| `capacity_ekor` | integer | nullable |
| `capacity_kg` | numeric | nullable |
| `ownership` | text | `'milik_sendiri'` `'sewa'` `'pinjaman'` |
| `rental_cost` | integer | nullable |
| `rental_owner` | text | nullable |
| `status` | text | `'aktif'` `'nonaktif'` `'servis'` |
| `last_service_date` | date | nullable |
| `notes` | text | nullable |
| `is_deleted` | boolean | default false |

---

### `drivers`
> Data sopir pengiriman

| Kolom | Tipe | Notes |
|-------|------|-------|
| `id` | uuid PK | |
| `tenant_id` | uuid FK → tenants | NOT NULL |
| `full_name` | text | NOT NULL |
| `phone` | text | NOT NULL |
| `sim_number` | text | nullable |
| `sim_type` | text | `'A'` `'B1'` `'B2'` `'C'` |
| `sim_expires_at` | date | nullable |
| `status` | text | `'aktif'` `'nonaktif'` `'cuti'` |
| `wage_per_trip` | integer | default 0 |
| `address` | text | nullable |
| `notes` | text | nullable |
| `is_deleted` | boolean | default false |

---

### `loss_reports`
> Laporan kerugian (mortalitas, susut, dll)

| Kolom | Tipe | Notes |
|-------|------|-------|
| `id` | uuid PK | |
| `tenant_id` | uuid FK → tenants | NOT NULL |
| `sale_id` | uuid FK → sales | nullable |
| `delivery_id` | uuid FK → deliveries | nullable |
| `loss_type` | text | `'mortality'` `'underweight'` `'sick'` `'buyer_complaint'` `'shrinkage'` `'other'` |
| `chicken_count` | integer | default 0 |
| `weight_loss_kg` | numeric | default 0 |
| `price_per_kg` | integer | nullable |
| `financial_loss` | bigint | nullable |
| `description` | text | nullable |
| `resolved` | boolean | default false |
| `resolved_at` | timestamptz | nullable |
| `report_date` | date | NOT NULL |
| `is_deleted` | boolean | default false |

**Hook**: `useLossReports()` — queryKey `['loss-reports']`
**Auto-created**: `useUpdateDelivery.updateTiba()` otomatis insert loss_report jika mortality > 0

---

### `vehicle_expenses`
> Biaya operasional kendaraan

| Kolom | Tipe | Notes |
|-------|------|-------|
| `id` | uuid PK | |
| `tenant_id` | uuid FK → tenants | NOT NULL |
| `vehicle_id` | uuid FK → vehicles | NOT NULL |
| `expense_type` | text | `'bbm'` `'servis'` `'pajak'` `'sewa'` `'lainnya'` |
| `amount` | bigint | NOT NULL, > 0 |
| `description` | text | nullable |
| `expense_date` | date | NOT NULL |
| `is_deleted` | boolean | default false |

---

### `payments`
> Pembayaran dari RPA ke broker (per sale)

| Kolom | Tipe | Notes |
|-------|------|-------|
| `id` | uuid PK | |
| `tenant_id` | uuid FK → tenants | NOT NULL |
| `sale_id` | uuid FK → sales | NOT NULL |
| `amount` | bigint | NOT NULL, > 0 |
| `payment_date` | date | NOT NULL |
| `payment_method` | text | `'transfer'` `'cash'` `'giro'` `'qris'` |
| `reference_no` | text | nullable |
| `notes` | text | nullable |

⚠️ **Note**: Kolom `is_deleted` TIDAK ADA di tabel ini. Jangan filter `is_deleted` di query.

---

### `extra_expenses`
> Biaya operasional tambahan (bukan pengiriman)

| Kolom | Tipe | Notes |
|-------|------|-------|
| `id` | uuid PK | |
| `tenant_id` | uuid FK → tenants | NOT NULL |
| `category` | text | `'tenaga_kerja'` `'sewa'` `'administrasi'` `'komunikasi'` `'lainnya'` |
| `description` | text | NOT NULL |
| `amount` | bigint | NOT NULL, > 0 |
| `expense_date` | date | NOT NULL |
| `notes` | text | nullable |
| `is_deleted` | boolean | default false |

---

### `market_prices`
> Harga pasar ayam — GLOBAL (tidak ada tenant_id)

| Kolom | Tipe | Notes |
|-------|------|-------|
| `id` | uuid PK | |
| `price_date` | date | NOT NULL — pakai `price_date` bukan `date` |
| `chicken_type` | text | default `'broiler'` |
| `region` | text | default `'nasional'` |
| `farm_gate_price` | integer | nullable |
| `avg_buy_price` | integer | nullable — fallback ke `farm_gate_price` |
| `avg_sell_price` | integer | nullable — fallback ke `buyer_price` |
| `buyer_price` | integer | nullable |
| `broker_margin` | integer | ⚠️ **GENERATED** — NEVER INSERT |
| `transaction_count` | integer | default 1 |
| `source` | text | `'transaction'` `'manual'` `'import'` `'auto_scraper'` |
| `source_url` | text | nullable |
| `is_deleted` | boolean | default false |

**Unique constraint**: `(price_date, chicken_type, region)`

---

### `chicken_batches`
> Stok virtual ayam per kandang

| Kolom | Tipe | Notes |
|-------|------|-------|
| `id` | uuid PK | |
| `tenant_id` | uuid FK → tenants | NOT NULL |
| `farm_id` | uuid FK → farms | NOT NULL |
| `batch_code` | text | nullable |
| `chicken_type` | text | `'broiler'` `'kampung'` `'pejantan'` `'layer'` |
| `initial_count` | integer | NOT NULL, > 0 |
| `current_count` | integer | NOT NULL |
| `avg_weight_kg` | numeric | nullable |
| `age_days` | integer | nullable |
| `estimated_harvest_date` | date | nullable |
| `status` | text | `'growing'` `'ready'` `'booked'` `'sold'` `'cancelled'` |
| `quality_notes` | text | nullable |
| `is_deleted` | boolean | default false |

**Hook**: `useChickenBatches(statusFilter)` — queryKey `['chicken-batches', statusFilter]`

---

### `orders`
> Order pembelian dari RPA ke broker

| Kolom | Tipe | Notes |
|-------|------|-------|
| `id` | uuid PK | |
| `tenant_id` | uuid FK → tenants | NOT NULL |
| `rpa_id` | uuid FK → rpa_clients | NOT NULL |
| `chicken_type` | text | default `'broiler'` |
| `requested_count` | integer | NOT NULL, > 0 |
| `requested_weight_kg` | numeric | nullable |
| `target_price_per_kg` | integer | nullable |
| `preferred_size` | text | nullable |
| `requested_date` | date | nullable |
| `status` | text | `'open'` `'matched'` `'partial'` `'completed'` `'cancelled'` |
| `matched_farm_id` | uuid FK → farms | nullable |
| `matched_batch_id` | uuid FK → chicken_batches | nullable |
| `notes` | text | nullable |
| `is_deleted` | boolean | default false |

---

### `team_invitations`
> Undangan anggota tim

| Kolom | Tipe | Notes |
|-------|------|-------|
| `id` | uuid PK | |
| `tenant_id` | uuid FK → tenants | NOT NULL |
| `invited_by` | uuid FK → profiles | NOT NULL |
| `email` | text | **nullable** |
| `role` | text | `'owner'` `'staff'` `'view_only'` `'sopir'` |
| `token` | text | 6 karakter uppercase, kode undangan |
| `status` | text | `'pending'` `'accepted'` `'expired'` |
| `expires_at` | timestamptz | default now()+7 days |

⚠️ Kolom `is_deleted` TIDAK ADA di tabel ini  
⚠️ Kolom `email` nullable — tidak diisi saat generate kode undangan  
⚠️ Gunakan `expires_at` bukan `expired_at`

---

### `notifications`
> Notifikasi per tenant

| Kolom | Tipe | Notes |
|-------|------|-------|
| `id` | uuid PK | |
| `tenant_id` | uuid FK → tenants | NOT NULL |
| `type` | text | `'piutang_jatuh_tempo'` `'kandang_siap_panen'` `'order_masuk'` `'pengiriman_tiba'` `'loss_laporan'` `'harga_pasar_update'` `'subscription_expires'` `'system'` |
| `title` | text | NOT NULL |
| `body` | text | nullable |
| `is_read` | boolean | default false |
| `action_url` | text | nullable |
| `metadata` | jsonb | nullable |

---

### `subscription_invoices`
> Invoice langganan SaaS

| Kolom | Tipe | Notes |
|-------|------|-------|
| `id` | uuid PK | |
| `tenant_id` | uuid FK → tenants | NOT NULL |
| `invoice_number` | text | UNIQUE |
| `amount` | integer | NOT NULL |
| `plan` | text | `'starter'` `'pro'` `'business'` |
| `billing_period` | text | nullable |
| `billing_months` | integer | default 1 |
| `status` | text | `'pending'` `'paid'` `'expired'` `'cancelled'` |
| `transfer_proof_url` | text | nullable |
| `confirmed_by` | uuid FK → profiles | nullable |
| `confirmed_at` | timestamptz | nullable |

---

### `peternak_farms` *(Fase 2)*
> Kandang milik peternak (beda dari `farms` milik broker)

| Kolom | Tipe | Notes |
|-------|------|-------|
| `id` | uuid PK | |
| `tenant_id` | uuid FK → tenants | NOT NULL |
| `farm_name` | text | NOT NULL |
| `location` | text | nullable |
| `capacity` | integer | NOT NULL |
| `kandang_count` | integer | default 1 |
| `is_active` | boolean | default true |
| `is_deleted` | boolean | default false |

---

### `breeding_cycles` *(Fase 2)*
> Siklus pemeliharaan ayam per peternak

| Kolom | Tipe | Notes |
|-------|------|-------|
| `id` | uuid PK | |
| `tenant_id` | uuid FK → tenants | |
| `peternak_farm_id` | uuid FK → peternak_farms | |
| `cycle_number` | integer | |
| `chicken_type` | text | default `'broiler'` |
| `doc_count` | integer | jumlah DOC masuk |
| `status` | text | `'active'` `'harvested'` `'failed'` `'cancelled'` |
| `total_feed_kg` | numeric | |
| `total_mortality` | integer | |
| `final_fcr` | numeric | nullable |
| `final_ip_score` | numeric | nullable |
| `is_deleted` | boolean | |

---

### `daily_records` *(Fase 2)*
> Catatan harian siklus peternak

| Kolom | Tipe | Notes |
|-------|------|-------|
| `id` | uuid PK | |
| `tenant_id` | uuid FK → tenants | |
| `cycle_id` | uuid FK → breeding_cycles | |
| `record_date` | date | |
| `age_days` | integer | |
| `mortality_count` | integer | |
| `feed_kg` | numeric | |
| `avg_weight_kg` | numeric | nullable |

---

### `stock_listings` *(Fase 2/3)*
> Listing stok peternak yang bisa dilihat broker

| Kolom | Tipe | Notes |
|-------|------|-------|
| `id` | uuid PK | |
| `peternak_tenant_id` | uuid FK → tenants | |
| `cycle_id` | uuid FK → breeding_cycles | nullable |
| `available_count` | integer | |
| `status` | text | `'available'` `'booked'` `'sold'` `'expired'` |
| `visible_to` | text | `'connected'` `'public'` |

---

### `broker_connections` *(Fase 2/3)*
> Relasi koneksi antara peternak ↔ broker

| Kolom | Tipe | Notes |
|-------|------|-------|
| `id` | uuid PK | |
| `peternak_tenant_id` | uuid FK → tenants | |
| `broker_tenant_id` | uuid FK → tenants | |
| `status` | text | `'pending'` `'active'` `'blocked'` |

---

### `rpa_profiles` *(Fase 3)*
> Profile RPA sebagai tenant mandiri

| Kolom | Tipe | Notes |
|-------|------|-------|
| `id` | uuid PK | |
| `tenant_id` | uuid FK → tenants | |
| `rpa_type` | text | `'rpa'` `'pedagang_pasar'` `'restoran'` `'supermarket'` `'pengepul'` `'lainnya'` |
| `is_verified` | boolean | |
| `is_deleted` | boolean | |

---

### `rpa_purchase_orders` *(Fase 3)*
> PO dari RPA tenant ke broker tenant

| Kolom | Tipe | Notes |
|-------|------|-------|
| `id` | uuid PK | |
| `rpa_tenant_id` | uuid FK → tenants | |
| `broker_tenant_id` | uuid FK → tenants | nullable |
| `status` | text | `'open'` `'responded'` `'confirmed'` `'delivered'` `'completed'` `'cancelled'` |
| `is_deleted` | boolean | |

---

### `rpa_payments` *(Fase 3)*
> Pembayaran antar tenant (RPA → Broker)

| Kolom | Tipe | Notes |
|-------|------|-------|
| `id` | uuid PK | |
| `rpa_tenant_id` | uuid FK → tenants | |
| `broker_tenant_id` | uuid FK → tenants | |
| `payment_method` | text | `'transfer'` `'cash'` `'giro'` `'qris'` |

---

### `feed_stocks` *(Fase 2)*
> Stok pakan per kandang peternak

| Kolom | Tipe | Notes |
|-------|------|-------|
| `id` | uuid PK | |
| `tenant_id` | uuid FK → tenants | |
| `peternak_farm_id` | uuid FK → peternak_farms | |
| `feed_type` | text | |
| `quantity_kg` | numeric | |

---

### `payment_settings`
> Rekening bank penerima pembayaran (global)

| Kolom | Tipe | Notes |
|-------|------|-------|
| `id` | uuid PK | |
| `bank_name` | text | NOT NULL |
| `account_number` | text | NOT NULL |
| `account_name` | text | NOT NULL |
| `is_active` | boolean | default true |

---

## 🔗 FOREIGN KEY QUICK REFERENCE

| Tabel | Kolom FK | → Target |
|-------|----------|----------|
| profiles | tenant_id | tenants.id |
| profiles | auth_user_id | auth.users.id |
| farms | tenant_id | tenants.id |
| purchases | tenant_id | tenants.id |
| purchases | farm_id | farms.id |
| purchases | batch_id | chicken_batches.id |
| sales | tenant_id | tenants.id |
| sales | rpa_id | rpa_clients.id |
| sales | purchase_id | purchases.id |
| sales | order_id | orders.id |
| deliveries | tenant_id | tenants.id |
| deliveries | sale_id | sales.id |
| deliveries | vehicle_id | vehicles.id |
| deliveries | driver_id | drivers.id |
| loss_reports | tenant_id | tenants.id |
| loss_reports | sale_id | sales.id |
| loss_reports | delivery_id | deliveries.id |
| payments | tenant_id | tenants.id |
| payments | sale_id | sales.id |
| vehicle_expenses | tenant_id | tenants.id |
| vehicle_expenses | vehicle_id | vehicles.id |
| chicken_batches | tenant_id | tenants.id |
| chicken_batches | farm_id | farms.id |
| orders | tenant_id | tenants.id |
| orders | rpa_id | rpa_clients.id |
| orders | matched_farm_id | farms.id |
| orders | matched_batch_id | chicken_batches.id |
| team_invitations | tenant_id | tenants.id |
| team_invitations | invited_by | profiles.id |
| notifications | tenant_id | tenants.id |
| subscription_invoices | tenant_id | tenants.id |
| subscription_invoices | confirmed_by | profiles.id |
| breeding_cycles | tenant_id | tenants.id |
| breeding_cycles | peternak_farm_id | peternak_farms.id |
| daily_records | tenant_id | tenants.id |
| daily_records | cycle_id | breeding_cycles.id |
| stock_listings | peternak_tenant_id | tenants.id |
| stock_listings | cycle_id | breeding_cycles.id |
| broker_connections | peternak_tenant_id | tenants.id |
| broker_connections | broker_tenant_id | tenants.id |
| rpa_profiles | tenant_id | tenants.id |
| rpa_purchase_orders | rpa_tenant_id | tenants.id |
| rpa_purchase_orders | broker_tenant_id | tenants.id |
| rpa_payments | rpa_tenant_id | tenants.id |
| rpa_payments | broker_tenant_id | tenants.id |
| feed_stocks | tenant_id | tenants.id |
| feed_stocks | peternak_farm_id | peternak_farms.id |

---

## ⚡ GENERATED COLUMNS (JANGAN DI-INSERT)

| Tabel | Kolom | Formula |
|-------|-------|---------|
| `purchases` | `total_modal` | `total_cost + transport_cost + other_cost` |
| `sales` | `net_revenue` | `total_revenue - delivery_cost` |
| `sales` | `remaining_amount` | `total_revenue - paid_amount` |
| `deliveries` | `shrinkage_kg` | `initial_weight_kg - arrived_weight_kg` |
| `market_prices` | `broker_margin` | `buyer_price - farm_gate_price` |

---

## 🏷️ ENUM VALUES MASTER LIST

```js
// Status
farms.status:            'ready' | 'growing' | 'empty'
deliveries.status:       'preparing' | 'loading' | 'on_route' | 'arrived' | 'completed'
sales.payment_status:    'lunas' | 'belum_lunas' | 'sebagian'
vehicles.status:         'aktif' | 'nonaktif' | 'servis'
drivers.status:          'aktif' | 'nonaktif' | 'cuti'
orders.status:           'open' | 'matched' | 'partial' | 'completed' | 'cancelled'
chicken_batches.status:  'growing' | 'ready' | 'booked' | 'sold' | 'cancelled'
breeding_cycles.status:  'active' | 'harvested' | 'failed' | 'cancelled'
team_invitations.status: 'pending' | 'accepted' | 'expired'
broker_connections.status: 'pending' | 'active' | 'blocked'

// Types
rpa_clients.buyer_type:  'rpa' | 'pedagang_pasar' | 'restoran' | 'pengepul' | 'supermarket' | 'lainnya'
rpa_clients.payment_terms: 'cash' | 'net3' | 'net7' | 'net14' | 'net30'
vehicles.vehicle_type:   'truk' | 'pickup' | 'l300' | 'motor' | 'lainnya'
vehicles.ownership:      'milik_sendiri' | 'sewa' | 'pinjaman'
drivers.sim_type:        'A' | 'B1' | 'B2' | 'C'
farms.chicken_type:      'broiler' | 'kampung' | 'pejantan' | 'layer' | 'petelur'
loss_reports.loss_type:  'mortality' | 'underweight' | 'sick' | 'buyer_complaint' | 'shrinkage' | 'other'
extra_expenses.category: 'tenaga_kerja' | 'sewa' | 'administrasi' | 'komunikasi' | 'lainnya'
vehicle_expenses.expense_type: 'bbm' | 'servis' | 'pajak' | 'sewa' | 'lainnya'
market_prices.source:    'transaction' | 'manual' | 'import' | 'auto_scraper'
tenants.plan:            'starter' | 'pro' | 'business'
profiles.role:           'owner' | 'staff' | 'superadmin' | 'view_only' | 'sopir'
profiles.user_type:      'broker' | 'peternak' | 'rpa' | 'superadmin'
payments.payment_method: 'transfer' | 'cash' | 'giro' | 'qris'

// Egg Broker Vertical
egg_inventory.egg_grade: 'hero' | 'standard' | 'salted'
egg_sales.payment_status: 'pending' | 'lunas' | 'piutang'
egg_sales.fulfillment_status: 'processing' | 'on_delivery' | 'completed'
egg_stock_logs.log_type: 'in' | 'out' | 'adj'
```

---

## 🔐 RBAC — Role Based Access Control

### Akses per role:

| Role | Beranda | Transaksi | Kandang | Pengiriman | RPA | Cash Flow | Armada | Tim & Akses | Simulator |
|------|---------|-----------|---------|------------|-----|-----------|--------|-------------|-----------|
| owner | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| staff | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| view_only | ✅ | ✅ (read) | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| sopir | ❌ | ❌ | ❌ | ✅ (own only) | ❌ | ❌ | ❌ | ❌ | ❌ |

### Route per role setelah login:
- owner → `/broker/beranda`
- staff → `/broker/beranda`
- view_only → `/broker/beranda`
- sopir → `/broker/sopir`

### Komponen guard:
- `RoleGuard` di `App.jsx` wraps route sensitif
- `allowedRoles` prop berisi array role yang diizinkan

---

## 🎫 SISTEM UNDANGAN TIM

### Flow generate kode (Tim.jsx):
1. Owner klik "Generate Kode Undangan"
2. Generate kode 6 karakter random uppercase
3. Insert ke `team_invitations`:
   `{ tenant_id, invited_by, token: kode, role, status: 'pending', expires_at: now() + 7 hari }`
   ✗ JANGAN insert email — nullable

### Flow join via kode (Register.jsx):
1. Staff pilih mode "Punya Kode Undangan"
2. Input kode 6 digit
3. Query: `SELECT * FROM team_invitations WHERE token = kode AND status = 'pending'`
   ✗ JANGAN filter `is_deleted` — kolom tidak ada
   ✗ JANGAN filter `expires_at` di query — cek manual setelah dapat data
4. `signUp` dengan `options.data.invite_token = kode`
5. Trigger DB handle sisanya otomatis

### RLS yang dibutuhkan:
- `team_invitations`: anon dan authenticated bisa SELECT
- `tenants`: anon dan authenticated bisa SELECT

---

### `handle_new_user()` — Updated Logic (2026-03-22)

Trigger: `AFTER INSERT ON auth.users`

**Logic baru**:
- Cek `raw_user_meta_data->>'invite_token'`
- Jika ada `invite_token`:
  → Cari `team_invitations WHERE token = invite_token AND status = 'pending'`
  → Insert `profiles` dengan `tenant_id` dari invitation
  → role = role dari invitation (default 'staff'), onboarded = true, business_model_selected = true
  → Update `team_invitations SET status = 'accepted'`
- Jika tidak ada `invite_token`:
  → Buat tenant baru (owner flow seperti biasa)
  → onboarded = false, business_model_selected = false

Frontend wajib kirim `invite_token` di:
```js
supabase.auth.signUp({
  options: { data: { invite_token: 'KODE6DIGIT', full_name: '...' } }
})
```

---

### `trigger_auto_resolve_loss_reports`
**Tabel**: `sales`
**Event**: `AFTER UPDATE OF payment_status`
**Function**: `auto_resolve_loss_reports()`

**Logic**:
- Ketika `sales.payment_status` berubah → `'lunas'`:
  → `UPDATE loss_reports SET resolved=true, resolved_at=now() WHERE sale_id=NEW.id`
- Ketika `sales.payment_status` berubah dari `'lunas'` ke status lain:
  → `UPDATE loss_reports SET resolved=false, resolved_at=null WHERE sale_id=NEW.id`

**Implikasi untuk frontend**:
- Jangan manual set `resolved=true` di loss_reports dari frontend
- Cukup update `sales.payment_status = 'lunas'` → trigger otomatis handle sisanya
- Invalidate query `['loss-reports']` setelah update payment_status

---

---

## 💰 STANDARD FORMULA
> Gunakan formula ini untuk perhitungan di seluruh aplikasi broker.

```js
export const calcNetProfit = (sale) => {
  const revenue = Number(sale?.total_revenue) || 0
  const totalCost = Number(sale?.purchases?.total_cost) || 0
  const transportCost = Number(sale?.purchases?.transport_cost) || 0
  const otherCost = Number(sale?.purchases?.other_cost) || 0
  const deliveryCost = Number(sale?.delivery_cost) || 0
  return revenue - totalCost - transportCost - otherCost - deliveryCost
  // CATATAN: shrinkage TIDAK dikurangi lagi karena total_revenue
  // sudah pakai bobot tiba (susut sudah tercermin otomatis)
}
```

### ✅ Target Verifikasi (Dashboard Broker)
Gunakan data `RPA UD Jaya` dan `RPA Jaya Abadi` sebagai benchmark:

- **RPA UD Jaya**:
  - `total_revenue`: Rp 245.247.405
  - `net_profit`: **+Rp 22.264.655**
- **RPA Jaya Abadi**:
  - `total_revenue`: Rp 41.365.000
  - `net_profit`: **+Rp 5.037.173**
- **Total Margin (Header Dashboard)**: **Rp 27.301.828**

---

## 📊 FASE IMPLEMENTASI

| Tabel | Fase | Status |
|-------|------|--------|
| tenants, profiles, farms, purchases, sales | Fase 1 | ✅ Active |
| deliveries, loss_reports, payments | Fase 1 | ✅ Active |
| rpa_clients, vehicles, drivers | Fase 1 | ✅ Active |
| vehicle_expenses, extra_expenses | Fase 1 | ✅ Active |
| market_prices, chicken_batches, orders | Fase 1 | ✅ Active |
| team_invitations, notifications | Fase 1 | ✅ Active |
| subscription_invoices, payment_settings | Fase 1 | ✅ Active |
| peternak_farms, breeding_cycles, daily_records | Fase 2 | 🚧 Planned |
| feed_stocks, stock_listings, broker_connections | Fase 2/3 | 🚧 Planned |
| rpa_profiles, rpa_purchase_orders, rpa_payments | Fase 3 | 🚧 Planned |

---

*TernakOS Database Structure — generated 2026-03-20*
