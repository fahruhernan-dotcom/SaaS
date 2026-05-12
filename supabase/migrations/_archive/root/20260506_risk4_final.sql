-- ══════════════════════════════════════════════════════════════════════
-- RISK 4 FINAL FIX v2 — berdasarkan definisi AKTUAL dari live DB
-- Verified dari: SELECT qual, with_check FROM pg_policies
-- ══════════════════════════════════════════════════════════════════════

BEGIN;

-- ─────────────────────────────────────────────────────────────────────
-- STEP 1: DROP 4 policies yang bergantung pada kolom deprecated
-- Nama policy persis sesuai live DB
-- ─────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "connections_select"  ON public.broker_connections;
DROP POLICY IF EXISTS "connections_insert"  ON public.broker_connections;
DROP POLICY IF EXISTS "connections_update"  ON public.broker_connections;
DROP POLICY IF EXISTS "listings_select"     ON public.stock_listings;

-- ─────────────────────────────────────────────────────────────────────
-- STEP 2: DROP kolom deprecated dari broker_connections
-- (peternak_tenant_id & broker_tenant_id)
-- CATATAN: stock_listings.peternak_tenant_id TIDAK dihapus (kolom berbeda)
-- ─────────────────────────────────────────────────────────────────────
ALTER TABLE public.broker_connections
  DROP COLUMN IF EXISTS peternak_tenant_id,
  DROP COLUMN IF EXISTS broker_tenant_id;

-- ─────────────────────────────────────────────────────────────────────
-- STEP 3: RECREATE connections_select
-- Original: peternak_tenant_id = me OR broker_tenant_id = me OR superadmin
-- New:      requester          = me OR target           = me OR superadmin
-- ─────────────────────────────────────────────────────────────────────
CREATE POLICY "connections_select"
  ON public.broker_connections
  FOR SELECT TO public
  USING (
    (requester_tenant_id = my_tenant_id())
    OR (target_tenant_id = my_tenant_id())
    OR is_superadmin()
  );

-- ─────────────────────────────────────────────────────────────────────
-- STEP 4: RECREATE connections_insert
-- Original: WITH CHECK peternak_tenant_id = me OR broker_tenant_id = me
-- (keduanya boleh insert — siapapun yang menginisiasi koneksi)
-- New:      requester = me (yang insert harus set dirinya sebagai requester)
--           OR target = me (fallback jika flow terbalik, konsisten dg original)
-- ─────────────────────────────────────────────────────────────────────
CREATE POLICY "connections_insert"
  ON public.broker_connections
  FOR INSERT TO public
  WITH CHECK (
    (requester_tenant_id = my_tenant_id())
    OR (target_tenant_id = my_tenant_id())
  );

-- ─────────────────────────────────────────────────────────────────────
-- STEP 5: RECREATE connections_update
-- Original: peternak_tenant_id = me OR broker_tenant_id = me OR superadmin
-- New:      requester          = me OR target           = me OR superadmin
-- ─────────────────────────────────────────────────────────────────────
CREATE POLICY "connections_update"
  ON public.broker_connections
  FOR UPDATE TO public
  USING (
    (requester_tenant_id = my_tenant_id())
    OR (target_tenant_id = my_tenant_id())
    OR is_superadmin()
  );

-- ─────────────────────────────────────────────────────────────────────
-- STEP 6: RECREATE listings_select di stock_listings
-- PENTING: stock_listings.peternak_tenant_id = kolom di stock_listings (TIDAK dihapus)
--
-- Original EXISTS check:
--   broker_connections.peternak_tenant_id = stock_listings.peternak_tenant_id
--   AND broker_connections.broker_tenant_id = my_tenant_id()
--   (hanya 1 arah: broker yg terkoneksi ke peternak ini)
--
-- New EXISTS check (2 arah — siapapun yg initiasi, broker tetap bisa lihat):
--   Arah A: peternak request → broker (me) jadi target
--   Arah B: broker (me) request → peternak jadi target
-- ─────────────────────────────────────────────────────────────────────
CREATE POLICY "listings_select"
  ON public.stock_listings
  FOR SELECT TO public
  USING (
    (peternak_tenant_id = my_tenant_id())   -- pemilik listing sendiri
    OR (visible_to = 'public'::text)
    OR is_superadmin()
    OR (
      (visible_to = 'connected'::text)
      AND (EXISTS (
        SELECT 1 FROM public.broker_connections bc
        WHERE bc.status = 'active'::text
          AND (
            -- Arah A: peternak adalah requester, broker (me) adalah target
            (bc.requester_tenant_id = stock_listings.peternak_tenant_id
             AND bc.target_tenant_id = my_tenant_id())
            OR
            -- Arah B: broker (me) adalah requester, peternak adalah target
            (bc.requester_tenant_id = my_tenant_id()
             AND bc.target_tenant_id = stock_listings.peternak_tenant_id)
          )
      ))
    )
  );

-- ─────────────────────────────────────────────────────────────────────
-- STEP 7: Verifikasi kolom deprecated sudah hilang
-- ─────────────────────────────────────────────────────────────────────
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'broker_connections'
  AND column_name IN ('peternak_tenant_id', 'broker_tenant_id');
-- Expected: No rows returned ✅

-- Verifikasi 4 policy baru sudah terbuat
SELECT policyname, tablename, cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND (
    (tablename = 'broker_connections' AND policyname IN ('connections_select','connections_insert','connections_update'))
    OR (tablename = 'stock_listings' AND policyname = 'listings_select')
  )
ORDER BY tablename, policyname;
-- Expected: 4 rows ✅

COMMIT;
