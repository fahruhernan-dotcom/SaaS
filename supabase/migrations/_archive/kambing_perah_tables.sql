-- ═══════════════════════════════════════════════════════════════════════════════
-- TernakOS — KAMBING PERAH (DAIRY) — ENTERPRISE SCALING SCHEMA
-- Comprehensive schema with Lactation Cycles, Quality Tracking, and Inventory
-- Total: 22 Tables
-- ═══════════════════════════════════════════════════════════════════════════════

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- CORE INFRASTRUCTURE
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- 1. kambing_perah_kandangs (Location Management)
CREATE TABLE IF NOT EXISTS kambing_perah_kandangs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT CHECK (type IN ('laktasi', 'kering', 'pembesaran', 'karantina', 'jantan')),
  capacity INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. kambing_perah_animal_groups (Bulk Management)
CREATE TABLE IF NOT EXISTS kambing_perah_animal_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  group_type TEXT CHECK (group_type IN ('production', 'breeding', 'health', 'age_based')),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- ANIMAL MASTER DATA (BREEDING & DAIRY FOCUS)
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- 3. kambing_perah_breeding_animals (Master Record)
CREATE TABLE IF NOT EXISTS kambing_perah_breeding_animals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  group_id UUID REFERENCES kambing_perah_animal_groups(id) ON DELETE SET NULL,
  kandang_id UUID REFERENCES kambing_perah_kandangs(id) ON DELETE SET NULL,
  ear_tag TEXT NOT NULL,
  name TEXT,
  breed TEXT,
  sex TEXT NOT NULL DEFAULT 'betina',
  birth_date DATE,
  entry_date DATE DEFAULT CURRENT_DATE,
  entry_weight_kg NUMERIC,
  dam_id UUID REFERENCES kambing_perah_breeding_animals(id),
  sire_id UUID REFERENCES kambing_perah_breeding_animals(id),
  status TEXT DEFAULT 'aktif' CHECK (status IN ('aktif','bunting','laktasi','kering','terjual','mati','afkir')),
  current_parity INT DEFAULT 0,
  total_lifetime_yield NUMERIC DEFAULT 0,
  last_milking_date DATE,
  is_deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. kambing_perah_lactation_cycles (Scaling Productivity)
CREATE TABLE IF NOT EXISTS kambing_perah_lactation_cycles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  animal_id UUID NOT NULL REFERENCES kambing_perah_breeding_animals(id) ON DELETE CASCADE,
  start_date DATE NOT NULL, -- Kidding/Partus date
  dry_off_date DATE,
  parity_number INT NOT NULL,
  status TEXT CHECK (status IN ('active', 'completed', 'aborted')),
  total_yield_liter NUMERIC DEFAULT 0,
  peak_yield_liter NUMERIC,
  avg_daily_yield NUMERIC,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- PRODUCTION LOGS
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- 5. kambing_perah_milk_logs (Daily Yield)
CREATE TABLE IF NOT EXISTS kambing_perah_milk_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  animal_id UUID NOT NULL REFERENCES kambing_perah_breeding_animals(id) ON DELETE CASCADE,
  lactation_id UUID REFERENCES kambing_perah_lactation_cycles(id) ON DELETE SET NULL,
  log_date DATE NOT NULL DEFAULT CURRENT_DATE,
  session TEXT CHECK (session IN ('pagi','siang','sore','lainnya')),
  volume_liter NUMERIC NOT NULL DEFAULT 0,
  temperature_c NUMERIC,
  acidity_ph NUMERIC,
  operator_name TEXT,
  notes TEXT,
  is_deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. kambing_perah_milk_quality_logs (Lab & Quick Tests)
CREATE TABLE IF NOT EXISTS kambing_perah_milk_quality_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  animal_id UUID NOT NULL REFERENCES kambing_perah_breeding_animals(id) ON DELETE CASCADE,
  lactation_id UUID REFERENCES kambing_perah_lactation_cycles(id) ON DELETE SET NULL,
  test_date DATE NOT NULL DEFAULT CURRENT_DATE,
  fat_pct NUMERIC,
  snf_pct NUMERIC,
  protein_pct NUMERIC,
  scc_value INT, -- Somatic Cell Count (Enterprise requirement)
  bacteria_count INT,
  quality_grade TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- INVENTORY & SUPPLY CHAIN
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- 7. kambing_perah_inventory_items (Feed & Meds Stock)
CREATE TABLE IF NOT EXISTS kambing_perah_inventory_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('pakan_hijauan', 'pakan_konsentrat', 'obat_obatan', 'vaksin', 'peralatan', 'lainnya')),
  unit TEXT NOT NULL, -- kg, vial, liter, pcs
  stock_quantity NUMERIC DEFAULT 0,
  reorder_level NUMERIC DEFAULT 0,
  unit_price_idr NUMERIC,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. kambing_perah_inventory_transactions
CREATE TABLE IF NOT EXISTS kambing_perah_inventory_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES kambing_perah_inventory_items(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('in', 'out', 'adjustment')),
  quantity NUMERIC NOT NULL,
  transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
  reference_type TEXT, -- e.g. "purchase", "usage_feed", "usage_med"
  reference_id UUID,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- SALES & CUSTOMERS
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- 9. kambing_perah_customer_registry
CREATE TABLE IF NOT EXISTS kambing_perah_customer_registry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT CHECK (type IN ('retail', 'industrial', 'agent')),
  phone TEXT,
  address TEXT,
  loyalty_points INT DEFAULT 0,
  notes TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. kambing_perah_milk_sales
CREATE TABLE IF NOT EXISTS kambing_perah_milk_sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES kambing_perah_customer_registry(id) ON DELETE SET NULL,
  sale_date DATE NOT NULL DEFAULT CURRENT_DATE,
  buyer_name_legacy TEXT, -- fallback for fast input
  volume_liter NUMERIC NOT NULL,
  price_per_liter NUMERIC NOT NULL,
  total_revenue_idr NUMERIC NOT NULL,
  payment_method TEXT,
  is_paid BOOLEAN DEFAULT FALSE,
  notes TEXT,
  is_deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- BREEDING RECORDS (Reproduction Scaling)
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- 11. kambing_perah_breeding_mating_records
CREATE TABLE IF NOT EXISTS kambing_perah_breeding_mating_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  dam_id UUID NOT NULL REFERENCES kambing_perah_breeding_animals(id),
  sire_id UUID REFERENCES kambing_perah_breeding_animals(id),
  mating_date DATE NOT NULL,
  mating_type TEXT DEFAULT 'kawin_alam' CHECK (mating_type IN ('kawin_alam','ib')),
  expected_partus DATE,
  result TEXT DEFAULT 'menunggu' CHECK (result IN ('menunggu','bunting','gagal','abort')),
  is_deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. kambing_perah_breeding_births
CREATE TABLE IF NOT EXISTS kambing_perah_breeding_births (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  dam_id UUID NOT NULL REFERENCES kambing_perah_breeding_animals(id),
  mating_id UUID REFERENCES kambing_perah_breeding_mating_records(id),
  partus_date DATE NOT NULL,
  born_alive INT DEFAULT 0,
  born_dead INT DEFAULT 0,
  kids_ids UUID[], -- Link to kids in animal table
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- HEALTH & WEIGHT RECORDS
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- 13. kambing_perah_breeding_health_logs (Special Udder Health)
CREATE TABLE IF NOT EXISTS kambing_perah_breeding_health_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  animal_id UUID REFERENCES kambing_perah_breeding_animals(id),
  log_date DATE NOT NULL DEFAULT CURRENT_DATE,
  log_type TEXT NOT NULL DEFAULT 'pemeriksaan',
  symptoms TEXT,
  is_udder_problem BOOLEAN DEFAULT FALSE, -- Tag for mastitis tracking
  action_taken TEXT,
  medicine_item_id UUID REFERENCES kambing_perah_inventory_items(id) ON DELETE SET NULL,
  medicine_usage_qty NUMERIC,
  withdrawal_date DATE, -- Critical for milk safety
  is_deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 14. kambing_perah_breeding_weight_records
CREATE TABLE IF NOT EXISTS kambing_perah_breeding_weight_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  animal_id UUID NOT NULL REFERENCES kambing_perah_breeding_animals(id),
  weigh_date DATE NOT NULL DEFAULT CURRENT_DATE,
  weight_kg NUMERIC NOT NULL,
  bcs TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- PENGGEMUKAN MODULE (For Male Kids / Cull Animals)
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- 15. kambing_perah_penggemukan_batches
CREATE TABLE IF NOT EXISTS kambing_perah_penggemukan_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  batch_code TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 16. kambing_perah_penggemukan_animals
CREATE TABLE IF NOT EXISTS kambing_perah_penggemukan_animals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  batch_id UUID REFERENCES kambing_perah_penggemukan_batches(id),
  ear_tag TEXT NOT NULL,
  sex TEXT DEFAULT 'jantan',
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 17. kambing_perah_penggemukan_weight_records
CREATE TABLE IF NOT EXISTS kambing_perah_penggemukan_weight_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  animal_id UUID NOT NULL REFERENCES kambing_perah_penggemukan_animals(id),
  weight_kg NUMERIC NOT NULL,
  weigh_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 18. kambing_perah_penggemukan_health_logs
CREATE TABLE IF NOT EXISTS kambing_perah_penggemukan_health_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  animal_id UUID REFERENCES kambing_perah_penggemukan_animals(id),
  log_type TEXT,
  action_taken TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 19. kambing_perah_penggemukan_sales
CREATE TABLE IF NOT EXISTS kambing_perah_penggemukan_sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  batch_id UUID REFERENCES kambing_perah_penggemukan_batches(id),
  sale_date DATE DEFAULT CURRENT_DATE,
  total_revenue_idr NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 20. kambing_perah_penggemukan_feed_logs
CREATE TABLE IF NOT EXISTS kambing_perah_penggemukan_feed_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  batch_id UUID REFERENCES kambing_perah_penggemukan_batches(id),
  log_date DATE DEFAULT CURRENT_DATE,
  feed_cost_idr NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- UTILITY: FEED FORMULATIONS
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- 21. kambing_perah_feed_formulations (Advanced Nutrient Scaling)
CREATE TABLE IF NOT EXISTS kambing_perah_feed_formulations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  target_group_type TEXT, -- e.g. "Lactating High", "Kid Starter"
  ingredients JSONB, -- list of items and percentages
  cost_per_kg NUMERIC,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 22. kambing_perah_breeding_feed_logs (Linked to items/formulations)
CREATE TABLE IF NOT EXISTS kambing_perah_breeding_feed_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  group_id UUID REFERENCES kambing_perah_animal_groups(id) ON DELETE SET NULL,
  formulation_id UUID REFERENCES kambing_perah_feed_formulations(id) ON DELETE SET NULL,
  log_date DATE NOT NULL DEFAULT CURRENT_DATE,
  total_qty_kg NUMERIC,
  total_cost_idr NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- SECURITY (RLS)
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN
    SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename LIKE 'kambing_perah_%'
  LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY;', tbl);
    EXECUTE format('
      DROP POLICY IF EXISTS "Tenant Isolation Policy" ON %I;
      CREATE POLICY "Tenant Isolation Policy" ON %I
        FOR ALL USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE auth_user_id = auth.uid()))
        WITH CHECK (tenant_id IN (SELECT tenant_id FROM profiles WHERE auth_user_id = auth.uid()));
    ', tbl, tbl);
  END LOOP;
END $$;

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- INDEXING FOR SCALE
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CREATE INDEX IF NOT EXISTS idx_kambing_perah_milk_animal_date ON kambing_perah_milk_logs(animal_id, log_date);
CREATE INDEX IF NOT EXISTS idx_kambing_perah_milk_lactation ON kambing_perah_milk_logs(lactation_id);
CREATE INDEX IF NOT EXISTS idx_kambing_perah_inventory_cat ON kambing_perah_inventory_items(tenant_id, category);
CREATE INDEX IF NOT EXISTS idx_kambing_perah_breeding_group ON kambing_perah_breeding_animals(group_id);
CREATE INDEX IF NOT EXISTS idx_kambing_perah_health_withdrawal ON kambing_perah_breeding_health_logs(withdrawal_date) WHERE withdrawal_date IS NOT NULL;
