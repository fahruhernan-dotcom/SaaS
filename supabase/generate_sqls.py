import sys
import re
from pathlib import Path
from collections import defaultdict

MANAGED_SCHEMAS = {
    "auth", "cron", "extensions", "graphql", "graphql_public", 
    "net", "pgsodium", "pgsodium_masks", "realtime", "storage", 
    "supabase_functions", "supabase_migrations", "vault",
    "information_schema", "pg_catalog", "pg_toast", "pgbouncer"
}

CORE_TABLES = {"tenants", "profiles", "sales", "purchases", "farms", "subscriptions"}
SENSITIVE_TABLES = {"payments", "audit_logs", "subscriptions", "tenant_billing"}

def is_managed(schema):
    return schema in MANAGED_SCHEMAS or schema.startswith("pg_temp_") or schema.startswith("pg_toast_")

def read_snapshot(filename):
    """
    Stateful row reader that parses Supabase Studio's pipe formatting 
    and appends continuation lines to their respective cells.
    """
    path = Path(__file__).parent / filename
    if not path.exists():
        return []
    
    text = path.read_text(encoding='utf-8')
    lines = text.splitlines()
    
    parsed_rows = []
    current_row = []
    expected_cols = 0
    
    for line in lines:
        if line.lstrip().startswith('|') and '---' in line:
            stripped = line.strip('| \t-')
            if not stripped:
                continue
                
        if line.lstrip().startswith('|'):
            # New row
            row_line = line.strip()
            if row_line.startswith('|'): row_line = row_line[1:]
            if row_line.endswith('|'): row_line = row_line[:-1]
            cells = [c.strip() for c in row_line.split('|')]
            if expected_cols == 0 and not parsed_rows:
                expected_cols = len(cells)
            current_row = cells
            parsed_rows.append(current_row)
        else:
            # Continuation line
            if current_row:
                row_line = line.rstrip()
                if row_line.endswith('|'): row_line = row_line[:-1]
                parts = row_line.split('|')
                current_row[-1] += "\n" + parts[0].strip()
                for part in parts[1:]:
                    current_row.append(part.strip())
                    
    if parsed_rows:
        # Skip header row
        parsed_rows = parsed_rows[1:]
        
    return parsed_rows

def write_sql_file(filename, source_txt, content):
    header = f"-- {filename}\n-- Source: {source_txt}\n-- Last sync: (Current)\n-- DO NOT EDIT MANUALLY\n\n"
    path = Path(__file__).parent / filename
    path.write_text(header + content, encoding='utf-8', newline='\n')

def emit_00_extensions():
    rows = read_snapshot("Supabase EXTENSIONS.txt")
    lines = []
    for row in rows:
        if len(row) >= 1:
            ext = row[0]
            lines.append(f'CREATE EXTENSION IF NOT EXISTS "{ext}";')
    write_sql_file("00_extensions.sql", "Supabase EXTENSIONS.txt", "\n".join(lines))

def emit_01_schemas():
    rows = read_snapshot("Supabase SCHEMAS.txt")
    lines = []
    for row in rows:
        if len(row) >= 2:
            schema = row[0]
            owner = row[1]
            if not is_managed(schema):
                lines.append(f'CREATE SCHEMA IF NOT EXISTS "{schema}";')
                lines.append(f'ALTER SCHEMA "{schema}" OWNER TO "{owner}";')
    write_sql_file("01_schemas.sql", "Supabase SCHEMAS.txt", "\n".join(lines))

def _parse_acl_string(acl_str):
    """Parse a PostgreSQL ACL string like {anon=U/owner,authenticated=UC/owner}
    into a list of (grantee, privs) tuples.
    Privilege chars: U=USAGE, C=CREATE
    """
    if not acl_str or acl_str == 'null':
        return []
    acl_str = acl_str.strip()
    if acl_str.startswith('{'):
        acl_str = acl_str[1:]
    if acl_str.endswith('}'):
        acl_str = acl_str[:-1]
    result = []
    for entry in acl_str.split(','):
        entry = entry.strip()
        if not entry or '=' not in entry:
            continue
        grantee, rest = entry.split('=', 1)
        privs_part = rest.split('/')[0]  # drop grantor
        grantee = grantee.strip()
        privs = []
        if 'U' in privs_part:
            privs.append('USAGE')
        if 'C' in privs_part:
            privs.append('CREATE')
        if privs and grantee:
            result.append((grantee, privs))
    return result

def emit_02_schema_acl():
    rows = read_snapshot("Supabase SCHEMA ACL.txt")
    lines = []
    for row in rows:
        if len(row) >= 2:
            schema, acl = row[0:2]
            if not is_managed(schema) and acl and acl != 'null':
                for grantee, privs in _parse_acl_string(acl):
                    if grantee.startswith('pg_') or grantee == '':
                        continue  # skip system roles and public-implicit
                    role_str = 'PUBLIC' if grantee == 'public' else f'"{grantee}"'
                    priv_str = ', '.join(privs)
                    lines.append(f'GRANT {priv_str} ON SCHEMA "{schema}" TO {role_str};')
    write_sql_file("02_schema_acl.sql", "Supabase SCHEMA ACL.txt", "\n".join(lines))

def emit_03_role_memberships():
    rows = read_snapshot("Supabase ROLE MEMBERSHIPS.txt")
    lines = ["DO $body$\nBEGIN"]
    for row in rows:
        if len(row) >= 2:
            role, member = row[0:2]
            lines.append("  BEGIN")
            lines.append(f'    EXECUTE \'GRANT "{role}" TO "{member}"\';')
            lines.append("  EXCEPTION WHEN undefined_object THEN NULL;\n  END;")
    lines.append("END $body$;")
    write_sql_file("03_role_memberships.sql", "Supabase ROLE MEMBERSHIPS.txt", "\n".join(lines))

def emit_04_tables():
    rows = read_snapshot("Supabase TABLE COLUMNS.txt")
    tables = defaultdict(list)
    found_tables = set()
    
    for row in rows:
        if len(row) >= 6:
            schema, table, col, dtype, is_null, default = row[0:6]
            udt_name = row[6] if len(row) > 6 else ""
            
            if is_managed(schema):
                continue
            found_tables.add(table)
            
            if dtype == 'ARRAY':
                if udt_name.startswith('_'):
                    dtype = udt_name.lstrip('_') + '[]'
                elif default.startswith("'{") and default.endswith("}'::text[]"):
                    dtype = 'text[]'
                elif default.startswith("'{") and default.endswith("}'::jsonb[]"):
                    dtype = 'jsonb[]'
                else:
                    dtype = 'text[]'
            
            null_str = "NOT NULL" if is_null == 'NO' else ""
            default_str = f"DEFAULT {default}" if default and default != 'null' else ""
            
            col_def = f'"{col}" {dtype}'
            if null_str: col_def += f" {null_str}"
            if default_str: col_def += f" {default_str}"
            tables[(schema, table)].append(col_def)
            
    for ct in CORE_TABLES:
        if ct not in found_tables:
            print(f"Warning: Core table '{ct}' missing from snapshot!")
            
    lines = []
    for (schema, table), cols in tables.items():
        lines.append(f'CREATE TABLE IF NOT EXISTS "{schema}"."{table}" (')
        lines.append(",\n  ".join(cols))
        lines.append(");\n")
        
    write_sql_file("04_tables.sql", "Supabase TABLE COLUMNS.txt", "\n".join(lines))

def emit_05_primary_keys():
    rows = read_snapshot("Supabase PRIMARY KEYS.txt")
    pks = defaultdict(list)
    for row in rows:
        if len(row) >= 3:
            schema, table, col = row[0:3]
            constraint = f"{table}_pkey"
            if not is_managed(schema):
                pks[(schema, table, constraint)].append(col)
                
    lines = []
    for (schema, table, constraint), cols in pks.items():
        col_str = ", ".join([f'"{c}"' for c in cols])
        lines.append(f'ALTER TABLE "{schema}"."{table}" ADD CONSTRAINT "{constraint}" PRIMARY KEY ({col_str});')
    write_sql_file("05_primary_keys.sql", "Supabase PRIMARY KEYS.txt", "\n".join(lines))

def emit_06_foreign_keys():
    rows = read_snapshot("Supabase FOREIGN KEYS.txt")
    lines = []
    for row in rows:
        if len(row) >= 6:
            schema, table, col, r_schema, r_table, r_col = row[0:6]
            constraint = f"{table}_{col}_fkey"
            if not is_managed(schema):
                lines.append(f'ALTER TABLE "{schema}"."{table}" ADD CONSTRAINT "{constraint}" FOREIGN KEY ("{col}") REFERENCES "{r_schema}"."{r_table}"("{r_col}");')
    write_sql_file("06_foreign_keys.sql", "Supabase FOREIGN KEYS.txt", "\n".join(lines))

def emit_07_table_owners():
    rows = read_snapshot("Supabase TABLE OWNERS.txt")
    lines = []
    for row in rows:
        if len(row) >= 3:
            schema, table, owner = row[0:3]
            if not is_managed(schema):
                lines.append(f'ALTER TABLE "{schema}"."{table}" OWNER TO "{owner}";')
    write_sql_file("07_table_owners.sql", "Supabase TABLE OWNERS.txt", "\n".join(lines))

def emit_08_functions():
    rows = read_snapshot("Supabase FUNCTIONS.txt")
    lines = ["-- Note: Real definitions live in Supabase Studio. This is an inventory."]
    for row in rows:
        if len(row) >= 5:
            schema, fn_name, args, sec_def, lang = row[0:5]
            sec = 'DEFINER' if sec_def == 'true' else 'INVOKER'
            if not is_managed(schema):
                lines.append(f'-- {schema}.{fn_name}({args}) LANGUAGE {lang} SECURITY {sec}')
    write_sql_file("08_functions.sql", "Supabase FUNCTIONS.txt", "\n".join(lines))

def emit_09_security_definer_functions():
    rows = read_snapshot("Supabase FUNCTIONS.txt")
    lines = []
    for row in rows:
        if len(row) >= 5:
            schema, fn_name, args, sec_def = row[0:4]
            if sec_def == 'true' and not is_managed(schema):
                lines.append(f'ALTER FUNCTION "{schema}"."{fn_name}"({args}) SECURITY DEFINER SET search_path = public, pg_temp;')
    write_sql_file("09_security_definer_functions.sql", "Supabase FUNCTIONS.txt", "\n".join(lines))

def emit_10_enabled_extension_functions():
    rows = read_snapshot("Supabase ENABLED EXTENSION FUNCTIONS.txt")
    lines = ["-- Read-only inventory of extension-provided functions"]
    for row in rows:
        if len(row) >= 2:
            lines.append(f'-- {row[0]}.{row[1]}')
    write_sql_file("10_enabled_extension_functions.sql", "Supabase ENABLED EXTENSION FUNCTIONS.txt", "\n".join(lines))

def emit_11_views():
    rows = read_snapshot("Supabase VIEWS.txt")
    lines = []
    for row in rows:
        if len(row) >= 3:
            schema, view, defn = row[0:3]
            if not is_managed(schema) and defn and defn != 'null' and defn.strip():
                lines.append(f'CREATE OR REPLACE VIEW "{schema}"."{view}" AS {defn};')
    write_sql_file("11_views.sql", "Supabase VIEWS.txt", "\n".join(lines))

def emit_12_triggers():
    rows = read_snapshot("Supabase TRIGGERS.txt")
    triggers = defaultdict(list)
    for row in rows:
        if len(row) >= 6:
            schema, table, trig_name, evt, timing, action = row[0:6]
            if not is_managed(schema):
                triggers[(schema, table, trig_name, timing, action)].append(evt)
    
    lines = []
    for (schema, table, trig_name, timing, action), evts in triggers.items():
        evts_str = " OR ".join(evts)
        lines.append(f'DROP TRIGGER IF EXISTS "{trig_name}" ON "{schema}"."{table}";')
        lines.append(f'CREATE TRIGGER "{trig_name}" {timing} {evts_str} ON "{schema}"."{table}" FOR EACH ROW {action};\n')
    write_sql_file("12_triggers.sql", "Supabase TRIGGERS.txt", "\n".join(lines))

def emit_13_rls_status():
    rows = read_snapshot("Supabase TABLES + RLS STATUS.txt")
    found_tables = set()
    for row in rows:
        if len(row) >= 2:
            found_tables.add(row[1])
            
    lines = []
    for row in rows:
        if len(row) >= 4:
            schema, table, rls, force = row[0:4]
            if not is_managed(schema):
                if rls.lower() == 'true':
                    lines.append(f'ALTER TABLE "{schema}"."{table}" ENABLE ROW LEVEL SECURITY;')
                if force.lower() == 'true' or (table in SENSITIVE_TABLES and table in found_tables):
                    lines.append(f'ALTER TABLE "{schema}"."{table}" FORCE ROW LEVEL SECURITY;')
    write_sql_file("13_rls_status.sql", "Supabase TABLES + RLS STATUS.txt", "\n".join(lines))

def format_roles(roles_str):
    if roles_str.startswith('{') and roles_str.endswith('}'):
        roles_str = roles_str[1:-1]
    
    roles = [r.strip() for r in roles_str.split(',')]
    formatted_roles = []
    for r in roles:
        if r in ['public', 'anon', 'authenticated', 'service_role']:
            formatted_roles.append(r)
        else:
            formatted_roles.append(f'"{r}"')
    return ", ".join(formatted_roles)

def emit_14_policies():
    rows = read_snapshot("Supabase POLICIES.txt")
    lines = []
    for row in rows:
        if len(row) >= 8:
            schema, table, policy, permissive, roles, cmd, qual, with_check = row[0:8]
            if not is_managed(schema):
                formatted_roles = format_roles(roles)
                lines.append(f'DROP POLICY IF EXISTS "{policy}" ON "{schema}"."{table}";')
                stmt = f'CREATE POLICY "{policy}" ON "{schema}"."{table}" AS {permissive} FOR {cmd} TO {formatted_roles}'
                if qual and qual != 'null':
                    if not qual.startswith('('): qual = f'({qual})'
                    stmt += f' USING {qual}'
                if with_check and with_check != 'null':
                    if not with_check.startswith('('): with_check = f'({with_check})'
                    stmt += f' WITH CHECK {with_check}'
                stmt += ';'
                lines.append(stmt + "\n")
    write_sql_file("14_policies.sql", "Supabase POLICIES.txt", "\n".join(lines))

def emit_grant(lines_list, seen_set, priv, obj_type, schema, obj, role):
    obj_name = obj[1] if obj_type == "COLUMN" else obj
    if is_managed(schema) or obj_name.startswith("pg_") or obj_name in ["_prisma_migrations", "schema_migrations"]:
        return
    role_str = "PUBLIC" if role == "PUBLIC" or role == "public" else f'"{role}"'
    key = (priv, obj, role)
    if key not in seen_set:
        seen_set.add(key)
        if obj_type == "COLUMN":
            col = obj[0]
            table = obj[1]
            lines_list.append(f'GRANT {priv} ("{col}") ON TABLE "{schema}"."{table}" TO {role_str};')
        else:
            lines_list.append(f'GRANT {priv} ON {obj_type} "{schema}"."{obj}" TO {role_str};')

def emit_15_table_privileges():
    rows = read_snapshot("Supabase TABLE PRIVILEGES.txt")
    lines = []
    seen = set()
    for row in rows:
        if len(row) >= 5:
            schema, table, col, role, priv = row[0:5]
            if col and col != 'null':
                emit_grant(lines, seen, priv, "COLUMN", schema, (col, table), role)
            else:
                emit_grant(lines, seen, priv, "TABLE", schema, table, role)
    write_sql_file("15_table_privileges.sql", "Supabase TABLE PRIVILEGES.txt", "\n".join(lines))

def emit_16_table_grants():
    rows = read_snapshot("Supabase TABLE GRANTS.txt")
    lines = []
    seen = set()
    for row in rows:
        if len(row) >= 4:
            schema, table, role, priv = row[0:4]
            emit_grant(lines, seen, priv, "TABLE", schema, table, role)
    write_sql_file("16_table_grants.sql", "Supabase TABLE GRANTS.txt", "\n".join(lines))

def emit_17_column_grants():
    rows = read_snapshot("Supabase COLUMN GRANTS.txt")
    lines = []
    seen = set()
    for row in rows:
        if len(row) >= 5:
            schema, table, col, role, priv = row[0:5]
            emit_grant(lines, seen, priv, "COLUMN", schema, (col, table), role)
    write_sql_file("17_column_grants.sql", "Supabase COLUMN GRANTS.txt", "\n".join(lines))

def emit_18_function_execute_grants():
    rows = read_snapshot("Supabase FUNCTION EXECUTE GRANTS.txt")
    lines = []
    seen = set()
    for row in rows:
        if len(row) >= 3:
            schema, fn, role = row[0:3]
            emit_grant(lines, seen, "EXECUTE", "FUNCTION", schema, fn, role)
    write_sql_file("18_function_execute_grants.sql", "Supabase FUNCTION EXECUTE GRANTS.txt", "\n".join(lines))

def emit_19_public_anon_access():
    rows = read_snapshot("Supabase PUBLIC AND ANON ACCESS.txt")
    lines = []
    for row in rows:
        if len(row) >= 4:
            grantee, schema, table, priv = row[0:4]
            if not is_managed(schema):
                role_str = "PUBLIC" if grantee == "PUBLIC" or grantee == "public" else f'"{grantee}"'
                if grantee == "anon" and priv != "SELECT":
                    priv = "SELECT"
                lines.append(f'GRANT {priv} ON TABLE "{schema}"."{table}" TO {role_str};')
    write_sql_file("19_public_anon_access.sql", "Supabase PUBLIC AND ANON ACCESS.txt", "\n".join(lines))

def smoke_check(filename, allow_empty=False):
    path = Path(__file__).parent / filename
    if not path.exists():
        return
    text = path.read_text(encoding='utf-8')
    lines = [l for l in text.splitlines() if not l.startswith('--') and l.strip()]
    if not lines and not allow_empty:
        print(f"Smoke check warning: {filename} has no content lines.")

def main():
    emit_00_extensions()
    emit_01_schemas()
    emit_02_schema_acl()
    emit_03_role_memberships()
    emit_04_tables()
    emit_05_primary_keys()
    emit_06_foreign_keys()
    emit_07_table_owners()
    emit_08_functions()
    emit_09_security_definer_functions()
    emit_10_enabled_extension_functions()
    emit_11_views()
    emit_12_triggers()
    emit_13_rls_status()
    emit_14_policies()
    emit_15_table_privileges()
    emit_16_table_grants()
    emit_17_column_grants()
    emit_18_function_execute_grants()
    emit_19_public_anon_access()
    
    # Smoke checks — allow_empty=True for files that may legitimately have no content
    # when the snapshot only contains managed/system schemas
    smoke_check("02_schema_acl.sql")
    smoke_check("05_primary_keys.sql")
    smoke_check("06_foreign_keys.sql")
    smoke_check("09_security_definer_functions.sql")
    smoke_check("11_views.sql", allow_empty=True)   # legitimately empty: only extensions/vault views
    smoke_check("12_triggers.sql")
    smoke_check("15_table_privileges.sql", allow_empty=True)  # legitimately empty: only auth schema

if __name__ == "__main__":
    main()
