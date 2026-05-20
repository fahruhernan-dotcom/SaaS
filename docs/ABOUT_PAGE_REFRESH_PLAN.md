# About Page Refresh Plan — TernakOS "Tentang Kami"

**Status:** 🟡 PLANNING
**File to edit:** `src/pages/AboutUs.jsx`
**Planning date:** 2026-05-20
**Impl date:** TBD — requires explicit user approval before any code edits

---

## 1. Status

🟡 PLANNING — No code has been edited. This document is for review and approval only.

---

## 2. Current Page Audit

| Section | Current Content | Problem | Recommended Update |
|---------|----------------|---------|-------------------|
| Hero badge | "🌱 Platform Peternakan #1 di Jawa" | Unverifiable superlative claim. "Peternakan" too narrow — product covers brokers, RPA, sembako distributor. | Replace with verifiable positioning: "Platform Manajemen Agribisnis Indonesia" or "Dibangun oleh peternak, untuk seluruh rantai pasok." **LOCKED section — cannot change JSX structure, only ShinyText `text` prop.** |
| Hero H1 | "Kami tahu bisnis peternakan — karena kami bagian dari industri ini." | Good, resonant — keep as-is. | No change needed. **LOCKED.** |
| Stats bar — item 4 | `value: '3'`, label: `'Vertikal Bisnis'` | Hardcoded `'3'` is wrong. Active sub-verticals: Broiler, Domba/Kambing/Sapi Penggemukan (3), Domba/Kambing/Sapi Breeding (3+), Broker Ayam, Broker Telur, Distributor Sembako, RPA = 10+ active, 13+ total including coming-soon. | Change to `'10+'` label `'Model Bisnis Aktif'` or surface count from `BUSINESS_MODELS` constant. Static `'10+'` is safe and accurate without being exaggerated. |
| Untuk Siapa — 3 cards | Broker Ayam · Peternak (generic) · RPA & Distributor | Misses Broker Telur entirely. "Peternak" collapses Broiler/Layer/Domba/Kambing/Sapi into one card. "RPA & Distributor" bundles two very different roles. Sembako Distributor has its own full dashboard but is not named. | Expand to 5 cards: Peternak Unggas, Peternak Ruminansia (Domba/Kambing/Sapi), Broker Ayam & Telur, Distributor Sembako, RPA Ayam. |
| Roadmap Q2 | status: `'ongoing'`, title: `'Peternak Dashboard'` | Peternak is fully launched and instrumented (Phase 6.1, 6.B, 6.F complete). "ongoing" badge is factually wrong and undermines credibility. | Change status to `'selesai'`. Update desc to reflect what was delivered. |
| Roadmap Q3 | status: `'planned'`, title: `'RPA Dashboard'` | RPA is fully operational (Phase 6.3 + 6.D complete). "planned" is factually wrong. | Change status to `'selesai'`. Update desc accordingly. |
| Roadmap Q4 | status: `'planned'`, title: `'TernakBot AI'` | TernakBot in active development (AI hooks present in codebase). "planned" is still appropriate. | Adjust desc to be more concrete about what TernakBot will do vs. what's already in the product. |
| Missing section | — | No "Yang Sudah Bisa Dipakai" section. A user landing here has no clear picture of actual product scope. | Add a new "Sudah Live" section listing all active verticals with their key features. Position before or after "Untuk Siapa". |
| Kejujuran callout | "Kami masih early-stage" | Still accurate in spirit, but "early-stage" may conflict with 10+ verticals being live. Needs nuance. | Update to "Kami bootstrap & independent — produk berkembang dari feedback nyata di lapangan, bukan asumsi investor." |
| CTA bottom | "Mulai Coba Sekarang" + "Lihat Fitur" | Missing WhatsApp / demo request option. Users who want to ask questions before registering have nowhere to go. | Add a third CTA: "Tanya via WhatsApp" linking to WA number from site config, or hardcode `+6281358925505`. |
| SEO title | "Tentang Kami - TernakOS \| Revolusi Digital Peternakan Indonesia" | "Peternakan" only. Misses distributor sembako, broker telur, domba, kambing, sapi. | Update to include broader keyword set. |
| SEO description | "Solusi terintegrasi untuk peternak mandiri, broker ayam, dan pengusaha RPA." | Missing: distributor sembako, broker telur, domba/kambing/sapi, breeding, software agribisnis. | Expand to cover full product scope. |

---

## 3. Updated Positioning

Three headline options for the Hero badge (only the ShinyText `text` prop):

| Option | Text | Why |
|--------|------|-----|
| **A (Recommended)** | `"Dibangun oleh peternak, untuk seluruh rantai pasok"` | Truthful, resonant with the Founder story, covers full scope without superlatives |
| B | `"Platform Agribisnis Indonesia — Peternak, Broker, RPA, Sembako"` | More SEO-explicit, comprehensive, but longer as a badge |
| C | `"Dari kandang ke pasar — satu platform, semua peran"` | Poetic, memorable, slightly vague on scope |

**Recommended: Option A.** It ties directly to the existing H1 ("karena kami bagian dari industri ini"), avoids "#1" superlatives, and covers the full chain without needing to list every sub-vertical.

---

## 4. Updated Page Structure

Proposed section order (changes from current in **bold**):

1. Hero — LOCKED, badge text only changes
2. Stats Bar — fix hardcoded "3 Vertikal Bisnis" → "10+ Model Bisnis Aktif"
3. **NEW: Sudah Live** — explicit list of active verticals (honest scope signal)
4. Untuk Siapa — expand from 3 cards to 5 cards
5. Asal Usul / Cerita — keep as-is (strong, authentic)
6. Founder — LOCKED
7. Visi & Misi — keep as-is
8. Nilai yang Kami Pegang — keep as-is
9. Kejujuran Callout — minor copy tweak only
10. Roadmap — fix statuses (Q2 & Q3 → selesai), update descs
11. CTA Bottom — add WhatsApp button

---

## 5. Copy Direction

### 5.1 Stats Bar — Item 4

```jsx
{
  value: '10+',
  label: 'Model Bisnis Aktif',
  isLive: false,
}
```

Rationale: Active models from `BUSINESS_MODELS` (non-comingSoon): poultry_broker, distributor_sembako, egg_broker, peternak (broiler), rumah_potong_rpa, peternak_domba_penggemukan, peternak_kambing_penggemukan, peternak_sapi_penggemukan, peternak_domba_breeding, peternak_kambing_breeding = 10 confirmed active. "10+" is verifiable and conservative.

---

### 5.2 NEW Section: "Sudah Live" (insert after Stats Bar, before "Untuk Siapa")

**Section label:** `SUDAH BISA DIPAKAI`
**H2:** `"Semua vertikal ini sudah live — hari ini."`
**Sub:** `"Tidak ada yang masih 'coming soon' di bagian ini."`

List of live verticals in a 2-col or 3-col grid:

| Kategori | Model | Badge color |
|----------|-------|-------------|
| Peternak Unggas | Broiler (Ayam Pedaging) | emerald |
| Peternak Ruminansia | Fattening Domba, Fattening Kambing, Fattening Sapi | emerald |
| Peternak Ruminansia | Breeding Domba, Breeding Kambing, Breeding Sapi | emerald |
| Broker | Broker Ayam | emerald |
| Broker | Broker Telur | violet |
| Broker | Distributor Sembako | orange |
| Rumah Potong | RPA Ayam | amber |

Each card: icon (from existing `/assets/icons/models/`), name, 1-line desc.

---

### 5.3 "Untuk Siapa" — 5 Cards

Replace the current 3-card array with 5 cards:

**Card 1: Peternak Unggas**
- Badge: `PETERNAK UNGGAS`
- Title: Peternak Ayam Broiler
- Pain: Pantau FCR, deplesi, dan siklus — catat panen per kg dari HP.
- Features: FCR & IP Score otomatis tiap input harian | Estimasi panen dari data pertumbuhan nyata | Breakdown biaya produksi per kg per siklus

**Card 2: Peternak Ruminansia**
- Badge: `PETERNAK RUMINANSIA`
- Title: Domba / Kambing / Sapi
- Pain: Kelola batch fattening atau program breeding — ADG, mortalitas, dan laba per ekor tersaji otomatis.
- Features: ADG & FCR per batch dengan alert abnormal | Tracking kesehatan & vaksinasi per ekor | Laporan batch lengkap: beli → panen → laba bersih

**Card 3: Broker Ayam & Telur**
- Badge: `BROKER`
- Title: Broker Ayam & Broker Telur
- Pain: Beli dari kandang, jual ke RPA — margin dan piutang terpantau real-time.
- Features: Piutang RPA dengan alert jatuh tempo otomatis | Margin per transaksi & susut pengiriman | Stok tray telur & POS penjualan

**Card 4: Distributor Sembako**
- Badge: `DISTRIBUTOR`
- Title: Distributor Sembako
- Pain: Distribusi ke puluhan toko — stok, invoice, piutang, dan gaji pegawai dalam satu layar.
- Features: Stok multi-produk dengan notifikasi habis | Invoice & piutang pelanggan dengan due date | Payroll pegawai & laporan pengiriman harian

**Card 5: RPA Ayam**
- Badge: `RUMAH POTONG`
- Title: RPA (Rumah Potong Ayam)
- Pain: Beli dari broker, potong, distribusi — hutang dan margin terpantau dari kedua sisi transaksi.
- Features: Hutang ke broker tercatat transparan (broker juga lihat) | Order management & tracking distribusi produk | Laporan margin per produk & customer

---

### 5.4 Roadmap — Updated Statuses

**Q2 2026 — Peternak Dashboard**
- status: `'selesai'`
- desc: `'Manajemen siklus budidaya, pencatatan harian, stok pakan, vaksinasi, tim & akses. Mendukung: Broiler, Domba/Kambing/Sapi Penggemukan & Breeding.'`

**Q3 2026 — RPA & Sembako Dashboard**
- status: `'selesai'`
- title: `'RPA & Sembako Dashboard'`
- desc: `'RPA Ayam: order, hutang, distribusi, laporan margin. Distributor Sembako: penjualan, stok, pengiriman, payroll, laporan.'`

**Q4 2026 — TernakBot AI**
- status: `'planned'` (keep)
- desc: `'Analisis profit otomatis, deteksi anomali budidaya, prediksi panen berbasis data historis, ringkasan laporan bisnis mingguan.'`

---

### 5.5 Kejujuran Callout — Minor Tweak

Replace item 2: `"Kami masih early-stage — tapi setiap fitur diuji langsung oleh peternak dan broker aktif"`

→ `"Produk berkembang dari feedback nyata di lapangan — setiap fitur diuji peternak dan broker aktif sebelum rilis"`

This removes "early-stage" (which contradicts 10+ live verticals) while keeping the "field-tested" signal intact.

---

### 5.6 CTA Bottom — Add WhatsApp Button

Add a third button after "Lihat Fitur":

```jsx
<a
  href="https://wa.me/6281358925505?text=Halo%2C%20saya%20ingin%20tahu%20lebih%20lanjut%20tentang%20TernakOS"
  target="_blank"
  rel="noopener noreferrer"
  className="px-8 py-4 border border-emerald-500/30 hover:border-emerald-500/60 text-emerald-400 font-bold rounded-xl transition-colors"
>
  Tanya via WhatsApp
</a>
```

Use `cfg.company_phone` from `useSiteConfig` if that hook is already imported (check file). If not, hardcode the number from LandingPage `+6281358925505`.

---

## 6. SEO Notes

### Title (current → proposed)
```
Current:  "Tentang Kami - TernakOS | Revolusi Digital Peternakan Indonesia"
Proposed: "Tentang Kami - TernakOS | Platform Agribisnis: Peternak, Broker, RPA & Sembako"
```

### Meta Description (current → proposed)
```
Current:  "Pelajari visi TernakOS dalam mendigitalisasi rantai pasok peternakan Indonesia.
           Solusi terintegrasi untuk peternak mandiri, broker ayam, dan pengusaha RPA."

Proposed: "TernakOS adalah platform manajemen agribisnis Indonesia — mendukung peternak broiler,
           domba, kambing & sapi, broker ayam, broker telur, distributor sembako, dan RPA.
           Dibangun oleh peternak, untuk seluruh rantai pasok."
```

### H1 (keep as-is — already strong)
"Kami tahu bisnis peternakan — karena kami bagian dari industri ini."

### H2 keyword targets
- "Sudah Live" section H2 → target: "software manajemen peternakan" / "platform agribisnis"
- "Untuk Siapa" H2 → target: "peternak broiler" / "broker ayam" / "distributor sembako" / "RPA ayam"
- Roadmap H2 → keep as-is

### Structured data
No changes needed — `LandingPage.jsx` already has the comprehensive Organization schema. AboutUs does not need its own Organization schema block.

---

## 7. Implementation Notes

### Files to edit

| File | Change | Risk |
|------|--------|------|
| `src/pages/AboutUs.jsx` | All changes described above | Low — UI-only, no data/auth/RLS changes |

### Sections NOT to touch (LOCKED comments in source)
- Lines 56–161: `SECTION HERO — LOCKED: DO NOT MODIFY` — only `ShinyText text` prop may change
- Lines 366–456: `SECTION FOUNDER — LOCKED: DO NOT MODIFY` — no changes at all

### Recommended implementation order
1. Stats bar `value: '3'` → `'10+'`, `label` → `'Model Bisnis Aktif'`
2. Roadmap statuses Q2 + Q3 → `selesai`, update descs, add Sembako to Q3 title
3. Kejujuran callout — item 2 copy tweak
4. SEO title + description
5. "Untuk Siapa" — expand to 5 cards (biggest change, do last when easier sections are done)
6. NEW "Sudah Live" section — insert after stats bar
7. CTA — add WhatsApp button
8. Hero badge text — smallest change, do last to confirm it's still correct after other sections land

### useSiteConfig hook
`LandingPage.jsx` already imports `useSiteConfig`. `AboutUs.jsx` does not currently. If adding WA button using `cfg.company_phone`, import `useSiteConfig` the same way. If keeping it simple, hardcode the number — phone numbers are not secrets.

---

## 8. Out of Scope

- No changes to Supabase schema, RLS, Edge Functions, or RPCs
- No changes to logger utilities or `actionName` values
- No billing or subscription implementation
- No new routes or page structure outside `AboutUs.jsx`
- No changes to the Hero section JSX structure (LOCKED)
- No changes to the Founder section (LOCKED)
- No broad landing page redesign
- No claims that cannot be substantiated from current codebase state
- No changes to `src/sections/` files
- No CI/CD or build config changes

---

## 9. Final Report Template

When implementation is approved and complete, fill this in:

```
## About Page Refresh — Completion Report

**Date completed:** ___
**Commit:** ___

### Changes made
- [ ] Stats bar: "3 Vertikal Bisnis" → "10+ Model Bisnis Aktif"
- [ ] Roadmap Q2: status selesai + updated desc
- [ ] Roadmap Q3: status selesai + title includes Sembako + updated desc
- [ ] Kejujuran callout: "early-stage" copy replaced
- [ ] SEO title updated
- [ ] SEO description updated
- [ ] "Untuk Siapa": 3 cards → 5 cards (Peternak Unggas, Ruminansia, Broker, Sembako, RPA)
- [ ] NEW "Sudah Live" section added
- [ ] CTA: WhatsApp button added
- [ ] Hero badge text updated (ShinyText prop only, LOCKED structure preserved)

### Sections NOT changed (LOCKED)
- Hero section JSX structure — unchanged
- Founder section — unchanged

### Verified
- [ ] npm run build passes
- [ ] npx eslint src/pages/AboutUs.jsx → 0 errors
- [ ] Visual review: mobile (375px) + desktop (1280px)
- [ ] No new unverifiable claims introduced
```
