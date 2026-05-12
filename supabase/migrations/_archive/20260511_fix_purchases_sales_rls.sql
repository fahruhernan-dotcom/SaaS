-- ============================================================
-- FINAL RLS FIX (Production-Safe / Multi-Tenant Safe)
-- Tables:
--   purchases
--   sales
--
-- Improvements:
-- ✅ Consistent EXISTS-based policies (sama dengan deliveries)
-- ✅ Safe for multi-tenant users
-- ✅ Menghindari scalar subquery error
-- ✅ PostgREST embedded join compatibility
-- ============================================================

-- 1. Enable RLS (if not already enabled)
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies (jika ada)
DROP POLICY IF EXISTS "Users can view purchases for their tenant" ON public.purchases;
DROP POLICY IF EXISTS "purchases_insert" ON public.purchases;
DROP POLICY IF EXISTS "purchases_update" ON public.purchases;
DROP POLICY IF EXISTS "purchases_delete" ON public.purchases;
DROP POLICY IF EXISTS "purchases_select" ON public.purchases;

DROP POLICY IF EXISTS "Users can view sales for their tenant" ON public.sales;
DROP POLICY IF EXISTS "sales_insert" ON public.sales;
DROP POLICY IF EXISTS "sales_update" ON public.sales;
DROP POLICY IF EXISTS "sales_delete" ON public.sales;
DROP POLICY IF EXISTS "sales_select" ON public.sales;

-- 3. Create Policies for `purchases`
CREATE POLICY purchases_select
ON public.purchases
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.auth_user_id = auth.uid()
      AND p.tenant_id = purchases.tenant_id
  )
  OR public.is_superadmin()
);

CREATE POLICY purchases_insert
ON public.purchases
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.auth_user_id = auth.uid()
      AND p.tenant_id = purchases.tenant_id
  )
);

CREATE POLICY purchases_update
ON public.purchases
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.auth_user_id = auth.uid()
      AND p.tenant_id = purchases.tenant_id
  )
  OR public.is_superadmin()
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.auth_user_id = auth.uid()
      AND p.tenant_id = purchases.tenant_id
  )
  OR public.is_superadmin()
);

CREATE POLICY purchases_delete
ON public.purchases
FOR DELETE
TO authenticated
USING (
  public.is_superadmin()
);


-- 4. Create Policies for `sales`
CREATE POLICY sales_select
ON public.sales
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.auth_user_id = auth.uid()
      AND p.tenant_id = sales.tenant_id
  )
  OR public.is_superadmin()
);

CREATE POLICY sales_insert
ON public.sales
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.auth_user_id = auth.uid()
      AND p.tenant_id = sales.tenant_id
  )
);

CREATE POLICY sales_update
ON public.sales
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.auth_user_id = auth.uid()
      AND p.tenant_id = sales.tenant_id
  )
  OR public.is_superadmin()
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.auth_user_id = auth.uid()
      AND p.tenant_id = sales.tenant_id
  )
  OR public.is_superadmin()
);

CREATE POLICY sales_delete
ON public.sales
FOR DELETE
TO authenticated
USING (
  public.is_superadmin()
);
