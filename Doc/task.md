# Task List - Polish Broker Desktop Dashboard

## Phase 1: Sidebar & Global Styling
- [x] Fix Sidebar background color (dark theme) (FIX 1)
- [x] Ensure Sidebar labels are always visible/expanded (FIX 2)
- [x] Verify CSS variables in `index.css` for sidebar

## Phase 2: Beranda Dashboard Data & Logic
- [x] Remove hardcoded/mock data from [Beranda.jsx](file:///d:/Dokumen/02_Kerja_Profesional/Ternak%20OS/src/dashboard/broker/Beranda.jsx) (FIX 3)
- [x] Implement 7-day profit query from Supabase (FIX 4)
- [x] Fix KPI Cards - Profit label and percentage logic (FIX 5 & 6)
- [x] Implement empty states for Piutang RPA and Recent Activity (FIX 7 & 8)

## Phase 3: Final Polish & CSS
- [x] Fix PostCSS "Unclosed block" error in `index.css`
- [x] Polish Harga Pasar page (Dark theme & logic check)
- [x] Polish Simulator page (Dark theme & logic check)

## Phase 4: Responsive Layout Fix
- [x] Refactor [DashboardLayout](file:///d:/Dokumen/02_Kerja_Profesional/Ternak%20OS/src/App.jsx#77-91) in [App.jsx](file:///d:/Dokumen/02_Kerja_Profesional/Ternak%20OS/src/App.jsx) for desktop support
- [x] Hide redundant headers in `HargaPasar.jsx` on desktop
- [x] Hide redundant headers in `Simulator.jsx` on desktop
- [x] Hide redundant headers in `Akun.jsx` on desktop

## Phase 5: Verification
- [x] Verify background color across all pages
- [x] Verify sidebar navigation responsiveness
- [x] Verify real-time data fetching
- [x] Verify empty state displays

## Phase 6: Account Upgrade
- [x] Identifying tenant ID for `fahruhernansakti@gmail.com`
- [x] Creating and sharing Pro Mode SQL script
- [x] Verify Pro Mode UI in `Akun.jsx`

## Phase 7: Pengiriman & Loss Module
- [x] Create [Pengiriman.jsx](file:///d:/Dokumen/02_Kerja_Profesional/Ternak%20OS/src/dashboard/broker/Pengiriman.jsx) with Tabs and Summary Strip
- [x] Implement Delivery List and Cards
- [x] Implement Loss Report List and Cards
- [x] Implement "Catat Pengiriman" Sheet
- [x] Implement "Update Tiba" Sheet
- [x] Implement "Catat Kerugian" Sheet
- [x] Update Routing in [App.jsx](file:///d:/Dokumen/02_Kerja_Profesional/Ternak%20OS/src/App.jsx)

## Phase 8: Cash Flow Module
- [x] Create [useCashFlow.js](file:///d:/Dokumen/02_Kerja_Profesional/Ternak%20OS/src/lib/hooks/useCashFlow.js) hook for data fetching
- [x] Create [CashFlow.jsx](file:///d:/Dokumen/02_Kerja_Profesional/Ternak%20OS/src/dashboard/broker/CashFlow.jsx) with Period Selector and Summary Cards
- [x] Implement Line Chart for Cumulative Balance
- [x] Implement Donut Chart for Expense Breakdown
- [x] Implement Transaction Detail List with Tabs
- [x] Implement "Catat Pengeluaran Extra" Sheet
- [x] Update Routing in [App.jsx](file:///d:/Dokumen/02_Kerja_Profesional/Ternak%20OS/src/App.jsx)

## Phase 9: Armada & Sopir Module
  - [x] Create `Armada.jsx` (Kendaraan & Sopir tabs)
  - [x] Implementation of Vehicle management (CRUD + Expenses)
  - [x] Implementation of Driver management (SIM monitoring)
  - [x] Integration with [Pengiriman.jsx](file:///d:/Dokumen/02_Kerja_Profesional/Ternak%20OS/src/dashboard/broker/Pengiriman.jsx) form
  - [x] SIM Expiry alerts on Broker Home page
  - [x] Update [App.jsx](file:///d:/Dokumen/02_Kerja_Profesional/Ternak%20OS/src/App.jsx) routing

## Phase 10: Platform Error Fixes
- [x] Fix NaN rendering issues (Safe numbers & Updated formatters)
- [x] Fix Accessibility warnings (Dialog/Sheet titles)
- [x] Fix `rpa_clients` 400 Bad Request queries (Column naming)

## Phase 11: UI Refinement & Deep Debugging
- [x] Fix RPA `buyer_type` constraint error (Lowercase in DB)
- [x] Implement Title Case labels for `buyer_type`, `payment_terms`, and `payment_status`
- [x] Audit and fix remaining NaNs in [CashFlow](file:///d:/Dokumen/02_Kerja_Profesional/Ternak%20OS/src/dashboard/broker/CashFlow.jsx#45-455), [RPADetail](file:///d:/Dokumen/02_Kerja_Profesional/Ternak%20OS/src/dashboard/broker/RPADetail.jsx#441-780), and `Simulator`
- [x] Verify RPA form functionality (Add/Edit)

## Phase 12: Invalid Time Error & App Stability
- [x] Safe [formatDate](file:///d:/Dokumen/02_Kerja_Profesional/Ternak%20OS/src/lib/format.js#33-53), [formatDateFull](file:///d:/Dokumen/02_Kerja_Profesional/Ternak%20OS/src/lib/format.js#54-69), [formatRelative](file:///d:/Dokumen/02_Kerja_Profesional/Ternak%20OS/src/lib/format.js#70-96) in [format.js](file:///d:/Dokumen/02_Kerja_Profesional/Ternak%20OS/src/lib/format.js)
- [x] Implement `ErrorBoundary` component
- [x] Wrap [RPADetail](file:///d:/Dokumen/02_Kerja_Profesional/Ternak%20OS/src/dashboard/broker/RPADetail.jsx#441-780) (and [App.jsx](file:///d:/Dokumen/02_Kerja_Profesional/Ternak%20OS/src/App.jsx) routes) in `ErrorBoundary`
- [x] Audit [RPADetail.jsx](file:///d:/Dokumen/02_Kerja_Profesional/Ternak%20OS/src/dashboard/broker/RPADetail.jsx) to use safe [formatDate](file:///d:/Dokumen/02_Kerja_Profesional/Ternak%20OS/src/lib/format.js#33-53) only

## Phase 13: Dashboard NaN Warnings
- [x] Audit [Beranda.jsx](file:///d:/Dokumen/02_Kerja_Profesional/Ternak%20OS/src/dashboard/broker/Beranda.jsx) for missing [safeNumber](file:///d:/Dokumen/02_Kerja_Profesional/Ternak%20OS/src/lib/format.js#4-8) guards
- [x] Audit `useDashboardStats` to ensure hook data is scrubbed of `NaNs`

## Phase 14: Sidebar & Navigation Footer Refinements
- [x] Remove "Segera" badge from [Pengiriman](file:///d:/Dokumen/02_Kerja_Profesional/Ternak%20OS/src/dashboard/broker/Pengiriman.jsx#53-335), `Cash Flow`, and `Armada` in `AppSidebar.jsx`
- [x] Remove duplicate `Simulator` link from `SidebarFooter` dropdown profile menu
- [x] Inject Plan/Trial status UI widget above the user profile footer in `AppSidebar.jsx`

## Phase 15: Enhance Purchase Form & Fix Insert Bug
- [x] Create `InputRupiah` component for formatting numeric currency inputs
- [x] Remove `total_modal` payload from Insert query (DB autogenerates)
- [x] Implement Shadcn `DatePicker` + `Calendar` logic
- [x] Add Tone/Rit weight estimation input toggle
- [x] Format summary section natively with [formatIDR](file:///d:/Dokumen/02_Kerja_Profesional/Ternak%20OS/src/lib/format.js#17-21)
## Phase 16: Refactor TransaksiWizard
- [x] Install Shadcn `Command` and `Popover` components
- [x] Refactor `WizardStepBeli.jsx`: Remove costs, implement Combobox with Quick Add, fix unit styling
- [x] Refactor `WizardStepJual.jsx`: Remove delivery cost, implement Combobox with Quick Add
- [x] Refactor `WizardStepPengiriman.jsx`: Add single TOTAL BIAYA PENGIRIMAN, implement TimePicker
- [x] Update `TransaksiWizard.jsx` submit logic: Link delivery cost back to sales
- [x] Verify full transaction flow and data integrity

## Phase 17: Custom InputNumber UI
- [x] Create `InputNumber.jsx` component with custom spinners
- [x] Hide native browser spinners in `index.css`
- [x] Integrate `InputNumber` into `WizardStepBeli.jsx`
- [x] Integrate `InputNumber` into `WizardStepJual.jsx` (if applicable)
- [x] Integrate `InputNumber` into `WizardStepPengiriman.jsx` (if applicable)
## Phase 18: Stability & Accessibility Fixes
- [x] Implement [safeNum](file:///d:/Dokumen/02_Kerja_Profesional/Ternak%20OS/src/lib/format.js#15-16) and update formatters in [format.js](file:///d:/Dokumen/02_Kerja_Profesional/Ternak%20OS/src/lib/format.js)
- [x] Fix `toLocaleString` TypeErrors in `WizardStepBeli.jsx`
- [x] Fix `NaN` arithmetic in `WizardStepBeli.jsx` and `WizardStepJual.jsx`
- [x] Fix missing [Card](file:///d:/Dokumen/02_Kerja_Profesional/Ternak%20OS/src/dashboard/broker/Transaksi.jsx#897-1022) import and `NaN` in `WizardStepPengiriman.jsx`
- [x] Add `SheetDescription` to `TransaksiWizard.jsx`
- [x] Verify no console errors on data load or calculation
- [x] Remove duplicate X (close) button in `TransaksiWizard` header
- [x] Verify UI consistency and spinner logic

## Phase 19: Quick Add RPA Inline Form
- [x] Add `showQuickAddRPA` and form states to `WizardStepJual.jsx`
- [x] Update RPA `Combobox` to include static "Tambah RPA Baru" option
- [x] Implement Quick Add RPA form and `handleQuickAddRPA` logic
- [x] Verify auto-selection and database insertion

## Phase 20: Step 3 UI Refinement
- [x] Replace Vehicle selection with Combobox in `WizardStepPengiriman.jsx`
- [x] Replace Driver selection with Combobox in `WizardStepPengiriman.jsx`
- [x] Implement new dual-input `TimePicker` component
- [x] Verify UI consistency and premium styling

## Phase 21: RPA Detail & Global UI Improvements
- [x] Replace native input with `InputRupiah` in [RPADetail.jsx](file:///d:/Dokumen/02_Kerja_Profesional/Ternak%20OS/src/dashboard/broker/RPADetail.jsx)
- [x] Implement smart breadcrumb labels in `DesktopTopBar.jsx`
- [x] Remove manual emojis from all `toast` calls (success, error, info, etc.)
- [x] Update `Toaster` styling in `main.jsx`
- [x] Verify real-time financial formatting in RPA Detail

## Phase 22: Inline RPA Edit (Detail Page)
- [x] Connect edit button to Shadcn Sheet form
- [x] Implement [EditRPAForm](file:///d:/Dokumen/02_Kerja_Profesional/Ternak%20OS/src/dashboard/broker/RPADetail.jsx#67-440) with reactive star rating
- [x] Add update & delete logic with confirmation dialog
- [x] Verify automatic page refresh on success
- [x] Fix parse errors and orphaned brackets in RPADetail.jsx

## Phase 23: Refine Metrics & Transaction UI
- [x] Unify profit formula: `net_revenue - total_cost`
- [x] Fix Transaction Count on Beranda (Sales only)
- [x] Join `purchases` and `deliveries` in `useSales` hook
- [x] Add Delivery Status badge to Transaction cards
- [x] Sync Profit calculation between Beranda and Cash Flow
- [x] Verify no "Profit +Rp 0" issues

## Phase 24: Implement Purchase Editing
- [x] Add edit icon to [PurchaseCard](file:///d:/Dokumen/02_Kerja_Profesional/Ternak%20OS/src/dashboard/broker/Transaksi.jsx#1023-1147)
- [x] Implement `editTarget` state and pre-filling logic
- [x] Add [Sheet](file:///d:/Dokumen/02_Kerja_Profesional/Ternak%20OS/src/dashboard/broker/Pengiriman.jsx#1620-1750) component with edit form (InputNumber, InputRupiah, DatePicker)
- [x] Implement [handleEditPurchase](file:///d:/Dokumen/02_Kerja_Profesional/Ternak%20OS/src/dashboard/broker/Transaksi.jsx#196-241) for Supabase update
- [x] Verify live preview and financial re-calculation logic
- [x] Verify summary and stats refresh on success

## Phase 25: Delivery-Payment Lock Flow
- [x] Implement refined [getDeliveryBadge](file:///d:/Dokumen/02_Kerja_Profesional/Ternak%20OS/src/dashboard/broker/Transaksi.jsx#58-107) in [Transaksi.jsx](file:///d:/Dokumen/02_Kerja_Profesional/Ternak%20OS/src/dashboard/broker/Transaksi.jsx)
- [x] Add "Catat Tiba" / "Konfirmasi" buttons to [SaleCard](file:///d:/Dokumen/02_Kerja_Profesional/Ternak%20OS/src/dashboard/broker/Transaksi.jsx#897-1022) in [Transaksi.jsx](file:///d:/Dokumen/02_Kerja_Profesional/Ternak%20OS/src/dashboard/broker/Transaksi.jsx)
- [x] Implement [handleCompleteDelivery](file:///d:/Dokumen/02_Kerja_Profesional/Ternak%20OS/src/dashboard/broker/Transaksi.jsx#242-265) and `handleCatatTiba` logic
- [x] Add [Sheet](file:///d:/Dokumen/02_Kerja_Profesional/Ternak%20OS/src/dashboard/broker/Pengiriman.jsx#1620-1750) for mini "Catat Tiba" form in [Transaksi.jsx](file:///d:/Dokumen/02_Kerja_Profesional/Ternak%20OS/src/dashboard/broker/Transaksi.jsx)
- [x] Implement [canPay](file:///d:/Dokumen/02_Kerja_Profesional/Ternak%20OS/src/dashboard/broker/RPADetail.jsx#501-506) logic in [RPADetail.jsx](file:///d:/Dokumen/02_Kerja_Profesional/Ternak%20OS/src/dashboard/broker/RPADetail.jsx) & [Transaksi.jsx](file:///d:/Dokumen/02_Kerja_Profesional/Ternak%20OS/src/dashboard/broker/Transaksi.jsx)
- [x] Lock "Catat Bayar" and "Tandai Lunas" behind `delivery.status === 'completed'`
- [x] Add Alert UI for locked payment states

## Phase 26: Unified Profit & Cash Flow Correction
- [x] Phase 26: Unify Profit Formula & Fix Cash Flow Breakdown
    - [x] Update [useCashFlow.js](file:///d:/Dokumen/02_Kerja_Profesional/Ternak%20OS/src/lib/hooks/useCashFlow.js) to Pull `delivery_cost` from `sales`
    - [x] Refactor `totalPemasukan` & `totalKeluar` formulas
    - [x] Update [Beranda.jsx](file:///d:/Dokumen/02_Kerja_Profesional/Ternak%20OS/src/dashboard/broker/Beranda.jsx) with bottom-line profit logic
    - [x] Add explicit "Biaya Kirim" info box in Cash Flow UI
    - [x] Add delivery cost sub-info in transaction rows
    - [x] Sync Weekly Chart in Beranda with Net Cash Flow logic

## Phase 27: Refine Purchase Data & UI
- [x] Update [usePurchases.js](file:///d:/Dokumen/02_Kerja_Profesional/Ternak%20OS/src/lib/hooks/usePurchases.js) query fields (avg_weight_kg, total_cost, other_cost, total_modal)
- [x] Add `transport_cost` and `other_cost` fields to Purchase Edit Sheet in [Transaksi.jsx](file:///d:/Dokumen/02_Kerja_Profesional/Ternak%20OS/src/dashboard/broker/Transaksi.jsx)
- [x] Implement reactive Total Modal summary in Purchase Edit Sheet
- [x] Update [handleEditPurchase](file:///d:/Dokumen/02_Kerja_Profesional/Ternak%20OS/src/dashboard/broker/Transaksi.jsx#196-241) to persist new cost fields
- [x] Update [PurchaseCard](file:///d:/Dokumen/02_Kerja_Profesional/Ternak%20OS/src/dashboard/broker/Transaksi.jsx#1023-1147) to display BIAYA PERJALANAN with "—" fallback
- [x] Verify financial accuracy of Total Modal across UI and DB

## Phase 28: Fix Arrival Form & Unified Logic
- [x] Create shared [useUpdateDelivery.js](file:///d:/Dokumen/02_Kerja_Profesional/Ternak%20OS/src/lib/hooks/useUpdateDelivery.js) hook
- [x] Refactor [Transaksi.jsx](file:///d:/Dokumen/02_Kerja_Profesional/Ternak%20OS/src/dashboard/broker/Transaksi.jsx) to use shared [updateTiba](file:///d:/Dokumen/02_Kerja_Profesional/Ternak%20OS/src/lib/hooks/useUpdateDelivery.js#8-83) logic
- [x] Refactor [Pengiriman.jsx](file:///d:/Dokumen/02_Kerja_Profesional/Ternak%20OS/src/dashboard/broker/Pengiriman.jsx) arrival form UI with InputNumber and clarified labels
- [x] Implement live calculation summary (Mati & Susut) in [Pengiriman.jsx](file:///d:/Dokumen/02_Kerja_Profesional/Ternak%20OS/src/dashboard/broker/Pengiriman.jsx)
- [x] Ensure Indonesia number formatting (1.234,5) in arrival forms
- [x] Verify automatic Loss Report creation on submission

## Phase 29: Advanced Arrival Form Refinement
- [x] Update [useUpdateDelivery.js](file:///d:/Dokumen/02_Kerja_Profesional/Ternak%20OS/src/lib/hooks/useUpdateDelivery.js) to handle driver information
- [x] Implement Unit Selector (kg/ton/rit) logic and UI in [Pengiriman.jsx](file:///d:/Dokumen/02_Kerja_Profesional/Ternak%20OS/src/dashboard/broker/Pengiriman.jsx)
- [x] Implement Inline Driver Selection/Input in [Pengiriman.jsx](file:///d:/Dokumen/02_Kerja_Profesional/Ternak%20OS/src/dashboard/broker/Pengiriman.jsx)
- [x] Enhance Real-time Summary UI with conditional coloring and detailed metrics
- [x] Refactor submission logic to persist driver details alongside arrival data
- [x] Verify unit conversion and real-time calculations
- [x] Verify driver data persistence on completion

## Phase 30: Transaksi Icon Fixes
- [x] Fix `TrendingUp` import
- [x] Fix `Loader2` and `Pencil` imports
- [x] Audit remaining icons in [Transaksi.jsx](file:///d:/Dokumen/02_Kerja_Profesional/Ternak%20OS/src/dashboard/broker/Transaksi.jsx)
- [x] Verify no more "is not defined" errors

## Phase 31: Auth Pages Redesign
- [x] Install required shadcn components (Input, Label, Button, Separator)
- [x] Create [Login.jsx](file:///d:/Dokumen/02_Kerja_Profesional/Ternak%20OS/src/pages/Login.jsx) with 2-column layout and Deep Space Emerald theme
- [x] Create [Register.jsx](file:///d:/Dokumen/02_Kerja_Profesional/Ternak%20OS/src/pages/Register.jsx) with 2-column layout and extended form fields
- [x] Implement branding panel with stats, quote, and decorations
- [x] Implement responsive behavior (mobile-first approach)
- [x] Connect auth logic (login/register) to Supabase
- [x] Update [App.jsx](file:///d:/Dokumen/02_Kerja_Profesional/Ternak%20OS/src/App.jsx) routes to use new auth components
- [x] Verify redirects and error handling

## Phase 32: Fix Transaksi Runtime Errors
- [x] Fix "Illegal constructor" by importing [History](file:///d:/Dokumen/02_Kerja_Profesional/Ternak%20OS/src/dashboard/broker/RPADetail.jsx#912-938) icon in [Transaksi.jsx](file:///d:/Dokumen/02_Kerja_Profesional/Ternak%20OS/src/dashboard/broker/Transaksi.jsx)
- [x] Verify [EmptyState](file:///d:/Dokumen/02_Kerja_Profesional/Ternak%20OS/src/components/EmptyState.jsx#5-39) import in [Transaksi.jsx](file:///d:/Dokumen/02_Kerja_Profesional/Ternak%20OS/src/dashboard/broker/Transaksi.jsx)
- [x] Check for other potential icon/global collisions
