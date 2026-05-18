-- Phase 6.0B — Pre-auth Safe Logging
-- =============================================================================
-- Problem:
--   system_error_logs INSERT policy requires user_id = auth.uid(). Errors thrown
--   before a session exists (Login/Register/AuthCallback failures) cannot be
--   inserted by the user themselves — auth.uid() returns NULL for anon.
--
-- Solution:
--   A narrow SECURITY DEFINER RPC `log_pre_auth_error` that:
--     - Accepts a tightly-bounded payload (no tenant/role/vertical/user_id input).
--     - Forces source = 'auth' (callers cannot impersonate other sources).
--     - Stamps a sentinel user_id ('0000…0000') so superadmin can filter pre-auth.
--     - Truncates string lengths.
--     - Rejects non-object metadata.
--     - Strips known sensitive top-level metadata keys (defense-in-depth on top
--       of the frontend recursive redaction).
--   Anon and authenticated may EXECUTE; direct INSERT on the table stays locked
--   to authenticated users with own user_id (existing RLS unchanged).
--
-- Run manually in Supabase SQL Editor. Idempotent (CREATE OR REPLACE + re-grant).
-- =============================================================================

CREATE OR REPLACE FUNCTION public.log_pre_auth_error(
  p_source        text,
  p_component     text,
  p_action_name   text,
  p_error_code    text,
  p_error_message text,
  p_page_path     text,
  p_metadata      jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_clean_metadata jsonb;
BEGIN
  -- Reject non-object metadata → coerce to empty object.
  IF p_metadata IS NULL OR jsonb_typeof(p_metadata) <> 'object' THEN
    v_clean_metadata := '{}'::jsonb;
  ELSE
    v_clean_metadata := p_metadata;
  END IF;

  -- Defense-in-depth: strip known sensitive top-level keys.
  -- (Frontend redactor handles nested keys recursively; this catches accidents.)
  v_clean_metadata := v_clean_metadata
    - 'password'      - 'token'         - 'access_token'  - 'refresh_token'
    - 'authorization' - 'bearer'        - 'cookie'
    - 'apikey'        - 'api_key'       - 'secret'
    - 'otp'           - 'magic_link'    - 'email';

  INSERT INTO public.system_error_logs (
    level, source, vertical, role, tenant_id, user_id,
    page_path, component, action_name,
    error_code, error_message,
    metadata, app_version
  ) VALUES (
    'error',
    'auth',                                                -- forced; ignores p_source
    NULL, NULL, NULL,
    '00000000-0000-0000-0000-000000000000'::uuid,          -- sentinel: pre-auth marker
    LEFT(COALESCE(p_page_path, ''), 500),
    LEFT(COALESCE(p_component, ''), 200),
    LEFT(COALESCE(p_action_name, ''), 200),
    LEFT(COALESCE(p_error_code, ''), 100),
    LEFT(COALESCE(p_error_message, ''), 500),
    v_clean_metadata,
    'v0.9.4'
  );
END;
$$;

-- Function is owned by postgres (or table owner) and runs SECURITY DEFINER,
-- so it bypasses the table's RLS without granting direct INSERT to anon.
GRANT EXECUTE ON FUNCTION public.log_pre_auth_error(text, text, text, text, text, text, jsonb)
  TO anon, authenticated;

-- =============================================================================
-- Verification (run in SQL Editor after migration):
-- =============================================================================
-- 1. As anon (or via supabase.rpc client without session):
--    SELECT public.log_pre_auth_error(
--      'auth', 'TestComponent', 'test.action',
--      'TEST_001', 'Pre-auth test message',
--      '/login', '{"method":"email"}'::jsonb
--    );
--    Expected: row inserted with user_id = sentinel.
--
-- 2. As superadmin:
--    SELECT id, source, user_id, component, action_name, error_message
--    FROM public.system_error_logs
--    WHERE user_id = '00000000-0000-0000-0000-000000000000'
--    ORDER BY created_at DESC LIMIT 5;
--    Expected: rows visible (sel_superadmin_select policy).
--
-- 3. Sensitive payload defense-in-depth:
--    SELECT public.log_pre_auth_error(
--      'auth', 'TestComponent', 'test.sensitive',
--      'TEST_002', 'Should strip secrets',
--      '/login',
--      '{"method":"email","password":"hunter2","token":"abc","safe_key":"ok"}'::jsonb
--    );
--    Expected: row has metadata = {"method":"email","safe_key":"ok"} only.
--
-- 4. Non-object metadata:
--    SELECT public.log_pre_auth_error('auth','X','y','Z','m','/p', '"string"'::jsonb);
--    Expected: row inserts with metadata = {} (coerced).
