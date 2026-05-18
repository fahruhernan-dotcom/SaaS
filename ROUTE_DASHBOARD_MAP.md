# ROUTE_DASHBOARD_MAP.md — TernakOS Route & Dashboard Mapping

> Dibuat: 2026-05-16 | Source: `src/App.jsx` (531 baris), `businessModel.js`, `BrokerRouter.jsx`, `PeternakRouter.jsx`, `RPPageRouter.jsx`

---

## ARSITEKTUR ROUTING

```
App.jsx
├── RootLayout (QueryClientProvider + AuthProvider + NotificationsProvider)
│   ├── Public routes (static, SSG-compatible)
│   └── Protected routes (lazy-loaded, client-only)
│       ├── DashboardLayout
│       │   ├── Desktop → DesktopSidebarLayout (AppSidebar)
│       │   └── Mobile  → AppSidebar + BottomNav
│       ├── BrokerLayout     → BrokerPageRouter (dispatch per brokerType)
│       ├── PeternakLayout   → PeternakPageRouter (dispatch per peternakType)
│       ├── RumahPotongLayout→ RPPageRouter (dispatch per rpType)
│       └── AdminLayout      → Admin pages (superadmin only)
```

### Guard Components

| Guard | Fungsi |
|-------|--------|
| `ProtectedRoute` | Cek auth → cek onboarding → redirect ke vertical beranda |
| `RoleGuard` | Cek role (`allowedRoles`) → redirect jika tidak match |
| `RoleRedirector` | Redirect ke beranda sesuai vertical (dipakai di `/`, `/dashboard`, `/beranda`) |
| `AdminRoute` | Hanya superadmin → `isSuperadmin(profile)` |

---

## 1. PUBLIC ROUTES (tanpa auth)

| Route | Component | Keterangan |
|-------|-----------|------------|
| `/` | `LandingPage` | Halaman utama — dirender SSG |
| `/login` | `Login` | Form login |
| `/register` | `Register` | Form registrasi |
| `/invite` | `AcceptInvite` | Terima undangan tim |
| `/terms` | `TermsPage` | Syarat & ketentuan |
| `/privacy` | `PrivacyPage` | Kebijakan privasi |
| `/tentang-kami` | `AboutUs` | Tentang TernakOS |
| `/keamanan` | `SecurityPage` | Halaman keamanan |
| `/hubungi-kami` | `HubungiKami` | Kontak |
| `/blog` | `BlogPage` | Daftar artikel |
| `/blog/:slug` | `BlogPostPage` | Detail artikel |
| `/fitur` | `FiturPage` | Showcase fitur (re-export ke `fitur/index.jsx`) |
| `/fitur/rpa` | `FiturPage` | Showcase fitur RPA |
| `/fitur/:role/:sub` | `FiturPage` | Showcase fitur per role |
| `/harga` | `HargaPage` | Halaman pricing |
| `/market` | `MarketPublic` | Marketplace publik |
| `/harga-pasar/:province?` | `HargaPasarPublic` | Harga pasar publik (SSG) |
| `/faq` | `FAQPage` | FAQ umum |
| `/check-email` | `CheckEmail` | Tunggu konfirmasi email |
| `/welcome` | `WelcomeOnboard` | Welcome setelah register |
| `/forgot-password` | `ForgotPassword` | Minta reset password |
| `/reset-password` | `ResetPassword` | Form password baru |
| `/auth/callback` | `AuthCallback` | Supabase auth handler |
| `/_spa_fallback` | `null` | SPA fallback untuk SSG |

---

## 2. SEMI-PROTECTED (login required, role bebas)

| Route | Component | Guard |
|-------|-----------|-------|
| `/upgrade` | `UpgradePlan` | `ProtectedRoute` |
| `/onboarding` | `OnboardingFlow` | `ProtectedRoute` |
| `/market` | `Market` + `DashboardLayout` | `ProtectedRoute` |
| `/dashboard/harga-pasar` | `MarketPriceDashboard` + `DashboardLayout` | `ProtectedRoute` |
| `/addon` | `AddonPortal` | (tidak tercantum eksplisit di App.jsx — perlu konfirmasi) |

---

## 3. LEGACY REDIRECTS

| Route | Redirect ke | Keterangan |
|-------|------------|------------|
| `/broker` | `RoleRedirector` | Redirect ke beranda vertical |
| `/broker/beranda` | `RoleRedirector` | — |
| `/broker/staff` | `/broker/beranda` | Legacy staff path |
| `/peternak` | `RoleRedirector` | — |
| `/home` | `RoleRedirector` | — |
| `/dashboard` | `RoleRedirector` | — |
| `/beranda` | `RoleRedirector` | — |
| `/akun` | `RoleRedirector` | — |
| `/transaksi` | `RoleRedirector` | — |
| `/rpa-dashboard` | `RoleRedirector` | — |
| `/rpa-buyer` | `/rumah_potong/rpa/beranda` | Legacy redirect |
| `/broker/:brokerType/cashflow` | `../cash-flow` | Normalize URL |
| `/broker/:brokerType/pegawai` | `../karyawan` | Normalize URL |
| `/peternak/:peternakType/input` | `../input-harian` | Normalize URL |
| `/peternak/:peternakType/stok-pakan` | `../pakan` | Normalize URL |

---

## 4. BROKER ROUTES

### BrokerLayout (`/broker/:brokerType`)
Layout: `BrokerLayout` (lazy) → dispatch ke `BrokerPageRouter`

**Guard:** BrokerLayout tidak punya `requiredType`/`requiredVertical` eksplisit di App.jsx — bergantung pada `resolveBusinessVertical` + `VERTICAL_ALIASES` di dalam BrokerLayout sendiri.

| Route | Page (via BrokerPageRouter) | Broker Types yang Handle |
|-------|---------------------------|--------------------------|
| `/broker/:type/beranda` | `Beranda` | semua |
| `/broker/:type/transaksi` | `Transaksi` | poultry_broker, distributor_daging |
| `/broker/:type/kandang` | `Kandang` | poultry_broker |
| `/broker/:type/pengiriman` | `Pengiriman` | poultry_broker, distributor_sembako |
| `/broker/:type/rpa` | `RPA` | poultry_broker |
| `/broker/:type/rpa/:id` | `RPADetail` | poultry_broker |
| `/broker/:type/cash-flow` | `CashFlow` | poultry_broker |
| `/broker/:type/armada` | `Armada` | poultry_broker |
| `/broker/:type/simulator` | `Simulator` | poultry_broker |
| `/broker/:type/tim` | `TimManajemenPage` | semua |
| `/broker/:type/akun` | `Akun` | semua |
| `/broker/:type/sopir` | `SopirDashboard` | poultry_broker |
| **Sembako exclusive** | | |
| `/broker/distributor_sembako/pos` | `POS` | distributor_sembako |
| `/broker/distributor_sembako/penjualan` | `SembakoPenjualan` | distributor_sembako |
| `/broker/distributor_sembako/toko-supplier` | `TokoSupplier` | distributor_sembako |
| `/broker/distributor_sembako/gudang` | `Gudang` | distributor_sembako |
| `/broker/distributor_sembako/produk` | `Produk` | distributor_sembako |
| `/broker/distributor_sembako/inventori` | `Inventori` | distributor_sembako |
| `/broker/distributor_sembako/karyawan` | `Karyawan` | distributor_sembako |
| `/broker/distributor_sembako/laporan` | `Laporan` | distributor_sembako |
| **Egg Broker exclusive** | | |
| `/broker/broker_telur/pos` | `EggPOS` | egg_broker |
| `/broker/broker_telur/inventori` | `EggInventori` | egg_broker |
| `/broker/broker_telur/suppliers` | `Suppliers` | egg_broker |
| `/broker/broker_telur/customers` | `Customers` | egg_broker |

**Sopir Route (RoleGuard):**
`/broker/:type/sopir` → guard `allowedRoles=['sopir']` → `SopirDashboard`

### BrokerPageRouter — Dispatch Detail

```
brokerType === 'broker_ayam' atau 'distributor_daging':
  → poultry_broker/Beranda, Transaksi, Kandang, Pengiriman, RPA, RPADetail,
    CashFlow, Armada, Simulator, TimManajemenPage, Akun, SopirDashboard

brokerType === 'broker_telur':
  → egg_broker/Beranda, POS, Inventori, Suppliers, Customers, Transaksi, Akun, Tim

brokerType === 'distributor_sembako' atau 'sembako_broker':
  → sembako_broker pages (Beranda, POS, Penjualan, Produk, Inventori, Gudang,
    TokoSupplier, Pengiriman, Karyawan, Laporan, Akun, Tim)
```

### BottomNav Broker per Vertical

| Vertical | Tab 1 | Tab 2 | Tab 3 | Tab 4 | FAB |
|----------|-------|-------|-------|-------|-----|
| `poultry_broker` | Home | Transaksi | RPA | Kirim | `/transaksi?action=new` |
| `distributor_sembako` | Home | Jual | Toko | Kirim | Speed Dial (5 item) |
| `egg_broker` | Home | POS | Gudang | Transaksi | `/pos` |

### Sidebar (DrawerMenu) Broker per Vertical

**poultry_broker:** Pengiriman & Loss, Cash Flow, Harga Pasar, Armada & Sopir, Simulator Margin, Tim & Akses, TernakOS Market, Akun & Profil

**distributor_sembako:** Manajemen Produk, Toko & Supplier, Pengiriman, Karyawan, Laporan, Akun & Profil

**egg_broker:** Dashboard, Akun & Profil (minimal — sedang development)

---

## 5. PETERNAK ROUTES

### PeternakLayout (`/peternak/:peternakType`)
Guard: `requiredType="peternak"` + `requiredVertical="peternak"`

**Route-level guards:** `PeternakAdminGuard` (owner/superadmin) dan `PeternakManagerGuard` (owner/manager/superadmin) untuk halaman task_settings dan task_assign.

| Route | Page (via PeternakPageRouter) |
|-------|------------------------------|
| `/peternak/:type/beranda` | Beranda (per-type) |
| `/peternak/:type/siklus` | Siklus (broiler) |
| `/peternak/:type/daily_task` | DailyTask (semua) |
| `/peternak/:type/task_settings` | TaskSettings (guard: owner) |
| `/peternak/:type/task_assign` | TaskAssign (guard: owner/manager) |
| `/peternak/:type/vaksinasi` | Vaksinasi |
| `/peternak/:type/anak-kandang` | AnakKandang (broiler) |
| `/peternak/:type/input-harian` | InputHarian (broiler) |
| `/peternak/:type/pakan` | StokPakan |
| `/peternak/:type/laporan` | Laporan |
| `/peternak/:type/laporan/:cycleId` | Laporan (dengan cycleId) |
| `/peternak/:type/akun` | Akun |
| `/peternak/:type/tim` | Tim |
| `/peternak/:type/listrik-air` | ListrikAir (broiler/sapi) |
| `/peternak/:type/harga-pasar` | HargaPasar |
| `/peternak/:type/kandang-view` | KandangView (sapi/domba) |
| `/peternak/:type/batch` | Batch (ruminansia) |
| `/peternak/:type/ternak` | Ternak (ruminansia) |
| `/peternak/:type/kesehatan` | Kesehatan (ruminansia) |
| `/peternak/:type/reproduksi` | Reproduksi (breeding) |
| `/peternak/:type/penjualan` | Penjualan (ruminansia) |
| `/peternak/:type/quick-add` | QuickAdd (domba/sapi penggemukan) |

**Per-Farm Routes (Level 2):**
| Route | Page |
|-------|------|
| `/peternak/:type/kandang/:farmId/beranda` | FarmBeranda |
| `/peternak/:type/kandang/:farmId/siklus` | Siklus (farm-scoped) |
| `/peternak/:type/kandang/:farmId/input` | InputHarian (farm-scoped) |
| `/peternak/:type/kandang/:farmId/laporan` | Laporan (farm-scoped) |
| `/peternak/:type/kandang/:farmId/pakan` | StokPakan (farm-scoped) |
| `/peternak/:type/kandang/:farmId/vaksinasi` | → redirect ke `../../vaksinasi` |

### PeternakPageRouter — Dispatch Detail

```
peternak_broiler       → broiler/* pages
peternak_layer         → layer/* pages (terbatas)
peternak_sapi_penggemukan → sapi/fattening/* pages
peternak_sapi_breeding    → sapi/breeding/* pages
peternak_domba_penggemukan → domba/fattening/* pages
peternak_domba_breeding    → domba/breeding/* pages
peternak_kambing_penggemukan → kambing/fattening/* pages
peternak_kambing_breeding    → kambing/breeding/* pages
peternak_kambing_perah       → kambing/kambing_perah/* pages
```

> ⚠️ Legacy types `peternak_kambing_domba_penggemukan` dan `peternak_kambing_domba_breeding` di-alias oleh `VERTICAL_ALIASES` ke `peternak_domba_penggemukan` dan `peternak_domba_breeding`.

### BottomNav Peternak per Vertical

| Vertical | Tab 1 | Tab 2 | Tab 3 | Tab 4 | FAB/SpeedDial |
|----------|-------|-------|-------|-------|---------------|
| `peternak` (broiler) | Home | Siklus | Tugas | Profil | — |
| `peternak_domba_penggemukan` | Home | Tugas | Pakan | Menu | Speed Dial (6 item) |
| `peternak_domba_breeding` | Home | Ternak | Tugas | Reproduksi | — |
| `peternak_kambing_penggemukan` | Home | Batch | Tugas | Ternak | — |
| `peternak_kambing_breeding` | Home | Ternak | Tugas | Reproduksi | — |
| `peternak_kambing_perah` | Home | Produksi | Tugas | Ternak | — |
| `peternak_sapi_penggemukan` | Home | Tugas | Batch | Menu | `/quick-add` |
| `peternak_sapi_breeding` | Home | Tugas | Ternak | Menu | — |

> **Domba Fattening Speed Dial:** Timbang Ternak, Log Pakan, Catat Kesehatan, Bersih Kandang, Catatan Harian, Batch Baru

---

## 6. RUMAH POTONG ROUTES

### RumahPotongLayout (`/rumah_potong/:rpType`)
Guard: `requiredType="rumah_potong"` + `requiredVertical="rumah_potong"`

| Route | Page | Status |
|-------|------|--------|
| `/rumah_potong/rpa/beranda` | `RPABeranda` | Active |
| `/rumah_potong/rpa/order` | `RPAOrder` | Active |
| `/rumah_potong/rpa/hutang` | `RPAHutang` | Active |
| `/rumah_potong/rpa/distribusi` | `RPADistribusi` | Active |
| `/rumah_potong/rpa/distribusi/:customerId` | `RPADistribusiDetail` | Active |
| `/rumah_potong/rpa/laporan` | `RPALaporan` | Active |
| `/rumah_potong/rpa/akun` | `RPAAkun` | Active |
| `/rumah_potong/rph/beranda` | `RPHBeranda` (placeholder) | Stub |

> ⚠️ **RPA BottomNav** di businessModel.js memiliki tab: `transaksi` (Produksi), `stok` (Gudang), `pengiriman` (Kirim) — tetapi App.jsx **tidak mendefinisikan** route `/rumah_potong/rpa/transaksi`, `/rumah_potong/rpa/stok`, atau `/rumah_potong/rpa/pengiriman`. Hanya `beranda`, `order`, `hutang`, `distribusi`, `laporan`, `akun` yang ada di router. Ini adalah **potensi inkonsistensi nav vs route**.

---

## 7. ADMIN ROUTES

### AdminLayout (`/admin`)
Guard: `AdminRoute` → `isSuperadmin(profile)` required

| Route | Component | Status |
|-------|-----------|--------|
| `/admin` | `AdminBeranda` | Active |
| `/admin/users` | `AdminUsers` | Active |
| `/admin/subscriptions` | `AdminSubscriptions` | Active |
| `/admin/pricing` | `AdminPricing` | Active |
| `/admin/activity` | `AdminActivity` | Active |
| `/admin/settings` | `AdminSettings` | Active |
| `/admin/info` | `AdminComingSoon` (inline) | Stub |
| `/admin/help` | `AdminComingSoon` (inline) | Stub |

> Admin tidak punya BottomNav — menggunakan sidebar desktop (`AdminLayout`).

---

## 8. STATUS ORPHAN ROUTES

| Route/Component | Status | Keterangan |
|-----------------|--------|------------|
| `rumah_potong_rpa` bottomNav tabs: `transaksi`, `stok`, `pengiriman` | **Orphan Nav** | Tercantum di businessModel.js tapi tidak ada route di App.jsx |
| `/addon` | **Perlu konfirmasi** | `AddonPortal` ada di lazy imports tapi tidak ada explicit route di App.jsx |
| `AppSidebar` entry "Armada & Sopir" untuk non-poultry | Perlu review | Hanya relevan untuk poultry_broker |

---

## 9. ROLE / ACCESS SUMMARY

| Area Dashboard | Vertical | Roles yang Boleh Akses |
|----------------|----------|------------------------|
| Broker (semua) | broker | owner, admin, manager, staff, sales, finance, gudang, lainnya |
| Broker Sopir | broker | sopir saja (RoleGuard) |
| Peternak (semua) | peternak | owner, manager, staff, anak_buah, view_only |
| Task Settings | peternak | owner saja (PeternakAdminGuard) |
| Task Assign | peternak | owner, manager (PeternakManagerGuard) |
| Rumah Potong | rumah_potong | owner, admin_rpa, operator, qc, gudang_rpa, finance |
| Admin | — | superadmin saja (AdminRoute) |
| BottomNav visible | semua | ditentukan per-role di BottomNav.jsx |

---

## 10. NAVIGATION SOURCE MAP

| Nav Element | File | Sumber Data |
|-------------|------|-------------|
| BottomNav (mobile) | `src/dashboard/_shared/components/BottomNav.jsx` | `BUSINESS_MODELS[vertical].bottomNav` dari `businessModel.js` |
| Sidebar (desktop) | `src/dashboard/_shared/components/AppSidebar.jsx` | `BUSINESS_MODELS[vertical].drawerMenu` dari `businessModel.js` |
| DrawerLainnya | `src/dashboard/_shared/components/DrawerLainnya.jsx` | Props `userType` dari BottomNav |
| Admin nav | `src/dashboard/admin/AdminLayout.jsx` | Hardcoded di AdminLayout |
| Role filtering (BottomNav) | `BottomNav.jsx` baris 483–519 | `peternakPermissions()`, `isOwner()`, `isStaff()`, `isViewOnly()` |
