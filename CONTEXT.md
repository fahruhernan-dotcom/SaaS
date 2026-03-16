# TernakOS — Developer Context

> Last updated: 2026-03-16 | Use this as reference for all future implementations.

---

## Project Stack

- **Framework**: React + Vite (v8)
- **Styling**: Tailwind CSS v3 + Shadcn UI components
- **Auth & DB**: Supabase (PostgreSQL)
- **State**: React Query (`@tanstack/react-query`)
- **Forms**: React Hook Form + Zod
- **Routing**: React Router v6
- **Charts**: recharts
- **Animations**: Framer Motion
- **Date**: date-fns + react-day-picker (Shadcn Calendar)
- **Notifications**: Sonner (toast)

---

## Design System Conventions

- **Dark theme** only. Background palette: `#06090F` → `#0C1319` → `#111C24` → `#162230`
- **Accent color**: `#10B981` (emerald-500), hover `#0D9668`
- **Text**: `#F1F5F9` (primary), `#94A3B8` (secondary), `#4B6478` (muted)
- **Font Display**: Sora — used for headings, labels, numbers
- **Font Body**: DM Sans — used for body text
- **Cards**: `rounded-2xl` or `rounded-3xl`, `border-white/5`
- **Inputs**: `bg-[#111C24] border-white/10 h-12 rounded-xl`
- **Buttons**: emerald bg with `shadow-[0_8px_24px_rgba(16,185,129,0.25)]`
- **Labels**: `text-[11px] font-black uppercase tracking-widest text-[#4B6478]` (font Sora)
- **No TailwindCSS v4** — project uses standard v3 config

---

## Database Schema (Schema v2)

> Use `.select()` only columns that exist. Never insert GENERATED columns.

### Key Tables

#### `profiles`
- `auth_user_id`, `full_name`, `role`, `tenant_id`
- `business_model_selected` (boolean, default false) — `false` = show onboarding overlay

#### `tenants`
- `id`, `business_name`, `plan` ('free'|'pro'|'enterprise'), `is_trial`, `trial_ends_at`

#### `farms`
- `id`, `tenant_id`, `farm_name`, `owner_name`, `status` ('ready'|'empty'|'active')
- `population`, `is_deleted`

#### `purchases`
- `id`, `tenant_id`, `farm_id`, `quantity`, `avg_weight_kg`, `total_weight_kg`
- `price_per_kg`, `total_cost`, `transport_cost`, `other_cost`
- **`total_modal`** ← GENERATED: `total_cost + transport_cost + other_cost` — **NEVER INSERT**
- `transaction_date`, `notes`, `is_deleted`

#### `sales`
- `id`, `tenant_id`, `rpa_id`, `purchase_id`, `quantity`, `avg_weight_kg`, `total_weight_kg`
- `price_per_kg`, `total_revenue`, `delivery_cost`
- **`net_revenue`** ← GENERATED: `total_revenue - delivery_cost` — **NEVER INSERT**
- `payment_status` ('lunas'|'belum_lunas'|'sebagian'), `paid_amount`
- **`remaining_amount`** ← GENERATED — **NEVER INSERT**
- `transaction_date`, `due_date`, `notes`, `is_deleted`

#### `rpa_clients`
- `id`, `tenant_id`, `rpa_name`, `payment_terms`, `total_outstanding`, `is_deleted`

#### `deliveries`
- `id`, `tenant_id`, `sale_id`, `vehicle_id` (nullable), `driver_id` (nullable)
- `vehicle_type`, `vehicle_plate`, `driver_name`, `driver_phone`
- `initial_count`, `initial_weight_kg`, `final_count`, `final_weight_kg`
- `load_time`, `departure_time`, `arrival_time`
- `delivery_cost`, `status` ('on_route'|'arrived'|'cancelled'), `notes`, `is_deleted`

#### `vehicles`
- `id`, `tenant_id`, `plate_number`, `vehicle_type`, `capacity_kg`, `status` ('aktif'|'tidak_aktif'), `is_deleted`

#### `drivers`
- `id`, `tenant_id`, `full_name`, `phone_number`, `sim_expires_at`, `wage_per_trip`, `status` ('aktif'|'tidak_aktif'), `is_deleted`

#### `cash_flows`
- `id`, `tenant_id`, `type` ('in'|'out'), `category`, `amount`, `description`, `transaction_date`, `is_deleted`

#### `rpa_agreements` (RPA)
- `id`, `tenant_id`, `rpa_id`, `buyer_type` ('rpa'|'pasar'|'langsung'), `payment_terms`, `target_price`, `notes`

---

## File Structure (Dashboard)

```
src/
├── dashboard/
│   ├── broker/
│   │   ├── Beranda.jsx       ← Main dashboard (desktop+mobile)
│   │   ├── Transaksi.jsx     ← Transaction history
│   │   ├── Kandang.jsx       ← Farm management
│   │   ├── RPA.jsx           ← RPA clients + agreements
│   │   ├── RPADetail.jsx     ← RPA detail view
│   │   ├── Pengiriman.jsx    ← Delivery management
│   │   ├── CashFlow.jsx      ← Cash flow module
│   │   ├── Armada.jsx        ← Vehicle & driver management
│   │   ├── Simulator.jsx     ← Profit simulator
│   │   ├── HargaPasar.jsx    ← Market price
│   │   └── Akun.jsx          ← Account/profile
│   ├── components/
│   │   ├── AppSidebar.jsx    ← Sidebar with logo, plan widget, nav
│   │   ├── TransaksiWizard.jsx  ← Multi-step transaction wizard (NEW)
│   │   ├── wizard/
│   │   │   ├── WizardStepBeli.jsx      ← Purchase step
│   │   │   ├── WizardStepJual.jsx      ← Sale step
│   │   │   ├── WizardStepOrder.jsx     ← Order-first sale step
│   │   │   └── WizardStepPengiriman.jsx ← Delivery step
│   │   ├── FormBeliModal.jsx    ← Standalone purchase form
│   │   ├── FormJualModal.jsx    ← Standalone sale form
│   │   └── ...
│   └── forms/
│       ├── FormBeliModal.jsx
│       ├── FormJualModal.jsx
│       └── FormBayarModal.jsx
├── components/
│   └── ui/
│       ├── InputRupiah.jsx    ← Currency input (NEW) — formats IDR with locale
│       ├── DatePicker.jsx     ← Date picker with Shadcn Calendar (NEW)
│       └── ...shadcn components
└── lib/
    ├── format.js             ← formatIDR, formatIDRShort, formatDate (safe), formatWeight
    ├── hooks/
    │   ├── useAuth.js        ← user, profile, tenant
    │   └── useMediaQuery.js  ← isDesktop helper
    └── supabase.js
```

---

## Key Components & Patterns

### `useAuth()`
```js
const { user, profile, tenant } = useAuth()
// tenant.id → use for all Supabase queries
// profile.business_model_selected → gating for onboarding
```

### `formatIDR(value)` — full IDR format
```js
formatIDR(15000000) // "Rp 15.000.000"
```

### `formatIDRShort(value)` — abbreviated
```js
formatIDRShort(15000000) // "Rp 15jt"
```

### `formatDate(value, fallback)` — safe (handles null/undefined/invalid)
```js
formatDate(null)           // "-"
formatDate("2026-03-01")   // "01 Maret 2026"
```

### `InputRupiah` component
```jsx
// Controlled component — value is Number, onChange returns Number
<InputRupiah
  value={watch('price_per_kg')}
  onChange={(val) => setValue('price_per_kg', val)}
  placeholder="19.800"
  className="bg-[#111C24] border-white/10 h-12 rounded-xl"
/>
```

### `DatePicker` component
```jsx
<DatePicker
  value={watch('transaction_date')}  // ISO string "2026-03-16"
  onChange={(val) => setValue('transaction_date', val)}
  placeholder="Pilih tanggal"
/>
```

---

## TransaksiWizard — Multi-step Transaction Flow

Located: `src/dashboard/components/TransaksiWizard.jsx`

**Trigger**: Single "Catat Transaksi" button in Beranda (replaces separate Beli/Jual buttons)

**2 Modes:**
- `buy_first`: Step0 → Step1 Beli → Step2 Jual → Step3 Pengiriman
- `order_first`: Step0 → Step1 Order RPA → Step2 Beli → Step3 Pengiriman

**Submit Logic** (`handleSubmitAll`):
1. Insert `purchases` (no `total_modal`) → get `purchase.id`
2. Insert `sales` with `purchase_id` (no `net_revenue`, no `remaining_amount`) → get `sale.id`
3. Insert `deliveries` with `sale_id` (only if `step3Data.enabled`)
4. `queryClient.invalidateQueries` on: `broker-stats`, `purchases`, `sales`, `deliveries`, `rpa-clients`

---

## AppSidebar — Key Details

- Logo: `<img src="/logo.png" />` (from `public/logo.png`)
- Subtitle: "Broker Dashboard" (title case)
- Plan widget: displayed above user footer (shows plan + trial status)
- Nav badges "Segera" removed from Pengiriman, Cash Flow, Armada
- Duplicate Simulator link removed from user dropdown footer

---

## Known Rules & Gotchas

1. **NEVER insert generated columns**: `total_modal`, `net_revenue`, `remaining_amount`
2. **`formatDate` must be the safe version** from `lib/format.js` — crashes if given raw null
3. **ESLint is strict** — `useEffect` with setState triggers error; prefer derived values
4. **Tailwind `font-body` string must NOT have extra quotes** — was `'DM Sans"'` (bug fixed)
5. **`buyer_type` in DB is lowercase**: `'rpa'`, `'pasar'`, `'langsung'` (not Title Case)
6. **`payment_status` values**: `'lunas'`, `'belum_lunas'`, `'sebagian'`
7. **Shadcn Calendar** requires explicit install: `npx shadcn@latest add calendar`
8. **React Hook Form `watch()`** is incompatible with React Compiler memoization — expected warning
9. **`purchases` query** — do NOT select `total_eggs` (column doesn't exist in v2)
10. **Delivery status values**: `'on_route'`, `'arrived'`, `'cancelled'`

---

## Implemented Modules (as of 2026-03-16)

| Module | Status | Notes |
|--------|--------|-------|
| Beranda (Dashboard) | ✅ | KPI cards, 7-day chart, piutang list, wizard trigger |
| Kandang | ✅ | CRUD farms |
| RPA / RPADetail | ✅ | Client management + agreements |
| Pengiriman | ✅ | Delivery + loss report tabs |
| Cash Flow | ✅ | Chart + breakdown + expense form |
| Armada | ✅ | Vehicle + driver CRUD, SIM expiry alerts |
| Simulator | ✅ | Margin simulator |
| Harga Pasar | ✅ | Market price view |
| Akun | ✅ | Profile + plan info |
| TransaksiWizard | ✅ | Multi-step Beli+Jual+Kirim in one flow |
| FormBeliModal (standalone) | ✅ | Still accessible directly |

---

*Last updated: March 16, 2026 — by Antigravity AI*
