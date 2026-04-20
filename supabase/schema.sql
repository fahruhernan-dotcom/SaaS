-- ============================================================
-- TERNAKOS — COMPLETE DATABASE SCHEMA
-- Jalankan SEKALI di Supabase SQL Editor
-- Urutan: Extensions → Core → Broker → Peternak → RPA → Market → Billing → RLS → Triggers → Indexes
-- ============================================================

-- ============================================================
-- 1. EXTENSIONS
-- ============================================================

create extension if not exists "uuid-ossp";
create extension if not exists "pg_trgm"; -- untuk full-text search nanti

-- ============================================================
-- 2. CORE — TENANTS & PROFILES
-- ============================================================

create table tenants (
  id              uuid primary key default gen_random_uuid(),
  business_name   text not null,
  owner_name      text,
  phone           text,
  location        text,
  plan            text not null default 'starter'
                  check (plan in ('starter','pro','business')),
  is_active       boolean not null default true,
  trial_ends_at   timestamptz default (now() + interval '14 days'),
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

create table profiles (
  id              uuid primary key default gen_random_uuid(),
  tenant_id       uuid references tenants(id) on delete cascade not null,
  auth_user_id    uuid references auth.users(id) on delete cascade unique not null,
  full_name       text,
  role            text not null default 'owner'
                  check (role in
                  ('owner','staff','superadmin')),
  user_type       text not null default 'broker'
                  check (user_type in
                  ('broker','peternak','rpa','superadmin')),
  phone           text,
  avatar_url      text,
  is_active       boolean not null default true,
  onboarded                boolean not null default false,
  business_model_selected  boolean not null default false,
  last_seen_at             timestamptz,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

-- ============================================================
-- 3. HELPER FUNCTIONS
-- ============================================================

create or replace function my_tenant_id()
returns uuid language sql security definer stable 
set search_path = public
as $$
  select tenant_id from profiles
  where auth_user_id = auth.uid() 
  order by created_at desc -- at least be deterministic, but still bad for multi-tenant
  limit 1;
$$;

create or replace function is_my_tenant(tid uuid)
returns boolean language sql security definer stable 
set search_path = public
as $$
  select exists(
    select 1 from profiles
    where auth_user_id = auth.uid()
    and tenant_id = tid
  );
$$;

create or replace function my_user_type()
returns text language sql security definer stable 
set search_path = public
as $$
  select user_type from profiles
  where auth_user_id = auth.uid() limit 1;
$$;

create or replace function is_superadmin()
returns boolean language sql security definer stable 
set search_path = public
as $$
  select exists(
    select 1 from profiles
    where auth_user_id = auth.uid()
    and user_type = 'superadmin'
  );
$$;

-- Auto updated_at
create or replace function set_updated_at()
returns trigger language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Auto-create tenant + profile saat register (Mandiri Only)
create or replace function handle_new_user()
returns trigger language plpgsql security definer
set search_path = public
as $$
declare
  v_tenant_id uuid;
  v_user_type text;
begin
  -- 1. Cek dulu apakah ini user undangan (invite_token ada di metadata)
  -- Jika ada invite_token, jangan bikin tenant baru di sini (biar dihandle logic invite)
  if (new.raw_user_meta_data->>'invite_token') is not null then
    return new;
  end if;

  v_user_type := coalesce(
    new.raw_user_meta_data->>'user_type', 'broker'
  );

  -- 2. Bikin tenant baru
  insert into tenants(
    business_name,
    owner_name,
    phone
  ) values (
    coalesce(new.raw_user_meta_data->>'business_name', 'Bisnis Saya'),
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'phone'
  )
  returning id into v_tenant_id;

  -- 3. Bikin profile owner
  insert into profiles(
    tenant_id,
    auth_user_id,
    full_name,
    role,
    user_type
  ) values (
    v_tenant_id,
    new.id,
    new.raw_user_meta_data->>'full_name',
    'owner',
    v_user_type
  );

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- ============================================================
-- 4. BROKER MODULE TABLES
-- ============================================================

-- FARMS (kandang rekanan broker)
create table farms (
  id                  uuid primary key default gen_random_uuid(),
  tenant_id           uuid references tenants(id) on delete cascade not null,
  farm_name           text not null,
  owner_name          text not null,
  phone               text,
  location            text,
  address             text,
  latitude            decimal(10,7),
  longitude           decimal(10,7),
  chicken_type        text not null default 'broiler'
                      check (chicken_type in
                      ('broiler','kampung','pejantan','layer','petelur')),
  capacity            integer,                    -- kapasitas kandang (ekor)
  available_stock     integer not null default 0,
  avg_weight_kg       decimal(5,2),
  harvest_date        date,
  status              text not null default 'empty'
                      check (status in ('ready','growing','empty')),
  quality_rating      smallint check (quality_rating between 1 and 5),
  quality_notes       text,
  last_transaction_date date,
  notes               text,
  is_deleted          boolean not null default false,
  created_at          timestamptz default now(),
  updated_at          timestamptz default now()
);

-- RPA CLIENTS (pembeli — Rumah Potong Ayam, pedagang, dll)
create table rpa_clients (
  id                    uuid primary key default gen_random_uuid(),
  tenant_id             uuid references tenants(id) on delete cascade not null,
  rpa_name              text not null,
  buyer_type            text not null default 'rpa'
                        check (buyer_type in
                        ('rpa','pedagang_pasar','restoran',
                         'pengepul','supermarket','lainnya')),
  contact_person        text,
  phone                 text,
  location              text,
  address               text,
  payment_terms         text not null default 'cash'
                        check (payment_terms in
                        ('cash','net3','net7','net14','net30')),
  credit_limit          bigint not null default 0,
  total_outstanding     bigint not null default 0,  -- auto-sync via trigger
  avg_volume_per_order  integer,                    -- rata-rata ekor per order
  preferred_chicken_size text,                      -- "1.8-2.2 kg/ekor"
  preferred_chicken_type text default 'broiler',
  last_deal_price       integer,                    -- harga deal terakhir
  reliability_score     smallint                    -- 1-5: seberapa reliable bayar
                        check (reliability_score between 1 and 5),
  notes                 text,
  is_deleted            boolean not null default false,
  created_at            timestamptz default now(),
  updated_at            timestamptz default now()
);

-- CHICKEN BATCHES (stok virtual broker di farm orang lain)
create table chicken_batches (
  id                      uuid primary key default gen_random_uuid(),
  tenant_id               uuid references tenants(id) on delete cascade not null,
  farm_id                 uuid references farms(id) not null,
  batch_code              text,
  chicken_type            text not null default 'broiler'
                          check (chicken_type in
                          ('broiler','kampung','pejantan','layer')),
  initial_count           integer not null check (initial_count > 0),
  current_count           integer not null,
  avg_weight_kg           decimal(5,2),
  age_days                integer,
  estimated_harvest_date  date,
  status                  text not null default 'growing'
                          check (status in
                          ('growing','ready','booked','sold','cancelled')),
  quality_notes           text,
  is_deleted              boolean not null default false,
  created_at              timestamptz default now(),
  updated_at              timestamptz default now()
);

-- ORDERS (permintaan dari buyer sebelum transaksi)
create table orders (
  id                    uuid primary key default gen_random_uuid(),
  tenant_id             uuid references tenants(id) on delete cascade not null,
  rpa_id                uuid references rpa_clients(id) not null,
  chicken_type          text not null default 'broiler',
  requested_count       integer not null check (requested_count > 0),
  requested_weight_kg   decimal(10,2),
  target_price_per_kg   integer,
  preferred_size        text,
  requested_date        date,
  status                text not null default 'open'
                        check (status in
                        ('open','matched','partial',
                         'completed','cancelled')),
  matched_farm_id       uuid references farms(id),
  matched_batch_id      uuid references chicken_batches(id),
  notes                 text,
  is_deleted            boolean not null default false,
  created_at            timestamptz default now(),
  updated_at            timestamptz default now()
);

-- PURCHASES (broker beli dari kandang)
create table purchases (
  id               uuid primary key default gen_random_uuid(),
  tenant_id        uuid references tenants(id) on delete cascade not null,
  farm_id          uuid references farms(id) not null,
  batch_id         uuid references chicken_batches(id),  -- optional link ke batch
  quantity         integer not null check (quantity > 0),
  avg_weight_kg    decimal(5,2) not null check (avg_weight_kg > 0),
  total_weight_kg  decimal(10,2) not null,
  price_per_kg     integer not null check (price_per_kg > 0),
  total_cost       bigint not null,
  transport_cost   integer not null default 0,
  other_cost       integer not null default 0,
  total_modal      bigint generated always as
                   (total_cost + transport_cost + other_cost) stored,
  transaction_date date not null default current_date,
  notes            text,
  is_deleted       boolean not null default false,
  created_at       timestamptz default now(),
  updated_at       timestamptz default now()
);

-- SALES (broker jual ke RPA/buyer)
create table sales (
  id               uuid primary key default gen_random_uuid(),
  tenant_id        uuid references tenants(id) on delete cascade not null,
  rpa_id           uuid references rpa_clients(id) not null,
  purchase_id      uuid references purchases(id) not null,
  order_id         uuid references orders(id),     -- optional link ke order
  quantity         integer not null check (quantity > 0),
  avg_weight_kg    decimal(5,2) not null,
  total_weight_kg  decimal(10,2) not null,
  price_per_kg     integer not null check (price_per_kg > 0),
  total_revenue    bigint not null,
  delivery_cost    integer not null default 0,
  net_revenue      bigint generated always as
                   (total_revenue - delivery_cost) stored,
  payment_status   text not null default 'belum_lunas'
                   check (payment_status in
                   ('lunas','belum_lunas','sebagian')),
  paid_amount      bigint not null default 0,
  remaining_amount bigint generated always as
                   (total_revenue - paid_amount) stored,
  transaction_date date not null default current_date,
  due_date         date,
  notes            text,
  is_deleted       boolean not null default false,
  created_at       timestamptz default now(),
  updated_at       timestamptz default now()
);

-- PAYMENTS (riwayat cicilan per sale)
create table payments (
  id              uuid primary key default gen_random_uuid(),
  tenant_id       uuid references tenants(id) on delete cascade not null,
  sale_id         uuid references sales(id) on delete cascade not null,
  amount          bigint not null check (amount > 0),
  payment_date    date not null default current_date,
  payment_method  text not null default 'transfer'
                  check (payment_method in
                  ('transfer','cash','giro','qris')),
  reference_no    text,
  notes           text,
  created_at      timestamptz default now()
);

-- DELIVERIES (pengiriman ayam hidup)
create table deliveries (
  id                  uuid primary key default gen_random_uuid(),
  tenant_id           uuid references tenants(id) on delete cascade not null,
  sale_id             uuid references sales(id) not null,
  vehicle_type        text,               -- "Truk", "Pickup", "L300"
  vehicle_plate       text,               -- "B 1234 AB"
  driver_name         text,
  driver_phone        text,
  load_time           timestamptz,        -- jam mulai muat
  departure_time      timestamptz,        -- jam berangkat
  arrival_time        timestamptz,        -- jam sampai buyer
  initial_count       integer not null,
  arrived_count       integer,
  mortality_count     integer not null default 0,
  initial_weight_kg   decimal(10,2),
  arrived_weight_kg   decimal(10,2),
  shrinkage_kg        decimal(10,2)       -- dihitung manual saat update tiba
                      generated always as
                      (case
                        when initial_weight_kg is not null
                             and arrived_weight_kg is not null
                        then initial_weight_kg - arrived_weight_kg
                        else null
                       end) stored,
  delivery_cost       integer not null default 0,
  status              text not null default 'preparing'
                      check (status in
                      ('preparing','loading','on_route',
                       'arrived','completed')),
  notes               text,
  is_deleted          boolean not null default false,
  created_at          timestamptz default now(),
  updated_at          timestamptz default now()
);

-- LOSS REPORTS (kerugian lapangan)
create table loss_reports (
  id             uuid primary key default gen_random_uuid(),
  tenant_id      uuid references tenants(id) on delete cascade not null,
  sale_id        uuid references sales(id),
  delivery_id    uuid references deliveries(id),
  loss_type      text not null
                 check (loss_type in
                 ('mortality','underweight','sick',
                  'buyer_complaint','shrinkage','other')),
  chicken_count  integer not null default 0,
  weight_loss_kg decimal(10,2) not null default 0,
  price_per_kg   integer,
  financial_loss bigint,
  description    text,
  resolved       boolean not null default false,
  resolved_at    timestamptz,
  report_date    date not null default current_date,
  is_deleted     boolean not null default false,
  created_at     timestamptz default now()
);

-- EXTRA EXPENSES (biaya lain di luar sistem)
create table extra_expenses (
  id           uuid primary key default gen_random_uuid(),
  tenant_id    uuid references tenants(id) on delete cascade not null,
  category     text not null
               check (category in
               ('tenaga_kerja','sewa','administrasi',
                'komunikasi','lainnya')),
  description  text not null,
  amount       bigint not null check (amount > 0),
  expense_date date not null default current_date,
  notes        text,
  is_deleted   boolean not null default false,
  created_at   timestamptz default now()
);

-- ============================================================
-- 5. PETERNAK MODULE TABLES (siap untuk Fase 2)
-- ============================================================

-- FARM OWNERSHIP (peternak punya kandang sendiri)
create table peternak_farms (
  id              uuid primary key default gen_random_uuid(),
  tenant_id       uuid references tenants(id) on delete cascade not null,
  farm_name       text not null,
  location        text,
  address         text,
  latitude        decimal(10,7),
  longitude       decimal(10,7),
  capacity        integer not null,    -- kapasitas total (ekor)
  kandang_count   integer default 1,   -- jumlah kandang
  is_active       boolean default true,
  notes           text,
  is_deleted      boolean not null default false,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

-- BREEDING CYCLES (siklus pemeliharaan per kandang)
create table breeding_cycles (
  id                      uuid primary key default gen_random_uuid(),
  tenant_id               uuid references tenants(id) on delete cascade not null,
  peternak_farm_id        uuid references peternak_farms(id) not null,
  cycle_number            integer not null,    -- siklus ke-berapa
  chicken_type            text not null default 'broiler',
  doc_count               integer not null,    -- jumlah DOC masuk
  doc_price               integer,             -- harga DOC per ekor
  start_date              date not null,
  target_harvest_date     date,
  actual_harvest_date     date,
  target_weight_kg        decimal(5,2) default 1.9,
  target_fcr              decimal(5,3) default 1.7,
  status                  text not null default 'active'
                          check (status in
                          ('active','harvested','failed','cancelled')),
  -- Summary (dihitung dari daily_records)
  total_feed_kg           decimal(10,2) default 0,
  total_mortality         integer default 0,
  final_count             integer,
  final_avg_weight_kg     decimal(5,2),
  final_fcr               decimal(5,3),
  final_ip_score          decimal(8,2),     -- Index Performance
  total_production_cost   bigint default 0,
  cost_per_kg             integer,
  notes                   text,
  is_deleted              boolean not null default false,
  created_at              timestamptz default now(),
  updated_at              timestamptz default now(),
  unique (peternak_farm_id, cycle_number)
);

-- DAILY RECORDS (input harian peternak)
create table daily_records (
  id              uuid primary key default gen_random_uuid(),
  tenant_id       uuid references tenants(id) on delete cascade not null,
  cycle_id        uuid references breeding_cycles(id) on delete cascade not null,
  record_date     date not null,
  age_days        integer not null,       -- umur ayam hari ini
  -- Deplesi
  mortality_count integer not null default 0,
  cull_count      integer not null default 0,   -- afkir
  -- Pakan
  feed_type       text,                  -- "BR1", "BR2", dll
  feed_kg         decimal(8,2) not null default 0,
  -- Bobot (sampling)
  sample_count    integer,               -- berapa ekor yang ditimbang
  sample_weight_kg decimal(8,2),         -- total berat sampel
  avg_weight_kg   decimal(5,2),          -- bobot rata-rata hari ini
  -- Kondisi
  temperature_morning decimal(4,1),
  temperature_evening decimal(4,1),
  health_notes    text,
  notes           text,
  created_at      timestamptz default now(),
  unique (cycle_id, record_date)
);

-- FEED STOCK (stok pakan peternak)
create table feed_stocks (
  id              uuid primary key default gen_random_uuid(),
  tenant_id       uuid references tenants(id) on delete cascade not null,
  peternak_farm_id uuid references peternak_farms(id) not null,
  feed_type       text not null,
  quantity_kg     decimal(10,2) not null default 0,
  price_per_kg    integer,
  purchase_date   date,
  supplier        text,
  notes           text,
  created_at      timestamptz default now()
);

-- BROKER CONNECTIONS (peternak terhubung ke broker tertentu)
-- Fase 3: peternak bisa listing stok ke broker rekanan
create table broker_connections (
  id              uuid primary key default gen_random_uuid(),
  peternak_tenant_id uuid references tenants(id) on delete cascade not null,
  broker_tenant_id   uuid references tenants(id) on delete cascade not null,
  status          text not null default 'pending'
                  check (status in ('pending','active','blocked')),
  connected_at    timestamptz,
  created_at      timestamptz default now(),
  unique (peternak_tenant_id, broker_tenant_id)
);

-- STOCK LISTINGS (peternak publish stok ke broker — Fase 3)
create table stock_listings (
  id                      uuid primary key default gen_random_uuid(),
  peternak_tenant_id      uuid references tenants(id) on delete cascade not null,
  cycle_id                uuid references breeding_cycles(id),
  chicken_type            text not null default 'broiler',
  available_count         integer not null,
  estimated_weight_kg     decimal(5,2),
  estimated_harvest_date  date,
  asking_price_per_kg     integer,
  status                  text not null default 'available'
                          check (status in
                          ('available','booked','sold','expired')),
  visible_to              text not null default 'connected'
                          check (visible_to in
                          ('connected','public')),
  notes                   text,
  expires_at              timestamptz,
  is_deleted              boolean not null default false,
  created_at              timestamptz default now(),
  updated_at              timestamptz default now()
);

-- ============================================================
-- 6. RPA MODULE TABLES (siap untuk Fase 3)
-- ============================================================

-- RPA PROFILES (profil RPA sebagai buyer di platform)
create table rpa_profiles (
  id              uuid primary key default gen_random_uuid(),
  tenant_id       uuid references tenants(id) on delete cascade not null,
  rpa_name        text not null,
  rpa_type        text not null default 'rpa'
                  check (rpa_type in
                  ('rpa','pedagang_pasar','restoran',
                   'supermarket','pengepul','lainnya')),
  contact_person  text,
  phone           text,
  address         text,
  location        text,
  capacity_per_day integer,    -- kebutuhan per hari (ekor)
  preferred_types text[],      -- ['broiler', 'kampung']
  is_verified     boolean default false,
  notes           text,
  is_deleted      boolean not null default false,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

-- RPA PURCHASE ORDERS (order dari RPA ke broker — Fase 3)
create table rpa_purchase_orders (
  id                  uuid primary key default gen_random_uuid(),
  rpa_tenant_id       uuid references tenants(id) on delete cascade not null,
  broker_tenant_id    uuid references tenants(id),  -- null = open to all
  chicken_type        text not null default 'broiler',
  requested_count     integer not null,
  target_weight_kg    decimal(5,2),
  max_price_per_kg    integer,
  required_date       date,
  status              text not null default 'open'
                      check (status in
                      ('open','responded','confirmed',
                       'delivered','completed','cancelled')),
  notes               text,
  is_deleted          boolean not null default false,
  created_at          timestamptz default now(),
  updated_at          timestamptz default now()
);

-- RPA PAYMENT TRACKING (hutang RPA ke broker — dari sisi RPA)
create table rpa_payments (
  id              uuid primary key default gen_random_uuid(),
  rpa_tenant_id   uuid references tenants(id) on delete cascade not null,
  broker_tenant_id uuid references tenants(id) not null,
  amount          bigint not null check (amount > 0),
  payment_date    date not null default current_date,
  payment_method  text not null default 'transfer'
                  check (payment_method in
                  ('transfer','cash','giro','qris')),
  reference_no    text,
  notes           text,
  created_at      timestamptz default now()
);

-- ============================================================
-- 7. MARKET PRICES (semua role bisa akses)
-- ============================================================

create table market_prices (
  id                  uuid primary key default gen_random_uuid(),
  price_date          date not null default current_date,
  chicken_type        text not null default 'broiler',
  region              text not null default 'nasional',
  farm_gate_price     integer,             -- harga di kandang
  avg_buy_price       integer,             -- harga beli broker dari farm
  avg_sell_price      integer,             -- harga jual broker ke buyer
  buyer_price         integer,             -- harga buyer bayar ke broker
  broker_margin       integer              -- margin broker
                      generated always as
                      (case
                        when buyer_price is not null
                             and farm_gate_price is not null
                        then buyer_price - farm_gate_price
                        else null
                       end) stored,
  transaction_count   integer not null default 1,
  source              text not null default 'transaction'
                      check (source in
                      ('transaction','manual','import')),
  created_at          timestamptz default now(),
  updated_at          timestamptz default now(),
  unique (price_date, chicken_type, region)
);

-- ============================================================
-- 8. NOTIFICATIONS
-- ============================================================

create table notifications (
  id              uuid primary key default gen_random_uuid(),
  tenant_id       uuid references tenants(id) on delete cascade not null,
  type            text not null
                  check (type in
                  ('piutang_jatuh_tempo','kandang_siap_panen',
                   'order_masuk','pengiriman_tiba',
                   'loss_laporan','harga_pasar_update',
                   'subscription_expires','system')),
  title           text not null,
  body            text,
  is_read         boolean not null default false,
  action_url      text,
  metadata        jsonb,
  created_at      timestamptz default now()
);

-- ============================================================
-- 9. SUBSCRIPTION & BILLING
-- ============================================================

create table subscription_invoices (
  id                  uuid primary key default gen_random_uuid(),
  tenant_id           uuid references tenants(id) on delete cascade not null,
  invoice_number      text unique,
  amount              integer not null,
  plan                text not null
                      check (plan in ('starter','pro','business')),
  billing_period      text,               -- "Maret 2026"
  billing_months      integer default 1,
  status              text not null default 'pending'
                      check (status in
                      ('pending','paid','expired','cancelled')),
  transfer_proof_url  text,
  bank_name           text,
  transfer_date       date,
  confirmed_by        uuid references profiles(id),
  confirmed_at        timestamptz,
  notes               text,
  created_at          timestamptz default now(),
  updated_at          timestamptz default now()
);

-- PAYMENT SETTINGS (nomor rekening untuk pembayaran manual)
create table payment_settings (
  id              uuid primary key default gen_random_uuid(),
  bank_name       text not null,
  account_number  text not null,
  account_name    text not null,
  is_active       boolean default true,
  created_at      timestamptz default now()
);

-- Insert default payment settings
insert into payment_settings (bank_name, account_number, account_name)
values ('BCA', '1234567890', 'TernakOS Indonesia');

-- ============================================================
-- 10. ROW LEVEL SECURITY
-- ============================================================

-- Enable RLS
alter table tenants enable row level security;
alter table profiles enable row level security;
alter table farms enable row level security;
alter table rpa_clients enable row level security;
alter table chicken_batches enable row level security;
alter table orders enable row level security;
alter table purchases enable row level security;
alter table sales enable row level security;
alter table payments enable row level security;
alter table deliveries enable row level security;
alter table loss_reports enable row level security;
alter table extra_expenses enable row level security;
alter table peternak_farms enable row level security;
alter table breeding_cycles enable row level security;
alter table daily_records enable row level security;
alter table feed_stocks enable row level security;
alter table broker_connections enable row level security;
alter table stock_listings enable row level security;
alter table rpa_profiles enable row level security;
alter table rpa_purchase_orders enable row level security;
alter table rpa_payments enable row level security;
alter table market_prices enable row level security;
alter table notifications enable row level security;
alter table subscription_invoices enable row level security;

-- ── CORE ─────────────────────────────────────────────────────

create policy "tenant_select" on tenants for select
  using (is_my_tenant(id) or is_superadmin());

create policy "tenant_update" on tenants for update
  using (is_my_tenant(id) or is_superadmin());

create policy "profile_all" on profiles for all
  using (auth_user_id = auth.uid() or is_superadmin());

-- ── BROKER TABLES ────────────────────────────────────────────

create policy "farms_all" on farms for all
  using (is_my_tenant(tenant_id) or is_superadmin())
  with check (is_my_tenant(tenant_id) or is_superadmin());

create policy "rpa_all" on rpa_clients for all
  using (is_my_tenant(tenant_id) or is_superadmin())
  with check (is_my_tenant(tenant_id) or is_superadmin());

create policy "batches_all" on chicken_batches for all
  using (is_my_tenant(tenant_id) or is_superadmin())
  with check (is_my_tenant(tenant_id) or is_superadmin());

create policy "orders_all" on orders for all
  using (is_my_tenant(tenant_id) or is_superadmin())
  with check (is_my_tenant(tenant_id) or is_superadmin());

create policy "purchases_all" on purchases for all
  using (is_my_tenant(tenant_id) or is_superadmin())
  with check (is_my_tenant(tenant_id) or is_superadmin());

create policy "sales_all" on sales for all
  using (is_my_tenant(tenant_id) or is_superadmin())
  with check (is_my_tenant(tenant_id) or is_superadmin());

create policy "payments_all" on payments for all
  using (is_my_tenant(tenant_id) or is_superadmin())
  with check (is_my_tenant(tenant_id) or is_superadmin());

create policy "deliveries_all" on deliveries for all
  using (is_my_tenant(tenant_id) or is_superadmin())
  with check (is_my_tenant(tenant_id) or is_superadmin());

create policy "loss_all" on loss_reports for all
  using (is_my_tenant(tenant_id) or is_superadmin())
  with check (is_my_tenant(tenant_id) or is_superadmin());

create policy "expenses_all" on extra_expenses for all
  using (is_my_tenant(tenant_id) or is_superadmin())
  with check (is_my_tenant(tenant_id) or is_superadmin());

-- ── PETERNAK TABLES ──────────────────────────────────────────

create policy "peternak_farms_all" on peternak_farms for all
  using (is_my_tenant(tenant_id) or is_superadmin())
  with check (is_my_tenant(tenant_id) or is_superadmin());

create policy "cycles_all" on breeding_cycles for all
  using (is_my_tenant(tenant_id) or is_superadmin())
  with check (is_my_tenant(tenant_id) or is_superadmin());

create policy "daily_records_all" on daily_records for all
  using (is_my_tenant(tenant_id) or is_superadmin())
  with check (is_my_tenant(tenant_id) or is_superadmin());

create policy "feed_stocks_all" on feed_stocks for all
  using (is_my_tenant(tenant_id) or is_superadmin())
  with check (is_my_tenant(tenant_id) or is_superadmin());

-- Broker connections: kedua pihak bisa lihat
create policy "connections_select" on broker_connections for select
  using (
    is_my_tenant(peternak_tenant_id) or
    is_my_tenant(broker_tenant_id) or
    is_superadmin()
  );

create policy "connections_insert" on broker_connections for insert
  with check (
    is_my_tenant(peternak_tenant_id) or
    is_my_tenant(broker_tenant_id)
  );

create policy "connections_update" on broker_connections for update
  using (
    is_my_tenant(peternak_tenant_id) or
    is_my_tenant(broker_tenant_id) or
    is_superadmin()
  );

-- Stock listings: broker yang connected bisa lihat
create policy "listings_select" on stock_listings for select
  using (
    is_my_tenant(peternak_tenant_id) or
    visible_to = 'public' or
    is_superadmin() or
    (
      visible_to = 'connected' and
      exists(
        select 1 from broker_connections
        where peternak_tenant_id = stock_listings.peternak_tenant_id
        and is_my_tenant(broker_tenant_id)
        and status = 'active'
      )
    )
  );

create policy "listings_write" on stock_listings for all
  using (is_my_tenant(peternak_tenant_id) or is_superadmin())
  with check (is_my_tenant(peternak_tenant_id));

-- ── RPA TABLES ───────────────────────────────────────────────

create policy "rpa_profiles_all" on rpa_profiles for all
  using (is_my_tenant(tenant_id) or is_superadmin())
  with check (is_my_tenant(tenant_id) or is_superadmin());

create policy "rpa_orders_all" on rpa_purchase_orders for all
  using (
    is_my_tenant(rpa_tenant_id) or
    is_my_tenant(broker_tenant_id) or
    is_superadmin()
  );

create policy "rpa_payments_all" on rpa_payments for all
  using (
    is_my_tenant(rpa_tenant_id) or
    is_my_tenant(broker_tenant_id) or
    is_superadmin()
  );

-- ── MARKET PRICES — semua bisa baca, insert dari transaksi ───

create policy "market_read" on market_prices for select using (true);
create policy "market_insert" on market_prices for insert with check (true);
create policy "market_update" on market_prices for update using (true);

-- ── NOTIFICATIONS ────────────────────────────────────────────

create policy "notif_all" on notifications for all
  using (is_my_tenant(tenant_id) or is_superadmin())
  with check (is_my_tenant(tenant_id) or is_superadmin());

-- ── BILLING ──────────────────────────────────────────────────

create policy "invoice_all" on subscription_invoices for all
  using (tenant_id = my_tenant_id() or is_superadmin())
  with check (tenant_id = my_tenant_id());

-- Payment settings: semua bisa baca
create policy "pay_settings_read" on payment_settings
  for select using (true);

-- ============================================================
-- 11. TRIGGERS — BUSINESS LOGIC
-- ============================================================

-- Auto updated_at untuk semua tabel utama
create trigger upd_tenants before update on tenants
  for each row execute procedure set_updated_at();

create trigger upd_profiles before update on profiles
  for each row execute procedure set_updated_at();

create trigger upd_farms before update on farms
  for each row execute procedure set_updated_at();

create trigger upd_rpa before update on rpa_clients
  for each row execute procedure set_updated_at();

create trigger upd_batches before update on chicken_batches
  for each row execute procedure set_updated_at();

create trigger upd_orders before update on orders
  for each row execute procedure set_updated_at();

create trigger upd_purchases before update on purchases
  for each row execute procedure set_updated_at();

create trigger upd_sales before update on sales
  for each row execute procedure set_updated_at();

create trigger upd_deliveries before update on deliveries
  for each row execute procedure set_updated_at();

create trigger upd_peternak_farms before update on peternak_farms
  for each row execute procedure set_updated_at();

create trigger upd_cycles before update on breeding_cycles
  for each row execute procedure set_updated_at();

create trigger upd_listings before update on stock_listings
  for each row execute procedure set_updated_at();

create trigger upd_invoices before update on subscription_invoices
  for each row execute procedure set_updated_at();

-- ── SYNC RPA OUTSTANDING ─────────────────────────────────────
-- Auto-update total_outstanding di rpa_clients
-- setiap ada perubahan di tabel sales

create or replace function sync_rpa_outstanding()
returns trigger language plpgsql
set search_path = public
as $$
declare
  v_rpa_id uuid;
  v_tenant_id uuid;
begin
  v_rpa_id    := coalesce(new.rpa_id, old.rpa_id);
  v_tenant_id := coalesce(new.tenant_id, old.tenant_id);

  update rpa_clients set
    total_outstanding = (
      select coalesce(sum(remaining_amount), 0)
      from sales
      where rpa_id = v_rpa_id
        and payment_status != 'lunas'
        and is_deleted = false
    ),
    last_deal_price = (
      select price_per_kg from sales
      where rpa_id = v_rpa_id
        and is_deleted = false
      order by created_at desc
      limit 1
    )
  where id = v_rpa_id
    and tenant_id = v_tenant_id;

  return coalesce(new, old);
end;
$$;

create trigger t_sync_outstanding
  after insert or update or delete on sales
  for each row execute procedure sync_rpa_outstanding();

-- ── UPDATE PAID AMOUNT DARI PAYMENTS ─────────────────────────
-- Setiap payment insert → update paid_amount di sale

create or replace function sync_sale_payment()
returns trigger language plpgsql
set search_path = public
as $$
declare
  v_total_paid bigint;
  v_sale       sales%rowtype;
begin
  select sum(amount) into v_total_paid
  from payments
  where sale_id = new.sale_id;

  select * into v_sale from sales where id = new.sale_id;

  update sales set
    paid_amount = v_total_paid,
    payment_status = case
      when v_total_paid >= v_sale.total_revenue then 'lunas'
      when v_total_paid > 0 then 'sebagian'
      else 'belum_lunas'
    end
  where id = new.sale_id;

  return new;
end;
$$;

create trigger t_sync_payment
  after insert on payments
  for each row execute procedure sync_sale_payment();

-- ── RECORD MARKET PRICE DARI TRANSAKSI ───────────────────────
-- Setiap purchase/sale baru → update harga pasar anonim

create or replace function record_market_price()
returns trigger language plpgsql
set search_path = public
as $$
declare
  v_date   date := new.transaction_date;
  v_region text := 'nasional';
begin
  if TG_TABLE_NAME = 'purchases' then
    insert into market_prices
      (price_date, chicken_type, region,
       avg_buy_price, farm_gate_price, transaction_count)
    values (v_date, 'broiler', v_region, new.price_per_kg,
            new.price_per_kg, 1)
    on conflict (price_date, chicken_type, region) do update set
      avg_buy_price = (
        market_prices.avg_buy_price * market_prices.transaction_count
        + excluded.avg_buy_price
      ) / (market_prices.transaction_count + 1),
      farm_gate_price = (
        coalesce(market_prices.farm_gate_price, 0)
        * market_prices.transaction_count
        + excluded.farm_gate_price
      ) / (market_prices.transaction_count + 1),
      transaction_count = market_prices.transaction_count + 1,
      updated_at = now();
  end if;

  if TG_TABLE_NAME = 'sales' then
    insert into market_prices
      (price_date, chicken_type, region,
       avg_sell_price, buyer_price, transaction_count)
    values (v_date, 'broiler', v_region, new.price_per_kg,
            new.price_per_kg, 1)
    on conflict (price_date, chicken_type, region) do update set
      avg_sell_price = (
        coalesce(market_prices.avg_sell_price, 0)
        * market_prices.transaction_count
        + excluded.avg_sell_price
      ) / (market_prices.transaction_count + 1),
      buyer_price = (
        coalesce(market_prices.buyer_price, 0)
        * market_prices.transaction_count
        + excluded.buyer_price
      ) / (market_prices.transaction_count + 1),
      transaction_count = market_prices.transaction_count + 1,
      updated_at = now();
  end if;

  return new;
end;
$$;

create trigger t_market_from_purchase
  after insert on purchases
  for each row execute procedure record_market_price();

create trigger t_market_from_sale
  after insert on sales
  for each row execute procedure record_market_price();

-- ── UPDATE FARM LAST TRANSACTION ─────────────────────────────

create or replace function update_farm_last_transaction()
returns trigger language plpgsql
set search_path = public
as $$
begin
  update farms set
    last_transaction_date = new.transaction_date
  where id = new.farm_id;
  return new;
end;
$$;

create trigger t_farm_last_txn
  after insert on purchases
  for each row execute procedure update_farm_last_transaction();

-- ── UPDATE BREEDING CYCLE SUMMARY ────────────────────────────
-- Setiap daily_record insert → recalculate cycle stats

create or replace function update_cycle_summary()
returns trigger language plpgsql
set search_path = public
as $$
declare
  v_cycle breeding_cycles%rowtype;
  v_total_feed decimal;
  v_total_mortality integer;
  v_days integer;
  v_fcr decimal;
begin
  select * into v_cycle from breeding_cycles where id = new.cycle_id;

  select
    coalesce(sum(feed_kg), 0),
    coalesce(sum(mortality_count + cull_count), 0),
    count(*)
  into v_total_feed, v_total_mortality, v_days
  from daily_records
  where cycle_id = new.cycle_id;

  -- FCR = total pakan / (jumlah hidup × bobot rata-rata)
  if new.avg_weight_kg is not null
     and (v_cycle.doc_count - v_total_mortality) > 0 then
    v_fcr := v_total_feed /
             ((v_cycle.doc_count - v_total_mortality) * new.avg_weight_kg);
  end if;

  update breeding_cycles set
    total_feed_kg    = v_total_feed,
    total_mortality  = v_total_mortality,
    final_count      = v_cycle.doc_count - v_total_mortality,
    final_avg_weight_kg = new.avg_weight_kg,
    final_fcr        = v_fcr
  where id = new.cycle_id;

  return new;
end;
$$;

create trigger t_cycle_summary
  after insert or update on daily_records
  for each row execute procedure update_cycle_summary();

-- ── AUTO INVOICE NUMBER ───────────────────────────────────────

create or replace function generate_invoice_number()
returns trigger language plpgsql
set search_path = public
as $$
begin
  if new.invoice_number is null then
    new.invoice_number := 'INV-' ||
      to_char(now(), 'YYYYMM') || '-' ||
      lpad(nextval('invoice_seq')::text, 4, '0');
  end if;
  return new;
end;
$$;

create sequence if not exists invoice_seq start 1;

create trigger t_invoice_number
  before insert on subscription_invoices
  for each row execute procedure generate_invoice_number();

-- ============================================================
-- 12. INDEXES
-- ============================================================

-- Farms
create index idx_farms_tenant on farms(tenant_id) where not is_deleted;
create index idx_farms_status on farms(tenant_id, status) where not is_deleted;
create index idx_farms_harvest on farms(tenant_id, harvest_date) where not is_deleted;

-- RPA
create index idx_rpa_tenant on rpa_clients(tenant_id) where not is_deleted;
create index idx_rpa_outstanding on rpa_clients(tenant_id, total_outstanding desc) where not is_deleted;

-- Batches
create index idx_batches_tenant on chicken_batches(tenant_id) where not is_deleted;
create index idx_batches_status on chicken_batches(tenant_id, status) where not is_deleted;
create index idx_batches_harvest on chicken_batches(tenant_id, estimated_harvest_date) where not is_deleted;

-- Orders
create index idx_orders_tenant on orders(tenant_id) where not is_deleted;
create index idx_orders_status on orders(tenant_id, status) where not is_deleted;
create index idx_orders_rpa on orders(rpa_id) where not is_deleted;

-- Purchases
create index idx_purchases_tenant on purchases(tenant_id) where not is_deleted;
create index idx_purchases_date on purchases(tenant_id, transaction_date desc) where not is_deleted;
create index idx_purchases_farm on purchases(farm_id) where not is_deleted;

-- Sales
create index idx_sales_tenant on sales(tenant_id) where not is_deleted;
create index idx_sales_date on sales(tenant_id, transaction_date desc) where not is_deleted;
create index idx_sales_rpa on sales(rpa_id) where not is_deleted;
create index idx_sales_status on sales(tenant_id, payment_status) where not is_deleted;
create index idx_sales_due on sales(tenant_id, due_date) where not is_deleted and payment_status != 'lunas';

-- Payments
create index idx_payments_sale on payments(sale_id);
create index idx_payments_tenant on payments(tenant_id);
create index idx_payments_date on payments(tenant_id, payment_date desc);

-- Deliveries
create index idx_deliveries_tenant on deliveries(tenant_id) where not is_deleted;
create index idx_deliveries_status on deliveries(tenant_id, status) where not is_deleted;
create index idx_deliveries_sale on deliveries(sale_id);

-- Loss reports
create index idx_loss_tenant on loss_reports(tenant_id) where not is_deleted;
create index idx_loss_date on loss_reports(tenant_id, report_date desc) where not is_deleted;

-- Peternak
create index idx_peternak_farms on peternak_farms(tenant_id) where not is_deleted;
create index idx_cycles_farm on breeding_cycles(peternak_farm_id) where not is_deleted;
create index idx_cycles_status on breeding_cycles(tenant_id, status) where not is_deleted;
create index idx_daily_cycle on daily_records(cycle_id, record_date desc);

-- Market prices
create index idx_market_date on market_prices(price_date desc);
create index idx_market_type on market_prices(chicken_type, price_date desc);

-- Notifications
create index idx_notif_tenant on notifications(tenant_id, created_at desc);
create index idx_notif_unread on notifications(tenant_id) where not is_read;

-- Invoices
create index idx_invoice_tenant on subscription_invoices(tenant_id, status);

-- ============================================================
-- 13. TASK SYSTEM — Peternak Vertical
-- ============================================================

create table if not exists peternak_task_templates (
    id              uuid primary key default gen_random_uuid(),
    tenant_id       uuid references tenants(id) on delete cascade not null,
    kandang_name    text, -- null for all kandangs
    title           text not null,
    description     text,
    task_type       text not null,
    recurring_type  text not null,
    recurring_days_of_week integer[],
    recurring_interval_days integer,
    due_time        time not null default '08:00:00',
    start_date      date not null default current_date,
    end_date        date,
    linked_data_entry boolean default false,
    default_assignee_worker_id uuid references kandang_workers(id),
    is_active       boolean default true,
    is_deleted      boolean default false,
    created_at      timestamptz default now(),
    updated_at      timestamptz default now()
);

create table if not exists peternak_task_instances (
    id              uuid primary key default gen_random_uuid(),
    tenant_id       uuid references tenants(id) on delete cascade not null,
    template_id     uuid references peternak_task_templates(id) on delete set null,
    kandang_name    text,
    task_type       text not null,
    due_date        date not null,
    due_time        time,
    status          text not null default 'pending',
    notes           text,
    assigned_worker_id uuid references kandang_workers(id),
    assigned_profile_id uuid references profiles(id),
    completed_at    timestamptz,
    completed_by_profile_id uuid references profiles(id),
    linked_record_id uuid,
    linked_record_table text,
    is_deleted      boolean default false,
    created_at      timestamptz default now(),
    updated_at      timestamptz default now()
);

-- RLS — Task System
alter table peternak_task_templates enable row level security;
alter table peternak_task_instances enable row level security;

-- NOTE: Policies were already run via SQL Editor with permissive 'OR' logic
-- to avoid conflicts with existing Sapi policies while enabling Domba access.

-- ============================================================
-- 14. SEED DATA — untuk testing
-- ============================================================

-- Seed market prices 7 hari terakhir
insert into market_prices
  (price_date, chicken_type, region, avg_buy_price, avg_sell_price,
   farm_gate_price, buyer_price, transaction_count, source)
values
  (current_date - 6, 'broiler', 'nasional', 19200, 22800, 19000, 22800, 3, 'manual'),
  (current_date - 5, 'broiler', 'nasional', 19400, 23000, 19200, 23000, 4, 'manual'),
  (current_date - 4, 'broiler', 'nasional', 19300, 22900, 19100, 22900, 3, 'manual'),
  (current_date - 3, 'broiler', 'nasional', 19500, 23200, 19300, 23200, 5, 'manual'),
  (current_date - 2, 'broiler', 'nasional', 19600, 23400, 19400, 23400, 4, 'manual'),
  (current_date - 1, 'broiler', 'nasional', 19500, 23300, 19300, 23300, 6, 'manual'),
  (current_date,     'broiler', 'nasional', 19800, 23600, 19600, 23600, 2, 'manual')
on conflict (price_date, chicken_type, region) do nothing;

-- ============================================================
-- SELESAI
-- Verifikasi dengan:
--   select table_name from information_schema.tables
--   where table_schema = 'public'
--   order by table_name;
-- ============================================================
