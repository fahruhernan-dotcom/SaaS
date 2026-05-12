-- 12_triggers.sql
-- Source: Supabase TRIGGERS.txt
-- Last sync: (Current)
-- DO NOT EDIT MANUALLY

DROP TRIGGER IF EXISTS "trg_ai_conversations_updated_at" ON "public"."ai_conversations";
CREATE TRIGGER "trg_ai_conversations_updated_at" BEFORE UPDATE ON "public"."ai_conversations" FOR EACH ROW EXECUTE FUNCTION update_ai_conversations_updated_at();

DROP TRIGGER IF EXISTS "trg_ai_pending_entries_updated_at" ON "public"."ai_pending_entries";
CREATE TRIGGER "trg_ai_pending_entries_updated_at" BEFORE UPDATE ON "public"."ai_pending_entries" FOR EACH ROW EXECUTE FUNCTION update_ai_pending_entries_updated_at();

DROP TRIGGER IF EXISTS "upd_cycles" ON "public"."breeding_cycles";
CREATE TRIGGER "upd_cycles" BEFORE UPDATE ON "public"."breeding_cycles" FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS "upd_batches" ON "public"."chicken_batches";
CREATE TRIGGER "upd_batches" BEFORE UPDATE ON "public"."chicken_batches" FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS "t_cycle_summary" ON "public"."daily_records";
CREATE TRIGGER "t_cycle_summary" AFTER UPDATE OR INSERT ON "public"."daily_records" FOR EACH ROW EXECUTE FUNCTION update_cycle_summary();

DROP TRIGGER IF EXISTS "upd_deliveries" ON "public"."deliveries";
CREATE TRIGGER "upd_deliveries" BEFORE UPDATE ON "public"."deliveries" FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS "tr_audit_discounts" ON "public"."discount_codes";
CREATE TRIGGER "tr_audit_discounts" AFTER DELETE OR UPDATE OR INSERT ON "public"."discount_codes" FOR EACH ROW EXECUTE FUNCTION log_audit_action();

DROP TRIGGER IF EXISTS "set_updated_at_domba_penggemukan_operational_costs" ON "public"."domba_penggemukan_operational_costs";
CREATE TRIGGER "set_updated_at_domba_penggemukan_operational_costs" BEFORE UPDATE ON "public"."domba_penggemukan_operational_costs" FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS "upd_drivers" ON "public"."drivers";
CREATE TRIGGER "upd_drivers" BEFORE UPDATE ON "public"."drivers" FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS "trigger_update_egg_customer_stats" ON "public"."egg_sales";
CREATE TRIGGER "trigger_update_egg_customer_stats" AFTER UPDATE ON "public"."egg_sales" FOR EACH ROW EXECUTE FUNCTION update_egg_customer_stats();

DROP TRIGGER IF EXISTS "trigger_deduct_egg_stock" ON "public"."egg_sales";
CREATE TRIGGER "trigger_deduct_egg_stock" AFTER UPDATE ON "public"."egg_sales" FOR EACH ROW EXECUTE FUNCTION deduct_egg_stock_on_sale();

DROP TRIGGER IF EXISTS "upd_farms" ON "public"."farms";
CREATE TRIGGER "upd_farms" BEFORE UPDATE ON "public"."farms" FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS "set_updated_at_kambing_penggemukan_operational_costs" ON "public"."kambing_penggemukan_operational_costs";
CREATE TRIGGER "set_updated_at_kambing_penggemukan_operational_costs" BEFORE UPDATE ON "public"."kambing_penggemukan_operational_costs" FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS "trg_flag_market_price_outlier" ON "public"."market_prices";
CREATE TRIGGER "trg_flag_market_price_outlier" BEFORE INSERT OR UPDATE ON "public"."market_prices" FOR EACH ROW EXECUTE FUNCTION flag_market_price_outlier();

DROP TRIGGER IF EXISTS "notifications_updated_at" ON "public"."notifications";
CREATE TRIGGER "notifications_updated_at" BEFORE UPDATE ON "public"."notifications" FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS "upd_orders" ON "public"."orders";
CREATE TRIGGER "upd_orders" BEFORE UPDATE ON "public"."orders" FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS "t_sync_payment" ON "public"."payments";
CREATE TRIGGER "t_sync_payment" AFTER INSERT ON "public"."payments" FOR EACH ROW EXECUTE FUNCTION sync_sale_payment();

DROP TRIGGER IF EXISTS "upd_peternak_farms" ON "public"."peternak_farms";
CREATE TRIGGER "upd_peternak_farms" BEFORE UPDATE ON "public"."peternak_farms" FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS "set_updated_at_task_instances" ON "public"."peternak_task_instances";
CREATE TRIGGER "set_updated_at_task_instances" BEFORE UPDATE ON "public"."peternak_task_instances" FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS "peternak_generate_task_instances" ON "public"."peternak_task_templates";
CREATE TRIGGER "peternak_generate_task_instances" AFTER UPDATE OR INSERT ON "public"."peternak_task_templates" FOR EACH ROW EXECUTE FUNCTION trg_peternak_generate_task_instances();

DROP TRIGGER IF EXISTS "set_updated_at_task_templates" ON "public"."peternak_task_templates";
CREATE TRIGGER "set_updated_at_task_templates" BEFORE UPDATE ON "public"."peternak_task_templates" FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS "tr_audit_pricing_plans" ON "public"."pricing_plans";
CREATE TRIGGER "tr_audit_pricing_plans" AFTER UPDATE OR DELETE OR INSERT ON "public"."pricing_plans" FOR EACH ROW EXECUTE FUNCTION log_audit_action();

DROP TRIGGER IF EXISTS "upd_profiles" ON "public"."profiles";
CREATE TRIGGER "upd_profiles" BEFORE UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS "trg_prevent_profile_privilege_escalation" ON "public"."profiles";
CREATE TRIGGER "trg_prevent_profile_privilege_escalation" BEFORE UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION prevent_profile_privilege_escalation();

DROP TRIGGER IF EXISTS "trg_prevent_app_role_escalation" ON "public"."profiles";
CREATE TRIGGER "trg_prevent_app_role_escalation" BEFORE UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION prevent_app_role_escalation();

DROP TRIGGER IF EXISTS "tr_audit_profiles" ON "public"."profiles";
CREATE TRIGGER "tr_audit_profiles" AFTER UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION log_audit_action();

DROP TRIGGER IF EXISTS "sync_market_price_on_purchase" ON "public"."purchases";
CREATE TRIGGER "sync_market_price_on_purchase" AFTER UPDATE OR DELETE OR INSERT ON "public"."purchases" FOR EACH ROW EXECUTE FUNCTION trg_purchases_sync_market_price();

DROP TRIGGER IF EXISTS "upd_purchases" ON "public"."purchases";
CREATE TRIGGER "upd_purchases" BEFORE UPDATE ON "public"."purchases" FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS "t_farm_last_txn" ON "public"."purchases";
CREATE TRIGGER "t_farm_last_txn" AFTER INSERT ON "public"."purchases" FOR EACH ROW EXECUTE FUNCTION update_farm_last_transaction();

DROP TRIGGER IF EXISTS "upd_rpa" ON "public"."rpa_clients";
CREATE TRIGGER "upd_rpa" BEFORE UPDATE ON "public"."rpa_clients" FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS "trigger_sync_rpa_customer_outstanding" ON "public"."rpa_customer_payments";
CREATE TRIGGER "trigger_sync_rpa_customer_outstanding" AFTER INSERT OR DELETE OR UPDATE ON "public"."rpa_customer_payments" FOR EACH ROW EXECUTE FUNCTION sync_rpa_customer_outstanding();

DROP TRIGGER IF EXISTS "trg_rpa_invoice_quota" ON "public"."rpa_invoices";
CREATE TRIGGER "trg_rpa_invoice_quota" BEFORE INSERT ON "public"."rpa_invoices" FOR EACH ROW EXECUTE FUNCTION enforce_rpa_invoice_quota();

DROP TRIGGER IF EXISTS "t_sync_outstanding" ON "public"."sales";
CREATE TRIGGER "t_sync_outstanding" AFTER DELETE OR UPDATE OR INSERT ON "public"."sales" FOR EACH ROW EXECUTE FUNCTION sync_rpa_outstanding();

DROP TRIGGER IF EXISTS "upd_sales" ON "public"."sales";
CREATE TRIGGER "upd_sales" BEFORE UPDATE ON "public"."sales" FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS "sync_market_price_on_sale" ON "public"."sales";
CREATE TRIGGER "sync_market_price_on_sale" AFTER UPDATE OR DELETE OR INSERT ON "public"."sales" FOR EACH ROW EXECUTE FUNCTION trg_sales_sync_market_price();

DROP TRIGGER IF EXISTS "trigger_auto_resolve_loss_reports" ON "public"."sales";
CREATE TRIGGER "trigger_auto_resolve_loss_reports" AFTER UPDATE ON "public"."sales" FOR EACH ROW EXECUTE FUNCTION auto_resolve_loss_reports();

DROP TRIGGER IF EXISTS "set_updated_at_sapi_breeding_animals" ON "public"."sapi_breeding_animals";
CREATE TRIGGER "set_updated_at_sapi_breeding_animals" BEFORE UPDATE ON "public"."sapi_breeding_animals" FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS "sapi_breeding_birth_mating" ON "public"."sapi_breeding_births";
CREATE TRIGGER "sapi_breeding_birth_mating" AFTER INSERT ON "public"."sapi_breeding_births" FOR EACH ROW EXECUTE FUNCTION trg_sapi_breeding_birth_mating();

DROP TRIGGER IF EXISTS "set_updated_at_sapi_breeding_feed_logs" ON "public"."sapi_breeding_feed_logs";
CREATE TRIGGER "set_updated_at_sapi_breeding_feed_logs" BEFORE UPDATE ON "public"."sapi_breeding_feed_logs" FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS "sapi_breeding_health_mark_dead" ON "public"."sapi_breeding_health_logs";
CREATE TRIGGER "sapi_breeding_health_mark_dead" AFTER INSERT ON "public"."sapi_breeding_health_logs" FOR EACH ROW EXECUTE FUNCTION trg_sapi_breeding_health_mark_dead();

DROP TRIGGER IF EXISTS "set_updated_at_sapi_breeding_mating_records" ON "public"."sapi_breeding_mating_records";
CREATE TRIGGER "set_updated_at_sapi_breeding_mating_records" BEFORE UPDATE ON "public"."sapi_breeding_mating_records" FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS "sapi_breeding_mating_defaults" ON "public"."sapi_breeding_mating_records";
CREATE TRIGGER "sapi_breeding_mating_defaults" BEFORE INSERT ON "public"."sapi_breeding_mating_records" FOR EACH ROW EXECUTE FUNCTION trg_sapi_breeding_mating_defaults();

DROP TRIGGER IF EXISTS "set_updated_at_sapi_breeding_sales" ON "public"."sapi_breeding_sales";
CREATE TRIGGER "set_updated_at_sapi_breeding_sales" BEFORE UPDATE ON "public"."sapi_breeding_sales" FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS "sapi_breeding_sale_mark_sold" ON "public"."sapi_breeding_sales";
CREATE TRIGGER "sapi_breeding_sale_mark_sold" AFTER INSERT ON "public"."sapi_breeding_sales" FOR EACH ROW EXECUTE FUNCTION trg_sapi_breeding_sale_mark_sold();

DROP TRIGGER IF EXISTS "sapi_breeding_weight_sync" ON "public"."sapi_breeding_weight_records";
CREATE TRIGGER "sapi_breeding_weight_sync" AFTER UPDATE OR INSERT ON "public"."sapi_breeding_weight_records" FOR EACH ROW EXECUTE FUNCTION trg_sapi_breeding_weight_sync();

DROP TRIGGER IF EXISTS "set_updated_at_sapi_penggemukan_animals" ON "public"."sapi_penggemukan_animals";
CREATE TRIGGER "set_updated_at_sapi_penggemukan_animals" BEFORE UPDATE ON "public"."sapi_penggemukan_animals" FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS "sapi_sync_batch_mortality" ON "public"."sapi_penggemukan_animals";
CREATE TRIGGER "sapi_sync_batch_mortality" AFTER UPDATE ON "public"."sapi_penggemukan_animals" FOR EACH ROW EXECUTE FUNCTION trg_sapi_sync_batch_mortality();

DROP TRIGGER IF EXISTS "set_updated_at_sapi_penggemukan_batches" ON "public"."sapi_penggemukan_batches";
CREATE TRIGGER "set_updated_at_sapi_penggemukan_batches" BEFORE UPDATE ON "public"."sapi_penggemukan_batches" FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS "set_updated_at_sapi_penggemukan_feed_logs" ON "public"."sapi_penggemukan_feed_logs";
CREATE TRIGGER "set_updated_at_sapi_penggemukan_feed_logs" BEFORE UPDATE ON "public"."sapi_penggemukan_feed_logs" FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS "set_updated_at_sapi_penggemukan_operational_costs" ON "public"."sapi_penggemukan_operational_costs";
CREATE TRIGGER "set_updated_at_sapi_penggemukan_operational_costs" BEFORE UPDATE ON "public"."sapi_penggemukan_operational_costs" FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS "set_updated_at_sapi_penggemukan_sales" ON "public"."sapi_penggemukan_sales";
CREATE TRIGGER "set_updated_at_sapi_penggemukan_sales" BEFORE UPDATE ON "public"."sapi_penggemukan_sales" FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS "sapi_sync_animal_latest_weight" ON "public"."sapi_penggemukan_weight_records";
CREATE TRIGGER "sapi_sync_animal_latest_weight" AFTER UPDATE OR INSERT ON "public"."sapi_penggemukan_weight_records" FOR EACH ROW EXECUTE FUNCTION trg_sapi_sync_animal_latest_weight();

DROP TRIGGER IF EXISTS "trigger_sync_balance_payments" ON "public"."sembako_payments";
CREATE TRIGGER "trigger_sync_balance_payments" AFTER INSERT OR DELETE OR UPDATE ON "public"."sembako_payments" FOR EACH ROW EXECUTE FUNCTION tr_sync_sembako_balance();

DROP TRIGGER IF EXISTS "trigger_sync_sembako_customer" ON "public"."sembako_payments";
CREATE TRIGGER "trigger_sync_sembako_customer" AFTER UPDATE OR DELETE OR INSERT ON "public"."sembako_payments" FOR EACH ROW EXECUTE FUNCTION sync_sembako_customer_outstanding();

DROP TRIGGER IF EXISTS "trg_payment_ceiling" ON "public"."sembako_payments";
CREATE TRIGGER "trg_payment_ceiling" AFTER INSERT ON "public"."sembako_payments" FOR EACH ROW EXECUTE FUNCTION enforce_payment_ceiling();

DROP TRIGGER IF EXISTS "trg_recalc_payment_status" ON "public"."sembako_sales";
CREATE TRIGGER "trg_recalc_payment_status" BEFORE UPDATE ON "public"."sembako_sales" FOR EACH ROW EXECUTE FUNCTION recalculate_payment_status();

DROP TRIGGER IF EXISTS "trigger_sync_balance_sales" ON "public"."sembako_sales";
CREATE TRIGGER "trigger_sync_balance_sales" AFTER INSERT OR DELETE OR UPDATE ON "public"."sembako_sales" FOR EACH ROW EXECUTE FUNCTION tr_sync_sembako_balance();

DROP TRIGGER IF EXISTS "trg_sembako_quota_check" ON "public"."sembako_sales";
CREATE TRIGGER "trg_sembako_quota_check" BEFORE INSERT ON "public"."sembako_sales" FOR EACH ROW EXECUTE FUNCTION check_sembako_transaction_quota();

DROP TRIGGER IF EXISTS "trigger_update_sembako_stock" ON "public"."sembako_stock_batches";
CREATE TRIGGER "trigger_update_sembako_stock" AFTER DELETE OR UPDATE OR INSERT ON "public"."sembako_stock_batches" FOR EACH ROW EXECUTE FUNCTION update_sembako_product_stock();

DROP TRIGGER IF EXISTS "upd_listings" ON "public"."stock_listings";
CREATE TRIGGER "upd_listings" BEFORE UPDATE ON "public"."stock_listings" FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS "trg_activate_plan_on_invoice_paid" ON "public"."subscription_invoices";
CREATE TRIGGER "trg_activate_plan_on_invoice_paid" AFTER UPDATE ON "public"."subscription_invoices" FOR EACH ROW EXECUTE FUNCTION activate_plan_on_invoice_paid();

DROP TRIGGER IF EXISTS "t_invoice_number" ON "public"."subscription_invoices";
CREATE TRIGGER "t_invoice_number" BEFORE INSERT ON "public"."subscription_invoices" FOR EACH ROW EXECUTE FUNCTION generate_invoice_number();

DROP TRIGGER IF EXISTS "tr_audit_invoices" ON "public"."subscription_invoices";
CREATE TRIGGER "tr_audit_invoices" AFTER UPDATE ON "public"."subscription_invoices" FOR EACH ROW EXECUTE FUNCTION log_audit_action();

DROP TRIGGER IF EXISTS "upd_invoices" ON "public"."subscription_invoices";
CREATE TRIGGER "upd_invoices" BEFORE UPDATE ON "public"."subscription_invoices" FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS "upd_tenants" ON "public"."tenants";
CREATE TRIGGER "upd_tenants" BEFORE UPDATE ON "public"."tenants" FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS "tr_audit_tenants" ON "public"."tenants";
CREATE TRIGGER "tr_audit_tenants" AFTER UPDATE ON "public"."tenants" FOR EACH ROW EXECUTE FUNCTION log_audit_action();

DROP TRIGGER IF EXISTS "upd_vehicles" ON "public"."vehicles";
CREATE TRIGGER "upd_vehicles" BEFORE UPDATE ON "public"."vehicles" FOR EACH ROW EXECUTE FUNCTION set_updated_at();
