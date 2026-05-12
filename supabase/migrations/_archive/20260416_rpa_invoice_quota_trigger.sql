-- =============================================================================
-- Migration: Server-side quota enforcement for rpa_invoices (Starter plan)
-- Scope: BEFORE INSERT trigger on rpa_invoices
--
-- Limit source: plan_configs WHERE config_key = 'transaction_quota'
--               value shape: { "starter": 30 }   (same key frontend reads)
--
-- Enforced only when:
--   tenants.plan = 'starter' AND trial_ends_at is null or expired
--
-- NOT enforced for: pro, business, or starter-on-active-trial
-- =============================================================================


-- ---------------------------------------------------------------------------
-- Helper: is this tenant currently in an active trial?
-- Mirrors frontend logic: getSubscriptionStatus → status === 'trial'
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.rpa_tenant_in_trial(p_tenant_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    plan = 'starter'
    AND trial_ends_at IS NOT NULL
    AND trial_ends_at > now()
  FROM public.tenants
  WHERE id = p_tenant_id;
$$;

COMMENT ON FUNCTION public.rpa_tenant_in_trial(uuid) IS
  'Returns true when tenant is starter-plan AND trial has not expired yet. '
  'Trial tenants bypass transaction quota — mirrors frontend getSubscriptionStatus logic.';


-- ---------------------------------------------------------------------------
-- Trigger function: enforce monthly invoice quota for Starter tenants
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.enforce_rpa_invoice_quota()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_plan           text;
  v_in_trial       boolean;
  v_limit          int;
  v_used           int;
  v_first_of_month timestamptz;
BEGIN
  -- ── 1. Fetch tenant plan ──────────────────────────────────────────────────
  SELECT plan
  INTO   v_plan
  FROM   public.tenants
  WHERE  id = NEW.tenant_id;

  -- Tenant not found: let RLS handle it, don't block insert here
  IF NOT FOUND OR v_plan IS NULL THEN
    RETURN NEW;
  END IF;

  -- ── 2. Quota only applies to Starter ─────────────────────────────────────
  IF v_plan <> 'starter' THEN
    RETURN NEW;
  END IF;

  -- ── 3. Trial bypass ───────────────────────────────────────────────────────
  --   Starter tenants on active trial get Pro-equivalent access.
  --   Mirrors: isStarter = sub.plan === 'starter' && sub.status !== 'trial'
  v_in_trial := public.rpa_tenant_in_trial(NEW.tenant_id);
  IF v_in_trial THEN
    RETURN NEW;
  END IF;

  -- ── 4. Read limit from plan_configs ──────────────────────────────────────
  --   config_key = 'transaction_quota', value = { "starter": N }
  --   Falls back to 30 if row is missing (matches FALLBACK_STARTER_LIMIT in hooks)
  SELECT COALESCE(
    (config_value ->> 'starter')::int,
    30
  )
  INTO  v_limit
  FROM  public.plan_configs
  WHERE config_key = 'transaction_quota';

  IF v_limit IS NULL THEN
    v_limit := 30;
  END IF;

  -- ── 5. Count invoices this calendar month ────────────────────────────────
  --   Uses transaction_date (same field frontend hook uses for count).
  --   is_deleted = false mirrors the frontend COUNT query.
  v_first_of_month := date_trunc('month', now());

  SELECT COUNT(*)
  INTO   v_used
  FROM   public.rpa_invoices
  WHERE  tenant_id        = NEW.tenant_id
    AND  is_deleted        = false
    AND  transaction_date >= v_first_of_month;

  -- ── 6. Enforce ────────────────────────────────────────────────────────────
  IF v_used >= v_limit THEN
    RAISE EXCEPTION
      'QUOTA_EXCEEDED|rpa_invoices|starter|%|%',
      v_limit, v_used
      USING
        ERRCODE = 'P0001',
        HINT    = 'Upgrade ke Pro untuk invoice unlimited.';
  END IF;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.enforce_rpa_invoice_quota() IS
  'BEFORE INSERT trigger on rpa_invoices. '
  'Blocks Starter tenants (non-trial) from exceeding their monthly invoice quota. '
  'Limit is read live from plan_configs.transaction_quota.starter — no hardcoded numbers here.';


-- ---------------------------------------------------------------------------
-- Attach trigger
-- ---------------------------------------------------------------------------
DROP TRIGGER IF EXISTS trg_rpa_invoice_quota ON public.rpa_invoices;

CREATE TRIGGER trg_rpa_invoice_quota
  BEFORE INSERT
  ON     public.rpa_invoices
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_rpa_invoice_quota();

COMMENT ON TRIGGER trg_rpa_invoice_quota ON public.rpa_invoices IS
  'Enforces monthly invoice quota for Starter plan. Fires before every INSERT.';
