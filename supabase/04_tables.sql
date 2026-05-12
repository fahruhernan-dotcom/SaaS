-- 04_tables.sql
-- Source: Supabase TABLE COLUMNS.txt
-- Last sync: (Current)
-- DO NOT EDIT MANUALLY

CREATE TABLE IF NOT EXISTS "public"."ai_anomaly_logs" (
"id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL,
  "staged_transaction_id" uuid,
  "field_name" text,
  "anomaly_reason" text,
  "severity" text,
  "detected_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "public"."ai_conversations" (
"id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL,
  "profile_id" uuid NOT NULL,
  "messages" jsonb[] NOT NULL DEFAULT '{}'::jsonb[],
  "user_type" text NOT NULL,
  "context_page" text,
  "context_snapshot" jsonb,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now(),
  "metadata" jsonb DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS "public"."ai_error_logs" (
"id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" uuid,
  "profile_id" uuid,
  "error_msg" text NOT NULL,
  "provider" text,
  "user_message" text,
  "context_page" text,
  "created_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "public"."ai_feedback" (
"id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "pending_entry_id" uuid NOT NULL,
  "tenant_id" uuid NOT NULL,
  "profile_id" uuid NOT NULL,
  "rating" smallint NOT NULL,
  "correction_notes" text,
  "corrected_data" jsonb,
  "created_at" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "public"."ai_pending_entries" (
"id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "conversation_id" uuid NOT NULL,
  "tenant_id" uuid NOT NULL,
  "profile_id" uuid NOT NULL,
  "intent" text NOT NULL,
  "extracted_data" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "target_table" text,
  "status" text NOT NULL DEFAULT 'pending'::text,
  "confidence" numeric NOT NULL DEFAULT 1.0,
  "clarification_needed" text,
  "raw_ai_response" jsonb,
  "inserted_record_id" uuid,
  "error_message" text,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "public"."ai_staged_transactions" (
"id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "pending_entry_id" uuid,
  "tenant_id" uuid NOT NULL,
  "profile_id" uuid NOT NULL,
  "target_table" text NOT NULL,
  "intent" text NOT NULL,
  "payload" jsonb NOT NULL,
  "original_data" jsonb,
  "is_edited" boolean DEFAULT false,
  "status" text DEFAULT 'staged'::text,
  "error_message" text,
  "staged_at" timestamp with time zone DEFAULT now(),
  "committed_at" timestamp with time zone,
  "production_id" uuid,
  "created_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "public"."breeding_cycles" (
"id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL,
  "peternak_farm_id" uuid NOT NULL,
  "cycle_number" integer NOT NULL,
  "chicken_type" text NOT NULL DEFAULT 'broiler'::text,
  "doc_count" integer NOT NULL,
  "doc_price" integer,
  "start_date" date NOT NULL,
  "target_harvest_date" date,
  "actual_harvest_date" date,
  "target_weight_kg" numeric DEFAULT 1.9,
  "target_fcr" numeric DEFAULT 1.7,
  "status" text NOT NULL DEFAULT 'active'::text,
  "total_feed_kg" numeric DEFAULT 0,
  "total_mortality" integer DEFAULT 0,
  "final_count" integer,
  "final_avg_weight_kg" numeric,
  "final_fcr" numeric,
  "final_ip_score" numeric,
  "total_production_cost" bigint DEFAULT 0,
  "cost_per_kg" integer,
  "notes" text,
  "is_deleted" boolean NOT NULL DEFAULT false,
  "created_at" timestamp with time zone DEFAULT now(),
  "updated_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "public"."broker_connections" (
"id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "status" text NOT NULL DEFAULT 'pending'::text,
  "connected_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now(),
  "requester_tenant_id" uuid NOT NULL,
  "requester_type" text,
  "target_tenant_id" uuid NOT NULL,
  "target_type" text,
  "message" text,
  "rejected_reason" text,
  "requested_at" timestamp with time zone DEFAULT now(),
  "responded_at" timestamp with time zone,
  "updated_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "public"."broker_employees" (
"id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL,
  "full_name" text NOT NULL,
  "role" text NOT NULL DEFAULT 'staff'::text,
  "phone" text,
  "salary_type" text DEFAULT 'bulanan'::text,
  "salary_amount" numeric DEFAULT 0,
  "status" text DEFAULT 'aktif'::text,
  "start_date" date,
  "notes" text,
  "is_deleted" boolean DEFAULT false,
  "created_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "public"."broker_profiles" (
"id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL,
  "chicken_types" text[] DEFAULT '{}'::text[],
  "egg_types" text[] DEFAULT '{}'::text[],
  "area_operasi" text,
  "target_volume_monthly" integer DEFAULT 0,
  "mitra_peternak_count" integer DEFAULT 0,
  "kapasitas_harian_butir" integer DEFAULT 0,
  "catatan" text,
  "created_at" timestamp with time zone DEFAULT now(),
  "updated_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "public"."chicken_batches" (
"id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL,
  "farm_id" uuid NOT NULL,
  "batch_code" text,
  "chicken_type" text NOT NULL DEFAULT 'broiler'::text,
  "initial_count" integer NOT NULL,
  "current_count" integer NOT NULL,
  "avg_weight_kg" numeric,
  "age_days" integer,
  "estimated_harvest_date" date,
  "status" text NOT NULL DEFAULT 'growing'::text,
  "quality_notes" text,
  "is_deleted" boolean NOT NULL DEFAULT false,
  "created_at" timestamp with time zone DEFAULT now(),
  "updated_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "public"."cycle_expenses" (
"id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL,
  "cycle_id" uuid NOT NULL,
  "expense_type" text NOT NULL,
  "description" text,
  "qty" numeric,
  "unit" text,
  "unit_price" integer,
  "total_amount" bigint NOT NULL,
  "expense_date" date NOT NULL,
  "supplier" text,
  "is_deleted" boolean DEFAULT false
);

CREATE TABLE IF NOT EXISTS "public"."daily_records" (
"id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL,
  "cycle_id" uuid NOT NULL,
  "record_date" date NOT NULL,
  "age_days" integer NOT NULL,
  "mortality_count" integer NOT NULL DEFAULT 0,
  "cull_count" integer NOT NULL DEFAULT 0,
  "feed_type" text,
  "feed_kg" numeric NOT NULL DEFAULT 0,
  "sample_count" integer,
  "sample_weight_kg" numeric,
  "avg_weight_kg" numeric,
  "temperature_morning" numeric,
  "temperature_evening" numeric,
  "health_notes" text,
  "notes" text,
  "created_at" timestamp with time zone DEFAULT now(),
  "water_liter" numeric,
  "litter_condition" text,
  "ammonia_level" text
);

CREATE TABLE IF NOT EXISTS "public"."deliveries" (
"id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL,
  "sale_id" uuid NOT NULL,
  "vehicle_type" text,
  "vehicle_plate" text,
  "driver_name" text,
  "driver_phone" text,
  "load_time" timestamp with time zone,
  "departure_time" timestamp with time zone,
  "arrival_time" timestamp with time zone,
  "initial_count" integer NOT NULL,
  "arrived_count" integer,
  "mortality_count" integer NOT NULL DEFAULT 0,
  "initial_weight_kg" numeric,
  "arrived_weight_kg" numeric,
  "shrinkage_kg" numeric,
  "delivery_cost" integer NOT NULL DEFAULT 0,
  "status" text NOT NULL DEFAULT 'preparing'::text,
  "notes" text,
  "is_deleted" boolean NOT NULL DEFAULT false,
  "created_at" timestamp with time zone DEFAULT now(),
  "updated_at" timestamp with time zone DEFAULT now(),
  "vehicle_id" uuid,
  "driver_id" uuid,
  "driver_wage" numeric DEFAULT 0,
  "include_driver_wage" boolean DEFAULT true,
  "include_fuel_cost" boolean DEFAULT true
);

CREATE TABLE IF NOT EXISTS "public"."discount_codes" (
"id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "code" text NOT NULL,
  "discount_type" text NOT NULL,
  "discount_value" integer NOT NULL DEFAULT 0,
  "applies_to_plan" text DEFAULT 'all'::text,
  "applies_to_role" text DEFAULT 'all'::text,
  "expires_at" timestamp with time zone,
  "max_usage" integer,
  "usage_count" integer DEFAULT 0,
  "is_active" boolean DEFAULT true,
  "created_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "public"."domba_breeding_animals" (
"id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL,
  "ear_tag" text NOT NULL,
  "name" text,
  "breed" text,
  "sex" text NOT NULL DEFAULT 'betina'::text,
  "birth_date" date,
  "entry_date" date DEFAULT CURRENT_DATE,
  "entry_weight_kg" numeric,
  "dam_id" uuid,
  "sire_id" uuid,
  "generation" integer DEFAULT 0,
  "status" text DEFAULT 'aktif'::text,
  "notes" text,
  "is_deleted" boolean DEFAULT false,
  "created_at" timestamp with time zone DEFAULT now(),
  "updated_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "public"."domba_breeding_births" (
"id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL,
  "dam_id" uuid NOT NULL,
  "mating_id" uuid,
  "partus_date" date NOT NULL,
  "born_alive" integer DEFAULT 0,
  "born_dead" integer DEFAULT 0,
  "birth_type" text,
  "birth_ease" text DEFAULT 'normal'::text,
  "kids_detail" jsonb DEFAULT '[]'::jsonb,
  "notes" text,
  "is_deleted" boolean DEFAULT false,
  "created_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "public"."domba_breeding_feed_logs" (
"id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL,
  "log_date" date NOT NULL DEFAULT CURRENT_DATE,
  "hijauan_kg" numeric DEFAULT 0,
  "konsentrat_kg" numeric DEFAULT 0,
  "dedak_kg" numeric DEFAULT 0,
  "other_feed_kg" numeric DEFAULT 0,
  "feed_cost_idr" numeric,
  "animal_count" integer,
  "notes" text,
  "is_deleted" boolean DEFAULT false,
  "created_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "public"."domba_breeding_health_logs" (
"id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL,
  "animal_id" uuid,
  "log_date" date NOT NULL DEFAULT CURRENT_DATE,
  "log_type" text NOT NULL DEFAULT 'pemeriksaan'::text,
  "symptoms" text,
  "diagnosis" text,
  "treatment" text,
  "medicine_name" text,
  "medicine_dose" text,
  "handled_by" text,
  "outcome" text,
  "notes" text,
  "is_deleted" boolean DEFAULT false,
  "created_at" timestamp with time zone DEFAULT now(),
  "treatment_cost_idr" numeric DEFAULT 0
);

CREATE TABLE IF NOT EXISTS "public"."domba_breeding_mating_records" (
"id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL,
  "dam_id" uuid NOT NULL,
  "sire_id" uuid,
  "mating_date" date NOT NULL,
  "mating_type" text DEFAULT 'kawin_alam'::text,
  "inseminator" text,
  "straw_code" text,
  "expected_partus" date,
  "result" text DEFAULT 'menunggu'::text,
  "pregnancy_check_date" date,
  "notes" text,
  "is_deleted" boolean DEFAULT false,
  "created_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "public"."domba_breeding_sales" (
"id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL,
  "animal_id" uuid NOT NULL,
  "sale_date" date NOT NULL DEFAULT CURRENT_DATE,
  "buyer_name" text,
  "sale_type" text DEFAULT 'bibit'::text,
  "price_idr" numeric,
  "weight_kg" numeric,
  "age_days" integer,
  "notes" text,
  "is_deleted" boolean DEFAULT false,
  "created_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "public"."domba_breeding_weight_records" (
"id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL,
  "animal_id" uuid NOT NULL,
  "weigh_date" date NOT NULL DEFAULT CURRENT_DATE,
  "weight_kg" numeric NOT NULL,
  "bcs" text,
  "age_days" integer,
  "adg_since_last" numeric,
  "notes" text,
  "is_deleted" boolean DEFAULT false,
  "created_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "public"."domba_kandangs" (
"id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL,
  "batch_id" uuid,
  "name" text NOT NULL,
  "capacity" integer DEFAULT 0,
  "panjang_m" numeric,
  "lebar_m" numeric,
  "is_holding" boolean DEFAULT false,
  "is_active" boolean DEFAULT true,
  "notes" text,
  "created_at" timestamp with time zone DEFAULT now(),
  "updated_at" timestamp with time zone DEFAULT now(),
  "grid_x" integer,
  "grid_y" integer
);

CREATE TABLE IF NOT EXISTS "public"."domba_penggemukan_animals" (
"id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL,
  "batch_id" uuid,
  "ear_tag" text NOT NULL,
  "breed" text,
  "sex" text DEFAULT 'jantan'::text,
  "age_estimate" text,
  "entry_date" date NOT NULL DEFAULT CURRENT_DATE,
  "entry_weight_kg" numeric,
  "entry_bcs" text,
  "entry_condition" text DEFAULT 'sehat'::text,
  "purchase_price_idr" numeric,
  "source" text,
  "kandang_slot" text,
  "kandang_id" uuid,
  "quarantine_start" date,
  "quarantine_end" date,
  "quarantine_notes" text,
  "status" text NOT NULL DEFAULT 'active'::text,
  "exit_date" date,
  "latest_weight_kg" numeric,
  "latest_weight_date" date,
  "notes" text,
  "is_deleted" boolean DEFAULT false,
  "created_at" timestamp with time zone DEFAULT now(),
  "updated_at" timestamp with time zone DEFAULT now(),
  "entry_age_months" integer
);

CREATE TABLE IF NOT EXISTS "public"."domba_penggemukan_batches" (
"id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL,
  "batch_code" text NOT NULL,
  "kandang_name" text,
  "start_date" date NOT NULL DEFAULT CURRENT_DATE,
  "target_end_date" date,
  "status" text NOT NULL DEFAULT 'active'::text,
  "total_animals" integer DEFAULT 0,
  "mortality_count" integer DEFAULT 0,
  "notes" text,
  "end_date" date,
  "avg_adg_gram" numeric,
  "avg_fcr" numeric,
  "avg_entry_weight_kg" numeric,
  "avg_exit_weight_kg" numeric,
  "total_feed_cost_idr" numeric,
  "total_revenue_idr" numeric,
  "total_cogs_idr" numeric,
  "net_profit_idr" numeric,
  "rc_ratio" numeric,
  "alive_count" integer,
  "sold_count" integer,
  "is_deleted" boolean DEFAULT false,
  "created_at" timestamp with time zone DEFAULT now(),
  "updated_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "public"."domba_penggemukan_feed_logs" (
"id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL,
  "batch_id" uuid NOT NULL,
  "log_date" date NOT NULL DEFAULT CURRENT_DATE,
  "kandang_name" text,
  "animal_count" integer,
  "hijauan_kg" numeric DEFAULT 0,
  "konsentrat_kg" numeric DEFAULT 0,
  "dedak_kg" numeric DEFAULT 0,
  "other_feed_kg" numeric DEFAULT 0,
  "sisa_pakan_kg" numeric DEFAULT 0,
  "feed_cost_idr" numeric,
  "notes" text,
  "is_deleted" boolean DEFAULT false,
  "created_at" timestamp with time zone DEFAULT now(),
  "feed_orts_category" text
);

CREATE TABLE IF NOT EXISTS "public"."domba_penggemukan_health_logs" (
"id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL,
  "animal_id" uuid,
  "batch_id" uuid,
  "log_date" date NOT NULL DEFAULT CURRENT_DATE,
  "log_type" text NOT NULL DEFAULT 'pemeriksaan'::text,
  "symptoms" text,
  "action_taken" text,
  "medicine_name" text,
  "medicine_dose" text,
  "handled_by" text,
  "outcome" text,
  "vaccine_name" text,
  "vaccine_next_due" date,
  "death_cause" text,
  "death_weight_kg" numeric,
  "loss_value_idr" numeric,
  "notes" text,
  "is_deleted" boolean DEFAULT false,
  "created_at" timestamp with time zone DEFAULT now(),
  "treatment_cost_idr" numeric DEFAULT 0
);

CREATE TABLE IF NOT EXISTS "public"."domba_penggemukan_operational_costs" (
"id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL,
  "batch_id" uuid,
  "log_date" date NOT NULL DEFAULT CURRENT_DATE,
  "item_name" text NOT NULL,
  "category" text NOT NULL DEFAULT 'lainnya'::text,
  "amount_idr" numeric NOT NULL DEFAULT 0,
  "quantity" numeric DEFAULT 0,
  "unit" text,
  "notes" text,
  "is_deleted" boolean DEFAULT false,
  "created_at" timestamp with time zone DEFAULT now(),
  "updated_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "public"."domba_penggemukan_sales" (
"id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL,
  "batch_id" uuid NOT NULL,
  "sale_date" date NOT NULL DEFAULT CURRENT_DATE,
  "buyer_name" text,
  "buyer_type" text,
  "buyer_contact" text,
  "animal_ids" text[],
  "animal_count" integer,
  "total_weight_kg" numeric,
  "avg_weight_kg" numeric,
  "price_type" text,
  "price_amount" numeric,
  "total_revenue_idr" numeric,
  "payment_method" text,
  "is_paid" boolean DEFAULT false,
  "paid_date" date,
  "has_skkh" boolean DEFAULT false,
  "has_surat_jalan" boolean DEFAULT false,
  "invoice_number" text,
  "notes" text,
  "is_deleted" boolean DEFAULT false,
  "created_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "public"."domba_penggemukan_weight_records" (
"id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL,
  "animal_id" uuid NOT NULL,
  "batch_id" uuid,
  "weigh_date" date NOT NULL DEFAULT CURRENT_DATE,
  "weight_kg" numeric NOT NULL,
  "bcs" text,
  "days_in_farm" integer,
  "adg_since_last" numeric,
  "notes" text,
  "is_deleted" boolean DEFAULT false,
  "created_at" timestamp with time zone DEFAULT now(),
  "famacha_score" integer
);

CREATE TABLE IF NOT EXISTS "public"."drivers" (
"id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL,
  "full_name" text NOT NULL,
  "phone" text NOT NULL,
  "sim_number" text,
  "sim_type" text DEFAULT 'B1'::text,
  "sim_expires_at" date,
  "status" text NOT NULL DEFAULT 'aktif'::text,
  "wage_per_trip" integer DEFAULT 0,
  "address" text,
  "notes" text,
  "is_deleted" boolean NOT NULL DEFAULT false,
  "created_at" timestamp with time zone DEFAULT now(),
  "updated_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "public"."egg_customers" (
"id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL,
  "name" text NOT NULL,
  "phone" text,
  "address" text,
  "total_spent" bigint NOT NULL DEFAULT 0,
  "total_orders" integer NOT NULL DEFAULT 0,
  "notes" text,
  "is_deleted" boolean NOT NULL DEFAULT false,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "public"."egg_inventory" (
"id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL,
  "product_name" text NOT NULL,
  "egg_grade" text NOT NULL DEFAULT 'standard'::text,
  "current_stock_butir" integer NOT NULL DEFAULT 0,
  "cost_per_egg" integer NOT NULL DEFAULT 0,
  "packaging_cost" integer NOT NULL DEFAULT 0,
  "eggs_per_pack" integer NOT NULL DEFAULT 10,
  "sell_price_per_pack" integer NOT NULL DEFAULT 0,
  "low_stock_threshold" integer NOT NULL DEFAULT 20,
  "notes" text,
  "is_deleted" boolean NOT NULL DEFAULT false,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now(),
  "cost_per_pack" integer
);

CREATE TABLE IF NOT EXISTS "public"."egg_sale_items" (
"id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "sale_id" uuid NOT NULL,
  "inventory_id" uuid NOT NULL,
  "qty_pack" integer NOT NULL DEFAULT 1,
  "price_per_pack" integer NOT NULL DEFAULT 0,
  "cost_per_pack" integer NOT NULL DEFAULT 0,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "subtotal" bigint
);

CREATE TABLE IF NOT EXISTS "public"."egg_sales" (
"id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL,
  "customer_id" uuid,
  "invoice_number" text NOT NULL,
  "customer_name" text NOT NULL,
  "customer_phone" text,
  "total_price" bigint NOT NULL DEFAULT 0,
  "total_cost" bigint NOT NULL DEFAULT 0,
  "payment_status" text NOT NULL DEFAULT 'pending'::text,
  "payment_method" text,
  "fulfillment_status" text NOT NULL DEFAULT 'processing'::text,
  "transaction_date" date NOT NULL DEFAULT CURRENT_DATE,
  "due_date" date,
  "notes" text,
  "is_deleted" boolean NOT NULL DEFAULT false,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now(),
  "net_profit" bigint
);

CREATE TABLE IF NOT EXISTS "public"."egg_stock_logs" (
"id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL,
  "inventory_id" uuid NOT NULL,
  "sale_id" uuid,
  "supplier_id" uuid,
  "log_type" text NOT NULL,
  "qty_butir" integer NOT NULL,
  "unit_price" integer,
  "notes" text,
  "created_by" uuid,
  "created_at" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "public"."egg_suppliers" (
"id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL,
  "name" text NOT NULL,
  "phone" text,
  "address" text,
  "is_deleted" boolean NOT NULL DEFAULT false,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "public"."extra_expenses" (
"id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL,
  "category" text NOT NULL,
  "description" text NOT NULL,
  "amount" bigint NOT NULL,
  "expense_date" date NOT NULL DEFAULT CURRENT_DATE,
  "notes" text,
  "is_deleted" boolean NOT NULL DEFAULT false,
  "created_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "public"."farms" (
"id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL,
  "farm_name" text NOT NULL,
  "owner_name" text NOT NULL,
  "phone" text,
  "location" text,
  "address" text,
  "latitude" numeric,
  "longitude" numeric,
  "chicken_type" text NOT NULL DEFAULT 'broiler'::text,
  "capacity" integer,
  "available_stock" integer NOT NULL DEFAULT 0,
  "avg_weight_kg" numeric,
  "harvest_date" date,
  "status" text NOT NULL DEFAULT 'empty'::text,
  "quality_rating" smallint,
  "quality_notes" text,
  "last_transaction_date" date,
  "notes" text,
  "is_deleted" boolean NOT NULL DEFAULT false,
  "created_at" timestamp with time zone DEFAULT now(),
  "updated_at" timestamp with time zone DEFAULT now(),
  "province" text
);

CREATE TABLE IF NOT EXISTS "public"."feed_stocks" (
"id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL,
  "peternak_farm_id" uuid NOT NULL,
  "feed_type" text NOT NULL,
  "quantity_kg" numeric NOT NULL DEFAULT 0,
  "price_per_kg" integer,
  "purchase_date" date,
  "supplier" text,
  "notes" text,
  "created_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "public"."generated_invoices" (
"id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL,
  "invoice_type" text NOT NULL,
  "reference_id" uuid NOT NULL,
  "invoice_number" text NOT NULL,
  "recipient_name" text,
  "total_amount" bigint DEFAULT 0,
  "status" text DEFAULT 'draft'::text,
  "pdf_url" text,
  "metadata" jsonb,
  "created_at" timestamp with time zone DEFAULT now(),
  "created_by" uuid
);

CREATE TABLE IF NOT EXISTS "public"."global_audit_logs" (
"id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "actor_profile_id" uuid,
  "tenant_id" uuid,
  "action" text NOT NULL,
  "entity_type" text NOT NULL,
  "entity_id" uuid,
  "old_data" jsonb,
  "new_data" jsonb,
  "ip_address" text,
  "user_agent" text,
  "created_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "public"."harvest_records" (
"id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL,
  "cycle_id" uuid NOT NULL,
  "harvest_date" date NOT NULL,
  "buyer_type" text,
  "buyer_name" text,
  "mitra_company" text,
  "contract_price_per_kg" integer,
  "total_ekor_panen" integer NOT NULL,
  "total_weight_kg" numeric NOT NULL,
  "avg_weight_kg" numeric,
  "price_per_kg" integer,
  "total_revenue" bigint,
  "deduction_sapronak" bigint DEFAULT 0,
  "net_revenue" bigint,
  "notes" text,
  "is_deleted" boolean DEFAULT false
);

CREATE TABLE IF NOT EXISTS "public"."invite_rate_limits" (
"id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "ip_address" text NOT NULL,
  "attempt_count" integer DEFAULT 1,
  "first_attempt_at" timestamp with time zone DEFAULT now(),
  "locked_until" timestamp with time zone,
  "last_attempt_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "public"."kambing_breeding_animals" (
"id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL,
  "ear_tag" text NOT NULL,
  "name" text,
  "breed" text,
  "sex" text NOT NULL DEFAULT 'betina'::text,
  "birth_date" date,
  "entry_date" date DEFAULT CURRENT_DATE,
  "entry_weight_kg" numeric,
  "dam_id" uuid,
  "sire_id" uuid,
  "generation" integer DEFAULT 0,
  "status" text DEFAULT 'aktif'::text,
  "notes" text,
  "is_deleted" boolean DEFAULT false,
  "created_at" timestamp with time zone DEFAULT now(),
  "updated_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "public"."kambing_breeding_births" (
"id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL,
  "dam_id" uuid NOT NULL,
  "mating_id" uuid,
  "partus_date" date NOT NULL,
  "born_alive" integer DEFAULT 0,
  "born_dead" integer DEFAULT 0,
  "birth_type" text,
  "birth_ease" text DEFAULT 'normal'::text,
  "kids_detail" jsonb DEFAULT '[]'::jsonb,
  "notes" text,
  "is_deleted" boolean DEFAULT false,
  "created_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "public"."kambing_breeding_feed_logs" (
"id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL,
  "log_date" date NOT NULL DEFAULT CURRENT_DATE,
  "hijauan_kg" numeric DEFAULT 0,
  "konsentrat_kg" numeric DEFAULT 0,
  "dedak_kg" numeric DEFAULT 0,
  "other_feed_kg" numeric DEFAULT 0,
  "feed_cost_idr" numeric,
  "animal_count" integer,
  "notes" text,
  "is_deleted" boolean DEFAULT false,
  "created_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "public"."kambing_breeding_health_logs" (
"id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL,
  "animal_id" uuid,
  "log_date" date NOT NULL DEFAULT CURRENT_DATE,
  "log_type" text NOT NULL DEFAULT 'pemeriksaan'::text,
  "symptoms" text,
  "diagnosis" text,
  "treatment" text,
  "medicine_name" text,
  "medicine_dose" text,
  "handled_by" text,
  "outcome" text,
  "notes" text,
  "is_deleted" boolean DEFAULT false,
  "created_at" timestamp with time zone DEFAULT now(),
  "treatment_cost_idr" numeric DEFAULT 0
);

CREATE TABLE IF NOT EXISTS "public"."kambing_breeding_mating_records" (
"id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL,
  "dam_id" uuid NOT NULL,
  "sire_id" uuid,
  "mating_date" date NOT NULL,
  "mating_type" text DEFAULT 'kawin_alam'::text,
  "inseminator" text,
  "straw_code" text,
  "expected_partus" date,
  "result" text DEFAULT 'menunggu'::text,
  "pregnancy_check_date" date,
  "notes" text,
  "is_deleted" boolean DEFAULT false,
  "created_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "public"."kambing_breeding_sales" (
"id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL,
  "animal_id" uuid NOT NULL,
  "sale_date" date NOT NULL DEFAULT CURRENT_DATE,
  "buyer_name" text,
  "sale_type" text DEFAULT 'bibit'::text,
  "price_idr" numeric,
  "weight_kg" numeric,
  "age_days" integer,
  "notes" text,
  "is_deleted" boolean DEFAULT false,
  "created_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "public"."kambing_breeding_weight_records" (
"id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL,
  "animal_id" uuid NOT NULL,
  "weigh_date" date NOT NULL DEFAULT CURRENT_DATE,
  "weight_kg" numeric NOT NULL,
  "bcs" text,
  "age_days" integer,
  "adg_since_last" numeric,
  "notes" text,
  "is_deleted" boolean DEFAULT false,
  "created_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "public"."kambing_kandangs" (
"id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL,
  "batch_id" uuid,
  "name" text NOT NULL,
  "capacity" integer DEFAULT 0,
  "panjang_m" numeric,
  "lebar_m" numeric,
  "is_holding" boolean DEFAULT false,
  "is_active" boolean DEFAULT true,
  "notes" text,
  "created_at" timestamp with time zone DEFAULT now(),
  "updated_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "public"."kambing_penggemukan_animals" (
"id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL,
  "batch_id" uuid,
  "ear_tag" text NOT NULL,
  "breed" text,
  "sex" text DEFAULT 'jantan'::text,
  "age_estimate" text,
  "entry_date" date NOT NULL DEFAULT CURRENT_DATE,
  "entry_weight_kg" numeric,
  "entry_bcs" text,
  "entry_condition" text DEFAULT 'sehat'::text,
  "purchase_price_idr" numeric,
  "source" text,
  "kandang_slot" text,
  "kandang_id" uuid,
  "quarantine_start" date,
  "quarantine_end" date,
  "quarantine_notes" text,
  "status" text NOT NULL DEFAULT 'active'::text,
  "exit_date" date,
  "latest_weight_kg" numeric,
  "latest_weight_date" date,
  "notes" text,
  "is_deleted" boolean DEFAULT false,
  "created_at" timestamp with time zone DEFAULT now(),
  "updated_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "public"."kambing_penggemukan_batches" (
"id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL,
  "batch_code" text NOT NULL,
  "kandang_name" text,
  "start_date" date NOT NULL DEFAULT CURRENT_DATE,
  "target_end_date" date,
  "status" text NOT NULL DEFAULT 'active'::text,
  "total_animals" integer DEFAULT 0,
  "mortality_count" integer DEFAULT 0,
  "notes" text,
  "end_date" date,
  "avg_adg_gram" numeric,
  "avg_fcr" numeric,
  "avg_entry_weight_kg" numeric,
  "avg_exit_weight_kg" numeric,
  "total_feed_cost_idr" numeric,
  "total_revenue_idr" numeric,
  "total_cogs_idr" numeric,
  "net_profit_idr" numeric,
  "rc_ratio" numeric,
  "alive_count" integer,
  "sold_count" integer,
  "is_deleted" boolean DEFAULT false,
  "created_at" timestamp with time zone DEFAULT now(),
  "updated_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "public"."kambing_penggemukan_feed_logs" (
"id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL,
  "batch_id" uuid NOT NULL,
  "log_date" date NOT NULL DEFAULT CURRENT_DATE,
  "kandang_name" text,
  "animal_count" integer,
  "hijauan_kg" numeric DEFAULT 0,
  "konsentrat_kg" numeric DEFAULT 0,
  "dedak_kg" numeric DEFAULT 0,
  "other_feed_kg" numeric DEFAULT 0,
  "sisa_pakan_kg" numeric DEFAULT 0,
  "feed_cost_idr" numeric,
  "notes" text,
  "is_deleted" boolean DEFAULT false,
  "created_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "public"."kambing_penggemukan_health_logs" (
"id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL,
  "animal_id" uuid,
  "batch_id" uuid,
  "log_date" date NOT NULL DEFAULT CURRENT_DATE,
  "log_type" text NOT NULL DEFAULT 'pemeriksaan'::text,
  "symptoms" text,
  "action_taken" text,
  "medicine_name" text,
  "medicine_dose" text,
  "handled_by" text,
  "outcome" text,
  "vaccine_name" text,
  "vaccine_next_due" date,
  "death_cause" text,
  "death_weight_kg" numeric,
  "loss_value_idr" numeric,
  "notes" text,
  "is_deleted" boolean DEFAULT false,
  "created_at" timestamp with time zone DEFAULT now(),
  "treatment_cost_idr" numeric DEFAULT 0
);

CREATE TABLE IF NOT EXISTS "public"."kambing_penggemukan_operational_costs" (
"id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL,
  "batch_id" uuid,
  "log_date" date NOT NULL DEFAULT CURRENT_DATE,
  "item_name" text NOT NULL,
  "category" text NOT NULL DEFAULT 'lainnya'::text,
  "amount_idr" numeric NOT NULL DEFAULT 0,
  "quantity" numeric DEFAULT 0,
  "unit" text,
  "notes" text,
  "is_deleted" boolean DEFAULT false,
  "created_at" timestamp with time zone DEFAULT now(),
  "updated_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "public"."kambing_penggemukan_sales" (
"id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL,
  "batch_id" uuid NOT NULL,
  "sale_date" date NOT NULL DEFAULT CURRENT_DATE,
  "buyer_name" text,
  "buyer_type" text,
  "buyer_contact" text,
  "animal_ids" text[],
  "animal_count" integer,
  "total_weight_kg" numeric,
  "avg_weight_kg" numeric,
  "price_type" text,
  "price_amount" numeric,
  "total_revenue_idr" numeric,
  "payment_method" text,
  "is_paid" boolean DEFAULT false,
  "paid_date" date,
  "has_skkh" boolean DEFAULT false,
  "has_surat_jalan" boolean DEFAULT false,
  "invoice_number" text,
  "notes" text,
  "is_deleted" boolean DEFAULT false,
  "created_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "public"."kambing_penggemukan_weight_records" (
"id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL,
  "animal_id" uuid NOT NULL,
  "batch_id" uuid,
  "weigh_date" date NOT NULL DEFAULT CURRENT_DATE,
  "weight_kg" numeric NOT NULL,
  "bcs" text,
  "days_in_farm" integer,
  "adg_since_last" numeric,
  "notes" text,
  "is_deleted" boolean DEFAULT false,
  "created_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "public"."kambing_perah_animal_groups" (
"id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL,
  "name" text NOT NULL,
  "description" text,
  "group_type" text,
  "is_active" boolean DEFAULT true,
  "created_at" timestamp with time zone DEFAULT now(),
  "updated_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "public"."kambing_perah_breeding_animals" (
"id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL,
  "group_id" uuid,
  "kandang_id" uuid,
  "ear_tag" text NOT NULL,
  "name" text,
  "breed" text,
  "sex" text NOT NULL DEFAULT 'betina'::text,
  "birth_date" date,
  "entry_date" date DEFAULT CURRENT_DATE,
  "entry_weight_kg" numeric,
  "dam_id" uuid,
  "sire_id" uuid,
  "status" text DEFAULT 'aktif'::text,
  "current_parity" integer DEFAULT 0,
  "total_lifetime_yield" numeric DEFAULT 0,
  "last_milking_date" date,
  "is_deleted" boolean DEFAULT false,
  "created_at" timestamp with time zone DEFAULT now(),
  "updated_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "public"."kambing_perah_breeding_births" (
"id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL,
  "dam_id" uuid NOT NULL,
  "mating_id" uuid,
  "partus_date" date NOT NULL,
  "born_alive" integer DEFAULT 0,
  "born_dead" integer DEFAULT 0,
  "kids_ids" text[],
  "notes" text,
  "created_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "public"."kambing_perah_breeding_feed_logs" (
"id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL,
  "group_id" uuid,
  "formulation_id" uuid,
  "log_date" date NOT NULL DEFAULT CURRENT_DATE,
  "total_qty_kg" numeric,
  "total_cost_idr" numeric,
  "created_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "public"."kambing_perah_breeding_health_logs" (
"id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL,
  "animal_id" uuid,
  "log_date" date NOT NULL DEFAULT CURRENT_DATE,
  "log_type" text NOT NULL DEFAULT 'pemeriksaan'::text,
  "symptoms" text,
  "is_udder_problem" boolean DEFAULT false,
  "action_taken" text,
  "medicine_item_id" uuid,
  "medicine_usage_qty" numeric,
  "withdrawal_date" date,
  "is_deleted" boolean DEFAULT false,
  "created_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "public"."kambing_perah_breeding_mating_records" (
"id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL,
  "dam_id" uuid NOT NULL,
  "sire_id" uuid,
  "mating_date" date NOT NULL,
  "mating_type" text DEFAULT 'kawin_alam'::text,
  "expected_partus" date,
  "result" text DEFAULT 'menunggu'::text,
  "is_deleted" boolean DEFAULT false,
  "created_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "public"."kambing_perah_breeding_weight_records" (
"id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL,
  "animal_id" uuid NOT NULL,
  "weigh_date" date NOT NULL DEFAULT CURRENT_DATE,
  "weight_kg" numeric NOT NULL,
  "bcs" text,
  "created_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "public"."kambing_perah_customer_registry" (
"id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL,
  "name" text NOT NULL,
  "type" text,
  "phone" text,
  "address" text,
  "loyalty_points" integer DEFAULT 0,
  "notes" text,
  "is_active" boolean DEFAULT true,
  "created_at" timestamp with time zone DEFAULT now(),
  "updated_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "public"."kambing_perah_feed_formulations" (
"id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL,
  "name" text NOT NULL,
  "target_group_type" text,
  "ingredients" jsonb,
  "cost_per_kg" numeric,
  "is_active" boolean DEFAULT true,
  "created_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "public"."kambing_perah_inventory_items" (
"id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL,
  "name" text NOT NULL,
  "category" text NOT NULL,
  "unit" text NOT NULL,
  "stock_quantity" numeric DEFAULT 0,
  "reorder_level" numeric DEFAULT 0,
  "unit_price_idr" numeric,
  "is_active" boolean DEFAULT true,
  "created_at" timestamp with time zone DEFAULT now(),
  "updated_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "public"."kambing_perah_inventory_transactions" (
"id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL,
  "item_id" uuid NOT NULL,
  "type" text NOT NULL,
  "quantity" numeric NOT NULL,
  "transaction_date" date NOT NULL DEFAULT CURRENT_DATE,
  "reference_type" text,
  "reference_id" uuid,
  "notes" text,
  "created_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "public"."kambing_perah_kandangs" (
"id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL,
  "name" text NOT NULL,
  "type" text,
  "capacity" integer DEFAULT 0,
  "is_active" boolean DEFAULT true,
  "notes" text,
  "created_at" timestamp with time zone DEFAULT now(),
  "updated_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "public"."kambing_perah_lactation_cycles" (
"id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL,
  "animal_id" uuid NOT NULL,
  "start_date" date NOT NULL,
  "dry_off_date" date,
  "parity_number" integer NOT NULL,
  "status" text,
  "total_yield_liter" numeric DEFAULT 0,
  "peak_yield_liter" numeric,
  "avg_daily_yield" numeric,
  "notes" text,
  "created_at" timestamp with time zone DEFAULT now(),
  "updated_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "public"."kambing_perah_milk_logs" (
"id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL,
  "animal_id" uuid NOT NULL,
  "lactation_id" uuid,
  "log_date" date NOT NULL DEFAULT CURRENT_DATE,
  "session" text,
  "volume_liter" numeric NOT NULL DEFAULT 0,
  "temperature_c" numeric,
  "acidity_ph" numeric,
  "operator_name" text,
  "notes" text,
  "is_deleted" boolean DEFAULT false,
  "created_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "public"."kambing_perah_milk_quality_logs" (
"id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL,
  "animal_id" uuid NOT NULL,
  "lactation_id" uuid,
  "test_date" date NOT NULL DEFAULT CURRENT_DATE,
  "fat_pct" numeric,
  "snf_pct" numeric,
  "protein_pct" numeric,
  "scc_value" integer,
  "bacteria_count" integer,
  "quality_grade" text,
  "created_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "public"."kambing_perah_milk_sales" (
"id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL,
  "customer_id" uuid,
  "sale_date" date NOT NULL DEFAULT CURRENT_DATE,
  "buyer_name_legacy" text,
  "volume_liter" numeric NOT NULL,
  "price_per_liter" numeric NOT NULL,
  "total_revenue_idr" numeric NOT NULL,
  "payment_method" text,
  "is_paid" boolean DEFAULT false,
  "notes" text,
  "is_deleted" boolean DEFAULT false,
  "created_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "public"."kambing_perah_penggemukan_animals" (
"id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL,
  "batch_id" uuid,
  "ear_tag" text NOT NULL,
  "sex" text DEFAULT 'jantan'::text,
  "status" text DEFAULT 'active'::text,
  "created_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "public"."kambing_perah_penggemukan_batches" (
"id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL,
  "batch_code" text NOT NULL,
  "status" text NOT NULL DEFAULT 'active'::text,
  "created_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "public"."kambing_perah_penggemukan_feed_logs" (
"id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL,
  "batch_id" uuid,
  "log_date" date DEFAULT CURRENT_DATE,
  "feed_cost_idr" numeric,
  "created_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "public"."kambing_perah_penggemukan_health_logs" (
"id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL,
  "animal_id" uuid,
  "log_type" text,
  "action_taken" text,
  "created_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "public"."kambing_perah_penggemukan_sales" (
"id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL,
  "batch_id" uuid,
  "sale_date" date DEFAULT CURRENT_DATE,
  "total_revenue_idr" numeric,
  "created_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "public"."kambing_perah_penggemukan_weight_records" (
"id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL,
  "animal_id" uuid NOT NULL,
  "weight_kg" numeric NOT NULL,
  "weigh_date" date DEFAULT CURRENT_DATE,
  "created_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "public"."kandang_worker_payments" (
"id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL,
  "worker_id" uuid NOT NULL,
  "payment_date" date NOT NULL,
  "payment_type" text NOT NULL DEFAULT 'gaji'::text,
  "amount" integer NOT NULL DEFAULT 0,
  "notes" text,
  "is_deleted" boolean NOT NULL DEFAULT false,
  "created_at" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "public"."kandang_workers" (
"id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL,
  "peternak_farm_id" uuid,
  "full_name" text NOT NULL,
  "phone" text,
  "join_date" date,
  "salary_type" text DEFAULT 'flat_bonus'::text,
  "base_salary" integer DEFAULT 0,
  "bonus_per_kg" integer DEFAULT 0,
  "bonus_threshold_fcr" numeric,
  "status" text DEFAULT 'aktif'::text,
  "notes" text,
  "is_deleted" boolean DEFAULT false,
  "profile_id" uuid,
  "kandang_name" text,
  "pay_day" integer DEFAULT 1
);

CREATE TABLE IF NOT EXISTS "public"."loss_reports" (
"id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL,
  "sale_id" uuid,
  "delivery_id" uuid,
  "loss_type" text NOT NULL,
  "chicken_count" integer NOT NULL DEFAULT 0,
  "weight_loss_kg" numeric NOT NULL DEFAULT 0,
  "price_per_kg" integer,
  "financial_loss" bigint,
  "description" text,
  "resolved" boolean NOT NULL DEFAULT false,
  "resolved_at" timestamp with time zone,
  "report_date" date NOT NULL DEFAULT CURRENT_DATE,
  "is_deleted" boolean NOT NULL DEFAULT false,
  "created_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "public"."market_listings" (
"id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL,
  "listing_type" text NOT NULL,
  "chicken_type" text DEFAULT 'broiler'::text,
  "quantity_ekor" integer,
  "weight_kg" numeric,
  "price_per_kg" integer,
  "title" text NOT NULL,
  "description" text,
  "location" text,
  "contact_name" text NOT NULL,
  "contact_wa" text NOT NULL,
  "status" text DEFAULT 'active'::text,
  "expires_at" timestamp with time zone DEFAULT (now() + '30 days'::interval),
  "view_count" integer DEFAULT 0,
  "created_at" timestamp with time zone DEFAULT now(),
  "is_deleted" boolean DEFAULT false
);

CREATE TABLE IF NOT EXISTS "public"."market_prices" (
"id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "price_date" date NOT NULL DEFAULT CURRENT_DATE,
  "chicken_type" text NOT NULL DEFAULT 'broiler'::text,
  "region" text NOT NULL DEFAULT 'nasional'::text,
  "farm_gate_price" integer,
  "avg_buy_price" integer,
  "avg_sell_price" integer,
  "buyer_price" integer,
  "broker_margin" integer,
  "transaction_count" integer NOT NULL DEFAULT 1,
  "source" text NOT NULL DEFAULT 'transaction'::text,
  "created_at" timestamp with time zone DEFAULT now(),
  "updated_at" timestamp with time zone DEFAULT now(),
  "source_url" text,
  "is_deleted" boolean NOT NULL DEFAULT false,
  "price_delta" integer DEFAULT 0,
  "needs_review" boolean NOT NULL DEFAULT false,
  "submitted_by" uuid
);

CREATE TABLE IF NOT EXISTS "public"."notifications" (
"id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL,
  "type" text NOT NULL,
  "title" text NOT NULL,
  "body" text,
  "is_read" boolean NOT NULL DEFAULT false,
  "action_url" text,
  "metadata" jsonb,
  "created_at" timestamp with time zone DEFAULT now(),
  "priority" smallint NOT NULL DEFAULT 1,
  "expires_at" timestamp with time zone,
  "vertical" text,
  "updated_at" timestamp with time zone NOT NULL DEFAULT now(),
  "is_deleted" boolean NOT NULL DEFAULT false
);

CREATE TABLE IF NOT EXISTS "public"."orders" (
"id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL,
  "rpa_id" uuid NOT NULL,
  "chicken_type" text NOT NULL DEFAULT 'broiler'::text,
  "requested_count" integer NOT NULL,
  "requested_weight_kg" numeric,
  "target_price_per_kg" integer,
  "preferred_size" text,
  "requested_date" date,
  "status" text NOT NULL DEFAULT 'open'::text,
  "matched_farm_id" uuid,
  "matched_batch_id" uuid,
  "notes" text,
  "is_deleted" boolean NOT NULL DEFAULT false,
  "created_at" timestamp with time zone DEFAULT now(),
  "updated_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "public"."payment_settings" (
"id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "bank_name" text NOT NULL,
  "account_number" text NOT NULL,
  "account_name" text NOT NULL,
  "is_active" boolean DEFAULT true,
  "created_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "public"."payments" (
"id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL,
  "sale_id" uuid NOT NULL,
  "amount" bigint NOT NULL,
  "payment_date" date NOT NULL DEFAULT CURRENT_DATE,
  "payment_method" text NOT NULL DEFAULT 'transfer'::text,
  "reference_no" text,
  "notes" text,
  "created_at" timestamp with time zone DEFAULT now(),
  "is_deleted" boolean DEFAULT false
);

CREATE TABLE IF NOT EXISTS "public"."peternak_farms" (
"id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL,
  "farm_name" text NOT NULL,
  "location" text,
  "address" text,
  "latitude" numeric,
  "longitude" numeric,
  "capacity" integer NOT NULL,
  "kandang_count" integer DEFAULT 1,
  "is_active" boolean DEFAULT true,
  "notes" text,
  "is_deleted" boolean NOT NULL DEFAULT false,
  "created_at" timestamp with time zone DEFAULT now(),
  "updated_at" timestamp with time zone DEFAULT now(),
  "business_model" text DEFAULT 'mandiri'::text,
  "mitra_company" text,
  "mitra_contract_price" integer,
  "livestock_type" text DEFAULT 'ayam_broiler'::text,
  "mitra_contract_notes" text,
  "animal_types" text[] DEFAULT '{}'::text[],
  "doc_capacity" integer DEFAULT 0
);

CREATE TABLE IF NOT EXISTS "public"."peternak_profiles" (
"id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL,
  "animal_types" text[] DEFAULT '{}'::text[],
  "chicken_sub_types" text[] DEFAULT '{}'::text[],
  "ruminansia_types" text[] DEFAULT '{}'::text[],
  "kandang_count" integer DEFAULT 1,
  "doc_capacity" integer DEFAULT 0,
  "total_ternak" integer DEFAULT 0,
  "luas_lahan_m2" integer DEFAULT 0,
  "catatan" text,
  "created_at" timestamp with time zone DEFAULT now(),
  "updated_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "public"."peternak_task_instances" (
"id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL,
  "template_id" uuid,
  "kandang_name" text,
  "title" text NOT NULL,
  "description" text,
  "task_type" text NOT NULL,
  "due_date" date NOT NULL,
  "due_time" time without time zone,
  "assigned_worker_id" uuid,
  "assigned_profile_id" uuid,
  "status" text NOT NULL DEFAULT 'pending'::text,
  "completed_at" timestamp with time zone,
  "completed_by_profile_id" uuid,
  "linked_record_id" uuid,
  "linked_record_table" text,
  "notes" text,
  "is_deleted" boolean NOT NULL DEFAULT false,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now(),
  "livestock_type" text
);

CREATE TABLE IF NOT EXISTS "public"."peternak_task_templates" (
"id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL,
  "kandang_name" text,
  "title" text NOT NULL,
  "description" text,
  "task_type" text NOT NULL,
  "linked_data_entry" boolean NOT NULL DEFAULT false,
  "recurring_type" text NOT NULL,
  "recurring_interval_days" integer,
  "recurring_days_of_week" text[],
  "start_date" date NOT NULL,
  "end_date" date,
  "default_assignee_worker_id" uuid,
  "is_active" boolean NOT NULL DEFAULT true,
  "is_deleted" boolean NOT NULL DEFAULT false,
  "created_by" uuid,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now(),
  "due_time" time without time zone NOT NULL DEFAULT '08:00:00'::time without time zone,
  "livestock_type" text
);

CREATE TABLE IF NOT EXISTS "public"."plan_configs" (
"id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "config_key" text NOT NULL,
  "config_value" jsonb NOT NULL,
  "description" text,
  "updated_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "public"."pricing_plans" (
"id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "role" text NOT NULL,
  "plan" text NOT NULL,
  "price" integer NOT NULL DEFAULT 0,
  "original_price" integer DEFAULT 0,
  "updated_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "public"."profiles" (
"id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL,
  "auth_user_id" uuid NOT NULL,
  "full_name" text,
  "role" text NOT NULL DEFAULT 'owner'::text,
  "user_type" text NOT NULL DEFAULT 'broker'::text,
  "phone" text,
  "avatar_url" text,
  "is_active" boolean NOT NULL DEFAULT true,
  "onboarded" boolean NOT NULL DEFAULT false,
  "last_seen_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now(),
  "updated_at" timestamp with time zone DEFAULT now(),
  "business_model_selected" boolean NOT NULL DEFAULT false,
  "onboarding_completed_at" timestamp with time zone,
  "business_limit" integer DEFAULT 1,
  "additional_slots" integer DEFAULT 0,
  "tutorials_completed" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "app_role" text NOT NULL DEFAULT 'user'::text,
  "email" text
);

CREATE TABLE IF NOT EXISTS "public"."purchases" (
"id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL,
  "farm_id" uuid NOT NULL,
  "batch_id" uuid,
  "quantity" integer NOT NULL,
  "avg_weight_kg" numeric NOT NULL,
  "total_weight_kg" numeric NOT NULL,
  "price_per_kg" integer NOT NULL,
  "total_cost" bigint NOT NULL,
  "transport_cost" integer NOT NULL DEFAULT 0,
  "other_cost" integer NOT NULL DEFAULT 0,
  "total_modal" bigint,
  "transaction_date" date NOT NULL DEFAULT CURRENT_DATE,
  "notes" text,
  "is_deleted" boolean NOT NULL DEFAULT false,
  "created_at" timestamp with time zone DEFAULT now(),
  "updated_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "public"."rpa_clients" (
"id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL,
  "rpa_name" text NOT NULL,
  "buyer_type" text NOT NULL DEFAULT 'rpa'::text,
  "contact_person" text,
  "phone" text,
  "location" text,
  "address" text,
  "payment_terms" text NOT NULL DEFAULT 'cash'::text,
  "credit_limit" bigint NOT NULL DEFAULT 0,
  "total_outstanding" bigint NOT NULL DEFAULT 0,
  "avg_volume_per_order" integer,
  "preferred_chicken_size" text,
  "preferred_chicken_type" text DEFAULT 'broiler'::text,
  "last_deal_price" integer,
  "reliability_score" smallint,
  "notes" text,
  "is_deleted" boolean NOT NULL DEFAULT false,
  "created_at" timestamp with time zone DEFAULT now(),
  "updated_at" timestamp with time zone DEFAULT now(),
  "province" text
);

CREATE TABLE IF NOT EXISTS "public"."rpa_customer_payments" (
"id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL,
  "invoice_id" uuid NOT NULL,
  "customer_id" uuid,
  "amount" bigint NOT NULL,
  "payment_date" date NOT NULL,
  "payment_method" text DEFAULT 'cash'::text,
  "reference_no" text,
  "notes" text,
  "created_at" timestamp with time zone DEFAULT now(),
  "is_deleted" boolean DEFAULT false
);

CREATE TABLE IF NOT EXISTS "public"."rpa_customers" (
"id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL,
  "customer_name" text NOT NULL,
  "customer_type" text DEFAULT 'toko_kecil'::text,
  "contact_person" text,
  "phone" text,
  "address" text,
  "payment_terms" text DEFAULT 'cash'::text,
  "credit_limit" bigint DEFAULT 0,
  "total_outstanding" bigint DEFAULT 0,
  "total_purchases" bigint DEFAULT 0,
  "reliability_score" smallint,
  "notes" text,
  "is_deleted" boolean DEFAULT false,
  "created_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "public"."rpa_invoice_items" (
"id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "invoice_id" uuid NOT NULL,
  "product_id" uuid,
  "product_name" text NOT NULL,
  "quantity_kg" numeric NOT NULL,
  "price_per_kg" integer NOT NULL,
  "cost_per_kg" integer DEFAULT 0,
  "subtotal" bigint
);

CREATE TABLE IF NOT EXISTS "public"."rpa_invoices" (
"id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL,
  "customer_id" uuid,
  "invoice_number" text NOT NULL,
  "customer_name" text NOT NULL,
  "transaction_date" date NOT NULL,
  "due_date" date,
  "total_amount" bigint DEFAULT 0,
  "total_cost" bigint DEFAULT 0,
  "net_profit" bigint,
  "payment_status" text DEFAULT 'belum_lunas'::text,
  "paid_amount" bigint DEFAULT 0,
  "remaining_amount" bigint,
  "notes" text,
  "is_deleted" boolean DEFAULT false,
  "created_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "public"."rpa_payments" (
"id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "rpa_tenant_id" uuid NOT NULL,
  "broker_tenant_id" uuid NOT NULL,
  "amount" bigint NOT NULL,
  "payment_date" date NOT NULL DEFAULT CURRENT_DATE,
  "payment_method" text NOT NULL DEFAULT 'transfer'::text,
  "reference_no" text,
  "notes" text,
  "created_at" timestamp with time zone DEFAULT now(),
  "is_deleted" boolean DEFAULT false
);

CREATE TABLE IF NOT EXISTS "public"."rpa_products" (
"id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL,
  "product_name" text NOT NULL,
  "product_type" text DEFAULT 'karkas'::text,
  "unit" text DEFAULT 'kg'::text,
  "sell_price" integer DEFAULT 0,
  "cost_price" integer DEFAULT 0,
  "current_stock_kg" numeric DEFAULT 0,
  "is_active" boolean DEFAULT true,
  "is_deleted" boolean DEFAULT false,
  "created_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "public"."rpa_profiles" (
"id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL,
  "rpa_name" text NOT NULL,
  "rpa_type" text NOT NULL DEFAULT 'rpa'::text,
  "contact_person" text,
  "phone" text,
  "address" text,
  "location" text,
  "capacity_per_day" integer,
  "preferred_types" text[],
  "is_verified" boolean DEFAULT false,
  "notes" text,
  "is_deleted" boolean NOT NULL DEFAULT false,
  "created_at" timestamp with time zone DEFAULT now(),
  "updated_at" timestamp with time zone DEFAULT now(),
  "kapasitas_potong_per_hari" integer DEFAULT 0,
  "product_types" text[] DEFAULT '{}'::text[],
  "area_distribusi" text,
  "catatan" text
);

CREATE TABLE IF NOT EXISTS "public"."rpa_purchase_orders" (
"id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "rpa_tenant_id" uuid NOT NULL,
  "broker_tenant_id" uuid,
  "chicken_type" text NOT NULL DEFAULT 'broiler'::text,
  "requested_count" integer NOT NULL,
  "target_weight_kg" numeric,
  "max_price_per_kg" integer,
  "required_date" date,
  "status" text NOT NULL DEFAULT 'open'::text,
  "notes" text,
  "is_deleted" boolean NOT NULL DEFAULT false,
  "created_at" timestamp with time zone DEFAULT now(),
  "updated_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "public"."sales" (
"id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL,
  "rpa_id" uuid NOT NULL,
  "purchase_id" uuid,
  "order_id" uuid,
  "quantity" integer NOT NULL,
  "avg_weight_kg" numeric NOT NULL,
  "total_weight_kg" numeric NOT NULL,
  "price_per_kg" integer NOT NULL,
  "total_revenue" bigint NOT NULL,
  "delivery_cost" integer NOT NULL DEFAULT 0,
  "net_revenue" bigint,
  "payment_status" text NOT NULL DEFAULT 'belum_lunas'::text,
  "paid_amount" bigint NOT NULL DEFAULT 0,
  "remaining_amount" bigint,
  "transaction_date" date NOT NULL DEFAULT CURRENT_DATE,
  "due_date" date,
  "notes" text,
  "is_deleted" boolean NOT NULL DEFAULT false,
  "created_at" timestamp with time zone DEFAULT now(),
  "updated_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "public"."sapi_breeding_animals" (
"id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL,
  "ear_tag" text NOT NULL,
  "name" text,
  "species" text NOT NULL DEFAULT 'sapi'::text,
  "sex" text NOT NULL,
  "breed" text,
  "breed_composition" text,
  "generation" text,
  "birth_date" date,
  "birth_weight_kg" numeric,
  "birth_type" text,
  "dam_id" uuid,
  "sire_id" uuid,
  "acquisition_type" text NOT NULL DEFAULT 'beli'::text,
  "source" text,
  "purpose" text,
  "parity" integer NOT NULL DEFAULT 0,
  "selection_class" text,
  "phenotype_score" numeric,
  "genetic_notes" text,
  "origin" text,
  "entry_date" date,
  "entry_weight_kg" numeric,
  "entry_bcs" numeric,
  "purchase_price_idr" bigint,
  "kandang_name" text,
  "status" text NOT NULL DEFAULT 'aktif'::text,
  "exit_date" date,
  "latest_weight_kg" numeric,
  "latest_weight_date" date,
  "latest_bcs" numeric,
  "notes" text,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now(),
  "is_deleted" boolean NOT NULL DEFAULT false
);

CREATE TABLE IF NOT EXISTS "public"."sapi_breeding_births" (
"id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL,
  "mating_record_id" uuid,
  "dam_id" uuid NOT NULL,
  "partus_date" date NOT NULL,
  "partus_time" time without time zone,
  "birth_type" text,
  "total_born" integer NOT NULL DEFAULT 1,
  "total_born_alive" integer NOT NULL DEFAULT 1,
  "total_born_dead" integer,
  "pedet_sex" text,
  "pedet_birth_weight_kg" numeric,
  "pedet_condition" text,
  "pedet_id" uuid,
  "is_freemartin_risk" boolean NOT NULL DEFAULT false,
  "birth_assistance" text NOT NULL DEFAULT 'normal'::text,
  "colostrum_given" boolean DEFAULT true,
  "placenta_expelled" boolean DEFAULT true,
  "retentio_placenta" boolean NOT NULL DEFAULT false,
  "dam_condition" text,
  "notes" text,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "is_deleted" boolean NOT NULL DEFAULT false
);

CREATE TABLE IF NOT EXISTS "public"."sapi_breeding_feed_logs" (
"id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL,
  "log_date" date NOT NULL,
  "kandang_name" text NOT NULL,
  "animal_count" integer NOT NULL,
  "hijauan_kg" numeric NOT NULL DEFAULT 0,
  "konsentrat_kg" numeric NOT NULL DEFAULT 0,
  "dedak_kg" numeric NOT NULL DEFAULT 0,
  "other_feed_kg" numeric NOT NULL DEFAULT 0,
  "sisa_pakan_kg" numeric NOT NULL DEFAULT 0,
  "consumed_kg" numeric,
  "feed_cost_idr" bigint,
  "notes" text,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now(),
  "is_deleted" boolean NOT NULL DEFAULT false
);

CREATE TABLE IF NOT EXISTS "public"."sapi_breeding_health_logs" (
"id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL,
  "animal_id" uuid NOT NULL,
  "log_date" date NOT NULL,
  "log_type" text NOT NULL,
  "vaccine_name" text,
  "drug_name" text,
  "dose" text,
  "route" text,
  "symptoms" text,
  "diagnosis" text,
  "treatment" text,
  "outcome" text,
  "death_cause" text,
  "death_weight_kg" numeric,
  "loss_value_idr" bigint,
  "handled_by" text,
  "notes" text,
  "recorded_by" text,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "is_deleted" boolean NOT NULL DEFAULT false,
  "treatment_cost_idr" numeric DEFAULT 0
);

CREATE TABLE IF NOT EXISTS "public"."sapi_breeding_mating_records" (
"id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL,
  "dam_id" uuid NOT NULL,
  "sire_id" uuid,
  "method" text NOT NULL,
  "bull_name" text,
  "semen_code" text,
  "inseminator_name" text,
  "repeat_ib_count" integer NOT NULL DEFAULT 1,
  "sync_protocol" text,
  "estrus_date" date,
  "mating_date" date NOT NULL,
  "est_partus_date" date,
  "pregnancy_confirmed" boolean DEFAULT false,
  "pregnancy_confirm_date" date,
  "pregnancy_method" text,
  "fetus_count" integer,
  "status" text NOT NULL DEFAULT 'menunggu'::text,
  "notes" text,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now(),
  "is_deleted" boolean NOT NULL DEFAULT false
);

CREATE TABLE IF NOT EXISTS "public"."sapi_breeding_sales" (
"id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL,
  "animal_id" uuid NOT NULL,
  "sale_date" date NOT NULL,
  "product_type" text NOT NULL,
  "buyer_name" text NOT NULL,
  "buyer_contact" text,
  "buyer_type" text,
  "sale_weight_kg" numeric,
  "price_type" text,
  "price_amount" bigint NOT NULL,
  "total_revenue_idr" bigint NOT NULL,
  "payment_method" text,
  "is_paid" boolean NOT NULL DEFAULT false,
  "paid_date" date,
  "invoice_number" text,
  "notes" text,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now(),
  "is_deleted" boolean NOT NULL DEFAULT false
);

CREATE TABLE IF NOT EXISTS "public"."sapi_breeding_weight_records" (
"id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL,
  "animal_id" uuid NOT NULL,
  "weigh_date" date NOT NULL,
  "weight_kg" numeric NOT NULL,
  "age_days" integer,
  "adg_since_last" numeric,
  "bcs" numeric,
  "weigh_method" text NOT NULL DEFAULT 'timbang_langsung'::text,
  "chest_girth_cm" numeric,
  "notes" text,
  "recorded_by" text,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "is_deleted" boolean NOT NULL DEFAULT false
);

CREATE TABLE IF NOT EXISTS "public"."sapi_kandangs" (
"id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL,
  "batch_id" uuid NOT NULL,
  "name" text NOT NULL,
  "capacity" integer NOT NULL DEFAULT 0,
  "panjang_m" numeric,
  "lebar_m" numeric,
  "luas_m2" numeric,
  "is_holding" boolean NOT NULL DEFAULT false,
  "notes" text,
  "is_active" boolean NOT NULL DEFAULT true,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "grid_x" integer,
  "grid_y" integer
);

CREATE TABLE IF NOT EXISTS "public"."sapi_penggemukan_animals" (
"id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL,
  "batch_id" uuid NOT NULL,
  "ear_tag" text NOT NULL,
  "species" text NOT NULL DEFAULT 'sapi'::text,
  "breed" text,
  "sex" text NOT NULL,
  "birth_date" date,
  "entry_age_months" integer,
  "age_confidence" text NOT NULL DEFAULT 'estimasi'::text,
  "acquisition_type" text NOT NULL DEFAULT 'beli'::text,
  "entry_date" date NOT NULL,
  "entry_weight_kg" numeric NOT NULL,
  "entry_bcs" numeric,
  "entry_condition" text,
  "purchase_price_idr" bigint,
  "source" text,
  "kandang_slot" text,
  "quarantine_start" date,
  "quarantine_end" date,
  "quarantine_notes" text,
  "status" text NOT NULL DEFAULT 'active'::text,
  "exit_date" date,
  "latest_weight_kg" numeric,
  "latest_weight_date" date,
  "latest_bcs" numeric,
  "kandang_id" uuid,
  "notes" text,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now(),
  "is_deleted" boolean NOT NULL DEFAULT false
);

CREATE TABLE IF NOT EXISTS "public"."sapi_penggemukan_batches" (
"id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL,
  "batch_code" text NOT NULL,
  "kandang_name" text NOT NULL,
  "start_date" date NOT NULL,
  "target_end_date" date,
  "end_date" date,
  "batch_purpose" text NOT NULL DEFAULT 'potong'::text,
  "total_animals" integer NOT NULL DEFAULT 0,
  "alive_count" integer,
  "sold_count" integer,
  "mortality_count" integer NOT NULL DEFAULT 0,
  "avg_adg_gram" numeric,
  "avg_fcr" numeric,
  "avg_entry_weight_kg" numeric,
  "avg_exit_weight_kg" numeric,
  "total_feed_cost_idr" bigint,
  "total_revenue_idr" bigint,
  "total_cogs_idr" bigint,
  "net_profit_idr" bigint,
  "rc_ratio" numeric,
  "status" text NOT NULL DEFAULT 'active'::text,
  "notes" text,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now(),
  "is_deleted" boolean NOT NULL DEFAULT false
);

CREATE TABLE IF NOT EXISTS "public"."sapi_penggemukan_feed_logs" (
"id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL,
  "batch_id" uuid NOT NULL,
  "log_date" date NOT NULL,
  "kandang_name" text NOT NULL,
  "animal_count" integer NOT NULL,
  "hijauan_kg" numeric NOT NULL DEFAULT 0,
  "konsentrat_kg" numeric NOT NULL DEFAULT 0,
  "dedak_kg" numeric NOT NULL DEFAULT 0,
  "other_feed_kg" numeric NOT NULL DEFAULT 0,
  "sisa_pakan_kg" numeric NOT NULL DEFAULT 0,
  "consumed_kg" numeric,
  "feed_cost_idr" bigint,
  "notes" text,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now(),
  "is_deleted" boolean NOT NULL DEFAULT false
);

CREATE TABLE IF NOT EXISTS "public"."sapi_penggemukan_health_logs" (
"id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL,
  "animal_id" uuid NOT NULL,
  "batch_id" uuid NOT NULL,
  "log_date" date NOT NULL,
  "log_type" text NOT NULL,
  "symptoms" text,
  "action_taken" text,
  "medicine_name" text,
  "medicine_dose" text,
  "handled_by" text,
  "outcome" text,
  "vaccine_name" text,
  "vaccine_next_due" date,
  "death_cause" text,
  "death_weight_kg" numeric,
  "loss_value_idr" bigint,
  "notes" text,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "is_deleted" boolean NOT NULL DEFAULT false,
  "treatment_cost_idr" numeric DEFAULT 0
);

CREATE TABLE IF NOT EXISTS "public"."sapi_penggemukan_operational_costs" (
"id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL,
  "batch_id" uuid,
  "log_date" date NOT NULL DEFAULT CURRENT_DATE,
  "item_name" text NOT NULL,
  "category" text NOT NULL DEFAULT 'lainnya'::text,
  "amount_idr" numeric NOT NULL DEFAULT 0,
  "quantity" numeric DEFAULT 0,
  "unit" text,
  "notes" text,
  "is_deleted" boolean DEFAULT false,
  "created_at" timestamp with time zone DEFAULT now(),
  "updated_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "public"."sapi_penggemukan_sales" (
"id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL,
  "batch_id" uuid NOT NULL,
  "sale_date" date NOT NULL,
  "buyer_name" text NOT NULL,
  "buyer_type" text,
  "buyer_contact" text,
  "animal_ids" text[] NOT NULL,
  "animal_count" integer NOT NULL,
  "total_weight_kg" numeric NOT NULL,
  "avg_weight_kg" numeric,
  "price_type" text,
  "price_amount" bigint NOT NULL,
  "total_revenue_idr" bigint NOT NULL,
  "payment_method" text,
  "is_paid" boolean NOT NULL DEFAULT false,
  "paid_date" date,
  "has_skkh" boolean NOT NULL DEFAULT false,
  "has_surat_jalan" boolean NOT NULL DEFAULT false,
  "invoice_number" text,
  "notes" text,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now(),
  "is_deleted" boolean NOT NULL DEFAULT false
);

CREATE TABLE IF NOT EXISTS "public"."sapi_penggemukan_weight_records" (
"id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL,
  "animal_id" uuid NOT NULL,
  "batch_id" uuid NOT NULL,
  "weigh_date" date NOT NULL,
  "days_in_farm" integer,
  "weight_kg" numeric NOT NULL,
  "bcs" numeric,
  "adg_since_last" numeric,
  "weigh_method" text NOT NULL DEFAULT 'timbang_langsung'::text,
  "chest_girth_cm" numeric,
  "notes" text,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "is_deleted" boolean NOT NULL DEFAULT false
);

CREATE TABLE IF NOT EXISTS "public"."sembako_customers" (
"id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL,
  "customer_name" text NOT NULL,
  "customer_type" text DEFAULT 'warung'::text,
  "contact_person" text,
  "phone" text,
  "address" text,
  "area" text,
  "payment_terms" text DEFAULT 'cash'::text,
  "credit_limit" bigint DEFAULT 0,
  "total_outstanding" bigint DEFAULT 0,
  "total_purchases" bigint DEFAULT 0,
  "reliability_score" smallint,
  "notes" text,
  "is_deleted" boolean DEFAULT false,
  "created_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "public"."sembako_deliveries" (
"id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL,
  "sale_id" uuid,
  "employee_id" uuid,
  "vehicle_type" text,
  "vehicle_plate" text,
  "driver_name" text,
  "delivery_date" date NOT NULL,
  "delivery_area" text,
  "delivery_cost" integer DEFAULT 0,
  "other_cost" integer DEFAULT 0,
  "status" text DEFAULT 'pending'::text,
  "notes" text,
  "is_deleted" boolean DEFAULT false,
  "created_at" timestamp with time zone DEFAULT now(),
  "departed_at" timestamp with time zone,
  "arrived_at" timestamp with time zone,
  "completed_at" timestamp with time zone
);

CREATE TABLE IF NOT EXISTS "public"."sembako_employees" (
"id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL,
  "full_name" text NOT NULL,
  "role" text NOT NULL,
  "phone" text,
  "address" text,
  "join_date" date,
  "salary_type" text DEFAULT 'bulanan'::text,
  "base_salary" integer DEFAULT 0,
  "commission_pct" numeric DEFAULT 0,
  "trip_rate" integer DEFAULT 0,
  "status" text DEFAULT 'aktif'::text,
  "notes" text,
  "is_deleted" boolean DEFAULT false,
  "created_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "public"."sembako_expenses" (
"id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL,
  "category" text NOT NULL,
  "description" text NOT NULL,
  "amount" bigint NOT NULL,
  "expense_date" date NOT NULL,
  "notes" text,
  "is_deleted" boolean DEFAULT false,
  "created_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "public"."sembako_payments" (
"id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL,
  "sale_id" uuid NOT NULL,
  "customer_id" uuid,
  "amount" bigint NOT NULL,
  "payment_date" date NOT NULL,
  "payment_method" text DEFAULT 'cash'::text,
  "reference_no" text,
  "notes" text,
  "created_at" timestamp with time zone DEFAULT now(),
  "is_deleted" boolean DEFAULT false,
  "reference_number" text
);

CREATE TABLE IF NOT EXISTS "public"."sembako_payroll" (
"id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL,
  "employee_id" uuid NOT NULL,
  "period_type" text NOT NULL,
  "period_date" date NOT NULL,
  "work_days" integer DEFAULT 0,
  "trip_count" integer DEFAULT 0,
  "sales_amount" bigint DEFAULT 0,
  "base_amount" integer DEFAULT 0,
  "commission_amount" integer DEFAULT 0,
  "bonus" integer DEFAULT 0,
  "deduction" integer DEFAULT 0,
  "total_pay" integer,
  "payment_status" text DEFAULT 'pending'::text,
  "paid_at" timestamp with time zone,
  "notes" text,
  "created_at" timestamp with time zone DEFAULT now(),
  "is_deleted" boolean DEFAULT false
);

CREATE TABLE IF NOT EXISTS "public"."sembako_products" (
"id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL,
  "product_name" text NOT NULL,
  "category" text NOT NULL,
  "unit" text NOT NULL DEFAULT 'kg'::text,
  "current_stock" numeric DEFAULT 0,
  "avg_buy_price" integer DEFAULT 0,
  "sell_price" integer DEFAULT 0,
  "min_stock_alert" numeric DEFAULT 0,
  "barcode" text,
  "notes" text,
  "is_active" boolean DEFAULT true,
  "is_deleted" boolean DEFAULT false,
  "created_at" timestamp with time zone DEFAULT now(),
  "secondary_unit" text,
  "conversion_rate" numeric
);

CREATE TABLE IF NOT EXISTS "public"."sembako_sale_items" (
"id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "sale_id" uuid NOT NULL,
  "product_id" uuid,
  "product_name" text NOT NULL,
  "unit" text NOT NULL,
  "quantity" numeric NOT NULL,
  "price_per_unit" integer NOT NULL,
  "cogs_per_unit" integer DEFAULT 0,
  "subtotal" bigint,
  "cogs_total" bigint
);

CREATE TABLE IF NOT EXISTS "public"."sembako_sales" (
"id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL,
  "customer_id" uuid,
  "delivery_id" uuid,
  "invoice_number" text NOT NULL,
  "customer_name" text NOT NULL,
  "transaction_date" date NOT NULL,
  "due_date" date,
  "total_amount" bigint DEFAULT 0,
  "total_cogs" bigint DEFAULT 0,
  "gross_profit" bigint,
  "delivery_cost" integer DEFAULT 0,
  "other_cost" integer DEFAULT 0,
  "net_profit" bigint,
  "payment_status" text DEFAULT 'belum_lunas'::text,
  "paid_amount" bigint DEFAULT 0,
  "remaining_amount" bigint,
  "notes" text,
  "is_deleted" boolean DEFAULT false,
  "created_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "public"."sembako_stock_batches" (
"id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL,
  "product_id" uuid NOT NULL,
  "supplier_id" uuid,
  "batch_code" text,
  "qty_masuk" numeric NOT NULL,
  "qty_sisa" numeric NOT NULL,
  "buy_price" integer NOT NULL,
  "total_cost" bigint,
  "purchase_date" date NOT NULL,
  "expiry_date" date,
  "notes" text,
  "is_deleted" boolean DEFAULT false,
  "created_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "public"."sembako_stock_out" (
"id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL,
  "product_id" uuid NOT NULL,
  "batch_id" uuid NOT NULL,
  "sale_item_id" uuid,
  "qty_keluar" numeric NOT NULL,
  "buy_price" integer NOT NULL,
  "created_at" timestamp with time zone DEFAULT now(),
  "sale_id" uuid,
  "is_deleted" boolean DEFAULT false
);

CREATE TABLE IF NOT EXISTS "public"."sembako_supplier_payments" (
"id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL,
  "supplier_id" uuid NOT NULL,
  "amount" bigint NOT NULL,
  "payment_date" date NOT NULL DEFAULT CURRENT_DATE,
  "payment_method" text NOT NULL,
  "reference_number" text,
  "notes" text,
  "is_deleted" boolean DEFAULT false,
  "created_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "public"."sembako_suppliers" (
"id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL,
  "supplier_name" text NOT NULL,
  "supplier_type" text DEFAULT 'petani'::text,
  "contact_person" text,
  "phone" text,
  "address" text,
  "products_supplied" text[],
  "payment_terms" text DEFAULT 'cash'::text,
  "total_outstanding" bigint DEFAULT 0,
  "notes" text,
  "is_deleted" boolean DEFAULT false,
  "created_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "public"."site_config" (
"key" text NOT NULL,
  "value" text,
  "updated_at" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "public"."stock_listings" (
"id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "peternak_tenant_id" uuid NOT NULL,
  "cycle_id" uuid,
  "chicken_type" text NOT NULL DEFAULT 'broiler'::text,
  "available_count" integer NOT NULL,
  "estimated_weight_kg" numeric,
  "estimated_harvest_date" date,
  "asking_price_per_kg" integer,
  "status" text NOT NULL DEFAULT 'available'::text,
  "visible_to" text NOT NULL DEFAULT 'connected'::text,
  "notes" text,
  "expires_at" timestamp with time zone,
  "is_deleted" boolean NOT NULL DEFAULT false,
  "created_at" timestamp with time zone DEFAULT now(),
  "updated_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "public"."subscription_invoices" (
"id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL,
  "invoice_number" text,
  "amount" integer NOT NULL,
  "plan" text NOT NULL,
  "billing_period" text,
  "billing_months" integer DEFAULT 1,
  "status" text NOT NULL DEFAULT 'pending'::text,
  "transfer_proof_url" text,
  "bank_name" text,
  "transfer_date" date,
  "confirmed_by" uuid,
  "confirmed_at" timestamp with time zone,
  "notes" text,
  "created_at" timestamp with time zone DEFAULT now(),
  "updated_at" timestamp with time zone DEFAULT now(),
  "payment_proof_url" text,
  "payment_method" text DEFAULT 'transfer'::text,
  "xendit_invoice_id" text,
  "xendit_payment_url" text,
  "paid_at" timestamp with time zone
);

CREATE TABLE IF NOT EXISTS "public"."team_invitations" (
"id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL,
  "invited_by" uuid NOT NULL,
  "email" text,
  "role" text NOT NULL,
  "token" text NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'::text),
  "status" text NOT NULL DEFAULT 'pending'::text,
  "expires_at" timestamp with time zone NOT NULL DEFAULT (now() + '7 days'::interval),
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "is_deleted" boolean DEFAULT false
);

CREATE TABLE IF NOT EXISTS "public"."tenant_memberships" (
"id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "auth_user_id" uuid NOT NULL,
  "tenant_id" uuid NOT NULL,
  "role" text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now(),
  "full_name" text
);

CREATE TABLE IF NOT EXISTS "public"."tenants" (
"id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "business_name" text NOT NULL,
  "owner_name" text,
  "phone" text,
  "location" text,
  "plan" text NOT NULL DEFAULT 'starter'::text,
  "is_active" boolean NOT NULL DEFAULT true,
  "trial_ends_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now(),
  "updated_at" timestamp with time zone DEFAULT now(),
  "business_vertical" text DEFAULT 'poultry_broker'::text,
  "is_hidden_beta" boolean DEFAULT false,
  "kandang_limit" integer DEFAULT 1,
  "sub_type" text,
  "chicken_types" text[] DEFAULT '{}'::text[],
  "animal_types" text[] DEFAULT '{}'::text[],
  "area_operasi" text,
  "target_volume_monthly" integer DEFAULT 0,
  "base_livestock_type" text DEFAULT 'broiler'::text,
  "addon_livestock_types" text[] DEFAULT '{}'::text[],
  "plan_expires_at" timestamp with time zone,
  "province" text
);

CREATE TABLE IF NOT EXISTS "public"."vaccination_records" (
"id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL,
  "cycle_id" uuid NOT NULL,
  "vaccination_date" date NOT NULL,
  "age_days" integer,
  "vaccine_name" text NOT NULL,
  "disease_target" text,
  "method" text,
  "dose_per_bird" numeric,
  "batch_number" text,
  "notes" text,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "is_deleted" boolean NOT NULL DEFAULT false
);

CREATE TABLE IF NOT EXISTS "public"."vehicle_expenses" (
"id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL,
  "vehicle_id" uuid NOT NULL,
  "expense_type" text NOT NULL,
  "amount" bigint NOT NULL,
  "description" text,
  "expense_date" date NOT NULL DEFAULT CURRENT_DATE,
  "is_deleted" boolean NOT NULL DEFAULT false,
  "created_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "public"."vehicles" (
"id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL,
  "vehicle_type" text NOT NULL,
  "vehicle_plate" text NOT NULL,
  "brand" text,
  "year" integer,
  "capacity_ekor" integer,
  "capacity_kg" numeric,
  "ownership" text NOT NULL DEFAULT 'milik_sendiri'::text,
  "rental_cost" integer,
  "rental_owner" text,
  "status" text NOT NULL DEFAULT 'aktif'::text,
  "last_service_date" date,
  "notes" text,
  "is_deleted" boolean NOT NULL DEFAULT false,
  "created_at" timestamp with time zone DEFAULT now(),
  "updated_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "public"."waitlist_signups" (
"id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "email" text NOT NULL,
  "vertical" text,
  "created_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "public"."worker_payments" (
"id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL,
  "cycle_id" uuid NOT NULL,
  "worker_id" uuid NOT NULL,
  "payment_type" text,
  "amount" bigint NOT NULL,
  "payment_date" date NOT NULL,
  "notes" text,
  "is_deleted" boolean DEFAULT false
);

CREATE TABLE IF NOT EXISTS "public"."xendit_config" (
"id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "is_active" boolean DEFAULT false,
  "secret_key_encrypted" text,
  "webhook_token" text,
  "success_redirect_url" text,
  "failure_redirect_url" text,
  "created_at" timestamp with time zone DEFAULT now(),
  "updated_at" timestamp with time zone DEFAULT now()
);
