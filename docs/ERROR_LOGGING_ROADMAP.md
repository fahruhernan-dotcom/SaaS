# TernakOS Error Logging — Roadmap & Coverage Matrix

> **Companion file**: this is the **forward-looking** planning + tracking document.
> The historical "what's already instrumented" lives in [ERROR_LOGGING_INVENTORY.md](./ERROR_LOGGING_INVENTORY.md).
>
> **Rule of thumb**:
> - **Plan / track** → ROADMAP (this file)
> - **Verify what's done** → INVENTORY
>
> After a phase finishes:
> 1. Update ROADMAP — flip matrix cells to ✅, change phase status to DONE
> 2. Update INVENTORY — add new action_names to Action Name Index, append file coverage entry

---

## Strategy Shift — Impact-Driven → Area-Driven

**Phase 5 → 6.3** instrumented TernakOS by **impact priority**: auth funnel first (Phase 6.0), critical money/data (6.1), operational stability (6.2), polish (6.3). This sequencing was correct — if budget ran out mid-rollout, the most damaging silent-failure paths were already covered.

**Now (post Phase 6.3)** all high-risk paths are instrumented. Remaining work is per-area sweeps to fill gaps in less-trafficked sub-pages. Switching to **area-driven phasing** (one vertical / one dashboard at a time) is the right next step because:

- Easier to validate "vertical X is fully covered" — single user persona can audit end-to-end
- Phase order no longer signals priority (all roughly equal residual risk) — pick by demand
- Each phase is **independent** — can ship Sembako sweep without waiting for RPA
- Matches how QA tests (per-dashboard regression sweeps)

**Existing Phase 5–6.3 are frozen as historical record.** New area-driven phases use alphabetic suffixes (`6.A`, `6.B`, …) to avoid implying priority ordering.

---

## Vertical Coverage Matrix

Tracks instrumentation status per (vertical × sub-page). Each cell is one of:

| Marker | Meaning |
|--------|---------|
| ✅ | Fully instrumented (all mutations on page logged) |
| ⏳ | Pending — has mutations, not yet instrumented |
| 🟡 | Partial — some mutations logged, others pending |
| — | No mutation (read-only page) — N/A |
| · | Sub-page does not exist for this vertical |

### Auth / Onboarding / Account (cross-vertical) ✅ DONE

| Area | Status | Phase |
|------|--------|-------|
| Login / Register / OAuth callback | ✅ | 6.0 |
| Onboarding (BusinessModelOverlay, OnboardingFlow) | ✅ | 6.0 |
| Tutorial Overlay (DB sync) | ✅ | 6.0 + post-fix |
| AkunPreview (logout, edit profile) | ✅ | 5 |
| useAuth.fetchAuthData + switchTenant | ✅ | 6.1 + 6.2 |
| 404 route | ✅ | 5 |
| Global capture (ErrorBoundary + window.onerror) | ✅ | 3 |
| Pre-auth RPC fallback | ✅ | 6.0B |

### Peternak verticals

| Sub-page | Broiler | Layer | Domba Pgmkn | Kambing Pgmkn | Sapi Pgmkn | Domba Breeding | Kambing Breeding | Sapi Breeding |
|----------|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|
| Beranda | — | — | — | — | — | — | — | — |
| Siklus / Batch | ✅ | ⏳ | 🟡 | 🟡 | 🟡 | ⏳ | ⏳ | ⏳ |
| Vaksinasi / Kesehatan | ✅ | ⏳ | ⏳ | ⏳ | ⏳ | · | · | · |
| Input Harian / Daily Task | ✅ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ |
| Ternak (Data Ternak) | · | · | 🟡 | 🟡 | 🟡 | 🟡 | 🟡 | 🟡 |
| Penjualan (Sale) | · | · | 🟡 | 🟡 | 🟡 | · | · | · |
| Denah Kandang / Kandang-View | · | · | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ |
| Reproduksi | · | · | · | · | · | ⏳ | ⏳ | ⏳ |
| Pakan / Stok Pakan | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ |
| Listrik & Air | · | · | ⏳ | ⏳ | ⏳ | · | · | ⏳ |
| Tim / Anak Kandang | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ |
| Laporan | — | — | — | — | — | — | — | — |
| Akun | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

**🟡 partial** for fattening verticals: `createPenggemukanHooks` covers batch/animal/sale (Phase 6.2). Page-level handlers in `Batch.jsx`, `Ternak.jsx`, `Penjualan.jsx` may have additional inline mutations not yet audited.

### Broker verticals

| Sub-page | Broker Ayam (Poultry) | Broker Telur (Egg) | Distributor Sembako |
|----------|:--:|:--:|:--:|
| Beranda | — | — | — |
| Transaksi | 🟡 | ⏳ | · |
| POS / Penjualan | · | ⏳ | ✅ |
| Kandang / Farms | ✅ | · | · |
| Pengiriman | ✅ | · | ✅ |
| Cash Flow | ⏳ | · | · |
| Armada (vehicle + driver) | ✅ | · | · |
| Simulator | — | · | · |
| RPA & Piutang | 🟡 | · | · |
| Inventori | · | ⏳ | ✅ |
| Suppliers | · | ⏳ | ✅ |
| Customers | · | ⏳ | ✅ |
| Toko-Supplier | · | · | ✅ |
| Toko-Supplier Detail | · | · | ✅ |
| Gudang | · | · | ✅ |
| Produk | · | · | ✅ |
| Karyawan / Tim | ⏳ | ⏳ | ✅ |
| Laporan | — | — | — |
| Akun | ⏳ | ⏳ | 🟡 |
| Recycle Bin | · | · | ✅ |
| Form Beli | ✅ | · | · |
| Form Bayar | ✅ | · | · |
| Payroll | · | · | ✅ |
| Supplier Payments | · | · | ✅ |
| Stock Adjust / Returns | · | · | ✅ |

**🟡 Transaksi (Broker Ayam)**: `FormBayarModal` covered (Phase 6.1) but other inline sale-edit mutations not audited.
**🟡 RPA & Piutang (Broker Ayam)**: `FormBayarModal` RPA-side covered (Phase 6.1) but RPADetail.jsx and standalone RPA edits not audited.

### RPA (Rumah Potong)

| Sub-page | Status | Notes |
|----------|--------|-------|
| Beranda | — | Read-only |
| Order (Purchase Order) | ✅ | `rpa.purchase_order.create` (Phase 6.3) |
| Hutang | ⏳ | Payment/debt tracking — uses FormBayar RPA (✅) but standalone edits not audited |
| Distribusi | ⏳ | Customer delivery flow |
| Distribusi Detail | ⏳ | Per-customer view |
| Laporan | — | Read-only |
| Akun | ✅ | RPAProfileForm via useUpsertRPAProfile (Phase 5) |

### Admin (Superadmin)

| Sub-page | Status | Notes |
|----------|--------|-------|
| Beranda (AdminBeranda) | — | Read-only stats |
| Users (AdminUsers) | ⏳ | User CRUD, plan changes, impersonation |
| Subscriptions | ⏳ | Plan upgrade/downgrade, manual extensions |
| Pricing | ⏳ | Plan config CRUD |
| Activity (AdminActivity) | — | Read-only |
| Settings | ✅ | logAuditTrail audit-of-audit (Phase 6.3); main updates in `useUpdatePlanConfig` hook out-of-scope |
| Info (AdminInfo) | — | Read-only (logs viewer) |

---

## Phase 6.A–6.F Roadmap

Phases are **independent** — pick by demand, not by alphabet order. Numbering is for labeling, not priority.

### Backlog priority (user-confirmed)

1. ~~**6.A** — Distributor Sembako~~ ✅ DONE
2. **6.B** — Peternak Fattening detail (Batch / Ternak / Penjualan / Reproduksi / Kandang-view; closes Phase 6.2 gaps) ← **next up**
3. **6.C** — Egg Broker (mirror Sembako structure, smaller scope)
4. **6.D** — RPA (Order already done; Hutang / Distribusi remaining)
5. **6.E** — Admin (Users / Subscriptions / Pricing CRUD)
6. **6.F** — Cross-vertical shared (Tim, Akun per vertical, DailyTask, Notifications, KandangView)

---

### Phase 6.A — Distributor Sembako sweep ✅ DONE

**Scope (delivered):** All mutation hooks in `src/lib/hooks/useSembakoData.js` — the single entry point for every Sembako broker dashboard mutation. Components (`Penjualan.jsx`, `Pengiriman.jsx`, `Gudang.jsx`, `Produk.jsx`, `TokoSupplier.jsx`, `TokoSupplierDetail.jsx`, `TimManajemenPage.jsx`, `Akun.jsx`, `Pegawai.jsx`) call these via React Query — no inline mutations to instrument at component level (only `SembakoRecycleBin.jsx` covered earlier in Phase 5).

**Hooks instrumented (21 total):**

Simple single-step (16):
- Customer CRUD × 3 (create/update/delete)
- Supplier CRUD × 3
- Employee CRUD × 2 (no delete)
- Delivery state machine × 5 (create/start/arrive/complete/update_timestamps)
- Product create + update + add stock batch (3)
- Payroll record + mark_paid (2)
- Supplier payment record (1)

Multi-step with partial-commit detection (5):
- `useDeleteSembakoSale` — 3 partial steps (payments/items/deliveries cleanup)
- `useUpdateSembakoSale` — 2 partial steps (items_replace, header_update)
- `useCreateSembakoSale` — 4 partial steps (items, stock_deduct, stock_out, with compensating rollback)
- `useCreateSembakoReturn` — 3 partial steps (stock_out_cleanup, payments_cleanup, sale_header)
- `useRecordSembakoPayment` — 1 partial step (sale_sync)
- `useAdjustBatchStock` — 2 partial steps (product_sync, stock_out)
- `useSoftDeleteSembakoProduct` — 1 partial step (batch_sync)

**Total: 40 new action_names** (all `sembako.*` prefix) — see INVENTORY Action Name Index.

**Tables covered:** `sembako_sales`, `sembako_sale_items`, `sembako_payments`, `sembako_products`, `sembako_stock_batches`, `sembako_stock_out`, `sembako_deliveries`, `sembako_customers`, `sembako_suppliers`, `sembako_employees`, `sembako_payroll`, `sembako_supplier_payments`.

**Pattern notes:**
- All simple single-step hooks use `logSupabaseError({ table, operation, component: 'useSembakoData', actionName })` before throw.
- Multi-step partial commits use `logError({ source: 'supabase', metadata: { partial: true, step: '<name>', sale_id|batch_id|product_id } })` directly because `logSupabaseError` doesn't forward arbitrary metadata.
- `useCreateSembakoSale` has a compensating rollback (delete inserted items + sale header on FIFO deduct failure) — the partial logs above the rollback help superadmin identify _which_ batch update succeeded before the failure for stock reconciliation.

**Status:** ✅ DONE (build pass, lint clean per phase policy)

---

### Phase 6.B — Peternak Fattening detail

**Scope:** Cover sub-pages of `peternak_domba_penggemukan` / `peternak_kambing_penggemukan` / `peternak_sapi_penggemukan` not already covered by `createPenggemukanHooks`. Many mutations may already be in the hook factory — verify, otherwise instrument page-level handlers.

**Target sub-pages:**
- Batch list (`Batch.jsx`) — close-batch + edit-batch + delete-batch
- Ternak / Data Ternak (`Ternak.jsx`) — animal-level edits beyond create/bulk
- Penjualan (`Penjualan.jsx`) — sale-level edits beyond create
- Denah Kandang (`KandangViewLayout`) — slot assign / kandang CRUD
- Reproduksi (`Reproduksi.jsx`, breeding only) — mating records, partus records
- Kesehatan (`Kesehatan.jsx`, non-broiler equivalent of Vaksinasi)

**Expected mutations:** mostly already factory-covered. Look for inline `supabase.from(...).update/delete()` in pages, plus reproduksi-specific tables (`*_breeding_records`, `*_partus_records`).

**Action name pattern:** `peternak.{entity}.{operation}` — e.g. `peternak.batch.close`, `peternak.batch.update`, `peternak.batch.delete`, `peternak.kandang.create`, `peternak.kandang.assign`, `peternak.breeding.record`, `peternak.partus.record`, `peternak.health.record`.

**Status:** ⏳ Not started

---

### Phase 6.C — Egg Broker

**Scope:** `src/dashboard/broker/egg_broker/**` — smaller surface than Sembako, similar structure.

**Target sub-pages:**
- POS (`POS.jsx`) — egg sales entry
- Inventori (`Inventori.jsx`) — stock + HPP
- Suppliers (`Suppliers.jsx`) — egg supplier CRUD
- Customers (`Customers.jsx`) — buyer CRUD
- Transaksi (`Transaksi.jsx`) — sales history + edits
- Tim Manajemen (`TimManajemenPage.jsx`)
- Akun (`Akun.jsx`)

**Expected mutations:** `egg_sales`, `egg_sale_items`, `egg_purchases`, `egg_inventory`, `egg_suppliers`, `egg_customers`, `egg_payments`.

**Action name pattern:** `egg.{entity}.{operation}` — e.g. `egg.sale.create`, `egg.purchase.create`, `egg.inventory.adjust`, `egg.supplier.update`.

**Status:** ⏳ Not started

---

### Phase 6.D — RPA (Rumah Potong)

**Scope:** Sub-pages not yet covered.

**Target sub-pages:**
- Hutang (`Hutang.jsx`) — debt tracking edits beyond FormBayar
- Distribusi (`Distribusi.jsx`) — customer delivery flow
- Distribusi Detail (`DistribusiDetail.jsx`) — per-customer detail + edits
- Customers (RPA customer CRUD in `useRPAData.js`)
- Products / pricing (`useRPAData.js`)

**Expected mutations:** `rpa_customer_payments` (debt update), `rpa_invoices` (delivery), `rpa_customers` CRUD, `rpa_products` CRUD, `rpa_orders` updates.

**Action name pattern:** `rpa.{entity}.{operation}` — e.g. `rpa.customer.create`, `rpa.customer_payment.create`, `rpa.invoice.create`, `rpa.distribution.update`.

**Status:** ⏳ Not started

---

### Phase 6.E — Admin

**Scope:** `src/dashboard/admin/**` — CRUD operations performed by superadmin.

**Target sub-pages:**
- AdminUsers — user CRUD, role changes, impersonation requests
- AdminSubscriptions — plan changes, manual extensions, expired plan downgrades
- AdminPricing — plan_configs / pricing tier CRUD
- AdminActivity — likely read-only, verify

**Expected mutations:** `profiles` admin-side updates (role, plan), `tenants` plan changes, `plan_configs` already partially covered via AdminSettings (Phase 6.3), `global_audit_logs` (extends audit coverage).

**Action name pattern:** `admin.{entity}.{operation}` — e.g. `admin.user.update`, `admin.user.role_change`, `admin.subscription.extend`, `admin.subscription.downgrade`, `admin.pricing.update`.

**Status:** ⏳ Not started

---

### Phase 6.F — Cross-vertical / Shared

**Scope:** Components and hooks shared across all verticals.

**Target areas:**
- Tim management (`tim/Tim.jsx`) — team invite/accept/revoke, role assignment
- Per-vertical Akun pages — beyond `AkunPreview`, each vertical has its own `Akun.jsx`
- DailyTask (`daily_task/*`) — task assign/complete
- Notifications mutations (mark read, delete) — `useNotifications.jsx`
- Kandang-view drag/drop slot moves (cross-vertical shared)
- Anak Kandang worker CRUD

**Expected mutations:** `team_invitations` CRUD, `tasks` CRUD, `notifications` update/delete, worker CRUD (`anak_kandang_*` tables).

**Action name pattern:** `{area}.{entity}.{operation}` — e.g. `team.invitation.create`, `team.invitation.accept`, `task.assign`, `task.complete`, `notification.mark_read`.

**Status:** ⏳ Not started

---

## Definition of Done (per phase)

A phase is DONE when ALL of:

1. ✅ Every mutation in target sub-pages either logged or explicitly marked N/A in this doc
2. ✅ `npm run build` succeeds
3. ✅ `npx eslint <touched files>` clean within the per-phase lint policy (see below)
4. ✅ INVENTORY.md updated:
   - New action_names appended to Action Name Index (alphabetical)
   - New file entry in Per-File Coverage (concise — coverage + action_names + 1-line notes)
   - Folder Tree updated if structurally new file added
5. ✅ ROADMAP.md updated:
   - Vertical Coverage Matrix cells flipped from ⏳ to ✅ (or 🟡 if partial)
   - Phase status flipped from ⏳ to ✅ DONE
   - Any new gaps/insights captured in next-phase notes
6. ✅ Validation SQL spot-check (optional but recommended): superadmin runs Phase quick-check query after manual test of touched flows — verify happy path produces 0 logs and error simulation produces the expected `action_name`
7. ✅ Sensitive data audit: no tokens/passwords/sessions/raw form payloads/email values in any new metadata fields

---

## Per-Phase Lint Policy

Boundary table to prevent scope creep into project-wide lint cleanup:

| Lint scenario | Action |
|---------------|--------|
| **New error introduced** by phase changes (e.g. import added but mis-spelled) | ✅ Fix in phase (wajib) |
| **Pre-existing error** in file touched by phase, fix is safe + minimal (single-line removal, unused import) | ✅ Fix in phase |
| **Pre-existing error** in file touched by phase, fix requires structural change (refactor exports, split file, change hook deps shape) | ⚠️ Document in Lint Debt Log, skip in this phase |
| **Pre-existing error in untouched file** | ❌ Skip — out of phase scope |
| **`react-hooks/rules-of-hooks` in touched file** (real bug indicator) | ⚠️ Investigate — if fix is small + safe, do it; if large, escalate to separate fix-phase |
| **Cosmetic warning** (motion JSX false-positive, react-refresh, set-state-in-effect) | ✅ Already suppressed via eslint.config.js — no action needed |

**Run command per phase:**
```bash
npx eslint <space-separated list of files touched in this phase>
```

Do NOT run `npx eslint .` or `npx eslint src` during a phase — too noisy, draws attention to out-of-scope debt.

---

## Lint Debt Log

Running list of pre-existing lint issues encountered in touched files but deferred (per policy). Each entry: `{file, rule, line, brief explanation, why deferred}`.

When the dedicated lint-cleanup phase happens, this log becomes the work list.

### Phase 6.A — Sembako Broker sweep ✅ resolved within phase

| File | Rule | Approx line | Resolution |
|------|------|-------------|------------|
| `src/lib/hooks/useSembakoData.js` | `no-unused-vars` × 2 (`reason`, `notes`) | 1100 (in `useAdjustBatchStock`) | Pre-existing destructured-but-unused args. Removed from destructuring (safe + minimal). |

No deferred debt — all lint errors in touched file were within boundary of "safe + minimal" and fixed in-phase.

### Phase 6.B — TBD (Peternak Fattening detail)

_No entries yet._

### Phase 6.C — TBD (Egg Broker)

_No entries yet._

### Phase 6.D — TBD (RPA)

_No entries yet._

### Phase 6.E — TBD (Admin)

_No entries yet._

### Phase 6.F — TBD (Cross-vertical)

_No entries yet._

### Pre-Phase 6.A inherited debt

From Phase 6.0–6.3 touched files, residual pre-existing errors that did NOT block their phases:

| File | Rule | Approx line | Note |
|------|------|-------------|------|
| `src/lib/hooks/useAuth.jsx` | `react-refresh/only-export-components` × 3 | 189, 205, 209 | `useAuth`/`getBrokerBasePath`/`getPeternakBasePath` exported alongside `AuthProvider` component. Fix = split hooks/components to separate file. Out of logging scope. |
| `src/lib/hooks/useAuth.jsx` | `react-hooks/exhaustive-deps` | 124 | `fetchAuthData` missing from `useEffect` deps. Stable ref so functionally OK; fix = `useCallback` or move into effect. |
| `src/lib/hooks/createPenggemukanHooks.js` | `no-undef` `process` × 6 | 1358, 1544, 1557, 1574, 1644, 1787 | Browser code references `process.env.X` — needs migration to `import.meta.env.X` (Vite native) or guarded check. Functional impact only if those code paths run in browser without polyfill. |
| `src/dashboard/_shared/components/BusinessModelOverlay.jsx` | `react-hooks/set-state-in-effect` (downgraded to warn) | various | Pattern: derived state synced from async query data. Intentional. |
| `src/pages/AuthCallback.jsx` | `react-hooks/set-state-in-effect` (downgraded to warn) | 42 | `setPhase('error')` inside useEffect. Intentional state machine. |

---

## Validation SQL (per phase)

After each phase, run as superadmin to verify:

```sql
-- Generic: list all logs from instrumented action_names
SELECT created_at, source, component, action_name, error_code, error_message, metadata
FROM public.system_error_logs
WHERE action_name LIKE 'sembako.%'    -- swap prefix per phase: peternak.%, egg.%, rpa.%, admin.%, team.%, etc.
ORDER BY created_at DESC
LIMIT 30;

-- Partial-commit detector (for multi-step mutations)
SELECT created_at, component, action_name, error_message, metadata
FROM public.system_error_logs
WHERE metadata->>'partial' = 'true'
ORDER BY created_at DESC LIMIT 30;
```

Expected: happy path produces **0 rows**. Error simulation produces rows with the **specific `action_name`** added in the phase.

If a row appears during normal usage, that's a bug to investigate — log surfaces the failure, but the failure itself needs root-cause.

---

## Update Flow (for future phases)

```
Start a phase:
  1. Read this file: confirm phase scope + target sub-pages + expected mutations
  2. Verify INVENTORY.md current state (which files already touched)
  3. Verify nothing in Pre-Phase inherited debt is blocking

Execute the phase:
  4. Instrument target mutations per the patterns in INVENTORY.md
  5. Run `npx eslint <touched files>` — fix per Lint Policy boundary
  6. Run `npm run build` — must pass
  7. Spot-check Validation SQL on a dev env if available

Close the phase:
  8. Update INVENTORY.md:
     - Action Name Index: append new action_names alphabetically
     - Folder Tree: add new file entries
     - Per-File Coverage: append new file sections (keep brief)
  9. Update ROADMAP.md (this file):
     - Vertical Coverage Matrix: flip ⏳ → ✅ (or 🟡 if partial)
     - Phase section: flip status to ✅ DONE, note any deferred items
     - Lint Debt Log: append any deferred pre-existing errors found
  10. Commit both files in the same change as the code instrumentation
```

---

## Out of scope (intentional non-goals)

- **Legacy `actionName` renames** (`handleSave`, `submitDaily`, `createCycle`, etc. → dotted convention). Single dedicated rename phase, not mixed with instrumentation.
- **Broad project-wide lint cleanup** — separate task; this roadmap only touches lint of files in the active phase.
- **Audit trail logging** — `global_audit_logs` is separate from `system_error_logs`; this roadmap only covers the error-logging table.
- **Schema / RLS / trigger / RPC modifications** — frozen at Phase 6.0B level. Future schema changes only via dedicated migration phases, not as part of an instrumentation sweep.
- **Logger utility refactors** (`errorLogger.js`, `supabaseLogger.js`, `actionLogger.js`) — stable. Extend via new call sites, not internal changes.
- **Pre-auth coverage extensions** — Phase 6.0B was a one-time scope; new pre-auth paths (e.g. password reset) are deferred until concrete user demand.
