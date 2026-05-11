-- 08_functions.sql
-- Generated from Supabase FUNCTIONS.txt
-- Last sync: 2026-05-12
-- DO NOT EDIT MANUALLY — regenerate from snapshot .txt

CREATE OR REPLACE FUNCTION "auth"."email"() RETURNS void
LANGUAGE sql
VOLATILE
AS $$

$$;

CREATE OR REPLACE FUNCTION "auth"."jwt"() RETURNS void
LANGUAGE sql
VOLATILE
AS $$

$$;

CREATE OR REPLACE FUNCTION "auth"."role"() RETURNS void
LANGUAGE sql
VOLATILE
AS $$

$$;

CREATE OR REPLACE FUNCTION "auth"."uid"() RETURNS void
LANGUAGE sql
VOLATILE
AS $$

$$;

CREATE OR REPLACE FUNCTION "cron"."alter_job"() RETURNS void
LANGUAGE c
VOLATILE
AS $$

$$;

CREATE OR REPLACE FUNCTION "cron"."job_cache_invalidate"() RETURNS void
LANGUAGE c
VOLATILE
AS $$

$$;

CREATE OR REPLACE FUNCTION "cron"."schedule"() RETURNS void
LANGUAGE c
VOLATILE
AS $$

$$;

CREATE OR REPLACE FUNCTION "cron"."schedule"() RETURNS void
LANGUAGE c
VOLATILE
AS $$

$$;

CREATE OR REPLACE FUNCTION "cron"."schedule_in_database"() RETURNS void
LANGUAGE c
VOLATILE
AS $$

$$;

CREATE OR REPLACE FUNCTION "cron"."unschedule"() RETURNS void
LANGUAGE c
VOLATILE
AS $$

$$;

CREATE OR REPLACE FUNCTION "cron"."unschedule"() RETURNS void
LANGUAGE c
VOLATILE
AS $$

$$;

CREATE OR REPLACE FUNCTION "extensions"."armor"() RETURNS void
LANGUAGE c
VOLATILE
AS $$

$$;

CREATE OR REPLACE FUNCTION "extensions"."armor"() RETURNS void
LANGUAGE c
VOLATILE
AS $$

$$;

CREATE OR REPLACE FUNCTION "extensions"."crypt"() RETURNS void
LANGUAGE c
VOLATILE
AS $$

$$;

CREATE OR REPLACE FUNCTION "extensions"."dearmor"() RETURNS void
LANGUAGE c
VOLATILE
AS $$

$$;

CREATE OR REPLACE FUNCTION "extensions"."decrypt"() RETURNS void
LANGUAGE c
VOLATILE
AS $$

$$;

CREATE OR REPLACE FUNCTION "extensions"."decrypt_iv"() RETURNS void
LANGUAGE c
VOLATILE
AS $$

$$;

CREATE OR REPLACE FUNCTION "extensions"."digest"() RETURNS void
LANGUAGE c
VOLATILE
AS $$

$$;

CREATE OR REPLACE FUNCTION "extensions"."digest"() RETURNS void
LANGUAGE c
VOLATILE
AS $$

$$;

CREATE OR REPLACE FUNCTION "extensions"."encrypt"() RETURNS void
LANGUAGE c
VOLATILE
AS $$

$$;

CREATE OR REPLACE FUNCTION "extensions"."encrypt_iv"() RETURNS void
LANGUAGE c
VOLATILE
AS $$

$$;

CREATE OR REPLACE FUNCTION "extensions"."gen_random_bytes"() RETURNS void
LANGUAGE c
VOLATILE
AS $$

$$;

CREATE OR REPLACE FUNCTION "extensions"."gen_random_uuid"() RETURNS void
LANGUAGE c
VOLATILE
AS $$

$$;

CREATE OR REPLACE FUNCTION "extensions"."gen_salt"() RETURNS void
LANGUAGE c
VOLATILE
AS $$

$$;

CREATE OR REPLACE FUNCTION "extensions"."gen_salt"() RETURNS void
LANGUAGE c
VOLATILE
AS $$

$$;

CREATE OR REPLACE FUNCTION "extensions"."gin_extract_query_trgm"() RETURNS void
LANGUAGE c
VOLATILE
AS $$

$$;

CREATE OR REPLACE FUNCTION "extensions"."gin_extract_value_trgm"() RETURNS void
LANGUAGE c
VOLATILE
AS $$

$$;

CREATE OR REPLACE FUNCTION "extensions"."gin_trgm_consistent"() RETURNS void
LANGUAGE c
VOLATILE
AS $$

$$;

CREATE OR REPLACE FUNCTION "extensions"."gin_trgm_triconsistent"() RETURNS void
LANGUAGE c
VOLATILE
AS $$

$$;

CREATE OR REPLACE FUNCTION "extensions"."grant_pg_cron_access"() RETURNS void
LANGUAGE plpgsql
VOLATILE
AS $$

$$;

CREATE OR REPLACE FUNCTION "extensions"."grant_pg_graphql_access"() RETURNS void
LANGUAGE plpgsql
VOLATILE
AS $$

$$;

CREATE OR REPLACE FUNCTION "extensions"."grant_pg_net_access"() RETURNS void
LANGUAGE plpgsql
VOLATILE
AS $$

$$;

CREATE OR REPLACE FUNCTION "extensions"."gtrgm_compress"() RETURNS void
LANGUAGE c
VOLATILE
AS $$

$$;

CREATE OR REPLACE FUNCTION "extensions"."gtrgm_consistent"() RETURNS void
LANGUAGE c
VOLATILE
AS $$

$$;

CREATE OR REPLACE FUNCTION "extensions"."gtrgm_decompress"() RETURNS void
LANGUAGE c
VOLATILE
AS $$

$$;

CREATE OR REPLACE FUNCTION "extensions"."gtrgm_distance"() RETURNS void
LANGUAGE c
VOLATILE
AS $$

$$;

CREATE OR REPLACE FUNCTION "extensions"."gtrgm_in"() RETURNS void
LANGUAGE c
VOLATILE
AS $$

$$;

CREATE OR REPLACE FUNCTION "extensions"."gtrgm_options"() RETURNS void
LANGUAGE c
VOLATILE
AS $$

$$;

CREATE OR REPLACE FUNCTION "extensions"."gtrgm_out"() RETURNS void
LANGUAGE c
VOLATILE
AS $$

$$;

CREATE OR REPLACE FUNCTION "extensions"."gtrgm_penalty"() RETURNS void
LANGUAGE c
VOLATILE
AS $$

$$;

CREATE OR REPLACE FUNCTION "extensions"."gtrgm_picksplit"() RETURNS void
LANGUAGE c
VOLATILE
AS $$

$$;

CREATE OR REPLACE FUNCTION "extensions"."gtrgm_same"() RETURNS void
LANGUAGE c
VOLATILE
AS $$

$$;

CREATE OR REPLACE FUNCTION "extensions"."gtrgm_union"() RETURNS void
LANGUAGE c
VOLATILE
AS $$

$$;

CREATE OR REPLACE FUNCTION "extensions"."hmac"() RETURNS void
LANGUAGE c
VOLATILE
AS $$

$$;

CREATE OR REPLACE FUNCTION "extensions"."hmac"() RETURNS void
LANGUAGE c
VOLATILE
AS $$

$$;

CREATE OR REPLACE FUNCTION "extensions"."pg_stat_statements"() RETURNS void
LANGUAGE c
VOLATILE
AS $$

$$;

CREATE OR REPLACE FUNCTION "extensions"."pg_stat_statements_info"() RETURNS void
LANGUAGE c
VOLATILE
AS $$

$$;

CREATE OR REPLACE FUNCTION "extensions"."pg_stat_statements_reset"() RETURNS void
LANGUAGE c
VOLATILE
AS $$

$$;

CREATE OR REPLACE FUNCTION "extensions"."pgp_armor_headers"() RETURNS void
LANGUAGE c
VOLATILE
AS $$

$$;

CREATE OR REPLACE FUNCTION "extensions"."pgp_key_id"() RETURNS void
LANGUAGE c
VOLATILE
AS $$

$$;

CREATE OR REPLACE FUNCTION "extensions"."pgp_pub_decrypt"() RETURNS void
LANGUAGE c
VOLATILE
AS $$

$$;

CREATE OR REPLACE FUNCTION "extensions"."pgp_pub_decrypt"() RETURNS void
LANGUAGE c
VOLATILE
AS $$

$$;

CREATE OR REPLACE FUNCTION "extensions"."pgp_pub_decrypt"() RETURNS void
LANGUAGE c
VOLATILE
AS $$

$$;

CREATE OR REPLACE FUNCTION "extensions"."pgp_pub_decrypt_bytea"() RETURNS void
LANGUAGE c
VOLATILE
AS $$

$$;

CREATE OR REPLACE FUNCTION "extensions"."pgp_pub_decrypt_bytea"() RETURNS void
LANGUAGE c
VOLATILE
AS $$

$$;

CREATE OR REPLACE FUNCTION "extensions"."pgp_pub_decrypt_bytea"() RETURNS void
LANGUAGE c
VOLATILE
AS $$

$$;

CREATE OR REPLACE FUNCTION "extensions"."pgp_pub_encrypt"() RETURNS void
LANGUAGE c
VOLATILE
AS $$

$$;

CREATE OR REPLACE FUNCTION "extensions"."pgp_pub_encrypt"() RETURNS void
LANGUAGE c
VOLATILE
AS $$

$$;

CREATE OR REPLACE FUNCTION "extensions"."pgp_pub_encrypt_bytea"() RETURNS void
LANGUAGE c
VOLATILE
AS $$

$$;

CREATE OR REPLACE FUNCTION "extensions"."pgp_pub_encrypt_bytea"() RETURNS void
LANGUAGE c
VOLATILE
AS $$

$$;

CREATE OR REPLACE FUNCTION "extensions"."pgp_sym_decrypt"() RETURNS void
LANGUAGE c
VOLATILE
AS $$

$$;

CREATE OR REPLACE FUNCTION "extensions"."pgp_sym_decrypt"() RETURNS void
LANGUAGE c
VOLATILE
AS $$

$$;

CREATE OR REPLACE FUNCTION "extensions"."pgp_sym_decrypt_bytea"() RETURNS void
LANGUAGE c
VOLATILE
AS $$

$$;

CREATE OR REPLACE FUNCTION "extensions"."pgp_sym_decrypt_bytea"() RETURNS void
LANGUAGE c
VOLATILE
AS $$

$$;

CREATE OR REPLACE FUNCTION "extensions"."pgp_sym_encrypt"() RETURNS void
LANGUAGE c
VOLATILE
AS $$

$$;

CREATE OR REPLACE FUNCTION "extensions"."pgp_sym_encrypt"() RETURNS void
LANGUAGE c
VOLATILE
AS $$

$$;

CREATE OR REPLACE FUNCTION "extensions"."pgp_sym_encrypt_bytea"() RETURNS void
LANGUAGE c
VOLATILE
AS $$

$$;

CREATE OR REPLACE FUNCTION "extensions"."pgp_sym_encrypt_bytea"() RETURNS void
LANGUAGE c
VOLATILE
AS $$

$$;

CREATE OR REPLACE FUNCTION "extensions"."pgrst_ddl_watch"() RETURNS void
LANGUAGE plpgsql
VOLATILE
AS $$

$$;

CREATE OR REPLACE FUNCTION "extensions"."pgrst_drop_watch"() RETURNS void
LANGUAGE plpgsql
VOLATILE
AS $$

$$;

CREATE OR REPLACE FUNCTION "extensions"."set_graphql_placeholder"() RETURNS void
LANGUAGE plpgsql
VOLATILE
AS $$

$$;

CREATE OR REPLACE FUNCTION "extensions"."set_limit"() RETURNS void
LANGUAGE c
VOLATILE
AS $$

$$;

CREATE OR REPLACE FUNCTION "extensions"."show_limit"() RETURNS void
LANGUAGE c
VOLATILE
AS $$

$$;

CREATE OR REPLACE FUNCTION "extensions"."show_trgm"() RETURNS void
LANGUAGE c
VOLATILE
AS $$

$$;

CREATE OR REPLACE FUNCTION "extensions"."similarity"() RETURNS void
LANGUAGE c
VOLATILE
AS $$

$$;

CREATE OR REPLACE FUNCTION "extensions"."similarity_dist"() RETURNS void
LANGUAGE c
VOLATILE
AS $$

$$;

CREATE OR REPLACE FUNCTION "extensions"."similarity_op"() RETURNS void
LANGUAGE c
VOLATILE
AS $$

$$;

CREATE OR REPLACE FUNCTION "extensions"."strict_word_similarity"() RETURNS void
LANGUAGE c
VOLATILE
AS $$

$$;

CREATE OR REPLACE FUNCTION "extensions"."strict_word_similarity_commutator_op"() RETURNS void
LANGUAGE c
VOLATILE
AS $$

$$;

CREATE OR REPLACE FUNCTION "extensions"."strict_word_similarity_dist_commutator_op"() RETURNS void
LANGUAGE c
VOLATILE
AS $$

$$;

CREATE OR REPLACE FUNCTION "extensions"."strict_word_similarity_dist_op"() RETURNS void
LANGUAGE c
VOLATILE
AS $$

$$;

CREATE OR REPLACE FUNCTION "extensions"."strict_word_similarity_op"() RETURNS void
LANGUAGE c
VOLATILE
AS $$

$$;

CREATE OR REPLACE FUNCTION "extensions"."uuid_generate_v1"() RETURNS void
LANGUAGE c
VOLATILE
AS $$

$$;

CREATE OR REPLACE FUNCTION "extensions"."uuid_generate_v1mc"() RETURNS void
LANGUAGE c
VOLATILE
AS $$

$$;

CREATE OR REPLACE FUNCTION "extensions"."uuid_generate_v3"() RETURNS void
LANGUAGE c
VOLATILE
AS $$

$$;

CREATE OR REPLACE FUNCTION "extensions"."uuid_generate_v4"() RETURNS void
LANGUAGE c
VOLATILE
AS $$

$$;

CREATE OR REPLACE FUNCTION "extensions"."uuid_generate_v5"() RETURNS void
LANGUAGE c
VOLATILE
AS $$

$$;

CREATE OR REPLACE FUNCTION "extensions"."uuid_nil"() RETURNS void
LANGUAGE c
VOLATILE
AS $$

$$;

CREATE OR REPLACE FUNCTION "extensions"."uuid_ns_dns"() RETURNS void
LANGUAGE c
VOLATILE
AS $$

$$;

CREATE OR REPLACE FUNCTION "extensions"."uuid_ns_oid"() RETURNS void
LANGUAGE c
VOLATILE
AS $$

$$;

CREATE OR REPLACE FUNCTION "extensions"."uuid_ns_url"() RETURNS void
LANGUAGE c
VOLATILE
AS $$

$$;

CREATE OR REPLACE FUNCTION "extensions"."uuid_ns_x500"() RETURNS void
LANGUAGE c
VOLATILE
AS $$

$$;

CREATE OR REPLACE FUNCTION "extensions"."word_similarity"() RETURNS void
LANGUAGE c
VOLATILE
AS $$

$$;

CREATE OR REPLACE FUNCTION "extensions"."word_similarity_commutator_op"() RETURNS void
LANGUAGE c
VOLATILE
AS $$

$$;

CREATE OR REPLACE FUNCTION "extensions"."word_similarity_dist_commutator_op"() RETURNS void
LANGUAGE c
VOLATILE
AS $$

$$;

CREATE OR REPLACE FUNCTION "extensions"."word_similarity_dist_op"() RETURNS void
LANGUAGE c
VOLATILE
AS $$

$$;

CREATE OR REPLACE FUNCTION "extensions"."word_similarity_op"() RETURNS void
LANGUAGE c
VOLATILE
AS $$

$$;

CREATE OR REPLACE FUNCTION "graphql_public"."graphql"() RETURNS void
LANGUAGE plpgsql
VOLATILE
AS $$

$$;

CREATE OR REPLACE FUNCTION "pgbouncer"."get_auth"() RETURNS void
LANGUAGE plpgsql
VOLATILE
AS $$

$$;

CREATE OR REPLACE FUNCTION "public"."activate_plan_on_invoice_paid"() RETURNS void
LANGUAGE plpgsql
VOLATILE
AS $$

$$;

CREATE OR REPLACE FUNCTION "public"."activate_plan_trial"() RETURNS void
LANGUAGE plpgsql
VOLATILE
AS $$

$$;

CREATE OR REPLACE FUNCTION "public"."aggregate_daily_market_price"() RETURNS void
LANGUAGE plpgsql
VOLATILE
AS $$

$$;

CREATE OR REPLACE FUNCTION "public"."append_tutorial_completed"() RETURNS void
LANGUAGE sql
VOLATILE
AS $$

$$;

CREATE OR REPLACE FUNCTION "public"."auth_user_tenant_ids"() RETURNS void
LANGUAGE sql
VOLATILE
AS $$

$$;

CREATE OR REPLACE FUNCTION "public"."auto_resolve_loss_reports"() RETURNS void
LANGUAGE plpgsql
VOLATILE
AS $$

$$;

CREATE OR REPLACE FUNCTION "public"."can_manage_delivery_sembako"() RETURNS void
LANGUAGE sql
VOLATILE
AS $$

$$;

CREATE OR REPLACE FUNCTION "public"."can_manage_drivers"() RETURNS void
LANGUAGE sql
VOLATILE
AS $$

$$;

CREATE OR REPLACE FUNCTION "public"."can_manage_finance_sembako"() RETURNS void
LANGUAGE sql
VOLATILE
AS $$

$$;

CREATE OR REPLACE FUNCTION "public"."can_manage_inventory_egg"() RETURNS void
LANGUAGE sql
VOLATILE
AS $$

$$;

CREATE OR REPLACE FUNCTION "public"."can_manage_inventory_sembako"() RETURNS void
LANGUAGE sql
VOLATILE
AS $$

$$;

CREATE OR REPLACE FUNCTION "public"."can_manage_payments"() RETURNS void
LANGUAGE sql
VOLATILE
AS $$

$$;

CREATE OR REPLACE FUNCTION "public"."can_manage_purchases"() RETURNS void
LANGUAGE sql
VOLATILE
AS $$

$$;

CREATE OR REPLACE FUNCTION "public"."can_manage_rpa"() RETURNS void
LANGUAGE sql
VOLATILE
AS $$

$$;

CREATE OR REPLACE FUNCTION "public"."can_manage_sales"() RETURNS void
LANGUAGE sql
VOLATILE
AS $$

$$;

CREATE OR REPLACE FUNCTION "public"."can_manage_sales_sembako"() RETURNS void
LANGUAGE sql
VOLATILE
AS $$

$$;

CREATE OR REPLACE FUNCTION "public"."can_update_payments"() RETURNS void
LANGUAGE sql
VOLATILE
AS $$

$$;

CREATE OR REPLACE FUNCTION "public"."can_update_purchases"() RETURNS void
LANGUAGE sql
VOLATILE
AS $$

$$;

CREATE OR REPLACE FUNCTION "public"."can_update_sales"() RETURNS void
LANGUAGE sql
VOLATILE
AS $$

$$;

CREATE OR REPLACE FUNCTION "public"."can_write_notifications"() RETURNS void
LANGUAGE sql
VOLATILE
AS $$

$$;

CREATE OR REPLACE FUNCTION "public"."check_sembako_transaction_quota"() RETURNS void
LANGUAGE plpgsql
VOLATILE
AS $$

$$;

CREATE OR REPLACE FUNCTION "public"."create_new_business"() RETURNS void
LANGUAGE plpgsql
VOLATILE
AS $$

$$;

CREATE OR REPLACE FUNCTION "public"."deduct_batch_stock"() RETURNS void
LANGUAGE plpgsql
VOLATILE
AS $$

$$;

CREATE OR REPLACE FUNCTION "public"."deduct_egg_stock_on_sale"() RETURNS void
LANGUAGE plpgsql
VOLATILE
AS $$

$$;

CREATE OR REPLACE FUNCTION "public"."downgrade_expired_plans"() RETURNS void
LANGUAGE plpgsql
VOLATILE
AS $$

$$;

CREATE OR REPLACE FUNCTION "public"."enforce_payment_ceiling"() RETURNS void
LANGUAGE plpgsql
VOLATILE
AS $$

$$;

CREATE OR REPLACE FUNCTION "public"."enforce_rpa_invoice_quota"() RETURNS void
LANGUAGE plpgsql
VOLATILE
AS $$

$$;

CREATE OR REPLACE FUNCTION "public"."flag_market_price_outlier"() RETURNS void
LANGUAGE plpgsql
VOLATILE
AS $$

$$;

CREATE OR REPLACE FUNCTION "public"."generate_egg_invoice_number"() RETURNS void
LANGUAGE plpgsql
VOLATILE
AS $$

$$;

CREATE OR REPLACE FUNCTION "public"."generate_invoice_number"() RETURNS void
LANGUAGE plpgsql
VOLATILE
AS $$

$$;

CREATE OR REPLACE FUNCTION "public"."get_active_ternak_count"() RETURNS void
LANGUAGE plpgsql
VOLATILE
AS $$

$$;

CREATE OR REPLACE FUNCTION "public"."get_business_category"() RETURNS void
LANGUAGE sql
VOLATILE
AS $$

$$;

CREATE OR REPLACE FUNCTION "public"."get_invitation_by_token"() RETURNS void
LANGUAGE sql
VOLATILE
AS $$

$$;

CREATE OR REPLACE FUNCTION "public"."get_kandang_limit"() RETURNS void
LANGUAGE sql
VOLATILE
AS $$

$$;

CREATE OR REPLACE FUNCTION "public"."get_my_tenant_id"() RETURNS void
LANGUAGE plpgsql
VOLATILE
AS $$

$$;

CREATE OR REPLACE FUNCTION "public"."get_my_tenant_ids"() RETURNS void
LANGUAGE sql
VOLATILE
AS $$

$$;

CREATE OR REPLACE FUNCTION "public"."get_province_price_trends"() RETURNS void
LANGUAGE sql
VOLATILE
AS $$

$$;

CREATE OR REPLACE FUNCTION "public"."get_public_market_stats"() RETURNS void
LANGUAGE plpgsql
VOLATILE
AS $$

$$;

CREATE OR REPLACE FUNCTION "public"."get_ternak_limit"() RETURNS void
LANGUAGE plpgsql
VOLATILE
AS $$

$$;

CREATE OR REPLACE FUNCTION "public"."get_user_type_from_vertical"() RETURNS void
LANGUAGE sql
VOLATILE
AS $$

$$;

CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS void
LANGUAGE plpgsql
VOLATILE
AS $$

$$;

CREATE OR REPLACE FUNCTION "public"."handle_user_email_update"() RETURNS void
LANGUAGE plpgsql
VOLATILE
AS $$

$$;

CREATE OR REPLACE FUNCTION "public"."has_tenant_access"() RETURNS void
LANGUAGE sql
VOLATILE
AS $$

$$;

CREATE OR REPLACE FUNCTION "public"."increment_sapi_batch_animal_count"() RETURNS void
LANGUAGE plpgsql
VOLATILE
AS $$

$$;

CREATE OR REPLACE FUNCTION "public"."is_my_tenant"() RETURNS void
LANGUAGE plpgsql
VOLATILE
AS $$

$$;

CREATE OR REPLACE FUNCTION "public"."is_superadmin"() RETURNS void
LANGUAGE sql
VOLATILE
AS $$

$$;

CREATE OR REPLACE FUNCTION "public"."is_tenant_member"() RETURNS void
LANGUAGE sql
VOLATILE
AS $$

$$;

CREATE OR REPLACE FUNCTION "public"."log_audit_action"() RETURNS void
LANGUAGE plpgsql
VOLATILE
AS $$

$$;

CREATE OR REPLACE FUNCTION "public"."my_profile_id"() RETURNS void
LANGUAGE sql
VOLATILE
AS $$

$$;

CREATE OR REPLACE FUNCTION "public"."my_role"() RETURNS void
LANGUAGE sql
VOLATILE
AS $$

$$;

CREATE OR REPLACE FUNCTION "public"."my_role_for"() RETURNS void
LANGUAGE sql
VOLATILE
AS $$

$$;

CREATE OR REPLACE FUNCTION "public"."my_tenant_id"() RETURNS void
LANGUAGE sql
VOLATILE
AS $$

$$;

CREATE OR REPLACE FUNCTION "public"."my_user_type"() RETURNS void
LANGUAGE sql
VOLATILE
AS $$

$$;

CREATE OR REPLACE FUNCTION "public"."prevent_app_role_escalation"() RETURNS void
LANGUAGE plpgsql
VOLATILE
AS $$

$$;

CREATE OR REPLACE FUNCTION "public"."prevent_profile_privilege_escalation"() RETURNS void
LANGUAGE plpgsql
VOLATILE
AS $$

$$;

CREATE OR REPLACE FUNCTION "public"."recalc_sembako_customer_balance"() RETURNS void
LANGUAGE plpgsql
VOLATILE
AS $$

$$;

CREATE OR REPLACE FUNCTION "public"."recalculate_payment_status"() RETURNS void
LANGUAGE plpgsql
VOLATILE
AS $$

$$;

CREATE OR REPLACE FUNCTION "public"."record_market_price"() RETURNS void
LANGUAGE plpgsql
VOLATILE
AS $$

$$;

CREATE OR REPLACE FUNCTION "public"."rpa_tenant_in_trial"() RETURNS void
LANGUAGE sql
VOLATILE
AS $$

$$;

CREATE OR REPLACE FUNCTION "public"."set_updated_at"() RETURNS void
LANGUAGE plpgsql
VOLATILE
AS $$

$$;

CREATE OR REPLACE FUNCTION "public"."sync_rpa_customer_outstanding"() RETURNS void
LANGUAGE plpgsql
VOLATILE
AS $$

$$;

CREATE OR REPLACE FUNCTION "public"."sync_rpa_outstanding"() RETURNS void
LANGUAGE plpgsql
VOLATILE
AS $$

$$;

CREATE OR REPLACE FUNCTION "public"."sync_sale_payment"() RETURNS void
LANGUAGE plpgsql
VOLATILE
AS $$

$$;

CREATE OR REPLACE FUNCTION "public"."sync_sembako_customer_outstanding"() RETURNS void
LANGUAGE plpgsql
VOLATILE
AS $$

$$;

CREATE OR REPLACE FUNCTION "public"."tr_sync_sembako_balance"() RETURNS void
LANGUAGE plpgsql
VOLATILE
AS $$

$$;

CREATE OR REPLACE FUNCTION "public"."trg_peternak_generate_task_instances"() RETURNS void
LANGUAGE plpgsql
VOLATILE
AS $$

$$;

CREATE OR REPLACE FUNCTION "public"."trg_purchases_sync_market_price"() RETURNS void
LANGUAGE plpgsql
VOLATILE
AS $$

$$;

CREATE OR REPLACE FUNCTION "public"."trg_sales_sync_market_price"() RETURNS void
LANGUAGE plpgsql
VOLATILE
AS $$

$$;

CREATE OR REPLACE FUNCTION "public"."trg_sales_sync_rpa_outstanding"() RETURNS void
LANGUAGE plpgsql
VOLATILE
AS $$

$$;

CREATE OR REPLACE FUNCTION "public"."trg_sapi_breeding_birth_mating"() RETURNS void
LANGUAGE plpgsql
VOLATILE
AS $$

$$;

CREATE OR REPLACE FUNCTION "public"."trg_sapi_breeding_health_mark_dead"() RETURNS void
LANGUAGE plpgsql
VOLATILE
AS $$

$$;

CREATE OR REPLACE FUNCTION "public"."trg_sapi_breeding_mating_defaults"() RETURNS void
LANGUAGE plpgsql
VOLATILE
AS $$

$$;

CREATE OR REPLACE FUNCTION "public"."trg_sapi_breeding_sale_mark_sold"() RETURNS void
LANGUAGE plpgsql
VOLATILE
AS $$

$$;

CREATE OR REPLACE FUNCTION "public"."trg_sapi_breeding_weight_sync"() RETURNS void
LANGUAGE plpgsql
VOLATILE
AS $$

$$;

CREATE OR REPLACE FUNCTION "public"."trg_sapi_sync_animal_latest_weight"() RETURNS void
LANGUAGE plpgsql
VOLATILE
AS $$

$$;

CREATE OR REPLACE FUNCTION "public"."trg_sapi_sync_batch_mortality"() RETURNS void
LANGUAGE plpgsql
VOLATILE
AS $$

$$;

CREATE OR REPLACE FUNCTION "public"."update_ai_conversations_updated_at"() RETURNS void
LANGUAGE plpgsql
VOLATILE
AS $$

$$;

CREATE OR REPLACE FUNCTION "public"."update_ai_pending_entries_updated_at"() RETURNS void
LANGUAGE plpgsql
VOLATILE
AS $$

$$;

CREATE OR REPLACE FUNCTION "public"."update_cycle_summary"() RETURNS void
LANGUAGE plpgsql
VOLATILE
AS $$

$$;

CREATE OR REPLACE FUNCTION "public"."update_egg_customer_stats"() RETURNS void
LANGUAGE plpgsql
VOLATILE
AS $$

$$;

CREATE OR REPLACE FUNCTION "public"."update_farm_last_transaction"() RETURNS void
LANGUAGE plpgsql
VOLATILE
AS $$

$$;

CREATE OR REPLACE FUNCTION "public"."update_sembako_product_stock"() RETURNS void
LANGUAGE plpgsql
VOLATILE
AS $$

$$;

CREATE OR REPLACE FUNCTION "realtime"."apply_rls"() RETURNS void
LANGUAGE plpgsql
VOLATILE
AS $$

$$;

CREATE OR REPLACE FUNCTION "realtime"."broadcast_changes"() RETURNS void
LANGUAGE plpgsql
VOLATILE
AS $$

$$;

CREATE OR REPLACE FUNCTION "realtime"."build_prepared_statement_sql"() RETURNS void
LANGUAGE sql
VOLATILE
AS $$

$$;

CREATE OR REPLACE FUNCTION "realtime"."cast"() RETURNS void
LANGUAGE plpgsql
VOLATILE
AS $$

$$;

CREATE OR REPLACE FUNCTION "realtime"."check_equality_op"() RETURNS void
LANGUAGE plpgsql
VOLATILE
AS $$

$$;

CREATE OR REPLACE FUNCTION "realtime"."is_visible_through_filters"() RETURNS void
LANGUAGE sql
VOLATILE
AS $$

$$;

CREATE OR REPLACE FUNCTION "realtime"."list_changes"() RETURNS void
LANGUAGE sql
VOLATILE
AS $$

$$;

CREATE OR REPLACE FUNCTION "realtime"."quote_wal2json"() RETURNS void
LANGUAGE sql
VOLATILE
AS $$

$$;

CREATE OR REPLACE FUNCTION "realtime"."send"() RETURNS void
LANGUAGE plpgsql
VOLATILE
AS $$

$$;

CREATE OR REPLACE FUNCTION "realtime"."subscription_check_filters"() RETURNS void
LANGUAGE plpgsql
VOLATILE
AS $$

$$;

CREATE OR REPLACE FUNCTION "realtime"."to_regrole"() RETURNS void
LANGUAGE sql
VOLATILE
AS $$

$$;

CREATE OR REPLACE FUNCTION "realtime"."topic"() RETURNS void
LANGUAGE sql
VOLATILE
AS $$

$$;

CREATE OR REPLACE FUNCTION "storage"."allow_any_operation"() RETURNS void
LANGUAGE sql
VOLATILE
AS $$

$$;

CREATE OR REPLACE FUNCTION "storage"."allow_only_operation"() RETURNS void
LANGUAGE sql
VOLATILE
AS $$

$$;

CREATE OR REPLACE FUNCTION "storage"."can_insert_object"() RETURNS void
LANGUAGE plpgsql
VOLATILE
AS $$

$$;

CREATE OR REPLACE FUNCTION "storage"."enforce_bucket_name_length"() RETURNS void
LANGUAGE plpgsql
VOLATILE
AS $$

$$;

CREATE OR REPLACE FUNCTION "storage"."extension"() RETURNS void
LANGUAGE plpgsql
VOLATILE
AS $$

$$;

CREATE OR REPLACE FUNCTION "storage"."filename"() RETURNS void
LANGUAGE plpgsql
VOLATILE
AS $$

$$;

CREATE OR REPLACE FUNCTION "storage"."foldername"() RETURNS void
LANGUAGE plpgsql
VOLATILE
AS $$

$$;

CREATE OR REPLACE FUNCTION "storage"."get_common_prefix"() RETURNS void
LANGUAGE sql
VOLATILE
AS $$

$$;

CREATE OR REPLACE FUNCTION "storage"."get_size_by_bucket"() RETURNS void
LANGUAGE plpgsql
VOLATILE
AS $$

$$;

CREATE OR REPLACE FUNCTION "storage"."list_multipart_uploads_with_delimiter"() RETURNS void
LANGUAGE plpgsql
VOLATILE
AS $$

$$;

CREATE OR REPLACE FUNCTION "storage"."list_objects_with_delimiter"() RETURNS void
LANGUAGE plpgsql
VOLATILE
AS $$

$$;

CREATE OR REPLACE FUNCTION "storage"."operation"() RETURNS void
LANGUAGE plpgsql
VOLATILE
AS $$

$$;

CREATE OR REPLACE FUNCTION "storage"."protect_delete"() RETURNS void
LANGUAGE plpgsql
VOLATILE
AS $$

$$;

CREATE OR REPLACE FUNCTION "storage"."search"() RETURNS void
LANGUAGE plpgsql
VOLATILE
AS $$

$$;

CREATE OR REPLACE FUNCTION "storage"."search_by_timestamp"() RETURNS void
LANGUAGE plpgsql
VOLATILE
AS $$

$$;

CREATE OR REPLACE FUNCTION "storage"."search_v2"() RETURNS void
LANGUAGE plpgsql
VOLATILE
AS $$

$$;

CREATE OR REPLACE FUNCTION "storage"."update_updated_at_column"() RETURNS void
LANGUAGE plpgsql
VOLATILE
AS $$

$$;

CREATE OR REPLACE FUNCTION "vault"."_crypto_aead_det_decrypt"() RETURNS void
LANGUAGE c
VOLATILE
AS $$

$$;

CREATE OR REPLACE FUNCTION "vault"."_crypto_aead_det_encrypt"() RETURNS void
LANGUAGE c
VOLATILE
AS $$

$$;

CREATE OR REPLACE FUNCTION "vault"."_crypto_aead_det_noncegen"() RETURNS void
LANGUAGE c
VOLATILE
AS $$

$$;

CREATE OR REPLACE FUNCTION "vault"."create_secret"() RETURNS void
LANGUAGE plpgsql
VOLATILE
AS $$

$$;

CREATE OR REPLACE FUNCTION "vault"."update_secret"() RETURNS void
LANGUAGE plpgsql
VOLATILE
AS $$

$$;


