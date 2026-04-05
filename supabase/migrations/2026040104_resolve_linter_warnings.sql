-- ============================================================
-- SQL Migration: Resolve Supabase Security Linter Warnings
-- Author: Antigravity
-- Date: 2026-04-01
-- Description: Hardens functions by setting explicit search_path.
-- Resolves: function_search_path_mutable (Warning 0011)
-- ============================================================

-- 1. HARDEN EXISTING FUNCTIONS (Explicitly setting search_path = public)

-- Audit Functions
ALTER FUNCTION public.log_audit_action() SET search_path = public;

-- Core Helper Functions
ALTER FUNCTION public.my_tenant_id() SET search_path = public;
ALTER FUNCTION public.is_my_tenant(uuid) SET search_path = public;
ALTER FUNCTION public.my_user_type() SET search_path = public;
ALTER FUNCTION public.is_superadmin() SET search_path = public;
ALTER FUNCTION public.set_updated_at() SET search_path = public;

-- Tenant Management
ALTER FUNCTION public.handle_new_user() SET search_path = public;

-- RPA & Broker Sync Functions
ALTER FUNCTION public.sync_rpa_outstanding() SET search_path = public;
ALTER FUNCTION public.sync_sale_payment() SET search_path = public;
ALTER FUNCTION public.record_market_price() SET search_path = public;
ALTER FUNCTION public.update_farm_last_transaction() SET search_path = public;

-- Peternak/Breeding Sync
ALTER FUNCTION public.update_cycle_summary() SET search_path = public;

-- Billing
ALTER FUNCTION public.generate_invoice_number() SET search_path = public;

-- Sembako Specific Functions (Missing from codebase but reported by linter)
-- We use ALTER FUNCTION to gracefully fix them without needing their full source code.
DO $$ 
BEGIN 
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'recalc_sembako_customer_balance') THEN
        ALTER FUNCTION public.recalc_sembako_customer_balance() SET search_path = public;
    END IF;

    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'tr_sync_sembako_balance') THEN
        ALTER FUNCTION public.tr_sync_sembako_balance() SET search_path = public;
    END IF;
END $$;

-- 2. SECURITY REMINDERS (Manual Action Required)

/*
   ⚠️ MANUAL ACTION REQUIRED in Supabase Dashboard:
   
   To resolve the 'auth_leaked_password_protection' warning:
   1. Go to Authentication -> Providers -> Email.
   2. Scroll to 'Security' section.
   3. Enable 'Enable Leaked Password Protection'.
   4. Click Save.
*/

-- ============================================================
-- End of Migration
-- ============================================================
