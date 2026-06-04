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
| Phase 6.E | Admin (Users / Subscriptions / Pricing) | ✅ DONE |
| Phase 6.F | Cross-vertical (Breeding hooks / Dairy / KD Penggemukan / Broker Ayam components / Market / Invoice / Invite / Peternak components) | ✅ DONE — 55 new action_names across 17 files; Tim mutations + DailyTask + worker CRUD deferred to next sweep |
| Phase 1 Missing Error Logging | Critical Auth, Invite, and Setup Farm | ✅ DONE |
| Phase 2 Missing Error Logging | Transaction Wizard and Worker Management | ✅ DONE |
| Phase 3 Missing Error Logging | Operational Data Integrity (useCashFlow, TaskSheets, TaskCards, PrediksiHasilPage) | ✅ DONE |
| Phase 4 Missing Error Logging | Market and Manual Price Updates (Market.jsx, HargaPasar.jsx) | ✅ DONE |
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
│       ├── useSapiPenggemukanData.js         ← 6 Sapi-specific Kandang/animal mutations (Phase 6.F — Sapi Kandang gap patch)
│       ├── usePeternakTaskData.js            ← 2 farm-wide ops cost hooks for Listrik & Air page (Phase 6.B)
│       ├── useUpdateDelivery.js              ← delivery → sale/loss/notification flow (Phase 6.2)
│       ├── useSembakoData.js                 ← 21 mutation hooks: customer/supplier/employee/product/delivery/payroll/stock CRUD + multi-step sale/payment/return/adjust (Phase 6.A)
│       ├── useAdminData.js                   ← Admin users/tenants/subscriptions/pricing mutations (Phase 6.E)
│       ├── useSiteConfig.js                  ← useUpdateSiteConfig mutation (Phase 6.E)
│       ├── useNotifications.jsx              ← 6 notification generator insert sites + outer catch logError (Phase 6.F)
│       ├── createBreedingHooks.js            ← 9 breeding mutation hooks — domba/kambing/sapi breeding factory (Phase 6.F)
│       ├── useKdBreedingData.js              ← 9 kambing perah breeding mutations (Phase 6.F)
│       ├── usePeternakData.js                ← 9 broiler farm/cycle/daily/feed mutations (Phase 6.F)
│       ├── useBrokerKaryawanData.js          ← 3 broker employee mutations (Phase 6.F)
│       ├── useBrokerConnections.js           ← 3 broker connection mutations (Phase 6.F)
│       ├── useInvoice.js                     ← 1 generated invoice mutation (Phase 6.F)
│       ├── useKdPenggemukanData.js           ← 15 kambing/domba penggemukan mutations (Phase 6.F)
│       ├── createDairyHooks.js               ← 5 dairy factory mutations — milk log/inventory/sale/animal (Phase 6.F)
│       ├── useSapiBreedingData.js            ← 11 sapi breeding mutations (Phase 6.F)
│       ├── useMarket.js                      ← 3 market listing mutations (Phase 6.F)
│       └── (useKandangWorkerData.js, etc.)   ← next sweep backlog — worker CRUD hooks not yet instrumented
│       ├── useCashFlow.js                    ← 7 Promise.all queries + 1 secondary sales query (Phase 3 Missing Error Logging)
├── pages/
│   ├── AcceptInvite.jsx                      ← verify code, accept current, register/login submit, switch tenant (Phase 1 Missing Error Logging)
│   ├── ForgotPassword.jsx                    ← reset email request failure (Phase 1 Missing Error Logging)
│   ├── Login.jsx                             ← OAuth, signIn, profile fetch, unexpected (Phase 6.0)
│   ├── Register.jsx                          ← OAuth, signUp, invite flow, profile timeout (Phase 6.0)
│   ├── ResetPassword.jsx                     ← update password failure (Phase 1 Missing Error Logging)
│   ├── AuthCallback.jsx                      ← hash error, no_session, profile fetch, .catch unexpected (Phase 6.0)
│   ├── NotFound.jsx                          ← 404 route logging (Phase 5)
│   └── Invite.jsx                            ← invite accept: profile_update + mark_accepted (Phase 6.F + Phase 1 Missing Error Logging)
└── dashboard/
    ├── admin/
    │   ├── AdminInfo.jsx                     ← /admin/info dashboard reader (Phase 4)
    │   ├── AdminSettings.jsx                 ← logAuditTrail audit-of-audit (Phase 6.3)
    │   └── AdminSubscriptions.jsx            ← inline cancel invoice (Phase 6.E)
    ├── _shared/
    │   ├── components/
    │   │   ├── BusinessModelOverlay.jsx      ← RPC + profile/tenant update + batch + fatal + missing_tenant (Phase 6.0)
    │   │   ├── TutorialOverlay.jsx           ← profiles.tutorials_completed direct UPDATE (Phase 6.0 + post-fix bypass RPC)
    │   │   ├── TransaksiWizard.jsx           ← purchases + sales + deliveries (Phase 2 Missing Error Logging)
    │   │   ├── FormBeliModal.jsx             ← purchases.insert + farms population partial sync (Phase 6.3)
    │   │   └── forms/
    │   │       └── FormBayarModal.jsx        ← broker payment sequential (Phase 6.1)
    │   ├── forms/
    │   │   └── FormBayarModal.jsx            ← RPA payment Promise.allSettled per-row (Phase 6.1)
    │   └── pages/
    │       ├── OnboardingFlow.jsx            ← redirect_failed for unmapped vertical (Phase 6.0)
    │       ├── AkunPreview.jsx               ← logout + EditProfileSheet save (Phase 5)
    │       ├── Market.jsx                    ← handleContact silent view increment (Phase 4 Missing Error Logging)
    │       ├── HargaPasar.jsx                ← ManualPriceForm manual upsert (Phase 4 Missing Error Logging)
    │       └── tim/Tim.jsx                   ← import-path fix only (Phase 6.F); team mutation instrumentation deferred
    ├── peternak/
    │   ├── _shared/components/
    │   │   ├── SiklusSheet.jsx               ← breeding_cycles + cycle_expenses partial (Phase 6.1)
    │   │   ├── InputHarianSheet.jsx          ← daily_records.insert (Phase 6.1)
    │   │   ├── TaskSheets.jsx                ← weight_record.delete_inline + health_log.delete_inline (Phase 3 Missing Error Logging)
    │   │   └── TaskCards.jsx                 ← weight_record.delete_inline + health_log.delete_inline (Phase 3 Missing Error Logging)
    │   └── broiler/
    │       ├── Vaksinasi.jsx                 ← vaccination_records.insert (Phase 6.3)
    │       ├── SetupFarm.jsx                 ← peternak.farm.setup + peternak.farm.setup_cycle (Phase 1 Missing Error Logging)
    │       └── AnakKandang.jsx               ← farm_workers + worker_payments CRUD (Phase 2 Missing Error Logging)
    ├── ai/
    │   └── PrediksiHasilPage.jsx             ← ai_conversations.insert + ai_pending_entries.insert (Phase 3 Missing Error Logging)
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

### `src/lib/hooks/useNotifications.jsx`
**Phase:** 6.F
**Coverage (NotificationsProvider — read/mark/delete):**
- `markAsRead` — `notifications.update` failure → `notification.mark_read`
- `markAllAsRead` — `notifications.update` failure → `notification.mark_read`
- `deleteNotif` — `notifications.update is_deleted=true` → `notification.delete`

**Coverage (useNotificationGenerator — fire-and-forget inserts):**
- Broker piutang overdue → `notification.generate.piutang_broker`
- Sembako piutang overdue → `notification.generate.piutang_sembako`
- Subscription/trial expiry → `notification.generate.subscription_expires`
- Feed stock low alert → `notification.generate.stok_pakan`
- Overdue tasks summary → `notification.generate.tugas_terlambat`
- Payday reminder per worker → `notification.generate.payday`
- Outer catch (unexpected throw) → `notification.generate.unexpected`

**Action names:**
- `notification.mark_read` (mark single + mark all)
- `notification.delete`
- `notification.generate.piutang_broker`
- `notification.generate.piutang_sembako`
- `notification.generate.subscription_expires`
- `notification.generate.stok_pakan`
- `notification.generate.tugas_terlambat`
- `notification.generate.payday`
- `notification.generate.unexpected`

**Notes:**
- Generator inserts are **non-throwing** — `logSupabaseError` fires but the loop continues. This preserves the original fire-and-forget behaviour (a single failed notification doesn't abort other generators).
- Outer `catch (err)` in `checkAndGenerate` now calls `logError` instead of `console.error` only — surfaces unexpected JS throws (e.g. network errors in the entire generator block).
- Import-path fix bundled: `logSupabaseError` was previously imported from `errorLogger.js` (wrong) — corrected to `supabaseLogger.js`.

---

### `src/lib/hooks/createBreedingHooks.js`
**Phase:** 6.F
**Coverage:** Hook factory `createBreedingHooks(prefix)` generates all mutation hooks for `{prefix}_breeding_*` tables. Used for `domba`, `kambing`, `sapi` breeding verticals.

**Mutation hooks instrumented (9):**
- `useAddAnimal` — `{prefix}_breeding_animals.insert`
- `useUpdateAnimal` — `{prefix}_breeding_animals.update`
- `useAddWeight` — `{prefix}_breeding_weight_records.insert`
- `useAddMating` — `{prefix}_breeding_mating_records.insert`
- `useUpdateMating` — `{prefix}_breeding_mating_records.update`
- `useAddBirth` — `{prefix}_breeding_births.insert`
- `useAddHealthLog` — `{prefix}_breeding_health_logs.insert`
- `useAddFeedLog` — `{prefix}_breeding_feed_logs.insert`
- `useAddSale` — 2-step: `{prefix}_breeding_sales.insert` + `animals.update status='terjual'` (partial commit on step 2)

**Action names:**
- `breeding.animal.add`
- `breeding.animal.update`
- `breeding.weight.add`
- `breeding.mating.add`
- `breeding.mating.update`
- `breeding.birth.add`
- `breeding.health_log.add`
- `breeding.feed_log.add`
- `breeding.sale.add`
- `breeding.sale.add.animal_sync` (partial — sale inserted but animal status sync failed; `metadata.partial: true`)

**Notes:**
- Factory pattern: `component: 'createBreedingHooks'` is shared across all three verticals; vertical is recoverable from the `metadata.table` value (e.g. `domba_breeding_animals`).
- `useAddSale` partial commit: uses `logError` directly (not `logSupabaseError`) to include `metadata.partial: true, sale_inserted: true, animal_id`.
- Simple single-step hooks use `logSupabaseError` before re-throw; toast/UI behaviour in `onError` preserved.

---

### `src/lib/hooks/useKdBreedingData.js`
**Phase:** 6.F
**Coverage:** Kambing perah breeding mutation hooks — mirrors `createBreedingHooks` pattern but targets `kd_breeding_*` tables directly (not factory-generated).

**Mutation hooks instrumented (9):**
- `useAddKdBreedingAnimal` — `kd_breeding_animals.insert`
- `useUpdateKdBreedingAnimal` — `kd_breeding_animals.update`
- `useAddKdBreedingWeight` — `kd_breeding_weight_records.insert`
- `useAddKdBreedingMating` — `kd_breeding_mating_records.insert`
- `useUpdateKdBreedingMating` — `kd_breeding_mating_records.update`
- `useAddKdBreedingBirth` — `kd_breeding_births.insert`
- `useAddKdBreedingHealthLog` — `kd_breeding_health_logs.insert`
- `useAddKdBreedingFeedLog` — `kd_breeding_feed_logs.insert`
- `useAddKdBreedingSale` — 2-step: `kd_breeding_sales.insert` + `kd_breeding_animals.update status='terjual'` (partial commit on step 2)

**Action names:**
- `kd_breeding.animal.add`
- `kd_breeding.animal.update`
- `kd_breeding.weight.add`
- `kd_breeding.mating.add`
- `kd_breeding.mating.update`
- `kd_breeding.birth.add`
- `kd_breeding.health_log.add`
- `kd_breeding.feed_log.add`
- `kd_breeding.sale.add`
- `kd_breeding.sale.add.animal_sync` (partial — `metadata.partial: true, sale_inserted: true, animal_id`)

**Notes:** Identical instrumentation pattern to `createBreedingHooks`. `component: 'useKdBreedingData'` in all log calls. Also exports pure calculation functions (`calcBreedingADG`, `calcConceptionRate`, etc.) — those are not instrumented (read-only helpers).

---

### `src/lib/hooks/usePeternakData.js`
**Phase:** 6.F
**Coverage:** Broiler peternak mutation hooks — farm CRUD, breeding cycle lifecycle, daily records, feed stock management.

**Mutation hooks instrumented (9):**
- `useCreatePeternakFarm` — `peternak_farms.insert`
- `useUpdatePeternakFarm` — `peternak_farms.update`
- `useDeletePeternakFarm` — `peternak_farms.update is_deleted=true`
- `useCreateCycle` — `breeding_cycles.insert` (broiler cycle)
- `useUpdateCycleStatus` — `breeding_cycles.update` (status, fcr, ip_score, harvest date)
- `useDeleteCycle` — `breeding_cycles.update is_deleted=true`
- `useUpsertDailyRecord` — 2-step: `daily_records.upsert` + `breeding_cycles.update` aggregate sync (partial on step 2)
- `useUpsertFeedStock` — 2-step: `feed_stocks.update/insert` + optional `cycle_expenses.insert` (partial on optional step)
- `useReduceFeedStock` — `feed_stocks.update quantity_kg`

**Action names:**
- `peternak.farm.create`
- `peternak.farm.update`
- `peternak.farm.delete`
- `peternak.broiler_cycle.create`
- `peternak.broiler_cycle.update_status`
- `peternak.broiler_cycle.delete`
- `peternak.daily_record.upsert`
- `peternak.daily_record.upsert.cycle_sync` (partial — daily saved but aggregate update failed; `metadata.partial: true, daily_record_saved: true, cycle_id`)
- `peternak.feed_stock.upsert`
- `peternak.feed_stock.upsert.expense` (partial — feed stock saved but cycle_expenses insert failed; `metadata.partial: true, feed_stock_saved: true, cycle_id`)
- `peternak.feed_stock.reduce`

**Notes:**
- `useUpsertDailyRecord` aggregate sync (`breeding_cycles.update total_mortality + total_feed_kg`) is **non-throwing** — uses `logError` directly with `partial: true` flag but does NOT re-throw, consistent with non-critical side-effect pattern.
- `useUpsertFeedStock` expense insertion is optional (only fires when `cycle_id + unit_price` provided) — logged as partial commit but still throws so the caller sees the failure.
- `useDeletePeternakFarm` uses soft-delete (`is_deleted=true`), not hard delete — operation is `'update'` not `'delete'` in the log.
- Also exports query hooks (`usePeternakFarms`, `useActiveCycles`, etc.) and pure helpers (`calcCurrentAge`, `calcFCR`, etc.) — those are not instrumented.

---

### `src/lib/hooks/useSapiPenggemukanData.js`
**Phase:** 6.F — Sapi Kandang gap patch

**Context:** `useSapiPenggemukanData.js` is the Sapi-specific penggemukan hook file — it duplicates the pattern of the generic `createPenggemukanHooks.js` factory but owns its own Supabase calls (the factory covers Domba and Kambing; Sapi pre-Phase 6.F had no error instrumentation on Kandang mutations). The 6 hooks below were the only Kandang/animal-movement sites missing coverage.

**Coverage (Phase 6.F — 6 new mutation sites):**
- `useCreateSapiKandang` — `kandangs.insert` (Denah Kandang create)
- `useMoveSapiAnimalToKandang` — `animals.update kandang_id/slot` (drag-drop / Denah Kandang move)
- `useUpdateSapiKandangPosition` — `kandangs.update grid_x/grid_y` (drag-drop reposition)
- `useUpdateSapiKandang` — `kandangs.update` (form edit)
- `useEnsureSapiHoldingPen` (check step) — SELECT pre-check on `kandangs.is_holding=true`
- `useEnsureSapiHoldingPen` (create step) — INSERT holding pen when none exists

**Action names:**
- `sapi.kandang.create`
- `sapi.animal.move_kandang`
- `sapi.kandang.update_position`
- `sapi.kandang.update`
- `sapi.kandang.ensure_holding_check`
- `sapi.kandang.ensure_holding_create`

**Naming rationale:** Uses `sapi.*` prefix (not `peternak.*`) intentionally — Sapi penggemukan workflows are larger and more complex than the factory-managed verticals; vertical-specific action names give cleaner observability than factory-shared names. The `peternak.*` names in `createPenggemukanHooks.js` continue to cover Domba and Kambing.

**Import fixes bundled (pre-existing build-breaking errors):**
- `src/lib/hooks/useNotifications.jsx` — `logSupabaseError` was incorrectly imported from `errorLogger.js` (does not export that function); corrected to `supabaseLogger.js`.
- `src/dashboard/_shared/pages/tim/Tim.jsx` — same incorrect import path; corrected to `supabaseLogger.js`.
Neither file has new instrumentation points added (mutation audit deferred to Phase 6.F continuation).

**Notes:**
- All 6 sites use `logSupabaseError({ table, operation, component: 'useSapiPenggemukanData', actionName })` before re-throw — consistent with factory pattern.
- `ensure_holding_check` and `ensure_holding_create` mirror `peternak.holding_pen.ensure.check/create` naming semantics: SELECT denial vs INSERT denial are diagnosable separately.
- Happy path produces 0 error logs.

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

### `src/pages/AcceptInvite.jsx`
**Phase:** Phase 1 Missing Error Logging
**Coverage:** Invitation code verification, acceptance, registration and login handlers inside the invite flow.
- edge function `verify-invite-code` call catches and failures -> `auth.invite.verify_code`
- existing profile query and upsert/membership creation with current account -> `auth.invite.accept_current`
- `auth.signUp` and invitations update -> `auth.invite.register_submit`
- `auth.signInWithPassword`, profiles, and invitations update -> `auth.invite.login_submit`
- tenant switcher profile/membership update -> `auth.invite.switch_tenant`

**Action names:**
- `auth.invite.verify_code`
- `auth.invite.accept_current`
- `auth.invite.register_submit`
- `auth.invite.login_submit`
- `auth.invite.switch_tenant`

**Source:** `auth` / `supabase`
**Notes:** Never logs passwords, recovery/invite tokens, email addresses, or full sessions. Metadata holds safe flags (`token_length`, `tenant_id`, `invitation_role`).

---

### `src/pages/ForgotPassword.jsx`
**Phase:** Phase 1 Missing Error Logging
**Coverage:** Password reset request email dispatch failures.
- `supabase.auth.resetPasswordForEmail` failure -> `auth.password.reset_request`

**Action names:**
- `auth.password.reset_request`

**Source:** `auth` (uses pre-auth fallback)
**Notes:** Never logs email addresses or recovery tokens. Logs `email_length` only.

---

### `src/pages/ResetPassword.jsx`
**Phase:** Phase 1 Missing Error Logging
**Coverage:** Password recovery callback submission.
- `supabase.auth.updateUser` password update failure -> `auth.password.reset_submit`

**Action names:**
- `auth.password.reset_submit`

**Source:** `auth` (uses pre-auth fallback)
**Notes:** Never logs the actual password or session token in metadata.

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

### `src/dashboard/_shared/components/TransaksiWizard.jsx`
**Phase:** Phase 2 Missing Error Logging
**Coverage:** Multi-step transaction writes (purchases, sales, deliveries, and vehicle/driver auto-registration).
- `purchases.insert` -> `broker.purchase.create.wizard`
- `sales.insert` -> `broker.sale.create.wizard`
- `vehicles.insert` (auto-register) -> `broker.transaction.create` with `failed_step: 'vehicle_auto_register'`
- `drivers.insert` (auto-register) -> `broker.transaction.create` with `failed_step: 'driver_auto_register'`
- `deliveries.insert` -> `broker.delivery.create.wizard`
- Outer catch: `broker.transaction.create` (logError with metadata including partial commit indicators)

**Notes:** If a step fails, the outer catch will log the partial status of the transaction (`partial: true/false`, `purchase_id`, `sale_id`, `delivery_id`).

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
**Phase:** 5 + 6.F
**Coverage:**
- `handleLogout` — `supabase.auth.signOut()` error
- `EditProfileSheet.handleSave` — `profiles.update()` error
- **Phase 6.F**: `DeleteBusinessDialog` — `delete_my_business` RPC error (`logSupabaseError` + `logError` dual-log)
- **Phase 6.F**: `EditBisnisSheet.handleSave` — `tenants.update` error (business_name, province, location)

**Action names:**
- `handleLogout`
- `handleSave`
- `account.business.delete` (Phase 6.F)
- `account.bisnis.update` (Phase 6.F)

**Notes:** `handleLogout` / `handleSave` predate dotted convention — deferred cosmetic rename. `DeleteBusinessDialog` uses dual-log (`logSupabaseError` + `logError`) to surface RPC error as both classified supabase error and rich metadata log. `EditBisnisSheet` supports owner-only province selection from 38 Indonesian provinces.

---

### `src/dashboard/_shared/pages/Market.jsx`
**Phase:** Phase 4 Missing Error Logging
**Coverage:**
- `handleContact` — increments view count `market_listings` update failure (silent)

**Action names:**
- `market.listing.increment_view`

**Notes:** Safe metadata: `{ listing_id, operation: 'increment_view', source_component: 'Market' }`. No buyer/seller contact numbers or WhatsApp URL strings are logged. Redirection flow to WhatsApp is non-blocking even if the update fails.

---

### `src/dashboard/_shared/pages/HargaPasar.jsx`
**Phase:** Phase 4 Missing Error Logging
**Coverage:**
- `ManualPriceForm.handleSave` — `market_prices` manual upsert failure

**Action names:**
- `market.price.upsert`

**Notes:** Standard logSupabaseError coverage for returned PostgREST errors, and logError fallback in the catch block for unexpected exceptions. Toast UI feedback is fully preserved. Safe metadata: `{ region, price_date, chicken_type: 'broiler', source: 'manual', operation: 'upsert' }`. Redacts full form payloads.

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

### `src/lib/hooks/useCashFlow.js`
**Phase:** Phase 3 Missing Error Logging
**Coverage:** 7 core cash-flow queries + 1 secondary sales query (8 total).
- `payments.select` → `broker.cashflow.fetch`
- `purchases.select` → `broker.cashflow.fetch`
- `deliveries.select` → `broker.cashflow.fetch`
- `extra_expenses.select` → `broker.cashflow.fetch`
- `sales.select` (unpaid, piutang) → `broker.cashflow.fetch`
- `loss_reports.select` → `broker.cashflow.fetch`
- `vehicle_expenses.select` → `broker.cashflow.fetch`
- `sales.select` (all period) → `broker.cashflow.fetch`

**Notes:** Previously these queries silently defaulted to `[]` on failure, causing corrupted dashboard metrics. Now each checks the `.error` field, calls `logSupabaseError` with `{ table, operation, component, actionName }`, and throws so React Query surfaces the error to the UI.

---

### `src/dashboard/peternak/_shared/components/TaskSheets.jsx`
**Phase:** Phase 3 Missing Error Logging
**Coverage:** Two inline soft-delete buttons inside `CompleteTaskSheet`.
- Weighing entry delete → `peternak.weight_record.delete_inline`
- Health log delete → `peternak.health_log.delete_inline`

**Action names:**
- `peternak.weight_record.delete_inline`
- `peternak.health_log.delete_inline`

**Notes:** Safe metadata = `{ record_id }` only. No notes, eartag, or animal data logged. If the Supabase update fails, `logSupabaseError` is called then the error is re-thrown so the outer `catch (_err)` shows the generic toast (`'Gagal menghapus data'`). Toast UX preserved.

---

### `src/dashboard/peternak/_shared/components/TaskCards.jsx`
**Phase:** Phase 3 Missing Error Logging
**Coverage:** Two inline soft-delete buttons inside `InteractiveCheckCard` (the card variant of the same flow).
- Weighing entry delete → `peternak.weight_record.delete_inline`
- Health log delete → `peternak.health_log.delete_inline`

**Action names:**
- `peternak.weight_record.delete_inline`
- `peternak.health_log.delete_inline`

**Notes:** Identical pattern to `TaskSheets.jsx`. Same actionNames are intentionally shared between the two components as they are the same logical operation. Safe metadata policy: `{ record_id }` only.

---

### `src/dashboard/peternak/ai/PrediksiHasilPage.jsx`
**Phase:** Phase 3 Missing Error Logging
**Coverage:** Two-step AI save flow in `saveMutation.mutationFn`.
- `ai_conversations.insert` → `ai.prediction.save`
- `ai_pending_entries.insert` → `ai.prediction.save`

**Action names:**
- `ai.prediction.save`

**Notes:** Metadata is strictly limited to `{ batch_id }` for the conversation step and `{ conversation_id, batch_id }` for the entry step. **No AI prompt text, prediction output, recommendation text, or raw model response is logged.** The existing `onError` toast (`'Gagal menyimpan prediksi'`) is fully preserved.

---

### `src/dashboard/peternak/broiler/AnakKandang.jsx`
**Phase:** Phase 2 Missing Error Logging
**Coverage:** Worker CRUD (create/update) and worker payment records.
- `farm_workers.insert` -> `peternak.worker.create`
- `farm_workers.update` -> `peternak.worker.update`
- `worker_payments.insert` -> `peternak.worker_payment.create`

**Notes:** Generic toasts are used to keep database error messages away from the user. Logs use safe metadata (`worker_id`, `peternak_farm_id`, `base_salary`, `bonus_per_kg`, `payment_type`, `payment_date`, `amount`) and avoid logging worker name or phone.

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

### `src/dashboard/admin/AdminSubscriptions.jsx`
**Phase:** 6.E
**Coverage:**
- `executeCancelInvoice` — `subscription_invoices.update` (status='cancelled')

**Action names:**
- `admin.invoice.cancel`

**Notes:** Most mutations are delegated to `useAdminData.js`. The inline mutation is for canceling an invoice directly.

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

### `src/lib/hooks/useSiteConfig.js`
**Phase:** 6.E Admin
**Coverage:**
- `useUpdateSiteConfig` — `site_configs.update`

**Action names:**
- `admin.site_config.update`

**Notes:** Standard logSupabaseError coverage before generic toast throw.

---

### `src/lib/hooks/useAdminData.js`
**Phase:** 6.E Admin
**Coverage:**
- Admin User/Tenant management (`useDeleteUser`, `useDeleteTenant`, `useAdminUpdateTenant`)
- Admin Subscriptions (`useActivateTrial`)
- Admin Invoices (`useCreateInvoice`, `useConfirmInvoice`, `useDeleteInvoice`)
- Admin Payment Settings (`useDeletePaymentSetting`, `useUpsertPaymentSetting`, `useSaveXenditConfig`)
- Admin Pricing (`useUpdatePricing`, `useUpdatePlanConfig`)
- Admin Discounts (`useCreateDiscountCode`, `useToggleDiscountCode`, `useDeleteDiscountCode`)
- Admin Market Prices (`useApproveMarketPrice`, `useDeleteMarketPrice`)

**Action names (all start with `admin.`):** see Action Name Index below for the full set added in Phase 6.E.

**Notes:**
- `useDeleteTenant`, `useDeleteUser`, `useConfirmInvoice`, and `useUpdatePricing` include partial commit logs using `logError({ metadata: { partial: true } })`.

---

### `src/lib/hooks/useBrokerKaryawanData.js`
**Phase:** 6.F
**Coverage:** Broker employee CRUD.

**Mutation hooks instrumented (3):**
- `useCreateBrokerEmployee` -- `broker_employees.insert`
- `useUpdateBrokerEmployee` -- `broker_employees.update`
- `useDeleteBrokerEmployee` -- `broker_employees.update is_deleted=true`

**Action names:**
- `broker.employee.create`
- `broker.employee.update`
- `broker.employee.delete`

**Notes:** `component: 'useBrokerKaryawanData'`. Used by both Poultry Broker and Egg Broker Tim/Karyawan pages.

---

### `src/lib/hooks/useBrokerConnections.js`
**Phase:** 6.F
**Coverage:** Broker-to-broker connection lifecycle.

**Mutation hooks instrumented (3):**
- `useRequestConnection` -- `broker_connections.insert`
- `useRespondConnection` -- `broker_connections.update` (status accept/reject)
- `useCancelConnection` -- `broker_connections.update is_cancelled=true`

**Action names:**
- `broker.connection.request`
- `broker.connection.respond`
- `broker.connection.cancel`

**Notes:** All three use `logSupabaseError` before re-throw. `component: 'useBrokerConnections'`.

---

### `src/lib/invoice/useInvoice.js`
**Phase:** 6.F
**Coverage:**
- `useSaveInvoice` -- `generated_invoices.insert`

**Action names:**
- `invoice.generate`

**Notes:** `component: 'useInvoice'`. Pre-insert profileErr SELECT failure throws early without logging (not a mutation failure).

---

### `src/lib/hooks/useKdPenggemukanData.js`
**Phase:** 6.F
**Coverage:** Kambing/Domba penggemukan mutation hooks -- batch lifecycle, animals, weights, feed, health, sales, kandangs.

**Mutation hooks instrumented (11 hooks, 15 action_name sites):**
- `useCreateKdBatch` -- `kd_*_batches.insert`
- `useCloseKdBatch` -- `kd_*_batches.update status=closed`
- `useAddKdAnimal` -- `kd_*_animals.insert` + batch total_animals sync (partial)
- `useUpdateKdAnimalStatus` -- `kd_*_animals.update status`
- `useAddKdWeightRecord` -- `kd_*_weight_records.insert`
- `useAddKdFeedLog` -- `kd_*_feed_logs.upsert`
- `useAddKdHealthLog` -- `kd_*_health_logs.insert`
- `useAddKdSale` -- `kd_*_sales.insert` + `kd_*_animals.update status='terjual'` (partial)
- `useDeleteKdFeedLog` -- `kd_*_feed_logs.update is_deleted=true`
- `useDeleteKdWeightRecord` -- `kd_*_weight_records.update is_deleted=true`
- `useCreateKdKandang` -- `kd_*_kandangs.insert`
- `useMoveAnimalToKandang` -- `kd_*_animals.update kandang_id/slot`
- `useEnsureHoldingPen` -- SELECT check + INSERT create (single action_name for both steps)

**Action names:**
- `kd_penggemukan.batch.create`
- `kd_penggemukan.batch.close`
- `kd_penggemukan.animal.add`
- `kd_penggemukan.animal.add.batch_sync` (partial -- animal inserted, batch sync failed)
- `kd_penggemukan.animal.update_status`
- `kd_penggemukan.animal.move_kandang`
- `kd_penggemukan.weight.add`
- `kd_penggemukan.weight.delete`
- `kd_penggemukan.feed_log.add`
- `kd_penggemukan.feed_log.delete`
- `kd_penggemukan.health_log.add`
- `kd_penggemukan.sale.add`
- `kd_penggemukan.sale.add.animal_sync` (partial -- sale inserted, animal sync failed; `metadata.animal_ids`)
- `kd_penggemukan.kandang.create`
- `kd_penggemukan.kandang.ensure_holding` (shared for SELECT and INSERT steps)

**Notes:**
- `useAddKdAnimal` batch sync and `useAddKdSale` animal sync use `logError` directly with `metadata.partial: true`.
- `component: 'useKdPenggemukanData'` in all calls.

---

### `src/lib/hooks/createDairyHooks.js`
**Phase:** 6.F
**Coverage:** Hook factory `createDairyHooks(prefix)` -- milk production logs, inventory, sales, animal management.

**Mutation hooks instrumented (4 hooks, 5 action_name sites):**
- `useLogProduction` -- `{prefix}_milk_logs.insert`
- `useUpdateInventory` -- `{prefix}_transactions.insert` + `{prefix}_inventory.update` qty sync (partial)
- `useLogSale` -- `{prefix}_sales.insert`
- `useAddAnimal` -- `{prefix}_animals.insert`

**Action names:**
- `dairy.milk_log.add`
- `dairy.inventory.update`
- `dairy.inventory.update.stock_sync` (partial -- transaction inserted, inventory sync failed; `metadata.partial: true, transaction_inserted: true, item_id`)
- `dairy.milk_sale.add`
- `dairy.animal.add`

**Notes:**
- Factory pattern: `component: 'createDairyHooks'`; vertical recoverable from `metadata.table`.
- `useUpdateInventory` partial commit uses `logError` directly.
- `onError: (err) => toast.error(...)` added to `useLogSale` and `useAddAnimal` (were missing).

---

### `src/lib/hooks/useSapiBreedingData.js`
**Phase:** 6.F
**Coverage:** Sapi breeding mutation hooks -- separate from `createBreedingHooks.js` factory; covers `sapi_breeding_*` tables.

**Mutation hooks instrumented (11):**
- `useAddSapiBreedingAnimal` -- `sapi_breeding_animals.insert`
- `useUpdateSapiBreedingAnimal` -- `sapi_breeding_animals.update`
- `useAddSapiBreedingMatingRecord` -- `sapi_breeding_mating_records.insert`
- `useUpdateSapiBreedingMatingStatus` -- `sapi_breeding_mating_records.update status`
- `useAddSapiBreedingBirth` -- `sapi_breeding_births.insert`
- `useAddSapiBreedingWeightRecord` -- `sapi_breeding_weight_records.insert`
- `useAddSapiBreedingHealthLog` -- `sapi_breeding_health_logs.insert`
- `useDeleteSapiBreedingHealthLog` -- `sapi_breeding_health_logs.update is_deleted=true`
- `useAddSapiBreedingFeedLog` -- `sapi_breeding_feed_logs.insert`
- `useDeleteSapiBreedingFeedLog` -- `sapi_breeding_feed_logs.update is_deleted=true`
- `useAddSapiBreedingSale` -- `sapi_breeding_sales.insert`

**Action names:**
- `sapi_breeding.animal.add`
- `sapi_breeding.animal.update`
- `sapi_breeding.mating.add`
- `sapi_breeding.mating.update_status`
- `sapi_breeding.birth.add`
- `sapi_breeding.weight.add`
- `sapi_breeding.health_log.add`
- `sapi_breeding.health_log.delete`
- `sapi_breeding.feed_log.add`
- `sapi_breeding.feed_log.delete`
- `sapi_breeding.sale.add`

**Notes:** `component: 'useSapiBreedingData'`. All 11 use `logSupabaseError` before re-throw.

---

### `src/lib/hooks/useMarket.js`
**Phase:** 6.F
**Coverage:** Market listing CRUD.

**Mutation hooks instrumented (3):**
- `useCreateListing` -- `market_listings.insert`
- `useCloseListing` -- `market_listings.update status='closed'`
- `useDeleteListing` -- `market_listings.update is_deleted=true`

**Action names:**
- `market.listing.create`
- `market.listing.close`
- `market.listing.delete`

**Notes:** `component: 'useMarket'`.

---

### `src/pages/Invite.jsx`
**Phase:** 6.F + Phase 1 Missing Error Logging
**Coverage:** Invite accept flow -- two sequential mutations in `handleAcceptInvite`.
- `invite.accept.profile_update` -- `profiles.update` (write name + user_type)
- `invite.accept.mark_accepted` -- `team_invitations.update status='accepted'`
- `rpc('get_invitation_by_token')` check and catches -> `auth.invite.verify_token`

**Action names:**
- `invite.accept.profile_update`
- `invite.accept.mark_accepted`
- `auth.invite.verify_token`

**Notes:** Uses `logSupabaseError` for authenticated mutations and `logError` (with pre-auth gateway `source: 'auth'`) for token verification checks. No invite code or OTP token is logged (metadata restricted to safe fields like `token_length`). `component: 'Invite'`.

---

### `src/dashboard/broker/poultry_broker/RPA.jsx`
**Phase:** 6.F
**Coverage:** RPA client CRUD -- inline mutations in RPAForm.

**Action names:**
- `broker.rpa.create` -- `rpa_clients.insert`
- `broker.rpa.update` -- `rpa_clients.update`
- `broker.rpa.delete` -- `rpa_clients.update is_deleted=true`

**Notes:** `component: 'RPA'`. `broker.rpa.update` and `broker.rpa.delete` are shared with `RPADetail.jsx` (differentiated by `component`).

---

### `src/dashboard/broker/poultry_broker/RPADetail.jsx`
**Phase:** 6.F
**Coverage:** RPA detail page -- debt settlement and RPA profile edits (5 mutation sites).

**Action names:**
- `broker.payment.bulk_settle` -- `payments.insert` loop per overdue sale
- `broker.payment.settle` -- `payments.insert` full single payment
- `broker.payment.add` -- `payments.insert` partial payment form
- `broker.rpa.update` -- `rpa_clients.update` (shared with `RPA.jsx`)
- `broker.rpa.delete` -- `rpa_clients.update is_deleted=true` (shared with `RPA.jsx`)

**Notes:** `component: 'RPADetail'`. `proceedMarkAllPaid` previously had no error check -- added with instrumentation.

---

### `src/dashboard/broker/poultry_broker/Beranda.jsx`
**Phase:** 6.F
**Coverage:**
- `handleTandaiLunas` loop -- `sales.update payment_status='lunas'` per overdue sale

**Action names:**
- `broker.sale.bulk_mark_paid`

**Notes:** Previously fire-and-forget; now logs and throws on failure. `component: 'Beranda'`.

---

### `src/dashboard/broker/poultry_broker/CashFlow.jsx`
**Phase:** 6.F
**Coverage:**
- `extra_expenses.insert` (expense entry form)

**Action names:**
- `broker.expense.add`

**Notes:** `component: 'CashFlow'`.

---

### `src/dashboard/broker/poultry_broker/pengiriman/CreateLossSheet.jsx`
**Phase:** 6.F
**Coverage:**
- `loss_reports.insert` (in `handleCreate`)

**Action names:**
- `broker.loss_report.create` (shared with `useUpdateDelivery.js` -- differentiated by `component`)

**Notes:** Non-throwing pattern (uses `if (error)` check, not try/catch). `component: 'CreateLossSheet'`.

---

### `src/dashboard/broker/poultry_broker/pengiriman/UpdateArrivalSheet.jsx`
**Phase:** 6.F
**Coverage:**
- `deliveries.update` (critical arrival data write)

**Action names:**
- `broker.delivery.update_arrival`

**Notes:** `component: 'UpdateArrivalSheet'`. Pre-step ID lookups and post-step side effects remain fire-and-forget.

---

### `src/dashboard/peternak/broiler/LaporanSiklus.jsx`
**Phase:** 6.F
**Coverage:**
- `AddExpenseSheet.handleSubmit` -- `cycle_expenses.insert`

**Action names:**
- `peternak.cycle_expense.add`

**Notes:** `component: 'LaporanSiklus'`.

---

### `src/dashboard/peternak/broiler/SetupFarm.jsx`
**Phase:** 6.F
**Coverage:**
- `peternak_farms.insert` (initial farm creation)

**Action names:**
- `peternak.farm.setup`

**Notes:** `component: 'SetupFarm'`. Distinct from `peternak.farm.create` (the `usePeternakData` hook). SetupFarm.jsx is the first-run onboarding page. Subsequent `breeding_cycles.insert` bootstrap is fire-and-forget.

---

### `src/dashboard/_shared/components/FormJualModal.jsx`
**Phase:** 6.F
**Coverage:**
- `sales.insert` (broker sale record creation)

**Action names:**
- `broker.sale.create`

**Notes:** `component: 'FormJualModal'`. Side effects (`rpa_clients.update`, `farms.update`) are fire-and-forget. Pre-existing lint: `useState` used without import at line 43 -- deferred.

---


## Action Name Index

Sorted alphabetically. All entries below were verified via grep against `actionName:` literals in `src/`.

| action_name | file | phase | purpose |
|---|---|---|---|
| `admin.audit_trail.create` | `src/dashboard/admin/AdminSettings.jsx` | 6.3 | Audit-of-audit — `global_audit_logs.insert` failure (non-blocking) |
| `admin.discount.create` | `src/lib/hooks/useAdminData.js` | 6.E | discounts.insert |
| `admin.discount.delete` | `src/lib/hooks/useAdminData.js` | 6.E | discounts.delete |
| `admin.discount.toggle` | `src/lib/hooks/useAdminData.js` | 6.E | discounts.update is_active |
| `admin.invoice.cancel` | `src/dashboard/admin/AdminSubscriptions.jsx` | 6.E | subscription_invoices.update status='cancelled' |
| `admin.invoice.confirm_addon` | `src/lib/hooks/useAdminData.js` | 6.E | subscription_invoices.update during addon confirmation (partial commit) |
| `admin.invoice.confirm_status` | `src/lib/hooks/useAdminData.js` | 6.E | subscription_invoices.update status |
| `admin.invoice.confirm_tenant` | `src/lib/hooks/useAdminData.js` | 6.E | tenants.update during invoice confirmation (partial commit) |
| `admin.invoice.create` | `src/lib/hooks/useAdminData.js` | 6.E | subscription_invoices.insert |
| `admin.invoice.delete` | `src/lib/hooks/useAdminData.js` | 6.E | subscription_invoices.delete |
| `admin.market_price.approve` | `src/lib/hooks/useAdminData.js` | 6.E | market_prices.update status=approved |
| `admin.market_price.delete` | `src/lib/hooks/useAdminData.js` | 6.E | market_prices.delete |
| `admin.payment_setting.delete` | `src/lib/hooks/useAdminData.js` | 6.E | payment_settings.delete |
| `admin.payment_setting.upsert` | `src/lib/hooks/useAdminData.js` | 6.E | payment_settings.upsert |
| `admin.payment_setting.upsert_xendit` | `src/lib/hooks/useAdminData.js` | 6.E | payment_settings.upsert for Xendit |
| `admin.plan_config.update` | `src/lib/hooks/useAdminData.js` | 6.E | plan_configs.update |
| `admin.pricing.insert` | `src/lib/hooks/useAdminData.js` | 6.E | plan_configs.insert (partial commit flag) |
| `admin.pricing.update` | `src/lib/hooks/useAdminData.js` | 6.E | plan_configs.update |
| `admin.site_config.update` | `src/lib/hooks/useSiteConfig.js` | 6.E | site_configs.update |
| `admin.subscription.activate_trial` | `src/lib/hooks/useAdminData.js` | 6.E | tenants.update subscription_plan |
| `admin.tenant.delete_broker_connections` | `src/lib/hooks/useAdminData.js` | 6.E | broker_connections.delete (partial commit flag) |
| `admin.tenant.delete_cascade` | `src/lib/hooks/useAdminData.js` | 6.E | multi-table soft/hard delete cascade (partial commit flag) |
| `admin.tenant.delete_final` | `src/lib/hooks/useAdminData.js` | 6.E | tenants.delete |
| `admin.tenant.nullify_cascade` | `src/lib/hooks/useAdminData.js` | 6.E | multi-table tenant_id nullify (partial commit flag) |
| `admin.tenant.update` | `src/lib/hooks/useAdminData.js` | 6.E | tenants.update |
| `admin.user.delete` | `src/lib/hooks/useAdminData.js` | 6.E | profiles.delete |
| `admin.user.delete_tenant` | `src/lib/hooks/useAdminData.js` | 6.E | tenants.delete for lonely tenant (partial commit flag) |
| `account.bisnis.update` | `src/dashboard/_shared/pages/AkunPreview.jsx` | 6.F | tenants.update business_name/province/location (EditBisnisSheet) |
| `account.business.delete` | `src/dashboard/_shared/pages/AkunPreview.jsx` | 6.F | delete_my_business RPC failure (dual-log with logSupabaseError + logError) |
| `ai.prediction.save` | `src/dashboard/peternak/ai/PrediksiHasilPage.jsx` | Phase 3 Missing Error Logging | ai_conversations/ai_pending_entries insert failure during prediction save |
| `auth.callback_error` | `src/pages/AuthCallback.jsx` | 6.0 | Hash error params (otp_expired, access_denied) — code only, no token |
| `auth.callback_fetch_profiles` | `src/pages/AuthCallback.jsx` | 6.0 | Profile fetch after callback session resolved |
| `auth.callback_no_session` | `src/pages/AuthCallback.jsx` | 6.0 | getSession() returned no user |
| `auth.callback_unexpected` | `src/pages/AuthCallback.jsx` | 6.0 | Catch-all for promise chain throws (prevents blank-page hang) |
| `auth.fetch_memberships` | `src/lib/hooks/useAuth.jsx` | 6.2 | tenant_memberships SELECT failure |
| `auth.fetch_profiles` | `src/lib/hooks/useAuth.jsx` | 6.2 | profiles SELECT failure during auth bootstrap |
| `auth.invite.accept_current` | `src/pages/AcceptInvite.jsx` | Phase 1 Missing Error Logging | existing profile query and upsert/membership creation with current account |
| `auth.invite.login_submit` | `src/pages/AcceptInvite.jsx` | Phase 1 Missing Error Logging | signInWithPassword, profiles, and invitations update |
| `auth.invite.register_submit` | `src/pages/AcceptInvite.jsx` | Phase 1 Missing Error Logging | signUp and invitations update |
| `auth.invite.switch_tenant` | `src/pages/AcceptInvite.jsx` | Phase 1 Missing Error Logging | tenant switcher profile/membership update |
| `auth.invite.verify_code` | `src/pages/AcceptInvite.jsx` | Phase 1 Missing Error Logging | edge function verify-invite-code call catches and failures |
| `auth.invite.verify_token` | `src/pages/Invite.jsx` | Phase 1 Missing Error Logging | rpc('get_invitation_by_token') check and catches |
| `auth.password.reset_request` | `src/pages/ForgotPassword.jsx` | Phase 1 Missing Error Logging | resetPasswordForEmail failure |
| `auth.password.reset_submit` | `src/pages/ResetPassword.jsx` | Phase 1 Missing Error Logging | updateUser password update failure |
| `breeding.animal.add` | `src/lib/hooks/createBreedingHooks.js` | 6.F | `{prefix}_breeding_animals.insert` |
| `breeding.animal.update` | `src/lib/hooks/createBreedingHooks.js` | 6.F | `{prefix}_breeding_animals.update` |
| `breeding.birth.add` | `src/lib/hooks/createBreedingHooks.js` | 6.F | `{prefix}_breeding_births.insert` |
| `breeding.feed_log.add` | `src/lib/hooks/createBreedingHooks.js` | 6.F | `{prefix}_breeding_feed_logs.insert` |
| `breeding.health_log.add` | `src/lib/hooks/createBreedingHooks.js` | 6.F | `{prefix}_breeding_health_logs.insert` |
| `breeding.mating.add` | `src/lib/hooks/createBreedingHooks.js` | 6.F | `{prefix}_breeding_mating_records.insert` |
| `breeding.mating.update` | `src/lib/hooks/createBreedingHooks.js` | 6.F | `{prefix}_breeding_mating_records.update` |
| `breeding.sale.add` | `src/lib/hooks/createBreedingHooks.js` | 6.F | `{prefix}_breeding_sales.insert` |
| `breeding.sale.add.animal_sync` | `src/lib/hooks/createBreedingHooks.js` | 6.F | `animals.update status='terjual'` after sale (partial commit) |
| `breeding.weight.add` | `src/lib/hooks/createBreedingHooks.js` | 6.F | `{prefix}_breeding_weight_records.insert` |
| `broker.cashflow.fetch` | `src/lib/hooks/useCashFlow.js` | Phase 3 Missing Error Logging | Supabase SELECT errors in core cash flow hook |
| `broker.cashflow.fetch_by_farm` | `src/lib/hooks/useCashFlow.js` | Phase 3 Missing Error Logging | Supabase SELECT error in useCashFlowByFarm hook |
| `broker.cashflow.fetch_by_rpa` | `src/lib/hooks/useCashFlow.js` | Phase 3 Missing Error Logging | Supabase SELECT error in useCashFlowByRPA hook |
| `broker.delivery.fetch` | `src/lib/hooks/useUpdateDelivery.js` | 6.2 | Initial deliveries select for the update flow |
| `broker.delivery.update` | `src/lib/hooks/useUpdateDelivery.js` | 6.2 | deliveries.update (status, arrived count/weight, mortality) |
| `broker.delivery.create.wizard` | `src/dashboard/_shared/components/TransaksiWizard.jsx` | Phase 2 Missing Error Logging | deliveries.insert (in Transaksi Wizard) |
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
| `broker.purchase.create.wizard` | `src/dashboard/_shared/components/TransaksiWizard.jsx` | Phase 2 Missing Error Logging | purchases.insert (in Transaksi Wizard) |
| `broker.sale.delivery_sync` | `src/lib/hooks/useUpdateDelivery.js` | 6.2 | sales.total_revenue cumulative recompute after delivery arrival |
| `broker.vehicle.create` | `src/dashboard/broker/poultry_broker/Armada.jsx` | 6.3 | vehicles.insert (new vehicle) |
| `broker.vehicle.delete` | `src/dashboard/broker/poultry_broker/Armada.jsx` | 6.3 | vehicles.update is_deleted=true (soft delete) |
| `broker.vehicle.update` | `src/dashboard/broker/poultry_broker/Armada.jsx` | 6.3 | vehicles.update (edit existing) |
| `broker.connection.cancel` | `src/lib/hooks/useBrokerConnections.js` | 6.F | broker_connections.update is_cancelled=true |
| `broker.connection.request` | `src/lib/hooks/useBrokerConnections.js` | 6.F | broker_connections.insert |
| `broker.connection.respond` | `src/lib/hooks/useBrokerConnections.js` | 6.F | broker_connections.update status (accept/reject) |
| `broker.delivery.update_arrival` | `src/dashboard/broker/poultry_broker/pengiriman/UpdateArrivalSheet.jsx` | 6.F | deliveries.update arrival data (critical path) |
| `broker.employee.create` | `src/lib/hooks/useBrokerKaryawanData.js` | 6.F | broker_employees.insert |
| `broker.employee.delete` | `src/lib/hooks/useBrokerKaryawanData.js` | 6.F | broker_employees.update is_deleted=true |
| `broker.employee.update` | `src/lib/hooks/useBrokerKaryawanData.js` | 6.F | broker_employees.update |
| `broker.expense.add` | `src/dashboard/broker/poultry_broker/CashFlow.jsx` | 6.F | extra_expenses.insert |
| `broker.loss_report.create` | `src/dashboard/broker/poultry_broker/pengiriman/CreateLossSheet.jsx` | 6.F | loss_reports.insert (manual; also used by useUpdateDelivery.js for automated delivery rows) |
| `broker.payment.add` | `src/dashboard/broker/poultry_broker/RPADetail.jsx` | 6.F | payments.insert (partial payment form) |
| `broker.payment.bulk_settle` | `src/dashboard/broker/poultry_broker/RPADetail.jsx` | 6.F | payments.insert loop per overdue sale |
| `broker.payment.settle` | `src/dashboard/broker/poultry_broker/RPADetail.jsx` | 6.F | payments.insert (single full payment) |
| `broker.rpa.create` | `src/dashboard/broker/poultry_broker/RPA.jsx` | 6.F | rpa_clients.insert |
| `broker.rpa.delete` | `src/dashboard/broker/poultry_broker/RPA.jsx` + `RPADetail.jsx` | 6.F | rpa_clients.update is_deleted=true |
| `broker.rpa.update` | `src/dashboard/broker/poultry_broker/RPA.jsx` + `RPADetail.jsx` | 6.F | rpa_clients.update |
| `broker.sale.bulk_mark_paid` | `src/dashboard/broker/poultry_broker/Beranda.jsx` | 6.F | sales.update payment_status='lunas' loop |
| `broker.sale.create` | `src/dashboard/_shared/components/FormJualModal.jsx` | 6.F | sales.insert (broker sale record creation) |
| `broker.sale.create.wizard` | `src/dashboard/_shared/components/TransaksiWizard.jsx` | Phase 2 Missing Error Logging | sales.insert (in Transaksi Wizard) |
| `broker.transaction.create` | `src/dashboard/_shared/components/TransaksiWizard.jsx` | Phase 2 Missing Error Logging | Overall multi-step transaction write status and vehicle/driver registration |
| `dairy.animal.add` | `src/lib/hooks/createDairyHooks.js` | 6.F | `{prefix}_animals.insert` |
| `dairy.inventory.update` | `src/lib/hooks/createDairyHooks.js` | 6.F | `{prefix}_transactions.insert` |
| `dairy.inventory.update.stock_sync` | `src/lib/hooks/createDairyHooks.js` | 6.F | `{prefix}_inventory.update` qty sync after transaction (partial commit) |
| `dairy.milk_log.add` | `src/lib/hooks/createDairyHooks.js` | 6.F | `{prefix}_milk_logs.insert` |
| `dairy.milk_sale.add` | `src/lib/hooks/createDairyHooks.js` | 6.F | `{prefix}_sales.insert` |
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
| `kd_breeding.animal.add` | `src/lib/hooks/useKdBreedingData.js` | 6.F | `kd_breeding_animals.insert` |
| `kd_breeding.animal.update` | `src/lib/hooks/useKdBreedingData.js` | 6.F | `kd_breeding_animals.update` |
| `kd_breeding.birth.add` | `src/lib/hooks/useKdBreedingData.js` | 6.F | `kd_breeding_births.insert` |
| `kd_breeding.feed_log.add` | `src/lib/hooks/useKdBreedingData.js` | 6.F | `kd_breeding_feed_logs.insert` |
| `kd_breeding.health_log.add` | `src/lib/hooks/useKdBreedingData.js` | 6.F | `kd_breeding_health_logs.insert` |
| `kd_breeding.mating.add` | `src/lib/hooks/useKdBreedingData.js` | 6.F | `kd_breeding_mating_records.insert` |
| `kd_breeding.mating.update` | `src/lib/hooks/useKdBreedingData.js` | 6.F | `kd_breeding_mating_records.update` |
| `kd_breeding.sale.add` | `src/lib/hooks/useKdBreedingData.js` | 6.F | `kd_breeding_sales.insert` |
| `kd_breeding.sale.add.animal_sync` | `src/lib/hooks/useKdBreedingData.js` | 6.F | `kd_breeding_animals.update status='terjual'` after sale (partial commit) |
| `kd_breeding.weight.add` | `src/lib/hooks/useKdBreedingData.js` | 6.F | `kd_breeding_weight_records.insert` |
| `kd_penggemukan.animal.add` | `src/lib/hooks/useKdPenggemukanData.js` | 6.F | `kd_*_animals.insert` |
| `kd_penggemukan.animal.add.batch_sync` | `src/lib/hooks/useKdPenggemukanData.js` | 6.F | batch total_animals sync after animal add (partial commit) |
| `kd_penggemukan.animal.move_kandang` | `src/lib/hooks/useKdPenggemukanData.js` | 6.F | `kd_*_animals.update kandang_id/slot` |
| `kd_penggemukan.animal.update_status` | `src/lib/hooks/useKdPenggemukanData.js` | 6.F | `kd_*_animals.update status` |
| `kd_penggemukan.batch.close` | `src/lib/hooks/useKdPenggemukanData.js` | 6.F | `kd_*_batches.update status=closed` |
| `kd_penggemukan.batch.create` | `src/lib/hooks/useKdPenggemukanData.js` | 6.F | `kd_*_batches.insert` |
| `kd_penggemukan.feed_log.add` | `src/lib/hooks/useKdPenggemukanData.js` | 6.F | `kd_*_feed_logs.upsert` |
| `kd_penggemukan.feed_log.delete` | `src/lib/hooks/useKdPenggemukanData.js` | 6.F | `kd_*_feed_logs.update is_deleted=true` |
| `kd_penggemukan.health_log.add` | `src/lib/hooks/useKdPenggemukanData.js` | 6.F | `kd_*_health_logs.insert` |
| `kd_penggemukan.kandang.create` | `src/lib/hooks/useKdPenggemukanData.js` | 6.F | `kd_*_kandangs.insert` |
| `kd_penggemukan.kandang.ensure_holding` | `src/lib/hooks/useKdPenggemukanData.js` | 6.F | SELECT pre-check + INSERT holding pen (shared action_name for both steps) |
| `kd_penggemukan.sale.add` | `src/lib/hooks/useKdPenggemukanData.js` | 6.F | `kd_*_sales.insert` |
| `kd_penggemukan.sale.add.animal_sync` | `src/lib/hooks/useKdPenggemukanData.js` | 6.F | `kd_*_animals.update status='terjual'` after sale (partial commit) |
| `kd_penggemukan.weight.add` | `src/lib/hooks/useKdPenggemukanData.js` | 6.F | `kd_*_weight_records.insert` |
| `kd_penggemukan.weight.delete` | `src/lib/hooks/useKdPenggemukanData.js` | 6.F | `kd_*_weight_records.update is_deleted=true` |
| `handleLogout` | `src/dashboard/_shared/pages/AkunPreview.jsx` | 5 | supabase.auth.signOut error |
| `handleRestore` | `src/dashboard/broker/sembako_broker/components/SembakoRecycleBin.jsx` | 5 | Restore soft-deleted row |
| `handleSave` | `src/dashboard/_shared/pages/AkunPreview.jsx` | 5 | EditProfileSheet profiles.update |
| `invite.accept.mark_accepted` | `src/pages/Invite.jsx` | 6.F | team_invitations.update status='accepted' |
| `invite.accept.profile_update` | `src/pages/Invite.jsx` | 6.F | profiles.update name + user_type during invite accept |
| `invoice.generate` | `src/lib/invoice/useInvoice.js` | 6.F | generated_invoices.insert |
| `handleSaveProfile` | `src/lib/hooks/useRPAData.js` | 5 | RPA profile upsert onError |
| `login.fetch_profiles` | `src/pages/Login.jsx` | 6.0 | profiles select after sign-in |
| `login.oauth_google` | `src/pages/Login.jsx` | 6.0 | Google OAuth init catch |
| `login.submit` | `src/pages/Login.jsx` | 6.0 | signInWithPassword error branch |
| `login.unexpected` | `src/pages/Login.jsx` | 6.0 | handleLogin outer catch |
| `market.listing.close` | `src/lib/hooks/useMarket.js` | 6.F | market_listings.update status='closed' |
| `market.listing.create` | `src/lib/hooks/useMarket.js` | 6.F | market_listings.insert |
| `market.listing.delete` | `src/lib/hooks/useMarket.js` | 6.F | market_listings.update is_deleted=true |
| `market.listing.increment_view` | `src/dashboard/_shared/pages/Market.jsx` | Phase 4 Missing Error Logging | market_listings.update view_count increment failure |
| `market.price.upsert` | `src/dashboard/_shared/pages/HargaPasar.jsx` | Phase 4 Missing Error Logging | market_prices.upsert manual price update failure |
| `notification.delete` | `src/lib/hooks/useNotifications.jsx` | 6.F | `notifications.update is_deleted=true` |
| `notification.generate.payday` | `src/lib/hooks/useNotifications.jsx` | 6.F | Payday reminder insert for worker (non-throwing) |
| `notification.generate.piutang_broker` | `src/lib/hooks/useNotifications.jsx` | 6.F | Overdue broker sales notification insert (non-throwing) |
| `notification.generate.piutang_sembako` | `src/lib/hooks/useNotifications.jsx` | 6.F | Overdue sembako sales notification insert (non-throwing) |
| `notification.generate.stok_pakan` | `src/lib/hooks/useNotifications.jsx` | 6.F | Low feed stock notification insert (non-throwing) |
| `notification.generate.subscription_expires` | `src/lib/hooks/useNotifications.jsx` | 6.F | Trial/subscription expiry notification insert (non-throwing) |
| `notification.generate.tugas_terlambat` | `src/lib/hooks/useNotifications.jsx` | 6.F | Overdue tasks summary notification insert (non-throwing) |
| `notification.generate.unexpected` | `src/lib/hooks/useNotifications.jsx` | 6.F | Outer catch in checkAndGenerate — unexpected JS throw |
| `notification.mark_read` | `src/lib/hooks/useNotifications.jsx` | 6.F | `notifications.update is_read=true` (single + all) |
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
| `peternak.broiler_cycle.create` | `src/lib/hooks/usePeternakData.js` | 6.F | `breeding_cycles.insert` (broiler) |
| `peternak.broiler_cycle.delete` | `src/lib/hooks/usePeternakData.js` | 6.F | `breeding_cycles.update is_deleted=true` |
| `peternak.broiler_cycle.update_status` | `src/lib/hooks/usePeternakData.js` | 6.F | `breeding_cycles.update` (status/fcr/ip/harvest) |
| `peternak.daily_record.upsert` | `src/lib/hooks/usePeternakData.js` | 6.F | `daily_records.upsert` (conflict on cycle_id,record_date) |
| `peternak.daily_record.upsert.cycle_sync` | `src/lib/hooks/usePeternakData.js` | 6.F | `breeding_cycles.update total_mortality/total_feed_kg` aggregate sync (partial, non-throwing) |
| `peternak.farm.create` | `src/lib/hooks/usePeternakData.js` | 6.F | `peternak_farms.insert` |
| `peternak.farm.delete` | `src/lib/hooks/usePeternakData.js` | 6.F | `peternak_farms.update is_deleted=true` |
| `peternak.cycle_expense.add` | `src/dashboard/peternak/broiler/LaporanSiklus.jsx` | 6.F | cycle_expenses.insert (AddExpenseSheet in cycle report page) |
| `peternak.farm.setup` | `src/dashboard/peternak/broiler/SetupFarm.jsx` | 6.F + Phase 1 Missing Error Logging | peternak_farms.insert (first-run onboarding setup) and general catch |
| `peternak.farm.setup_cycle` | `src/dashboard/peternak/broiler/SetupFarm.jsx` | Phase 1 Missing Error Logging | breeding_cycles.insert check inside setup flow |
| `peternak.farm.update` | `src/lib/hooks/usePeternakData.js` | 6.F | `peternak_farms.update` |
| `peternak.farm_ops_cost.create` | `src/lib/hooks/usePeternakTaskData.js` | 6.B | farm-wide Listrik & Air ops cost insert (split across active batches) |
| `peternak.farm_ops_cost.delete` | `src/lib/hooks/usePeternakTaskData.js` | 6.B | farm-wide Listrik & Air ops cost soft-delete |
| `peternak.feed_stock.reduce` | `src/lib/hooks/usePeternakData.js` | 6.F | `feed_stocks.update quantity_kg` (catat pemakaian) |
| `peternak.feed_stock.upsert` | `src/lib/hooks/usePeternakData.js` | 6.F | `feed_stocks.update/insert` (add/create stock) |
| `peternak.feed_stock.upsert.expense` | `src/lib/hooks/usePeternakData.js` | 6.F | `cycle_expenses.insert` for pakan cost tracking (partial commit) |
| `peternak.feed_log.create` | `src/lib/hooks/createPenggemukanHooks.js` | 6.B | feed.upsert per kandang/log_date |
| `peternak.feed_log.delete` | `src/lib/hooks/createPenggemukanHooks.js` | 6.B | feed.update is_deleted=true |
| `peternak.health_log.create` | `src/lib/hooks/createPenggemukanHooks.js` | 6.B | health.insert |
| `peternak.health_log.create.animal_sync` | `src/lib/hooks/createPenggemukanHooks.js` | 6.B | animals.status='dead' sync after kematian record (partial, fire-and-forget) |
| `peternak.health_log.delete` | `src/lib/hooks/createPenggemukanHooks.js` | 6.B | health.update is_deleted=true |
| `peternak.health_log.delete_inline` | `src/dashboard/peternak/_shared/components/TaskSheets.jsx` + `TaskCards.jsx` | Phase 3 Missing Error Logging | Inline health record soft-delete update error |
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
| `peternak.worker.create` | `src/dashboard/peternak/broiler/AnakKandang.jsx` | Phase 2 Missing Error Logging | farm_workers.insert |
| `peternak.worker.update` | `src/dashboard/peternak/broiler/AnakKandang.jsx` | Phase 2 Missing Error Logging | farm_workers.update |
| `peternak.worker_payment.create` | `src/dashboard/peternak/broiler/AnakKandang.jsx` | Phase 2 Missing Error Logging | worker_payments.insert |
| `peternak.weight_record.create` | `src/lib/hooks/createPenggemukanHooks.js` | 6.B | weights.insert |
| `peternak.weight_record.create.animal_sync` | `src/lib/hooks/createPenggemukanHooks.js` | 6.B | animals.latest_weight_kg sync after weigh-in (partial commit) |
| `peternak.weight_record.delete` | `src/lib/hooks/createPenggemukanHooks.js` | 6.B | weights.update is_deleted=true |
| `peternak.weight_record.delete_inline` | `src/dashboard/peternak/_shared/components/TaskSheets.jsx` + `TaskCards.jsx` | Phase 3 Missing Error Logging | Inline weight record soft-delete update error |
| `sapi.animal.move_kandang` | `src/lib/hooks/useSapiPenggemukanData.js` | 6.F | sapi_penggemukan_animals.update kandang_id/slot (drag-drop Denah Kandang) |
| `sapi.kandang.create` | `src/lib/hooks/useSapiPenggemukanData.js` | 6.F | sapi_penggemukan_kandangs.insert (Denah Kandang) |
| `sapi.kandang.ensure_holding_check` | `src/lib/hooks/useSapiPenggemukanData.js` | 6.F | Pre-check SELECT on sapi kandangs.is_holding=true |
| `sapi.kandang.ensure_holding_create` | `src/lib/hooks/useSapiPenggemukanData.js` | 6.F | sapi kandangs.insert Holding pen when none exists |
| `sapi.kandang.update` | `src/lib/hooks/useSapiPenggemukanData.js` | 6.F | sapi_penggemukan_kandangs.update (form edit) |
| `sapi.kandang.update_position` | `src/lib/hooks/useSapiPenggemukanData.js` | 6.F | sapi_penggemukan_kandangs.update grid_x/grid_y (drag-drop reposition) |
| `sapi_breeding.animal.add` | `src/lib/hooks/useSapiBreedingData.js` | 6.F | sapi_breeding_animals.insert |
| `sapi_breeding.animal.update` | `src/lib/hooks/useSapiBreedingData.js` | 6.F | sapi_breeding_animals.update |
| `sapi_breeding.birth.add` | `src/lib/hooks/useSapiBreedingData.js` | 6.F | sapi_breeding_births.insert |
| `sapi_breeding.feed_log.add` | `src/lib/hooks/useSapiBreedingData.js` | 6.F | sapi_breeding_feed_logs.insert |
| `sapi_breeding.feed_log.delete` | `src/lib/hooks/useSapiBreedingData.js` | 6.F | sapi_breeding_feed_logs.update is_deleted=true |
| `sapi_breeding.health_log.add` | `src/lib/hooks/useSapiBreedingData.js` | 6.F | sapi_breeding_health_logs.insert |
| `sapi_breeding.health_log.delete` | `src/lib/hooks/useSapiBreedingData.js` | 6.F | sapi_breeding_health_logs.update is_deleted=true |
| `sapi_breeding.mating.add` | `src/lib/hooks/useSapiBreedingData.js` | 6.F | sapi_breeding_mating_records.insert |
| `sapi_breeding.mating.update_status` | `src/lib/hooks/useSapiBreedingData.js` | 6.F | sapi_breeding_mating_records.update status |
| `sapi_breeding.sale.add` | `src/lib/hooks/useSapiBreedingData.js` | 6.F | sapi_breeding_sales.insert |
| `sapi_breeding.weight.add` | `src/lib/hooks/useSapiBreedingData.js` | 6.F | sapi_breeding_weight_records.insert |
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
   OR action_name LIKE 'sapi.%'
   OR action_name LIKE 'broker.%'
   OR action_name LIKE 'rpa.%'
   OR action_name LIKE 'sembako.%'
   OR action_name LIKE 'egg.%'
   OR action_name LIKE 'account.%'
   OR action_name LIKE 'breeding.%'
   OR action_name LIKE 'kd_breeding.%'
   OR action_name LIKE 'notification.%'
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

Phase 6.F quick check (Sapi Kandang gap patch — sapi.* action_names):

```sql
SELECT created_at, component, action_name, error_message, metadata
FROM public.system_error_logs
WHERE action_name IN (
  'sapi.kandang.create',
  'sapi.animal.move_kandang',
  'sapi.kandang.update_position',
  'sapi.kandang.update',
  'sapi.kandang.ensure_holding_check',
  'sapi.kandang.ensure_holding_create'
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
