-- ═══════════════════════════════════════════════════════════════════════════════
-- TernakOS — OPERATIONAL COSTS TABLES
-- ═══════════════════════════════════════════════════════════════════════════════

-- 1. domba_penggemukan_operational_costs
CREATE TABLE IF NOT EXISTS domba_penggemukan_operational_costs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  batch_id UUID REFERENCES domba_penggemukan_batches(id) ON DELETE CASCADE,
  log_date DATE NOT NULL DEFAULT CURRENT_DATE,
  item_name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'lainnya', -- pakan, obat, bibit, tenaga_kerja, listrik_air, lainnya
  amount_idr NUMERIC NOT NULL DEFAULT 0,
  quantity NUMERIC DEFAULT 0,
  unit TEXT,
  notes TEXT,
  is_deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. sapi_penggemukan_operational_costs
CREATE TABLE IF NOT EXISTS sapi_penggemukan_operational_costs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  batch_id UUID REFERENCES sapi_penggemukan_batches(id) ON DELETE CASCADE,
  log_date DATE NOT NULL DEFAULT CURRENT_DATE,
  item_name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'lainnya',
  amount_idr NUMERIC NOT NULL DEFAULT 0,
  quantity NUMERIC DEFAULT 0,
  unit TEXT,
  notes TEXT,
  is_deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. kambing_penggemukan_operational_costs
CREATE TABLE IF NOT EXISTS kambing_penggemukan_operational_costs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  batch_id UUID REFERENCES kambing_penggemukan_batches(id) ON DELETE CASCADE,
  log_date DATE NOT NULL DEFAULT CURRENT_DATE,
  item_name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'lainnya',
  amount_idr NUMERIC NOT NULL DEFAULT 0,
  quantity NUMERIC DEFAULT 0,
  unit TEXT,
  notes TEXT,
  is_deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE domba_penggemukan_operational_costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE sapi_penggemukan_operational_costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE kambing_penggemukan_operational_costs ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN
    SELECT unnest(ARRAY[
      'domba_penggemukan_operational_costs',
      'sapi_penggemukan_operational_costs',
      'kambing_penggemukan_operational_costs'
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

-- Indexes
CREATE INDEX IF NOT EXISTS idx_domba_peng_ops_batch ON domba_penggemukan_operational_costs(batch_id);
CREATE INDEX IF NOT EXISTS idx_sapi_peng_ops_batch ON sapi_penggemukan_operational_costs(batch_id);
CREATE INDEX IF NOT EXISTS idx_kambing_peng_ops_batch ON kambing_penggemukan_operational_costs(batch_id);

-- Composite indexes for monthly grouping & category filtering
CREATE INDEX IF NOT EXISTS idx_domba_peng_ops_batch_date ON domba_penggemukan_operational_costs(batch_id, log_date);
CREATE INDEX IF NOT EXISTS idx_sapi_peng_ops_batch_date ON sapi_penggemukan_operational_costs(batch_id, log_date);
CREATE INDEX IF NOT EXISTS idx_kambing_peng_ops_batch_date ON kambing_penggemukan_operational_costs(batch_id, log_date);

CREATE INDEX IF NOT EXISTS idx_domba_peng_ops_batch_cat ON domba_penggemukan_operational_costs(batch_id, category);
CREATE INDEX IF NOT EXISTS idx_sapi_peng_ops_batch_cat ON sapi_penggemukan_operational_costs(batch_id, category);
CREATE INDEX IF NOT EXISTS idx_kambing_peng_ops_batch_cat ON kambing_penggemukan_operational_costs(batch_id, category);

-- Auto updated_at triggers
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN
    SELECT unnest(ARRAY[
      'domba_penggemukan_operational_costs',
      'sapi_penggemukan_operational_costs',
      'kambing_penggemukan_operational_costs'
    ])
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS set_updated_at_%s ON %I', tbl, tbl);
    EXECUTE format(
      'CREATE TRIGGER set_updated_at_%s
         BEFORE UPDATE ON %I
         FOR EACH ROW EXECUTE FUNCTION public.set_updated_at()',
      tbl, tbl
    );
  END LOOP;
END $$;
