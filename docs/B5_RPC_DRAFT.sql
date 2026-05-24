-- ─────────────────────────────────────────────────────────────────────────────
-- B5 RPC DRAFT — confirm_invoice_and_update_plan
-- Status : DRAFT — DO NOT APPLY until reviewed via ChatGPT
-- Date   : 2026-05-23
--
-- Called by: supabase/functions/midtrans-webhook/index.ts (service_role only)
-- Purpose  : Verify invoice exists, update invoice status/provider fields,
--            update tenant plan if payment confirmed. Fully idempotent.
--
-- Security notes:
--   • SECURITY DEFINER — runs as function owner (postgres / superuser)
--   • SET search_path = public, pg_temp — prevents search_path injection
--   • Must be granted ONLY to service_role; revoked from public and anon
--   • Does NOT use auth.uid() — webhook context has no user session
--   • Row-level lock (SELECT FOR UPDATE) prevents concurrent double-processing
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.confirm_invoice_and_update_plan(
  p_provider_order_id   TEXT,
  p_transaction_id      TEXT,
  p_transaction_status  TEXT,
  p_fraud_status        TEXT,
  p_gross_amount_str    TEXT,      -- raw string from Midtrans e.g. "100000.00"
  p_paid_at             TIMESTAMPTZ,
  p_provider_payload    JSONB,
  p_signature_verified  BOOLEAN
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_invoice   RECORD;
  v_tenant    RECORD;
  v_duration  INTERVAL;
  v_new_expiry TIMESTAMPTZ;
  v_is_confirmed BOOLEAN;
  v_new_invoice_status TEXT;
BEGIN
  -- ─── 1. Lock the invoice row ──────────────────────────────────────────────
  SELECT
    id, invoice_number, tenant_id, plan, billing_months,
    amount, status, provider_order_id,
    provider_transaction_id, provider_status
  INTO v_invoice
  FROM public.subscription_invoices
  WHERE provider_order_id = p_provider_order_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success',            false,
      'error',              'invoice_not_found',
      'provider_order_id',  p_provider_order_id
    );
  END IF;

  -- ─── 2. Idempotency guard ─────────────────────────────────────────────────
  -- If invoice is already in a terminal state, skip all writes and return early.
  IF v_invoice.status IN ('paid', 'expired', 'cancelled') THEN
    RETURN jsonb_build_object(
      'success',        true,
      'skipped',        true,
      'reason',         'already_processed',
      'invoice_id',     v_invoice.id,
      'current_status', v_invoice.status
    );
  END IF;

  -- ─── 3. Determine confirmed status ───────────────────────────────────────
  -- "capture" requires fraud_status = 'accept' (credit card flow).
  v_is_confirmed := (
    p_transaction_status = 'settlement'
    OR (p_transaction_status = 'capture' AND p_fraud_status = 'accept')
  );

  -- Map Midtrans transaction_status → internal invoice status
  v_new_invoice_status := CASE
    WHEN v_is_confirmed                                         THEN 'paid'
    WHEN p_transaction_status IN ('expire', 'expired')          THEN 'expired'
    WHEN p_transaction_status IN ('cancel', 'cancelled', 'deny',
                                  'failure', 'refund', 'partial_refund')
                                                                THEN 'cancelled'
    ELSE v_invoice.status  -- 'pending', 'challenge', etc. — no change
  END;

  -- ─── 4. Update invoice ───────────────────────────────────────────────────
  UPDATE public.subscription_invoices
  SET
    status                    = v_new_invoice_status,
    provider_transaction_id   = COALESCE(p_transaction_id, provider_transaction_id),
    provider_status           = p_transaction_status,
    provider_signature_verified = p_signature_verified,
    -- Merge new webhook payload into existing provider_payload JSON
    provider_payload          = COALESCE(provider_payload, '{}'::jsonb)
                                  || jsonb_build_object('webhook', p_provider_payload),
    paid_at                   = CASE WHEN v_is_confirmed THEN p_paid_at   ELSE paid_at          END,
    provider_paid_at          = CASE WHEN v_is_confirmed THEN p_paid_at   ELSE provider_paid_at  END,
    provider_expired_at       = CASE
                                  WHEN p_transaction_status IN ('expire', 'expired')
                                  THEN now()
                                  ELSE provider_expired_at
                                END,
    provider_cancelled_at     = CASE
                                  WHEN p_transaction_status IN ('cancel', 'cancelled',
                                                                'deny', 'failure')
                                  THEN now()
                                  ELSE provider_cancelled_at
                                END,
    updated_at                = now()
  WHERE id = v_invoice.id;

  -- ─── 5. Update tenant plan (confirmed payments only) ─────────────────────
  IF NOT v_is_confirmed THEN
    RETURN jsonb_build_object(
      'success',            true,
      'payment_confirmed',  false,
      'invoice_id',         v_invoice.id,
      'invoice_number',     v_invoice.invoice_number,
      'transaction_status', p_transaction_status,
      'invoice_status',     v_new_invoice_status
    );
  END IF;

  -- Lock tenant row before updating plan
  SELECT id, plan, plan_expires_at
  INTO v_tenant
  FROM public.tenants
  WHERE id = v_invoice.tenant_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success',   false,
      'error',     'tenant_not_found',
      'tenant_id', v_invoice.tenant_id,
      'invoice_id', v_invoice.id
    );
  END IF;

  -- Calculate new plan_expires_at:
  -- Extend from current expiry if still active (handles renewals gracefully),
  -- otherwise start from now.
  v_duration := (v_invoice.billing_months || ' months')::INTERVAL;
  v_new_expiry := CASE
    WHEN v_tenant.plan_expires_at IS NOT NULL
         AND v_tenant.plan_expires_at > now()
    THEN v_tenant.plan_expires_at + v_duration
    ELSE now() + v_duration
  END;

  UPDATE public.tenants
  SET
    plan            = v_invoice.plan,
    plan_expires_at = v_new_expiry,
    updated_at      = now()
  WHERE id = v_invoice.tenant_id;

  RETURN jsonb_build_object(
    'success',          true,
    'payment_confirmed', true,
    'invoice_id',        v_invoice.id,
    'invoice_number',    v_invoice.invoice_number,
    'tenant_id',         v_invoice.tenant_id,
    'plan',              v_invoice.plan,
    'billing_months',    v_invoice.billing_months,
    'plan_expires_at',   v_new_expiry,
    'transaction_status', p_transaction_status
  );
END;
$$;

-- ─── Grants ──────────────────────────────────────────────────────────────────
-- Revoke from public (default), grant only to service_role.
-- postgres retains access implicitly as function owner.
REVOKE ALL ON FUNCTION public.confirm_invoice_and_update_plan(
  TEXT, TEXT, TEXT, TEXT, TEXT, TIMESTAMPTZ, JSONB, BOOLEAN
) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.confirm_invoice_and_update_plan(
  TEXT, TEXT, TEXT, TEXT, TEXT, TIMESTAMPTZ, JSONB, BOOLEAN
) TO service_role;
