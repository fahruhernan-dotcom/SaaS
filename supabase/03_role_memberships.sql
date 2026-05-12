-- 03_role_memberships.sql
-- Source: Supabase ROLE MEMBERSHIPS.txt
-- Last sync: (Current)
-- DO NOT EDIT MANUALLY

DO $body$
BEGIN
  BEGIN
    EXECUTE 'GRANT "pg_monitor" TO "pg_read_all_settings"';
  EXCEPTION WHEN undefined_object THEN NULL;
  END;
  BEGIN
    EXECUTE 'GRANT "pg_monitor" TO "pg_read_all_stats"';
  EXCEPTION WHEN undefined_object THEN NULL;
  END;
  BEGIN
    EXECUTE 'GRANT "pg_monitor" TO "pg_stat_scan_tables"';
  EXCEPTION WHEN undefined_object THEN NULL;
  END;
  BEGIN
    EXECUTE 'GRANT "supabase_etl_admin" TO "pg_read_all_data"';
  EXCEPTION WHEN undefined_object THEN NULL;
  END;
  BEGIN
    EXECUTE 'GRANT "supabase_read_only_user" TO "pg_read_all_data"';
  EXCEPTION WHEN undefined_object THEN NULL;
  END;
  BEGIN
    EXECUTE 'GRANT "authenticator" TO "anon"';
  EXCEPTION WHEN undefined_object THEN NULL;
  END;
  BEGIN
    EXECUTE 'GRANT "authenticator" TO "authenticated"';
  EXCEPTION WHEN undefined_object THEN NULL;
  END;
  BEGIN
    EXECUTE 'GRANT "authenticator" TO "service_role"';
  EXCEPTION WHEN undefined_object THEN NULL;
  END;
  BEGIN
    EXECUTE 'GRANT "supabase_storage_admin" TO "authenticator"';
  EXCEPTION WHEN undefined_object THEN NULL;
  END;
  BEGIN
    EXECUTE 'GRANT "postgres" TO "anon"';
  EXCEPTION WHEN undefined_object THEN NULL;
  END;
  BEGIN
    EXECUTE 'GRANT "postgres" TO "authenticated"';
  EXCEPTION WHEN undefined_object THEN NULL;
  END;
  BEGIN
    EXECUTE 'GRANT "postgres" TO "service_role"';
  EXCEPTION WHEN undefined_object THEN NULL;
  END;
  BEGIN
    EXECUTE 'GRANT "postgres" TO "authenticator"';
  EXCEPTION WHEN undefined_object THEN NULL;
  END;
  BEGIN
    EXECUTE 'GRANT "postgres" TO "pg_monitor"';
  EXCEPTION WHEN undefined_object THEN NULL;
  END;
  BEGIN
    EXECUTE 'GRANT "postgres" TO "pg_read_all_data"';
  EXCEPTION WHEN undefined_object THEN NULL;
  END;
  BEGIN
    EXECUTE 'GRANT "postgres" TO "pg_signal_backend"';
  EXCEPTION WHEN undefined_object THEN NULL;
  END;
  BEGIN
    EXECUTE 'GRANT "supabase_etl_admin" TO "pg_monitor"';
  EXCEPTION WHEN undefined_object THEN NULL;
  END;
  BEGIN
    EXECUTE 'GRANT "supabase_read_only_user" TO "pg_monitor"';
  EXCEPTION WHEN undefined_object THEN NULL;
  END;
  BEGIN
    EXECUTE 'GRANT "postgres" TO "pg_create_subscription"';
  EXCEPTION WHEN undefined_object THEN NULL;
  END;
  BEGIN
    EXECUTE 'GRANT "postgres" TO "supabase_realtime_admin"';
  EXCEPTION WHEN undefined_object THEN NULL;
  END;
  BEGIN
    EXECUTE 'GRANT "cli_login_postgres" TO "postgres"';
  EXCEPTION WHEN undefined_object THEN NULL;
  END;
  BEGIN
    EXECUTE 'GRANT "postgres" TO "supabase_privileged_role"';
  EXCEPTION WHEN undefined_object THEN NULL;
  END;
  BEGIN
    EXECUTE 'GRANT "supabase_etl_admin" TO "supabase_privileged_role"';
  EXCEPTION WHEN undefined_object THEN NULL;
  END;
END $body$;