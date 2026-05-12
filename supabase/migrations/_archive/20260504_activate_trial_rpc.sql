-- RPC untuk aktivasi trial Pro gratis.
-- Dipanggil dari frontend (useActivateTrial hook).
-- Guard: hanya bisa dipakai sekali per tenant.

CREATE OR REPLACE FUNCTION public.activate_plan_trial(
  p_tenant_id uuid,
  p_plan      text    DEFAULT 'pro',
  p_days      integer DEFAULT 7
)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  -- Validasi plan yang boleh di-trial
  IF p_plan NOT IN ('pro', 'business') THEN
    RAISE EXCEPTION 'Plan trial tidak valid: %', p_plan;
  END IF;

  -- Cegah trial kedua: kalau trial_ends_at sudah pernah di-set, tolak
  IF EXISTS (
    SELECT 1 FROM public.tenants
    WHERE id = p_tenant_id AND trial_ends_at IS NOT NULL
  ) THEN
    RAISE EXCEPTION 'Trial sudah pernah digunakan untuk tenant ini.';
  END IF;

  -- Pastikan tenant ada dan plan-nya masih starter
  IF NOT EXISTS (
    SELECT 1 FROM public.tenants
    WHERE id = p_tenant_id AND plan = 'starter'
  ) THEN
    RAISE EXCEPTION 'Trial hanya tersedia untuk akun Starter.';
  END IF;

  UPDATE public.tenants SET
    plan          = p_plan,
    trial_ends_at = now() + (p_days || ' days')::interval
  WHERE id = p_tenant_id;
END;
$$;
