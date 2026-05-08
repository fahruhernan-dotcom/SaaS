-- =============================================================================
-- AUDIT QUERY: Jalankan ini di Supabase SQL Editor
-- Tujuan: Lihat kondisi live database sebelum apply security fix
-- =============================================================================


-- ============================================================
-- A. Kolom tabel yang bermasalah di lint
-- ============================================================

-- A1. Kolom market_prices (untuk fix policy mp_insert)
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'market_prices'
ORDER BY ordinal_position;

-- A2. Kolom tabel tenants (untuk fix policy insert)
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'tenants'
ORDER BY ordinal_position;

-- A3. Kolom tabel profiles (untuk fix policy tenants insert)
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'profiles'
ORDER BY ordinal_position;


-- ============================================================
-- B. Fungsi-fungsi bermasalah: signature & search_path
-- ============================================================

-- B1. Cek 5 fungsi dengan search_path mutable
SELECT
  p.proname            AS function_name,
  pg_get_function_arguments(p.oid) AS arguments,
  p.prosecdef          AS is_security_definer,
  p.proconfig          AS set_config,   -- kalau sudah di-set akan ada 'search_path=...'
  l.lanname            AS language
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
JOIN pg_language l  ON l.oid = p.prolang
WHERE n.nspname = 'public'
  AND p.proname IN (
    'enforce_payment_ceiling',
    'recalculate_payment_status',
    'check_sembako_transaction_quota',
    'prevent_profile_privilege_escalation',
    'deduct_batch_stock'
  )
ORDER BY p.proname;

-- B2. Semua SECURITY DEFINER functions di schema public beserta signature lengkap
SELECT
  p.proname            AS function_name,
  pg_get_function_arguments(p.oid) AS arguments,
  p.proconfig          AS set_config,
  l.lanname            AS language,
  p.prosecdef          AS is_security_definer
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
JOIN pg_language l  ON l.oid = p.prolang
WHERE n.nspname = 'public'
  AND p.prosecdef = true
ORDER BY p.proname;


-- ============================================================
-- C. Hak akses (EXECUTE) per fungsi & per role
-- ============================================================

-- C1. Fungsi yang bisa diakses oleh anon
SELECT
  r.routine_name,
  r.specific_name,
  rp.grantee,
  rp.privilege_type
FROM information_schema.routines r
JOIN information_schema.routine_privileges rp
  ON rp.specific_name = r.specific_name
WHERE r.routine_schema = 'public'
  AND rp.grantee = 'anon'
ORDER BY r.routine_name;

-- C2. Fungsi yang bisa diakses oleh authenticated
SELECT
  r.routine_name,
  rp.grantee,
  rp.privilege_type
FROM information_schema.routines r
JOIN information_schema.routine_privileges rp
  ON rp.specific_name = r.specific_name
WHERE r.routine_schema = 'public'
  AND rp.grantee = 'authenticated'
ORDER BY r.routine_name;


-- ============================================================
-- D. RLS Policies yang bermasalah
-- ============================================================

-- D1. Semua INSERT/UPDATE/DELETE policies yang punya WITH CHECK (true)
SELECT
  schemaname,
  tablename,
  policyname,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND with_check = 'true'
  AND cmd IN ('INSERT', 'UPDATE', 'ALL')
ORDER BY tablename, policyname;

-- D2. Semua policy di tabel market_prices & tenants (lihat kondisi terkini)
SELECT
  tablename,
  policyname,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('market_prices', 'tenants')
ORDER BY tablename, policyname;
