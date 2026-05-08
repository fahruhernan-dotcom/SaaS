-- =============================================================================
-- AUDIT KOMPREHENSIF: DML Permissions & RLS
-- Tujuan: Lihat SEMUA hal yang bisa memblokir SELECT/INSERT/UPDATE/DELETE
-- Cara pakai: Jalankan tiap blok satu-satu di Supabase SQL Editor
-- =============================================================================


-- ============================================================
-- 1. TABEL: RLS ENABLED / DISABLED
--    Tabel yang RLS-nya OFF = siapa pun bisa akses penuh (bahaya!)
--    Tabel yang RLS-nya ON tapi TIDAK ADA policy = semua operasi diblokir!
-- ============================================================

SELECT
  c.relname                            AS table_name,
  c.relrowsecurity                     AS rls_enabled,
  c.relforcerowsecurity                AS rls_forced,
  COUNT(p.policyname)                  AS policy_count,
  CASE
    WHEN NOT c.relrowsecurity          THEN '⚠️  RLS OFF — tidak ada proteksi'
    WHEN COUNT(p.policyname) = 0       THEN '🔴 RLS ON tapi 0 policy — semua DML DIBLOKIR'
    ELSE                                    '✅ OK (' || COUNT(p.policyname) || ' policy)'
  END                                  AS status
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
LEFT JOIN pg_policies p
  ON p.schemaname = 'public' AND p.tablename = c.relname
WHERE n.nspname = 'public'
  AND c.relkind = 'r'
GROUP BY c.relname, c.relrowsecurity, c.relforcerowsecurity
ORDER BY rls_enabled, table_name;


-- ============================================================
-- 2. SEMUA POLICY: per tabel, per command, per role
--    Ini adalah sumber utama yang mengizinkan/memblokir DML
-- ============================================================

SELECT
  tablename,
  policyname,
  cmd,
  roles,
  CASE
    WHEN qual        = 'true' THEN '⚠️  ALWAYS TRUE'
    WHEN qual        IS NULL  THEN '—'
    ELSE LEFT(qual, 80)
  END                                  AS using_clause,
  CASE
    WHEN with_check  = 'true' THEN '⚠️  ALWAYS TRUE'
    WHEN with_check  IS NULL  THEN '—'
    ELSE LEFT(with_check, 80)
  END                                  AS with_check_clause
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, cmd, policyname;


-- ============================================================
-- 3. RINGKASAN PER TABEL: coverage DML
--    Tampilkan tabel mana saja yang TIDAK punya policy untuk
--    SELECT / INSERT / UPDATE / DELETE secara terpisah
-- ============================================================

WITH tabel AS (
  SELECT c.relname AS tbl
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public' AND c.relkind = 'r' AND c.relrowsecurity
),
policy_coverage AS (
  SELECT
    tablename,
    bool_or(cmd IN ('SELECT','ALL')) AS has_select,
    bool_or(cmd IN ('INSERT','ALL')) AS has_insert,
    bool_or(cmd IN ('UPDATE','ALL')) AS has_update,
    bool_or(cmd IN ('DELETE','ALL')) AS has_delete
  FROM pg_policies
  WHERE schemaname = 'public'
  GROUP BY tablename
)
SELECT
  t.tbl                                AS table_name,
  COALESCE(pc.has_select, false)       AS select_policy,
  COALESCE(pc.has_insert, false)       AS insert_policy,
  COALESCE(pc.has_update, false)       AS update_policy,
  COALESCE(pc.has_delete, false)       AS delete_policy,
  CASE
    WHEN pc.tablename IS NULL THEN '🔴 SEMUA DML DIBLOKIR (0 policy)'
    WHEN NOT COALESCE(pc.has_select, false) THEN '⚠️  SELECT diblokir'
    ELSE '✅'
  END                                  AS note
FROM tabel t
LEFT JOIN policy_coverage pc ON pc.tablename = t.tbl
ORDER BY note DESC, t.tbl;


-- ============================================================
-- 4. POLICY TERLALU LONGGAR: USING(true) atau WITH CHECK(true)
--    Ini izinkan siapa saja tanpa filter → potensi data leak
-- ============================================================

SELECT
  tablename,
  policyname,
  cmd,
  roles,
  qual        AS using_clause,
  with_check  AS with_check_clause
FROM pg_policies
WHERE schemaname = 'public'
  AND (qual = 'true' OR with_check = 'true')
ORDER BY tablename, cmd;


-- ============================================================
-- 5. EXECUTE PERMISSIONS: siapa bisa panggil function via RPC
--    anon     = bisa dipanggil tanpa login (bahaya kalau sensitif)
--    authenticated = user yang sudah login
-- ============================================================

SELECT
  r.routine_name                       AS function_name,
  pg_get_function_arguments(
    (SELECT p.oid FROM pg_proc p
     JOIN pg_namespace n ON n.oid = p.pronamespace
     WHERE n.nspname = 'public' AND p.proname = r.routine_name
     LIMIT 1)
  )                                    AS arguments,
  string_agg(DISTINCT rp.grantee, ', ' ORDER BY rp.grantee)  AS granted_to,
  bool_or(rp.grantee = 'anon')        AS anon_can_call,
  bool_or(rp.grantee = 'authenticated') AS auth_can_call
FROM information_schema.routines r
JOIN information_schema.routine_privileges rp
  ON rp.specific_name = r.specific_name
WHERE r.routine_schema = 'public'
GROUP BY r.routine_name
ORDER BY anon_can_call DESC, r.routine_name;


-- ============================================================
-- 6. SECURITY DEFINER FUNCTIONS: search_path check
--    Kolom set_config HARUS berisi 'search_path=...' atau ''
--    Kalau NULL → path injection risk
-- ============================================================

SELECT
  p.proname                            AS function_name,
  pg_get_function_arguments(p.oid)    AS arguments,
  p.prosecdef                          AS is_security_definer,
  p.proconfig                          AS set_config,
  CASE
    WHEN p.prosecdef AND p.proconfig IS NULL
      THEN '🔴 SECURITY DEFINER + search_path NULL (lint 0011)'
    WHEN p.prosecdef AND p.proconfig IS NOT NULL
      THEN '✅ SECURITY DEFINER + search_path terkunci'
    WHEN NOT p.prosecdef AND p.proconfig IS NULL
      THEN '⚠️  non-SECDEF + search_path NULL (hygiene)'
    ELSE '✅ OK'
  END                                  AS status
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.prolang != (SELECT oid FROM pg_language WHERE lanname = 'c')
ORDER BY is_security_definer DESC, function_name;


-- ============================================================
-- 7. TRIGGER FUNCTIONS: tabel + event + function yang dipanggil
--    Trigger function biasanya bukan SECURITY DEFINER tapi
--    perlu diketahui mana yang aktif
-- ============================================================

SELECT
  t.tgname                             AS trigger_name,
  c.relname                            AS table_name,
  CASE t.tgtype & 2  WHEN 2 THEN 'BEFORE' ELSE 'AFTER'  END AS timing,
  CASE
    WHEN t.tgtype & 4  != 0 THEN 'INSERT '  ELSE '' END ||
    CASE
    WHEN t.tgtype & 8  != 0 THEN 'DELETE '  ELSE '' END ||
    CASE
    WHEN t.tgtype & 16 != 0 THEN 'UPDATE '  ELSE '' END      AS events,
  p.proname                            AS function_called,
  p.prosecdef                          AS fn_is_security_definer
FROM pg_trigger t
JOIN pg_class c    ON c.oid = t.tgrelid
JOIN pg_namespace n ON n.oid = c.relnamespace
JOIN pg_proc p     ON p.oid = t.tgfoid
WHERE n.nspname = 'public'
  AND NOT t.tgisinternal
ORDER BY table_name, timing, events;


-- ============================================================
-- 8. FOREIGN KEY CONSTRAINTS
--    FK yang ON DELETE CASCADE / RESTRICT bisa memengaruhi
--    keberhasilan DELETE di tabel parent
-- ============================================================

SELECT
  tc.table_name                        AS source_table,
  kcu.column_name                      AS source_column,
  ccu.table_name                       AS ref_table,
  ccu.column_name                      AS ref_column,
  rc.delete_rule                       AS on_delete,
  rc.update_rule                       AS on_update
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
  ON kcu.constraint_name = tc.constraint_name
  AND kcu.table_schema = tc.table_schema
JOIN information_schema.referential_constraints rc
  ON rc.constraint_name = tc.constraint_name
  AND rc.constraint_schema = tc.table_schema
JOIN information_schema.constraint_column_usage ccu
  ON ccu.constraint_name = rc.unique_constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
ORDER BY source_table, source_column;
