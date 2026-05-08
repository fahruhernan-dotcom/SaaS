-- ============================================================
-- FIX: Multi-tenant RLS — my_tenant_id() LIMIT 1 non-deterministic
--
-- Root cause: my_tenant_id() does LIMIT 1 without ORDER BY.
-- For users in multiple tenants (e.g. staff in peternak + broker),
-- it returns a random tenant_id — blocking access to the wrong one.
--
-- Fix: introduce is_tenant_member(uuid) and my_role_for(uuid) that
-- check the specific tenant_id column being evaluated, then bulk-
-- update all ~100 affected RLS policies via regexp replacement.
-- ============================================================


-- ── Step 1: New helper functions ────────────────────────────

CREATE OR REPLACE FUNCTION public.is_tenant_member(p_tenant_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE auth_user_id = auth.uid() AND tenant_id = p_tenant_id
  );
$$;
GRANT EXECUTE ON FUNCTION public.is_tenant_member(uuid) TO authenticated;

-- Returns the role for the current user IN a specific tenant.
-- Replaces my_role() in UPDATE policies so role check is tenant-scoped.
CREATE OR REPLACE FUNCTION public.my_role_for(p_tenant_id uuid)
RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO ''
AS $$
  SELECT role FROM public.profiles
  WHERE auth_user_id = auth.uid() AND tenant_id = p_tenant_id
  LIMIT 1;
$$;
GRANT EXECUTE ON FUNCTION public.my_role_for(uuid) TO authenticated;


-- ── Step 2: Bulk-update USING clauses ───────────────────────
-- Replaces:
--   <col>_tenant_id = my_tenant_id()       → is_tenant_member(<col>_tenant_id)
--   <col>_tenant_id = get_my_tenant_id()   → is_tenant_member(<col>_tenant_id)
--   my_role()                              → my_role_for(tenant_id)

DO $$
DECLARE
  r        RECORD;
  new_qual text;
BEGIN
  FOR r IN
    SELECT tablename, policyname, qual
    FROM pg_policies
    WHERE schemaname = 'public'
      AND (qual LIKE '%my_tenant_id%' OR qual LIKE '%get_my_tenant_id%')
    ORDER BY tablename, policyname
  LOOP
    new_qual := r.qual;

    -- Replace <any>_tenant_id = [get_]my_tenant_id() → is_tenant_member(...)
    -- [a-z_]* (not +) so plain "tenant_id" (no prefix) also matches
    -- Handles "tenant_id", "requester_tenant_id", "bc.target_tenant_id"
    new_qual := regexp_replace(
      new_qual,
      '([a-z_]+\.)?([a-z_]*tenant_id) = (get_)?my_tenant_id\(\)',
      'is_tenant_member(\1\2)',
      'g'
    );

    -- Replace my_role() → my_role_for(tenant_id)
    new_qual := replace(new_qual, 'my_role()', 'my_role_for(tenant_id)');

    IF new_qual = r.qual THEN
      RAISE NOTICE 'No change: %.%  qual: %', r.tablename, r.policyname, r.qual;
      CONTINUE;
    END IF;

    EXECUTE format(
      'ALTER POLICY %I ON public.%I USING (%s)',
      r.policyname, r.tablename, new_qual
    );
    RAISE NOTICE 'Updated USING: %.%', r.tablename, r.policyname;
  END LOOP;
END $$;


-- ── Step 3: Bulk-update WITH CHECK clauses (INSERT/UPDATE) ──

DO $$
DECLARE
  r         RECORD;
  new_check text;
BEGIN
  FOR r IN
    SELECT tablename, policyname, with_check
    FROM pg_policies
    WHERE schemaname = 'public'
      AND with_check IS NOT NULL
      AND (with_check LIKE '%my_tenant_id%'
        OR with_check LIKE '%get_my_tenant_id%'
        OR with_check LIKE '%my_role%')
    ORDER BY tablename, policyname
  LOOP
    new_check := r.with_check;

    new_check := regexp_replace(
      new_check,
      '([a-z_]+\.)?([a-z_]*tenant_id) = (get_)?my_tenant_id\(\)',
      'is_tenant_member(\1\2)',
      'g'
    );
    new_check := replace(new_check, 'my_role()', 'my_role_for(tenant_id)');

    IF new_check = r.with_check THEN CONTINUE; END IF;

    EXECUTE format(
      'ALTER POLICY %I ON public.%I WITH CHECK (%s)',
      r.policyname, r.tablename, new_check
    );
    RAISE NOTICE 'Updated WITH CHECK: %.%', r.tablename, r.policyname;
  END LOOP;
END $$;


-- ── Step 4: Verify — should return 0 rows ───────────────────

SELECT tablename, policyname, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND (
    qual       LIKE '%my_tenant_id%'
    OR qual    LIKE '%get_my_tenant_id%'
    OR with_check LIKE '%my_tenant_id%'
    OR with_check LIKE '%get_my_tenant_id%'
  )
ORDER BY tablename;
