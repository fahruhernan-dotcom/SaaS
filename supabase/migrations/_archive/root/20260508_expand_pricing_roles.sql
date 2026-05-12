-- =============================================================================
-- EXPAND PRICING ROLES MIGRATION (v4 - Final Granular)
-- Tanggal: 2026-05-08
-- Deskripsi: Menambahkan dukungan untuk sub-vertical pricing yang sangat detail
--            sesuai permintaan (Ayam Broiler vs Layer, Kambing vs Domba, dll).
-- =============================================================================

-- 1. Drop constraint lama
ALTER TABLE public.pricing_plans 
DROP CONSTRAINT IF EXISTS pricing_plans_role_check;

-- 2. Tambah constraint baru dengan list LENGKAP & KONSISTEN
ALTER TABLE public.pricing_plans
ADD CONSTRAINT pricing_plans_role_check CHECK (
  role = ANY (ARRAY[
    -- Roles Dasar (Fallback)
    'broker',
    'peternak',
    'rpa',
    'egg_broker',
    'sembako_broker',
    
    -- Broker Sub-verticals
    'broker_ayam',
    'broker_telur',
    'broker_distributor',
    'broker_sembako',
    
    -- Peternak Sub-verticals (Granular)
    'peternak_ayam_broiler',
    'peternak_ayam_layer',
    'peternak_sapi_potong_fattening',
    'peternak_sapi_potong_breeding',
    'peternak_sapi_perah',
    'peternak_kambing_potong_fattening',
    'peternak_kambing_potong_breeding',
    'peternak_kambing_perah',
    'peternak_domba_potong_fattening',
    'peternak_domba_potong_breeding',
    'peternak_puyuh',
    'peternak_bebek',
    
    -- RPA Sub-verticals
    'rpa_buyer',
    'rpa_rph'
  ]::text[])
);

-- 3. Enable RLS & Public Access
ALTER TABLE public.pricing_plans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access on pricing_plans" ON public.pricing_plans;
CREATE POLICY "Allow public read access on pricing_plans" 
ON public.pricing_plans FOR SELECT 
USING (true);

GRANT SELECT ON public.pricing_plans TO anon, authenticated;

-- 4. Seed initial data (Lengkap untuk semua granular roles agar tidak kosong)
INSERT INTO public.pricing_plans (role, plan, price, original_price)
VALUES 
  -- Broker
  ('broker_ayam', 'pro', 299000, 499000),
  ('broker_ayam', 'business', 799000, 1299000),
  ('broker_telur', 'pro', 299000, 499000),
  ('broker_telur', 'business', 799000, 1299000),
  ('broker_distributor', 'pro', 299000, 499000),
  ('broker_distributor', 'business', 799000, 1299000),
  ('broker_sembako', 'pro', 249000, 349000),
  ('broker_sembako', 'business', 499000, 699000),

  -- Ayam
  ('peternak_ayam_broiler', 'pro', 149000, 249000),
  ('peternak_ayam_broiler', 'business', 449000, 699000),
  ('peternak_ayam_layer', 'pro', 149000, 249000),
  ('peternak_ayam_layer', 'business', 449000, 699000),

  -- Sapi
  ('peternak_sapi_potong_fattening', 'pro', 199000, 299000),
  ('peternak_sapi_potong_fattening', 'business', 599000, 899000),
  ('peternak_sapi_potong_breeding', 'pro', 199000, 299000),
  ('peternak_sapi_potong_breeding', 'business', 599000, 899000),
  ('peternak_sapi_perah', 'pro', 199000, 299000),
  ('peternak_sapi_perah', 'business', 599000, 899000),

  -- Kambing
  ('peternak_kambing_potong_fattening', 'pro', 149000, 249000),
  ('peternak_kambing_potong_fattening', 'business', 449000, 699000),
  ('peternak_kambing_potong_breeding', 'pro', 149000, 249000),
  ('peternak_kambing_potong_breeding', 'business', 449000, 699000),
  ('peternak_kambing_perah', 'pro', 149000, 249000),
  ('peternak_kambing_perah', 'business', 449000, 699000),

  -- Domba
  ('peternak_domba_potong_fattening', 'pro', 149000, 249000),
  ('peternak_domba_potong_fattening', 'business', 449000, 699000),
  ('peternak_domba_potong_breeding', 'pro', 149000, 249000),
  ('peternak_domba_potong_breeding', 'business', 449000, 699000),

  -- RPA
  ('rpa_buyer', 'pro', 399000, 599000),
  ('rpa_buyer', 'business', 999000, 1499000),
  ('rpa_rph', 'pro', 399000, 599000),
  ('rpa_rph', 'business', 999000, 1499000)
ON CONFLICT (role, plan) DO UPDATE 
SET price = EXCLUDED.price, 
    original_price = EXCLUDED.original_price,
    updated_at = now();
