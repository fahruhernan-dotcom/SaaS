# TernakOS — Developer Context

> Last updated: 2026-03-28 (Sembako vertical full implementation: 6 pages + DB tables + useSembakoData hooks; Peternak multi-kandang Level-2 routes + FarmContextBar; businessModel.js sembako_broker entry + nav cleanup; BottomNav priority fix; useTheme + ThemePicker; NotificationBell neutral palette; form input audit — SelectWrap pattern di semua select sembako; SetupFarm wizard; FarmCard component) | Use this as reference for all future implementations.

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
| Distributor Daging | Emerald | `#10B981` | (sama dengan Broker — pakai dashboard Broker) |
| RPH | Amber | `#F59E0B` | (sama dengan RPA — pakai dashboard RPA) |

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
- `onboarding_completed_at`: timestamptz — waktu selesai onboarding (set saat update profile di OnboardingFlow)
- `is_active` (boolean) — ⚠️ Note: Project is moving to `is_deleted` for soft delete.
- **Multi-Tenant**: Satu `auth_user_id` bisa memiliki banyak `profiles` (satu profile per `tenant_id`).
- Queried via: `supabase.from('profiles').select('*, tenants(*)')` in `useAuth` which returns an array of all user businesses.

### Tabel Vertikal Profil (Tambahan)
- **`broker_profiles`**: Profil detail Broker — `chicken_types[]`, `egg_types[]`, `area_operasi`, `target_volume_monthly`, `mitra_peternak_count`, `kapasitas_harian_butir`
- **`peternak_profiles`**: Profil detail Peternak — `animal_types[]`, `chicken_sub_types[]`, `ruminansia_types[]`, `kandang_count`, `doc_capacity`, `total_ternak`, `luas_lahan_m2`, `sistem_pemeliharaan`
- **`rpa_products`**: Produk RPA — `product_name`, `product_type`, `unit`, `sell_price`, `cost_price`, `current_stock_kg`
- **`rpa_customers`**: Customer RPA (CRM toko) — `customer_name`, `customer_type`, `contact_person`, `phone`, `address`, `payment_terms`, `credit_limit`, `total_outstanding`, `total_purchases`, `reliability_score`
- **`rpa_invoices`**: Invoice distribusi ke customer — `invoice_number`, `customer_name`, `transaction_date`, `due_date`, `total_amount`, `total_cost`, `net_profit` (**GENERATED**), `payment_status`, `paid_amount`, `remaining_amount` (**GENERATED**)
- **`rpa_invoice_items`**: Item per invoice — `product_name`, `quantity_kg`, `price_per_kg`, `cost_per_kg`, `subtotal` (**GENERATED** = `ROUND(quantity_kg * price_per_kg)`)
- **`rpa_customer_payments`**: Pembayaran per invoice customer — `amount`, `payment_date`, `payment_method`, `reference_no` ⚠️ Tidak ada `is_deleted`
- **`plan_configs`**: Key-value store config plan — `config_key` (UNIQUE), `config_value` (jsonb), `description` ⚠️ GLOBAL, tidak ada `tenant_id`, tidak ada `is_deleted`

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
- owner, staff, view_only (poultry_broker) → `/broker/poultry_broker/beranda`
- owner, staff, view_only (egg_broker) → `/egg/beranda`
- sopir → `/broker/sopir`
- superadmin → `/admin`

**Guard component**: `RoleGuard` di `App.jsx`
```jsx
<RoleGuard allowedRoles={['owner']}>
  <CashFlow />
</RoleGuard>
```

### `tenants`
- `id`, `business_name`, `plan` (`'starter'` | `'pro'` | `'business'`), `is_active`, `trial_ends_at`
- `business_vertical` (`'poultry_broker'` | `'egg_broker'` | `'peternak'` | `'rpa'`)
- `sub_type`: text — sub-role spesifik (`'broker_ayam'` | `'broker_telur'` | `'distributor_daging'` | `'peternak_broiler'` | `'peternak_layer'` | `'rpa_ayam'` | `'rph'`)
- `chicken_types`: text[] — jenis ayam yang diperdagangkan/diternak
- `animal_types`: text[] — jenis hewan ternak
- `area_operasi`: text — area operasi bisnis
- `target_volume_monthly`: integer — target volume per bulan
- `base_livestock_type`: text — jenis ternak utama (peternak)
- `addon_livestock_types`: text[] — jenis ternak add-on (peternak PRO)
- `kandang_limit`: integer — batas kandang aktif per plan (default 1)

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

### `feed_stocks`
- `id`, `tenant_id`, `peternak_farm_id` (FK → `peternak_farms`), `feed_type`, `quantity_kg`
- `feed_type`: `'starter'` | `'grower'` | `'finisher'` | `'konsentrat'` | `'jagung'` | `'dedak'` | `'lainnya'`
- `is_deleted`
- Hook: `useFeedStocks()` — queryKey `['feed-stocks', tenant.id]`
- Upsert logic: cek existing by `(tenant_id, peternak_farm_id, feed_type)`, update `quantity_kg +=` input jika ada, INSERT baru jika belum ada
- Threshold: ≥500 → Aman (green), 100–499 → Cukup (yellow), <100 → Menipis (red + pulse)

### `market_listings`
- `id`, `tenant_id`, `listing_type`, `chicken_type`
- `listing_type`: `'stok_ayam'` | `'penawaran_broker'` | `'permintaan_rpa'`
- `quantity_ekor`, `weight_kg`, `price_per_kg`
- `title`, `description`, `location`
- `contact_name`, `contact_wa` (format `628xx…`, min 10 digit)
- `status`: `'active'` | `'closed'` | `'expired'`
- `expires_at`, `view_count`, `is_deleted`
- Hook: `useMarketListings(filters)` — queryKey `['market-listings', filters]`
- Filter params: `type`, `chicken_type`, `search` (ilike title), `location` (ilike)
- WA normalisasi: strip non-digit, `0xx → 62xx`

### `kandang_workers`
- `id`, `tenant_id`, `peternak_farm_id`, `full_name`, `phone`
- `salary_type`: `'flat_bonus'` | `'borongan'` | `'persentase'`
- `base_salary`, `bonus_per_kg`, `bonus_threshold_fcr`
- `status`: `'aktif'` | `'nonaktif'`, `is_deleted`

### `cycle_expenses`
- `id`, `tenant_id`, `cycle_id` (FK → `breeding_cycles`), `expense_type`, `description`
- `expense_type`: `'doc'` | `'pakan'` | `'obat'` | `'vaksin'` | `'listrik'` | `'air'` | `'litter'` | `'lainnya'`
- `qty`, `unit`, `unit_price`, `total_amount`, `expense_date`
- `supplier`, `is_deleted`

### `worker_payments`
- `id`, `tenant_id`, `cycle_id`, `worker_id` (FK → `kandang_workers`)
- `payment_type`: `'gaji_bulanan'` | `'bonus_panen'` | `'uang_makan'` | `'lainnya'`
- `amount`, `payment_date`, `notes`, `is_deleted`
- ⚠️ **Note**: `worker_payments` TIDAK punya `cycle_id` sebagai filter utama. Filter berdasarkan `worker_id IN [workers milik farm]` + `payment_date BETWEEN start_date AND harvest_date`.

### `harvest_records`
- `id`, `tenant_id`, `cycle_id` (FK → `breeding_cycles`), `harvest_date`
- `buyer_type`: `'broker'` | `'rpa'` | `'pasar'` | `'inti'`
- `total_ekor_panen`, `total_weight_kg`, `avg_weight_kg`
- `price_per_kg`, `total_revenue`, `deduction_sapronak`, `net_revenue`
- `is_deleted`

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
- `RoleRedirector` — redirects `/home`, `/dashboard`, `/broker`, `/broker/beranda`, and legacy routes to role-appropriate home. **Superadmin → `/admin`**, poultry_broker → `/broker/poultry_broker/beranda`, egg_broker → `/egg/beranda`.

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
| `/broker/beranda` | `RoleRedirector` (redirect ke `/broker/poultry_broker/beranda` atau `/egg/beranda`) |
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
| `/peternak/beranda` | `PeternakBeranda` — FarmCard grid, SetupFarm overlay jika 0 farms |
| `/peternak/siklus` | `PeternakSiklus` |
| `/peternak/input` | `PeternakInputHarian` |
| `/peternak/anak-kandang` | `PeternakAnakKandang` |
| `/peternak/laporan/:cycleId` | `PeternakLaporanSiklus` |
| `/peternak/pakan` | `PeternakPakan` ✅ (feed_stocks, upsert + usage) |
| `/peternak/akun` | `Akun` |
| `/peternak/kandang/:farmId/beranda` | `PeternakBeranda` (Level-2, farm scoped) |
| `/peternak/kandang/:farmId/siklus` | `PeternakSiklus` (Level-2, farmId filter) |
| `/peternak/kandang/:farmId/input` | `PeternakInputHarian` (Level-2, FarmContextBar) |
| `/peternak/kandang/:farmId/pakan` | `PeternakPakan` (Level-2, farmId filter + FarmContextBar) |

#### Sembako Routes (`/broker/sembako/*`)
| Path | Component |
|------|-----------|
| `/broker/sembako/beranda` | `SembakoBeranda` ✅ |
| `/broker/sembako/produk` | `SembakoProduk` ✅ |
| `/broker/sembako/gudang` | `SembakoGudang` ✅ |
| `/broker/sembako/penjualan` | `SembakoPenjualan` ✅ |
| `/broker/sembako/pegawai` | `SembakoPegawai` ✅ |
| `/broker/sembako/laporan` | `SembakoLaporan` ✅ |

#### RPA Buyer Routes (`/rpa-buyer/*`) — Uses `DashboardLayout`
| Path | Component |
|------|-----------|
| `/rpa-buyer/beranda` | `RPABeranda` |
| `/rpa-buyer/order` | `RPAOrder` ✅ |
| `/rpa-buyer/hutang` | `RPAHutang` ✅ |
| `/rpa-buyer/distribusi` | `RPADistribusi` ✅ |
| `/rpa-buyer/distribusi/:customerId` | `RPADistribusiDetail` ✅ |
| `/rpa-buyer/laporan` | `RPALaporanMargin` ✅ |
| `/rpa-buyer/akun` | `RPAAkun` ✅ |

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
| `/market` | `Market` ✅ (ProtectedRoute, semua role — WA-based marketplace) |
| `/harga-pasar` | `HargaPasar` (ProtectedRoute, any role) |

#### Admin Routes (`/admin/*`) — Uses `AdminLayout`
| Path | Component | Guard |
|------|-----------|-------|
| `/admin` | `AdminBeranda` | `AdminRoute` (superadmin + email check) |
| `/admin/users` | `AdminUsers` | `AdminRoute` |
| `/admin/subscriptions` | `AdminSubscriptions` | `AdminRoute` |
| `/admin/pricing` | `AdminPricing` | `AdminRoute` |

#### Legacy Redirects
`/home`, `/dashboard`, `/beranda`, `/broker`, `/broker/beranda`, `/akun`, `/transaksi`, `/rpa-dashboard` → all go through `RoleRedirector`

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
- **Superadmin Bypass**: 
  - Superadmin bypass role-based filters (`isOwner` = true).
  - Hide trial widget for superadmin, replaced with **🛡️ PLATFORM ADMIN** gold badge.
- Footer: Plan info (shows plan name, trial countdown + progress bar for users), User dropdown (Akun, Admin Panel, Logout)
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
- Props: `title`, `subtitle`, `showBack`, `rightAction`, `showBell` (default true)
- Right section: `{rightAction}{showBell && <NotificationBell />}`

### `NotificationBell` (`src/dashboard/components/NotificationBell.jsx`)
- Bell icon button dengan animated red badge (count, `9+` cap)
- `AnimatePresence` dropdown panel: `w-[min(380px,calc(100vw-32px))]`, `max-h-[480px]`
- Click item: markAsRead → navigate(action_url) → close
- Click X per item: deleteNotif
- Header: "Tandai semua" + X close
- `TYPE_CONFIG`: `piutang_jatuh_tempo`, `pengiriman_tiba`, `stok_pakan_menipis`, `harga_pasar_update`, `subscription_expires`, `order_masuk`
- Timestamp via `formatRelative()` dari `lib/format.js`

---

## 9. Business Model Configuration (`lib/businessModel.js`)

Defines `BUSINESS_MODELS` object with `broker`, `peternak`, `rpa` keys:

| Key | Label | Icon | Color | BottomNav Tabs | DrawerMenu Items |
|-----|-------|------|-------|----------------|------------------|
| `broker` | Broker / Pedagang | 🤝 | `#10B981` | Beranda, Transaksi, RPA, Kirim | Pengiriman, Cash Flow, Harga Pasar, Armada, Simulator, TernakOS Market, Akun |
| `peternak` | Peternak | 🏚️ | `#7C3AED` | Beranda (FAB=Tambah Kandang), Siklus, Pakan, Laporan | Stok & Pakan, Harga Pasar, TernakOS Market, Akun |
| `rpa` | RPA / Buyer | 🏭 | `#F59E0B` | Beranda, Order, Hutang, Distribusi | Akun, Harga Pasar, TernakOS Market |
| `sembako_broker` | Distributor Sembako | 🛒 | `#EA580C` | Beranda, Penjualan, Gudang, Produk | Laporan, Pegawai, Harga Pasar, TernakOS Market, Akun |

`getBusinessModel(userType, subType)` returns the config for a given role (defaults to broker).

**Priority lookup di BottomNav & DesktopTopBar**:
```js
const model = (tenant?.business_vertical && BUSINESS_MODELS[tenant.business_vertical])
  || getBusinessModel(profile?.user_type, profile?.sub_type)
```
⚠️ **Rule**: Selalu prioritaskan `BUSINESS_MODELS[tenant.business_vertical]` karena `profile.sub_type` bisa tidak tersync. Ini critical untuk sembako_broker yang warna accent-nya orange `#EA580C`, BUKAN green default broker.

### Sub-Type Mappings (exported dari `businessModel.js`)

**`SUB_TYPE_TO_USER_TYPE`** — maps `sub_type` → `user_type` (untuk `profiles.user_type`):
| sub_type | user_type | Dashboard |
|----------|-----------|-----------|
| `broker_ayam` | `broker` | `/broker/poultry_broker/beranda` |
| `broker_telur` | `broker` | `/egg/beranda` |
| `distributor_daging` | `broker` | `/broker/poultry_broker/beranda` |
| `peternak_broiler` | `peternak` | `/peternak/beranda` |
| `peternak_layer` | `peternak` | `/peternak/beranda` |
| `rpa_ayam` | `rpa` | `/rpa-buyer/beranda` |
| `rph` | `rpa` | `/rpa-buyer/beranda` |

**`SUB_TYPE_TO_VERTICAL`** — maps `sub_type` → `business_vertical` (untuk `tenants.business_vertical`):
| sub_type | business_vertical |
|----------|-------------------|
| `broker_ayam` | `poultry_broker` |
| `broker_telur` | `egg_broker` |
| `distributor_daging` | `poultry_broker` |
| `peternak_broiler` | `peternak` |
| `peternak_layer` | `peternak` |
| `rpa_ayam` | `rpa` |
| `rph` | `rpa` |

**`SUB_TYPE_LABELS`** — label tampilan per sub_type.

**Status per sub-type**:
- ✅ AKTIF: `broker_ayam`, `broker_telur`, `distributor_daging`, `distributor_sembako`, `peternak_broiler`, `peternak_layer`, `rpa_ayam`
- 🚧 SEGERA: `broker_sapi`, `broker_sembako`, `peternak_kampung`, `peternak_pejantan`, `peternak_sapi`, `peternak_kambing`, `peternak_domba`, `peternak_babi`, `rph`

**New sub_type: `distributor_sembako`**:
- `user_type` = `'broker'`, `business_vertical` = `'sembako_broker'`
- Dashboard: `src/dashboard/sembako/Beranda.jsx` (dedicated, bukan Broker Ayam)
- Color accent: `#EA580C` (orange)

> ⚠️ **Rule 50**: Selalu gunakan `SUB_TYPE_TO_USER_TYPE` dan `SUB_TYPE_TO_VERTICAL` dari `businessModel.js`. Jangan hardcode mapping di komponen.

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
│       ├── useForecast.js          ← Supply/demand gap analysis
│       ├── usePeternakData.js      ← Peternak hooks: usePeternakFarms, useActiveCycles, useAllCycles,
│       │                              useCompletedCycles, useDailyRecords, useCreatePeternakFarm,
│       │                              useCreateCycle, useUpdateCycleStatus, useDeleteCycle,
│       │                              useCycleById, useUpsertDailyRecord,
│       │                              useFeedStocks, useUpsertFeedStock, useReduceFeedStock
│       ├── useRPAData.js           ← RPA hooks: useRPAOrders, useRPAHutang, useRPADistribusi,
│       │                              useRPAProducts, useRPASuppliers, useRPACustomers,
│       │                              useRPAInvoices, useCreateRPAInvoice, useRPACustomerPayments, etc.
│       ├── useSembakoData.js       ← Sembako hooks: useSembakoProducts, useSembakoAllBatches, useSembakoStockOut,
│       │                              useSembakoSales, useSembakoCustomers, useSembakoSuppliers,
│       │                              useSembakoDeliveries, useSembakoEmployees, useSembakoPayrolls,
│       │                              useSembakoLaporan, useCreateSembakoSale, useRecordSembakoPayment,
│       │                              useCreateSembakoProduct, useUpdateSembakoProduct, useSoftDeleteSembakoProduct,
│       │                              useAddStockBatch, useCreateSembakoCustomer, useUpdateSembakoCustomer,
│       │                              useCreateSembakoSupplier, useUpdateSembakoSupplier,
│       │                              useCreateSembakoDelivery, useCreateSembakoEmployee, useUpdateSembakoEmployee,
│       │                              useRecordPayroll, useMarkPayrollPaid
│       ├── useTheme.js             ← Accent color hook: localStorage 'ternakos_accent_color', custom event 'ternakos-theme-changed'
│       │                              Export: { accentColor, setAccentColor, clearAccentColor }
│       ├── useNotifications.js     ← Notif hooks: useNotifications (fetch+realtime+mark-read+delete)
│       │                              useNotificationGenerator (auto-generate piutang/trial/stok alerts)
│       ├── useMarket.js            ← Market hooks: useMarketListings, useMyListings,
│       │                              useCreateListing, useCloseListing, useDeleteListing
│       └── useAdminData.js         ← Admin hooks: useAllTenants, useAllInvoices, useConfirmInvoice,
│                                      usePaymentSettings, useUpsertPaymentSetting, usePricingConfig,
│                                      useUpdatePricing, useDiscountCodes, useCreateDiscountCode,
│                                      useToggleDiscountCode, useDeleteDiscountCode, useGlobalStats,
│                                      usePlanConfigs, useUpdatePlanConfig
│
├── dashboard/
│   ├── broker/                     ← 🤝 BROKER VERTICAL (Poultry)
│   │   │                              Route: /broker/poultry_broker/* (ProtectedRoute requiredVertical="poultry_broker")
│   │   │                              /broker/beranda → RoleRedirector (bukan komponen ini)
│   │   ├── Beranda.jsx             ← /broker/poultry_broker/beranda — KPI cards, 7-day profit chart, piutang list
│   │   ├── Transaksi.jsx           ← /broker/transaksi — Transaction history: Purchases + Sales, SaleAuditSheet
│   │   ├── RPA.jsx                 ← /broker/rpa — RPA client list, search, CRUD
│   │   ├── RPADetail.jsx           ← /broker/rpa/:id — RPA detail: agreements, transactions, outstanding
│   │   ├── Kandang.jsx             ← /broker/kandang — Farm CRUD: add/edit/delete farm
│   │   ├── Pengiriman.jsx          ← /broker/pengiriman — Delivery management orchestrator
│   │   ├── pengiriman/             ← Sub-components pengiriman
│   │   │   ├── DeliveryCard.jsx    ← List item delivery
│   │   │   ├── UpdateArrivalSheet.jsx ← Arrival + timbangan (7-row layout, bidirectional sync)
│   │   │   ├── LogisticsDetailSheet.jsx ← Read-only logistics history
│   │   │   ├── LossCard.jsx        ← Card per delivery for loss report
│   │   │   ├── CreateLossSheet.jsx ← Create manual loss form
│   │   │   └── Common.jsx          ← Shared small UI components
│   │   ├── CashFlow.jsx            ← /broker/cashflow — Cash flow chart + breakdown + expense form
│   │   ├── Armada.jsx              ← /broker/armada — Vehicle + driver CRUD, SIM expiry alerts
│   │   ├── Simulator.jsx           ← /broker/simulator — Margin profit simulator
│   │   ├── Tim.jsx                 ← /broker/tim — Team & member management (kode undangan 6 digit)
│   │   ├── SopirDashboard.jsx      ← /broker/sopir — Sopir: lihat & update status pengiriman assigned
│   │   └── Akun.jsx                ← /broker/akun — Profile, plan info, Recycle Bin, logout
│   │
│   ├── egg/                        ← 🥚 BROKER VERTICAL (Egg Broker)
│   │   │                              Route: /egg/* (ProtectedRoute requiredVertical="egg_broker")
│   │   ├── Beranda.jsx             ← /egg/beranda — KPI stok, penjualan, piutang
│   │   ├── Inventori.jsx           ← /egg/inventori — Stock & Price management per grade
│   │   ├── POS.jsx                 ← /egg/pos — Point of Sale: buat invoice + stock keluar
│   │   ├── Suppliers.jsx           ← /egg/suppliers — Egg supplier CRM
│   │   ├── Customers.jsx           ← /egg/customers — Egg customer CRM
│   │   └── Transaksi.jsx           ← /egg/transaksi — Transaction history + search
│   │
│   ├── peternak/                   ← 🏠 PETERNAK VERTICAL
│   │   │                              Route: /peternak/* (ProtectedRoute requiredType="peternak")
│   │   │                              Level-2 farm routes: /peternak/kandang/:farmId/*
│   │   ├── Beranda.jsx             ← /peternak/beranda — KPI aktif, alerts, FarmCard grid, SetupFarm trigger
│   │   ├── SetupFarm.jsx           ← overlay fullscreen — 3-step wizard: pilih ternak, model bisnis, detail kandang+mitra
│   │   ├── Siklus.jsx              ← /peternak/siklus + /peternak/kandang/:farmId/siklus — List siklus filter Aktif/Selesai
│   │   ├── InputHarian.jsx         ← /peternak/input + /peternak/kandang/:farmId/input — Timeline + quick input, FarmContextBar di Level-2
│   │   ├── AnakKandang.jsx         ← /peternak/anak-kandang — CRUD worker + riwayat pembayaran
│   │   ├── LaporanSiklus.jsx       ← /peternak/laporan/:cycleId — FCR, IP Score, charts, cost breakdown
│   │   ├── Pakan.jsx               ← /peternak/pakan + /peternak/kandang/:farmId/pakan — Stok pakan per farm, farmId filter, FarmContextBar di Level-2
│   │   └── components/             ← Sub-components peternak (tidak punya route sendiri)
│   │       ├── FarmCard.jsx        ← Card kandang di Beranda (livestock badge, model bisnis badge, cycle pill, CTA Mulai/Lihat Siklus)
│   │       ├── FarmContextBar.jsx  ← Sticky bar di Level-2 — nama farm + tombol back ke Overview
│   │       ├── SiklusSheet.jsx     ← Sheet bottom — form mulai siklus baru (chick in, DOC, biaya)
│   │       └── InputHarianSheet.jsx ← Sheet bottom — form input harian: mort, pakan, berat, FCR live
│   │
│   ├── sembako/                    ← 🛒 SEMBAKO VERTICAL (Distributor Sembako)
│   │   │                              Route: /broker/sembako/* (business_vertical='sembako_broker')
│   │   ├── Beranda.jsx             ← /broker/sembako/beranda — Mobile-first: KPI, HamburgerDrawer, business switcher drop-up, ThemePicker
│   │   ├── Produk.jsx              ← /broker/sembako/produk — CRUD produk: nama, kategori (combobox), satuan (SelectWrap), harga jual/beli, alert stok
│   │   ├── Gudang.jsx              ← /broker/sembako/gudang — Stok per produk, batch masuk (FIFO), riwayat keluar, TambahStokSheet bottom modal
│   │   ├── Penjualan.jsx           ← /broker/sembako/penjualan — Invoice CRUD + multi-item, pelanggan CRM, supplier CRM, pengiriman, pembayaran
│   │   ├── Pegawai.jsx             ← /broker/sembako/pegawai — CRUD pegawai: role, tipe gaji (harian/bulanan/borongan/komisi/campuran), payroll
│   │   └── Laporan.jsx             ← /broker/sembako/laporan — Laporan finansial: profit, piutang, distribusi (PieChart recharts), filter status
│   │
│   ├── rpa/                        ← 🏭 RPA VERTICAL (lengkap)
│   │   │                              Route: /rpa-buyer/* (ProtectedRoute requiredType="rpa")
│   │   ├── Beranda.jsx             ← /rpa-buyer/beranda — KPI order, hutang, distribusi
│   │   ├── Order.jsx               ← /rpa-buyer/order — Order management ke broker
│   │   ├── Hutang.jsx              ← /rpa-buyer/hutang — Hutang ke supplier/broker
│   │   ├── Distribusi.jsx          ← /rpa-buyer/distribusi — Customer distribusi list
│   │   ├── DistribusiDetail.jsx    ← /rpa-buyer/distribusi/:customerId — Detail transaksi customer
│   │   ├── LaporanMargin.jsx       ← /rpa-buyer/laporan — Laporan margin & profitabilitas
│   │   └── Akun.jsx                ← /rpa-buyer/akun — Profile & settings RPA
│   │
│   ├── components/
│   │   ├── AppSidebar.jsx          ← Desktop sidebar (nav groups, plan widget, user menu, ThemePicker, Quick Actions)
│   │   ├── BottomNav.jsx           ← Mobile bottom nav (dynamic tabs, BUSINESS_MODELS priority lookup, accentColor via useTheme)
│   │   ├── TopBar.jsx              ← Mobile sticky header (title, subtitle, back btn, showBell)
│   │   ├── DesktopTopBar.jsx       ← Desktop header (breadcrumb, market price, NotificationBell)
│   │   ├── NotificationBell.jsx    ← Bell icon + badge + dropdown panel (realtime notif, neutral gray palette)
│   │   ├── TransaksiWizard.jsx     ← Multi-step transaction wizard (Sheet modal)
│   │   ├── BusinessModelOverlay.jsx ← First-time role selection overlay
│   │   ├── DrawerLainnya.jsx       ← Mobile "More" menu drawer (+ ThemePicker card)
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
│   ├── admin/                      ← SUPERADMIN PANEL (role=superadmin only)
│   │   ├── AdminLayout.jsx         ← Layout dengan sidebar/topbar admin
│   │   ├── AdminBeranda.jsx        ← /admin — Global Overview: KPI, AreaChart, PieChart, alert lists
│   │   ├── AdminUsers.jsx          ← /admin/users — Tenant management, Detail Sheet
│   │   ├── AdminSubscriptions.jsx  ← /admin/subscriptions — Invoice monitoring + bank settings
│   │   └── AdminPricing.jsx        ← /admin/pricing — Pricing matrix + Voucher CRUD (Supabase DB)
│   │
│   ├── layouts/
│   │   ├── BrokerLayout.jsx        ← Responsive layout (mobile/desktop + overlay)
│   │   └── DesktopSidebarLayout.jsx ← AppSidebar + SidebarInset + DesktopTopBar
│   │
│   ├── pages/                      ← Shared / role-agnostic pages
│   │   └── onboarding/             ← Onboarding modular (4 steps)
│   │       ├── OnboardingFlow.jsx  ← Orchestrator (4 steps, Flow A + Flow B)
│   │       ├── shared.jsx          ← Shared: RoleCard, FourStepProgress, BlockedScreen, styles
│   │       ├── steps/
│   │       │   ├── Step0TipePilih.jsx    ← Pilih Broker / Peternak / RPA
│   │       │   ├── Step1SubTipe.jsx      ← 2-level untuk Peternak (Level 1: hewan, Level 2: jenis)
│   │       │   ├── Step2InfoBisnis.jsx   ← Nama bisnis, lokasi, phone
│   │       │   └── Step3Setup.jsx        ← Router ke per-vertical form
│   │       └── forms/
│   │           ├── BrokerAyamForm.jsx
│   │           ├── BrokerTelurForm.jsx
│   │           ├── PeternakAyamForm.jsx
│   │           ├── PeternakRuminansiaForm.jsx
│   │           └── RPABuyerForm.jsx
│   │
│   └── pages/                      ← Shared / role-agnostic pages (legacy)
│       ├── Market.jsx              ← /market — Multi-role marketplace (WA contact, 3 listing types)
│       ├── HargaPasar.jsx          ← Market price view
│       ├── OnboardingFlow.jsx      ← (legacy path — imports from onboarding/OnboardingFlow.jsx)
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
│   ├── Testimonials.jsx            ← (legacy, replaced)
│   ├── TestimonialsNew.jsx         ← 3-column infinite scroll testimonials (CSS @keyframes scrollUp)
│   ├── Comparison.jsx              ← Drag slider: Excel vs TernakOS (sliderPosition clip)
│   ├── Pricing.jsx                 ← Pricing tiers (DB-driven via pricing_plans, strikethrough originalPrice)
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
│   │   ├── TiltedCard.jsx          ← 3D tilt card effect
│   │   ├── ScrollVelocity.jsx      ← Framer Motion scroll velocity ticker (About Us)
│   │   ├── SplashCursor.jsx        ← WebGL fluid cursor effect
│   │   └── InfiniteScroll.jsx      ← Infinite horizontal scroll (ResizeObserver + framer-motion)
│   └── ui/                         ← Shadcn UI components (29+ files)
│       ├── DatePicker.jsx          ← Custom date picker wrapping Shadcn Calendar
│       ├── InputRupiah.jsx         ← Currency input (formats IDR, value = Number) — focus ring emerald
│       ├── InputNumber.jsx         ← Numeric input with formatting
│       ├── MagicRings.jsx          ← Decorative animation component
│       ├── ThemePicker.jsx         ← 8-color accent swatch picker (THEME_PRESETS), click to apply/deactivate, uses useTheme
│       ├── TransaksiSuccessCard.jsx ← Animated success modal (SVG check + spring, post-transaksi)
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
| `['admin-tenants']` | `useAllTenants()` | Semua tenant + profiles |
| `['admin-invoices']` | `useAllInvoices()` | Semua invoice subscription |
| `['payment-settings']` | `usePaymentSettings()` | Rekening bank aktif |
| `['pricing-plans']` | `usePricingConfig()` | Harga per role/plan dari `pricing_plans` table |
| `['discount-codes']` | `useDiscountCodes()` | Semua kode voucher dari `discount_codes` table |
| `['admin-global-stats']` | `useGlobalStats()` | Aggregated stats: tenants, users, revenue, growth |
| `['peternak-farms', tenantId]` | `usePeternakFarms()` | Kandang + breeding_cycles nested |
| `['active-cycles', tenantId]` | `useActiveCycles()` | Siklus aktif + farm info + daily_records |
| `['all-cycles', tenantId]` | `useAllCycles()` | Semua siklus (semua status) untuk Siklus.jsx & LaporanSiklus.jsx |
| `['completed-cycles', tenantId]` | `useCompletedCycles()` | 3 siklus selesai terakhir (harvested/failed) |
| `['daily-records', cycleId]` | Inline di InputHarian.jsx | Catatan harian per siklus |
| `['farm-workers', tenantId]` | Inline di AnakKandang.jsx | Daftar anak kandang |
| `['worker-payments', workerId]` | Inline di AnakKandang.jsx | Riwayat bayar per worker |
| `['feed-stocks', tenantId]` | `useFeedStocks()` | Stok pakan per farm + peternak_farms join |
| `['market-listings', filters]` | `useMarketListings(filters)` | Listing aktif dengan filter |
| `['my-listings', tenantId]` | `useMyListings()` | Listing milik tenant aktif |
| `['notifications', tenantId]` | `useNotifications()` | Notifikasi per tenant (realtime) |
| `['plan-configs']` | `usePlanConfigs()` | Config plan: kandang_limit, addon_pricing, trial_config, dll |
| `['xendit-config']` | `useXenditConfig()` | Xendit API config (dari payment_settings) |

After mutations, invalidate relevant keys. The wizard invalidates: `broker-stats`, `purchases`, `sales`, `deliveries`, `rpa-clients`.
Peternak mutations invalidate: `active-cycles`, `all-cycles`, `peternak-farms`, `daily-records`, `farm-workers`, `worker-payments`, `feed-stocks`.
Market mutations invalidate: `market-listings`, `my-listings`.

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
34. **Superadmin Access**: Hanya profile dengan `role='superadmin'` DAN email `fahruhernansakti@gmail.com` yang bisa mengakses `/admin/*`. Redirect otomatis di `RoleRedirector` → `/admin`. Return `null` (do nothing) sudah dihapus.
35. **`/broker/beranda` route**: Ditangani oleh `RoleRedirector` (bukan `BrokerBeranda`) — akan redirect ke vertical yang benar sesuai `business_vertical` tenant aktif. Jangan link langsung ke `/broker/beranda` tanpa memastikan RoleRedirector tersedia.
36. **`handleBackToDashboard` di AdminLayout**: Selalu ambil tenant via Supabase query (`.find(p => p.tenants)`), set `localStorage` sebelum `switchTenant()`, await 100ms sebelum navigate, fallback ke `/broker/poultry_broker/beranda`. Jangan gunakan `data?.[0]?.tenants` (bisa jadi row pertama tidak punya tenant).
37. **Form Accessibility**: Semua `<input>`, `<select>`, `<textarea>` wajib punya `id` dan `name`. Semua `<label>` wajib punya `htmlFor` yang cocok dengan `id` input-nya. Berlaku untuk FormBeliModal, FormJualModal, FormBayarModal, WizardStepPengiriman, dan semua form lainnya.
38. **FCR Formula Peternak**: FCR Final = `total_feed_kg ÷ total_harvest_weight_kg` (dari `harvest_records`). Bukan dari `current_count`. IP Score = `(survival_rate × avg_weight_kg) ÷ (FCR × age_days) × 100`. Selalu ambil `final_fcr` dari DB jika tersedia.
39. **worker_payments tidak punya cycle_id**: Filter berdasarkan `worker_id IN [workers milik farm]` + `payment_date BETWEEN start_date AND harvest_date`. Jangan asumsi ada kolom `cycle_id` di `worker_payments`.
40. **peternak_farms kolom baru**: `livestock_type` (enum: `ayam_broiler`, `ayam_petelur`), `business_model` (enum: `mandiri_murni`, `mandiri_semi`, `mitra_penuh`, `mitra_pakan`, `mitra_sapronak`), `mitra_company`, `mitra_contract_price`. Gunakan nilai lowercase persis ini saat INSERT.
41. **breeding_cycles kolom tambahan**: `current_count`, `start_date`, `estimated_harvest_date` ada di DB tapi belum terdokumentasi di schema awal. Selalu include saat INSERT di SiklusSheet. Lihat DATABASE_STRUCTURE.md untuk schema lengkap.
42. **AcceptInvite verifikasi kode via Edge Function**: Sejak H-2 fix, `verifyCode()` di `AcceptInvite.jsx` TIDAK query `team_invitations` langsung — gunakan `supabase.functions.invoke('verify-invite-code', { body: { code } })`. Handle status 429 → `isLocked=true`, disable input. Status 404/410 → toast normal.
43. **verify-invite-code returns `token` field**: Response Edge Function include `invitation.token` agar `handleRegister` bisa kirim `invite_token` ke `signUp` metadata. Jangan hapus field ini dari response.
44. **Peternak Beranda — FarmCard grid**: Beranda.jsx menampilkan `<FarmCard>` grid dari `farmList`. `activeCycle` di-pass dengan `age_days` dihitung via `calcCurrentAge(cycle.start_date)` karena DB tidak menyimpan `age_days` di `breeding_cycles`. Jika `farmList.length === 0` → render `<SetupFarm>` overlay fullscreen.
45. **tenant_update RLS recursion** — WITH CHECK yang query tabel `tenants` dari dalam policy `tenants` → infinite recursion → 500 error saat PATCH. Policy `tenant_update` sekarang hanya pakai USING tanpa WITH CHECK kompleks. Security fix C-1 (blokir self-upgrade plan) re-implementasi via Edge Function.
46. **handle_new_user() trigger tidak guaranteed** — Supabase trigger kadang delay atau tidak jalan sama sekali (jarang tapi bisa terjadi). `Register.jsx` wajib verifikasi profile terbuat setelah `signUp()` dengan delay 1500ms + query `profiles`. Jika null → tampilkan error, JANGAN navigate ke onboarding.
47. **Login loop prevention** — Jika profile null setelah login berhasil, JANGAN redirect ke `/onboarding` karena akan loop balik ke `/login`. Wajib: cek profile ada → jika null → `signOut()` + toast error.
48. **email_confirmed_at untuk testing** — Jika "Enable email confirmations" OFF di Supabase dashboard, user bisa login langsung. Jika ada user yang stuck, fix via SQL: `UPDATE auth.users SET email_confirmed_at = now() WHERE email = '...';` — JANGAN include `confirmed_at` (generated column).
49. **Register flow wajib verifikasi trigger** — Setelah `signUp()`, tunggu 1500ms lalu query `profiles`. Jika profile tidak ada = trigger gagal. Jangan silent fail — tampilkan toast error yang actionable.
50. **Sub-type mapping wajib dari businessModel.js** — Selalu import `SUB_TYPE_TO_USER_TYPE` dan `SUB_TYPE_TO_VERTICAL` dari `lib/businessModel.js`. Jangan hardcode mapping di komponen manapun. Ini single source of truth untuk konversi sub_type → user_type / vertical.
51. **Peternak onboarding Step1 = 2 level** — Level 1: pilih hewan (Ayam aktif, lainnya waitlist sheet). Level 2 (hewan==='ayam'): pilih jenis (Broiler + Layer aktif, Kampung disabled). Back button kembali ke Level 1 dengan AnimatePresence slide.
52. **Distributor Daging = sub_type='distributor_daging', user_type='broker'** — Pakai dashboard Broker Ayam yang sama (vertikal `poultry_broker`). Bukan RPA. Ada di BROKER sub-tab di HargaPage dan FiturPage.
53. **RPH = sub_type='rph', user_type='rpa'** — Pakai dashboard RPA yang sama (vertikal `rpa`). Nama berbeda saja. RPH = Rumah Potong Hewan (ruminansia). Saat ini disabled/waitlist.
54. **plan_configs table** — Key-value store global untuk semua config yang bisa diubah admin: `kandang_limit`, `addon_pricing`, `trial_config`, `annual_discount`, `team_limit`. Config-value adalah jsonb. Admin ubah via AdminPricing tab "Add-on & Limit" + "Trial & Diskon". Hook: `usePlanConfigs()` + `useUpdatePlanConfig()` di `useAdminData.js`.
55. **Add-on Peternak PRO** — +Rp 99.000/bln per jenis ternak aktif tambahan (di luar 1 jenis yang included). Max 2 add-on sebelum suggest upgrade ke Business (lebih hemat). Config di `plan_configs` key `'addon_pricing'`.
56. **Kandang limit enforcement** — `tenants.kandang_limit` wajib di-check sebelum izinkan tambah kandang baru di Peternak. Default: starter=1, pro=2, business=99. Config via `plan_configs` key `'kandang_limit'`.
57. **SelectWrap pattern wajib untuk semua `<select>`** — Selalu bungkus `<select>` dengan `<SelectWrap>` (local helper component) yang menambahkan `<ChevronDown>` overlay. Tambahkan `appearance: 'none'` dan `WebkitAppearance: 'none'` ke base style object. Tambahkan `paddingRight: 32–36` ke select agar teks tidak bertumpuk dengan ikon. Pattern ini telah diterapkan di semua 5 file sembako (Produk, Penjualan, Gudang, Pegawai, Laporan). Berlaku untuk semua vertical.
58. **`SelectWrap` component template**:
    ```jsx
    function SelectWrap({ children, style }) {
      return (
        <div style={{ position: 'relative', ...style }}>
          {children}
          <ChevronDown size={14} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: MUTED_COLOR, pointerEvents: 'none' }} />
        </div>
      )
    }
    ```
    Catatan: `style` prop pada wrapper digunakan untuk `flex`, `width: 'auto'`, dll — JANGAN taruh di `<select>` langsung jika properti tersebut mengontrol layout wrapper.
59. **BottomNav `BUSINESS_MODELS` priority** — Gunakan `BUSINESS_MODELS[tenant.business_vertical]` sebelum `getBusinessModel(profile.user_type, profile.sub_type)`. Ini memastikan sembako_broker mendapat orange accent bukan green default broker.
60. **`useTheme` hook** — localStorage key: `'ternakos_accent_color'`. Custom event: `'ternakos-theme-changed'`. Digunakan di AppSidebar, BottomNav, ThemePicker. Reset ke default dengan `clearAccentColor()`.
61. **Sembako Palette** — `#06090F` bg, `#1C1208` card, `#231A0E` input, `#EA580C` accent, `#FEF3C7` text, `#92400E` muted, `rgba(234,88,12,0.15)` border. Semua sembako file menggunakan palette ini. Jangan pakai emerald/green di sembako.
62. **Peternak Level-2 routes** — `/peternak/kandang/:farmId/*` adalah route Level-2 (per-farm context). Deteksi: `const farmMatch = location.pathname.match(/^\/peternak\/kandang\/([^/]+)/)`. `FarmContextBar` hanya render jika `farmId` ada. `Pakan.jsx` dan `InputHarian.jsx` filter data by `farmId` jika Level-2.
63. **SetupFarm overlay** — Tampil di `Beranda.jsx` Peternak jika `farms.length === 0` setelah loading selesai. Fullscreen fixed overlay. 3 step: pilih livestock_type, pilih business_model (needsMitra=true untuk mitra_penuh/mitra_pakan/mitra_sapronak), detail farm (+ field kondisional mitra_company + mitra_contract_price). Submit ke `peternak_farms`, lalu `queryClient.invalidateQueries(['peternak-farms'])`.
64. **Sembako `useSembakoData.js`** — Semua hook tersedia di `@/lib/hooks/useSembakoData`. Gunakan `useAuth()` untuk `tenant?.id`. QueryKey pattern: `['sembako-products', tenantId]`, `['sembako-sales', tenantId]`, dll. Setiap hook filter by `tenant_id` dan `is_deleted = false` (kecuali tabel tanpa is_deleted).
65. **HamburgerDrawer sembako** — Mobile only. Berisi: ThemePicker, menu shortcut, bottom actions (Admin Panel jika superadmin, Ganti Model Bisnis yang toggle business switcher drop-up). Drop-up "Ganti Model Bisnis" menampilkan daftar `profiles` dari `useAuth()`, bukan navigate ke onboarding baru.

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
- `token`: TEXT (6-digit uppercase, kode undangan)
- `expires_at`: TIMESTAMPZ (7 days from creation)
- `email`: TEXT (nullable, can be used for pre-filling or direct invite)
- `role`: TEXT (enum: `staff`, `view_only`, `sopir`)
- `created_at`: TIMESTAMPZ

**Flow (kode diverifikasi via Edge Function sejak H-2)**:
1. `owner` generates an invite code via `Tim.jsx`.
2. Code is stored in `team_invitations` with an `expires_at` (7 days).
3. Invited user navigates to `/invite`, inputs the 6-digit code.
4. `AcceptInvite.jsx` calls Edge Function `verify-invite-code` (bukan query DB langsung).
5. Edge Function validates code + rate-limits IP (max 5 attempts / 15 min, lockout 30 min).
6. On success, invitation data (id, tenant_id, role, email, tenants) returned to frontend.
7. User prompted to sign up/log in.
8. During `signUp`, the `invite_token` (the 6-digit code) is passed in the `metadata`.
9. A Supabase Database Trigger handles the `auth.users` insert event:
   - It checks `user_metadata ->> 'invite_token'`.
   - If a valid token exists, it finds the corresponding `team_invitations` entry.
   - It then inserts a new record into `profiles` table, linking the new user to the `tenant_id` and `role` from the invitation, and marks the invitation as accepted.

**Security Fixes (AcceptInvite)**:
- **H-2 (Rate Limit)**: Verifikasi kode lewat `verify-invite-code` Edge Function — bukan direct query. 429 → lock UI.
- **H-4a (Owner Hijack)**: Jika login user existing dan `role === 'owner'` → signOut + block.
- **H-4b (Tenant Switch)**: Jika user existing sudah di tenant lain → konfirmasi amber card.
- **H-4c (Email Match)**: Jika `invitation.email` non-null → validasi email input harus cocok.

**Important Notes**:
- `team_invitations` does NOT have an `is_deleted` column; filter by `expires_at` instead.
- The `email` column is nullable; it's not mandatory to provide an email when generating a code.
- The `invite_token` in `signUp` metadata is crucial for the DB trigger to link the user to the tenant.
- Kolom token pakai nama `token`, bukan `invite_code`.

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
| Accept Invite | ✅ | `src/pages/AcceptInvite.jsx` | Kode 6 digit, join tenant existing — security H-2/H-4 fixed |
| Edge Fn: verify-invite-code | ✅ | `supabase/functions/verify-invite-code/index.ts` | Rate limit verifikasi kode (5x/15min, lockout 30min) |
| Edge Fn: fetch-harga | ✅ | `supabase/functions/fetch-harga/index.ts` | Auto-scrape harga broiler dari chickin.id |
| About Us | ✅ | `src/pages/AboutUs.jsx` | Spline robot, full sections |
| Register Upgrade | ✅ | `src/pages/Register.jsx` | Google OAuth, kode undangan, terms |
| Login Upgrade | ✅ | `src/pages/Login.jsx` | Google OAuth, feature highlights |
| Loading Screen | ✅ | `src/components/LoadingScreen.jsx` | Sweep line animation |
| Privacy Policy | ✅ | `src/pages/PrivacyPolicy.jsx` | Tab per role, klausul harga pasar |
| Calendar Global | ✅ | `src/components/ui/calendar.jsx` | Date picker global semua halaman |
| Peternak: Setup Farm (Onboarding) | ✅ | `src/dashboard/peternak/SetupFarm.jsx` | 3-step wizard: ternak, model bisnis, detail kandang |
| Peternak: Beranda | ✅ | `src/dashboard/peternak/Beranda.jsx` | KPI aktif, alerts, CycleCard, history selesai |
| Peternak: Siklus | ✅ | `src/dashboard/peternak/Siklus.jsx` | List siklus filter Aktif/Selesai, SiklusSheet, InputHarianSheet |
| Peternak: Input Harian | ✅ | `src/dashboard/peternak/InputHarian.jsx` | Timeline + quick input, FCR real-time di sheet |
| Peternak: Anak Kandang | ✅ | `src/dashboard/peternak/AnakKandang.jsx` | CRUD worker, riwayat bayar (gaji/bonus/makan/lain) |
| Peternak: Laporan Siklus | ✅ | `src/dashboard/peternak/LaporanSiklus.jsx` | FCR, IP Score, charts berat+pakan, cost breakdown |
| Peternak: Stok & Pakan | ✅ | `src/dashboard/peternak/Pakan.jsx` | Stok pakan per farm, upsert + pemakaian, alert menipis |
| TernakOS Market | ✅ | `src/dashboard/pages/Market.jsx` | Multi-role marketplace WA-based, 3 listing types |
| RPA: Order | ✅ | `src/dashboard/rpa/Order.jsx` | Order management ke broker |
| RPA: Hutang | ✅ | `src/dashboard/rpa/Hutang.jsx` | Hutang ke supplier/broker |
| RPA: Distribusi | ✅ | `src/dashboard/rpa/Distribusi.jsx` + `DistribusiDetail.jsx` | Customer distribusi + detail transaksi |
| RPA: Laporan Margin | ✅ | `src/dashboard/rpa/LaporanMargin.jsx` | Margin & profitabilitas |
| Admin Dashboard | ✅ | `src/dashboard/admin/AdminBeranda.jsx` | Superadmin controls (Real-time Global Stats, Charts) |
| Admin: Users & Tenant | ✅ | `src/dashboard/admin/AdminUsers.jsx` | Phase 3: Total stats, Filters, Detail Sheet |
| Admin: Subscriptions & Invoices | ✅ | `src/dashboard/admin/AdminSubscriptions.jsx` | Phase 4: Invoice monitoring, Bank settings, Manual confirmation |
| Admin: Pricing & Discounts | ✅ | `src/dashboard/admin/AdminPricing.jsx` | Phase 5+6: 4 tab (Harga Plan, Add-on & Limit, Trial & Diskon, Kode Diskon). DB: `pricing_plans`, `discount_codes`, `plan_configs` |
| Notification System | ✅ | `useNotifications.js` + `NotificationBell.jsx` | Realtime INSERT subscribe, badge count, dropdown panel (neutral gray), mark-read/delete, auto-generate alerts |
| Onboarding Modular | ✅ | `onboarding/` folder | 4 steps, per-vertical forms, 2-level Peternak, waitlist sheet, businessModel.js mapping |
| Peternak: Setup Farm Wizard | ✅ | `src/dashboard/peternak/SetupFarm.jsx` | 3-step fullscreen overlay: ternak (broiler/layer), model bisnis (mandiri/kemitraan), detail kandang + mitra fields |
| Peternak: FarmCard | ✅ | `src/dashboard/peternak/components/FarmCard.jsx` | Livestock badge, model bisnis badge, cycle pill, CTA Mulai/Lihat Siklus |
| Peternak: Multi-Kandang Level-2 | ✅ | `/peternak/kandang/:farmId/*` | Per-farm scoped routes, FarmContextBar, farmId filtering di Pakan + InputHarian |
| Sembako: Beranda | ✅ | `src/dashboard/sembako/Beranda.jsx` | Mobile KPI, HamburgerDrawer, business switcher drop-up, ThemePicker |
| Sembako: Produk | ✅ | `src/dashboard/sembako/Produk.jsx` | CRUD produk, kategori combobox, satuan SelectWrap, harga jual/beli, alert stok minimum |
| Sembako: Gudang | ✅ | `src/dashboard/sembako/Gudang.jsx` | Stok per produk FIFO batches, TambahStokSheet, riwayat keluar, supplier inline add |
| Sembako: Penjualan | ✅ | `src/dashboard/sembako/Penjualan.jsx` | Invoice multi-item, pelanggan CRM, supplier CRM, SheetPayment, delivery management |
| Sembako: Pegawai | ✅ | `src/dashboard/sembako/Pegawai.jsx` | CRUD pegawai multi tipe gaji, payroll recording, riwayat, filter bulan/pegawai |
| Sembako: Laporan | ✅ | `src/dashboard/sembako/Laporan.jsx` | Laporan finansial + piutang, PieChart distribusi kategori (recharts) |
| useSembakoData hooks | ✅ | `src/lib/hooks/useSembakoData.js` | 20+ hooks: products, batches, sales, customers, suppliers, deliveries, employees, payrolls, laporan |
| useTheme hook | ✅ | `src/lib/hooks/useTheme.js` | Accent color localStorage + custom event, digunakan AppSidebar + BottomNav + ThemePicker |
| ThemePicker component | ✅ | `src/components/ui/ThemePicker.jsx` | 8 preset swatches, click to apply/deactivate, "Reset ke default" |
| Form Input Audit (Sembako) | ✅ | Semua 5 file sembako | SelectWrap + appearance:none di semua `<select>`: Produk, Penjualan, Gudang, Pegawai, Laporan |

## 25. Scripts & Automation

### Python Scraper — `scripts/ternakos_harga_scraper.py`
- Setup: `pip install -r scripts/requirements.txt` (uses Playwright, undetected_chromedriver, bs4)
- Run: `python scripts/ternakos_harga_scraper.py`
- Fetches prices from pinsarindonesia.com, maps to `market_prices` table in Supabase. Wait time 15-20s.
- **Schedule**: Best run at 12:00 and 18:00 WIB.
- **Database**: Insert/Upsert into `market_prices` table.
- **Dependencies**: `requests`, `beautifulsoup4`, `psycopg2`.

### Edge Function — `supabase/functions/fetch-harga/index.ts`
- **Trigger**: HTTP GET / scheduled cron (dari Supabase scheduler atau eksternal cron).
- **Purpose**: Scrape harga ayam broiler dari chickin.id untuk region Jawa Tengah/DIY.
- **Logic**: Cek duplikat hari ini (`market_prices.source = 'auto_scraper'`) sebelum insert. Parse HTML tabel, ambil `<2.0 kg` weight class, hitung rata-rata. Insert ke `market_prices` dengan `buyer_price = avg_farm_gate + 2500`.
- **Deploy**: `supabase functions deploy fetch-harga --no-verify-jwt`
- **Env vars**: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (auto-injected di Supabase hosted).

### Edge Function — `supabase/functions/verify-invite-code/index.ts`
- **Trigger**: HTTP POST dari `AcceptInvite.jsx` via `supabase.functions.invoke('verify-invite-code', { body: { code } })`.
- **Purpose**: Rate-limit verifikasi kode undangan — mencegah brute-force kode 6 digit.
- **Rate Limit**: Max 5 attempts per IP per 15 menit. Lockout 30 menit setelah limit tercapai.
- **Logic**: Sanitize kode (uppercase alphanumeric 4–12 char) → cek rate limit → query `team_invitations` dengan service role key (bypass RLS) → return invitation + tenant data. On success: reset rate limit counter untuk IP tersebut.
- **Response codes**: `200` (valid), `400` (format salah), `404` (tidak ditemukan), `410` (expired), `429` (rate limited).
- **Deploy**: `supabase functions deploy verify-invite-code --no-verify-jwt`
- **⚠️ Note**: Rate limit store in-memory — direset saat cold start. Untuk produksi enterprise, bisa diganti Redis/DB.

---

## 26. Pricing Structure

### Broker (Ayam, Telur, Distributor Daging)
| Plan | Harga Bulanan | Harga Tahunan |
|------|--------------|---------------|
| **PRO** | Rp 999.000/bln | Rp 799.000/bln (hemat 20%) |
| **BUSINESS** | Rp 1.499.000/bln | Rp 1.199.000/bln (hemat 20%) |
| **ENTERPRISE** | Custom | Custom |

### Peternak (Broiler, Layer)
| Plan | Harga Bulanan | Harga Tahunan |
|------|--------------|---------------|
| **STARTER** | Gratis (trial 14 hari) | — |
| **PRO** | Rp 499.000/bln | Rp 399.000/bln (hemat 20%) |
| **BUSINESS** | Rp 999.000/bln | Rp 799.000/bln (hemat 20%) |
| **ENTERPRISE** | Custom | Custom |

Peternak PRO: 2 kandang + 1 jenis ternak included. Add-on: +Rp 99.000/bln per jenis ternak tambahan (max 2 add-on sebelum lebih hemat upgrade Business).

### RPA (Rumah Potong Ayam)
| Plan | Harga Bulanan | Harga Tahunan |
|------|--------------|---------------|
| **PRO** | Rp 699.000/bln | Rp 559.000/bln (hemat 20%) |
| **BUSINESS** | Rp 1.499.000/bln | Rp 1.199.000/bln (hemat 20%) |
| **ENTERPRISE** | Custom | Custom |

**BUSINESS Tier** = All PRO features + AI Suite (TernakBot AI).

**Diskon tahunan**: 20% off per bulan (configurable via `plan_configs` key `'annual_discount'`).
**Trial**: 14 hari semua plan (configurable via `plan_configs` key `'trial_config'`).

> ⚠️ Harga di atas adalah **nilai default**. Harga aktual dikelola superadmin via `/admin/pricing` dan disimpan di tabel Supabase `pricing_plans`. Selalu query dari DB, JANGAN hardcode di frontend.
>
> Kode diskon dikelola di tabel `discount_codes`. Query via `useDiscountCodes()` dari `useAdminData.js`.

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

## 28. Recent Major Updates

### Updates 2026-03-28

**Form Input Audit — SelectWrap Pattern (Sembako):**
- Semua native `<select>` di 5 file sembako kini memiliki `appearance: 'none'` + `WebkitAppearance: 'none'` pada style object base (`inputStyle` / `sInput` / `inputSt`).
- `SelectWrap` helper component ditambah di setiap file — `position: relative` div + `ChevronDown` ikon overlay `position: absolute, right: 12, pointerEvents: 'none'`.
- Setiap `<select>` diberi `paddingRight: 32–36` agar teks tidak overlap dengan ikon.
- Layout props (`flex: 2`, `width: 'auto'`, `minWidth`) dipindah ke `<SelectWrap style={...}>`, bukan ke `<select>` sendiri.
- File yang diupdate: `Produk.jsx` (1 select), `Penjualan.jsx` (9 selects), `Gudang.jsx` (2 selects), `Pegawai.jsx` (4 selects), `Laporan.jsx` (1 select). Total: **17 select** diperbaiki.

**BottomNav BUSINESS_MODELS Priority Lookup:**
- Fix bug: `BUSINESS_MODELS[tenant.business_vertical]` digunakan sebagai primary lookup, bukan `BUSINESS_MODELS[tenant.user_type]`.
- Penting untuk sembako_broker (orange `#EA580C`) agar tidak jatuh ke warna green broker ayam.
- Rule: color/nav selalu berbasis `business_vertical`, bukan `user_type`.

**useTheme + ThemePicker:**
- `useTheme.js` hook baru: baca/tulis `ternakos_accent_color` di localStorage, broadcast custom event `ternakos-theme-changed` ke semua tab.
- `ThemePicker.jsx`: color swatch grid, preview real-time, persist ke localStorage.
- Diintegrasikan ke halaman Akun masing-masing vertikal.

**NotificationBell Neutral Palette:**
- `NotificationBell.jsx`: badge + panel pakai warna netral (`#1E293B`, `#334155`, `#94A3B8`) — tidak hardcode warna vertikal tertentu.
- Badge: `bg-red-500` untuk unread count. Ikon: `Bell` dari lucide.
- Diintegrasikan di `DesktopTopBar.jsx` + `TopBar.jsx` (dengan `showBell` prop).

**HamburgerDrawer Business Switcher (Sembako):**
- `AppSidebar.jsx`: dropdown user menu di header sidebar — AnimatePresence framer-motion, click-outside close.
- Business switcher: daftar vertikal aktif dari `tenant.business_vertical`, navigasi langsung ke dashboard vertikal lain.

**Peternak Level-2 Routes + FarmContextBar:**
- Route `/peternak/kandang/:farmId/*` diimplementasikan — nested sub-routes per farm.
- `FarmContextBar.jsx`: sticky bar di atas halaman kandang — nama farm, jenis ternak badge, tombol Back.
- Detection: `location.pathname.match(/^\/peternak\/kandang\/([^/]+)/)` di `BrokerLayout.jsx` / sidebar.

**SetupFarm Wizard + FarmCard:**
- `SetupFarm.jsx`: 3-step wizard overlay (position fixed, z-100) muncul saat `peternak_farms.length === 0`.
  - Step 1: Pilih jenis ternak (broiler/layer aktif, domba/kambing/sapi/babi disabled + badge "Segera").
  - Step 2: Pilih model bisnis (MANDIRI: Mandiri Murni, Semi Mandiri; KEMITRAAN: INTI-PLASMA, Kemitraan Pakan, Kemitraan Sapronak).
  - Step 3: Detail farm (`farm_name`, `location`, `capacity`, `kandang_count`; conditional `mitra_company` + `mitra_contract_price` jika kemitraan).
- `FarmCard.jsx`: card per farm — header (nama + livestock badge), business model badge, stats row, cycle status pill, CTA button (Mulai/Lihat Siklus).
- `Beranda.jsx` peternak diupdate: query `peternak_farms` + `breeding_cycles`, render `<SetupFarm>` jika kosong, render `<FarmCard>` grid jika ada.

**businessModel.js Sembako Entry:**
- `sembako_broker` ditambah: `color: '#EA580C'`, `bg: '#1C1208'`, `drawerMenu` 5 item (Beranda, Penjualan, Gudang, Pegawai, Laporan), `bottomNav` 4 item.
- `distributor_sembako` sub_type dipetakan ke `sembako_broker` vertikal.

### Updates 2026-03-27

**Role & Sub-Role Structure Fix:**
- `Distributor Daging` dipindah dari RPA → BROKER (dashboard + vertikal sama dengan Broker Ayam)
- `RPH` (Rumah Potong Hewan) ditambahkan ke RPA — pakai dashboard RPA yang sama
- Sub-type baru: `peternak_broiler`, `peternak_layer`, `rpa_ayam`, `rph`, `distributor_daging`
- `businessModel.js`: ekspor baru `SUB_TYPE_TO_USER_TYPE`, `SUB_TYPE_TO_VERTICAL`, `SUB_TYPE_LABELS`
- `OnboardingFlow.jsx`: replace local helper functions dengan import dari `businessModel.js`

**Onboarding Step1 2-Level (Peternak):**
- `Step1SubTipe.jsx` full rewrite — Peternak kini 2 level:
  - Level 1: pilih hewan (Ayam aktif, lainnya → `WaitlistSheet`)
  - Level 2: pilih jenis ayam (Broiler + Layer aktif, Kampung disabled)
  - AnimatePresence slide kanan masuk / kiri keluar
- BROKER: 3 active cards (Broker Ayam, Broker Telur, Distributor Daging) + 2 disabled
- RPA: RPA Ayam (active) + RPH (waitlist)
- Disabled cards → `WaitlistSheet` bottom modal (email + nama → insert `waitlist_signups`)

**FiturPage + HargaPage 2-Level Tab Refactor:**
- Keduanya pakai `selectedRole` + `selectedSub` state (ganti dari single `activeTab`)
- `handleRoleChange(role)` auto-reset sub ke default (broker→ayam, peternak→ayam, rpa→buyer)
- `contentKey = ${selectedRole}_${selectedSub}` → key AnimatePresence + data lookup
- Sub-tab disabled: `opacity-40 cursor-not-allowed` + badge "Segera"
- FiturPage SUBS: broker(ayam/telur), peternak(broiler/petelur disabled/sapi disabled), rpa([])

**HargaPage Sub-Tab Update:**
- Broker: tambah "Distributor Daging" sub-tab ke-3 (sama pricing Broker Ayam)
- Peternak: rename "Peternak Ayam" → "Ayam Broiler & Layer"; "Peternak Ruminansia" → "Sapi, Kambing, Domba" (disabled)
- RPA: rename "RPA Buyer" → "Rumah Potong Ayam"; replace "Distributor Daging" dengan "RPH" (disabled)

**AdminPricing 4 Tab:**
- Tab baru: "Add-on & Limit" (PlanLimitCard grid + AddonPreview)
- Tab baru: "Trial & Diskon" (trial duration per plan + annual discount config + previewTrialDate)
- `usePlanConfigs()` + `useUpdatePlanConfig()` di `useAdminData.js` — upsert ke `plan_configs`

**Notification System:**
- `useNotifications.js` baru: fetch + Supabase Realtime INSERT subscribe + toast + mark-read/delete
- `useNotificationGenerator()`: auto-create notif piutang jatuh tempo, trial ≤7 hari, stok pakan <100kg
- `NotificationBell.jsx`: animated badge, dropdown panel, TYPE_CONFIG icons, click-outside
- Integrasikan ke `DesktopTopBar.jsx`, `TopBar.jsx` (`showBell` prop), `BrokerLayout.jsx`

### Updates 2026-03-26

**TernakOS Market:**
- Implementasi `/market` — multi-role marketplace B2B, accessible semua role tanpa `requiredType` guard.
- 3 tipe listing: `stok_ayam` (peternak), `penawaran_broker`, `permintaan_rpa`.
- Kontak via WhatsApp saja — tidak ada transaksi dalam app.
- Sheet pasang iklan 2-step: pilih tipe → form detail berbeda per tipe.
- Filter: type chips, search ilike, jenis ayam, lokasi. Listing grouped by type dengan color-coded badges.
- WA normalisasi: `0xx → 62xx`, strip non-digit, min 10 digit.
- Increment `view_count` saat tombol WA diklik.
- `useMarket.js` baru: `useMarketListings`, `useMyListings`, `useCreateListing`, `useCloseListing`, `useDeleteListing`.
- Entry `{ path: '/market', icon: 'Store' }` ditambah di `drawerMenu` semua 3 role di `businessModel.js`.

**Peternak: Stok & Pakan:**
- Implementasi `/peternak/pakan` (sebelumnya ComingSoon).
- Stok pakan dikelola per farm, dikelompokkan by farm dalam tampilan.
- Upsert logic: cek `(tenant_id, peternak_farm_id, feed_type)` → update qty jika ada, insert baru jika belum.
- Sheet Tambah Stok: optional cost tracking ke `cycle_expenses`.
- Sheet Catat Pemakaian: kurangi qty, preview sisa, warning toast jika sisa < 100 kg.
- Alert banner merah di atas halaman jika ada stok menipis (< 100 kg).
- 3 hook baru di `usePeternakData.js`: `useFeedStocks`, `useUpsertFeedStock`, `useReduceFeedStock`.

**Landing Page Interactive Components:**
- `Comparison.jsx`: drag slider interaktif Excel vs TernakOS (sliderPosition%, inner fixed-width fix).
- `TestimonialsNew.jsx`: 3 kolom infinite scroll (CSS `@keyframes scrollUp`), speed berbeda per kolom.
- `LandingPage.jsx` updated: Comparison setelah PainPoints, TestimonialsNew gantikan Testimonials.

**UI Polish (Dashboard):**
- `AppSidebar.jsx`: dropdown user menu custom framer-motion (click-outside, AnimatePresence).
- `TransaksiSuccessCard.jsx`: modal success post-transaksi (SVG check animated, spring transition).
- `input.jsx`: focus ring emerald `focus-visible:ring-1 focus-visible:ring-emerald-500/50`.
- `InputRupiah.jsx`: focus-within shadow emerald glow.
- `button.jsx`: shimmer shine effect pada default variant hover.

**Bug Fixes:**
- `DistribusiDetail.jsx`: hapus duplicate import `useRPAProducts` (line 21).
- `useAdminData.js`: revenue `thisMonth` gunakan `i.paid_at` bukan `i.confirmed_at`.

### Updates 2026-03-25 (Session 2)
**Routing & Navigation Bug Fixes:**
- **`/broker/beranda` blank fix**: Ditambahkan `<Route path="/broker/beranda" element={<RoleRedirector />} />` di `App.jsx`. Route sebelumnya tidak ada, menyebabkan halaman blank.
- **Superadmin redirect fix**: `RoleRedirector` sebelumnya `return null` untuk superadmin. Sekarang redirect ke `<Navigate to="/admin" replace />`. Superadmin login langsung ke `/admin`.
- **`handleBackToDashboard` fix** (`AdminLayout.jsx`): Root cause navigate ke landing page adalah `data?.[0]?.tenants` bisa undefined. Fix: gunakan `.find(p => p.tenants)`, set `localStorage` sebelum `switchTenant()`, await 100ms sebelum navigate, error handling dengan fallback route.

**Form Accessibility Fixes:**
- Ditambahkan `id` + `htmlFor` pada semua form fields di: `FormBeliModal.jsx`, `FormJualModal.jsx`, `FormBayarModal.jsx` (forms/), dan `WizardStepPengiriman.jsx`.
- Input tanpa `id`/`name`: time-hour, time-minute, vehicle_type, vehicle_plate, driver_name, driver_phone.

### Updates 2026-03-25 (Session 1)
**Database & Registration Fix:**
- **Trigger `handle_new_user` Fixed:** Ditambahkan pengecekan `invite_token`. Sekarang pendaftaran via undangan tidak akan lagi membuat tenant "hantu" baru secara otomatis.
- **Data Cleanup:** Dilakukan pembersihan tenant duplikat yang tidak memiliki profile (orphaned tenants) untuk merapikan dashboard admin.

**Admin Phase 6: Global Overview Dashboard:**
- Transformasi total `/admin` (AdminBeranda) menjadi real-time Command Center.
- Integrasi **Recharts**: AreaChart untuk pertumbuhan tenant (6 bulan) dan PieChart untuk distribusi plan.
- Fitur **Actionable Lists**: Monitoring "Trial Akan Habis" (dengan tombol extend cepat) dan "Invoice Pending Terbaru".
- Auto-refresh data tiap 60 detik menggunakan custom hook `useGlobalStats`.

**Admin Phase 5: Pricing & Discounts (Supabase DB Migration):**
- Implementasi `/admin/pricing` untuk manajemen harga per plan (Pro/Business) per vertikal.
- Sistem **Voucher Generator**: Buat kode diskon dengan tipe persentase atau nominal, lengkap dengan kuota dan expiry date.
- ✅ Data dimigrasi ke Supabase DB: tabel `pricing_plans` (harga per role/plan) dan `discount_codes` (voucher).
- Semua `localStorage`-based pricing hooks dihapus dan digantikan dengan Supabase hooks di `useAdminData.js`.

**Admin Phase 4: Monitor Subscription & Invoice:**
- Implementasi baru `/admin/subscriptions` untuk monitoring invoice tenant.
- Fitur **Stat Dashboard** (Pending, Paid Month, Revenue, Failed) khusus superadmin.
- Sistem Konfirmasi Manual: Verifikasi bukti transfer dan update otomatis `trial_ends_at` tenant.
- Pengaturan Rekening Bank: Kelola daftar rekening (BCA, Mandiri, dll) yang aktif untuk mutasi TernakOS.

**Admin Phase 3: Users & Tenant Management:**
- Implementasi penuh `/admin/users` dengan tabel tenant, search, dan multi-tab filtering.
- Fitur **Detail Sheet** untuk edit nama bisnis, ganti paket (Pro/Business), dan perpanjang trial (+14 Hari).
- Monitoring anggota tim (full name, role, last seen) langsung dari panel admin.
- Integrasi global bypass untuk `superadmin` di sidebar, layout, dan menu kuncian.

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

---

## 29. `useGlobalStats` — Admin Overview Hook

Located: `src/lib/hooks/useAdminData.js`

Auto-refresh setiap **60 detik** (`refetchInterval: 60_000`). QueryKey: `['admin-global-stats']`.

**Return shape**:
```js
{
  tenants: {
    total, active, pro, business, starter,
    newThisMonth,
    trialExpiringSoon: [/* array of tenant objects */],  // diff ≤ 7 hari, sorted by trial_ends_at
    byVertical: { poultry_broker, egg_broker, peternak, rpa },
    growthData: [{ month: 'Jan', count: 3 }, ...]        // 6 bulan terakhir
  },
  users: { total, activeThisWeek },
  revenue: {
    total,           // semua invoice paid
    thisMonth,       // paid & confirmed dalam 30 hari
    pendingAmount,   // total invoice pending
    pendingList: [/* max 5, sorted desc by created_at */]
  }
}
```

**Digunakan oleh**: `AdminBeranda.jsx` — renders KPI cards, AreaChart (`growthData`), PieChart (plan distribution), trial-expiring list with "Extend 14hr" button, dan pending invoice list.

---

## 30. TernakOS Market

### Konsep
Platform marketplace B2B internal ekosistem TernakOS. Menghubungkan Peternak → Broker → RPA tanpa transaksi dalam app. Kontak hanya via WhatsApp langsung dari listing.

### 3 Tipe Listing

| Tipe | Aktor | Deskripsi |
|------|-------|-----------|
| `stok_ayam` | Peternak | Jual ayam siap panen ke broker/buyer |
| `penawaran_broker` | Broker | Tawarkan ayam ke RPA/buyer |
| `permintaan_rpa` | RPA | Cari ayam dari broker/peternak |

### Badge Colors
- `stok_ayam` → purple `#A78BFA` / bg `rgba(124,58,237,0.12)`
- `penawaran_broker` → emerald `#34D399` / bg `rgba(16,185,129,0.12)`
- `permintaan_rpa` → amber `#FBBF24` / bg `rgba(245,158,11,0.12)`

### Flow Kontak
```
Klik WA button
  → increment view_count (fire-and-forget, tidak block UI)
  → window.open('https://wa.me/{contact_wa}?text={pesan}', '_blank')

Pesan pre-filled:
  "Halo {contact_name}, saya tertarik dengan listing "{title}" di TernakOS Market."
```

### Validasi WA
```js
function normalizeWA(raw) {
  const digits = raw.replace(/\D/g, '')
  if (digits.startsWith('0'))  return '62' + digits.slice(1)
  if (digits.startsWith('62')) return digits
  return '62' + digits
}
// Min 10 digit setelah normalize
```

### Query Hooks (`src/lib/hooks/useMarket.js`)

| Hook | QueryKey | Deskripsi |
|------|----------|-----------|
| `useMarketListings(filters)` | `['market-listings', filters]` | Semua listing aktif + filter |
| `useMyListings()` | `['my-listings', tenant.id]` | Listing milik tenant aktif |
| `useCreateListing()` | — | Insert baru, auto `tenant_id` dari `useAuth()` |
| `useCloseListing()` | — | Update `status = 'closed'` |
| `useDeleteListing()` | — | Soft delete `is_deleted = true` |

### Filters yang Didukung
```js
// filters object di useMarketListings:
{
  type,          // eq listing_type
  chicken_type,  // eq chicken_type
  search,        // ilike title '%search%'
  location,      // ilike location '%location%'
}
```

### Akses & Navigation
- Route `/market` — `ProtectedRoute` **tanpa** `requiredType` (semua role bisa akses).
- Entry di `drawerMenu` semua 3 role di `businessModel.js`: `{ path: '/market', icon: 'Store', label: 'TernakOS Market' }`.

### Sheet Pasang Iklan (2 Step)
- **Step 1**: Pilih tipe (3 card: Jual Stok / Tawarkan / Cari Ayam)
- **Step 2**: Form detail — field berbeda per tipe:
  - **stok_ayam**: jenis, qty, bobot est., harga, lokasi, deskripsi, kontak, expires
  - **penawaran_broker**: + syarat pembayaran (cash/net3/net7)
  - **permintaan_rpa**: label berubah → "Butuh", "Target Berat", "Budget Harga", "Lokasi Pengiriman"
- Judul auto-generate jika kosong:
  - stok_ayam → `"Stok {chicken_type} siap panen — {location}"`
  - penawaran_broker → `"Penawaran {chicken_type} — {qty} ekor — {location}"`
  - permintaan_rpa → `"Butuh {qty} ekor {chicken_type} — {location}"`

---

*Last updated: 2026-03-28 — Form input audit (SelectWrap pattern 17 selects sembako); BottomNav priority fix; useTheme + ThemePicker; NotificationBell neutral palette; HamburgerDrawer; Peternak Level-2 routes + FarmContextBar; SetupFarm wizard + FarmCard; businessModel.js sembako_broker + distributor_sembako*
