-- 03_role_memberships.sql
-- Generated from Supabase ROLE MEMBERSHIPS.txt
-- Last sync: 2026-05-12
-- DO NOT EDIT MANUALLY — regenerate from snapshot .txt

DO $$\nBEGIN\n  GRANT "pg_read_all_settings" TO "pg_monitor";
  GRANT "pg_read_all_stats" TO "pg_monitor";
  GRANT "pg_stat_scan_tables" TO "pg_monitor";
  GRANT "pg_read_all_data" TO "supabase_etl_admin";
  GRANT "pg_read_all_data" TO "supabase_read_only_user";
  GRANT "anon" TO "authenticator";
  GRANT "authenticated" TO "authenticator";
  GRANT "service_role" TO "authenticator";
  GRANT "authenticator" TO "supabase_storage_admin";
  GRANT "anon" TO "postgres";
  GRANT "authenticated" TO "postgres";
  GRANT "service_role" TO "postgres";
  GRANT "authenticator" TO "postgres";
  GRANT "pg_monitor" TO "postgres";
  GRANT "pg_read_all_data" TO "postgres";
  GRANT "pg_signal_backend" TO "postgres";
  GRANT "pg_monitor" TO "supabase_etl_admin";
  GRANT "pg_monitor" TO "supabase_read_only_user";
  GRANT "pg_create_subscription" TO "postgres";
  GRANT "supabase_realtime_admin" TO "postgres";
  GRANT "postgres" TO "cli_login_postgres";
  GRANT "supabase_privileged_role" TO "postgres";
  GRANT "supabase_privileged_role" TO "supabase_etl_admin";
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

