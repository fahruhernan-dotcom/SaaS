-- ══════════════════════════════════════════════════════════
-- RISK 4 FIX: DROP deprecated columns broker_connections
-- Jalankan STEP 1 dulu, cek hasilnya, baru STEP 2
-- ══════════════════════════════════════════════════════════

-- STEP 1: Cek konsistensi data (harus 0 sebelum DROP)
-- Kalau ada row yg berbeda, jangan DROP dulu
SELECT 
  id,
  peternak_tenant_id,
  requester_tenant_id,
  broker_tenant_id,
  target_tenant_id,
  CASE 
    WHEN peternak_tenant_id = requester_tenant_id 
     AND broker_tenant_id = target_tenant_id THEN 'CONSISTENT'
    ELSE '⚠️ MISMATCH — JANGAN DROP'
  END as data_check
FROM public.broker_connections
WHERE peternak_tenant_id != requester_tenant_id
   OR broker_tenant_id != target_tenant_id
LIMIT 10;

-- Jika hasilnya "No rows returned" → data konsisten → lanjut STEP 2

-- ══════════════════════════════════════════════════════════
-- STEP 2: DROP deprecated columns (jalankan setelah STEP 1 = 0 rows)
-- ══════════════════════════════════════════════════════════
ALTER TABLE public.broker_connections
  DROP COLUMN IF EXISTS peternak_tenant_id,
  DROP COLUMN IF EXISTS broker_tenant_id;

-- STEP 3: Verifikasi kolom sudah bersih
SELECT column_name 
FROM information_schema.columns
WHERE table_name = 'broker_connections'
  AND column_name IN ('peternak_tenant_id', 'broker_tenant_id');
-- Expected: No rows returned ✅


-- ══════════════════════════════════════════════════════════
-- RISK 5 INFO: cek trigger mana yang pakai recalc overload
-- (READ ONLY — tidak ada perubahan DB)
-- ══════════════════════════════════════════════════════════
SELECT 
  t.trigger_name,
  t.event_object_table,
  t.event_manipulation,
  t.action_timing,
  substring(t.action_statement, 1, 120) as action_statement
FROM information_schema.triggers t
WHERE t.action_statement ILIKE '%recalc_sembako_customer_balance%'
  AND t.trigger_schema = 'public';
