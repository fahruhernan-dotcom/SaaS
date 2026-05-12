# Ternak OS — Database & RLS Security Architecture Summary

## Executive Summary
This document serves as the canonical reference for Ternak OS's PostgreSQL database security, specifically focusing on **Row Level Security (RLS)** and **SECURITY DEFINER** function hardening.

Based on our comprehensive security audit, the database architecture heavily relies on hybrid RBAC + Capability-Based authorization, enforcing multi-tenant isolation at the row level.

---

## File Layout

The `supabase/` folder is structured into a series of numbered SQL files, representing a sequence of safe execution dependencies:

| # | SQL File | Source `.txt` snapshot | Purpose |
|---|---|---|---|
| 00 | `00_extensions.sql` | `Supabase EXTENSIONS.txt` | Enable Postgres extensions |
| 01 | `01_schemas.sql` | `Supabase SCHEMAS.txt` | Create non-managed schemas |
| 02 | `02_schema_acl.sql` | `Supabase SCHEMA ACL.txt` | `GRANT USAGE/CREATE ON SCHEMA` |
| 03 | `03_role_memberships.sql` | `Supabase ROLE MEMBERSHIPS.txt` | `GRANT <role> TO <member>` (PL/pgSQL) |
| 04 | `04_tables.sql` | `TABLES + RLS STATUS.txt` + `TABLE COLUMNS.txt` | `CREATE TABLE` definitions |
| 05 | `05_primary_keys.sql` | `Supabase PRIMARY KEYS.txt` | `ADD CONSTRAINT ... PRIMARY KEY` |
| 06 | `06_foreign_keys.sql` | `Supabase FOREIGN KEYS.txt` | `ADD CONSTRAINT ... FOREIGN KEY` |
| 07 | `07_table_owners.sql` | `Supabase TABLE OWNERS.txt` | `ALTER TABLE ... OWNER TO` |
| 08 | `08_functions.sql` | `Supabase FUNCTIONS.txt` | Inventory comment listing of all functions |
| 09 | `09_security_definer_functions.sql` | `Supabase SECURITY DEFINER FUNCTIONS.txt` | `ALTER FUNCTION ... SECURITY DEFINER SET search_path` |
| 10 | `10_enabled_extension_functions.sql` | `Supabase ENABLED EXTENSION FUNCTIONS.txt` | Read-only inventory of extension-provided functions |
| 11 | `11_views.sql` | `Supabase VIEWS.txt` | `CREATE OR REPLACE VIEW` |
| 12 | `12_triggers.sql` | `Supabase TRIGGERS.txt` | `CREATE TRIGGER` (events grouped) |
| 13 | `13_rls_status.sql` | `TABLES + RLS STATUS.txt` | `ENABLE / FORCE ROW LEVEL SECURITY` |
| 14 | `14_policies.sql` | `Supabase POLICIES.txt` | `CREATE POLICY` |
| 15 | `15_table_privileges.sql` | `Supabase TABLE PRIVILEGES.txt` | Default privileges |
| 16 | `16_table_grants.sql` | `Supabase TABLE GRANTS.txt` | `GRANT ... ON TABLE` |
| 17 | `17_column_grants.sql` | `Supabase COLUMN GRANTS.txt` | `GRANT (col,...) ON ...` |
| 18 | `18_function_execute_grants.sql` | `Supabase FUNCTION EXECUTE GRANTS.txt` | `REVOKE/GRANT EXECUTE ON FUNCTION` |
| 19 | `19_public_anon_access.sql` | `Supabase PUBLIC AND ANON ACCESS.txt` | Final `anon`/`PUBLIC` surface |

## Regeneration Workflow

The `Supabase *.txt` files are the **raw source of truth** exported from Supabase Studio. The `.sql` files are the **executable representation** of that truth. 

1. In Supabase Studio SQL editor, run each of the 20 queries (documented in §Studio Queries below).
2. Save each output as the matching `Supabase *.txt` in `supabase/`.
3. Run `python supabase/generate_sqls.py` from the repo root.
4. Review `git diff supabase/0*.sql supabase/1*.sql` and commit.

- **AI Agent Notice:** AI agents and developers are expected to **read the `.sql` files**, not the `.txt` files, to understand the schema and policies, as the `.sql` files contain the syntactically correct and fully resolved representation of the database.

## Studio Snapshot Queries

To regenerate the `Supabase *.txt` files, use standard `information_schema` / `pg_catalog` queries in Supabase Studio. Examples include:
- **EXTENSIONS:** `SELECT * FROM pg_extension JOIN pg_namespace ON pg_extension.extnamespace = pg_namespace.oid;`
- **SCHEMAS:** `SELECT schema_name, schema_owner FROM information_schema.schemata;`
- **TABLES + COLUMNS:** `SELECT table_schema, table_name, column_name, data_type, is_nullable, column_default FROM information_schema.columns WHERE table_schema NOT IN ('pg_catalog', 'information_schema');`
- **POLICIES:** `SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check FROM pg_policies;`
(Note: You should construct similar standard queries for triggers, primary keys, foreign keys, and role memberships to populate all 20 snapshots.)

## Migration Strategy

- Schema changes are now made in Supabase Studio, then re-snapshotted; ad-hoc `.sql` migrations under `supabase/migrations/` are deprecated and archived at `supabase/migrations/_archive/`.
- For changes that must be reproducible across environments (e.g., a brand-new staging DB), apply files `00_*.sql` … `19_*.sql` in numeric order.

---

## 1. Multi-Tenant RLS Pattern (The Standard)

### ✅ Recommended Pattern: `is_tenant_member()`
All RLS policies checking for tenant ownership **MUST** use the `is_tenant_member(tenant_id)` helper. 

**GOOD:**
```sql
CREATE POLICY "Users can view their tenant's data" 
ON public.some_table
FOR SELECT 
USING (is_tenant_member(tenant_id));
```

### ❌ Forbidden Patterns
**BAD (Legacy Single-Tenant Assumption):**
```sql
-- DO NOT USE
tenant_id = my_tenant_id()
```
**BAD (Legacy Helper):**
```sql
-- DO NOT USE
is_my_tenant(tenant_id)
```

**Reason:** Users in Ternak OS can belong to multiple tenants. Using `my_tenant_id()` assumes a single tenant per session, which breaks multi-tenant support and introduces security flaws.

---

## 2. Superadmin / Platform Level Access

Platform-level superadmins require explicit bypasses in RLS policies.

**Recommended Pattern:**
```sql
USING (is_tenant_member(tenant_id) OR is_superadmin())
```

> [!IMPORTANT]
> Ensure `is_superadmin()` strictly evaluates `profiles.app_role = 'superadmin'`, **NOT** the business `profiles.role`.

---

## 3. SECURITY DEFINER Hardening Rules

Because `SECURITY DEFINER` functions execute with the privileges of the function owner (usually `postgres` or a highly privileged role), they require strict hygiene.

### Rule 1: Always Explicitly Set `search_path`
To prevent search path injection attacks, every `SECURITY DEFINER` function **MUST** have an explicit `search_path`.

**GOOD:**
```sql
CREATE FUNCTION is_superadmin() RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
...
$$;
```
Or `SET search_path = ''`.

### Rule 2: Limit Usage
Do not overuse `SECURITY DEFINER`. If a helper function only performs pure reads and doesn't need to bypass RLS to read its target data (e.g., a simple logic wrapper), consider using `SECURITY INVOKER` to reduce the blast radius.

### Rule 3: Restrict `EXECUTE` Privileges
Functions that modify data or log sensitive internal operations (like `log_audit_action`) should not be callable by `public` or `anon`.
Always revoke public execute and grant only to the authenticated role:
```sql
REVOKE EXECUTE ON FUNCTION log_audit_action FROM public;
GRANT EXECUTE ON FUNCTION log_audit_action FROM authenticated;
```

---

## 4. Known Tech Debt & Future Migrations

If you are an AI agent or developer working on database migrations, take note of the following prioritized tech debt:

1. **Standardize Tenant Checks:** Ensure absolutely no new policies use `my_tenant_id()` for equality checks. Migrate all remaining `is_my_tenant` or direct tenant equality checks to `is_tenant_member()`.
2. **Audit `EXECUTE` Grants:** Periodically verify that sensitive `SECURITY DEFINER` functions do not have `GRANT EXECUTE TO public`.
3. **Role Confusion Avoidance:** Always maintain a clear separation between:
   - `app_role` (Global Platform Role: 'user', 'superadmin')
   - `role` (Tenant-scoped Role: 'owner', 'manager', 'staff', etc.)
4. **Performance:** Because functions like `is_tenant_member()` and `my_role_for()` query the `profiles` table frequently, ensure the following indexes exist and are utilized:
   - `CREATE INDEX ON profiles(auth_user_id);`
   - `CREATE INDEX ON profiles(auth_user_id, tenant_id);`

---

## 5. Audit Logging Notice
Internal audit functions (e.g., `log_audit_action`) may use `row_security=off` to ensure logs are written regardless of the caller's RLS context. This is expected behavior but requires strict `EXECUTE` access control as mentioned in Rule 3.

---

## 6. Enterprise-Grade Next Steps (Future Roadmap)

While the current database architecture securely mitigates major risks (search path injection, public exposure, mixed logic, single-tenant assumption), the following non-critical improvements are recommended to achieve full enterprise-grade security hardening:

1. **Strictly Standardize Tenant Helpers**
   Pick *one* helper explicitly—prefer `is_tenant_member()` over `my_tenant_id()`—and remove all traces of the alternative to avoid any conceptual mixing.

2. **Add Explicit RPC Schema (`rpc`)**
   Move all client-callable functions to an explicitly named schema (`rpc`), keeping `public` strictly for tables/views, and `internal` for triggers and internal helpers. This is a best practice for API surface control.

3. **Force RLS on Sensitive Tables**
   Ensure `ALTER TABLE table_name FORCE ROW LEVEL SECURITY;` is applied on highly sensitive tables (e.g., `payments`, `audit_logs`, `subscriptions`, `tenant_billing`). This prevents potential bypasses by table owners or edge-case integrations.

4. **Eliminate Unnecessary `SECURITY DEFINER` Usage**
   Some helper functions might not actually require `SECURITY DEFINER` context. Converting them back to `SECURITY INVOKER` reduces the overall blast radius of the system.
