-- =============================================================================
-- SECURITY FIX: activate_plan_trial — tambah ownership check
-- Tanpa fix ini, semua user authenticated bisa aktifkan trial
-- untuk tenant manapun (privilege abuse).
-- =============================================================================

CREATE OR REPLACE FUNCTION public.activate_plan_trial(
  p_tenant_id uuid,
  p_plan      text    DEFAULT 'pro',
  p_days      integer DEFAULT 7
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- ================================================================
  -- SECURITY CHECK: caller harus superadmin atau pemilik tenant ini
  -- ================================================================
  IF NOT (
    public.is_superadmin()
    OR EXISTS (
      SELECT 1 FROM public.profiles
       WHERE auth_user_id = auth.uid()
         AND tenant_id = p_tenant_id
    )
  ) THEN
    RAISE EXCEPTION 'Unauthorized: Anda bukan pemilik tenant ini.';
  END IF;

  -- Validasi plan yang boleh di-trial
  IF p_plan NOT IN ('pro', 'business') THEN
    RAISE EXCEPTION 'Plan trial tidak valid: %', p_plan;
  END IF;

  -- Batasi p_days untuk non-superadmin (max 30 hari)
  IF NOT public.is_superadmin() AND p_days > 30 THEN
    RAISE EXCEPTION 'Durasi trial maksimal 30 hari.';
  END IF;

  -- Cegah trial kedua: kalau trial_ends_at sudah pernah di-set, tolak
  IF EXISTS (
    SELECT 1 FROM public.tenants
     WHERE id = p_tenant_id
       AND trial_ends_at IS NOT NULL
  ) THEN
    RAISE EXCEPTION 'Trial sudah pernah digunakan untuk tenant ini.';
  END IF;

  -- Pastikan tenant ada dan plan-nya masih starter
  IF NOT EXISTS (
    SELECT 1 FROM public.tenants
     WHERE id = p_tenant_id
       AND plan = 'starter'
  ) THEN
    RAISE EXCEPTION 'Trial hanya tersedia untuk akun Starter.';
  END IF;

  UPDATE public.tenants SET
    plan          = p_plan,
    trial_ends_at = now() + (p_days || ' days')::interval
  WHERE id = p_tenant_id;
END;
$$;
