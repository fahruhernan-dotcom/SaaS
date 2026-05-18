# AUDIT_INVENTORY.md — TernakOS File Inventory

> Dibuat: 2026-05-16 | Total file src/: ~545+ JSX/JS files
> Scope: seluruh direktori `src/`, `public/`, dan config root

---

## 1. PAGES / ROUTES

### `src/pages/` — 23 file halaman publik + auth

| File | Ukuran | Keterangan |
|------|--------|------------|
| `LandingPage.jsx` | 3.6 KB | Halaman utama (shell, load sections) |
| `Login.jsx` | 38 KB | Form login + OTP/magic link |
| `Register.jsx` | 19 KB | Form registrasi |
| `MobileRegister.jsx` | 15 KB | Versi mobile register |
| `ForgotPassword.jsx` | 10 KB | Reset request |
| `ResetPassword.jsx` | 15 KB | Form reset password |
| `CheckEmail.jsx` | 6 KB | Halaman tunggu konfirmasi email |
| `WelcomeOnboard.jsx` | 7.6 KB | Welcome setelah register |
| `AuthCallback.jsx` | 5.9 KB | Supabase auth callback handler |
| `AcceptInvite.jsx` | 28 KB | Terima undangan tim |
| `Invite.jsx` | 7.9 KB | Kirim undangan (halaman tim) |
| `NotFound.jsx` | 5.1 KB | 404 fallback |
| `AboutUs.jsx` | 39 KB | Halaman tentang kami |
| `FAQPage.jsx` | 25 KB | FAQ umum |
| `FiturPage.jsx` | **34 bytes** | **Hanya re-export fitur/index.jsx** |
| `BlogPage.jsx` | 9.5 KB | Daftar artikel blog |
| `BlogPostPage.jsx` | 10 KB | Detail artikel blog |
| `HubungiKami.jsx` | 12 KB | Halaman kontak |
| `HargaPasarPublic.jsx` | 65 KB | Harga pasar publik (SSG) |
| `MarketPublic.jsx` | 17 KB | Marketplace publik |
| `PrivacyPage.jsx` | 53 KB | Kebijakan privasi |
| `TermsPage.jsx` | 28 KB | Syarat & ketentuan |
| `SecurityPage.jsx` | 14 KB | Halaman keamanan |

### `src/pages/fitur/` — Showcase fitur per vertical

| File | Keterangan |
|------|------------|
| `index.jsx` | Halaman utama fitur (ditarget oleh FiturPage.jsx) |
| `components/FadeUp.jsx` | Animasi scroll |
| `components/GroupCard.jsx` | Kartu grup fitur |
| `components/FAQItem.jsx` | Item FAQ per fitur |
| `data/index.js` | Barrel export data fitur |
| `data/constants.js` | Konstanta fitur |
| `data/broker_ayam.js` | Data fitur broker ayam |
| `data/broker_telur.js` | Data fitur broker telur |
| `data/broker_sembako.js` | Data fitur broker sembako |
| `data/peternak_ayam.js` | Data fitur peternak ayam |
| `data/peternak_sapi.js` | Data fitur peternak sapi |
| `data/peternak_kambing_domba.js` | Data fitur peternak ruminansia |
| `data/rpa.js` | Data fitur RPA |

### `src/pages/harga/` — Halaman pricing

| File | Keterangan |
|------|------------|
| `index.jsx` | Halaman harga/pricing |
| `components/PricingCards.jsx` | Kartu paket harga |
| `components/CompareTable.jsx` | Tabel perbandingan paket |
| `data/pricingData.js` | Data harga per paket |

---

## 2. SECTIONS (Landing Page)

### `src/sections/` — 14 section landing page

| File | Keterangan |
|------|------------|
| `Hero.jsx` | Hero section landing page |
| `Features.jsx` | Fitur utama |
| `StatsBar.jsx` | Statistik (CountUp) |
| `MarketPrice.jsx` | Preview harga pasar |
| `Pricing.jsx` | Preview pricing |
| `PainPoints.jsx` | Pain points |
| `BeforeAfter.jsx` | Before/after |
| `HowItWorks.jsx` | Cara kerja |
| `Comparison.jsx` | Tabel perbandingan |
| `ComparisonTable.jsx` | Alternatif comparison table |
| `Testimonials.jsx` | Testimonial lama |
| `TestimonialsNew.jsx` | Testimonial baru |
| `PeopleAlsoAsk.jsx` | FAQ landing |
| `FinalCTA.jsx` | CTA akhir |

> ⚠️ Ada 2 versi testimonial: `Testimonials.jsx` dan `TestimonialsNew.jsx` — perlu cek mana yang aktif di `LandingPage.jsx`.

---

## 3. COMPONENTS

### `src/components/` — Root components (12 file)

| File | Keterangan |
|------|------------|
| `Navbar.jsx` | Navbar publik |
| `Footer.jsx` | Footer publik |
| `ErrorBoundary.jsx` | React error boundary |
| `GlobalRouteError.jsx` | Route error fallback |
| `LoadingScreen.jsx` | Loading overlay |
| `SEO.jsx` | Helmet/meta tags |
| `InstallAppPrompt.jsx` | PWA install prompt |
| `StickyCTA.jsx` | Sticky CTA landing |
| `AnimatedPrice.jsx` | Animasi harga |
| `CountUp.jsx` | **CountUp versi lama** (tidak dipakai — lihat `reactbits/CountUp`) |
| `SplineScene.jsx` | Spline 3D scene |
| `EmptyState.jsx` | Empty state (public, bukan dashboard) |

### `src/components/invoice/` — Invoice templates

| File | Keterangan |
|------|------------|
| `InvoicePreviewModal.jsx` | Modal preview invoice |
| `templates/DeliveryReceipt.jsx` | Template surat jalan |
| `templates/PaymentReceipt.jsx` | Template kwitansi |
| `templates/PeternakInvoice.jsx` | Invoice peternak |
| `templates/PurchaseInvoice.jsx` | Invoice pembelian |
| `templates/RPATokoInvoice.jsx` | Invoice RPA ke toko |
| `templates/SaleInvoice.jsx` | Invoice penjualan |
| `templates/SembakoInvoice.jsx` | Invoice sembako |

### `src/components/reactbits/` — UI primitives (animasi)

| File | Keterangan |
|------|------------|
| `CountUp.jsx` | **CountUp aktif** — diimport di 3 file |
| `AnimatedContent.jsx` | Animated content wrapper |
| `AuroraBackground.jsx` | Aurora background effect |
| `BlurText.jsx` | Blur text animation |
| `ClickSpark.jsx` | Click spark effect |
| `InfiniteScroll.jsx` | Infinite scroll UI |
| `Magnet.jsx` | Magnet hover effect |
| `Particles.jsx` | Particle background |
| `ScrollVelocity.jsx` | Scroll velocity text |
| `ShinyText.jsx` | Shiny text effect |
| `ShinyText.css` | Style untuk ShinyText |
| `SplashCursor.jsx` | Splash cursor |
| `TiltedCard.jsx` | Tilted card effect |

### `src/components/ui/` — Shadcn UI components (45 file)

Komponen Shadcn + custom UI, semua KEEP. Komponen penting:

| File | Keterangan |
|------|------------|
| `BrokerPageSkeleton.jsx` | Skeleton loading khusus broker |
| `DatePicker.jsx` | Date picker mobile-first |
| `DateRangePicker.jsx` | Range date picker |
| `InputNumber.jsx` | Input angka custom |
| `InputRupiah.jsx` | Input rupiah dengan format |
| `MagicRings.jsx` | Animasi loading rings |
| `MobileWheelDatePicker.jsx` | Date picker wheel mobile |
| `MobileWheelSelect.jsx` | Select wheel mobile |
| `PhoneInput.jsx` | Input telepon |
| `ThemePicker.jsx` | Picker tema warna |
| `TimePicker.jsx` | Time picker |
| `TransaksiSuccessCard.jsx` | Card sukses transaksi |
| `shader-background.tsx` | Shader background (TSX) |
| `shader-background-demo.tsx` | Demo shader (TSX) |
| + 31 komponen Shadcn standar | button, input, dialog, dll |

---

## 4. DASHBOARD

### `src/dashboard/admin/` — 7 file admin (superadmin only)

| File | Keterangan |
|------|------------|
| `AdminLayout.jsx` | Layout admin |
| `AdminBeranda.jsx` | Dashboard admin |
| `AdminUsers.jsx` | Manajemen user |
| `AdminSubscriptions.jsx` | Manajemen langganan |
| `AdminPricing.jsx` | Konfigurasi harga |
| `AdminActivity.jsx` | Log aktivitas |
| `AdminSettings.jsx` | Pengaturan global |

### `src/dashboard/broker/` — Struktur broker

**poultry_broker/** (13 file):
`Beranda.jsx`, `Transaksi.jsx`, `Kandang.jsx`, `Pengiriman.jsx`, `RPA.jsx`, `RPADetail.jsx`, `CashFlow.jsx`, `Armada.jsx`, `Simulator.jsx`, `SopirDashboard.jsx`, `TimManajemenPage.jsx`, `Akun.jsx`, `BrokerAyamTutorial.jsx`, `brokerAyamTutorialSteps.js`
+ `components/`: `EditPurchaseSheet.jsx`, `ProvinceWarningBanner.jsx`, `SaleAuditSheet.jsx`, `UnifiedTransactionCard.jsx`, `UpdateDeliverySheet.jsx`

**egg_broker/** (9 file):
`Beranda.jsx`, `Transaksi.jsx`, `POS.jsx`, `Inventori.jsx`, `Suppliers.jsx`, `Customers.jsx`, `TimManajemenPage.jsx`, `BrokerTelurTutorial.jsx`, `brokerTelurTutorialSteps.js`

**sembako_broker/** — semua dihandle oleh BrokerRouter → SembakoBroker pages

**ai/** (3 file):
`AIConfirmCard.jsx` *(1-baris re-export dari `_shared/components/AIConfirmCard.jsx`)*, `AIChatBubble.jsx` *(diimport oleh BrokerLayout.jsx)*, `AISuccessCard.jsx`

**_shared/** — Router + shared components broker

### `src/dashboard/peternak/` — Struktur peternak

Per tipe hewan (setiap tipe punya `beranda`, `ternak`, `kesehatan`, dll):
- `broiler/` — Peternak Broiler
- `layer/` — Layer (Coming Soon)
- `domba/fattening/` — Domba Fattening (full set)
- `domba/breeding/` — Domba Breeding
- `kambing/fattening/` — Kambing Fattening
- `kambing/breeding/` — Kambing Breeding
- `kambing/kambing_perah/` — Kambing Perah
- `sapi/fattening/` — Sapi Fattening
- `sapi/breeding/` — Sapi Breeding

**ai/** (2 file):
`AIChatBubble.jsx` *(tidak ditemukan import langsung — REVIEW)*, lainnya

**_shared/** — `PeternakRouter.jsx`, shared components peternak

### `src/dashboard/rumah_potong/` — RPA & RPH

- `rpa/` — Beranda, Order, Hutang, Distribusi, Laporan, Akun
- `rph/` — Beranda (placeholder)
- `RPPageRouter.jsx` — Router utama RPA/RPH

### `src/dashboard/_shared/` — Shared semua vertical

**layouts/** (4 file):
- `BrokerLayout.jsx` — Layout shell broker
- `PeternakLayout.jsx` — Layout shell peternak
- `RumahPotongLayout.jsx` — Layout shell RPA/RPH
- `DesktopSidebarLayout.jsx` — Layout desktop sidebar

**components/** (30+ file):
`AppSidebar.jsx` *(~900 baris)*, `BottomNav.jsx`, `DrawerLainnya.jsx`, `TopBar.jsx`, `DesktopTopBar.jsx`, `NotificationBell.jsx`, `BusinessModelOverlay.jsx`, `TutorialOverlay.jsx`, `WelcomeOnlyOverlay.jsx`, `SmartInsight.jsx`, `AIConfirmCard.jsx` *(860 baris, primary)*, `AIUpgradeWall.jsx`, `AISuccessCard.jsx`, `FormBeliModal.jsx`, `FormJualModal.jsx`, `TransaksiWizard.jsx`, `KPICard.jsx`, `StatCard.jsx`, `EmptyState.jsx`, `LoadingSpinner.jsx`, `ComingSoon.jsx`, `ConfirmDialog.jsx`, `SlideModal.jsx`, `PlanExpiryBanner.jsx`, `BusinessNameWarningBanner.jsx`
+ `forms/FormBayarModal.jsx` *(diimport oleh Transaksi.jsx dan SaleAuditSheet.jsx)*

**pages/** (20+ file):
`Beranda.jsx`, `Kandang.jsx`, `Transaksi.jsx`, `Pengiriman.jsx`, `RPA.jsx`, `RPADetail.jsx`, `CashFlow.jsx`, `Market.jsx`, `HargaPasar.jsx`, `MarketPriceDashboard.jsx`, `OnboardingFlow.jsx`, `UpgradePlan.jsx`, `AddonPortal.jsx`, `Akun.jsx`, `PeternakDashboard.jsx`, `RPADashboard.jsx`, `LossReport.jsx`, `Simulator.jsx`, `StokVirtual.jsx`, `Forecast.jsx`
+ `tim/` — Tim management pages

**forms/** (3 file — berbeda dari `components/`):
`FormBeliModal.jsx` *(tidak diimport di mana pun)*, `FormJualModal.jsx` *(tidak diimport di mana pun)*, `FormBayarModal.jsx` *(diimport oleh RPA.jsx)*

---

## 5. HOOKS

### `src/lib/hooks/` — 60+ custom hooks

**Auth & Session:**
`useAuth.jsx`, `useMediaQuery.js`, `useNotifications.jsx`

**Data fetching — Broker:**
`useBrokerConnections.js`, `useBrokerKaryawanData.js`, `useSales.js`, `usePurchases.js`, `useDeliveries.js`, `useUpdateDelivery.js`, `useLossReports.js`, `useRPA.js`, `useRPAData.js`

**Data fetching — Sembako:**
`useSembakoData.js`

**Data fetching — Peternak:**
`usePeternakData.js`, `usePeternakPermissions.js`, `usePeternakTaskData.js`, `useChickenBatches.js`, `useFarms.js`

**Data fetching — Ruminansia:**
`createBreedingHooks.js`, `createPenggemukanHooks.js`, `createDairyHooks.js`
`useDombaBreedingData.js`, `useDombaPenggemukanData.js`
`useKambingBreedingData.js`, `useKambingPenggemukanData.js`, `useKambingPerahData.js`
`useSapiBreedingData.js`, `useSapiPenggemukanData.js`
`useKdBreedingData.js`, `useKdBreedingData.js` *(legacy combined)*

**Data fetching — Egg Broker:**
`useEggCustomers.js`, `useEggInventory.js`, `useEggSales.js`, `useEggSuppliers.js`

**Market & Finance:**
`useCashFlow.js`, `useForecast.js`, `useMarket.js`, `useMarketTrends.js`

**Quota & Permissions:**
`useAIQuota.js`, `useTransactionQuota.js`, `useSembakoTransactionQuota.js`, `useRPATransactionQuota.js`, `useTernakLimit.js`

**AI:**
`useAIAssistant.jsx`

**Dashboard & Platform:**
`useDashboardStats.js`, `usePlatformStats.js`, `useBusinessSnapshot.js`

**Admin:**
`useAdminData.js`

**Util Hooks:**
`useAntiSpam.jsx`, `useDelayedData.js`, `usePageTitle.js`, `useSiteConfig.js`, `useTheme.js`

**Invoice:**
`useInvoice.js` *(in `src/lib/invoice/`)*

### `src/hooks/` — 1 file

| File | Import Reference |
|------|-----------------|
| `use-mobile.jsx` | Dipakai oleh `DatePicker.jsx`, `WorkerSheet.jsx`, `sidebar.jsx` — **KEEP** |

---

## 6. UTILS / LIB

### `src/utils/` — 1 file

| File | Import Reference |
|------|-----------------|
| `animations.js` | **Tidak ditemukan import di mana pun** — kandidat review |

### `src/lib/` — Core utilities

| File | Keterangan |
|------|------------|
| `businessModel.js` | **Master config** (741 baris) — BUSINESS_MODELS, nav, resolveBusinessVertical |
| `supabase.js` | Supabase client config |
| `supabaseErrorHandler.js` | Error handler Supabase |
| `format.js` | Formatter: formatIDR, formatWeight, safeNum, dll |
| `utils.js` | General utilities |
| `animation.js` | Animation helpers (dipakai 6 file sections) |
| `tokens.js` | Design tokens |
| `queryClient.js` | React Query config |
| `quotaUtils.js` | Kalkulasi quota |
| `subscriptionUtils.js` | Helper subscription |
| `faqData.js` | Data FAQ (dipakai FAQPage.jsx) |
| `aiPrompt.js` | Template prompt AI |
| `aiValidation.js` | Validasi AI response |
| `aiTransactionInserter.js` | AI: insert transaksi |

### `src/lib/auth/` — RBAC system (6 file)

| File | Keterangan |
|------|------------|
| `constants.js` | APP_ROLES, BUSINESS_ROLES, USER_TYPES |
| `app-roles.js` | isSuperadmin(), isUser() |
| `business-roles.js` | isOwner(), isManager(), isStaff(), isViewOnly() |
| `capabilities.js` | canManageSales(), canViewFinance(), dll (10+ fungsi) |
| `guards.jsx` | RequireSuperadmin, RequireOwner, RequireCapability |
| `index.js` | Barrel export auth module |
| `README.md` | Dokumentasi arsitektur RBAC |

### `src/lib/constants/` — Config & templates

| File | Keterangan |
|------|------------|
| `subroles.js` | **644 baris** — feature matrix per sub-role |
| `planGating.js` | RPA_PLAN_CONFIG, quota per tier |
| `contact.js` | Kontak info |
| `regions.js` | Data wilayah/provinsi |
| `sapiTaskTemplates.js` | Template tugas sapi (standalone) |
| `taskTemplates/index.js` | Barrel export task templates |
| `taskTemplates/broilerTaskTemplates.js` | Template broiler |
| `taskTemplates/dombaTaskTemplates.js` | Template domba |
| `taskTemplates/kambingTaskTemplates.js` | Template kambing |
| `taskTemplates/sapiPerahTaskTemplates.js` | Template sapi perah |

### `src/lib/faq/` — FAQ per vertical (7 file)

`broker_ayam.js`, `broker_telur.js`, `peternak_ayam.js`, `peternak_ruminansia.js`, `sembako.js`, `teknis.js`, `umum.js`

### `src/lib/invoice/` — Invoice utilities

`invoiceUtils.js`, `useInvoice.js`

---

## 7. DATA / CONFIG

| Path | Keterangan |
|------|------------|
| `src/data/blogPosts.js` | Data artikel blog |
| `src/lib/businessModel.js` | Master nav/vertical config |
| `src/lib/constants/subroles.js` | Feature matrix per role |
| `src/lib/constants/planGating.js` | Plan gating config |
| `src/pages/fitur/data/` | Data showcase fitur per vertical |
| `src/pages/harga/data/pricingData.js` | Data harga paket |

> ⚠️ `src/constants/` dan `src/config/` adalah direktori **kosong** — tidak ada file di dalamnya.

---

## 8. SUPABASE-RELATED FILES

| File | Keterangan |
|------|------------|
| `src/lib/supabase.js` | Client init (VITE_SUPABASE_URL + ANON_KEY) |
| `src/lib/supabaseErrorHandler.js` | Global error handler |
| `src/pages/AuthCallback.jsx` | Callback handler email confirm/reset |
| `src/lib/hooks/useAuth.jsx` | Auth + tenant + profile resolver |
| `src/lib/auth/app-roles.js` | isSuperadmin (dual-mode check) |
| `src/lib/auth/guards.jsx` | RequireSuperadmin, RequireCapability |
| Semua `use*.js` hooks | Query ke Supabase via @tanstack/react-query |

---

## 9. ASSETS

### `src/assets/` — 4 file

| File | Import Reference |
|------|-----------------|
| `react.svg` | **Tidak ditemukan import** — kandidat review |
| `vite.svg` | **Tidak ditemukan import** — kandidat review |
| `hero.png` | **Tidak ditemukan import** — kandidat review |
| `sheep_sticker.png` | Dipakai di `KandangViewLayout.jsx` — **KEEP** |

### `public/` — 48 file

**Root:** `favicon.svg`, `logo.png`, `logo-t.svg`, `icons.svg`, `og-image.jpg`, `robots.txt`, `sitemap.xml`, `manifest.webmanifest`, `offline.html`

**Blog images:** `blog-*.jpg`, `blog-*.png` (beberapa file)

**Guide:** `famacha_guide_v2.png` (panduan kesehatan domba — versi v2 aktif)

**UI screenshots:** `ui-*.png` (beberapa file)

**`public/assets/icons/models/`** (21 icon PNG):
`broker_ayam.png`, `broker_telur.png`, `distributor_sembako.png`, `peternak_broiler.png`, `peternak_layer.png`, `fattening_domba.png`, `breeding_domba.png`, `fattening_kambing.png`, `breeding_kambing.png`, `kambing_perah.png`, `fattening_sapi.png`, `breeding_sapi.png`, `sapi_perah.png`, `bebek_pedaging.png`, `bebek_petelur.png`, `babi_fattening.png`, `babi_breeding.png`, `distributor_daging.png`, dll

**`public/icons/`** (3 file): PWA icons (192, 512, maskable)
**`public/screenshots/`** (2 file): `desktop.jpg`, `mobile.jpg`

---

## RINGKASAN INVENTORI

| Kategori | Jumlah |
|----------|--------|
| Pages (src/pages/) | 23 file + 2 subdirektori |
| Landing sections (src/sections/) | 14 file |
| Components (root) | 12 file |
| Invoice templates | 7 file |
| ReactBits UI | 13 file |
| Shadcn UI (src/components/ui/) | 45+ file |
| Dashboard admin | 7 file |
| Dashboard broker (poultry + egg + sembako + ai + shared) | ~40 file |
| Dashboard peternak (9 tipe × set pages) | ~80+ file |
| Dashboard RPA/RPH | ~10 file |
| Dashboard _shared (layouts + components + pages + forms) | ~60+ file |
| Hooks (src/lib/hooks/) | 60+ file |
| Hooks (src/hooks/) | 1 file |
| Auth modules (src/lib/auth/) | 6 file + 1 README |
| Lib utilities | ~15 file |
| Constants/config | 10 file |
| FAQ data | 7 file |
| Landing data (fitur/ + harga/) | 11 file |
| Supabase client | 2 file |
| Assets (src/assets/) | 4 file |
| Public assets | 48 file |
| **TOTAL (estimasi)** | **~545+ file** |
