# Phase 0B — Database Audit Report: HPP Mode Sederhana & Detail Penggemukan

This document presents the detailed PostgreSQL database audit report for the planned **Mode Hitung HPP Penggemukan** (Simple/Buku Kas Batch vs. Detail/Stok & Konsumsi) feature on TernakOS. The objective is to verify existing schemas, document constraints, evaluate Row-Level Security (RLS) configurations, and define the database roadmap for implementation.

> [!NOTE]
> **Migration Executed:** The database migration foundation has been successfully executed, constraints and indexes verified, and RLS/RPC configurations left unchanged. This document serves as the historical audit and post-migration validation report. No runtime codebase/source code changes are made.

---

## 1. Scope and Guardrails

The scope of this audit is to document the PostgreSQL database schema, confirm the successful execution of column alterations, and establish the validation criteria for HPP Mode implementations.

### Strict Planning Constraints:
*   **No Runtime Code Modification:** Do not modify any source code files (JS/JSX/CSS).
*   **No Database Schema Changes:** The migration foundation is already executed; do not alter columns further or add RLS/RPC changes.
*   **Preservation of Existing Calculations:** Existing detailed HPP hooks and calculation structures must remain intact and serve as the default fallback.
*   **Local Build Protection:** Do not run `npm run build` or similar compile commands.

---

## 2. SQL Audit Source Summary

The database audit is based on actual metadata queries executed against the production schema (excluding client-side codebase inference). The parameters are summarized below:
*   **Tenant Settings State:** Checked RLS policies and table structures for `tenants`.
*   **Active Batch Count:** Verification of active cycle rows in Domba, Kambing, and Sapi penggemukan tables.
*   **Operational Cost Data Distribution:** Evaluated all operational cost records to determine historical classification roles (`batch_id` distribution).
*   **Column Existence Assessment:** Target columns have been successfully created, verified, and mapped.

---

## 3. Core Schema Findings

The fattening vertical on TernakOS is structured consistently across the three primary animal sub-verticals (Domba, Kambing, and Sapi). Each sub-vertical utilizes its own set of database tables:

1.  **Domba (Sheep):**
    *   Batches: `domba_penggemukan_batches`
    *   Animals: `domba_penggemukan_animals`
    *   Feed Logs: `domba_penggemukan_feed_logs`
    *   Operational Costs: `domba_penggemukan_operational_costs`
    *   Health Logs: `domba_penggemukan_health_logs`
    *   Sales: `domba_penggemukan_sales`
2.  **Kambing (Goat):**
    *   Batches: `kambing_penggemukan_batches`
    *   Animals: `kambing_penggemukan_animals`
    *   Feed Logs: `kambing_penggemukan_feed_logs`
    *   Operational Costs: `kambing_penggemukan_operational_costs`
    *   Health Logs: `kambing_penggemukan_health_logs`
    *   Sales: `kambing_penggemukan_sales`
3.  **Sapi (Cattle):**
    *   Batches: `sapi_penggemukan_batches`
    *   Animals: `sapi_penggemukan_animals`
    *   Feed Logs: `sapi_penggemukan_feed_logs`
    *   Operational Costs: `sapi_penggemukan_operational_costs`
    *   Health Logs: `sapi_penggemukan_health_logs`
    *   Sales: `sapi_penggemukan_sales`

### Audit Conclusion:
The core penggemukan table set exists across Domba, Kambing, and Sapi. The MVP can therefore be designed with a consistent architectural approach. However, exact column structures and RLS patterns are not identical, especially for Sapi.

---

## 4. Batch Table Findings

The audited batch tables (`domba_penggemukan_batches`, `kambing_penggemukan_batches`, and `sapi_penggemukan_batches`) now successfully contain the HPP mode and leftover adjustment fields following execution of the migration foundation.

### A. Executed and Verified Columns:
*   `hpp_mode` (text, default `'detail'`, not null)
*   `leftover_adjustment_idr` (numeric, default 0, not null)
*   `leftover_adjustment_notes` (text, nullable)

### B. Current Active Batches Count:
*   **Domba:** 3 active batches
*   **Kambing:** 1 active batch
*   **Sapi:** 2 active batches

### Audit Conclusion:
Because there are active batches in the system (total of 6), preserving historical calculation behavior is critical. The executed migration successfully defaulted all existing active batches to `hpp_mode = 'detail'`, preventing retroactive recalculations of historical HPP metrics and breaking P&L reports.

---

## 5. Operational Cost Findings

The operational cost tables (`domba_penggemukan_operational_costs`, `kambing_penggemukan_operational_costs`, and `sapi_penggemukan_operational_costs`) handle transaction logs.

### A. Current Cost Data Distribution:
*   **Domba:**
    *   Total rows: 10
    *   `batch_id is null` count: 0 (all 10 rows are linked to batches)
    *   `batch_id is not null` count: 10
    *   Active rows: 10
    *   *Categories present:* `listrik_air` (6 rows, total Rp320.000), `pakan` (4 rows, total Rp3.957.600)
*   **Kambing:**
    *   Total rows: 0
*   **Sapi:**
    *   Total rows: 0

### B. Index & Key Relations:
The operational cost tables have:
*   `id` as the primary key.
*   `tenant_id` for multi-tenant isolation.
*   `batch_id` as a foreign key pointing to the corresponding batch table.
*   Pre-existing database indexes on `batch_id`, `batch_id + category`, and `batch_id + log_date` have been verified.

### Audit Conclusion:
All existing operational cost rows (10 in Domba, 0 in Kambing/Sapi) are direct batch-specific costs. These rows have safely defaulted to `allocation_role = 'direct'`. The verified index structures are adequate for direct retrieval, and the new allocation role fields are active.

---

## 6. Quick Cost Allocation Findings

The database currently has no records of cost-splitting transactions across multiple batches. Quick Cost Allocation will store split details without causing double-counting in ledger calculations.

### Actual Executed Schema (Executed and Verified):
To support splitting, the following columns have been added to the operational cost tables, and their foreign key constraints and indexes verified:
*   `allocation_role`: text (value: `'direct'` | `'parent'` | `'child'`), defaults to `'direct'`.
*   `allocation_parent_id`: uuid (self-reference foreign key pointing back to `operational_costs(id)`).
*   `allocation_method`: text (e.g. `'proportional_headcount'`).
*   `allocation_snapshot`: jsonb (default `'{}'::jsonb` to capture headcounts and values at the time of calculation).

### Double-Counting Avoidance Boundary (Reporting Rules):
To ensure financial reports do not double-count transactions:
1.  **HPP Batch Reports:** For a specific HPP batch report, sum rows where `batch_id = target batch id` and `allocation_role` is in (`'direct'`, `'child'`). Exclude rows where `allocation_role` is `'parent'`.
2.  **Global Cash Reports:** Sum rows where `allocation_role` is in (`'direct'`, `'parent'`). Exclude rows where `allocation_role` is `'child'`.
3.  **Consolidated Financial Reports:** Must implement strict filter clauses on `allocation_role` to avoid counting parent and child rows together.

---

## 7. Row-Level Security (RLS) Findings

The tables are protected by Supabase Row-Level Security (RLS) policies:

*   **Domba and Kambing Penggemukan tables:**
    *   `SELECT`: Allowed for tenant members (checked via `is_tenant_member(tenant_id)`) or superadmins.
    *   `INSERT` / `UPDATE`: Allowed for tenant members with appropriate role permissions, or superadmins.
    *   `DELETE`: Restricted to superadmin roles only.
*   **Sapi Penggemukan tables:**
    *   Most Sapi penggemukan tables use a profile-based tenant lookup policy pattern through the `profiles` table.
    *   `sapi_penggemukan_operational_costs` uses the newer `is_tenant_member` / `my_role_for` helper pattern.

### Audit Conclusion:
Adding columns to existing batch and operational cost tables did not require creating or altering RLS policies. No RLS policies or RPC functions were changed during this migration. Column addition is safe because security access remains tenant-bound.

---

## 8. Tenants / Business Default Mode Findings

We audited the `tenants` table to identify if business-wide default modes (e.g., default HPP simple mode for onboarding) could be stored there.

### A. Current Columns in `tenants`:
Stores tenant metadata such as `business_name`, `business_vertical`, `sub_type`, `animal_types`, `base_livestock_type`, `addon_livestock_types`, and `province`. There is no default mode setting column like `penggemukan_hpp_default_mode`.

### B. Security / Write Policy on `tenants`:
*   `tenants_superadmin_all`: Gives `ALL` access to superadmins.
*   `tenants_user_select`: Limits normal tenant users to `SELECT` access only.
*   *Implication:* There is **no normal tenant user write policy** for the `tenants` table. Normal business owners/staff cannot directly update columns in this table.

### C. Available RPC / Functions Audit:
No RPC or Postgres function is currently configured to edit business settings or set default modes. All settings-like tables (e.g., `payment_settings`, `plan_configs`, `site_config`, `xendit_config`) are managed via superadmin or system processes.

### Audit Conclusion:
Since normal owners/staff have only `SELECT` access to the `tenants` table and no Settings Update RPC exists, **persisting business-wide default HPP modes is out of scope for the MVP**. The system will enforce per-batch mode selection upon creation, and fallback to `'detail'` if `hpp_mode` is missing. Business default setting is deferred to MVP+.

---

## 9. MVP Database Decision

Following the execution of the database migration, the active schema features:

### Active in Database for MVP:
1.  **Batch tables (`domba/kambing/sapi_penggemukan_batches`):**
    *   `hpp_mode` (default `'detail'`)
    *   `leftover_adjustment_idr` (default `0`)
    *   `leftover_adjustment_notes`
2.  **Operational Cost tables (`domba/kambing/sapi_penggemukan_operational_costs`):**
    *   `allocation_role` (default `'direct'`)
    *   `allocation_parent_id` (pointing to parent expense row)
    *   `allocation_method`
    *   `allocation_snapshot`
3.  **Data Setup:** All 6 existing active batches set to `hpp_mode = 'detail'`. All 10 existing operational cost rows set to `allocation_role = 'direct'`.

---

## 10. MVP+ Deferred Items

The following database modifications remain deferred to future phases:
1.  Adding `penggemukan_hpp_default_mode` to the `tenants` table (requires designing a secure settings update RPC first).
2.  Mode Campuran columns or timeline markers.
3.  Warehouse inventory valuation structures for feed/medical ledger records.

---

## 11. Post-Migration Schema Verification

A read-only check query has been run against the Postgres information schema to verify successful execution and column types:

```sql
SELECT
  table_name,
  column_name,
  data_type,
  column_default,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN (
    'domba_penggemukan_batches',
    'kambing_penggemukan_batches',
    'sapi_penggemukan_batches',
    'domba_penggemukan_operational_costs',
    'kambing_penggemukan_operational_costs',
    'sapi_penggemukan_operational_costs'
  )
  AND column_name IN (
    'hpp_mode',
    'leftover_adjustment_idr',
    'leftover_adjustment_notes',
    'allocation_role',
    'allocation_parent_id',
    'allocation_method',
    'allocation_snapshot'
  )
ORDER BY table_name, column_name;
```

*Status: Verified. All columns exist and default settings/types match specifications.*

---

## 12. Risks and Mitigations

### A. Sapi Table Isolation:
*   *Risk:* Sapi tables utilize different RLS helper check functions (`has_tenant_access`) compared to Domba/Kambing.
*   *Mitigation:* Retain exact table references and keep database migrations separate for each prefix to prevent access token errors.

### B. Sapi Operational Costs Hook Integration (Uncertainty / Follow-Up):
*   *Risk:* The current database audit shows 0 historical rows for Sapi operational costs, meaning this data path is currently unexercised in production.
*   *Observation:* The `sapi_penggemukan_operational_costs` table already exists in the actual database schema; it does not need to be created. The implementation risk is strictly related to frontend and hook integration rather than a missing database table.
*   *Mitigation:* During the next implementation phase, we must explicitly verify that Sapi frontend pages, sheets, and custom hooks correctly query, read, and write to `sapi_penggemukan_operational_costs`.

### C. Double-Counting split costs in Cashflow:
*   *Risk:* Summing parent and child transaction rows leads to inflated operational costs.
*   *Mitigation:* Create a clear reporting boundary schema (as defined in Section 6). All query functions and hooks must filter by `allocation_role`.

### D. Tenant Write Restrictions:
*   *Risk:* Normal users attempting to write defaults directly to the `tenants` table will fail due to SELECT-only policies.
*   *Mitigation:* Remove default mode configuration from MVP scope. Keep settings at the batch level.

---

## 13. Final Conclusion

The database structures for Domba, Kambing, and Sapi have successfully been altered to receive the batch-level modes and allocation details. RLS permissions and RPC configurations have been kept unchanged. Existing batches default to `'detail'` and existing cost records to `'direct'` to preserve historical ledger accuracy.

---

## 14. Verification and Safety Declarations

*   **No runtime or source code was modified** during this task.
*   **The migration foundation columns, indexes, and constraints have been verified** as successfully executed.
*   **No RLS policies or RPC functions** were changed.
*   **This document serves strictly as Phase 0B Verification and Audit Documentation.**
