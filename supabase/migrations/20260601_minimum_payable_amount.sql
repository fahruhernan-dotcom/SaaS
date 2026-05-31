-- Migration: Enforce minimum payable amount after voucher
-- Prevents voucher-discounted subscription checkout from producing Rp0 invoices.
-- Midtrans remains the only payment/activation path for now.

ALTER TABLE public.discount_codes
ADD COLUMN IF NOT EXISTS applies_to_billing_months integer[] DEFAULT NULL;

ALTER TABLE public.discount_codes
DROP CONSTRAINT IF EXISTS discount_codes_applies_to_billing_months_check;

ALTER TABLE public.discount_codes
ADD CONSTRAINT discount_codes_applies_to_billing_months_check
CHECK (
  applies_to_billing_months IS NULL
  OR applies_to_billing_months <@ ARRAY[1, 3, 6, 12]
);

-- Set voucher SUV9YW to only work for 3-month billing
UPDATE public.discount_codes
SET applies_to_billing_months = ARRAY[3]
WHERE code = 'SUV9YW';

CREATE OR REPLACE FUNCTION public.calculate_subscription_checkout(
  p_tenant_id uuid,
  p_plan text,
  p_billing_months integer DEFAULT 1,
  p_discount_code text DEFAULT NULL::text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_plan text := lower(trim(coalesce(p_plan, '')));
  v_months integer := coalesce(p_billing_months, 1);

  v_pricing_role text;
  v_price integer;
  v_original_amount integer;

  v_duration_rate numeric := 0;
  v_after_duration integer;
  v_duration_discount integer;

  v_code text := public.normalize_discount_code(p_discount_code);

  v_discount_id uuid := NULL;
  v_discount_type text := NULL;
  v_discount_value integer := 0;
  v_discount_is_active boolean := false;
  v_discount_expires_at timestamptz := NULL;
  v_discount_max_usage integer := NULL;
  v_discount_usage_count integer := 0;
  v_discount_applies_to_plan text := 'all';
  v_discount_applies_to_role text := 'all';
  v_discount_applies_to_billing_months integer[] := NULL;

  v_discount_amount integer := 0;
  v_final_amount integer;
  v_min_payable integer := 5000;

  v_discount_role text;
  v_role_allowed boolean := false;
BEGIN
  IF p_tenant_id IS NULL THEN
    RAISE EXCEPTION 'INVALID_TENANT: tenant_id is required';
  END IF;

  IF v_plan NOT IN ('pro', 'business') THEN
    RAISE EXCEPTION 'INVALID_PLAN: only pro/business checkout is supported';
  END IF;

  IF v_months NOT IN (1, 3, 6, 12) THEN
    RAISE EXCEPTION 'INVALID_BILLING_MONTHS: billing_months must be 1, 3, 6, or 12';
  END IF;

  IF auth.uid() IS NOT NULL
     AND NOT (public.is_tenant_member(p_tenant_id) OR public.is_superadmin()) THEN
    RAISE EXCEPTION 'ACCESS_DENIED: not a member of this tenant';
  END IF;

  v_pricing_role := public.resolve_tenant_pricing_role(p_tenant_id, v_plan);

  SELECT pp.price
  INTO v_price
  FROM public.pricing_plans pp
  WHERE lower(pp.role) = lower(v_pricing_role)
    AND lower(pp.plan) = v_plan
  LIMIT 1;

  IF v_price IS NULL THEN
    RAISE EXCEPTION 'PRICE_NOT_FOUND: no price for role % and plan %', v_pricing_role, v_plan;
  END IF;

  v_original_amount := v_price * v_months;

  v_duration_rate := CASE v_months
    WHEN 3 THEN 0.05
    WHEN 6 THEN 0.10
    WHEN 12 THEN 0.20
    ELSE 0
  END;

  v_after_duration := round(v_original_amount * (1 - v_duration_rate))::integer;
  v_duration_discount := v_original_amount - v_after_duration;

  IF v_code IS NOT NULL THEN
    SELECT
      dc.id,
      lower(dc.discount_type),
      coalesce(dc.discount_value, 0),
      coalesce(dc.is_active, false),
      dc.expires_at,
      dc.max_usage,
      coalesce(dc.usage_count, 0),
      coalesce(lower(dc.applies_to_plan), 'all'),
      coalesce(lower(dc.applies_to_role), 'all'),
      dc.applies_to_billing_months
    INTO
      v_discount_id,
      v_discount_type,
      v_discount_value,
      v_discount_is_active,
      v_discount_expires_at,
      v_discount_max_usage,
      v_discount_usage_count,
      v_discount_applies_to_plan,
      v_discount_applies_to_role,
      v_discount_applies_to_billing_months
    FROM public.discount_codes dc
    WHERE upper(dc.code) = v_code
    LIMIT 1;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'DISCOUNT_NOT_FOUND: kode diskon tidak ditemukan';
    END IF;

    IF v_discount_is_active IS NOT TRUE THEN
      RAISE EXCEPTION 'DISCOUNT_INACTIVE: kode diskon tidak aktif';
    END IF;

    IF v_discount_expires_at IS NOT NULL AND v_discount_expires_at < now() THEN
      RAISE EXCEPTION 'DISCOUNT_EXPIRED: kode diskon sudah kedaluwarsa';
    END IF;

    IF v_discount_max_usage IS NOT NULL
       AND v_discount_usage_count >= v_discount_max_usage THEN
      RAISE EXCEPTION 'DISCOUNT_USAGE_LIMIT: kuota kode diskon sudah habis';
    END IF;

    IF v_discount_applies_to_plan NOT IN ('all', v_plan) THEN
      RAISE EXCEPTION 'DISCOUNT_PLAN_NOT_ALLOWED: kode diskon tidak berlaku untuk plan ini';
    END IF;

    IF v_discount_applies_to_billing_months IS NOT NULL
       AND NOT (v_months = ANY(v_discount_applies_to_billing_months)) THEN
      RAISE EXCEPTION 'DISCOUNT_BILLING_MONTHS_NOT_ALLOWED: kode diskon tidak berlaku untuk durasi langganan ini';
    END IF;

    v_discount_role := v_discount_applies_to_role;

    v_role_allowed :=
      v_discount_role = 'all'
      OR v_discount_role = lower(v_pricing_role)
      OR (v_discount_role = 'peternak' AND lower(v_pricing_role) LIKE 'peternak%')
      OR (v_discount_role = 'broker' AND lower(v_pricing_role) LIKE 'broker%')
      OR (v_discount_role = 'rpa' AND lower(v_pricing_role) LIKE 'rpa%');

    IF NOT v_role_allowed THEN
      RAISE EXCEPTION 'DISCOUNT_ROLE_NOT_ALLOWED: kode diskon tidak berlaku untuk jenis bisnis ini';
    END IF;

    IF v_discount_type = 'percent' THEN
      v_discount_amount := round(
        v_after_duration * least(greatest(v_discount_value, 0), 100)::numeric / 100
      )::integer;
    ELSIF v_discount_type = 'nominal' THEN
      v_discount_amount := greatest(v_discount_value, 0);
    ELSE
      RAISE EXCEPTION 'DISCOUNT_TYPE_INVALID: tipe diskon tidak valid';
    END IF;

    -- Minimum payable Rp5.000 after voucher
    IF v_after_duration > v_min_payable THEN
      v_discount_amount := least(
        v_discount_amount,
        v_after_duration - v_min_payable
      );
    ELSE
      v_discount_amount := 0;
    END IF;
  END IF;

  v_final_amount := greatest(v_after_duration - v_discount_amount, 0);

  RETURN jsonb_build_object(
    'tenant_id', p_tenant_id,
    'pricing_role', v_pricing_role,
    'plan', v_plan,
    'billing_months', v_months,
    'monthly_price', v_price,
    'original_amount', v_original_amount,
    'duration_discount_amount', v_duration_discount,
    'amount_after_duration_discount', v_after_duration,
    'discount_code', v_code,
    'discount_code_id', v_discount_id,
    'discount_amount', v_discount_amount,
    'discount_applies_to_billing_months', v_discount_applies_to_billing_months,
    'minimum_payable_amount', CASE WHEN v_code IS NOT NULL THEN v_min_payable ELSE 0 END,
    'final_amount', v_final_amount
  );
END;
$function$;
