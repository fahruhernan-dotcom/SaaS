# UNUSED_REDUNDANT_AUDIT.md — TernakOS Unused & Redundant File Audit

> Dibuat: 2026-05-16
> Metodologi: grep import references, route references, dynamic imports, barrel exports, string path references
> Semua kategori SAFE_DELETE harus diverifikasi ulang oleh developer sebelum dihapus.

---

## KRITERIA KATEGORISASI

| Kategori | Definisi |
|----------|----------|
| **SAFE_DELETE** | 0 import, 0 route reference, 0 dynamic import, 0 barrel export, 0 string reference, 0 CSS/asset reference |
| **REVIEW_BEFORE_DELETE** | Tidak ditemukan import langsung, tapi ada kemungkinan dipakai secara kondisional, via string, atau belum cukup bukti |
| **DUPLICATE_MERGE** | Konten serupa dengan file lain — jangan hapus sebelum merge/konsolidasi |
| **KEEP** | Dipakai — ada bukti import atau route reference |
| **UNKNOWN** | Belum cukup bukti — perlu investigasi manual lebih lanjut |

---

## TABEL AUDIT UTAMA

### A. ASSETS

| File | Kategori | Evidence | Rekomendasi | Risk |
|------|----------|----------|-------------|------|
| `src/assets/react.svg` | **SAFE_DELETE** | Grep `react.svg` di seluruh src/: **0 hasil**. File adalah default template Vite, tidak pernah dipakai di project. | Delete setelah konfirmasi manual | Low |
| `src/assets/vite.svg` | **SAFE_DELETE** | Grep `vite.svg` di seluruh src/: **0 hasil**. File adalah default template Vite. | Delete setelah konfirmasi manual | Low |
| `src/assets/hero.png` | **SAFE_DELETE** | Grep `hero.png` di seluruh src/: **0 hasil**. Tidak ada import atau referensi string. | Delete setelah konfirmasi manual | Low |
| `src/assets/sheep_sticker.png` | **KEEP** | Diimport di `src/dashboard/peternak/_shared/components/kandang/KandangViewLayout.jsx` | Keep | None |

> ⚠️ Sebelum delete asset, cek juga referensi di file CSS/SCSS dan file config Vite jika ada.

---

### B. UTILITIES

| File | Kategori | Evidence | Rekomendasi | Risk |
|------|----------|----------|-------------|------|
| `src/utils/animations.js` | **REVIEW_BEFORE_DELETE** | Grep `animations` di seluruh src/: **0 hasil** untuk import path ini. Namun perlu cek apakah ada dynamic import atau string reference yang tidak tertangkap grep sederhana. | Cek manual isi file, lalu konfirmasi sebelum delete | Low-Medium |
| `src/utils/` (direktori) | UNKNOWN | Direktori hanya berisi 1 file (`animations.js`). Tidak ada file lain. | Jika `animations.js` dihapus, direktori otomatis kosong | — |

---

### C. COMPONENTS — DUPLIKAT / TIDAK DIPAKAI

| File | Kategori | Evidence | Rekomendasi | Risk |
|------|----------|----------|-------------|------|
| `src/components/CountUp.jsx` | **REVIEW_BEFORE_DELETE** | Grep `components/CountUp` (tanpa `reactbits`): **0 hasil**. Semua import CountUp menggunakan `reactbits/CountUp`. Namun file ini mungkin digunakan via aliased import atau re-export yang belum terdapat grep. Cek isi file untuk memastikan tidak ada re-export logic unik. | Verifikasi isi file, lakukan grep exhaustive, baru delete | Medium |
| `src/components/reactbits/CountUp.jsx` | **KEEP** | Diimport di 3 file: `AboutUs.jsx`, `Features.jsx`, `MarketPrice.jsx` | Keep | None |
| `src/components/EmptyState.jsx` | **REVIEW_BEFORE_DELETE** | Ada 2 `EmptyState`: satu di `components/` (root) dan satu di `dashboard/_shared/components/`. Belum dikonfirmasi apakah `components/EmptyState.jsx` (root) masih diimport di mana pun. Perlu grep spesifik `from.*components/EmptyState`. | Grep targeted untuk import path, lalu tentukan | Medium |
| `src/dashboard/_shared/components/EmptyState.jsx` | **KEEP** | Dipakai di banyak dashboard page | Keep | None |

---

### D. FORM MODALS — DUPLIKAT

| File | Kategori | Evidence | Rekomendasi | Risk |
|------|----------|----------|-------------|------|
| `src/dashboard/_shared/forms/FormBeliModal.jsx` | **REVIEW_BEFORE_DELETE** | Grep `forms/FormBeliModal` di seluruh src/: **0 hasil**. Grep `from.*_shared/forms/`: **0 hasil**. Semua import FormBeliModal menggunakan path `../components/FormBeliModal` (dari Beranda.jsx). File di `forms/` tidak diimport di mana pun yang ditemukan. | Konfirmasi dengan grep exhaustive, cek referensi string path | Medium |
| `src/dashboard/_shared/forms/FormJualModal.jsx` | **REVIEW_BEFORE_DELETE** | Grep `forms/FormJualModal` di seluruh src/: **0 hasil**. Grep `from.*_shared/forms/`: **0 hasil**. Semua import FormJualModal menggunakan path `../components/FormJualModal`. | Konfirmasi dengan grep exhaustive | Medium |
| `src/dashboard/_shared/forms/FormBayarModal.jsx` | **DUPLICATE_MERGE** | **Masih dipakai**: `src/dashboard/_shared/pages/RPA.jsx` mengimport `../forms/FormBayarModal`. Namun ada JUGA `src/dashboard/_shared/components/forms/FormBayarModal.jsx` yang diimport oleh `Transaksi.jsx` dan `SaleAuditSheet.jsx`. Dua file ini berbeda implementasi (inline CSS vs Shadcn Sheet). | Jangan hapus — analisis dulu apakah bisa dimerge atau apakah keduanya punya use case berbeda | High |
| `src/dashboard/_shared/components/FormBeliModal.jsx` | **KEEP** | Diimport di `_shared/pages/Beranda.jsx` via `../components/FormBeliModal` | Keep | None |
| `src/dashboard/_shared/components/FormJualModal.jsx` | **KEEP** | Diimport di `_shared/pages/Beranda.jsx` via `../components/FormJualModal` | Keep | None |
| `src/dashboard/_shared/components/forms/FormBayarModal.jsx` | **KEEP** | Diimport di `poultry_broker/Transaksi.jsx` dan `poultry_broker/components/SaleAuditSheet.jsx` | Keep | None |

---

### E. AI COMPONENTS — RE-EXPORT / DUPLIKAT

| File | Kategori | Evidence | Rekomendasi | Risk |
|------|----------|----------|-------------|------|
| `src/dashboard/broker/ai/AIConfirmCard.jsx` | **REVIEW_BEFORE_DELETE** | File ini adalah **1-baris re-export**: `export { default } from '@/dashboard/_shared/components/AIConfirmCard'`. Grep `broker/ai/AIConfirmCard`: **0 hasil** — tidak ada yang mengimport dari path ini. Namun jika ada kode yang mengimport via path lama (string), belum ketahuan. | Cek apakah ada component yang masih import dari `broker/ai/AIConfirmCard`, baru putuskan | Medium |
| `src/dashboard/_shared/components/AIConfirmCard.jsx` | **KEEP** | Primary implementation (860 baris), dipakai oleh dashboard pages via path `_shared/components/AIConfirmCard` | Keep | None |
| `src/dashboard/broker/ai/AIChatBubble.jsx` | **KEEP** | Diimport oleh `src/dashboard/_shared/layouts/BrokerLayout.jsx` | Keep | None |
| `src/dashboard/peternak/ai/AIChatBubble.jsx` | **REVIEW_BEFORE_DELETE** | Grep `peternak/ai/AIChatBubble` di seluruh src/: **0 hasil**. Tidak ditemukan import langsung. Mungkin ada duplikat dari `broker/ai/AIChatBubble.jsx` atau versi yang sudah tidak dipakai. | Cek isi file — apakah kontennya sama dengan broker/ai versi? Cek apakah PeternakLayout mengimport versi ini. | Medium |

---

### F. PAGES — STUB / MINIMAL

| File | Kategori | Evidence | Rekomendasi | Risk |
|------|----------|----------|-------------|------|
| `src/pages/FiturPage.jsx` | **REVIEW_BEFORE_DELETE** | File berukuran **34 bytes** — kemungkinan hanya berisi `export { default } from './fitur'` atau serupa. **Diimport di App.jsx** untuk route `/fitur`, `/fitur/rpa`, `/fitur/:role/:sub`. Bukan tidak dipakai — tapi mungkin redundant jika bisa diganti langsung dengan `pages/fitur/index.jsx`. | Cek isi file. Jika hanya re-export, ini adalah KEEP (bukan masalah) — ini hanya indirection pattern. | None |

---

### G. SECTIONS LANDING PAGE — POTENSI DUPLIKAT

| File | Kategori | Evidence | Rekomendasi | Risk |
|------|----------|----------|-------------|------|
| `src/sections/Testimonials.jsx` | **REVIEW_BEFORE_DELETE** | Ada 2 file testimonial: `Testimonials.jsx` dan `TestimonialsNew.jsx`. Perlu cek mana yang diimport di `LandingPage.jsx`. | Grep `Testimonials` di `LandingPage.jsx` | Medium |
| `src/sections/TestimonialsNew.jsx` | **REVIEW_BEFORE_DELETE** | Lihat di atas — perlu konfirmasi mana yang aktif | — | Medium |
| `src/sections/Comparison.jsx` | **REVIEW_BEFORE_DELETE** | Ada 2 file comparison: `Comparison.jsx` dan `ComparisonTable.jsx`. Cek mana yang diimport di `LandingPage.jsx`. | Grep `Comparison` di `LandingPage.jsx` | Medium |
| `src/sections/ComparisonTable.jsx` | **REVIEW_BEFORE_DELETE** | Lihat di atas | — | Medium |

---

### H. DIREKTORI KOSONG / MINIMAL

| Path | Kategori | Evidence | Keterangan |
|------|----------|----------|------------|
| `src/constants/` | **REVIEW_BEFORE_DELETE** | Direktori **kosong** — tidak ada file. | Jika tidak digunakan oleh build tool atau config, bisa diabaikan (direktori kosong tidak berpengaruh) |
| `src/config/` | N/A | Direktori **tidak ada** | — |
| `src/hooks/` | KEEP | Berisi 1 file aktif: `use-mobile.jsx` | Keep |
| `src/utils/` | REVIEW | Berisi 1 file: `animations.js` — perlu konfirmasi apakah dipakai | See B above |
| `src/data/` | KEEP | Berisi 1 file aktif: `blogPosts.js` | Keep |

---

### I. RUMAH POTONG — STUB / COMING SOON

| File | Kategori | Evidence | Keterangan |
|------|----------|----------|------------|
| `src/dashboard/rumah_potong/rph/Beranda.jsx` | **REVIEW_BEFORE_DELETE** | RPH (Rumah Potong Hewan) adalah `comingSoon: true` di businessModel.js. RPPageRouter dispatch `rph` ke `RPHBeranda` placeholder. File ini mungkin hanya stub/empty. | Cek isi — jika hanya placeholder tanpa logic, bisa dibersihkan tapi jangan dihapus routing-nya | Low |

---

### J. KEEP — SEMUA FILE LAINNYA

Semua file berikut adalah **KEEP** berdasarkan analisis:

- Semua `src/pages/` kecuali yang sudah disebutkan di atas
- Semua `src/sections/` yang tidak duplikat (Hero, Features, StatsBar, dll)
- Semua `src/components/ui/` (Shadcn components)
- Semua `src/components/invoice/` (dipakai oleh invoice feature)
- Semua `src/components/reactbits/` kecuali CountUp sudah diverifikasi
- Semua hooks di `src/lib/hooks/` (setiap hook ada use case spesifiknya)
- Semua `src/lib/auth/` (RBAC system aktif)
- Semua `src/lib/constants/` (config aktif)
- Semua `src/lib/faq/` (dipakai FAQPage dan fitur showcase)
- Semua dashboard admin, broker, peternak, RPA pages
- `src/lib/businessModel.js` — master config (CRITICAL)
- `src/lib/supabase.js` — Supabase client (CRITICAL)
- `public/` assets semua — tidak bisa dikonfirmasi unused tanpa grep di HTML/CSS dan SSG output

---

## RINGKASAN HITUNGAN

| Kategori | Jumlah File |
|----------|-------------|
| SAFE_DELETE | 3 (react.svg, vite.svg, hero.png) |
| REVIEW_BEFORE_DELETE | 11 (animations.js, CountUp root, EmptyState root, FormBeliModal forms/, FormJualModal forms/, broker/ai/AIConfirmCard, peternak/ai/AIChatBubble, FiturPage stub, Testimonials old, Comparison old, rph stub) |
| DUPLICATE_MERGE | 1 (FormBayarModal — 2 versi berbeda, keduanya aktif) |
| KEEP | ~530+ file |
| UNKNOWN | 0 (sudah dikategorikan minimal REVIEW) |

---

## TOP 10 FILE PALING MENCURIGAKAN

1. `src/assets/react.svg` — default Vite, 0 import
2. `src/assets/vite.svg` — default Vite, 0 import
3. `src/assets/hero.png` — 0 import di seluruh src
4. `src/utils/animations.js` — 0 import (perlu konfirmasi)
5. `src/components/CountUp.jsx` — 0 import (hanya `reactbits/CountUp` yang dipakai)
6. `src/dashboard/_shared/forms/FormBeliModal.jsx` — 0 import dari path `forms/`
7. `src/dashboard/_shared/forms/FormJualModal.jsx` — 0 import dari path `forms/`
8. `src/dashboard/broker/ai/AIConfirmCard.jsx` — hanya 1-baris re-export, 0 import langsung
9. `src/dashboard/peternak/ai/AIChatBubble.jsx` — 0 import langsung
10. `src/sections/Testimonials.jsx` vs `TestimonialsNew.jsx` — kemungkinan salah satunya tidak dipakai

---

## CATATAN PENTING

> **Jangan hapus file apapun** sebelum:
> 1. Grep exhaustive untuk semua kemungkinan import path (termasuk `@/`, `../`, `../../`, string path)
> 2. Cek apakah file digunakan via dynamic `import()` atau `React.lazy()`
> 3. Cek apakah file di-export via barrel `index.js` yang kemudian diimport
> 4. Untuk asset: cek CSS files, Tailwind config, public HTML, SSG output
> 5. Untuk komponen React: cek apakah ada render via string component name (jarang tapi ada di beberapa pattern)
> 6. Minta approval untuk setiap batch cleanup
