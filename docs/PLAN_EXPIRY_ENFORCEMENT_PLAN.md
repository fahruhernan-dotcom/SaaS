# Plan Expiry Enforcement — Audit & Fix Plan

> **Status:** ✅ COMPLETE — Frontend layer + DB enforcement fully applied  
> **Date:** 2026-05-20 (frontend) / 2026-05-21 (DB)  
> **Risk:** B-4 — CLOSED  
> **Scope:** Frontend gates fixed across 13 files. DB function, INSERT+UPDATE trigger, and pg_cron daily job all applied and verified.

---

## 1. Root Cause

**RESOLVED 2026-05-21.** `public.expire_paid_plans()` runs daily via pg_cron (job `expire-paid-plans-daily`, `0 1 * * *`) and `trg_enforce_plan_expiry_on_write` fires on INSERT + UPDATE to `public.tenants`. Manual run on apply: 0 affected rows (no stale tenants). Both grants locked to postgres + service_role only.

**Historical root cause (for reference):** `tenants.plan` was never reset to `'starter'` when `plan_expires_at` passed. There was no DB trigger, scheduled cron, or Edge Function that downgraded the column. This meant two values disagreed after expiry:

| Field | Value after expiry |
|-------|--------------------|
| `tenants.plan` | `'pro'` or `'business'` (stale) |
| `getSubscriptionStatus(tenant).status` | `'expired'` (correct) |
| `getSubscriptionStatus(tenant).plan` | `'pro'` (reflects DB, also stale) |

Any code that reads `tenant.plan` or `sub.plan` directly — rather than checking `sub.status` — grants full paid-plan access to expired tenants.

---

## 2. `getSubscriptionStatus` Behaviour — Confirmed Correct

`subscriptionUtils.getSubscriptionStatus` correctly returns `status: 'expired'` when `plan_expires_at < now()`:

```
plan_expires_at < now() AND plan ≠ 'starter'
  → status: 'expired', plan: 'pro', daysLeft: 0
```

The function itself is correct. The problem is in how callers use its return value.

---

## 3. Audit: All `tenant.plan` / `sub.plan` Direct Usage

### 3.1 Tier 1 — CRITICAL: Feature gates that bypass expiry

These grant Pro/Business features to expired tenants.

#### **Bug: `isStarter` pattern — 9 files**

```js
// CURRENT (BROKEN for expired tenants):
const isStarter = sub.plan === 'starter' && sub.status !== 'trial'
```

**Why this breaks:** when `plan='pro'` and `status='expired'`:
- `sub.plan === 'starter'` → `false`
- `sub.status !== 'trial'` → `true`
- `isStarter` → `false` ← expired tenant treated as Pro ✗

**Files affected:**

| File | Feature locked behind `isStarter` |
|------|-----------------------------------|
| `src/lib/hooks/useTransactionQuota.js:19` | Transaction quota (poultry broker) |
| `src/lib/hooks/useRPATransactionQuota.js:18` | Transaction quota (RPA) |
| `src/lib/hooks/useSembakoTransactionQuota.js:18` | Transaction quota (sembako) |
| `src/dashboard/broker/poultry_broker/Armada.jsx:198` | Vehicle/driver limit (max 1 on starter) |
| `src/dashboard/broker/poultry_broker/Simulator.jsx:41` | Simulator feature gate |
| `src/dashboard/broker/sembako_broker/Pegawai.jsx:43` | Employee page gate |
| `src/dashboard/broker/sembako_broker/Laporan.jsx:39` | Report page gate |
| `src/dashboard/_shared/components/wizard/WizardStepPengiriman.jsx:118` | Delivery wizard vehicle/driver gate |
| `src/components/invoice/InvoicePreviewModal.jsx:176` | PDF invoice save/download gate |
| `src/dashboard/rumah_potong/rpa/LaporanMargin.jsx:108` | Margin report gate |

**10 total instances of the broken pattern.**

#### **Bug: `quotaUtils.getFeatureLimit` uses raw `tenant.plan`**

```js
// src/lib/quotaUtils.js:18
const plan = tenant.plan || 'starter'
const baseLimit = config[plan] ?? DEFAULTS[configKey]?.[plan] ?? 1
```

**Impact:** `kandang_limit`, `team_limit`, `business_limit` all return Pro/Business values for expired tenants. This feeds `checkQuotaUsage()`, which gates: how many kandangs a peternak can create, how many businesses a user can join, how many team members a broker can invite.

#### **Bug: `useAIQuota` uses `sub.plan` not `sub.status`**

```js
// src/lib/hooks/useAIQuota.js:24
const plan = sub.plan || 'starter'
```

**Impact:** Expired Pro tenants get 500 AI chat sessions/month (Pro quota) instead of 10 (Starter). Expired Business tenants get unlimited AI sessions.

---

### 3.2 Tier 2 — LOW: Display-only / toast messages (not access gates)

| File | Usage | Risk |
|------|-------|------|
| `src/dashboard/peternak/broiler/Beranda.jsx:380,537` | Toast text only: `"Upgrade ke Pro"` vs `"Upgrade ke Business"` | Wrong message text, no feature leak |
| `src/dashboard/_shared/pages/AddonPortal.jsx:43` | `currentPlan` used for display only | No access gate affected |
| `src/dashboard/peternak/broiler/SetupFarm.jsx:191` | `plan={tenant?.plan}` prop — display only | No gate |
| `src/dashboard/admin/AdminSubscriptions.jsx:609` | Pre-fills form with `tenant.plan` | Admin panel, no tenant-side gate |
| `src/dashboard/admin/AdminUsers.jsx:1086` | Admin display | Admin panel only |

---

### 3.3 Tier 3 — CORRECT: Already uses `sub.status`

These are correct and should not be changed:

| File | Pattern | Why correct |
|------|---------|-------------|
| `src/dashboard/_shared/components/AppSidebar.jsx:459` | `sub.status === 'active' \|\| sub.status === 'trial'` | ✅ Status-based |
| `src/dashboard/_shared/pages/UpgradePlan.jsx:360` | `sub.status === 'active' && tenant?.plan === selectedPlan` | ✅ Status-based guard first |
| `src/lib/hooks/useAdminData.js:682–695` | `status.status === 'expired'` | ✅ Admin stats only |
| `src/dashboard/admin/AdminSubscriptions.jsx:327,1174,1186` | `s.status === 'active'`, etc. | ✅ Admin display |
| `src/lib/hooks/useNotifications.jsx:196` | Notification generator only | ✅ No gate |

---

## 4. Full Impact Map

```
Expired Pro tenant logs in:

  tenant.plan = 'pro'
  plan_expires_at = past
  getSubscriptionStatus → status: 'expired', plan: 'pro'

  ┌─ Feature gates using isStarter pattern (BROKEN):
  │   useTransactionQuota       → isStarter = false → unlimited transactions ✗
  │   useRPATransactionQuota    → isStarter = false → unlimited RPA invoices ✗
  │   useSembakoTransactionQuota→ isStarter = false → unlimited penjualan ✗
  │   Armada.jsx                → isStarter = false → unlimited vehicles ✗
  │   Simulator.jsx             → isStarter = false → full simulator access ✗
  │   Pegawai.jsx               → isStarter = false → full employee page ✗
  │   Laporan.jsx               → isStarter = false → full reports ✗
  │   WizardStepPengiriman.jsx  → isStarter = false → unlimited delivery wizard ✗
  │   InvoicePreviewModal.jsx   → isStarter = false → PDF save/download enabled ✗
  │   LaporanMargin.jsx         → isStarter = false → full margin report ✗
  │
  ├─ quotaUtils.getFeatureLimit → plan='pro' → pro kandang/team/business limits ✗
  │   └ feeds: kandang creation, team invite, business slot
  │
  └─ useAIQuota → plan='pro' → 500 AI sessions instead of 10 ✗

  AppSidebar → isAccountActive = false (CORRECT — sidebar gating works) ✓
```

---

## 5. Fix Strategy

### Option A — Frontend-only fix (minimal, no DB change)

**Change the `isStarter` formula across all 10 files:**

```js
// BEFORE (broken):
const isStarter = sub.plan === 'starter' && sub.status !== 'trial'

// AFTER (correct):
const isStarter = sub.status !== 'active' && sub.status !== 'trial'
```

This means: a tenant is "on starter" for gating purposes if they are NOT actively paying AND NOT on trial. An expired Pro tenant → `isStarter = true` → all gates enforce Starter limits.

**Change `quotaUtils.getFeatureLimit`:**

```js
// Import getSubscriptionStatus at top of quotaUtils.js
import { getSubscriptionStatus } from './subscriptionUtils'

// BEFORE:
const plan = tenant.plan || 'starter'

// AFTER:
const sub = getSubscriptionStatus(tenant)
const plan = (sub.status === 'active' || sub.status === 'trial') ? (sub.plan || 'starter') : 'starter'
```

**Change `useAIQuota`:**

```js
// BEFORE:
const plan = sub.plan || 'starter'

// AFTER:
const plan = (sub.status === 'active' || sub.status === 'trial') ? (sub.plan || 'starter') : 'starter'
```

**Files changed:** 12 (10 `isStarter` + `quotaUtils.js` + `useAIQuota.js`)  
**DB changes:** none  
**Risk:** low — purely restrictive (takes away access that should never have been granted)

---

### Option B — Add `getEffectivePlan()` utility (cleaner, same scope)

Add one function to `subscriptionUtils.js`:

```js
/**
 * Returns the plan that should actually be enforced for feature gating.
 * Returns 'starter' for expired tenants even if tenants.plan is still 'pro'/'business'.
 */
export function getEffectivePlan(tenant) {
  const sub = getSubscriptionStatus(tenant)
  if (sub.status === 'active' || sub.status === 'trial') return sub.plan || 'starter'
  return 'starter'
}
```

Then update all 12 call sites to use `getEffectivePlan(tenant)` where they currently use `tenant.plan` or `sub.plan` for gating.

**Advantage:** Single point of truth. When plan structure changes (add 'enterprise' tier), fix one function.  
**Disadvantage:** More files to touch than Option A (same count, but requires import changes too).

---

### Option C — DB-level enforcement (authoritative, prevents all drift)

Add a Postgres trigger that resets `tenants.plan = 'starter'` when `plan_expires_at` passes. This eliminates the root cause — `tenant.plan` will always reflect the correct state.

```sql
-- Trigger function (planning only — no SQL applied)
CREATE OR REPLACE FUNCTION enforce_plan_expiry()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  -- On any UPDATE to tenants, if plan_expires_at has passed and plan != 'starter', downgrade
  IF NEW.plan_expires_at IS NOT NULL
     AND NEW.plan_expires_at < NOW()
     AND NEW.plan IN ('pro', 'business')
  THEN
    NEW.plan := 'starter';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_enforce_plan_expiry
  BEFORE UPDATE ON tenants
  FOR EACH ROW EXECUTE FUNCTION enforce_plan_expiry();
```

**Limitation:** Trigger fires on UPDATE — does not retroactively fix rows that already expired without a subsequent UPDATE. Requires companion action (scheduled Edge Function or manual query) to fix existing stale rows.

**Scheduled Edge Function companion:**
```js
// supabase/functions/expire-plans/index.ts (planning only)
// Runs daily via Supabase Cron (pg_cron)
// UPDATE tenants SET plan = 'starter' WHERE plan != 'starter' AND plan_expires_at < NOW();
```

---

## 6. Execution Record ✅ COMPLETE

1. ✅ **DB verification query** — 0 rows returned; no tenants currently affected
2. ✅ **Frontend fix (Option B — `getEffectivePlan`)** — applied 2026-05-20 across 13 files
3. ✅ **DB enforcement applied 2026-05-21:**
   - `public.expire_paid_plans()` function — batch downgrades all expired paid tenants; grants: postgres + service_role only
   - `trg_enforce_plan_expiry_on_write` — BEFORE INSERT + UPDATE trigger on `public.tenants`; grants: postgres + service_role only
   - pg_cron job `expire-paid-plans-daily` — `SELECT public.expire_paid_plans();` at `0 1 * * *`; jobid: 5
4. ✅ **One-time backfill** — manual run of `expire_paid_plans()` returned 0 affected rows; no stale tenants existed
5. ✅ **Frontend + DB layers both active** — belt-and-suspenders in place

---

## 7. DB Verification Query

Run this in Supabase SQL Editor to check current exposure:

```sql
SELECT id, business_name, plan, plan_expires_at, trial_ends_at
FROM public.tenants
WHERE plan <> 'starter'
  AND plan_expires_at IS NOT NULL
  AND plan_expires_at < now();
```

**Expected outcomes:**

| Result | Meaning |
|--------|---------|
| 0 rows | No tenants currently affected — risk is theoretical |
| N rows | N tenants have stale plan='pro/business' with expired `plan_expires_at` — immediate action needed |

Also verify whether any DB trigger already handles this:

```sql
SELECT trigger_name, event_manipulation, action_statement
FROM information_schema.triggers
WHERE event_object_table = 'tenants';
```

---

## 8. Files Requiring Changes (Frontend Fix)

| File | Change | Risk level |
|------|--------|-----------|
| `src/lib/hooks/useTransactionQuota.js:19` | `isStarter` formula | CRITICAL |
| `src/lib/hooks/useRPATransactionQuota.js:18` | `isStarter` formula | CRITICAL |
| `src/lib/hooks/useSembakoTransactionQuota.js:18` | `isStarter` formula | CRITICAL |
| `src/lib/quotaUtils.js:18` | `plan = getEffectivePlan` | CRITICAL |
| `src/lib/hooks/useAIQuota.js:24` | `plan = getEffectivePlan` | HIGH |
| `src/dashboard/broker/poultry_broker/Armada.jsx:198` | `isStarter` formula | HIGH |
| `src/dashboard/broker/poultry_broker/Simulator.jsx:41` | `isStarter` formula | MEDIUM |
| `src/dashboard/broker/sembako_broker/Pegawai.jsx:43` | `isStarter` formula | MEDIUM |
| `src/dashboard/broker/sembako_broker/Laporan.jsx:39` | `isStarter` formula | MEDIUM |
| `src/dashboard/_shared/components/wizard/WizardStepPengiriman.jsx:118` | `isStarter` formula | MEDIUM |
| `src/components/invoice/InvoicePreviewModal.jsx:176` | `isStarter` formula | MEDIUM |
| `src/dashboard/rumah_potong/rpa/LaporanMargin.jsx:108` | `isStarter` formula | MEDIUM |

**Total: 12 files, all one-line formula changes.**

If using Option B (`getEffectivePlan`), also add the utility to `subscriptionUtils.js` (+1 file).

---

## 9. Not Changing

- `getSubscriptionStatus` function — already correct
- `AppSidebar.jsx` — already uses `sub.status`
- `UpgradePlan.jsx:360` — already uses `sub.status` as primary check
- Admin panel files — display-only, no tenant-facing gates
- Tier 2 toast message files — misleading text but no access leak; deferred to B6 cleanup
- Schema, RLS, RPC, logger utilities, actionName values
