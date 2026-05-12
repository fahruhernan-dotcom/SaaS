-- ============================================================
-- Migration: Feedlot Kambing & Domba — Penggemukan
-- Business model key : peternak_kambing_domba_penggemukan
-- sub_type (tenants.business_vertical): peternak_kambing_domba_penggemukan
--
-- Prefix tabel: kd_penggemukan_*
--   kd  = kambing domba
--   penggemukan = feedlot / fattening
--
-- Namespace ini sengaja berbeda dari tabel breeding nanti:
--   kd_breeding_* → akan dibuat di migration terpisah
--
-- Tables:
--   1. kd_penggemukan_batches        — satu periode/batch penggemukan
--   2. kd_penggemukan_animals        — data per ekor individual (ear tag)
--   3. kd_penggemukan_weight_records — timbang rutin per ekor
--   4. kd_penggemukan_feed_logs      — konsumsi pakan harian per kandang
--   5. kd_penggemukan_health_logs    — log kesehatan & mortalitas per ekor
--   6. kd_penggemukan_sales          — penjualan per ekor / lot
-- ============================================================


-- ──────────────────────────────────────────────────────────────
-- 1. kd_penggemukan_batches
--    Satu batch = satu periode penggemukan (60–90 hari)
--    Analog: breeding_cycles (broiler)
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS kd_penggemukan_batches (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

  -- Identitas batch
  batch_code      TEXT NOT NULL,                    -- e.g. BATCH-2024-07
  kandang_name    TEXT NOT NULL,                    -- nama kandang / lokasi
  start_date      DATE NOT NULL,
  target_end_date DATE,                             -- estimasi jual
  end_date        DATE,                             -- aktual selesai

  -- Summary (diupdate saat tutup batch)
  total_animals   INTEGER NOT NULL DEFAULT 0,       -- jumlah ekor masuk
  alive_count     INTEGER,
  sold_count      INTEGER,
  mortality_count INTEGER NOT NULL DEFAULT 0,

  -- KPI final (diisi saat tutup batch)
  avg_adg_gram        NUMERIC(8,2),                 -- g/hari rata-rata batch
  avg_fcr             NUMERIC(6,3),
  avg_entry_weight_kg NUMERIC(8,2),
  avg_exit_weight_kg  NUMERIC(8,2),
  total_feed_cost_idr BIGINT,
  total_revenue_idr   BIGINT,
  total_cogs_idr      BIGINT,                       -- harga beli semua ternak batch
  net_profit_idr      BIGINT,
  rc_ratio            NUMERIC(6,3),

  status          TEXT NOT NULL DEFAULT 'active'
                    CHECK (status IN ('active','closed','cancelled')),
  notes           TEXT,

  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_deleted      BOOLEAN NOT NULL DEFAULT false
);

CREATE INDEX IF NOT EXISTS kd_penggemukan_batches_tenant_idx
  ON kd_penggemukan_batches(tenant_id);
CREATE INDEX IF NOT EXISTS kd_penggemukan_batches_status_idx
  ON kd_penggemukan_batches(tenant_id, status);


-- ──────────────────────────────────────────────────────────────
-- 2. kd_penggemukan_animals
--    Setiap ekor individual — dicatat per ekor (beda dari broiler kolektif)
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS kd_penggemukan_animals (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  batch_id        UUID NOT NULL REFERENCES kd_penggemukan_batches(id) ON DELETE CASCADE,

  -- Identitas
  ear_tag         TEXT NOT NULL,                    -- e.g. GEM-2024-0301
  species         TEXT NOT NULL CHECK (species IN ('kambing', 'domba')),
  breed           TEXT,                             -- Boer Cross, Garut, Kacang, dll
  sex             TEXT CHECK (sex IN ('jantan', 'betina')),
  age_estimate    TEXT,                             -- "6-8 bulan" (teks bebas)

  -- Data masuk
  entry_date          DATE NOT NULL,
  entry_weight_kg     NUMERIC(8,2) NOT NULL,
  entry_bcs           NUMERIC(3,1),                 -- Body Condition Score 1–5
  entry_condition     TEXT CHECK (entry_condition IN ('sehat','kurus','cacat','sakit')),
  purchase_price_idr  BIGINT,
  source              TEXT,                         -- asal: pasar/peternak/daerah
  kandang_slot        TEXT,                         -- slot kandang e.g. KDG-F2

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

  notes           TEXT,

  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_deleted      BOOLEAN NOT NULL DEFAULT false
);

CREATE INDEX IF NOT EXISTS kd_penggemukan_animals_tenant_idx
  ON kd_penggemukan_animals(tenant_id);
CREATE INDEX IF NOT EXISTS kd_penggemukan_animals_batch_idx
  ON kd_penggemukan_animals(batch_id);
CREATE INDEX IF NOT EXISTS kd_penggemukan_animals_status_idx
  ON kd_penggemukan_animals(batch_id, status);
CREATE INDEX IF NOT EXISTS kd_penggemukan_animals_ear_tag_idx
  ON kd_penggemukan_animals(tenant_id, ear_tag);


-- ──────────────────────────────────────────────────────────────
-- 3. kd_penggemukan_weight_records
--    Riwayat penimbangan per ekor — minimal 1× per bulan
--    ADG dihitung dari selisih 2 record timbang
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS kd_penggemukan_weight_records (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  animal_id       UUID NOT NULL REFERENCES kd_penggemukan_animals(id) ON DELETE CASCADE,
  batch_id        UUID NOT NULL REFERENCES kd_penggemukan_batches(id) ON DELETE CASCADE,

  weigh_date      DATE NOT NULL,
  days_in_farm    INTEGER,                          -- hari sejak entry_date
  weight_kg       NUMERIC(8,2) NOT NULL,
  bcs             NUMERIC(3,1),
  adg_since_last  NUMERIC(8,2),                     -- g/hari sejak timbang sebelumnya
  notes           TEXT,

  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_deleted      BOOLEAN NOT NULL DEFAULT false
);

CREATE INDEX IF NOT EXISTS kd_penggemukan_weight_records_animal_idx
  ON kd_penggemukan_weight_records(animal_id);
CREATE INDEX IF NOT EXISTS kd_penggemukan_weight_records_batch_idx
  ON kd_penggemukan_weight_records(batch_id);
CREATE INDEX IF NOT EXISTS kd_penggemukan_weight_records_date_idx
  ON kd_penggemukan_weight_records(animal_id, weigh_date);

-- Satu ekor, satu tanggal, satu timbangan
CREATE UNIQUE INDEX IF NOT EXISTS kd_penggemukan_weight_records_unique
  ON kd_penggemukan_weight_records(animal_id, weigh_date)
  WHERE is_deleted = false;


-- ──────────────────────────────────────────────────────────────
-- 4. kd_penggemukan_feed_logs
--    Konsumsi pakan harian per kandang
--    Sumber kalkulasi FCR: total BK dikonsumsi / total PBBH batch
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS kd_penggemukan_feed_logs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  batch_id        UUID NOT NULL REFERENCES kd_penggemukan_batches(id) ON DELETE CASCADE,

  log_date        DATE NOT NULL,
  kandang_name    TEXT NOT NULL,
  animal_count    INTEGER NOT NULL,

  -- Pakan diberikan (kg)
  hijauan_kg      NUMERIC(8,2) NOT NULL DEFAULT 0,  -- rumput / jerami fermentasi
  konsentrat_kg   NUMERIC(8,2) NOT NULL DEFAULT 0,  -- konsentrat komersial
  dedak_kg        NUMERIC(8,2) NOT NULL DEFAULT 0,  -- dedak padi / pollard
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

CREATE INDEX IF NOT EXISTS kd_penggemukan_feed_logs_batch_idx
  ON kd_penggemukan_feed_logs(batch_id);
CREATE INDEX IF NOT EXISTS kd_penggemukan_feed_logs_date_idx
  ON kd_penggemukan_feed_logs(batch_id, log_date);

-- Satu batch, satu kandang, satu hari
CREATE UNIQUE INDEX IF NOT EXISTS kd_penggemukan_feed_logs_unique
  ON kd_penggemukan_feed_logs(batch_id, kandang_name, log_date)
  WHERE is_deleted = false;


-- ──────────────────────────────────────────────────────────────
-- 5. kd_penggemukan_health_logs
--    Log kesehatan per ekor: sakit, vaksinasi, obat cacing, kematian
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS kd_penggemukan_health_logs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  animal_id       UUID NOT NULL REFERENCES kd_penggemukan_animals(id) ON DELETE CASCADE,
  batch_id        UUID NOT NULL REFERENCES kd_penggemukan_batches(id) ON DELETE CASCADE,

  log_date        DATE NOT NULL,
  log_type        TEXT NOT NULL CHECK (log_type IN (
                    'sakit',
                    'vaksinasi',
                    'obat_cacing',
                    'kematian',
                    'lainnya'
                  )),

  -- Gejala & tindakan
  symptoms        TEXT,
  action_taken    TEXT,
  medicine_name   TEXT,
  medicine_dose   TEXT,                             -- "5 ml IM"
  handled_by      TEXT,                             -- nama petugas / drh.
  outcome         TEXT,                             -- sembuh / mati / masih diobati

  -- Khusus vaksinasi
  vaccine_name    TEXT,
  vaccine_next_due DATE,

  -- Khusus kematian
  death_cause     TEXT,
  death_weight_kg NUMERIC(8,2),
  loss_value_idr  BIGINT,

  notes           TEXT,

  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_deleted      BOOLEAN NOT NULL DEFAULT false
);

CREATE INDEX IF NOT EXISTS kd_penggemukan_health_logs_animal_idx
  ON kd_penggemukan_health_logs(animal_id);
CREATE INDEX IF NOT EXISTS kd_penggemukan_health_logs_batch_idx
  ON kd_penggemukan_health_logs(batch_id);
CREATE INDEX IF NOT EXISTS kd_penggemukan_health_logs_type_idx
  ON kd_penggemukan_health_logs(batch_id, log_type);


-- ──────────────────────────────────────────────────────────────
-- 6. kd_penggemukan_sales
--    Penjualan per ekor atau lot ke satu pembeli
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS kd_penggemukan_sales (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  batch_id        UUID NOT NULL REFERENCES kd_penggemukan_batches(id) ON DELETE CASCADE,

  sale_date       DATE NOT NULL,

  -- Pembeli
  buyer_name      TEXT NOT NULL,
  buyer_type      TEXT CHECK (buyer_type IN (
                    'agen_aqiqah','jagal_rph','katering',
                    'pengepul','eceran_langsung','lainnya'
                  )),
  buyer_contact   TEXT,

  -- Ternak terjual
  animal_ids      UUID[] NOT NULL,                  -- array UUID kd_penggemukan_animals
  animal_count    INTEGER NOT NULL,
  total_weight_kg NUMERIC(10,2) NOT NULL,
  avg_weight_kg   NUMERIC(8,2),

  -- Harga
  price_type      TEXT CHECK (price_type IN ('per_kg','per_ekor')),
  price_amount    BIGINT NOT NULL,
  total_revenue_idr BIGINT NOT NULL,

  -- Pembayaran
  payment_method  TEXT CHECK (payment_method IN ('tunai','transfer','kredit')),
  is_paid         BOOLEAN NOT NULL DEFAULT false,
  paid_date       DATE,

  -- Dokumen
  has_skkh        BOOLEAN NOT NULL DEFAULT false,
  has_surat_jalan BOOLEAN NOT NULL DEFAULT false,
  invoice_number  TEXT,
  notes           TEXT,

  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_deleted      BOOLEAN NOT NULL DEFAULT false
);

CREATE INDEX IF NOT EXISTS kd_penggemukan_sales_tenant_idx
  ON kd_penggemukan_sales(tenant_id);
CREATE INDEX IF NOT EXISTS kd_penggemukan_sales_batch_idx
  ON kd_penggemukan_sales(batch_id);
CREATE INDEX IF NOT EXISTS kd_penggemukan_sales_date_idx
  ON kd_penggemukan_sales(tenant_id, sale_date);


-- ──────────────────────────────────────────────────────────────
-- RLS — semua tabel kd_penggemukan_*
-- ──────────────────────────────────────────────────────────────
ALTER TABLE kd_penggemukan_batches        ENABLE ROW LEVEL SECURITY;
ALTER TABLE kd_penggemukan_animals        ENABLE ROW LEVEL SECURITY;
ALTER TABLE kd_penggemukan_weight_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE kd_penggemukan_feed_logs      ENABLE ROW LEVEL SECURITY;
ALTER TABLE kd_penggemukan_health_logs    ENABLE ROW LEVEL SECURITY;
ALTER TABLE kd_penggemukan_sales          ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'kd_penggemukan_batches',
    'kd_penggemukan_animals',
    'kd_penggemukan_weight_records',
    'kd_penggemukan_feed_logs',
    'kd_penggemukan_health_logs',
    'kd_penggemukan_sales'
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
    'kd_penggemukan_batches',
    'kd_penggemukan_animals',
    'kd_penggemukan_feed_logs',
    'kd_penggemukan_sales'
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
-- Trigger: sync latest_weight_* ke kd_penggemukan_animals
-- setiap ada timbangan baru
-- ──────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.trg_kd_sync_animal_latest_weight()
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
  FROM public.kd_penggemukan_weight_records
  WHERE animal_id = NEW.animal_id
    AND is_deleted = false
  ORDER BY weigh_date DESC, created_at DESC
  LIMIT 1;

  IF FOUND THEN
    UPDATE public.kd_penggemukan_animals
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

DROP TRIGGER IF EXISTS kd_sync_animal_latest_weight ON kd_penggemukan_weight_records;
CREATE TRIGGER kd_sync_animal_latest_weight
  AFTER INSERT OR UPDATE ON kd_penggemukan_weight_records
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_kd_sync_animal_latest_weight();


-- ──────────────────────────────────────────────────────────────
-- Trigger: sync mortality_count ke kd_penggemukan_batches
-- saat ekor berubah status menjadi 'dead'
-- ──────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.trg_kd_sync_batch_mortality()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  UPDATE public.kd_penggemukan_batches
  SET
    mortality_count = (
      SELECT COUNT(*)
      FROM public.kd_penggemukan_animals
      WHERE batch_id = NEW.batch_id
        AND status = 'dead'
        AND is_deleted = false
    ),
    updated_at = now()
  WHERE id = NEW.batch_id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS kd_sync_batch_mortality ON kd_penggemukan_animals;
CREATE TRIGGER kd_sync_batch_mortality
  AFTER UPDATE OF status ON kd_penggemukan_animals
  FOR EACH ROW
  WHEN (NEW.status = 'dead' OR OLD.status = 'dead')
  EXECUTE FUNCTION public.trg_kd_sync_batch_mortality();


-- ──────────────────────────────────────────────────────────────
-- RPC: increment_kd_batch_animal_count
-- Dipanggil dari useAddKdAnimal() setiap kali ekor baru ditambahkan.
-- Menghitung ulang total_animals dari tabel kd_penggemukan_animals
-- (count-based, bukan increment, agar tidak drift jika ada soft-delete)
-- ──────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.increment_kd_batch_animal_count(p_batch_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  UPDATE public.kd_penggemukan_batches
  SET
    total_animals = (
      SELECT COUNT(*)
      FROM public.kd_penggemukan_animals
      WHERE batch_id = p_batch_id
        AND is_deleted = false
    ),
    updated_at = now()
  WHERE id = p_batch_id;
END;
$$;
