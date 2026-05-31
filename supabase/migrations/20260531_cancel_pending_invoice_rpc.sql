-- Migration: add cancel_pending_invoice RPC
-- Allows a tenant member to cancel their OWN pending invoice (self-service)
-- Uses SECURITY DEFINER so it bypasses the UPDATE RLS policy (which is superadmin-only)
-- but enforces ownership validation inside the function body.

CREATE OR REPLACE FUNCTION public.cancel_pending_invoice(p_invoice_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_invoice RECORD;
  v_caller_tenant_id uuid;
BEGIN
  -- 1. Get the caller's primary tenant_id
  v_caller_tenant_id := my_tenant_id();

  IF v_caller_tenant_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'UNAUTHORIZED');
  END IF;

  -- 2. Fetch invoice — verify it exists, belongs to this tenant, and is still pending
  SELECT id, tenant_id, status
  INTO v_invoice
  FROM public.subscription_invoices
  WHERE id = p_invoice_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'INVOICE_NOT_FOUND');
  END IF;

  IF v_invoice.tenant_id <> v_caller_tenant_id THEN
    RETURN jsonb_build_object('ok', false, 'error', 'UNAUTHORIZED');
  END IF;

  IF v_invoice.status <> 'pending' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'INVOICE_NOT_PENDING');
  END IF;

  -- 3. Cancel the invoice
  UPDATE public.subscription_invoices
  SET status = 'cancelled'
  WHERE id = p_invoice_id;

  RETURN jsonb_build_object('ok', true);
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.cancel_pending_invoice(uuid) TO authenticated;
