# 🗄️ Database Audit Report

> Generated: 2026-05-06 22:19:04 WIB  
> Duration: 77.3s  
> Supabase Project: `llgqxzrlcewugufzwyer`  

---

## 📊 Summary

| Status | Count |
|--------|-------|
| ✅ Tabel ditemukan (ada data/kolom) | 109 |
| 🔒 Tabel ada (RLS blocked) | 0 |
| ❌ Tidak ditemukan di DB | 22 |
| ⚠️ Error saat check | 0 |
| 🆕 Tabel baru (belum di docs) | 0 |
| **Total dicek** | **131** |

---

## ❌ Tabel Tidak Ditemukan di Supabase
> Tabel ini ada di dokumentasi lokal tapi **tidak ditemukan** di database Supabase.
> Kemungkinan: belum di-migrate, sudah dihapus, atau nama berbeda.

- `kambing_perah_animals`
- `kambing_perah_births`
- `kambing_perah_health_logs`
- `kambing_perah_mating_records`
- `kambing_perah_milk_records`
- `kambing_perah_sales`
- `kambing_perah_weight_records`
- `kd_breeding_animals`
- `kd_breeding_births`
- `kd_breeding_feed_logs`
- `kd_breeding_health_logs`
- `kd_breeding_mating_records`
- `kd_breeding_sales`
- `kd_breeding_weight_records`
- `kd_kandangs`
- `kd_penggemukan_animals`
- `kd_penggemukan_batches`
- `kd_penggemukan_feed_logs`
- `kd_penggemukan_health_logs`
- `kd_penggemukan_sales`
- `kd_penggemukan_weight_records`
- `operational_costs`

---

## 📋 Kolom Aktual per Tabel
> Kolom yang berhasil diintrospeksi dari data aktual (tabel dengan data).
> Tabel kosong atau RLS-blocked tidak bisa diintrospeksi kolomnya.

### `market_prices`
Kolom aktual: `id`, `price_date`, `chicken_type`, `region`, `farm_gate_price`, `avg_buy_price`, `avg_sell_price`, `buyer_price`, `broker_margin`, `transaction_count`, `source`, `created_at`, `updated_at`, `source_url`, `is_deleted`, `price_delta`

### `plan_configs`
Kolom aktual: `id`, `config_key`, `config_value`, `description`, `updated_at`

### `pricing_plans`
Kolom aktual: `id`, `role`, `plan`, `price`, `original_price`, `updated_at`

### `team_invitations`
Kolom aktual: `id`, `tenant_id`, `invited_by`, `email`, `role`, `token`, `status`, `expires_at`, `created_at`, `is_deleted`

### `tenants`
Kolom aktual: `id`, `business_name`, `owner_name`, `phone`, `location`, `plan`, `is_active`, `trial_ends_at`, `created_at`, `updated_at`, `business_vertical`, `is_hidden_beta`, `kandang_limit`, `sub_type`, `chicken_types`, `animal_types`, `area_operasi`, `target_volume_monthly`, `base_livestock_type`, `addon_livestock_types`, `plan_expires_at`, `province`

---

## ✅ Tabel Terkonfirmasi Ada di Supabase

**Total: 109 tabel**

- `ai_anomaly_logs`
- `ai_conversations`
- `ai_error_logs`
- `ai_pending_entries`
- `ai_staged_transactions`
- `breeding_cycles`
- `broker_connections`
- `chicken_batches`
- `cycle_expenses`
- `daily_records`
- `deliveries`
- `discount_codes`
- `domba_breeding_animals`
- `domba_breeding_births`
- `domba_breeding_health_logs`
- `domba_breeding_mating_records`
- `domba_breeding_sales`
- `domba_breeding_weight_records`
- `domba_kandangs`
- `domba_penggemukan_animals`
- `domba_penggemukan_batches`
- `domba_penggemukan_feed_logs`
- `domba_penggemukan_health_logs`
- `domba_penggemukan_sales`
- `domba_penggemukan_weight_records`
- `drivers`
- `egg_customers`
- `egg_inventory`
- `egg_sale_items`
- `egg_sales`
- `egg_stock_logs`
- `egg_suppliers`
- `extra_expenses`
- `farms`
- `feed_stocks`
- `generated_invoices`
- `global_audit_logs`
- `harvest_records`
- `kambing_breeding_animals`
- `kambing_breeding_births`
- `kambing_breeding_health_logs`
- `kambing_breeding_mating_records`
- `kambing_breeding_sales`
- `kambing_breeding_weight_records`
- `kambing_kandangs`
- `kambing_penggemukan_animals`
- `kambing_penggemukan_batches`
- `kambing_penggemukan_feed_logs`
- `kambing_penggemukan_health_logs`
- `kambing_penggemukan_sales`
- `kambing_penggemukan_weight_records`
- `kandang_workers`
- `loss_reports`
- `market_listings`
- `market_prices`
- `notifications`
- `orders`
- `payment_settings`
- `payments`
- `peternak_farms`
- `peternak_task_instances`
- `peternak_task_templates`
- `plan_configs`
- `pricing_plans`
- `profiles`
- `purchases`
- `rpa_clients`
- `rpa_customer_payments`
- `rpa_invoice_items`
- `rpa_invoices`
- `rpa_payments`
- `rpa_profiles`
- `rpa_purchase_orders`
- `sales`
- `sapi_breeding_animals`
- `sapi_breeding_births`
- `sapi_breeding_feed_logs`
- `sapi_breeding_health_logs`
- `sapi_breeding_mating_records`
- `sapi_breeding_sales`
- `sapi_breeding_weight_records`
- `sapi_kandangs`
- `sapi_penggemukan_animals`
- `sapi_penggemukan_batches`
- `sapi_penggemukan_feed_logs`
- `sapi_penggemukan_health_logs`
- `sapi_penggemukan_sales`
- `sapi_penggemukan_weight_records`
- `sembako_customers`
- `sembako_deliveries`
- `sembako_employees`
- `sembako_expenses`
- `sembako_payments`
- `sembako_payroll`
- `sembako_products`
- `sembako_sale_items`
- `sembako_sales`
- `sembako_stock_batches`
- `sembako_stock_out`
- `sembako_supplier_payments`
- `sembako_suppliers`
- `stock_listings`
- `subscription_invoices`
- `team_invitations`
- `tenants`
- `vaccination_records`
- `vehicle_expenses`
- `vehicles`
- `worker_payments`