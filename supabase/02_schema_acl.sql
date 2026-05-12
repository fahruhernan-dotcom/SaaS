-- 02_schema_acl.sql
-- Source: Supabase SCHEMA ACL.txt
-- Last sync: (Current)
-- DO NOT EDIT MANUALLY

GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";
GRANT USAGE ON SCHEMA "public" TO "authenticator";