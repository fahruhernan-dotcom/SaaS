-- Phase 5: Vaccination tracking for breeding cycles

CREATE TABLE IF NOT EXISTS vaccination_records (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  cycle_id        UUID NOT NULL REFERENCES breeding_cycles(id) ON DELETE CASCADE,
  vaccination_date DATE NOT NULL,
  age_days        INTEGER,
  vaccine_name    TEXT NOT NULL,
  disease_target  TEXT,                          -- ND, IB, IBD, Marek, dll
  method          TEXT CHECK (method IN ('tetes_mata','air_minum','spray','suntik')),
  dose_per_bird   NUMERIC(8,4),                 -- ml atau dosis per ekor
  batch_number    TEXT,
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_deleted      BOOLEAN NOT NULL DEFAULT false
);

-- Indexes
CREATE INDEX IF NOT EXISTS vaccination_records_cycle_id_idx  ON vaccination_records(cycle_id);
CREATE INDEX IF NOT EXISTS vaccination_records_tenant_id_idx ON vaccination_records(tenant_id);

-- RLS
ALTER TABLE vaccination_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_vaccination_records" ON vaccination_records
  FOR ALL USING (tenant_id = (
    SELECT tenant_id FROM profiles WHERE id = auth.uid()
  ));
