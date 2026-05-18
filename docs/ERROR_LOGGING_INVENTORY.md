# TernakOS Error Logging Inventory

> **Source of truth**: this file documents every place in the codebase that writes to `public.system_error_logs`, plus the global capture infrastructure that feeds into it. Generated from a verified grep of `actionName:` literals in `src/`. Update whenever a new instrumentation point is added.

---

## Status Summary

| Phase | Scope | Status |
|-------|-------|--------|
| Phase 1 | DB migration (`system_error_logs` table + RLS + indexes + enhanced cols) | ✅ DONE |
| Phase 2 | Logger utilities (`errorLogger.js`, `supabaseLogger.js`, `actionLogger.js`) | ✅ DONE |
| Phase 3 | Global capture (`ErrorBoundary`, `window.onerror`, `onunhandledrejection`) | ✅ DONE |
| Phase 4 | `/admin/info` dashboard (`AdminInfo.jsx`) | ✅ DONE |
| Phase 5 | Initial instrumentation (Akun, RecycleBin, RPAProfile, 404) | ✅ DONE |
| Phase 6.0 | Auth + Onboarding (Login, Register, AuthCallback, BusinessModelOverlay, OnboardingFlow, TutorialOverlay) | ✅ DONE |
| Phase 6.0B | Pre-auth `log_pre_auth_error` RPC + frontend fallback | ✅ DONE |
| Phase 6.1 | Tier A: SiklusSheet, FormBayarModal × 2, InputHarianSheet, useAuth.switchTenant | ✅ DONE |
| Phase 6.2 | Tier B: useAuth.fetchAuthData, createPenggemukanHooks, useUpdateDelivery | ✅ DONE |
| Phase 6.3 | Tier C: Vaksinasi, Kandang broker, FormBeli, AdminSettings audit, Armada, useCreatePurchaseOrder | ✅ DONE |
| Phase 6.A | Sembako Broker sweep (useSembakoData — 21 mutation hooks) | ✅ DONE |
| Phase 6.B | Peternak Fattening detail (createPenggemukanHooks + usePeternakTaskData) | ✅ DONE |
| Phase 6.C | Egg Broker (Customers + Suppliers + Inventori + POS sale flow) | ✅ DONE |
| Phase 6.D | RPA (Hutang / Distribusi) | ✅ DONE |
| Phase 6.E | Admin (Users / Subscriptions / Pricing) | ⏸️ BACKLOG |
| Phase 6.F | Cross-vertical (Tim / Akun / DailyTask / Notifications) | ⏸️ BACKLOG |
| Broad lint cleanup | Project-wide unused-vars / hook-deps | ⏸️ PAUSED — separate task |

---

## Folder Tree (instrumented files)

```
src/
├── main.jsx                                  ← window.onerror + onunhandledrejection
├── App.jsx                                   ← (foundation: route wiring only)
├── components/
│   └── ErrorBoundary.jsx                     ← componentDidCatch → logError
├── lib/
│   ├── logger/
│   │   ├── errorLogger.js                    ← logError() + logPreAuthError() + setLoggerContext()
│   │   ├── supabaseLogger.js                 ← logSupabaseError() wrapper + classification
│   │   └── actionLogger.js                   ← withActionLogging() helper
│   └── hooks/
│       ├── useAuth.jsx                       ← fetchAuthData (Phase 6.2) + switchTenant (Phase 6.1) + AuthProvider context inject
│       └── useRPAData.js                     ← useCreatePurchaseOrder + useCreateCustomer + useUpdateCustomer + useCreateProduct + useCreateInvoice (partial) + useRecordCustomerPayment (partial) + useCreateRPAPayment + useUpdatePurchaseOrder + useUpsertRPAProfile (tenants + rpa_profiles) (Phase 5 + 6.3 + 6.D)
│       ├── createPenggemukanHooks.js         ← 4 core hooks (Phase 6.2) + 19 more (Phase 6.B) covers all domba/kambing/sapi penggemukan mutations
│       ├── usePeternakTaskData.js            ← 2 farm-wide ops cost hooks for Listrik & Air page (Phase 6.B)
│       ├── useUpdateDelivery.js              ← delivery → sale/loss/notification flow (Phase 6.2)
│       └── useSembakoData.js                 ← 21 mutation hooks: customer/supplier/employee/product/delivery/payroll/stock CRUD + multi-step sale/payment/return/adjust (Phase 6.A)
├── pages/
│   ├── Login.jsx                             ← OAuth, signIn, profile fetch, unexpected (Phase 6.0)
│   ├── Register.jsx                          ← OAuth, signUp, invite flow, profile timeout (Phase 6.0)
│   ├── AuthCallback.jsx                      ← hash error, no_session, profile fetch, .catch unexpected (Phase 6.0)
│   └── NotFound.jsx                          ← 404 route logging (Phase 5)
└── dashboard/
    ├── admin/
    │   ├── AdminInfo.jsx                     ← /admin/info dashboard reader (Phase 4)
    │   └── AdminSettings.jsx                 ← logAuditTrail audit-of-audit (Phase 6.3)
    ├── _shared/
    │   ├── components/
    │   │   ├── BusinessModelOverlay.jsx      ← RPC + profile/tenant update + batch + fatal + missing_tenant (Phase 6.0)
    │   │   ├── TutorialOverlay.jsx           ← profiles.tutorials_completed direct UPDATE (Phase 6.0 + post-fix bypass RPC)
    │   │   ├── FormBeliModal.jsx             ← purchases.insert + farms population partial sync (Phase 6.3)
    │   │   └── forms/
    │   │       └── FormBayarModal.jsx        ← broker payment sequential (Phase 6.1)
    │   ├── forms/
    │   │   └── FormBayarModal.jsx            ← RPA payment Promise.allSettled per-row (Phase 6.1)
    │   └── pages/
    │       ├── OnboardingFlow.jsx            ← redirect_failed for unmapped vertical (Phase 6.0)
    │       └── AkunPreview.jsx               ← logout + EditProfileSheet save (Phase 5)
    ├── peternak/
    │   ├── _shared/components/
    │   │   ├── SiklusSheet.jsx               ← breeding_cycles + cycle_expenses partial (Phase 6.1)
    │   │   └── InputHarianSheet.jsx          ← daily_records.insert (Phase 6.1)
    │   └── broiler/
    │       └── Vaksinasi.jsx                 ← vaccination_records.insert (Phase 6.3)
    ├── broker/
    │   ├── poultry_broker/
    │   │   ├── Kandang.jsx                   ← farms.create/update/delete (Phase 6.3)
    │   │   └── Armada.jsx                    ← vehicles + drivers CRUD (Phase 6.3)
    │   ├── egg_broker/
    │   │   ├── Customers.jsx                 ← egg_customers CRUD (Phase 6.C)
    │   │   ├── Suppliers.jsx                 ← egg_suppliers CRUD (Phase 6.C)
    │   │   ├── Inventori.jsx                 ← egg_inventory CRUD (Phase 6.C)
    │   │   └── POS.jsx                       ← egg_sales + egg_sale_items multi-step (Phase 6.C)
    │   └── sembako_broker/components/
    │       └── SembakoRecycleBin.jsx         ← restore + deletePermanent catch (Phase 5)
    └── rumah_potong/
        └── rpa/components/
            └── RPAProfileForm.jsx            ← (uses useUpsertRPAProfile — actual log lives in useRPAData.js mutationFn)
        <!-- All RPA Hutang/Distribusi mutations log from useRPAData.js hooks (Phase 6.D) -->
```

Supporting infra (not in `src/`):

```
supabase/migrations/_archive/
├── 20260517_system_error_logs.sql            ← Phase 1 table + RLS + indexes (+ enhanced cols via user-applied edits)
└── 20260517_log_pre_auth_error.sql           ← Phase 6.0B SECURITY DEFINER RPC for pre-session errors
```

---

## Per-File Coverage

### `src/main.jsx`
**Phase:** 3 (Global capture)
**Coverage:**
- `window.onerror` → uncaught JS runtime errors
- `window.onunhandledrejection` → unhandled async promise rejections

**Sources:** `frontend`, `unhandled_rejection`
**Notes:** SSG-safe (guarded by `typeof window !== 'undefined'`). Dynamically imports `errorLogger` so SSG render does not pull it.

---

### `src/components/ErrorBoundary.jsx`
**Phase:** 3
**Coverage:**
- React component tree crash via `componentDidCatch`

**Source:** `react_error_boundary`
**Notes:** Fire-and-forget logError (no await). Renders visible fallback UI on `hasError`.

---

### `src/lib/logger/errorLogger.js`
**Phase:** 2 + 6.0B
**Coverage:**
- `logError({ level, source, component, actionName, error, metadata })` — main entry
- `logPreAuthError({ component, actionName, error, metadata })` — public helper for known-pre-session paths
- `setLoggerContext({ userId, tenantId, vertical, role })` — context injection from AuthProvider
- Internal `_sendPreAuthRpc` → SECURITY DEFINER RPC fallback when source='auth' and no session
- Redaction (`password|token|secret|apikey|...` recursive strip)
- Throttle (max 5/min per `source:message:component` key)
- Table-unavailable detection (one-time warn, suppress remainder of session)
- Warn-once for "no authenticated user" skips

**Notes:** Never throws. All catch blocks internal.

---

### `src/lib/logger/supabaseLogger.js`
**Phase:** 2
**Coverage:**
- `logSupabaseError(error, { table, operation, component, actionName, tenantId })` — classifies Supabase errors
- Error class taxonomy: `policy_error` (42501, PGRST301), `rls_error`, `constraint_error` (23505), `network_error`, `rpc_error` (P0001), `supabase_error` (default)

**Notes:** Forwards to `logError` with `source: 'supabase'`. Does NOT pass arbitrary `metadata` (callers that need extra metadata call `logError({ source: 'supabase' })` directly).

---

### `src/lib/logger/actionLogger.js`
**Phase:** 2
**Coverage:**
- `withActionLogging(actionName, handler, { component })` — wraps async handler, catches + logs + re-throws

**Notes:** Currently underused — most call sites inline their own try/catch instead. Available as a helper if a future flow wants consistent action wrapping.

---

### `src/lib/hooks/useAuth.jsx`
**Phase:** 6.1 + 6.2
**Coverage:**
- **Phase 6.1**: `switchTenant()` — `profiles.update()` failure
- **Phase 6.2**: `fetchAuthData(userId)` — profiles select + tenant_memberships select
- Logger context injection (early `userId`, late full context with fallback)

**Action names:**
- `switchTenant`
- `auth.fetch_profiles`
- `auth.fetch_memberships`

**Notes:** Sets logger context BEFORE the supabase calls so RLS INSERT policy (`user_id = auth.uid()`) is satisfied. Final context call falls back `active?.auth_user_id || userId` to preserve userId when active profile is null (fresh signup mid-onboarding).

---

### `src/lib/hooks/useRPAData.js`
**Phase:** 5 + 6.3 + 6.D
**Coverage:**
- **Phase 5**: `useUpsertRPAProfile` — RPA profile upsert failure
  - originally logged in `onError`; **Phase 6.D** moved logging into `mutationFn` (separate sites for `tenants.update` and `rpa_profiles.upsert`)
- **Phase 6.3**: `useCreatePurchaseOrder.mutationFn` — `rpa_purchase_orders.insert` failure
- **Phase 6.D** (new):
  - `useCreateCustomer.mutationFn` — `rpa_customers.insert` failure
  - `useUpdateCustomer.mutationFn` — `rpa_customers.update` failure
  - `useCreateProduct.mutationFn` — `rpa_products.insert` failure
  - `useCreateInvoice.mutationFn` — `rpa_invoices.insert` failure; **partial-commit** if `rpa_invoice_items.insert` fails after header is committed
  - `useRecordCustomerPayment.mutationFn` — `rpa_customer_payments.insert` failure; **partial-commit** on invoice fetch failure (`sync_invoice_fetch`) or invoice status update failure (`sync_invoice_status`)
  - `useCreateRPAPayment.mutationFn` — `rpa_payments.insert` failure (Hutang → broker payment)
  - `useUpdatePurchaseOrder.mutationFn` — `rpa_purchase_orders.update` failure
  - `useUpsertRPAProfile.mutationFn` — `tenants.update` (business_name) and `rpa_profiles.upsert` — two separate `logSupabaseError` calls

**Action names:**
- `rpa.purchase_order.create` (Phase 6.3)
- `rpa.purchase_order.update` (Phase 6.D)
- `rpa.customer.create` (Phase 6.D)
- `rpa.customer.update` (Phase 6.D)
- `rpa.product.create` (Phase 6.D)
- `rpa.invoice.create` (Phase 6.D)
- `rpa.invoice.create_items` (Phase 6.D — partial commit; `metadata.partial: true`)
- `rpa.customer_payment.create` (Phase 6.D)
- `rpa.customer_payment.sync_invoice_fetch` (Phase 6.D — partial commit; `metadata.partial: true`)
- `rpa.customer_payment.sync_invoice_status` (Phase 6.D — partial commit; `metadata.partial: true`)
- `rpa.hutang_payment.create` (Phase 6.D — broker debt payment via `rpa_payments`)
- `rpa.profile.update_business_name` (Phase 6.D)
- `rpa.profile.upsert` (Phase 6.D)

**Notes:**
- All three `useRecordCustomerPayment` partial-commit paths use `logError` directly (not `logSupabaseError`) so that `metadata.partial: true` propagates correctly.
- `rpa.invoice.create_items` fires only when the invoice header is already committed — this is a data-integrity signal for superadmin reconciliation.
- `rpa_payments` (broker debt payments) is a separate table from `rpa_customer_payments` (customer invoice payments) — action names reflect this distinction.
- `Hutang.jsx` / `Distribusi.jsx` / `DistribusiDetail.jsx` contain no direct Supabase mutations — all flows go through the hooks above.

---

### `src/lib/hooks/createPenggemukanHooks.js`
**Phase:** 6.2 Tier B + 6.B Peternak Fattening sweep

**Coverage (Phase 6.2 — core create flows):**
- `useCreateBatch` — batch insert
- `useAddAnimal` — animal insert + count sync + batch total_animals sync (multi-step)
- `useBulkAddAnimals` — bulk animals insert + count sync + batch sync
- `useAddSale` — sale insert + animals status='sold' sync (partial commit risk)

**Coverage (Phase 6.B — every remaining mutation in the factory):**
- `useCloseBatch` — `batches.update status=closed`
- `useUpdateAnimal` — `animals.update` (edit individual animal)
- `useUpdateAnimalStatus` — `animals.update status/exit_date` (manual lifecycle change)
- `useAddWeightRecord` — weight insert + `animals.latest_weight_kg` sync (partial)
- `useAddFeedLog` — `feed.upsert` per kandang/log_date
- `useAddHealthLog` — `health.insert` + conditional `animals.status='dead'` for `kematian` (partial)
- `useDeleteFeedLog` / `useDeleteWeightRecord` / `useDeleteHealthLog` — soft-delete `is_deleted=true`
- `useDeleteSale` — sale soft-delete + revert animals to `status='active'` (partial commit risk)
- `useUpdateSale` — `sales.update` (edit existing penjualan row)
- `useCreateKandang` / `useUpdateKandang` / `useDeleteKandang` / `useUpdateKandangPosition` — Denah Kandang CRUD
- `useMoveAnimalToKandang` — `animals.update kandang_id/slot` (used by drag-drop Denah Kandang; has optimistic update + rollback in onError)
- `useAddOperationalCost` / `useDeleteOperationalCost` — per-batch ops cost (legacy form, separate from farm-wide Listrik & Air)
- `useEnsureHoldingPen` — check + create `is_holding=true` kandang (Phase 6.B treats SELECT and INSERT as 2 logged steps)

**Action names (Phase 6.2):**
- `peternak.batch.create`
- `peternak.animal.add` / `peternak.animal.add.count_sync` / `peternak.animal.add.batch_sync`
- `peternak.animal.bulk_add` / `peternak.animal.bulk_add.count_sync` / `peternak.animal.bulk_add.batch_sync`
- `peternak.sale.create` / `peternak.sale.create.animal_sync`

**Action names (Phase 6.B):**
- `peternak.batch.close`
- `peternak.animal.update` / `peternak.animal.update_status` / `peternak.animal.move_kandang`
- `peternak.weight_record.create` / `peternak.weight_record.create.animal_sync` (partial) / `peternak.weight_record.delete`
- `peternak.feed_log.create` / `peternak.feed_log.delete`
- `peternak.health_log.create` / `peternak.health_log.create.animal_sync` (partial) / `peternak.health_log.delete`
- `peternak.sale.update` / `peternak.sale.delete` / `peternak.sale.delete.animal_sync` (partial)
- `peternak.kandang.create` / `peternak.kandang.update` / `peternak.kandang.update_position` / `peternak.kandang.delete`
- `peternak.operational_cost.create` / `peternak.operational_cost.delete`
- `peternak.holding_pen.ensure.check` / `peternak.holding_pen.ensure.create`

**Notes:**
- Hook factory `createPenggemukanHooks(prefix)` — each name binds to per-vertical prefix (`domba`, `kambing`, `sapi`), and the `component` field is always `createPenggemukanHooks` (vertical is recoverable from `metadata.table` like `domba_penggemukan_animals`).
- Happy path produces 0 error logs.
- Multi-step mutations flag `metadata.partial: true` when step 1 succeeds but step 2/3 fails (e.g. animals inserted but `batches.total_animals` sync failed → reconcile manually). New Phase 6.B partial sites: `weight_record.create.animal_sync` (latest_weight_kg), `health_log.create.animal_sync` (animal `status='dead'` after kematian record), `sale.delete.animal_sync` (revert animals to active after sale soft-delete).
- `useAddHealthLog`'s `kematian` branch preserves original behaviour — the animal status update is logged on failure but **not thrown** (consistent with pre-Phase 6.B fire-and-forget). All other animal_sync sites still throw.
- `useMoveAnimalToKandang` keeps its optimistic-update + onError rollback; the new log point fires on the server error before the rollback toast.
- Sub-step partial logs use `logError({ source: 'supabase' })` directly (because `logSupabaseError` doesn't forward arbitrary metadata).
- `useEnsureHoldingPen` is split into `ensure.check` (SELECT) and `ensure.create` (INSERT) so superadmin can distinguish a permissions denial on read vs write.

---

### `src/lib/hooks/usePeternakTaskData.js`
**Phase:** 6.B Peternak Fattening sweep

**Coverage:**
- `useAddFarmOpsCost(animalType)` — farm-wide Listrik & Air cost split across all active batches by animal proportion. Each row goes into `${animalType}_penggemukan_operational_costs`.
- `useDeleteFarmOpsCost(animalType)` — soft-delete one row (`is_deleted=true`).

**Action names:**
- `peternak.farm_ops_cost.create`
- `peternak.farm_ops_cost.delete`

**Notes:**
- Powers the `Listrik & Air` page (`src/dashboard/peternak/_shared/components/FarmOpsCostSheet.jsx` or equivalent).
- `table` is dynamic per `animalType` (e.g. `domba_penggemukan_operational_costs`); animalType recoverable from the `metadata.table` field at log time.
- Out of Phase 6.B scope (kept for backlog): the query hooks in this file (`usePeternakTaskTemplates`, etc.) and the `useTenantWorkerPayments` family — read-only, no mutation = nothing to log here. Worker-payment mutations live in `useKandangWorkerData.js` (Phase 6.F backlog).

---

### `src/lib/hooks/useUpdateDelivery.js`
**Phase:** 6.2 Tier B
**Coverage:** Sequential broker delivery update flow — 6 steps, each with its own log point

**Action names:**
- `broker.delivery.fetch` (initial delivery select)
- `broker.delivery.update` (status/weights update)
- `broker.sale.delivery_sync` (sales.total_revenue sync — non-fatal, was console.error only)
- `broker.loss_report.cleanup` (delete old loss_reports for delivery)
- `broker.loss_report.create` (insert new mortality/shrinkage rows)
- `broker.notification.create` ("Pengiriman Tiba" notification)

**Notes:**
- Operations are sequential, not `Promise.all` over mutations — no `allSettled` migration needed.
- `Promise.all` at the end of the function (line ~205) wraps `queryClient.invalidateQueries` calls (cache invalidation, not data mutations) and stays as-is.

---

### `src/pages/Login.jsx`
**Phase:** 6.0
**Coverage:**
- Google OAuth init catch
- `signInWithPassword` error branch
- `profiles` fetch error after sign-in
- Outer `catch (err)` for unexpected throws

**Action names:**
- `login.oauth_google`
- `login.submit`
- `login.fetch_profiles`
- `login.unexpected`

**Source:** `auth` (uses pre-auth RPC fallback when no session yet); `supabase` for profiles fetch

**Notes:** Only `method` (`'email' | 'google'`) is logged in metadata. **Never** logs email, password, tokens, or form payload.

---

### `src/pages/Register.jsx`
**Phase:** 6.0
**Coverage:**
- Google OAuth init catch
- Invite invalid / status≠pending
- Invite expired
- `waitForProfile()` timeout
- Invite signup outer catch
- Mandiri signup outer catch

**Action names:**
- `register.oauth_google`
- `register.invite_invalid`
- `register.invite_expired`
- `register.wait_profile_timeout`
- `register.invite_submit`
- `register.submit`

**Source:** `auth`
**Notes:** Logs `method` (`'email' | 'google' | 'invite' | 'invite_code'`) only. Never logs the invite code value, full name, email, or password.

---

### `src/pages/AuthCallback.jsx`
**Phase:** 6.0
**Coverage:**
- URL hash error params (`otp_expired`, `access_denied`, etc.) — only `error_code`, never the token
- `getSession()` returned no session
- `profiles` fetch failure after callback
- Outer `.catch()` for unexpected throws (added to prevent silent promise hang → blank page)

**Action names:**
- `auth.callback_error`
- `auth.callback_no_session`
- `auth.callback_fetch_profiles`
- `auth.callback_unexpected`

**Source:** `auth` / `supabase` (profiles fetch)
**Notes:** **Never** logs raw `window.location.hash` content — only the `error_code` extracted from query params. Pre-fix would silently hang at LoadingScreen if `getSession().then()` chain threw.

---

### `src/pages/NotFound.jsx`
**Phase:** 5
**Coverage:**
- 404 route hit logging via `useEffect`

**Action names:**
- `route.not_found`

**Source:** `not_found`, level `warning`
**Notes:** SSG-safe (`typeof window !== 'undefined'` guard). Logs `path`, `search`, `referrer` in metadata.

---

### `src/dashboard/admin/AdminInfo.jsx`
**Phase:** 4
**Coverage:** **READER**, not instrumented — this is the `/admin/info` dashboard that displays logs. Uses `supabase.from('system_error_logs').select(...)` with RLS enforcing superadmin visibility.

**Notes:** Has its own internal error states (handled via React Query); does not write back to `system_error_logs` to avoid log loops.

---

### `src/dashboard/_shared/components/BusinessModelOverlay.jsx`
**Phase:** 6.0
**Coverage:**
- `create_new_business` RPC error
- `profiles.update` failure (P0001 "cannot change user_type" trigger)
- `tenants.update` failure
- Initial batch insert (non-fatal — penggemukan setup step)
- `saveAndComplete` outer catch (fatal)
- Invalid/missing `resolvedTenantId` before update

**Action names:**
- `onboarding.create_new_business`
- `onboarding.update_profile`
- `onboarding.update_tenant`
- `onboarding.insert_initial_batch`
- `onboarding.saveAndComplete_fatal`
- `onboarding.missing_tenant_id`

**Notes:**
- P0001 case has special friendly toast: "Tidak bisa mengubah tipe bisnis akun ini. Buat bisnis baru lewat menu Tambah Bisnis."
- Default-broker user picking a different vertical now routes via `userTypeMismatch` → `create_new_business` RPC (sidesteps the trigger), so this code path should rarely fire in practice anymore.

---

### `src/dashboard/_shared/components/TutorialOverlay.jsx`
**Phase:** 6.0 + post-fix bypass
**Coverage:**
- `profiles.tutorials_completed` direct UPDATE (replaces broken `append_tutorial_completed` RPC call)

**Action names:**
- `tutorial.complete.read` (initial SELECT to fetch current tutorials_completed)
- `tutorial.complete.write` (the UPDATE merge)
- `tutorial.complete.exception` (catch-all try/catch wrapper)

**Notes:** Original RPC signature was `(p_key, p_value)` but the frontend passed 3 args including `p_tenant_id` → 404. Replaced with `read-merge-write` direct UPDATE since `authenticated` has GRANT UPDATE on `tutorials_completed` column. Uses `profile.profile_id ?? profile.id` fallback for compatibility with RPC-created profiles that don't have a `tenant_memberships` row yet.

---

### `src/dashboard/_shared/components/forms/FormBayarModal.jsx`
**Phase:** 6.1
**Coverage:** Broker payment — sequential `payments.insert` + `sales.update`

**Action names:**
- `submitPayment` (applies to both error branches; differentiated by `table` field: `payments` vs `sales`)

**Notes:** Uses standard `logSupabaseError` (no extra metadata needed). Used by `poultry_broker/Transaksi.jsx` and `SaleAuditSheet.jsx`.

---

### `src/dashboard/_shared/forms/FormBayarModal.jsx`
**Phase:** 6.1
**Coverage:** RPA payment — multi-row `Promise.allSettled` over `sales.update` (debt-allocation across multiple unpaid sales)

**Action names:**
- `submitPayment`

**Notes:**
- Migration from `Promise.all` (fail-fast) → `Promise.allSettled` (continue + collect failures).
- Each failed row logged separately with `metadata.row_index`.
- Outer catch also instrumented for load/validate phase errors.
- Used by `dashboard/_shared/pages/RPA.jsx`.

---

### `src/dashboard/_shared/pages/OnboardingFlow.jsx`
**Phase:** 6.0
**Coverage:**
- Unmapped vertical in `KEY_TO_PATH` → falls through to `navigate('/')`

**Action names:**
- `onboarding.redirect_failed`

**Source:** `route_guard`
**Notes:** Metadata includes `vertical`, `role`, `hasTenant` (boolean) — does NOT log full profile/tenant objects.

---

### `src/dashboard/_shared/pages/AkunPreview.jsx`
**Phase:** 5
**Coverage:**
- `handleLogout` — `supabase.auth.signOut()` error
- `EditProfileSheet.handleSave` — `profiles.update()` error

**Action names:**
- `handleLogout`
- `handleSave`

**Notes:** Predates dotted convention — names are React handler names. Functionally complete; rename to `account.logout` / `account.edit_profile.save` is cosmetic, deferred.

---

### `src/dashboard/peternak/_shared/components/SiklusSheet.jsx`
**Phase:** 6.1
**Coverage:**
- `breeding_cycles.insert` error
- `cycle_expenses.insert` error (partial commit — cycle exists but expense baseline missing)

**Action names:**
- `createCycle`
- `createCycleExpenses` (with `metadata.partial: true, cycle_id`)

**Notes:** Predates dotted convention. Rename to `peternak.siklus.create` / `peternak.siklus.expenses_sync` is cosmetic, deferred.

---

### `src/dashboard/peternak/_shared/components/InputHarianSheet.jsx`
**Phase:** 6.1
**Coverage:**
- `daily_records.insert` error

**Action names:**
- `submitDaily`

**Notes:** Predates dotted convention. Rename to `peternak.daily_record.create` is cosmetic, deferred.

---

### `src/dashboard/broker/sembako_broker/components/SembakoRecycleBin.jsx`
**Phase:** 5
**Coverage:**
- `handleRestore` catch — restore a soft-deleted row in `activeTab` table
- `handleDeletePermanent` catch — hard delete with cascade

**Action names:**
- `handleRestore`
- `handleDeletePermanent`

**Notes:** Table is dynamic (`activeTab` ∈ `{sembako_sales, sembako_products, sembako_customers, sembako_deliveries}`). Names not dotted — deferred.

---

### `src/dashboard/rumah_potong/rpa/components/RPAProfileForm.jsx`
**Phase:** 5
**Coverage:** No inline logging — defers to `useUpsertRPAProfile` (hook).

**Notes:** See `src/lib/hooks/useRPAData.js` for the actual log site.

---

### `src/dashboard/peternak/broiler/Vaksinasi.jsx`
**Phase:** 6.3 Tier C
**Coverage:**
- `vaccination_records.insert` failure (in `handleSubmit`)

**Action names:**
- `peternak.vaccination.create`

**Notes:** Logs added before existing `throw error` — toast in outer catch unchanged. Vaksinasi is broiler-specific (not yet generalized to other peternak verticals).

---

### `src/dashboard/broker/poultry_broker/Kandang.jsx`
**Phase:** 6.3 Tier C
**Coverage:** Three farm mutation sites
- `farms.update is_deleted=true` (soft delete, in `handleDelete`)
- `farms.update` (edit existing farm, in form save)
- `farms.insert` (new farm, in form save)

**Action names:**
- `broker.farm.delete`
- `broker.farm.update`
- `broker.farm.create`

**Notes:** All three sites had `if (error) throw error` only → toast generic. Now each logs to `system_error_logs` before the throw; toast/UI behavior preserved.

---

### `src/dashboard/_shared/components/FormBeliModal.jsx`
**Phase:** 6.3 Tier C
**Coverage:** Sequential purchase flow with partial-commit risk
- `purchases.insert` (primary write)
- `farms.update population` (stock-decrement sync — non-fatal, was silent before)

**Action names:**
- `broker.purchase.create`
- `broker.purchase.create.farm_sync` (with `metadata.partial: true, farm_id`)

**Notes:**
- This is the **actually-used** FormBeliModal (imported from `dashboard/_shared/pages/Beranda.jsx`).
- The orphan `src/dashboard/_shared/forms/FormBeliModal.jsx` is NOT instrumented (no callers — flagged in `UNUSED_REDUNDANT_AUDIT.md`).
- Partial commit case: purchase inserted but farm population sync fails → flagged for reconciliation via `metadata.partial: true`.

---

### `src/dashboard/admin/AdminSettings.jsx`
**Phase:** 6.3 Tier C
**Coverage:** Audit-of-audit — capture when the audit trail itself fails to write
- `global_audit_logs.insert` failure (either returned `error` or thrown exception)

**Action names:**
- `admin.audit_trail.create`

**Notes:**
- Both the `if (auditErr)` returned-error branch AND the outer `catch (err)` are instrumented.
- Still **non-blocking** behavior — audit failure does not abort config save (so the toast.success from config save remains correct).
- The `updateConfig.mutateAsync` hook handles its own toast for actual config save failures (see `useAdminData.js` — out of Phase 6.3 scope).

---

### `src/lib/hooks/useSembakoData.js`
**Phase:** 6.A Sembako Broker sweep
**Coverage:** 21 mutation hooks — covers entire Sembako broker dashboard (Penjualan, Pengiriman, Gudang, Produk, TokoSupplier, TimManajemen, Akun, Beranda flows).

**Simple single-step hooks (16):**
- `useCreateSembakoCustomer` / `useUpdateSembakoCustomer` / `useDeleteSembakoCustomer`
- `useCreateSembakoSupplier` / `useUpdateSembakoSupplier` / `useDeleteSembakoSupplier`
- `useCreateSembakoEmployee` / `useUpdateSembakoEmployee`
- `useCreateSembakoDelivery` / `useCompleteSembakoDelivery` / `useStartSembakoDelivery` / `useArriveSembakoDelivery` / `useUpdateSembakoDeliveryTimestamps`
- `useCreateSembakoProduct` / `useUpdateSembakoProduct`
- `useAddStockBatch`
- `useMarkPayrollPaid` / `useRecordPayroll`
- `useRecordSembakoSupplierPayment`

**Multi-step hooks with partial-commit detection (5):**
- `useDeleteSembakoSale` — soft-delete sale + cleanup payments/items/deliveries (3 partial steps)
- `useUpdateSembakoSale` — sale_items replace + sale header update (2 partial steps)
- `useCreateSembakoSale` — sale insert + items insert + stock_batches deduct + stock_out insert (4 partial steps; rollback on deduct failure preserves prior `partial: true` logs)
- `useCreateSembakoReturn` — stock_out cleanup + payments cleanup + sale soft-delete (3 partial steps)
- `useRecordSembakoPayment` — payment insert + sale paid_amount/status sync (1 partial step)
- `useAdjustBatchStock` — batch update + product current_stock sync + stock_out insert (2 partial steps)
- `useSoftDeleteSembakoProduct` — product update + related batches update (1 partial step)

**Action names (all start with `sembako.`):** see Action Name Index below for the full set added in Phase 6.A.

**Notes:**
- Hook factory pattern — most components call these via React Query `useMutation()`. Components themselves don't have inline mutations (only `SembakoRecycleBin.jsx` covered in Phase 5).
- Multi-step partial commits use `logError({ source: 'supabase', metadata: { partial: true, step: '...', sale_id|batch_id|product_id } })` directly because `logSupabaseError` doesn't forward extra metadata.
- `useUpdateSembakoSale` is the most complex — FIFO stock reversal + re-deduct + items replace + header update; partial logs allow superadmin to identify exact failed step for reconciliation.
- `Pegawai.jsx` has an inline `profiles` SELECT (read-only) — no mutation, no instrumentation needed.

**Lint cleanup in this phase:** removed unused destructured args `reason, notes` from `useAdjustBatchStock` (safe + minimal per phase policy).

---

### `src/dashboard/broker/poultry_broker/Armada.jsx`
**Phase:** 6.3 Tier C
**Coverage:** Vehicle + driver CRUD (4 distinct mutation sites)
- Vehicle save (insert OR update — branches on `editingData`)
- Vehicle soft delete (`vehicles.update is_deleted=true`)
- Driver save (insert OR update)
- Driver soft delete (`drivers.update is_deleted=true`)

**Action names:**
- `broker.vehicle.create`
- `broker.vehicle.update`
- `broker.vehicle.delete`
- `broker.driver.create`
- `broker.driver.update`
- `broker.driver.delete`

**Notes:**
- Save handlers compute `isUpdate = !!editingData` once and use it for both the `operation` field and the `actionName` suffix. Keeps differentiation crisp in the log.
- `vehicle_expenses.insert` (line ~1224) is NOT instrumented — out of Phase 6.3 scope, can be added later if needed.

---

### `src/dashboard/broker/egg_broker/Customers.jsx`
**Phase:** 6.C Egg Broker sweep
**Coverage:**
- `handleDelete` — `egg_customers.update is_deleted=true`
- `handleSave` (edit) — `egg_customers.update`
- `handleSave` (new) — `egg_customers.insert`

**Action names:**
- `egg.customer.create` / `egg.customer.update` / `egg.customer.delete`

**Notes:** Inline mutations (no shared hook). Each branch logs via `logSupabaseError` before re-throw — outer `catch (err)` keeps the existing toast intact.

---

### `src/dashboard/broker/egg_broker/Suppliers.jsx`
**Phase:** 6.C Egg Broker sweep
**Coverage:** Mirror of Customers.jsx — `egg_suppliers` CRUD (3 sites).

**Action names:**
- `egg.supplier.create` / `egg.supplier.update` / `egg.supplier.delete`

**Notes:** Identical pattern to `EggCustomers`. Toast / outer catch behaviour preserved.

---

### `src/dashboard/broker/egg_broker/Inventori.jsx`
**Phase:** 6.C Egg Broker sweep
**Coverage:** Egg grade / HPP entry — `egg_inventory` CRUD (3 sites).

**Action names:**
- `egg.inventory.create` / `egg.inventory.update` / `egg.inventory.delete`

**Notes:**
- Toast / outer catch behaviour preserved.
- Bug fix bundled (safe + minimal per lint policy): `InventoryForm` delete button was calling an undefined `handleDelete` (closure miss) — switched to the `onDelete` prop, which also resolved the corresponding `no-unused-vars` warning.

---

### `src/dashboard/broker/egg_broker/POS.jsx`
**Phase:** 6.C Egg Broker sweep
**Coverage:** Multi-step sale flow inside `handleSubmit`
- Step 1: `egg_sales.insert` (with `.select().single()`)
- Step 2: `egg_sale_items.insert` (bulk, after sale row succeeds)

**Action names:**
- `egg.sale.create`
- `egg.sale.create.items` (partial — sale row exists but items insert failed)

**Notes:**
- DB triggers (out of scope) handle stock deduction + customer stats, fired on `egg_sale_items` insert. Partial commit case (sale row + no items) leaves stock unreconciled — `metadata.partial: true, step: 'sale_items_insert', sale_id, item_count` makes superadmin reconciliation possible.
- No raw cart payload logged — only `sale_id` (UUID) + `item_count` (number).
- Outer `catch (err)` keeps the existing `Transaksi gagal: ...` toast intact.

---

## Action Name Index

Sorted alphabetically. All entries below were verified via grep against `actionName:` literals in `src/`.

| action_name | file | phase | purpose |
|---|---|---|---|
| `admin.audit_trail.create` | `src/dashboard/admin/AdminSettings.jsx` | 6.3 | Audit-of-audit — `global_audit_logs.insert` failure (non-blocking) |
| `auth.callback_error` | `src/pages/AuthCallback.jsx` | 6.0 | Hash error params (otp_expired, access_denied) — code only, no token |
| `auth.callback_fetch_profiles` | `src/pages/AuthCallback.jsx` | 6.0 | Profile fetch after callback session resolved |
| `auth.callback_no_session` | `src/pages/AuthCallback.jsx` | 6.0 | getSession() returned no user |
| `auth.callback_unexpected` | `src/pages/AuthCallback.jsx` | 6.0 | Catch-all for promise chain throws (prevents blank-page hang) |
| `auth.fetch_memberships` | `src/lib/hooks/useAuth.jsx` | 6.2 | tenant_memberships SELECT failure |
| `auth.fetch_profiles` | `src/lib/hooks/useAuth.jsx` | 6.2 | profiles SELECT failure during auth bootstrap |
| `broker.delivery.fetch` | `src/lib/hooks/useUpdateDelivery.js` | 6.2 | Initial deliveries select for the update flow |
| `broker.delivery.update` | `src/lib/hooks/useUpdateDelivery.js` | 6.2 | deliveries.update (status, arrived count/weight, mortality) |
| `broker.driver.create` | `src/dashboard/broker/poultry_broker/Armada.jsx` | 6.3 | drivers.insert (new driver) |
| `broker.driver.delete` | `src/dashboard/broker/poultry_broker/Armada.jsx` | 6.3 | drivers.update is_deleted=true (soft delete) |
| `broker.driver.update` | `src/dashboard/broker/poultry_broker/Armada.jsx` | 6.3 | drivers.update (edit existing) |
| `broker.farm.create` | `src/dashboard/broker/poultry_broker/Kandang.jsx` | 6.3 | farms.insert (new farm) |
| `broker.farm.delete` | `src/dashboard/broker/poultry_broker/Kandang.jsx` | 6.3 | farms.update is_deleted=true (soft delete) |
| `broker.farm.update` | `src/dashboard/broker/poultry_broker/Kandang.jsx` | 6.3 | farms.update (edit existing) |
| `broker.loss_report.cleanup` | `src/lib/hooks/useUpdateDelivery.js` | 6.2 | Delete old loss_reports rows before inserting new ones |
| `broker.loss_report.create` | `src/lib/hooks/useUpdateDelivery.js` | 6.2 | Insert mortality + shrinkage rows |
| `broker.notification.create` | `src/lib/hooks/useUpdateDelivery.js` | 6.2 | "Pengiriman Tiba" notification insert |
| `broker.purchase.create` | `src/dashboard/_shared/components/FormBeliModal.jsx` | 6.3 | purchases.insert |
| `broker.purchase.create.farm_sync` | `src/dashboard/_shared/components/FormBeliModal.jsx` | 6.3 | farms.update population sync after purchase (partial commit flag) |
| `broker.sale.delivery_sync` | `src/lib/hooks/useUpdateDelivery.js` | 6.2 | sales.total_revenue cumulative recompute after delivery arrival |
| `broker.vehicle.create` | `src/dashboard/broker/poultry_broker/Armada.jsx` | 6.3 | vehicles.insert (new vehicle) |
| `broker.vehicle.delete` | `src/dashboard/broker/poultry_broker/Armada.jsx` | 6.3 | vehicles.update is_deleted=true (soft delete) |
| `broker.vehicle.update` | `src/dashboard/broker/poultry_broker/Armada.jsx` | 6.3 | vehicles.update (edit existing) |
| `createCycle` | `src/dashboard/peternak/_shared/components/SiklusSheet.jsx` | 6.1 | breeding_cycles.insert |
| `createCycleExpenses` | `src/dashboard/peternak/_shared/components/SiklusSheet.jsx` | 6.1 | cycle_expenses.insert (partial commit flag) |
| `egg.customer.create` | `src/dashboard/broker/egg_broker/Customers.jsx` | 6.C | egg_customers.insert |
| `egg.customer.delete` | `src/dashboard/broker/egg_broker/Customers.jsx` | 6.C | egg_customers.update is_deleted=true |
| `egg.customer.update` | `src/dashboard/broker/egg_broker/Customers.jsx` | 6.C | egg_customers.update |
| `egg.inventory.create` | `src/dashboard/broker/egg_broker/Inventori.jsx` | 6.C | egg_inventory.insert |
| `egg.inventory.delete` | `src/dashboard/broker/egg_broker/Inventori.jsx` | 6.C | egg_inventory.update is_deleted=true |
| `egg.inventory.update` | `src/dashboard/broker/egg_broker/Inventori.jsx` | 6.C | egg_inventory.update |
| `egg.sale.create` | `src/dashboard/broker/egg_broker/POS.jsx` | 6.C | egg_sales.insert (header — first step of multi-step POS submit) |
| `egg.sale.create.items` | `src/dashboard/broker/egg_broker/POS.jsx` | 6.C | egg_sale_items.insert after sale header (partial commit) |
| `egg.supplier.create` | `src/dashboard/broker/egg_broker/Suppliers.jsx` | 6.C | egg_suppliers.insert |
| `egg.supplier.delete` | `src/dashboard/broker/egg_broker/Suppliers.jsx` | 6.C | egg_suppliers.update is_deleted=true |
| `egg.supplier.update` | `src/dashboard/broker/egg_broker/Suppliers.jsx` | 6.C | egg_suppliers.update |
| `handleDeletePermanent` | `src/dashboard/broker/sembako_broker/components/SembakoRecycleBin.jsx` | 5 | Permanent delete from recycle bin |
| `handleLogout` | `src/dashboard/_shared/pages/AkunPreview.jsx` | 5 | supabase.auth.signOut error |
| `handleRestore` | `src/dashboard/broker/sembako_broker/components/SembakoRecycleBin.jsx` | 5 | Restore soft-deleted row |
| `handleSave` | `src/dashboard/_shared/pages/AkunPreview.jsx` | 5 | EditProfileSheet profiles.update |
| `handleSaveProfile` | `src/lib/hooks/useRPAData.js` | 5 | RPA profile upsert onError |
| `login.fetch_profiles` | `src/pages/Login.jsx` | 6.0 | profiles select after sign-in |
| `login.oauth_google` | `src/pages/Login.jsx` | 6.0 | Google OAuth init catch |
| `login.submit` | `src/pages/Login.jsx` | 6.0 | signInWithPassword error branch |
| `login.unexpected` | `src/pages/Login.jsx` | 6.0 | handleLogin outer catch |
| `onboarding.create_new_business` | `src/dashboard/_shared/components/BusinessModelOverlay.jsx` | 6.0 | create_new_business RPC error |
| `onboarding.insert_initial_batch` | `src/dashboard/_shared/components/BusinessModelOverlay.jsx` | 6.0 | Non-fatal penggemukan setup batch insert |
| `onboarding.missing_tenant_id` | `src/dashboard/_shared/components/BusinessModelOverlay.jsx` | post-fix | Invalid/null tenant_id detected before profile update |
| `onboarding.redirect_failed` | `src/dashboard/_shared/pages/OnboardingFlow.jsx` | 6.0 | KEY_TO_PATH lookup miss for selectedKey |
| `onboarding.saveAndComplete_fatal` | `src/dashboard/_shared/components/BusinessModelOverlay.jsx` | 6.0 | saveAndComplete outer catch |
| `onboarding.update_profile` | `src/dashboard/_shared/components/BusinessModelOverlay.jsx` | 6.0 | profiles.update during onboarding (P0001 trigger source) |
| `onboarding.update_tenant` | `src/dashboard/_shared/components/BusinessModelOverlay.jsx` | 6.0 | tenants.update with sub_type/business_vertical |
| `peternak.animal.add` | `src/lib/hooks/createPenggemukanHooks.js` | 6.2 | Single animal insert |
| `peternak.animal.add.batch_sync` | `src/lib/hooks/createPenggemukanHooks.js` | 6.2 | batches.total_animals sync after animal add (partial) |
| `peternak.animal.add.count_sync` | `src/lib/hooks/createPenggemukanHooks.js` | 6.2 | animals count select after add (partial) |
| `peternak.animal.bulk_add` | `src/lib/hooks/createPenggemukanHooks.js` | 6.2 | Bulk animals insert |
| `peternak.animal.bulk_add.batch_sync` | `src/lib/hooks/createPenggemukanHooks.js` | 6.2 | batches.total_animals sync after bulk (partial) |
| `peternak.animal.bulk_add.count_sync` | `src/lib/hooks/createPenggemukanHooks.js` | 6.2 | animals count select after bulk (partial) |
| `peternak.animal.move_kandang` | `src/lib/hooks/createPenggemukanHooks.js` | 6.B | animals.update kandang_id/slot (drag-drop Denah Kandang) |
| `peternak.animal.update` | `src/lib/hooks/createPenggemukanHooks.js` | 6.B | animals.update (edit single animal) |
| `peternak.animal.update_status` | `src/lib/hooks/createPenggemukanHooks.js` | 6.B | animals.update status/exit_date (manual lifecycle change) |
| `peternak.batch.close` | `src/lib/hooks/createPenggemukanHooks.js` | 6.B | batches.update status=closed |
| `peternak.batch.create` | `src/lib/hooks/createPenggemukanHooks.js` | 6.2 | New batch insert |
| `peternak.farm_ops_cost.create` | `src/lib/hooks/usePeternakTaskData.js` | 6.B | farm-wide Listrik & Air ops cost insert (split across active batches) |
| `peternak.farm_ops_cost.delete` | `src/lib/hooks/usePeternakTaskData.js` | 6.B | farm-wide Listrik & Air ops cost soft-delete |
| `peternak.feed_log.create` | `src/lib/hooks/createPenggemukanHooks.js` | 6.B | feed.upsert per kandang/log_date |
| `peternak.feed_log.delete` | `src/lib/hooks/createPenggemukanHooks.js` | 6.B | feed.update is_deleted=true |
| `peternak.health_log.create` | `src/lib/hooks/createPenggemukanHooks.js` | 6.B | health.insert |
| `peternak.health_log.create.animal_sync` | `src/lib/hooks/createPenggemukanHooks.js` | 6.B | animals.status='dead' sync after kematian record (partial, fire-and-forget) |
| `peternak.health_log.delete` | `src/lib/hooks/createPenggemukanHooks.js` | 6.B | health.update is_deleted=true |
| `peternak.holding_pen.ensure.check` | `src/lib/hooks/createPenggemukanHooks.js` | 6.B | Pre-check SELECT on kandangs.is_holding=true |
| `peternak.holding_pen.ensure.create` | `src/lib/hooks/createPenggemukanHooks.js` | 6.B | Kandangs.insert Holding pen when none exists |
| `peternak.kandang.create` | `src/lib/hooks/createPenggemukanHooks.js` | 6.B | kandangs.insert (Denah Kandang) |
| `peternak.kandang.delete` | `src/lib/hooks/createPenggemukanHooks.js` | 6.B | kandangs.delete hard (Denah Kandang) |
| `peternak.kandang.update` | `src/lib/hooks/createPenggemukanHooks.js` | 6.B | kandangs.update (Denah Kandang form edit) |
| `peternak.kandang.update_position` | `src/lib/hooks/createPenggemukanHooks.js` | 6.B | kandangs.update grid_x/grid_y (drag-drop reposition) |
| `peternak.operational_cost.create` | `src/lib/hooks/createPenggemukanHooks.js` | 6.B | Per-batch ops cost insert |
| `peternak.operational_cost.delete` | `src/lib/hooks/createPenggemukanHooks.js` | 6.B | Per-batch ops cost soft-delete |
| `peternak.sale.create` | `src/lib/hooks/createPenggemukanHooks.js` | 6.2 | sales insert |
| `peternak.sale.create.animal_sync` | `src/lib/hooks/createPenggemukanHooks.js` | 6.2 | animals status='sold' update after sale (partial commit risk) |
| `peternak.sale.delete` | `src/lib/hooks/createPenggemukanHooks.js` | 6.B | sales.update is_deleted=true (multi-step with animal revert) |
| `peternak.sale.delete.animal_sync` | `src/lib/hooks/createPenggemukanHooks.js` | 6.B | animals status='active' revert after sale soft-delete (partial commit) |
| `peternak.sale.update` | `src/lib/hooks/createPenggemukanHooks.js` | 6.B | sales.update (edit penjualan row) |
| `peternak.vaccination.create` | `src/dashboard/peternak/broiler/Vaksinasi.jsx` | 6.3 | vaccination_records.insert |
| `peternak.weight_record.create` | `src/lib/hooks/createPenggemukanHooks.js` | 6.B | weights.insert |
| `peternak.weight_record.create.animal_sync` | `src/lib/hooks/createPenggemukanHooks.js` | 6.B | animals.latest_weight_kg sync after weigh-in (partial commit) |
| `peternak.weight_record.delete` | `src/lib/hooks/createPenggemukanHooks.js` | 6.B | weights.update is_deleted=true |
| `register.invite_expired` | `src/pages/Register.jsx` | 6.0 | Invite token past expires_at |
| `register.invite_invalid` | `src/pages/Register.jsx` | 6.0 | Invite token RPC returned no row or status≠pending |
| `register.invite_submit` | `src/pages/Register.jsx` | 6.0 | handleInviteRegister outer catch |
| `register.oauth_google` | `src/pages/Register.jsx` | 6.0 | Google OAuth init catch |
| `register.submit` | `src/pages/Register.jsx` | 6.0 | Mandiri signup outer catch |
| `register.wait_profile_timeout` | `src/pages/Register.jsx` | 6.0 | waitForProfile() returned null after retries |
| `route.not_found` | `src/pages/NotFound.jsx` | 5 | 404 route hit |
| `rpa.purchase_order.create` | `src/lib/hooks/useRPAData.js` | 6.3 | rpa_purchase_orders.insert (useCreatePurchaseOrder mutationFn) |
| `sembako.customer.create` | `src/lib/hooks/useSembakoData.js` | 6.A | sembako_customers.insert |
| `sembako.customer.delete` | `src/lib/hooks/useSembakoData.js` | 6.A | sembako_customers.update is_deleted=true |
| `sembako.customer.update` | `src/lib/hooks/useSembakoData.js` | 6.A | sembako_customers.update |
| `sembako.delivery.arrive` | `src/lib/hooks/useSembakoData.js` | 6.A | sembako_deliveries.update status=arrived |
| `sembako.delivery.complete` | `src/lib/hooks/useSembakoData.js` | 6.A | sembako_deliveries.update status=delivered + completed_at |
| `sembako.delivery.create` | `src/lib/hooks/useSembakoData.js` | 6.A | sembako_deliveries.insert |
| `sembako.delivery.start` | `src/lib/hooks/useSembakoData.js` | 6.A | sembako_deliveries.update status=on_route + departed_at |
| `sembako.delivery.update_timestamps` | `src/lib/hooks/useSembakoData.js` | 6.A | sembako_deliveries.update departed_at/arrived_at/completed_at |
| `sembako.employee.create` | `src/lib/hooks/useSembakoData.js` | 6.A | sembako_employees.insert |
| `sembako.employee.update` | `src/lib/hooks/useSembakoData.js` | 6.A | sembako_employees.update |
| `sembako.payment.create` | `src/lib/hooks/useSembakoData.js` | 6.A | sembako_payments.insert (useRecordSembakoPayment) |
| `sembako.payment.create.sale_sync` | `src/lib/hooks/useSembakoData.js` | 6.A | sale paid_amount/status sync after payment insert (partial commit) |
| `sembako.payroll.create` | `src/lib/hooks/useSembakoData.js` | 6.A | sembako_payroll.insert (useRecordPayroll) |
| `sembako.payroll.mark_paid` | `src/lib/hooks/useSembakoData.js` | 6.A | sembako_payroll.update status=paid + paid_at |
| `sembako.product.create` | `src/lib/hooks/useSembakoData.js` | 6.A | sembako_products.insert |
| `sembako.product.delete` | `src/lib/hooks/useSembakoData.js` | 6.A | sembako_products.update is_deleted=true (multi-step with batch sync) |
| `sembako.product.delete.batch_sync` | `src/lib/hooks/useSembakoData.js` | 6.A | sembako_stock_batches.update is_deleted=true after product delete (partial commit) |
| `sembako.product.update` | `src/lib/hooks/useSembakoData.js` | 6.A | sembako_products.update |
| `sembako.sale.create` | `src/lib/hooks/useSembakoData.js` | 6.A | sembako_sales.insert (header — first step of multi-step create) |
| `sembako.sale.create.items` | `src/lib/hooks/useSembakoData.js` | 6.A | sembako_sale_items.insert after sale header (partial commit) |
| `sembako.sale.create.stock_deduct` | `src/lib/hooks/useSembakoData.js` | 6.A | sembako_stock_batches.update FIFO deduct (partial commit) |
| `sembako.sale.create.stock_out` | `src/lib/hooks/useSembakoData.js` | 6.A | sembako_stock_out.insert per FIFO batch (partial commit) |
| `sembako.sale.delete` | `src/lib/hooks/useSembakoData.js` | 6.A | sembako_sales.update is_deleted=true (header — first step of multi-step delete) |
| `sembako.sale.delete.deliveries_cleanup` | `src/lib/hooks/useSembakoData.js` | 6.A | sembako_deliveries.delete after sale soft-delete (partial commit) |
| `sembako.sale.delete.items_cleanup` | `src/lib/hooks/useSembakoData.js` | 6.A | sembako_sale_items.delete after sale soft-delete (partial commit) |
| `sembako.sale.delete.payments_cleanup` | `src/lib/hooks/useSembakoData.js` | 6.A | sembako_payments.delete after sale soft-delete (partial commit) |
| `sembako.sale.return.header` | `src/lib/hooks/useSembakoData.js` | 6.A | sembako_sales.update is_deleted=true with retur notes (partial commit) |
| `sembako.sale.return.payments_cleanup` | `src/lib/hooks/useSembakoData.js` | 6.A | sembako_payments.delete during return flow (partial commit) |
| `sembako.sale.return.stock_out_cleanup` | `src/lib/hooks/useSembakoData.js` | 6.A | sembako_stock_out.delete during return flow (partial commit) |
| `sembako.sale.update.header` | `src/lib/hooks/useSembakoData.js` | 6.A | sembako_sales.update header after items replace (partial commit if items changed) |
| `sembako.sale.update.items_replace` | `src/lib/hooks/useSembakoData.js` | 6.A | sembako_sale_items.insert after old items deleted (partial commit) |
| `sembako.stock_batch.adjust` | `src/lib/hooks/useSembakoData.js` | 6.A | sembako_stock_batches.update qty_sisa (useAdjustBatchStock) |
| `sembako.stock_batch.adjust.product_sync` | `src/lib/hooks/useSembakoData.js` | 6.A | sembako_products.update current_stock after batch adjust (partial commit) |
| `sembako.stock_batch.adjust.stock_out` | `src/lib/hooks/useSembakoData.js` | 6.A | sembako_stock_out.insert when batch adjust is reduction (partial commit) |
| `sembako.stock_batch.create` | `src/lib/hooks/useSembakoData.js` | 6.A | sembako_stock_batches.insert (useAddStockBatch) |
| `sembako.supplier.create` | `src/lib/hooks/useSembakoData.js` | 6.A | sembako_suppliers.insert |
| `sembako.supplier.delete` | `src/lib/hooks/useSembakoData.js` | 6.A | sembako_suppliers.update is_deleted=true |
| `sembako.supplier.update` | `src/lib/hooks/useSembakoData.js` | 6.A | sembako_suppliers.update |
| `sembako.supplier_payment.create` | `src/lib/hooks/useSembakoData.js` | 6.A | sembako_supplier_payments.insert (useRecordSembakoSupplierPayment) |
| `submitDaily` | `src/dashboard/peternak/_shared/components/InputHarianSheet.jsx` | 6.1 | daily_records.insert |
| `submitPayment` | `src/dashboard/_shared/components/forms/FormBayarModal.jsx` + `src/dashboard/_shared/forms/FormBayarModal.jsx` | 6.1 | Broker (sequential) + RPA (Promise.allSettled per-row) payment flows. Differentiate via `table` and `metadata.row_index` |
| `switchTenant` | `src/lib/hooks/useAuth.jsx` | 6.1 | profiles.update during active-tenant switch |
| `tutorial.complete.exception` | `src/dashboard/_shared/components/TutorialOverlay.jsx` | post-fix | Catch wrapper around tutorial DB sync |
| `tutorial.complete.read` | `src/dashboard/_shared/components/TutorialOverlay.jsx` | post-fix | Initial profiles.tutorials_completed SELECT |
| `tutorial.complete.write` | `src/dashboard/_shared/components/TutorialOverlay.jsx` | post-fix | Merged profiles.tutorials_completed UPDATE |

### Needs verification (listed in spec but not found in code)

The following names appeared in the inventory spec but do **not** exist in the codebase as `actionName:` literals. Either they were renamed during implementation, or instrumentation has not yet been added. Document the actual name when adding instrumentation later.

| Spec name | Actual name in code (if any) |
|-----------|------------------------------|
| `auth.login.google` | `login.oauth_google` |
| `auth.login.password` | `login.submit` |
| `auth.login.fetch_profiles` | `login.fetch_profiles` |
| `auth.register.google` | `register.oauth_google` |
| `onboarding.create_business` | `onboarding.create_new_business` |
| `onboarding.initial_batch_insert` | `onboarding.insert_initial_batch` |
| `tutorial.append_completed` | Replaced by `tutorial.complete.{read,write,exception}` after RPC bypass — see TutorialOverlay notes |
| `account.edit_profile.save` | `handleSave` (predates dotted convention) |
| `account.logout` | `handleLogout` |
| `sembako.recycle_bin.restore` | `handleRestore` |
| `sembako.recycle_bin.delete` | `handleDeletePermanent` |
| `rpa.profile.update` | `handleSaveProfile` |
| `peternak.siklus.create` | `createCycle` (+ `createCycleExpenses`) |
| `peternak.daily_record.create` | `submitDaily` |
| `broker.payment.create` | `submitPayment` (component=FormBayarModal, table=payments) |
| `broker.payment.sale_sync` | Not implemented separately — payment+sale are sequential in `submitPayment` |
| `rpa.payment.create` | `submitPayment` (component=FormBayarModal, RPA version) |
| `rpa.payment.sale_sync` | Not implemented separately — covered by `submitPayment` per-row failure logs in RPA Promise.allSettled |

Renaming the legacy `handle*` / `submit*` / `createCycle*` names to the dotted convention is a cosmetic cleanup task — defer until a dedicated rename phase to avoid mixing with logging instrumentation.

---

## Backlog (Uninstrumented Targets)

### Phase 6.3 — Tier C: Operational polish ✅ DONE

All Tier C targets completed. See per-file coverage sections above for `peternak.vaccination.create`, `broker.farm.*`, `broker.purchase.*`, `admin.audit_trail.create`, `broker.vehicle.*` / `broker.driver.*`, and `rpa.purchase_order.create`.

**Not in scope (deferred to future phase or out of intent):**
- `src/dashboard/_shared/forms/FormBeliModal.jsx` — orphan file, no callers (per `UNUSED_REDUNDANT_AUDIT.md`). The actual used FormBeliModal at `_shared/components/` was instrumented instead.
- `vehicle_expenses.insert` (Armada.jsx line ~1224) — operational expense entry, separate from vehicle CRUD. Add when needed.
- Vaksinasi for non-broiler peternak verticals (domba/kambing/sapi) — Vaksinasi.jsx is currently broiler-only.

### Phase 6.4 — Route guards / permission denials

| Concern | Approach |
|---------|----------|
| `ProtectedRoute` rejects user | Log when guard short-circuits with `source: 'route_guard'` + reason |
| `basePath` mismatch detected | Log when computed path differs from URL |
| Vertical mismatch | Log when `model.category !== requiredVertical` |
| Unauthorized redirect | Log `Navigate to=/login` triggers from non-public routes |

### Phase 6.5 — Full dashboard button scan

Per-vertical sub-page audit:
- Penjualan, Pengiriman, Ternak, Reproduksi, Kesehatan
- Buy/sell mutation forms across all verticals
- Bulk operations (delete-many, archive-many)
- File upload endpoints

---

## Validation SQL

Run as superadmin in Supabase SQL Editor after instrumented actions:

```sql
SELECT
  created_at,
  source,
  component,
  action_name,
  error_code,
  error_message,
  metadata
FROM public.system_error_logs
WHERE action_name LIKE 'admin.%'
   OR action_name LIKE 'auth.%'
   OR action_name LIKE 'onboarding.%'
   OR action_name LIKE 'peternak.%'
   OR action_name LIKE 'broker.%'
   OR action_name LIKE 'rpa.%'
   OR action_name LIKE 'sembako.%'
   OR action_name LIKE 'egg.%'
   OR action_name LIKE 'account.%'
   OR action_name LIKE 'route.%'
   OR action_name LIKE 'login.%'
   OR action_name LIKE 'register.%'
   OR action_name LIKE 'tutorial.%'
   OR action_name LIKE 'switchTenant'
   OR action_name LIKE 'handle%'
   OR action_name LIKE 'create%'
   OR action_name LIKE 'submit%'
ORDER BY created_at DESC
LIMIT 50;
```

Phase 6.3 quick check (Tier C action_names only):

```sql
SELECT created_at, component, action_name, error_message, metadata
FROM public.system_error_logs
WHERE action_name IN (
  'peternak.vaccination.create',
  'broker.farm.create', 'broker.farm.update', 'broker.farm.delete',
  'broker.purchase.create', 'broker.purchase.create.farm_sync',
  'admin.audit_trail.create',
  'broker.vehicle.create', 'broker.vehicle.update', 'broker.vehicle.delete',
  'broker.driver.create', 'broker.driver.update', 'broker.driver.delete',
  'rpa.purchase_order.create'
)
ORDER BY created_at DESC
LIMIT 30;
```

Phase 6.C quick check (Egg Broker action_names only):

```sql
SELECT created_at, component, action_name, error_message, metadata
FROM public.system_error_logs
WHERE action_name IN (
  'egg.customer.create', 'egg.customer.update', 'egg.customer.delete',
  'egg.supplier.create', 'egg.supplier.update', 'egg.supplier.delete',
  'egg.inventory.create', 'egg.inventory.update', 'egg.inventory.delete',
  'egg.sale.create', 'egg.sale.create.items'
)
ORDER BY created_at DESC
LIMIT 30;
```

Phase 6.B quick check (Peternak Fattening action_names only):

```sql
SELECT created_at, component, action_name, error_message, metadata
FROM public.system_error_logs
WHERE action_name IN (
  'peternak.batch.close',
  'peternak.animal.update', 'peternak.animal.update_status', 'peternak.animal.move_kandang',
  'peternak.weight_record.create', 'peternak.weight_record.create.animal_sync', 'peternak.weight_record.delete',
  'peternak.feed_log.create', 'peternak.feed_log.delete',
  'peternak.health_log.create', 'peternak.health_log.create.animal_sync', 'peternak.health_log.delete',
  'peternak.sale.update', 'peternak.sale.delete', 'peternak.sale.delete.animal_sync',
  'peternak.kandang.create', 'peternak.kandang.update', 'peternak.kandang.update_position', 'peternak.kandang.delete',
  'peternak.operational_cost.create', 'peternak.operational_cost.delete',
  'peternak.holding_pen.ensure.check', 'peternak.holding_pen.ensure.create',
  'peternak.farm_ops_cost.create', 'peternak.farm_ops_cost.delete'
)
ORDER BY created_at DESC
LIMIT 30;
```

Pre-auth log filter (sentinel user_id):

```sql
SELECT created_at, action_name, error_code, error_message, metadata
FROM public.system_error_logs
WHERE user_id = '00000000-0000-0000-0000-000000000000'
ORDER BY created_at DESC
LIMIT 30;
```

Partial commit detector:

```sql
SELECT created_at, component, action_name, error_message, metadata
FROM public.system_error_logs
WHERE metadata->>'partial' = 'true'
ORDER BY created_at DESC
LIMIT 30;
```

---

## Notes

- **Happy path should produce 0 error logs.** If you see entries appearing during normal flows, that's a bug to investigate (not an instrumentation concern).
- `system_error_logs` is for **errors**, not a general audit trail. For audit, see `global_audit_logs` (separate table, not part of this inventory).
- **Never log** raw tokens, passwords, sessions, `window.location.hash` content, OTP / magic-link tokens, invite codes, raw email values, or arbitrary form payloads. The frontend redactor + pre-auth RPC defense-in-depth strip should catch accidents — but the call sites must not put sensitive fields into metadata in the first place.
- Foundation files (`errorLogger.js`, `supabaseLogger.js`, `actionLogger.js`, migrations) are stable — do **not** modify them unless adding a new logger capability. Adding new `actionName` literals at call sites is the normal way to extend coverage.
- Broad lint cleanup is a **separate task**. Do not mix it into a logging-instrumentation phase.
- When renaming the legacy `handle*` / `submit*` / `createCycle*` action names to the dotted convention, do it as a single dedicated commit + update this inventory in the same change.
