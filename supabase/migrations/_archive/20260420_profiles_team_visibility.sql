-- Allow users to view profiles of other members in the same tenant
-- Fixes: Tim page showing 0 anggota aktif despite having staff
-- Root cause: existing "Tenant Isolation Policy" only allows auth_user_id = auth.uid()
--   so owner cannot see staff profiles via .eq('tenant_id', ...)
--
-- Strategy: use tenant_memberships (no RLS) to determine shared tenants,
--   avoiding a recursive subquery on profiles itself.

-- SECURITY DEFINER bypasses RLS when querying profiles inside the function,
-- preventing the "infinite recursion detected in policy for relation profiles" (42P17) error.
-- SECURITY DEFINER bypasses the profiles RLS policy itself (preventing recursion).
-- Only queries profiles — do NOT add tenant_memberships here since that table
-- has no migration file and its accessibility inside SECURITY DEFINER is not guaranteed.
CREATE OR REPLACE FUNCTION get_my_tenant_ids()
RETURNS SETOF uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT DISTINCT tenant_id FROM profiles
  WHERE auth_user_id = auth.uid() AND tenant_id IS NOT NULL
$$;

DROP POLICY IF EXISTS "Same tenant members can read profiles" ON public.profiles;

CREATE POLICY "Same tenant members can read profiles" ON public.profiles
FOR SELECT TO authenticated
USING (tenant_id IN (SELECT get_my_tenant_ids()));
