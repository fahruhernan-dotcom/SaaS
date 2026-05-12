-- Phase 1: Extend daily_records with environmental + management fields
-- Fields temperature_morning/evening, cull_count, feed_type already exist per schema audit
-- Adding: water_liter, litter_condition, ammonia_level

ALTER TABLE daily_records
  ADD COLUMN IF NOT EXISTS water_liter       NUMERIC(8,2),
  ADD COLUMN IF NOT EXISTS litter_condition  TEXT CHECK (litter_condition IN ('kering','lembab','basah')),
  ADD COLUMN IF NOT EXISTS ammonia_level     TEXT CHECK (ammonia_level IN ('tidak_ada','ringan','sedang','kuat'));

COMMENT ON COLUMN daily_records.water_liter      IS 'Konsumsi air minum harian (liter)';
COMMENT ON COLUMN daily_records.litter_condition IS 'Kondisi litter: kering | lembab | basah';
COMMENT ON COLUMN daily_records.ammonia_level    IS 'Kadar amonia: tidak_ada | ringan | sedang | kuat';
