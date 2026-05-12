-- =============================================================================
-- SECURITY HARDENING MIGRATION (v3 - based on full live audit B1+B2+C)
-- Tanggal: 2026-05-08
-- Fix semua warning dari Supabase Security Linter berdasarkan data live database.
--
-- HASIL AUDIT:
-- B1: 2 fungsi SECURITY DEFINER masih null search_path:
--     check_sembako_transaction_quota, deduct_batch_stock
-- B1: 3 fungsi BUKAN SECURITY DEFINER dengan null search_path:
--     enforce_payment_ceiling, recalculate_payment_status, prevent_profile_privilege_escalation
--     (tetap di-fix sebagai hygiene, tapi tidak di-flag oleh lint 0028/0029)
-- B2: Semua SECURITY DEFINER functions + signature terverifikasi
-- C:  Fungsi-fungsi berikut ada di authenticated EXECUTE tapi TIDAK SECURITY DEFINER
--     → tidak di-flag lint 0029, sengaja TIDAK di-REVOKE:
--     auto_resolve_loss_reports, deduct_egg_stock_on_sale, generate_egg_invoice_number,
--     generate_invoice_number, get_kandang_limit, set_updated_at, sync_rpa_outstanding,
--     sync_sale_payment, update_ai_conversations_updated_at, update_ai_pending_entries_updated_at,
--     update_cycle_summary, update_egg_customer_stats, update_farm_last_transaction
-- =============================================================================


-- ============================================================
-- BAGIAN 1: FIX function_search_path_mutable (lint 0011)
-- Hanya pakai ALTER FUNCTION - tidak sentuh body function
-- ============================================================

-- 1.1 SECURITY DEFINER + null search_path → WAJIB FIX
ALTER FUNCTION public.check_sembako_transaction_quota()
  SET search_path = '';

ALTER FUNCTION public.deduct_batch_stock(uuid, numeric)
  SET search_path = '';

-- 1.2 Bukan SECURITY DEFINER tapi tetap di-fix untuk hygiene
ALTER FUNCTION public.enforce_payment_ceiling()
  SET search_path = '';

ALTER FUNCTION public.recalculate_payment_status()
  SET search_path = '';

ALTER FUNCTION public.prevent_profile_privilege_escalation()
  SET search_path = '';


-- ============================================================
-- BAGIAN 2: FIX rls_policy_always_true (lint 0024)
-- ============================================================

-- 2.1 market_prices → mp_insert
-- Kolom live: id, price_date, chicken_type, region, source, submitted_by, needs_review, dll.
-- Tidak ada tenant_id — ini tabel harga pasar GLOBAL
-- Insert yang sah: superadmin via dashboard, atau source dari transaksi/scraper sistem
DROP POLICY IF EXISTS mp_insert ON public.market_prices;
CREATE POLICY mp_insert ON public.market_prices
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_superadmin()
    OR source IN ('transaction', 'auto_scraper', 'arboge_scraper', 'arboge_realisasi', 'arboge_referensi')
  );

-- 2.2 tenants → "Allow authenticated users to insert a tenant"
-- Kolom live profiles: auth_user_id (bukan profile_id), tenant_id
-- User hanya boleh buat tenant baru jika belum punya tenant (first-time onboarding)
DROP POLICY IF EXISTS "Allow authenticated users to insert a tenant" ON public.tenants;
CREATE POLICY "Allow authenticated users to insert a tenant" ON public.tenants
  FOR INSERT
  TO authenticated
  WITH CHECK (
    NOT EXISTS (
      SELECT 1
        FROM public.profiles
       WHERE auth_user_id = auth.uid()
         AND tenant_id IS NOT NULL
    )
  );


-- ============================================================
-- BAGIAN 3: FIX anon_security_definer_function_executable (lint 0028)
-- REVOKE EXECUTE FROM anon
-- Signature diverifikasi dari live audit B2
-- ============================================================

-- Fungsi-fungsi yang TIDAK boleh diakses anon
REVOKE EXECUTE ON FUNCTION public.activate_plan_on_invoice_paid()                        FROM anon;
REVOKE EXECUTE ON FUNCTION public.activate_plan_trial(uuid, text, integer)               FROM anon;
REVOKE EXECUTE ON FUNCTION public.aggregate_daily_market_price(date)                     FROM anon;
REVOKE EXECUTE ON FUNCTION public.auth_user_tenant_ids()                                 FROM anon;
REVOKE EXECUTE ON FUNCTION public.check_sembako_transaction_quota()                      FROM anon;
REVOKE EXECUTE ON FUNCTION public.create_new_business(text, text, text, text)            FROM anon;
REVOKE EXECUTE ON FUNCTION public.deduct_batch_stock(uuid, numeric)                      FROM anon;
REVOKE EXECUTE ON FUNCTION public.downgrade_expired_plans()                              FROM anon;
REVOKE EXECUTE ON FUNCTION public.enforce_rpa_invoice_quota()                            FROM anon;
REVOKE EXECUTE ON FUNCTION public.flag_market_price_outlier()                            FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_active_ternak_count(uuid, text)                    FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_my_tenant_id()                                     FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_my_tenant_ids()                                    FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_ternak_limit(uuid, text)                           FROM anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user()                                      FROM anon;
REVOKE EXECUTE ON FUNCTION public.increment_sapi_batch_animal_count(uuid)                FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_my_tenant(uuid)                                     FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_superadmin()                                        FROM anon;
REVOKE EXECUTE ON FUNCTION public.log_audit_action()                                     FROM anon;
REVOKE EXECUTE ON FUNCTION public.my_role()                                              FROM anon;
REVOKE EXECUTE ON FUNCTION public.my_tenant_id()                                         FROM anon;
REVOKE EXECUTE ON FUNCTION public.my_user_type()                                         FROM anon;
REVOKE EXECUTE ON FUNCTION public.recalc_sembako_customer_balance(uuid)                  FROM anon;
REVOKE EXECUTE ON FUNCTION public.record_market_price()                                  FROM anon;
REVOKE EXECUTE ON FUNCTION public.rpa_tenant_in_trial(uuid)                              FROM anon;
REVOKE EXECUTE ON FUNCTION public.sync_rpa_customer_outstanding()                        FROM anon;
REVOKE EXECUTE ON FUNCTION public.sync_sembako_customer_outstanding()                    FROM anon;
REVOKE EXECUTE ON FUNCTION public.tr_sync_sembako_balance()                              FROM anon;
REVOKE EXECUTE ON FUNCTION public.trg_peternak_generate_task_instances()                 FROM anon;
REVOKE EXECUTE ON FUNCTION public.trg_purchases_sync_market_price()                      FROM anon;
REVOKE EXECUTE ON FUNCTION public.trg_sales_sync_market_price()                          FROM anon;
REVOKE EXECUTE ON FUNCTION public.trg_sales_sync_rpa_outstanding()                       FROM anon;
REVOKE EXECUTE ON FUNCTION public.trg_sapi_breeding_birth_mating()                       FROM anon;
REVOKE EXECUTE ON FUNCTION public.trg_sapi_breeding_health_mark_dead()                   FROM anon;
REVOKE EXECUTE ON FUNCTION public.trg_sapi_breeding_mating_defaults()                    FROM anon;
REVOKE EXECUTE ON FUNCTION public.trg_sapi_breeding_sale_mark_sold()                     FROM anon;
REVOKE EXECUTE ON FUNCTION public.trg_sapi_breeding_weight_sync()                        FROM anon;
REVOKE EXECUTE ON FUNCTION public.trg_sapi_sync_animal_latest_weight()                   FROM anon;
REVOKE EXECUTE ON FUNCTION public.trg_sapi_sync_batch_mortality()                        FROM anon;
REVOKE EXECUTE ON FUNCTION public.update_sembako_product_stock()                         FROM anon;

-- DIKECUALIKAN dari REVOKE (sengaja public untuk landing page):
GRANT EXECUTE ON FUNCTION public.get_public_market_stats()                    TO anon;
GRANT EXECUTE ON FUNCTION public.get_province_price_trends(text, date, date)  TO anon;


-- ============================================================
-- BAGIAN 4: FIX authenticated_security_definer_function_executable (lint 0029)
-- REVOKE trigger-only & admin-only functions dari authenticated
-- ============================================================

-- Trigger-only: tidak boleh dipanggil langsung via RPC
REVOKE EXECUTE ON FUNCTION public.handle_new_user()                           FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.log_audit_action()                          FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.record_market_price()                       FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.flag_market_price_outlier()                 FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.trg_peternak_generate_task_instances()      FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.trg_purchases_sync_market_price()           FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.trg_sales_sync_market_price()               FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.trg_sales_sync_rpa_outstanding()            FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.trg_sapi_breeding_birth_mating()            FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.trg_sapi_breeding_health_mark_dead()        FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.trg_sapi_breeding_mating_defaults()         FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.trg_sapi_breeding_sale_mark_sold()          FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.trg_sapi_breeding_weight_sync()             FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.trg_sapi_sync_animal_latest_weight()        FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.trg_sapi_sync_batch_mortality()             FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.tr_sync_sembako_balance()                   FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.update_sembako_product_stock()              FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.enforce_rpa_invoice_quota()                 FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.check_sembako_transaction_quota()           FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.recalculate_payment_status()                FROM authenticated;

-- Admin/cron-only: tidak boleh dipanggil user biasa via RPC
REVOKE EXECUTE ON FUNCTION public.activate_plan_on_invoice_paid()             FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.downgrade_expired_plans()                   FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.sync_rpa_customer_outstanding()             FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.sync_sembako_customer_outstanding()         FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.aggregate_daily_market_price(date)          FROM authenticated;

-- Re-GRANT fungsi yang MEMANG dipanggil dari frontend via RPC:
-- (signature diverifikasi dari live audit)
GRANT EXECUTE ON FUNCTION public.activate_plan_trial(uuid, text, integer)     TO authenticated;
GRANT EXECUTE ON FUNCTION public.auth_user_tenant_ids()                        TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_new_business(text, text, text, text)   TO authenticated;
GRANT EXECUTE ON FUNCTION public.deduct_batch_stock(uuid, numeric)             TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_active_ternak_count(uuid, text)           TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_tenant_id()                            TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_tenant_ids()                           TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_public_market_stats()                     TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_province_price_trends(text, date, date)   TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_ternak_limit(uuid, text)                  TO authenticated;
GRANT EXECUTE ON FUNCTION public.increment_sapi_batch_animal_count(uuid)       TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_my_tenant(uuid)                            TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_superadmin()                               TO authenticated;
GRANT EXECUTE ON FUNCTION public.my_role()                                     TO authenticated;
GRANT EXECUTE ON FUNCTION public.my_tenant_id()                                TO authenticated;
GRANT EXECUTE ON FUNCTION public.my_user_type()                                TO authenticated;
GRANT EXECUTE ON FUNCTION public.recalc_sembako_customer_balance(uuid)         TO authenticated;
GRANT EXECUTE ON FUNCTION public.rpa_tenant_in_trial(uuid)                     TO authenticated;


-- ============================================================
-- BAGIAN 5: REVOKE TAMBAHAN (dari hasil verifikasi V5)
-- Fungsi-fungsi berikut bukan SECURITY DEFINER (tidak di-flag lint 0028)
-- tapi tetap tidak boleh diakses anon — revoke sebagai hygiene
-- ============================================================

REVOKE EXECUTE ON FUNCTION public.auto_resolve_loss_reports()            FROM anon;
REVOKE EXECUTE ON FUNCTION public.deduct_egg_stock_on_sale()             FROM anon;
REVOKE EXECUTE ON FUNCTION public.enforce_payment_ceiling()              FROM anon;
REVOKE EXECUTE ON FUNCTION public.generate_egg_invoice_number(uuid)      FROM anon;
REVOKE EXECUTE ON FUNCTION public.generate_invoice_number()              FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_kandang_limit(uuid)                FROM anon;
REVOKE EXECUTE ON FUNCTION public.prevent_profile_privilege_escalation() FROM anon;
REVOKE EXECUTE ON FUNCTION public.recalculate_payment_status()           FROM anon;
REVOKE EXECUTE ON FUNCTION public.set_updated_at()                       FROM anon;
REVOKE EXECUTE ON FUNCTION public.sync_rpa_outstanding()                 FROM anon;
REVOKE EXECUTE ON FUNCTION public.sync_sale_payment()                    FROM anon;
REVOKE EXECUTE ON FUNCTION public.update_ai_conversations_updated_at()   FROM anon;
REVOKE EXECUTE ON FUNCTION public.update_ai_pending_entries_updated_at() FROM anon;
REVOKE EXECUTE ON FUNCTION public.update_cycle_summary()                 FROM anon;
REVOKE EXECUTE ON FUNCTION public.update_egg_customer_stats()            FROM anon;
REVOKE EXECUTE ON FUNCTION public.update_farm_last_transaction()         FROM anon;
