-- =============================================================================
-- VERIFIKASI POST-MIGRATION: 20260508_security_hardening.sql
-- Jalankan di Supabase SQL Editor untuk konfirmasi semua fix berhasil
-- Ekspektasi: SEMUA hasil harus kosong / sesuai keterangan
-- =============================================================================


-- ============================================================
-- V1: Cek search_path sudah di-set pada 5 fungsi
-- EKSPEKTASI: set_config TIDAK boleh null untuk semua 5 fungsi
-- ============================================================
SELECT
  proname   AS function_name,
  proconfig AS set_config,
  prosecdef AS is_security_definer
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname IN (
    'check_sembako_transaction_quota',
    'deduct_batch_stock',
    'enforce_payment_ceiling',
    'recalculate_payment_status',
    'prevent_profile_privilege_escalation'
  )
ORDER BY proname;


-- ============================================================
-- V2: Cek TIDAK ADA lagi policy WITH CHECK (true)
-- EKSPEKTASI: hasil harus KOSONG (0 rows)
-- ============================================================
SELECT tablename, policyname, with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND with_check = 'true'
  AND cmd IN ('INSERT', 'UPDATE', 'ALL')
  AND tablename IN ('market_prices', 'tenants');


-- ============================================================
-- V3: Cek policy mp_insert sudah benar (tidak lagi WITH CHECK true)
-- EKSPEKTASI: with_check harus berisi kondisi is_superadmin() OR source IN (...)
-- ============================================================
SELECT tablename, policyname, cmd, roles, with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'market_prices'
  AND policyname = 'mp_insert';


-- ============================================================
-- V4: Cek policy tenants sudah benar
-- EKSPEKTASI: with_check harus berisi NOT EXISTS (...)
-- ============================================================
SELECT tablename, policyname, cmd, roles, with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'tenants'
  AND policyname = 'Allow authenticated users to insert a tenant';


-- ============================================================
-- V5: Cek TIDAK ADA fungsi sensitif yang bisa diakses anon
-- EKSPEKTASI: hasil harus KOSONG, atau hanya berisi get_public_market_stats & get_province_price_trends
-- ============================================================
SELECT r.routine_name, rp.grantee
FROM information_schema.routines r
JOIN information_schema.routine_privileges rp ON rp.specific_name = r.specific_name
WHERE r.routine_schema = 'public'
  AND rp.grantee = 'anon'
  AND r.routine_name NOT IN ('get_public_market_stats', 'get_province_price_trends')
ORDER BY r.routine_name;


-- ============================================================
-- V6: Ringkasan — fungsi yang masih bisa diakses anon
-- EKSPEKTASI: hanya 2 fungsi: get_public_market_stats & get_province_price_trends
-- ============================================================
SELECT r.routine_name, rp.grantee
FROM information_schema.routines r
JOIN information_schema.routine_privileges rp ON rp.specific_name = r.specific_name
WHERE r.routine_schema = 'public'
  AND rp.grantee = 'anon'
ORDER BY r.routine_name;
