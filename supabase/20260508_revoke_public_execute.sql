-- =============================================================================
-- MIGRATION: REVOKE DEFAULT PUBLIC EXECUTE GRANT
-- Supabase Lint 0028 (anon) + 0029 (authenticated)
-- 
-- ROOT CAUSE: PostgreSQL memberikan EXECUTE ke PUBLIC secara default
-- saat fungsi dibuat. REVOKE dari anon/authenticated tidak cukup karena
-- privilege berasal dari PUBLIC. Harus REVOKE FROM PUBLIC dulu.
--
-- STRATEGI:
--   1. REVOKE EXECUTE FROM PUBLIC untuk semua fungsi SECURITY DEFINER
--   2. GRANT kembali ke authenticated untuk fungsi yang dibutuhkan frontend
--   3. GRANT ke anon hanya untuk fungsi data publik (market stats)
--   4. Fungsi trigger/internal tidak di-GRANT ke siapapun
-- =============================================================================


-- ============================================================
-- STEP 1: REVOKE FROM PUBLIC — hapus default grant
-- Ini menghapus akses dari anon, authenticated, dan public sekaligus
-- ============================================================

-- Trigger functions (dipanggil oleh trigger engine, bukan oleh role)
REVOKE EXECUTE ON FUNCTION public.trg_peternak_generate_task_instances()  FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.trg_purchases_sync_market_price()        FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.trg_sales_sync_market_price()            FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.trg_sales_sync_rpa_outstanding()         FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.trg_sapi_breeding_birth_mating()         FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.trg_sapi_breeding_health_mark_dead()     FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.trg_sapi_breeding_mating_defaults()      FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.trg_sapi_breeding_sale_mark_sold()       FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.trg_sapi_breeding_weight_sync()          FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.trg_sapi_sync_animal_latest_weight()     FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.trg_sapi_sync_batch_mortality()          FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.tr_sync_sembako_balance()                FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_user()                        FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.record_market_price()                    FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.log_audit_action()                       FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.flag_market_price_outlier()              FROM PUBLIC;

-- Admin/cron functions (hanya boleh dipanggil oleh supabase internal / postgres)
REVOKE EXECUTE ON FUNCTION public.activate_plan_on_invoice_paid()          FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.aggregate_daily_market_price(date)       FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.check_sembako_transaction_quota()        FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.downgrade_expired_plans()                FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.enforce_rpa_invoice_quota()              FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.sync_rpa_customer_outstanding()          FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.sync_sembako_customer_outstanding()      FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.update_sembako_product_stock()           FROM PUBLIC;

-- Frontend RPCs & RLS helpers (akan di-GRANT kembali ke authenticated di Step 2)
REVOKE EXECUTE ON FUNCTION public.activate_plan_trial(uuid, text, integer)                          FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.auth_user_tenant_ids()                                            FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.create_new_business(text, text, text, text)                       FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.deduct_batch_stock(uuid, numeric)                                 FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_active_ternak_count(uuid, text)                               FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_my_tenant_id()                                                FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_my_tenant_ids()                                               FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_public_market_stats()                                         FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_province_price_trends(text, date, date)                       FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_ternak_limit(uuid, text)                                      FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.increment_sapi_batch_animal_count(uuid)                           FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_my_tenant(uuid)                                                FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_superadmin()                                                   FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.my_role()                                                         FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.my_tenant_id()                                                    FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.my_user_type()                                                    FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.recalc_sembako_customer_balance(uuid)                             FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.rpa_tenant_in_trial(uuid)                                         FROM PUBLIC;


-- ============================================================
-- STEP 2: GRANT kembali ke authenticated
-- Hanya fungsi yang memang dibutuhkan oleh user login:
-- (a) RPC yang dipanggil dari frontend
-- (b) Helper functions yang dipakai di dalam RLS policies
--     (WAJIB karena RLS akan error jika user tidak punya EXECUTE)
-- ============================================================

-- RLS helpers — HARUS ada karena dipakai di dalam WHERE clause RLS policies
GRANT EXECUTE ON FUNCTION public.is_superadmin()                                     TO authenticated;
GRANT EXECUTE ON FUNCTION public.my_tenant_id()                                      TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_my_tenant(uuid)                                  TO authenticated;
GRANT EXECUTE ON FUNCTION public.auth_user_tenant_ids()                              TO authenticated;
GRANT EXECUTE ON FUNCTION public.my_role()                                           TO authenticated;
GRANT EXECUTE ON FUNCTION public.my_user_type()                                      TO authenticated;
GRANT EXECUTE ON FUNCTION public.rpa_tenant_in_trial(uuid)                           TO authenticated;

-- Frontend RPCs — dipanggil langsung dari kode React via supabase.rpc()
GRANT EXECUTE ON FUNCTION public.activate_plan_trial(uuid, text, integer)            TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_new_business(text, text, text, text)         TO authenticated;
GRANT EXECUTE ON FUNCTION public.deduct_batch_stock(uuid, numeric)                   TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_active_ternak_count(uuid, text)                 TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_tenant_id()                                  TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_tenant_ids()                                 TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_public_market_stats()                           TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_province_price_trends(text, date, date)         TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_ternak_limit(uuid, text)                        TO authenticated;
GRANT EXECUTE ON FUNCTION public.increment_sapi_batch_animal_count(uuid)             TO authenticated;
GRANT EXECUTE ON FUNCTION public.recalc_sembako_customer_balance(uuid)               TO authenticated;


-- ============================================================
-- STEP 3: GRANT ke anon — HANYA fungsi data publik
-- Dipakai di HargaPasarPublic.jsx dan landing page (tanpa login)
-- ============================================================

GRANT EXECUTE ON FUNCTION public.get_public_market_stats()                           TO anon;
GRANT EXECUTE ON FUNCTION public.get_province_price_trends(text, date, date)         TO anon;
