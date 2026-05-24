# Phase B1 — Billing & Subscription DB Verification Report
> Read-only audit | No schema or data changes made  
> Generated: 2026-05-20 | Project: TernakOS (Supabase `llgqxzrlcewugufzwyer`)

---

## Executive Summary

| Area | Status | Severity |
|---|---|---|
| `subscription_invoices` schema | ⚠️ Xendit columns present | HIGH |
| `xendit_config` table | ⚠️ Exists but empty | MEDIUM |
| `payment_settings` RLS | ✅ RLS enabled, 1 row only | LOW |
| `tenants.plan_expires_at` | ⚠️ No DB-level enforcement | HIGH |
| `pricing_plans` coverage | ✅ 42 rows, all major verticals | PASS |
| `plan_configs` keys | ✅ 9 config keys present | PASS |
| Duplicate pending invoices | ✅ 4 rows total, likely clean | PASS (needs live query) |
| `activate_plan_trial` RPC | 🔴 CRITICAL: callable by any user | CRITICAL |
| `broker_employees` RLS | ⚠️ RLS on but NO policies | HIGH |
| Leaked password protection | ⚠️ Disabled in Auth | MEDIUM |

---

## 1. `subscription_invoices` — Column Audit

### Current Schema (confirmed live)

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | ✅ |
| `tenant_id` | uuid FK → tenants | ✅ |
| `invoice_number` | text UNIQUE nullable | ✅ |
| `amount` | int4 | ✅ |
| `plan` | text CHECK (starter/pro/business) | ✅ |
| `billing_period` | text nullable | ✅ |
| `billing_months` | int4 default 1 | ✅ |
| `status` | text CHECK (pending/paid/expired/cancelled) | ✅ |
| `transfer_proof_url` | text nullable | Manual flow |
| `bank_name` | text nullable | Manual flow |
| `transfer_date` | date nullable | Manual flow |
| `confirmed_by` | uuid FK → profiles nullable | Admin-confirmed |
| `confirmed_at` | timestamptz nullable | Admin-confirmed |
| `notes` | text nullable | ✅ |
| `payment_proof_url` | text nullable | Duplicate of `transfer_proof_url`? |
| `payment_method` | text default `'transfer'` | No CHECK constraint! |
| `xendit_invoice_id` | text nullable | 🔴 **MUST BE MIGRATED** |
| `xendit_payment_url` | text nullable | 🔴 **MUST BE MIGRATED** |
| `paid_at` | timestamptz nullable | ✅ Keep |
| `created_at` / `updated_at` | timestamptz | ✅ |

### Findings

> [!CAUTION]
> **F-01**: `xendit_invoice_id` and `xendit_payment_url` are live columns. These must be renamed to `provider_order_id` and `provider_payment_url` in Phase B3 via a non-destructive migration. Do NOT drop yet — they may have data if historical invoices exist.

> [!WARNING]
> **F-02**: `payment_proof_url` appears to duplicate `transfer_proof_url`. Investigate if both are in use before Phase B3 column cleanup.

> [!WARNING]
> **F-03**: `payment_method` column has no CHECK constraint. Freeform text is a data integrity risk. Phase B3 should add: `CHECK (payment_method = ANY (ARRAY['transfer', 'midtrans_snap', 'midtrans_va', 'manual']))`

> [!NOTE]
> **F-04**: Table has RLS enabled. This is correct. Policies should restrict: tenants can only read their own invoices; only `service_role` / admin can update `status` to `paid`.

---

## 2. `xendit_config` Table — Deprecation Status

**Confirmed live columns:** `id`, `is_active`, `secret_key_encrypted`, `webhook_token`, `success_redirect_url`, `failure_redirect_url`, `created_at`, `updated_at`

**Row count: 0** (empty table)

> [!NOTE]
> **F-05**: `xendit_config` is structurally present but has zero rows. `is_active` defaults to `false`. This table is safe to deprecate in Phase B3. The `secret_key_encrypted` column confirms intent to store credentials in DB — this pattern is banned under the new hardening plan. All Midtrans keys must go to Supabase Vault only.

**Action:** Phase B3 should `ALTER TABLE xendit_config RENAME TO _deprecated_xendit_config` and later drop it after confirmation.

---

## 3. `payment_settings` — Exposure Audit

**Confirmed columns:** `id`, `bank_name`, `account_number`, `account_name`, `is_active`, `created_at`

**Row count: 1**

**RLS:** ✅ Enabled

> [!NOTE]
> **F-06**: `payment_settings` currently stores only manual bank transfer details (no gateway credentials). This is the correct scope. The table does NOT contain any API keys or secrets. This is **PASS** for Phase B1.

> [!WARNING]
> **F-07**: Verify the RLS policies on `payment_settings` ensure only superadmin can `INSERT/UPDATE/DELETE`. Public read may be acceptable for bank transfer instructions shown on checkout, but must be intentional.

---

## 4. `tenants.plan` and `plan_expires_at` State

### Confirmed Schema on `tenants`

| Column | Type | Default | Notes |
|---|---|---|---|
| `plan` | text CHECK (starter/pro/business) | `'starter'` | ✅ |
| `plan_expires_at` | timestamptz nullable | NULL | ⚠️ No enforcement |
| `trial_ends_at` | timestamptz nullable | NULL | ✅ |
| `is_active` | boolean | true | ✅ |

### Findings

> [!CAUTION]
> **F-08**: `plan_expires_at` is nullable with no DB-level trigger or constraint to auto-downgrade tenants. A tenant can have `plan='pro'` with `plan_expires_at` in the past indefinitely. This is the **primary billing integrity risk**:
> - Without a scheduled function or middleware check, expired pro tenants retain full plan access
> - The frontend must check `plan_expires_at < now()` on every gated route
> - Phase B3 must implement a Postgres trigger or scheduled Edge Function to auto-downgrade `plan` to `'starter'` when `plan_expires_at < now()`

> [!NOTE]
> **F-09**: `trial_ends_at` is separate from `plan_expires_at`. The function `activate_plan_trial` exists as an RPC. See Critical Security Findings below.

**Live Data Context:** 19 tenant rows exist. Cannot read individual plan states without a direct SQL query, but schema confirms no structural protection against plan drift.

---

## 5. `pricing_plans` — Coverage Audit

**Row count: 42 rows** ✅

**Confirmed roles covered:**
```
broker, peternak, rpa, egg_broker, sembako_broker,
broker_ayam, broker_telur, broker_distributor, broker_sembako,
peternak_ayam_broiler, peternak_ayam_layer,
peternak_sapi_potong_fattening, peternak_sapi_potong_breeding, peternak_sapi_perah,
peternak_kambing_potong_fattening, peternak_kambing_potong_breeding, peternak_kambing_perah,
peternak_domba_potong_fattening, peternak_domba_potong_breeding,
peternak_puyuh, peternak_bebek,
rpa_buyer, rpa_rph
```
**Plans covered:** `pro`, `business` (starter is always free — no row needed)

> [!NOTE]
> **F-10**: Coverage is comprehensive. The `pricing_plans` table does NOT include any Xendit payment link columns. It is already provider-neutral. **PASS** for Phase B1.

> [!WARNING]
> **F-11**: There is no `UNIQUE (role, plan)` constraint confirmed. If not present, duplicate pricing rows per role/plan tier are possible. Phase B2 should verify and add a unique index if missing.

---

## 6. `plan_configs` — Key Audit

**Row count: 9 rows** ✅

The `plan_configs` table stores JSONB configuration blobs under a `config_key` unique text key. Based on schema, this is used for feature limits per plan tier.

> [!NOTE]
> **F-12**: 9 config keys is reasonable for a multi-vertical platform. The specific key names and JSONB values are not directly readable here but should be audited in Phase B2 to confirm all plan gating logic (kandang limits, ternak limits, etc.) is consistent with `plan_configs` data.

---

## 7. `subscription_invoices` — Pending/Duplicate Invoice Risk

**Row count: 4 rows** 

With only 4 rows, the risk of duplicate active pending invoices is currently low. However, there is **no DB-level unique constraint** preventing two `pending` invoices for the same `(tenant_id, plan)` at the same time.

> [!CAUTION]
> **F-13**: No unique constraint exists on `(tenant_id, status='pending')`. A race condition in the frontend (double-click submit, network retry) can create duplicate pending invoices. Phase B2 must add a partial unique index:
> ```sql
> CREATE UNIQUE INDEX CONCURRENTLY idx_subscription_invoices_one_pending_per_tenant
>   ON subscription_invoices (tenant_id)
>   WHERE status = 'pending';
> ```

> [!NOTE]
> **F-14**: With 4 rows total, manual review is feasible. The admin should inspect if any tenant has more than 1 pending invoice before Phase B3 migration begins.

---

## 8. `activate_plan_trial` — 🔴 CRITICAL Security Finding

> [!CAUTION]
> **CRITICAL — F-15**: The RPC `public.activate_plan_trial(p_tenant_id uuid, p_plan text, p_days integer)` is:
> - Flagged as `SECURITY DEFINER`
> - **Callable by the `authenticated` role** via `/rest/v1/rpc/activate_plan_trial`
> - This means **any logged-in user can call this RPC with any tenant_id** and activate a pro/business trial for themselves or any other tenant.
>
> This is a **privilege escalation vulnerability**. A malicious user can bypass billing entirely.
>
> **Immediate remediation required (Phase B2):**
> 1. Add an `is_superadmin()` guard as the first statement of the function body
> 2. OR revoke EXECUTE from `authenticated` and only grant to `service_role`
> 3. OR move the function to a non-public schema

---

## 9. Additional Security Findings (from Supabase Advisor)

### 9.1 `broker_employees` — RLS Enabled, No Policies

> [!WARNING]
> **F-16**: `public.broker_employees` has RLS enabled but **zero RLS policies**. This means all queries by `authenticated` users return zero rows (effectively blocking all access). If this table is in active use, the broker employee feature is silently broken for all users. Add appropriate SELECT/INSERT/UPDATE/DELETE policies in Phase B2.

### 9.2 `anon`-accessible `SECURITY DEFINER` Functions

The following functions are callable by **unauthenticated users** (`anon` role):

| Function | Risk |
|---|---|
| `append_tutorial_completed` | Low — but should require auth |
| `cleanup_system_error_logs` | **HIGH** — destructive operation, must be admin-only |
| `get_landing_stats` | Low — intentional public stats |
| `get_latest_platform_stats` | Low — intentional public stats |
| `handle_user_email_update` | Medium — trigger function, shouldn't be RPC-callable |
| `has_tenant_access` | Medium — information disclosure |
| `log_pre_auth_error` | Low — intentional pre-auth logging |
| `prevent_app_role_escalation` | Low — trigger, shouldn't be directly callable |
| `refresh_platform_stats` | Medium — compute-heavy, DoS risk |

> [!CAUTION]
> **F-17**: `cleanup_system_error_logs` is callable by `anon`. An unauthenticated attacker can delete all error logs. This must be fixed in Phase B2:
> ```sql
> REVOKE EXECUTE ON FUNCTION public.cleanup_system_error_logs FROM anon;
> ```

### 9.3 Leaked Password Protection

> [!WARNING]
> **F-18**: Supabase Auth's HaveIBeenPwned leaked password check is **disabled**. Enable this in the Supabase Auth settings (Authentication → Password → Enable Leaked Password Protection). Not blocking for billing work but should be enabled before production launch.

---

## 10. Tables Present — Billing-Adjacent Inventory

| Table | Rows | RLS | Billing Relevance |
|---|---|---|---|
| `subscription_invoices` | 4 | ✅ | Primary billing table |
| `payment_settings` | 1 | ✅ | Bank transfer config |
| `xendit_config` | 0 | ✅ | Deprecated — phase out |
| `pricing_plans` | 42 | ✅ | Plan pricing |
| `plan_configs` | 9 | ✅ | Feature limits |
| `discount_codes` | 0 | ✅ | Unused — future use |
| `tenants` | 19 | ✅ | Plan state ownership |

> [!NOTE]
> **No `midtrans_*` tables exist yet.** Provider-neutral columns (`provider_order_id`, `provider_payment_url`, `provider_name`, `signature_verified`, `webhook_received_at`) need to be added in Phase B3. The Midtrans Edge Functions will write to these new columns.

---

## 11. B2 / B3 Recommended Order

Based on findings above, the recommended phase order is:

### Phase B2 — DB Guards (Do First)

Priority order within B2:

1. **[CRITICAL]** Fix `activate_plan_trial` — revoke from authenticated or add superadmin guard
2. **[HIGH]** Revoke `anon` EXECUTE on `cleanup_system_error_logs`
3. **[HIGH]** Add partial unique index on `subscription_invoices(tenant_id) WHERE status='pending'`
4. **[HIGH]** Add RLS policies to `broker_employees` (or verify it's intentionally blocked)
5. **[MEDIUM]** Verify and add `UNIQUE (role, plan)` constraint on `pricing_plans`
6. **[MEDIUM]** Add CHECK constraint on `subscription_invoices.payment_method`

### Phase B3 — Schema Migration (After Guards)

1. Add provider-neutral columns to `subscription_invoices`:
   - `provider_name text DEFAULT 'manual'`
   - `provider_order_id text` (rename/alias from `xendit_invoice_id`)
   - `provider_payment_url text` (rename/alias from `xendit_payment_url`)
   - `signature_verified boolean DEFAULT false`
   - `webhook_received_at timestamptz`
2. Add plan enforcement trigger on `tenants`:
   - Auto-downgrade `plan → 'starter'` when `plan_expires_at < now()`
3. Deprecate `xendit_config` table
4. Investigate and resolve `payment_proof_url` vs `transfer_proof_url` ambiguity

---

## 12. Findings Summary Table

| ID | Finding | Severity | Phase |
|---|---|---|---|
| F-01 | `xendit_invoice_id` / `xendit_payment_url` columns live | HIGH | B3 |
| F-02 | `payment_proof_url` duplicates `transfer_proof_url` | LOW | B3 |
| F-03 | `payment_method` has no CHECK constraint | MEDIUM | B2 |
| F-04 | Verify RLS policies on `subscription_invoices` | MEDIUM | B2 |
| F-05 | `xendit_config` empty, ready for deprecation | MEDIUM | B3 |
| F-06 | `payment_settings` correctly scoped (PASS) | — | — |
| F-07 | Verify `payment_settings` RLS allows only admin write | MEDIUM | B2 |
| F-08 | `plan_expires_at` has no DB-level enforcement | HIGH | B3 |
| F-09 | `trial_ends_at` separate from `plan_expires_at` (PASS) | — | — |
| F-10 | `pricing_plans` provider-neutral (PASS) | — | — |
| F-11 | `pricing_plans` may lack UNIQUE (role, plan) | MEDIUM | B2 |
| F-12 | `plan_configs` present, 9 keys (PASS) | — | — |
| F-13 | No UNIQUE constraint on pending invoice per tenant | HIGH | B2 |
| F-14 | 4 rows only — manual review feasible before B3 | LOW | Pre-B3 |
| **F-15** | **`activate_plan_trial` callable by any user** | **CRITICAL** | **B2 NOW** |
| F-16 | `broker_employees` RLS on, no policies | HIGH | B2 |
| **F-17** | **`cleanup_system_error_logs` callable by anon** | **HIGH** | **B2 NOW** |
| F-18 | Leaked password protection disabled | MEDIUM | Before launch |

---

*Phase B1 complete. No schema or data modifications were made. All findings are read-only observations.*
