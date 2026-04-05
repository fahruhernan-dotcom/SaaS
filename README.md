# TernakOS

SaaS multi-tenant untuk industri peternakan Indonesia. Platform all-in-one yang dirancang untuk mendigitalisasi rantai pasok peternakan, mulai dari peternak mandiri hingga distributor besar.

Dibangun dengan **React 19 + Vite**, **Tailwind CSS v3.4**, **Supabase**, dan **Framer Motion**.

## 🚀 Fitur & Vertikal Utama

TernakOS mendukung berbagai peran bisnis dalam ekosistem peternakan melalui sub-aplikasi yang terintegrasi:

- **Broker Ayam (Poultry Broker)**: Manajemen transaksi ayam hidup, pencatatan kandang, integrasi RPA, dan sistem pengiriman (DO).
- **Egg Broker**: Sistem POS dan inventori khusus untuk pedagang telur, manajemen supplier, dan piutang pelanggan.
- **Sembako Broker**: Perluasan sistem untuk komoditas bahan pokok, mendukung transaksi multi-item dan manajemen stok terpusat.
- **Peternak (Farmer)**: Manajemen siklus pemeliharaan, input harian produksi, pemantauan kesehatan ternak, dan laporan performa (FCR, IP).
- **Rumah Potong (RPA/RPH)**: Digitalisasi operasional rumah potong ayam/hewan, mulai dari penerimaan barang masuk hingga output karkas/frozen meat.

## 🛠️ Stack Teknologi

- **Core**: React 19.2 (Vite 8.0)
- **Styling**: Tailwind CSS v3.4 + Shadcn UI (Modern, responsive, WOW design)
- **Backend**: Supabase (PostgreSQL, Auth, Storage, Edge Functions)
- **State Management**: TanStack Query v5 (React Query)
- **Animation**: Framer Motion v12 (Smooth micro-animations)
- **Data Visualization**: Recharts v2.15
- **Icons**: Lucide React

## 📦 Persiapan Lokal

### 1. Prasyarat
- Node.js (v18+)
- npm / yarn / pnpm

### 2. Instalasi
```bash
git clone https://github.com/your-repo/ternakos.git
cd ternakos
npm install
```

### 3. Konfigurasi Lingkungan
Buat file `.env` di root direktori dan tambahkan variabel berikut:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Scraper Settings (Optional for Local)
VITE_SCRAPER_API_KEY=your-api-key
```

### 4. Jalankan
```bash
npm run dev
```
Buka [http://localhost:5173](http://localhost:5173).

## ☁️ Serverless & Automation (Edge Functions)

TernakOS menggunakan Supabase Edge Functions untuk tugas berat dan terjadwal:

- **`fetch-harga`**: Otomasi scraping harga ayam broiler dari berbagai sumber (Chickin, Pinsar) untuk membantu penetapan harga pasar yang akurat.
- **`verify-invite-code`**: Sistem keamanan berlapis (rate-limited) untuk memverifikasi undangan anggota tim baru.

### Deploy Functions:
```bash
supabase functions deploy fetch-harga --no-verify-jwt
supabase functions deploy verify-invite-code --no-verify-jwt
```

## 📄 Struktur Proyek

```text
src/
├── dashboard/
│   ├── broker/        # Poultry, Egg, & Sembako Broker logic
│   ├── peternak/      # Farmer dashboards & daily inputs
│   ├── rumah_potong/  # RPA/RPH operational screens
│   ├── admin/         # Superadmin & System settings
│   └── _shared/       # Reusable components across dashboards
├── lib/
│   ├── hooks/         # Shared & vertical-specific React Query hooks
│   ├── supabase.js    # Supabase client instantiation
│   └── utils.js       # Helper functions
├── pages/             # Main routes (Landing, Auth, Static)
└── sections/          # Components for landing page
```

## 📚 Dokumentasi Lanjutan

Untuk detail teknis lebih mendalam, silakan merujuk ke:
- [**CONTEXT.md**](CONTEXT.md) — Arsitektur lengkap, design system, dan aturan pengembangan.
- [**DATABASE_STRUCTURE.md**](DATABASE_STRUCTURE.md) — Kamus data, relasi tabel, dan skema Supabase.

