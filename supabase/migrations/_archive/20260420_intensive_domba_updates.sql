-- ═══════════════════════════════════════════════════════════════════════════════
-- TernakOS — DOMBA INTENSIF UPDATES
-- Menambah kolom untuk Precision Farming: Feed Orts Category & FAMACHA Score
-- ═══════════════════════════════════════════════════════════════════════════════

-- 1. Feed Orts (Sisa Pakan) Category
-- Digunakan untuk sistem input "Jempol" 👍/🟡/🔴
ALTER TABLE domba_penggemukan_feed_logs 
  ADD COLUMN IF NOT EXISTS feed_orts_category TEXT 
  CHECK (feed_orts_category IN ('habis', 'sedikit', 'banyak'));

-- 2. FAMACHA Score
-- Skor warna kelopak mata (1-5) untuk deteksi anemia/parasit
ALTER TABLE domba_penggemukan_weight_records 
  ADD COLUMN IF NOT EXISTS famacha_score INT 
  CHECK (famacha_score BETWEEN 1 AND 5);

-- 3. Comments for Documentation
COMMENT ON COLUMN domba_penggemukan_feed_logs.feed_orts_category IS 'Kategori sisa pakan: habis (thumb up), sedikit (warning), banyak (alert)';
COMMENT ON COLUMN domba_penggemukan_weight_records.famacha_score IS 'Skor FAMACHA (1-5) untuk deteksi dini cacingan';
