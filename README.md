# TernakOS

SaaS multi-tenant untuk industri peternakan Indonesia. Mencakup vertikал Broker Ayam, Egg Broker, Peternak, dan RPA. Dibangun dengan React 19 + Vite, Tailwind CSS v3.4, Supabase, dan Framer Motion.

## 🚀 Fitur Utama
- **Multi-Tenant & Multi-Vertical**: Broker, Egg Broker, Peternak, RPA dalam satu platform.
- **100% Bahasa Indonesia**: Antarmuka yang ramah bagi peternak dan pedagang lokal.
- **Modern & Animatif**: Transisi halus menggunakan Framer Motion.
- **Responsif**: Dioptimalkan untuk HP Android dan Desktop (adaptive layout).
- **Real-time Data**: Powered by Supabase Realtime + React Query.
- **Edge Functions**: Rate limiting, harga scraper, dan validasi kode undangan di server.

## 🛠️ Teknologi
- **Framework**: React 19.2 (Vite 8.0)
- **Styling**: Tailwind CSS v3.4 + Shadcn UI
- **Backend**: Supabase (PostgreSQL + Auth + Storage + Edge Functions)
- **State**: React Query v5 (@tanstack/react-query)
- **Animasi**: Framer Motion v12
- **Charts**: Recharts v2.15
- **Ikon**: Lucide React v0.577
- **Notifikasi**: Sonner v2.0
- **Routing**: React Router v7

## 📦 Cara Menjalankan Secara Lokal

1. **Install dependensi**:
   ```bash
   npm install
   ```

2. **Buat file `.env.local`** (salin dari `.env.example`):
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```

3. **Jalankan server pengembangan**:
   ```bash
   npm run dev
   ```

4. **Buka di browser**:
   Kunjungi [http://localhost:5173](http://localhost:5173)

## ☁️ Deploy Supabase Edge Functions

Pastikan sudah login ke Supabase CLI terlebih dahulu:
```bash
supabase login
supabase link --project-ref your-project-ref
```

### Deploy semua Edge Functions sekaligus:
```bash
supabase functions deploy fetch-harga --no-verify-jwt
supabase functions deploy verify-invite-code --no-verify-jwt
```

### `fetch-harga`
Scraper harga ayam broiler otomatis dari chickin.id untuk region Jawa Tengah/DIY.
- **Trigger**: HTTP GET atau cron scheduler (disarankan 12:00 dan 18:00 WIB)
- **Output**: Insert ke tabel `market_prices` (`source = 'auto_scraper'`)
- **Deploy**:
  ```bash
  supabase functions deploy fetch-harga --no-verify-jwt
  ```

### `verify-invite-code`
Rate-limited endpoint untuk verifikasi kode undangan tim (6 digit).
- **Rate Limit**: Max 5 percobaan per IP / 15 menit, lockout 30 menit
- **Dipanggil dari**: `AcceptInvite.jsx` via `supabase.functions.invoke('verify-invite-code', { body: { code } })`
- **Deploy**:
  ```bash
  supabase functions deploy verify-invite-code --no-verify-jwt
  ```

## 🐍 Python Harga Scraper (Alternatif / Fallback)

Script Python sebagai alternatif jika Edge Function `fetch-harga` tidak tersedia.

```bash
# Install dependencies
pip install -r scripts/requirements.txt

# Jalankan scraper
python scripts/ternakos_harga_scraper.py
```

- **Sumber data**: pinsarindonesia.com
- **Jadwal rekomendasi**: 12:00 dan 18:00 WIB
- **Output**: Upsert ke tabel `market_prices` via Supabase API

## 📄 Struktur Proyek
- `src/dashboard/broker/`: Vertical Broker Ayam (Transaksi, Kandang, RPA, Pengiriman, dll)
- `src/dashboard/egg/`: Vertical Egg Broker (POS, Inventori, Suppliers, Customers)
- `src/dashboard/peternak/`: Vertical Peternak (Beranda, Siklus, Input Harian, Laporan)
- `src/dashboard/admin/`: Superadmin Panel (Users, Subscriptions, Pricing)
- `src/lib/hooks/`: React Query hooks per vertical
- `src/pages/`: Landing page, Auth (Login, Register, AcceptInvite)
- `src/sections/`: Landing page sections (Hero, Features, Pricing, dll)
- `supabase/functions/`: Edge Functions (fetch-harga, verify-invite-code)
- `scripts/`: Python scraper & utility scripts

## 📚 Dokumentasi Developer
- [`CONTEXT.md`](CONTEXT.md) — Stack lengkap, arsitektur, rules, routing, hooks
- [`DATABASE_STRUCTURE.md`](DATABASE_STRUCTURE.md) — Schema DB lengkap, enum values, FK map, Edge Functions
