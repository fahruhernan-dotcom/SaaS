-- Migration: Fix Nested RLS Policies for Sembako Sub-records
-- Problem: "new row violates row-level security policy for table sembako_stock_batches"
-- Cause: Using FOR ALL USING with EXISTS (nested SELECT) on tables that already have their own RLS causes scoping issues during INSERTs.
-- Solution: Revert these tables to use the standard direct `tenant_id = get_my_tenant_id()` policy.

DO $$ 
BEGIN

    -- Hapus semua bentuk policy yang mungkin nyangkut di tabel-tabel ini
    DROP POLICY IF EXISTS "Inherited Tenant Policy" ON public.sembako_stock_batches;
    DROP POLICY IF EXISTS "Tenants Access Policy" ON public.sembako_stock_batches;
    DROP POLICY IF EXISTS "tenant_isolation_sembako_stock_batches" ON public.sembako_stock_batches;
    
    DROP POLICY IF EXISTS "Inherited Tenant Policy" ON public.sembako_payroll;
    DROP POLICY IF EXISTS "Tenants Access Policy" ON public.sembako_payroll;
    DROP POLICY IF EXISTS "tenant_isolation_sembako_payroll" ON public.sembako_payroll;

    DROP POLICY IF EXISTS "Inherited Tenant Policy" ON public.sembako_stock_out;
    DROP POLICY IF EXISTS "Tenants Access Policy" ON public.sembako_stock_out;
    DROP POLICY IF EXISTS "tenant_isolation_sembako_stock_out" ON public.sembako_stock_out;

    -- CREATE BULLETPROOF POLICY (Bypass get_my_tenant_id function yang rawan error cache multi-tenant)
    CREATE POLICY "tenant_isolation_sembako_stock_batches" ON public.sembako_stock_batches 
    FOR ALL TO authenticated 
    USING (tenant_id IN (SELECT tenant_id FROM public.profiles WHERE auth_user_id = auth.uid()))
    WITH CHECK (tenant_id IN (SELECT tenant_id FROM public.profiles WHERE auth_user_id = auth.uid()));

    CREATE POLICY "tenant_isolation_sembako_payroll" ON public.sembako_payroll 
    FOR ALL TO authenticated 
    USING (tenant_id IN (SELECT tenant_id FROM public.profiles WHERE auth_user_id = auth.uid()))
    WITH CHECK (tenant_id IN (SELECT tenant_id FROM public.profiles WHERE auth_user_id = auth.uid()));

    CREATE POLICY "tenant_isolation_sembako_stock_out" ON public.sembako_stock_out 
    FOR ALL TO authenticated 
    USING (tenant_id IN (SELECT tenant_id FROM public.profiles WHERE auth_user_id = auth.uid()))
    WITH CHECK (tenant_id IN (SELECT tenant_id FROM public.profiles WHERE auth_user_id = auth.uid()));

END $$;
