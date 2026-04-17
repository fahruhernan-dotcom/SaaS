-- ============================================================
-- Migration: Penggemukan Sapi
-- Business model key : peternak_sapi_penggemukan
-- sub_type (tenants.business_vertical): peternak_sapi_penggemukan
--
-- Prefix tabel: sapi_penggemukan_*
--   sapi        = sapi (+ kerbau future-proof via species field)
--   penggemukan = feedlot / fattening
--
-- Keputusan desain:
--   - Tabel terpisah dari kd_penggemukan_* (isolated per vertical, consistent pattern)
--   - batch_purpose: ada tapi MVP hanya expose 'potong' ke UI
--   - species: CHECK ('sapi','kerbau') — bukan purpose, future-proof untuk kerbau
--   - breed: free text, tidak di-constraint — persilangan baru terus muncul
--   - sex: 3 nilai termasuk jantan_kastrasi (umum di feedlot)
--   - acquisition_type: beli/lahir_sendiri/hibah — penting untuk kalkulasi HPP
--   - weigh_method: timbang_langsung/estimasi_pita_ukur/estimasi_visual
--   - chest_girth_cm: optional, untuk verifikasi estimasi pita ukur
--
-- Tables:
--   1. sapi_penggemukan_batches        — satu periode/batch penggemukan
--   2. sapi_penggemukan_animals        — data per ekor individual (ear tag)
--   3. sapi_penggemukan_weight_records — timbang rutin per ekor
--   4. sapi_penggemukan_feed_logs      — konsumsi pakan harian per kandang
--   5. sapi_penggemukan_health_logs    — log kesehatan & mortalitas per ekor
--   6. sapi_penggemukan_sales          — penjualan per ekor / lot
--   7. sapi_kandangs                   — manajemen kandang (helicopter view)
-- ============================================================


-- ──────────────────────────────────────────────────────────────
-- 1. sapi_penggemukan_batches
--    Satu batch = satu periode penggemukan (4–9 bulan untuk sapi)
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sapi_penggemukan_batches (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

  -- Identitas batch
  batch_code      TEXT NOT NULL,                    -- e.g. BATCH-SAPI-2026-01
  kandang_name    TEXT NOT NULL,
  start_date      DATE NOT NULL,
  target_end_date DATE,
  end_date        DATE,

  -- Tujuan batch — MVP: hanya 'potong'; field ada untuk future-proof
  batch_purpose   TEXT NOT NULL DEFAULT 'potong'
                    CHECK (batch_purpose IN ('potong', 'perah', 'bibit')),

  -- Summary (diupdate saat tutup batch)
  total_animals   INTEGER NOT NULL DEFAULT 0,
  alive_count     INTEGER,
  sold_count      INTEGER,
  mortality_count INTEGER NOT NULL DEFAULT 0,

  -- KPI final (diisi saat tutup batch)
  avg_adg_gram        NUMERIC(8,2),                 -- g/hari rata-rata batch (sapi: 800–1200 g/hari)
  avg_fcr             NUMERIC(6,3),                 -- sapi: target < 8–10
  avg_entry_weight_kg NUMERIC(8,2),
  avg_exit_weight_kg  NUMERIC(8,2),
  total_feed_cost_idr BIGINT,
  total_revenue_idr   BIGINT,
  total_cogs_idr      BIGINT,
  net_profit_idr      BIGINT,
  rc_ratio            NUMERIC(6,3),

  status          TEXT NOT NULL DEFAULT 'active'
                    CHECK (status IN ('active','closed','cancelled')),
  notes           TEXT,

  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_deleted      BOOLEAN NOT NULL DEFAULT false
);

CREATE INDEX IF NOT EXISTS sapi_penggemukan_batches_tenant_idx
  ON sapi_penggemukan_batches(tenant_id);
CREATE INDEX IF NOT EXISTS sapi_penggemukan_batches_status_idx
  ON sapi_penggemukan_batches(tenant_id, status);


-- ──────────────────────────────────────────────────────────────
-- 2. sapi_penggemukan_animals
--    Setiap ekor individual — pencatatan per ekor (ear tag)
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sapi_penggemukan_animals (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  batch_id        UUID NOT NULL REFERENCES sapi_penggemukan_batches(id) ON DELETE CASCADE,

  -- Identitas
  ear_tag         TEXT NOT NULL,                    -- e.g. SPI-2026-0001
  species         TEXT NOT NULL DEFAULT 'sapi'
                    CHECK (species IN ('sapi', 'kerbau')),
  breed           TEXT,                             -- free text: Limousin, Simmental, PO, Bali, dll
  sex             TEXT NOT NULL
                    CHECK (sex IN ('jantan', 'betina', 'jantan_kastrasi')),

  -- Usia — struktur lebih kaya dari KD karena sapi sering ada dokumen
  birth_date          DATE,                         -- nullable: exact jika ada surat / lahir sendiri
  entry_age_months    INTEGER,                      -- estimasi usia masuk dalam bulan
  age_confidence      TEXT NOT NULL DEFAULT 'estimasi'
                        CHECK (age_confidence IN (
                          'pasti',      -- ada surat lahir atau birth_date diketahui
                          'estimasi',   -- dari kondisi gigi / pengakuan penjual
                          'tidak_tahu'  -- tidak diketahui sama sekali
                        )),

  -- Asal ternak — penting untuk kalkulasi HPP yang akurat
  acquisition_type    TEXT NOT NULL DEFAULT 'beli'
                        CHECK (acquisition_type IN ('beli', 'lahir_sendiri', 'hibah')),

  -- Data masuk
  entry_date          DATE NOT NULL,
  entry_weight_kg     NUMERIC(8,2) NOT NULL,
  entry_bcs           NUMERIC(3,1),                 -- Body Condition Score 1–5
  entry_condition     TEXT CHECK (entry_condition IN ('sehat','kurus','cacat','sakit')),
  purchase_price_idr  BIGINT,                       -- 0 jika lahir_sendiri/hibah
  source              TEXT,                         -- asal: pasar/peternak/daerah
  kandang_slot        TEXT,                         -- slot kandang e.g. KDG-B3

  -- Karantina
  quarantine_start    DATE,
  quarantine_end      DATE,
  quarantine_notes    TEXT,

  -- Status akhir
  status          TEXT NOT NULL DEFAULT 'active'
                    CHECK (status IN ('active','sold','dead','culled')),
  exit_date       DATE,

  -- Bobot terakhir (denormalized untuk query cepat di list)
  latest_weight_kg    NUMERIC(8,2),
  latest_weight_date  DATE,
  latest_bcs          NUMERIC(3,1),

  -- FK ke kandang (diset via ALTER di bawah setelah sapi_kandangs dibuat)
  kandang_id      UUID,

  notes           TEXT,

  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_deleted      BOOLEAN NOT NULL DEFAULT false
);

CREATE INDEX IF NOT EXISTS sapi_penggemukan_animals_tenant_idx
  ON sapi_penggemukan_animals(tenant_id);
CREATE INDEX IF NOT EXISTS sapi_penggemukan_animals_batch_idx
  ON sapi_penggemukan_animals(batch_id);
CREATE INDEX IF NOT EXISTS sapi_penggemukan_animals_status_idx
  ON sapi_penggemukan_animals(batch_id, status);
CREATE INDEX IF NOT EXISTS sapi_penggemukan_animals_ear_tag_idx
  ON sapi_penggemukan_animals(tenant_id, ear_tag);


-- ──────────────────────────────────────────────────────────────
-- 3. sapi_penggemukan_weight_records
--    Riwayat penimbangan per ekor — sapi: 2 minggu s.d. 1 bulan sekali
--    weigh_method penting: estimasi pita ukur umum karena timbangan sapi mahal
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sapi_penggemukan_weight_records (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  animal_id       UUID NOT NULL REFERENCES sapi_penggemukan_animals(id) ON DELETE CASCADE,
  batch_id        UUID NOT NULL REFERENCES sapi_penggemukan_batches(id) ON DELETE CASCADE,

  weigh_date      DATE NOT NULL,
  days_in_farm    INTEGER,                          -- hari sejak entry_date
  weight_kg       NUMERIC(8,2) NOT NULL,
  bcs             NUMERIC(3,1),
  adg_since_last  NUMERIC(8,2),                     -- g/hari sejak timbang sebelumnya

  -- Data quality flag — kritikal untuk sapi karena timbangan fisik mahal
  weigh_method    TEXT NOT NULL DEFAULT 'timbang_langsung'
                    CHECK (weigh_method IN (
                      'timbang_langsung',     -- timbangan digital/mekanik
                      'estimasi_pita_ukur',   -- rumus lingkar dada × panjang badan
                      'estimasi_visual'       -- perkiraan mata, paling tidak akurat
                    )),
  chest_girth_cm  NUMERIC(6,1),                     -- lingkar dada (cm), diisi jika pita ukur

  notes           TEXT,

  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_deleted      BOOLEAN NOT NULL DEFAULT false
);

CREATE INDEX IF NOT EXISTS sapi_penggemukan_weight_records_animal_idx
  ON sapi_penggemukan_weight_records(animal_id);
CREATE INDEX IF NOT EXISTS sapi_penggemukan_weight_records_batch_idx
  ON sapi_penggemukan_weight_records(batch_id);
CREATE INDEX IF NOT EXISTS sapi_penggemukan_weight_records_date_idx
  ON sapi_penggemukan_weight_records(animal_id, weigh_date);

-- Satu ekor, satu tanggal, satu timbangan
CREATE UNIQUE INDEX IF NOT EXISTS sapi_penggemukan_weight_records_unique
  ON sapi_penggemukan_weight_records(animal_id, weigh_date)
  WHERE is_deleted = false;


-- ──────────────────────────────────────────────────────────────
-- 4. sapi_penggemukan_feed_logs
--    Konsumsi pakan harian per kandang — unit kg fresh weight (sama dengan KD)
--    FCR dihitung dari fresh weight; estimasi BK di-handle di UI jika diperlukan
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sapi_penggemukan_feed_logs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  batch_id        UUID NOT NULL REFERENCES sapi_penggemukan_batches(id) ON DELETE CASCADE,

  log_date        DATE NOT NULL,
  kandang_name    TEXT NOT NULL,
  animal_count    INTEGER NOT NULL,

  hijauan_kg      NUMERIC(8,2) NOT NULL DEFAULT 0,  -- rumput / jerami fermentasi
  konsentrat_kg   NUMERIC(8,2) NOT NULL DEFAULT 0,  -- konsentrat komersial
  dedak_kg        NUMERIC(8,2) NOT NULL DEFAULT 0,  -- dedak / pollard
  other_feed_kg   NUMERIC(8,2) NOT NULL DEFAULT 0,
  sisa_pakan_kg   NUMERIC(8,2) NOT NULL DEFAULT 0,

  -- Konsumsi aktual = diberikan − sisa (GENERATED)
  consumed_kg     NUMERIC(8,2) GENERATED ALWAYS AS (
    GREATEST(0, hijauan_kg + konsentrat_kg + dedak_kg + other_feed_kg - sisa_pakan_kg)
  ) STORED,

  feed_cost_idr   BIGINT,
  notes           TEXT,

  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_deleted      BOOLEAN NOT NULL DEFAULT false
);

CREATE INDEX IF NOT EXISTS sapi_penggemukan_feed_logs_batch_idx
  ON sapi_penggemukan_feed_logs(batch_id);
CREATE INDEX IF NOT EXISTS sapi_penggemukan_feed_logs_date_idx
  ON sapi_penggemukan_feed_logs(batch_id, log_date);

-- Satu batch, satu kandang, satu hari
CREATE UNIQUE INDEX IF NOT EXISTS sapi_penggemukan_feed_logs_unique
  ON sapi_penggemukan_feed_logs(batch_id, kandang_name, log_date)
  WHERE is_deleted = false;


-- ──────────────────────────────────────────────────────────────
-- 5. sapi_penggemukan_health_logs
--    Log kesehatan per ekor: sakit, vaksinasi, obat cacing, kematian
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sapi_penggemukan_health_logs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  animal_id       UUID NOT NULL REFERENCES sapi_penggemukan_animals(id) ON DELETE CASCADE,
  batch_id        UUID NOT NULL REFERENCES sapi_penggemukan_batches(id) ON DELETE CASCADE,

  log_date        DATE NOT NULL,
  log_type        TEXT NOT NULL CHECK (log_type IN (
                    'sakit',
                    'vaksinasi',
                    'obat_cacing',
                    'kematian',
                    'lainnya'
                  )),

  symptoms        TEXT,
  action_taken    TEXT,
  medicine_name   TEXT,
  medicine_dose   TEXT,
  handled_by      TEXT,
  outcome         TEXT,

  vaccine_name    TEXT,
  vaccine_next_due DATE,

  death_cause     TEXT,
  death_weight_kg NUMERIC(8,2),
  loss_value_idr  BIGINT,

  notes           TEXT,

  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_deleted      BOOLEAN NOT NULL DEFAULT false
);

CREATE INDEX IF NOT EXISTS sapi_penggemukan_health_logs_animal_idx
  ON sapi_penggemukan_health_logs(animal_id);
CREATE INDEX IF NOT EXISTS sapi_penggemukan_health_logs_batch_idx
  ON sapi_penggemukan_health_logs(batch_id);
CREATE INDEX IF NOT EXISTS sapi_penggemukan_health_logs_type_idx
  ON sapi_penggemukan_health_logs(batch_id, log_type);


-- ──────────────────────────────────────────────────────────────
-- 6. sapi_penggemukan_sales
--    Penjualan per ekor atau lot
--    buyer_type disesuaikan untuk konteks sapi (agen_kurban, ekspor)
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sapi_penggemukan_sales (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  batch_id        UUID NOT NULL REFERENCES sapi_penggemukan_batches(id) ON DELETE CASCADE,

  sale_date       DATE NOT NULL,

  buyer_name      TEXT NOT NULL,
  buyer_type      TEXT CHECK (buyer_type IN (
                    'agen_kurban',        -- agen qurban Idul Adha
                    'jagal_rph',          -- jagal / rumah potong hewan
                    'katering',
                    'pengepul',
                    'eceran_langsung',
                    'ekspor',             -- ekspor ternak hidup (Bali, dll)
                    'lainnya'
                  )),
  buyer_contact   TEXT,

  animal_ids      UUID[] NOT NULL,                  -- array UUID sapi_penggemukan_animals
  animal_count    INTEGER NOT NULL,
  total_weight_kg NUMERIC(10,2) NOT NULL,
  avg_weight_kg   NUMERIC(8,2),

  price_type      TEXT CHECK (price_type IN ('per_kg','per_ekor')),
  price_amount    BIGINT NOT NULL,
  total_revenue_idr BIGINT NOT NULL,

  payment_method  TEXT CHECK (payment_method IN ('tunai','transfer','kredit')),
  is_paid         BOOLEAN NOT NULL DEFAULT false,
  paid_date       DATE,

  has_skkh        BOOLEAN NOT NULL DEFAULT false,   -- Surat Keterangan Kesehatan Hewan
  has_surat_jalan BOOLEAN NOT NULL DEFAULT false,
  invoice_number  TEXT,
  notes           TEXT,

  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_deleted      BOOLEAN NOT NULL DEFAULT false
);

CREATE INDEX IF NOT EXISTS sapi_penggemukan_sales_tenant_idx
  ON sapi_penggemukan_sales(tenant_id);
CREATE INDEX IF NOT EXISTS sapi_penggemukan_sales_batch_idx
  ON sapi_penggemukan_sales(batch_id);
CREATE INDEX IF NOT EXISTS sapi_penggemukan_sales_date_idx
  ON sapi_penggemukan_sales(tenant_id, sale_date);


-- ──────────────────────────────────────────────────────────────
-- 7. sapi_kandangs
--    Manajemen kandang per batch (helicopter view)
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sapi_kandangs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  batch_id    UUID NOT NULL REFERENCES sapi_penggemukan_batches(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  capacity    INTEGER NOT NULL DEFAULT 0,
  panjang_m   NUMERIC(10,2),
  lebar_m     NUMERIC(10,2),
  luas_m2     NUMERIC(10,2) GENERATED ALWAYS AS (panjang_m * lebar_m) STORED,
  is_holding  BOOLEAN NOT NULL DEFAULT false,
  notes       TEXT,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sapi_kandangs_tenant ON sapi_kandangs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_sapi_kandangs_batch  ON sapi_kandangs(batch_id);

-- FK kandang_id ke sapi_kandangs (sekarang sapi_kandangs sudah ada)
ALTER TABLE sapi_penggemukan_animals
  ADD CONSTRAINT sapi_animals_kandang_fk
  FOREIGN KEY (kandang_id) REFERENCES sapi_kandangs(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_sapi_animals_kandang_id
  ON sapi_penggemukan_animals(kandang_id);


-- ──────────────────────────────────────────────────────────────
-- RLS — semua tabel sapi_penggemukan_* + sapi_kandangs
-- ──────────────────────────────────────────────────────────────
ALTER TABLE sapi_penggemukan_batches        ENABLE ROW LEVEL SECURITY;
ALTER TABLE sapi_penggemukan_animals        ENABLE ROW LEVEL SECURITY;
ALTER TABLE sapi_penggemukan_weight_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE sapi_penggemukan_feed_logs      ENABLE ROW LEVEL SECURITY;
ALTER TABLE sapi_penggemukan_health_logs    ENABLE ROW LEVEL SECURITY;
ALTER TABLE sapi_penggemukan_sales          ENABLE ROW LEVEL SECURITY;
ALTER TABLE sapi_kandangs                   ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'sapi_penggemukan_batches',
    'sapi_penggemukan_animals',
    'sapi_penggemukan_weight_records',
    'sapi_penggemukan_feed_logs',
    'sapi_penggemukan_health_logs',
    'sapi_penggemukan_sales',
    'sapi_kandangs'
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
    'sapi_penggemukan_batches',
    'sapi_penggemukan_animals',
    'sapi_penggemukan_feed_logs',
    'sapi_penggemukan_sales'
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
-- Trigger: sync latest_weight_* ke sapi_penggemukan_animals
-- setiap ada timbangan baru
-- ──────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.trg_sapi_sync_animal_latest_weight()
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
  FROM public.sapi_penggemukan_weight_records
  WHERE animal_id = NEW.animal_id
    AND is_deleted = false
  ORDER BY weigh_date DESC, created_at DESC
  LIMIT 1;

  IF FOUND THEN
    UPDATE public.sapi_penggemukan_animals
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

DROP TRIGGER IF EXISTS sapi_sync_animal_latest_weight ON sapi_penggemukan_weight_records;
CREATE TRIGGER sapi_sync_animal_latest_weight
  AFTER INSERT OR UPDATE ON sapi_penggemukan_weight_records
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_sapi_sync_animal_latest_weight();


-- ──────────────────────────────────────────────────────────────
-- Trigger: sync mortality_count ke sapi_penggemukan_batches
-- saat ekor berubah status menjadi 'dead'
-- ──────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.trg_sapi_sync_batch_mortality()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  UPDATE public.sapi_penggemukan_batches
  SET
    mortality_count = (
      SELECT COUNT(*)
      FROM public.sapi_penggemukan_animals
      WHERE batch_id = NEW.batch_id
        AND status = 'dead'
        AND is_deleted = false
    ),
    updated_at = now()
  WHERE id = NEW.batch_id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sapi_sync_batch_mortality ON sapi_penggemukan_animals;
CREATE TRIGGER sapi_sync_batch_mortality
  AFTER UPDATE OF status ON sapi_penggemukan_animals
  FOR EACH ROW
  WHEN (NEW.status = 'dead' OR OLD.status = 'dead')
  EXECUTE FUNCTION public.trg_sapi_sync_batch_mortality();


-- ──────────────────────────────────────────────────────────────
-- RPC: increment_sapi_batch_animal_count
-- Dipanggil dari useAddSapiAnimal() setiap kali ekor baru ditambahkan.
-- Count-based (bukan increment) agar tidak drift jika ada soft-delete.
-- ──────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.increment_sapi_batch_animal_count(p_batch_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  UPDATE public.sapi_penggemukan_batches
  SET
    total_animals = (
      SELECT COUNT(*)
      FROM public.sapi_penggemukan_animals
      WHERE batch_id = p_batch_id
        AND is_deleted = false
    ),
    updated_at = now()
  WHERE id = p_batch_id;
END;
$$;
