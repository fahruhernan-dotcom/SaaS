-- ═══════════════════════════════════════════════════════════════════════════════
-- TernakOS — DB SYNC MIGRATION
-- Generated: 2026-05-06 (berdasarkan hasil audit)
-- Jalankan di: Supabase Dashboard → SQL Editor
-- ═══════════════════════════════════════════════════════════════════════════════
-- STATUS SEBELUM DIJALANKAN:
--   ✅ domba/sapi/kambing_penggemukan_operational_costs  → sudah ada
--   ❌ vaccination_records                               → BELUM ADA → CREATE
--   ❓ treatment_cost_idr di health_logs                → belum dicek → ADD IF NOT EXISTS
--   🗑️ kd_* tables (14 tabel)                          → user konfirmasi sudah split → DROP
-- ═══════════════════════════════════════════════════════════════════════════════


-- ─────────────────────────────────────────────────────────────────────────────
-- BAGIAN 1: CREATE vaccination_records
-- (dari migration 20260408_vaccination_records.sql — belum diapply)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS vaccination_records (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  cycle_id         UUID NOT NULL REFERENCES breeding_cycles(id) ON DELETE CASCADE,
  vaccination_date DATE NOT NULL,
  age_days         INTEGER,
  vaccine_name     TEXT NOT NULL,
  disease_target   TEXT,                          -- ND, IB, IBD, Marek, dll
  method           TEXT CHECK (method IN ('tetes_mata','air_minum','spray','suntik')),
  dose_per_bird    NUMERIC(8,4),
  batch_number     TEXT,
  notes            TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_deleted       BOOLEAN NOT NULL DEFAULT false
);

CREATE INDEX IF NOT EXISTS vaccination_records_cycle_id_idx  ON vaccination_records(cycle_id);
CREATE INDEX IF NOT EXISTS vaccination_records_tenant_id_idx ON vaccination_records(tenant_id);

ALTER TABLE vaccination_records ENABLE ROW LEVEL SECURITY;

-- FIXED: pakai auth_user_id bukan id (profil bisa duplikat antar tenant)
DROP POLICY IF EXISTS "tenant_vaccination_records" ON vaccination_records;
CREATE POLICY "tenant_vaccination_records" ON vaccination_records
  FOR ALL
  USING (
    tenant_id IN (
      SELECT tenant_id FROM public.profiles WHERE auth_user_id = auth.uid()
    )
  )
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM public.profiles WHERE auth_user_id = auth.uid()
    )
  );


-- ─────────────────────────────────────────────────────────────────────────────
-- BAGIAN 2: ADD treatment_cost_idr ke health_logs
-- (dari migration 20260502_health_treatment_costs.sql — belum diverifikasi)
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.domba_penggemukan_health_logs
  ADD COLUMN IF NOT EXISTS treatment_cost_idr NUMERIC(12, 2) DEFAULT 0;

ALTER TABLE public.kambing_penggemukan_health_logs
  ADD COLUMN IF NOT EXISTS treatment_cost_idr NUMERIC(12, 2) DEFAULT 0;

ALTER TABLE public.sapi_penggemukan_health_logs
  ADD COLUMN IF NOT EXISTS treatment_cost_idr NUMERIC(12, 2) DEFAULT 0;

ALTER TABLE public.domba_breeding_health_logs
  ADD COLUMN IF NOT EXISTS treatment_cost_idr NUMERIC(12, 2) DEFAULT 0;

ALTER TABLE public.kambing_breeding_health_logs
  ADD COLUMN IF NOT EXISTS treatment_cost_idr NUMERIC(12, 2) DEFAULT 0;

ALTER TABLE public.sapi_breeding_health_logs
  ADD COLUMN IF NOT EXISTS treatment_cost_idr NUMERIC(12, 2) DEFAULT 0;


-- ─────────────────────────────────────────────────────────────────────────────
-- BAGIAN 3: DROP kd_* tables
-- Semua KOSONG (confirmed dari audit). Sudah di-split ke domba/kambing/sapi.
-- URUTAN: child tables dulu, baru parent (kd_kandangs terakhir)
-- ─────────────────────────────────────────────────────────────────────────────

-- 3a. Drop breeding child tables
DROP TABLE IF EXISTS public.kd_breeding_sales          CASCADE;
DROP TABLE IF EXISTS public.kd_breeding_health_logs    CASCADE;
DROP TABLE IF EXISTS public.kd_breeding_weight_records CASCADE;
DROP TABLE IF EXISTS public.kd_breeding_births         CASCADE;
DROP TABLE IF EXISTS public.kd_breeding_mating_records CASCADE;
DROP TABLE IF EXISTS public.kd_breeding_animals        CASCADE;
DROP TABLE IF EXISTS public.kd_breeding_feed_logs      CASCADE;

-- 3b. Drop penggemukan child tables
DROP TABLE IF EXISTS public.kd_penggemukan_sales          CASCADE;
DROP TABLE IF EXISTS public.kd_penggemukan_health_logs    CASCADE;
DROP TABLE IF EXISTS public.kd_penggemukan_weight_records CASCADE;
DROP TABLE IF EXISTS public.kd_penggemukan_feed_logs      CASCADE;
DROP TABLE IF EXISTS public.kd_penggemukan_animals        CASCADE;
DROP TABLE IF EXISTS public.kd_penggemukan_batches        CASCADE;

-- 3c. Drop parent (kandang) — paling akhir
DROP TABLE IF EXISTS public.kd_kandangs CASCADE;


-- ─────────────────────────────────────────────────────────────────────────────
-- VERIFIKASI (jalankan terpisah setelah migration berhasil)
-- ─────────────────────────────────────────────────────────────────────────────
-- SELECT table_name
-- FROM information_schema.tables
-- WHERE table_schema = 'public'
--   AND table_name IN (
--     'vaccination_records',
--     'kd_kandangs', 'kd_penggemukan_batches', 'kd_breeding_animals'
--   )
-- ORDER BY table_name;
--
-- Expected:
--   vaccination_records → ADA
--   kd_kandangs, kd_penggemukan_batches, kd_breeding_animals → TIDAK ADA
