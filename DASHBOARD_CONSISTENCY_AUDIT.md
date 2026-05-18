# DASHBOARD_CONSISTENCY_AUDIT.md — TernakOS Dashboard Consistency Audit

> Dibuat: 2026-05-16
> Source: `businessModel.js` (nav config), `BottomNav.jsx` (filter logic), `App.jsx` (routes), `BrokerRouter.jsx`, `PeternakRouter.jsx`

---

## METODOLOGI

1. Baca `BUSINESS_MODELS[vertical].bottomNav` dan `drawerMenu` per vertical
2. Cek route yang tersedia di App.jsx per vertical
3. Cek BottomNav filtering logic per role
4. Verifikasi tidak ada konteks vertical lain yang bocor
5. Cek inkonsistensi nav item vs route yang ada

---

## A. PETERNAK DOMBA FATTENING (`peternak_domba_penggemukan`)

### BottomNav (Mobile Floating Dock)

| Tab | Path | Status |
|-----|------|--------|
| Home | `/peternak/peternak_domba_penggemukan/beranda` | ✅ Route ada |
| Tugas | `/peternak/peternak_domba_penggemukan/daily_task` | ✅ Route ada |
| Pakan | `/peternak/peternak_domba_penggemukan/pakan` | ✅ Route ada |
| Menu | (trigger toggleMobileSidebar) | ✅ Bukan route, event handler |

**Speed Dial Items:**
| Label | Navigate ke | Status |
|-------|------------|--------|
| Timbang Ternak | `/peternak/peternak_domba_penggemukan/ternak` | ✅ Route ada |
| Log Pakan | `/peternak/peternak_domba_penggemukan/stok-pakan` | ⚠️ Route di App.jsx adalah `/pakan` (alias `/stok-pakan` → redirect ke `/pakan`) |
| Catat Kesehatan | `/peternak/peternak_domba_penggemukan/kesehatan` | ✅ Route ada |
| Bersih Kandang | `/peternak/peternak_domba_penggemukan/daily_task` | ✅ Route ada |
| Catatan Harian | `/peternak/peternak_domba_penggemukan/daily_task` | ✅ Route ada |
| Batch Baru | `/peternak/peternak_domba_penggemukan/batch` | ✅ Route ada |

### Sidebar/DrawerMenu

| Item | Path | Status |
|------|------|--------|
| Penjualan | `/peternak/peternak_domba_penggemukan/penjualan` | ✅ Route ada |
| Kesehatan | `/peternak/peternak_domba_penggemukan/kesehatan` | ✅ Route ada |
| Stok & Pakan | `/peternak/peternak_domba_penggemukan/stok-pakan` | ⚠️ App.jsx route `/pakan` → redirect dari `/stok-pakan` |
| Laporan Batch | `/peternak/peternak_domba_penggemukan/laporan` | ✅ Route ada |
| Harga Pasar | `/peternak/peternak_domba_penggemukan/harga-pasar` | ✅ Route ada |
| Tim & Akses | `/peternak/peternak_domba_penggemukan/tim` | ✅ Route ada |
| TernakOS Market | `/market` | ✅ Shared route |
| Akun & Profil | `/peternak/peternak_domba_penggemukan/akun` | ✅ Route ada |

### Verifikasi Konteks Sembako TIDAK MUNCUL

Konfirmasi dari `businessModel.js` dan `BottomNav.jsx`:
- ✅ **Tidak ada** item "Gudang Sembako" di nav
- ✅ **Tidak ada** item "Toko" di nav (Sembako-specific)
- ✅ **Tidak ada** item "Supplier" di nav (Sembako-specific)
- ✅ **Tidak ada** item "Produk Dagangan" di nav
- ✅ **Tidak ada** item "Transaksi Sembako" di nav

**Kesimpulan Domba Fattening: BERSIH** — tidak ada konteks Sembako yang bocor.

### Routes yang Tersedia untuk Domba Fattening (via PeternakRouter)

✅ beranda, daily_task, task_settings (guard), task_assign (guard), pakan, ternak, kesehatan, batch, laporan, quick-add, penjualan, listrik-air, harga-pasar, tim, akun, kandang-view, AI routes

---

## B. PETERNAK SAPI FATTENING (`peternak_sapi_penggemukan`)

### BottomNav

| Tab | Path | Status |
|-----|------|--------|
| Home | `/peternak/peternak_sapi_penggemukan/beranda` | ✅ Route ada |
| Tugas | `/peternak/peternak_sapi_penggemukan/daily_task` | ✅ Route ada |
| Batch | `/peternak/peternak_sapi_penggemukan/batch` | ✅ Route ada |
| Menu | (toggleMobileSidebar) | ✅ |

### Sidebar/DrawerMenu

| Item | Path | Status |
|------|------|--------|
| Pengaturan Tugas | `/peternak/peternak_sapi_penggemukan/task_settings` | ✅ Route ada (guard owner) |
| Log Pakan | `/peternak/peternak_sapi_penggemukan/stok-pakan` | ⚠️ Sama seperti domba |
| Kesehatan | `/peternak/peternak_sapi_penggemukan/kesehatan` | ✅ Route ada |
| Laporan Batch | `/peternak/peternak_sapi_penggemukan/laporan` | ✅ Route ada |
| Tim & Akses | `/peternak/peternak_sapi_penggemukan/tim` | ✅ Route ada |
| TernakOS Market | `/market` | ✅ Shared |
| Akun & Profil | `/peternak/peternak_sapi_penggemukan/akun` | ✅ Route ada |

**Kesimpulan Sapi Fattening: BERSIH** — konteks domba/sembako tidak bocor.

---

## C. PETERNAK DOMBA BREEDING (`peternak_domba_breeding`)

### BottomNav

| Tab | Path | Status |
|-----|------|--------|
| Home | `/peternak/peternak_domba_breeding/beranda` | ✅ |
| Ternak | `/peternak/peternak_domba_breeding/ternak` | ✅ |
| Tugas | `/peternak/peternak_domba_breeding/daily_task` | ✅ |
| Reproduksi | `/peternak/peternak_domba_breeding/reproduksi` | ✅ Route ada |

**Kesimpulan Domba Breeding: BERSIH.**

---

## D. PETERNAK BROILER (`peternak`)

### BottomNav

| Tab | Path | Status |
|-----|------|--------|
| Home | `/peternak/peternak_broiler/beranda` | ✅ |
| Siklus | `/peternak/peternak_broiler/siklus` | ✅ |
| Tugas | `/peternak/peternak_broiler/daily_task` | ✅ |
| Profil | `/peternak/peternak_broiler/akun` | ✅ |

**Kesimpulan Broiler: BERSIH.**

---

## E. DISTRIBUTOR SEMBAKO (`distributor_sembako`)

### BottomNav

| Tab | Path | Status |
|-----|------|--------|
| Home | `/broker/distributor_sembako/beranda` | ✅ Route ada |
| Jual | `/broker/distributor_sembako/penjualan` | ✅ Route ada |
| Toko | `/broker/distributor_sembako/toko-supplier` | ✅ Route ada |
| Kirim | `/broker/distributor_sembako/pengiriman` | ✅ Route ada |

**Speed Dial Items:**
| Label | Navigate ke | Status |
|-------|------------|--------|
| Transaksi Baru | `.../penjualan?action=new` | ✅ |
| Tambah Toko | `.../toko-supplier?action=new` | ✅ |
| Tambah Stok | `.../gudang?action=add-stock` | ✅ |
| Tambah Produk | `.../produk?action=new` | ✅ |
| Tambah Pengeluaran | `.../laporan` | ✅ |

### Sidebar/DrawerMenu

| Item | Path | Status |
|------|------|--------|
| Manajemen Produk | `.../produk` | ✅ |
| Toko & Supplier | `.../toko-supplier` | ✅ |
| Pengiriman | `.../pengiriman` | ✅ |
| Karyawan | `.../karyawan` | ✅ |
| Laporan | `.../laporan` | ✅ |
| Akun & Profil | `.../akun` | ✅ |

### Verifikasi Konteks Kandang/Peternak TIDAK MUNCUL

- ✅ **Tidak ada** item "Kandang" di nav Sembako
- ✅ **Tidak ada** item "Domba", "Sapi", "Ternak" di nav Sembako
- ✅ **Tidak ada** item "Siklus", "Batch", "Vaksinasi" di nav Sembako

**Kesimpulan Sembako: BERSIH.**

### Role Filtering Sembako (BottomNav)

```javascript
// BottomNav.jsx baris 505-512
if (isStaff(profile)) {
  if (isSembako) {
    return ['Beranda', 'Jual', 'Toko', 'Kirim'].includes(tab.label)
  }
}
if (isViewOnly(profile)) {
  if (isSembako) {
    return ['Beranda', 'Laporan'].includes(tab.label)
  }
}
```

- **Owner:** Semua tab
- **Staff:** Beranda, Jual, Toko, Kirim
- **View Only:** Beranda, Laporan
- **Sopir:** Tidak ada (sopir tidak relevan untuk sembako)

---

## F. BROKER AYAM (`poultry_broker`)

### BottomNav

| Tab | Path | Status |
|-----|------|--------|
| Home | `/broker/broker_ayam/beranda` | ✅ |
| Transaksi | `/broker/broker_ayam/transaksi` | ✅ |
| RPA | `/broker/broker_ayam/rpa` | ✅ |
| Kirim | `/broker/broker_ayam/pengiriman` | ✅ |

### Verifikasi Konteks Sembako TIDAK MUNCUL

- ✅ Tidak ada "Gudang Sembako", "Toko", "Produk", "Inventori Sembako"

### Role Filtering Broker Ayam (BottomNav)

```javascript
if (isStaff(profile)) {
  return ['Beranda', 'Transaksi', 'RPA', 'Akun'].includes(tab.label)
}
if (isViewOnly(profile)) {
  return ['Beranda', 'Transaksi', 'Akun'].includes(tab.label)
}
// sopir: return false (dipindah ke route sopir terpisah)
```

**Kesimpulan Broker Ayam: BERSIH.**

---

## G. BROKER TELUR (`egg_broker`)

### BottomNav

| Tab | Path | Status |
|-----|------|--------|
| Home | `/broker/broker_telur/beranda` | ✅ |
| POS | `/broker/broker_telur/pos` | ✅ |
| Gudang | `/broker/broker_telur/inventori` | ✅ |
| Transaksi | `/broker/broker_telur/transaksi` | ✅ |

**Sidebar minimal:** Hanya Dashboard + Akun (sedang development).

**Kesimpulan Egg Broker: BERSIH.**

---

## H. RPA (Rumah Potong Ayam) — `rumah_potong_rpa`

### BottomNav

| Tab | Path di businessModel.js | Route di App.jsx | Status |
|-----|--------------------------|-----------------|--------|
| Home | `/rumah_potong/rpa/beranda` | ✅ Ada | ✅ |
| Produksi | `/rumah_potong/rpa/transaksi` | ❌ **Tidak ada route ini di App.jsx** | 🔴 MASALAH |
| Gudang | `/rumah_potong/rpa/stok` | ❌ **Tidak ada route ini di App.jsx** | 🔴 MASALAH |
| Kirim | `/rumah_potong/rpa/pengiriman` | ❌ **Tidak ada route ini di App.jsx** | 🔴 MASALAH |

> **🔴 INKONSISTENSI KRITIS:** `businessModel.js` mendefinisikan 4 tab untuk RPA (Home, Produksi, Gudang, Kirim), tetapi App.jsx hanya mendefinisikan route `beranda`, `order`, `hutang`, `distribusi`, `laporan`, `akun`. Tab **Produksi**, **Gudang**, dan **Kirim** di BottomNav akan menuju ke route yang tidak ada dan kemungkinan menghasilkan 404 atau redirect ke `NotFound`.

### RPA Routes yang Ada vs Nav Config

| Route yang Ada | Nav item yang Sesuai |
|----------------|---------------------|
| `/rumah_potong/rpa/order` | Tidak ada di BottomNav |
| `/rumah_potong/rpa/hutang` | Tidak ada di BottomNav |
| `/rumah_potong/rpa/distribusi` | Tidak ada di BottomNav (ada di drawerMenu) |
| `/rumah_potong/rpa/laporan` | Tidak ada di BottomNav (ada di drawerMenu) |

### Sidebar/DrawerMenu RPA (OK)

| Item | Path | Status |
|------|------|--------|
| Distribusi & Invoice | `/rumah_potong/rpa/distribusi` | ✅ Route ada |
| Laporan Margin | `/rumah_potong/rpa/laporan` | ✅ Route ada |
| TernakOS Market | `/market` | ✅ Shared |
| Akun & Profil | `/rumah_potong/rpa/akun` | ✅ Route ada |

**Kesimpulan RPA: BottomNav memiliki 3 tab yang menuju route yang TIDAK ADA di App.jsx. Ini perlu diperbaiki.**

---

## I. ADMIN (Superadmin)

Admin tidak menggunakan BottomNav — menggunakan AdminLayout dengan sidebar sendiri.

| Menu Admin | Route | Status |
|-----------|-------|--------|
| Dashboard | `/admin` | ✅ |
| Users | `/admin/users` | ✅ |
| Subscriptions | `/admin/subscriptions` | ✅ |
| Pricing | `/admin/pricing` | ✅ |
| Activity | `/admin/activity` | ✅ |
| Settings | `/admin/settings` | ✅ |
| Info | `/admin/info` | ✅ (AdminComingSoon placeholder) |
| Help | `/admin/help` | ✅ (AdminComingSoon placeholder) |

**Tidak ada context peternak/sembako yang bocor ke admin.**

**Kesimpulan Admin: BERSIH.**

---

## J. LEGACY MODELS

### `peternak_kambing_domba_penggemukan` dan `peternak_kambing_domba_breeding`

Kedua model ini masih ada di `BUSINESS_MODELS` dengan label "(Legacy)". Mereka punya nav config sendiri dan di-alias oleh `VERTICAL_ALIASES` ke model domba baru.

**Status:** User dengan legacy sub_type masih bisa login dan akan di-resolve ke model baru via `VERTICAL_ALIASES`. Nav config legacy di BUSINESS_MODELS tidak lagi digunakan untuk user baru, tapi masih ada sebagai fallback. Ini **aman** — tidak ada pembersihan yang diperlukan sekarang.

---

## RINGKASAN TEMUAN

### Yang Sudah Benar ✅

1. Domba Fattening: tidak ada konteks Sembako di nav
2. Sembako: tidak ada konteks kandang/ternak di nav
3. Broker Ayam: tidak ada konteks sembako/peternak di nav
4. Broiler: tidak ada konteks sembako/broker di nav
5. Admin: terpisah sempurna dari semua vertical
6. Role filtering di BottomNav: berbeda untuk owner/staff/view_only/sopir

### Yang Perlu Diperbaiki 🔴

1. **RPA BottomNav** — 3 tab (Produksi, Gudang, Kirim) menuju route yang tidak ada:
   - Tab `transaksi` → `/rumah_potong/rpa/transaksi` — route tidak ada
   - Tab `stok` → `/rumah_potong/rpa/stok` — route tidak ada
   - Tab `pengiriman` → `/rumah_potong/rpa/pengiriman` — route tidak ada
   - **Action:** Perbarui `BUSINESS_MODELS.rumah_potong_rpa.bottomNav` agar menggunakan route yang ada (`order`, `hutang`, dll), ATAU tambahkan route yang hilang di App.jsx

2. **Sidebar path `/stok-pakan`** di Domba dan Sapi — App.jsx menggunakan `/pakan` (dengan redirect dari `/stok-pakan`):
   - Ini tidak menyebabkan error karena ada redirect, tapi path di `drawerMenu` tidak konsisten dengan route yang didefinisikan.
   - **Action (minor):** Update `drawerMenu` path ke `/pakan` untuk konsistensi

### Yang Perlu Dikonfirmasi ⚠️

1. `AddonPortal` — diimport di App.jsx tapi tidak ada route eksplisit (mungkin route hanya muncul jika user punya addon)
2. `peternak_layer` — Coming Soon, tapi PeternakRouter punya dispatch untuk layer. Apakah halaman layer sudah ada atau masih stub?
