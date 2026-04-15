-- Add province column to tenants table for onboarding and regional filtering
ALTER TABLE public.tenants
  ADD COLUMN IF NOT EXISTS province TEXT DEFAULT NULL;

-- Index to speed up regional filtering queries
CREATE INDEX IF NOT EXISTS idx_tenants_province ON public.tenants(province);

COMMENT ON COLUMN public.tenants.province IS 'Provinsi lokasi bisnis. Diisi saat onboarding. Dipakai untuk filter harga pasar regional.';
