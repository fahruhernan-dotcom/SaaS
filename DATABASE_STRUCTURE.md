# TernakOS — Database Structure
> Generated from Supabase schema. Gunakan sebagai referensi Antigravity.
> Last updated: 2026-04-02 (Financial Transparency session: Fixed weight formatting to pure KG precision without ton abbreviation; Integrated `vehicle_expenses` into CashFlow via Promise.all; Decomposed Sale/Purchase costs into explicit transaction entries (Delivery Cost, Transport Cost, Other Cost) within CashFlow transaction list; Fixed Keseluruhan date filtering logic based on `tenant.created_at`)
> Previous update: 2026-04-01 v2 (Bug fixes session: Added `secondary_unit`+`conversion_rate` to `sembako_products`...)

---

## ⚠️ CRITICAL RULES

```
❌ NEVER INSERT generated columns:
   purchases.total_modal
   sales.net_revenue
   sales.remaining_amount
   deliveries.shrinkage_kg
   market_prices.broker_margin
   rpa_invoices.net_profit
   rpa_invoices.remaining_amount
   rpa_invoice_items.subtotal
   egg_inventory.cost_per_pack
   egg_sales.net_profit
   egg_sale_items.subtotal
   sembako_stock_batches.total_cost
   sembako_sales.gross_profit
   sembako_sales.net_profit
   sembako_sales.remaining_amount
   sembako_sale_items.subtotal
   sembako_sale_items.cogs_total
   sembako_payroll.total_pay

❌ NEVER use `broker_connections.peternak_tenant_id` (deprecated)
❌ NEVER use `broker_connections.broker_tenant_id` (deprecated)
❌ NEVER insert `sembako_deliveries.customer_id` (column removed/invalid)
✅ sembako_payments: pakai `reference_number` (bukan `reference_no`, meski keduanya ada di DB)
✅ sembako_payments, sembako_supplier_payments, payments, rpa_customer_payments: Semua punya `is_deleted` — filter `.eq('is_deleted', false)` saat read
✅ broker_connections: pakai `requester_tenant_id` + `target_tenant_id`
✅ market_listings `view_count`: pakai RPC, bukan `.update()` langsung
✅ Admin UI: Gunakan Lucide icons (Bird, Egg, Home, Factory), JANGAN emoji.
✅ sembako_employees: status pegawai pakai kolom `status` (text: `'aktif'` | `'nonaktif'`) — BUKAN `is_active` boolean. Filter aktif: `.eq('status', 'aktif')` atau `e.status === 'aktif'` di frontend.
✅ sembako_products: punya kolom `secondary_unit` (text, nullable) dan `conversion_rate` (numeric, nullable) — ditambahkan via migration `20260401_sembako_products_unit_conversion.sql`. Konversi empty string ke null sebelum insert: `conversion_rate: form.conversion_rate ? Number(form.conversion_rate) : null`.
✅ sembako_stock_out: kolom `qty_keluar` (BUKAN `qty_out`). Kolom `reason` ADA (`'sale'` | `'expired'` | `'adjustment'`). Wajib diinsert saat FIFO penjualan — dipakai untuk reversal saat delete sale.
⚠️ FIFO penjualan WAJIB insert ke `sembako_stock_out`: Setiap deduction batch di `useCreateSembakoSale` HARUS diikuti insert ke `sembako_stock_out` (batch_id, qty_keluar, sale_id, reason='sale'). Tanpa ini, `useDeleteSembakoSale` tidak bisa restore stok ke batch yang benar.
⚠️ sembako_deliveries: Sebelumnya punya RLS policy `sembako_deliveries_all` yang memakai `my_tenant_id()` + `my_role()` (berbeda dari `get_my_tenant_id()`). Sudah diganti bulletproof pattern via `20260401_fix_all_rls_bulletproof.sql`.
⚠️ broker_connections tidak punya `is_deleted` — delete langsung jika cancel
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
        │     │     ├── cycle_expenses
        │     │     ├── harvest_records
        │     │     └── stock_listings
        │     ├── feed_stocks
        │     └── farm_workers   (peternak_farm_id)
        │           └── worker_payments (worker_id)
        ├── market_listings   (tenant_id)
        ├── broker_profiles   (tenant_id UNIQUE)
        ├── peternak_profiles (tenant_id UNIQUE)
        ├── rpa_profiles      (tenant_id)
        ├── rpa_products      (tenant_id)
        ├── rpa_customers     (tenant_id)
        │     └── rpa_invoices (tenant_id, customer_id)
        │           ├── rpa_invoice_items     (invoice_id)
        │           └── rpa_customer_payments (tenant_id, invoice_id, customer_id)
        ├── broker_connections (requester_tenant_id / target_tenant_id)
        └── rpa_purchase_orders (rpa_tenant_id / broker_tenant_id)

plan_configs ← GLOBAL, tidak ada tenant_id

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

market_prices    ← GLOBAL, tidak ada tenant_id
payment_settings ← GLOBAL
pricing_plans    ← GLOBAL, tidak ada tenant_id
discount_codes   ← GLOBAL, tidak ada tenant_id
```

### `SEMBAKO` Dependencies
```
tenants
  ├── sembako_products
  │     └── sembako_stock_batches (product_id, supplier_id)
  │           └── sembako_stock_out (batch_id, product_id, sale_id)
  ├── sembako_suppliers (referenced by sembako_stock_batches.supplier_id)
  ├── sembako_customers
  │     └── sembako_sales (tenant_id, customer_id)
  │           ├── sembako_sale_items (sale_id)
  │           └── sembako_payments (sale_id, customer_id, reference_number, is_deleted)
  ├── sembako_employees
  │     ├── sembako_payroll (employee_id)
  │     └── sembako_deliveries (employee_id)
  └── sembako_supplier_payments (supplier_id, reference_number, is_deleted)
  └── sembako_expenses
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
| `business_vertical` | text | `'poultry_broker'` \| `'egg_broker'` \| `'peternak'` \| `'rumah_potong'` \| `'sembako_broker'` |
| `sub_type` | text NOT NULL | `'broker_ayam'` \| `'broker_telur'` \| `'distributor_daging'` \| `'distributor_sembako'` \| `'peternak_broiler'` \| `'peternak_layer'` \| `'peternak_sapi'` \| `'peternak_domba'` \| `'peternak_kambing'` \| `'peternak_babi'` (coming soon) \| `'rpa'` \| `'rph'` |
| `kandang_limit` | integer | default 1 — batas kandang aktif (starter=1, pro=2, business=99) |
| `chicken_types` | text[] | nullable — jenis ayam yang diperdagangkan/diternak |
| `animal_types` | text[] | nullable — jenis hewan ternak lainnya |
| `area_operasi` | text | nullable — area operasi bisnis |
| `target_volume_monthly` | integer | nullable — target volume per bulan |
| `base_livestock_type` | text | nullable — jenis ternak utama (peternak) |
| `addon_livestock_types` | text[] | nullable — jenis ternak add-on (peternak PRO) |
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
| `customer_phone` | text | nullable |
| `total_price` | bigint | |
| `total_cost` | bigint | (total HPP) |
| `net_profit` | bigint | ⚠️ **GENERATED** (`total_price - total_cost`) |
| `payment_status` | text | `'pending'` \| `'lunas'` \| `'piutang'` |
| `payment_method` | text | nullable |
| `fulfillment_status`| text | `'processing'` \| `'on_delivery'` \| `'completed'` |
| `transaction_date` | date | |
| `due_date` | date | nullable |
| `notes` | text | nullable |
| `is_deleted` | boolean | |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

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
| `onboarding_completed_at` | timestamptz | nullable — diisi saat Flow A selesai |
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
| `is_deleted` | boolean | nullable — filter `.eq('is_deleted', false)` saat read |
| `created_at` | timestamptz | |

✅ `is_deleted` ADA di tabel ini — selalu filter `.eq('is_deleted', false)` saat read.

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
| `token` | text | 32-byte hex (64 karakter), kode undangan |
| `status` | text | `'pending'` `'accepted'` `'expired'` |
| `expires_at` | timestamptz | default now()+7 days |
| `is_deleted` | boolean | nullable |
| `created_at` | timestamptz | |

⚠️ Kolom `email` nullable — tidak diisi saat generate kode undangan  
⚠️ Gunakan `expires_at` bukan `expired_at`

---

### `notifications`
> Notifikasi per tenant

| Kolom | Tipe | Notes |
|-------|------|-------|
| `id` | uuid PK | |
| `tenant_id` | uuid FK → tenants | NOT NULL |
| `type` | text | `'piutang_jatuh_tempo'` `'kandang_siap_panen'` `'order_masuk'` `'pengiriman_tiba'` `'loss_laporan'` `'harga_pasar_update'` `'subscription_expires'` `'stok_pakan_menipis'` `'system'` |
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
| `invoice_number` | text | nullable |
| `amount` | integer | NOT NULL |
| `plan` | text | `'starter'` `'pro'` `'business'` |
| `billing_period` | text | nullable |
| `billing_months` | integer | default 1 |
| `status` | text | `'pending'` `'paid'` `'expired'` `'cancelled'` |
| `transfer_proof_url` | text | nullable |
| `payment_proof_url` | text | nullable |
| `payment_method` | text | default `'transfer'` |
| `bank_name` | text | nullable |
| `transfer_date` | date | nullable |
| `confirmed_by` | uuid FK → profiles | nullable |
| `confirmed_at` | timestamptz | nullable |
| `xendit_invoice_id` | text | nullable — ID invoice dari Xendit |
| `xendit_payment_url` | text | nullable — URL pembayaran Xendit |
| `paid_at` | timestamptz | nullable |
| `notes` | text | nullable |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

---

### `peternak_farms` *(Fase 2)*
> Kandang milik peternak (beda dari `farms` milik broker)

| Kolom | Tipe | Notes |
|-------|------|-------|
| `id` | uuid PK | |
| `tenant_id` | uuid FK → tenants | NOT NULL |
| `farm_name` | text | NOT NULL |
| `location` | text | nullable |
| `address` | text | nullable |
| `latitude` | numeric | nullable |
| `longitude` | numeric | nullable |
| `capacity` | integer | NOT NULL |
| `kandang_count` | integer | default 1 |
| `doc_capacity` | integer | default 0 — kapasitas DOC per siklus |
| `livestock_type` | text | `'ayam_broiler'` \| `'ayam_petelur'` |
| `animal_types` | text[] | nullable |
| `business_model` | text | `'mandiri'` \| `'mandiri_murni'` \| `'mandiri_semi'` \| `'mitra_penuh'` \| `'mitra_pakan'` \| `'mitra_sapronak'` |
| `mitra_company` | text | nullable — nama perusahaan mitra |
| `mitra_contract_price` | integer | nullable — harga kontrak per kg dari mitra |
| `mitra_contract_notes` | text | nullable |
| `is_active` | boolean | default true |
| `is_deleted` | boolean | default false |
| `notes` | text | nullable |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

---

### `breeding_cycles` *(Fase 2)*
> Siklus pemeliharaan ayam per peternak

| Kolom | Tipe | Notes |
|-------|------|-------|
| `id` | uuid PK | |
| `tenant_id` | uuid FK → tenants | |
| `peternak_farm_id` | uuid FK → peternak_farms | |
| `cycle_number` | integer | auto-increment per farm |
| `chicken_type` | text | default `'broiler'` |
| `doc_count` | integer | jumlah DOC masuk |
| `doc_price` | integer | nullable — harga per ekor DOC |
| `start_date` | date | tanggal chick-in |
| `target_harvest_date` | date | nullable |
| `actual_harvest_date` | date | nullable |
| `target_weight_kg` | numeric | default 1.9 |
| `target_fcr` | numeric | default 1.7 |
| `status` | text | `'active'` `'harvested'` `'failed'` `'cancelled'` |
| `total_feed_kg` | numeric | default 0 — total kumulatif pakan |
| `total_mortality` | integer | default 0 — total kumulatif mortalitas |
| `final_count` | integer | nullable — jumlah ekor saat panen |
| `final_avg_weight_kg` | numeric | nullable |
| `final_fcr` | numeric | nullable — diisi saat panen |
| `final_ip_score` | numeric | nullable — diisi saat panen |
| `total_production_cost` | bigint | default 0 |
| `cost_per_kg` | integer | nullable |
| `notes` | text | nullable |
| `is_deleted` | boolean | default false |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

> ⚠️ Tidak ada kolom `current_count` — gunakan `doc_count - total_mortality` untuk estimasi.
**Join**: `.select('*, peternak_farms(farm_name, livestock_type, business_model, capacity, mitra_company)')`

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
| `mortality_count` | integer | default 0 |
| `cull_count` | integer | default 0 |
| `feed_type` | text | nullable |
| `feed_kg` | numeric | default 0 |
| `sample_count` | integer | nullable |
| `sample_weight_kg` | numeric | nullable |
| `avg_weight_kg` | numeric | nullable |
| `temperature_morning` | numeric | nullable |
| `temperature_evening` | numeric | nullable |
| `health_notes` | text | nullable |
| `notes` | text | nullable |
| `created_at` | timestamptz | |

---

### `cycle_expenses` *(Fase 2)*
> Biaya produksi per siklus (DOC, pakan, obat, dll)

| Kolom | Tipe | Notes |
|-------|------|-------|
| `id` | uuid PK | |
| `tenant_id` | uuid FK → tenants | |
| `cycle_id` | uuid FK → breeding_cycles | |
| `expense_type` | text | `'doc'` \| `'pakan'` \| `'obat'` \| `'listrik'` \| `'lainnya'` |
| `description` | text | nullable |
| `qty` | numeric | nullable |
| `unit` | text | nullable (e.g. `'ekor'`, `'sak'`, `'liter'`) |
| `unit_price` | integer | nullable |
| `total_amount` | bigint | NOT NULL |
| `expense_date` | date | NOT NULL |
| `supplier` | text | nullable |
| `is_deleted` | boolean | default false |

**Usage**: SiklusSheet auto-insert row `expense_type='doc'` jika `showDocPrice` (model mandiri) dan `doc_price > 0`. LaporanSiklus aggregate per `expense_type`.

---

### `harvest_records` *(Fase 2)*
> Data panen per siklus

| Kolom | Tipe | Notes |
|-------|------|-------|
| `id` | uuid PK | |
| `tenant_id` | uuid FK → tenants | |
| `cycle_id` | uuid FK → breeding_cycles | |
| `harvest_date` | date | NOT NULL |
| `buyer_type` | text | nullable |
| `buyer_name` | text | nullable |
| `mitra_company` | text | nullable |
| `contract_price_per_kg` | integer | nullable |
| `total_ekor_panen` | integer | NOT NULL — jumlah ekor yang dipanen |
| `total_weight_kg` | numeric | NOT NULL — total bobot panen |
| `avg_weight_kg` | numeric | nullable |
| `price_per_kg` | integer | nullable — harga jual per kg |
| `total_revenue` | bigint | nullable |
| `deduction_sapronak` | bigint | default 0 |
| `net_revenue` | bigint | nullable — total pendapatan setelah deduction |
| `notes` | text | nullable |
| `is_deleted` | boolean | default false |

> ⚠️ Kolom adalah `total_ekor_panen` (BUKAN `total_count`).
**FCR Final** = `breeding_cycles.total_feed_kg ÷ SUM(harvest_records.total_weight_kg)`

---

### `kandang_workers` *(Fase 2)*
> Anak kandang / pekerja harian per farm peternak

> ⚠️ Nama tabel di DB adalah `kandang_workers` (BUKAN `farm_workers`).

| Kolom | Tipe | Notes |
|-------|------|-------|
| `id` | uuid PK | |
| `tenant_id` | uuid FK → tenants | |
| `peternak_farm_id` | uuid FK → peternak_farms | |
| `full_name` | text | NOT NULL |
| `phone` | text | nullable |
| `join_date` | date | nullable |
| `salary_type` | text | `'flat_bonus'` (satu-satunya nilai saat ini) |
| `base_salary` | integer | gaji pokok per bulan (IDR) |
| `bonus_per_kg` | integer | bonus per kg saat panen (IDR) |
| `bonus_threshold_fcr` | numeric | nullable — FCR threshold untuk dapat bonus |
| `status` | text | `'aktif'` \| `'nonaktif'` |
| `notes` | text | nullable |
| `is_deleted` | boolean | default false |

---

### `worker_payments` *(Fase 2)*
> Riwayat pembayaran gaji / bonus anak kandang

| Kolom | Tipe | Notes |
|-------|------|-------|
| `id` | uuid PK | |
| `tenant_id` | uuid FK → tenants | |
| `cycle_id` | uuid FK → breeding_cycles | |
| `worker_id` | uuid FK → kandang_workers | |
| `payment_type` | text | nullable |
| `amount` | bigint | NOT NULL |
| `payment_date` | date | NOT NULL |
| `notes` | text | nullable |
| `is_deleted` | boolean | nullable |

> ✅ `is_deleted` ADA. `cycle_id` ADA — bisa dipakai untuk filter per siklus.

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

### `broker_connections`
> Relasi koneksi antara peternak ↔ broker via Market

| Kolom | Tipe | Notes |
|-------|------|-------|
| `id` | uuid PK | |
| `requester_tenant_id` | uuid FK → tenants | |
| `requester_type` | text | business_vertical requester |
| `target_tenant_id` | uuid FK → tenants | |
| `target_type` | text | business_vertical target |
| `status` | text | `'pending'` \| `'active'` \| `'rejected'` \| `'blocked'` |
| `message` | text | nullable |
| `rejected_reason` | text | nullable |
| `responded_at` | timestamptz | nullable |
| `created_at` | timestamptz | |

⚠️ **Tanpa is_deleted**: Delete langsung jika cancel.  
⚠️ **Unique Constraint**: `(requester_tenant_id, target_tenant_id)`

---

### `rpa_profiles` *(Fase 3)*
> Profile RPA sebagai tenant mandiri

| Kolom | Tipe | Notes |
|-------|------|-------|
| `id` | uuid PK | |
| `tenant_id` | uuid FK → tenants | |
| `rpa_name` | text | NOT NULL |
| `rpa_type` | text | `'rpa'` `'pedagang_pasar'` `'restoran'` `'supermarket'` `'pengepul'` `'lainnya'` |
| `contact_person` | text | nullable |
| `phone` | text | nullable |
| `address` | text | nullable |
| `location` | text | nullable |
| `capacity_per_day` | integer | nullable |
| `kapasitas_potong_per_hari` | integer | nullable — kapasitas potong per hari |
| `preferred_types` | text[] | nullable |
| `product_types` | text[] | nullable |
| `area_distribusi` | text | nullable |
| `catatan` | text | nullable |
| `is_verified` | boolean | default false |
| `notes` | text | nullable |
| `is_deleted` | boolean | |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

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
| `feed_type` | text | `'starter'` \| `'grower'` \| `'finisher'` \| `'konsentrat'` \| `'jagung'` \| `'dedak'` \| `'lainnya'` |
| `quantity_kg` | numeric | NOT NULL, default 0 |
| `is_deleted` | boolean | default false |

**Upsert logic**: cek existing by `(tenant_id, peternak_farm_id, feed_type, is_deleted=false)` → UPDATE `quantity_kg +=` input jika ada, INSERT baru jika belum ada.
**Status thresholds**: ≥500 → Aman (green), 100–499 → Cukup (yellow), <100 → Menipis (red + pulse).
**Hook**: `useFeedStocks()` — queryKey `['feed-stocks', tenant.id]`. Joined dengan `peternak_farms(farm_name)`.

---

### `market_listings`
> Listing marketplace B2B antar role (peternak ↔ broker ↔ RPA)

| Kolom | Tipe | Notes |
|-------|------|-------|
| `id` | uuid PK | |
| `tenant_id` | uuid FK → tenants | |
| `listing_type` | text | `'stok_ayam'` \| `'penawaran_broker'` \| `'permintaan_rpa'` |
| `title` | text | NOT NULL — auto-generate jika kosong di form |
| `chicken_type` | text | `'broiler'` \| `'kampung'` \| `'pejantan'` \| `'layer'` — nullable |
| `quantity_ekor` | integer | nullable |
| `weight_kg` | numeric | nullable — bobot est. atau target (kg/ekor) |
| `price_per_kg` | integer | nullable — harga jual atau budget |
| `description` | text | nullable |
| `location` | text | nullable |
| `contact_name` | text | NOT NULL |
| `contact_wa` | text | NOT NULL — format `628xx…` min 10 digit |
| `status` | text | `'active'` \| `'closed'` \| `'expired'` — default `'active'` |
| `expires_at` | timestamptz | nullable — default +30 hari dari created_at |
| `view_count` | integer | default 0 — diincrement tiap klik tombol WA |
| `is_deleted` | boolean | default false |
| `created_at` | timestamptz | |

**Tidak ada**: generated columns, `is_trial`, FK ke tabel lain selain `tenants`.
**Hooks** (`src/lib/hooks/useMarket.js`):
- `useMarketListings(filters)` — queryKey `['market-listings', filters]`
- `useMyListings()` — queryKey `['my-listings', tenant.id]`
- `useCreateListing()`, `useCloseListing()`, `useDeleteListing()` (soft delete)

**Filters yang didukung** di `useMarketListings`:
```js
type          → .eq('listing_type', ...)
chicken_type  → .eq('chicken_type', ...)
search        → .ilike('title', '%search%')
location      → .ilike('location', '%location%')
```

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

### `pricing_plans`
> Harga langganan per plan per role — dikelola via Admin Panel (Phase 5)

| Kolom | Tipe | Notes |
|-------|------|-------|
| `id` | uuid PK | |
| `role` | text | `'broker'` `'peternak'` `'rpa'` |
| `plan` | text | `'pro'` `'business'` |
| `price` | integer | Harga aktual (IDR) |
| `original_price` | integer | Harga coret sebelum diskon |
| `updated_at` | timestamptz | |

**GLOBAL** — tidak ada `tenant_id`, tidak ada `is_deleted`
**Unique**: `(role, plan)`
**Hook**: `usePricingConfig()` — queryKey `['pricing-plans']`
Hasil di-transform ke `{ broker: { pro: { price, originalPrice, id }, business: {...} }, peternak: {...}, rpa: {...} }`

---

### `discount_codes`
> Kode voucher diskon untuk subscription — dikelola via Admin Panel (Phase 5)

| Kolom | Tipe | Notes |
|-------|------|-------|
| `id` | uuid PK | |
| `code` | text | UNIQUE, kode voucher (e.g. `'TERNAK50'`) |
| `discount_type` | text | `'percent'` `'flat'` |
| `discount_value` | integer | Nilai diskon (persen atau IDR) |
| `applies_to_plan` | text | `'pro'` `'business'` `'all'` — nullable |
| `applies_to_role` | text | `'broker'` `'peternak'` `'rpa'` `'all'` — nullable |
| `expires_at` | timestamptz | nullable |
| `max_usage` | integer | nullable (null = unlimited) |
| `usage_count` | integer | default 0 |
| `is_active` | boolean | default true |
| `created_at` | timestamptz | |

**GLOBAL** — tidak ada `tenant_id`, tidak ada `is_deleted`
**Hook**: `useDiscountCodes()` — queryKey `['discount-codes']`

---

## 🏢 VERTICAL PROFILES (Fase 2/3)

### `broker_profiles`
> Profil detail bisnis broker (satu per tenant)

| Kolom | Tipe | Notes |
|-------|------|-------|
| `id` | uuid PK | |
| `tenant_id` | uuid FK → tenants | UNIQUE |
| `chicken_types` | text[] | nullable — jenis ayam diperdagangkan |
| `egg_types` | text[] | nullable — jenis telur |
| `area_operasi` | text | nullable |
| `target_volume_monthly` | integer | nullable |
| `mitra_peternak_count` | integer | nullable — jumlah kandang mitra |
| `kapasitas_harian_butir` | integer | nullable — untuk broker telur |

---

### `peternak_profiles`
> Profil detail peternak (satu per tenant)

| Kolom | Tipe | Notes |
|-------|------|-------|
| `id` | uuid PK | |
| `tenant_id` | uuid FK → tenants | UNIQUE |
| `animal_types` | text[] | nullable — jenis hewan yang dipelihara |
| `chicken_sub_types` | text[] | nullable — `'broiler'` \| `'layer'` \| `'kampung'` |
| `ruminansia_types` | text[] | nullable — `'sapi'` \| `'kambing'` \| `'domba'` |
| `kandang_count` | integer | nullable |
| `doc_capacity` | integer | nullable — kapasitas DOC per siklus |
| `total_ternak` | integer | nullable |
| `luas_lahan_m2` | integer | nullable |
| `sistem_pemeliharaan` | text | nullable — `'mandiri'` \| `'kemitraan'` |

---

## 🏭 RPA DISTRIBUTION VERTICAL (Fase 3)

### `rpa_products`
> Produk RPA (karkas, fillet, dll) yang dijual ke customer

| Kolom | Tipe | Notes |
|-------|------|-------|
| `id` | uuid PK | |
| `tenant_id` | uuid FK → tenants | NOT NULL |
| `product_name` | text | NOT NULL |
| `product_type` | text | `'karkas'` \| `'has_dalam'` \| `'fillet'` \| `'ceker'` \| `'kepala'` \| `'jeroan'` \| `'lainnya'` |
| `unit` | text | default `'kg'` |
| `sell_price` | integer | harga jual per unit |
| `cost_price` | integer | HPP per unit |
| `current_stock_kg` | numeric | default 0 |
| `is_active` | boolean | default true |
| `is_deleted` | boolean | default false |

---

### `rpa_customers`
> CRM toko/customer distribusi RPA

| Kolom | Tipe | Notes |
|-------|------|-------|
| `id` | uuid PK | |
| `tenant_id` | uuid FK → tenants | NOT NULL |
| `customer_name` | text | NOT NULL |
| `customer_type` | text | `'toko_kecil'` \| `'toko_menengah'` \| `'supermarket'` \| `'restoran'` \| `'hotel'` \| `'catering'` \| `'lainnya'` |
| `contact_person` | text | nullable |
| `phone` | text | nullable |
| `address` | text | nullable |
| `payment_terms` | text | `'cash'` `'net3'` `'net7'` `'net14'` `'net30'` |
| `credit_limit` | bigint | default 0 |
| `total_outstanding` | bigint | default 0 — diupdate via trigger/manual |
| `total_purchases` | bigint | default 0 |
| `reliability_score` | smallint | 1–5, nullable |
| `is_deleted` | boolean | default false |

---

### `rpa_invoices`
> Invoice penjualan distribusi ke customer

| Kolom | Tipe | Notes |
|-------|------|-------|
| `id` | uuid PK | |
| `tenant_id` | uuid FK → tenants | NOT NULL |
| `customer_id` | uuid FK → rpa_customers | NOT NULL |
| `invoice_number` | text | UNIQUE |
| `customer_name` | text | NOT NULL (denormalized) |
| `transaction_date` | date | NOT NULL |
| `due_date` | date | nullable |
| `total_amount` | bigint | NOT NULL — sum(subtotal items) |
| `total_cost` | bigint | NOT NULL — sum(cost items) |
| `net_profit` | bigint | ⚠️ **GENERATED** (`total_amount - total_cost`) — NEVER INSERT |
| `payment_status` | text | `'lunas'` \| `'belum_lunas'` \| `'sebagian'` |
| `paid_amount` | bigint | default 0 |
| `remaining_amount` | bigint | ⚠️ **GENERATED** (`total_amount - paid_amount`) — NEVER INSERT |
| `is_deleted` | boolean | default false |

---

### `rpa_invoice_items`
> Item produk per invoice RPA

| Kolom | Tipe | Notes |
|-------|------|-------|
| `id` | uuid PK | |
| `invoice_id` | uuid FK → rpa_invoices | NOT NULL |
| `product_id` | uuid FK → rpa_products | nullable |
| `product_name` | text | NOT NULL (denormalized) |
| `quantity_kg` | numeric | NOT NULL, > 0 |
| `price_per_kg` | integer | NOT NULL |
| `cost_per_kg` | integer | NOT NULL |
| `subtotal` | bigint | ⚠️ **GENERATED** (`ROUND(quantity_kg * price_per_kg)`) — NEVER INSERT |

---

### `rpa_customer_payments`
> Pembayaran customer per invoice

| Kolom | Tipe | Notes |
|-------|------|-------|
| `id` | uuid PK | |
| `tenant_id` | uuid FK → tenants | NOT NULL |
| `invoice_id` | uuid FK → rpa_invoices | NOT NULL |
| `customer_id` | uuid FK → rpa_customers | nullable |
| `amount` | bigint | NOT NULL, > 0 |
| `payment_date` | date | NOT NULL |
| `payment_method` | text | `'cash'` \| `'transfer'` \| `'qris'` \| `'giro'` |
| `reference_no` | text | nullable |
| `notes` | text | nullable |
| `is_deleted` | boolean | nullable — filter `.eq('is_deleted', false)` saat read |
| `created_at` | timestamptz | |

✅ `is_deleted` ADA di tabel ini — selalu filter `.eq('is_deleted', false)` saat read.

---

## 🛒 SEMBAKO VERTICAL (Fase 4)
> Distributor sembako — manajemen produk, stok FIFO, penjualan kredit, pegawai & penggajian.
> Semua tabel prefix `sembako_`. Semua pakai `tenant_id`. Filter `is_deleted: false` kecuali `sembako_payroll`, `sembako_payments`, `sembako_stock_out`.
> ⚠️ **RLS (Bulletproof Pattern)**: SEMUA tabel `sembako_*` (termasuk `sembako_deliveries` yang sebelumnya pakai `my_tenant_id()`+`my_role()`) sudah diproteksi via migration `20260401_fix_all_rls_bulletproof.sql` menggunakan `tenant_id IN (SELECT tenant_id FROM profiles WHERE auth_user_id = auth.uid())`. Policy ini BUKAN `get_my_tenant_id()` (gagal multi-tenant) dan BUKAN `my_tenant_id()`/`my_role()` (broken functions). Pastikan migration sudah dijalankan sebelum INSERT ke tabel manapun.
> ⚠️ **Frontend Hooks**: Semua READ hooks di `useSembakoData.js` wajib menggunakan `useAuth()` + `.eq('tenant_id', tenant.id)` untuk mencegah data antar bisnis bercampur.

### `sembako_products`
> Katalog produk sembako

| Kolom | Tipe | Notes |
|-------|------|-------|
| `id` | uuid PK | |
| `tenant_id` | uuid FK → tenants | |
| `product_name` | text | NOT NULL |
| `category` | text | `'beras'` \| `'minyak'` \| `'gula'` \| `'tepung'` \| `'lainnya'` \| `'rokok'` \| `'sabun_deterjen'` \| `'pasta_gigi_sikat'` \| `'susu'` |
| `unit` | text | `'kg'` \| `'liter'` \| `'pcs'` \| `'karung'` \| `'karton'` \| `'sak'` \| `'lusin'` \| `'slop'` \| `'ton'` \| `'gram'` |
| `sell_price` | integer | harga jual per unit |
| `avg_buy_price` | integer | HPP rata-rata (auto-update trigger) |
| `current_stock` | numeric | stok tersedia (auto-update dari batch trigger) |
| `min_stock_alert` | integer | ambang batas stok menipis |
| `secondary_unit` | text | nullable — satuan jual alternatif (e.g. `'karton'`, `'slop'`) |
| `conversion_rate` | numeric | nullable — jumlah unit primer per 1 unit sekunder (e.g. 10 = 1 karton = 10 kg) |
| `barcode` | text | nullable |
| `is_active` | boolean | default true |
| `is_deleted` | boolean | soft delete |
| `notes` | text | nullable |
| `created_at` | timestamptz | |

> ⚠️ `secondary_unit` dan `conversion_rate` ditambah via migration `20260401_sembako_products_unit_conversion.sql`. Saat insert, konversi empty string ke null: `conversion_rate: form.conversion_rate ? Number(form.conversion_rate) : null`.
> ⚠️ Saat `useSoftDeleteSembakoProduct` dijalankan, SEMUA `sembako_stock_batches` dengan `product_id` tersebut juga di-soft-delete secara otomatis.

---

### `sembako_suppliers`
> Daftar supplier/agen produk sembako

| Kolom | Tipe | Notes |
|-------|------|-------|
| `id` | uuid PK | |
| `tenant_id` | uuid FK → tenants | |
| `supplier_name` | text | NOT NULL |
| `supplier_type` | text | `'petani'` \| `'agen'` \| `'distributor'` \| `'pabrik'` \| `'lainnya'` |
| `contact_person` | text | nullable |
| `phone` | text | nullable |
| `address` | text | nullable |
| `products_supplied` | text[] | nullable — array produk yang disuplai |
| `payment_terms` | text | `'cash'` \| `'net3'` \| `'net7'` \| `'net14'` \| `'net30'` |
| `total_outstanding` | bigint | default 0 — hutang ke supplier |
| `notes` | text | nullable |
| `is_deleted` | boolean | |
| `created_at` | timestamptz | |

---

### `sembako_customers`
> Daftar pelanggan (warung/toko/agen)

| Kolom | Tipe | Notes |
|-------|------|-------|
| `id` | uuid PK | |
| `tenant_id` | uuid FK → tenants | |
| `customer_name` | text | NOT NULL |
| `customer_type` | text | `'warung'` \| `'toko'` \| `'agen'` \| `'supermarket'` |
| `contact_person` | text | nullable |
| `phone` | text | nullable |
| `address` | text | nullable |
| `area` | text | nullable — area/wilayah pengiriman |
| `payment_terms` | text | `'cash'` \| `'net3'` \| `'net7'` \| `'net14'` \| `'net30'` |
| `credit_limit` | bigint | nullable — batas kredit dalam Rupiah |
| `total_outstanding` | bigint | total piutang aktif (update via trigger/manual) |
| `total_purchases` | bigint | akumulasi pembelian |
| `reliability_score` | smallint | 1–5, nullable |
| `notes` | text | nullable |
| `is_deleted` | boolean | |
| `created_at` | timestamptz | |

---

### `sembako_stock_batches`
> Riwayat masuk stok per batch (untuk perhitungan FIFO)

| Kolom | Tipe | Notes |
|-------|------|-------|
| `id` | uuid PK | |
| `tenant_id` | uuid FK → tenants | |
| `product_id` | uuid FK → sembako_products | |
| `supplier_id` | uuid FK → sembako_suppliers | nullable |
| `batch_code` | text | auto-generate atau manual |
| `qty_masuk` | numeric | jumlah barang masuk |
| `qty_sisa` | numeric | sisa stok batch ini (dikurangi saat penjualan FIFO) |
| `buy_price` | integer | harga beli per unit |
| `total_cost` | integer | **GENERATED** — `qty_masuk × buy_price` |
| `purchase_date` | date | |
| `expiry_date` | date | nullable |
| `notes` | text | nullable |
| `is_deleted` | boolean | |
| `created_at` | timestamptz | |

> ⚠️ JANGAN INSERT `total_cost` (generated column). `qty_sisa` diupdate manual via FIFO loop saat penjualan.
> ⚠️ **RLS (Bulletproof)**: Memiliki policy `tenant_isolation_sembako_stock_batches` dengan logic:
> ```sql
> USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE auth_user_id = auth.uid()))
> WITH CHECK (tenant_id IN (SELECT tenant_id FROM profiles WHERE auth_user_id = auth.uid()))
> ```
> Policy ini BUKAN menggunakan `get_my_tenant_id()` (yang gagal pada user multi-tenant). Tanpa policy ini, deduksi stok FIFO dan INSERT batch baru akan gagal dengan error `42501`.
> ⚠️ **Migration**: `supabase/migrations/20260401_fix_nested_rls.sql` — cleanup policy lama + create bulletproof policy.
> ⚠️ **Frontend Hook**: `useSembakoAllBatches` dan `useSembakoStockBatches` wajib `.eq('tenant_id', tenant.id)` via `useAuth()`.

---

### `sembako_stock_out`
> Riwayat pengurangan stok (dicatat otomatis saat penjualan FIFO)

| Kolom | Tipe | Notes |
|-------|------|-------|
| `id` | uuid PK | |
| `tenant_id` | uuid FK → tenants | |
| `product_id` | uuid FK → sembako_products | |
| `batch_id` | uuid FK → sembako_stock_batches | |
| `sale_item_id` | uuid FK → sembako_sale_items | nullable |
| `sale_id` | uuid FK → sembako_sales | nullable |
| `qty_keluar` | numeric | |
| `buy_price` | integer | HPP per unit saat keluar |
| `is_deleted` | boolean | nullable |
| `created_at` | timestamptz | |

> ✅ Kolom `reason` ADA (`'sale'` | `'expired'` | `'adjustment'`) — dokumentasi lama SALAH.
> ✅ Kolom `qty_keluar` (BUKAN `qty_out`) — nama kolom ini wajib dipakai di semua query dan insert.
> ⚠️ **WAJIB insert saat FIFO penjualan**: Setiap kali `useCreateSembakoSale` mengurangi `qty_sisa` di sebuah batch, HARUS insert satu record ke tabel ini (`batch_id`, `sale_id`, `qty_keluar`, `reason: 'sale'`). Tanpa ini, `useDeleteSembakoSale` tidak bisa mengembalikan stok ke batch yang benar saat sale dihapus.
> ⚠️ `is_deleted` ada di tabel ini tapi tidak difilter di query normal. Hapus dengan `.delete()` saat sale di-delete (hard delete record stock_out).
> ⚠️ **RLS (Bulletproof)**: Memiliki policy `tenant_isolation_sembako_stock_out` via `20260401_fix_all_rls_bulletproof.sql`.
> ⚠️ **Frontend Hook**: `useSembakoStockOut` wajib `.eq('tenant_id', tenant.id)` via `useAuth()`.

---

### `sembako_sales`
> Header transaksi penjualan (invoice)

| Kolom | Tipe | Notes |
|-------|------|-------|
| `id` | uuid PK | |
| `tenant_id` | uuid FK → tenants | |
| `customer_id` | uuid FK → sembako_customers | nullable |
| `delivery_id` | uuid FK → sembako_deliveries | nullable — legacy FK (soft link) |
| `customer_name` | text | denormalized (snapshot) |
| `invoice_number` | text | format `SMB-YYYYMMDD-XXXX` |
| `transaction_date` | date | NOT NULL |
| `due_date` | date | nullable |
| `total_amount` | integer | total tagihan (sum item subtotals) |
| `total_cogs` | integer | total HPP |
| `delivery_cost` | integer | ongkos kirim, default 0 |
| `other_cost` | integer | biaya lain, default 0 |
| `paid_amount` | integer | total sudah dibayar |
| `gross_profit` | integer | **GENERATED** — `total_amount - total_cogs` |
| `net_profit` | integer | **GENERATED** — `gross_profit - delivery_cost - other_cost` |
| `remaining_amount` | integer | **GENERATED** — `total_amount - paid_amount` |
| `payment_status` | text | `'belum_lunas'` \| `'sebagian'` \| `'lunas'` |
| `notes` | text | nullable |
| `is_deleted` | boolean | |
| `created_at` | timestamptz | |

> ⚠️ JANGAN INSERT `gross_profit`, `net_profit`, `remaining_amount` (generated columns).
> ⚠️ **RLS**: Memiliki policy `tenant_isolation_sembako_sales` yang di-enforce berdasarkan `profiles.tenant_id`. Tanpa policy ini aktif di Supabase, semua INSERT akan `403 Forbidden`.

---

### `sembako_sale_items`
> Line item per invoice

| Kolom | Tipe | Notes |
|-------|------|-------|
| `id` | uuid PK | |
| `sale_id` | uuid FK → sembako_sales | |
| `product_id` | uuid FK → sembako_products | nullable |
| `product_name` | text | snapshot nama produk |
| `unit` | text | snapshot satuan |
| `quantity` | numeric | |
| `price_per_unit` | integer | |
| `cogs_per_unit` | integer | HPP per unit saat transaksi |
| `subtotal` | integer | **GENERATED** — `quantity × price_per_unit` |
| `cogs_total` | integer | **GENERATED** — `quantity × cogs_per_unit` |

> ⚠️ JANGAN INSERT `subtotal`, `cogs_total` (generated columns).
> ⚠️ **RLS**: Memiliki policy `tenant_isolation_sembako_sale_items` berdasarkan `sale_id` yang terikat dengan `profiles.tenant_id`.

---

### `sembako_payments`
> Catatan pembayaran per invoice (partial / full)

| Kolom | Tipe | Notes |
|-------|------|-------|
| `id` | uuid PK | |
| `tenant_id` | uuid FK → tenants | |
| `sale_id` | uuid FK → sembako_sales | |
| `customer_id` | uuid FK → sembako_customers | nullable |
| `amount` | bigint | jumlah bayar |
| `payment_date` | date | |
| `payment_method` | text | `'cash'` \| `'transfer'` \| `'qris'` |
| `reference_no` | text | nullable — legacy, gunakan `reference_number` |
| `reference_number` | text | nullable — nomor bukti transfer (kolom baru) |
| `notes` | text | nullable |
| `is_deleted` | boolean | — filter `.eq('is_deleted', false)` saat read |
| `created_at` | timestamptz | |

> ✅ `is_deleted` ADA di tabel ini — selalu filter `.eq('is_deleted', false)` saat read.
> ✅ Gunakan `reference_number` (bukan `reference_no`) untuk kolom nomor referensi.
> ⚠️ **RLS**: Memiliki policy `tenant_isolation_sembako_payments` yang di-enforce berdasarkan `profiles.tenant_id`. Tanpa policy ini aktif, INSERT akan `403 Forbidden`.
> ⚠️ **UX**: `SheetPayment` di `Penjualan.jsx` auto-pre-fill field `amount` dengan `sale.remaining_amount` via `useEffect`.

---

### `sembako_employees`
> Daftar pegawai (supir, penjual, admin)

| Kolom | Tipe | Notes |
|-------|------|-------|
| `id` | uuid PK | |
| `tenant_id` | uuid FK → tenants | |
| `full_name` | text | NOT NULL |
| `role` | text | `'supir'` \| `'penjual'` \| `'admin'` \| `'gudang'` |
| `phone` | text | nullable |
| `address` | text | nullable |
| `join_date` | date | nullable |
| `salary_type` | text | `'harian'` \| `'bulanan'` \| `'komisi'` |
| `base_salary` | integer | gaji pokok per periode |
| `commission_pct` | numeric | persen komisi dari penjualan (jika salary_type = komisi) |
| `trip_rate` | integer | upah per trip pengiriman (jika supir) |
| `status` | text | `'aktif'` \| `'nonaktif'` — filter aktif: `.eq('status', 'aktif')` |
| `notes` | text | nullable |
| `is_deleted` | boolean | |
| `created_at` | timestamptz | |

> ⚠️ TIDAK ADA kolom `is_active` atau `commission_rate` — gunakan `status` dan `commission_pct`.

---

### `sembako_payroll`
> Catatan penggajian per periode

| Kolom | Tipe | Notes |
|-------|------|-------|
| `id` | uuid PK | |
| `tenant_id` | uuid FK → tenants | |
| `employee_id` | uuid FK → sembako_employees | |
| `period_type` | text | `'harian'` \| `'mingguan'` \| `'bulanan'` |
| `period_date` | date | tanggal periode penggajian |
| `work_days` | integer | nullable — hari kerja |
| `trip_count` | integer | nullable — jumlah pengiriman |
| `sales_amount` | integer | nullable — total penjualan (untuk komisi) |
| `base_amount` | integer | komponen gaji pokok |
| `commission_amount` | integer | komponen komisi |
| `bonus` | integer | nullable, default 0 |
| `deduction` | integer | nullable, default 0 |
| `total_pay` | integer | **GENERATED** — `base_amount + commission_amount + bonus - deduction` |
| `payment_status` | text | `'pending'` \| `'paid'` |
| `paid_at` | timestamptz | nullable — diisi saat mark paid |
| `notes` | text | nullable |
| `created_at` | timestamptz | |

> ⚠️ JANGAN INSERT `total_pay` (generated column).
> ✅ `is_deleted` ADA di tabel ini — filter `.eq('is_deleted', false)` saat read.
> ⚠️ **RLS (Bulletproof)**: Memiliki policy `tenant_isolation_sembako_payroll` dengan logic `tenant_id IN (SELECT tenant_id FROM profiles WHERE auth_user_id = auth.uid())`. Migration: `20260401_fix_nested_rls.sql`.

---

### `sembako_deliveries`
> Catatan pengiriman (assign supir ke invoice)

| Kolom | Tipe | Notes |
|-------|------|-------|
| `id` | uuid PK | |
| `tenant_id` | uuid FK → tenants | NOT NULL |
| `sale_id` | uuid FK → sembako_sales | nullable |
| `employee_id` | uuid FK → sembako_employees | nullable — supir/kurir |
| `vehicle_type` | text | nullable — jenis kendaraan |
| `vehicle_plate` | text | nullable — nomor plat |
| `driver_name` | text | nullable — nama sopir (snapshot) |
| `delivery_date` | date | NOT NULL |
| `delivery_area` | text | nullable — area/alamat tujuan |
| `delivery_cost` | integer | nullable |
| `other_cost` | integer | nullable |
| `status` | text | `'pending'` \| `'on_route'` \| `'delivered'` |
| `notes` | text | nullable |
| `is_deleted` | boolean | nullable — gunakan soft delete |
| `created_at` | timestamptz | nullable |

> ✅ Filter `.eq('is_deleted', false)` saat read — kolom ini ADA.
> ❌ NEVER insert `customer_id` — kolom sudah dihapus dari tabel.
> ⚠️ Kolom asli: `delivery_area` (BUKAN `destination`). DATABASE_STRUCTURE.md sebelumnya salah dokumentasi.

---

### `sembako_expenses`
> Pengeluaran operasional non-gaji (BBM, sewa, dll)

| Kolom | Tipe | Notes |
|-------|------|-------|
| `id` | uuid PK | |
| `tenant_id` | uuid FK → tenants | |
| `category` | text | `'bbm'` \| `'sewa'` \| `'perawatan'` \| `'listrik'` \| `'lainnya'` |
| `amount` | integer | |
| `expense_date` | date | |
| `description` | text | nullable |
| `is_deleted` | boolean | |
| `created_at` | timestamptz | |

---

## ⚙️ GLOBAL CONFIG

### `plan_configs`
> Key-value store untuk semua konfigurasi plan yang bisa diubah admin

| Kolom | Tipe | Notes |
|-------|------|-------|
| `id` | uuid PK | |
| `config_key` | text | UNIQUE — `'kandang_limit'` \| `'addon_pricing'` \| `'trial_config'` \| `'annual_discount'` \| `'team_limit'` |
| `config_value` | jsonb | NOT NULL |
| `description` | text | nullable |
| `updated_at` | timestamptz | |

**GLOBAL** — tidak ada `tenant_id`, tidak ada `is_deleted`
**Upsert**: `.upsert({ config_key, config_value }, { onConflict: 'config_key' })`
**Hook**: `usePlanConfigs()` — queryKey `['plan-configs']`. Transform array → `{ [config_key]: config_value }`

---

### `waitlist_signups`
> Email waitlist untuk fitur/sub-type yang belum tersedia (non-blocking)

| Kolom | Tipe | Notes |
|-------|------|-------|
| `id` | uuid PK | |
| `email` | text | NOT NULL |
| `vertical` | text | nullable — sub-type atau nama fitur yang diminati |
| `created_at` | timestamptz | |

> ⚠️ Tidak ada kolom `name` atau `interest` — gunakan `vertical`.

**GLOBAL** — tidak ada `tenant_id`, tidak ada `is_deleted`
**Diinsert via**: `WaitlistSheet` di `Step1SubTipe.jsx` saat user klik kartu disabled
**Non-blocking**: insert di dalam try/catch — gagal tidak memblokir UX

---

### `invite_rate_limits`
> Persistent rate limiting untuk Edge Function `verify-invite-code`

| Kolom | Tipe | Notes |
|-------|------|-------|
| `id` | uuid PK | |
| `ip_address` | text | UNIQUE — IP user sebagai key |
| `attempt_count` | integer | jumlah percobaan dalam window |
| `first_attempt_at` | timestamptz | start of 15-minute window |
| `locked_until` | timestamptz | expiry waktu lockout (30 menit jika count >= 5) |
| `last_attempt_at` | timestamptz | updated on every attempt |

**GLOBAL** — tidak ada `tenant_id`, tidak ada `is_deleted`
**Tujuan**: Mencegah brute-force kode undangan 6 digit. Record dihapus jika kode valid.

---

### `market_listings`
> Iklan stok/permintaan di TernakOS Market

| Kolom | Tipe | Notes |
|-------|------|-------|
| `id` | uuid PK | |
| `tenant_id` | uuid FK → tenants | |
| `listing_type` | text | `'stok_ayam'` \| `'penawaran_broker'` \| `'permintaan_rpa'` |
| `chicken_type` | text | |
| `quantity_ekor` | integer | |
| `weight_kg` | numeric | |
| `price_per_kg` | integer | |
| `title` | text | |
| `description` | text | |
| `location` | text | |
| `contact_name` | text | |
| `contact_wa` | text | |
| `status` | text | `'active'` \| `'closed'` \| `'expired'` |
| `view_count` | integer | default 0 — **pakai RPC increment** |
| `expires_at` | timestamptz | |
| `is_deleted` | boolean | |

---

### `broker_connections`
> Koneksi dua arah Broker ↔ Peternak, di-initiate dari Market

| Kolom | Tipe | Notes |
|-------|------|-------|
| `id` | uuid PK | |
| `requester_tenant_id` | uuid FK → tenants | NOT NULL — siapa yang request |
| `requester_type` | text | business_vertical requester |
| `target_tenant_id` | uuid FK → tenants | NOT NULL — siapa yang di-request |
| `target_type` | text | business_vertical target |
| `status` | text | `'pending'` \| `'active'` \| `'rejected'` \| `'blocked'` |
| `message` | text | nullable — pesan opsional saat request |
| `rejected_reason` | text | nullable — alasan tolak |
| `requested_at` | timestamptz | default now() |
| `responded_at` | timestamptz | nullable — kapan di-respond |
| `connected_at` | timestamptz | nullable (legacy) |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

⚠️ DEPRECATED columns (masih ada di DB, jangan dipakai di kode baru):
  - `peternak_tenant_id` ← gunakan `requester_tenant_id`/`target_tenant_id`
  - `broker_tenant_id`   ← gunakan `requester_tenant_id`/`target_tenant_id`

⚠️ UNIQUE constraint: `(requester_tenant_id, target_tenant_id)`
⚠️ Tidak ada `is_deleted` — `useCancelConnection()` pakai `.delete()` langsung

**Config keys & value shape**:
- `kandang_limit`: `{ starter: 1, pro: 2, business: 99 }`
- `addon_pricing`: `{ price_per_addon: 99000, max_addons: 2 }`
- `trial_config`: `{ starter_days: 14, pro_days: 14, business_days: 14 }`
- `annual_discount`: `{ discount_percent: 20 }`
- `team_limit`: `{ starter: 1, pro: 3, business: null }`

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
| egg_stock_logs | tenant_id | tenants.id |
| egg_stock_logs | inventory_id | egg_inventory.id |
| egg_stock_logs | sale_id | egg_sales.id |
| egg_stock_logs | supplier_id | egg_suppliers.id |
| egg_stock_logs | created_by | profiles.id |
| breeding_cycles | tenant_id | tenants.id |
| breeding_cycles | peternak_farm_id | peternak_farms.id |
| daily_records | tenant_id | tenants.id |
| daily_records | cycle_id | breeding_cycles.id |
| stock_listings | peternak_tenant_id | tenants.id |
| stock_listings | cycle_id | breeding_cycles.id |
| broker_connections | requester_tenant_id | tenants.id |
| broker_connections | target_tenant_id | tenants.id |
| rpa_profiles | tenant_id | tenants.id |
| rpa_purchase_orders | rpa_tenant_id | tenants.id |
| rpa_purchase_orders | broker_tenant_id | tenants.id |
| rpa_payments | rpa_tenant_id | tenants.id |
| rpa_payments | broker_tenant_id | tenants.id |
| feed_stocks | tenant_id | tenants.id |
| feed_stocks | peternak_farm_id | peternak_farms.id |
| market_listings | tenant_id | tenants.id |
| cycle_expenses | tenant_id | tenants.id |
| cycle_expenses | cycle_id | breeding_cycles.id |
| harvest_records | tenant_id | tenants.id |
| harvest_records | cycle_id | breeding_cycles.id |
| farm_workers | tenant_id | tenants.id |
| farm_workers | peternak_farm_id | peternak_farms.id |
| worker_payments | tenant_id | tenants.id |
| worker_payments | worker_id | farm_workers.id |
| broker_profiles | tenant_id | tenants.id |
| peternak_profiles | tenant_id | tenants.id |
| rpa_products | tenant_id | tenants.id |
| rpa_customers | tenant_id | tenants.id |
| rpa_invoices | tenant_id | tenants.id |
| rpa_invoices | customer_id | rpa_customers.id |
| rpa_invoice_items | invoice_id | rpa_invoices.id |
| rpa_invoice_items | product_id | rpa_products.id |
| rpa_customer_payments | tenant_id | tenants.id |
| rpa_customer_payments | invoice_id | rpa_invoices.id |
| rpa_customer_payments | customer_id | rpa_customers.id |
| sembako_products | tenant_id | tenants.id |
| sembako_suppliers | tenant_id | tenants.id |
| sembako_customers | tenant_id | tenants.id |
| sembako_stock_batches | tenant_id | tenants.id |
| sembako_stock_batches | product_id | sembako_products.id |
| sembako_stock_batches | supplier_id | sembako_suppliers.id |
| sembako_stock_out | product_id | sembako_products.id |
| sembako_stock_out | batch_id | sembako_stock_batches.id |
| sembako_stock_out | sale_id | sembako_sales.id |
| sembako_sales | tenant_id | tenants.id |
| sembako_sales | customer_id | sembako_customers.id |
| sembako_sale_items | sale_id | sembako_sales.id |
| sembako_sale_items | product_id | sembako_products.id |
| sembako_payments | tenant_id | tenants.id |
| sembako_payments | sale_id | sembako_sales.id |
| sembako_payments | customer_id | sembako_customers.id |
| sembako_employees | tenant_id | tenants.id |
| sembako_payroll | tenant_id | tenants.id |
| sembako_payroll | employee_id | sembako_employees.id |
| sembako_deliveries | tenant_id | tenants.id |
| sembako_deliveries | sale_id | sembako_sales.id |
| sembako_deliveries | employee_id | sembako_employees.id |
| sembako_expenses | tenant_id | tenants.id |

---

## ⚠️ TABEL TANPA `is_deleted` (JANGAN FILTER)

| Tabel | Catatan |
|-------|---------|
| `payments` | Tidak ada kolom `is_deleted` — jangan filter |
| `worker_payments` | Tidak ada kolom `is_deleted` — jangan filter |
| `team_invitations` | Tidak ada kolom `is_deleted` — jangan filter |
| `rpa_customer_payments` | Tidak ada kolom `is_deleted` — jangan filter |
| `plan_configs` | GLOBAL config, tidak ada `is_deleted` |
| `sembako_payroll` | Tidak ada kolom `is_deleted` — jangan filter |
| `sembako_payments` | Tidak ada kolom `is_deleted` — jangan filter |
| `sembako_stock_out` | Tidak ada kolom `is_deleted` — jangan filter |
| `sembako_deliveries` | Ada kolom `is_deleted` — selalu filter `.eq('is_deleted', false)` |
| `invite_rate_limits` | Tidak ada kolom `is_deleted` — jangan filter |
| `broker_connections` | Tidak ada kolom `is_deleted` — jangan filter |

---

## ⚡ GENERATED COLUMNS (JANGAN DI-INSERT)

| Tabel | Kolom | Formula |
|-------|-------|---------|
| `purchases` | `total_modal` | `total_cost + transport_cost + other_cost` |
| `sales` | `net_revenue` | `total_revenue - delivery_cost` |
| `sales` | `remaining_amount` | `total_revenue - paid_amount` |
| `deliveries` | `shrinkage_kg` | `initial_weight_kg - arrived_weight_kg` |
| `market_prices` | `broker_margin` | `buyer_price - farm_gate_price` |
| `egg_inventory` | `cost_per_pack` | `cost_per_egg * eggs_per_pack + packaging_cost` |
| `egg_sales` | `net_profit` | `total_price - total_cost` |
| `egg_sale_items` | `subtotal` | `qty_pack * price_per_pack` |
| `rpa_invoices` | `net_profit` | `total_amount - total_cost` |
| `rpa_invoices` | `remaining_amount` | `total_amount - paid_amount` |
| `rpa_invoice_items` | `subtotal` | `ROUND(quantity_kg * price_per_kg)` |
| `sembako_stock_batches` | `total_cost` | `qty_masuk × buy_price` |
| `sembako_sales` | `gross_profit` | `total_amount - total_cogs` |
| `sembako_sales` | `net_profit` | `gross_profit - delivery_cost - other_cost` |
| `sembako_sales` | `remaining_amount` | `total_amount - paid_amount` |
| `sembako_sale_items` | `subtotal` | `quantity × price_per_unit` |
| `sembako_sale_items` | `cogs_total` | `quantity × cogs_per_unit` |
| `sembako_payroll` | `total_pay` | `base_amount + commission_amount + bonus - deduction` |

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
egg_inventory.egg_grade:          'hero' | 'standard' | 'salted'
egg_sales.payment_status:         'pending' | 'lunas' | 'piutang'
egg_sales.fulfillment_status:     'processing' | 'on_delivery' | 'completed'
egg_stock_logs.log_type:          'in' | 'out' | 'adj'

// Peternak Vertical
peternak_farms.livestock_type:    'ayam_broiler' | 'ayam_petelur'
peternak_farms.business_model:    'mandiri_murni' | 'mandiri_semi' | 'mitra_penuh' | 'mitra_pakan' | 'mitra_sapronak'
breeding_cycles.status:           'active' | 'harvested' | 'failed' | 'cancelled'
cycle_expenses.expense_type:      'doc' | 'pakan' | 'obat' | 'vaksin' | 'listrik' | 'air' | 'litter' | 'lainnya'
feed_stocks.feed_type:            'starter' | 'grower' | 'finisher' | 'konsentrat' | 'jagung' | 'dedak' | 'lainnya'
farm_workers.status:              'aktif' | 'nonaktif'
farm_workers.salary_system:       'flat_bonus' | 'borongan' | 'persentase'
worker_payments.payment_type:     'gaji' | 'bonus' | 'makan' | 'lain'

// Market (Multi-Role)
market_listings.listing_type:     'stok_ayam' | 'penawaran_broker' | 'permintaan_rpa'
market_listings.status:           'active' | 'closed' | 'expired'
market_listings.chicken_type:     'broiler' | 'kampung' | 'pejantan' | 'layer'

// Sub-types (tenants.sub_type)
tenants.sub_type:        'broker_ayam' | 'broker_telur' | 'distributor_daging' |
                         'peternak_broiler' | 'peternak_layer' | 'peternak_kampung' |
                         'peternak_pejantan' | 'rpa_ayam' | 'rph' | 'distributor_sembako'

// RPA Distribution Vertical
rpa_products.product_type:        'karkas' | 'has_dalam' | 'fillet' | 'ceker' | 'kepala' | 'jeroan' | 'lainnya'
rpa_customers.customer_type:      'toko_kecil' | 'toko_menengah' | 'supermarket' | 'restoran' | 'hotel' | 'catering' | 'lainnya'
rpa_invoices.payment_status:      'lunas' | 'belum_lunas' | 'sebagian'
rpa_customer_payments.payment_method: 'cash' | 'transfer' | 'qris' | 'giro'

// Plan Config Keys
plan_configs.config_key:  'kandang_limit' | 'addon_pricing' | 'trial_config' | 'annual_discount' | 'team_limit'

// Sembako Vertical
sembako_products.category:        'beras' | 'minyak' | 'gula' | 'tepung' | 'lainnya' | 'rokok' | 'sabun_deterjen' | 'pasta_gigi_sikat' | 'susu'
sembako_products.unit:             'kg' | 'liter' | 'pcs' | 'karung' | 'karton' | 'sak' | 'lusin' | 'slop' | 'ton' | 'gram'
sembako_customers.customer_type:  'warung' | 'toko' | 'agen' | 'supermarket'
sembako_customers.payment_terms:  'cash' | 'net3' | 'net7' | 'net14' | 'net30'
sembako_sales.payment_status:     'belum_lunas' | 'sebagian' | 'lunas'
sembako_payments.payment_method:  'cash' | 'transfer' | 'qris'
sembako_employees.role:            'supir' | 'penjual' | 'admin' | 'gudang'
sembako_employees.salary_type:     'harian' | 'bulanan' | 'komisi'
sembako_payroll.period_type:       'harian' | 'mingguan' | 'bulanan'
sembako_payroll.payment_status:   'pending' | 'paid'
sembako_deliveries.status:         'pending' | 'on_route' | 'delivered'
sembako_expenses.category:         'bbm' | 'sewa' | 'perawatan' | 'listrik' | 'lainnya'
sembako_stock_out.reason:          'sale' | 'expired' | 'adjustment'
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

| business_vertical | sub_type           | Route setelah login                      |
|-------------------|--------------------|------------------------------------------|
| poultry_broker    | broker_ayam        | /broker/poultry_broker/beranda           |
| egg_broker        | broker_telur       | /broker/egg_broker/beranda               |
| sembako_broker    | distributor_sembako| /broker/sembako_broker/beranda           |
| peternak          | peternak_broiler   | /peternak/peternak_broiler/beranda       |
| peternak          | peternak_layer     | /peternak/peternak_layer/beranda         |
| peternak          | peternak_sapi      | /peternak/peternak_sapi/beranda          |
| peternak          | peternak_domba     | /peternak/peternak_domba/beranda         |
| peternak          | peternak_kambing   | /peternak/peternak_kambing/beranda       |
| rumah_potong      | rpa                | /rumah_potong/rpa/beranda                |
| rumah_potong      | rph                | /rumah_potong/rph/beranda                |
| -                 | superadmin         | /admin                                   |

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

### Flow join via kode (AcceptInvite.jsx — H-2 Updated):
1. User masukkan kode 6 digit di `/invite`
2. `AcceptInvite.jsx` panggil Edge Function (BUKAN query DB langsung):
   ```js
   supabase.functions.invoke('verify-invite-code', { body: { code } })
   ```
3. Edge Function handle rate limit + validasi + return invitation data
4. Jika 429 → lock UI input 30 menit
5. Jika 200 → setInvitation(data.invitation) → tampilkan choice (register/login)
6. `signUp` dengan `options.data.invite_token = kode`
7. Trigger DB handle sisanya otomatis
   ✗ JANGAN query `team_invitations` langsung dari frontend — selalu via Edge Function

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

## ⚡ SUPABASE RPC FUNCTIONS

### `increment_listing_view`
**Purpose**: Atomic increment for `market_listings.view_count` to avoid race conditions.
**SQL**:
```sql
CREATE OR REPLACE FUNCTION increment_listing_view(row_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE market_listings
  SET view_count = view_count + 1
  WHERE id = row_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

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

// PETERNAK — Net Profit per Siklus:
export const calcPeternakNetProfit = (cycle) => {
  const revenue = Number(cycle?.harvestRevenue) || 0
  const expenses = Number(cycle?.cycleExpenses) || 0
  const doc = Number(cycle?.docCost) || 0
  const feed = Number(cycle?.feedCost) || 0
  const worker = Number(cycle?.workerCost) || 0
  return revenue - expenses - doc - feed - worker
}

// PETERNAK — Feed Conversion Ratio:
export const calcFCR = (feedKg, harvestKg) => {
  if (!harvestKg || harvestKg === 0) return 0
  return Number((feedKg / harvestKg).toFixed(2))
}

// PETERNAK — Indeks Performa:
export const calcIndeksPerforma = (survivalRate, avgWeight, ageDays, fcr) => {
  if (!ageDays || !fcr || ageDays === 0 || fcr === 0) return 0
  return Number(((survivalRate * avgWeight * 100) / (fcr * ageDays)).toFixed(0))
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

| Vertical          | Sub-role           | Status Dashboard |
|-------------------|--------------------|-----------------|
| poultry_broker    | broker_ayam        | ✅ Full (Sheet migration ✅) |
| egg_broker        | broker_telur       | ✅ Full          |
| sembako_broker    | distributor_sembako| ✅ Full (RLS ✅) |
| peternak          | peternak_broiler   | ✅ Full (Setup Wizard ✅) |
| peternak          | peternak_layer     | ✅ Full (Wizard ✅) |
| peternak          | peternak_sapi      | 🚧 Placeholder   |
| peternak          | peternak_domba     | 🚧 Placeholder   |
| peternak          | peternak_kambing   | 🚧 Placeholder   |
| peternak          | peternak_babi      | 🔒 Coming Soon   |
| rumah_potong      | rpa                | ✅ Full (RPH sub ✅) |
| rumah_potong      | rph                | 🚧 Placeholder   |

---

## ⚡ SUPABASE EDGE FUNCTIONS

| Function | Path | Purpose | Deploy Command |
|----------|------|---------|----------------|
| `fetch-harga` | `supabase/functions/fetch-harga/index.ts` | Auto-scrape harga broiler dari chickin.id → insert `market_prices` | `supabase functions deploy fetch-harga --no-verify-jwt` |
| `verify-invite-code` | `supabase/functions/verify-invite-code/index.ts` | Rate-limit verifikasi kode undangan (max 5×/15min, lockout 30min) | `supabase functions deploy verify-invite-code --no-verify-jwt` |

### Rate Limit Detail (`verify-invite-code`)
| Parameter | Nilai |
|-----------|-------|
| Max attempts | 5 per IP per window |
| Window | 15 menit |
| Lockout duration | 30 menit |
| Reset on success | Ya — counter reset jika kode valid |
| Storage | In-memory (Map) — direset saat cold start |

### Response Codes (`verify-invite-code`)
| Code | Kondisi | Frontend Action |
|------|---------|-----------------|
| `200` | Kode valid | `setInvitation(data.invitation)` → lanjut |
| `400` | Format kode salah | `toast.error` |
| `404` | Kode tidak ditemukan / bukan pending | `toast.error` |
| `410` | Kode expired | `toast.error` |
| `429` | Rate limit tercapai | `setIsLocked(true)` → disable input |
| `500` | Server error | `toast.error('Server error')` |

---

## 🚨 KNOWN ISSUES & FIXES

### Sembako — 403 Forbidden saat INSERT sales/payments
- **Masalah**: INSERT ke `sembako_sales` atau `sembako_payments` gagal dengan `403 Forbidden` (RLS policy violation).
- **Root Cause**: Policy `tenant_isolation_*` belum dibuat atau salah konfigurasi.
- **Fix SQL**:
  ```sql
  -- sembako_sales
  CREATE POLICY "tenant_isolation_sembako_sales" ON sembako_sales
    USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE auth_user_id = auth.uid()))
    WITH CHECK (tenant_id IN (SELECT tenant_id FROM profiles WHERE auth_user_id = auth.uid()));
  
  -- sembako_payments
  CREATE POLICY "tenant_isolation_sembako_payments" ON sembako_payments
    USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE auth_user_id = auth.uid()))
    WITH CHECK (tenant_id IN (SELECT tenant_id FROM profiles WHERE auth_user_id = auth.uid()));
  ```
- **Status**: Fixed 2026-03-29

### Sembako — 400 Bad Request saat query sembako_stock_batches / sembako_stock_out
- **Masalah**: Supabase mengembalikan `400 Bad Request (Could not find a relationship)` saat PostgREST mencoba join `sembako_stock_batches` atau `sembako_stock_out`.
- **Root Cause**: Foreign Key constraint (`product_id`, `batch_id`, `sale_id`) belum ada di database.
- **Fix SQL**:
  ```sql
  -- FK untuk sembako_stock_batches
  ALTER TABLE sembako_stock_batches
    ADD COLUMN IF NOT EXISTS is_deleted boolean DEFAULT false,
    ADD CONSTRAINT fk_ssb_product FOREIGN KEY (product_id) REFERENCES sembako_products(id),
    ADD CONSTRAINT fk_ssb_supplier FOREIGN KEY (supplier_id) REFERENCES sembako_suppliers(id);
  
  -- FK untuk sembako_stock_out
  ALTER TABLE sembako_stock_out
    ADD CONSTRAINT fk_sso_product FOREIGN KEY (product_id) REFERENCES sembako_products(id),
    ADD CONSTRAINT fk_sso_batch FOREIGN KEY (batch_id) REFERENCES sembako_stock_batches(id),
    ADD CONSTRAINT fk_sso_sale FOREIGN KEY (sale_id) REFERENCES sembako_sales(id);
  ```
- **Status**: Fixed 2026-03-29

### DatePicker.jsx — Fatal TypeError (locale shadowing)
- **Masalah**: `DatePicker.jsx` crash dengan `Uncaught TypeError` saat digunakan di dalam modal.
- **Root Cause**: Import locale `id` dari `date-fns/locale` di-shadow oleh prop `id` milik komponen itu sendiri.
- **Fix**: `import { id as idLocale } from 'date-fns/locale'` — rename import.
- **Status**: Fixed 2026-03-29

### CashFlow.jsx — ReferenceError: isDesktop is not defined
- **Masalah**: Membuka `CreateExtraExpenseSheet` menyebabkan crash dengan `ReferenceError: isDesktop is not defined`.
- **Root Cause**: `isDesktop` di-declare di scope induk `CashFlow`, tapi `CreateExtraExpenseSheet` adalah komponen terpisah dan tidak bisa mewarisi variable tersebut.
- **Fix**: Tambahkan `const isDesktop = useMediaQuery('(min-width: 1024px)')` di dalam body komponen `CreateExtraExpenseSheet`.
- **Status**: Fixed 2026-03-29

### Sembako — getTenantId Mengambil Tenant Salah
- **Masalah**: Mutation di `useSembakoData.js` mengambil `tenant_id` dari profile pertama user (bisa `broker_ayam`), bukan dari tenant sembako aktif.
- **Root Cause**: `.limit(1)` mengambil row tertua, bukan tenant aktif saat ini.
- **Fix**: Gunakan `localStorage.getItem('ternakos_active_tenant_id')` sebagai prioritas utama, sama dengan pattern di `useAuth()`.
- **Status**: Fixed 2026-03-29

### Business Switcher Stale Query
- **Masalah**: Ganti tenant → query vertical lama masih firing (e.g. broker query di sembako)
- **Fix**: `queryClient.clear()` dipanggil sebelum navigate ke tenant baru di Switcher.
- **Status**: Fixed 2026-03-29

### Sembako — 42501 RLS Violation on stock_batches/payroll/stock_out (Multi-Tenant)
- **Masalah**: INSERT ke `sembako_stock_batches`, `sembako_payroll`, atau `sembako_stock_out` gagal `42501 (new row violates row-level security policy)` meskipun policy `Tenants Access Policy` sudah ada.
- **Root Cause**: `get_my_tenant_id()` hanya return tenant pertama (via `LIMIT 1`). User dengan >1 profil (misal Broker Ayam + Distributor Sembako) akan selalu gagal INSERT ke tenant non-primary.
- **Fix SQL** (`supabase/migrations/20260401_fix_nested_rls.sql`):
  ```sql
  DO $$ 
  BEGIN
      DROP POLICY IF EXISTS "Inherited Tenant Policy" ON public.sembako_stock_batches;
      DROP POLICY IF EXISTS "Tenants Access Policy" ON public.sembako_stock_batches;
      DROP POLICY IF EXISTS "tenant_isolation_sembako_stock_batches" ON public.sembako_stock_batches;
      CREATE POLICY "tenant_isolation_sembako_stock_batches" ON public.sembako_stock_batches 
      FOR ALL TO authenticated 
      USING (tenant_id IN (SELECT tenant_id FROM public.profiles WHERE auth_user_id = auth.uid()))
      WITH CHECK (tenant_id IN (SELECT tenant_id FROM public.profiles WHERE auth_user_id = auth.uid()));
      -- (same pattern for sembako_payroll and sembako_stock_out)
  END $$;
  ```
- **Frontend Fix**: Semua READ hooks di `useSembakoData.js` ditambahkan `useAuth()` + `.eq('tenant_id', tenant.id)` untuk isolasi data per bisnis aktif.
- **Status**: Fixed 2026-04-01

### Routing Inkonsistensi sub_type
- **Masalah**: Beberapa logic `navigate()` atau link hardcode tanpa sub_type (e.g. `/broker/beranda`).
- **Fix**: Semua navigasi dashboard wajib menggunakan helper `getXBasePath(tenant)` dari `lib/businessModel.js`.
- **Status**: Fixed 2026-03-29

### Infinite Recursion — tenant_update RLS
- **Masalah**: WITH CHECK yang query `tenants` dari dalam policy `tenants`
- **Gejala**: 500 Internal Server Error saat PATCH tenants
- **Fix**: Drop + recreate policy tanpa self-referencing WITH CHECK. Security check via Edge Function.
- **Error code**: `42P17` — handle di frontend dengan `toast.warning` + lanjut (jangan block user)
- **Status**: Fixed 2026-03-26

### handle_new_user() Trigger Delay
- **Masalah**: Trigger kadang tidak langsung jalan setelah `signUp()`
- **Gejala**: Profile null → login loop, atau register silent fail
- **Fix**: `Register.jsx` await 1500ms setelah `signUp()` lalu query `profiles`. Jika null → toast error actionable, jangan navigate.
- **Status**: Fixed 2026-03-26

### Login Loop
- **Masalah**: Profile null → ProtectedRoute → `/onboarding` → `profile` null → redirect `/login` → loop
- **Fix**: `Login.jsx` query profile setelah `signInWithPassword()`. Jika null → `signOut()` + `setError(...)`.
- **Status**: Fixed 2026-03-26

### email_confirmed_at Stuck User
- **Masalah**: User register tapi tidak bisa login karena email belum dikonfirmasi
- **Fix SQL** (jalankan di Supabase SQL Editor):
  ```sql
  UPDATE auth.users SET email_confirmed_at = now() WHERE email = 'user@example.com';
  ```
  ⚠️ JANGAN include kolom `confirmed_at` (generated column — akan error).
- **Status**: Workaround tersedia

### broker_connections kolom deprecated
- **Masalah**: Kolom `peternak_tenant_id` dan `broker_tenant_id` sudah tidak digunakan tapi masih ada di DB.
- **Root Cause**: Migrasi ke pola `requester` & `target` untuk mendukung koneksi multi-arah.
- **Fix**: Data sudah dimigrate ke `requester_tenant_id` dan `target_tenant_id`. Kode React wajib pakai kolom baru.
- **Status**: Resolved 2026-03-29

### market_listings view_count race condition
- **Masalah**: Update view_count via `.update()` di frontend sering menimpa data satu sama lain.
- **Fix**: Menggunakan RPC `increment_listing_view(id)` untuk update atomic di sisi server.
- **Status**: Fixed 2026-03-29

### Register profile null pada pendaftaran
- **Masalah**: Latensi trigger Supabase menyebabkan profile belum siap saat redirect ke beranda.
- **Fix**: Implementasi `waitForProfile()` retry polling (8x) dengan progressive backoff di `Register.jsx`.
- **Status**: Fixed 2026-03-29

---

*TernakOS Database Structure — updated 2026-04-01 — Bulletproof RLS for `sembako_stock_batches`, `sembako_payroll`, `sembako_stock_out` (from `get_my_tenant_id()` to `profiles.auth_user_id = auth.uid()` subquery); Frontend tenant isolation for all `useSembakoData.js` hooks; Migration `20260401_fix_nested_rls.sql` documented; Known Issues expanded with multi-tenant 42501 fix*
