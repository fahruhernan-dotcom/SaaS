-- =================================================================================
-- Migration File: 2026041902_final_parity_fixes.sql
-- Description: Menambal celah RLS, tipe data, dan dependensi kolom dari hasil audit.
-- =================================================================================

-- ---------------------------------------------------------------------------------
-- FIX 1: kandang_workers.profile_id (Blocker Daily Task)
-- ---------------------------------------------------------------------------------
ALTER TABLE public.kandang_workers
  ADD COLUMN IF NOT EXISTS profile_id UUID REFERENCES public.profiles(id) DEFAULT NULL;

-- ---------------------------------------------------------------------------------
-- FIX 2: Check Constraint Profiles (Role anak_buah)
-- ---------------------------------------------------------------------------------
DO $$ 
DECLARE 
    constraint_record RECORD;
BEGIN 
    -- Drop existing check constraints on profiles table to replace it
    FOR constraint_record IN 
        SELECT conname
        FROM pg_constraint
        WHERE conrelid = 'public.profiles'::regclass AND contype = 'c'
    LOOP
        EXECUTE 'ALTER TABLE public.profiles DROP CONSTRAINT ' || quote_ident(constraint_record.conname);
    END LOOP;
END $$;

ALTER TABLE public.profiles 
  ADD CONSTRAINT profiles_role_check 
  CHECK (role IN ('owner', 'staff', 'superadmin', 'view_only', 'sopir', 'anak_buah'));

-- ---------------------------------------------------------------------------------
-- FIX 3A: RLS generated_invoices (Bulletproof Policy)
-- ---------------------------------------------------------------------------------
ALTER TABLE public.generated_invoices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tenant_isolation_generated_invoices" ON public.generated_invoices;
CREATE POLICY "tenant_isolation_generated_invoices" ON public.generated_invoices
    AS PERMISSIVE FOR ALL
    TO authenticated
    USING (tenant_id IN (SELECT tenant_id FROM public.profiles WHERE auth_user_id = auth.uid()))
    WITH CHECK (tenant_id IN (SELECT tenant_id FROM public.profiles WHERE auth_user_id = auth.uid()));

-- ---------------------------------------------------------------------------------
-- FIX 3B: RLS xendit_config (GLOBAL table, Superadmin Only)
-- ---------------------------------------------------------------------------------
ALTER TABLE public.xendit_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "superadmin_only_xendit_config" ON public.xendit_config;
CREATE POLICY "superadmin_only_xendit_config" ON public.xendit_config
    AS PERMISSIVE FOR ALL
    TO authenticated
    USING (EXISTS (SELECT 1 FROM public.profiles WHERE auth_user_id = auth.uid() AND role = 'superadmin'))
    WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE auth_user_id = auth.uid() AND role = 'superadmin'));

-- ---------------------------------------------------------------------------------
-- FIX 4: Tabel payments (is_deleted column fallback)
-- ---------------------------------------------------------------------------------
-- Menambahkan kolom is_deleted ke tabel payments (jika namanya 'payments' atau 'rpa_payments')
-- Note: 'rpa_payments' uses 'is_deleted', let's make sure it's there
DO $$ 
BEGIN
    IF EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'payments'
    ) THEN
        ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;
    END IF;
    
    IF EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'rpa_payments'
    ) THEN
        ALTER TABLE public.rpa_payments ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- ---------------------------------------------------------------------------------
-- FIX 5: tenants.province (Pendukung Onboarding & Regional)
-- ---------------------------------------------------------------------------------
ALTER TABLE public.tenants
  ADD COLUMN IF NOT EXISTS province TEXT DEFAULT NULL;

CREATE INDEX IF NOT EXISTS idx_tenants_province ON public.tenants(province);

-- =================================================================================
-- DONE
-- =================================================================================
