-- ══════════════════════════════════════════════════════════════════════
-- PERFORMANCE & SCHEDULE FIXES
-- 1. Tambah Partial Indexes untuk is_deleted
-- 2. Setup pg_cron untuk downgrade expired plans (jika pg_cron tersedia)
-- 3. Hapus fungsi recalc tanpa parameter (mencegah N+1)
-- ══════════════════════════════════════════════════════════════════════

BEGIN;

-- ─────────────────────────────────────────────────────────────────────
-- 1. PERFORMANCE: Partial Indexes untuk optimasi query (WHERE is_deleted = false)
-- Sangat penting untuk tabel yang ukurannya membesar secara cepat
-- ─────────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_sembako_sales_active 
  ON public.sembako_sales(tenant_id, transaction_date DESC) 
  WHERE is_deleted = false;

CREATE INDEX IF NOT EXISTS idx_domba_peng_feed_active
  ON public.domba_penggemukan_feed_logs(batch_id, log_date DESC)
  WHERE is_deleted = false;

CREATE INDEX IF NOT EXISTS idx_domba_peng_health_active
  ON public.domba_penggemukan_health_logs(batch_id, log_date DESC)
  WHERE is_deleted = false;


-- ─────────────────────────────────────────────────────────────────────
-- 2. SECURITY & REVENUE LEAK: Downgrade Plans Scheduler
-- Menggunakan pg_cron (ekstensi Supabase bawaan) untuk trigger otomatis
-- ─────────────────────────────────────────────────────────────────────

-- Aktifkan ekstensi pg_cron jika belum ada (hanya bisa jalan kalau user punya previlese yang cukup)
CREATE EXTENSION IF NOT EXISTS pg_cron;

DO $$ 
BEGIN
  -- Coba tambahkan cron job jika belum ada
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    -- Hapus job lama kalau ada biar bersih
    PERFORM cron.unschedule('downgrade-expired-plans');
    
    -- Schedule ulang setiap jam 01:00 pagi
    PERFORM cron.schedule(
      'downgrade-expired-plans',
      '0 1 * * *',
      'SELECT public.downgrade_expired_plans();'
    );
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    -- Skip secara aman jika user bukan superuser atau pg_cron dibatasi
    RAISE NOTICE 'Skipping pg_cron setup. Pastikan dijalankan sebagai superuser PostgreSQL.';
END $$;

-- ─────────────────────────────────────────────────────────────────────
-- 3. FUNCTION AMBIGUITY: Hapus versi tanpa argumen dari recalc_sembako
-- Mencegah N+1 recalc dan reset saldo tidak sengaja
-- ─────────────────────────────────────────────────────────────────────

-- Hapus overload yang TIDAK memiliki parameter (sangat berbahaya jika terpanggil)
DROP FUNCTION IF EXISTS public.recalc_sembako_customer_balance();

-- Biarkan recalc_sembako_customer_balance(uuid) tetap ada karena itu yang benar

COMMIT;
