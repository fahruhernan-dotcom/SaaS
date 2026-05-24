# Billing Phase B3 — Provider-Neutral Schema + DB Plan Expiry

> **Status:** B3A ✅ B3B ✅ B3C ✅ (skipped) B3E ✅ — B3D PENDING (after Midtrans live)  
> **Last updated:** 2026-05-21  
> **B3A applied:** `supabase/migrations/20260520_invoice_provider_neutral.sql` — 10 columns + 4 indexes live  
> **B3B applied:** Xendit UI/hooks retired, provider-neutral fields wired, `payment_provider: 'manual'` on insert  
> **B3E applied:** `expire_paid_plans()` function + `trg_enforce_plan_expiry_on_write` trigger + pg_cron daily job  
> **Next:** B4 (Midtrans create-transaction Edge Function)

---

## 1. Current State — Confirmed from B1 Audit

### 1.1 `subscription_invoices` — Live Columns

| Column | Type | Default | Notes |
|--------|------|---------|-------|
| `id` | uuid PK | — | ✅ |
| `tenant_id` | uuid FK → tenants | — | ✅ |
| `invoice_number` | text UNIQUE nullable | — | ✅ |
| `amount` | int4 | — | ✅ |
| `plan` | text CHECK | — | ✅ |
| `billing_period` | text nullable | — | Possibly unused — verify |
| `billing_months` | int4 | 1 | ✅ |
| `status` | text CHECK | — | pending/paid/expired/cancelled |
| `transfer_proof_url` | text nullable | — | Manual flow |
| `bank_name` | text nullable | — | Manual flow |
| `transfer_date` | date nullable | — | Manual flow |
| `payment_proof_url` | text nullable | — | ⚠️ Likely duplicate of `transfer_proof_url` |
| `payment_method` | text | `'transfer'` | ✅ CHECK added B3A: transfer/manual/midtrans_snap/midtrans_va |
| `xendit_invoice_id` | text nullable | — | ⚠️ Legacy — drop in B3D after B3B code cleanup |
| `xendit_payment_url` | text nullable | — | ⚠️ Legacy — drop in B3D after B3B code cleanup |
| `payment_provider` | text | `'manual'` | ✅ Added B3A — NOT NULL |
| `provider_order_id` | text nullable | — | ✅ Added B3A |
| `provider_transaction_id` | text nullable | — | ✅ Added B3A |
| `provider_payment_url` | text nullable | — | ✅ Added B3A |
| `provider_status` | text nullable | — | ✅ Added B3A |
| `provider_payload` | jsonb nullable | — | ✅ Added B3A |
| `provider_signature_verified` | boolean | `false` | ✅ Added B3A — NOT NULL |
| `provider_paid_at` | timestamptz nullable | — | ✅ Added B3A |
| `provider_expired_at` | timestamptz nullable | — | ✅ Added B3A |
| `provider_cancelled_at` | timestamptz nullable | — | ✅ Added B3A |
| `confirmed_by` | uuid FK → profiles nullable | — | ✅ Admin-confirmed |
| `confirmed_at` | timestamptz nullable | — | ✅ |
| `notes` | text nullable | — | ✅ |
| `paid_at` | timestamptz nullable | — | ✅ |
| `created_at` / `updated_at` | timestamptz | now() | ✅ |

### 1.2 `xendit_config` Table

- **Live**, RLS enabled
- **0 rows** — safe to deprecate
- Columns: `id`, `is_active`, `secret_key_encrypted`, `webhook_token`, `success_redirect_url`, `failure_redirect_url`, `created_at`, `updated_at`
- Stores API keys in DB — pattern banned under hardening plan

### 1.3 Xendit References in Source Code

**Files that must change in B3B:**

| File | Line(s) | What it does |
|------|---------|-------------|
| `src/lib/hooks/useAdminData.js` | 67 | `xendit_invoice_id, xendit_payment_url` in `useAllInvoices()` select |
| `src/lib/hooks/useAdminData.js` | 315–368 | `useXenditConfig` + `useSaveXenditConfig` hooks (misuse `payment_settings` as config store) |
| `src/dashboard/admin/AdminSubscriptions.jsx` | 26–27 | Imports both xendit hooks |
| `src/dashboard/admin/AdminSubscriptions.jsx` | 316 | "Xendit" tab label in TabsList |
| `src/dashboard/admin/AdminSubscriptions.jsx` | 617–618 | `<TabsContent value="xendit">` → `<XenditConfigTab />` |
| `src/dashboard/admin/AdminSubscriptions.jsx` | 774 | `const isXendit = ... \|\| !!selectedInvoice.xendit_invoice_id` |
| `src/dashboard/admin/AdminSubscriptions.jsx` | 1497–~1700 | Entire `XenditConfigTab` function component |
| `src/dashboard/_shared/pages/UpgradePlan.jsx` | 357 | `banks?.filter(b => b.bank_name !== 'xendit_config')` — safe to keep as-is until B3D |
| `src/dashboard/_shared/pages/AddonPortal.jsx` | 48 | Same filter — safe to keep until B3D |

### 1.4 `payment_settings` — Key Observation

`useSaveXenditConfig` stores Xendit API key inside `payment_settings` under `bank_name = 'xendit_config'`. This is a **misuse pattern** (API credentials crammed into a bank account row). The `UpgradePlan.jsx` and `AddonPortal.jsx` already filter this row out (`bank_name !== 'xendit_config'`) to avoid showing it as a payment option. This pattern must be retired in B3B; Midtrans keys go to Vault, not DB.

---

## 2. Provider-Neutral Column Proposal

### 2.1 Columns to Add (Phase B3A)

All columns are nullable with safe defaults. Existing manual invoices are unaffected (they simply have NULL provider columns, or `payment_provider = 'manual'`).

```sql
-- Phase B3A: Add provider-neutral columns to subscription_invoices
-- (planning only — do NOT apply yet)

ALTER TABLE public.subscription_invoices
  ADD COLUMN IF NOT EXISTS payment_provider         text DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS provider_order_id        text,
  ADD COLUMN IF NOT EXISTS provider_transaction_id  text,
  ADD COLUMN IF NOT EXISTS provider_payment_url     text,
  ADD COLUMN IF NOT EXISTS provider_status          text,
  ADD COLUMN IF NOT EXISTS provider_payload         jsonb,
  ADD COLUMN IF NOT EXISTS provider_signature_verified boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS provider_paid_at         timestamptz,
  ADD COLUMN IF NOT EXISTS provider_expired_at      timestamptz,
  ADD COLUMN IF NOT EXISTS provider_cancelled_at    timestamptz;

-- Add CHECK constraint on payment_method (fixes F-03)
ALTER TABLE public.subscription_invoices
  ADD CONSTRAINT subscription_invoices_payment_method_check
  CHECK (payment_method IN ('transfer', 'midtrans_snap', 'midtrans_va', 'manual'));
```

**Column semantics:**

| Column | When set | Who sets it |
|--------|----------|-------------|
| `payment_provider` | On invoice create | `useCreateInvoice` (manual) or `midtrans-create-transaction` Edge Fn |
| `provider_order_id` | When Midtrans transaction created | `midtrans-create-transaction` Edge Fn |
| `provider_transaction_id` | On webhook settlement | `midtrans-webhook` Edge Fn |
| `provider_payment_url` | When Snap transaction created | `midtrans-create-transaction` Edge Fn (Snap redirect URL) |
| `provider_status` | Updated on each webhook event | `midtrans-webhook` Edge Fn |
| `provider_payload` | Full webhook body stored for audit | `midtrans-webhook` Edge Fn |
| `provider_signature_verified` | Set `true` after SHA512 check passes | `midtrans-webhook` Edge Fn |
| `provider_paid_at` | Midtrans settlement timestamp | `midtrans-webhook` Edge Fn |
| `provider_expired_at` | Midtrans expiry time (from `expire` webhook) | `midtrans-webhook` Edge Fn |
| `provider_cancelled_at` | Midtrans cancel time (from `cancel` webhook) | `midtrans-webhook` Edge Fn |

### 2.2 Indexes and Constraints (Phase B3A)

```sql
-- Unique partial index: one provider_order_id per non-null value (idempotency key)
CREATE UNIQUE INDEX CONCURRENTLY idx_subscription_invoices_provider_order_id
  ON public.subscription_invoices (provider_order_id)
  WHERE provider_order_id IS NOT NULL;

-- Index: query by tenant + status (used heavily by useAllInvoices, useHasPendingInvoice)
CREATE INDEX CONCURRENTLY idx_subscription_invoices_tenant_status
  ON public.subscription_invoices (tenant_id, status);

-- Index: webhook processing — look up by provider + provider_status
CREATE INDEX CONCURRENTLY idx_subscription_invoices_provider_status
  ON public.subscription_invoices (payment_provider, provider_status)
  WHERE payment_provider IS NOT NULL;

-- Pending-per-tenant unique index (from B1 F-13 — include here if not already added)
CREATE UNIQUE INDEX CONCURRENTLY idx_subscription_invoices_one_pending_per_tenant
  ON public.subscription_invoices (tenant_id)
  WHERE status = 'pending';
```

### 2.3 Xendit Data Migration (Phase B3C)

**Run this read-only check first to determine if xendit columns have data:**

```sql
-- Check how many rows have non-null xendit values
SELECT
  COUNT(*) FILTER (WHERE xendit_invoice_id IS NOT NULL)  AS rows_with_xendit_invoice_id,
  COUNT(*) FILTER (WHERE xendit_payment_url IS NOT NULL) AS rows_with_xendit_payment_url,
  COUNT(*) AS total_rows
FROM public.subscription_invoices;
```

**Two outcomes:**

**A) All NULL (expected — 4 rows, likely all manual):**
```sql
-- No data migration needed. Xendit columns are empty.
-- Skip Phase B3C. Move directly to B3D (drop xendit columns).
-- Columns: xendit_invoice_id, xendit_payment_url can be dropped safely.
```

**B) Some non-NULL (historical Xendit invoices exist):**
```sql
-- Migrate historical xendit data to provider-neutral columns
UPDATE public.subscription_invoices
SET
  payment_provider   = 'xendit',    -- preserves provider history
  provider_order_id  = xendit_invoice_id,
  provider_payment_url = xendit_payment_url
WHERE xendit_invoice_id IS NOT NULL
   OR xendit_payment_url IS NOT NULL;

-- Verify: all xendit rows now have provider_order_id set
SELECT id, xendit_invoice_id, provider_order_id, payment_provider
FROM public.subscription_invoices
WHERE xendit_invoice_id IS NOT NULL;
-- After this passes, xendit columns are safe to drop in B3D.
```

### 2.4 Columns to Drop (Phase B3D — after B4/B5 complete and verified)

Only drop after: (a) Midtrans Edge Functions are live, (b) `useAllInvoices` no longer selects `xendit_*` columns, (c) `XenditConfigTab` removed from AdminSubscriptions.

```sql
-- Phase B3D: Remove stale Xendit columns (only after B3B code changes shipped)
ALTER TABLE public.subscription_invoices
  DROP COLUMN IF EXISTS xendit_invoice_id,
  DROP COLUMN IF EXISTS xendit_payment_url;

-- Deprecate xendit_config table
ALTER TABLE public.xendit_config RENAME TO _deprecated_xendit_config;
-- Drop entirely only after confirming no code reads it (code audit complete in B3B)
-- DROP TABLE public._deprecated_xendit_config;
```

**Also clean up `payment_settings` xendit row (if exists):**
```sql
-- Remove the xendit_config "fake bank" row from payment_settings
DELETE FROM public.payment_settings WHERE bank_name = 'xendit_config';
-- After this, UpgradePlan.jsx and AddonPortal.jsx bank_name filter can be simplified
```

---

## 3. DB Plan Expiry Enforcement

### 3.1 Root Cause (Confirmed)

`tenants.plan` is never reset when `plan_expires_at` passes. No trigger, cron, or Edge Function performs this downgrade. The frontend layer is now fixed (`getEffectivePlan()` across 13 files), but `tenant.plan` remains stale in DB — any future code that reads the DB column directly (new features, Edge Functions, server-side checks) will see the wrong value.

### 3.2 Option A — Scheduled Edge Function (Recommended Primary)

A Supabase scheduled Edge Function runs daily (or hourly) and downgrades all expired paid tenants.

**Edge Function: `supabase/functions/expire-plans/index.ts`**

```typescript
// planning only — do NOT create yet
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

Deno.serve(async () => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  // Downgrade all expired paid tenants to starter
  const { data, error } = await supabase
    .from('tenants')
    .update({
      plan: 'starter',
      kandang_limit: 1,       // starter default — confirm value from plan_configs
      updated_at: new Date().toISOString()
    })
    .in('plan', ['pro', 'business'])
    .not('plan_expires_at', 'is', null)
    .lt('plan_expires_at', new Date().toISOString())
    .select('id, business_name, plan')   // returns list of affected tenants for logging

  if (error) {
    console.error('expire-plans error:', error)
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }

  console.log(`expire-plans: downgraded ${data?.length ?? 0} tenants`, data)
  return new Response(JSON.stringify({ downgraded: data?.length ?? 0 }), { status: 200 })
})
```

**Schedule (Supabase Cron):**
```sql
-- Run daily at 01:00 UTC — runs even if no row updates happen (unlike trigger)
SELECT cron.schedule(
  'expire-plans-daily',
  '0 1 * * *',
  $$
    SELECT net.http_post(
      url := current_setting('app.supabase_url') || '/functions/v1/expire-plans',
      headers := jsonb_build_object(
        'Authorization', 'Bearer ' || current_setting('app.service_role_key'),
        'Content-Type', 'application/json'
      ),
      body := '{}'
    );
  $$
);
```

**Pros:**
- Runs on a schedule regardless of row updates — catches ALL expired tenants automatically
- Can log/audit which tenants were downgraded
- Can be triggered manually for testing
- Can be extended to send expiry notification emails before downgrade

**Cons:**
- Up to 1 hour of lag (tenant expires at midnight, cron runs at 01:00)
- Requires Supabase Vault for `SUPABASE_SERVICE_ROLE_KEY` (already needed for Midtrans)
- If cron fails silently, expiry is not enforced until next run

### 3.3 Option B — BEFORE UPDATE Trigger (Belt-and-Suspenders)

A trigger fires on every `UPDATE` to `tenants`. If `plan_expires_at` has passed, it silently downgrades `plan` back to `starter` before the row is written.

```sql
-- planning only — do NOT apply yet
CREATE OR REPLACE FUNCTION public.enforce_plan_expiry_on_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NEW.plan IN ('pro', 'business')
     AND NEW.plan_expires_at IS NOT NULL
     AND NEW.plan_expires_at < NOW()
  THEN
    NEW.plan          := 'starter';
    NEW.kandang_limit := 1;          -- starter default
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_enforce_plan_expiry
  BEFORE UPDATE ON public.tenants
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_plan_expiry_on_update();
```

**Pros:**
- Zero lag when triggered — if admin updates tenant, expiry is enforced immediately
- Belt-and-suspenders safety for any code path that writes to `tenants`

**Cons:**
- Only fires on `UPDATE` — a tenant that expired with no subsequent updates will never be downgraded by this trigger alone
- Does NOT fix rows that are already stale with no upcoming update

### 3.4 Recommended: A + B Together

Run both. The scheduled job handles the time-based batch downgrade. The trigger handles the edge case where admin manually edits a long-expired tenant row.

**Order of operations:**
1. Deploy the scheduled Edge Function first (Option A)
2. Let it run once and confirm which tenants (if any) were downgraded
3. Deploy the trigger (Option B) as permanent protection
4. Verify `tenants.plan` stays clean after both are live

---

## 4. Backfill Queries

### 4.1 Read-Only Exposure Check (Run First, Always)

```sql
-- Who is affected today? Run in Supabase SQL Editor BEFORE applying any changes.
SELECT
  id,
  business_name,
  business_vertical,
  plan,
  plan_expires_at,
  trial_ends_at,
  EXTRACT(DAY FROM NOW() - plan_expires_at) AS days_past_expiry
FROM public.tenants
WHERE plan <> 'starter'
  AND plan_expires_at IS NOT NULL
  AND plan_expires_at < now()
ORDER BY plan_expires_at ASC;
```

**Expected outcomes:**

| Result | Action |
|--------|--------|
| 0 rows | No tenants currently affected. Risk is theoretical. Apply trigger + cron as scheduled. |
| 1–5 rows | Confirm whether these are test accounts or real paid users. May warrant manual admin review before automated backfill. |
| Many rows | Apply scheduled job immediately; review cases individually. |

### 4.2 Trigger Presence Verification

```sql
-- Verify no trigger currently handles plan expiry (confirm no pre-existing enforcement)
SELECT trigger_name, event_manipulation, action_timing, action_statement
FROM information_schema.triggers
WHERE event_object_table = 'tenants'
ORDER BY trigger_name;
```

Expected: no row with `trg_enforce_plan_expiry` (confirms it doesn't exist yet before we create it).

### 4.3 Safe One-Time Backfill (After Reading Exposure Check)

Only run this **after** reviewing exposure check results and confirming which tenants to downgrade:

```sql
-- One-time backfill: downgrade expired paid tenants to starter
-- Run ONLY after reviewing exposure check. Do NOT run blindly.
-- Wrap in BEGIN/ROLLBACK for a dry run first:

BEGIN;
  UPDATE public.tenants
  SET
    plan          = 'starter',
    kandang_limit = 1,
    updated_at    = now()
  WHERE plan IN ('pro', 'business')
    AND plan_expires_at IS NOT NULL
    AND plan_expires_at < now()
  RETURNING id, business_name, plan;
-- DRY RUN: Review the RETURNING output, then ROLLBACK or COMMIT
ROLLBACK; -- change to COMMIT when confirmed
```

> **Warning:** `kandang_limit = 1` is the starter default. Verify this is correct for ALL verticals before committing. If certain verticals use a different default, adjust the SET clause.

### 4.4 Verify Clean State After Backfill

```sql
-- After backfill and trigger/cron are live, verify zero stale rows remain:
SELECT COUNT(*) AS stale_rows
FROM public.tenants
WHERE plan <> 'starter'
  AND plan_expires_at IS NOT NULL
  AND plan_expires_at < now();
-- Expected: 0
```

---

## 5. Migration Phase Sequence

### Phase B3A — Add Neutral Columns (No Drops, No Code)

1. Run read-only xendit data check (Section 2.3) to determine if migration needed
2. Add provider-neutral columns via migration file
3. Add indexes and CHECK constraint on `payment_method`
4. Add pending-per-tenant unique index (F-13 from B1 — if not already added)
5. Run exposure check (Section 4.1) before any expiry enforcement
6. Rename `xendit_config` table to `_deprecated_xendit_config` (harmless, no code reads it by table name)

**Migration file:** `supabase/migrations/20260520_invoice_provider_neutral.sql`

### Phase B3B — Code Updates (After B3A Is Deployed)

Frontend and hook changes to use the new neutral columns:

| File | Change |
|------|--------|
| `src/lib/hooks/useAdminData.js:67` | Change `xendit_invoice_id, xendit_payment_url` to `provider_order_id, provider_payment_url, payment_provider` in `useAllInvoices` select |
| `src/lib/hooks/useAdminData.js:315–368` | Delete `useXenditConfig` and `useSaveXenditConfig` hooks entirely |
| `src/dashboard/admin/AdminSubscriptions.jsx:26–27` | Remove import of `useXenditConfig, useSaveXenditConfig` |
| `src/dashboard/admin/AdminSubscriptions.jsx:316` | Rename or repurpose "Xendit" tab → "Payment Gateway" or "Midtrans" (Phase B4/B5 wires this up) |
| `src/dashboard/admin/AdminSubscriptions.jsx:617–618` | Replace `<XenditConfigTab />` with a placeholder note: "Midtrans keys are stored in Supabase Vault — configure via `supabase secrets set`" |
| `src/dashboard/admin/AdminSubscriptions.jsx:774` | Replace `xendit_invoice_id` check: use `payment_provider === 'midtrans'` instead |
| `src/dashboard/admin/AdminSubscriptions.jsx:1497–~1700` | Delete entire `XenditConfigTab` function component |

> **UpgradePlan.jsx:357 and AddonPortal.jsx:48** — the `bank_name !== 'xendit_config'` filters are safe to leave in B3B. They only matter if the `xendit_config` row exists in `payment_settings`. Once that row is deleted (Section 2.4), these filters are no-ops. Remove them in B3D cleanup.

### Phase B3C — Xendit Data Migration (Conditional)

Only needed if the exposure check in B3A shows `xendit_invoice_id` rows with non-null data. If all null, skip.

### Phase B3D — Drop Stale Columns + Table (After B4/B5 Live and Verified)

1. Drop `xendit_invoice_id` and `xendit_payment_url` from `subscription_invoices`
2. Drop `_deprecated_xendit_config` table
3. Delete `xendit_config` row from `payment_settings` (if it exists)
4. Simplify `UpgradePlan.jsx` and `AddonPortal.jsx` bank filter (remove `bank_name !== 'xendit_config'` condition)

**Migration file:** `supabase/migrations/20260xxx_drop_xendit_columns.sql`

### Phase B3E — Plan Expiry DB Enforcement ✅ APPLIED 2026-05-21

1. ✅ Exposure check — 0 affected rows; no stale paid tenants
2. ✅ One-time backfill — manual run of `expire_paid_plans()` returned 0 rows (nothing to backfill)
3. ✅ `public.expire_paid_plans()` — batch UPDATE function; grants: postgres + service_role only
4. ✅ `trg_enforce_plan_expiry_on_write` — BEFORE INSERT + UPDATE trigger on `public.tenants`; grants: postgres + service_role only
5. ✅ pg_cron job `expire-paid-plans-daily` — `SELECT public.expire_paid_plans();` at `0 1 * * *`; jobid: 5
6. ✅ Clean-state check passed — 0 rows with stale paid plan

---

## 6. Files to Create in B3

| File | Purpose | Phase |
|------|---------|-------|
| `supabase/migrations/20260520_invoice_provider_neutral.sql` | Adds neutral columns, indexes, CHECK constraints | B3A ✅ |
| `src/lib/hooks/useAdminData.js` | Retired Xendit hooks, updated select + insert fields | B3B ✅ |
| `src/dashboard/admin/AdminSubscriptions.jsx` | Retired Xendit tab/component, updated invoice banner | B3B ✅ |
| `public.expire_paid_plans()` + `trg_enforce_plan_expiry_on_write` + pg_cron | DB plan expiry enforcement (applied directly in Supabase) | B3E ✅ |
| `supabase/migrations/20260xxx_drop_xendit_columns.sql` | Drops xendit columns + deprecated table | B3D ⏳ deferred |

---

## 7. Constraints

- No source code changes until B3A migration is deployed and verified in DB
- No DROP of xendit columns until code is confirmed to not select them (B3B complete)
- `xendit_config` table rename (not drop) in B3A — final drop only in B3D
- Scheduled Edge Function must use `SUPABASE_SERVICE_ROLE_KEY` from Vault only
- `kandang_limit = 1` in backfill assumes starter default — verify from `plan_configs` first
- No changes to `subscriptionUtils.getSubscriptionStatus()` return shape
- No RLS changes without documenting before/after in `docs/db/`
- No logger utility changes (`logError`, `logSupabaseError` signatures frozen)
- No actionName renames (existing values are indexed)

---

## 8. Questions to Resolve Before Execution

| Question | Why It Matters | How to Verify |
|----------|---------------|---------------|
| Do any rows in `subscription_invoices` have non-null `xendit_invoice_id`? | Determines if data migration (B3C) is needed or columns can be dropped directly | Run Section 2.3 check query |
| What is the correct starter `kandang_limit` value? | Backfill uses `kandang_limit = 1` — must match `plan_configs.kandang_limit.starter` | `SELECT config_value FROM plan_configs WHERE config_key = 'kandang_limit';` |
| Is `billing_period` column used by any code? | Column listed in schema but not in any hook select — may be dead | `SELECT COUNT(*) FROM subscription_invoices WHERE billing_period IS NOT NULL;` + code grep |
| Is `payment_proof_url` actually a duplicate of `transfer_proof_url`? | If both are in use, need to clarify which is canonical before B3D cleanup | Code grep for both column names; DB check for NULL ratios |
| Are there existing `pending` duplicate invoices per tenant? | If so, must resolve before adding unique partial index on `(tenant_id) WHERE status='pending'` | `SELECT tenant_id, COUNT(*) FROM subscription_invoices WHERE status='pending' GROUP BY tenant_id HAVING COUNT(*) > 1;` |
