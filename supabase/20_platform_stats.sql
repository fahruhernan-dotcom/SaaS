-- 20_platform_stats.sql
-- Tabel platform_stats: single source of truth untuk public counter (Hero, StatsBar, Pricing, AboutUs)
-- Diisi oleh pg_cron job setiap 1 jam dari data real transaksi / tenant / listing
-- DO NOT EDIT MANUALLY

SET search_path TO public, extensions;

-- ─── Tabel ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.platform_stats (
  id              bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  active_businesses   integer NOT NULL DEFAULT 0,   -- jumlah tenant aktif (login 30hr terakhir)
  total_transactions  bigint  NOT NULL DEFAULT 0,   -- total row dari semua tabel transaksi
  transaction_volume  bigint  NOT NULL DEFAULT 0,   -- total rupiah dari transaksi
  market_listings     integer NOT NULL DEFAULT 0,   -- row aktif di tabel listings/harga_pasar
  updated_at          timestamp with time zone NOT NULL DEFAULT now()
);

-- Index untuk query latest
CREATE INDEX IF NOT EXISTS idx_platform_stats_updated_at ON public.platform_stats(updated_at DESC);

-- ─── RLS ──────────────────────────────────────────────────────────────────────
ALTER TABLE public.platform_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_stats FORCE ROW LEVEL SECURITY;

-- Tabel ini hanya READ — siapapun boleh baca (public landing page)
CREATE POLICY "platform_stats_read_public"
  ON public.platform_stats FOR SELECT
  USING (true);

-- Hanya service_role yang boleh insert/update (dari pg_cron / edge function)
CREATE POLICY "platform_stats_write_service"
  ON public.platform_stats FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "platform_stats_update_service"
  ON public.platform_stats FOR UPDATE
  USING (auth.role() = 'service_role');

-- ─── Grant ────────────────────────────────────────────────────────────────────
GRANT SELECT ON public.platform_stats TO anon, authenticated;
GRANT INSERT, UPDATE ON public.platform_stats TO service_role;
GRANT USAGE ON SEQUENCE public.platform_stats_id_seq TO service_role;

-- ─── Fungsi refresh (dipanggil oleh pg_cron atau edge function) ───────────────
CREATE OR REPLACE FUNCTION public.refresh_platform_stats()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_active_businesses   integer;
  v_total_transactions  bigint;
  v_transaction_volume  bigint;
  v_market_listings     integer;
BEGIN
  -- 1. Active businesses: tenant yang login dalam 30 hari terakhir
  SELECT COUNT(DISTINCT tenant_id)
    INTO v_active_businesses
    FROM public.tenants
   WHERE last_seen_at > now() - interval '30 days'
     AND status = 'active';

  -- 2. Total transaksi: gabungan dari semua tabel transaksi utama
  SELECT (
    (SELECT COUNT(*) FROM public.poultry_transactions) +
    (SELECT COUNT(*) FROM public.sembako_transactions) +
    (SELECT COUNT(*) FROM public.staged_transactions WHERE status = 'completed')
  ) INTO v_total_transactions;

  -- 3. Volume transaksi: estimasi dari nilai real (harga * qty / bobot)
  SELECT COALESCE(
    (SELECT SUM(COALESCE(total_nilai, 0)) FROM public.poultry_transactions), 0
  ) + COALESCE(
    (SELECT SUM(COALESCE(total_harga, 0)) FROM public.sembako_transactions), 0
  ) INTO v_transaction_volume;

  -- 4. Market listings: listing aktif di harga pasar
  SELECT COUNT(*)
    INTO v_market_listings
    FROM public.harga_pasar
   WHERE is_active = true
     AND created_at > now() - interval '7 days';

  -- Upsert: insert baris baru setiap refresh (retention 7 hari, cleanup by cron)
  INSERT INTO public.platform_stats (
    active_businesses,
    total_transactions,
    transaction_volume,
    market_listings,
    updated_at
  ) VALUES (
    COALESCE(v_active_businesses, 0),
    COALESCE(v_total_transactions, 0),
    COALESCE(v_transaction_volume, 0),
    COALESCE(v_market_listings, 0),
    now()
  );

  -- Bersihkan baris lama > 7 hari
  DELETE FROM public.platform_stats
   WHERE updated_at < now() - interval '7 days';
END;
$$;

-- Revoke execute dari public untuk keamanan
REVOKE EXECUTE ON FUNCTION public.refresh_platform_stats() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.refresh_platform_stats() TO service_role;

-- ─── Seed awal (1 baris placeholder agar query tidak kosong saat pertama) ─────
INSERT INTO public.platform_stats (active_businesses, total_transactions, transaction_volume, market_listings, updated_at)
SELECT 0, 0, 0, 0, now()
WHERE NOT EXISTS (SELECT 1 FROM public.platform_stats);

-- ─── Jadwal pg_cron (jalankan manual atau via Supabase Dashboard cron) ─────────
-- Uncomment & run sebagai superuser di Supabase SQL Editor:
-- SELECT cron.schedule('refresh-platform-stats', '0 * * * *', 'SELECT public.refresh_platform_stats()');
