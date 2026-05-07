> File ini bagian dari docs/db/ split. Lihat 00_INDEX.md untuk navigasi lengkap.
> Last updated: 2026-05-07 — RLS Hardening Phase 1 (explicit CRUD migration)
> Total policy: 200+ across 141 tabel
>
> 🤖 **AI: WAJIB BACA FILE INI sebelum DROP POLICY, CREATE POLICY, atau tambah fitur baru.**
> Satu tabel bisa punya 3-11 policy. DROP sembarangan = fitur lain HILANG akses data.
> Cek dulu policy yang sudah ada. Jangan duplikat. Jangan bypass.

# 🔐 02 — Security & RLS (Row Level Security)

---

## ✅ GEN 1 — MODERN HARDENED ARCHITECTURE (Jangan disentuh kecuali refinement)

Tabel-tabel ini sudah menggunakan explicit CRUD policy, `TO authenticated`, `WITH CHECK`, dan tidak ada `FOR ALL`. Ini adalah **golden template** untuk hardening tabel lain.

| Tabel | Pattern | Catatan |
|-------|---------|---------|
| `farms` | Explicit CRUD | Blueprint tenant-shared business object |
| `ai_conversations` | Explicit CRUD | Blueprint ownership-isolated object |
| `generated_invoices` | Explicit CRUD | Blueprint financial-grade CRUD |
| `cycle_expenses` | Explicit CRUD | financial, owner+staff write, superadmin delete |
| `feed_stocks` | Explicit CRUD | core inventory |
| `daily_records` | Explicit CRUD | operational log |
| `extra_expenses` | Explicit CRUD | |
| `harvest_records` | Explicit CRUD | financial |
| `ai_pending_entries` | Explicit CRUD | ownership-isolated, UPDATE bug fixed |

> Authorization standard: SELECT open (tenant), INSERT+UPDATE = owner/staff only, DELETE = superadmin only.

---

## 🛡️ POLA RLS YANG DIGUNAKAN

Ada **5 pola berbeda** yang ditemukan di database. Ini penting karena beberapa TIDAK multi-tenant safe.

### Pattern A — Standard Tenant Isolation (✅ Multi-tenant safe)
```sql
USING  (tenant_id IN (SELECT tenant_id FROM profiles WHERE auth_user_id = auth.uid()))
CHECK  (tenant_id IN (SELECT tenant_id FROM profiles WHERE auth_user_id = auth.uid()))
```

### Pattern B — `my_tenant_id()` + superadmin (⚠️ Single-tenant only)
```sql
USING  (tenant_id = my_tenant_id() OR is_superadmin())
CHECK  (tenant_id = my_tenant_id() [AND role check])
```

### Pattern C — `get_my_tenant_id()` (⚠️ Single-tenant only, alias berbeda)
```sql
USING  (tenant_id = get_my_tenant_id())
CHECK  (tenant_id = get_my_tenant_id())
```

### Pattern D — LIMIT 1 subquery (⚠️ Single-tenant only)
```sql
USING (tenant_id = (SELECT tenant_id FROM profiles WHERE auth_user_id = auth.uid() LIMIT 1))
```

### Pattern E — `is_my_tenant()` function
```sql
USING (is_my_tenant(tenant_id) OR is_superadmin())
```

> ⚠️ **Pattern B/C/D berbahaya untuk user multi-tenant** — hanya return 1 tenant.
> ✅ Pattern A dan `auth_user_tenant_ids()` yang aman.

---

## 📋 DAFTAR LENGKAP POLICY — GROUPED BY PATTERN

### 🟢 TABEL DENGAN PATTERN A SAJA (Standard Tenant Isolation ALL)

Tabel-tabel ini hanya punya 1 policy: `Tenant Isolation Policy` cmd=ALL, pattern A.
Ini adalah pola paling bersih dan aman.

```
domba_breeding_animals          domba_breeding_births
domba_breeding_feed_logs        domba_breeding_health_logs
domba_breeding_mating_records   domba_breeding_sales
domba_breeding_weight_records   domba_kandangs
domba_penggemukan_animals       domba_penggemukan_batches
domba_penggemukan_feed_logs     domba_penggemukan_health_logs
domba_penggemukan_operational_costs  domba_penggemukan_sales
domba_penggemukan_weight_records
kambing_breeding_animals        kambing_breeding_births
kambing_breeding_feed_logs      kambing_breeding_health_logs
kambing_breeding_mating_records kambing_breeding_sales
kambing_breeding_weight_records kambing_kandangs
kambing_penggemukan_animals     kambing_penggemukan_batches
kambing_penggemukan_feed_logs   kambing_penggemukan_health_logs
kambing_penggemukan_operational_costs  kambing_penggemukan_sales
kambing_penggemukan_weight_records
kambing_perah_animal_groups     kambing_perah_breeding_animals
kambing_perah_breeding_births   kambing_perah_breeding_feed_logs
kambing_perah_breeding_health_logs    kambing_perah_breeding_mating_records
kambing_perah_breeding_weight_records kambing_perah_customer_registry
kambing_perah_feed_formulations kambing_perah_inventory_items
kambing_perah_inventory_transactions  kambing_perah_kandangs
kambing_perah_lactation_cycles  kambing_perah_milk_logs
kambing_perah_milk_quality_logs kambing_perah_milk_sales
kambing_perah_penggemukan_animals     kambing_perah_penggemukan_batches
kambing_perah_penggemukan_feed_logs   kambing_perah_penggemukan_health_logs
kambing_perah_penggemukan_sales kambing_perah_penggemukan_weight_records
sapi_breeding_animals           sapi_breeding_births
sapi_breeding_feed_logs         sapi_breeding_health_logs
sapi_breeding_mating_records    sapi_breeding_sales
sapi_breeding_weight_records    sapi_kandangs
sapi_penggemukan_animals        sapi_penggemukan_batches
sapi_penggemukan_feed_logs      sapi_penggemukan_health_logs
sapi_penggemukan_operational_costs    sapi_penggemukan_sales
sapi_penggemukan_weight_records
egg_inventory                   egg_sales
payments                        rpa_clients
sembako_products                sembako_stock_batches
sembako_stock_out               sembako_sales
sembako_sale_items              sembako_payments
sembako_employees               sembako_payroll
sembako_deliveries              sembako_expenses
sembako_suppliers               sembako_customers
sembako_supplier_payments
vaccination_records             vehicle_expenses
vehicles
```

---

### 🟡 TABEL DENGAN PATTERN D (LIMIT 1 — single-tenant)

| Tabel | Policy Name | Cmd |
|-------|-------------|-----|
| `egg_customers` | egg_customers_tenant_isolation | ALL |
| `egg_stock_logs` | egg_stock_logs_tenant_isolation | ALL |
| `egg_suppliers` | egg_suppliers_tenant_isolation | ALL |
| `egg_sale_items` | egg_sale_items_tenant_isolation | ALL (via JOIN ke egg_sales) |

---

### 🔵 TABEL DENGAN PATTERN B (my_tenant_id + superadmin + role check)

| Tabel | Policies | WITH CHECK role |
|-------|----------|-----------------|
| `breeding_cycles` | `breeding_cycles_all` ALL | owner, staff |
| `chicken_batches` | `batches_all` ALL | (no role check) |
| `daily_records` | ~~`daily_records_all` ALL~~ | ✅ **HARDENED** — lihat Gen 1 |
| `extra_expenses` | ~~`expenses_all` ALL~~ | ✅ **HARDENED** — lihat Gen 1 |
| `feed_stocks` | ~~`feed_stocks_all` ALL~~ | ✅ **HARDENED** — lihat Gen 1 |
| `loss_reports` | `loss_all` ALL | (no role check) |
| `orders` | `orders_all` ALL | (no role check) |
| `generated_invoices` | ~~`generated_invoices_all` ALL~~ | ✅ **HARDENED** — lihat Gen 1 |
| `broker_profiles` | `broker_profiles_all` ALL | owner, staff |
| `peternak_profiles` | `peternak_profiles_all` ALL | owner, staff |
| `rpa_profiles` | `rpa_profiles_all` ALL | owner, staff |
| `rpa_products` | `rpa_products_all` ALL | owner, staff |
| `rpa_invoices` | `rpa_invoices_all` ALL | owner, staff |
| `rpa_customer_payments` | `rpa_customer_payments_all` ALL | owner, staff |
| `rpa_customers` | `rpa_customers_all` ALL | owner, staff |
| `worker_payments` | `worker_payments_all` ALL | owner, staff |

---

### 🟣 TABEL DENGAN PATTERN C (get_my_tenant_id)

| Tabel | Policies |
|-------|----------|
| `ai_conversations` | `Ai conversations tenant access` ALL |
| `ai_feedback` | `Ai feedback tenant access` ALL |
| `ai_pending_entries` | `Ai pending entries tenant access` ALL |
| `ai_staged_transactions` | `Ai staged transactions tenant access` ALL |
| `kandang_worker_payments` | `Kandang Worker Payments Access` ALL (+superadmin) |

---

## 🔴 TABEL DENGAN POLICY KOMPLEKS / NON-STANDAR

### `profiles` — ⚠️ 11 POLICIES (TERBANYAK, BANYAK OVERLAP)

| # | Policy Name | Cmd | Condition |
|---|-------------|-----|-----------|
| 1 | `Tenant Isolation Policy` | ALL | `auth_user_id = auth.uid()` |
| 2 | `Users can read own profile` | SELECT | `auth_user_id = auth.uid()` |
| 3 | `Allow authenticated users to insert their own profile` | INSERT | CHECK: `auth.uid() = auth_user_id` |
| 4 | `Same tenant members can read profiles` | SELECT | `tenant_id IN (SELECT get_my_tenant_ids())` |
| 5 | `same_tenant_read` | SELECT | `auth_user_id = auth.uid() OR tenant_id = ANY(auth_user_tenant_ids())` |
| 6 | `profile_select` | SELECT | `auth_user_id = auth.uid() OR is_superadmin()` |
| 7 | `superadmin_read_all_profiles` | SELECT | `auth_user_id = auth.uid() OR is_superadmin()` |
| 8 | `profile_update_self` | UPDATE | `auth_user_id = auth.uid()` |
| 9 | `superadmin_update_profiles` | UPDATE | `is_superadmin()` |
| 10 | `profile_insert` | INSERT | CHECK: `is_superadmin()` |
| 11 | `profile_superadmin_all` | ALL | `is_superadmin()` |

> ❌ **#6 dan #7 identik**. #1 dan #2 dan #3 overlap. Perlu cleanup.
> ⚠️ 3 fungsi berbeda: `get_my_tenant_ids()`, `auth_user_tenant_ids()`, `auth.uid()`.

---

### `market_prices` — ✅ 3 POLICIES (CLEAN)

| Policy | Cmd | Condition | Note |
|--------|-----|-----------|------|
| `Public Read Market Prices` | SELECT | `true` | Public read ✅ |
| `Authenticated Manage Market Prices` | ALL | `auth.role() = 'authenticated'` | ✅ By design — broker submit harga dari trx nyata |
| `Scraper Anon Insert` | INSERT | source IN (whitelist) | Scraper ✅ |

> ✅ Cleanup done (dari 10 → 3). Hardcoded email dihapus. Bypass `true/true` dihapus.
> ℹ️ `Authenticated Manage Market Prices` memang `authenticated` bukan superadmin-only — crowdsourced dari broker.

---

### `broker_connections` — ⚠️ 6 POLICIES (DEPRECATED + NEW)

**OLD (deprecated — pakai kolom `peternak_tenant_id`/`broker_tenant_id`):**

| Policy | Cmd | Condition |
|--------|-----|-----------|
| `connections_select` | SELECT | `peternak_tenant_id = my_tenant_id() OR broker_tenant_id = my_tenant_id() OR is_superadmin()` |
| `connections_insert` | INSERT | CHECK: `peternak_tenant_id = my_tenant_id() OR broker_tenant_id = my_tenant_id()` |
| `connections_update` | UPDATE | same as select |

**NEW (bidirectional — pakai `requester_tenant_id`/`target_tenant_id`):**

| Policy | Cmd | Condition |
|--------|-----|-----------|
| `Tenant can view own connections` | SELECT | `requester_tenant_id IN (...) OR target_tenant_id IN (...)` |
| `Tenant can request connection` | INSERT | CHECK: `requester_tenant_id IN (...)` |
| `Target can respond to connection` | UPDATE | `target_tenant_id IN (...) OR (requester = me AND status = 'pending')` |

> ⚠️ **Kolom deprecated masih ada** → `20260506_risk4_final.sql` belum dijalankan.
> 🎯 Jalankan script untuk DROP old columns + old policies.

---

### `market_listings` — 6 policies

| Policy | Cmd | Condition |
|--------|-----|-----------|
| `Allow public read access to market_listings` | SELECT | `true` |
| `authenticated_read_market` | SELECT | `is_deleted = false AND status = 'active'` |
| `Tenant Isolation Policy` | ALL | Pattern A |
| `tenant_insert_market` | INSERT | Pattern D (LIMIT 1) |
| `tenant_update_market` | UPDATE | Pattern D (LIMIT 1) |
| `superadmin_delete` | DELETE | superadmin EXISTS |

---

### `payment_settings` — ✅ 3 policies (CLEAN)

| Policy | Roles | Cmd | Condition |
|--------|-------|-----|-----------|
| `Public Read Payment Settings` | public | SELECT | `true` |
| `authenticated_read_payment_settings` | authenticated | SELECT | `true` |
| `superadmin_manage_payment_settings` | authenticated | ALL | `is_superadmin()` |

> ✅ Cleanup done 2026-05-07. Drop: `pay_settings_write`, `Superadmin Manage Payment Settings`, `superadmin_payment_settings`, `Semua user bisa melihat rekening pembayaran`.

---

### `farms` — 4 policies (mixed pattern)

| Policy | Cmd | Condition |
|--------|-----|-----------|
| `Tenant Isolation Policy` | ALL | Pattern A |
| `farms_select` | SELECT | Pattern B (my_tenant_id + superadmin) |
| `farms_update` | UPDATE | Pattern B + role check |
| `farms_write` | INSERT | CHECK: my_tenant_id + owner/staff |

---

### `purchases` — 4 policies (mixed)

| Policy | Cmd | Condition |
|--------|-----|-----------|
| `Tenant Isolation Policy` | ALL | Pattern A + superadmin |
| `purchases_select` | SELECT | Pattern B |
| `purchases_update` | UPDATE | Pattern B + role check |
| `purchases_write` | INSERT | Pattern B + owner/staff |

---

### `sales` — 4 policies (mixed)

| Policy | Cmd | Condition |
|--------|-----|-----------|
| `Tenant Isolation Policy` | ALL | Pattern A + superadmin |
| `sales_select` | SELECT | Pattern B |
| `sales_update` | UPDATE | Pattern B + role check |
| `sales_write` | INSERT | Pattern B + owner/staff |

---

### `peternak_farms` — 4 policies

| Policy | Cmd | Condition |
|--------|-----|-----------|
| `Tenant members can view peternak_farms` | SELECT | Pattern A |
| `Tenant members can insert peternak_farms` | INSERT | Pattern A |
| `Tenant members can update peternak_farms` | UPDATE | Pattern A |
| `peternak_farms_all` | ALL | Pattern B + owner/staff |

> ⚠️ Pattern A dan B overlap di satu tabel.

---

### `peternak_task_instances` — 4 policies (role-based)

| Policy | Cmd | Condition |
|--------|-----|-----------|
| `Peternak Task Instances Select` | SELECT | `tenant_id = my_tenant_id()` |
| `Peternak Task Instances Manage` | ALL | my_tenant_id + owner/manajer |
| `Peternak Task Instances Staff Update` | UPDATE | my_tenant_id + (assigned to me OR owner/manajer) |
| `access_task_instances_v2` | ALL | Pattern E (is_my_tenant + superadmin) |

---

### `peternak_task_templates` — Pattern E

| Policy | Cmd | Condition |
|--------|-----|-----------|
| `peternak_task_templates_all` | ALL | `is_my_tenant(tenant_id) OR is_superadmin()` CHECK: + owner/manajer |

---

### AI Tables — Dual Pattern (C + profile-based)

> ✅ `ai_conversations` sudah di-hardening ke explicit CRUD (lihat Gen 1).
> ✅ `ai_pending_entries` sudah di-hardening ke explicit CRUD (lihat Gen 1). UPDATE bug `auth.uid() = profile_id` juga sudah difix.
> ⚠️ `ai_staged_transactions` — masih hybrid, next in queue.

`ai_staged_transactions` masih punya:

| Policy | Cmd | Pattern |
|--------|-----|---------|
| `Ai staged transactions tenant access` | ALL | Pattern C (get_my_tenant_id) |
| `Users can insert their own staged transactions` | INSERT | profile-based |
| `Users can see their own staged transactions` | SELECT | profile-based |
| `Users can update their own staged transactions` | UPDATE | profile-based |
| `superadmin_delete` | DELETE | superadmin EXISTS |

`ai_staged_transactions` + `ai_anomaly_logs` juga punya:
- `superadmin_delete` DELETE

`ai_error_logs` hanya: INSERT CHECK `auth.uid() = profile_id`

---

### Tabel dengan `superadmin_delete` tambahan

Selain policy utama, tabel ini punya policy DELETE khusus superadmin:

```
ai_anomaly_logs, ai_staged_transactions, broker_profiles,
cycle_expenses, generated_invoices, harvest_records,
kandang_workers, market_listings, peternak_profiles,
rpa_customer_payments, rpa_customers, rpa_invoices,
rpa_products, rpa_profiles, worker_payments
```

---

### Tabel dengan OVERLAP (policy lama + baru)

| Tabel | Overlap | Severity |
|-------|---------|----------|
| ~~`cycle_expenses`~~ | ~~overlap~~ | ✅ HARDENED (Gen 1) |
| ~~`harvest_records`~~ | ~~overlap~~ | ✅ HARDENED (Gen 1) |
| `kandang_workers` | `kandang_workers_tenant_isolation` (profiles.id=auth.uid ← BUG?) + `tenant_kandang_workers` (Pattern A) + `superadmin_delete` | ⚠️ |
| ~~`deliveries`~~ | ~~BUG profiles.id=auth.uid~~ | ✅ FIXED (auth_user_id) |
| ~~`drivers`~~ | ~~BUG profiles.id=auth.uid~~ | ✅ FIXED (auth_user_id) |
| ~~`sapi_kandangs`~~ | ~~BUG profiles.id=auth.uid~~ | ✅ FIXED + WITH CHECK ditambah |

> ⚠️ `kandang_workers` masih punya potential `profiles.id = auth.uid()` bug — perlu verifikasi.

---

### `rpa_payments` — Cross-tenant

| Policy | Cmd | Condition |
|--------|-----|-----------|
| `rpa_payments_all` | ALL | `rpa_tenant_id = my_tenant_id() OR broker_tenant_id = my_tenant_id() OR is_superadmin()` |
| `superadmin_update` | UPDATE | superadmin EXISTS |

### `rpa_invoice_items` — FK-based

| Policy | Cmd | Condition |
|--------|-----|-----------|
| `rpa_invoice_items_all` | ALL | EXISTS join ke rpa_invoices where tenant_id = my_tenant_id() |

---

### Global Tables (no tenant_id)

| Tabel | SELECT | WRITE |
|-------|--------|-------|
| `pricing_plans` | `true` (public) | `is_superadmin()` ALL |
| `plan_configs` | `true` (public) | `is_superadmin()` ALL |
| `discount_codes` | `true` (public) | `is_superadmin()` ALL |
| `invite_rate_limits` | `false` (deny all) | `false` (deny all) — service_role only |
| `global_audit_logs` | `is_my_tenant(tenant_id)` + `is_superadmin()` | INSERT: `is_superadmin()` |
| `notifications` | Pattern A + `is_my_tenant OR is_superadmin` | Pattern A |
| `waitlist_signups` | `is_superadmin()` | INSERT: anon |
| `xendit_config` | `is_superadmin()` | `is_superadmin()` |

---

### Tenant & Membership

| Tabel | Policies |
|-------|----------|
| `tenants` | SELECT: tenant members + superadmin. UPDATE: `is_my_tenant AND role = 'owner'` + superadmin |
| `tenant_memberships` | SELECT+INSERT: `auth_user_id = auth.uid()` |
| `team_invitations` | SELECT+UPDATE: Pattern A. INSERT: Pattern A. Token validation via Edge Function |
| `subscription_invoices` | SELECT: Pattern A. INSERT/UPDATE: service_role or superadmin |
| `stock_listings` | SELECT: owner OR public OR connected (EXISTS join). INSERT/UPDATE: owner |

---

## 🔑 POSTGRES ROLES

| Role | Deskripsi |
|------|-----------|
| `anon` | Belum login. Landing page, market stats, waitlist INSERT |
| `authenticated` | Sudah login via JWT. Semua data bisnis via RLS |
| `service_role` | **Bypass ALL RLS**. Hanya Edge Functions & scraper |

---

## 🚨 RINGKASAN MASALAH YANG HARUS DIPERBAIKI

| # | Tabel | Issue | Priority |
|---|-------|-------|----------|
| 1 | ~~`market_prices`~~ ✅ DONE | ~~10 policies, BYPASS, hardcoded email~~ | ✅ RESOLVED (3 policies clean) |
| 2 | `profiles` | 11 policies, banyak duplikat | 🟡 MEDIUM |
| 3 | ~~`payment_settings`~~ ✅ DONE | ~~3 superadmin ALL identik~~ | ✅ RESOLVED 2026-05-07 |
| 4 | `broker_connections` | 6 policies (3 deprecated + 3 new) | 🟡 Pending migration |
| 5 | ~~`deliveries`, `drivers`~~ ✅ FIXED | ~~`profiles.id = auth.uid()` BUG~~ | ✅ RESOLVED 2026-05-07 |
| 5b | ~~`sapi_kandangs`~~ ✅ FIXED | ~~`profiles.id = auth.uid()` BUG~~ | ✅ RESOLVED 2026-05-07 |
| 5c | `kandang_workers` | Possible `profiles.id = auth.uid()` — perlu verifikasi | 🔴 CRITICAL |
| 6 | ~~`cycle_expenses`, `harvest_records`~~ ✅ HARDENED | ~~Pattern A + Pattern D overlap~~ | ✅ RESOLVED 2026-05-07 |
| 7 | `ai_staged_transactions`, `ai_feedback` | Dual pattern (C + profile-based) overlap | 🟡 MEDIUM |
| 8 | Inkonsistensi fungsi | `my_tenant_id()` vs `get_my_tenant_id()` vs `is_my_tenant()` | 🟡 MEDIUM |

### 🔜 Hardening Queue (Next)
1. `ai_staged_transactions` — transaction object, cross-user risk
2. `ai_feedback` — dual pattern overlap
3. `kandang_workers` — possible auth mapping bug
4. `broker_profiles`, `broker_connections` — marketplace tables
5. Gen 3 mass migration: `domba_*`, `kambing_*`, `egg_*` (architecture cleanup)
