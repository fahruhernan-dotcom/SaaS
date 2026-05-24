# TernakOS — Production Readiness Audit

> **Verdict: 🟡 Mostly ready but needs billing/payment hardening**  
> **Audit date:** 2026-05-20 | **Last updated:** 2026-05-20 (3 critical/high items marked fixed)  
> **Auditor:** Antigravity × Claude Code (read-only, no code/SQL changes made)  
> **Scope:** Frontend, Edge Functions, Nginx/VPS, Billing, RLS, Android/TWA, Documentation

---

## 1. Status Summary

| Area | Status | Blocker? |
|------|--------|----------|
| ESLint | ✅ 0 errors | — |
| Build (`npm run build`) | ✅ Passes | — |
| RLS — core tables | ✅ All on, risky detector clean | — |
| RLS — domba/kambing/egg | ✅ Confirmed enabled (stale risk corrected) | — |
| RLS — `broker_employees` | ✅ Fixed — policies added 2026-05-20 | — |
| Nginx security headers | ✅ CSP, HSTS, X-Frame, nosniff, TLS 1.2/1.3 | — |
| Deploy script | ✅ Clean, no hardcoded secrets | — |
| Onboarding flow | ✅ Fixed (placeholder reuse, race fixed) | — |
| Tenant defaults | ✅ Fixed (NULL, not `poultry_broker`) | — |
| Android/TWA `assetlinks.json` | ✅ Exists with real SHA-256 | — |
| `activate_plan_trial` RPC | ✅ Fixed — owner-only check verified 2026-05-20 | — |
| `cleanup_system_error_logs` | ✅ Fixed — anon grant removed, superadmin guard present | — |
| Billing — Midtrans webhook | 🔴 Not implemented (manual flow only) | No** |
| Billing — invoice atomicity | ⚠️ Non-atomic 4-step mutation | No** |
| Billing — plan expiry enforcement | ✅ Frontend gates + DB function/trigger/pg_cron applied (2026-05-21) | — |
| AI API keys in frontend bundle | ⚠️ `VITE_MAIA_API_KEY`, `VITE_GLM_API_KEY` exposed | No*** |
| `xendit_config` table + columns | ⚠️ B3A+B3B applied — provider columns live, Xendit UI retired; DB column drop deferred to B3D | No |
| `docs/db/` database docs | ✅ Comprehensive, last updated 2026-05-07 | — |

> **Billing gaps are documented in `BILLING_SUBSCRIPTION_HARDENING_PLAN.md` with a full roadmap (B0–B7). The manual bank transfer flow is operational and tolerated at current user volume.  
> ***AI API keys are client-side by design (MAIA router pattern) — see Section 3 for risk assessment.

---

## 2. Verified Safe / Completed

### 2.1 Lint & Build
- `npx eslint src/` → exit code 0, 0 errors (confirmed 2026-05-20)
- `npm run build` → passes, SSG prerendering complete
- Phase 7 lint cleanup is fully resolved

### 2.2 RLS Coverage — Core Tables
From `docs/db/00_INDEX.md` (2026-05-07):
- **141 tables confirmed**, RLS enabled on all
- **200+ RLS policies** active
- Risky policy detector (anon/public/unscoped reads): **0 rows**
- `docs/db/02_SECURITY_RLS.md` documents all policy blueprints

### 2.3 RLS — domba/kambing/egg Tables (Stale Claim Corrected)
Previous memory note "RLS tech debt domba/kambing/egg" is **stale and not proven by current evidence**. Live DB query (2026-05-20, user-provided): RLS enabled, policies present, no anon/public policies detected on any of these tables. This claim is retired.

### 2.4 Tenant Defaults Fixed
- `tenants.business_vertical` default: `NULL` ✅ (was `'poultry_broker'`)
- `tenants.base_livestock_type` default: `NULL` ✅ (was `'broiler'`)
- `tenants.sub_type` default: `NULL` ✅
- No new tenant gets an unwanted Broker Ayam bootstrap

### 2.5 Onboarding Flow
- First-time onboarding reuses existing placeholder tenant correctly
- Post-onboarding redirect race condition fixed in `OnboardingFlow.jsx`

### 2.6 Nginx / VPS Hardening
Config: `nginx/ternakos.conf` (applied via `deploy.sh`)
- TLS 1.2 + 1.3 only; server_tokens off
- HSTS: `max-age=31536000; includeSubDomains; preload`
- CSP header: scoped to `self`, Supabase, Google Fonts, GTM, Spline, MAIA router
- X-Frame-Options: SAMEORIGIN
- X-Content-Type-Options: nosniff
- Referrer-Policy: strict-origin-when-cross-origin
- Permissions-Policy: camera/mic/geo blocked
- `.env`, `.git`, `.htaccess`, `wp-admin` paths: blocked (404)
- HTTP → HTTPS redirect on port 80

### 2.7 Android / TWA
- `public/.well-known/assetlinks.json` **exists** with real SHA-256 fingerprint:  
  `F3:39:45:AC:CA:48:DB:7D:52:99:...` (package: `id.my.ternakos.app`)
- Previous claim "assetlinks.json missing" is **stale and incorrect**
- Note: Google Play App Signing SHA-256 must also be added after Play Console upload (see plan doc)

### 2.8 Edge Function — `verify-invite-code`
- Input sanitization: ✅ stripped to `[A-Z0-9]`, length 4–12 enforced
- Rate limiting: ✅ DB-backed IP rate limit with 15-min window + lockout
- Service role used correctly for `team_invitations` lookup
- No auth required: ✅ correct (pre-registration use case)
- CORS: `*` — acceptable for this endpoint (read-only, no auth-sensitive data returned)

### 2.9 Deploy Script
- `deploy.sh`: git pull → npm install → build → nginx apply → reload
- No hardcoded secrets in script
- SEO sitemap ping to Google/Bing included post-deploy
- Canonical tag verification on 10 key pages included

### 2.10 Database Documentation
- `docs/db/` exists with 7 structured files (last updated 2026-05-07)
- `BILLING_DB_VERIFICATION.md` completed (Phase B1 done)
- CLAUDE.md correctly says: do not trust `supabase/schema.sql`, read `docs/db/` instead

### 2.11 Recently Fixed (verified 2026-05-20)

**`activate_plan_trial` RPC — CLOSED**
- Grants: `authenticated`, `postgres`, `service_role` only — `anon` never had access.
- Function body enforces: `auth.uid()` not null; caller is superadmin OR has `role = 'owner'` on the target tenant via `tenant_memberships` + `profiles` (both joined on `auth_user_id = auth.uid()`).
- Corrected overclaim: the previous finding said "any auth user can activate any tenant." The actual risk was narrower — a non-owner tenant member could potentially call the RPC. The owner-only check is now confirmed present.
- **Status: FIXED.**

**`cleanup_system_error_logs` RPC — CLOSED**
- Grants: `authenticated`, `postgres`, `service_role` only — `anon` grant confirmed removed.
- Function body has `is_superadmin()` guard — non-superadmin authenticated calls also blocked.
- Corrected overclaim: the function already had the superadmin guard; the actual gap was only the unnecessary `anon` EXECUTE grant (which allowed an unauthenticated caller to reach the guard and fail, but still invoked the function). Now removed.
- **Status: FIXED.**

**`broker_employees` RLS — CLOSED**
- RLS enabled; SELECT/INSERT/UPDATE/DELETE policies now exist.
- Policies are `authenticated`-only and tenant-scoped + role-scoped. Risky detector: 0 rows.
- Corrected overclaim: the "no policies" state was not a data breach (0 rows in the table at time of audit), but a feature-blocker. Policies are now present.
- **Status: FIXED.**

---

## 3. Verified Risks

### 3.1 ✅ CLOSED — `plan_expires_at` Enforcement (frontend + DB fully applied)

**Source:** `docs/db/BILLING_DB_VERIFICATION.md` F-08 + frontend audit 2026-05-20  
**Full audit:** `docs/PLAN_EXPIRY_ENFORCEMENT_PLAN.md`

**Frontend layer — FIXED 2026-05-20:** All 13 affected files now use `getEffectivePlan(tenant)` (new utility) or the corrected `isStarter` formula. Expired tenants are correctly gated at the UI layer.

**DB layer — FIXED 2026-05-21:**
- `public.expire_paid_plans()` — batch downgrade function; runs via pg_cron daily at 01:00 UTC (job `expire-paid-plans-daily`, jobid 5); grants: postgres + service_role only
- `trg_enforce_plan_expiry_on_write` — BEFORE INSERT + UPDATE trigger on `public.tenants`; auto-downgrades any row that arrives with a stale paid plan + expired `plan_expires_at`; grants: postgres + service_role only
- Manual run on apply: 0 affected rows — no stale tenants existed at enforcement time

**Remaining gap — DB layer:** `tenants.plan` remains stale after expiry. Any code that reads `tenant.plan` directly from DB (e.g., new code, server-side checks, future Edge Functions) will see the old value. A Postgres trigger `trg_enforce_plan_expiry` is planned but not yet applied.

**DB query to confirm current exposure:**
```sql
SELECT id, business_name, plan, plan_expires_at, trial_ends_at
FROM public.tenants
WHERE plan <> 'starter'
  AND plan_expires_at IS NOT NULL
  AND plan_expires_at < now();
```

---

### 3.2 ⚠️ MEDIUM — AI API Keys Exposed in Frontend Bundle

**Source:** `src/lib/useAIAssistant.jsx:535`, `src/dashboard/peternak/ai/PrediksiHasilPage.jsx:49`  
**Evidence:** `VITE_MAIA_API_KEY` and `VITE_GLM_API_KEY` are read via `import.meta.env` and used directly in the frontend to call AI APIs (`api.maiarouter.ai`, `open.bigmodel.cn`).

**Risk assessment:** Vite `VITE_` env vars are **compiled into the browser bundle** and visible to anyone who inspects `dist/assets/app-*.js`. Anyone with the key can make API calls to MAIA/GLM on your bill.

**Current mitigations:**  
- MAIA router typically has domain whitelisting and key rate limits
- CSP `connect-src` limits to `api.maiarouter.ai` and `api.maia.id`
- AI features are only accessible to authenticated users (behind auth route)

**Recommended hardening:** Move AI calls to a Supabase Edge Function that reads the key from Vault and proxies requests. Keys are then never sent to the browser.

---

### 3.3 ⚠️ HIGH — Billing: Non-Atomic Invoice Confirmation (M-6) — Partially Mitigated

**Source:** `BILLING_SUBSCRIPTION_HARDENING_PLAN.md`, Risk M-6  
**Evidence:** `useConfirmInvoice` is a 4-step mutation with no DB transaction. Steps: mark invoice `paid` → read plan_configs → read tenants → update tenant plan. If step 4 fails, invoice is marked `paid` but tenant stays on old plan. Partial failure is logged with `metadata.partial: true` but no auto-recovery.

**B2 mitigation (2026-05-20):** Step c now uses `.select('id')` and checks affected row count. If 0 rows updated (invoice already processed), the function throws immediately and never reaches step d (tenant update). This prevents double-confirm from re-extending `plan_expires_at`. Partial failure on step d (tenant update) is still possible but remains low-risk at current manual volume.

**Full fix:** Atomic RPC `confirm_invoice_and_update_plan()` — deferred to Phase B5.

---

### 3.4 ⚠️ MEDIUM — Stale Xendit Artefacts

**Source:** `docs/db/BILLING_DB_VERIFICATION.md`, Findings F-01, F-05  
**Evidence:**  
- `subscription_invoices.xendit_invoice_id` and `xendit_payment_url` columns exist in live DB (Phase B3 cleanup planned)
- `xendit_config` table exists with `secret_key_encrypted` column but **0 rows** — no active Xendit config
- `AdminSubscriptions.jsx:611` still renders a "XENDIT CONFIG TAB" in the UI

**Risk:** Zero functional risk (no rows, no active Xendit integration). UI confusion risk: admins may see a Xendit tab with unknown purpose.

**Phase B3 action:** Migrate column names, deprecate/drop `xendit_config`, update admin UI tab to "Konfigurasi Pembayaran" or similar.

---

### 3.5 ⚠️ MEDIUM — `ai-commit` Edge Function: Dynamic Table Name

**Source:** `supabase/functions/ai-commit/index.ts:~55`  
**Evidence:** `adminSupabase.from(target_table)` where `target_table` comes from the `ai_staged_transactions` record. The function first verifies the staged row belongs to the calling user (`.eq('profile_id', user.id)`), so arbitrary injection requires a malicious staged row to already exist for that user.

**Risk:** Limited — the user can only commit their own staged rows. But a compromised staged row (e.g., via a different injection) could redirect inserts to arbitrary tables with service role. RLS on the destination table is bypassed.

**Recommended hardening:** Add a whitelist of allowed `target_table` values in the Edge Function (e.g., `ALLOWED_TABLES = ['harian_logs', 'daily_inputs', ...]`). Reject if not in whitelist.

---

### 3.6 🔴 NOT BUILT — Midtrans Webhook + Atomic Confirm RPC

**Source:** `BILLING_SUBSCRIPTION_HARDENING_PLAN.md`, Risks M-2, M-3, M-4, M-5, M-7  
**Evidence:** No `midtrans-create-transaction` or `midtrans-webhook` Edge Function exists in `supabase/functions/`. Plan documented in Phase B4–B5.

**Impact:** Midtrans Snap payment flow is **not usable**. Manual bank transfer is the only functional payment method. This is a known and accepted state — the hardening roadmap (B4–B5) documents the full implementation plan.

**Not a blocker for current user volume. Must be completed before scaling.**

---

## 4. Stale Claims / Corrected Assumptions

| Previous Claim | Corrected State | Evidence |
|----------------|----------------|----------|
| "RLS tech debt domba/kambing/egg" | ✅ NOT PROVEN — RLS enabled, policies exist, risky detector: 0 rows | User-provided live DB query 2026-05-20 |
| "assetlinks.json missing" (Android plan) | ✅ EXISTS — `public/.well-known/assetlinks.json` with real SHA-256 | `ls public/.well-known/` |
| "ESLint errors open in peternak DailyTask" | ✅ RESOLVED — Phase 7 lint cleanup complete, `npx eslint src/` = 0 errors | ESLint exit code 0 |
| "tenant default is `poultry_broker`" | ✅ FIXED — all tenant vertical defaults are now NULL | User-provided confirmation |
| "onboarding creates duplicate Broker tenant" | ✅ FIXED — placeholder reuse logic corrected | User-provided confirmation |
| "DATABASE_STRUCTURE.md is single source of truth" | ⚠️ Superseded by `docs/db/` folder structure (7 files, more granular). CLAUDE.md should reference `docs/db/` | `docs/db/00_INDEX.md` exists |
| "`activate_plan_trial` — any auth user can activate any tenant" | Overclaim. Actual risk: non-owner tenant member activation. Owner-only check confirmed present in function body. **FIXED.** | User-provided live DB verification 2026-05-20 |
| "`cleanup_system_error_logs` — no superadmin guard" | Overclaim. Guard was already present; only issue was unnecessary `anon` EXECUTE grant. **FIXED.** | User-provided live DB verification 2026-05-20 |
| "`broker_employees` — data breach risk" | Overclaim. 0 rows in table, so no data exposure. Actual problem was feature-blocker (RLS on + no policies). **FIXED.** | User-provided live DB verification 2026-05-20 |

---

## 5. Unknowns That Need Manual Verification

| Unknown | Why It Matters | How to Verify |
|---------|---------------|---------------|
| `payment_settings` RLS policies — can authenticated users read all bank accounts? | Public read may be acceptable (checkout instructions) but must be intentional | `SELECT * FROM pg_policies WHERE tablename = 'payment_settings';` |
| ~~Do any expired Pro tenants currently exist with `plan_expires_at < now()`?~~ | ✅ RESOLVED — 0 rows confirmed 2026-05-21; DB trigger + cron now prevent recurrence | — |
| Is `broker_employees` table actively used by any tenant? | Determines urgency of the "no policies" bug | `SELECT COUNT(*) FROM broker_employees;` |
| `VITE_MAIA_API_KEY` / `VITE_GLM_API_KEY` — do these keys have usage limits or domain restrictions on the provider side? | Determines real exposure of frontend AI key pattern | Check MAIA router dashboard / GLM API dashboard |
| Google Play App Signing SHA-256 not yet added to `assetlinks.json` | TWA deep-link verification will fail on Play-installed APKs | Upload AAB to Play Console → App signing → copy SHA-256 → add second entry to `assetlinks.json` |
| `fetch-harga` Edge Function — called by Supabase cron or external? | No auth check on function entry point — must be cron-only | Check Supabase Cron Jobs in dashboard |

---

## 6. Recommended Next Actions

Ordered by risk × urgency:

### ✅ Immediate items — all closed (verified 2026-05-20)
- `activate_plan_trial` owner-only check: **DONE**
- `cleanup_system_error_logs` anon grant revoked: **DONE**
- `broker_employees` RLS policies added: **DONE**

### Near-term (before Midtrans goes live)

1. ~~**[B2] Invoice guard hardening**~~ ✅ DONE 2026-05-20

2. ~~**[B3A] Provider-neutral invoice migration**~~ ✅ APPLIED 2026-05-20 — 10 columns + 4 indexes live in DB

3. ~~**[B3B] Xendit code cleanup**~~ ✅ DONE 2026-05-20 — `useXenditConfig`/`useSaveXenditConfig` deleted, `useAllInvoices` select updated, `XenditConfigTab` replaced with `PaymentGatewayTab` placeholder

4. ~~**[B3E] DB-level plan expiry enforcement**~~ ✅ APPLIED 2026-05-21 — `expire_paid_plans()` + `trg_enforce_plan_expiry_on_write` + pg_cron job `expire-paid-plans-daily` (0 1 * * *); 0 stale tenants at apply time

5. **[B4+B5] Build Midtrans Edge Functions** ← **NEXT** — `midtrans-create-transaction`, `midtrans-webhook`, atomic confirm RPC  
   *Files: `supabase/functions/`, new SQL migration*

### Recommended (hardening)

5. **Move AI API calls to Edge Function** — prevents key exposure in browser bundle  
   *Files: `supabase/functions/ai-proxy/`, `useAIAssistant.jsx`, `PrediksiHasilPage.jsx`*

6. **Add `target_table` whitelist to `ai-commit`** — limits blast radius of a compromised staged row  
   *File: `supabase/functions/ai-commit/index.ts`*

7. **Update CLAUDE.md** — change "Baca `DATABASE_STRUCTURE.md`" to "Baca `docs/db/` folder"  
   *File: `CLAUDE.md`*

---

## 7. Out of Scope

- No code changes made during this audit
- No SQL changes made during this audit
- No RLS policy modifications
- No logger utility changes
- No actionName renames
- No Midtrans implementation (documented as Phase B4–B5)
- VPS filesystem state not directly accessible — Nginx config read from repo copy only
- Supabase Auth settings (leaked password check, email rate limits) — not auditable from repo

---

## 8. Evidence / Commands Run

| Command / File Read | Finding |
|--------------------|---------|
| `npx eslint src/ --format compact` | Exit code 0, 0 errors |
| `npm run build` (prior session) | Passes, SSG complete |
| `ls public/.well-known/` | `assetlinks.json` present |
| `cat public/.well-known/assetlinks.json` | Real SHA-256 fingerprint present |
| `ls supabase/functions/` | `ai-commit`, `fetch-harga`, `verify-invite-code` |
| `cat supabase/functions/ai-commit/index.ts` | Auth check ✅, service role ✅, dynamic `target_table` ⚠️ |
| `cat supabase/functions/fetch-harga/index.ts` | Service role, no auth (cron pattern), scraper logic |
| `cat supabase/functions/verify-invite-code/index.ts` | Input validation ✅, IP rate limit ✅ |
| `cat nginx/ternakos.conf` | Full security headers, TLS config, blocked paths |
| `cat deploy.sh` | Clean, no hardcoded secrets, SEO ping included |
| `grep MAIA_API_KEY src/**` | Keys in `useAIAssistant.jsx` and `PrediksiHasilPage.jsx` |
| `grep XENDIT src/dashboard/admin/AdminSubscriptions.jsx` | Stale "XENDIT CONFIG TAB" comment in UI |
| `cat docs/BILLING_SUBSCRIPTION_HARDENING_PLAN.md` | Phase B0 done, B1 done, B2–B7 pending |
| `cat docs/db/00_INDEX.md` | Last updated 2026-05-07, 141 tables, RLS: all on |
| `cat docs/db/BILLING_DB_VERIFICATION.md` | Findings F-01 through F-17 (Phase B1 complete) |
| `cat docs/db/06_HIGH_RISK.md` | Generated columns list, SECURITY DEFINER functions |
| `cat .env.example` | No secrets — only placeholder values |

| Live DB: `activate_plan_trial` grants + body (2026-05-20) | `authenticated`/`postgres`/`service_role` only; owner-only check confirmed — FIXED |
| Live DB: `cleanup_system_error_logs` grants (2026-05-20) | `authenticated`/`postgres`/`service_role` only; `is_superadmin()` guard present — FIXED |
| Live DB: `broker_employees` RLS policies (2026-05-20) | SELECT/INSERT/UPDATE/DELETE policies present, authenticated-only, tenant+role scoped — FIXED |

**No code or SQL changes were made during this audit.**
