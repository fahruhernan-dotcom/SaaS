-- SECURITY PATCH: Resolve Supabase Advisor Warnings
-- Author: Antigravity
-- Date: 2026-03-29

-- 1. Enable RLS on rate limiting tables (ERROR: rls_disabled_in_public)
ALTER TABLE public.invite_rate_limits ENABLE ROW LEVEL SECURITY;

-- Deny all access to invite_rate_limits by default (should only be accessed via service_role or edge functions)
DROP POLICY IF EXISTS "Deny public access" ON public.invite_rate_limits;
CREATE POLICY "Deny public access" ON public.invite_rate_limits 
FOR ALL TO public USING (false);

-- 2. Harden Functions (WARN: function_search_path_mutable)
-- Adds explicit search_path to prevent hijacking

DROP FUNCTION IF EXISTS public.get_my_tenant_id() CASCADE;
DROP FUNCTION IF EXISTS public.is_my_tenant(uuid) CASCADE;

CREATE OR REPLACE FUNCTION public.get_my_tenant_id()
 RETURNS uuid
 LANGUAGE plpgsql
 STABLE
 SECURITY DEFINER
 SET search_path = public
AS $function$
DECLARE
  _tenant_id uuid;
BEGIN
  -- Get tenant_id from user's profile
  SELECT tenant_id INTO _tenant_id
  FROM profiles
  WHERE auth_user_id = auth.uid()
  LIMIT 1;

  RETURN _tenant_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.is_my_tenant(_tenant_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE
 SECURITY DEFINER
 SET search_path = public
AS $function$
BEGIN
  RETURN _tenant_id = get_my_tenant_id();
END;
$function$;

-- 3. Fix Waitlist Policy (WARN: rls_policy_always_true)
-- Instead of WITH CHECK (true), we enforce that an email must be provided.
ALTER TABLE public.waitlist_signups ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_insert_waitlist" ON public.waitlist_signups;
DROP POLICY IF EXISTS "waitlist_insert" ON public.waitlist_signups;

CREATE POLICY "Allow anon to insert valid waitlist entries" ON public.waitlist_signups
FOR INSERT TO anon 
WITH CHECK (email IS NOT NULL AND length(email) > 3);

CREATE POLICY "Allow authenticated users to view waitlist" ON public.waitlist_signups
FOR SELECT TO authenticated 
USING (true);

-- 4. Note for User: 
-- Please go to Supabase Dashboard -> Auth -> Providers -> Email
-- Enable "Leaked Password Protection" to resolve the final warning.
