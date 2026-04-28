-- Migration: Ternak limit per plan tier
-- Adds ternak_limit config and two RPC functions for counting/fetching limits.
-- Species groups: 'domba_kambing' (combined) | 'sapi'
-- null limit = unlimited (business plan)

-- ── 1. Seed plan_configs ──────────────────────────────────────────────────────
INSERT INTO public.plan_configs (config_key, config_value, description)
VALUES (
  'ternak_limit',
  '{
    "domba_kambing": {"starter": 20, "pro": 100, "business": null},
    "sapi":          {"starter": 10, "pro": 50,  "business": null}
  }'::jsonb,
  'Batas jumlah ternak aktif per tenant. null = unlimited.'
)
ON CONFLICT (config_key) DO NOTHING;


-- ── 2. get_active_ternak_count ────────────────────────────────────────────────
-- Returns total active animals for a tenant, grouped by species_group.
-- domba_kambing: counts domba + kambing (penggemukan + breeding)
-- sapi:          counts sapi (penggemukan + breeding)
CREATE OR REPLACE FUNCTION public.get_active_ternak_count(
  p_tenant_id    uuid,
  p_species_group text   -- 'domba_kambing' | 'sapi'
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_count integer := 0;
BEGIN
  IF p_species_group = 'domba_kambing' THEN

    -- domba penggemukan: no direct tenant_id → join batch
    SELECT COUNT(*) + v_count INTO v_count
    FROM public.domba_penggemukan_animals a
    JOIN public.domba_penggemukan_batches b ON a.batch_id = b.id
    WHERE b.tenant_id = p_tenant_id
      AND a.status = 'aktif';

    -- domba breeding: tenant_id langsung
    SELECT COUNT(*) + v_count INTO v_count
    FROM public.domba_breeding_animals
    WHERE tenant_id = p_tenant_id
      AND status = 'aktif';

    -- kambing penggemukan: no direct tenant_id → join batch
    SELECT COUNT(*) + v_count INTO v_count
    FROM public.kambing_penggemukan_animals a
    JOIN public.kambing_penggemukan_batches b ON a.batch_id = b.id
    WHERE b.tenant_id = p_tenant_id
      AND a.status = 'aktif';

    -- kambing breeding: tenant_id langsung
    SELECT COUNT(*) + v_count INTO v_count
    FROM public.kambing_breeding_animals
    WHERE tenant_id = p_tenant_id
      AND status = 'aktif';

  ELSIF p_species_group = 'sapi' THEN

    -- sapi penggemukan: tenant_id langsung, status English
    SELECT COUNT(*) + v_count INTO v_count
    FROM public.sapi_penggemukan_animals
    WHERE tenant_id = p_tenant_id
      AND status = 'active';

    -- sapi breeding: tenant_id langsung, 'bunting' masih aktif
    SELECT COUNT(*) + v_count INTO v_count
    FROM public.sapi_breeding_animals
    WHERE tenant_id = p_tenant_id
      AND status IN ('aktif', 'bunting');

  END IF;

  RETURN COALESCE(v_count, 0);
END;
$$;


-- ── 3. get_ternak_limit ───────────────────────────────────────────────────────
-- Returns the animal limit for a tenant's current plan.
-- Returns NULL when the plan has no limit (unlimited).
CREATE OR REPLACE FUNCTION public.get_ternak_limit(
  p_tenant_id     uuid,
  p_species_group text   -- 'domba_kambing' | 'sapi'
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_plan   text;
  v_config jsonb;
  v_limit  jsonb;
BEGIN
  SELECT plan INTO v_plan
  FROM public.tenants
  WHERE id = p_tenant_id;

  SELECT config_value INTO v_config
  FROM public.plan_configs
  WHERE config_key = 'ternak_limit';

  v_limit := v_config -> p_species_group -> v_plan;

  -- JSON null or missing key → unlimited
  IF v_limit IS NULL OR v_limit = 'null'::jsonb THEN
    RETURN NULL;
  END IF;

  RETURN (v_limit #>> '{}')::integer;
END;
$$;


-- ── 4. Grant execute to authenticated ────────────────────────────────────────
GRANT EXECUTE ON FUNCTION public.get_active_ternak_count(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_ternak_limit(uuid, text) TO authenticated;