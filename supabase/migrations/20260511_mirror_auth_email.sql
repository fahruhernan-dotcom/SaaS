-- =========================================================
-- MIRROR auth.users.email -> public.profiles.email
-- Production-safe version (Optimized, Hardened & Normalized)
-- =========================================================

-- ---------------------------------------------------------
-- 1. Add email column to profiles
-- ---------------------------------------------------------

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS email text;

-- ---------------------------------------------------------
-- 2. Backfill existing users (Normalized to lowercase)
-- ---------------------------------------------------------

UPDATE public.profiles p
SET email = lower(u.email)
FROM auth.users u
WHERE p.auth_user_id = u.id
AND (
  p.email IS NULL
  OR p.email IS DISTINCT FROM lower(u.email)
);

-- ---------------------------------------------------------
-- 3. Case-Insensitive Index for Admin Search Performance
-- ---------------------------------------------------------

DROP INDEX IF EXISTS idx_profiles_email;
CREATE INDEX IF NOT EXISTS idx_profiles_email_lower
ON public.profiles(lower(email));

-- ---------------------------------------------------------
-- 4. Sync email updates from auth.users (Optimized & Normalized)
-- ---------------------------------------------------------

CREATE OR REPLACE FUNCTION public.handle_user_email_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- 1. Performance Guard: Skip if email unchanged
  IF NEW.email IS NOT DISTINCT FROM OLD.email THEN
    RETURN NEW;
  END IF;

  -- 2. Sync email into profiles (Normalized to lowercase)
  UPDATE public.profiles
  SET email = lower(NEW.email)
  WHERE auth_user_id = NEW.id
  AND email IS DISTINCT FROM lower(NEW.email);

  RETURN NEW;
END;
$$;

-- ---------------------------------------------------------
-- 5. Recreate trigger safely
-- ---------------------------------------------------------

DROP TRIGGER IF EXISTS on_auth_user_email_updated
ON auth.users;

CREATE TRIGGER on_auth_user_email_updated
AFTER UPDATE OF email
ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_user_email_update();

-- ---------------------------------------------------------
-- 6. Documentation
-- ---------------------------------------------------------

COMMENT ON COLUMN public.profiles.email
IS 'Mirrored from auth.users.email for admin dashboard visibility. Lowercase normalized. Managed by triggers.';

-- ---------------------------------------------------------
-- 7. Update handle_new_user to include email (Normalized) & hardening
-- ---------------------------------------------------------

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_tenant_id uuid;
  v_user_type text;
begin
  -- Flow C: user undangan → skip, trigger invite yang handle
  if (new.raw_user_meta_data->>'invite_token') is not null then
    return new;
  end if;

  -- Flow A & B: Register baru → buat placeholder tenant
  -- OnboardingFlow akan UPDATE tenant ini dengan data lengkap
  v_user_type := coalesce(
    new.raw_user_meta_data->>'user_type', 'broker'
  );

  -- Insert placeholder tenant
  insert into tenants(
    business_name,
    owner_name,
    phone,
    plan,
    is_active
  ) values (
    coalesce(new.raw_user_meta_data->>'business_name', 'Bisnis Saya'),
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'phone',
    'starter',
    true
  )
  returning id into v_tenant_id;

  -- Insert profile owner (including mirrored & normalized email)
  insert into profiles(
    tenant_id,
    auth_user_id,
    full_name,
    email,
    role,
    user_type,
    onboarded,
    business_model_selected
  ) values (
    v_tenant_id,
    new.id,
    new.raw_user_meta_data->>'full_name',
    lower(new.email),
    'owner',
    v_user_type,
    false,
    false
  );

  return new;

exception when others then
  -- Hardening: Provisioning failure MUST fail the signup to ensure consistency.
  raise exception 'handle_new_user failed: %', sqlerrm;
end;
$function$;
