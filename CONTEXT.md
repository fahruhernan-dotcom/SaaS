# TernakOS — Developer Context

> Last updated: 2026-04-10 v5 (Kambing & Domba Penggemukan: full dashboard (DB + hooks + 5 UI pages + LaporanBatch) — migration `20260409_feedlot_kambing_domba.sql`; Kambing & Domba Breeding: full dashboard (DB + hooks + 5 UI pages + LaporanFarm) — migration `20260410_breeding_kambing_domba.sql`; Both use `kd_penggemukan_*` / `kd_breeding_*` table namespaces; businessModel.js updated with teal/green accent colors; PeternakRouter.jsx wired to all new pages) | Use this as reference for all future implementations.

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

## 2. Universal Broker Architecture (UBA)

TernakOS uses a **Vertical-First dynamic routing** pattern. All dashboards for Broker, Peternak, and Rumah Potong share a unified layout system but render specialized components based on the URL segment (`:brokerType`, `:peternakType`, `:rpType`).

### Core Pattern
Role-based routers (`BrokerRouter`, `PeternakRouter`, `RPPageRouter`) act as the entry points. They map logical "pages" (e.g., `pos`, `kandang`) to specific components based on the active vertical.

- **Primary Layouts**: `BrokerLayout`, `PeternakLayout`, `RumahPotongLayout`.
- **Dynamic Segments**:
    - `/broker/:brokerType/*` (e.g., `/broker/distributor_sembako/produk`)
    - `/peternak/:peternakType/*` (e.g., `/peternak/peternak_broiler/siklus`)
    - `/rumah_potong/:rpType/*` (e.g., `/rumah_potong/rpa/order`)

### Navigation Hooks
Selalu gunakan helper di `lib/businessModel.js` untuk navigasi antar halaman agar sub-type tetap konsisten:
- `getVerticalBeranda(tenant, profile)`
- `getXBasePath(tenant, profile)`

---

## 3. Design System & Tokens

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

## 4. Database Overview

> [!IMPORTANT]
> **Primary Source of Truth**: Selalu rujuk ke [DATABASE_STRUCTURE.md](file:///d:/Dokumen/02_Kerja_Profesional/Ternak%20OS/DATABASE_STRUCTURE.md) untuk struktur tabel, enum, dan dependency map yang paling update.

> **Rule**: Use `.select()` only columns that exist. **NEVER insert GENERATED columns.**
> **SQL Migration Rule**: Selalu gunakan `DROP POLICY IF EXISTS "Exact Name" ON table;` sebelum `CREATE POLICY "Exact Name"` untuk memastikan idempotensi.
> **Naming Rule**: Gunakan **Sentence Case** untuk nama policy (contoh: `"Public Read Pricing Plans"`).
> **Safety Rule**: **JANGAN PERNAH** menggunakan `DROP ... CASCADE` (terutama pada FUNCTION) karena dapat menghapus policy RLS secara tidak sengaja.

### `profiles`
- `id`, `tenant_id`, `auth_user_id`, `full_name`, `role` (`'owner'` | `'staff'` | `'manajer'` | `'superadmin'` | `'view_only'` | `'sopir'`)
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

#### Broker RBAC (Broker/RPA verticals)

Pattern wajib di semua komponen broker:
```javascript
const { profile } = useAuth()
const isOwner = profile?.role === 'owner'
const isViewOnly = profile?.role === 'view_only'
const canWrite = ['owner', 'staff'].includes(profile?.role)
```

**Akses per role (broker):**
- **owner**: Semua fitur.
- **Staff**: Beranda, Transaksi, Kandang, Pengiriman, RPA, Harga Pasar.
  - ✗ Tidak bisa: Cash Flow, Armada, Tim & Akses, Simulator.
  - ✗ Tidak bisa: Hapus data, edit data sensitif.
- **View Only**: Beranda, Transaksi, Harga Pasar (semua read-only).
  - ✗ Tidak ada tombol tambah/edit/hapus.
  - ✓ Tampilkan banner "View Only" di setiap halaman.
- **Sopir**: Hanya `/broker/sopir`.
  - ✓ Lihat & update status pengiriman yang di-assign.
- **Superadmin**: Akses penuh ke `/admin`.
  - ✓ Management Tenant, Invoices, Pricing, Vouchers.

#### Peternak RBAC (usePeternakPermissions hook)

Located: `src/lib/hooks/usePeternakPermissions.js`

```javascript
import { usePeternakPermissions } from '@/lib/hooks/usePeternakPermissions'
const p = usePeternakPermissions() // reads profile.role from useAuth()
```

**Roles (hierarchy: owner > manajer > pekerja > view_only)**:
- `owner`: Full access.
- `manajer`: Semua operasional termasuk tutup siklus, hapus siklus, input biaya, catat vaksinasi.
- `pekerja` (maps to `staff`): Input harian, catat vaksinasi. Tidak bisa buat/tutup/hapus siklus, tidak bisa lihat keuangan.
- `view_only`: Baca saja — tidak ada tombol aksi.

**Permission flags:**
| Flag | owner | manajer | pekerja | view_only |
|------|-------|---------|---------|-----------|
| `canInputHarian` | ✓ | ✓ | ✓ | ✗ |
| `canBuatSiklus` | ✓ | ✓ | ✗ | ✗ |
| `canTutupSiklus` | ✓ | ✓ | ✗ | ✗ |
| `canHapusSiklus` | ✓ | ✓ | ✗ | ✗ |
| `canTambahKandang` | ✓ | ✗ | ✗ | ✗ |
| `canViewKeuangan` | ✓ | ✓ | ✗ | ✗ |
| `canInputBiaya` | ✓ | ✓ | ✗ | ✗ |
| `canCatatVaksinasi` | ✓ | ✓ | ✓ | ✗ |
| `canUndangAnggota` | ✓ | ✗ | ✗ | ✗ |
| `showFab` | ✓ | ✓ | ✓ | ✗ |

**Guard components**: `ProtectedRoute`, `RoleGuard`, and `AdminRoute` in `App.jsx`.
```jsx
<RoleGuard allowedRoles={['owner']}>
  <CashFlow />
</RoleGuard>
```

**Route setelah login:**
- owner, staff, view_only (poultry_broker) → `/broker/broker_ayam/beranda`
- owner, staff, view_only (egg_broker) → `/broker/broker_telur/beranda`
- owner, staff, view_only (sembako_broker) → `/broker/distributor_sembako/beranda`
- owner, staff, view_only (peternak_broiler) → `/peternak/peternak_broiler/beranda`
- owner, staff, view_only (rpa) → `/rumah_potong/rpa/beranda`
- sopir → `/broker/:sub_type/sopir`
- superadmin → `/admin`

### `tenants`
- `id`, `business_name`, `plan` (`'starter'` | `'pro'` | `'business'`), `is_active`, `trial_ends_at`
- `business_vertical` (`'poultry_broker'` | `'egg_broker'` | `'peternak'` | `'rumah_potong'` | `'sembako_broker'`) — ⚠️ `'rpa'` sudah dimigrate ke `'rumah_potong'`.
- `sub_type`: text **NOT NULL** — sub-role spesifik (e.g., `'broker_ayam'`, `'peternak_broiler'`, `'rpa'`). Wajib diisi saat onboarding.
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
    <AuthProvider>
      <TooltipProvider>
        <NotificationsProvider>
          <App />
        </NotificationsProvider>
      </TooltipProvider>
      <Toaster theme="dark" position="top-center" richColors duration={3000}
        toastOptions={{ style: { background: '#111C24', border: '1px solid rgba(255,255,255,0.10)', ... } }}
      />
    </AuthProvider>
  </QueryClientProvider>
</StrictMode>
```

- `queryClient` config: `staleTime: 300_000` (5 min), `gcTime: 600_000` (10 min), `retry: 1`
- `AuthProvider` wraps entire app — `getSession()` called exactly once at app startup
- `NotificationsProvider` wraps `App` for realtime notification context
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
| Path | Component | Purpose |
|------|-----------|---------|
| `/` | `LandingPage` | Home landing |
| `/login` | `Login` | Sign in |
| `/register` | `Register` | New account (Step 0) |
| `/invite` | `AcceptInvite` | Team join via 6-digit code |
| `/tentang-kami` | `AboutUs` | Company profile & robot 3D |
| `/fitur` | `FiturPage` | List of features per role |
| `/harga` | `HargaPage` | Pricing tiers |
| `/terms` | `TermsPage` | Terms of Service |
| `/privacy` | `PrivacyPage` | Privacy Policy |
| `/harga-pasar` | `HargaPasarPublic` | Public market price page (no auth, SEO-friendly) |
| `/check-email` | `CheckEmail` | Post-registration notice |
| `/forgot-password` | `ForgotPassword` | Password recovery |
| `/reset-password` | `ResetPassword` | Set new password |
| `/auth/callback` | `AuthCallback` | Supabase auth handler |

#### Onboarding
| Path | Component | Guard |
|------|-----------|-------|
| `/onboarding` | `OnboardingFlow` | `ProtectedRoute` (any role) |

#### Broker Routes (`/broker/:brokerType/*`) — Uses `BrokerLayout`
| Path | Component | Vertical |
|------|-----------|----------|
| `beranda` | `BrokerPageRouter` | Any |
| `transaksi` | `BrokerPageRouter` | Poultry |
| `kandang` | `BrokerPageRouter` | Poultry |
| `pengiriman` | `BrokerPageRouter` | Poultry / Sembako |
| `rpa` | `BrokerPageRouter` | Poultry |
| `rpa/:id` | `BrokerPageRouter` | Poultry (Detail) |
| `cash-flow` | `BrokerPageRouter` | Poultry |
| `armada` | `BrokerPageRouter` | Poultry |
| `simulator` | `BrokerPageRouter` | Poultry |
| `tim` | `BrokerPageRouter` | Any |
| `akun` | `BrokerPageRouter` | Any |
| `pos` | `BrokerPageRouter` | Egg / Sembako |
| `penjualan` | `BrokerPageRouter` | Sembako |
| `toko-supplier` | `BrokerPageRouter` | Sembako |
| `toko-supplier/:type/:id` | `BrokerPageRouter` | Sembako (Detail) |
| `gudang` | `BrokerPageRouter` | Sembako |
| `produk` | `BrokerPageRouter` | Sembako |
| `inventori` | `BrokerPageRouter` | Egg / Sembako |
| `karyawan` | `BrokerPageRouter` | Sembako |
| `laporan` | `BrokerPageRouter` | Sembako |
| `suppliers` | `BrokerPageRouter` | Egg |
| `customers` | `BrokerPageRouter` | Egg |

#### Peternak Routes (`/peternak/:peternakType/*`) — Uses `PeternakLayout`
| Path | Component |
|------|-----------|
| `beranda` | `PeternakPageRouter` |
| `siklus` | `PeternakPageRouter` |
| `input-harian` | `PeternakPageRouter` |
| `pakan` | `PeternakPageRouter` |
| `laporan` | `PeternakPageRouter` |
| `laporan/:cycleId` | `PeternakPageRouter` |
| `akun` | `PeternakPageRouter` |
| `tim` | `PeternakPageRouter` |
| `harga-pasar` | `PeternakPageRouter` |
| `kandang/:farmId/beranda` | `PeternakPageRouter` (Level 2) |
| `kandang/:farmId/siklus` | `PeternakPageRouter` (Level 2) |
| `kandang/:farmId/input` | `PeternakPageRouter` (Level 2) |

#### Rumah Potong (RPA/RPH) Routes (`/rumah_potong/:rpType/*`) — Uses `RumahPotongLayout`
| Path | Component |
|------|-----------|
| `beranda` | `RPPageRouter` |
| `order` | `RPPageRouter` |
| `hutang` | `RPPageRouter` |
| `distribusi` | `RPPageRouter` |
| `distribusi/:customerId` | `RPPageRouter` |
| `laporan` | `RPPageRouter` |
| `akun` | `RPPageRouter` |

#### Shared & Admin Routes
| Path | Component | Guard |
|------|-----------|-------|
| `/market` | `Market` | `ProtectedRoute` |
| `/harga-pasar` | `HargaPasar` | `ProtectedRoute` |
| `/admin` | `AdminBeranda` | `AdminRoute` |
| `/admin/users` | `AdminUsers` | `AdminRoute` |
| `/admin/subscriptions` | `AdminSubscriptions` | `AdminRoute` |
| `/admin/pricing` | `AdminPricing` | `AdminRoute` |
| `/admin/activity` | `AdminActivity` | `AdminRoute` |

#### Legacy Redirects
`/home`, `/dashboard`, `/beranda`, `/broker`, `/broker/beranda`, `/akun`, `/transaksi`, `/rpa-dashboard` → all go through `RoleRedirector`

---

## 7. Multi-Vertical Architecture

Pola routing terstandarisasi: `/{role}/{sub_type}/{page}`

| Role URL        | business_vertical | Sub-type URL          | sub_type            |
|----------------|-------------------|-----------------------|---------------------|
| /broker        | poultry_broker    | /broker/poultry_broker| broker_ayam         |
| /broker        | egg_broker        | /broker/egg_broker    | broker_telur        |
| /broker        | sembako_broker    | /broker/sembako_broker| distributor_sembako |
| /peternak      | peternak          | /peternak/peternak_broiler | peternak_broiler |
| /peternak      | peternak          | /peternak/peternak_layer   | peternak_layer   |
| /peternak      | peternak          | /peternak/peternak_sapi    | peternak_sapi    |
| /peternak      | peternak_kambing_domba_penggemukan | /peternak/peternak_kambing_domba_penggemukan | peternak_kambing_domba_penggemukan |
| /peternak      | peternak_kambing_domba_breeding    | /peternak/peternak_kambing_domba_breeding    | peternak_kambing_domba_breeding    |
| /peternak      | peternak          | /peternak/peternak_babi    | peternak_babi (🔒)|
| /rumah_potong  | rumah_potong      | /rumah_potong/rpa     | rpa                 |
| /rumah_potong  | rumah_potong      | /rumah_potong/rph     | rph                 |

**Router terpusat per role:**
- `BrokerRouter.jsx`   → `src/dashboard/broker/_shared/BrokerRouter.jsx`
- `PeternakRouter.jsx` → `src/dashboard/peternak/PeternakRouter.jsx`
- `RPPageRouter.jsx`   → `src/dashboard/rumah_potong/RPPageRouter.jsx`

**Helper function (wajib dipakai untuk semua navigate):**
- `getBrokerBasePath(tenant)`      → `/broker/${sub_type}`
- `getPeternakBasePath(tenant)`    → `/peternak/${sub_type}`
- `getRPBasePath(tenant)`          → `/rumah_potong/${sub_type}`

---

## 8. Layout System

### `BrokerLayout` (`src/dashboard/layouts/BrokerLayout.jsx`)
- Detects desktop via `useMediaQuery('(min-width: 1024px)')`
- **Desktop**: Wraps children in `DesktopSidebarLayout`
- **Mobile**: `max-w-[480px]` centered container + `BottomNav` (fixed at bottom, 64px)
- Always renders `BusinessModelOverlay` if `profile.business_model_selected === false`
- **Cache Warming Prefetchers** (mount with layout, render `null`):
  - `SembakoPrefetcher` — 10 queries for sembako vertical (sales, products, batches, etc.)
  - `PoultryBrokerPrefetcher` — 5 queries for poultry broker: `['sales', tid]`, `['deliveries', null]`, `['loss-reports']`, `['vehicles', tid]`, `['drivers', tid]`
  - Both prefetchers are `enabled: !!tid` and use same staleTime as main pages → all nav pages load instantly after first visit

### `DesktopSidebarLayout` (`src/dashboard/layouts/DesktopSidebarLayout.jsx`)
- Uses Shadcn `SidebarProvider` → `AppSidebar` + `SidebarInset`
- `SidebarInset` contains `DesktopTopBar` + `<main>` (24px/32px padding, max-w-7xl)

### `DashboardLayout` (in `App.jsx` — for Peternak/RPA)
- Same as `BrokerLayout` but uses `DashboardSidebar`

### `AppSidebar` (Desktop — `src/dashboard/components/AppSidebar.jsx`)
- Logo: `<img src="/logo.png" />` + "TernakOS" + "Broker Dashboard"
- **Tenant Switcher**: 
  - Mendukung multi-bisnis dengan `switchTenant`.
  - Icon dinamis (Lucide) sesuai vertikal (Bird 🐔, Egg 🥚, Home 🏠, Factory 🏭).
  - Tampilan: Nama Bisnis + Label Vertikal di bawahnya.
- **Nav Groups**:
  - UTAMA: Beranda, Transaksi/POS, Kandang/Inventori, Tim.
  - Link dinamis sesuai vertikal aktif (`isPoultry` vs `isEgg`).
- Active state: emerald-500/10 bg, emerald-400 text, 1px emerald border
- **Superadmin Bypass**: 
  - Superadmin bypass role-based filters (`isOwner` = true).
  - Hide trial widget for superadmin, replaced with **🛡️ PLATFORM ADMIN** gold badge.
- Footer: Plan info (shows plan name, trial countdown + progress bar for users), User dropdown (Akun, Admin Panel, Logout)

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

## 9. Business Model Logic

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

| Sub-role | Status | Dashboard |
| :--- | :--- | :--- |
| `peternak_broiler` | ✅ Aktif | Full |
| `peternak_layer` | 🚧 Placeholder | - |
| `peternak_sapi` | 🚧 Placeholder | - |
| `peternak_kambing_domba_penggemukan` | ✅ Aktif | Full (Batch Penggemukan: Beranda, Ternak, Pakan, Kesehatan, Laporan) |
| `peternak_kambing_domba_breeding` | ✅ Aktif | Full (Pembibitan: Beranda, Ternak, Reproduksi, Kesehatan, Pakan, Laporan) |
| `peternak_babi` | 🔒 Coming Soon | - |

- **Broker**: ✅ `broker_ayam`, `broker_telur`, `distributor_daging`, `distributor_sembako` | 🚧 `broker_sapi`
- **RPA**: ✅ `rpa` | 🚧 `rph`

**New sub_type: `distributor_sembako`**:
- `user_type` = `'broker'`, `business_vertical` = `'sembako_broker'`
- Dashboard: `src/dashboard/sembako/Beranda.jsx` (dedicated, bukan Broker Ayam)
- Color accent: `#EA580C` (orange)

> ⚠️ **Rule 50**: Selalu gunakan `SUB_TYPE_TO_USER_TYPE` dan `SUB_TYPE_TO_VERTICAL` dari `businessModel.js`. Jangan hardcode mapping di komponen.

---

## 10. Mobile Navigation

Pattern wajib di semua role dashboard:

1. **BottomNav**: 5 icon utama per role (dynamic from `businessModel.js`).
2. **Hamburger button**: Pojok kiri atas, hanya mobile (`md:hidden`).
   - Toggle `AppSidebar` sebagai Sheet/Drawer.
3. **Business Switcher Mobile**:
   - Sheet bottom dengan list bisnis user.
   - Klik bisnis → `queryClient.clear()` + navigate ke basePath baru.
   - Tombol "+ Tambah Bisnis Baru" di bawah list.
4. **"Ganti Model Bisnis"**: Menu item HANYA tampil di mobile (`md:hidden`).

---

## 11. File Structure Map

```
src/
├── main.jsx                        ← Entry point (StrictMode + QueryClient + Toaster)
├── App.jsx                         ← All routes, ProtectedRoute, RoleRedirector
├── App.css
├── index.css                       ← Font imports, CSS vars, scrollbar, animations
│
├── lib/
│   ├── supabase.js                 ← createClient (env vars)
│   ├── queryClient.js              ← QueryClient (staleTime 5min, gcTime 10min, retry 1)
│   ├── utils.js                    ← cn() (clsx + twMerge)
│   ├── tokens.js                   ← Design tokens (colors, borders)
│   ├── format.js                   ← Formatting + label maps (see §11)
│   ├── businessModel.js            ← BUSINESS_MODELS config + getBusinessModel()
│   └── hooks/
│       ├── useAuth.jsx             ← AuthProvider (React Context) + useAuth() consumer — getSession() called once
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
│       ├── useKdPenggemukanData.js ← Kambing/Domba Penggemukan hooks: useKdBatches, useKdAnimals,
│       │                              useKdWeightRecords, useKdHealthLogs, useKdFeedLogs,
│       │                              useAddKdBatch, useUpdateKdBatch, useAddKdAnimal, useUpdateKdAnimal,
│       │                              useAddKdWeight, useAddKdHealthLog, useAddKdFeedLog, useAddKdSale;
│       │                              Pure KPIs: calcADG, calcFCR, calcMortalitas, calcRCRatio, calcROI
│       └── useKdBreedingData.js   ← Kambing/Domba Breeding hooks: useKdBreedingAnimals,
│                                     useKdBreedingAnimalWeights, useKdBreedingMatings, useKdBreedingBirths,
│                                     useKdBreedingHealthLogs, useKdBreedingFeedLogs, useKdBreedingSales,
│                                     useAddKdBreedingAnimal, useUpdateKdBreedingAnimal, useAddKdBreedingWeight,
│                                     useAddKdBreedingMating, useUpdateKdBreedingMating, useAddKdBreedingBirth,
│                                     useAddKdBreedingHealthLog, useAddKdBreedingFeedLog, useAddKdBreedingSale;
│                                     Pure KPIs: calcBreedingADG, calcConceptionRate, calcLambingRate,
│                                     calcWeaningRate, calcLitterSize, calcLambingIntervalBulan,
│                                     calcMortalitasAnakPreSapih, calcBreedingRCRatio, calcAgeInDays
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
├── admin/
├── broker/
│   ├── poultry_broker/             ← broker ayam (full dashboard)
│   │   ├── Akun.jsx, Armada.jsx, Beranda.jsx, CashFlow.jsx, Kandang.jsx
│   │   ├── Pengiriman.jsx, RPA.jsx, RPADetail.jsx, Simulator.jsx
│   │   ├── SopirDashboard.jsx, Tim.jsx, Transaksi.jsx
│   │   ├── components/             ← Decoupled transaction UI
│   │   │   ├── EditPurchaseSheet.jsx, SaleAuditSheet.jsx, UnifiedTransactionCard.jsx, UpdateDeliverySheet.jsx
│   │   └── pengiriman/             ← Decoupled delivery UI
│   │       ├── CreateLossSheet.jsx, DeliveryCard.jsx, LogisticsDetailSheet.jsx, LossCard.jsx, UpdateArrivalSheet.jsx
│   ├── egg_broker/        ← broker telur (full dashboard)
│   ├── sembako_broker/    ← sembako (full dashboard)
│   └── _shared/           ← BrokerRouter.jsx + komponen shared
├── peternak/
│   ├── broiler/           ← full dashboard
│   ├── layer/             ← placeholder
│   ├── sapi/              ← placeholder
│   ├── kambing_domba/     ← Kambing & Domba (shared species, dual model)
│   │   ├── penggemukan/   ← Penggemukan (batch-based feedlot)
│   │   │   ├── Beranda.jsx, Ternak.jsx, Pakan.jsx, Kesehatan.jsx, LaporanBatch.jsx
│   │   └── breeding/      ← Pembibitan (pedigree + reproductive cycle)
│   │       ├── Beranda.jsx, Ternak.jsx, Reproduksi.jsx, Kesehatan.jsx, Pakan.jsx, LaporanFarm.jsx
│   ├── babi/              ← coming soon (locked)
│   └── PeternakRouter.jsx
├── rumah_potong/
│   ├── rpa/               ← full dashboard (koleksi komponen RPA)
│   ├── rph/               ← placeholder
│   └── RPPageRouter.jsx
└── _shared/
    ├── components/
    ├── forms/
    ├── layouts/
    └── pages/
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

## 12. Key Utilities (`lib/format.js`)

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
| `calcPeternakNetProfit(cycle)` | Net Profit per Siklus Peternak | |
| `calcFCR(cycle)` | Feed Conversion Ratio (ideal < 1.6) | |
| `calcIndeksPerforma(cycle)` | Indeks Performa (ideal > 300) | |

// PETERNAK — Net Profit per Siklus:
calcPeternakNetProfit(cycle)
// = harvestRevenue - cycleExpenses - docCost - feedCost - workerCost

// PETERNAK — Feed Conversion Ratio:
calcFCR(cycle)
// = totalFeedKg / totalHarvestKg (lower = better, ideal < 1.6)

// PETERNAK — Indeks Performa:
calcIndeksPerforma(cycle)
// = (survivalRate × avgWeight × 100) / (FCR × ageDays)
// higher = better, ideal > 300

Import:
```js
import { 
  calcNetProfit,        // Broker
  calcRemainingAmount,  // Broker
  calcPeternakNetProfit, // Peternak
  calcFCR,              // Peternak
  calcIndeksPerforma    // Peternak
} from '@/lib/format'
```

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

## 13. React Query Keys

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
| `['kd_penggemukan_batches', tenantId]` | `useKdBatches()` | Daftar batch penggemukan |
| `['kd_penggemukan_animals', tenantId]` | `useKdAnimals()` | Hewan per batch |
| `['kd_penggemukan_weight_records', tenantId]` | `useKdWeightRecords()` | Riwayat timbang penggemukan |
| `['kd_penggemukan_health_logs', tenantId]` | `useKdHealthLogs()` | Log kesehatan penggemukan |
| `['kd_penggemukan_feed_logs', tenantId]` | `useKdFeedLogs()` | Log pakan penggemukan |
| `['kd_breeding_animals', tenantId]` | `useKdBreedingAnimals()` | Master hewan breeding (+ pedigree join) |
| `['kd_breeding_weight_records', 'animal', animalId]` | `useKdBreedingAnimalWeights(id)` | Riwayat timbang per-ekor breeding |
| `['kd_breeding_mating_records', tenantId]` | `useKdBreedingMatings()` | Catatan perkawinan |
| `['kd_breeding_births', tenantId]` | `useKdBreedingBirths()` | Catatan kelahiran (partus) |
| `['kd_breeding_health_logs', tenantId]` | `useKdBreedingHealthLogs()` | Log kesehatan breeding |
| `['kd_breeding_feed_logs', tenantId]` | `useKdBreedingFeedLogs()` | Log pakan breeding (per kandang) |
| `['kd_breeding_sales', tenantId]` | `useKdBreedingSales()` | Penjualan bibit/afkir |

After mutations, invalidate relevant keys. The wizard invalidates: `broker-stats`, `purchases`, `sales`, `deliveries`, `rpa-clients`.
Peternak mutations invalidate: `active-cycles`, `all-cycles`, `peternak-farms`, `daily-records`, `farm-workers`, `worker-payments`, `feed-stocks`.
KD Penggemukan mutations invalidate: `kd_penggemukan_batches`, `kd_penggemukan_animals`, `kd_penggemukan_weight_records`, `kd_penggemukan_health_logs`, `kd_penggemukan_feed_logs`.
KD Breeding mutations invalidate: `kd_breeding_animals`, `kd_breeding_mating_records`, `kd_breeding_births`, `kd_breeding_health_logs`, `kd_breeding_feed_logs`, `kd_breeding_sales`.
Market mutations invalidate: `market-listings`, `my-listings`.

---

## 14. Custom Components

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

## 15. Animation System

Pre-built Framer Motion variants:
- `fadeUp` — Opacity 0→1, Y 32→0
- `fadeIn` — Opacity 0→1
- `staggerContainer` — stagger 0.09s, delay 0.1s
- `scaleIn` — Opacity 0→1, Scale 0.92→1
- `slideLeft` — Opacity 0→1, X -40→0
- `slideRight` — Opacity 0→1, X 40→0

---

## 16. TransaksiWizard Flow

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


---

## 17. Hooks: useAuth & Session

Located: `src/lib/hooks/useAuth.jsx` (**Note: `.jsx` — file exports JSX via AuthProvider**)

**Architecture**: `useAuth()` is a **React Context consumer**, NOT a standalone hook.
- `AuthProvider` in `main.jsx` wraps the entire app.
- `getSession()` is called exactly once at app startup — NOT per component.
- All components share one auth state via context.
- ⚠️ **NEVER** add `useEffect + getSession()` inside a component — that was the old pattern.

```jsx
// In main.jsx (required — wraps entire app)
import { AuthProvider } from './lib/hooks/useAuth'
// <AuthProvider> wraps <App /> inside <QueryClientProvider>

// In any component
import { useAuth } from '@/lib/hooks/useAuth'
const { user, profile, tenant, loading, refetchProfile } = useAuth()
```

- `user` — Supabase auth user
- `profile` — Profile aktif (dari `profiles` table joined dengan `tenants(*)`)
- `profiles` — Daftar seluruh profile bisnis milik user tersebut
- `tenant` — Shorthand `profile?.tenants`
- `loading` — true while fetching session/profile (only false after `fetchAllProfiles()` completes)
- `switchTenant(tenantId)` — Mengganti konteks bisnis aktif & persist ke localStorage
- `refetchProfile()` — manually re-fetch profile (used after BusinessModelOverlay)

---

## 18. Hooks: useUpdateDelivery

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

## 19. Hooks: useCashFlow

Located: `src/lib/hooks/useCashFlow.js`

**Params**: `(startDate, endDate, tenantId)`

**Fetches**: `sales`, `purchases`, `deliveries`, `loss_reports`, `extra_expenses`, `vehicle_expenses` (all within date range)

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

### CashFlow.jsx — History Transparency

Log histori `allTransactions` **tidak lagi menggabungkan biaya operasional menjadi 1 baris Jual/Beli secara tersembunyi**. 
Biaya ekstra (ongkir penjualan, ongkir pembelian kendaraan eksternal, biaya lain-lain pas beli) dan biaya perawatan dari modul Armada (`vehicle_expenses`) **otomatis dipecah (diekstrak)** menjadi item-item transaksi mandiri dengan tipe elemen log `extra`.
Tujuan: Agar detail pengeluaran cash flow 100% transparan per baris ledger, bukan agregasi kasar.

### CashFlow.jsx — Period Filters

Filter tersedia di `CashFlow.jsx` (UI layer, bukan hook):
| Filter | Logika |
|--------|--------|
| `Hari Ini` | `startOfDay(today)` .. `endOfDay(today)` |
| `Minggu Ini` | `startOfWeek(today)` .. `endOfWeek(today)` |
| `Bulan Ini` | `startOfMonth(today)` .. `endOfMonth(today)` |
| `Bulan Lalu` | `startOfMonth(subMonths(today,1))` .. `endOfMonth(subMonths(today,1))` |
| `Keseluruhan` | Dari `tenant.created_at` (awal) .. `new Date()` (sekarang). *Deteksi auto-fallback ke `transaction_date` dibuang agar valid* |
| `Custom` | `customRange.from` .. `customRange.to` (DatePicker) |

⚠️ **`Keseluruhan` Performance Note**: Karena rentang bisa mencakup bertahun-tahun, grafik harian Recharts di-render dengan O(N) map dictionary (`salesByDate`, `expensesByDate`) bukan nested `.filter()` iteration, untuk menghindari freeze UI pada dataset besar.


## 20. Known Rules & Gotchas


1. **NEVER insert generated columns**: `total_modal`, `net_revenue`, `remaining_amount`, `gross_profit`, `net_profit`, `shrinkage_kg`, `broker_margin`, `total_cost` (sembako_stock_batches), `total_pay` (sembako_payroll)
2. **broker_connections**: pakai `requester_tenant_id` + `target_tenant_id` (bukan `peternak_tenant_id`/`broker_tenant_id` lama)
3. **calcPeternakNetProfit()**: wajib untuk semua kalkulasi profit peternak
4. **calcFCR() + calcIndeksPerforma()**: tersedia di `@/lib/format`
5. **market_listings view_count**: pakai RPC `increment_listing_view()` — JANGAN pakai `.update({ view_count: listing.view_count + 1 })`
6. **Register**: pakai `waitForProfile()` retry polling, bukan `setTimeout 1500ms`
7. **Business switcher**: `invalidateQueries` spesifik, bukan `queryClient.clear()`
8. **Rate limit invite code**: tersimpan di tabel `invite_rate_limits` (DB), bukan in-memory Map
9. **JANGAN hardcode broker_connections** dengan `peternak_tenant_id`/`broker_tenant_id`
10. **JANGAN increment view_count** dengan read-then-write dari frontend
11. **`formatDate` must be the safe version** from `lib/format.js`
12. 🚨 **NEVER USE `DROP FUNCTION ... CASCADE`**: When updating Supabase helper functions (like `get_my_tenant_id`), ALWAYS use `CREATE OR REPLACE FUNCTION`. Using `DROP FUNCTION ... CASCADE` will silently and instantly delete ALL dependent RLS policies across the entire database, causing massive `new row violates row-level security policy` errors and shutting down the tenant isolation.
13. **ESLint is strict** — `useEffect` with setState triggers error; prefer derived values
14. **Tailwind `font-body` string must NOT have extra quotes**
15. **Database Naming**: `market_prices` pakai `price_date` bukan `date`.
16. **Null Fallbacks**: `avg_buy_price`/`avg_sell_price` bisa null — fallback ke `farm_gate_price`/`buyer_price`.
17. **Soft Delete**: Gunakan `is_deleted=true`, bukan hard delete (kecuali di Recycle Bin).
18. **Recycle Bin**: Tersedia di `Akun.jsx` untuk restore data yang terhapus (sales, farms, rpa, deliveries).
19. **`buyer_type` in DB is lowercase**: `'rpa'`, `'pedagang_pasar'`, etc.
20. **`payment_status` values**: `'lunas'`, `'belum_lunas'`, `'sebagian'`
21. **`payment_terms` values**: `'cash'`, `'net3'`, `'net7'`, `'net14'`, `'net30'`
22. **Vehicle/Driver status values**: `'aktif'`, `'tidak_aktif'`
23. **Chicken batch status values**: `'growing'`, `'ready'`, `'booked'`, `'sold'`
24. **Order status values**: `'open'`, `'matched'`
25. **Shadcn Calendar** requires explicit install: `npx shadcn@latest add calendar`
26. **Import aliases**: `@/` resolves to `src/` (Vite alias)
27. **State mutations on unmount**: Ensure `finally` blocks handle unmounted components correctly
28. **Wizard transport_cost**: Set to `0` in purchase insert — delivery costs now tracked in `deliveries` table
29. **Mortality auto-report**: `useUpdateDelivery.updateTiba()` auto-creates `loss_reports` for mortality > 0
30. **Toast dark styling**: Sonner toaster configured globally with custom dark card styles in `main.jsx`
31. **Arrival Sheet Redesign**: `UpdateArrivalSheet` in `Pengiriman.jsx` reorganized into a specific **7-row responsive layout**. Includes bidirectional sync between "Ekor Tiba" and "Ekor Mati" based on `initial_count`.
32. **Financial Standardization (2026-03-20)**: Selalu gunakan `sale.total_revenue` langsung untuk pendapatan (Bobot Tiba × Harga), JANGAN hitung ulang dari `total_weight_kg` (bobot awal/kirim).
33. **RPA Outstanding Calculation**: Perhitungan saldo/piutang di detail page (`RPADetail.jsx`) harus menggunakan `calcRemainingAmount(s)` di frontend. Jangan mengandalkan kolom `remaining_amount` di database karena mungkin masih menggunakan kalkulasi bobot awal.
34. **`team_invitations` tidak punya `is_deleted`** — jangan filter `.eq('is_deleted', false)`.
35. **`team_invitations.expires_at`** — nama kolom `expires_at` BUKAN `expired_at`.
36. **`team_invitations.email` nullable** — jangan insert email saat generate kode.
37. **RBAC pattern** — selalu cek `profile.role` sebelum render tombol aksi sensitif.
38. **`invite_token` di `signUp` metadata** — wajib dikirim agar trigger DB handle join tenant.
39. **View Only banner** — tampilkan di setiap halaman yang bisa diakses `view_only`.
40. **Revenue WAJIB dari bobot TIBA** — total_revenue harus selalu dihitung dari arrived_weight_kg × price_per_kg, BUKAN dari initial_weight_kg (bobot kirim), total_weight_kg (bobot awal di purchases), atau quantity × avg_weight_kg (estimasi ekor).
41. **Ekor (count) hanya informasi** — arrived_count, initial_count, mortality_count TIDAK BOLEH dipakai untuk kalkulasi uang apapun. Ekor hanya untuk: tracking kematian, estimasi stok, data kandang.
42. **Update total_revenue saat catat kedatangan** — di `useUpdateDelivery.js` dan `UpdateArrivalSheet.jsx`, setelah arrived_weight_kg tersimpan, wajib update: `sales.total_revenue = arrived_weight_kg × price_per_kg`.
43. **Query invalidation setelah update revenue** — wajib invalidate: `['sales']`, `['sales', tenant.id]`, `['deliveries']`, `['deliveries', tenant.id]` agar semua halaman (Beranda, Transaksi, CashFlow, RPA) langsung update.
44. **Superadmin Access**: Hanya profile dengan `role='superadmin'` DAN email `fahruhernansakti@gmail.com` yang bisa mengakses `/admin/*`. Redirect otomatis di `RoleRedirector` → `/admin`. Return `null` (do nothing) sudah dihapus.
45. **`/broker/beranda` route**: Ditangani oleh `RoleRedirector` (bukan `BrokerBeranda`) — akan redirect ke vertical yang benar sesuai `business_vertical` tenant aktif. Jangan link langsung ke `/broker/beranda` tanpa memastikan RoleRedirector tersedia.
46. **`handleBackToDashboard` di AdminLayout**: Selalu ambil tenant via Supabase query (`.find(p => p.tenants)`), set `localStorage` sebelum `switchTenant()`, await 100ms sebelum navigate, fallback ke `/broker/poultry_broker/beranda`. Jangan gunakan `data?.[0]?.tenants` (bisa jadi row pertama tidak punya tenant).
47. **Form Accessibility**: Semua `<input>`, `<select>`, `<textarea>` wajib punya `id` and `name`. Semua `<label>` wajib punya `htmlFor` yang cocok dengan `id` input-nya. Berlaku untuk FormBeliModal, FormJualModal, FormBayarModal, WizardStepPengiriman, and all other forms.
48. **FCR Formula Peternak**: FCR Final = `total_feed_kg ÷ total_harvest_weight_kg` (dari `harvest_records`). Bukan dari `current_count`. IP Score = `(survival_rate × avg_weight_kg) ÷ (FCR × age_days) × 100`. Selalu ambil `final_fcr` dari DB jika tersedia.
49. **worker_payments tidak punya cycle_id**: Filter berdasarkan `worker_id IN [workers milik farm]` + `payment_date BETWEEN start_date AND harvest_date`. Jangan asumsi ada kolom `cycle_id` di `worker_payments`.
50. **peternak_farms kolom baru**: `livestock_type` (enum: `ayam_broiler`, `ayam_petelur`), `business_model` (enum: `mandiri_murni`, `mandiri_semi`, `mitra_penuh`, `mitra_pakan`, `mitra_sapronak`), `mitra_company`, `mitra_contract_price`. Gunakan nilai lowercase persis ini saat INSERT.
51. **breeding_cycles kolom tambahan**: `current_count`, `start_date`, `estimated_harvest_date` ada di DB tapi belum terdokumentasi di schema awal. Selalu include saat INSERT di SiklusSheet. Lihat DATABASE_STRUCTURE.md untuk schema lengkap.
52. **AcceptInvite verifikasi kode via Edge Function**: Sejak H-2 fix, `verifyCode()` di `AcceptInvite.jsx` TIDAK query `team_invitations` langsung — gunakan `supabase.functions.invoke('verify-invite-code', { body: { code } })`. Handle status 429 → `isLocked=true`, disable input. Status 404/410 → toast normal.
53. **verify-invite-code returns `token` field**: Response Edge Function include `invitation.token` agar `handleRegister` bisa kirim `invite_token` ke `signUp` metadata. Jangan hapus field ini dari response.
54. **Peternak Beranda — FarmCard grid**: Beranda.jsx menampilkan `<FarmCard>` grid dari `farmList`. `activeCycle` di-pass with `age_days` dihitung via `calcCurrentAge(cycle.start_date)` karena DB tidak menyimpan `age_days` di `breeding_cycles`. Jika `farmList.length === 0` → render `<SetupFarm>` overlay fullscreen.
55. **tenant_update RLS recursion** — WITH CHECK yang query tabel `tenants` dari dalam policy `tenants` → infinite recursion → 500 error saat PATCH. Policy `tenant_update` sekarang hanya pakai USING tanpa WITH CHECK kompleks. Security fix C-1 (blokir self-upgrade plan) re-implementasi via Edge Function.
56. **handle_new_user() trigger tidak guaranteed** — Supabase trigger kadang delay atau tidak jalan sama sekali (jarang tapi bisa terjadi). `Register.jsx` wajib verifikasi profile terbuat setelah `signUp()` with delay 1500ms + query `profiles`. Jika null → tampilkan error, JANGAN navigate ke onboarding.
57. **Login loop prevention** — Jika profile null setelah login berhasil, JANGAN redirect ke `/onboarding` karena akan loop balik ke `/login`. Wajib: cek profile ada → jika null → `signOut()` + toast error.
58. **email_confirmed_at untuk testing** — Jika "Enable email confirmations" OFF di Supabase dashboard, user bisa login langsung. Jika ada user yang stuck, fix via SQL: `UPDATE auth.users SET email_confirmed_at = now() WHERE email = '...';` — JANGAN include `confirmed_at` (generated column).
59. **Register flow wajib verifikasi trigger** — Setelah `signUp()`, tunggu 1500ms lalu query `profiles`. Jika profile tidak ada = trigger gagal. Jangan silent fail — tampilkan toast error yang actionable.
60. **Sub-type mapping wajib dari businessModel.js** — Selalu import `SUB_TYPE_TO_USER_TYPE` and `SUB_TYPE_TO_VERTICAL` dari `lib/businessModel.js`. Jangan hardcode mapping di komponen manapun. Ini single source of truth for converting sub_type → user_type / vertical.
61. **Peternak onboarding Step1 = 2 level** — Level 1: pilih hewan (Ayam aktif, lainnya waitlist sheet). Level 2 (hewan==='ayam'): pilih jenis (Broiler + Layer aktif, Kampung disabled). Back button returns to Level 1 with AnimatePresence slide.
62. **Distributor Daging = sub_type='distributor_daging', user_type='broker'** — Pakai dashboard Broker Ayam yang sama (vertikal `poultry_broker`). Bukan RPA. Ada di BROKER sub-tab di HargaPage dan FiturPage.
63. **RPH = sub_type='rph', user_type='rpa'** — Pakai dashboard RPA yang sama (vertikal `rpa`). Nama berbeda saja. RPH = Rumah Potong Hewan (ruminansia). Saat ini disabled/waitlist.
64. **plan_configs table** — Key-value store global for all config items that can be shifted by admin: `kandang_limit`, `addon_pricing`, `trial_config`, `annual_discount`, `team_limit`. Config-value is jsonb. Admin shifts via AdminPricing tab "Add-on & Limit" + "Trial & Diskon". Hook: `usePlanConfigs()` + `useUpdatePlanConfig()` in `useAdminData.js`.
65. **Add-on Peternak PRO** — +Rp 99.000/bln per jenis ternak aktif tambahan (di luar 1 jenis yang included). Max 2 add-on before suggesting upgrade to Business (more efficient). Config in `plan_configs` key `'addon_pricing'`.
66. **Kandang limit enforcement** — `tenants.kandang_limit` must be checked before allowing adding a new farm in Peternak. Default: starter=1, pro=2, business=99. Config via `plan_configs` key `'kandang_limit'`.
67. **SelectWrap pattern mandatory for all `<select>`** — Always wrap `<select>` with `<SelectWrap>` (local helper component) which adds a `<ChevronDown>` overlay. Add `appearance: 'none'` and `WebkitAppearance: 'none'` to base style object. Add `paddingRight: 32–36` to select to avoid text overlapping the icon. Pattern applied in all 5 sembako files (Produk, Penjualan, Gudang, Pegawai, Laporan). Applies for all verticals.
68. **`SelectWrap` component template**:
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
69. **BottomNav `BUSINESS_MODELS` priority** — Use `BUSINESS_MODELS[tenant.business_vertical]` before `getBusinessModel(profile.user_type, profile.sub_type)`. Ensures sembako_broker gets orange accent instead of default green broker.
70. **`useTheme` hook** — localStorage key: `'ternakos_accent_color'`. Custom event: `'ternakos-theme-changed'`. Used in AppSidebar, BottomNav, ThemePicker. Reset to default with `clearAccentColor()`.
71. **Sembako Palette** — `#06090F` bg, `#1C1208` card, `#231A0E` input, `#EA580C` accent, `#FEF3C7` text, `#92400E` muted, `rgba(234,88,12,0.15)` border. All sembako files use this palette. Do not use emerald/green in sembako.
72. **Peternak Level-2 routes** — `/peternak/kandang/:farmId/*` are Level-2 routes (per-farm context).
73. **SetupFarm overlay** — Appears in `Beranda.jsx` Peternak if `farms.length === 0` after loading completes.
74. **Sembako `useSembakoData.js`** — All hooks available at `@/lib/hooks/useSembakoData`. Semua READ hooks wajib menggunakan `useAuth()` untuk mendapat `tenant` dan menambahkan `.eq('tenant_id', tenant.id)` di setiap query. Ini mencegah data dari bisnis lain bocor saat user memiliki multi-tenant.
75. **HamburgerDrawer sembako** — Mobile only. Contains ThemePicker, menu shortcuts, bottom actions.
76. **Routing**: Gunakan `getXBasePath(tenant)` hanya di komponen LUAR route (e.g. redirector, sidebar). Di dalam komponen yang sudah di-render di dalam route `/broker/:brokerType/*`, WAJIB pakai `useParams()` → `brokerType` → `brokerBase = \`/broker/${brokerType}\`` untuk menghindari fallback ke `broker_ayam` saat tenant belum loaded.
77. **Vertikal RPA**: Code `'rpa'` is abandoned → use `'rumah_potong'`.
78. **sub_type NOT NULL**: Required before inserting new tenant/onboarding.
79. **Redirect Login**: Redirect to `/{role}/{sub_type}/beranda`.
80. **Business Switcher**: Must call `queryClient.clear()` before navigating.
81. **Anti-Hardcode**: DO NOT hardcode paths like `'/broker/beranda'` or `'/peternak/beranda'` — must include sub_type.
82. **Poultry Broker Sheet pattern**: All `SheetContent` in Poultry Broker module MUST use `side="right"`, BUKAN `side="bottom"`.
83. **`CreateExtraExpenseSheet` scope**: It **must** have its own `const isDesktop = useMediaQuery('(min-width: 1024px)')`.
84. **`DatePicker.jsx` — locale import conflict**: MUST rename `id` locale to `idLocale`.
85. **Sembako RLS enforcement — SEMUA tabel**: Seluruh 33+ tabel (termasuk `sembako_deliveries` yang sebelumnya pakai `my_tenant_id()`+`my_role()`) sudah diproteksi via `20260401_fix_all_rls_bulletproof.sql` dengan pattern `tenant_id IN (SELECT tenant_id FROM profiles WHERE auth_user_id = auth.uid())`. JANGAN gunakan `get_my_tenant_id()`, `my_tenant_id()`, atau `my_role()` — semua fungsi ini broken untuk multi-tenant.
86. **Sembako date filter — calendar-exact**: `Minggu Ini` and `Bulan Ini` filters use `startOfWeek`/`endOfWeek`.
87. **Database Migration Pattern**: Semua perubahan database (RLS, table, trigger) WAJIB menggunakan pattern `DO $$ BEGIN ... END $$` dengan pengecekan `IF NOT EXISTS` untuk memastikan idempotensi dan mencegah error redundansi.
88. **File Integrity Guarantee**: Saat melakukan modifikasi file besar (seperti `Penjualan.jsx`), JANGAN PERNAH menduplikasi tail-end file. Selalu verifikasi bahwa export komponen tetap tunggal di akhir file untuk mencegah `SyntaxError` atau `ReferenceError`.
89. **Sembako Payment Reference**: `sembako_payments` menggunakan kolom `reference_number`, bukan `reference_no`. Selalu gunakan `reference_number` di hook dan UI.
90. **Sembako Delivery Constraint**: Tabel `sembako_deliveries` TIDAK memiliki kolom `customer_id`. Relasi ke customer dilakukan via `sale_id`. JANGAN mencoba menyisipkan `customer_id` ke tabel ini (Bad Request 400).
91. **Sembako Stock Batching**: `sembako_stock_batches` menggunakan `total_cost` sebagai generated column (`qty_masuk * buy_price`). Jangan pernah menyisipkan nilai manual ke kolom ini.
92. 🚨 **JANGAN pakai `get_my_tenant_id()` untuk RLS Sembako**: Fungsi helper ini hanya return 1 tenant (via `LIMIT 1`). Jika user punya >1 profil (multi-tenant), INSERT ke tenant non-primary akan selalu gagal 403. Gunakan pattern `tenant_id IN (SELECT tenant_id FROM profiles WHERE auth_user_id = auth.uid())` untuk semua sembako sub-tables.
93. **useSembakoData.js wajib `useAuth()`**: Semua query hooks di `useSembakoData.js` (Products, StockBatches, AllBatches, StockOut, Customers, Suppliers, Sales, Employees, DashboardStats) wajib `const { tenant } = useAuth()` + `.eq('tenant_id', tenant.id)` + `queryKey` include `tenant?.id` + `enabled: !!tenant?.id`. Ini mencegah data antar bisnis bercampur di sisi frontend.
94. **RLS Policy naming convention**: Semua policy sembako sub-tables menggunakan format `tenant_isolation_sembako_{table_name}`. Contoh: `tenant_isolation_sembako_stock_batches`, `tenant_isolation_sembako_payroll`, `tenant_isolation_sembako_stock_out`.
95. **Migration file `20260401_fix_nested_rls.sql`**: Berisi cleanup 3 jenis policy lama (`Inherited Tenant Policy`, `Tenants Access Policy`, `tenant_isolation_*`) sebelum membuat ulang policy bulletproof. File ini wajib dijalankan di Supabase SQL Editor jika error `42501` muncul di tabel-tabel sembako.
96. 🚨 **`sembako_employees.status` bukan `is_active`**: Kolom aktifitas pegawai adalah `status` (text: `'aktif'` | `'nonaktif'`), BUKAN boolean `is_active`. Selalu filter dengan `e.status === 'aktif'` di frontend dan `.eq('status', 'aktif')` di query. Menggunakan `e.is_active !== false` selalu lolos semua pegawai (undefined !== false = true).
97. **`sembako_products` punya `secondary_unit` + `conversion_rate`**: Ditambahkan via migration `20260401_sembako_products_unit_conversion.sql`. Keduanya nullable. Saat insert, WAJIB konversi empty string ke null: `conversion_rate: form.conversion_rate ? Number(form.conversion_rate) : null`. Tanpa ini → error `22P02 invalid input syntax for type numeric: ""`.
98. 🚨 **FIFO WAJIB insert ke `sembako_stock_out`**: `useCreateSembakoSale` harus insert satu record ke `sembako_stock_out` per batch yang terdeduct (fields: `tenant_id`, `product_id`, `batch_id`, `sale_id`, `qty_keluar`, `buy_price`, `reason: 'sale'`). Tanpa ini, `useDeleteSembakoSale` tidak bisa mengetahui batch mana yang harus di-restore, sehingga stok tidak pernah kembali setelah sale dihapus. Kolom adalah `qty_keluar` (BUKAN `qty_out`).
99. **`useSoftDeleteSembakoProduct` cascade ke batches**: Saat produk di-soft-delete, semua `sembako_stock_batches` dengan `product_id` tersebut ikut di-soft-delete (`is_deleted: true`). Ini agar `Total Pembelian Stok` di TokoSupplier.jsx tidak menghitung batch dari produk yang sudah dihapus.
100. **`BrokerLayout` dual prefetchers**: `BrokerLayout.jsx` memiliki DUA prefetcher: `SembakoPrefetcher` (untuk `distributor_sembako`, 10 queries) dan `PoultryBrokerPrefetcher` (untuk non-sembako broker, 5 queries: sales, deliveries, loss-reports, vehicles, drivers). Keduanya di-render di level layout sehingga data tersedia sebelum user navigasi ke halaman manapun. Gunakan `{!isSembako && <PoultryBrokerPrefetcher />}` / `{isSembako && <SembakoPrefetcher />}` pattern.
101. **Gunakan `useParams` bukan `getXBasePath(tenant)` di route components**: `getXBasePath(tenant)` returns `/broker/broker_ayam` jika `tenant` belum loaded (null). Di dalam komponen yang sudah di-render dalam route `/broker/:brokerType/*`, selalu pakai `const { brokerType } = useParams()` dan `brokerBase = \`/broker/${brokerType}\`` untuk navigasi. Ini mencegah user yang klik tombol saat loading diarahkan ke route yang salah.
102. **`20260401_fix_all_rls_bulletproof.sql`** — Migration terbaru yang fix SEMUA 33+ tabel sekaligus termasuk `sembako_deliveries` (sebelumnya pakai `my_tenant_id()`+`my_role()`, berbeda dari `get_my_tenant_id()`). Setelah migration ini dijalankan dan verified 0 rows di query check, tidak ada lagi tabel yang pakai fungsi-fungsi tersebut. Ini final state RLS untuk semua tabel.
103. **`useSembakoLaporan` gunakan `other_cost` bukan `total_other_cost`**: Kolom di `sembako_sales` adalah `other_cost`. Bug lama menggunakan `i.total_other_cost` → selalu `undefined` → net profit laporan selalu lebih besar dari seharusnya.
104. **`toWaLink(phone, encodedText?)` — WAJIB untuk semua tombol WhatsApp**: Located di `src/dashboard/broker/sembako_broker/components/sembakoSaleUtils.jsx`. Normalizes Indonesian phone: strip non-digit, `0xx → 62xx`, `+62xx → 62xx`. Returns `https://wa.me/62xxx` atau `https://wa.me/62xxx?text=...` (if encodedText provided). JANGAN gunakan `phone.replace(/[^0-9]/g, '')` langsung — tidak handle prefix `0`. Return `null` jika phone kosong.
    ```js
    import { toWaLink } from '@/dashboard/broker/sembako_broker/components/sembakoSaleUtils'
    window.open(toWaLink(phone, encodeURIComponent(msg)), '_blank')
    ```
105. **`AuthApiError: Invalid Refresh Token`** — normal Supabase session expiry, bukan code bug. Fix: user login ulang. Tidak perlu code change. Terjadi ketika token expired (biasanya setelah idle lama).
106. **`useAuth()` must be inside `<AuthProvider>`** — throwing `useAuth must be used inside <AuthProvider>` berarti komponen di-render di luar tree `AuthProvider`. Cek `main.jsx` — semua children harus wrapped di `<AuthProvider>`. Error ini tidak akan muncul dalam normal flow karena `<App />` selalu di dalam `<AuthProvider>`.
107. **Peternak `manajer` role** — Ditambahkan via migration `20260408_add_manajer_role.sql`. Harus sudah dijalankan di Supabase. Role ini khusus peternak — setara `staff` di broker tapi dengan akses tambahan (bisa tutup/hapus siklus, view keuangan).
108. **`BrokerPageSkeleton.jsx`** — Centralized skeleton file di `src/components/ui/BrokerPageSkeleton.jsx`. Export: `BerandaSkeleton`, `TransaksiSkeleton`, `PengirimanSkeleton`, `RPASkeleton`, `KandangSkeleton`, `TimSkeleton`, `ArmadaSkeleton`, `CashFlowSkeleton`, `RPADetailSkeleton`, `GenericPageSkeleton`. Gunakan ini — jangan buat skeleton inline per halaman.
109. **`SembakoInvoiceCard` outer wrapper is `<div role="button">`, NOT `<button>`** — Karena card berisi `<button>` (Atur Pengiriman) di dalamnya. Nested `<button>` inside `<button>` is invalid HTML. Pattern: `<div role="button" tabIndex={0} onClick={...} onKeyDown={(e) => e.key === 'Enter' && handler()}>`.


## 21. RBAC & Role Logic

**`profiles.role` enum**: `owner`, `staff`, `manajer`, `view_only`, `sopir`, `superadmin`.
- `owner`: Full access, can manage team, billing.
- `manajer`: Peternak-specific — operational lead. Can create/close/delete cycles, view keuangan, input expenses, invite not allowed.
- `staff` / `pekerja`: Standard operational access, cannot manage team/billing.
- `view_only`: Read-only access to most data.
- `sopir`: Limited access, primarily for `SopirDashboard` to update delivery status.

**Implementation**:
- `RoleGuard` component in `App.jsx` protects routes based on required roles.
- Sidebar and Bottom Navigation menus dynamically filter visible items based on user's role.
- Role badge displayed in sidebar footer for quick identification.
- Frontend components should check `profile.role` before rendering sensitive action buttons or forms.
- For peternak: always use `usePeternakPermissions()` hook (see §4 Peternak RBAC) — never check `profile.role` manually.

**`PETERNAK_INVITE_ROLES`** (exported from `usePeternakPermissions.js`): `['manajer', 'pekerja', 'view_only']` — roles owner can invite.
**`PETERNAK_ROLE_LABELS`**: `{ owner: 'Pemilik', manajer: 'Manajer', pekerja: 'Pekerja', view_only: 'Tamu' }`.
**`PETERNAK_ROLE_BADGE`**: Colors per role for badge display.

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

## 24. Landing Page Structure

`LandingPage.jsx` renders these sections in order:
1. `Navbar`, 2. `Hero`, 3. `PainPoints`, 4. `Features`, 5. `HowItWorks`, 6. `MarketPrice`, 7. `Testimonials`, 8. `Pricing`, 9. `StatsBar`, 10. `FinalCTA`, 11. `Footer`.

---

---

## 26. TernakOS Market

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

## 27. `useGlobalStats` — Admin Overview Hook

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

## 28. Implemented Modules Status

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

## 29. Scripts & Automation

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
| fetch-harga | ✅ Active | |
| verify-invite-code | ✅ Updated | Rate limit pindah ke tabel `invite_rate_limits` |

### Edge Function — `supabase/functions/verify-invite-code/index.ts`
- **Trigger**: HTTP POST dari `AcceptInvite.jsx` via `supabase.functions.invoke('verify-invite-code', { body: { code } })`.
- **Purpose**: Rate-limit verifikasi kode undangan — mencegah brute-force kode 6 digit.
- **Rate Limit**: Max 5 attempts per IP per 15 menit. Lockout 30 menit setelah limit tercapai.
- **Logic**: Sanitize kode (uppercase alphanumeric 4–12 char) → cek rate limit → query `team_invitations` dengan service role key (bypass RLS) → return invitation + tenant data. On success: reset rate limit counter untuk IP tersebut.
- **Response codes**: `200` (valid), `400` (format salah), `404` (tidak ditemukan), `410` (expired), `429` (rate limited).
- **Deploy**: `supabase functions deploy verify-invite-code --no-verify-jwt`
- **Deploy**: `supabase functions deploy verify-invite-code --no-verify-jwt`
- **⚠️ Note**: Rate limit store moved to persistent DB table `invite_rate_limits` since 2026-03-29.

| Function | Status | Notes |
|----------|--------|-------|
| fetch-harga | ✅ Active | Auto-scraping daily price |
| verify-invite-code | ✅ Updated | Persistent rate limit via DB |

---

## 30. Pricing Structure

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

## 31. AI Roadmap (Business Plan)

- **AI Engine**: Grok 4.1 Fast (planned integration).
- **Key Features**:
  - **TernakBot Chat**: Ask questions about your business data in natural language.
  - **Profit Analysis**: Detailed breakdown of margin and cost optimization.
  - **Anomaly Detection**: Alerts for suspicious transaction patterns or sudden weight drops.
  - **Harvest Prediction**: AI-driven estimated harvest date based on historical growth logs.
  - **Auto Reports**: Weekly/Monthly PDF reports generated automatically.
- **Status**: Planned (Design Phase).

---

## 32. Roadmap

### SELESAI
- **Routing Multi-Vertical**: Dinamis (broker, peternak, rumah_potong) dengan pola `/{role}/{sub_type}/*`.
- **Vertical Routers**: `BrokerRouter`, `PeternakRouter`, `RPPageRouter` terpusat.
- **Sembako Integration**: 6 halaman full dashboard terintegrasi ke `/broker/sembako_broker`.
- **Folder Restructure**: Hierarki `role → sub_role` (broiler, layer, rpa, rph, etc.).
- **DB Migration**: `business_vertical` `'rpa'` → `'rumah_potong'`.
- **Schema Stability**: `sub_type` NOT NULL constraint di `tenants`.
- **Placeholders**: Dashboard sapi, domba, kambing, dan RPH.
- **Formula Peternak**: `calcPeternakNetProfit()`, `calcFCR()`, `calcIndeksPerforma()` ✅.
- **Broker Connections**: Full implementation (hooks + UI di Market) ✅.
- **Race Condition Fix**: `market_listings` view_count atomic update via RPC ✅.
- **Registration Reliability**: Retry polling `waitForProfile()` ✅.
- **Business Switcher Performance**: Invalidate spesifik ✅.
- **Rate Limit Invite Code**: Persistent table `invite_rate_limits` ✅.
- **DB Alter Table**: New columns & RLS for `broker_connections` ✅.

### SEDANG DIKERJAKAN
- **Broker Dashboard Bug Fixes**: Ongoing UI stabilization.
- **Agenda Event**: Detail sheet untuk cards di beranda.
- **Mobile Nav**: Hamburger menu + standardized business switcher.

### BELUM DIMULAI
- **Peternak Full Dashboard**: Sapi, domba, kambing, layer.
- **RPH Full Dashboard**.
- **Peternak Babi**: Coming soon (locked status).
- **TernakBot AI**: Grok 4.1 Fast integration.
- **Exports**: PDF/Excel generator.
- **Realtime Notifs**: Bell panel updates & system alerts.
- **Upgrade Flow**: In-app payment for Pro/Business plans.

---

---

## 33. Recent Major Updates

### Updates 2026-04-01

**RLS Bulletproof Migration (Critical Fix):**
- **Root Cause ditemukan**: Fungsi `get_my_tenant_id()` hanya return 1 tenant via `LIMIT 1`. Pada user dengan multi-tenant (misal: Broker Ayam + Sembako), INSERT ke tenant non-primary selalu gagal `42501 (new row violates row-level security policy)`.
- **Solusi**: Migrasi policy dari `tenant_id = get_my_tenant_id()` ke `tenant_id IN (SELECT tenant_id FROM profiles WHERE auth_user_id = auth.uid())`. Pattern ini disebut **Bulletproof RLS** karena mendukung semua tenant yang dimiliki user.
- **Tabel terdampak**: `sembako_stock_batches`, `sembako_payroll`, `sembako_stock_out`.
- **Migration file**: `supabase/migrations/20260401_fix_nested_rls.sql` — cleanup 3 jenis policy lama + create 3 policy baru.
- **Policy naming**: `tenant_isolation_sembako_stock_batches`, `tenant_isolation_sembako_payroll`, `tenant_isolation_sembako_stock_out`.

**Frontend Tenant Isolation Hardening (`useSembakoData.js`):**
- Semua 9 READ hooks kini menggunakan `const { tenant } = useAuth()` + `.eq('tenant_id', tenant.id)`:
  - `useSembakoProducts`, `useSembakoStockBatches`, `useSembakoAllBatches`, `useSembakoStockOut`
  - `useSembakoCustomers`, `useSembakoSuppliers`, `useSembakoSales`, `useSembakoEmployees`
  - `useSembakoDashboardStats` (5 parallel queries semuanya di-scope)
- Semua `queryKey` kini include `tenant?.id` sebagai elemen kedua untuk cache isolation.
- Semua hooks menggunakan `enabled: !!tenant?.id` untuk mencegah query fire sebelum auth ready.
- Ditambahkan import `import { useAuth } from './useAuth'` yang sebelumnya tidak ada.

**Documentation Update:**
- Known Rules diperluas ke 92-95 (RLS bulletproof, useAuth wajib, policy naming, migration reference).
- Rule 85 diupdate: mencakup 5 tabel sembako (bukan hanya 2).
- Rule 74 diupdate: menjelaskan wajib `useAuth()` + `.eq('tenant_id', tenant.id)` di semua hooks.

### Updates 2026-03-31

**Sembako Sales Module Hardening:**
- **File Restoration**: Memperbaiki korupsi file `Penjualan.jsx` yang membengkak hingga 2000+ baris akibat duplikasi tail-end berulang. File dikembalikan ke status stabil di 1286 baris. 
- **Reference Fix**: Memulihkan komponen `StatCard` dan shared components lainnya yang sempat hilang/error akibat kerusakan sintaks aplikasi.
- **RLS Policy Standard**: Implementasi awal policy `tenant_isolation_sembako_stock_batches` menggunakan `get_my_tenant_id()` (kemudian digantikan oleh bulletproof pattern di 2026-04-01).

**Documentation structural cleanup:**
- Sinkronisasi penomoran session (17-33) yang melompat/duplikat.
- Konsolidasi daftar "Known Rules & Gotchas" menjadi satu urutan logis (1-91, diperluas ke 95 di 2026-04-01).
- Penetapan pattern migrasi DB wajib: `DO $$ BEGIN ... IF NOT EXISTS ... END $$`.

### Updates 2026-03-29

**Poultry Broker — Sheet Migration (Bottom → Right):**
- Semua `SheetContent` dialog di Poultry Broker yang sebelumnya menggunakan `side="bottom"` direfaktor menjadi `side="right"` (panel samping kanan).
- File yang diupdate: `Beranda.jsx` (EventDetailSheet), `Transaksi.jsx`, `CashFlow.jsx`, `CreateLossSheet.jsx`.
- Ini menjadi pola standar wajib untuk semua fitur desktop di modul Broker.

**Frontend UI/UX Input Standardization (Phase 3):**
- `CashFlow.jsx`: Mengganti input Nominal Pengeluaran Ekstra menggunakan komponen `<InputRupiah>` murni dengan binding via `setValue` dan sinkronisasi Zod.
- `Armada.jsx`: Merefaktor `VehicleSheet`, `DriverSheet`, dan `ExpenseSheet` agar menggunakan komponen `<InputRupiah>` (untuk Biaya Sewa, Upah Supir, Biaya Operasional) dan `<InputNumber>` (untuk Kapasitas Ekor/Kg).
- **Zod Resolvers**: Menulis konstrain pelokalan bahasa Indonesia yang ketat pada `vehicleSchema`, `driverSchema`, dan `expenseSchema` (misal peringatan jika nominal > Rp 0).

**Frontend Validasi Finansial Piutang & Pembeli RPA (Phase 4):**
- `RPA.jsx`: Form Tambah RPA dimigrasikan sepenuhnya ke `react-hook-form` + `zod` (`rpaSchema`). Field Limit Kredit menggunakan `<InputRupiah>`. Mengekstrak `RPAForm` ke _module-level export_.
- `RPADetail.jsx`: Membasmi _Technical Debt_ (inline-styles ratusan baris) dengan menghapus komponen kuno `EditRPAForm` dan mendaur ulang `<RPAForm />` yang dimuat dari `RPA.jsx`. 
- `RPADetail.jsx`: Mengamankan `FormPaymentModal` dengan `<InputRupiah>`, `paymentSchema` via Zod, memastikan pelunasan piutang tidak bisa minus atau melebihi Sisa Hutang.

**CashFlow.jsx — Bugfix, Polish & Filter Enhancement:**
- Fixed `ReferenceError: isDesktop is not defined` pada komponen `CreateExtraExpenseSheet` — ditambahkan scope `useMediaQuery` lokal.
- Polished Recharts `Tooltip` di chart "Breakdown Biaya" untuk tampilan dark mode: `contentStyle` + `itemStyle` ditambahkan langsung ke props Tooltip.
- Fixed text wrapping pada legend breakdown list: `truncate` + `flex-shrink-0` applied.
- Ditambahkan filter `Keseluruhan` (All-Time) ke deretan period filter.
- Optimasi performa: chart data generation dari O(N²) nested `.filter()` diubah menjadi O(N) dictionary map (`salesByDate`, `expensesByDate`).

**Sembako — DatePicker Locale Bug Fix:**
- Fixed fatal `TypeError` di `DatePicker.jsx` — import locale `id` dari `date-fns/locale` di-rename menjadi `idLocale` untuk mencegah shadowing prop `id` komponen.

**Sembako — Calendar-Exact Date Filters:**
- Filter di `Laporan.jsx` (Sembako) menggunakan logika kalender murni (`startOfMonth`, `endOfMonth`, `startOfWeek`, `endOfWeek`), bukan rolling window.
- Ditambahkan opsi `Keseluruhan` (All-Time) pada filter laporan.

**Sembako — Payment Pre-fill UX:**
- `SheetPayment` di `Penjualan.jsx` kini auto-pre fill field `amount` dengan `sale.remaining_amount`, mengurangi human error saat pencatatan pembayaran.

**Sembako — RLS Policy Enforcement:**
- Ditambahkan RLS policy `tenant_isolation_sembako_sales` dan `tenant_isolation_sembako_payments` ke masing-masing tabel untuk mencegah `403 Forbidden` pada INSERT.
- Root cause: policy INSERT tidak ada / salah konfigurasi di Supabase Dashboard.

**Sembako — Routing Cleanup:**
- Duplikasi route `/broker/sembako/pos` dihapus dari `AppSidebar.jsx` dan `businessModel.js`. Sembako hanya menggunakan `/penjualan`.

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

### Updates 2026-04-02
**Poultry Broker Stabilization:**
- **Infinite Loop Resolution**: Eliminated "Maximum update depth exceeded" errors in the transaction wizard by refactoring Radix UI handlers (`onOpenChange`, `onSelect`) in `TransaksiWizard.jsx`, `WizardStepBeli.jsx`, `WizardStepJual.jsx`, and `WizardStepPengiriman.jsx` to use stable `useCallback` references and proper subscription patterns.
- **Wizard State Sync**: Implemented a `watch` subscription in `WizardStepPengiriman.jsx` to sync form values with parent state, avoiding loops caused by direct dependency on `watch()` results during render.
- **Success Flow**: Enhanced `Transaksi.jsx` with `TransaksiSuccessCard` and better sheet closing logic to ensure clean state resets after successful transactions.
- **RADIX VS REACT 19**: Standardized the pattern of passing stable references to Radix primitives to maintain compatibility with React 19's `compose-refs` implementation.

**Database & Security:**
- **RLS Verification**: Confirmed bulletproof Row Level Security (RLS) across all 33+ tables, ensuring total tenant isolation.
- **Soft Delete filter**: Consistent application of `.eq('is_deleted', false)` across all frontend hooks to ensure data consistency.

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


---

## 34. Known Issues & Fixes

### broker_connections kolom deprecated
- Kolom lama: `peternak_tenant_id`, `broker_tenant_id` — masih ada di DB tapi jangan dipakai di kode baru.
- Kolom baru: `requester_tenant_id`, `target_tenant_id`.
- Data lama sudah dimigrate ke kolom baru.
- **Status**: Resolved 2026-03-29.

### market_listings view_count race condition
- Masalah: Concurrent access can cause loss of view counts.
- Fix: pakai RPC `increment_listing_view()` — atomic SQL update.
- **Status**: Fixed 2026-03-29.

### Register profile null pada pendaftaran
- Masalah: Trigger `handle_new_user` delay causing "profile not found" error.
- Fix: retry polling `waitForProfile()` max 8x, progressive backoff.
- **Status**: Fixed 2026-03-29.

### Sembako — Bug fix session 2026-04-01 v2

- **RLS final**: `20260401_fix_all_rls_bulletproof.sql` fix semua 33+ tabel. `sembako_deliveries` had broken `my_tenant_id()`+`my_role()` policy — now fixed.
- **Schema**: `sembako_products` tambah `secondary_unit` + `conversion_rate` via migration. Produk form kirim empty string → `22P02` error → fix convert ke null.
- **FIFO integrity**: `useCreateSembakoSale` sekarang insert ke `sembako_stock_out` per batch deduction (reason='sale'). Tanpa ini delete sale tidak bisa restore stok.
- **Product delete cascade**: `useSoftDeleteSembakoProduct` sekarang soft-delete semua stock_batches terkait → Total Pembelian Stok langsung akurat.
- **Laporan bug**: `useSembakoLaporan` pakai `i.total_other_cost` (tidak ada) → diganti `i.other_cost`. Net profit laporan sebelumnya lebih besar dari seharusnya.
- **Beranda employee count**: `e.is_active !== false` (selalu true) → `e.status === 'aktif'`. Berlaku di DesktopBeranda dan MobileBeranda.
- **Routing race condition**: `getXBasePath(tenant)` → `/broker/broker_ayam` saat tenant null (loading). Diganti `useParams()` di Beranda.jsx. Tombol "Catat Penjualan" tidak lagi salah route saat diklik sebelum tenant loaded.
- **Smooth navigation**: `BrokerLayout` tambah `SembakoPrefetcher` — semua query sembako di-prefetch saat layout mount, cached 5 menit.
- **Known Rules diperluas**: 96–103 (status vs is_active, conversion_rate null handling, FIFO stock_out wajib, cascade delete, prefetch pattern, useParams routing, bulletproof RLS final, other_cost naming).

---

*Last updated: 2026-04-02 v1 — Poultry Broker stabilization (infinite loops resolved via stable handlers + subscription pattern), Verified RLS bulletproof architecture (33+ tables), Soft Delete enforcement (.eq('is_deleted', false)), TransaksiSuccessCard flow improvement, and React 19 / Radix UI compatibility.*
