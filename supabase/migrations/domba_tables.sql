-- ═══════════════════════════════════════════════════════════════════════════════
-- TernakOS — DOMBA TABLES MIGRATION
-- Clone dari kd_* tables, prefix domba_
-- Jalankan di Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════════════════════

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- DOMBA PENGGEMUKAN TABLES
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- 1. domba_penggemukan_batches
CREATE TABLE IF NOT EXISTS domba_penggemukan_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  batch_code TEXT NOT NULL,
  kandang_name TEXT,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  target_end_date DATE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','closed','cancelled')),
  total_animals INT DEFAULT 0,
  mortality_count INT DEFAULT 0,
  notes TEXT,
  -- KPI final (diisi saat tutup batch)
  end_date DATE,
  avg_adg_gram NUMERIC,
  avg_fcr NUMERIC,
  avg_entry_weight_kg NUMERIC,
  avg_exit_weight_kg NUMERIC,
  total_feed_cost_idr NUMERIC,
  total_revenue_idr NUMERIC,
  total_cogs_idr NUMERIC,
  net_profit_idr NUMERIC,
  rc_ratio NUMERIC,
  alive_count INT,
  sold_count INT,
  is_deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. domba_penggemukan_animals
CREATE TABLE IF NOT EXISTS domba_penggemukan_animals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  batch_id UUID REFERENCES domba_penggemukan_batches(id) ON DELETE SET NULL,
  ear_tag TEXT NOT NULL,
  breed TEXT,
  sex TEXT DEFAULT 'jantan',
  age_estimate TEXT,
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  entry_weight_kg NUMERIC,
  entry_bcs TEXT,
  entry_condition TEXT DEFAULT 'sehat',
  purchase_price_idr NUMERIC,
  source TEXT,
  kandang_slot TEXT,
  kandang_id UUID,
  quarantine_start DATE,
  quarantine_end DATE,
  quarantine_notes TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','sold','dead','culled')),
  exit_date DATE,
  latest_weight_kg NUMERIC,
  latest_weight_date DATE,
  notes TEXT,
  is_deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. domba_penggemukan_weight_records
CREATE TABLE IF NOT EXISTS domba_penggemukan_weight_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  animal_id UUID NOT NULL REFERENCES domba_penggemukan_animals(id) ON DELETE CASCADE,
  batch_id UUID REFERENCES domba_penggemukan_batches(id) ON DELETE SET NULL,
  weigh_date DATE NOT NULL DEFAULT CURRENT_DATE,
  weight_kg NUMERIC NOT NULL,
  bcs TEXT,
  days_in_farm INT,
  adg_since_last NUMERIC,
  notes TEXT,
  is_deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. domba_penggemukan_feed_logs
CREATE TABLE IF NOT EXISTS domba_penggemukan_feed_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  batch_id UUID NOT NULL REFERENCES domba_penggemukan_batches(id) ON DELETE CASCADE,
  log_date DATE NOT NULL DEFAULT CURRENT_DATE,
  kandang_name TEXT,
  animal_count INT,
  hijauan_kg NUMERIC DEFAULT 0,
  konsentrat_kg NUMERIC DEFAULT 0,
  dedak_kg NUMERIC DEFAULT 0,
  other_feed_kg NUMERIC DEFAULT 0,
  sisa_pakan_kg NUMERIC DEFAULT 0,
  feed_cost_idr NUMERIC,
  notes TEXT,
  is_deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(batch_id, kandang_name, log_date)
);

-- 5. domba_penggemukan_health_logs
CREATE TABLE IF NOT EXISTS domba_penggemukan_health_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  animal_id UUID REFERENCES domba_penggemukan_animals(id) ON DELETE SET NULL,
  batch_id UUID REFERENCES domba_penggemukan_batches(id) ON DELETE SET NULL,
  log_date DATE NOT NULL DEFAULT CURRENT_DATE,
  log_type TEXT NOT NULL DEFAULT 'pemeriksaan',
  symptoms TEXT,
  action_taken TEXT,
  medicine_name TEXT,
  medicine_dose TEXT,
  handled_by TEXT,
  outcome TEXT,
  vaccine_name TEXT,
  vaccine_next_due DATE,
  death_cause TEXT,
  death_weight_kg NUMERIC,
  loss_value_idr NUMERIC,
  notes TEXT,
  is_deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. domba_penggemukan_sales
CREATE TABLE IF NOT EXISTS domba_penggemukan_sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  batch_id UUID NOT NULL REFERENCES domba_penggemukan_batches(id) ON DELETE CASCADE,
  sale_date DATE NOT NULL DEFAULT CURRENT_DATE,
  buyer_name TEXT,
  buyer_type TEXT,
  buyer_contact TEXT,
  animal_ids UUID[],
  animal_count INT,
  total_weight_kg NUMERIC,
  avg_weight_kg NUMERIC,
  price_type TEXT,
  price_amount NUMERIC,
  total_revenue_idr NUMERIC,
  payment_method TEXT,
  is_paid BOOLEAN DEFAULT FALSE,
  paid_date DATE,
  has_skkh BOOLEAN DEFAULT FALSE,
  has_surat_jalan BOOLEAN DEFAULT FALSE,
  invoice_number TEXT,
  notes TEXT,
  is_deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. domba_kandangs
CREATE TABLE IF NOT EXISTS domba_kandangs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  batch_id UUID REFERENCES domba_penggemukan_batches(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  capacity INT DEFAULT 0,
  panjang_m NUMERIC,
  lebar_m NUMERIC,
  is_holding BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- DOMBA BREEDING TABLES
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- 8. domba_breeding_animals
CREATE TABLE IF NOT EXISTS domba_breeding_animals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  ear_tag TEXT NOT NULL,
  name TEXT,
  breed TEXT,
  sex TEXT NOT NULL DEFAULT 'betina',
  birth_date DATE,
  entry_date DATE DEFAULT CURRENT_DATE,
  entry_weight_kg NUMERIC,
  dam_id UUID REFERENCES domba_breeding_animals(id),
  sire_id UUID REFERENCES domba_breeding_animals(id),
  generation INT DEFAULT 0,
  status TEXT DEFAULT 'aktif' CHECK (status IN ('aktif','bunting','laktasi','kering','terjual','mati','afkir')),
  notes TEXT,
  is_deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. domba_breeding_mating_records
CREATE TABLE IF NOT EXISTS domba_breeding_mating_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  dam_id UUID NOT NULL REFERENCES domba_breeding_animals(id),
  sire_id UUID REFERENCES domba_breeding_animals(id),
  mating_date DATE NOT NULL,
  mating_type TEXT DEFAULT 'kawin_alam' CHECK (mating_type IN ('kawin_alam','ib')),
  inseminator TEXT,
  straw_code TEXT,
  expected_partus DATE,
  result TEXT DEFAULT 'menunggu' CHECK (result IN ('menunggu','bunting','gagal','abort')),
  pregnancy_check_date DATE,
  notes TEXT,
  is_deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. domba_breeding_births
CREATE TABLE IF NOT EXISTS domba_breeding_births (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  dam_id UUID NOT NULL REFERENCES domba_breeding_animals(id),
  mating_id UUID REFERENCES domba_breeding_mating_records(id),
  partus_date DATE NOT NULL,
  born_alive INT DEFAULT 0,
  born_dead INT DEFAULT 0,
  birth_type TEXT,
  birth_ease TEXT DEFAULT 'normal' CHECK (birth_ease IN ('normal','dibantu','caesar')),
  kids_detail JSONB DEFAULT '[]',
  notes TEXT,
  is_deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. domba_breeding_weight_records
CREATE TABLE IF NOT EXISTS domba_breeding_weight_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  animal_id UUID NOT NULL REFERENCES domba_breeding_animals(id) ON DELETE CASCADE,
  weigh_date DATE NOT NULL DEFAULT CURRENT_DATE,
  weight_kg NUMERIC NOT NULL,
  bcs TEXT,
  age_days INT,
  adg_since_last NUMERIC,
  notes TEXT,
  is_deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. domba_breeding_health_logs
CREATE TABLE IF NOT EXISTS domba_breeding_health_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  animal_id UUID REFERENCES domba_breeding_animals(id),
  log_date DATE NOT NULL DEFAULT CURRENT_DATE,
  log_type TEXT NOT NULL DEFAULT 'pemeriksaan',
  symptoms TEXT,
  diagnosis TEXT,
  treatment TEXT,
  medicine_name TEXT,
  medicine_dose TEXT,
  handled_by TEXT,
  outcome TEXT,
  notes TEXT,
  is_deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. domba_breeding_feed_logs
CREATE TABLE IF NOT EXISTS domba_breeding_feed_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  log_date DATE NOT NULL DEFAULT CURRENT_DATE,
  hijauan_kg NUMERIC DEFAULT 0,
  konsentrat_kg NUMERIC DEFAULT 0,
  dedak_kg NUMERIC DEFAULT 0,
  other_feed_kg NUMERIC DEFAULT 0,
  feed_cost_idr NUMERIC,
  animal_count INT,
  notes TEXT,
  is_deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 14. domba_breeding_sales
CREATE TABLE IF NOT EXISTS domba_breeding_sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  animal_id UUID NOT NULL REFERENCES domba_breeding_animals(id),
  sale_date DATE NOT NULL DEFAULT CURRENT_DATE,
  buyer_name TEXT,
  sale_type TEXT DEFAULT 'bibit',
  price_idr NUMERIC,
  weight_kg NUMERIC,
  age_days INT,
  notes TEXT,
  is_deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 301. RLS POLICIES (Enable RLS + tenant isolation)
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Explicitly enable RLS (Supabase UI parser needs this outside of blocks to "see" it)
ALTER TABLE domba_penggemukan_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE domba_penggemukan_animals ENABLE ROW LEVEL SECURITY;
ALTER TABLE domba_penggemukan_weight_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE domba_penggemukan_feed_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE domba_penggemukan_health_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE domba_penggemukan_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE domba_kandangs ENABLE ROW LEVEL SECURITY;
ALTER TABLE domba_breeding_animals ENABLE ROW LEVEL SECURITY;
ALTER TABLE domba_breeding_mating_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE domba_breeding_births ENABLE ROW LEVEL SECURITY;
ALTER TABLE domba_breeding_weight_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE domba_breeding_health_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE domba_breeding_feed_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE domba_breeding_sales ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN
    SELECT unnest(ARRAY[
      'domba_penggemukan_batches', 'domba_penggemukan_animals',
      'domba_penggemukan_weight_records', 'domba_penggemukan_feed_logs',
      'domba_penggemukan_health_logs', 'domba_penggemukan_sales',
      'domba_kandangs',
      'domba_breeding_animals', 'domba_breeding_mating_records',
      'domba_breeding_births', 'domba_breeding_weight_records',
      'domba_breeding_health_logs', 'domba_breeding_feed_logs',
      'domba_breeding_sales'
    ])
  LOOP
    EXECUTE format('
      DROP POLICY IF EXISTS "Tenant Isolation Policy" ON %I;
      CREATE POLICY "Tenant Isolation Policy" ON %I
        FOR ALL USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE auth_user_id = auth.uid()))
        WITH CHECK (tenant_id IN (SELECT tenant_id FROM profiles WHERE auth_user_id = auth.uid()));
    ', tbl, tbl);
  END LOOP;
END $$;

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- INDEXES
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CREATE INDEX IF NOT EXISTS idx_domba_peng_batches_tenant ON domba_penggemukan_batches(tenant_id);
CREATE INDEX IF NOT EXISTS idx_domba_peng_animals_tenant ON domba_penggemukan_animals(tenant_id);
CREATE INDEX IF NOT EXISTS idx_domba_peng_animals_batch ON domba_penggemukan_animals(batch_id);
CREATE INDEX IF NOT EXISTS idx_domba_peng_weights_animal ON domba_penggemukan_weight_records(animal_id);
CREATE INDEX IF NOT EXISTS idx_domba_peng_feed_batch ON domba_penggemukan_feed_logs(batch_id);
CREATE INDEX IF NOT EXISTS idx_domba_peng_health_batch ON domba_penggemukan_health_logs(batch_id);
CREATE INDEX IF NOT EXISTS idx_domba_peng_sales_batch ON domba_penggemukan_sales(batch_id);
CREATE INDEX IF NOT EXISTS idx_domba_kandangs_batch ON domba_kandangs(batch_id);

CREATE INDEX IF NOT EXISTS idx_domba_breed_animals_tenant ON domba_breeding_animals(tenant_id);
CREATE INDEX IF NOT EXISTS idx_domba_breed_matings_tenant ON domba_breeding_mating_records(tenant_id);
CREATE INDEX IF NOT EXISTS idx_domba_breed_births_tenant ON domba_breeding_births(tenant_id);
CREATE INDEX IF NOT EXISTS idx_domba_breed_weights_animal ON domba_breeding_weight_records(animal_id);
CREATE INDEX IF NOT EXISTS idx_domba_breed_health_tenant ON domba_breeding_health_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_domba_breed_feed_tenant ON domba_breeding_feed_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_domba_breed_sales_tenant ON domba_breeding_sales(tenant_id);

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- DATA MIGRATION (optional — uncomment if you have existing kd_* data)
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- INSERT INTO domba_penggemukan_animals (id, tenant_id, batch_id, ear_tag, breed, sex, ...)
-- SELECT id, tenant_id, batch_id, ear_tag, breed, sex, ...
-- FROM kd_penggemukan_animals WHERE species = 'domba';

-- (repeat for other tables as needed)
