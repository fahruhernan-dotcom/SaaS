# TernakOS — Master Prompt Guide
> Jalankan satu prompt per sesi, urut dari atas ke bawah.
> Jangan loncat. Jangan campur. Tunggu selesai 100% sebelum lanjut.

---

## Ringkasan Workflow

```
PROMPT 1  →  Emergent (tab: Landing Page)
             Landing page TernakOS dengan React + animasi

PROMPT 2  →  Emergent (tab: Full Stack App)
             Broker dashboard + Admin dashboard
             Supabase + auth + role selection + harga pasar

PROMPT 3  →  Cursor / Antigravity
             Setup CONTEXT.md setelah clone dari GitHub

PROMPT 4  →  Cursor / Antigravity
             Polish & fix setelah scaffold Emergent

PROMPT 5  →  Cursor / Antigravity
             Export laporan Excel

PROMPT 6  →  Cursor / Antigravity
             Sistem pembayaran manual (konfirmasi transfer)

PROMPT 7  →  Cursor / Antigravity
             Onboarding flow setelah register
```

---
---

## PROMPT 1 — EMERGENT (tab: Landing Page)
### Landing Page TernakOS

> Buka Emergent → pilih tab **"Landing Page"** → paste ini.
> Setelah selesai: preview, cek di mobile view, push ke GitHub.

```
Build a modern, high-converting landing page for TernakOS.
Use React with Framer Motion for smooth animations throughout.

==========================================================
BRAND
==========================================================

Nama produk : TernakOS
Tagline     : "Satu platform untuk semua bisnis peternakan Indonesia"
Bahasa      : Bahasa Indonesia 100% — tidak ada kata bahasa Inggris
              yang terlihat di UI
Target user : Broker ayam dan peternak di Pulau Jawa, Indonesia.
              Mereka bukan tech-savvy. Mereka paham istilah:
              kandang, RPA, FCR, piutang, margin, ekor, kg.
Tone        : Hangat, profesional, dapat dipercaya.
              Seperti ngobrol dengan orang yang ngerti bisnis ternak.

==========================================================
DESIGN SYSTEM
==========================================================

Warna:
  Primary       : #16A34A  (hijau utama)
  Primary Dark  : #15803D
  Primary Light : #DCFCE7
  Background    : #F0FDF4  (hijau sangat muda)
  Surface       : #FFFFFF
  Border        : #E2E8F0
  Text utama    : #0F172A
  Text muted    : #64748B
  Danger        : #DC2626
  Warning       : #D97706

Font: Plus Jakarta Sans (import dari Google Fonts)
  weights: 400, 500, 600, 700, 800

Animasi (Framer Motion):
  - Semua section: fade in + slide up saat masuk viewport
  - Stagger children: delay 0.1s per elemen
  - Hover cards: scale 1.02, shadow lebih dalam
  - Tombol CTA: scale 0.97 saat diklik
  - Navbar: blur backdrop saat scroll

==========================================================
SECTIONS (urut dari atas ke bawah)
==========================================================

── 1. NAVBAR ────────────────────────────────────────────

- Logo kiri: ikon ayam 🐔 + teks "TernakOS" (hijau, bold)
- Nav links tengah: Fitur | Harga | Tentang Kami
- Tombol kanan: "Masuk" (outline) + "Coba Gratis" (hijau solid)
- Sticky saat scroll
- Background: putih/90% dengan backdrop blur saat scroll
- Mobile: hamburger menu, drawer dari kanan

── 2. HERO ──────────────────────────────────────────────

Background: gradient sangat lembut dari #F0FDF4 ke putih
Layout: teks kiri, visual kanan (di mobile: teks atas, visual bawah)

Headline (besar, bold, 48px desktop / 32px mobile):
"Kelola Bisnis Ternak Lebih Cepat, Lebih Rapi"

Sub-headline (18px, muted):
"Catat transaksi, hitung profit, pantau piutang RPA —
semua otomatis. Khusus untuk broker dan peternak Indonesia."

Dua tombol CTA:
  Primary (hijau, besar): "Mulai Gratis Sekarang"
    → scroll ke section #daftar atau link ke /register
  Secondary (outline): "Lihat Cara Kerja"
    → scroll ke section #cara-kerja

Social proof kecil di bawah tombol:
  ⭐⭐⭐⭐⭐ "Dipercaya 500+ pelaku bisnis ternak di Jawa"

Visual kanan:
  Mockup dashboard di dalam frame HP Android
  Tampilkan: stat cards profit + list piutang RPA
  Animasi: float up-down pelan (infinite, subtle)

── 3. PAIN POINTS ───────────────────────────────────────

Background: putih
Title: "Masalah yang Sering Bikin Pusing"
Subtitle: "Kalau kamu pernah merasakan salah satu ini,
           TernakOS dibuat untuk kamu."

3 kartu (grid, animasi stagger masuk satu per satu):

Kartu 1:
  Ikon: 🧮
  Judul: "Capek hitung margin manual?"
  Isi: "Setiap transaksi kamu hitung sendiri pakai
       kalkulator atau Excel. Kalau banyak transaksi,
       mudah salah dan makan waktu."

Kartu 2:
  Ikon: 😰
  Judul: "Lupa siapa RPA yang belum bayar?"
  Isi: "Hutang dari 5 RPA berbeda, jatuh tempo
       beda-beda. Satu kelewat bisa bikin cashflow
       kamu berantakan."

Kartu 3:
  Ikon: 📞
  Judul: "Harus telepon satu per satu cek stok kandang?"
  Isi: "Mau tahu ayam mana yang siap panen, kamu harus
       hubungi peternak satu per satu. Buang waktu."

── 4. SOLUSI / FITUR ────────────────────────────────────

Background: #F8FAFC
Title: "Semua Selesai dalam Satu Platform"

3 blok fitur (alternating layout: gambar kiri-teks kanan,
lalu teks kiri-gambar kanan, dst):

FITUR 1 — Transaksi & Profit Otomatis
  Headline: "Profit langsung kelihatan sebelum deal terjadi"
  Isi: "Input pembelian dari kandang dan penjualan ke RPA.
       Margin per kg, total profit, semua dihitung otomatis.
       Ada simulator margin sebelum kamu deal — tidak perlu
       tebak-tebak lagi."
  Visual: mockup form catat penjualan + kotak profit preview
          (hijau kalau untung, merah kalau rugi)

FITUR 2 — Tracker Piutang RPA
  Headline: "Tidak ada hutang yang kelewat lagi"
  Isi: "Semua piutang RPA tercatat dengan jatuh tempo.
       Satu ketukan tandai lunas. Lihat siapa yang paling
       lama belum bayar — langsung dari beranda."
  Visual: mockup list piutang dengan badge merah dan
          tombol "Tandai Lunas"

FITUR 3 — Harga Pasar Real-Time
  Headline: "Tahu harga pasar sebelum nego"
  Isi: "Harga beli dan jual ayam diperbarui otomatis dari
       transaksi broker di platform. Kamu tahu rata-rata
       harga pasar hari ini sebelum mulai negosiasi."
  Visual: mockup grafik harga pasar 7 hari terakhir

── 5. CARA KERJA ────────────────────────────────────────

id="cara-kerja"
Background: putih
Title: "Mulai dalam 3 Langkah"

3 langkah (horizontal di desktop, vertikal di mobile):
Garis penghubung antar langkah (animasi draw saat masuk viewport)

Langkah 1:
  Nomor: 01
  Ikon: 📝
  Judul: "Daftar gratis"
  Isi: "Buat akun dalam 30 detik. Pilih apakah kamu
       broker atau peternak."

Langkah 2:
  Nomor: 02
  Ikon: ⚙️
  Judul: "Setup bisnis kamu"
  Isi: "Tambahkan kandang rekanan dan daftar RPA pembeli.
       Cukup sekali, langsung bisa pakai."

Langkah 3:
  Nomor: 03
  Ikon: 📊
  Judul: "Catat dan pantau"
  Isi: "Setiap transaksi dicatat, profit otomatis terhitung,
       piutang terpantau. Semua dari HP kamu."

── 6. HARGA ─────────────────────────────────────────────

id="harga"
Background: #F0FDF4
Title: "Pilih Plan yang Sesuai Bisnismu"
Subtitle: "Mulai gratis, upgrade kapan saja. Tidak ada kontrak."

3 kartu pricing (tengah = most popular, sedikit lebih besar):

GRATIS — Rp 0 / bulan
  - 1 pengguna
  - Riwayat data 3 bulan
  - Catat transaksi beli & jual
  - Manajemen kandang & RPA
  - Tracker piutang dasar
  CTA: "Mulai Gratis" (outline hijau)
  Note: "Tidak perlu kartu kredit"

BASIC — Rp 99.000 / bulan  [badge: PALING POPULER]
Card ini sedikit lebih besar, border hijau lebih tebal
  - 2 pengguna
  - Riwayat data tak terbatas
  - Semua fitur Gratis +
  - Laporan profit bulanan
  - Export ke Excel
  - Simulator margin
  - Harga pasar real-time
  CTA: "Coba 14 Hari Gratis" (hijau solid)

PRO — Rp 249.000 / bulan
  - 5 pengguna
  - Riwayat data tak terbatas
  - Semua fitur Basic +
  - Analitik lengkap
  - Laporan PDF & Excel
  - Prioritas support
  CTA: "Coba 14 Hari Gratis" (hijau solid)

FAQ kecil di bawah pricing:
"Bisa cancel kapan saja?" → Ya, tanpa biaya
"Kalau mau upgrade nanti bisa?" → Bisa kapan saja

── 7. TESTIMONI ─────────────────────────────────────────

Background: putih
Title: "Kata Mereka yang Sudah Pakai"

3 kartu testimoni (carousel di mobile, grid di desktop):

Testimoni 1:
  Foto: avatar inisial "BS" (warna hijau)
  Nama: Pak Budi Santoso
  Role: Broker Ayam, Boyolali
  Bintang: ⭐⭐⭐⭐⭐
  Teks: "Dulu hitung margin pakai kalkulator HP, sekarang
        langsung keliatan begitu saya input. Sangat
        membantu sekali buat bisnis saya."

Testimoni 2:
  Foto: avatar inisial "RH" (warna biru)
  Nama: Pak Rudi Hartono
  Role: Broker & Peternak, Solo
  Bintang: ⭐⭐⭐⭐⭐
  Teks: "Piutang dari 4 RPA sekarang tidak ada yang
        kelewat. Aplikasinya simple, langsung bisa
        dipakai tanpa perlu belajar lama."

Testimoni 3:
  Foto: avatar inisial "SW" (warna amber)
  Nama: Bu Sri Wahyuni
  Role: Peternak Broiler, Klaten
  Bintang: ⭐⭐⭐⭐⭐
  Teks: "Stok dan estimasi panen kandang saya sekarang
        bisa dipantau broker rekanan langsung dari
        aplikasi. Tidak perlu sering-sering ditelepon."

── 8. CTA FINAL ─────────────────────────────────────────

id="daftar"
Background: gradient hijau (#16A34A ke #15803D)
Text: putih

Headline: "Siap Kelola Bisnis Ternak Lebih Rapi?"
Sub: "Bergabung dengan ratusan broker dan peternak yang
     sudah merasakan manfaatnya."

Tombol besar putih: "Daftar Gratis Sekarang"
  → /register

Kecil di bawah: "Gratis selamanya untuk paket dasar.
                  Tidak perlu kartu kredit."

── 9. FOOTER ────────────────────────────────────────────

Background: #0F172A (dark)
Text: putih/abu

Kiri: Logo + tagline + deskripsi singkat

Tengah:
  Produk: Fitur | Harga | Cara Kerja
  Perusahaan: Tentang | Blog | Kontak

Kanan:
  Ikuti Kami: Instagram | WhatsApp

Bawah: "© 2025 TernakOS. Dibuat dengan ❤️ untuk
        pelaku bisnis peternakan Indonesia."

==========================================================
TECHNICAL REQUIREMENTS
==========================================================

Framework  : React (Vite)
Styling    : Tailwind CSS
Animasi    : Framer Motion — wajib di semua section
Fonts      : Plus Jakarta Sans dari Google Fonts
Routing    : React Router — /register dan /login
             redirect ke placeholder page untuk sekarang
Responsive : Mobile-first, breakpoints sm/md/lg
Icons      : Lucide React

Animasi wajib:
  - useInView dari framer-motion untuk trigger saat scroll
  - Setiap section: initial opacity 0, y 40 → animate opacity 1, y 0
  - Stagger children dengan delayChildren dan staggerChildren
  - Navbar background blur muncul smooth saat scroll > 50px
  - Tombol CTA: whileHover scale 1.03, whileTap scale 0.97
  - Kartu fitur: whileHover scale 1.02 + shadow lebih dalam
  - Hero mockup: animate y [0, -12, 0] infinite (float effect)
  - Angka di social proof: count up animation saat masuk viewport

==========================================================
OUTPUT
==========================================================

- Single page React app, fully responsive
- Semua animasi berjalan smooth di mobile
- Push ke GitHub repository
- README dengan cara run locally
```

---
---

## PROMPT 2 — EMERGENT (tab: Full Stack App)
### Broker Dashboard + Admin Dashboard + Supabase

> Buka Emergent → project BARU → tab **"Full Stack App"** → paste ini.
> ATAU lanjutkan di project yang sama kalau Emergent support.
> Setelah selesai: connect GitHub repo yang sama dengan landing page.

```
Build the full-stack application for TernakOS.
This is the core SaaS platform — broker dashboard dan admin dashboard.
Connect to Supabase for database, auth, and realtime.

==========================================================
TECH STACK
==========================================================

Frontend   : React + Vite, Tailwind CSS, Framer Motion
             React Query, React Hook Form + Zod
             Recharts, Lucide React, Sonner, date-fns
Backend/DB : Supabase (PostgreSQL + Auth + Realtime)
Language   : Bahasa Indonesia 100%

==========================================================
DESIGN SYSTEM
==========================================================

(sama persis dengan landing page)
Primary    : #16A34A | Background : #F0FDF4
Surface    : #FFFFFF | Border     : #E2E8F0
Text       : #0F172A | Muted      : #64748B
Danger     : #DC2626 | Warning    : #D97706
Font       : Plus Jakarta Sans
Numbers    : font-variant-numeric: tabular-nums
Currency   : Intl.NumberFormat('id-ID') → "Rp 1.250.000"
Short IDR  : ≥1M → "Rp 1,2jt" | ≥1K → "Rp 850rb"
All IDR    : stored as bigint (no decimals)

==========================================================
DATABASE SCHEMA — jalankan di Supabase SQL Editor
==========================================================

-- EXTENSIONS
create extension if not exists "uuid-ossp";

-- TENANTS
create table tenants (
  id            uuid primary key default gen_random_uuid(),
  business_name text not null,
  plan          text not null default 'free'
                check (plan in ('free','basic','pro')),
  is_active     boolean default true,
  trial_ends_at timestamptz default (now() + interval '14 days'),
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- PROFILES
create table profiles (
  id            uuid primary key default gen_random_uuid(),
  tenant_id     uuid references tenants(id) on delete cascade not null,
  auth_user_id  uuid references auth.users(id) on delete cascade unique not null,
  full_name     text,
  role          text not null default 'owner'
                check (role in ('owner','broker','finance',
                                'peternak','pedagang','superadmin')),
  user_type     text check (user_type in ('broker','peternak')),
  phone         text,
  is_active     boolean default true,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- Auto-create tenant + profile saat register
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
declare v_tenant_id uuid;
begin
  insert into tenants(business_name)
  values(coalesce(
    new.raw_user_meta_data->>'business_name',
    'Bisnis Saya'
  ))
  returning id into v_tenant_id;

  insert into profiles(tenant_id, auth_user_id, full_name, role)
  values(
    v_tenant_id,
    new.id,
    new.raw_user_meta_data->>'full_name',
    'owner'
  );
  return new;
end;$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- Helper: ambil tenant_id user yang login
create or replace function my_tenant_id()
returns uuid language sql security definer stable as $$
  select tenant_id from profiles
  where auth_user_id = auth.uid() limit 1;
$$;

-- Helper: cek apakah user adalah superadmin platform
create or replace function is_superadmin()
returns boolean language sql security definer stable as $$
  select exists(
    select 1 from profiles
    where auth_user_id = auth.uid()
    and role = 'superadmin'
  );
$$;

-- FARMS (Kandang)
create table farms (
  id              uuid primary key default gen_random_uuid(),
  tenant_id       uuid references tenants(id) on delete cascade not null,
  farm_name       text not null,
  owner_name      text not null,
  phone           text,
  location        text,
  chicken_type    text not null default 'broiler'
                  check (chicken_type in
                  ('broiler','kampung','layer','petelur')),
  available_stock integer not null default 0,
  avg_weight      decimal(5,2),
  harvest_date    date,
  status          text not null default 'growing'
                  check (status in ('ready','growing','empty')),
  notes           text,
  is_deleted      boolean not null default false,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

-- RPA CLIENTS
create table rpa_clients (
  id               uuid primary key default gen_random_uuid(),
  tenant_id        uuid references tenants(id) on delete cascade not null,
  rpa_name         text not null,
  contact_person   text,
  phone            text,
  location         text,
  payment_terms    text not null default 'cash'
                   check (payment_terms in
                   ('cash','net7','net14','net30')),
  credit_limit     bigint default 0,
  total_outstanding bigint default 0,
  is_deleted       boolean not null default false,
  created_at       timestamptz default now(),
  updated_at       timestamptz default now()
);

-- PURCHASES (Broker beli dari kandang)
create table purchases (
  id               uuid primary key default gen_random_uuid(),
  tenant_id        uuid references tenants(id) on delete cascade not null,
  farm_id          uuid references farms(id) not null,
  quantity         integer not null check (quantity > 0),
  avg_weight       decimal(5,2) not null,
  total_weight     decimal(10,2) not null,
  price_per_kg     integer not null,
  total_cost       bigint not null,
  transport_cost   integer not null default 0,
  total_modal      bigint generated always as
                   (total_cost + transport_cost) stored,
  transaction_date date not null default current_date,
  notes            text,
  is_deleted       boolean not null default false,
  created_at       timestamptz default now(),
  updated_at       timestamptz default now()
);

-- SALES (Broker jual ke RPA)
create table sales (
  id               uuid primary key default gen_random_uuid(),
  tenant_id        uuid references tenants(id) on delete cascade not null,
  rpa_id           uuid references rpa_clients(id) not null,
  purchase_id      uuid references purchases(id) not null,
  quantity         integer not null,
  avg_weight       decimal(5,2) not null,
  total_weight     decimal(10,2) not null,
  price_per_kg     integer not null,
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

-- PAYMENTS (riwayat cicilan pembayaran)
create table payments (
  id             uuid primary key default gen_random_uuid(),
  tenant_id      uuid references tenants(id) on delete cascade not null,
  sale_id        uuid references sales(id) on delete cascade not null,
  amount         bigint not null check (amount > 0),
  payment_date   date not null default current_date,
  payment_method text not null default 'transfer'
                 check (payment_method in ('transfer','cash','giro')),
  notes          text,
  created_at     timestamptz default now()
);

-- MARKET PRICES
-- Auto-populated dari setiap transaksi broker (via trigger)
-- Semua broker bisa lihat rata-rata, anonim
create table market_prices (
  id            uuid primary key default gen_random_uuid(),
  price_date    date not null default current_date,
  chicken_type  text not null default 'broiler',
  region        text default 'nasional',
  avg_buy_price integer,
  avg_sell_price integer,
  transaction_count integer default 1,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now(),
  unique (price_date, chicken_type, region)
);

-- SUBSCRIPTION INVOICES (pembayaran manual)
create table subscription_invoices (
  id              uuid primary key default gen_random_uuid(),
  tenant_id       uuid references tenants(id) on delete cascade not null,
  amount          integer not null,
  plan            text not null check (plan in ('basic','pro')),
  billing_period  text,
  status          text not null default 'pending'
                  check (status in ('pending','paid','expired')),
  transfer_proof_url text,
  confirmed_by    uuid references profiles(id),
  confirmed_at    timestamptz,
  notes           text,
  created_at      timestamptz default now()
);

-- INDEXES
create index on farms(tenant_id) where not is_deleted;
create index on farms(tenant_id, status) where not is_deleted;
create index on rpa_clients(tenant_id) where not is_deleted;
create index on purchases(tenant_id, transaction_date desc)
  where not is_deleted;
create index on sales(tenant_id, payment_status)
  where not is_deleted;
create index on sales(rpa_id) where not is_deleted;
create index on sales(tenant_id, transaction_date desc)
  where not is_deleted;
create index on payments(sale_id);
create index on market_prices(price_date desc);
create index on subscription_invoices(tenant_id, status);

-- AUTO updated_at
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;$$;

create trigger t_farms on farms before update
  for each row execute procedure update_updated_at();
create trigger t_rpa on rpa_clients before update
  for each row execute procedure update_updated_at();
create trigger t_purchases on purchases before update
  for each row execute procedure update_updated_at();
create trigger t_sales on sales before update
  for each row execute procedure update_updated_at();

-- AUTO-SYNC total_outstanding di rpa_clients
create or replace function sync_rpa_outstanding()
returns trigger language plpgsql as $$
declare v_rpa_id uuid;
begin
  v_rpa_id := coalesce(new.rpa_id, old.rpa_id);
  update rpa_clients set
    total_outstanding = (
      select coalesce(sum(remaining_amount), 0)
      from sales
      where rpa_id = v_rpa_id
        and payment_status != 'lunas'
        and not is_deleted
    )
  where id = v_rpa_id;
  return coalesce(new, old);
end;$$;

create trigger t_sync_outstanding
  after insert or update or delete on sales
  for each row execute procedure sync_rpa_outstanding();

-- AUTO-RECORD harga pasar dari transaksi
create or replace function record_market_price()
returns trigger language plpgsql as $$
declare
  v_date date := new.transaction_date;
  v_type text := 'broiler';
begin
  if TG_TABLE_NAME = 'purchases' then
    insert into market_prices
      (price_date, chicken_type, region, avg_buy_price, transaction_count)
    values (v_date, v_type, 'nasional', new.price_per_kg, 1)
    on conflict (price_date, chicken_type, region) do update set
      avg_buy_price = (
        market_prices.avg_buy_price *
        market_prices.transaction_count +
        excluded.avg_buy_price
      ) / (market_prices.transaction_count + 1),
      transaction_count = market_prices.transaction_count + 1,
      updated_at = now();
  end if;

  if TG_TABLE_NAME = 'sales' then
    insert into market_prices
      (price_date, chicken_type, region, avg_sell_price, transaction_count)
    values (v_date, v_type, 'nasional', new.price_per_kg, 1)
    on conflict (price_date, chicken_type, region) do update set
      avg_sell_price = (
        market_prices.avg_sell_price *
        market_prices.transaction_count +
        excluded.avg_sell_price
      ) / (market_prices.transaction_count + 1),
      transaction_count = market_prices.transaction_count + 1,
      updated_at = now();
  end if;
  return new;
end;$$;

create trigger t_market_price_from_purchase
  after insert on purchases
  for each row execute procedure record_market_price();

create trigger t_market_price_from_sale
  after insert on sales
  for each row execute procedure record_market_price();

-- ROW LEVEL SECURITY
alter table farms enable row level security;
alter table rpa_clients enable row level security;
alter table purchases enable row level security;
alter table sales enable row level security;
alter table payments enable row level security;
alter table profiles enable row level security;
alter table tenants enable row level security;
alter table market_prices enable row level security;
alter table subscription_invoices enable row level security;

-- Tenant isolation
create policy "farms_tenant" on farms for all
  using (tenant_id = my_tenant_id() or is_superadmin())
  with check (tenant_id = my_tenant_id());

create policy "rpa_tenant" on rpa_clients for all
  using (tenant_id = my_tenant_id() or is_superadmin())
  with check (tenant_id = my_tenant_id());

create policy "purchases_tenant" on purchases for all
  using (tenant_id = my_tenant_id() or is_superadmin())
  with check (tenant_id = my_tenant_id());

create policy "sales_tenant" on sales for all
  using (tenant_id = my_tenant_id() or is_superadmin())
  with check (tenant_id = my_tenant_id());

create policy "payments_tenant" on payments for all
  using (tenant_id = my_tenant_id() or is_superadmin())
  with check (tenant_id = my_tenant_id());

create policy "profile_own" on profiles for all
  using (auth_user_id = auth.uid() or is_superadmin());

create policy "tenant_own" on tenants for select
  using (id = my_tenant_id() or is_superadmin());

create policy "tenant_update" on tenants for update
  using (id = my_tenant_id() or is_superadmin());

-- Harga pasar: semua user bisa baca (anonim)
create policy "market_prices_read" on market_prices
  for select using (true);

create policy "market_prices_write" on market_prices
  for insert with check (true);

create policy "market_prices_update" on market_prices
  for update using (true);

create policy "invoices_tenant" on subscription_invoices for all
  using (tenant_id = my_tenant_id() or is_superadmin())
  with check (tenant_id = my_tenant_id());

==========================================================
HALAMAN & ROUTES
==========================================================

/login              → Halaman login
/register           → Halaman register
/register/role      → Pilih role setelah register
/dashboard          → Broker: Beranda
/transaksi          → Broker: Transaksi (beli + jual)
/rpa                → Broker: List RPA & piutang
/rpa/:id            → Broker: Detail RPA + bayar
/kandang            → Broker: Manajemen kandang
/harga-pasar        → Semua user: Harga pasar live
/simulator          → Broker: Simulator margin
/akun               → Broker: Profil & subscription
/admin              → Superadmin: Overview platform
/admin/tenants      → Superadmin: Kelola semua tenant
/admin/harga-pasar  → Superadmin: Harga pasar detail
/admin/invoices     → Superadmin: Konfirmasi pembayaran

==========================================================
HALAMAN AUTH
==========================================================

── /login ───────────────────────────────────────────────

Layout: centered card, background #F0FDF4
Logo TernakOS di atas
Form: Email + Password (toggle show/hide)
Tombol "Masuk" — full width, hijau, loading state
Error: "Email atau kata sandi salah"
Link: "Belum punya akun? Daftar gratis"
Redirect setelah login:
  - role = superadmin → /admin
  - role lainnya → /dashboard

── /register ────────────────────────────────────────────

Layout: centered card
Logo di atas
Form:
  - Nama Lengkap (text)
  - Nama Bisnis (text, placeholder: "UD Ayam Jaya")
  - Email
  - Password (min 8 karakter, show/hide)
  - Konfirmasi Password
Tombol "Daftar Gratis" — hijau, loading state
Link: "Sudah punya akun? Masuk"
Setelah berhasil register → redirect ke /register/role

── /register/role ───────────────────────────────────────

Halaman pemilihan role setelah register berhasil.
Tidak bisa di-skip.

Layout: full screen, centered, background hijau muda
Heading: "Kamu seorang...?"
Sub: "Pilih yang sesuai agar kami bisa menyiapkan
     tampilan yang tepat untukmu."

Dua pilihan besar (card clickable):

Kartu 1 — BROKER
  Ikon besar: 🤝
  Judul: "Broker / Pedagang"
  Deskripsi: "Aku beli ayam dari kandang dan jual
              ke RPA atau pasar."
  Badge: "Tersedia sekarang"

Kartu 2 — PETERNAK
  Ikon besar: 🏚️
  Judul: "Peternak"
  Deskripsi: "Aku memelihara ayam di kandang
              dan menjual ke broker."
  Badge: "Segera hadir" (warna abu, disabled)

Logic:
  Klik Broker → update profiles.user_type = 'broker'
              → redirect ke /dashboard
  Klik Peternak → tampilkan modal:
    "Fitur untuk peternak sedang dalam pengembangan.
     Kami akan notify kamu begitu siap!"
    Tombol: "Oke, beritahu saya nanti" → simpan minat,
    redirect ke /dashboard dengan banner info

==========================================================
BROKER DASHBOARD (mobile-first, max-width 480px)
==========================================================

Layout semua halaman broker:
  - Max-width 480px, centered di desktop
  - Bottom navigation fixed (64px)
  - Content area padding-bottom 80px
  - Background #F0FDF4

BOTTOM NAV:
🏠 Beranda | 📦 Transaksi | 🏭 RPA | 🏚️ Kandang
Active tab: warna hijau + indicator line atas
Inactive: abu muted
Framer Motion: shared layoutId untuk indicator line

── BERANDA (/dashboard) ─────────────────────────────────

Header section (background putih, border bawah):
  Greeting: "Selamat [pagi/siang/sore/malam], [nama]! 👋"
    (pagi <11, siang <15, sore <18, malam >=18)
  Tanggal: format panjang Indonesia
    contoh: "Rabu, 11 Maret 2026"
  Live indicator: dot hijau berkedip + teks "Live"

ALERT STRIP (hanya tampil kalau ada kondisi kritis):
  Tampil di bawah header, animasi slide down:
  🚨 Merah: "[X] piutang sudah jatuh tempo"
  🔔 Amber: "[Nama kandang] siap panen besok"
  Kalau tidak ada kondisi kritis: tidak tampil sama sekali

4 STAT CARDS (2×2 grid):
Animasi: number count-up saat halaman load

  💰 Profit Hari Ini
     = sum(net_revenue - total_modal) dari sales hari ini
     Warna: hijau positif, merah negatif
     Sub: "dari [X] transaksi"

  📦 Transaksi Hari Ini
     = count(sales hari ini) + count(purchases hari ini)
     Sub: "[X] beli · [Y] jual"

  ⏳ Total Piutang
     = sum(remaining_amount) semua sales belum lunas
     Warna: merah kalau > 0, hijau kalau 0
     Sub: "dari [X] RPA"

  🏚️ Kandang Siap Panen
     = count(farms status = 'ready')
     Warna: hijau kalau > 0
     Sub: "siap dipanen"

HARGA PASAR HARI INI (card full width):
  Header: "📊 Harga Pasar Hari Ini"
  Sub: "dari transaksi broker di platform"
  
  Dua kolom:
    Harga Beli: Rp X.XXX/kg + arrow naik/turun vs kemarin
    Harga Jual: Rp X.XXX/kg + arrow naik/turun vs kemarin
  
  Mini sparkline chart (Recharts) 7 hari terakhir
    Dua garis: beli (hijau) + jual (biru)
  
  Link kecil: "Lihat detail →" ke /harga-pasar
  
  Data dari tabel market_prices, realtime subscription

PIUTANG BELUM LUNAS (card):
  Header: "⏳ Hutang RPA" + link "Lihat Semua →"
  
  List 3 RPA teratas (remaining_amount terbesar):
    Per item:
      - Nama RPA
      - Nominal merah: "Rp X.XXX"
      - Tombol "Tandai Lunas" (hijau kecil)
        → update payment_status='lunas',
           paid_amount=total_revenue
        → toast: "✅ [Nama RPA] ditandai lunas"
  
  Kalau kosong: "✅ Semua pembayaran lunas!"

TRANSAKSI HARI INI (card):
  Header: "📋 Hari Ini" + link "Semua →"
  
  List gabungan sales + purchases hari ini (terbaru dulu):
    Per item:
      - Badge BELI (biru) atau JUAL (hijau)
      - Nama farm / RPA
      - X kg · Rp nilai
      - Kalau JUAL: profit (hijau/merah)
  
  Kalau kosong: "Belum ada transaksi hari ini 🐔"
                tombol "+ Catat Transaksi"

── TRANSAKSI (/transaksi) ───────────────────────────────

Header: "Transaksi"
Summary: total semua profit + total transaksi

Tab switcher (pill style):
  [📥 Pembelian] [📤 Penjualan]
  Animasi slide saat ganti tab

Tombol "+ Catat [Beli/Jual]" full width hijau
  (ganti label sesuai tab aktif)

TAB PEMBELIAN — list purchases terbaru:
  Per card:
    - Nama kandang · tanggal relatif
    - [X] ekor · [X] kg
    - Harga beli: Rp X/kg
    - Total Modal: Rp X.XXX (bold, termasuk transport)

TAB PENJUALAN — list sales terbaru:
  Per card:
    - Nama RPA · tanggal relatif
    - [X] kg · Rp X/kg
    - Profit: Rp X (hijau/merah)
    - Badge status bayar

── FORM CATAT PEMBELIAN (bottom sheet modal) ────────────

Animasi: slide up dari bawah
Handle bar di atas (drag to dismiss)

Fields:
  Pilih Kandang *
    dropdown dari farms milik tenant
    Tampilkan: "[Nama] · [Status badge] · [X ekor]"
  
  Jumlah Ekor *
    type: number, min: 1
  
  Rata-rata Bobot (kg/ekor) *
    type: number, step: 0.1
  
  Harga Beli (Rp/kg) *
    type: number
    Auto-suggest: tampilkan harga pasar beli hari ini
    sebagai placeholder/hint teks kecil
  
  Biaya Transport (Rp)
    type: number, default: 0
  
  Tanggal Transaksi *
    type: date, default: hari ini
  
  Catatan
    textarea, optional

LIVE PREVIEW (update setiap ketikan):
  Tampil kalau minimal quantity + bobot + harga terisi
  Background biru muda (#EFF6FF)
  ┌──────────────────────────────┐
  │ Total Berat  : X.XX kg       │
  │ Total Beli   : Rp X.XXX.XXX  │
  │ Total Modal  : Rp X.XXX.XXX  │
  │ (incl. transport)            │
  └──────────────────────────────┘

Tombol row: [Batal (ghost)] [Simpan Pembelian (hijau)]
Loading state saat simpan.

── FORM CATAT PENJUALAN (bottom sheet modal) ─────────────

Fields:
  Pilih RPA *
    dropdown dari rpa_clients
    Tampilkan: "[Nama RPA] · hutang aktif: Rp X"
  
  Sumber Pembelian *
    dropdown dari purchases milik tenant
    Tampilkan: "[Kandang] · [tanggal] · [X kg]"
  
  Info modal singkat setelah pilih purchase:
    background biru muda, tampilkan:
    "Modal beli: Rp X | Harga beli: Rp X/kg"
  
  Jumlah Ekor *
  Rata-rata Bobot (kg/ekor) *
  Harga Jual (Rp/kg) *
    Auto-suggest dari harga pasar jual hari ini
  Biaya Pengiriman (Rp) default 0
  
  Status Pembayaran * (radio button visual):
    [Lunas] [Belum Lunas] [Sebagian]
  
  [CONDITIONAL] Sudah Dibayar (Rp)
    Tampil hanya kalau status = Sebagian
  
  [CONDITIONAL] Jatuh Tempo
    Tampil kalau status = Belum Lunas atau Sebagian
  
  Tanggal Transaksi * default hari ini
  Catatan (optional)

LIVE PROFIT PREVIEW:
  Tampil kalau cukup data terisi
  Background hijau muda kalau profit, merah muda kalau rugi
  
  ┌────────────────────────────────┐
  │ Total Berat    : X.XX kg       │
  │ Pendapatan     : Rp X.XXX.XXX  │
  │ Modal (beli)   : Rp X.XXX.XXX  │
  │ ──────────────────────────────  │
  │ PROFIT BERSIH  : Rp X.XXX.XXX  │ ← besar, hijau/merah
  │ Margin/kg      : Rp X.XXX      │
  │ ROI            : X.X%          │
  └────────────────────────────────┘
  
  Warning kalau profit < 0:
    "⚠️ Transaksi ini merugi! Pertimbangkan ulang."
  Warning kalau margin < 500/kg:
    "⚠️ Margin sangat tipis (< Rp 500/kg)"

── RPA (/rpa) ───────────────────────────────────────────

Header: "RPA & Piutang"
Tombol "+ Tambah RPA"

Summary card (kalau ada piutang):
  Background merah muda
  "Total Piutang Aktif"
  Angka besar merah: "Rp X.XXX.XXX"
  Sub: "dari [X] RPA"

List RPA (urut: total_outstanding terbesar dulu):
  Per card (tap → detail):
    - Nama RPA (bold)
    - Kontak + lokasi + syarat bayar
    - No HP (link tel: untuk tap to call)
    - Kalau ada hutang: "Rp X.XXX" merah + badge
    - Kalau bersih: "Lunas ✅" hijau
    - Arrow kanan →

FORM TAMBAH/EDIT RPA (modal):
  Nama RPA *, Contact Person, No HP,
  Lokasi, Syarat Pembayaran (select),
  Limit Kredit Rp

── RPA DETAIL (/rpa/:id) ────────────────────────────────

Back + nama RPA + Edit button

Info card: semua detail RPA + tombol telpon

Summary hutang (kalau ada):
  Card merah: "Belum Lunas: Rp X.XXX"
  Sub: "[X] transaksi · jatuh tempo terdekat: [tanggal]"

List semua sales ke RPA ini (terbaru dulu):
  Per card:
    - Tanggal + total kg + harga/kg + total revenue
    - Profit dari transaksi (dengan purchase linked)
    - Badge status bayar
    
    Kalau belum lunas / sebagian:
      Row info: "Dibayar: Rp X | Sisa: Rp X"
      Dua tombol:
        [Catat Bayar] → modal bayar sebagian
        [Tandai Lunas] → langsung lunas

MODAL CATAT BAYAR:
  "Sisa hutang: Rp X.XXX" (merah, besar)
  Input: Jumlah Bayar Rp
  Validasi: max = remaining_amount
  Preview: "Sisa setelah bayar: Rp X"
  Kalau bayar >= total: "✅ Akan lunas sepenuhnya"
  
  On save:
    paid_amount += amount
    kalau paid_amount >= total_revenue → status = 'lunas'
    kalau belum → status = 'sebagian'
    insert ke tabel payments untuk riwayat

── KANDANG (/kandang) ───────────────────────────────────

Header: "Kandang"
Sub: "[X] kandang · [X.XXX] ekor tersedia"
Tombol "+ Tambah Kandang"

3 quick stats (row):
  Total Kandang | Siap Panen (hijau) | Total Ekor

Filter chips (scroll horizontal):
  [Semua] [Siap Panen] [Tumbuh] [Kosong]

List farms (filtered):
  Per card:
    - Badge status (top right)
    - Nama kandang (bold) + pemilik
    - 📍 Lokasi · 📞 No HP (tap to call)
    - 🐔 X ekor · ⚖️ X kg/ekor rata-rata
    - 🗓️ Estimasi panen: [X hari lagi / Siap panen! / Terlambat X hari]
    
    Alert hijau (harvest ≤ 3 hari):
      "🔔 Siap panen dalam [X] hari!"
    Alert amber (harvest sudah lewat):
      "⚠️ Jadwal panen terlewat [X] hari"
    
    Tombol Edit

FORM TAMBAH/EDIT KANDANG (bottom sheet):
  Nama Kandang *, Nama Pemilik *,
  No HP, Lokasi,
  Tipe Ayam (select: Broiler/Kampung/Layer/Petelur),
  Status (select: Siap Panen/Tumbuh/Kosong)
    → Kalau Kosong: auto-disable dan set stok = 0
  Stok (ekor), Rata Bobot (kg/ekor),
  Estimasi Tanggal Panen, Catatan

── HARGA PASAR (/harga-pasar) ───────────────────────────

Accessible dari semua user (broker dan nanti peternak).
Ini halaman publik di dalam app.

Header: "📊 Harga Pasar"
Sub: "Data dari transaksi nyata broker di platform.
     Diperbarui otomatis setiap ada transaksi baru."

Realtime indicator: "● Live · terakhir update X menit lalu"
Pakai Supabase Realtime subscription ke market_prices

HARGA HARI INI (card prominent):
  Dua kolom besar:
    Rata Harga Beli  : Rp X.XXX/kg
    Rata Harga Jual  : Rp X.XXX/kg
  
  Estimasi margin: "Rp X.XXX/kg"
  Jumlah transaksi: "dari X transaksi hari ini"

GRAFIK 14 HARI TERAKHIR (full width, Recharts):
  Area chart dua garis:
    Garis hijau: harga beli
    Garis biru: harga jual
  
  X-axis: tanggal (format: "11 Mar")
  Y-axis: harga (format: "Rp X.XXX")
  Tooltip: hover tampilkan harga exact + tanggal
  
  Kalau data < 3 hari:
    Tampilkan pesan: "Data akan semakin akurat seiring
    bertambahnya transaksi di platform"

TABEL RIWAYAT (7 hari):
  Kolom: Tanggal | Harga Beli | Harga Jual | Margin | Transaksi
  Baris terbaru di atas

── SIMULATOR (/simulator) ───────────────────────────────

Accessible dari icon atau menu di header.

Title: "🧮 Simulator Margin"
Sub: "Hitung estimasi profit sebelum deal. Tidak tersimpan."

Form interaktif (semua live, tidak perlu submit):
  Jumlah Ekor
  Rata Bobot (kg/ekor)
  Harga Beli (Rp/kg)
    [Pakai harga pasar] link kecil → auto-fill hari ini
  Harga Jual (Rp/kg)
    [Pakai harga pasar] link kecil → auto-fill hari ini
  Biaya Transport (Rp)
  Biaya Kirim ke RPA (Rp)

HASIL SIMULASI (card, update real-time):
  Warna card: hijau kalau profit, merah kalau rugi,
              amber kalau margin < 500/kg
  
  ┌─────────────────────────────────┐
  │ HASIL SIMULASI                  │
  ├─────────────────────────────────┤
  │ Total Berat     : X.XX kg       │
  │ Total Modal     : Rp X.XXX.XXX  │
  │                                 │
  │ Pendapatan Kotor: Rp X.XXX.XXX  │
  │ Pendapatan Bersih: Rp X.XXX.XXX │
  │                                 │
  │ ─────────────────────────────── │
  │                                 │
  │ PROFIT BERSIH                   │
  │ Rp X.XXX.XXX       ← BESAR     │
  │                                 │
  │ Margin/kg  : Rp X.XXX           │
  │ ROI        : X.X%               │
  │ Break-even : Rp X.XXX/kg        │
  └─────────────────────────────────┘

Tombol Reset (clear semua field).

── AKUN (/akun) ─────────────────────────────────────────

Avatar (inisial nama, warna dari hash nama)
Nama + nama bisnis + email

Edit profil (inline atau modal):
  Nama Lengkap, Nama Bisnis, No HP

SUBSCRIPTION SECTION:
  Plan saat ini: badge [GRATIS / BASIC / PRO]
  
  Kalau trial aktif:
    "Trial Basic berakhir dalam [X] hari"
    Progress bar sisa hari
  
  Kalau plan Gratis:
    Card upgrade:
      "Upgrade ke Basic — Rp 99.000/bln"
      Benefit list (3 poin)
      Tombol "Upgrade Sekarang"
      → arahkan ke halaman pembayaran manual:
        tampilkan nomor rekening + instruksi transfer
        form upload bukti transfer
        pesan: "Kami akan verifikasi dalam 1×24 jam"
  
  Kalau sudah paid:
    Tampilkan info plan + tanggal perpanjangan
    Riwayat invoice

==========================================================
ADMIN DASHBOARD (/admin) — Desktop layout, superadmin only
==========================================================

PENTING:
- Hanya user dengan role = 'superadmin' yang bisa akses
- Kalau user lain coba akses /admin: redirect ke /dashboard
- Full-width desktop layout dengan sidebar
- Superadmin dibuat manual di Supabase (update profiles.role)

SIDEBAR (fixed left, 240px):
  Logo TernakOS
  Nama: "Admin Panel"
  
  Menu:
    📊 Overview
    🏢 Tenant
    📈 Harga Pasar
    💳 Invoice
    👥 Pengguna
    ⚙️ Pengaturan

── ADMIN: OVERVIEW ──────────────────────────────────────

4 KPI cards atas:
  1. Total Tenant Aktif (+ X bulan ini)
  2. Berlangganan (Basic + Pro)
  3. MRR = jumlah invoice paid bulan ini
  4. Transaksi Hari Ini (semua tenant)

Grafik (Recharts, full width):
  Area chart: "Pertumbuhan Tenant" — 30 hari terakhir
  Bar chart: "Transaksi per Hari" — 14 hari terakhir

Tenant terbaru (tabel):
  Kolom: Nama Bisnis | Plan | Tanggal Daftar | User Type | Status

── ADMIN: TENANT ────────────────────────────────────────

Search bar + filter plan

Tabel semua tenant:
  Kolom:
    Nama Bisnis | Plan (badge) | Total User |
    Total Transaksi | Bergabung | Status (toggle)

Actions per baris:
  [Detail] → modal detail tenant
  [Ubah Plan] → dropdown pilih plan baru (update manual)
  [Suspend] → set is_active = false

Modal Detail Tenant:
  Info lengkap + statistik transaksi
  Riwayat invoice

── ADMIN: HARGA PASAR ───────────────────────────────────

Ini halaman terpenting untuk monitor kesehatan platform.

Title: "Harga Pasar Nasional"
Sub: "Agregasi anonim dari semua transaksi broker"

SUMMARY CARDS:
  Rata Harga Beli Hari Ini: Rp X.XXX/kg
  Rata Harga Jual Hari Ini: Rp X.XXX/kg
  Margin Rata-rata: Rp X.XXX/kg
  Jumlah Transaksi Hari Ini: X transaksi dari X broker

GRAFIK UTAMA (area chart, 30 hari):
  Dua garis: harga beli + harga jual
  Hover: tampilkan nilai + jumlah transaksi

TABEL LENGKAP (30 hari):
  Tanggal | Harga Beli | Harga Jual | Margin | Transaksi
  Sortable, downloadable (CSV)

Input Manual (kalau tidak ada transaksi hari ini):
  Form: Tanggal | Harga Beli | Harga Jual
  "Simpan Harga Manual" — data masuk ke market_prices

── ADMIN: INVOICE ───────────────────────────────────────

Daftar semua subscription_invoices

Filter: semua | pending | paid | expired

Tabel:
  Tenant | Plan | Nominal | Tanggal | Status (badge) |
  Bukti Transfer | Aksi

Kalau status = pending:
  Tombol "Konfirmasi Lunas":
    → update status = 'paid'
    → update tenant.plan sesuai plan invoice
    → set confirmed_by = admin user id
    → set confirmed_at = now()

Kalau status = paid:
  Tampilkan confirmed_by + confirmed_at

── ADMIN: PENGGUNA ──────────────────────────────────────

Tabel semua profiles di seluruh tenant:
  Nama | Email | Tenant | Role | User Type | Terakhir Login

Search + filter tenant + filter role

── ADMIN: PENGATURAN ────────────────────────────────────

Nomor rekening untuk pembayaran manual:
  Bank, Nomor Rekening, Nama Pemilik
  (ditampilkan ke user saat upgrade)

Pesan notifikasi (teks yang muncul di banner upgrade)

==========================================================
ANIMASI (Framer Motion)
==========================================================

Page transitions   : opacity + y (16→0), duration 0.28s
Bottom sheet modal : slide up dari bawah, spring
Cards              : stagger fade-in, delay 0.05s/card
Stat numbers       : count-up saat load
Button tap         : scale 0.97
Toast              : slide dari atas (Sonner)
Tab switch         : slide left/right sesuai arah
Alert banner       : slide down saat muncul
Realtime update    : pulse animation pada data baru

==========================================================
BUSINESS LOGIC
==========================================================

profit_bersih   = net_revenue - total_modal
net_revenue     = total_revenue - delivery_cost
total_modal     = total_cost + transport_cost
sisa_hutang     = total_revenue - paid_amount
total_berat     = quantity × avg_weight (2 decimal)
total_cost      = total_weight × price_per_kg (integer)

Farm status:
  empty   = available_stock = 0
  ready   = stock > 0 AND harvest_date ≤ today + 7 hari
  growing = stock > 0 AND harvest_date > today + 7 hari

==========================================================
SEED DATA (insert setelah register akun demo)
==========================================================

Setelah buat user demo@ternakos.id:
1. Ambil tenant_id dari tabel profiles
2. Insert:
   - 3 farms: Boyolali (ready), Klaten (growing), Magelang (ready)
   - 2 RPA: Semarang (net7), Solo (net14 dengan hutang)
   - 2 purchases + 2 sales (1 lunas, 1 belum lunas)
   - Beberapa market_prices 7 hari terakhir

==========================================================
OUTPUT
==========================================================

1. Full working React app, semua halaman berfungsi
2. Supabase fully connected
3. Auth (login, register, role selection) berjalan
4. Semua CRUD broker dashboard berfungsi
5. Admin dashboard accessible di /admin
6. Harga pasar realtime dari transaksi
7. Push ke GitHub (repo sama dengan landing page)
8. README lengkap dengan setup instructions
9. .env.example file
```

---
---

## PROMPT 3 — CURSOR / ANTIGRAVITY
### Setup CONTEXT.md (jalankan setelah clone repo dari GitHub)

> Clone repo TernakOS ke lokal.
> Buat file `CONTEXT.md` di root project.
> Isi dengan teks di bawah persis apa adanya.
> Setiap sesi di Cursor/Antigravity, mulai dengan:
> **"Baca @CONTEXT.md dulu, lalu kita akan [X]"**

```markdown
# TernakOS — Project Context

## Produk
Nama: TernakOS
Tagline: "Satu platform untuk semua bisnis peternakan Indonesia"
Domain target: ternakos.id
Bahasa: Bahasa Indonesia 100%

## Status Sekarang
Fase 1: Broker Module MVP
Scaffold dari Emergent sudah ada.
Cursor dipakai untuk polish, fix bugs, tambah fitur lanjutan.

## Tech Stack
React + Vite + Tailwind CSS
Supabase (PostgreSQL + Auth + Realtime)
Framer Motion, React Query, React Hook Form + Zod
Recharts, Lucide React, Sonner, date-fns/locale/id

## Arsitektur
Multi-tenant: semua tabel punya tenant_id
RLS: my_tenant_id() function untuk isolasi data
Generated columns: total_modal, net_revenue, remaining_amount
Soft delete: is_deleted boolean di semua tabel utama

Tables: tenants, profiles, farms, rpa_clients,
        purchases, sales, payments,
        market_prices, subscription_invoices

## Business Rules
profit_bersih = net_revenue - total_modal
net_revenue   = total_revenue - delivery_cost
total_modal   = total_cost + transport_cost
sisa_hutang   = total_revenue - paid_amount
IDR: bigint, no decimal, format Rp 1.250.000

## User Roles
superadmin  → akses /admin (hanya kamu sebagai founder)
owner       → broker yang daftar (akses /dashboard)
peternak    → fase 2, belum dibangun
pedagang    → fase 4, belum dibangun

## Register Flow
/register → /register/role → pilih Broker atau Peternak
Pilih Broker → /dashboard
Pilih Peternak → modal "segera hadir" → /dashboard

## Market Price
Auto dari trigger saat insert purchases/sales
Semua broker bisa lihat rata-rata anonim di /harga-pasar
Admin lihat detail di /admin/harga-pasar

## Pembayaran Subscription
Manual: broker transfer ke rekening, upload bukti
Admin konfirmasi di /admin/invoices → update tenant.plan
Tidak ada payment gateway untuk sekarang

## Design
Primary: #16A34A | Background: #F0FDF4
Font: Plus Jakarta Sans
Mobile-first 480px, bottom nav 4 tab
Framer Motion semua animasi

## Roadmap
Fase 1 (sekarang) : Broker module MVP ← kita di sini
Fase 2            : Peternak module (FCR, IP, siklus)
Fase 3            : Koneksi peternak ↔ broker
Fase 4            : Pedagang module
Fase 5            : Marketplace + transaction fee

## Aturan Penting
Jangan tambah fitur yang tidak ada di konteks ini.
Kalau ragu → tanya dulu, jangan asumsi.
Commit ke GitHub setelah setiap fitur selesai dan tested.
```

---
---

## PROMPT 4 — CURSOR / ANTIGRAVITY
### Polish & Fix setelah scaffold Emergent

> Jalankan ini setelah CONTEXT.md ada dan scaffold dari Emergent jalan.
> Paste ke Cursor/Antigravity.

```
Baca @CONTEXT.md dulu.

Lakukan code review menyeluruh pada semua file.
Fix hal-hal berikut. Jangan ubah fitur apapun.

1. QUERY SUPABASE
   Pastikan semua fetch data pakai:
   .eq('is_deleted', false) — di semua tabel yang ada kolom ini
   
   Pastikan semua insert data include tenant_id:
   const tenantId = await getMyTenantId()
   
   Pastikan error handling ada di setiap query:
   if (error) throw error

2. FORMAT IDR
   Pastikan SEMUA angka rupiah pakai helper function.
   Tidak boleh ada format manual (.toLocaleString langsung).
   Buat src/lib/format.js kalau belum ada:
   
   export const formatIDR = (n) =>
     new Intl.NumberFormat('id-ID', {
       style: 'currency', currency: 'IDR',
       maximumFractionDigits: 0
     }).format(n ?? 0)
   
   export const formatIDRShort = (n) => {
     if (!n) return 'Rp 0'
     if (n >= 1_000_000) return `Rp ${(n/1_000_000).toFixed(1)}jt`
     if (n >= 1_000) return `Rp ${(n/1_000).toFixed(0)}rb`
     return `Rp ${n}`
   }

3. LOADING STATES
   Semua tombol submit harus:
   - Disabled saat loading
   - Tampilkan spinner + teks "Menyimpan..."
   - Re-enable setelah selesai (sukses atau error)

4. EMPTY STATES
   Setiap list yang bisa kosong harus punya:
   - Ikon (emoji besar)
   - Judul
   - Deskripsi singkat
   - Tombol aksi (optional)

5. MOBILE SAFE AREA
   Bottom nav harus punya:
   padding-bottom: env(safe-area-inset-bottom, 0px)
   
   Halaman utama harus punya:
   padding-bottom: 80px (agar tidak ketutup bottom nav)

6. INPUT TYPE NUMBER — iOS zoom fix
   Semua input type="number" dan type="tel" harus punya:
   style={{ fontSize: '16px' }}
   Ini mencegah auto-zoom di Safari iOS

7. REACT QUERY KEYS
   Pastikan semua queryKey include user/tenant identifier:
   ['farms', tenantId] bukan hanya ['farms']
   Ini penting supaya invalidation akurat

Setelah fix, jalankan app dan test:
- Login berhasil
- Tambah kandang → muncul di list
- Catat pembelian → preview muncul
- Simpan → data ada di Supabase
- Refresh halaman → data tetap ada
```

---
---

## PROMPT 5 — CURSOR / ANTIGRAVITY
### Export Laporan Excel

> Jalankan setelah Prompt 4 selesai dan app sudah stabil.

```
Baca @CONTEXT.md dulu.

Tambahkan fitur export laporan Excel.
Pakai library SheetJS (xlsx):
  npm install xlsx

Tambahkan tombol "📥 Export Excel" di header
halaman /transaksi (atas kanan, icon + teks kecil).

Ketuk tombol → tampilkan bottom sheet pilih periode:
  [Bulan Ini] [Bulan Lalu] [Custom]
  Kalau Custom: tampilkan date range picker (dari - sampai)

Setelah pilih periode → generate file Excel:

SHEET 1: "Pembelian"
  Kolom:
    Tanggal | Nama Kandang | Jumlah Ekor |
    Total KG | Harga Beli/kg | Total Beli |
    Transport | Total Modal
  Format tanggal: DD/MM/YYYY
  Format angka: number (bukan string, agar bisa dikalkulasi)
  Baris terakhir: SUM total kolom angka

SHEET 2: "Penjualan"
  Kolom:
    Tanggal | Nama RPA | Total KG | Harga Jual/kg |
    Total Jual | Biaya Kirim | Modal (dari pembelian) |
    Profit Bersih | Margin/kg | Status Bayar
  Format angka: number
  Baris terakhir: SUM + rata-rata margin

SHEET 3: "Ringkasan"
  Total Pembelian periode ini: Rp X
  Total Penjualan: Rp X
  Total Profit Bersih: Rp X
  Rata-rata Margin/kg: Rp X
  Jumlah Transaksi: X

Nama file: TernakOS_Laporan_[BulanTahun].xlsx
Contoh: TernakOS_Laporan_Maret2026.xlsx

Loading state saat generate (bisa sedikit lambat).
Toast sukses setelah file terdownload.
```

---
---

## PROMPT 6 — CURSOR / ANTIGRAVITY
### Halaman Pembayaran Manual & Upload Bukti Transfer

> Jalankan setelah Prompt 5 selesai.

```
Baca @CONTEXT.md dulu.

Buat halaman dan flow pembayaran subscription manual.
Tidak ada payment gateway — broker transfer ke rekening,
upload bukti, admin konfirmasi.

HALAMAN /upgrade:

Tampilkan dua opsi plan (card):

BASIC — Rp 99.000/bulan
  Benefit list (5 poin dari context)
  Tombol "Pilih Basic"

PRO — Rp 249.000/bulan
  Benefit list (7 poin)
  Tombol "Pilih Pro"

Setelah klik salah satu plan → tampilkan instruksi bayar:

Step 1: Info transfer
  "Transfer ke rekening berikut:"
  Bank: [ambil dari settings/config]
  No. Rekening: [dari config]
  Atas Nama: [dari config]
  Nominal: Rp X (sesuai plan dipilih)
  
  Tombol copy nominal + copy nomor rekening
  (copy ke clipboard + toast konfirmasi)

Step 2: Upload bukti transfer
  Input file (accept: image/*, .pdf)
  Preview gambar setelah dipilih
  Tombol "Kirim Bukti Transfer"
  
  On submit:
    Upload file ke Supabase Storage
    Insert ke subscription_invoices:
      tenant_id, amount, plan,
      status='pending',
      transfer_proof_url=url file

Step 3: Konfirmasi terkirim
  "✅ Bukti transfer berhasil dikirim!"
  "Kami akan verifikasi dalam 1×24 jam."
  "Kamu akan mendapat notifikasi setelah dikonfirmasi."
  
  Tampilkan status invoice di halaman /akun

DI ADMIN /admin/invoices:

Tampilkan semua invoice dengan status pending di atas.

Per row:
  Nama tenant | Plan | Nominal | Tanggal | Status

Tombol "Lihat Bukti" → buka gambar bukti transfer

Tombol "Konfirmasi Lunas":
  → update subscription_invoices.status = 'paid'
  → update tenants.plan = invoice.plan
  → set confirmed_by, confirmed_at
  → toast: "Plan [nama tenant] berhasil diupgrade ke [plan]"

Tombol "Tolak":
  → update status = 'expired'
  → opsional: input alasan penolakan

Di halaman /akun broker:
  Tampilkan status invoice terakhir:
  "Menunggu konfirmasi..." (kalau pending)
  "Aktif hingga..." (kalau paid)
```

---
---

## PROMPT 7 — CURSOR / ANTIGRAVITY
### Onboarding Flow setelah Register

> Jalankan setelah semua prompt sebelumnya selesai.

```
Baca @CONTEXT.md dulu.

Buat onboarding flow untuk user baru yang baru pilih
role Broker di halaman /register/role.

Setelah pilih Broker → JANGAN langsung ke /dashboard.
Tampilkan onboarding 3 langkah dulu.

ONBOARDING FLOW (/onboarding):

Progress indicator di atas: ①──②──③
Step yang aktif hijau, yang belum abu.

STEP 1: Lengkapi Profil
  Judul: "Halo, [nama]! 👋"
  Sub: "Lengkapi profil bisnismu dulu."
  
  Form:
    Nama Bisnis (pre-filled dari register, bisa diedit)
    No HP (input tel)
    Lokasi Utama (text, contoh: "Boyolali, Jawa Tengah")
  
  Tombol "Lanjut →"

STEP 2: Tambah Kandang Pertama
  Judul: "Tambahkan kandang rekananmu"
  Sub: "Tambah minimal satu kandang untuk mulai catat transaksi."
  
  Form singkat:
    Nama Kandang *
    Nama Pemilik *
    No HP Pemilik
    Lokasi
    Status (Siap Panen / Tumbuh / Kosong)
    Stok (ekor)
  
  Tombol "Tambah Kandang" → simpan ke tabel farms
  Tombol kecil "Lewati dulu" (outline, tidak ada ikon)
  
  Setelah tambah: tampilkan "✅ Kandang berhasil ditambahkan!"
  Tombol berubah: "Lanjut →"

STEP 3: Tambah RPA Pertama
  Judul: "Siapa pembeli ayam kamu?"
  Sub: "Tambah RPA (Rumah Potong Ayam) yang biasa membeli."
  
  Form singkat:
    Nama RPA *
    Contact Person
    No HP
    Syarat Bayar (select: Cash/NET-7/NET-14/NET-30)
  
  Tombol "Tambah RPA" → simpan ke tabel rpa_clients
  Tombol kecil "Lewati dulu"
  
  Setelah tambah: tampilkan "✅ RPA berhasil ditambahkan!"
  Tombol: "Mulai Pakai TernakOS →"

SELESAI:
  Redirect ke /dashboard
  
  Tampilkan welcome toast:
  "🎉 Selamat datang di TernakOS, [nama]!"
  
  Tampilkan tooltip singkat di dashboard:
  Pertama kali: highlight kartu "Profit Hari Ini" dengan
  tooltip: "Profit kamu akan otomatis terhitung di sini"
  Dismiss saat tap di luar.

CATATAN TEKNIS:
  Simpan status onboarding di profiles.onboarded (boolean).
  Kalau user sudah onboarded dan coba akses /onboarding
  → redirect ke /dashboard.
  
  Kalau user belum onboarded dan coba akses /dashboard
  → redirect ke /onboarding.
  
  Animasi antar step: slide left/right (Framer Motion).
```

---
---

## Checklist Sebelum Demo ke Broker Pertama

```
TEKNIS:
  □ Login / logout berjalan
  □ Register → pilih role → onboarding → dashboard
  □ Tambah kandang → muncul di list + filter
  □ Catat pembelian → live preview total modal
  □ Catat penjualan → live profit preview (hijau/merah)
  □ Piutang muncul di beranda + RPA detail
  □ Tandai lunas → angka hilang dari list
  □ Harga pasar update dari transaksi
  □ Simulator margin berfungsi tanpa simpan data
  □ Admin /admin accessible, redirect kalau bukan superadmin
  □ Test di HP Android (Chrome mobile, layar 360-414px)
  □ Semua angka IDR terformat: Rp 1.250.000

BISNIS:
  □ Siapkan akun demo: demo@ternakos.id
  □ Insert seed data realistis (angka mendekati nyata)
  □ Siapkan script demo 10 menit
  □ Siap jawab: "Data saya aman?"
  □ Siap jawab: "Nanti bayar berapa?"
  □ Siap jawab: "Kalau HP rusak data hilang?"
```
