-- Migration: Fix onboarding tenant memberships bootstrap
-- Atomically create tenant owner membership rows on the backend database level.

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

  -- Insert owner membership row in tenant_memberships
  insert into tenant_memberships(
    tenant_id,
    auth_user_id,
    role,
    full_name
  ) values (
    v_tenant_id,
    new.id,
    'owner',
    new.raw_user_meta_data->>'full_name'
  )
  on conflict (auth_user_id, tenant_id) do nothing;

  return new;

exception when others then
  -- Hardening: Provisioning failure MUST fail the signup to ensure consistency.
  raise exception 'handle_new_user failed: %', sqlerrm;
end;
$function$;


CREATE OR REPLACE FUNCTION public.create_new_business(p_business_name text, p_business_vertical text, p_phone text DEFAULT NULL::text, p_location text DEFAULT NULL::text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
 AS $function$
DECLARE
  v_tenant_id uuid;
  v_full_name text;
BEGIN
  SELECT full_name INTO v_full_name
  FROM profiles
  WHERE auth_user_id = auth.uid()
  LIMIT 1;

  INSERT INTO tenants(
    business_name, phone, location,
    business_vertical, plan, is_active,
    trial_ends_at, kandang_limit
  ) VALUES (
    p_business_name, p_phone, p_location,
    p_business_vertical, 'starter', true,
    now() + interval '14 days', 1
  ) RETURNING id INTO v_tenant_id;

  INSERT INTO profiles(
    tenant_id, auth_user_id, full_name,
    role, user_type, onboarded,
    business_model_selected, is_active
  ) VALUES (
    v_tenant_id, auth.uid(), v_full_name,
    'owner',
    CASE p_business_vertical
      WHEN 'egg_broker' THEN 'broker'
      WHEN 'peternak' THEN 'peternak'
      WHEN 'rpa' THEN 'rpa'
      ELSE 'broker'
    END,
    true, true, true
  );

  INSERT INTO tenant_memberships(
    tenant_id,
    auth_user_id,
    role,
    full_name
  ) VALUES (
    v_tenant_id,
    auth.uid(),
    'owner',
    v_full_name
  )
  ON CONFLICT (auth_user_id, tenant_id) DO NOTHING;

  RETURN v_tenant_id;
END;
$function$;
