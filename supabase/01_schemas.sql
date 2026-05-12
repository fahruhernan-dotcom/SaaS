-- 01_schemas.sql
-- Source: Supabase SCHEMAS.txt
-- Last sync: (Current)
-- DO NOT EDIT MANUALLY

CREATE SCHEMA IF NOT EXISTS "internal";
ALTER SCHEMA "internal" OWNER TO "postgres";
CREATE SCHEMA IF NOT EXISTS "public";
ALTER SCHEMA "public" OWNER TO "pg_database_owner";
CREATE SCHEMA IF NOT EXISTS "rpc";
ALTER SCHEMA "rpc" OWNER TO "postgres";