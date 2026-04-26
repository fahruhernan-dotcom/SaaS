-- Migration: Decouple kandangs from batches → tenant-level
-- Kandang adalah infrastruktur fisik yang shared antar batch.
-- batch_id dijadikan nullable agar kandang lama tetap valid,
-- sementara kandang baru tidak lagi perlu batch_id.

-- 1. Lepas NOT NULL constraint pada batch_id
ALTER TABLE domba_kandangs  ALTER COLUMN batch_id DROP NOT NULL;
ALTER TABLE kambing_kandangs ALTER COLUMN batch_id DROP NOT NULL;
ALTER TABLE sapi_kandangs    ALTER COLUMN batch_id DROP NOT NULL;

-- 2. (Opsional) Untuk tenant yang sudah punya data multi-batch
--    dengan kandang nama sama, script ini NULL-kan batch_id supaya
--    kandang jadi shared. Hanya berjalan kalau ada duplikat nama.
--    Skip kalau kamu mau biarkan data lama as-is dan mulai fresh.

-- Contoh untuk domba (jalankan manual per kebutuhan):
-- UPDATE domba_kandangs d
-- SET batch_id = NULL
-- WHERE tenant_id IN (
--   SELECT DISTINCT tenant_id FROM domba_kandangs
-- );

-- 3. Pastikan index tenant_id ada untuk performa query
CREATE INDEX IF NOT EXISTS idx_domba_kandangs_tenant   ON domba_kandangs  (tenant_id);
CREATE INDEX IF NOT EXISTS idx_kambing_kandangs_tenant ON kambing_kandangs (tenant_id);
CREATE INDEX IF NOT EXISTS idx_sapi_kandangs_tenant    ON sapi_kandangs    (tenant_id);
