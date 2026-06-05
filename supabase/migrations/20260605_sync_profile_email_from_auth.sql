-- Migration: sync_profile_email_from_auth
-- Created: 2026-06-05
-- Purpose:
--   Record DB guard that automatically fills public.profiles.email
--   from auth.users.email when profiles are inserted/updated without email.

BEGIN;

-- 1. Idempotent backfill existing blank profile emails from auth.users
UPDATE public.profiles p
SET email = lower(au.email),
    updated_at = now()
FROM auth.users au
WHERE au.id = p.auth_user_id
  AND au.email IS NOT NULL
  AND trim(au.email) <> ''
  AND (p.email IS NULL OR trim(p.email) = '');

-- 2. Trigger function: fill email from auth.users if profile email is missing
CREATE OR REPLACE FUNCTION public.sync_profile_email_from_auth()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
DECLARE
  v_email text;
BEGIN
  IF NEW.auth_user_id IS NOT NULL
     AND (NEW.email IS NULL OR trim(NEW.email) = '') THEN

    SELECT lower(au.email)
    INTO v_email
    FROM auth.users au
    WHERE au.id = NEW.auth_user_id
    LIMIT 1;

    IF v_email IS NOT NULL AND trim(v_email) <> '' THEN
      NEW.email := v_email;
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;

-- 3. Recreate trigger exactly scoped to auth_user_id/email changes
DROP TRIGGER IF EXISTS trg_sync_profile_email_from_auth ON public.profiles;

CREATE TRIGGER trg_sync_profile_email_from_auth
BEFORE INSERT OR UPDATE OF auth_user_id, email
ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.sync_profile_email_from_auth();

-- 4. Prevent direct RPC-style invocation from client roles
REVOKE ALL ON FUNCTION public.sync_profile_email_from_auth() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.sync_profile_email_from_auth() FROM anon;
REVOKE ALL ON FUNCTION public.sync_profile_email_from_auth() FROM authenticated;

COMMIT;
