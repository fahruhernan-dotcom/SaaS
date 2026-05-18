# CLEANUP_PLAN.md — TernakOS Phased Cleanup Plan

> Dibuat: 2026-05-16
> Status: MENUNGGU APPROVAL — jangan eksekusi tanpa persetujuan eksplisit per fase.

---

## RINGKASAN EKSEKUTIF

Total file yang diaudit: **~545+ JSX/JS files**
File yang perlu action: **~20 file** (file lainnya KEEP)
Temuan kritis: **1 bug navigasi** (RPA BottomNav menuju route tidak ada)

### Hitungan per Kategori

| Kategori | Jumlah | File |
|----------|--------|------|
| SAFE_DELETE | 3 | react.svg, vite.svg, hero.png |
| REVIEW_BEFORE_DELETE | 11 | Lihat daftar di bawah |
| DUPLICATE_MERGE | 1 pair | FormBayarModal (2 versi berbeda, keduanya aktif) |
| KEEP | ~530+ | Semua file yang dipakai |
| Bug (nav vs route mismatch) | 1 | RPA BottomNav |

---

## FASE 1 — SAFE CLEANUP (LOW RISK)

> Hanya untuk item yang sudah diverifikasi 0 import.
> **Perlu approval sebelum eksekusi.**

### 1A. Hapus Asset Default Vite (Unused)

| File | Evidence | Risk |
|------|----------|------|
| `src/assets/react.svg` | Grep `react.svg` → 0 hasil | Low |
| `src/assets/vite.svg` | Grep `vite.svg` → 0 hasil | Low |
| `src/assets/hero.png` | Grep `hero.png` → 0 hasil | Low |

**Aksi:** Delete ketiga file ini.
**Verifikasi Sebelum:** Grep exhaustive + cek CSS files + cek Vite config.
**Verifikasi Sesudah:** `npm run lint && npm run build` harus sukses.

### 1B. Verifikasi Tambahan untuk REVIEW Items

Sebelum mengkategorisasi REVIEW menjadi SAFE_DELETE, lakukan grep berikut:

```bash
# Untuk src/utils/animations.js
grep -r "animations" src/ --include="*.jsx" --include="*.js" --include="*.ts" --include="*.tsx"
grep -r "from.*animations" src/

# Untuk src/components/CountUp.jsx
grep -r "from.*[^s]CountUp" src/  # menghindari match reactbits/CountUp

# Untuk src/components/EmptyState.jsx (root)
grep -r "from.*components/EmptyState" src/ | grep -v "_shared"

# Untuk _shared/forms/FormBeliModal dan FormJualModal
grep -r "from.*forms/Form" src/
grep -r "forms/FormBeliModal\|forms/FormJualModal" src/

# Untuk broker/ai/AIConfirmCard (re-export)
grep -r "broker/ai/AIConfirmCard" src/

# Untuk peternak/ai/AIChatBubble
grep -r "peternak/ai/AIChatBubble" src/

# Untuk sections — mana yang aktif di LandingPage
grep -r "Testimonials\|ComparisonTable\|Comparison" src/pages/LandingPage.jsx
```

---

## FASE 2 — REVIEW CLEANUP (SETELAH KONFIRMASI)

> Eksekusi hanya setelah grep Phase 1B dikonfirmasi dan hasilnya membuktikan file tidak dipakai.
> **Perlu approval terpisah per item.**

### Kandidat jika terbukti tidak dipakai

| File | Syarat Delete |
|------|--------------|
| `src/utils/animations.js` | Grep 0 hasil + cek isi file tidak mengekspor sesuatu yang unik |
| `src/components/CountUp.jsx` | Grep `from.*CountUp` (bukan reactbits) → 0 hasil |
| `src/components/EmptyState.jsx` (root) | Grep `from.*components/EmptyState` (bukan _shared) → 0 hasil |
| `src/dashboard/_shared/forms/FormBeliModal.jsx` | Grep `forms/FormBeliModal` → 0 hasil |
| `src/dashboard/_shared/forms/FormJualModal.jsx` | Grep `forms/FormJualModal` → 0 hasil |
| `src/dashboard/broker/ai/AIConfirmCard.jsx` | Grep → 0 hasil + tidak ada component import dari path ini |
| `src/dashboard/peternak/ai/AIChatBubble.jsx` | Grep → 0 hasil + cek isi file vs broker versi |
| `src/sections/Testimonials.jsx` | LandingPage.jsx tidak mengimport ini |
| `src/sections/ComparisonTable.jsx` atau `Comparison.jsx` | Mana yang tidak diimport di LandingPage.jsx |

---

## FASE 3 — BUG FIX: RPA NAVIGATION

> Ini bukan cleanup — ini adalah bug fix yang perlu dilakukan.
> **Perlu approval terpisah karena menyentuh businessModel.js (critical file).**

### Bug: RPA BottomNav menuju route yang tidak ada

**Masalah:**
`businessModel.js` mendefinisikan BottomNav untuk `rumah_potong_rpa`:
```javascript
bottomNav: createNav('rumah_potong', 'rpa', [
  { slug: 'beranda',   label: 'Home'     },
  { slug: 'transaksi', label: 'Produksi' },  // ❌ /rumah_potong/rpa/transaksi tidak ada
  { slug: 'stok',      label: 'Gudang'   },  // ❌ /rumah_potong/rpa/stok tidak ada
  { slug: 'pengiriman',label: 'Kirim'    },  // ❌ /rumah_potong/rpa/pengiriman tidak ada
])
```

**Route yang ada di App.jsx untuk RPA:** beranda, order, hutang, distribusi, laporan, akun

**Solusi A:** Update `bottomNav` di `businessModel.js` agar menggunakan route yang ada:
```javascript
bottomNav: createNav('rumah_potong', 'rpa', [
  { slug: 'beranda',   label: 'Home'    },
  { slug: 'order',     label: 'Order'   },
  { slug: 'hutang',    label: 'Hutang'  },
  { slug: 'distribusi',label: 'Distribusi' },
])
```

**Solusi B:** Tambahkan route yang hilang di App.jsx dan buat halaman untuk mereka.

**Rekomendasi:** Solusi A lebih aman karena tidak menambah route baru. Tapi perlu konfirmasi dengan developer apakah `transaksi`, `stok`, dan `pengiriman` memang belum dikerjakan atau sudah dihapus.

---

## FASE 4 — MINOR KONSISTENSI

> Non-breaking fixes, eksekusi setelah Fase 1-3 selesai.

### 4A. Sidebar path konsistensi (stok-pakan vs pakan)

Beberapa `drawerMenu` di Domba dan Sapi menggunakan `/stok-pakan` sebagai path:
```javascript
{ path: '/peternak/peternak_domba_penggemukan/stok-pakan', label: 'Stok & Pakan' }
```

App.jsx mendefinisikan `/pakan` sebagai route utama, dengan redirect dari `/stok-pakan` ke `/pakan`. Fungsi berjalan normal karena ada redirect, tapi tidak konsisten.

**Action:** Update `drawerMenu` path ke `/pakan` di semua model ruminansia.
**File:** `src/lib/businessModel.js`
**Risk:** Low — hanya path string change di config

### 4B. Cleanup direktori kosong (opsional)

`src/constants/` adalah direktori kosong. Secara fungsional tidak berpengaruh, tapi bisa membingungkan.
**Action (opsional):** Hapus direktori jika tidak ada rencana mengisinya.

---

## FASE 5 — DUPLICATE MERGE (HATI-HATI)

> Fase ini memerlukan analisis bisnis lebih dalam. Jangan eksekusi tanpa pemahaman penuh.

### FormBayarModal — Dua Versi Aktif

| File | Dipakai Oleh | UI |
|------|-------------|-----|
| `_shared/forms/FormBayarModal.jsx` | `RPA.jsx` | Inline CSS, SlideModal |
| `_shared/components/forms/FormBayarModal.jsx` | `Transaksi.jsx`, `SaleAuditSheet.jsx` | Shadcn Sheet |

Kedua file melakukan operasi berbeda (berbeda tabel, berbeda logic). **Jangan merge** tanpa memahami perbedaan bisnis antara keduanya.

**Rekomendasi:** Rename agar lebih jelas perbedaannya. Contoh:
- `FormBayarRPAModal.jsx` (untuk RPA payment, dari `forms/`)
- `FormBayarBrokerModal.jsx` (untuk broker payment, dari `components/forms/`)

---

## FASE 6 — FINAL VALIDATION

Setelah semua fase selesai, jalankan:

```bash
npm run lint
npm run build
```

Cek:
- [ ] Tidak ada "Module not found" error
- [ ] Tidak ada unused import warning yang baru
- [ ] Build sukses tanpa error
- [ ] Route utama bisa diakses (login, dashboard, beranda)
- [ ] Mobile BottomNav berfungsi
- [ ] RPA nav sudah diperbaiki (jika Fase 3 dieksekusi)

---

## RISIKO JIKA LANGSUNG DELETE TANPA AUDIT

| Risk | Dampak |
|------|--------|
| Menghapus file yang masih diimport via path yang tidak tertangkap grep | Build error, blank page |
| Menghapus asset yang direferensi via string (bukan import statement) | Runtime error, gambar broken |
| Menghapus form modal yang ternyata masih dipakai di page yang jarang dibuka | Feature broken (silent) |
| Menghapus re-export file yang masih diimport via path lama di komponen tertentu | Build error |
| Menghapus AI component yang diload kondisional | Feature broken saat kondisi terpenuhi |

---

## PRIORITAS PENGERJAAN

| Prioritas | Item | Alasan |
|-----------|------|--------|
| 🔴 HIGH | Bug fix RPA BottomNav | Bug nyata — user punya 3 tab yang tidak berfungsi |
| 🟡 MEDIUM | Fase 1 cleanup (3 asset) | Low risk, mudah dilakukan |
| 🟡 MEDIUM | Fase 1B verification (grep batch) | Perlu dilakukan sebelum Fase 2 |
| 🟢 LOW | Fase 4A (path konsistensi) | Non-breaking, minor improvement |
| 🟢 LOW | Fase 2 (review items setelah verifikasi) | Hanya jika grep membuktikan tidak dipakai |
| ⚪ FUTURE | Fase 5 (FormBayarModal merge/rename) | Butuh analisis bisnis |
| ⚪ FUTURE | Dependency cleanup (animejs dll) | Butuh grep + build test |

---

## TOP 10 FILE PALING MENCURIGAKAN (Recap)

1. `src/assets/react.svg` — default Vite, 0 import
2. `src/assets/vite.svg` — default Vite, 0 import
3. `src/assets/hero.png` — 0 import di seluruh src
4. `src/utils/animations.js` — 0 import (perlu konfirmasi)
5. `src/components/CountUp.jsx` — 0 import (hanya reactbits versi yang dipakai)
6. `src/dashboard/_shared/forms/FormBeliModal.jsx` — 0 import dari path `forms/`
7. `src/dashboard/_shared/forms/FormJualModal.jsx` — 0 import dari path `forms/`
8. `src/dashboard/broker/ai/AIConfirmCard.jsx` — hanya 1-baris re-export, 0 import dari path ini
9. `src/dashboard/peternak/ai/AIChatBubble.jsx` — 0 import langsung
10. RPA BottomNav tabs (Produksi/Gudang/Kirim) — menuju route yang tidak ada di App.jsx

---

## TOP 10 DUPLICATE LOGIC PALING PENTING (Recap)

1. `FormBayarModal` — 2 versi berbeda, keduanya aktif (RPA vs Broker)
2. `FormBeliModal` — 2 versi (forms/ lama tidak dipakai, components/ aktif)
3. `FormJualModal` — 2 versi (forms/ lama tidak dipakai, components/ aktif)
4. `AIChatBubble` — 2 versi (broker/ aktif, peternak/ tidak diimport)
5. `CountUp` — 2 versi (root tidak diimport, reactbits/ aktif)
6. `EmptyState` — 2 versi (root dan dashboard/_shared — belum dikonfirmasi mana yang dipakai)
7. `MobilePrimitives` — 2 versi (broker/_shared dan peternak/_shared — belum dikonfirmasi isi)
8. `isSuperadmin()` — 3 field dicek (technical debt migrasi)
9. `isPeternakDombaFattening()` — local helper di BottomNav yang harusnya bisa pakai `resolveBusinessVertical`
10. Speed Dial items — hardcoded di BottomNav, harusnya ada di businessModel.js config
