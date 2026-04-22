CREATE TABLE public.ai_anomaly_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  staged_transaction_id uuid,
  field_name text,
  anomaly_reason text,
  severity text,
  detected_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.ai_conversations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  profile_id uuid NOT NULL,
  messages _jsonb[] NOT NULL DEFAULT '{}'::jsonb[],
  user_type text NOT NULL,
  context_page text,
  context_snapshot jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb
);

CREATE TABLE public.ai_error_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid,
  profile_id uuid,
  error_msg text NOT NULL,
  provider text,
  user_message text,
  context_page text,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.ai_feedback (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  pending_entry_id uuid NOT NULL,
  tenant_id uuid NOT NULL,
  profile_id uuid NOT NULL,
  rating smallint NOT NULL,
  correction_notes text,
  corrected_data jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE public.ai_pending_entries (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL,
  tenant_id uuid NOT NULL,
  profile_id uuid NOT NULL,
  intent text NOT NULL,
  extracted_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  target_table text,
  status text NOT NULL DEFAULT 'pending'::text,
  confidence numeric NOT NULL DEFAULT 1.0,
  clarification_needed text,
  raw_ai_response jsonb,
  inserted_record_id uuid,
  error_message text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE public.ai_staged_transactions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  pending_entry_id uuid,
  tenant_id uuid NOT NULL,
  profile_id uuid NOT NULL,
  target_table text NOT NULL,
  intent text NOT NULL,
  payload jsonb NOT NULL,
  original_data jsonb,
  is_edited boolean DEFAULT false,
  status text DEFAULT 'staged'::text,
  error_message text,
  staged_at timestamp with time zone DEFAULT now(),
  committed_at timestamp with time zone,
  production_id uuid,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.breeding_cycles (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  peternak_farm_id uuid NOT NULL,
  cycle_number integer NOT NULL,
  chicken_type text NOT NULL DEFAULT 'broiler'::text,
  doc_count integer NOT NULL,
  doc_price integer,
  start_date date NOT NULL,
  target_harvest_date date,
  actual_harvest_date date,
  target_weight_kg numeric DEFAULT 1.9,
  target_fcr numeric DEFAULT 1.7,
  status text NOT NULL DEFAULT 'active'::text,
  total_feed_kg numeric DEFAULT 0,
  total_mortality integer DEFAULT 0,
  final_count integer,
  final_avg_weight_kg numeric,
  final_fcr numeric,
  final_ip_score numeric,
  total_production_cost bigint DEFAULT 0,
  cost_per_kg integer,
  notes text,
  is_deleted boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.broker_connections (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  peternak_tenant_id uuid NOT NULL,
  broker_tenant_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending'::text,
  connected_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  requester_tenant_id uuid NOT NULL,
  requester_type text,
  target_tenant_id uuid NOT NULL,
  target_type text,
  message text,
  rejected_reason text,
  requested_at timestamp with time zone DEFAULT now(),
  responded_at timestamp with time zone,
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.broker_profiles (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  chicken_types _text[] DEFAULT '{}'::text[],
  egg_types _text[] DEFAULT '{}'::text[],
  area_operasi text,
  target_volume_monthly integer DEFAULT 0,
  mitra_peternak_count integer DEFAULT 0,
  kapasitas_harian_butir integer DEFAULT 0,
  catatan text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.chicken_batches (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  farm_id uuid NOT NULL,
  batch_code text,
  chicken_type text NOT NULL DEFAULT 'broiler'::text,
  initial_count integer NOT NULL,
  current_count integer NOT NULL,
  avg_weight_kg numeric,
  age_days integer,
  estimated_harvest_date date,
  status text NOT NULL DEFAULT 'growing'::text,
  quality_notes text,
  is_deleted boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.cycle_expenses (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  cycle_id uuid NOT NULL,
  expense_type text NOT NULL,
  description text,
  qty numeric,
  unit text,
  unit_price integer,
  total_amount bigint NOT NULL,
  expense_date date NOT NULL,
  supplier text,
  is_deleted boolean DEFAULT false
);

CREATE TABLE public.daily_records (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  cycle_id uuid NOT NULL,
  record_date date NOT NULL,
  age_days integer NOT NULL,
  mortality_count integer NOT NULL DEFAULT 0,
  cull_count integer NOT NULL DEFAULT 0,
  feed_type text,
  feed_kg numeric NOT NULL DEFAULT 0,
  sample_count integer,
  sample_weight_kg numeric,
  avg_weight_kg numeric,
  temperature_morning numeric,
  temperature_evening numeric,
  health_notes text,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  water_liter numeric,
  litter_condition text,
  ammonia_level text
);

CREATE TABLE public.deliveries (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  sale_id uuid NOT NULL,
  vehicle_type text,
  vehicle_plate text,
  driver_name text,
  driver_phone text,
  load_time timestamp with time zone,
  departure_time timestamp with time zone,
  arrival_time timestamp with time zone,
  initial_count integer NOT NULL,
  arrived_count integer,
  mortality_count integer NOT NULL DEFAULT 0,
  initial_weight_kg numeric,
  arrived_weight_kg numeric,
  shrinkage_kg numeric,
  delivery_cost integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'preparing'::text,
  notes text,
  is_deleted boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  vehicle_id uuid,
  driver_id uuid,
  driver_wage numeric DEFAULT 0,
  include_driver_wage boolean DEFAULT true,
  include_fuel_cost boolean DEFAULT true
);

CREATE TABLE public.discount_codes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  code text NOT NULL,
  discount_type text NOT NULL,
  discount_value integer NOT NULL DEFAULT 0,
  applies_to_plan text DEFAULT 'all'::text,
  applies_to_role text DEFAULT 'all'::text,
  expires_at timestamp with time zone,
  max_usage integer,
  usage_count integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.domba_breeding_animals (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  ear_tag text NOT NULL,
  name text,
  breed text,
  sex text NOT NULL DEFAULT 'betina'::text,
  birth_date date,
  entry_date date DEFAULT CURRENT_DATE,
  entry_weight_kg numeric,
  dam_id uuid,
  sire_id uuid,
  generation integer DEFAULT 0,
  status text DEFAULT 'aktif'::text,
  notes text,
  is_deleted boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.domba_breeding_births (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  dam_id uuid NOT NULL,
  mating_id uuid,
  partus_date date NOT NULL,
  born_alive integer DEFAULT 0,
  born_dead integer DEFAULT 0,
  birth_type text,
  birth_ease text DEFAULT 'normal'::text,
  kids_detail jsonb DEFAULT '[]'::jsonb,
  notes text,
  is_deleted boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.domba_breeding_feed_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  log_date date NOT NULL DEFAULT CURRENT_DATE,
  hijauan_kg numeric DEFAULT 0,
  konsentrat_kg numeric DEFAULT 0,
  dedak_kg numeric DEFAULT 0,
  other_feed_kg numeric DEFAULT 0,
  feed_cost_idr numeric,
  animal_count integer,
  notes text,
  is_deleted boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.domba_breeding_health_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  animal_id uuid,
  log_date date NOT NULL DEFAULT CURRENT_DATE,
  log_type text NOT NULL DEFAULT 'pemeriksaan'::text,
  symptoms text,
  diagnosis text,
  treatment text,
  medicine_name text,
  medicine_dose text,
  handled_by text,
  outcome text,
  notes text,
  is_deleted boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.domba_breeding_mating_records (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  dam_id uuid NOT NULL,
  sire_id uuid,
  mating_date date NOT NULL,
  mating_type text DEFAULT 'kawin_alam'::text,
  inseminator text,
  straw_code text,
  expected_partus date,
  result text DEFAULT 'menunggu'::text,
  pregnancy_check_date date,
  notes text,
  is_deleted boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.domba_breeding_sales (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  animal_id uuid NOT NULL,
  sale_date date NOT NULL DEFAULT CURRENT_DATE,
  buyer_name text,
  sale_type text DEFAULT 'bibit'::text,
  price_idr numeric,
  weight_kg numeric,
  age_days integer,
  notes text,
  is_deleted boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.domba_breeding_weight_records (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  animal_id uuid NOT NULL,
  weigh_date date NOT NULL DEFAULT CURRENT_DATE,
  weight_kg numeric NOT NULL,
  bcs text,
  age_days integer,
  adg_since_last numeric,
  notes text,
  is_deleted boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.domba_kandangs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  batch_id uuid,
  name text NOT NULL,
  capacity integer DEFAULT 0,
  panjang_m numeric,
  lebar_m numeric,
  is_holding boolean DEFAULT false,
  is_active boolean DEFAULT true,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  grid_x integer,
  grid_y integer
);

CREATE TABLE public.domba_penggemukan_animals (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  batch_id uuid,
  ear_tag text NOT NULL,
  breed text,
  sex text DEFAULT 'jantan'::text,
  age_estimate text,
  entry_date date NOT NULL DEFAULT CURRENT_DATE,
  entry_weight_kg numeric,
  entry_bcs text,
  entry_condition text DEFAULT 'sehat'::text,
  purchase_price_idr numeric,
  source text,
  kandang_slot text,
  kandang_id uuid,
  quarantine_start date,
  quarantine_end date,
  quarantine_notes text,
  status text NOT NULL DEFAULT 'active'::text,
  exit_date date,
  latest_weight_kg numeric,
  latest_weight_date date,
  notes text,
  is_deleted boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  entry_age_months integer
);

CREATE TABLE public.domba_penggemukan_batches (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  batch_code text NOT NULL,
  kandang_name text,
  start_date date NOT NULL DEFAULT CURRENT_DATE,
  target_end_date date,
  status text NOT NULL DEFAULT 'active'::text,
  total_animals integer DEFAULT 0,
  mortality_count integer DEFAULT 0,
  notes text,
  end_date date,
  avg_adg_gram numeric,
  avg_fcr numeric,
  avg_entry_weight_kg numeric,
  avg_exit_weight_kg numeric,
  total_feed_cost_idr numeric,
  total_revenue_idr numeric,
  total_cogs_idr numeric,
  net_profit_idr numeric,
  rc_ratio numeric,
  alive_count integer,
  sold_count integer,
  is_deleted boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.domba_penggemukan_feed_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  batch_id uuid NOT NULL,
  log_date date NOT NULL DEFAULT CURRENT_DATE,
  kandang_name text,
  animal_count integer,
  hijauan_kg numeric DEFAULT 0,
  konsentrat_kg numeric DEFAULT 0,
  dedak_kg numeric DEFAULT 0,
  other_feed_kg numeric DEFAULT 0,
  sisa_pakan_kg numeric DEFAULT 0,
  feed_cost_idr numeric,
  notes text,
  is_deleted boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  feed_orts_category text
);

CREATE TABLE public.domba_penggemukan_health_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  animal_id uuid,
  batch_id uuid,
  log_date date NOT NULL DEFAULT CURRENT_DATE,
  log_type text NOT NULL DEFAULT 'pemeriksaan'::text,
  symptoms text,
  action_taken text,
  medicine_name text,
  medicine_dose text,
  handled_by text,
  outcome text,
  vaccine_name text,
  vaccine_next_due date,
  death_cause text,
  death_weight_kg numeric,
  loss_value_idr numeric,
  notes text,
  is_deleted boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.domba_penggemukan_sales (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  batch_id uuid NOT NULL,
  sale_date date NOT NULL DEFAULT CURRENT_DATE,
  buyer_name text,
  buyer_type text,
  buyer_contact text,
  animal_ids _uuid[],
  animal_count integer,
  total_weight_kg numeric,
  avg_weight_kg numeric,
  price_type text,
  price_amount numeric,
  total_revenue_idr numeric,
  payment_method text,
  is_paid boolean DEFAULT false,
  paid_date date,
  has_skkh boolean DEFAULT false,
  has_surat_jalan boolean DEFAULT false,
  invoice_number text,
  notes text,
  is_deleted boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.domba_penggemukan_weight_records (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  animal_id uuid NOT NULL,
  batch_id uuid,
  weigh_date date NOT NULL DEFAULT CURRENT_DATE,
  weight_kg numeric NOT NULL,
  bcs text,
  days_in_farm integer,
  adg_since_last numeric,
  notes text,
  is_deleted boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  famacha_score integer
);

CREATE TABLE public.drivers (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  full_name text NOT NULL,
  phone text NOT NULL,
  sim_number text,
  sim_type text DEFAULT 'B1'::text,
  sim_expires_at date,
  status text NOT NULL DEFAULT 'aktif'::text,
  wage_per_trip integer DEFAULT 0,
  address text,
  notes text,
  is_deleted boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.egg_customers (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  name text NOT NULL,
  phone text,
  address text,
  total_spent bigint NOT NULL DEFAULT 0,
  total_orders integer NOT NULL DEFAULT 0,
  notes text,
  is_deleted boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE public.egg_inventory (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  product_name text NOT NULL,
  egg_grade text NOT NULL DEFAULT 'standard'::text,
  current_stock_butir integer NOT NULL DEFAULT 0,
  cost_per_egg integer NOT NULL DEFAULT 0,
  packaging_cost integer NOT NULL DEFAULT 0,
  eggs_per_pack integer NOT NULL DEFAULT 10,
  sell_price_per_pack integer NOT NULL DEFAULT 0,
  low_stock_threshold integer NOT NULL DEFAULT 20,
  notes text,
  is_deleted boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  cost_per_pack integer
);

CREATE TABLE public.egg_sale_items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  sale_id uuid NOT NULL,
  inventory_id uuid NOT NULL,
  qty_pack integer NOT NULL DEFAULT 1,
  price_per_pack integer NOT NULL DEFAULT 0,
  cost_per_pack integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  subtotal bigint
);

CREATE TABLE public.egg_sales (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  customer_id uuid,
  invoice_number text NOT NULL,
  customer_name text NOT NULL,
  customer_phone text,
  total_price bigint NOT NULL DEFAULT 0,
  total_cost bigint NOT NULL DEFAULT 0,
  payment_status text NOT NULL DEFAULT 'pending'::text,
  payment_method text,
  fulfillment_status text NOT NULL DEFAULT 'processing'::text,
  transaction_date date NOT NULL DEFAULT CURRENT_DATE,
  due_date date,
  notes text,
  is_deleted boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  net_profit bigint
);

CREATE TABLE public.egg_stock_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  inventory_id uuid NOT NULL,
  sale_id uuid,
  supplier_id uuid,
  log_type text NOT NULL,
  qty_butir integer NOT NULL,
  unit_price integer,
  notes text,
  created_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE public.egg_suppliers (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  name text NOT NULL,
  phone text,
  address text,
  is_deleted boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE public.extra_expenses (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  category text NOT NULL,
  description text NOT NULL,
  amount bigint NOT NULL,
  expense_date date NOT NULL DEFAULT CURRENT_DATE,
  notes text,
  is_deleted boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.farms (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  farm_name text NOT NULL,
  owner_name text NOT NULL,
  phone text,
  location text,
  address text,
  latitude numeric,
  longitude numeric,
  chicken_type text NOT NULL DEFAULT 'broiler'::text,
  capacity integer,
  available_stock integer NOT NULL DEFAULT 0,
  avg_weight_kg numeric,
  harvest_date date,
  status text NOT NULL DEFAULT 'empty'::text,
  quality_rating smallint,
  quality_notes text,
  last_transaction_date date,
  notes text,
  is_deleted boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  province text
);

CREATE TABLE public.feed_stocks (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  peternak_farm_id uuid NOT NULL,
  feed_type text NOT NULL,
  quantity_kg numeric NOT NULL DEFAULT 0,
  price_per_kg integer,
  purchase_date date,
  supplier text,
  notes text,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.generated_invoices (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  invoice_type text NOT NULL,
  reference_id uuid NOT NULL,
  invoice_number text NOT NULL,
  recipient_name text,
  total_amount bigint DEFAULT 0,
  status text DEFAULT 'draft'::text,
  pdf_url text,
  metadata jsonb,
  created_at timestamp with time zone DEFAULT now(),
  created_by uuid
);

CREATE TABLE public.global_audit_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  actor_profile_id uuid,
  tenant_id uuid,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid,
  old_data jsonb,
  new_data jsonb,
  ip_address text,
  user_agent text,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.harvest_records (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  cycle_id uuid NOT NULL,
  harvest_date date NOT NULL,
  buyer_type text,
  buyer_name text,
  mitra_company text,
  contract_price_per_kg integer,
  total_ekor_panen integer NOT NULL,
  total_weight_kg numeric NOT NULL,
  avg_weight_kg numeric,
  price_per_kg integer,
  total_revenue bigint,
  deduction_sapronak bigint DEFAULT 0,
  net_revenue bigint,
  notes text,
  is_deleted boolean DEFAULT false
);

CREATE TABLE public.invite_rate_limits (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  ip_address text NOT NULL,
  attempt_count integer DEFAULT 1,
  first_attempt_at timestamp with time zone DEFAULT now(),
  locked_until timestamp with time zone,
  last_attempt_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.kambing_breeding_animals (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  ear_tag text NOT NULL,
  name text,
  breed text,
  sex text NOT NULL DEFAULT 'betina'::text,
  birth_date date,
  entry_date date DEFAULT CURRENT_DATE,
  entry_weight_kg numeric,
  dam_id uuid,
  sire_id uuid,
  generation integer DEFAULT 0,
  status text DEFAULT 'aktif'::text,
  notes text,
  is_deleted boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.kambing_breeding_births (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  dam_id uuid NOT NULL,
  mating_id uuid,
  partus_date date NOT NULL,
  born_alive integer DEFAULT 0,
  born_dead integer DEFAULT 0,
  birth_type text,
  birth_ease text DEFAULT 'normal'::text,
  kids_detail jsonb DEFAULT '[]'::jsonb,
  notes text,
  is_deleted boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.kambing_breeding_feed_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  log_date date NOT NULL DEFAULT CURRENT_DATE,
  hijauan_kg numeric DEFAULT 0,
  konsentrat_kg numeric DEFAULT 0,
  dedak_kg numeric DEFAULT 0,
  other_feed_kg numeric DEFAULT 0,
  feed_cost_idr numeric,
  animal_count integer,
  notes text,
  is_deleted boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.kambing_breeding_health_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  animal_id uuid,
  log_date date NOT NULL DEFAULT CURRENT_DATE,
  log_type text NOT NULL DEFAULT 'pemeriksaan'::text,
  symptoms text,
  diagnosis text,
  treatment text,
  medicine_name text,
  medicine_dose text,
  handled_by text,
  outcome text,
  notes text,
  is_deleted boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.kambing_breeding_mating_records (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  dam_id uuid NOT NULL,
  sire_id uuid,
  mating_date date NOT NULL,
  mating_type text DEFAULT 'kawin_alam'::text,
  inseminator text,
  straw_code text,
  expected_partus date,
  result text DEFAULT 'menunggu'::text,
  pregnancy_check_date date,
  notes text,
  is_deleted boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.kambing_breeding_sales (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  animal_id uuid NOT NULL,
  sale_date date NOT NULL DEFAULT CURRENT_DATE,
  buyer_name text,
  sale_type text DEFAULT 'bibit'::text,
  price_idr numeric,
  weight_kg numeric,
  age_days integer,
  notes text,
  is_deleted boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.kambing_breeding_weight_records (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  animal_id uuid NOT NULL,
  weigh_date date NOT NULL DEFAULT CURRENT_DATE,
  weight_kg numeric NOT NULL,
  bcs text,
  age_days integer,
  adg_since_last numeric,
  notes text,
  is_deleted boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.kambing_kandangs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  batch_id uuid,
  name text NOT NULL,
  capacity integer DEFAULT 0,
  panjang_m numeric,
  lebar_m numeric,
  is_holding boolean DEFAULT false,
  is_active boolean DEFAULT true,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.kambing_penggemukan_animals (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  batch_id uuid,
  ear_tag text NOT NULL,
  breed text,
  sex text DEFAULT 'jantan'::text,
  age_estimate text,
  entry_date date NOT NULL DEFAULT CURRENT_DATE,
  entry_weight_kg numeric,
  entry_bcs text,
  entry_condition text DEFAULT 'sehat'::text,
  purchase_price_idr numeric,
  source text,
  kandang_slot text,
  kandang_id uuid,
  quarantine_start date,
  quarantine_end date,
  quarantine_notes text,
  status text NOT NULL DEFAULT 'active'::text,
  exit_date date,
  latest_weight_kg numeric,
  latest_weight_date date,
  notes text,
  is_deleted boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.kambing_penggemukan_batches (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  batch_code text NOT NULL,
  kandang_name text,
  start_date date NOT NULL DEFAULT CURRENT_DATE,
  target_end_date date,
  status text NOT NULL DEFAULT 'active'::text,
  total_animals integer DEFAULT 0,
  mortality_count integer DEFAULT 0,
  notes text,
  end_date date,
  avg_adg_gram numeric,
  avg_fcr numeric,
  avg_entry_weight_kg numeric,
  avg_exit_weight_kg numeric,
  total_feed_cost_idr numeric,
  total_revenue_idr numeric,
  total_cogs_idr numeric,
  net_profit_idr numeric,
  rc_ratio numeric,
  alive_count integer,
  sold_count integer,
  is_deleted boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.kambing_penggemukan_feed_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  batch_id uuid NOT NULL,
  log_date date NOT NULL DEFAULT CURRENT_DATE,
  kandang_name text,
  animal_count integer,
  hijauan_kg numeric DEFAULT 0,
  konsentrat_kg numeric DEFAULT 0,
  dedak_kg numeric DEFAULT 0,
  other_feed_kg numeric DEFAULT 0,
  sisa_pakan_kg numeric DEFAULT 0,
  feed_cost_idr numeric,
  notes text,
  is_deleted boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.kambing_penggemukan_health_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  animal_id uuid,
  batch_id uuid,
  log_date date NOT NULL DEFAULT CURRENT_DATE,
  log_type text NOT NULL DEFAULT 'pemeriksaan'::text,
  symptoms text,
  action_taken text,
  medicine_name text,
  medicine_dose text,
  handled_by text,
  outcome text,
  vaccine_name text,
  vaccine_next_due date,
  death_cause text,
  death_weight_kg numeric,
  loss_value_idr numeric,
  notes text,
  is_deleted boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.kambing_penggemukan_sales (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  batch_id uuid NOT NULL,
  sale_date date NOT NULL DEFAULT CURRENT_DATE,
  buyer_name text,
  buyer_type text,
  buyer_contact text,
  animal_ids _uuid[],
  animal_count integer,
  total_weight_kg numeric,
  avg_weight_kg numeric,
  price_type text,
  price_amount numeric,
  total_revenue_idr numeric,
  payment_method text,
  is_paid boolean DEFAULT false,
  paid_date date,
  has_skkh boolean DEFAULT false,
  has_surat_jalan boolean DEFAULT false,
  invoice_number text,
  notes text,
  is_deleted boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.kambing_penggemukan_weight_records (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  animal_id uuid NOT NULL,
  batch_id uuid,
  weigh_date date NOT NULL DEFAULT CURRENT_DATE,
  weight_kg numeric NOT NULL,
  bcs text,
  days_in_farm integer,
  adg_since_last numeric,
  notes text,
  is_deleted boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.kambing_perah_animal_groups (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  name text NOT NULL,
  description text,
  group_type text,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.kambing_perah_breeding_animals (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  group_id uuid,
  kandang_id uuid,
  ear_tag text NOT NULL,
  name text,
  breed text,
  sex text NOT NULL DEFAULT 'betina'::text,
  birth_date date,
  entry_date date DEFAULT CURRENT_DATE,
  entry_weight_kg numeric,
  dam_id uuid,
  sire_id uuid,
  status text DEFAULT 'aktif'::text,
  current_parity integer DEFAULT 0,
  total_lifetime_yield numeric DEFAULT 0,
  last_milking_date date,
  is_deleted boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.kambing_perah_breeding_births (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  dam_id uuid NOT NULL,
  mating_id uuid,
  partus_date date NOT NULL,
  born_alive integer DEFAULT 0,
  born_dead integer DEFAULT 0,
  kids_ids _uuid[],
  notes text,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.kambing_perah_breeding_feed_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  group_id uuid,
  formulation_id uuid,
  log_date date NOT NULL DEFAULT CURRENT_DATE,
  total_qty_kg numeric,
  total_cost_idr numeric,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.kambing_perah_breeding_health_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  animal_id uuid,
  log_date date NOT NULL DEFAULT CURRENT_DATE,
  log_type text NOT NULL DEFAULT 'pemeriksaan'::text,
  symptoms text,
  is_udder_problem boolean DEFAULT false,
  action_taken text,
  medicine_item_id uuid,
  medicine_usage_qty numeric,
  withdrawal_date date,
  is_deleted boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.kambing_perah_breeding_mating_records (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  dam_id uuid NOT NULL,
  sire_id uuid,
  mating_date date NOT NULL,
  mating_type text DEFAULT 'kawin_alam'::text,
  expected_partus date,
  result text DEFAULT 'menunggu'::text,
  is_deleted boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.kambing_perah_breeding_weight_records (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  animal_id uuid NOT NULL,
  weigh_date date NOT NULL DEFAULT CURRENT_DATE,
  weight_kg numeric NOT NULL,
  bcs text,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.kambing_perah_customer_registry (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  name text NOT NULL,
  type text,
  phone text,
  address text,
  loyalty_points integer DEFAULT 0,
  notes text,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.kambing_perah_feed_formulations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  name text NOT NULL,
  target_group_type text,
  ingredients jsonb,
  cost_per_kg numeric,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.kambing_perah_inventory_items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  name text NOT NULL,
  category text NOT NULL,
  unit text NOT NULL,
  stock_quantity numeric DEFAULT 0,
  reorder_level numeric DEFAULT 0,
  unit_price_idr numeric,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.kambing_perah_inventory_transactions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  item_id uuid NOT NULL,
  type text NOT NULL,
  quantity numeric NOT NULL,
  transaction_date date NOT NULL DEFAULT CURRENT_DATE,
  reference_type text,
  reference_id uuid,
  notes text,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.kambing_perah_kandangs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  name text NOT NULL,
  type text,
  capacity integer DEFAULT 0,
  is_active boolean DEFAULT true,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.kambing_perah_lactation_cycles (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  animal_id uuid NOT NULL,
  start_date date NOT NULL,
  dry_off_date date,
  parity_number integer NOT NULL,
  status text,
  total_yield_liter numeric DEFAULT 0,
  peak_yield_liter numeric,
  avg_daily_yield numeric,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.kambing_perah_milk_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  animal_id uuid NOT NULL,
  lactation_id uuid,
  log_date date NOT NULL DEFAULT CURRENT_DATE,
  session text,
  volume_liter numeric NOT NULL DEFAULT 0,
  temperature_c numeric,
  acidity_ph numeric,
  operator_name text,
  notes text,
  is_deleted boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.kambing_perah_milk_quality_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  animal_id uuid NOT NULL,
  lactation_id uuid,
  test_date date NOT NULL DEFAULT CURRENT_DATE,
  fat_pct numeric,
  snf_pct numeric,
  protein_pct numeric,
  scc_value integer,
  bacteria_count integer,
  quality_grade text,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.kambing_perah_milk_sales (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  customer_id uuid,
  sale_date date NOT NULL DEFAULT CURRENT_DATE,
  buyer_name_legacy text,
  volume_liter numeric NOT NULL,
  price_per_liter numeric NOT NULL,
  total_revenue_idr numeric NOT NULL,
  payment_method text,
  is_paid boolean DEFAULT false,
  notes text,
  is_deleted boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.kambing_perah_penggemukan_animals (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  batch_id uuid,
  ear_tag text NOT NULL,
  sex text DEFAULT 'jantan'::text,
  status text DEFAULT 'active'::text,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.kambing_perah_penggemukan_batches (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  batch_code text NOT NULL,
  status text NOT NULL DEFAULT 'active'::text,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.kambing_perah_penggemukan_feed_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  batch_id uuid,
  log_date date DEFAULT CURRENT_DATE,
  feed_cost_idr numeric,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.kambing_perah_penggemukan_health_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  animal_id uuid,
  log_type text,
  action_taken text,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.kambing_perah_penggemukan_sales (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  batch_id uuid,
  sale_date date DEFAULT CURRENT_DATE,
  total_revenue_idr numeric,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.kambing_perah_penggemukan_weight_records (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  animal_id uuid NOT NULL,
  weight_kg numeric NOT NULL,
  weigh_date date DEFAULT CURRENT_DATE,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.kandang_workers (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  peternak_farm_id uuid NOT NULL,
  full_name text NOT NULL,
  phone text,
  join_date date,
  salary_type text DEFAULT 'flat_bonus'::text,
  base_salary integer DEFAULT 0,
  bonus_per_kg integer DEFAULT 0,
  bonus_threshold_fcr numeric,
  status text DEFAULT 'aktif'::text,
  notes text,
  is_deleted boolean DEFAULT false,
  profile_id uuid
);

CREATE TABLE public.kd_breeding_animals (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  ear_tag text NOT NULL,
  name text,
  species text NOT NULL,
  sex text NOT NULL,
  birth_date date,
  birth_weight_kg numeric,
  birth_type text,
  dam_id uuid,
  sire_id uuid,
  breed text,
  breed_composition text,
  generation text,
  origin text,
  genetic_notes text,
  purpose text,
  selection_class text,
  phenotype_score numeric,
  status text NOT NULL DEFAULT 'aktif'::text,
  latest_weight_kg numeric,
  latest_weight_date date,
  latest_bcs numeric,
  is_deleted boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE public.kd_breeding_births (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  mating_record_id uuid,
  dam_id uuid NOT NULL,
  partus_date date NOT NULL,
  partus_time time without time zone,
  birth_type text,
  total_born integer NOT NULL DEFAULT 1,
  total_born_alive integer NOT NULL DEFAULT 1,
  total_born_dead integer,
  assisted boolean DEFAULT false,
  colostrum_given boolean DEFAULT true,
  placenta_expelled boolean DEFAULT true,
  dam_condition text,
  notes text,
  is_deleted boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE public.kd_breeding_feed_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  log_date date NOT NULL,
  group_name text NOT NULL,
  head_count integer,
  hijauan_kg numeric NOT NULL DEFAULT 0,
  konsentrat_kg numeric NOT NULL DEFAULT 0,
  dedak_kg numeric NOT NULL DEFAULT 0,
  mineral_kg numeric NOT NULL DEFAULT 0,
  sisa_kg numeric NOT NULL DEFAULT 0,
  consumed_kg numeric,
  notes text,
  is_deleted boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE public.kd_breeding_health_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  animal_id uuid NOT NULL,
  log_date date NOT NULL,
  log_type text NOT NULL,
  vaccine_name text,
  drug_name text,
  dose text,
  route text,
  symptoms text,
  diagnosis text,
  treatment text,
  outcome text,
  notes text,
  recorded_by text,
  is_deleted boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE public.kd_breeding_mating_records (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  dam_id uuid NOT NULL,
  sire_id uuid,
  semen_code text,
  estrus_date date,
  mating_date date NOT NULL,
  method text NOT NULL,
  est_partus_date date,
  pregnancy_confirmed boolean DEFAULT false,
  pregnancy_confirm_date date,
  pregnancy_method text,
  fetus_count integer,
  status text NOT NULL DEFAULT 'menunggu'::text,
  notes text,
  is_deleted boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE public.kd_breeding_sales (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  animal_id uuid NOT NULL,
  sale_date date NOT NULL,
  product_type text NOT NULL,
  buyer_name text,
  price_per_head numeric NOT NULL,
  weight_at_sale_kg numeric,
  notes text,
  is_deleted boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE public.kd_breeding_weight_records (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  animal_id uuid NOT NULL,
  weigh_date date NOT NULL,
  weight_kg numeric NOT NULL,
  age_days integer,
  adg_since_last numeric,
  bcs numeric,
  notes text,
  recorded_by text,
  is_deleted boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE public.kd_kandangs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  batch_id uuid NOT NULL,
  name text NOT NULL,
  capacity integer NOT NULL DEFAULT 0,
  panjang_m numeric,
  lebar_m numeric,
  luas_m2 numeric,
  is_holding boolean NOT NULL DEFAULT false,
  notes text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE public.kd_penggemukan_animals (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  batch_id uuid NOT NULL,
  ear_tag text NOT NULL,
  species text NOT NULL,
  breed text,
  sex text,
  age_estimate text,
  entry_date date NOT NULL,
  entry_weight_kg numeric NOT NULL,
  entry_bcs numeric,
  entry_condition text,
  purchase_price_idr bigint,
  source text,
  kandang_slot text,
  quarantine_start date,
  quarantine_end date,
  quarantine_notes text,
  status text NOT NULL DEFAULT 'active'::text,
  exit_date date,
  latest_weight_kg numeric,
  latest_weight_date date,
  latest_bcs numeric,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  is_deleted boolean NOT NULL DEFAULT false,
  kandang_id uuid
);

CREATE TABLE public.kd_penggemukan_batches (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  batch_code text NOT NULL,
  kandang_name text NOT NULL,
  start_date date NOT NULL,
  target_end_date date,
  end_date date,
  total_animals integer NOT NULL DEFAULT 0,
  alive_count integer,
  sold_count integer,
  mortality_count integer NOT NULL DEFAULT 0,
  avg_adg_gram numeric,
  avg_fcr numeric,
  avg_entry_weight_kg numeric,
  avg_exit_weight_kg numeric,
  total_feed_cost_idr bigint,
  total_revenue_idr bigint,
  total_cogs_idr bigint,
  net_profit_idr bigint,
  rc_ratio numeric,
  status text NOT NULL DEFAULT 'active'::text,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  is_deleted boolean NOT NULL DEFAULT false
);

CREATE TABLE public.kd_penggemukan_feed_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  batch_id uuid NOT NULL,
  log_date date NOT NULL,
  kandang_name text NOT NULL,
  animal_count integer NOT NULL,
  hijauan_kg numeric NOT NULL DEFAULT 0,
  konsentrat_kg numeric NOT NULL DEFAULT 0,
  dedak_kg numeric NOT NULL DEFAULT 0,
  other_feed_kg numeric NOT NULL DEFAULT 0,
  sisa_pakan_kg numeric NOT NULL DEFAULT 0,
  consumed_kg numeric,
  feed_cost_idr bigint,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  is_deleted boolean NOT NULL DEFAULT false
);

CREATE TABLE public.kd_penggemukan_health_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  animal_id uuid NOT NULL,
  batch_id uuid NOT NULL,
  log_date date NOT NULL,
  log_type text NOT NULL,
  symptoms text,
  action_taken text,
  medicine_name text,
  medicine_dose text,
  handled_by text,
  outcome text,
  vaccine_name text,
  vaccine_next_due date,
  death_cause text,
  death_weight_kg numeric,
  loss_value_idr bigint,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  is_deleted boolean NOT NULL DEFAULT false
);

CREATE TABLE public.kd_penggemukan_sales (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  batch_id uuid NOT NULL,
  sale_date date NOT NULL,
  buyer_name text NOT NULL,
  buyer_type text,
  buyer_contact text,
  animal_ids _uuid[] NOT NULL,
  animal_count integer NOT NULL,
  total_weight_kg numeric NOT NULL,
  avg_weight_kg numeric,
  price_type text,
  price_amount bigint NOT NULL,
  total_revenue_idr bigint NOT NULL,
  payment_method text,
  is_paid boolean NOT NULL DEFAULT false,
  paid_date date,
  has_skkh boolean NOT NULL DEFAULT false,
  has_surat_jalan boolean NOT NULL DEFAULT false,
  invoice_number text,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  is_deleted boolean NOT NULL DEFAULT false
);

CREATE TABLE public.kd_penggemukan_weight_records (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  animal_id uuid NOT NULL,
  batch_id uuid NOT NULL,
  weigh_date date NOT NULL,
  days_in_farm integer,
  weight_kg numeric NOT NULL,
  bcs numeric,
  adg_since_last numeric,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  is_deleted boolean NOT NULL DEFAULT false
);

CREATE TABLE public.loss_reports (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  sale_id uuid,
  delivery_id uuid,
  loss_type text NOT NULL,
  chicken_count integer NOT NULL DEFAULT 0,
  weight_loss_kg numeric NOT NULL DEFAULT 0,
  price_per_kg integer,
  financial_loss bigint,
  description text,
  resolved boolean NOT NULL DEFAULT false,
  resolved_at timestamp with time zone,
  report_date date NOT NULL DEFAULT CURRENT_DATE,
  is_deleted boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.market_listings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  listing_type text NOT NULL,
  chicken_type text DEFAULT 'broiler'::text,
  quantity_ekor integer,
  weight_kg numeric,
  price_per_kg integer,
  title text NOT NULL,
  description text,
  location text,
  contact_name text NOT NULL,
  contact_wa text NOT NULL,
  status text DEFAULT 'active'::text,
  expires_at timestamp with time zone DEFAULT (now() + '30 days'::interval),
  view_count integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  is_deleted boolean DEFAULT false
);

CREATE TABLE public.market_prices (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  price_date date NOT NULL DEFAULT CURRENT_DATE,
  chicken_type text NOT NULL DEFAULT 'broiler'::text,
  region text NOT NULL DEFAULT 'nasional'::text,
  farm_gate_price integer,
  avg_buy_price integer,
  avg_sell_price integer,
  buyer_price integer,
  broker_margin integer,
  transaction_count integer NOT NULL DEFAULT 1,
  source text NOT NULL DEFAULT 'transaction'::text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  source_url text,
  is_deleted boolean NOT NULL DEFAULT false,
  price_delta integer DEFAULT 0
);

CREATE TABLE public.notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  type text NOT NULL,
  title text NOT NULL,
  body text,
  is_read boolean NOT NULL DEFAULT false,
  action_url text,
  metadata jsonb,
  created_at timestamp with time zone DEFAULT now(),
  priority smallint NOT NULL DEFAULT 1,
  expires_at timestamp with time zone,
  vertical text,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  is_deleted boolean NOT NULL DEFAULT false
);

CREATE TABLE public.orders (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  rpa_id uuid NOT NULL,
  chicken_type text NOT NULL DEFAULT 'broiler'::text,
  requested_count integer NOT NULL,
  requested_weight_kg numeric,
  target_price_per_kg integer,
  preferred_size text,
  requested_date date,
  status text NOT NULL DEFAULT 'open'::text,
  matched_farm_id uuid,
  matched_batch_id uuid,
  notes text,
  is_deleted boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.payment_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  bank_name text NOT NULL,
  account_number text NOT NULL,
  account_name text NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.payments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  sale_id uuid NOT NULL,
  amount bigint NOT NULL,
  payment_date date NOT NULL DEFAULT CURRENT_DATE,
  payment_method text NOT NULL DEFAULT 'transfer'::text,
  reference_no text,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  is_deleted boolean DEFAULT false
);

CREATE TABLE public.peternak_farms (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  farm_name text NOT NULL,
  location text,
  address text,
  latitude numeric,
  longitude numeric,
  capacity integer NOT NULL,
  kandang_count integer DEFAULT 1,
  is_active boolean DEFAULT true,
  notes text,
  is_deleted boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  business_model text DEFAULT 'mandiri'::text,
  mitra_company text,
  mitra_contract_price integer,
  livestock_type text DEFAULT 'ayam_broiler'::text,
  mitra_contract_notes text,
  animal_types _text[] DEFAULT '{}'::text[],
  doc_capacity integer DEFAULT 0
);

CREATE TABLE public.peternak_profiles (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  animal_types _text[] DEFAULT '{}'::text[],
  chicken_sub_types _text[] DEFAULT '{}'::text[],
  ruminansia_types _text[] DEFAULT '{}'::text[],
  kandang_count integer DEFAULT 1,
  doc_capacity integer DEFAULT 0,
  total_ternak integer DEFAULT 0,
  luas_lahan_m2 integer DEFAULT 0,
  catatan text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.peternak_task_instances (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  template_id uuid,
  kandang_name text,
  title text NOT NULL,
  description text,
  task_type text NOT NULL,
  due_date date NOT NULL,
  due_time time without time zone,
  assigned_worker_id uuid,
  assigned_profile_id uuid,
  status text NOT NULL DEFAULT 'pending'::text,
  completed_at timestamp with time zone,
  completed_by_profile_id uuid,
  linked_record_id uuid,
  linked_record_table text,
  notes text,
  is_deleted boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE public.peternak_task_templates (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  kandang_name text,
  title text NOT NULL,
  description text,
  task_type text NOT NULL,
  linked_data_entry boolean NOT NULL DEFAULT false,
  recurring_type text NOT NULL,
  recurring_interval_days integer,
  recurring_days_of_week _int4[],
  start_date date NOT NULL,
  end_date date,
  default_assignee_worker_id uuid,
  is_active boolean NOT NULL DEFAULT true,
  is_deleted boolean NOT NULL DEFAULT false,
  created_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  due_time time without time zone NOT NULL DEFAULT '08:00:00'::time without time zone
);

CREATE TABLE public.plan_configs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  config_key text NOT NULL,
  config_value jsonb NOT NULL,
  description text,
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.pricing_plans (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  role text NOT NULL,
  plan text NOT NULL,
  price integer NOT NULL DEFAULT 0,
  original_price integer DEFAULT 0,
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.profiles (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  auth_user_id uuid NOT NULL,
  full_name text,
  role text NOT NULL DEFAULT 'owner'::text,
  user_type text NOT NULL DEFAULT 'broker'::text,
  phone text,
  avatar_url text,
  is_active boolean NOT NULL DEFAULT true,
  onboarded boolean NOT NULL DEFAULT false,
  last_seen_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  business_model_selected boolean NOT NULL DEFAULT false,
  onboarding_completed_at timestamp with time zone,
  business_limit integer DEFAULT 1,
  additional_slots integer DEFAULT 0
);

CREATE TABLE public.purchases (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  farm_id uuid NOT NULL,
  batch_id uuid,
  quantity integer NOT NULL,
  avg_weight_kg numeric NOT NULL,
  total_weight_kg numeric NOT NULL,
  price_per_kg integer NOT NULL,
  total_cost bigint NOT NULL,
  transport_cost integer NOT NULL DEFAULT 0,
  other_cost integer NOT NULL DEFAULT 0,
  total_modal bigint,
  transaction_date date NOT NULL DEFAULT CURRENT_DATE,
  notes text,
  is_deleted boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.rpa_clients (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  rpa_name text NOT NULL,
  buyer_type text NOT NULL DEFAULT 'rpa'::text,
  contact_person text,
  phone text,
  location text,
  address text,
  payment_terms text NOT NULL DEFAULT 'cash'::text,
  credit_limit bigint NOT NULL DEFAULT 0,
  total_outstanding bigint NOT NULL DEFAULT 0,
  avg_volume_per_order integer,
  preferred_chicken_size text,
  preferred_chicken_type text DEFAULT 'broiler'::text,
  last_deal_price integer,
  reliability_score smallint,
  notes text,
  is_deleted boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  province text
);

CREATE TABLE public.rpa_customer_payments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  invoice_id uuid NOT NULL,
  customer_id uuid,
  amount bigint NOT NULL,
  payment_date date NOT NULL,
  payment_method text DEFAULT 'cash'::text,
  reference_no text,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  is_deleted boolean DEFAULT false
);

CREATE TABLE public.rpa_customers (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  customer_name text NOT NULL,
  customer_type text DEFAULT 'toko_kecil'::text,
  contact_person text,
  phone text,
  address text,
  payment_terms text DEFAULT 'cash'::text,
  credit_limit bigint DEFAULT 0,
  total_outstanding bigint DEFAULT 0,
  total_purchases bigint DEFAULT 0,
  reliability_score smallint,
  notes text,
  is_deleted boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.rpa_invoice_items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  invoice_id uuid NOT NULL,
  product_id uuid,
  product_name text NOT NULL,
  quantity_kg numeric NOT NULL,
  price_per_kg integer NOT NULL,
  cost_per_kg integer DEFAULT 0,
  subtotal bigint
);

CREATE TABLE public.rpa_invoices (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  customer_id uuid,
  invoice_number text NOT NULL,
  customer_name text NOT NULL,
  transaction_date date NOT NULL,
  due_date date,
  total_amount bigint DEFAULT 0,
  total_cost bigint DEFAULT 0,
  net_profit bigint,
  payment_status text DEFAULT 'belum_lunas'::text,
  paid_amount bigint DEFAULT 0,
  remaining_amount bigint,
  notes text,
  is_deleted boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.rpa_payments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  rpa_tenant_id uuid NOT NULL,
  broker_tenant_id uuid NOT NULL,
  amount bigint NOT NULL,
  payment_date date NOT NULL DEFAULT CURRENT_DATE,
  payment_method text NOT NULL DEFAULT 'transfer'::text,
  reference_no text,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  is_deleted boolean DEFAULT false
);

CREATE TABLE public.rpa_products (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  product_name text NOT NULL,
  product_type text DEFAULT 'karkas'::text,
  unit text DEFAULT 'kg'::text,
  sell_price integer DEFAULT 0,
  cost_price integer DEFAULT 0,
  current_stock_kg numeric DEFAULT 0,
  is_active boolean DEFAULT true,
  is_deleted boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.rpa_profiles (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  rpa_name text NOT NULL,
  rpa_type text NOT NULL DEFAULT 'rpa'::text,
  contact_person text,
  phone text,
  address text,
  location text,
  capacity_per_day integer,
  preferred_types _text[],
  is_verified boolean DEFAULT false,
  notes text,
  is_deleted boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  kapasitas_potong_per_hari integer DEFAULT 0,
  product_types _text[] DEFAULT '{}'::text[],
  area_distribusi text,
  catatan text
);

CREATE TABLE public.rpa_purchase_orders (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  rpa_tenant_id uuid NOT NULL,
  broker_tenant_id uuid,
  chicken_type text NOT NULL DEFAULT 'broiler'::text,
  requested_count integer NOT NULL,
  target_weight_kg numeric,
  max_price_per_kg integer,
  required_date date,
  status text NOT NULL DEFAULT 'open'::text,
  notes text,
  is_deleted boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.sales (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  rpa_id uuid NOT NULL,
  purchase_id uuid,
  order_id uuid,
  quantity integer NOT NULL,
  avg_weight_kg numeric NOT NULL,
  total_weight_kg numeric NOT NULL,
  price_per_kg integer NOT NULL,
  total_revenue bigint NOT NULL,
  delivery_cost integer NOT NULL DEFAULT 0,
  net_revenue bigint,
  payment_status text NOT NULL DEFAULT 'belum_lunas'::text,
  paid_amount bigint NOT NULL DEFAULT 0,
  remaining_amount bigint,
  transaction_date date NOT NULL DEFAULT CURRENT_DATE,
  due_date date,
  notes text,
  is_deleted boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.sapi_breeding_animals (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  ear_tag text NOT NULL,
  name text,
  species text NOT NULL DEFAULT 'sapi'::text,
  sex text NOT NULL,
  breed text,
  breed_composition text,
  generation text,
  birth_date date,
  birth_weight_kg numeric,
  birth_type text,
  dam_id uuid,
  sire_id uuid,
  acquisition_type text NOT NULL DEFAULT 'beli'::text,
  source text,
  purpose text,
  parity integer NOT NULL DEFAULT 0,
  selection_class text,
  phenotype_score numeric,
  genetic_notes text,
  origin text,
  entry_date date,
  entry_weight_kg numeric,
  entry_bcs numeric,
  purchase_price_idr bigint,
  kandang_name text,
  status text NOT NULL DEFAULT 'aktif'::text,
  exit_date date,
  latest_weight_kg numeric,
  latest_weight_date date,
  latest_bcs numeric,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  is_deleted boolean NOT NULL DEFAULT false
);

CREATE TABLE public.sapi_breeding_births (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  mating_record_id uuid,
  dam_id uuid NOT NULL,
  partus_date date NOT NULL,
  partus_time time without time zone,
  birth_type text,
  total_born integer NOT NULL DEFAULT 1,
  total_born_alive integer NOT NULL DEFAULT 1,
  total_born_dead integer,
  pedet_sex text,
  pedet_birth_weight_kg numeric,
  pedet_condition text,
  pedet_id uuid,
  is_freemartin_risk boolean NOT NULL DEFAULT false,
  birth_assistance text NOT NULL DEFAULT 'normal'::text,
  colostrum_given boolean DEFAULT true,
  placenta_expelled boolean DEFAULT true,
  retentio_placenta boolean NOT NULL DEFAULT false,
  dam_condition text,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  is_deleted boolean NOT NULL DEFAULT false
);

CREATE TABLE public.sapi_breeding_feed_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  log_date date NOT NULL,
  kandang_name text NOT NULL,
  animal_count integer NOT NULL,
  hijauan_kg numeric NOT NULL DEFAULT 0,
  konsentrat_kg numeric NOT NULL DEFAULT 0,
  dedak_kg numeric NOT NULL DEFAULT 0,
  other_feed_kg numeric NOT NULL DEFAULT 0,
  sisa_pakan_kg numeric NOT NULL DEFAULT 0,
  consumed_kg numeric,
  feed_cost_idr bigint,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  is_deleted boolean NOT NULL DEFAULT false
);

CREATE TABLE public.sapi_breeding_health_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  animal_id uuid NOT NULL,
  log_date date NOT NULL,
  log_type text NOT NULL,
  vaccine_name text,
  drug_name text,
  dose text,
  route text,
  symptoms text,
  diagnosis text,
  treatment text,
  outcome text,
  death_cause text,
  death_weight_kg numeric,
  loss_value_idr bigint,
  handled_by text,
  notes text,
  recorded_by text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  is_deleted boolean NOT NULL DEFAULT false
);

CREATE TABLE public.sapi_breeding_mating_records (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  dam_id uuid NOT NULL,
  sire_id uuid,
  method text NOT NULL,
  bull_name text,
  semen_code text,
  inseminator_name text,
  repeat_ib_count integer NOT NULL DEFAULT 1,
  sync_protocol text,
  estrus_date date,
  mating_date date NOT NULL,
  est_partus_date date,
  pregnancy_confirmed boolean DEFAULT false,
  pregnancy_confirm_date date,
  pregnancy_method text,
  fetus_count integer,
  status text NOT NULL DEFAULT 'menunggu'::text,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  is_deleted boolean NOT NULL DEFAULT false
);

CREATE TABLE public.sapi_breeding_sales (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  animal_id uuid NOT NULL,
  sale_date date NOT NULL,
  product_type text NOT NULL,
  buyer_name text NOT NULL,
  buyer_contact text,
  buyer_type text,
  sale_weight_kg numeric,
  price_type text,
  price_amount bigint NOT NULL,
  total_revenue_idr bigint NOT NULL,
  payment_method text,
  is_paid boolean NOT NULL DEFAULT false,
  paid_date date,
  invoice_number text,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  is_deleted boolean NOT NULL DEFAULT false
);

CREATE TABLE public.sapi_breeding_weight_records (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  animal_id uuid NOT NULL,
  weigh_date date NOT NULL,
  weight_kg numeric NOT NULL,
  age_days integer,
  adg_since_last numeric,
  bcs numeric,
  weigh_method text NOT NULL DEFAULT 'timbang_langsung'::text,
  chest_girth_cm numeric,
  notes text,
  recorded_by text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  is_deleted boolean NOT NULL DEFAULT false
);

CREATE TABLE public.sapi_kandangs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  batch_id uuid NOT NULL,
  name text NOT NULL,
  capacity integer NOT NULL DEFAULT 0,
  panjang_m numeric,
  lebar_m numeric,
  luas_m2 numeric,
  is_holding boolean NOT NULL DEFAULT false,
  notes text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  grid_x integer,
  grid_y integer
);

CREATE TABLE public.sapi_penggemukan_animals (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  batch_id uuid NOT NULL,
  ear_tag text NOT NULL,
  species text NOT NULL DEFAULT 'sapi'::text,
  breed text,
  sex text NOT NULL,
  birth_date date,
  entry_age_months integer,
  age_confidence text NOT NULL DEFAULT 'estimasi'::text,
  acquisition_type text NOT NULL DEFAULT 'beli'::text,
  entry_date date NOT NULL,
  entry_weight_kg numeric NOT NULL,
  entry_bcs numeric,
  entry_condition text,
  purchase_price_idr bigint,
  source text,
  kandang_slot text,
  quarantine_start date,
  quarantine_end date,
  quarantine_notes text,
  status text NOT NULL DEFAULT 'active'::text,
  exit_date date,
  latest_weight_kg numeric,
  latest_weight_date date,
  latest_bcs numeric,
  kandang_id uuid,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  is_deleted boolean NOT NULL DEFAULT false
);

CREATE TABLE public.sapi_penggemukan_batches (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  batch_code text NOT NULL,
  kandang_name text NOT NULL,
  start_date date NOT NULL,
  target_end_date date,
  end_date date,
  batch_purpose text NOT NULL DEFAULT 'potong'::text,
  total_animals integer NOT NULL DEFAULT 0,
  alive_count integer,
  sold_count integer,
  mortality_count integer NOT NULL DEFAULT 0,
  avg_adg_gram numeric,
  avg_fcr numeric,
  avg_entry_weight_kg numeric,
  avg_exit_weight_kg numeric,
  total_feed_cost_idr bigint,
  total_revenue_idr bigint,
  total_cogs_idr bigint,
  net_profit_idr bigint,
  rc_ratio numeric,
  status text NOT NULL DEFAULT 'active'::text,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  is_deleted boolean NOT NULL DEFAULT false
);

CREATE TABLE public.sapi_penggemukan_feed_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  batch_id uuid NOT NULL,
  log_date date NOT NULL,
  kandang_name text NOT NULL,
  animal_count integer NOT NULL,
  hijauan_kg numeric NOT NULL DEFAULT 0,
  konsentrat_kg numeric NOT NULL DEFAULT 0,
  dedak_kg numeric NOT NULL DEFAULT 0,
  other_feed_kg numeric NOT NULL DEFAULT 0,
  sisa_pakan_kg numeric NOT NULL DEFAULT 0,
  consumed_kg numeric,
  feed_cost_idr bigint,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  is_deleted boolean NOT NULL DEFAULT false
);

CREATE TABLE public.sapi_penggemukan_health_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  animal_id uuid NOT NULL,
  batch_id uuid NOT NULL,
  log_date date NOT NULL,
  log_type text NOT NULL,
  symptoms text,
  action_taken text,
  medicine_name text,
  medicine_dose text,
  handled_by text,
  outcome text,
  vaccine_name text,
  vaccine_next_due date,
  death_cause text,
  death_weight_kg numeric,
  loss_value_idr bigint,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  is_deleted boolean NOT NULL DEFAULT false
);

CREATE TABLE public.sapi_penggemukan_sales (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  batch_id uuid NOT NULL,
  sale_date date NOT NULL,
  buyer_name text NOT NULL,
  buyer_type text,
  buyer_contact text,
  animal_ids _uuid[] NOT NULL,
  animal_count integer NOT NULL,
  total_weight_kg numeric NOT NULL,
  avg_weight_kg numeric,
  price_type text,
  price_amount bigint NOT NULL,
  total_revenue_idr bigint NOT NULL,
  payment_method text,
  is_paid boolean NOT NULL DEFAULT false,
  paid_date date,
  has_skkh boolean NOT NULL DEFAULT false,
  has_surat_jalan boolean NOT NULL DEFAULT false,
  invoice_number text,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  is_deleted boolean NOT NULL DEFAULT false
);

CREATE TABLE public.sapi_penggemukan_weight_records (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  animal_id uuid NOT NULL,
  batch_id uuid NOT NULL,
  weigh_date date NOT NULL,
  days_in_farm integer,
  weight_kg numeric NOT NULL,
  bcs numeric,
  adg_since_last numeric,
  weigh_method text NOT NULL DEFAULT 'timbang_langsung'::text,
  chest_girth_cm numeric,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  is_deleted boolean NOT NULL DEFAULT false
);

CREATE TABLE public.sembako_customers (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  customer_name text NOT NULL,
  customer_type text DEFAULT 'warung'::text,
  contact_person text,
  phone text,
  address text,
  area text,
  payment_terms text DEFAULT 'cash'::text,
  credit_limit bigint DEFAULT 0,
  total_outstanding bigint DEFAULT 0,
  total_purchases bigint DEFAULT 0,
  reliability_score smallint,
  notes text,
  is_deleted boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.sembako_deliveries (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  sale_id uuid,
  employee_id uuid,
  vehicle_type text,
  vehicle_plate text,
  driver_name text,
  delivery_date date NOT NULL,
  delivery_area text,
  delivery_cost integer DEFAULT 0,
  other_cost integer DEFAULT 0,
  status text DEFAULT 'pending'::text,
  notes text,
  is_deleted boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.sembako_employees (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  full_name text NOT NULL,
  role text NOT NULL,
  phone text,
  address text,
  join_date date,
  salary_type text DEFAULT 'bulanan'::text,
  base_salary integer DEFAULT 0,
  commission_pct numeric DEFAULT 0,
  trip_rate integer DEFAULT 0,
  status text DEFAULT 'aktif'::text,
  notes text,
  is_deleted boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.sembako_expenses (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  category text NOT NULL,
  description text NOT NULL,
  amount bigint NOT NULL,
  expense_date date NOT NULL,
  notes text,
  is_deleted boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.sembako_payments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  sale_id uuid NOT NULL,
  customer_id uuid,
  amount bigint NOT NULL,
  payment_date date NOT NULL,
  payment_method text DEFAULT 'cash'::text,
  reference_no text,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  is_deleted boolean DEFAULT false,
  reference_number text
);

CREATE TABLE public.sembako_payroll (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  employee_id uuid NOT NULL,
  period_type text NOT NULL,
  period_date date NOT NULL,
  work_days integer DEFAULT 0,
  trip_count integer DEFAULT 0,
  sales_amount bigint DEFAULT 0,
  base_amount integer DEFAULT 0,
  commission_amount integer DEFAULT 0,
  bonus integer DEFAULT 0,
  deduction integer DEFAULT 0,
  total_pay integer,
  payment_status text DEFAULT 'pending'::text,
  paid_at timestamp with time zone,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  is_deleted boolean DEFAULT false
);

CREATE TABLE public.sembako_products (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  product_name text NOT NULL,
  category text NOT NULL,
  unit text NOT NULL DEFAULT 'kg'::text,
  current_stock numeric DEFAULT 0,
  avg_buy_price integer DEFAULT 0,
  sell_price integer DEFAULT 0,
  min_stock_alert numeric DEFAULT 0,
  barcode text,
  notes text,
  is_active boolean DEFAULT true,
  is_deleted boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  secondary_unit text,
  conversion_rate numeric
);

CREATE TABLE public.sembako_sale_items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  sale_id uuid NOT NULL,
  product_id uuid,
  product_name text NOT NULL,
  unit text NOT NULL,
  quantity numeric NOT NULL,
  price_per_unit integer NOT NULL,
  cogs_per_unit integer DEFAULT 0,
  subtotal bigint,
  cogs_total bigint
);

CREATE TABLE public.sembako_sales (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  customer_id uuid,
  delivery_id uuid,
  invoice_number text NOT NULL,
  customer_name text NOT NULL,
  transaction_date date NOT NULL,
  due_date date,
  total_amount bigint DEFAULT 0,
  total_cogs bigint DEFAULT 0,
  gross_profit bigint,
  delivery_cost integer DEFAULT 0,
  other_cost integer DEFAULT 0,
  net_profit bigint,
  payment_status text DEFAULT 'belum_lunas'::text,
  paid_amount bigint DEFAULT 0,
  remaining_amount bigint,
  notes text,
  is_deleted boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.sembako_stock_batches (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  product_id uuid NOT NULL,
  supplier_id uuid,
  batch_code text,
  qty_masuk numeric NOT NULL,
  qty_sisa numeric NOT NULL,
  buy_price integer NOT NULL,
  total_cost bigint,
  purchase_date date NOT NULL,
  expiry_date date,
  notes text,
  is_deleted boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.sembako_stock_out (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  product_id uuid NOT NULL,
  batch_id uuid NOT NULL,
  sale_item_id uuid,
  qty_keluar numeric NOT NULL,
  buy_price integer NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  sale_id uuid,
  is_deleted boolean DEFAULT false
);

CREATE TABLE public.sembako_supplier_payments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  supplier_id uuid NOT NULL,
  amount bigint NOT NULL,
  payment_date date NOT NULL DEFAULT CURRENT_DATE,
  payment_method text NOT NULL,
  reference_number text,
  notes text,
  is_deleted boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.sembako_suppliers (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  supplier_name text NOT NULL,
  supplier_type text DEFAULT 'petani'::text,
  contact_person text,
  phone text,
  address text,
  products_supplied _text[],
  payment_terms text DEFAULT 'cash'::text,
  total_outstanding bigint DEFAULT 0,
  notes text,
  is_deleted boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.stock_listings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  peternak_tenant_id uuid NOT NULL,
  cycle_id uuid,
  chicken_type text NOT NULL DEFAULT 'broiler'::text,
  available_count integer NOT NULL,
  estimated_weight_kg numeric,
  estimated_harvest_date date,
  asking_price_per_kg integer,
  status text NOT NULL DEFAULT 'available'::text,
  visible_to text NOT NULL DEFAULT 'connected'::text,
  notes text,
  expires_at timestamp with time zone,
  is_deleted boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.subscription_invoices (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  invoice_number text,
  amount integer NOT NULL,
  plan text NOT NULL,
  billing_period text,
  billing_months integer DEFAULT 1,
  status text NOT NULL DEFAULT 'pending'::text,
  transfer_proof_url text,
  bank_name text,
  transfer_date date,
  confirmed_by uuid,
  confirmed_at timestamp with time zone,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  payment_proof_url text,
  payment_method text DEFAULT 'transfer'::text,
  xendit_invoice_id text,
  xendit_payment_url text,
  paid_at timestamp with time zone
);

CREATE TABLE public.team_invitations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  invited_by uuid NOT NULL,
  email text,
  role text NOT NULL,
  token text NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'::text),
  status text NOT NULL DEFAULT 'pending'::text,
  expires_at timestamp with time zone NOT NULL DEFAULT (now() + '7 days'::interval),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  is_deleted boolean DEFAULT false
);

CREATE TABLE public.tenant_memberships (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  auth_user_id uuid NOT NULL,
  tenant_id uuid NOT NULL,
  role text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  full_name text
);

CREATE TABLE public.tenants (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  business_name text NOT NULL,
  owner_name text,
  phone text,
  location text,
  plan text NOT NULL DEFAULT 'starter'::text,
  is_active boolean NOT NULL DEFAULT true,
  trial_ends_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  business_vertical text DEFAULT 'poultry_broker'::text,
  is_hidden_beta boolean DEFAULT false,
  kandang_limit integer DEFAULT 1,
  sub_type text,
  chicken_types _text[] DEFAULT '{}'::text[],
  animal_types _text[] DEFAULT '{}'::text[],
  area_operasi text,
  target_volume_monthly integer DEFAULT 0,
  base_livestock_type text DEFAULT 'broiler'::text,
  addon_livestock_types _text[] DEFAULT '{}'::text[],
  plan_expires_at timestamp with time zone,
  province text
);

CREATE TABLE public.vehicle_expenses (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  vehicle_id uuid NOT NULL,
  expense_type text NOT NULL,
  amount bigint NOT NULL,
  description text,
  expense_date date NOT NULL DEFAULT CURRENT_DATE,
  is_deleted boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.vehicles (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  vehicle_type text NOT NULL,
  vehicle_plate text NOT NULL,
  brand text,
  year integer,
  capacity_ekor integer,
  capacity_kg numeric,
  ownership text NOT NULL DEFAULT 'milik_sendiri'::text,
  rental_cost integer,
  rental_owner text,
  status text NOT NULL DEFAULT 'aktif'::text,
  last_service_date date,
  notes text,
  is_deleted boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.waitlist_signups (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  email text NOT NULL,
  vertical text,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.worker_payments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  cycle_id uuid NOT NULL,
  worker_id uuid NOT NULL,
  payment_type text,
  amount bigint NOT NULL,
  payment_date date NOT NULL,
  notes text,
  is_deleted boolean DEFAULT false
);

CREATE TABLE public.xendit_config (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  is_active boolean DEFAULT false,
  secret_key_encrypted text,
  webhook_token text,
  success_redirect_url text,
  failure_redirect_url text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE POLICY "sapi_breeding_feed_logs_all" ON public.sapi_breeding_feed_logs FOR ALL TO public
  USING ((is_my_tenant(tenant_id) OR is_superadmin()));

CREATE POLICY "tenant_sapi_breeding_feed_logs_delete" ON public.sapi_breeding_feed_logs FOR DELETE TO public
  USING ((tenant_id IN ( SELECT profiles.tenant_id
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid()))));

CREATE POLICY "tenant_sapi_breeding_feed_logs_insert" ON public.sapi_breeding_feed_logs FOR INSERT TO public
  WITH CHECK ((tenant_id IN ( SELECT profiles.tenant_id
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid()))));

CREATE POLICY "tenant_sapi_breeding_feed_logs_select" ON public.sapi_breeding_feed_logs FOR SELECT TO public
  USING ((tenant_id IN ( SELECT profiles.tenant_id
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid()))));

CREATE POLICY "tenant_sapi_breeding_feed_logs_update" ON public.sapi_breeding_feed_logs FOR UPDATE TO public
  USING ((tenant_id IN ( SELECT profiles.tenant_id
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid()))));

CREATE POLICY "sapi_breeding_sales_all" ON public.sapi_breeding_sales FOR ALL TO public
  USING ((is_my_tenant(tenant_id) OR is_superadmin()));

CREATE POLICY "tenant_sapi_breeding_sales_delete" ON public.sapi_breeding_sales FOR DELETE TO public
  USING ((tenant_id IN ( SELECT profiles.tenant_id
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid()))));

CREATE POLICY "tenant_sapi_breeding_sales_insert" ON public.sapi_breeding_sales FOR INSERT TO public
  WITH CHECK ((tenant_id IN ( SELECT profiles.tenant_id
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid()))));

CREATE POLICY "tenant_sapi_breeding_sales_select" ON public.sapi_breeding_sales FOR SELECT TO public
  USING ((tenant_id IN ( SELECT profiles.tenant_id
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid()))));

CREATE POLICY "tenant_sapi_breeding_sales_update" ON public.sapi_breeding_sales FOR UPDATE TO public
  USING ((tenant_id IN ( SELECT profiles.tenant_id
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid()))));

CREATE POLICY "audit_logs_owner" ON public.global_audit_logs FOR SELECT TO public
  USING (is_my_tenant(tenant_id));

CREATE POLICY "audit_logs_superadmin" ON public.global_audit_logs FOR SELECT TO public
  USING (is_superadmin());

CREATE POLICY "Tenant Isolation Policy" ON public.sembako_supplier_payments FOR ALL TO public
  USING ((tenant_id = ( SELECT profiles.tenant_id
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid())
 LIMIT 1)));

CREATE POLICY "superadmin_delete" ON public.sembako_supplier_payments FOR DELETE TO public
  USING ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.auth_user_id = auth.uid()) AND (profiles.role = 'superadmin'::text)))));

CREATE POLICY "Peternak Task Templates Access" ON public.peternak_task_templates FOR ALL TO public
  USING ((tenant_id = my_tenant_id()))
  WITH CHECK (((tenant_id = my_tenant_id()) AND (my_role() = ANY (ARRAY['owner'::text, 'manajer'::text]))));

CREATE POLICY "Peternak Task Instances Manage" ON public.peternak_task_instances FOR ALL TO public
  USING (((tenant_id = my_tenant_id()) AND (my_role() = ANY (ARRAY['owner'::text, 'manajer'::text]))))
  WITH CHECK (((tenant_id = my_tenant_id()) AND (my_role() = ANY (ARRAY['owner'::text, 'manajer'::text]))));

CREATE POLICY "Peternak Task Instances Select" ON public.peternak_task_instances FOR SELECT TO public
  USING ((tenant_id = my_tenant_id()));

CREATE POLICY "Peternak Task Instances Staff Update" ON public.peternak_task_instances FOR UPDATE TO public
  USING (((tenant_id = my_tenant_id()) AND ((assigned_profile_id = ( SELECT profiles.id
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid())
 LIMIT 1)) OR (my_role() = ANY (ARRAY['owner'::text, 'manajer'::text])))))
  WITH CHECK (((tenant_id = my_tenant_id()) AND ((assigned_profile_id = ( SELECT profiles.id
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid())
 LIMIT 1)) OR (my_role() = ANY (ARRAY['owner'::text, 'manajer'::text])))));

CREATE POLICY "access_task_instances_v2" ON public.peternak_task_instances FOR ALL TO public
  USING ((is_my_tenant(tenant_id) OR is_superadmin()));

CREATE POLICY "Users can insert own error logs" ON public.ai_error_logs FOR INSERT TO public
  WITH CHECK ((auth.uid() = profile_id));

CREATE POLICY "Tenant Isolation Policy" ON public.payments FOR ALL TO public
  USING ((tenant_id IN ( SELECT profiles.tenant_id
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid()))))
  WITH CHECK ((tenant_id IN ( SELECT profiles.tenant_id
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid()))));

CREATE POLICY "Semua user bisa melihat rekening pembayaran" ON public.payment_settings FOR SELECT TO public
  USING ((auth.role() = 'authenticated'::text));

CREATE POLICY "authenticated_read_payment_settings" ON public.payment_settings FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "pay_settings_write" ON public.payment_settings FOR ALL TO public
  USING (is_superadmin())
  WITH CHECK (is_superadmin());

CREATE POLICY "superadmin_manage_payment_settings" ON public.payment_settings FOR ALL TO authenticated
  USING (is_superadmin())
  WITH CHECK (is_superadmin());

CREATE POLICY "superadmin_payment_settings" ON public.payment_settings FOR ALL TO authenticated
  USING (is_superadmin())
  WITH CHECK (is_superadmin());

CREATE POLICY "loss_all" ON public.loss_reports FOR ALL TO public
  USING (((tenant_id = my_tenant_id()) OR is_superadmin()))
  WITH CHECK ((tenant_id = my_tenant_id()));

CREATE POLICY "Users can manage their tenant's kd_kandangs" ON public.kd_kandangs FOR ALL TO authenticated
  USING ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.tenant_id = kd_kandangs.tenant_id) AND (profiles.auth_user_id = auth.uid())))));

CREATE POLICY "Tenant Isolation Policy" ON public.purchases FOR ALL TO authenticated
  USING (((tenant_id IN ( SELECT profiles.tenant_id
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid()))) OR is_superadmin()))
  WITH CHECK ((tenant_id IN ( SELECT profiles.tenant_id
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid()))));

CREATE POLICY "purchases_select" ON public.purchases FOR SELECT TO public
  USING (((tenant_id = my_tenant_id()) OR is_superadmin()));

CREATE POLICY "purchases_update" ON public.purchases FOR UPDATE TO public
  USING (((tenant_id = my_tenant_id()) OR is_superadmin()))
  WITH CHECK (((tenant_id = my_tenant_id()) AND ((my_role() = ANY (ARRAY['owner'::text, 'staff'::text])) OR is_superadmin())));

CREATE POLICY "purchases_write" ON public.purchases FOR INSERT TO public
  WITH CHECK (((tenant_id = my_tenant_id()) AND (my_role() = ANY (ARRAY['owner'::text, 'staff'::text]))));

CREATE POLICY "expenses_all" ON public.extra_expenses FOR ALL TO public
  USING (((tenant_id = my_tenant_id()) OR is_superadmin()))
  WITH CHECK ((tenant_id = my_tenant_id()));

CREATE POLICY "Tenant Isolation Policy" ON public.farms FOR ALL TO public
  USING ((tenant_id IN ( SELECT profiles.tenant_id
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid()))))
  WITH CHECK ((tenant_id IN ( SELECT profiles.tenant_id
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid()))));

CREATE POLICY "farms_select" ON public.farms FOR SELECT TO public
  USING (((tenant_id = my_tenant_id()) OR is_superadmin()));

CREATE POLICY "farms_update" ON public.farms FOR UPDATE TO public
  USING (((tenant_id = my_tenant_id()) OR is_superadmin()))
  WITH CHECK (((tenant_id = my_tenant_id()) AND ((my_role() = ANY (ARRAY['owner'::text, 'staff'::text])) OR is_superadmin())));

CREATE POLICY "farms_write" ON public.farms FOR INSERT TO public
  WITH CHECK (((tenant_id = my_tenant_id()) AND (my_role() = ANY (ARRAY['owner'::text, 'staff'::text]))));

CREATE POLICY "Tenant Isolation Policy" ON public.rpa_clients FOR ALL TO public
  USING ((tenant_id IN ( SELECT profiles.tenant_id
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid()))))
  WITH CHECK ((tenant_id IN ( SELECT profiles.tenant_id
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid()))));

CREATE POLICY "Tenant Isolation Policy" ON public.sales FOR ALL TO public
  USING (((tenant_id IN ( SELECT profiles.tenant_id
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid()))) OR is_superadmin()))
  WITH CHECK ((tenant_id IN ( SELECT profiles.tenant_id
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid()))));

CREATE POLICY "sales_delete" ON public.sales FOR DELETE TO public
  USING (((tenant_id = my_tenant_id()) AND (my_role() = 'owner'::text)));

CREATE POLICY "sales_select" ON public.sales FOR SELECT TO public
  USING (((tenant_id = my_tenant_id()) OR is_superadmin()));

CREATE POLICY "sales_update" ON public.sales FOR UPDATE TO public
  USING (((tenant_id = my_tenant_id()) OR is_superadmin()))
  WITH CHECK (((tenant_id = my_tenant_id()) AND ((my_role() = ANY (ARRAY['owner'::text, 'staff'::text])) OR is_superadmin())));

CREATE POLICY "sales_write" ON public.sales FOR INSERT TO public
  WITH CHECK (((tenant_id = my_tenant_id()) AND (my_role() = ANY (ARRAY['owner'::text, 'staff'::text]))));

CREATE POLICY "Allow authenticated users to insert their own profile" ON public.profiles FOR INSERT TO authenticated
  WITH CHECK ((auth.uid() = auth_user_id));

CREATE POLICY "Same tenant members can read profiles" ON public.profiles FOR SELECT TO authenticated
  USING ((tenant_id IN ( SELECT get_my_tenant_ids() AS get_my_tenant_ids)));

CREATE POLICY "Tenant Isolation Policy" ON public.profiles FOR ALL TO public
  USING ((auth_user_id = auth.uid()))
  WITH CHECK ((auth_user_id = auth.uid()));

CREATE POLICY "Users can read own profile" ON public.profiles FOR SELECT TO public
  USING ((auth_user_id = auth.uid()));

CREATE POLICY "profile_insert" ON public.profiles FOR INSERT TO public
  WITH CHECK (is_superadmin());

CREATE POLICY "profile_select" ON public.profiles FOR SELECT TO public
  USING (((auth_user_id = auth.uid()) OR is_superadmin()));

CREATE POLICY "profile_superadmin_all" ON public.profiles FOR ALL TO public
  USING (is_superadmin())
  WITH CHECK (is_superadmin());

CREATE POLICY "profile_update_self" ON public.profiles FOR UPDATE TO public
  USING ((auth_user_id = auth.uid()))
  WITH CHECK ((auth_user_id = auth.uid()));

CREATE POLICY "same_tenant_read" ON public.profiles FOR SELECT TO authenticated
  USING (((auth_user_id = auth.uid()) OR (tenant_id = ANY (auth_user_tenant_ids()))));

CREATE POLICY "superadmin_read_all_profiles" ON public.profiles FOR SELECT TO authenticated
  USING (((auth_user_id = auth.uid()) OR is_superadmin()));

CREATE POLICY "superadmin_update_profiles" ON public.profiles FOR UPDATE TO authenticated
  USING (is_superadmin())
  WITH CHECK (is_superadmin());

CREATE POLICY "Tenant Isolation Policy" ON public.deliveries FOR ALL TO public
  USING ((tenant_id IN ( SELECT profiles.tenant_id
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid()))))
  WITH CHECK ((tenant_id IN ( SELECT profiles.tenant_id
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid()))));

CREATE POLICY "Users can view deliveries for their tenant" ON public.deliveries FOR SELECT TO authenticated
  USING ((tenant_id = ( SELECT profiles.tenant_id
   FROM profiles
  WHERE (profiles.id = auth.uid()))));

CREATE POLICY "feed_stocks_all" ON public.feed_stocks FOR ALL TO public
  USING (((tenant_id = my_tenant_id()) OR is_superadmin()))
  WITH CHECK ((tenant_id = my_tenant_id()));

CREATE POLICY "listings_select" ON public.stock_listings FOR SELECT TO public
  USING (((peternak_tenant_id = my_tenant_id()) OR (visible_to = 'public'::text) OR is_superadmin() OR ((visible_to = 'connected'::text) AND (EXISTS ( SELECT 1
   FROM broker_connections
  WHERE ((broker_connections.peternak_tenant_id = stock_listings.peternak_tenant_id) AND (broker_connections.broker_tenant_id = my_tenant_id()) AND (broker_connections.status = 'active'::text)))))));

CREATE POLICY "listings_write" ON public.stock_listings FOR ALL TO public
  USING (((peternak_tenant_id = my_tenant_id()) OR is_superadmin()))
  WITH CHECK ((peternak_tenant_id = my_tenant_id()));

CREATE POLICY "rpa_purchase_orders_all" ON public.rpa_purchase_orders FOR ALL TO public
  USING (((rpa_tenant_id = my_tenant_id()) OR (broker_tenant_id = my_tenant_id()) OR is_superadmin()))
  WITH CHECK (((rpa_tenant_id = my_tenant_id()) OR (broker_tenant_id = my_tenant_id())));

CREATE POLICY "superadmin_update" ON public.rpa_purchase_orders FOR UPDATE TO public
  USING ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.auth_user_id = auth.uid()) AND (profiles.role = 'superadmin'::text)))));

CREATE POLICY "daily_records_all" ON public.daily_records FOR ALL TO public
  USING (((tenant_id = my_tenant_id()) OR is_superadmin()))
  WITH CHECK (((tenant_id = my_tenant_id()) AND (my_role() = ANY (ARRAY['owner'::text, 'staff'::text]))));

CREATE POLICY "rpa_payments_all" ON public.rpa_payments FOR ALL TO public
  USING (((rpa_tenant_id = my_tenant_id()) OR (broker_tenant_id = my_tenant_id()) OR is_superadmin()))
  WITH CHECK (((rpa_tenant_id = my_tenant_id()) OR (broker_tenant_id = my_tenant_id())));

CREATE POLICY "superadmin_update" ON public.rpa_payments FOR UPDATE TO public
  USING ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.auth_user_id = auth.uid()) AND (profiles.role = 'superadmin'::text)))));

CREATE POLICY "breeding_cycles_all" ON public.breeding_cycles FOR ALL TO public
  USING (((tenant_id = my_tenant_id()) OR is_superadmin()))
  WITH CHECK (((tenant_id = my_tenant_id()) AND (my_role() = ANY (ARRAY['owner'::text, 'staff'::text]))));

CREATE POLICY "rpa_profiles_all" ON public.rpa_profiles FOR ALL TO public
  USING (((tenant_id = my_tenant_id()) OR is_superadmin()))
  WITH CHECK (((tenant_id = my_tenant_id()) AND (my_role() = ANY (ARRAY['owner'::text, 'staff'::text]))));

CREATE POLICY "Tenant Isolation Policy" ON public.domba_kandangs FOR ALL TO public
  USING ((tenant_id IN ( SELECT profiles.tenant_id
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid()))))
  WITH CHECK ((tenant_id IN ( SELECT profiles.tenant_id
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid()))));

CREATE POLICY "Tenant Isolation Policy" ON public.domba_penggemukan_batches FOR ALL TO public
  USING ((tenant_id IN ( SELECT profiles.tenant_id
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid()))))
  WITH CHECK ((tenant_id IN ( SELECT profiles.tenant_id
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid()))));

CREATE POLICY "Tenant Isolation Policy" ON public.domba_penggemukan_health_logs FOR ALL TO public
  USING ((tenant_id IN ( SELECT profiles.tenant_id
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid()))))
  WITH CHECK ((tenant_id IN ( SELECT profiles.tenant_id
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid()))));

CREATE POLICY "Tenant Isolation Policy" ON public.domba_penggemukan_sales FOR ALL TO public
  USING ((tenant_id IN ( SELECT profiles.tenant_id
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid()))))
  WITH CHECK ((tenant_id IN ( SELECT profiles.tenant_id
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid()))));

CREATE POLICY "Tenant Isolation Policy" ON public.domba_breeding_animals FOR ALL TO public
  USING ((tenant_id IN ( SELECT profiles.tenant_id
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid()))))
  WITH CHECK ((tenant_id IN ( SELECT profiles.tenant_id
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid()))));

CREATE POLICY "Tenant Isolation Policy" ON public.domba_breeding_mating_records FOR ALL TO public
  USING ((tenant_id IN ( SELECT profiles.tenant_id
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid()))))
  WITH CHECK ((tenant_id IN ( SELECT profiles.tenant_id
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid()))));

CREATE POLICY "Tenant Isolation Policy" ON public.domba_breeding_births FOR ALL TO public
  USING ((tenant_id IN ( SELECT profiles.tenant_id
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid()))))
  WITH CHECK ((tenant_id IN ( SELECT profiles.tenant_id
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid()))));

CREATE POLICY "Tenant Isolation Policy" ON public.domba_breeding_weight_records FOR ALL TO public
  USING ((tenant_id IN ( SELECT profiles.tenant_id
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid()))))
  WITH CHECK ((tenant_id IN ( SELECT profiles.tenant_id
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid()))));

CREATE POLICY "Tenant Isolation Policy" ON public.domba_breeding_health_logs FOR ALL TO public
  USING ((tenant_id IN ( SELECT profiles.tenant_id
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid()))))
  WITH CHECK ((tenant_id IN ( SELECT profiles.tenant_id
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid()))));

CREATE POLICY "Tenant Isolation Policy" ON public.domba_breeding_feed_logs FOR ALL TO public
  USING ((tenant_id IN ( SELECT profiles.tenant_id
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid()))))
  WITH CHECK ((tenant_id IN ( SELECT profiles.tenant_id
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid()))));

CREATE POLICY "Tenant Isolation Policy" ON public.domba_breeding_sales FOR ALL TO public
  USING ((tenant_id IN ( SELECT profiles.tenant_id
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid()))))
  WITH CHECK ((tenant_id IN ( SELECT profiles.tenant_id
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid()))));

CREATE POLICY "Tenant Isolation Policy" ON public.domba_penggemukan_animals FOR ALL TO public
  USING ((tenant_id IN ( SELECT profiles.tenant_id
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid()))))
  WITH CHECK ((tenant_id IN ( SELECT profiles.tenant_id
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid()))));

CREATE POLICY "Tenant Isolation Policy" ON public.domba_penggemukan_feed_logs FOR ALL TO public
  USING ((tenant_id IN ( SELECT profiles.tenant_id
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid()))))
  WITH CHECK ((tenant_id IN ( SELECT profiles.tenant_id
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid()))));

CREATE POLICY "Admin Write Market Prices" ON public.market_prices FOR ALL TO authenticated
  USING ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.auth_user_id = auth.uid()) AND (profiles.role = 'superadmin'::text)))));

CREATE POLICY "Allow admins to manage market prices" ON public.market_prices FOR ALL TO authenticated
  USING ((((auth.jwt() ->> 'email'::text) = 'fahruhernansakti@gmail.com'::text) OR (EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.auth_user_id = auth.uid()) AND (profiles.role = 'superadmin'::text))))));

CREATE POLICY "Allow public read access for market prices" ON public.market_prices FOR SELECT TO anon, authenticated
  USING ((is_deleted = false));

CREATE POLICY "Allow service role full access to market prices" ON public.market_prices FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated Insert/Update Market Prices" ON public.market_prices FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Public Read Market Prices" ON public.market_prices FOR SELECT TO public
  USING (true);

CREATE POLICY "Scraper Anon Insert Arboge" ON public.market_prices FOR INSERT TO anon
  WITH CHECK ((source = ANY (ARRAY['auto_scraper'::text, 'arboge_realisasi'::text, 'arboge_referensi'::text])));

CREATE POLICY "Scraper can insert market prices" ON public.market_prices FOR INSERT TO anon
  WITH CHECK ((source = 'auto_scraper'::text));

CREATE POLICY "market_read" ON public.market_prices FOR SELECT TO public
  USING (true);

CREATE POLICY "market_write_superadmin" ON public.market_prices FOR ALL TO public
  USING (is_superadmin())
  WITH CHECK (is_superadmin());

CREATE POLICY "Tenant Isolation Policy" ON public.vehicles FOR ALL TO public
  USING ((tenant_id IN ( SELECT profiles.tenant_id
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid()))))
  WITH CHECK ((tenant_id IN ( SELECT profiles.tenant_id
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid()))));

CREATE POLICY "Tenant Isolation Policy" ON public.drivers FOR ALL TO public
  USING ((tenant_id IN ( SELECT profiles.tenant_id
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid()))))
  WITH CHECK ((tenant_id IN ( SELECT profiles.tenant_id
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid()))));

CREATE POLICY "Users can view drivers for their tenant" ON public.drivers FOR SELECT TO authenticated
  USING ((tenant_id = ( SELECT profiles.tenant_id
   FROM profiles
  WHERE (profiles.id = auth.uid()))));

CREATE POLICY "vehicle_expenses_all" ON public.vehicle_expenses FOR ALL TO public
  USING (((tenant_id = my_tenant_id()) OR is_superadmin()))
  WITH CHECK (((tenant_id = my_tenant_id()) AND (my_role() = ANY (ARRAY['owner'::text, 'staff'::text]))));

CREATE POLICY "Public can read invitations by token" ON public.team_invitations FOR SELECT TO anon, authenticated
  USING ((status = 'pending'::text));

CREATE POLICY "anon_read_invitations" ON public.team_invitations FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "invitations_tenant" ON public.team_invitations FOR ALL TO public
  USING (((tenant_id = my_tenant_id()) OR is_superadmin()))
  WITH CHECK ((tenant_id = my_tenant_id()));

CREATE POLICY "invitations_token_lookup" ON public.team_invitations FOR SELECT TO public
  USING (((status = 'pending'::text) AND (expires_at > now())));

CREATE POLICY "team_invitations_insert" ON public.team_invitations FOR INSERT TO authenticated
  WITH CHECK ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.auth_user_id = auth.uid()) AND (profiles.role = 'owner'::text) AND (profiles.tenant_id = team_invitations.tenant_id)))));

CREATE POLICY "team_invitations_management_policy" ON public.team_invitations FOR ALL TO authenticated
  USING ((tenant_id IN ( SELECT profiles.tenant_id
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid()))))
  WITH CHECK (((tenant_id IN ( SELECT profiles.tenant_id
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid()))) AND (EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.auth_user_id = auth.uid()) AND (profiles.role = ANY (ARRAY['owner'::text, 'superadmin'::text])))))));

CREATE POLICY "team_invitations_select" ON public.team_invitations FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "team_invitations_update" ON public.team_invitations FOR UPDATE TO authenticated
  USING ((tenant_id = my_tenant_id()))
  WITH CHECK ((status = 'accepted'::text));

CREATE POLICY "notif_all_restore" ON public.notifications FOR ALL TO public
  USING ((is_my_tenant(tenant_id) OR is_superadmin()));

CREATE POLICY "tenant members can insert notifications" ON public.notifications FOR INSERT TO public
  WITH CHECK ((tenant_id IN ( SELECT profiles.tenant_id
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid()))));

CREATE POLICY "tenant members can read notifications" ON public.notifications FOR SELECT TO public
  USING ((tenant_id IN ( SELECT profiles.tenant_id
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid()))));

CREATE POLICY "tenant members can update notifications" ON public.notifications FOR UPDATE TO public
  USING ((tenant_id IN ( SELECT profiles.tenant_id
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid()))));

CREATE POLICY "tenant_kd_penggemukan_animals" ON public.kd_penggemukan_animals FOR ALL TO public
  USING ((tenant_id = ( SELECT profiles.tenant_id
   FROM profiles
  WHERE (profiles.id = auth.uid()))));

CREATE POLICY "tenant_kd_penggemukan_batches" ON public.kd_penggemukan_batches FOR ALL TO public
  USING ((tenant_id = ( SELECT profiles.tenant_id
   FROM profiles
  WHERE (profiles.id = auth.uid()))));

CREATE POLICY "tenant_kd_penggemukan_weight_records" ON public.kd_penggemukan_weight_records FOR ALL TO public
  USING ((tenant_id = ( SELECT profiles.tenant_id
   FROM profiles
  WHERE (profiles.id = auth.uid()))));

CREATE POLICY "tenant_kd_penggemukan_sales" ON public.kd_penggemukan_sales FOR ALL TO public
  USING ((tenant_id = ( SELECT profiles.tenant_id
   FROM profiles
  WHERE (profiles.id = auth.uid()))));

CREATE POLICY "tenant_kd_breeding_feed_logs" ON public.kd_breeding_feed_logs FOR ALL TO public
  USING ((tenant_id = ( SELECT profiles.tenant_id
   FROM profiles
  WHERE (profiles.id = auth.uid()))));

CREATE POLICY "tenant_kd_breeding_sales" ON public.kd_breeding_sales FOR ALL TO public
  USING ((tenant_id = ( SELECT profiles.tenant_id
   FROM profiles
  WHERE (profiles.id = auth.uid()))));

CREATE POLICY "tenant_kd_penggemukan_feed_logs" ON public.kd_penggemukan_feed_logs FOR ALL TO public
  USING ((tenant_id = ( SELECT profiles.tenant_id
   FROM profiles
  WHERE (profiles.id = auth.uid()))));

CREATE POLICY "tenant_kd_penggemukan_health_logs" ON public.kd_penggemukan_health_logs FOR ALL TO public
  USING ((tenant_id = ( SELECT profiles.tenant_id
   FROM profiles
  WHERE (profiles.id = auth.uid()))));

CREATE POLICY "tenant_kd_breeding_animals" ON public.kd_breeding_animals FOR ALL TO public
  USING ((tenant_id = ( SELECT profiles.tenant_id
   FROM profiles
  WHERE (profiles.id = auth.uid()))));

CREATE POLICY "tenant_kd_breeding_weight_records" ON public.kd_breeding_weight_records FOR ALL TO public
  USING ((tenant_id = ( SELECT profiles.tenant_id
   FROM profiles
  WHERE (profiles.id = auth.uid()))));

CREATE POLICY "tenant_kd_breeding_mating_records" ON public.kd_breeding_mating_records FOR ALL TO public
  USING ((tenant_id = ( SELECT profiles.tenant_id
   FROM profiles
  WHERE (profiles.id = auth.uid()))));

CREATE POLICY "tenant_kd_breeding_births" ON public.kd_breeding_births FOR ALL TO public
  USING ((tenant_id = ( SELECT profiles.tenant_id
   FROM profiles
  WHERE (profiles.id = auth.uid()))));

CREATE POLICY "tenant_kd_breeding_health_logs" ON public.kd_breeding_health_logs FOR ALL TO public
  USING ((tenant_id = ( SELECT profiles.tenant_id
   FROM profiles
  WHERE (profiles.id = auth.uid()))));

CREATE POLICY "Admin Write Pricing Plans" ON public.pricing_plans FOR ALL TO public
  USING (is_superadmin())
  WITH CHECK (is_superadmin());

CREATE POLICY "Public Read Pricing Plans" ON public.pricing_plans FOR SELECT TO public
  USING (true);

CREATE POLICY "pricing_read" ON public.pricing_plans FOR SELECT TO public
  USING (true);

CREATE POLICY "pricing_write" ON public.pricing_plans FOR ALL TO public
  USING (is_superadmin())
  WITH CHECK (is_superadmin());

CREATE POLICY "Tenant Isolation Policy" ON public.egg_sales FOR ALL TO public
  USING ((tenant_id IN ( SELECT profiles.tenant_id
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid()))))
  WITH CHECK ((tenant_id IN ( SELECT profiles.tenant_id
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid()))));

CREATE POLICY "egg_stock_logs_tenant_isolation" ON public.egg_stock_logs FOR ALL TO public
  USING ((tenant_id = ( SELECT profiles.tenant_id
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid())
 LIMIT 1)));

CREATE POLICY "egg_suppliers_tenant_isolation" ON public.egg_suppliers FOR ALL TO public
  USING ((tenant_id = ( SELECT profiles.tenant_id
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid())
 LIMIT 1)));

CREATE POLICY "Tenant Isolation Policy" ON public.egg_inventory FOR ALL TO public
  USING ((tenant_id IN ( SELECT profiles.tenant_id
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid()))))
  WITH CHECK ((tenant_id IN ( SELECT profiles.tenant_id
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid()))));

CREATE POLICY "egg_customers_tenant_isolation" ON public.egg_customers FOR ALL TO public
  USING ((tenant_id = ( SELECT profiles.tenant_id
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid())
 LIMIT 1)));

CREATE POLICY "egg_sale_items_tenant_isolation" ON public.egg_sale_items FOR ALL TO public
  USING ((sale_id IN ( SELECT egg_sales.id
   FROM egg_sales
  WHERE (egg_sales.tenant_id = ( SELECT profiles.tenant_id
           FROM profiles
          WHERE (profiles.auth_user_id = auth.uid())
         LIMIT 1)))));

CREATE POLICY "Admin Write Discount Codes" ON public.discount_codes FOR ALL TO public
  USING (is_superadmin())
  WITH CHECK (is_superadmin());

CREATE POLICY "Public Read Discount Codes" ON public.discount_codes FOR SELECT TO public
  USING (true);

CREATE POLICY "discount_read" ON public.discount_codes FOR SELECT TO public
  USING (true);

CREATE POLICY "discount_write" ON public.discount_codes FOR ALL TO public
  USING (is_superadmin())
  WITH CHECK (is_superadmin());

CREATE POLICY "superadmin_delete" ON public.kandang_workers FOR DELETE TO public
  USING ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.auth_user_id = auth.uid()) AND (profiles.role = 'superadmin'::text)))));

CREATE POLICY "tenant_kandang_workers" ON public.kandang_workers FOR ALL TO authenticated
  USING ((tenant_id = ( SELECT profiles.tenant_id
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid())
 LIMIT 1)));

CREATE POLICY "superadmin_only_xendit_config" ON public.xendit_config FOR ALL TO authenticated
  USING ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.auth_user_id = auth.uid()) AND (profiles.role = 'superadmin'::text)))))
  WITH CHECK ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.auth_user_id = auth.uid()) AND (profiles.role = 'superadmin'::text)))));

CREATE POLICY "superadmin_xendit_config" ON public.xendit_config FOR ALL TO authenticated
  USING (is_superadmin())
  WITH CHECK (is_superadmin());

CREATE POLICY "Tenant Isolation Policy" ON public.harvest_records FOR ALL TO public
  USING ((tenant_id IN ( SELECT profiles.tenant_id
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid()))))
  WITH CHECK ((tenant_id IN ( SELECT profiles.tenant_id
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid()))));

CREATE POLICY "superadmin_delete" ON public.harvest_records FOR DELETE TO public
  USING ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.auth_user_id = auth.uid()) AND (profiles.role = 'superadmin'::text)))));

CREATE POLICY "tenant_harvest_records" ON public.harvest_records FOR ALL TO authenticated
  USING ((tenant_id = ( SELECT profiles.tenant_id
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid())
 LIMIT 1)));

CREATE POLICY "superadmin_delete" ON public.worker_payments FOR DELETE TO public
  USING ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.auth_user_id = auth.uid()) AND (profiles.role = 'superadmin'::text)))));

CREATE POLICY "tenant_worker_payments" ON public.worker_payments FOR ALL TO authenticated
  USING ((tenant_id = ( SELECT profiles.tenant_id
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid())
 LIMIT 1)));

CREATE POLICY "invoice_all_restore" ON public.subscription_invoices FOR ALL TO public
  USING ((is_my_tenant(tenant_id) OR is_superadmin()));

CREATE POLICY "invoice_insert" ON public.subscription_invoices FOR INSERT TO public
  WITH CHECK ((tenant_id = my_tenant_id()));

CREATE POLICY "invoice_select" ON public.subscription_invoices FOR SELECT TO public
  USING (((tenant_id = my_tenant_id()) OR is_superadmin()));

CREATE POLICY "invoice_update" ON public.subscription_invoices FOR UPDATE TO public
  USING (is_superadmin())
  WITH CHECK (is_superadmin());

CREATE POLICY "superadmin_read_invoices" ON public.subscription_invoices FOR SELECT TO authenticated
  USING (is_superadmin());

CREATE POLICY "superadmin_update_invoices" ON public.subscription_invoices FOR UPDATE TO authenticated
  USING (is_superadmin())
  WITH CHECK (is_superadmin());

CREATE POLICY "Tenant members can insert peternak_farms" ON public.peternak_farms FOR INSERT TO public
  WITH CHECK ((tenant_id IN ( SELECT profiles.tenant_id
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid()))));

CREATE POLICY "Tenant members can update peternak_farms" ON public.peternak_farms FOR UPDATE TO public
  USING ((tenant_id IN ( SELECT profiles.tenant_id
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid()))));

CREATE POLICY "Tenant members can view peternak_farms" ON public.peternak_farms FOR SELECT TO public
  USING ((tenant_id IN ( SELECT profiles.tenant_id
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid()))));

CREATE POLICY "peternak_farms_all" ON public.peternak_farms FOR ALL TO public
  USING (((tenant_id = my_tenant_id()) OR is_superadmin()))
  WITH CHECK (((tenant_id = my_tenant_id()) AND (my_role() = ANY (ARRAY['owner'::text, 'staff'::text]))));

CREATE POLICY "Tenant Isolation Policy" ON public.cycle_expenses FOR ALL TO public
  USING ((tenant_id IN ( SELECT profiles.tenant_id
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid()))))
  WITH CHECK ((tenant_id IN ( SELECT profiles.tenant_id
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid()))));

CREATE POLICY "superadmin_delete" ON public.cycle_expenses FOR DELETE TO public
  USING ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.auth_user_id = auth.uid()) AND (profiles.role = 'superadmin'::text)))));

CREATE POLICY "tenant_cycle_expenses" ON public.cycle_expenses FOR ALL TO authenticated
  USING ((tenant_id = ( SELECT profiles.tenant_id
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid())
 LIMIT 1)));

CREATE POLICY "rpa_customer_payments_all" ON public.rpa_customer_payments FOR ALL TO public
  USING (((tenant_id = my_tenant_id()) OR is_superadmin()))
  WITH CHECK (((tenant_id = my_tenant_id()) AND (my_role() = ANY (ARRAY['owner'::text, 'staff'::text]))));

CREATE POLICY "superadmin_delete" ON public.rpa_customer_payments FOR DELETE TO public
  USING ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.auth_user_id = auth.uid()) AND (profiles.role = 'superadmin'::text)))));

CREATE POLICY "Ai conversations tenant access" ON public.ai_conversations FOR ALL TO public
  USING ((tenant_id = get_my_tenant_id()))
  WITH CHECK ((tenant_id = get_my_tenant_id()));

CREATE POLICY "Users can insert their own conversations" ON public.ai_conversations FOR INSERT TO public
  WITH CHECK ((profile_id IN ( SELECT profiles.id
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid()))));

CREATE POLICY "Users can see their own conversations" ON public.ai_conversations FOR SELECT TO public
  USING ((profile_id IN ( SELECT profiles.id
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid()))));

CREATE POLICY "Users can update their own conversations" ON public.ai_conversations FOR UPDATE TO public
  USING ((profile_id IN ( SELECT profiles.id
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid()))));

CREATE POLICY "rpa_products_all" ON public.rpa_products FOR ALL TO public
  USING (((tenant_id = my_tenant_id()) OR is_superadmin()))
  WITH CHECK (((tenant_id = my_tenant_id()) AND (my_role() = ANY (ARRAY['owner'::text, 'staff'::text]))));

CREATE POLICY "superadmin_delete" ON public.rpa_products FOR DELETE TO public
  USING ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.auth_user_id = auth.uid()) AND (profiles.role = 'superadmin'::text)))));

CREATE POLICY "rpa_customers_all" ON public.rpa_customers FOR ALL TO public
  USING (((tenant_id = my_tenant_id()) OR is_superadmin()))
  WITH CHECK (((tenant_id = my_tenant_id()) AND (my_role() = ANY (ARRAY['owner'::text, 'staff'::text]))));

CREATE POLICY "superadmin_delete" ON public.rpa_customers FOR DELETE TO public
  USING ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.auth_user_id = auth.uid()) AND (profiles.role = 'superadmin'::text)))));

CREATE POLICY "rpa_invoices_all" ON public.rpa_invoices FOR ALL TO public
  USING (((tenant_id = my_tenant_id()) OR is_superadmin()))
  WITH CHECK (((tenant_id = my_tenant_id()) AND (my_role() = ANY (ARRAY['owner'::text, 'staff'::text]))));

CREATE POLICY "superadmin_delete" ON public.rpa_invoices FOR DELETE TO public
  USING ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.auth_user_id = auth.uid()) AND (profiles.role = 'superadmin'::text)))));

CREATE POLICY "Allow public read access to market_listings" ON public.market_listings FOR SELECT TO public
  USING (true);

CREATE POLICY "Tenant Isolation Policy" ON public.market_listings FOR ALL TO public
  USING ((tenant_id IN ( SELECT profiles.tenant_id
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid()))))
  WITH CHECK ((tenant_id IN ( SELECT profiles.tenant_id
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid()))));

CREATE POLICY "authenticated_read_market" ON public.market_listings FOR SELECT TO authenticated
  USING (((is_deleted = false) AND (status = 'active'::text)));

CREATE POLICY "superadmin_delete" ON public.market_listings FOR DELETE TO public
  USING ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.auth_user_id = auth.uid()) AND (profiles.role = 'superadmin'::text)))));

CREATE POLICY "tenant_insert_market" ON public.market_listings FOR INSERT TO authenticated
  WITH CHECK ((tenant_id = ( SELECT profiles.tenant_id
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid())
 LIMIT 1)));

CREATE POLICY "tenant_update_market" ON public.market_listings FOR UPDATE TO authenticated
  USING ((tenant_id = ( SELECT profiles.tenant_id
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid())
 LIMIT 1)));

CREATE POLICY "Ai pending entries tenant access" ON public.ai_pending_entries FOR ALL TO public
  USING ((tenant_id = get_my_tenant_id()))
  WITH CHECK ((tenant_id = get_my_tenant_id()));

CREATE POLICY "Users can insert their own pending entries" ON public.ai_pending_entries FOR INSERT TO public
  WITH CHECK ((profile_id IN ( SELECT profiles.id
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid()))));

CREATE POLICY "Users can see their own pending entries" ON public.ai_pending_entries FOR SELECT TO public
  USING ((profile_id IN ( SELECT profiles.id
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid()))));

CREATE POLICY "Users can update their own pending entries" ON public.ai_pending_entries FOR UPDATE TO public
  USING ((auth.uid() = profile_id));

CREATE POLICY "Admin Write Plan Configs" ON public.plan_configs FOR ALL TO public
  USING (is_superadmin())
  WITH CHECK (is_superadmin());

CREATE POLICY "Public Read Plan Configs" ON public.plan_configs FOR SELECT TO public
  USING (true);

CREATE POLICY "plan_configs_read" ON public.plan_configs FOR SELECT TO public
  USING (true);

CREATE POLICY "plan_configs_write" ON public.plan_configs FOR ALL TO public
  USING (is_superadmin())
  WITH CHECK (is_superadmin());

CREATE POLICY "generated_invoices_all" ON public.generated_invoices FOR ALL TO public
  USING (((tenant_id = my_tenant_id()) OR is_superadmin()))
  WITH CHECK (((tenant_id = my_tenant_id()) AND (my_role() = ANY (ARRAY['owner'::text, 'staff'::text]))));

CREATE POLICY "superadmin_delete" ON public.generated_invoices FOR DELETE TO public
  USING ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.auth_user_id = auth.uid()) AND (profiles.role = 'superadmin'::text)))));

CREATE POLICY "tenant_isolation_generated_invoices" ON public.generated_invoices FOR ALL TO authenticated
  USING ((tenant_id IN ( SELECT profiles.tenant_id
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid()))))
  WITH CHECK ((tenant_id IN ( SELECT profiles.tenant_id
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid()))));

CREATE POLICY "Allow anon to insert valid waitlist entries" ON public.waitlist_signups FOR INSERT TO anon
  WITH CHECK (((email IS NOT NULL) AND (length(email) > 3)));

CREATE POLICY "Allow authenticated users to view waitlist" ON public.waitlist_signups FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "superadmin_read_waitlist" ON public.waitlist_signups FOR SELECT TO authenticated
  USING (is_superadmin());

CREATE POLICY "waitlist_superadmin_read" ON public.waitlist_signups FOR SELECT TO public
  USING (is_superadmin());

CREATE POLICY "Ai feedback tenant access" ON public.ai_feedback FOR ALL TO public
  USING ((tenant_id = get_my_tenant_id()))
  WITH CHECK ((tenant_id = get_my_tenant_id()));

CREATE POLICY "tenant_sapi_penggemukan_batches_delete" ON public.sapi_penggemukan_batches FOR DELETE TO public
  USING ((tenant_id IN ( SELECT profiles.tenant_id
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid()))));

CREATE POLICY "tenant_sapi_penggemukan_batches_insert" ON public.sapi_penggemukan_batches FOR INSERT TO public
  WITH CHECK ((tenant_id IN ( SELECT profiles.tenant_id
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid()))));

CREATE POLICY "tenant_sapi_penggemukan_batches_select" ON public.sapi_penggemukan_batches FOR SELECT TO public
  USING ((tenant_id IN ( SELECT profiles.tenant_id
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid()))));

CREATE POLICY "tenant_sapi_penggemukan_batches_update" ON public.sapi_penggemukan_batches FOR UPDATE TO public
  USING ((tenant_id IN ( SELECT profiles.tenant_id
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid()))));

CREATE POLICY "Ai staged transactions tenant access" ON public.ai_staged_transactions FOR ALL TO public
  USING ((tenant_id = get_my_tenant_id()))
  WITH CHECK ((tenant_id = get_my_tenant_id()));

CREATE POLICY "Users can insert their own staged transactions" ON public.ai_staged_transactions FOR INSERT TO public
  WITH CHECK ((profile_id IN ( SELECT profiles.id
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid()))));

CREATE POLICY "Users can see their own staged transactions" ON public.ai_staged_transactions FOR SELECT TO public
  USING ((profile_id IN ( SELECT profiles.id
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid()))));

CREATE POLICY "Users can update their own staged transactions" ON public.ai_staged_transactions FOR UPDATE TO public
  USING ((profile_id IN ( SELECT profiles.id
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid()))));

CREATE POLICY "superadmin_delete" ON public.ai_staged_transactions FOR DELETE TO public
  USING ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.auth_user_id = auth.uid()) AND (profiles.role = 'superadmin'::text)))));

CREATE POLICY "Users can see anomalies in their tenant" ON public.ai_anomaly_logs FOR SELECT TO public
  USING ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.auth_user_id = auth.uid()) AND (profiles.tenant_id = ai_anomaly_logs.tenant_id)))));

CREATE POLICY "superadmin_delete" ON public.ai_anomaly_logs FOR DELETE TO public
  USING ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.auth_user_id = auth.uid()) AND (profiles.role = 'superadmin'::text)))));

CREATE POLICY "tenant_sapi_penggemukan_animals_delete" ON public.sapi_penggemukan_animals FOR DELETE TO public
  USING ((tenant_id IN ( SELECT profiles.tenant_id
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid()))));

CREATE POLICY "tenant_sapi_penggemukan_animals_insert" ON public.sapi_penggemukan_animals FOR INSERT TO public
  WITH CHECK ((tenant_id IN ( SELECT profiles.tenant_id
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid()))));

CREATE POLICY "tenant_sapi_penggemukan_animals_select" ON public.sapi_penggemukan_animals FOR SELECT TO public
  USING ((tenant_id IN ( SELECT profiles.tenant_id
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid()))));

CREATE POLICY "tenant_sapi_penggemukan_animals_update" ON public.sapi_penggemukan_animals FOR UPDATE TO public
  USING ((tenant_id IN ( SELECT profiles.tenant_id
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid()))));

CREATE POLICY "Superadmin Delete Sembako Sales" ON public.sembako_sales FOR DELETE TO public
  USING ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.auth_user_id = auth.uid()) AND (profiles.role = 'superadmin'::text)))));

CREATE POLICY "sembako_sales_all" ON public.sembako_sales FOR ALL TO public
  USING (((tenant_id = my_tenant_id()) OR is_superadmin()))
  WITH CHECK (((tenant_id = my_tenant_id()) AND (my_role() = ANY (ARRAY['owner'::text, 'staff'::text]))));

CREATE POLICY "superadmin_delete" ON public.sembako_sales FOR DELETE TO public
  USING ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.auth_user_id = auth.uid()) AND (profiles.role = 'superadmin'::text)))));

CREATE POLICY "tenant_sapi_penggemukan_weight_records_delete" ON public.sapi_penggemukan_weight_records FOR DELETE TO public
  USING ((tenant_id IN ( SELECT profiles.tenant_id
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid()))));

CREATE POLICY "tenant_sapi_penggemukan_weight_records_insert" ON public.sapi_penggemukan_weight_records FOR INSERT TO public
  WITH CHECK ((tenant_id IN ( SELECT profiles.tenant_id
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid()))));

CREATE POLICY "tenant_sapi_penggemukan_weight_records_select" ON public.sapi_penggemukan_weight_records FOR SELECT TO public
  USING ((tenant_id IN ( SELECT profiles.tenant_id
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid()))));

CREATE POLICY "tenant_sapi_penggemukan_weight_records_update" ON public.sapi_penggemukan_weight_records FOR UPDATE TO public
  USING ((tenant_id IN ( SELECT profiles.tenant_id
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid()))));

CREATE POLICY "tenant_sapi_penggemukan_feed_logs_delete" ON public.sapi_penggemukan_feed_logs FOR DELETE TO public
  USING ((tenant_id IN ( SELECT profiles.tenant_id
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid()))));

CREATE POLICY "tenant_sapi_penggemukan_feed_logs_insert" ON public.sapi_penggemukan_feed_logs FOR INSERT TO public
  WITH CHECK ((tenant_id IN ( SELECT profiles.tenant_id
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid()))));

CREATE POLICY "tenant_sapi_penggemukan_feed_logs_select" ON public.sapi_penggemukan_feed_logs FOR SELECT TO public
  USING ((tenant_id IN ( SELECT profiles.tenant_id
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid()))));

CREATE POLICY "tenant_sapi_penggemukan_feed_logs_update" ON public.sapi_penggemukan_feed_logs FOR UPDATE TO public
  USING ((tenant_id IN ( SELECT profiles.tenant_id
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid()))));

CREATE POLICY "tenant_sapi_penggemukan_health_logs_delete" ON public.sapi_penggemukan_health_logs FOR DELETE TO public
  USING ((tenant_id IN ( SELECT profiles.tenant_id
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid()))));

CREATE POLICY "tenant_sapi_penggemukan_health_logs_insert" ON public.sapi_penggemukan_health_logs FOR INSERT TO public
  WITH CHECK ((tenant_id IN ( SELECT profiles.tenant_id
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid()))));

CREATE POLICY "tenant_sapi_penggemukan_health_logs_select" ON public.sapi_penggemukan_health_logs FOR SELECT TO public
  USING ((tenant_id IN ( SELECT profiles.tenant_id
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid()))));

CREATE POLICY "tenant_sapi_penggemukan_health_logs_update" ON public.sapi_penggemukan_health_logs FOR UPDATE TO public
  USING ((tenant_id IN ( SELECT profiles.tenant_id
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid()))));

CREATE POLICY "tenant_sapi_penggemukan_sales_delete" ON public.sapi_penggemukan_sales FOR DELETE TO public
  USING ((tenant_id IN ( SELECT profiles.tenant_id
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid()))));

CREATE POLICY "tenant_sapi_penggemukan_sales_insert" ON public.sapi_penggemukan_sales FOR INSERT TO public
  WITH CHECK ((tenant_id IN ( SELECT profiles.tenant_id
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid()))));

CREATE POLICY "tenant_sapi_penggemukan_sales_select" ON public.sapi_penggemukan_sales FOR SELECT TO public
  USING ((tenant_id IN ( SELECT profiles.tenant_id
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid()))));

CREATE POLICY "tenant_sapi_penggemukan_sales_update" ON public.sapi_penggemukan_sales FOR UPDATE TO public
  USING ((tenant_id IN ( SELECT profiles.tenant_id
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid()))));

CREATE POLICY "sembako_suppliers_all" ON public.sembako_suppliers FOR ALL TO public
  USING (((tenant_id = my_tenant_id()) OR is_superadmin()))
  WITH CHECK (((tenant_id = my_tenant_id()) AND (my_role() = ANY (ARRAY['owner'::text, 'staff'::text]))));

CREATE POLICY "superadmin_delete" ON public.sembako_suppliers FOR DELETE TO public
  USING ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.auth_user_id = auth.uid()) AND (profiles.role = 'superadmin'::text)))));

CREATE POLICY "tenant_isolation_sembako_suppliers" ON public.sembako_suppliers FOR ALL TO authenticated
  USING ((tenant_id IN ( SELECT profiles.tenant_id
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid()))))
  WITH CHECK ((tenant_id IN ( SELECT profiles.tenant_id
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid()))));

CREATE POLICY "Tenant isolation sembako customers" ON public.sembako_customers FOR ALL TO public
  USING ((tenant_id IN ( SELECT profiles.tenant_id
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid()))))
  WITH CHECK ((tenant_id IN ( SELECT profiles.tenant_id
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid()))));

CREATE POLICY "superadmin_delete" ON public.sembako_customers FOR DELETE TO public
  USING ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.auth_user_id = auth.uid()) AND (profiles.role = 'superadmin'::text)))));

CREATE POLICY "Superadmin Delete Sembako Stock Batches" ON public.sembako_stock_batches FOR DELETE TO public
  USING ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.auth_user_id = auth.uid()) AND (profiles.role = 'superadmin'::text)))));

CREATE POLICY "Tenant isolation sembako stock batches" ON public.sembako_stock_batches FOR ALL TO public
  USING ((tenant_id = ( SELECT profiles.tenant_id
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid())
 LIMIT 1)))
  WITH CHECK ((tenant_id = ( SELECT profiles.tenant_id
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid())
 LIMIT 1)));

CREATE POLICY "superadmin_delete" ON public.sembako_stock_batches FOR DELETE TO public
  USING ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.auth_user_id = auth.uid()) AND (profiles.role = 'superadmin'::text)))));

CREATE POLICY "tenant_isolation_sembako_stock_batches" ON public.sembako_stock_batches FOR ALL TO authenticated
  USING ((tenant_id IN ( SELECT profiles.tenant_id
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid()))))
  WITH CHECK ((tenant_id IN ( SELECT profiles.tenant_id
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid()))));

CREATE POLICY "sembako_stock_out_all" ON public.sembako_stock_out FOR ALL TO public
  USING (((tenant_id = my_tenant_id()) OR is_superadmin()))
  WITH CHECK (((tenant_id = my_tenant_id()) AND (my_role() = ANY (ARRAY['owner'::text, 'staff'::text]))));

CREATE POLICY "superadmin_delete" ON public.sembako_stock_out FOR DELETE TO public
  USING ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.auth_user_id = auth.uid()) AND (profiles.role = 'superadmin'::text)))));

CREATE POLICY "tenant_isolation_sembako_stock_out" ON public.sembako_stock_out FOR ALL TO authenticated
  USING ((tenant_id IN ( SELECT profiles.tenant_id
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid()))))
  WITH CHECK ((tenant_id IN ( SELECT profiles.tenant_id
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid()))));

CREATE POLICY "Superadmin Delete Sembako Products" ON public.sembako_products FOR DELETE TO public
  USING ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.auth_user_id = auth.uid()) AND (profiles.role = 'superadmin'::text)))));

CREATE POLICY "Tenant isolation sembako products" ON public.sembako_products FOR ALL TO public
  USING ((tenant_id IN ( SELECT profiles.tenant_id
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid()))))
  WITH CHECK ((tenant_id IN ( SELECT profiles.tenant_id
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid()))));

CREATE POLICY "superadmin_delete" ON public.sembako_products FOR DELETE TO public
  USING ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.auth_user_id = auth.uid()) AND (profiles.role = 'superadmin'::text)))));

CREATE POLICY "tenant_sapi_kandangs" ON public.sapi_kandangs FOR ALL TO public
  USING ((tenant_id = ( SELECT profiles.tenant_id
   FROM profiles
  WHERE (profiles.id = auth.uid()))));

CREATE POLICY "tenant_sapi_kandangs_delete" ON public.sapi_kandangs FOR DELETE TO public
  USING ((tenant_id IN ( SELECT profiles.tenant_id
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid()))));

CREATE POLICY "tenant_sapi_kandangs_insert" ON public.sapi_kandangs FOR INSERT TO public
  WITH CHECK ((tenant_id IN ( SELECT profiles.tenant_id
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid()))));

CREATE POLICY "tenant_sapi_kandangs_select" ON public.sapi_kandangs FOR SELECT TO public
  USING ((tenant_id IN ( SELECT profiles.tenant_id
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid()))));

CREATE POLICY "tenant_sapi_kandangs_update" ON public.sapi_kandangs FOR UPDATE TO public
  USING ((tenant_id IN ( SELECT profiles.tenant_id
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid()))));

CREATE POLICY "Tenant Isolation Policy" ON public.sembako_deliveries FOR ALL TO public
  USING ((tenant_id IN ( SELECT profiles.tenant_id
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid()))))
  WITH CHECK ((tenant_id IN ( SELECT profiles.tenant_id
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid()))));

CREATE POLICY "superadmin_delete" ON public.sembako_deliveries FOR DELETE TO public
  USING ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.auth_user_id = auth.uid()) AND (profiles.role = 'superadmin'::text)))));

CREATE POLICY "Deny public access" ON public.invite_rate_limits FOR ALL TO public
  USING (false);

CREATE POLICY "Target can respond to connection" ON public.broker_connections FOR UPDATE TO public
  USING (((target_tenant_id IN ( SELECT profiles.tenant_id
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid()))) OR ((requester_tenant_id IN ( SELECT profiles.tenant_id
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid()))) AND (status = 'pending'::text))));

CREATE POLICY "Tenant can request connection" ON public.broker_connections FOR INSERT TO public
  WITH CHECK ((requester_tenant_id IN ( SELECT profiles.tenant_id
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid()))));

CREATE POLICY "Tenant can view own connections" ON public.broker_connections FOR SELECT TO public
  USING (((requester_tenant_id IN ( SELECT profiles.tenant_id
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid()))) OR (target_tenant_id IN ( SELECT profiles.tenant_id
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid())))));

CREATE POLICY "connections_insert" ON public.broker_connections FOR INSERT TO public
  WITH CHECK (((peternak_tenant_id = my_tenant_id()) OR (broker_tenant_id = my_tenant_id())));

CREATE POLICY "connections_select" ON public.broker_connections FOR SELECT TO public
  USING (((peternak_tenant_id = my_tenant_id()) OR (broker_tenant_id = my_tenant_id()) OR is_superadmin()));

CREATE POLICY "connections_update" ON public.broker_connections FOR UPDATE TO public
  USING (((peternak_tenant_id = my_tenant_id()) OR (broker_tenant_id = my_tenant_id()) OR is_superadmin()));

CREATE POLICY "batches_all" ON public.chicken_batches FOR ALL TO public
  USING (((tenant_id = my_tenant_id()) OR is_superadmin()))
  WITH CHECK ((tenant_id = my_tenant_id()));

CREATE POLICY "orders_all" ON public.orders FOR ALL TO public
  USING (((tenant_id = my_tenant_id()) OR is_superadmin()))
  WITH CHECK ((tenant_id = my_tenant_id()));

CREATE POLICY "peternak_profiles_all" ON public.peternak_profiles FOR ALL TO public
  USING (((tenant_id = my_tenant_id()) OR is_superadmin()))
  WITH CHECK (((tenant_id = my_tenant_id()) AND (my_role() = ANY (ARRAY['owner'::text, 'staff'::text]))));

CREATE POLICY "superadmin_delete" ON public.peternak_profiles FOR DELETE TO public
  USING ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.auth_user_id = auth.uid()) AND (profiles.role = 'superadmin'::text)))));

CREATE POLICY "broker_profiles_all" ON public.broker_profiles FOR ALL TO public
  USING (((tenant_id = my_tenant_id()) OR is_superadmin()))
  WITH CHECK (((tenant_id = my_tenant_id()) AND (my_role() = ANY (ARRAY['owner'::text, 'staff'::text]))));

CREATE POLICY "superadmin_delete" ON public.broker_profiles FOR DELETE TO public
  USING ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.auth_user_id = auth.uid()) AND (profiles.role = 'superadmin'::text)))));

CREATE POLICY "sembako_sale_items_all" ON public.sembako_sale_items FOR ALL TO public
  USING ((EXISTS ( SELECT 1
   FROM sembako_sales
  WHERE ((sembako_sales.id = sembako_sale_items.sale_id) AND ((sembako_sales.tenant_id = my_tenant_id()) OR is_superadmin())))))
  WITH CHECK ((EXISTS ( SELECT 1
   FROM sembako_sales
  WHERE ((sembako_sales.id = sembako_sale_items.sale_id) AND (sembako_sales.tenant_id = my_tenant_id())))));

CREATE POLICY "rpa_invoice_items_all" ON public.rpa_invoice_items FOR ALL TO public
  USING ((EXISTS ( SELECT 1
   FROM rpa_invoices
  WHERE ((rpa_invoices.id = rpa_invoice_items.invoice_id) AND ((rpa_invoices.tenant_id = my_tenant_id()) OR is_superadmin())))))
  WITH CHECK ((EXISTS ( SELECT 1
   FROM rpa_invoices
  WHERE ((rpa_invoices.id = rpa_invoice_items.invoice_id) AND (rpa_invoices.tenant_id = my_tenant_id())))));

CREATE POLICY "Allow authenticated users to insert a tenant" ON public.tenants FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow public read access to tenants" ON public.tenants FOR SELECT TO public
  USING (true);

CREATE POLICY "Owners can update own tenant" ON public.tenants FOR UPDATE TO public
  USING ((id IN ( SELECT profiles.tenant_id
   FROM profiles
  WHERE ((profiles.auth_user_id = auth.uid()) AND (profiles.role = 'owner'::text)))))
  WITH CHECK ((id IN ( SELECT profiles.tenant_id
   FROM profiles
  WHERE ((profiles.auth_user_id = auth.uid()) AND (profiles.role = 'owner'::text)))));

CREATE POLICY "Superadmin Delete Tenants" ON public.tenants FOR DELETE TO public
  USING ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.auth_user_id = auth.uid()) AND (profiles.role = 'superadmin'::text)))));

CREATE POLICY "Tenants Access Policy" ON public.tenants FOR SELECT TO public
  USING ((id IN ( SELECT profiles.tenant_id
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid()))));

CREATE POLICY "Users can see their own tenants" ON public.tenants FOR SELECT TO authenticated
  USING ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.tenant_id = tenants.id) AND (profiles.auth_user_id = auth.uid())))));

CREATE POLICY "public_read_tenants_for_invite" ON public.tenants FOR SELECT TO anon
  USING (true);

CREATE POLICY "superadmin_delete_tenants" ON public.tenants FOR DELETE TO public
  USING ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.auth_user_id = auth.uid()) AND (profiles.role = 'superadmin'::text)))));

CREATE POLICY "superadmin_update_tenants" ON public.tenants FOR UPDATE TO authenticated
  USING (((id = my_tenant_id()) OR is_superadmin()));

CREATE POLICY "tenant_insert" ON public.tenants FOR INSERT TO authenticated
  WITH CHECK ((is_superadmin() OR (NOT (EXISTS ( SELECT 1
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid()))))));

CREATE POLICY "tenant_select_own_insert" ON public.tenants FOR SELECT TO authenticated
  USING (((id = my_tenant_id()) OR is_superadmin() OR (EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.auth_user_id = auth.uid()) AND (profiles.tenant_id = tenants.id))))));

CREATE POLICY "sembako_payments_all" ON public.sembako_payments FOR ALL TO public
  USING (((tenant_id = my_tenant_id()) OR is_superadmin()))
  WITH CHECK (((tenant_id = my_tenant_id()) AND (my_role() = ANY (ARRAY['owner'::text, 'staff'::text]))));

CREATE POLICY "superadmin_delete" ON public.sembako_payments FOR DELETE TO public
  USING ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.auth_user_id = auth.uid()) AND (profiles.role = 'superadmin'::text)))));

CREATE POLICY "sembako_employees_all" ON public.sembako_employees FOR ALL TO public
  USING (((tenant_id = my_tenant_id()) OR is_superadmin()))
  WITH CHECK (((tenant_id = my_tenant_id()) AND (my_role() = ANY (ARRAY['owner'::text, 'staff'::text]))));

CREATE POLICY "superadmin_delete" ON public.sembako_employees FOR DELETE TO public
  USING ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.auth_user_id = auth.uid()) AND (profiles.role = 'superadmin'::text)))));

CREATE POLICY "tenant_isolation_sembako_employees" ON public.sembako_employees FOR ALL TO authenticated
  USING ((tenant_id IN ( SELECT profiles.tenant_id
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid()))))
  WITH CHECK ((tenant_id IN ( SELECT profiles.tenant_id
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid()))));

CREATE POLICY "sembako_expenses_all" ON public.sembako_expenses FOR ALL TO public
  USING (((tenant_id = my_tenant_id()) OR is_superadmin()))
  WITH CHECK (((tenant_id = my_tenant_id()) AND (my_role() = ANY (ARRAY['owner'::text, 'staff'::text]))));

CREATE POLICY "superadmin_delete" ON public.sembako_expenses FOR DELETE TO public
  USING ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.auth_user_id = auth.uid()) AND (profiles.role = 'superadmin'::text)))));

CREATE POLICY "sembako_payroll_all" ON public.sembako_payroll FOR ALL TO public
  USING (((tenant_id = my_tenant_id()) OR is_superadmin()))
  WITH CHECK (((tenant_id = my_tenant_id()) AND (my_role() = ANY (ARRAY['owner'::text, 'staff'::text]))));

CREATE POLICY "superadmin_delete" ON public.sembako_payroll FOR DELETE TO public
  USING ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.auth_user_id = auth.uid()) AND (profiles.role = 'superadmin'::text)))));

CREATE POLICY "tenant_isolation_sembako_payroll" ON public.sembako_payroll FOR ALL TO authenticated
  USING ((tenant_id IN ( SELECT profiles.tenant_id
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid()))))
  WITH CHECK ((tenant_id IN ( SELECT profiles.tenant_id
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid()))));

CREATE POLICY "sapi_breeding_animals_all" ON public.sapi_breeding_animals FOR ALL TO public
  USING ((is_my_tenant(tenant_id) OR is_superadmin()));

CREATE POLICY "tenant_sapi_breeding_animals_delete" ON public.sapi_breeding_animals FOR DELETE TO public
  USING ((tenant_id IN ( SELECT profiles.tenant_id
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid()))));

CREATE POLICY "tenant_sapi_breeding_animals_insert" ON public.sapi_breeding_animals FOR INSERT TO public
  WITH CHECK ((tenant_id IN ( SELECT profiles.tenant_id
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid()))));

CREATE POLICY "tenant_sapi_breeding_animals_select" ON public.sapi_breeding_animals FOR SELECT TO public
  USING ((tenant_id IN ( SELECT profiles.tenant_id
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid()))));

CREATE POLICY "tenant_sapi_breeding_animals_update" ON public.sapi_breeding_animals FOR UPDATE TO public
  USING ((tenant_id IN ( SELECT profiles.tenant_id
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid()))));

CREATE POLICY "sapi_breeding_mating_records_all" ON public.sapi_breeding_mating_records FOR ALL TO public
  USING ((is_my_tenant(tenant_id) OR is_superadmin()));

CREATE POLICY "tenant_sapi_breeding_mating_records_delete" ON public.sapi_breeding_mating_records FOR DELETE TO public
  USING ((tenant_id IN ( SELECT profiles.tenant_id
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid()))));

CREATE POLICY "tenant_sapi_breeding_mating_records_insert" ON public.sapi_breeding_mating_records FOR INSERT TO public
  WITH CHECK ((tenant_id IN ( SELECT profiles.tenant_id
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid()))));

CREATE POLICY "tenant_sapi_breeding_mating_records_select" ON public.sapi_breeding_mating_records FOR SELECT TO public
  USING ((tenant_id IN ( SELECT profiles.tenant_id
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid()))));

CREATE POLICY "tenant_sapi_breeding_mating_records_update" ON public.sapi_breeding_mating_records FOR UPDATE TO public
  USING ((tenant_id IN ( SELECT profiles.tenant_id
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid()))));

CREATE POLICY "sapi_breeding_births_all" ON public.sapi_breeding_births FOR ALL TO public
  USING ((is_my_tenant(tenant_id) OR is_superadmin()));

CREATE POLICY "tenant_sapi_breeding_births_delete" ON public.sapi_breeding_births FOR DELETE TO public
  USING ((tenant_id IN ( SELECT profiles.tenant_id
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid()))));

CREATE POLICY "tenant_sapi_breeding_births_insert" ON public.sapi_breeding_births FOR INSERT TO public
  WITH CHECK ((tenant_id IN ( SELECT profiles.tenant_id
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid()))));

CREATE POLICY "tenant_sapi_breeding_births_select" ON public.sapi_breeding_births FOR SELECT TO public
  USING ((tenant_id IN ( SELECT profiles.tenant_id
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid()))));

CREATE POLICY "tenant_sapi_breeding_births_update" ON public.sapi_breeding_births FOR UPDATE TO public
  USING ((tenant_id IN ( SELECT profiles.tenant_id
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid()))));

CREATE POLICY "sapi_breeding_weight_records_all" ON public.sapi_breeding_weight_records FOR ALL TO public
  USING ((is_my_tenant(tenant_id) OR is_superadmin()));

CREATE POLICY "tenant_sapi_breeding_weight_records_delete" ON public.sapi_breeding_weight_records FOR DELETE TO public
  USING ((tenant_id IN ( SELECT profiles.tenant_id
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid()))));

CREATE POLICY "tenant_sapi_breeding_weight_records_insert" ON public.sapi_breeding_weight_records FOR INSERT TO public
  WITH CHECK ((tenant_id IN ( SELECT profiles.tenant_id
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid()))));

CREATE POLICY "tenant_sapi_breeding_weight_records_select" ON public.sapi_breeding_weight_records FOR SELECT TO public
  USING ((tenant_id IN ( SELECT profiles.tenant_id
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid()))));

CREATE POLICY "tenant_sapi_breeding_weight_records_update" ON public.sapi_breeding_weight_records FOR UPDATE TO public
  USING ((tenant_id IN ( SELECT profiles.tenant_id
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid()))));

CREATE POLICY "sapi_breeding_health_logs_all" ON public.sapi_breeding_health_logs FOR ALL TO public
  USING ((is_my_tenant(tenant_id) OR is_superadmin()));

CREATE POLICY "tenant_sapi_breeding_health_logs_delete" ON public.sapi_breeding_health_logs FOR DELETE TO public
  USING ((tenant_id IN ( SELECT profiles.tenant_id
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid()))));

CREATE POLICY "tenant_sapi_breeding_health_logs_insert" ON public.sapi_breeding_health_logs FOR INSERT TO public
  WITH CHECK ((tenant_id IN ( SELECT profiles.tenant_id
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid()))));

CREATE POLICY "tenant_sapi_breeding_health_logs_select" ON public.sapi_breeding_health_logs FOR SELECT TO public
  USING ((tenant_id IN ( SELECT profiles.tenant_id
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid()))));

CREATE POLICY "tenant_sapi_breeding_health_logs_update" ON public.sapi_breeding_health_logs FOR UPDATE TO public
  USING ((tenant_id IN ( SELECT profiles.tenant_id
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid()))));

CREATE POLICY "Tenant Isolation Policy" ON public.kambing_penggemukan_batches FOR ALL TO public
  USING ((tenant_id IN ( SELECT profiles.tenant_id
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid()))))
  WITH CHECK ((tenant_id IN ( SELECT profiles.tenant_id
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid()))));

CREATE POLICY "Tenant Isolation Policy" ON public.kambing_penggemukan_animals FOR ALL TO public
  USING ((tenant_id IN ( SELECT profiles.tenant_id
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid()))))
  WITH CHECK ((tenant_id IN ( SELECT profiles.tenant_id
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid()))));

CREATE POLICY "Tenant Isolation Policy" ON public.kambing_penggemukan_weight_records FOR ALL TO public
  USING ((tenant_id IN ( SELECT profiles.tenant_id
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid()))))
  WITH CHECK ((tenant_id IN ( SELECT profiles.tenant_id
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid()))));

CREATE POLICY "Tenant Isolation Policy" ON public.kambing_penggemukan_feed_logs FOR ALL TO public
  USING ((tenant_id IN ( SELECT profiles.tenant_id
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid()))))
  WITH CHECK ((tenant_id IN ( SELECT profiles.tenant_id
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid()))));

CREATE POLICY "Tenant Isolation Policy" ON public.kambing_penggemukan_health_logs FOR ALL TO public
  USING ((tenant_id IN ( SELECT profiles.tenant_id
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid()))))
  WITH CHECK ((tenant_id IN ( SELECT profiles.tenant_id
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid()))));

CREATE POLICY "Tenant Isolation Policy" ON public.kambing_penggemukan_sales FOR ALL TO public
  USING ((tenant_id IN ( SELECT profiles.tenant_id
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid()))))
  WITH CHECK ((tenant_id IN ( SELECT profiles.tenant_id
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid()))));

CREATE POLICY "Tenant Isolation Policy" ON public.kambing_kandangs FOR ALL TO public
  USING ((tenant_id IN ( SELECT profiles.tenant_id
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid()))))
  WITH CHECK ((tenant_id IN ( SELECT profiles.tenant_id
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid()))));

CREATE POLICY "Tenant Isolation Policy" ON public.kambing_breeding_animals FOR ALL TO public
  USING ((tenant_id IN ( SELECT profiles.tenant_id
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid()))))
  WITH CHECK ((tenant_id IN ( SELECT profiles.tenant_id
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid()))));

CREATE POLICY "Tenant Isolation Policy" ON public.kambing_breeding_mating_records FOR ALL TO public
  USING ((tenant_id IN ( SELECT profiles.tenant_id
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid()))))
  WITH CHECK ((tenant_id IN ( SELECT profiles.tenant_id
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid()))));

CREATE POLICY "Tenant Isolation Policy" ON public.kambing_breeding_births FOR ALL TO public
  USING ((tenant_id IN ( SELECT profiles.tenant_id
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid()))))
  WITH CHECK ((tenant_id IN ( SELECT profiles.tenant_id
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid()))));

CREATE POLICY "Tenant Isolation Policy" ON public.kambing_breeding_weight_records FOR ALL TO public
  USING ((tenant_id IN ( SELECT profiles.tenant_id
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid()))))
  WITH CHECK ((tenant_id IN ( SELECT profiles.tenant_id
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid()))));

CREATE POLICY "Tenant Isolation Policy" ON public.kambing_breeding_health_logs FOR ALL TO public
  USING ((tenant_id IN ( SELECT profiles.tenant_id
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid()))))
  WITH CHECK ((tenant_id IN ( SELECT profiles.tenant_id
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid()))));

CREATE POLICY "Tenant Isolation Policy" ON public.kambing_breeding_feed_logs FOR ALL TO public
  USING ((tenant_id IN ( SELECT profiles.tenant_id
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid()))))
  WITH CHECK ((tenant_id IN ( SELECT profiles.tenant_id
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid()))));

CREATE POLICY "Tenant Isolation Policy" ON public.kambing_breeding_sales FOR ALL TO public
  USING ((tenant_id IN ( SELECT profiles.tenant_id
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid()))))
  WITH CHECK ((tenant_id IN ( SELECT profiles.tenant_id
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid()))));

CREATE POLICY "Tenant Isolation Policy" ON public.kambing_perah_kandangs FOR ALL TO public
  USING ((tenant_id IN ( SELECT profiles.tenant_id
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid()))))
  WITH CHECK ((tenant_id IN ( SELECT profiles.tenant_id
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid()))));

CREATE POLICY "Tenant Isolation Policy" ON public.kambing_perah_animal_groups FOR ALL TO public
  USING ((tenant_id IN ( SELECT profiles.tenant_id
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid()))))
  WITH CHECK ((tenant_id IN ( SELECT profiles.tenant_id
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid()))));

CREATE POLICY "Tenant Isolation Policy" ON public.kambing_perah_breeding_animals FOR ALL TO public
  USING ((tenant_id IN ( SELECT profiles.tenant_id
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid()))))
  WITH CHECK ((tenant_id IN ( SELECT profiles.tenant_id
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid()))));

CREATE POLICY "Tenant Isolation Policy" ON public.kambing_perah_lactation_cycles FOR ALL TO public
  USING ((tenant_id IN ( SELECT profiles.tenant_id
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid()))))
  WITH CHECK ((tenant_id IN ( SELECT profiles.tenant_id
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid()))));

CREATE POLICY "Tenant Isolation Policy" ON public.kambing_perah_milk_logs FOR ALL TO public
  USING ((tenant_id IN ( SELECT profiles.tenant_id
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid()))))
  WITH CHECK ((tenant_id IN ( SELECT profiles.tenant_id
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid()))));

CREATE POLICY "Tenant Isolation Policy" ON public.kambing_perah_milk_quality_logs FOR ALL TO public
  USING ((tenant_id IN ( SELECT profiles.tenant_id
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid()))))
  WITH CHECK ((tenant_id IN ( SELECT profiles.tenant_id
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid()))));

CREATE POLICY "Tenant Isolation Policy" ON public.kambing_perah_inventory_items FOR ALL TO public
  USING ((tenant_id IN ( SELECT profiles.tenant_id
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid()))))
  WITH CHECK ((tenant_id IN ( SELECT profiles.tenant_id
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid()))));

CREATE POLICY "Tenant Isolation Policy" ON public.kambing_perah_inventory_transactions FOR ALL TO public
  USING ((tenant_id IN ( SELECT profiles.tenant_id
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid()))))
  WITH CHECK ((tenant_id IN ( SELECT profiles.tenant_id
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid()))));

CREATE POLICY "Tenant Isolation Policy" ON public.kambing_perah_customer_registry FOR ALL TO public
  USING ((tenant_id IN ( SELECT profiles.tenant_id
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid()))))
  WITH CHECK ((tenant_id IN ( SELECT profiles.tenant_id
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid()))));

CREATE POLICY "Tenant Isolation Policy" ON public.kambing_perah_milk_sales FOR ALL TO public
  USING ((tenant_id IN ( SELECT profiles.tenant_id
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid()))))
  WITH CHECK ((tenant_id IN ( SELECT profiles.tenant_id
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid()))));

CREATE POLICY "Tenant Isolation Policy" ON public.kambing_perah_breeding_mating_records FOR ALL TO public
  USING ((tenant_id IN ( SELECT profiles.tenant_id
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid()))))
  WITH CHECK ((tenant_id IN ( SELECT profiles.tenant_id
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid()))));

CREATE POLICY "Tenant Isolation Policy" ON public.kambing_perah_breeding_births FOR ALL TO public
  USING ((tenant_id IN ( SELECT profiles.tenant_id
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid()))))
  WITH CHECK ((tenant_id IN ( SELECT profiles.tenant_id
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid()))));

CREATE POLICY "Tenant Isolation Policy" ON public.kambing_perah_breeding_health_logs FOR ALL TO public
  USING ((tenant_id IN ( SELECT profiles.tenant_id
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid()))))
  WITH CHECK ((tenant_id IN ( SELECT profiles.tenant_id
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid()))));

CREATE POLICY "Tenant Isolation Policy" ON public.kambing_perah_breeding_weight_records FOR ALL TO public
  USING ((tenant_id IN ( SELECT profiles.tenant_id
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid()))))
  WITH CHECK ((tenant_id IN ( SELECT profiles.tenant_id
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid()))));

CREATE POLICY "Tenant Isolation Policy" ON public.kambing_perah_penggemukan_batches FOR ALL TO public
  USING ((tenant_id IN ( SELECT profiles.tenant_id
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid()))))
  WITH CHECK ((tenant_id IN ( SELECT profiles.tenant_id
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid()))));

CREATE POLICY "Tenant Isolation Policy" ON public.kambing_perah_penggemukan_animals FOR ALL TO public
  USING ((tenant_id IN ( SELECT profiles.tenant_id
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid()))))
  WITH CHECK ((tenant_id IN ( SELECT profiles.tenant_id
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid()))));

CREATE POLICY "Tenant Isolation Policy" ON public.kambing_perah_penggemukan_weight_records FOR ALL TO public
  USING ((tenant_id IN ( SELECT profiles.tenant_id
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid()))))
  WITH CHECK ((tenant_id IN ( SELECT profiles.tenant_id
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid()))));

CREATE POLICY "Tenant Isolation Policy" ON public.kambing_perah_penggemukan_health_logs FOR ALL TO public
  USING ((tenant_id IN ( SELECT profiles.tenant_id
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid()))))
  WITH CHECK ((tenant_id IN ( SELECT profiles.tenant_id
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid()))));

CREATE POLICY "Tenant Isolation Policy" ON public.kambing_perah_penggemukan_sales FOR ALL TO public
  USING ((tenant_id IN ( SELECT profiles.tenant_id
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid()))))
  WITH CHECK ((tenant_id IN ( SELECT profiles.tenant_id
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid()))));

CREATE POLICY "Tenant Isolation Policy" ON public.kambing_perah_penggemukan_feed_logs FOR ALL TO public
  USING ((tenant_id IN ( SELECT profiles.tenant_id
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid()))))
  WITH CHECK ((tenant_id IN ( SELECT profiles.tenant_id
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid()))));

CREATE POLICY "Tenant Isolation Policy" ON public.kambing_perah_feed_formulations FOR ALL TO public
  USING ((tenant_id IN ( SELECT profiles.tenant_id
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid()))))
  WITH CHECK ((tenant_id IN ( SELECT profiles.tenant_id
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid()))));

CREATE POLICY "Tenant Isolation Policy" ON public.kambing_perah_breeding_feed_logs FOR ALL TO public
  USING ((tenant_id IN ( SELECT profiles.tenant_id
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid()))))
  WITH CHECK ((tenant_id IN ( SELECT profiles.tenant_id
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid()))));

CREATE POLICY "Tenant Isolation Policy" ON public.domba_penggemukan_weight_records FOR ALL TO public
  USING ((tenant_id IN ( SELECT profiles.tenant_id
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid()))))
  WITH CHECK ((tenant_id IN ( SELECT profiles.tenant_id
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid()))));

CREATE POLICY "Read same tenant memberships" ON public.tenant_memberships FOR SELECT TO authenticated
  USING ((tenant_id IN ( SELECT get_my_tenant_ids() AS get_my_tenant_ids)));

CREATE POLICY "Users can join teams" ON public.tenant_memberships FOR INSERT TO authenticated
  WITH CHECK ((auth_user_id = auth.uid()));

CREATE POLICY "Users can manage own memberships" ON public.tenant_memberships FOR ALL TO authenticated
  USING ((auth_user_id = auth.uid()))
  WITH CHECK ((auth_user_id = auth.uid()));

CREATE POLICY "Users can see their own memberships" ON public.tenant_memberships FOR SELECT TO public
  USING ((auth_user_id = auth.uid()));

CREATE OR REPLACE FUNCTION public.get_public_market_stats()
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  v_map json;
BEGIN
  -- Build a map of province -> transaction_count in last 7 days
  SELECT json_object_agg(province, tx_count) INTO v_map
  FROM (
    SELECT province, COUNT(*) as tx_count
    FROM (
      SELECT farms.province 
      FROM public.purchases p
      JOIN public.farms farms ON p.farm_id = farms.id
      WHERE p.transaction_date >= (CURRENT_DATE - INTERVAL '7 days')::date 
        AND p.is_deleted = false
      
      UNION ALL
      
      SELECT rpa.province 
      FROM public.sales s
      JOIN public.rpa_clients rpa ON s.rpa_id = rpa.id
      WHERE s.transaction_date >= (CURRENT_DATE - INTERVAL '7 days')::date 
        AND s.is_deleted = false
    ) all_tx
    WHERE province IS NOT NULL
    GROUP BY province
  ) grouped;

  RETURN COALESCE(v_map, '{}'::json);
END;
$function$
;

CREATE OR REPLACE FUNCTION public.auth_user_tenant_ids()
 RETURNS uuid[]
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT COALESCE(array_agg(DISTINCT tenant_id), '{}')
  FROM profiles
  WHERE auth_user_id = auth.uid()
$function$
;

CREATE OR REPLACE FUNCTION public.sync_sale_payment()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
declare
  v_total_paid bigint;
  v_sale       sales%rowtype;
begin
  select sum(amount) into v_total_paid
  from payments
  where sale_id = new.sale_id;

  select * into v_sale from sales where id = new.sale_id;

  update sales set
    paid_amount = v_total_paid,
    payment_status = case
      when v_total_paid >= v_sale.total_revenue then 'lunas'
      when v_total_paid > 0 then 'sebagian'
      else 'belum_lunas'
    end
  where id = new.sale_id;

  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.update_farm_last_transaction()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
begin
  update public.farms set
    last_transaction_date = new.transaction_date
  where id = new.farm_id;
  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.trg_sales_sync_market_price()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  v_date date;
BEGIN
  v_date := COALESCE(
    (NEW.transaction_date)::date,
    (OLD.transaction_date)::date
  );

  PERFORM public.aggregate_daily_market_price(v_date);

  IF TG_OP = 'UPDATE'
     AND OLD.transaction_date IS DISTINCT FROM NEW.transaction_date THEN
    PERFORM public.aggregate_daily_market_price(OLD.transaction_date::date);
  END IF;

  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_ai_conversations_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.trg_purchases_sync_market_price()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  v_date date;
BEGIN
  v_date := COALESCE(
    (NEW.transaction_date)::date,
    (OLD.transaction_date)::date
  );

  PERFORM public.aggregate_daily_market_price(v_date);

  IF TG_OP = 'UPDATE'
     AND OLD.transaction_date IS DISTINCT FROM NEW.transaction_date THEN
    PERFORM public.aggregate_daily_market_price(OLD.transaction_date::date);
  END IF;

  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_ai_pending_entries_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.aggregate_daily_market_price(p_date date)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_avg_buy  numeric(12,2);
  v_avg_sell numeric(12,2);
  v_tx_count int;
BEGIN
  SELECT ROUND(AVG(price_per_kg)::numeric, 0), COUNT(*)
  INTO v_avg_buy, v_tx_count
  FROM public.purchases
  WHERE transaction_date::date = p_date
    AND is_deleted = false
    AND price_per_kg > 0;

  SELECT ROUND(AVG(price_per_kg)::numeric, 0)
  INTO v_avg_sell
  FROM public.sales
  WHERE transaction_date::date = p_date
    AND is_deleted = false
    AND price_per_kg > 0;

  IF COALESCE(v_tx_count, 0) > 0 OR v_avg_sell IS NOT NULL THEN
    INSERT INTO public.market_prices (
      price_date, chicken_type, region,
      avg_buy_price, avg_sell_price,
      farm_gate_price, buyer_price,
      transaction_count, source
    )
    VALUES (
      p_date, 'broiler', 'Nasional',
      COALESCE(v_avg_buy, 0),
      COALESCE(v_avg_sell, 0),
      COALESCE(v_avg_buy, 0),
      COALESCE(v_avg_sell, 0),
      COALESCE(v_tx_count, 0),
      'transaction'
    )
    ON CONFLICT (price_date, chicken_type, region, source) DO UPDATE
    SET
      avg_buy_price     = EXCLUDED.avg_buy_price,
      avg_sell_price    = EXCLUDED.avg_sell_price,
      farm_gate_price   = EXCLUDED.farm_gate_price,
      buyer_price       = EXCLUDED.buyer_price,
      transaction_count = EXCLUDED.transaction_count
    WHERE market_prices.source = 'transaction'
       OR market_prices.source IS NULL;
  END IF;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.trg_kd_sync_animal_latest_weight()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  v_latest RECORD;
BEGIN
  SELECT weigh_date, weight_kg, bcs
  INTO v_latest
  FROM public.kd_penggemukan_weight_records
  WHERE animal_id = NEW.animal_id
    AND is_deleted = false
  ORDER BY weigh_date DESC, created_at DESC
  LIMIT 1;

  IF FOUND THEN
    UPDATE public.kd_penggemukan_animals
    SET
      latest_weight_kg   = v_latest.weight_kg,
      latest_weight_date = v_latest.weigh_date,
      latest_bcs         = v_latest.bcs,
      updated_at         = now()
    WHERE id = NEW.animal_id;
  END IF;

  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.trg_kd_sync_batch_mortality()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
  UPDATE public.kd_penggemukan_batches
  SET
    mortality_count = (
      SELECT COUNT(*)
      FROM public.kd_penggemukan_animals
      WHERE batch_id = NEW.batch_id
        AND status = 'dead'
        AND is_deleted = false
    ),
    updated_at = now()
  WHERE id = NEW.batch_id;

  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.create_new_business(p_business_name text, p_business_vertical text, p_phone text DEFAULT NULL::text, p_location text DEFAULT NULL::text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_tenant_id uuid;
  v_full_name text;
BEGIN
  SELECT full_name INTO v_full_name
  FROM profiles
  WHERE auth_user_id = auth.uid()
  LIMIT 1;

  INSERT INTO tenants(
    business_name, phone, location,
    business_vertical, plan, is_active,
    trial_ends_at, kandang_limit
  ) VALUES (
    p_business_name, p_phone, p_location,
    p_business_vertical, 'starter', true,
    now() + interval '14 days', 1
  ) RETURNING id INTO v_tenant_id;

  INSERT INTO profiles(
    tenant_id, auth_user_id, full_name,
    role, user_type, onboarded,
    business_model_selected, is_active
  ) VALUES (
    v_tenant_id, auth.uid(), v_full_name,
    'owner',
    CASE p_business_vertical
      WHEN 'egg_broker' THEN 'broker'
      WHEN 'peternak' THEN 'peternak'
      WHEN 'rpa' THEN 'rpa'
      ELSE 'broker'
    END,
    true, true, true
  );

  RETURN v_tenant_id;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.increment_kd_batch_animal_count(p_batch_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
  UPDATE public.kd_penggemukan_batches
  SET
    total_animals = (
      SELECT COUNT(*)
      FROM public.kd_penggemukan_animals
      WHERE batch_id = p_batch_id
        AND is_deleted = false
    ),
    updated_at = now()
  WHERE id = p_batch_id;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_my_tenant_ids()
 RETURNS SETOF uuid
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT DISTINCT tenant_id FROM profiles
  WHERE auth_user_id = auth.uid() AND tenant_id IS NOT NULL
$function$
;

CREATE OR REPLACE FUNCTION public.trg_kd_breeding_birth_update_mating()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.mating_record_id IS NOT NULL THEN
    UPDATE kd_breeding_mating_records
    SET status = 'melahirkan', updated_at = NOW()
    WHERE id = NEW.mating_record_id;
  END IF;
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.trg_kd_breeding_mark_dead()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.log_type = 'kematian' THEN
    UPDATE kd_breeding_animals
    SET status = 'mati', updated_at = NOW()
    WHERE id = NEW.animal_id;
  END IF;
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.trg_kd_breeding_mating_defaults()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.est_partus_date IS NULL AND NEW.mating_date IS NOT NULL THEN
    NEW.est_partus_date := NEW.mating_date + INTERVAL '150 days';
  END IF;
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.trg_kd_breeding_sync_animal_latest_weight()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE kd_breeding_animals
  SET
    latest_weight_kg   = NEW.weight_kg,
    latest_weight_date = NEW.weigh_date,
    latest_bcs         = NEW.bcs,
    updated_at         = NOW()
  WHERE id = NEW.animal_id
    AND (
      latest_weight_date IS NULL
      OR NEW.weigh_date >= latest_weight_date
    );
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.log_audit_action()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    v_actor_id uuid;
    v_record jsonb;
    v_tenant_id uuid;
    v_entity_id uuid;
BEGIN
    -- Get the actor matching the authenticated user
    v_actor_id := (SELECT id FROM profiles WHERE auth_user_id = auth.uid() LIMIT 1);
    
    -- Determine whether we are reading from NEW or OLD based on the operation
    IF TG_OP = 'DELETE' THEN
        v_record := to_jsonb(OLD);
    ELSE
        v_record := to_jsonb(NEW);
    END IF;

    -- Extract tenant_id dynamically without strict schema validation
    IF TG_TABLE_NAME = 'tenants' THEN
        v_tenant_id := (v_record->>'id')::uuid;
    ELSIF v_record ? 'tenant_id' THEN
        v_tenant_id := (v_record->>'tenant_id')::uuid;
    ELSE
        v_tenant_id := NULL;
    END IF;

    -- Extract entity_id dynamically
    IF v_record ? 'id' THEN
        v_entity_id := (v_record->>'id')::uuid;
    ELSE
        v_entity_id := NULL;
    END IF;

    -- Insert the audit log entry
    INSERT INTO global_audit_logs (
        actor_profile_id,
        tenant_id,
        action,
        entity_type,
        entity_id,
        old_data,
        new_data
    ) VALUES (
        v_actor_id,
        v_tenant_id,
        TG_OP || '_' || UPPER(TG_TABLE_NAME),
        TG_TABLE_NAME,
        v_entity_id,
        CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN to_jsonb(OLD) ELSE NULL END,
        CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) ELSE NULL END
    );
    
    -- Return appropriate record
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    END IF;
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.sync_sembako_customer_outstanding()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE sembako_customers SET
    total_outstanding = (
      SELECT COALESCE(SUM(remaining_amount), 0)
      FROM sembako_sales
      WHERE customer_id = COALESCE(NEW.customer_id, OLD.customer_id)
      AND is_deleted = false
      AND payment_status != 'lunas'
    ),
    total_purchases = (
      SELECT COALESCE(SUM(total_amount), 0)
      FROM sembako_sales
      WHERE customer_id = COALESCE(NEW.customer_id, OLD.customer_id)
      AND is_deleted = false
    )
  WHERE id = COALESCE(NEW.customer_id, OLD.customer_id);
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_sembako_product_stock()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE sembako_products SET
    current_stock = (
      SELECT COALESCE(SUM(qty_sisa), 0)
      FROM sembako_stock_batches
      WHERE product_id = COALESCE(NEW.product_id, OLD.product_id)
      AND is_deleted = false
    ),
    avg_buy_price = (
      SELECT COALESCE(
        ROUND(SUM(qty_sisa * buy_price) / NULLIF(SUM(qty_sisa), 0)), 0
      )
      FROM sembako_stock_batches
      WHERE product_id = COALESCE(NEW.product_id, OLD.product_id)
      AND is_deleted = false AND qty_sisa > 0
    )
  WHERE id = COALESCE(NEW.product_id, OLD.product_id);
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.my_tenant_id()
 RETURNS uuid
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  SELECT tenant_id FROM public.profiles WHERE auth_user_id = auth.uid() LIMIT 1;
$function$
;

CREATE OR REPLACE FUNCTION public.is_superadmin()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  SELECT COALESCE(
    (auth.jwt() -> 'app_metadata' ->> 'is_superadmin')::boolean,
    false
  );
$function$
;

CREATE OR REPLACE FUNCTION public.my_user_type()
 RETURNS text
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select user_type from profiles
  where auth_user_id = auth.uid() limit 1;
$function$
;

CREATE OR REPLACE FUNCTION public.recalc_sembako_customer_balance(v_customer_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    UPDATE sembako_customers SET
        total_outstanding = (
            COALESCE((SELECT SUM(total_amount) FROM sembako_sales WHERE customer_id = v_customer_id AND is_deleted = false), 0) -
            COALESCE((SELECT SUM(amount) FROM sembako_payments WHERE customer_id = v_customer_id AND is_deleted = false), 0)
        )
    WHERE id = v_customer_id;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.tr_sync_sembako_balance()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    IF TG_OP = 'DELETE' THEN
        PERFORM recalc_sembako_customer_balance(OLD.customer_id);
        RETURN OLD;
    ELSE
        PERFORM recalc_sembako_customer_balance(NEW.customer_id);
        RETURN NEW;
    END IF;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.downgrade_expired_plans()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
  UPDATE public.tenants
  SET plan = 'starter', kandang_limit = 1, plan_expires_at = NULL
  WHERE plan IN ('pro', 'business')
    AND plan_expires_at IS NOT NULL
    AND plan_expires_at < NOW();
END; $function$
;

CREATE OR REPLACE FUNCTION public.get_kandang_limit(p_tenant_id uuid)
 RETURNS integer
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
  SELECT kandang_limit FROM tenants WHERE id = p_tenant_id
$function$
;

CREATE OR REPLACE FUNCTION public.get_my_tenant_id()
 RETURNS uuid
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _tenant_id uuid;
BEGIN
  SELECT tenant_id INTO _tenant_id
  FROM public.profiles
  WHERE auth_user_id = auth.uid()
  LIMIT 1;
  RETURN _tenant_id;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.is_my_tenant(_tenant_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN _tenant_id = get_my_tenant_id();
END;
$function$
;

CREATE OR REPLACE FUNCTION public.sync_rpa_customer_outstanding()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE rpa_customers SET
    total_outstanding = (
      SELECT COALESCE(SUM(remaining_amount), 0)
      FROM rpa_invoices
      WHERE customer_id = COALESCE(NEW.customer_id, OLD.customer_id)
      AND is_deleted = false
      AND payment_status != 'lunas'
    ),
    total_purchases = (
      SELECT COALESCE(SUM(total_amount), 0)
      FROM rpa_invoices
      WHERE customer_id = COALESCE(NEW.customer_id, OLD.customer_id)
      AND is_deleted = false
    )
  WHERE id = COALESCE(NEW.customer_id, OLD.customer_id);
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.deduct_egg_stock_on_sale()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  v_item record;
  v_qty_total integer;
BEGIN
  IF NEW.fulfillment_status = 'completed' AND (OLD.fulfillment_status IS NULL OR OLD.fulfillment_status != 'completed') THEN
    FOR v_item IN SELECT si.inventory_id, si.qty_pack, inv.eggs_per_pack FROM egg_sale_items si JOIN egg_inventory inv ON inv.id = si.inventory_id WHERE si.sale_id = NEW.id
    LOOP
      v_qty_total := v_item.qty_pack * v_item.eggs_per_pack;
      UPDATE egg_inventory SET current_stock_butir = current_stock_butir - v_qty_total, updated_at = now() WHERE id = v_item.inventory_id;
      INSERT INTO egg_stock_logs (tenant_id, inventory_id, sale_id, log_type, qty_butir, notes)
      VALUES (NEW.tenant_id, v_item.inventory_id, NEW.id, 'out', -v_qty_total, 'Auto deduct dari penjualan ' || NEW.invoice_number);
    END LOOP;
  END IF;
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_egg_customer_stats()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.fulfillment_status = 'completed' AND (OLD.fulfillment_status IS NULL OR OLD.fulfillment_status != 'completed') THEN
    IF NEW.customer_id IS NOT NULL THEN
      UPDATE egg_customers
         SET total_spent = total_spent + NEW.total_price,
             total_orders = total_orders + 1,
             updated_at = now()
       WHERE id = NEW.customer_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.generate_egg_invoice_number(p_tenant_id uuid)
 RETURNS text
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  v_date    text;
  v_count   integer;
BEGIN
  v_date  := to_char(now(), 'YYYYMMDD');
  SELECT COUNT(*) + 1 INTO v_count FROM egg_sales WHERE tenant_id = p_tenant_id AND to_char(transaction_date, 'YYYYMMDD') = v_date;
  RETURN 'EP-' || v_date || '-' || LPAD(v_count::text, 3, '0');
END;
$function$
;

CREATE OR REPLACE FUNCTION public.trg_sapi_sync_animal_latest_weight()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  v_latest RECORD;
BEGIN
  SELECT weigh_date, weight_kg, bcs
  INTO v_latest
  FROM public.sapi_penggemukan_weight_records
  WHERE animal_id = NEW.animal_id
    AND is_deleted = false
  ORDER BY weigh_date DESC, created_at DESC
  LIMIT 1;

  IF FOUND THEN
    UPDATE public.sapi_penggemukan_animals
    SET
      latest_weight_kg   = v_latest.weight_kg,
      latest_weight_date = v_latest.weigh_date,
      latest_bcs         = v_latest.bcs,
      updated_at         = now()
    WHERE id = NEW.animal_id;
  END IF;

  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.set_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
begin
  new.updated_at = now();
  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.recalc_sembako_customer_balance()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
    v_customer_id uuid;
BEGIN
    IF TG_OP = 'DELETE' THEN
        v_customer_id := OLD.customer_id;
    ELSE
        v_customer_id := NEW.customer_id;
    END IF;

    IF v_customer_id IS NULL THEN
        RETURN COALESCE(NEW, OLD);
    END IF;

    UPDATE sembako_customers
    SET total_outstanding = COALESCE(
        (SELECT SUM(remaining_amount)
         FROM sembako_sales
         WHERE customer_id = v_customer_id
           AND is_deleted = false
        ), 0
    )
    WHERE id = v_customer_id;

    RETURN COALESCE(NEW, OLD);
END;
$function$
;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_tenant_id uuid;
  v_user_type text;
begin
  -- Flow C: user undangan → skip, trigger invite yang handle
  if (new.raw_user_meta_data->>'invite_token') is not null then
    return new;
  end if;

  -- Flow A & B: Register baru → buat placeholder tenant
  -- OnboardingFlow akan UPDATE tenant ini dengan data lengkap
  v_user_type := coalesce(
    new.raw_user_meta_data->>'user_type', 'broker'
  );

  -- Insert placeholder tenant
  insert into tenants(
    business_name,
    owner_name,
    phone,
    plan,
    is_active
  ) values (
    coalesce(new.raw_user_meta_data->>'business_name', 'Bisnis Saya'),
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'phone',
    'starter',
    true
  )
  returning id into v_tenant_id;

  -- Insert profile owner
  insert into profiles(
    tenant_id,
    auth_user_id,
    full_name,
    role,
    user_type,
    onboarded,
    business_model_selected
  ) values (
    v_tenant_id,
    new.id,
    new.raw_user_meta_data->>'full_name',
    'owner',
    v_user_type,
    false,
    false
  );

  return new;

exception when others then
  -- Jangan crash signup meski ada error DB
  raise warning 'handle_new_user error: %', sqlerrm;
  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.trg_sapi_sync_batch_mortality()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
  UPDATE public.sapi_penggemukan_batches
  SET
    mortality_count = (
      SELECT COUNT(*)
      FROM public.sapi_penggemukan_animals
      WHERE batch_id = NEW.batch_id
        AND status = 'dead'
        AND is_deleted = false
    ),
    updated_at = now()
  WHERE id = NEW.batch_id;

  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.increment_sapi_batch_animal_count(p_batch_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
  UPDATE public.sapi_penggemukan_batches
  SET
    total_animals = (
      SELECT COUNT(*)
      FROM public.sapi_penggemukan_animals
      WHERE batch_id = p_batch_id
        AND is_deleted = false
    ),
    updated_at = now()
  WHERE id = p_batch_id;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_province_price_trends(p_province text, p_start_date date, p_end_date date)
 RETURNS TABLE(price_date date, avg_buy numeric, avg_sell numeric)
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  WITH buy AS (
    SELECT p.transaction_date::date AS d, AVG(p.price_per_kg)::numeric AS avg
    FROM public.purchases p JOIN public.farms f ON f.id = p.farm_id
    WHERE p.is_deleted = false
      AND f.province ILIKE p_province
      AND p.transaction_date::date BETWEEN p_start_date AND p_end_date
    GROUP BY 1
  ),
  sell AS (
    SELECT s.transaction_date::date AS d, AVG(s.price_per_kg)::numeric AS avg
    FROM public.sales s JOIN public.rpa_clients r ON r.id = s.rpa_id
    WHERE s.is_deleted = false
      AND r.province ILIKE p_province
      AND s.transaction_date::date BETWEEN p_start_date AND p_end_date
    GROUP BY 1
  )
  SELECT 
    COALESCE(b.d, sl.d) AS price_date, -- Nama kolom harus price_date
    b.avg AS avg_buy, 
    sl.avg AS avg_sell
  FROM buy b FULL OUTER JOIN sell sl ON b.d = sl.d 
  ORDER BY 1;
$function$
;

CREATE OR REPLACE FUNCTION public.record_market_price()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_date   date := new.transaction_date;
  v_region text := 'Nasional';
BEGIN
  IF TG_TABLE_NAME = 'purchases' THEN
    INSERT INTO public.market_prices
      (price_date, chicken_type, region,
       avg_buy_price, farm_gate_price,
       transaction_count, source)
    VALUES (
      v_date, 'broiler', v_region,
      new.price_per_kg, new.price_per_kg,
      1, 'transaction'
    )
    ON CONFLICT (price_date, chicken_type, region, source)
    DO UPDATE SET
      avg_buy_price = (COALESCE(market_prices.avg_buy_price, 0) * market_prices.transaction_count + new.price_per_kg) / (market_prices.transaction_count + 1),
      farm_gate_price = (COALESCE(market_prices.farm_gate_price, 0) * market_prices.transaction_count + new.price_per_kg) / (market_prices.transaction_count + 1),
      transaction_count = market_prices.transaction_count + 1,
      updated_at = now()
    WHERE market_prices.source = 'transaction' OR market_prices.source IS NULL;
  END IF;

  IF TG_TABLE_NAME = 'sales' THEN
    INSERT INTO public.market_prices
      (price_date, chicken_type, region,
       avg_sell_price, buyer_price,
       transaction_count, source)
    VALUES (
      v_date, 'broiler', v_region,
      new.price_per_kg, new.price_per_kg,
      1, 'transaction'
    )
    ON CONFLICT (price_date, chicken_type, region, source)
    DO UPDATE SET
      avg_sell_price = (COALESCE(market_prices.avg_sell_price, 0) * market_prices.transaction_count + new.price_per_kg) / (market_prices.transaction_count + 1),
      buyer_price = (COALESCE(market_prices.buyer_price, 0) * market_prices.transaction_count + new.price_per_kg) / (market_prices.transaction_count + 1),
      transaction_count = market_prices.transaction_count + 1,
      updated_at = now()
    WHERE market_prices.source = 'transaction' OR market_prices.source IS NULL;
  END IF;

  RETURN new;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.sync_rpa_outstanding()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
declare
  v_rpa_id uuid;
  v_tenant_id uuid;
begin
  v_rpa_id    := coalesce(new.rpa_id, old.rpa_id);
  v_tenant_id := coalesce(new.tenant_id, old.tenant_id);

  update public.rpa_clients set
    total_outstanding = (
      select coalesce(sum(remaining_amount), 0)
      from public.sales
      where rpa_id = v_rpa_id
        and payment_status != 'lunas'
        and is_deleted = false
    ),
    last_deal_price = (
      select price_per_kg from public.sales
      where rpa_id = v_rpa_id
        and is_deleted = false
      order by created_at desc
      limit 1
    )
  where id = v_rpa_id
    and tenant_id = v_tenant_id;

  return coalesce(new, old);
end;
$function$
;

CREATE OR REPLACE FUNCTION public.trg_sapi_breeding_mating_defaults()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
  IF NEW.est_partus_date IS NULL THEN
    NEW.est_partus_date := NEW.mating_date + INTERVAL '285 days';
  END IF;
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.trg_sapi_breeding_birth_mating()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
  -- Update status mating record
  IF NEW.mating_record_id IS NOT NULL THEN
    UPDATE public.sapi_breeding_mating_records
    SET status = 'melahirkan', updated_at = now()
    WHERE id = NEW.mating_record_id;
  END IF;

  -- Increment parity indukan — setiap kelahiran = satu siklus bunting selesai
  UPDATE public.sapi_breeding_animals
  SET parity = parity + 1, updated_at = now()
  WHERE id = NEW.dam_id;

  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.trg_sapi_breeding_weight_sync()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  v_latest RECORD;
BEGIN
  SELECT weigh_date, weight_kg, bcs
  INTO v_latest
  FROM public.sapi_breeding_weight_records
  WHERE animal_id = NEW.animal_id
    AND is_deleted = false
  ORDER BY weigh_date DESC, created_at DESC
  LIMIT 1;

  IF FOUND THEN
    UPDATE public.sapi_breeding_animals
    SET
      latest_weight_kg   = v_latest.weight_kg,
      latest_weight_date = v_latest.weigh_date,
      latest_bcs         = v_latest.bcs,
      updated_at         = now()
    WHERE id = NEW.animal_id;
  END IF;

  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.trg_sapi_breeding_health_mark_dead()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
  IF NEW.log_type = 'kematian' AND NOT NEW.is_deleted THEN
    UPDATE public.sapi_breeding_animals
    SET status = 'mati', exit_date = NEW.log_date, updated_at = now()
    WHERE id = NEW.animal_id;
  END IF;
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.trg_sapi_breeding_sale_mark_sold()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
  IF NOT NEW.is_deleted THEN
    UPDATE public.sapi_breeding_animals
    SET status = 'terjual', exit_date = NEW.sale_date, updated_at = now()
    WHERE id = NEW.animal_id;
  END IF;
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.my_role()
 RETURNS text
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  SELECT role FROM public.profiles WHERE auth_user_id = auth.uid() LIMIT 1;
$function$
;

CREATE OR REPLACE FUNCTION public.trg_peternak_generate_task_instances()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  v_curr_date DATE;
  v_end_loop  DATE;
  v_profile_id UUID;
  v_should_create BOOLEAN;
BEGIN
  IF NEW.default_assignee_worker_id IS NOT NULL THEN
    SELECT profile_id INTO v_profile_id 
    FROM public.kandang_workers 
    WHERE id = NEW.default_assignee_worker_id;
  END IF;

  v_curr_date := GREATEST(NEW.start_date, CURRENT_DATE);

  -- If end_date is set (e.g. 150-day template), generate ALL instances up to end_date.
  -- If no end_date (forever), generate rolling 30-day window.
  v_end_loop := COALESCE(NEW.end_date, CURRENT_DATE + INTERVAL '30 days');

  IF TG_OP = 'UPDATE' THEN
    DELETE FROM public.peternak_task_instances
    WHERE template_id = NEW.id
      AND status = 'pending'
      AND due_date >= v_curr_date;
  END IF;

  WHILE v_curr_date <= v_end_loop LOOP
    v_should_create := FALSE;

    CASE NEW.recurring_type
      WHEN 'harian' THEN 
        v_should_create := TRUE;
      WHEN 'mingguan' THEN
        IF EXTRACT(isodow FROM v_curr_date) = ANY(NEW.recurring_days_of_week) THEN
          v_should_create := TRUE;
        END IF;
      WHEN 'dua_mingguan' THEN
        IF (v_curr_date - NEW.start_date) % 14 = 0 THEN
          v_should_create := TRUE;
        END IF;
      WHEN 'bulanan' THEN
        IF EXTRACT(day FROM v_curr_date) = EXTRACT(day FROM NEW.start_date) THEN
          v_should_create := TRUE;
        END IF;
      WHEN 'custom' THEN
        IF (v_curr_date - NEW.start_date) % COALESCE(NEW.recurring_interval_days, 1) = 0 THEN
          v_should_create := TRUE;
        END IF;
      WHEN 'sekali' THEN
        IF v_curr_date = NEW.start_date THEN
          v_should_create := TRUE;
        END IF;
    END CASE;

    IF v_should_create THEN
      INSERT INTO public.peternak_task_instances (
        tenant_id, template_id, kandang_name,
        title, description, task_type,
        due_date, assigned_worker_id, assigned_profile_id
      ) VALUES (
        NEW.tenant_id, NEW.id, NEW.kandang_name,
        NEW.title, NEW.description, NEW.task_type,
        v_curr_date, NEW.default_assignee_worker_id, v_profile_id
      )
      ON CONFLICT DO NOTHING;
    END IF;

    v_curr_date := v_curr_date + 1;
  END LOOP;

  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.auto_resolve_loss_reports()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.payment_status = 'lunas' AND OLD.payment_status != 'lunas' THEN
    UPDATE public.loss_reports
    SET 
      resolved = true,
      resolved_at = now()
    WHERE sale_id = NEW.id
      AND resolved = false
      AND is_deleted = false;
  END IF;
  
  IF OLD.payment_status = 'lunas' AND NEW.payment_status != 'lunas' THEN
    UPDATE public.loss_reports
    SET 
      resolved = false,
      resolved_at = null
    WHERE sale_id = NEW.id
      AND is_deleted = false;
  END IF;
  
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.trg_sales_sync_rpa_outstanding()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    v_rpa_id uuid;
BEGIN
    IF (TG_OP = 'DELETE') THEN v_rpa_id := OLD.rpa_id;
    ELSE v_rpa_id := NEW.rpa_id;
    END IF;

    IF v_rpa_id IS NOT NULL THEN
        UPDATE public.rpa_clients 
        SET total_outstanding = (
            SELECT coalesce(sum(remaining_amount), 0)
            FROM public.sales -- Menambahkan public.
            WHERE rpa_id = v_rpa_id
              AND payment_status != 'lunas'
              AND is_deleted = false
        )
        WHERE id = v_rpa_id;
    END IF;

    RETURN NULL;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.generate_invoice_number()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
begin
  if new.invoice_number is null then
    new.invoice_number := 'INV-' ||
      to_char(now(), 'YYYYMM') || '-' ||
      lpad(nextval('invoice_seq')::text, 4, '0');
  end if;
  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.update_cycle_summary()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
declare
  v_cycle breeding_cycles%rowtype;
  v_total_feed decimal;
  v_total_mortality integer;
  v_days integer;
  v_fcr decimal;
begin
  select * into v_cycle from breeding_cycles where id = new.cycle_id;

  select
    coalesce(sum(feed_kg), 0),
    coalesce(sum(mortality_count + cull_count), 0),
    count(*)
  into v_total_feed, v_total_mortality, v_days
  from daily_records
  where cycle_id = new.cycle_id;

  -- FCR = total pakan / (jumlah hidup × bobot rata-rata)
  if new.avg_weight_kg is not null
     and (v_cycle.doc_count - v_total_mortality) > 0 then
    v_fcr := v_total_feed /
             ((v_cycle.doc_count - v_total_mortality) * new.avg_weight_kg);
  end if;

  update breeding_cycles set
    total_feed_kg    = v_total_feed,
    total_mortality  = v_total_mortality,
    final_count      = v_cycle.doc_count - v_total_mortality,
    final_avg_weight_kg = new.avg_weight_kg,
    final_fcr        = v_fcr
  where id = new.cycle_id;

  return new;
end;
$function$
;