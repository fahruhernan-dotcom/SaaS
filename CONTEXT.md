# TernakOS — Developer Context

> Last updated: 2026-03-24 (Multi-Tenant & Egg Broker Vertical) | Use this as reference for all future implementations.

---

## 1. Project Stack

| Category | Technology | Version |
|----------|-----------|---------|
| Framework | React + Vite | React 19.2, Vite 8.0 |
| Styling | Tailwind CSS + Shadcn UI | Tailwind v3.4 (NOT v4) |
| Auth & DB | Supabase (PostgreSQL) | @supabase/supabase-js v2.99 |
| State | React Query | @tanstack/react-query v5.90 |
| Forms | React Hook Form + Zod | RHF v7.71, Zod v4.3 |
| Routing | React Router | react-router-dom v7.13 |
| Charts | Recharts | v2.15 |
| Animations | Framer Motion | v12.36 |
| Date | date-fns + react-day-picker | date-fns v4.1, rdp v9.14 |
| Notifications | Sonner | v2.0 |
| 3D/Canvas | @react-three/fiber + drei | fiber v8.17, drei v10.7 |
| Icons | Lucide React | v0.577 |
| UI Primitives | Radix UI | Multiple packages (dialog, dropdown, popover, tabs, etc.) |

---

## 2. Design System & Tokens

### Color Palette (Dark-Only Theme)

| Token | Hex | Usage |
|-------|-----|-------|
| `bgBase` / `bg-base` | `#06090F` | Page background |
| `bg1` / `bg-1` | `#0C1319` | Card/modal background |
| `bg2` / `bg-2` | `#111C24` | Input/secondary card background |
| `bg3` / `bg-3` | `#162230` | Elevated surfaces |
| `emerald` (primary) | `#10B981` | CTA buttons, accents, active states |
| `emBright` | `#34D399` | Hover, active text |
| `emGlow` | `rgba(16,185,129,0.12)` | Glow backgrounds |
| `gold` | `#F59E0B` | Warning, trial badges |
| `red` | `#F87171` | Danger, destructive |
| `text1` | `#F1F5F9` | Primary text |
| `text2` | `#94A3B8` | Secondary text |
| `text3` / muted | `#4B6478` | Muted text, labels |
| `borderSub` | `rgba(255,255,255,0.05)` | Subtle borders |
| `borderDef` | `rgba(255,255,255,0.08)` | Default borders |
| `borderAcc` | `rgba(16,185,129,0.35)` | Accent borders |

### Role Colors
| Role | Color | Hex |
|------|-------|-----|
| Broker | Emerald | `#10B981` |
| Peternak | Purple | `#7C3AED` |
| RPA | Amber | `#F59E0B` |

### Typography
- **Font Display**: `Sora` — headings, labels, numbers, `font-display` class
- **Font Body**: `DM Sans` — body text, paragraphs, `font-body` class
- Both loaded from Google Fonts in `index.css`
- CSS: `h1-h6` elements auto-use Sora, `body` uses DM Sans

### Component Style Conventions
- **Cards**: `rounded-2xl` or `rounded-3xl`, `border-white/5`
- **Inputs**: `bg-[#111C24] border-white/10 h-12 rounded-xl`
- **Buttons (CTA)**: `bg-emerald-500` with `shadow-[0_8px_24px_rgba(16,185,129,0.25)]`
- **Labels**: `text-[11px] font-black uppercase tracking-widest text-[#4B6478]` (font Sora)
- **Modals/Sheets**: `bg-bg-1` (#0C1319), `border-white/8`, `rounded-[24px]` top

### CSS Variables (HSL, defined in `index.css`)
```
--background: 220 14% 4%      --primary: 160 84% 39%
--foreground: 210 40% 96%     --secondary: 215 19% 11%
--card: 215 22% 8%            --muted-foreground: 215 16% 40%
--destructive: 0 72% 70%     --border: 215 20% 13%
--ring: 160 84% 39%           --radius: 0.75rem
--sidebar-background: 215 25% 6%
```

### Custom CSS (index.css)
- Scrollbar: 4px wide, emerald-tinted thumb
- Selection: emerald tint
- Number input spinners hidden
- Custom keyframes: `pulse-dot`, `float`, `shimmer-text`

---

## 3. Tailwind Configuration (`tailwind.config.js`)

- `darkMode: ["class"]`
- Custom colors: `bg-base`, `bg-1`, `bg-2`, `bg-3`, `emerald-50` thru `emerald-600`, `emerald-glow`, `gold-400/500`, `text-primary`, `text-secondary`, `text-muted`, `red`, `red-bg`
- Short aliases for landing: `em-400`, `em-500`, `em-600`, `tx-1`, `tx-2`, `tx-3`
- Sidebar HSL variables for Shadcn sidebar component
- Font families: `font-display` → Sora, `font-body` → DM Sans
- Border radius: `lg` = 0.75rem, `md`, `sm`
- Plugins: `tailwindcss-animate`

---

## 4. Database Schema (Schema v2)

> [!IMPORTANT]
> **Primary Source of Truth**: Selalu rujuk ke [DATABASE_STRUCTURE.md](file:///d:/Dokumen/02_Kerja_Profesional/Ternak%20OS/DATABASE_STRUCTURE.md) untuk struktur tabel, enum, dan dependency map yang paling update.

> **Rule**: Use `.select()` only columns that exist. **NEVER insert GENERATED columns.**

### `profiles`
- `id`, `tenant_id`, `auth_user_id`, `full_name`, `role` (`'owner'` | `'staff'` | `'superadmin'` | `'view_only'` | `'sopir'`)
- `user_type` (`'broker'` | `'peternak'` | `'rpa'` | `'superadmin'`)
- `onboarded` (boolean), `business_model_selected` (boolean)
- `is_active` (boolean) — ⚠️ Note: Project is moving to `is_deleted` for soft delete.
- **Multi-Tenant**: Satu `auth_user_id` bisa memiliki banyak `profiles` (satu profile per `tenant_id`).
- Queried via: `supabase.from('profiles').select('*, tenants(*)')` in `useAuth` which returns an array of all user businesses.

### Role Based Access Control (RBAC)

Pattern wajib di semua komponen:
```javascript
const { profile } = useAuth()
const isOwner = profile?.role === 'owner'
const isViewOnly = profile?.role === 'view_only'
const canWrite = ['owner', 'staff'].includes(profile?.role)
```

**Akses per role:**
- **owner**: Semua fitur.
- **staff**: Beranda, Transaksi, Kandang, Pengiriman, RPA, Harga Pasar.
  - ✗ Tidak bisa: Cash Flow, Armada, Tim & Akses, Simulator.
  - ✗ Tidak bisa: Hapus data, edit data sensitif.
- **view_only**: Beranda, Transaksi, Harga Pasar (semua read-only).
  - ✗ Tidak ada tombol tambah/edit/hapus.
  - ✓ Tampilkan banner "View Only" di setiap halaman.
- **sopir**: Hanya `/broker/sopir`.
  - ✓ Lihat & update status pengiriman yang di-assign.

**Route setelah login:**
- owner, staff, view_only (poultry_broker) → `/broker/beranda`
- owner, staff, view_only (egg_broker) → `/egg/beranda`
- sopir → `/broker/sopir`

**Guard component**: `RoleGuard` di `App.jsx`
```jsx
<RoleGuard allowedRoles={['owner']}>
  <CashFlow />
</RoleGuard>
```

### `tenants`
- `id`, `business_name`, `plan` (`'free'` | `'pro'` | `'enterprise'`), `is_trial`, `trial_ends_at`

### `farms`
- `id`, `tenant_id`, `farm_name`, `owner_name`, `phone`, `location`, `chicken_type`
- `status` (`'ready'` | `'empty'` | `'active'`)
- `available_stock`, `avg_weight_kg`, `harvest_date`, `capacity`, `quality_rating`, `quality_notes`, `notes`
- `is_deleted`, `created_at`
- Hook: `useFarms()` — queryKey `['farms', tenant.id]`

### `purchases`
- `id`, `tenant_id`, `farm_id`, `quantity`, `avg_weight_kg`, `total_weight_kg`
- `price_per_kg`, `total_cost`, `transport_cost`, `other_cost`
- **`total_modal`** ← GENERATED: `total_cost + transport_cost + other_cost` — **NEVER INSERT**
- `transaction_date`, `notes`, `is_deleted`
- ⚠️ `total_eggs` does NOT exist in v2. Never include in `.select()`.
- Hook: `usePurchases()` — queryKey `['purchases', tenant.id]`
- `.select()` joins: `farms(farm_name)`
- ⚠️ `is_deleted` filter: **ALWAYS APPLY**

### `sales`
- `id`, `tenant_id`, `rpa_id`, `purchase_id`, `quantity`, `avg_weight_kg`, `total_weight_kg`
- `price_per_kg`, `total_revenue`, `delivery_cost`
- **`net_revenue`** ← GENERATED: `total_revenue - delivery_cost` — **NEVER INSERT**
- `payment_status` (`'lunas'` | `'belum_lunas'` | `'sebagian'`), `paid_amount`
- **`remaining_amount`** ← GENERATED — **NEVER INSERT**
- `transaction_date`, `due_date`, `notes`, `is_deleted`
- Hook: `useSales()` — queryKey `['sales', tenant.id]`
- `.select()` joins: `rpa_clients(rpa_name)`, `purchases(total_cost, farm_id, farms(farm_name))`, `deliveries(status)`

### `rpa_clients`
- `id`, `tenant_id`, `rpa_name`, `buyer_type`, `phone`, `location`
- `payment_terms`, `total_outstanding`, `reliability_score`, `notes`
- `is_deleted`
- Hook: `useRPA()` — queryKey `['rpa-clients', tenant.id]`

### `rpa_agreements`
- `id`, `tenant_id`, `rpa_id`
- `buyer_type` (`'rpa'` | `'pasar'` | `'langsung'`)
- `payment_terms`, `target_price`, `notes`

### `deliveries`
- `id`, `tenant_id`, `sale_id`, `vehicle_id` (nullable), `driver_id` (nullable)
- `vehicle_type`, `vehicle_plate`, `driver_name`, `driver_phone`
- `initial_count`, `initial_weight_kg`, `final_count`, `final_weight_kg`
- `arrived_count`, `arrived_weight_kg`, `mortality_count`
- `load_time`, `departure_time`, `arrival_time`
- `delivery_cost`, `status` (`'on_route'` | `'arrived'` | `'completed'` | `'cancelled'`)
- `notes`, `is_deleted`, `created_at`
- Hook: `useDeliveries(statusFilter)` — queryKey `['deliveries', statusFilter]`
- `.select()` joins: `sales(total_revenue, net_revenue, total_weight, rpa_clients(rpa_name), purchases(farms(farm_name)))`

### `vehicles`
- `id`, `tenant_id`, `plate_number`, `vehicle_type`, `capacity_kg`
- `status` (`'aktif'` | `'tidak_aktif'`), `is_deleted`

### `drivers`
- `id`, `tenant_id`, `full_name`, `phone_number`, `sim_expires_at`, `wage_per_trip`
- `status` (`'aktif'` | `'tidak_aktif'`), `is_deleted`

### `cash_flows`
- `id`, `tenant_id`, `type` (`'in'` | `'out'`), `category`, `amount`, `description`
- `transaction_date`, `is_deleted`

### `loss_reports`
- `id`, `tenant_id`, `delivery_id`, `sale_id`
- `loss_type` (e.g. `'mortality'`), `chicken_count`, `weight_loss_kg`
- `price_per_kg`, `financial_loss`, `description`, `report_date`
- `is_deleted`
- Hook: `useLossReports()` — queryKey `['loss-reports']`
- `.select()` joins: `sales(rpa_clients(rpa_name))`, `deliveries(driver_name, vehicle_info)`

### `extra_expenses`
- `id`, `tenant_id`, `amount`, `expense_date`, `category`, `description`
- `is_deleted`

### `chicken_batches` (Peternak / Virtual Stock)
- `id`, `farm_id` (FK → `farms`), `chicken_type`, `age_days`, `avg_weight_kg`
- `current_count`, `estimated_harvest_date`
- `status` (`'growing'` | `'ready'` | `'booked'` | `'sold'`)
- `is_deleted`
- Hook: `useChickenBatches(statusFilter)` — queryKey `['chicken-batches', statusFilter]`
- `.select()` joins: `farms(farm_name, owner_name, phone, location)`

### `orders` (RPA → Broker Matching)
- `id`, `rpa_id` (FK → `rpa_clients`), `status` (`'open'` | `'matched'`)
- `requested_date`, `requested_count`
- `is_deleted`

### `market_prices`
- `id`, `price_date` (date), `chicken_type`, `region`
- `farm_gate_price`, `avg_buy_price`, `avg_sell_price`, `buyer_price`, `broker_margin` (generated)
- `transaction_count`, `source` (`'transaction'` | `'manual'` | `'import'`)
- Unique constraint on `(price_date, chicken_type, region)`
- Queried by `DesktopTopBar` and `HargaPasar` page

### `team_invitations`
- `id`, `tenant_id`, `invited_by`, `email` (nullable), `role`, `status` (`'pending'` | `'accepted'` | `'expired'`)
- `token` (6 karakter uppercase), `expires_at` (timestamptz), `created_at`
- ⚠️ **Note**: Kolom `is_deleted` TIDAK ADA di tabel ini. Jangan filter `is_deleted` di query.

### Sistem Undangan Tim (Kode 6 Digit)

**Flow owner generate kode (Tim.jsx):**
1. Generate kode 6 karakter random uppercase.
2. Insert `team_invitations`: `{ tenant_id, invited_by, token, role, status: 'pending', expires_at: +7 hari }`.
3. **JANGAN** insert email — kolom nullable.

**Flow staff/sopir join via kode (Register.jsx):**
1. Input kode 6 digit di mode "Punya Kode Undangan".
2. Query `team_invitations` WHERE `token = kode` AND `status = 'pending'`.
   - ✗ **JANGAN** filter `is_deleted` (kolom tidak ada).
   - ✗ **JANGAN** filter `expires_at` di query — cek manual setelah dapat data.
3. `signUp({ options: { data: { invite_token: kode } } })`.
4. Trigger `handle_new_user()` handle sisanya otomatis.

**Trigger handle_new_user() (PostgreSQL):**
- **Jika ada invite_token di metadata** → Join tenant existing.
  - `profiles`: `role='staff'`, `onboarded=true`, `business_model_selected=true`.
  - `team_invitations`: `status='accepted'`.
- **Jika tidak ada invite_token** → Buat tenant baru (owner flow).
  - `profiles`: `role='owner'`, `onboarded=false`, `business_model_selected=false`.

**RLS yang dibutuhkan:**
- `team_invitations`: anon + authenticated bisa SELECT.
- `tenants`: anon + authenticated bisa SELECT.

### `payments`
- `id`, `tenant_id`, `sale_id`, `amount`, `payment_date`, `payment_method`, `reference_no`
- ⚠️ **Note**: Kolom `is_deleted` TIDAK ADA di tabel ini. Jangan filter `is_deleted` di query. (Resolved 400 error in dashboard).
- Tracked in `RecycleBinSection` for permanent deletion.

---

## 5. App Entry Point & Providers (`main.jsx`)

```jsx
<StrictMode>
  <QueryClientProvider client={queryClient}>
    <App />
    <Toaster theme="dark" position="top-center" richColors duration={3000}
      toastOptions={{ style: { background: '#111C24', border: '1px solid rgba(255,255,255,0.10)', ... } }}
    />
  </QueryClientProvider>
</StrictMode>
```

- `queryClient` config: `staleTime: 120_000` (2 min), `retry: 1`
- Toast uses Sonner, dark theme with custom dark card styling

---

## 6. Routing Architecture (`App.jsx`)

### Global Utilities
- `ScrollToTop` — scrolls window to top on `pathname` change
- `ErrorBoundary` — wraps critical routes (e.g., `/broker/rpa/:id`)

### Authentication Guards
- `ProtectedRoute` — checks `user`, `profile.onboarded`, and optional `requiredType`
- `RoleRedirector` — redirects `/home`, `/dashboard`, legacy routes to role-appropriate home

### Route Groups

#### Public Routes
| Path | Component |
|------|-----------|
| `/` | `LandingPage` |
| `/login` | `Login` |
| `/register` | `Register` |

#### Onboarding
| Path | Component | Guard |
|------|-----------|-------|
| `/onboarding` | `OnboardingFlow` | `ProtectedRoute` (any role) |

#### Broker Routes (`/broker/*`) — Uses `BrokerLayout`
| Path | Component |
|------|-----------|
| `/broker/beranda` | `BrokerBeranda` |
| `/broker/transaksi` | `Transaksi` |
| `/broker/rpa` | `RPA` |
| `/broker/rpa/:id` | `RPADetail` (wrapped in ErrorBoundary) |
| `/broker/kandang` | `Kandang` |
| `/broker/pengiriman` | `Pengiriman` |
| `/broker/cashflow` | `CashFlow` |
| `/broker/armada` | `Armada` |
| `/broker/simulator` | `Simulator` |
| `/broker/akun` | `Akun` |

#### Peternak Routes (`/peternak/*`) — Uses `DashboardLayout`
| Path | Component |
|------|-----------|
| `/peternak/beranda` | `PeternakBeranda` |
| `/peternak/siklus` | `ComingSoon("Siklus Pemeliharaan")` |
| `/peternak/input` | `ComingSoon("Input Harian")` |
| `/peternak/pakan` | `ComingSoon("Stok & Pakan")` |
| `/peternak/akun` | `Akun` |

#### RPA Buyer Routes (`/rpa-buyer/*`) — Uses `DashboardLayout`
| Path | Component |
|------|-----------|
| `/rpa-buyer/beranda` | `RPABeranda` |
| `/rpa-buyer/order` | `ComingSoon("Order ke Broker")` |
| `/rpa-buyer/hutang` | `ComingSoon("Hutang Saya")` |
| `/rpa-buyer/akun` | `Akun` |

#### Egg Broker Routes (`/egg/*`) — Uses `BrokerLayout`
| Path | Component |
|------|-----------|
| `/egg/beranda` | `EggBeranda` |
| `/egg/pos` | `EggPOS` |
| `/egg/inventori` | `EggInventori` |
| `/egg/suppliers` | `EggSuppliers` |
| `/egg/customers` | `EggCustomers` |
| `/egg/transaksi` | `EggTransaksi` |

#### Shared Routes
| Path | Component |
|------|-----------|
| `/harga-pasar` | `HargaPasar` (ProtectedRoute, any role) |

#### Legacy Redirects
`/home`, `/dashboard`, `/beranda`, `/akun`, `/transaksi`, `/rpa-dashboard` → all go through `RoleRedirector`

---

## 7. Layout System

### `BrokerLayout` (`src/dashboard/layouts/BrokerLayout.jsx`)
- Detects desktop via `useMediaQuery('(min-width: 1024px)')`
- **Desktop**: Wraps children in `DesktopSidebarLayout`
- **Mobile**: `max-w-[480px]` centered container + `BottomNav` (fixed at bottom, 64px)
- Always renders `BusinessModelOverlay` if `profile.business_model_selected === false`

### `DesktopSidebarLayout` (`src/dashboard/layouts/DesktopSidebarLayout.jsx`)
- Uses Shadcn `SidebarProvider` → `AppSidebar` + `SidebarInset`
- `SidebarInset` contains `DesktopTopBar` + `<main>` (24px/32px padding, max-w-7xl)

### `DashboardLayout` (in `App.jsx` — for Peternak/RPA)
- Same  ### `AppSidebar` (Desktop — `src/dashboard/components/AppSidebar.jsx`)
- Logo: `<img src="/logo.png" />` + "TernakOS" + "Broker Dashboard"
- **Tenant Switcher**: 
  - Mendukung multi-bisnis dengan `switchTenant`.
  - Icon dinamis sesuai vertikal (🐔 Ayam, 🥚 Telur, 🏠 Peternak, 🏭 RPA).
  - Tampilan: Nama Bisnis + Label Vertikal di bawahnya.
- **Nav Groups**:
  - UTAMA: Beranda, Transaksi/POS, Kandang/Inventori, Tim.
  - Link dinamis sesuai vertikal aktif (`isPoultry` vs `isEgg`).
- Active state: emerald-500/10 bg, emerald-400 text, 1px emerald border
- Footer: Plan info (shows plan name, trial countdown + progress bar), User dropdown (Akun, Logout)
 emerald border
- Footer: Plan info (shows plan name, trial countdown + progress bar), User dropdown (Akun, Logout)

### `BottomNav` (Mobile — `src/dashboard/components/BottomNav.jsx`)
- Dynamic tabs from `getBusinessModel(profile.user_type).bottomNav`
- Animated indicator using Framer Motion `layoutId`
- Grid layout, role-colored active state
- Fixed bottom, maxWidth 480px, 64px height, glass effect bg

### `DrawerLainnya` (Mobile "More" Drawer — `src/dashboard/components/DrawerLainnya.jsx`)
- Slides up from bottom with spring animation
- Dynamic menu from `getBusinessModel(userType).drawerMenu`
- Used for secondary navigation items not in BottomNav

### `DesktopTopBar` (`src/dashboard/components/DesktopTopBar.jsx`)
- Breadcrumb: "Broker > {pageName}" (dynamic using `usePageTitle()`)
- Live indicator (green dot + "Live" text)
- Market price widget (fetches latest from `market_prices` table) showing Beli/Jual prices
- Notification bell

### `TopBar` (Mobile — `src/dashboard/components/TopBar.jsx`)
- Sticky top, glass effect, optional back button
- Props: `title`, `subtitle`, `showBack`, `rightAction`

---

## 9. Business Model Configuration (`lib/businessModel.js`)

Defines `BUSINESS_MODELS` object with `broker`, `peternak`, `rpa` keys:

| Role | Label | Icon | Color | BottomNav Tabs | DrawerMenu Items |
|------|-------|------|-------|----------------|------------------|
| `broker` | Broker / Pedagang | 🤝 | `#10B981` | Beranda, Transaksi, RPA, Akun | Pengiriman, Cash Flow, Harga Pasar, Armada, Simulator, Akun |
| `peternak` | Peternak | 🏚️ | `#7C3AED` | Beranda, Siklus, Input Harian, Akun | Stok & Pakan, Harga Pasar, Akun |
| `rpa` | RPA / Buyer | 🏭 | `#F59E0B` | Beranda, Order, Hutang, Akun | Akun, Harga Pasar |

`getBusinessModel(userType)` returns the config for a given role (defaults to broker).

---

## 10. File Structure (Complete)

```
src/
├── main.jsx                        ← Entry point (StrictMode + QueryClient + Toaster)
├── App.jsx                         ← All routes, ProtectedRoute, RoleRedirector
├── App.css
├── index.css                       ← Font imports, CSS vars, scrollbar, animations
│
├── lib/
│   ├── supabase.js                 ← createClient (env vars)
│   ├── queryClient.js              ← QueryClient (staleTime 2min, retry 1)
│   ├── utils.js                    ← cn() (clsx + twMerge)
│   ├── tokens.js                   ← Design tokens (colors, borders)
│   ├── format.js                   ← Formatting + label maps (see §11)
│   ├── businessModel.js            ← BUSINESS_MODELS config + getBusinessModel()
│   └── hooks/
│       ├── useAuth.js              ← { user, profile, tenant, loading, refetchProfile }
│       ├── useMediaQuery.js        ← Returns boolean for CSS media query
│       ├── useDashboardStats.js    ← Aggregated KPIs (today profit, piutang, etc.)
│       ├── usePurchases.js         ← Purchases list with farm join
│       ├── useSales.js             ← Sales list with RPA + purchase + delivery joins
│       ├── useFarms.js             ← Farm list with all columns
│       ├── useRPA.js               ← RPA client list
│       ├── useDeliveries.js        ← Delivery list with nested joins
│       ├── useCashFlow.js          ← Full cashflow aggregation (sales, purchases, deliveries, losses, expenses)
│       ├── useLossReports.js       ← Loss report list with sale/delivery joins
│       ├── useUpdateDelivery.js    ← updateTiba() mutation + auto loss_report insert
│       ├── useChickenBatches.js    ← Virtual stock batches with farm join
│       └── useForecast.js          ← Supply/demand gap analysis
│
├── dashboard/
│   ├── broker/                     ← MAIN BROKER PAGES
│   │   ├── Beranda.jsx             ← Redesigned Dashboard: KPI cards (80px), 7-day profit chart (Sen-Min), Weekly/Monthly toggle, Dynamic tooltips.
│   │   ├── Transaksi.jsx           ← Transaction history: Purchases + Sales list, SaleAuditSheet refined (No header trash icon).
│   │   ├── RPA.jsx                 ← RPA client list, search, CRUD
│   │   ├── RPADetail.jsx           ← RPA detail: agreements, transactions, outstanding
│   │   ├── Kandang.jsx             ← Farm CRUD: add/edit/delete farm
│   │   ├── Pengiriman.jsx          ← Delivery management orchestrator
│   │   ├── pengiriman/             ← Extracted modular components
│   │   │   ├── DeliveryCard.jsx    ← List item for delivery
│   │   │   ├── UpdateArrivalSheet.jsx ← Arrival edit + timbangan flow
│   │   │   ├── LogisticsDetailSheet.jsx ← Read-only logistics history
│   │   │   ├── LossCard.jsx        ← Card per delivery for loss report
│   │   │   ├── CreateLossSheet.jsx ← Create manual loss form
│   │   │   └── Common.jsx          ← Shared small UI components
│   │   ├── CashFlow.jsx            ← Cash flow chart + breakdown + expense form
│   │   ├── Armada.jsx              ← Vehicle + driver CRUD, SIM expiry alerts
│   │   ├── Simulator.jsx           ← Margin profit simulator
│   │   ├── Tim.jsx                 ← Team & member management
│   │   └── Akun.jsx                ← Profile, plan info, notifications, logout
│   │
│   ├── peternak/
│   │   └── Beranda.jsx             ← Peternak dashboard
│   │
│   ├── rpa/
│   │   └── Beranda.jsx             ← RPA buyer dashboard
│   │
│   ├── egg/                        ← NEW EGG BROKER PAGES
│   │   ├── Beranda.jsx             ← Egg dashboard
│   │   ├── Inventori.jsx           ← Stock & Price management
│   │   ├── POS.jsx                 ← Point of Sale
│   │   ├── Suppliers.jsx           ← Egg supplier CRM
│   │   ├── Customers.jsx           ← Egg customer CRM
│   │   └── Transaksi.jsx           ← Egg transaction history
│   │
│   ├── components/
│   │   ├── AppSidebar.jsx          ← Desktop sidebar (nav groups, plan widget, user menu)
│   │   ├── BottomNav.jsx           ← Mobile bottom nav (dynamic tabs per role)
│   │   ├── TopBar.jsx              ← Mobile sticky header (title, subtitle, back btn)
│   │   ├── DesktopTopBar.jsx       ← Desktop header (breadcrumb, market price, bell)
│   │   ├── TransaksiWizard.jsx     ← Multi-step transaction wizard (Sheet modal)
│   │   ├── BusinessModelOverlay.jsx ← First-time role selection overlay
│   │   ├── DrawerLainnya.jsx       ← Mobile "More" menu drawer
│   │   ├── ConfirmDialog.jsx       ← Reusable confirmation modal (delete, etc.)
│   │   ├── FormBeliModal.jsx       ← Standalone purchase form (Sheet)
│   │   ├── FormJualModal.jsx       ← Standalone sale form (Sheet)
│   │   ├── SlideModal.jsx          ← Generic bottom sheet wrapper
│   │   ├── KPICard.jsx             ← Dashboard KPI card component
│   │   ├── StatCard.jsx            ← Stat display card
│   │   ├── LoadingSpinner.jsx      ← Loading indicator
│   │   ├── EmptyState.jsx          ← Empty state placeholder
│   │   ├── ComingSoon.jsx          ← Coming soon placeholder page
│   │   └── wizard/
│   │       ├── WizardStepBeli.jsx      ← Purchase step form
│   │       ├── WizardStepJual.jsx      ← Sale step form
│   │       ├── WizardStepOrder.jsx     ← Order-first sale step
│   │       └── WizardStepPengiriman.jsx ← Delivery step form
│   │
│   ├── forms/
│   │   ├── FormBeliModal.jsx       ← Purchase form (separate module)
│   │   ├── FormJualModal.jsx       ← Sale form (separate module)
│   │   └── FormBayarModal.jsx      ← Payment form
│   │
│   ├── layouts/
│   │   ├── BrokerLayout.jsx        ← Responsive layout (mobile/desktop + overlay)
│   │   └── DesktopSidebarLayout.jsx ← AppSidebar + SidebarInset + DesktopTopBar
│   │
│   └── pages/                      ← Shared / role-agnostic pages
│       ├── HargaPasar.jsx          ← Market price view
│       ├── OnboardingFlow.jsx      ← Multi-step onboarding
│       ├── Akun.jsx                ← Account (shared across roles, old location)
│       ├── Beranda.jsx             ← Dashboard redirect (old)
│       ├── StokVirtual.jsx         ← Virtual stock page (Peternak)
│       ├── Forecast.jsx            ← Supply/demand forecast
│       ├── Orders.jsx              ← Order management
│       ├── Transaksi.jsx           ← Transaction view (old location)
│       ├── Kandang.jsx             ← Farm view (old location)
│       ├── CashFlow.jsx            ← Cash flow (old location)
│       ├── RPA.jsx                 ← RPA (old location)
│       ├── RPADetail.jsx           ← RPA detail (old location)
│       ├── Pengiriman.jsx          ← Delivery (old location)
│       ├── Simulator.jsx           ← Simulator (old location)
│       ├── LossReport.jsx          ← Loss report (old location)
│       ├── PeternakDashboard.jsx   ← Peternak dashboard (old)
│       └── RPADashboard.jsx        ← RPA dashboard (old)
│
├── pages/
│   ├── LandingPage.jsx             ← Landing page (imports sections)
│   ├── Login.jsx                   ← Login form
│   ├── Register.jsx                ← Registration form
│   └── dashboard/                  ← (legacy/unused)
│
├── sections/                       ← Landing page sections
│   ├── Hero.jsx                    ← Hero section with CTA
│   ├── Features.jsx                ← Feature highlights
│   ├── PainPoints.jsx              ← Problem/pain-point section
│   ├── HowItWorks.jsx              ← Step-by-step explanation
│   ├── MarketPrice.jsx             ← Market price showcase
│   ├── Testimonials.jsx            ← User testimonials
│   ├── Pricing.jsx                 ← Pricing tiers
│   ├── StatsBar.jsx                ← Statistics bar
│   └── FinalCTA.jsx                ← Final call-to-action
│
├── components/
│   ├── Navbar.jsx                  ← Landing page navbar
│   ├── Footer.jsx                  ← Landing page footer
│   ├── ErrorBoundary.jsx           ← React error boundary
│   ├── LoadingScreen.jsx           ← Full-page loading screen
│   ├── EmptyState.jsx              ← Landing empty state
│   ├── CountUp.jsx                 ← Animated number counter
│   ├── reactbits/                  ← Animated UI effect components
│   │   ├── AuroraBackground.jsx    ← 3D aurora background (Three.js)
│   │   ├── AnimatedContent.jsx     ← Scroll-triggered animation wrapper
│   │   ├── BlurText.jsx            ← Blurred text reveal effect
│   │   ├── ClickSpark.jsx          ← Click spark particle effect
│   │   ├── CountUp.jsx             ← Number counting animation
│   │   ├── Magnet.jsx              ← Magnetic cursor effect
│   │   ├── Particles.jsx           ← Particle background
│   │   ├── ShinyText.jsx/css       ← Shiny text animation
│   │   └── TiltedCard.jsx          ← 3D tilt card effect
│   └── ui/                         ← Shadcn UI components (29 files)
│       ├── DatePicker.jsx          ← Custom date picker wrapping Shadcn Calendar
│       ├── InputRupiah.jsx         ← Currency input (formats IDR, value = Number)
│       ├── InputNumber.jsx         ← Numeric input with formatting
│       ├── MagicRings.jsx          ← Decorative animation component
│       ├── alert-dialog.jsx        ├── avatar.jsx
│       ├── badge.jsx               ├── button.jsx
│       ├── calendar.jsx            ├── card.jsx
│       ├── chart.jsx               ├── collapsible.jsx
│       ├── command.jsx             ├── dialog.jsx
│       ├── dropdown-menu.jsx       ├── input.jsx
│       ├── label.jsx               ├── popover.jsx
│       ├── progress.jsx            ├── scroll-area.jsx
│       ├── select.jsx              ├── separator.jsx
│       ├── sheet.jsx               ├── sidebar.jsx
│       ├── skeleton.jsx            ├── table.jsx
│       ├── tabs.jsx                ├── textarea.jsx
│       └── tooltip.jsx
│
├── utils/
│   └── animations.js               ← Framer Motion variants (fadeUp, fadeIn, stagger, scaleIn, slide)
│
├── constants/                       ← (empty)
│
└── hooks/
    └── use-mobile.jsx               ← Shadcn isMobile hook
```

---

## 11. Key Utilities & Helpers

### `lib/format.js` — All Exports

| Function | Description | Example |
|----------|-------------|---------|
| `safeNumber(val, fallback)` | Ensures a number, returns fallback for NaN/null | `safeNumber(null) → 0` |
| `safePercent(num, den)` | Safe percentage calculation | `safePercent(50, 200) → 25` |
| `safeNum(v)` | Shorthand `Number(v) \|\| 0` | |
| `formatIDR(n)` | Full IDR format | `formatIDR(15000000) → "Rp 15.000.000"` |
| `formatIDRShort(n)` | Abbreviated IDR | `formatIDRShort(15000000) → "Rp 15.0jt"` |
| `formatDate(val, fallback)` | Safe date format (handles null) | `formatDate("2026-03-01") → "1 Mar 2026"` |
| `formatDateFull(val)` | Full date with day name | `"Senin, 1 Maret 2026"` |
| `formatRelative(val)` | Relative time in Indonesian | `"5 menit lalu"`, `"2 hari lalu"` |
| `formatWeight(kg)` | Weight format (auto ton) | `formatWeight(2500) → "2,50 ton"` |
| `formatKg(n)` | Alias for `formatWeight` | |
| `formatEkor(n)` | Count format | `formatEkor(5000) → "5.000 ekor"` |
| `calcMargin(buy, sell)` | Simple margin | `sellPrice - buyPrice` |
| `calcROI(modal, profit)` | ROI percentage | |
| `calcMortalityRate(initial, died)` | Mortality % | |
| `calcShrinkage(initialKg, arrivedKg)` | Shrinkage kg + % | `{ kg, percent }` |
| `calcNetProfit(sale)` | Standard Net Profit (using revenue - costs) | |
| `calcRemainingAmount(sale)` | Standard Remaining Debt (revenue - paid) | |

### Label Maps (also in `lib/format.js`)

```js
BUYER_TYPE_LABELS = {
  'rpa': 'RPA (Rumah Potong Ayam)', 'pedagang_pasar': 'Pedagang Pasar',
  'restoran': 'Restoran', 'pengepul': 'Pengepul',
  'supermarket': 'Supermarket', 'lainnya': 'Lainnya'
}

PAYMENT_TERMS_LABELS = {
  'cash': 'Cash', 'net3': 'NET 3 Hari', 'net7': 'NET 7 Hari',
  'net14': 'NET 14 Hari', 'net30': 'NET 30 Hari'
}

PAYMENT_STATUS_LABELS = {
  'lunas': 'Lunas', 'belum_lunas': 'Belum Lunas', 'sebagian': 'Sebagian'
}
```

Formatter functions: `formatBuyerType(val)`, `formatPaymentTerms(val)`, `formatPaymentStatus(val)`

---

## 12. React Query Keys Reference

| Key | Hook | Data |
|-----|------|------|
| `['farms', tenantId]` | `useFarms()` | Farm list |
| `['purchases', tenantId]` | `usePurchases()` | Purchase list |
| `['sales', tenantId]` | `useSales()` | Sale list with joins |
| `['rpa-clients', tenantId]` | `useRPA()` | RPA client list |
| `['deliveries', filter]` | `useDeliveries(filter)` | Delivery list |
| `['loss-reports']` | `useLossReports()` | Loss report list |
| `['cashflow', tenantId, start, end]` | `useCashFlow(start, end, tenantId)` | Aggregated cashflow |
| `['dashboard-stats']` | `useDashboardStats()` | Dashboard KPIs |
| `['chicken-batches', filter]` | `useChickenBatches(filter)` | Virtual stock batches |
| `['forecast']` | `useForecast()` | Supply/demand gap |
| `['market-price-topbar']` | DesktopTopBar inline | Latest market price |
| `['broker-stats']` | Used in Beranda | Broker KPI stats |
> Last updated: 2026-03-20

After mutations, invalidate relevant keys. The wizard invalidates: `broker-stats`, `purchases`, `sales`, `deliveries`, `rpa-clients`.

---

## 13. TransaksiWizard — Multi-step Transaction Flow

Located: `src/dashboard/components/TransaksiWizard.jsx`

**Trigger**: Single "Catat Transaksi" button in Beranda

**Container**: Shadcn `Sheet` — desktop: right panel 520px, mobile: bottom sheet 95vh

**2 Modes** (selected at Step 0):
1. `buy_first`: Step 1 Beli → Step 2 Jual → Step 3 Pengiriman
2. `order_first`: Step 1 Order RPA → Step 2 Beli → Step 3 Pengiriman

**Wizard Steps**:
| Step | Component | Purpose |
|------|-----------|---------|
| 0 | `Step0ModeSelect` (inline) | Choose mode |
| 1 | `WizardStepBeli` or `WizardStepOrder` | Purchase or order data |
| 2 | `WizardStepJual` or `WizardStepBeli` | Sale or purchase data |
| 3 | `WizardStepPengiriman` | Optional delivery data |

**Submit Logic** (`handleSubmitAll`):
1. Insert `purchases` (never include `total_modal`), `transport_cost: 0`, `other_cost: 0`
2. Insert `sales` with `purchase_id` (never include `net_revenue`, `remaining_amount`), includes `delivery_cost` from step 3
3. Optionally insert `deliveries` with `sale_id` (only if `step3Data.enabled`)
4. Invalidate queries: `broker-stats`, `purchases`, `sales`, `deliveries`, `rpa-clients`
5. Toast success/error

---

## 14. `useUpdateDelivery` — Delivery Arrival Mutation

Located: `src/lib/hooks/useUpdateDelivery.js`

**Function**: `updateTiba({ deliveryId, arrivedCount, arrivedWeight, notes, driverId, driverName, driverPhone })`

**Logic**:
1. Fetch current delivery for `initial_count`, `initial_weight_kg`
2. Calculate `mortality = initial_count - arrivedCount`, `shrinkage = initial_weight_kg - arrivedWeight`
3. Update delivery: set `arrived_count`, `arrived_weight_kg`, `mortality_count`, `arrival_time`, `status: 'completed'`
4. **UI**: `UpdateArrivalSheet` in `Pengiriman.jsx` uses a **7-row layout** with **dual-input synchronization** (changing Ekor Tiba updates Ekor Mati and vice versa based on initial count).
5. If mortality > 0: auto-create `loss_reports` entry with `loss_type: 'mortality'`, estimated financial loss.
6. Invalidate: `deliveries`, `sales`, `broker-stats`, `loss-reports`

---

## 15. `useCashFlow` — Cash Flow Aggregation

Located: `src/lib/hooks/useCashFlow.js`

**Params**: `(startDate, endDate, tenantId)`

**Fetches**: `sales`, `purchases`, `deliveries`, `loss_reports`, `extra_expenses` (all within date range)

**Returns**:
```js
{
  sales, purchases, deliveries, losses, expenses,
  summary: {
    totalPemasukan,      // sum(net_revenue)
    totalModal,          // sum(total_cost) from purchases
    totalTransport,      // sum(delivery_cost) from sales
    totalKerugian,       // sum(financial_loss) from losses
    totalExtra,          // sum(amount) from extra_expenses
    totalKeluar,         // totalModal + totalKerugian + totalExtra
    netCashFlow,         // totalPemasukan - totalKeluar
    marginPct            // (netCashFlow / totalPemasukan) * 100
  }
}
```

---

## 16. `useAuth` Hook

Located: `src/lib/hooks/useAuth.js`

```js
const { user, profile, tenant, loading, refetchProfile } = useAuth()
```

- `user` — Supabase auth user
- `profile` — Profile aktif (dari `profiles` table joined dengan `tenants(*)`)
- `profiles` — Daftar seluruh profile bisnis milik user tersebut
- `tenant` — Shorthand `profile?.tenants`
- `loading` — true while fetching session/profile
- `switchTenant(tenantId)` — Mengganti konteks bisnis aktif & persist ke localStorage
- `refetchProfile()` — manually re-fetch profile (used after BusinessModelOverlay)

---

## 17. Custom Input Components

### `InputRupiah` (`src/components/ui/InputRupiah.jsx`)
```jsx
<InputRupiah
  value={watch('price_per_kg')}        // Number
  onChange={(val) => setValue('price_per_kg', val)}  // Returns Number
  placeholder="19.800"
  className="bg-[#111C24] border-white/10 h-12 rounded-xl"
/>
```

### `DatePicker` (`src/components/ui/DatePicker.jsx`)
```jsx
<DatePicker
  value={watch('transaction_date')}    // ISO string "2026-03-16"
  onChange={(val) => setValue('transaction_date', val)}
  placeholder="Pilih tanggal"
/>
```

### `InputNumber` (`src/components/ui/InputNumber.jsx`)
- Numeric input with locale formatting, optional min/max, step

---

## 18. Animation Variants (`utils/animations.js`)

Pre-built Framer Motion variants:
- `fadeUp` — Opacity 0→1, Y 32→0
- `fadeIn` — Opacity 0→1
- `staggerContainer` — stagger 0.09s, delay 0.1s
- `scaleIn` — Opacity 0→1, Scale 0.92→1
- `slideLeft` — Opacity 0→1, X -40→0
- `slideRight` — Opacity 0→1, X 40→0

---

## 19. Landing Page Structure

`LandingPage.jsx` renders these sections in order:

1. `Navbar` — sticky header with login/register CTAs
2. `Hero` — headline, subtitle, CTA buttons, animated background
3. `PainPoints` — problem showcase
4. `Features` — feature highlight cards
5. `HowItWorks` — step-by-step flow
6. `MarketPrice` — live market price display
7. `Testimonials` — user testimonials
8. `Pricing` — plan comparison
9. `StatsBar` — key statistics
10. `FinalCTA` — final conversion CTA
11. `Footer` — links, social media

Uses `reactbits/` components for effects: `AuroraBackground`, `BlurText`, `AnimatedContent`, `Particles`, `ShinyText`, `TiltedCard`, `Magnet`, `ClickSpark`.

---

## 20. Known Rules & Gotchas

1. **NEVER insert generated columns**: `total_modal`, `net_revenue`, `remaining_amount`
2. **`formatDate` must be the safe version** from `lib/format.js`
3. **ESLint is strict** — `useEffect` with setState triggers error; prefer derived values
4. **Tailwind `font-body` string must NOT have extra quotes**
5. **Database Naming**: `market_prices` pakai `price_date` bukan `date`.
6. **Null Fallbacks**: `avg_buy_price`/`avg_sell_price` bisa null — fallback ke `farm_gate_price`/`buyer_price`.
7. **Soft Delete**: Gunakan `is_deleted=true`, bukan hard delete (kecuali di Recycle Bin).
8. **Recycle Bin**: Tersedia di `Akun.jsx` untuk restore data yang terhapus (sales, farms, rpa, deliveries).
9. **`buyer_type` in DB is lowercase**: `'rpa'`, `'pedagang_pasar'`, etc.
10. **`payment_status` values**: `'lunas'`, `'belum_lunas'`, `'sebagian'`
11. **`payment_terms` values**: `'cash'`, `'net3'`, `'net7'`, `'net14'`, `'net30'`
12. **Vehicle/Driver status values**: `'aktif'`, `'tidak_aktif'`
13. **Chicken batch status values**: `'growing'`, `'ready'`, `'booked'`, `'sold'`
14. **Order status values**: `'open'`, `'matched'`
15. **Shadcn Calendar** requires explicit install: `npx shadcn@latest add calendar`
16. **Import aliases**: `@/` resolves to `src/` (Vite alias)
17. **State mutations on unmount**: Ensure `finally` blocks handle unmounted components correctly
18. **Wizard transport_cost**: Set to `0` in purchase insert — delivery costs now tracked in `deliveries` table
19. **Mortality auto-report**: `useUpdateDelivery.updateTiba()` auto-creates `loss_reports` for mortality > 0
20. **Toast dark styling**: Sonner toaster configured globally with custom dark card styles in `main.jsx`
21. **Arrival Sheet Redesign**: `UpdateArrivalSheet` in `Pengiriman.jsx` reorganized into a specific **7-row responsive layout**. Includes bidirectional sync between "Ekor Tiba" and "Ekor Mati" based on `initial_count`.
22. **Financial Standardization (2026-03-20)**: Selalu gunakan `sale.total_revenue` langsung untuk pendapatan (Bobot Tiba × Harga), JANGAN hitung ulang dari `total_weight_kg` (bobot awal/kirim).
23. **RPA Outstanding Calculation**: Perhitungan saldo/piutang di detail page (`RPADetail.jsx`) harus menggunakan `calcRemainingAmount(s)` di frontend. Jangan mengandalkan kolom `remaining_amount` di database karena mungkin masih menggunakan kalkulasi bobot awal.
24. **`team_invitations` tidak punya `is_deleted`** — jangan filter `.eq('is_deleted', false)`.
25. **`team_invitations.expires_at`** — nama kolom `expires_at` BUKAN `expired_at`.
26. **`team_invitations.email` nullable** — jangan insert email saat generate kode.
27. **RBAC pattern** — selalu cek `profile.role` sebelum render tombol aksi sensitif.
28. **`invite_token` di `signUp` metadata** — wajib dikirim agar trigger DB handle join tenant.
29. **View Only banner** — tampilkan di setiap halaman yang bisa diakses `view_only`.
30. **Revenue WAJIB dari bobot TIBA** — total_revenue harus selalu dihitung dari arrived_weight_kg × price_per_kg, BUKAN dari initial_weight_kg (bobot kirim), total_weight_kg (bobot awal di purchases), atau quantity × avg_weight_kg (estimasi ekor).
31. **Ekor (count) hanya informasi** — arrived_count, initial_count, mortality_count TIDAK BOLEH dipakai untuk kalkulasi uang apapun. Ekor hanya untuk: tracking kematian, estimasi stok, data kandang.
32. **Update total_revenue saat catat kedatangan** — di `useUpdateDelivery.js` dan `UpdateArrivalSheet.jsx`, setelah arrived_weight_kg tersimpan, wajib update: `sales.total_revenue = arrived_weight_kg × price_per_kg`.
33. **Query invalidation setelah update revenue** — wajib invalidate: `['sales']`, `['sales', tenant.id]`, `['deliveries']`, `['deliveries', tenant.id]` agar semua halaman (Beranda, Transaksi, CashFlow, RPA) langsung update.

---

## 21. RBAC System

**`profiles.role` enum**: `owner`, `staff`, `view_only`, `sopir`.
- `owner`: Full access, can manage team, billing.
- `staff`: Standard operational access, cannot manage team/billing.
- `view_only`: Read-only access to most data.
- `sopir`: Limited access, primarily for `SopirDashboard` to update delivery status.

**Implementation**:
- `RoleGuard` component in `App.jsx` protects routes based on required roles.
- Sidebar and Bottom Navigation menus dynamically filter visible items based on user's role.
- Role badge displayed in sidebar footer for quick identification.
- Frontend components should check `profile.role` before rendering sensitive action buttons or forms.

---

## 22. Financial Standardization

**Revenue Recalculation on Arrival (2026-03-24)**:
Saat catat kedatangan pengiriman, total_revenue di tabel sales WAJIB di-recalculate menggunakan:
  total_revenue = deliveries.arrived_weight_kg × sales.price_per_kg

Ini memastikan susut berat otomatis tercermin dalam pendapatan.
Flow kalkulasi yang benar:
1. Bobot tiba ditimbang → arrived_weight_kg tersimpan di deliveries
2. total_revenue di-update: arrived_weight_kg × price_per_kg
3. Net profit = total_revenue - modal - delivery_cost
4. Ekor tidak dipakai dalam kalkulasi apapun

---

## 23. Team Invitations System

**Purpose**: Allows `owner` role to invite new members to their tenant using a 6-digit uppercase code.

**Schema**: `team_invitations` table
- `id`: UUID
- `tenant_id`: UUID (FK to `tenants.id`)
- `invite_code`: TEXT (6-digit uppercase, unique)
- `expires_at`: TIMESTAMPZ (7 days from creation)
- `email`: TEXT (nullable, can be used for pre-filling or direct invite)
- `role`: TEXT (enum: `staff`, `view_only`, `sopir`)
- `created_at`: TIMESTAMPZ

**Flow**:
1. `owner` generates an invite code via `Tim.jsx`.
2. Code is stored in `team_invitations` with an `expires_at` (7 days).
3. Invited user navigates to `/invite`, inputs the 6-digit code.
4. If valid, the user is prompted to sign up/log in.
5. During `signUp`, the `invite_token` (the 6-digit code) is passed in the `metadata`.
6. A Supabase Database Trigger handles the `auth.users` insert event:
   - It checks `user_metadata ->> 'invite_token'`.
   - If a valid token exists, it finds the corresponding `team_invitations` entry.
   - It then inserts a new record into `profiles` table, linking the new user to the `tenant_id` and `role` from the invitation, and marks the invitation as used (or deletes it).

**Important Notes**:
- `team_invitations` does NOT have an `is_deleted` column; filter by `expires_at` instead.
- The `email` column is nullable; it's not mandatory to provide an email when generating a code.
- The `invite_token` in `signUp` metadata is crucial for the DB trigger to link the user to the tenant.

---

## 24. Implemented Modules Status

| Module | Status | Location | Notes |
|--------|--------|----------|-------|
| Landing Page | ✅ | `src/pages/LandingPage.jsx` | Hero, Features, Pricing, etc. |
| Login / Register | ✅ | `src/pages/Login.jsx`, `Register.jsx` | Supabase auth |
| Onboarding | ✅ | `OnboardingFlow.jsx` | Multi-step flow |
| Beranda (Dashboard) | ✅ | `src/dashboard/broker/Beranda.jsx` | KPI cards, chart, piutang list |
| Transaksi | ✅ | `src/dashboard/broker/Transaksi.jsx` | History filters + Audit Sheet pattern |
| Kandang | ✅ | `src/dashboard/broker/Kandang.jsx` | View/Edit Sheet refactor |
| Tim & Akses | ✅ | `src/dashboard/broker/Tim.jsx` | Member & Invitation management |
| Recycle Bin | ✅ | `src/dashboard/broker/Akun.jsx` | Soft-delete recovery system |
| RPA / RPADetail | ✅ | `src/dashboard/broker/RPA.jsx` | Client & Outstanding tracking |
| Pengiriman | ✅ | `src/dashboard/broker/Pengiriman.jsx` | Delivery tracking + Loss reports |
| Cash Flow | ✅ | `src/dashboard/broker/CashFlow.jsx` | Chart + Expenses form |
| Armada | ✅ | `src/dashboard/broker/Armada.jsx` | Vehicle + Driver management |
| Harga Pasar Scraper | ✅ | `scripts/harga_scraper.py` | Automatic regional price updates |
| Simulator | ✅ | `src/dashboard/broker/Simulator.jsx` | Margin profit simulator |
| Harga Pasar (View) | ✅ | `src/dashboard/pages/HargaPasar.jsx` | Market price view (shared) |
| Stok Virtual | ✅ | `src/dashboard/pages/StokVirtual.jsx` | Batch tracking per farm |
| Forecast | ✅ | `src/dashboard/pages/Forecast.jsx` | Supply/demand analysis |
| Orders | ✅ | `src/dashboard/pages/Orders.jsx` | Order management |
| Sopir Dashboard | ✅ | `src/dashboard/broker/SopirDashboard.jsx` | Mobile-first, update status pengiriman |
| RBAC System | ✅ | `App.jsx` + `AppSidebar.jsx` + `BottomNav.jsx` | Role-based routing & menu visibility |
| Accept Invite | ✅ | `src/pages/AcceptInvite.jsx` | Kode 6 digit, join tenant existing |
| About Us | ✅ | `src/pages/AboutUs.jsx` | Spline robot, full sections |
| Register Upgrade | ✅ | `src/pages/Register.jsx` | Google OAuth, kode undangan, terms |
| Login Upgrade | ✅ | `src/pages/Login.jsx` | Google OAuth, feature highlights |
| Loading Screen | ✅ | `src/components/LoadingScreen.jsx` | Sweep line animation |
| Privacy Policy | ✅ | `src/pages/PrivacyPolicy.jsx` | Tab per role, klausul harga pasar |
| Calendar Global | ✅ | `src/components/ui/calendar.jsx` | Date picker global semua halaman |
| Peternak: Siklus | 🚧 | `ComingSoon` | Planned features |
| RPA: Order, Hutang | 🚧 | `ComingSoon` | Planned features |

## 25. Scripts & Automation

### `scripts/ternakos_harga_scraper.py`
- Setup: `pip install -r scripts/requirements.txt` (uses Playwright, undetected_chromedriver, bs4)
- Run: `python scripts/ternakos_harga_scraper.py`
- Fetches prices from pinsarindonesia.com, maps to `market_prices` table in Supabase. Wait time 15-20s.
- **Schedule**: Best run at 12:00 and 18:00 WIB.
- **Database**: Insert/Upsert into `market_prices` table.
- **Dependencies**: `requests`, `beautifulsoup4`, `psycopg2`.

---

## 26. Pricing Structure

| Target Role | PRO Plan | BUSINESS Plan |
|-------------|----------|---------------|
| **Broker** | Rp 999.000 / bln | Rp 1.499.000 / bln |
| **Peternak**| Rp 499.000 / bln | Rp 999.000 / bln |
| **RPA**     | Rp 699.000 / bln | Rp 1.499.000 / bln |

**BUSINESS Tier** = All PRO features + AI Suite (TernakBot).

---

## 27. AI Roadmap (Business Plan)

- **AI Engine**: Grok 4.1 Fast (planned integration).
- **Key Features**:
  - **TernakBot Chat**: Ask questions about your business data in natural language.
  - **Profit Analysis**: Detailed breakdown of margin and cost optimization.
  - **Anomaly Detection**: Alerts for suspicious transaction patterns or sudden weight drops.
  - **Harvest Prediction**: AI-driven estimated harvest date based on historical growth logs.
  - **Auto Reports**: Weekly/Monthly PDF reports generated automatically.
- **Status**: Planned (Design Phase).

---

---

## 28. Recent Major Updates (2026-03-24)

### Updates 2026-03-24

**Revenue Calculation Fix:**
- total_revenue sekarang selalu dari arrived_weight_kg × price_per_kg
- `useUpdateDelivery.js` auto-recalculate saat catat kedatangan
- `UpdateArrivalSheet.jsx` handle recalculation untuk new arrival & edit
- Data lama di DB sudah di-fix via SQL update
- Ekor (count) hanya informasi, tidak dipakai untuk kalkulasi uang

### Updates 2026-03-22
- Role baru: `view_only`, `sopir`.
- `RoleGuard` component di `App.jsx` untuk proteksi route granular.
- Filter menu otomatis di `AppSidebar.jsx` dan `BottomNav.jsx`.
- Role badge di sidebar footer untuk identitas user.

### Sistem Undangan Kode 6 Digit
- Ganti link undangan → kode 6 karakter uppercase.
- Flow terintegrasi: Owner (Tim.jsx) → Staff (AcceptInvite.jsx) → SignUp (Register.jsx).
- Trigger database otomatis menangani join tenant via `invite_token`.

### Modul Pengiriman (Modularized)
- `Pengiriman.jsx` dipecah jadi komponen terpisah di `src/dashboard/broker/pengiriman/`.
- Fitur timbangan digital, print report, dan edit kedatangan dengan lock/unlock.
- `Loss Report` terintegrasi penuh dengan workflow kedatangan.

### Halaman & UI/UX Baru
- **Sopir Dashboard**: Antarmuka mobile-first untuk sopir memperbarui status.
- **About Us**: Halaman marketing dengan Spline robot dan konten interaktif.
- **Login & Register Upgrade**: Integrasi Google OAuth dan antarmuka yang lebih modern.
- **Privacy Policy**: Tab khusus per role untuk transparansi data.
- **Loading Screen**: Animasi sweep line emerald yang premium.

*Last updated: March 22, 2026 — by Antigravity AI*
