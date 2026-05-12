-- ============================================================
-- TernakOS — Breeding Kambing & Domba
-- Tables: kd_breeding_animals, kd_breeding_weight_records,
--         kd_breeding_mating_records, kd_breeding_births,
--         kd_breeding_health_logs, kd_breeding_feed_logs,
--         kd_breeding_sales
-- ============================================================

-- ──────────────────────────────────────────────
-- 1. ANIMALS (master per-ekor + pedigree)
-- ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS kd_breeding_animals (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id            UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

  -- Identity
  ear_tag              TEXT NOT NULL,
  name                 TEXT,
  species              TEXT NOT NULL CHECK (species IN ('kambing','domba')),
  sex                  TEXT NOT NULL CHECK (sex IN ('jantan','betina','kastrasi')),
  birth_date           DATE,
  birth_weight_kg      NUMERIC(5,2),
  birth_type           TEXT CHECK (birth_type IN ('tunggal','kembar2','kembar3plus')),

  -- Pedigree (self-referential)
  dam_id               UUID REFERENCES kd_breeding_animals(id),
  sire_id              UUID REFERENCES kd_breeding_animals(id),

  -- Genetics
  breed                TEXT,
  breed_composition    TEXT,
  generation           TEXT,   -- F1 / F2 / F3 / murni
  origin               TEXT CHECK (origin IN ('lokal','impor','hasil_ib')),
  genetic_notes        TEXT,

  -- Classification
  purpose              TEXT CHECK (purpose IN ('pejantan_unggul','indukan','calon_bibit','afkir')),
  selection_class      TEXT CHECK (selection_class IN ('elite','grade_a','grade_b','afkir')),
  phenotype_score      NUMERIC(3,1),

  -- Status
  status               TEXT NOT NULL DEFAULT 'aktif'
                          CHECK (status IN ('aktif','afkir','mati','terjual')),

  -- Cached latest metrics (updated by trigger)
  latest_weight_kg     NUMERIC(6,2),
  latest_weight_date   DATE,
  latest_bcs           NUMERIC(3,1),

  is_deleted           BOOLEAN NOT NULL DEFAULT FALSE,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_kd_breeding_animals_tenant ON kd_breeding_animals(tenant_id);
CREATE INDEX IF NOT EXISTS idx_kd_breeding_animals_status ON kd_breeding_animals(tenant_id, status) WHERE NOT is_deleted;
CREATE UNIQUE INDEX IF NOT EXISTS uq_kd_breeding_animals_tag ON kd_breeding_animals(tenant_id, ear_tag) WHERE NOT is_deleted;

-- ──────────────────────────────────────────────
-- 2. WEIGHT RECORDS
-- ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS kd_breeding_weight_records (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  animal_id       UUID NOT NULL REFERENCES kd_breeding_animals(id) ON DELETE CASCADE,

  weigh_date      DATE NOT NULL,
  weight_kg       NUMERIC(6,2) NOT NULL,
  age_days        INT,
  adg_since_last  NUMERIC(7,2),
  bcs             NUMERIC(3,1) CHECK (bcs BETWEEN 1 AND 5),
  notes           TEXT,
  recorded_by     TEXT,

  is_deleted      BOOLEAN NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_kd_breeding_weight_animal ON kd_breeding_weight_records(animal_id, weigh_date);
CREATE INDEX IF NOT EXISTS idx_kd_breeding_weight_tenant ON kd_breeding_weight_records(tenant_id);

-- ──────────────────────────────────────────────
-- 3. MATING RECORDS
-- ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS kd_breeding_mating_records (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id              UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

  dam_id                 UUID NOT NULL REFERENCES kd_breeding_animals(id),
  sire_id                UUID REFERENCES kd_breeding_animals(id),
  semen_code             TEXT,

  estrus_date            DATE,
  mating_date            DATE NOT NULL,
  method                 TEXT NOT NULL CHECK (method IN ('alami','ib')),

  est_partus_date        DATE,
  pregnancy_confirmed    BOOLEAN DEFAULT FALSE,
  pregnancy_confirm_date DATE,
  pregnancy_method       TEXT CHECK (pregnancy_method IN ('usg','palpasi','visual')),
  fetus_count            INT,

  status                 TEXT NOT NULL DEFAULT 'menunggu'
                           CHECK (status IN ('menunggu','bunting','gagal','melahirkan')),
  notes                  TEXT,

  is_deleted             BOOLEAN NOT NULL DEFAULT FALSE,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_kd_breeding_mating_dam    ON kd_breeding_mating_records(dam_id);
CREATE INDEX IF NOT EXISTS idx_kd_breeding_mating_tenant ON kd_breeding_mating_records(tenant_id) WHERE NOT is_deleted;

-- ──────────────────────────────────────────────
-- 4. BIRTHS (Partus)
-- ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS kd_breeding_births (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  mating_record_id    UUID REFERENCES kd_breeding_mating_records(id),
  dam_id              UUID NOT NULL REFERENCES kd_breeding_animals(id),

  partus_date         DATE NOT NULL,
  partus_time         TIME,
  birth_type          TEXT CHECK (birth_type IN ('tunggal','kembar2','kembar3plus')),
  total_born          INT NOT NULL DEFAULT 1,
  total_born_alive    INT NOT NULL DEFAULT 1,
  total_born_dead     INT GENERATED ALWAYS AS (total_born - total_born_alive) STORED,

  assisted            BOOLEAN DEFAULT FALSE,
  colostrum_given     BOOLEAN DEFAULT TRUE,
  placenta_expelled   BOOLEAN DEFAULT TRUE,
  dam_condition       TEXT,
  notes               TEXT,

  is_deleted          BOOLEAN NOT NULL DEFAULT FALSE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_kd_breeding_births_dam    ON kd_breeding_births(dam_id);
CREATE INDEX IF NOT EXISTS idx_kd_breeding_births_tenant ON kd_breeding_births(tenant_id, partus_date) WHERE NOT is_deleted;

-- ──────────────────────────────────────────────
-- 5. HEALTH LOGS
-- ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS kd_breeding_health_logs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  animal_id       UUID NOT NULL REFERENCES kd_breeding_animals(id) ON DELETE CASCADE,

  log_date        DATE NOT NULL,
  log_type        TEXT NOT NULL
                    CHECK (log_type IN ('vaksinasi','obat_cacing','sakit','kematian','lainnya')),
  vaccine_name    TEXT,
  drug_name       TEXT,
  dose            TEXT,
  route           TEXT,
  symptoms        TEXT,
  diagnosis       TEXT,
  treatment       TEXT,
  outcome         TEXT,
  notes           TEXT,
  recorded_by     TEXT,

  is_deleted      BOOLEAN NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_kd_breeding_health_animal ON kd_breeding_health_logs(animal_id, log_date);
CREATE INDEX IF NOT EXISTS idx_kd_breeding_health_tenant ON kd_breeding_health_logs(tenant_id, log_date) WHERE NOT is_deleted;

-- ──────────────────────────────────────────────
-- 6. FEED LOGS (per kandang/kelompok)
-- ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS kd_breeding_feed_logs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

  log_date        DATE NOT NULL,
  group_name      TEXT NOT NULL,
  head_count      INT,

  hijauan_kg      NUMERIC(8,2) NOT NULL DEFAULT 0,
  konsentrat_kg   NUMERIC(8,2) NOT NULL DEFAULT 0,
  dedak_kg        NUMERIC(8,2) NOT NULL DEFAULT 0,
  mineral_kg      NUMERIC(8,2) NOT NULL DEFAULT 0,
  sisa_kg         NUMERIC(8,2) NOT NULL DEFAULT 0,
  consumed_kg     NUMERIC(8,2) GENERATED ALWAYS AS (
                    GREATEST(0, hijauan_kg + konsentrat_kg + dedak_kg + mineral_kg - sisa_kg)
                  ) STORED,

  notes           TEXT,
  is_deleted      BOOLEAN NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_kd_breeding_feed_tenant ON kd_breeding_feed_logs(tenant_id, log_date) WHERE NOT is_deleted;

-- ──────────────────────────────────────────────
-- 7. SALES
-- ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS kd_breeding_sales (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  animal_id         UUID NOT NULL REFERENCES kd_breeding_animals(id),

  sale_date         DATE NOT NULL,
  product_type      TEXT NOT NULL
                      CHECK (product_type IN ('bibit_jantan','bibit_betina','cempe_sapih','afkir','lainnya')),
  buyer_name        TEXT,
  price_per_head    NUMERIC(12,2) NOT NULL,
  weight_at_sale_kg NUMERIC(6,2),
  notes             TEXT,

  is_deleted        BOOLEAN NOT NULL DEFAULT FALSE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_kd_breeding_sales_tenant ON kd_breeding_sales(tenant_id, sale_date) WHERE NOT is_deleted;

-- ============================================================
-- RLS POLICIES
-- ============================================================

DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'kd_breeding_animals',
    'kd_breeding_weight_records',
    'kd_breeding_mating_records',
    'kd_breeding_births',
    'kd_breeding_health_logs',
    'kd_breeding_feed_logs',
    'kd_breeding_sales'
  ] LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', tbl);
    EXECUTE format('DROP POLICY IF EXISTS "tenant_%s" ON %I', tbl, tbl);
    EXECUTE format(
      'CREATE POLICY "tenant_%s" ON %I
         FOR ALL USING (
           tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid())
         )',
      tbl, tbl
    );
  END LOOP;
END $$;

-- ============================================================
-- AUTO updated_at TRIGGERS
-- ============================================================

DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'kd_breeding_animals',
    'kd_breeding_mating_records'
  ] LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS set_updated_at_%s ON %I', tbl, tbl);
    EXECUTE format(
      'CREATE TRIGGER set_updated_at_%s
       BEFORE UPDATE ON %I
       FOR EACH ROW EXECUTE FUNCTION public.set_updated_at()',
      tbl, tbl
    );
  END LOOP;
END $$;

-- ============================================================
-- TRIGGER: Sync latest_weight on kd_breeding_animals
-- ============================================================

CREATE OR REPLACE FUNCTION trg_kd_breeding_sync_animal_latest_weight()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  UPDATE kd_breeding_animals
  SET
    latest_weight_kg   = NEW.weight_kg,
    latest_weight_date = NEW.weigh_date,
    latest_bcs         = NEW.bcs,
    updated_at         = NOW()
  WHERE id = NEW.animal_id
    AND (
      latest_weight_date IS NULL
      OR NEW.weigh_date >= latest_weight_date
    );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_kd_breeding_weight_sync ON kd_breeding_weight_records;
CREATE TRIGGER trg_kd_breeding_weight_sync
  AFTER INSERT OR UPDATE ON kd_breeding_weight_records
  FOR EACH ROW EXECUTE FUNCTION trg_kd_breeding_sync_animal_latest_weight();

-- ============================================================
-- TRIGGER: Auto set status='mati' when kematian health log added
-- ============================================================

CREATE OR REPLACE FUNCTION trg_kd_breeding_mark_dead()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.log_type = 'kematian' THEN
    UPDATE kd_breeding_animals
    SET status = 'mati', updated_at = NOW()
    WHERE id = NEW.animal_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_kd_breeding_health_mark_dead ON kd_breeding_health_logs;
CREATE TRIGGER trg_kd_breeding_health_mark_dead
  AFTER INSERT ON kd_breeding_health_logs
  FOR EACH ROW EXECUTE FUNCTION trg_kd_breeding_mark_dead();

-- ============================================================
-- TRIGGER: Auto-calculate est_partus_date (mating_date + 150 days)
-- ============================================================

CREATE OR REPLACE FUNCTION trg_kd_breeding_mating_defaults()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.est_partus_date IS NULL AND NEW.mating_date IS NOT NULL THEN
    NEW.est_partus_date := NEW.mating_date + INTERVAL '150 days';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_kd_breeding_mating_defaults ON kd_breeding_mating_records;
CREATE TRIGGER trg_kd_breeding_mating_defaults
  BEFORE INSERT ON kd_breeding_mating_records
  FOR EACH ROW EXECUTE FUNCTION trg_kd_breeding_mating_defaults();

-- ============================================================
-- TRIGGER: Auto-update mating status to 'melahirkan' on birth
-- ============================================================

CREATE OR REPLACE FUNCTION trg_kd_breeding_birth_update_mating()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.mating_record_id IS NOT NULL THEN
    UPDATE kd_breeding_mating_records
    SET status = 'melahirkan', updated_at = NOW()
    WHERE id = NEW.mating_record_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_kd_breeding_birth_mating ON kd_breeding_births;
CREATE TRIGGER trg_kd_breeding_birth_mating
  AFTER INSERT ON kd_breeding_births
  FOR EACH ROW EXECUTE FUNCTION trg_kd_breeding_birth_update_mating();
