# BILLING_SUBSCRIPTION_HARDENING_PLAN.md

> **Status:** B3A ✅ B3B ✅ — B3D PENDING (after B4/B5 live), B3E PENDING  
> **Last updated:** 2026-05-20  
> **Payment provider:** Midtrans Snap  
> **Authored by:** Antigravity × TernakOS Engineering  

---

## 1. Overview

Billing touches money and access control. A bug here either:
- **Charges the wrong amount** (user trust loss, support burden)
- **Grants wrong access** (plan enforcement bypass, revenue loss)
- **Corrupts plan state** (partial update leaves tenant on wrong plan)

This document is the single source of truth for how billing works today, what risks exist, and what must be hardened before the payment volume grows.

---

## 2. Billing Architecture Map

```
User                 UpgradePlan.jsx       AdminSubscriptions.jsx
 │                        │                        │
 │── SELECT plan ─────────▶                        │
 │   (billingMonths,                               │
 │    total amount)                                │
 │                        │                        │
 │◀─── invoice created ───│ useCreateInvoice()     │
 │     (status=pending)   │   → subscription_invoices   │
 │                        │                        │
 │── [manual transfer] ──▶│                        │
 │                        │                        │
 │                        │◀─── Admin confirms ────│
 │                        │     useConfirmInvoice()│
 │                        │                        │
 │                        │  Step 1: UPDATE invoice → status=paid
 │                        │  Step 2: READ tenants.plan_expires_at (baseDate)
 │                        │  Step 3: READ plan_configs.kandang_limit
 │                        │  Step 4: UPDATE tenants (plan, plan_expires_at, kandang_limit)
 │                        │                        │
 │◀─── access unlocked ───│                        │
```

**Target: Midtrans Snap Gateway (planned)**
```
User → UpgradePlan
  → Edge Function: midtrans-create-transaction  (uses Server Key from Vault)
  → Midtrans Snap API  →  returns token + redirect_url
  → store provider_order_id / provider_transaction_id / provider_payment_url
  → frontend redirects user to Midtrans Snap hosted payment page
  → Midtrans sends HTTP notification to Edge Function: midtrans-webhook
  → webhook verifies signature_key (SHA512)
  → atomic RPC: confirm_invoice_and_update_plan()
  → frontend polls invoice status → access unlocked
```
**Current state:** No Midtrans Edge Functions exist yet. Manual bank transfer is the only active payment flow. The existing `payment_settings` table previously stored Xendit config — that config should be removed and replaced by Supabase Vault Secrets for the Midtrans Server Key.

---

## 3. Data Layer Audit

### 3.1 Primary Billing Tables

| Table | Key Columns | Role |
|-------|-------------|------|
| `tenants` | `plan`, `plan_expires_at`, `trial_ends_at`, `kandang_limit`, `is_active` | Source of truth for access control |
| `subscription_invoices` | `id`, `invoice_number`, `tenant_id`, `plan`, `billing_months`, `amount`, `status`, `payment_method`, `payment_provider`, `provider_order_id`, `provider_transaction_id`, `provider_payment_url`, `provider_status`, `provider_payload`, `confirmed_by`, `confirmed_at`, `paid_at`, `cancelled_at`, `expired_at`, `payment_proof_url`, `notes` | Invoice ledger (provider-neutral schema — see Section 5.4 for migration plan) |
| `payment_settings` | `id`, `bank_name`, `account_number`, `account_name`, `is_active` | Manual bank transfer accounts only — Midtrans Server Key must NOT be stored here |
| `pricing_plans` | `role`, `plan`, `price`, `original_price` | Per-vertical pricing matrix |
| `plan_configs` | `config_key`, `config_value` (JSONB) | Dynamic limits: `kandang_limit`, `transaction_quota`, `team_limit`, `business_limit`, `trial_config` |
| `discount_codes` | `code`, `discount_pct`, `is_active`, `max_uses`, `used_count` | Promo codes |

### 3.2 Feature Limit Sources (Dual-Path — Risk)

Feature limits are read from **two sources** and must stay in sync:

| Feature | DB Source | Frontend Fallback | Enforced By |
|---------|-----------|-------------------|-------------|
| `kandang_limit` | `plan_configs` | `quotaUtils.DEFAULTS.kandang_limit` | `useConfirmInvoice` writes to `tenants.kandang_limit` |
| `transaction_quota` | `plan_configs` | `planGating.FALLBACK_TRANSACTION_QUOTA = 30` | DB trigger `trg_rpa_invoice_quota`, `useTransactionQuota` |
| `team_limit` | `plan_configs` | `quotaUtils.DEFAULTS.team_limit` | Frontend gate only (no DB trigger) |
| `business_limit` | `plan_configs` | `quotaUtils.DEFAULTS.business_limit` | `checkQuotaUsage()` (frontend + DB) |
| AI chat sessions | `AI_PLAN_CONFIG` (hardcoded) | same | Frontend only |
| `trial_config.pro` | `plan_configs` | hardcoded `7` days in `UpgradePlan.jsx` | `useActivateTrial` → RPC `activate_plan_trial` |

> **Risk B-1:** If `plan_configs` row is missing, frontend falls back to hardcoded defaults silently. The fallback and the DB value can drift. There is no alarm.

### 3.3 Midtrans Server Key Storage (Risk)

Midtrans uses a **Server Key** (for backend calls) and a **Client Key** (safe for frontend).

- **Server Key** must only be used in a Supabase Edge Function. It must **never** be stored in `payment_settings`, source code, or any client-accessible table.
- **Client Key** can be exposed to the frontend for Snap.js initialization, but should be stored as a Vite env var (`VITE_MIDTRANS_CLIENT_KEY`), not hardcoded.
- The old `payment_settings` dual-use pattern (bank accounts + gateway credentials in the same table) must not be repeated for Midtrans.

> **Risk M-1:** If Server Key is stored in `payment_settings` or any DB table readable by the `authenticated` role, it is exposed. Must use Supabase Vault Secrets (`supabase secrets set MIDTRANS_SERVER_KEY=...`).

> **Risk M-8:** Sandbox and production keys are different. Using a sandbox key in production silently accepts all payments in test mode. An `MIDTRANS_IS_PRODUCTION` Vault secret (boolean) must gate which API base URL is used (`https://app.midtrans.com` vs `https://app.sandbox.midtrans.com`).

---

## 4. Frontend Billing Audit

### 4.1 `UpgradePlan.jsx`

**Location:** `src/dashboard/_shared/pages/UpgradePlan.jsx`  
**Route:** `/upgrade` (lazy-loaded, auth-protected)

| Concern | Finding |
|---------|---------|
| **Invoice dedup** | No check for existing `pending` invoice for the same tenant+plan. A user can click "Upgrade" multiple times and create duplicate invoices. |
| **Price validation** | `basePrice` from `usePricingConfig()` can be `0` if the `pricing_plans` row doesn't exist for this vertical+plan combo. The CTA button is disabled when `!basePrice`, but there is no user-visible error explaining why. |
| **Vertical mapping** | `VERTICAL_TO_PRICING_ROLE` covers: `poultry_broker`, `egg_broker`, `peternak`, `rumah_potong`, `sembako_broker`. Missing: `peternak_layer`, `peternak_kambing_domba_penggemukan`, `peternak_kambing_domba_breeding`, `rpa_ayam`. Falls back to `'broker'` silently — may show wrong pricing. |
| **Trial activation** | `activateTrial.mutate({ tenantId: tenant.id, days: trialDays })` — no confirmation dialog. One tap activates a trial immediately with no undo. |
| **Success screen** | Invoice created; user must manually follow up via WhatsApp. This is by-design (manual flow) but should be documented in the UI. |
| **Error instrumentation** | `handleSubmit` catch block is empty (`catch (_) { /* handled by mutation */ }`). Acceptable since `useCreateInvoice.onError` already handles logging. |

### 4.2 `AdminSubscriptions.jsx`

**Location:** `src/dashboard/admin/AdminSubscriptions.jsx`

| Concern | Finding |
|---------|---------|
| **Cancel invoice** | `executeCancelInvoice` calls Supabase directly (not via a mutation hook). The DB call lacks a `.eq('status', 'pending')` guard — the cancel button is only shown on pending invoices in the sheet footer (conditionally safe), but the DB call itself has no guard. |
| **Delete invoice** | `useDeleteInvoice` deletes `subscription_invoices` permanently by ID with no status filter. A paid invoice can be deleted. |
| **Double-bill guard** | `genHasPending` check exists in the Generate Invoice form — blocks creating a second invoice if one is already pending for that tenant. ✅ Good. |
| **Confirm invoice atomicity** | `useConfirmInvoice` is a 4-step process with no DB transaction. If step 4 (tenant update) fails, the invoice is `paid` but the tenant is still on the old plan. Logged with `metadata.partial: true` but not automatically recovered. |
| **Payment config tab** | Tab previously showed Xendit config. This must be replaced with Midtrans config (Client Key, webhook URL reference only — Server Key must never appear in the UI). No test-ping button exists yet. |

### 4.3 `AkunPreview.jsx` (Billing Section)

**Location:** `src/dashboard/_shared/pages/AkunPreview.jsx`  
**Finding:** Calls `navigate('/upgrade')` from `handleUpgrade`. Purely a navigation entry point — no billing-specific risks.

### 4.4 `AdminPricing.jsx`

**Location:** `src/dashboard/admin/AdminPricing.jsx`  
**Finding:** Reads `plan_configs` and `pricing_plans`. Updates via `useUpdatePlanConfig` (upsert) and `useUpdatePricing` (update-or-insert). Writes to `global_audit_logs`. No risks beyond general write-access control (protected by admin role check).

---

## 5. Payment Flow Audit

### 5.1 Manual Bank Transfer Flow (Current Primary)

```
1. User creates invoice (pending)        [UpgradePlan → useCreateInvoice]
2. User transfers money manually
3. User sends WhatsApp to admin
4. Admin opens AdminSubscriptions → confirms invoice
5. useConfirmInvoice executes multi-step mutation:
   a. GET auth user
   b. GET/null profile (for FK safety on confirmed_by)
   c. UPDATE subscription_invoices SET status=paid WHERE id=X AND status=pending
   d. GET tenants.plan_expires_at  ← baseDate for renewal calc, read BEFORE step c
   e. GET plan_configs.kandang_limit
   f. UPDATE tenants SET plan=X, plan_expires_at=Y, kandang_limit=Z
```

**Risks in this flow:**
- Steps c→f are not atomic. No DB transaction wraps them.
- No idempotency key on `useConfirmInvoice` — calling it twice:
  - Step c: Second call skips (invoice no longer `pending`) ✅ Self-protecting
  - But count of affected rows is NOT checked — the mutation proceeds silently even if 0 rows updated
- `baseDate` is correctly fetched before invoice update (avoids double-extension) but this ordering is undocumented

### 5.2 Midtrans Snap Gateway Flow (Planned)

**Current state:** No Edge Functions exist. This section documents the target architecture.

```
Step 1 (Frontend): User selects plan → calls Edge Function midtrans-create-transaction
  → Edge Function reads Server Key from Vault
  → POST https://app[.sandbox].midtrans.com/snap/v1/transactions
       { order_id, gross_amount, customer_details, item_details }
  → Midtrans returns { token, redirect_url }
  → Edge Function writes to subscription_invoices:
       provider_order_id = order_id
       provider_payment_url = redirect_url
       provider_status = 'pending'
       payment_provider = 'midtrans'
  → Frontend receives redirect_url and redirects user

Step 2 (Webhook): Midtrans sends HTTP POST to Edge Function midtrans-webhook
  → Verify signature_key (see Section 5.3)
  → Determine invoice action from transaction_status (see Section 5.3)
  → On PAID: call atomic RPC confirm_invoice_and_update_plan()
  → On FAILED/EXPIRED: update invoice status only, do NOT update tenant plan
  → Return HTTP 200 to Midtrans regardless (safe no-op if already processed)

Step 3 (Frontend poll): Frontend polls subscription_invoices.status every 5s
  → When status = 'paid', invalidate tenant query → access unlocked
```

**Pre-conditions before Midtrans can go live:**
1. Supabase Vault Secrets: `MIDTRANS_SERVER_KEY`, `MIDTRANS_IS_PRODUCTION`
2. Vite env: `VITE_MIDTRANS_CLIENT_KEY` (non-secret, used by Snap.js)
3. Edge Function: `supabase/functions/midtrans-create-transaction/index.ts`
4. Edge Function: `supabase/functions/midtrans-webhook/index.ts`
5. Atomic RPC: `confirm_invoice_and_update_plan(p_provider_order_id text)` — replicates `useConfirmInvoice` steps c–f atomically
6. Provider-neutral invoice columns added via migration (Section 5.4)

### 5.3 Midtrans Webhook Rules

**Signature verification (mandatory — Risk M-3):**
```
signature = SHA512( order_id + status_code + gross_amount + server_key )
Compare with webhook payload field: signature_key
```
Never trust a webhook notification without verifying the signature. As a secondary check, optionally call Midtrans Get Status API: `GET /v2/{order_id}/status` to confirm the status server-side.

**Transaction status mapping:**

| Midtrans `transaction_status` | `fraud_status` | Invoice action |
|-------------------------------|----------------|----------------|
| `settlement` | any | ✅ Mark PAID → run confirm RPC |
| `capture` | `accept` | ✅ Mark PAID → run confirm RPC |
| `capture` | `challenge` or `deny` | ⚠️ Hold — do not activate plan; flag for admin review |
| `pending` | any | No-op — update `provider_status` only |
| `deny` | any | Mark FAILED — do not activate plan |
| `cancel` | any | Mark CANCELLED — do not activate plan |
| `expire` | any | Mark EXPIRED — do not activate plan |
| `failure` | any | Mark FAILED — do not activate plan |

**Idempotency rule:** If the invoice is already `paid` when the webhook arrives, return HTTP 200 immediately without re-running the confirm RPC. Never double-extend `plan_expires_at`.

**HTTP response rule:** Always return HTTP 200 after safe processing or safe idempotent no-op. Returning non-200 causes Midtrans to retry — the handler must be safe to call multiple times.

### 5.4 Provider-Neutral Invoice Schema (Proposal — no changes yet)

Do not apply schema changes during planning. The following columns are proposed for a dedicated migration phase (B3):

```sql
-- Proposed additions to subscription_invoices (planning only)
payment_provider     text    DEFAULT 'manual'   -- 'manual' | 'midtrans'
provider_order_id    text    UNIQUE NULLABLE     -- Midtrans order_id
provider_transaction_id text NULLABLE           -- Midtrans transaction_id
provider_payment_url text    NULLABLE           -- Snap redirect URL
provider_status      text    NULLABLE           -- raw Midtrans status
provider_payload     jsonb   NULLABLE           -- full webhook payload (for audit)
cancelled_at         timestamptz NULLABLE
expired_at           timestamptz NULLABLE
```

**Existing columns to retain as-is during transition:**
- `payment_proof_url` — still used for manual bank transfer proof uploads
- `confirmed_by` / `confirmed_at` — still used for admin-confirmed manual payments
- `paid_at` — set by both manual confirm flow and Midtrans webhook flow

**Migration strategy for old Xendit columns** (if they exist in the live DB):
- Do not rename or drop immediately
- Verify in Phase B1 whether `xendit_invoice_id` / `xendit_payment_url` columns exist and have any non-null data
- If columns are empty: drop in the same migration that adds provider-neutral columns
- If columns have data: migrate data into `provider_order_id` / `provider_payment_url` first, then drop

### 5.3 Add-on Flow (`addon_business_slot`)

```
1. Admin creates invoice with plan = 'addon_business_slot'
2. useConfirmInvoice detects plan.startsWith('addon_')
3. Finds owner profile for the tenant
4. Increments profiles.additional_slots by billingMonths
5. Returns early (does NOT update tenants.plan)
```

> **Risk B-3:** `billingMonths` is repurposed as "number of slots" for add-ons. Semantic overload not validated in the UI. If admin sets `billingMonths = 3`, it adds 3 slots — not obvious.

---

## 6. Plan Enforcement Logic Audit

### 6.1 `subscriptionUtils.getSubscriptionStatus(tenant)`

**File:** `src/lib/subscriptionUtils.js`

Decision tree:
1. Trial active? → `status: 'trial'`
2. Starter plan? → `status: 'active'` (infinite, `daysLeft: 999`)
3. Paid plan with future expiry? → `status: 'active'`
4. Else → `status: 'expired'`

> **Risk B-4:** When `plan = 'pro'` and `plan_expires_at` is past, the function returns `status: 'expired'` with `plan: 'pro'`. The DB field `tenants.plan` remains `'pro'` indefinitely unless a trigger or admin resets it. Some feature gates read `tenant.plan` (DB value), others read `getSubscriptionStatus().status`. They will disagree for expired paid tenants.
>
> **To verify (Phase B1):** Does any DB trigger or cron job reset `tenants.plan = 'starter'` on expiry?

### 6.2 `quotaUtils.checkQuotaUsage()`

**File:** `src/lib/quotaUtils.js`

- Queries `plan_configs` directly on every call (no caching)
- Each call = 2–3 Supabase round trips
- No memoization

> **Risk B-5:** Performance bottleneck at scale. Acceptable at current user volume. Must be addressed before growth phase.

### 6.3 `planGating.js` Constants vs DB

`planGating.js` has hardcoded feature matrices. These are frontend fallback values only. Actual enforced limits come from `plan_configs`.

> **Risk B-6:** Adding a new `plan_configs` key without updating `planGating.js` (or vice versa) creates silent drift.

---

## 7. Risk Registry

| ID | Area | Risk | Severity | Status |
|----|------|------|----------|--------|
| B-1 | plan_configs | Silent fallback when DB row missing | Medium | Not mitigated |
| B-3 | Add-on billing | `billingMonths` repurposed as slot count | Low | Documented |
| B-4 | Plan expiry | Expired Pro tenants retain `plan='pro'` in DB indefinitely | High | Unverified |
| B-5 | Quota checks | No caching on `checkQuotaUsage()` | Low | Deferred |
| B-6 | Plan gating | Hardcoded planGating.js can drift from plan_configs | Medium | Documented |
| M-1 | Midtrans Server Key | Key exposed if stored in DB or source code | High | Not mitigated |
| M-2 | Midtrans webhook | No webhook handler exists yet | Critical | Blocked |
| M-3 | Signature verification | Missing SHA512 check allows spoofed webhook | Critical | Not built |
| M-4 | Duplicate webhook | Double-confirm could extend plan_expires_at twice | High | Not mitigated |
| M-5 | Invoice dedup | User can create multiple pending invoices (user-side guard missing) | Medium | ✅ Fixed B2 — `useHasPendingInvoice` in `UpgradePlan.handleSubmit` |
| M-6 | Invoice atomicity | `useConfirmInvoice` 4-step mutation not atomic — partial failure leaves invoice paid but tenant on old plan | High | ✅ Mitigated B2 — row-count check aborts tenant update if 0 rows; full atomicity deferred to B5 RPC |
| M-7 | Status interpretation | Wrong handling of `capture+challenge` or `pending` could activate plan prematurely | High | Not built |
| M-8 | Sandbox/prod key mismatch | Sandbox key in production silently accepts test payments | High | Not mitigated |
| M-9 | Cancel/delete guard | Cancel + delete mutations lack status filters at DB level | Medium | ✅ Fixed B2 — `.eq('status','pending')` on cancel; `.neq('status','paid')` on delete; both check row count |

---

## 8. Hardening Roadmap (B0–B6)

### Phase B0 — Audit Complete ✅
- [x] Map all billing tables and key columns
- [x] Audit all frontend billing pages
- [x] Audit `useAdminData.js` billing hooks
- [x] Audit `subscriptionUtils.js` and `quotaUtils.js`
- [x] Identify plan enforcement paths
- [x] Register all risks (B-1 through B-10)

---

### Phase B1 — DB Verification (Non-destructive reads only)

**Goal:** Verify what's actually in the DB to confirm or dismiss Risk B-4.

**Tasks:**
- [ ] Run: `SELECT id, plan, plan_expires_at, trial_ends_at FROM tenants WHERE plan != 'starter' AND plan_expires_at < NOW();`
- [ ] Check if any DB trigger resets `tenants.plan = 'starter'` on expiry
- [ ] Check if `subscription_invoices.billing_period` column is used or dead
- [ ] Verify RLS policies on `subscription_invoices` (who can read/write)
- [ ] Verify RLS policies on `payment_settings` (Xendit key exposure)
- [ ] Check if `discount_codes.used_count` is incremented atomically or by application

**Deliverable:** `docs/db/BILLING_DB_VERIFICATION.md` with findings.

---

### Phase B2 — Invoice Guard Hardening ✅ COMPLETE (2026-05-20)

**Goal:** Prevent duplicate invoices; add DB-side status guards on cancel/delete.

**Files modified:**
- `src/lib/hooks/useAdminData.js` — `useConfirmInvoice`, `useDeleteInvoice`, new `useHasPendingInvoice`
- `src/dashboard/admin/AdminSubscriptions.jsx` — `executeCancelInvoice`
- `src/dashboard/_shared/pages/UpgradePlan.jsx` — `handleSubmit`

**Tasks:**
- [x] **M-5 fix:** `useHasPendingInvoice(tenantId)` query hook added to `useAdminData.js`. `UpgradePlan.handleSubmit` guards with `hasPendingInvoice === true` check + toast.warning before creating invoice.
- [x] **M-9 fix:** `.eq('status', 'pending')` + `.select('id')` added to `executeCancelInvoice`; `toast.warning` fires and dialog closes if 0 rows returned (idempotent).
- [x] **M-9 fix:** `.neq('status', 'paid')` + `.select('id')` added to `useDeleteInvoice`; throws `Error('Invoice dengan status paid tidak dapat dihapus.')` if 0 rows deleted.
- [x] **M-6 mitigation:** `.select('id')` added to `useConfirmInvoice` step c; throws `Error('Invoice sudah diproses sebelumnya')` if 0 rows updated — aborts before tenant plan update.
- [ ] Add confirmation dialog before trial activation in `UpgradePlan` — deferred to B6

**Acceptance:** ✅ No duplicate pending invoices. ✅ Paid invoices cannot be deleted. ✅ Cancel is idempotent. ✅ Double-confirm aborts before tenant update.

---

### Phase B3 — Provider-Neutral Invoice Schema Migration

**Goal:** Add Midtrans-compatible columns to `subscription_invoices`, enforce DB-level plan expiry, retire Xendit artefacts.

**Full plan:** `docs/BILLING_B3_MIGRATION_PLAN.md`

**Sub-phases:**

**B3A — Add neutral columns (no drops, no code)** ✅ APPLIED 2026-05-20
- [x] Xendit data check: 0 non-null rows of 4 → B3C skipped
- [x] Duplicate pending check: 0 duplicate tenants → unique pending index safe
- [x] `kandang_limit.starter = 1` confirmed from `plan_configs`
- [x] `payment_method` values: `manual` × 4 only → CHECK constraint safe
- [x] Migration applied: `supabase/migrations/20260520_invoice_provider_neutral.sql`
- [x] Verified live in DB:
  - 10 provider-neutral columns added to `subscription_invoices`
  - 4 indexes confirmed: `idx_sub_invoices_one_pending_per_tenant`, `idx_sub_invoices_provider_order_id`, `idx_sub_invoices_provider_status`, `idx_sub_invoices_tenant_status`
  - `xendit_invoice_id` / `xendit_payment_url` untouched (drop deferred to B3D)
  - `xendit_config` table untouched (rename deferred to B3D)

**B3B — Code updates (after B3A deployed)** ✅ APPLIED 2026-05-20
- [x] `useAdminData.js`: replaced `xendit_invoice_id, xendit_payment_url` with `payment_provider, provider_order_id, provider_payment_url, provider_status` in `useAllInvoices`
- [x] `useAdminData.js`: deleted `useXenditConfig` and `useSaveXenditConfig` hooks
- [x] `AdminSubscriptions.jsx`: removed xendit hook imports; renamed "Xendit" tab → "Payment" (CreditCard icon); replaced `XenditConfigTab` (~250 lines) with `PaymentGatewayTab` placeholder; changed `isXendit` → `isMidtrans` using `payment_provider === 'midtrans'`
- [x] `useCreateInvoice`: added `payment_provider: 'manual'` field on insert (explicit default)
- ESLint: 0 errors, 0 warnings on both files
- Build: ✅ passes

**B3C — Xendit data migration** ✅ SKIPPED — xendit columns confirmed empty (0 non-null rows)

**B3D — Drop stale xendit columns (after B4/B5 live)**
- [ ] `supabase/migrations/20260xxx_drop_xendit_columns.sql`:
  - `ALTER TABLE public.xendit_config RENAME TO _deprecated_xendit_config;` (deferred from B3A)
  - Drop `xendit_invoice_id`, `xendit_payment_url` from `subscription_invoices`
  - `DROP TABLE public._deprecated_xendit_config;`
  - `DELETE FROM public.payment_settings WHERE bank_name = 'xendit_config';`
- [ ] Simplify `UpgradePlan.jsx` and `AddonPortal.jsx` bank filter (remove `bank_name !== 'xendit_config'` condition)

**B3E — Plan expiry DB enforcement** ✅ APPLIED 2026-05-21
- [x] Exposure check: 0 affected rows — no stale paid tenants at apply time
- [x] One-time backfill: `expire_paid_plans()` run manually — 0 rows updated
- [x] `public.expire_paid_plans()` function deployed — batch downgrade; grants: postgres + service_role only
- [x] `trg_enforce_plan_expiry_on_write` trigger deployed — BEFORE INSERT + UPDATE on `public.tenants`; grants: postgres + service_role only
- [x] pg_cron job active — `expire-paid-plans-daily`, `0 1 * * *`, jobid: 5

**Acceptance:** ✅ Met — Manual invoices unaffected. Provider columns live. Xendit UI/hooks retired (B3B). `tenants.plan` auto-downgrades on expiry within 24 hours (cron) or immediately on any tenant row INSERT/UPDATE (trigger). Xendit DB columns deferred to B3D.

---

### Phase B4 — Midtrans Create Transaction Edge Function

**Goal:** Implement the `midtrans-create-transaction` Edge Function so the frontend can initiate a Snap payment.

> **Prerequisite:** Midtrans sandbox account. Vault secrets set: `MIDTRANS_SERVER_KEY`, `MIDTRANS_IS_PRODUCTION=false`. Vite env: `VITE_MIDTRANS_CLIENT_KEY`.

**Tasks:**
- [ ] Create `supabase/functions/midtrans-create-transaction/index.ts`
- [ ] Read `MIDTRANS_SERVER_KEY` from `Deno.env.get()` — never from DB
- [ ] Read `MIDTRANS_IS_PRODUCTION` to select correct base URL
- [ ] Accept: `{ invoice_id, tenant_id }` — look up amount + plan from `subscription_invoices`
- [ ] POST to Midtrans Snap API with `order_id = invoice_id` (or prefixed UUID)
- [ ] On success: update invoice `provider_order_id`, `provider_payment_url`, `provider_status = 'pending'`, `payment_provider = 'midtrans'`
- [ ] Return `{ redirect_url }` to frontend — frontend redirects user
- [ ] Frontend must NOT receive or use Server Key at any point

**Acceptance:** Calling the function creates a Midtrans Snap transaction and returns a redirect URL. Server Key never leaves the Edge Function runtime.

---

### Phase B5 — Midtrans Webhook + Atomic Confirm RPC

**Goal:** Implement the `midtrans-webhook` Edge Function and the atomic DB RPC it calls.

**Tasks:**
- [ ] Create `supabase/functions/midtrans-webhook/index.ts`
- [ ] **M-3 fix:** Verify `signature_key` using SHA512(`order_id + status_code + gross_amount + server_key`). Reject if mismatch (return 400)
- [ ] Map `transaction_status` / `fraud_status` per the table in Section 5.3
- [ ] **M-4 fix:** Check if invoice is already `paid` before running confirm RPC — if so, return 200 immediately (idempotent no-op)
- [ ] On PAID status: call RPC `confirm_invoice_and_update_plan(p_provider_order_id)`
  - RPC must atomically: UPDATE invoice status=paid, UPDATE tenant plan/plan_expires_at/kandang_limit
  - RPC must be idempotent (check invoice status before updating)
- [ ] On FAILED/CANCELLED/EXPIRED: update `subscription_invoices.status` and `provider_status` only — do NOT touch `tenants`
- [ ] Store full webhook payload in `provider_payload` jsonb column for audit
- [ ] Always return HTTP 200 after safe processing
- [ ] Optional: call Midtrans Get Status API to double-verify before confirming
- [ ] Write migration for the RPC: `supabase/migrations/YYYYMMDD_confirm_invoice_rpc.sql`
- [ ] **M-1 mitigation:** `MIDTRANS_SERVER_KEY` stored only in Vault (`supabase secrets set`)
- [ ] **M-8 mitigation:** `MIDTRANS_IS_PRODUCTION` Vault secret gates API base URL

**Acceptance:** Paying via Midtrans Snap auto-confirms invoice. Duplicate webhooks are idempotent. Failed/expired payments do not activate plan.

---

### Phase B6 — Frontend Plan Enforcement Guards

**Goal:** Eliminate dual-path drift (B-1, M-7 overlap with B-6) and add expiry-wall UI.

**Tasks:**
- [ ] **B-1 fix:** Add dev-only `usePlanConfigsHealth()` hook that warns if expected keys are missing from `plan_configs`
- [ ] **B-6 fix:** Create `src/lib/constants/planGatingValidator.js` — cross-references planGating.js constants against plan_configs keys at startup (dev-only warning)
- [ ] Fix `VERTICAL_TO_PRICING_ROLE` in `UpgradePlan.jsx` — add missing verticals: `peternak_layer`, `peternak_kambing_domba_penggemukan`, `peternak_kambing_domba_breeding`, `rpa_ayam`
- [ ] Add expiry wall component: when `status === 'expired'` and `plan !== 'starter'`, show a blocking overlay with renewal CTA
- [ ] Audit `PlanExpiryBanner` dismissal after renewal — ensure cache invalidation clears the banner

**Acceptance:** No wrong pricing shown for any vertical. Expired Pro users see expiry wall, not silent feature degradation.

---

### Phase B7 — Admin Recovery Tooling & Chaos Testing

**Goal:** Give admins tools to recover from partial failures; validate correctness end-to-end.

**Admin tools:**
- [ ] Add "Re-sync Plan" button in AdminSubscriptions — force re-apply plan from latest paid invoice
- [ ] Add "Audit Trail" section in invoice detail sheet — show `global_audit_logs` for the tenant
- [ ] Add billing health check RPC: returns last paid invoice date, current plan, plan_expires_at, whether they match

**Chaos / regression tests:**
- [ ] Create invoice → admin confirms → verify `tenants.plan` updated
- [ ] Confirm invoice twice → verify idempotent (no double extension of `plan_expires_at`)
- [ ] Create invoice → cancel → verify `status=cancelled`, `tenants.plan` unchanged
- [ ] Expired Pro tenant → verify feature gates return Starter limits
- [ ] Add-on slot purchase → verify `profiles.additional_slots` incremented correctly
- [ ] (Phase B5) Simulate Midtrans `settlement` webhook → verify invoice confirmed and plan updated atomically
- [ ] (Phase B5) Simulate duplicate `settlement` webhook → verify idempotent (no double extension)
- [ ] (Phase B5) Simulate `capture+challenge` webhook → verify plan NOT activated, flagged for review
- [ ] (Phase B5) Simulate `expire` webhook → verify invoice expired, tenants.plan unchanged
- [ ] (Phase B5) Simulate webhook with invalid signature → verify rejected (400)

---

## 9. Constraints (Must Not Violate)

- **No destructive SQL** until Phase B1 read-queries confirm DB state
- **No schema changes** without a migration file in `supabase/migrations/`
- **No RLS changes** without documenting before/after in `docs/db/`
- **No logger utility changes** — `logError`, `logSupabaseError` signatures are frozen
- **No actionName renames** — existing values are indexed
- **No changes to `subscriptionUtils.getSubscriptionStatus()` return shape** until all callers audited (Phase B3 only)
- **No Midtrans Server Key** in `payment_settings`, source code, or any DB table — Supabase Vault only
- **No Midtrans Client Key** hardcoded — Vite env var only

---

## 10. Files Index

| File | Role | Phase |
|------|------|-------|
| `src/lib/subscriptionUtils.js` | Subscription status calculator | B3 |
| `src/lib/quotaUtils.js` | Feature limit enforcer | B5 |
| `src/lib/constants/planGating.js` | Feature matrix constants | B5, B6 |
| `src/lib/hooks/useAdminData.js` | All admin billing mutations | B2, B3 |
| `src/lib/hooks/useTransactionQuota.js` | Transaction quota hook | B5 |
| `src/dashboard/_shared/pages/UpgradePlan.jsx` | User-facing upgrade page | B2, B5 |
| `src/dashboard/_shared/pages/AkunPreview.jsx` | Billing entry point (nav only) | — |
| `src/dashboard/admin/AdminSubscriptions.jsx` | Admin invoice management | B2, B5, B7 |
| `src/dashboard/admin/AdminPricing.jsx` | Pricing & plan config editor | B1, B6 |
| `supabase/functions/midtrans-create-transaction/` | Midtrans Snap transaction creator | B4 (new) |
| `supabase/functions/midtrans-webhook/` | Midtrans webhook handler + signature verify | B5 (new) |
| `supabase/migrations/YYYYMMDD_invoice_provider_neutral.sql` | Provider-neutral columns + Xendit column cleanup | B3 (new) |
| `supabase/migrations/YYYYMMDD_confirm_invoice_rpc.sql` | Atomic confirm_invoice_and_update_plan RPC | B5 (new) |
| `docs/db/BILLING_DB_VERIFICATION.md` | Phase B1 findings | B1 (new) |

---

## 11. Glossary

| Term | Definition |
|------|-----------|
| `plan` | Tenant's current plan: `starter`, `pro`, `business` |
| `plan_expires_at` | UTC timestamp when paid plan expires |
| `trial_ends_at` | UTC timestamp when trial ends |
| `kandang_limit` | Max livestock enclosures for peternak tenant |
| `additional_slots` | Add-on business slots on `profiles` |
| `plan_configs` | Admin-controlled JSONB limits, keyed by `config_key` |
| `pricing_plans` | Per-role, per-plan monthly pricing rows |
| `discount_codes` | Promo codes with percentage discount and usage limits |
| `subscription_invoices` | Invoice ledger for all billing events |
| `payment_settings` | Manual bank transfer accounts only. No gateway credentials. |
| `confirmed_by` | Profile UUID of admin who confirmed a manual payment |
| `provider_order_id` | Provider-neutral field for Midtrans order_id |
| `provider_transaction_id` | Provider-neutral field for Midtrans transaction_id |
| `provider_payment_url` | Provider-neutral field for Midtrans Snap redirect URL |
| `payment_provider` | Payment method source: `manual` \| `midtrans` |
| `addon_business_slot` | Add-on plan that increments `profiles.additional_slots` |
| `MIDTRANS_SERVER_KEY` | Supabase Vault Secret — used only in Edge Functions, never in DB or source |
| `MIDTRANS_IS_PRODUCTION` | Vault Secret boolean — gates API base URL (sandbox vs production) |
| `VITE_MIDTRANS_CLIENT_KEY` | Non-secret Vite env var — used by Snap.js on the frontend |
