-- ============================================================
-- FINAL RLS FIX (Production-Safe / Multi-Tenant Safe)
-- Tables:
--   deliveries
--   drivers
--   loss_reports
--
-- ✅ Consistent EXISTS-based policies
-- ✅ Safe for multi-tenant users
-- ✅ Avoids scalar subquery issues
-- ✅ Better PostgREST embedded join compatibility
-- ✅ Tenant-aware role authorization
-- ============================================================


-- ============================================================
-- 1. Helper Function: can_manage_drivers
--    Roles allowed: owner, admin, manajer, manager, staff
--    Roles NOT allowed: supir, staff_gudang, sales, anak_buah
-- ============================================================

CREATE OR REPLACE FUNCTION public.can_manage_drivers(
  p_tenant_id uuid
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.auth_user_id = auth.uid()
      AND p.tenant_id = p_tenant_id
      AND p.role = ANY (ARRAY[
        'owner',
        'admin',
        'manajer',
        'manager',
        'staff'
      ])
  );
$function$;

REVOKE ALL ON FUNCTION public.can_manage_drivers(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.can_manage_drivers(uuid) TO authenticated;


-- ============================================================
-- 2. deliveries
-- ============================================================

DROP POLICY IF EXISTS "Users can view deliveries for their tenant" ON public.deliveries;
DROP POLICY IF EXISTS "deliveries_select" ON public.deliveries;
DROP POLICY IF EXISTS "deliveries_insert" ON public.deliveries;
DROP POLICY IF EXISTS "deliveries_update" ON public.deliveries;
DROP POLICY IF EXISTS "deliveries_delete" ON public.deliveries;
DROP POLICY IF EXISTS "Tenant Isolation Policy" ON public.deliveries;

CREATE POLICY deliveries_select
ON public.deliveries FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.auth_user_id = auth.uid()
      AND p.tenant_id = deliveries.tenant_id
  )
  OR public.is_superadmin()
);

CREATE POLICY deliveries_insert
ON public.deliveries FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.auth_user_id = auth.uid()
      AND p.tenant_id = deliveries.tenant_id
  )
);

CREATE POLICY deliveries_update
ON public.deliveries FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.auth_user_id = auth.uid()
      AND p.tenant_id = deliveries.tenant_id
  )
  OR public.is_superadmin()
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.auth_user_id = auth.uid()
      AND p.tenant_id = deliveries.tenant_id
  )
  OR public.is_superadmin()
);

CREATE POLICY deliveries_delete
ON public.deliveries FOR DELETE TO authenticated
USING (public.is_superadmin());


-- ============================================================
-- 3. drivers
-- ============================================================

DROP POLICY IF EXISTS "drivers_select" ON public.drivers;
DROP POLICY IF EXISTS "drivers_insert" ON public.drivers;
DROP POLICY IF EXISTS "drivers_update" ON public.drivers;
DROP POLICY IF EXISTS "drivers_delete" ON public.drivers;
DROP POLICY IF EXISTS "Tenant Isolation Policy" ON public.drivers;

CREATE POLICY drivers_select
ON public.drivers FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.auth_user_id = auth.uid()
      AND p.tenant_id = drivers.tenant_id
  )
  OR public.is_superadmin()
);

CREATE POLICY drivers_insert
ON public.drivers FOR INSERT TO authenticated
WITH CHECK (
  (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.auth_user_id = auth.uid()
        AND p.tenant_id = drivers.tenant_id
    )
    AND public.can_manage_drivers(drivers.tenant_id)
  )
  OR public.is_superadmin()
);

CREATE POLICY drivers_update
ON public.drivers FOR UPDATE TO authenticated
USING (
  (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.auth_user_id = auth.uid()
        AND p.tenant_id = drivers.tenant_id
    )
    AND public.can_manage_drivers(drivers.tenant_id)
  )
  OR public.is_superadmin()
)
WITH CHECK (
  (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.auth_user_id = auth.uid()
        AND p.tenant_id = drivers.tenant_id
    )
    AND public.can_manage_drivers(drivers.tenant_id)
  )
  OR public.is_superadmin()
);

CREATE POLICY drivers_delete
ON public.drivers FOR DELETE TO authenticated
USING (public.is_superadmin());


-- ============================================================
-- 4. loss_reports
-- ============================================================

DROP POLICY IF EXISTS "loss_all" ON public.loss_reports;
DROP POLICY IF EXISTS "loss_reports_select" ON public.loss_reports;
DROP POLICY IF EXISTS "loss_reports_insert" ON public.loss_reports;
DROP POLICY IF EXISTS "loss_reports_update" ON public.loss_reports;
DROP POLICY IF EXISTS "loss_reports_delete" ON public.loss_reports;
DROP POLICY IF EXISTS "Tenant Isolation Policy" ON public.loss_reports;

CREATE POLICY loss_reports_select
ON public.loss_reports FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.auth_user_id = auth.uid()
      AND p.tenant_id = loss_reports.tenant_id
  )
  OR public.is_superadmin()
);

CREATE POLICY loss_reports_insert
ON public.loss_reports FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.auth_user_id = auth.uid()
      AND p.tenant_id = loss_reports.tenant_id
  )
);

CREATE POLICY loss_reports_update
ON public.loss_reports FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.auth_user_id = auth.uid()
      AND p.tenant_id = loss_reports.tenant_id
  )
  OR public.is_superadmin()
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.auth_user_id = auth.uid()
      AND p.tenant_id = loss_reports.tenant_id
  )
  OR public.is_superadmin()
);

CREATE POLICY loss_reports_delete
ON public.loss_reports FOR DELETE TO authenticated
USING (public.is_superadmin());


-- ============================================================
-- 5. Ensure RLS enabled
-- ============================================================

ALTER TABLE public.deliveries   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drivers      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loss_reports ENABLE ROW LEVEL SECURITY;


-- ============================================================
-- 6. Verification
-- ============================================================
-- SELECT tablename, policyname, cmd, roles, qual, with_check
-- FROM pg_policies
-- WHERE schemaname = 'public'
--   AND tablename IN ('deliveries', 'drivers', 'loss_reports')
-- ORDER BY tablename, cmd;
