# DEPENDENCY_AUDIT.md — TernakOS Package & Dependency Audit

> Dibuat: 2026-05-16
> Source: `package.json` (versi aktual project)

---

## PACKAGE.JSON — SCRIPTS

| Script | Command | Status |
|--------|---------|--------|
| `dev` | `vite` | ✅ Dipakai development |
| `build` | `vite-react-ssg build` | ✅ Dipakai production (SSG) |
| `lint` | `eslint .` | ✅ Dipakai |
| `preview` | `vite preview` | ✅ Dipakai |
| `sitemap` | `node scripts/generate-sitemap.js` | Perlu cek apakah script exists |
| `scrape:market` | Python script | External tool, OK |
| `scrape:arboge` | Python script | External tool, OK |
| `scrape:all` | Combine scrape | External tool, OK |
| `postinstall` | `patch-package` | Untuk patch kamera/WebGL compat |

---

## DEPENDENCIES AUDIT

### ✅ CORE — Jelas Dipakai

| Package | Versi | Dipakai Di |
|---------|-------|-----------|
| `react` | ^19.2.4 | Seluruh project |
| `react-dom` | ^19.2.4 | Seluruh project |
| `react-router-dom` | ^7.13.1 | App.jsx + semua pages |
| `@supabase/supabase-js` | ^2.105.1 | `lib/supabase.js` + semua hooks |
| `@tanstack/react-query` | ^5.90.21 | Semua data hooks |
| `tailwindcss` | ^3.4.19 | Semua komponen (dev) |
| `lucide-react` | ^0.577.0 | BottomNav, AppSidebar, semua pages |
| `framer-motion` | ^12.36.0 | BottomNav, layout animations |
| `sonner` | ^2.0.7 | Toast notifikasi (`toast()`) |
| `react-hook-form` | ^7.71.2 | Semua form modal |
| `@hookform/resolvers` | ^5.2.2 | Zod resolver untuk RHF |
| `zod` | ^4.3.6 | Validasi form |
| `clsx` | ^2.1.1 | Class merging |
| `tailwind-merge` | ^3.5.0 | Tailwind class merging |
| `class-variance-authority` | ^0.7.1 | Shadcn button variants |
| `date-fns` | ^4.1.0 | Date formatting |
| `react-day-picker` | ^9.14.0 | Calendar/DatePicker |
| `recharts` | ^2.15.4 | Chart di dashboard |

### ✅ RADIX UI — Shadcn Components (9 packages)

Semua `@radix-ui/react-*` dipakai sebagai primitif untuk Shadcn components di `src/components/ui/`:
`react-dialog`, `react-popover`, `react-select`, `react-dropdown-menu`, `react-avatar`, `react-tooltip`, `react-collapsible`, `react-slot`, `react-tabs`

### ⚠️ BERAT — Perlu Pertimbangan

| Package | Ukuran | Dipakai Di | Catatan |
|---------|--------|-----------|---------|
| `@react-three/fiber` | ~1.5MB | `SplineScene.jsx` | WebGL 3D renderer |
| `@react-three/drei` | ~2MB | `SplineScene.jsx` | Helpers untuk three.js |
| `three` | ~1MB | Dependensi fiber/drei | — |
| `@splinetool/react-spline` | ~500KB | `SplineScene.jsx` | Spline 3D embed |
| `@splinetool/runtime` | ~1MB | `SplineScene.jsx` | Runtime Spline |
| `gsap` | ~500KB | `lib/animation.js` (dipakai 6 sections) | Landing page animations |
| `animejs` | ~300KB | Perlu grep — mungkin tidak dipakai? | Lihat catatan di bawah |
| `@react-pdf/renderer` | ~2MB | Invoice templates | PDF generation |
| `framer-motion` | ~600KB | BottomNav, layout | Sudah penting, OK |
| `@dnd-kit/core` | ~200KB | Dipakai di mana? | Perlu grep |

> ⚠️ **Spline + Three.js total: ~6MB+** — Package ini sangat berat untuk landing page. Jika `SplineScene.jsx` hanya dipakai di satu section landing page, pertimbangkan lazy-loading atau SSG exclusion.

### ⚠️ PERLU KONFIRMASI IMPORT

| Package | Status | Action |
|---------|--------|--------|
| `animejs` | **Perlu grep** — `lib/animation.js` mungkin menggunakan ini, atau mungkin menggunakan GSAP. Jika tidak dipakai, ~300KB bisa dihemat. | Grep `from 'animejs'` atau `import animejs` di seluruh src/ |
| `@dnd-kit/core` | **Perlu grep** — Drag-and-drop. Mungkin dipakai untuk kandang re-ordering atau task board. | Grep `from '@dnd-kit'` |
| `@dnd-kit/utilities` | Dependensi dari `@dnd-kit/core` | Lihat di atas |
| `cmdk` | **Perlu grep** — Command palette. Mungkin dipakai di AppSidebar atau admin. | Grep `from 'cmdk'` |
| `canvas-confetti` | **Perlu grep** — Konfeti animasi. Mungkin dipakai di WelcomeOnboard atau transaction success. | Grep `canvas-confetti` |
| `@number-flow/react` | **Perlu grep** — Animated number. Mungkin dipakai di dashboard KPI. | Grep `number-flow` |
| `react-is` | **Perlu grep** — Runtime type check. Biasanya dependensi internal. | — |

### ✅ BUILD & DEV TOOLS

| Package | Status |
|---------|--------|
| `vite` | ✅ Build tool utama |
| `@vitejs/plugin-react` | ✅ React HMR |
| `vite-react-ssg` | ✅ SSG build |
| `vite-plugin-pwa` | ✅ PWA manifest + service worker |
| `eslint` + plugins | ✅ Linting |
| `autoprefixer` + `postcss` | ✅ CSS processing |
| `typescript` + `@types/*` | ✅ Type support (meski project pakai JSX) |
| `patch-package` + `postinstall-postinstall` | ✅ Untuk patch kamera WebGL compat |
| `sharp` | ✅ Image processing (untuk PWA icons) |

### ⚠️ PACKAGE TIDAK DI PACKAGE.JSON (Perlu Cek)

Beberapa import mungkin menggunakan alias atau tidak ada di dependencies. Perlu grep untuk:
- `react-helmet-async` — SEO component — ada di package.json ✅
- `tailwindcss-animate` — ada di package.json ✅

---

## REKOMENDASI

### Prioritas Tinggi

| Action | Package | Estimasi Hemat |
|--------|---------|---------------|
| Verifikasi apakah `animejs` dipakai | `animejs` | ~300KB jika tidak dipakai |
| Lazy load Spline scene | `@splinetool/*`, `three`, `@react-three/*` | Tidak reduce bundle tapi reduce initial load |
| Grep `@dnd-kit` — jika tidak dipakai, hapus | `@dnd-kit/core`, `@dnd-kit/utilities` | ~200KB |
| Grep `cmdk` — jika tidak dipakai, hapus | `cmdk` | ~100KB |

### Prioritas Rendah

| Action | Package |
|--------|---------|
| Konfirmasi `canvas-confetti` dipakai | `canvas-confetti` |
| Konfirmasi `@number-flow/react` dipakai | `@number-flow/react` |
| Konfirmasi `react-is` dipakai langsung | `react-is` |

### Overlap Analysis

| Fungsi | Package A | Package B | Catatan |
|--------|----------|----------|---------|
| Animasi | `framer-motion` | `animejs` + `gsap` | 3 animation libraries! Framer untuk component animation, GSAP untuk landing. Animejs mungkin redundant. |
| Animation | `framer-motion` | `gsap` | Keduanya jelas dipakai, OK |

### Override yang Ada

```json
"overrides": {
  "camera-controls": "^2.9.0"
}
```

Override ini terkait dengan `three.js` / `@react-three/drei`. Jika three.js dihapus, override ini juga bisa dihapus.

---

## SCRIPTS YANG PERLU DICEK

| Script | File | Status |
|--------|------|--------|
| `scripts/generate-sitemap.js` | Perlu cek apakah file ada | Jika tidak ada → script error |
| `scripts/ternakos_harga_scraper.py` | Python external | Aman |
| `scripts/arboge_scraper.py` | Python external | Aman |

---

## BUNDLE SIZE ESTIMATION (Rough)

| Area | Estimasi |
|------|----------|
| React + Router + Query | ~400KB |
| Supabase JS | ~300KB |
| Three.js + Spline + drei | ~6MB+ |
| Framer Motion | ~600KB |
| GSAP | ~500KB |
| Recharts | ~400KB |
| react-pdf | ~2MB |
| Lucide React (semua icons) | ~500KB (bisa dikurangi dengan tree-shaking) |
| **Total estimasi (uncompressed)** | **~11MB+** |

> Catatan: Vite + tree-shaking akan mengurangi bundle size secara signifikan. Angka di atas adalah worst-case.
