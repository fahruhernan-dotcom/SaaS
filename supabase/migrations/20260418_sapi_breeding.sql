-- ============================================================
-- Migration: Breeding Sapi
-- Business model key : peternak_sapi_breeding
-- sub_type (tenants.business_vertical): peternak_sapi_breeding
--
-- Scope MVP: cow-calf / indukan (5–50 ekor)
-- Target user: peternak rakyat peserta UPSUS SIWAB
--
-- Keputusan desain:
--   - Tabel terpisah dari kd_breeding_* (species CHECK berbeda,
--     gestasi 285 vs 150 hari, IB fields lebih kaya)
--   - Satu tabel sapi_breeding_animals untuk SEMUA ekor (indukan, pejantan,
--     pedet) dengan self-ref dam_id/sire_id — pola identik KD breeding
--   - birth_type: 'tunggal' | 'kembar' — drop kembar3plus (sapi hampir tidak pernah)
--   - birth_assistance: 4 nilai terstruktur menggantikan assisted BOOLEAN KD
--     (implikasi klinis berbeda → keputusan afkir indukan)
--   - is_freemartin_risk: BOOLEAN DEFAULT FALSE, diisi app layer
--     (logic: kembar + ada jantan + ada betina → TRUE)
--   - mating tambahan: bull_name, inseminator_name, repeat_ib_count, sync_protocol
--   - est_partus_date trigger: mating_date + 285 hari (BUKAN 150 kambing)
--   - parity: INTEGER di animals — track riwayat kebuntingan indukan
--   - Tidak ada tabel kandang — cukup kandang_name TEXT untuk MVP cow-calf
--
-- Tables:
--   1. sapi_breeding_animals         — master per-ekor + pedigree (self-ref)
--   2. sapi_breeding_mating_records  — IB/kawin alam → kebuntingan → melahirkan
--   3. sapi_breeding_births          — partus per indukan
--   4. sapi_breeding_weight_records  — timbang rutin per ekor
--   5. sapi_breeding_health_logs     — kesehatan & mortalitas per ekor
--   6. sapi_breeding_feed_logs       — konsumsi pakan per kandang/kelompok
--   7. sapi_breeding_sales           — penjualan pedet / afkir per ekor
-- ============================================================


-- ──────────────────────────────────────────────────────────────
-- 1. sapi_breeding_animals
--    Satu tabel untuk semua ekor: indukan, pejantan, pedet lahir di farm
--    Self-referential: dam_id (ibu) / sire_id (bapak) untuk pedigree sederhana
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sapi_breeding_animals (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

  -- Identitas
  ear_tag         TEXT NOT NULL,
  name            TEXT,
  species         TEXT NOT NULL DEFAULT 'sapi'
                    CHECK (species IN ('sapi', 'kerbau')),
  sex             TEXT NOT NULL
                    CHECK (sex IN ('jantan', 'betina')),
  breed           TEXT,
  breed_composition TEXT,                         -- e.g. '50% Limousin, 50% PO'
  generation      TEXT
                    CHECK (generation IN ('F1', 'F2', 'F3', 'murni')),

  -- Usia & kelahiran
  birth_date      DATE,
  birth_weight_kg NUMERIC(6,2),
  birth_type      TEXT
                    CHECK (birth_type IN ('tunggal', 'kembar')),

  -- Pedigree (self-referential)
  dam_id          UUID REFERENCES sapi_breeding_animals(id) ON DELETE SET NULL,
  sire_id         UUID REFERENCES sapi_breeding_animals(id) ON DELETE SET NULL,

  -- Asal ternak
  acquisition_type TEXT NOT NULL DEFAULT 'beli'
                    CHECK (acquisition_type IN ('beli', 'lahir_sendiri', 'hibah')),
  source          TEXT,                           -- asal: pasar/peternak/daerah/lahir farm

  -- Manajemen indukan
  purpose         TEXT
                    CHECK (purpose IN ('indukan', 'pejantan', 'calon_bibit', 'afkir')),
  parity          INTEGER NOT NULL DEFAULT 0,     -- jumlah kebuntingan sebelumnya (0 = dara)
  selection_class TEXT
                    CHECK (selection_class IN ('elite', 'grade_a', 'grade_b', 'afkir')),
  phenotype_score NUMERIC(3,1),

  -- Catatan genetik
  genetic_notes   TEXT,
  origin          TEXT
                    CHECK (origin IN ('lokal', 'impor', 'hasil_ib')),

  -- Masuk farm
  entry_date      DATE,
  entry_weight_kg NUMERIC(8,2),
  entry_bcs       NUMERIC(3,1) CHECK (entry_bcs BETWEEN 1 AND 5),
  purchase_price_idr BIGINT,
  kandang_name    TEXT,                           -- paddock / kelompok kandang

  -- Status
  status          TEXT NOT NULL DEFAULT 'aktif'
                    CHECK (status IN ('aktif', 'bunting', 'afkir', 'mati', 'terjual')),
  exit_date       DATE,

  -- Bobot terakhir — denormalized, diupdate via trigger
  latest_weight_kg   NUMERIC(8,2),
  latest_weight_date DATE,
  latest_bcs         NUMERIC(3,1),

  notes           TEXT,

  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_deleted      BOOLEAN NOT NULL DEFAULT false
);

CREATE INDEX IF NOT EXISTS idx_sapi_breeding_animals_tenant
  ON sapi_breeding_animals(tenant_id);
CREATE INDEX IF NOT EXISTS idx_sapi_breeding_animals_status
  ON sapi_breeding_animals(tenant_id, status) WHERE NOT is_deleted;
CREATE INDEX IF NOT EXISTS idx_sapi_breeding_animals_dam
  ON sapi_breeding_animals(dam_id);
CREATE INDEX IF NOT EXISTS idx_sapi_breeding_animals_sire
  ON sapi_breeding_animals(sire_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_sapi_breeding_animals_tag
  ON sapi_breeding_animals(tenant_id, ear_tag) WHERE NOT is_deleted;


-- ──────────────────────────────────────────────────────────────
-- 2. sapi_breeding_mating_records
--    IB atau kawin alam: estrus → IB/kawin → kebuntingan → melahirkan
--    Kolom tambahan vs KD: bull_name, inseminator_name, repeat_ib_count, sync_protocol
--    est_partus_date diset trigger: mating_date + 285 hari (gestasi sapi)
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sapi_breeding_mating_records (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

  dam_id          UUID NOT NULL REFERENCES sapi_breeding_animals(id) ON DELETE CASCADE,
  sire_id         UUID REFERENCES sapi_breeding_animals(id) ON DELETE SET NULL,
                                                  -- null jika metode IB (pejantan tidak ada di farm)

  -- Metode perkawinan
  method          TEXT NOT NULL CHECK (method IN ('alami', 'ib')),

  -- Field khusus IB — semua nullable (tidak diisi jika kawin alam)
  bull_name       TEXT,                           -- nama pejantan donor semen
  semen_code      TEXT,                           -- kode semen / batch semen beku
  inseminator_name TEXT,                          -- nama inseminator (UPSUS SIWAB dll.)
  repeat_ib_count INTEGER NOT NULL DEFAULT 1,     -- berapa kali IB untuk kehamilan ini; S/C = sum per batch
  sync_protocol   TEXT,                           -- CIDR, PGF2α, Ovsynch, dll. (nullable)

  -- Tanggal
  estrus_date     DATE,                           -- tanggal deteksi birahi (opsional)
  mating_date     DATE NOT NULL,

  -- Kebuntingan
  est_partus_date DATE,                           -- auto-set trigger: mating_date + 285 hari
  pregnancy_confirmed    BOOLEAN DEFAULT false,
  pregnancy_confirm_date DATE,
  pregnancy_method       TEXT
                           CHECK (pregnancy_method IN ('usg', 'palpasi', 'visual')),
  fetus_count     INTEGER,                        -- untuk deteksi kembar sejak dini

  -- Status siklus
  status          TEXT NOT NULL DEFAULT 'menunggu'
                    CHECK (status IN ('menunggu', 'bunting', 'gagal', 'melahirkan')),
  notes           TEXT,

  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_deleted      BOOLEAN NOT NULL DEFAULT false
);

CREATE INDEX IF NOT EXISTS idx_sapi_breeding_mating_dam
  ON sapi_breeding_mating_records(dam_id);
CREATE INDEX IF NOT EXISTS idx_sapi_breeding_mating_tenant
  ON sapi_breeding_mating_records(tenant_id) WHERE NOT is_deleted;
CREATE INDEX IF NOT EXISTS idx_sapi_breeding_mating_status
  ON sapi_breeding_mating_records(tenant_id, status) WHERE NOT is_deleted;


-- ──────────────────────────────────────────────────────────────
-- 3. sapi_breeding_births
--    Catatan partus per indukan
--    Perbedaan utama vs KD:
--      - birth_assistance 4 nilai (bukan assisted BOOLEAN)
--      - pedet_sex, pedet_birth_weight_kg, pedet_condition
--      - retentio_placenta terpisah dari placenta_expelled
--      - is_freemartin_risk BOOLEAN — diisi app layer (kembar JB → TRUE)
--      - pedet_id nullable FK → sapi_breeding_animals
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sapi_breeding_births (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  mating_record_id    UUID REFERENCES sapi_breeding_mating_records(id) ON DELETE SET NULL,
  dam_id              UUID NOT NULL REFERENCES sapi_breeding_animals(id) ON DELETE CASCADE,

  partus_date         DATE NOT NULL,
  partus_time         TIME,
  birth_type          TEXT CHECK (birth_type IN ('tunggal', 'kembar')),

  -- Jumlah pedet
  total_born          INTEGER NOT NULL DEFAULT 1,
  total_born_alive    INTEGER NOT NULL DEFAULT 1,
  total_born_dead     INTEGER GENERATED ALWAYS AS (total_born - total_born_alive) STORED,

  -- Detail pedet — untuk kelahiran tunggal (kembar: gunakan notes/pedet_id per ekor)
  pedet_sex           TEXT CHECK (pedet_sex IN ('jantan', 'betina', 'campuran')),
                                                  -- 'campuran' untuk kembar jantan+betina
  pedet_birth_weight_kg NUMERIC(6,2),             -- bobot lahir; target Limousin/Simmental ≥ 30 kg
  pedet_condition     TEXT
                        CHECK (pedet_condition IN ('normal', 'lemah', 'mati_saat_lahir')),
  pedet_id            UUID REFERENCES sapi_breeding_animals(id) ON DELETE SET NULL,
                                                  -- nullable: diisi setelah peternak daftarkan pedet

  -- Freemartin risk — logic di app layer, bukan DB trigger
  -- Rule: birth_type='kembar' AND pedet_sex='campuran' → app set TRUE
  is_freemartin_risk  BOOLEAN NOT NULL DEFAULT false,

  -- Proses kelahiran
  birth_assistance    TEXT NOT NULL DEFAULT 'normal'
                        CHECK (birth_assistance IN (
                          'normal',           -- lahir sendiri tanpa bantuan
                          'bantuan_tangan',   -- reposisi manual
                          'alat_obstetri',    -- forsep / tali obstetri
                          'sc'                -- sectio caesarea
                        )),

  -- Pasca kelahiran — indukan
  colostrum_given     BOOLEAN DEFAULT true,
  placenta_expelled   BOOLEAN DEFAULT true,
  retentio_placenta   BOOLEAN NOT NULL DEFAULT false,
                                                  -- retensio plasenta > 12 jam — butuh tindak lanjut vet
  dam_condition       TEXT,

  notes               TEXT,

  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_deleted          BOOLEAN NOT NULL DEFAULT false
);

CREATE INDEX IF NOT EXISTS idx_sapi_breeding_births_dam
  ON sapi_breeding_births(dam_id);
CREATE INDEX IF NOT EXISTS idx_sapi_breeding_births_mating
  ON sapi_breeding_births(mating_record_id);
CREATE INDEX IF NOT EXISTS idx_sapi_breeding_births_tenant
  ON sapi_breeding_births(tenant_id, partus_date) WHERE NOT is_deleted;


-- ──────────────────────────────────────────────────────────────
-- 4. sapi_breeding_weight_records
--    Timbang rutin per ekor — indukan ditimbang sebelum IB + pasca sapih
--    weigh_method: estimasi pita ukur umum karena timbangan sapi mahal
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sapi_breeding_weight_records (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  animal_id       UUID NOT NULL REFERENCES sapi_breeding_animals(id) ON DELETE CASCADE,

  weigh_date      DATE NOT NULL,
  weight_kg       NUMERIC(8,2) NOT NULL,
  age_days        INTEGER,
  adg_since_last  NUMERIC(8,2),                   -- g/hari sejak timbang sebelumnya
  bcs             NUMERIC(3,1) CHECK (bcs BETWEEN 1 AND 5),

  weigh_method    TEXT NOT NULL DEFAULT 'timbang_langsung'
                    CHECK (weigh_method IN (
                      'timbang_langsung',
                      'estimasi_pita_ukur',
                      'estimasi_visual'
                    )),
  chest_girth_cm  NUMERIC(6,1),                   -- lingkar dada, diisi jika pita ukur

  notes           TEXT,
  recorded_by     TEXT,

  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_deleted      BOOLEAN NOT NULL DEFAULT false
);

CREATE INDEX IF NOT EXISTS idx_sapi_breeding_weight_animal
  ON sapi_breeding_weight_records(animal_id, weigh_date);
CREATE INDEX IF NOT EXISTS idx_sapi_breeding_weight_tenant
  ON sapi_breeding_weight_records(tenant_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_sapi_breeding_weight_date
  ON sapi_breeding_weight_records(animal_id, weigh_date) WHERE NOT is_deleted;


-- ──────────────────────────────────────────────────────────────
-- 5. sapi_breeding_health_logs
--    Log kesehatan per ekor: vaksinasi, obat cacing, sakit, kematian
--    Trigger: kematian → animal.status = 'mati'
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sapi_breeding_health_logs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  animal_id       UUID NOT NULL REFERENCES sapi_breeding_animals(id) ON DELETE CASCADE,

  log_date        DATE NOT NULL,
  log_type        TEXT NOT NULL
                    CHECK (log_type IN (
                      'vaksinasi',
                      'obat_cacing',
                      'sakit',
                      'kematian',
                      'lainnya'
                    )),

  vaccine_name    TEXT,
  drug_name       TEXT,
  dose            TEXT,
  route           TEXT,                           -- IM, SC, oral, dll.
  symptoms        TEXT,
  diagnosis       TEXT,
  treatment       TEXT,
  outcome         TEXT,
  death_cause     TEXT,
  death_weight_kg NUMERIC(8,2),
  loss_value_idr  BIGINT,
  handled_by      TEXT,
  notes           TEXT,
  recorded_by     TEXT,

  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_deleted      BOOLEAN NOT NULL DEFAULT false
);

CREATE INDEX IF NOT EXISTS idx_sapi_breeding_health_animal
  ON sapi_breeding_health_logs(animal_id);
CREATE INDEX IF NOT EXISTS idx_sapi_breeding_health_batch
  ON sapi_breeding_health_logs(tenant_id, log_date);
CREATE INDEX IF NOT EXISTS idx_sapi_breeding_health_type
  ON sapi_breeding_health_logs(tenant_id, log_type);


-- ──────────────────────────────────────────────────────────────
-- 6. sapi_breeding_feed_logs
--    Log pakan per kandang/kelompok (BUKAN per-ekor)
--    Struktur identik sapi_penggemukan_feed_logs
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sapi_breeding_feed_logs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

  log_date        DATE NOT NULL,
  kandang_name    TEXT NOT NULL,
  animal_count    INTEGER NOT NULL,

  hijauan_kg      NUMERIC(8,2) NOT NULL DEFAULT 0,
  konsentrat_kg   NUMERIC(8,2) NOT NULL DEFAULT 0,
  dedak_kg        NUMERIC(8,2) NOT NULL DEFAULT 0,
  other_feed_kg   NUMERIC(8,2) NOT NULL DEFAULT 0,
  sisa_pakan_kg   NUMERIC(8,2) NOT NULL DEFAULT 0,

  consumed_kg     NUMERIC(8,2) GENERATED ALWAYS AS (
    GREATEST(0, hijauan_kg + konsentrat_kg + dedak_kg + other_feed_kg - sisa_pakan_kg)
  ) STORED,

  feed_cost_idr   BIGINT,
  notes           TEXT,

  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_deleted      BOOLEAN NOT NULL DEFAULT false
);

CREATE INDEX IF NOT EXISTS idx_sapi_breeding_feed_tenant
  ON sapi_breeding_feed_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_sapi_breeding_feed_date
  ON sapi_breeding_feed_logs(tenant_id, log_date);
CREATE UNIQUE INDEX IF NOT EXISTS uq_sapi_breeding_feed_day
  ON sapi_breeding_feed_logs(tenant_id, kandang_name, log_date)
  WHERE NOT is_deleted;


-- ──────────────────────────────────────────────────────────────
-- 7. sapi_breeding_sales
--    Penjualan per ekor: pedet jantan/betina, pedet sapih, dara, afkir
--    product_type disesuaikan konteks cow-calf (bukan bibit bersertifikat)
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sapi_breeding_sales (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  animal_id       UUID NOT NULL REFERENCES sapi_breeding_animals(id) ON DELETE CASCADE,

  sale_date       DATE NOT NULL,
  product_type    TEXT NOT NULL
                    CHECK (product_type IN (
                      'pedet_jantan',     -- anak jantan belum sapih
                      'pedet_betina',     -- anak betina belum sapih
                      'pedet_sapih',      -- anak sudah disapih (2–4 bulan)
                      'dara',             -- betina muda belum pernah bunting
                      'afkir',            -- indukan / pejantan afkir
                      'lainnya'
                    )),

  buyer_name      TEXT NOT NULL,
  buyer_contact   TEXT,
  buyer_type      TEXT CHECK (buyer_type IN (
                    'peternak_lain',
                    'pengepul',
                    'agen_kurban',
                    'jagal_rph',
                    'eceran_langsung',
                    'lainnya'
                  )),

  sale_weight_kg  NUMERIC(8,2),
  price_type      TEXT CHECK (price_type IN ('per_kg', 'per_ekor')),
  price_amount    BIGINT NOT NULL,
  total_revenue_idr BIGINT NOT NULL,

  payment_method  TEXT CHECK (payment_method IN ('tunai', 'transfer', 'kredit')),
  is_paid         BOOLEAN NOT NULL DEFAULT false,
  paid_date       DATE,
  invoice_number  TEXT,
  notes           TEXT,

  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_deleted      BOOLEAN NOT NULL DEFAULT false
);

CREATE INDEX IF NOT EXISTS idx_sapi_breeding_sales_tenant
  ON sapi_breeding_sales(tenant_id);
CREATE INDEX IF NOT EXISTS idx_sapi_breeding_sales_animal
  ON sapi_breeding_sales(animal_id);
CREATE INDEX IF NOT EXISTS idx_sapi_breeding_sales_date
  ON sapi_breeding_sales(tenant_id, sale_date);


-- ──────────────────────────────────────────────────────────────
-- RLS — semua tabel sapi_breeding_*
-- ──────────────────────────────────────────────────────────────
ALTER TABLE sapi_breeding_animals         ENABLE ROW LEVEL SECURITY;
ALTER TABLE sapi_breeding_mating_records  ENABLE ROW LEVEL SECURITY;
ALTER TABLE sapi_breeding_births          ENABLE ROW LEVEL SECURITY;
ALTER TABLE sapi_breeding_weight_records  ENABLE ROW LEVEL SECURITY;
ALTER TABLE sapi_breeding_health_logs     ENABLE ROW LEVEL SECURITY;
ALTER TABLE sapi_breeding_feed_logs       ENABLE ROW LEVEL SECURITY;
ALTER TABLE sapi_breeding_sales           ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'sapi_breeding_animals',
    'sapi_breeding_mating_records',
    'sapi_breeding_births',
    'sapi_breeding_weight_records',
    'sapi_breeding_health_logs',
    'sapi_breeding_feed_logs',
    'sapi_breeding_sales'
  ]
  LOOP
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


-- ──────────────────────────────────────────────────────────────
-- Auto updated_at triggers
-- ──────────────────────────────────────────────────────────────
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'sapi_breeding_animals',
    'sapi_breeding_mating_records',
    'sapi_breeding_feed_logs',
    'sapi_breeding_sales'
  ]
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


-- ──────────────────────────────────────────────────────────────
-- Trigger: est_partus_date = mating_date + 285 hari
-- Gestasi sapi rata-rata 280–285 hari — pakai 285 (konservatif)
-- BUKAN 150 hari seperti kambing di KD
-- ──────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.trg_sapi_breeding_mating_defaults()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NEW.est_partus_date IS NULL THEN
    NEW.est_partus_date := NEW.mating_date + INTERVAL '285 days';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sapi_breeding_mating_defaults ON sapi_breeding_mating_records;
CREATE TRIGGER sapi_breeding_mating_defaults
  BEFORE INSERT ON sapi_breeding_mating_records
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_sapi_breeding_mating_defaults();


-- ──────────────────────────────────────────────────────────────
-- Trigger: insert births → mating_record.status = 'melahirkan'
--          + increment indukan parity
-- ──────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.trg_sapi_breeding_birth_mating()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Update status mating record
  IF NEW.mating_record_id IS NOT NULL THEN
    UPDATE public.sapi_breeding_mating_records
    SET status = 'melahirkan', updated_at = now()
    WHERE id = NEW.mating_record_id;
  END IF;

  -- Increment parity indukan — setiap kelahiran = satu siklus bunting selesai
  UPDATE public.sapi_breeding_animals
  SET parity = parity + 1, updated_at = now()
  WHERE id = NEW.dam_id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sapi_breeding_birth_mating ON sapi_breeding_births;
CREATE TRIGGER sapi_breeding_birth_mating
  AFTER INSERT ON sapi_breeding_births
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_sapi_breeding_birth_mating();


-- ──────────────────────────────────────────────────────────────
-- Trigger: sync latest_weight_* ke sapi_breeding_animals
-- ──────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.trg_sapi_breeding_weight_sync()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_latest RECORD;
BEGIN
  SELECT weigh_date, weight_kg, bcs
  INTO v_latest
  FROM public.sapi_breeding_weight_records
  WHERE animal_id = NEW.animal_id
    AND is_deleted = false
  ORDER BY weigh_date DESC, created_at DESC
  LIMIT 1;

  IF FOUND THEN
    UPDATE public.sapi_breeding_animals
    SET
      latest_weight_kg   = v_latest.weight_kg,
      latest_weight_date = v_latest.weigh_date,
      latest_bcs         = v_latest.bcs,
      updated_at         = now()
    WHERE id = NEW.animal_id;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sapi_breeding_weight_sync ON sapi_breeding_weight_records;
CREATE TRIGGER sapi_breeding_weight_sync
  AFTER INSERT OR UPDATE ON sapi_breeding_weight_records
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_sapi_breeding_weight_sync();


-- ──────────────────────────────────────────────────────────────
-- Trigger: health log kematian → animal.status = 'mati'
-- ──────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.trg_sapi_breeding_health_mark_dead()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NEW.log_type = 'kematian' AND NOT NEW.is_deleted THEN
    UPDATE public.sapi_breeding_animals
    SET status = 'mati', exit_date = NEW.log_date, updated_at = now()
    WHERE id = NEW.animal_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sapi_breeding_health_mark_dead ON sapi_breeding_health_logs;
CREATE TRIGGER sapi_breeding_health_mark_dead
  AFTER INSERT ON sapi_breeding_health_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_sapi_breeding_health_mark_dead();


-- ──────────────────────────────────────────────────────────────
-- Trigger: sale insert → animal.status = 'terjual'
-- ──────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.trg_sapi_breeding_sale_mark_sold()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NOT NEW.is_deleted THEN
    UPDATE public.sapi_breeding_animals
    SET status = 'terjual', exit_date = NEW.sale_date, updated_at = now()
    WHERE id = NEW.animal_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sapi_breeding_sale_mark_sold ON sapi_breeding_sales;
CREATE TRIGGER sapi_breeding_sale_mark_sold
  AFTER INSERT ON sapi_breeding_sales
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_sapi_breeding_sale_mark_sold();
