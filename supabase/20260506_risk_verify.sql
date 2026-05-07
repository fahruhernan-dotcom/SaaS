-- ══════════════════════════════════════════════
-- RISK 4 FIX: Cek kolom aktual broker_connections
-- ══════════════════════════════════════════════

-- Jalankan ini dulu untuk lihat kolom yang benar-benar ada:
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'broker_connections'
ORDER BY ordinal_position;

-- ══════════════════════════════════════════════
-- RISK 5: Cek recalc_sembako overload
-- ══════════════════════════════════════════════
SELECT proname, pg_get_function_arguments(oid) as args
FROM pg_proc
WHERE proname = 'recalc_sembako_customer_balance';

-- ══════════════════════════════════════════════
-- RISK 6: Cek ai_anomaly_logs orphan data
-- ══════════════════════════════════════════════
SELECT COUNT(*) as orphan_count
FROM public.ai_anomaly_logs al
LEFT JOIN public.tenants t ON t.id = al.tenant_id
WHERE t.id IS NULL;

-- ══════════════════════════════════════════════
-- SELF-DIAGNOSIS LENGKAP (jalankan sekaligus)
-- ══════════════════════════════════════════════
SELECT 
  'expired_plans_not_downgraded' as check_name,
  COUNT(*) as count,
  CASE WHEN COUNT(*) = 0 THEN '✅ OK' ELSE '⚠️ RUN downgrade_expired_plans()' END as status
FROM public.tenants
WHERE plan IN ('pro', 'business')
  AND plan_expires_at IS NOT NULL
  AND plan_expires_at < NOW()

UNION ALL

SELECT 
  'broker_deprecated_col_peternak_tenant_id',
  COUNT(*),
  CASE WHEN COUNT(*) > 0 THEN '⚠️ DEPRECATED COL EXIST' ELSE '✅ CLEAN' END
FROM information_schema.columns
WHERE table_name = 'broker_connections'
  AND column_name = 'peternak_tenant_id'

UNION ALL

SELECT 
  'broker_deprecated_col_broker_tenant_id',
  COUNT(*),
  CASE WHEN COUNT(*) > 0 THEN '⚠️ DEPRECATED COL EXIST' ELSE '✅ CLEAN' END
FROM information_schema.columns
WHERE table_name = 'broker_connections'
  AND column_name = 'broker_tenant_id'

UNION ALL

SELECT
  'cron_job_downgrade_active',
  COUNT(*),
  CASE WHEN COUNT(*) > 0 THEN '✅ SCHEDULER ACTIVE' ELSE '❌ NO CRON JOB' END
FROM cron.job
WHERE jobname = 'downgrade-expired-plans' AND active = true;
