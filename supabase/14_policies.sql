-- 14_policies.sql
-- Generated from Supabase POLICIES.txt
-- Last sync: 2026-05-12
-- DO NOT EDIT MANUALLY — regenerate from snapshot .txt

DROP POLICY IF EXISTS "cron_job_policy" ON "cron"."job";
CREATE POLICY "cron_job_policy" ON "cron"."job" AS PERMISSIVE FOR ALL TO public USING (username = CURRENT_USER);

DROP POLICY IF EXISTS "cron_job_run_details_policy" ON "cron"."job_run_details";
CREATE POLICY "cron_job_run_details_policy" ON "cron"."job_run_details" AS PERMISSIVE FOR ALL TO public USING (username = CURRENT_USER);

DROP POLICY IF EXISTS "Users can see anomalies in their tenant" ON "public"."ai_anomaly_logs";
CREATE POLICY "Users can see anomalies in their tenant" ON "public"."ai_anomaly_logs" AS PERMISSIVE FOR SELECT
   FROM profiles
  WHERE ((profiles.auth_user_id = auth.uid()) AND (profiles.tenant_id = ai_anomaly_logs.tenant_id))))                                                                                                                                                                                                                                                                                                                 | null                                                                                                                                                                                                                                                                                                                                 | TO authenticated;

DROP POLICY IF EXISTS "ai_anomaly_logs_superadmin_all" ON "public"."ai_anomaly_logs";
CREATE POLICY "ai_anomaly_logs_superadmin_all" ON "public"."ai_anomaly_logs" AS PERMISSIVE FOR ALL TO authenticated USING is_superadmin() WITH CHECK is_superadmin();

DROP POLICY IF EXISTS "superadmin_delete" ON "public"."ai_anomaly_logs";
CREATE POLICY "superadmin_delete" ON "public"."ai_anomaly_logs" AS PERMISSIVE FOR DELETE
   FROM profiles
  WHERE ((profiles.auth_user_id = auth.uid()) AND (profiles.role = 'superadmin'::text))))                                                                                                                                                                                                                                                                                                                             | null                                                                                                                                                                                                                                                                                                                                 | TO authenticated;

DROP POLICY IF EXISTS "ai_conversations_delete" ON "public"."ai_conversations";
CREATE POLICY "ai_conversations_delete" ON "public"."ai_conversations" AS PERMISSIVE FOR DELETE
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid())))                                                                                                                                                                                                                                                                                                                                                       | null                                                                                                                                                                                                                                                                                                                                 | TO authenticated;

DROP POLICY IF EXISTS "ai_conversations_insert" ON "public"."ai_conversations";
CREATE POLICY "ai_conversations_insert" ON "public"."ai_conversations" AS PERMISSIVE FOR INSERT TO authenticated USING null
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid())))                                                                                                                                                                                                                                  |;

DROP POLICY IF EXISTS "ai_conversations_select" ON "public"."ai_conversations";
CREATE POLICY "ai_conversations_select" ON "public"."ai_conversations" AS PERMISSIVE FOR SELECT
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid())))                                                                                                                                                                                                                                                                                                                                                       | null                                                                                                                                                                                                                                                                                                                                 | TO authenticated;

DROP POLICY IF EXISTS "ai_conversations_update" ON "public"."ai_conversations";
CREATE POLICY "ai_conversations_update" ON "public"."ai_conversations" AS PERMISSIVE FOR UPDATE
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid())))                                                                                                                                                                                                                                                                                                                                                       | (profile_id IN ( SELECT profiles.id
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid())))                                                                                                                                                                                                                                  | TO authenticated;

DROP POLICY IF EXISTS "Users can insert own error logs" ON "public"."ai_error_logs";
CREATE POLICY "Users can insert own error logs" ON "public"."ai_error_logs" AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (auth.uid() = profile_id);

DROP POLICY IF EXISTS "Ai feedback tenant access" ON "public"."ai_feedback";
CREATE POLICY "Ai feedback tenant access" ON "public"."ai_feedback" AS PERMISSIVE FOR ALL TO authenticated USING is_tenant_member(tenant_id) WITH CHECK is_tenant_member(tenant_id);

DROP POLICY IF EXISTS "ai_pending_entries_delete" ON "public"."ai_pending_entries";
CREATE POLICY "ai_pending_entries_delete" ON "public"."ai_pending_entries" AS PERMISSIVE FOR DELETE
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid())))                                                                                                                                                                                                                                                                                                                                                       | null                                                                                                                                                                                                                                                                                                                                 | TO authenticated;

DROP POLICY IF EXISTS "ai_pending_entries_insert" ON "public"."ai_pending_entries";
CREATE POLICY "ai_pending_entries_insert" ON "public"."ai_pending_entries" AS PERMISSIVE FOR INSERT TO authenticated USING null
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid())))                                                                                                                                                                                                                                  |;

DROP POLICY IF EXISTS "ai_pending_entries_select" ON "public"."ai_pending_entries";
CREATE POLICY "ai_pending_entries_select" ON "public"."ai_pending_entries" AS PERMISSIVE FOR SELECT
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid())))                                                                                                                                                                                                                                                                                                                                                       | null                                                                                                                                                                                                                                                                                                                                 | TO authenticated;

DROP POLICY IF EXISTS "ai_pending_entries_update" ON "public"."ai_pending_entries";
CREATE POLICY "ai_pending_entries_update" ON "public"."ai_pending_entries" AS PERMISSIVE FOR UPDATE
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid())))                                                                                                                                                                                                                                                                                                                                                       | (profile_id IN ( SELECT profiles.id
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid())))                                                                                                                                                                                                                                  | TO authenticated;

DROP POLICY IF EXISTS "Ai staged transactions tenant access" ON "public"."ai_staged_transactions";
CREATE POLICY "Ai staged transactions tenant access" ON "public"."ai_staged_transactions" AS PERMISSIVE FOR ALL TO authenticated USING is_tenant_member(tenant_id) WITH CHECK is_tenant_member(tenant_id);

DROP POLICY IF EXISTS "ai_staged_transactions_superadmin_all" ON "public"."ai_staged_transactions";
CREATE POLICY "ai_staged_transactions_superadmin_all" ON "public"."ai_staged_transactions" AS PERMISSIVE FOR ALL TO authenticated USING is_superadmin() WITH CHECK is_superadmin();

DROP POLICY IF EXISTS "superadmin_delete" ON "public"."ai_staged_transactions";
CREATE POLICY "superadmin_delete" ON "public"."ai_staged_transactions" AS PERMISSIVE FOR DELETE
   FROM profiles
  WHERE ((profiles.auth_user_id = auth.uid()) AND (profiles.role = 'superadmin'::text))))                                                                                                                                                                                                                                                                                                                             | null                                                                                                                                                                                                                                                                                                                                 | TO authenticated;

DROP POLICY IF EXISTS "breeding_cycles_delete" ON "public"."breeding_cycles";
CREATE POLICY "breeding_cycles_delete" ON "public"."breeding_cycles" AS PERMISSIVE FOR DELETE TO authenticated USING is_superadmin();

DROP POLICY IF EXISTS "breeding_cycles_insert" ON "public"."breeding_cycles";
CREATE POLICY "breeding_cycles_insert" ON "public"."breeding_cycles" AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((is_tenant_member(tenant_id) AND (my_role_for(tenant_id) = ANY (ARRAY['owner'::text, 'staff'::text]))) OR is_superadmin());

DROP POLICY IF EXISTS "breeding_cycles_select" ON "public"."breeding_cycles";
CREATE POLICY "breeding_cycles_select" ON "public"."breeding_cycles" AS PERMISSIVE FOR SELECT TO authenticated USING (is_tenant_member(tenant_id) OR is_superadmin());

DROP POLICY IF EXISTS "breeding_cycles_update" ON "public"."breeding_cycles";
CREATE POLICY "breeding_cycles_update" ON "public"."breeding_cycles" AS PERMISSIVE FOR UPDATE TO authenticated USING ((is_tenant_member(tenant_id) AND (my_role_for(tenant_id) = ANY (ARRAY['owner'::text, 'staff'::text]))) OR is_superadmin()) WITH CHECK ((is_tenant_member(tenant_id) AND (my_role_for(tenant_id) = ANY (ARRAY['owner'::text, 'staff'::text]))) OR is_superadmin());

DROP POLICY IF EXISTS "Target can respond to connection" ON "public"."broker_connections";
CREATE POLICY "Target can respond to connection" ON "public"."broker_connections" AS PERMISSIVE FOR UPDATE
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid()))) OR ((requester_tenant_id IN ( SELECT profiles.tenant_id
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid()))) AND (status = 'pending'::text)))                                                                                                                                                                                | null                                                                                                                                                                                                                                                                                                                                 | TO authenticated;

DROP POLICY IF EXISTS "Tenant can request connection" ON "public"."broker_connections";
CREATE POLICY "Tenant can request connection" ON "public"."broker_connections" AS PERMISSIVE FOR INSERT TO authenticated USING null
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid())))                                                                                                                                                                                                                  |;

DROP POLICY IF EXISTS "Tenant can view own connections" ON "public"."broker_connections";
CREATE POLICY "Tenant can view own connections" ON "public"."broker_connections" AS PERMISSIVE FOR SELECT
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid()))) OR (target_tenant_id IN ( SELECT profiles.tenant_id
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid()))))                                                                                                                                                                                                                 | null                                                                                                                                                                                                                                                                                                                                 | TO authenticated;

DROP POLICY IF EXISTS "broker_connections_superadmin_all" ON "public"."broker_connections";
CREATE POLICY "broker_connections_superadmin_all" ON "public"."broker_connections" AS PERMISSIVE FOR ALL TO authenticated USING is_superadmin() WITH CHECK is_superadmin();

DROP POLICY IF EXISTS "broker_profiles_delete" ON "public"."broker_profiles";
CREATE POLICY "broker_profiles_delete" ON "public"."broker_profiles" AS PERMISSIVE FOR DELETE TO authenticated USING ((is_tenant_member(tenant_id) AND (my_role_for(tenant_id) = 'owner'::text)) OR is_superadmin());

DROP POLICY IF EXISTS "broker_profiles_insert" ON "public"."broker_profiles";
CREATE POLICY "broker_profiles_insert" ON "public"."broker_profiles" AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((is_tenant_member(tenant_id) AND (my_role_for(tenant_id) = ANY (ARRAY['owner'::text, 'manajer'::text, 'admin'::text]))) OR is_superadmin());

DROP POLICY IF EXISTS "broker_profiles_select" ON "public"."broker_profiles";
CREATE POLICY "broker_profiles_select" ON "public"."broker_profiles" AS PERMISSIVE FOR SELECT TO authenticated USING (is_tenant_member(tenant_id) OR is_superadmin());

DROP POLICY IF EXISTS "broker_profiles_superadmin_all" ON "public"."broker_profiles";
CREATE POLICY "broker_profiles_superadmin_all" ON "public"."broker_profiles" AS PERMISSIVE FOR ALL TO authenticated USING is_superadmin() WITH CHECK is_superadmin();

DROP POLICY IF EXISTS "broker_profiles_update" ON "public"."broker_profiles";
CREATE POLICY "broker_profiles_update" ON "public"."broker_profiles" AS PERMISSIVE FOR UPDATE TO authenticated USING ((is_tenant_member(tenant_id) AND (my_role_for(tenant_id) = ANY (ARRAY['owner'::text, 'manajer'::text, 'admin'::text]))) OR is_superadmin()) WITH CHECK ((is_tenant_member(tenant_id) AND (my_role_for(tenant_id) = ANY (ARRAY['owner'::text, 'manajer'::text, 'admin'::text]))) OR is_superadmin());

DROP POLICY IF EXISTS "superadmin_delete" ON "public"."broker_profiles";
CREATE POLICY "superadmin_delete" ON "public"."broker_profiles" AS PERMISSIVE FOR DELETE
   FROM profiles
  WHERE ((profiles.auth_user_id = auth.uid()) AND (profiles.role = 'superadmin'::text))))                                                                                                                                                                                                                                                                                                                             | null                                                                                                                                                                                                                                                                                                                                 | TO authenticated;

DROP POLICY IF EXISTS "batches_all" ON "public"."chicken_batches";
CREATE POLICY "batches_all" ON "public"."chicken_batches" AS PERMISSIVE FOR ALL TO authenticated USING (is_tenant_member(tenant_id) OR is_superadmin()) WITH CHECK is_tenant_member(tenant_id);

DROP POLICY IF EXISTS "cycle_expenses_delete" ON "public"."cycle_expenses";
CREATE POLICY "cycle_expenses_delete" ON "public"."cycle_expenses" AS PERMISSIVE FOR DELETE TO authenticated USING is_superadmin();

DROP POLICY IF EXISTS "cycle_expenses_insert" ON "public"."cycle_expenses";
CREATE POLICY "cycle_expenses_insert" ON "public"."cycle_expenses" AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((is_tenant_member(tenant_id) AND (my_role_for(tenant_id) = ANY (ARRAY['owner'::text, 'staff'::text]))) OR is_superadmin());

DROP POLICY IF EXISTS "cycle_expenses_select" ON "public"."cycle_expenses";
CREATE POLICY "cycle_expenses_select" ON "public"."cycle_expenses" AS PERMISSIVE FOR SELECT TO authenticated USING (is_tenant_member(tenant_id) OR is_superadmin());

DROP POLICY IF EXISTS "cycle_expenses_superadmin_all" ON "public"."cycle_expenses";
CREATE POLICY "cycle_expenses_superadmin_all" ON "public"."cycle_expenses" AS PERMISSIVE FOR ALL TO authenticated USING is_superadmin() WITH CHECK is_superadmin();

DROP POLICY IF EXISTS "cycle_expenses_update" ON "public"."cycle_expenses";
CREATE POLICY "cycle_expenses_update" ON "public"."cycle_expenses" AS PERMISSIVE FOR UPDATE TO authenticated USING ((is_tenant_member(tenant_id) AND (my_role_for(tenant_id) = ANY (ARRAY['owner'::text, 'staff'::text]))) OR is_superadmin()) WITH CHECK ((is_tenant_member(tenant_id) AND (my_role_for(tenant_id) = ANY (ARRAY['owner'::text, 'staff'::text]))) OR is_superadmin());

DROP POLICY IF EXISTS "daily_records_delete" ON "public"."daily_records";
CREATE POLICY "daily_records_delete" ON "public"."daily_records" AS PERMISSIVE FOR DELETE TO authenticated USING is_superadmin();

DROP POLICY IF EXISTS "daily_records_insert" ON "public"."daily_records";
CREATE POLICY "daily_records_insert" ON "public"."daily_records" AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((is_tenant_member(tenant_id) AND (my_role_for(tenant_id) = ANY (ARRAY['owner'::text, 'staff'::text]))) OR is_superadmin());

DROP POLICY IF EXISTS "daily_records_select" ON "public"."daily_records";
CREATE POLICY "daily_records_select" ON "public"."daily_records" AS PERMISSIVE FOR SELECT TO authenticated USING (is_tenant_member(tenant_id) OR is_superadmin());

DROP POLICY IF EXISTS "daily_records_update" ON "public"."daily_records";
CREATE POLICY "daily_records_update" ON "public"."daily_records" AS PERMISSIVE FOR UPDATE TO authenticated USING ((is_tenant_member(tenant_id) AND (my_role_for(tenant_id) = ANY (ARRAY['owner'::text, 'staff'::text]))) OR is_superadmin()) WITH CHECK ((is_tenant_member(tenant_id) AND (my_role_for(tenant_id) = ANY (ARRAY['owner'::text, 'staff'::text]))) OR is_superadmin());

DROP POLICY IF EXISTS "deliveries_delete" ON "public"."deliveries";
CREATE POLICY "deliveries_delete" ON "public"."deliveries" AS PERMISSIVE FOR DELETE TO authenticated USING is_superadmin();

DROP POLICY IF EXISTS "deliveries_insert" ON "public"."deliveries";
CREATE POLICY "deliveries_insert" ON "public"."deliveries" AS PERMISSIVE FOR INSERT TO authenticated USING null
   FROM profiles p
  WHERE ((p.auth_user_id = auth.uid()) AND (p.tenant_id = deliveries.tenant_id))))                                                                                                                                                                                                             |;

DROP POLICY IF EXISTS "deliveries_select" ON "public"."deliveries";
CREATE POLICY "deliveries_select" ON "public"."deliveries" AS PERMISSIVE FOR SELECT
   FROM profiles p
  WHERE ((p.auth_user_id = auth.uid()) AND (p.tenant_id = deliveries.tenant_id)))) OR is_superadmin())                                                                                                                                                                                                                                                                                                             | null                                                                                                                                                                                                                                                                                                                                 | TO authenticated;

DROP POLICY IF EXISTS "deliveries_update" ON "public"."deliveries";
CREATE POLICY "deliveries_update" ON "public"."deliveries" AS PERMISSIVE FOR UPDATE
   FROM profiles p
  WHERE ((p.auth_user_id = auth.uid()) AND (p.tenant_id = deliveries.tenant_id)))) OR is_superadmin())                                                                                                                                                                                                                                                                                                             | ((EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.auth_user_id = auth.uid()) AND (p.tenant_id = deliveries.tenant_id)))) OR is_superadmin())                                                                                                                                                                                        | TO authenticated;

DROP POLICY IF EXISTS "Admin Write Discount Codes" ON "public"."discount_codes";
CREATE POLICY "Admin Write Discount Codes" ON "public"."discount_codes" AS PERMISSIVE FOR ALL TO authenticated USING is_superadmin() WITH CHECK is_superadmin();

DROP POLICY IF EXISTS "Public Read Discount Codes" ON "public"."discount_codes";
CREATE POLICY "Public Read Discount Codes" ON "public"."discount_codes" AS PERMISSIVE FOR SELECT TO public USING true;

DROP POLICY IF EXISTS "domba_breeding_animals_delete" ON "public"."domba_breeding_animals";
CREATE POLICY "domba_breeding_animals_delete" ON "public"."domba_breeding_animals" AS PERMISSIVE FOR DELETE TO authenticated USING is_superadmin();

DROP POLICY IF EXISTS "domba_breeding_animals_insert" ON "public"."domba_breeding_animals";
CREATE POLICY "domba_breeding_animals_insert" ON "public"."domba_breeding_animals" AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((is_tenant_member(tenant_id) AND (my_role_for(tenant_id) = ANY (ARRAY['owner'::text, 'staff'::text]))) OR is_superadmin());

DROP POLICY IF EXISTS "domba_breeding_animals_select" ON "public"."domba_breeding_animals";
CREATE POLICY "domba_breeding_animals_select" ON "public"."domba_breeding_animals" AS PERMISSIVE FOR SELECT TO authenticated USING (is_tenant_member(tenant_id) OR is_superadmin());

DROP POLICY IF EXISTS "domba_breeding_animals_update" ON "public"."domba_breeding_animals";
CREATE POLICY "domba_breeding_animals_update" ON "public"."domba_breeding_animals" AS PERMISSIVE FOR UPDATE TO authenticated USING ((is_tenant_member(tenant_id) AND (my_role_for(tenant_id) = ANY (ARRAY['owner'::text, 'staff'::text]))) OR is_superadmin()) WITH CHECK ((is_tenant_member(tenant_id) AND (my_role_for(tenant_id) = ANY (ARRAY['owner'::text, 'staff'::text]))) OR is_superadmin());

DROP POLICY IF EXISTS "domba_breeding_births_delete" ON "public"."domba_breeding_births";
CREATE POLICY "domba_breeding_births_delete" ON "public"."domba_breeding_births" AS PERMISSIVE FOR DELETE TO authenticated USING is_superadmin();

DROP POLICY IF EXISTS "domba_breeding_births_insert" ON "public"."domba_breeding_births";
CREATE POLICY "domba_breeding_births_insert" ON "public"."domba_breeding_births" AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((is_tenant_member(tenant_id) AND (my_role_for(tenant_id) = ANY (ARRAY['owner'::text, 'staff'::text]))) OR is_superadmin());

DROP POLICY IF EXISTS "domba_breeding_births_select" ON "public"."domba_breeding_births";
CREATE POLICY "domba_breeding_births_select" ON "public"."domba_breeding_births" AS PERMISSIVE FOR SELECT TO authenticated USING (is_tenant_member(tenant_id) OR is_superadmin());

DROP POLICY IF EXISTS "domba_breeding_births_update" ON "public"."domba_breeding_births";
CREATE POLICY "domba_breeding_births_update" ON "public"."domba_breeding_births" AS PERMISSIVE FOR UPDATE TO authenticated USING ((is_tenant_member(tenant_id) AND (my_role_for(tenant_id) = ANY (ARRAY['owner'::text, 'staff'::text]))) OR is_superadmin()) WITH CHECK ((is_tenant_member(tenant_id) AND (my_role_for(tenant_id) = ANY (ARRAY['owner'::text, 'staff'::text]))) OR is_superadmin());

DROP POLICY IF EXISTS "domba_breeding_feed_logs_delete" ON "public"."domba_breeding_feed_logs";
CREATE POLICY "domba_breeding_feed_logs_delete" ON "public"."domba_breeding_feed_logs" AS PERMISSIVE FOR DELETE TO authenticated USING is_superadmin();

DROP POLICY IF EXISTS "domba_breeding_feed_logs_insert" ON "public"."domba_breeding_feed_logs";
CREATE POLICY "domba_breeding_feed_logs_insert" ON "public"."domba_breeding_feed_logs" AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((is_tenant_member(tenant_id) AND (my_role_for(tenant_id) = ANY (ARRAY['owner'::text, 'staff'::text]))) OR is_superadmin());

DROP POLICY IF EXISTS "domba_breeding_feed_logs_select" ON "public"."domba_breeding_feed_logs";
CREATE POLICY "domba_breeding_feed_logs_select" ON "public"."domba_breeding_feed_logs" AS PERMISSIVE FOR SELECT TO authenticated USING (is_tenant_member(tenant_id) OR is_superadmin());

DROP POLICY IF EXISTS "domba_breeding_feed_logs_update" ON "public"."domba_breeding_feed_logs";
CREATE POLICY "domba_breeding_feed_logs_update" ON "public"."domba_breeding_feed_logs" AS PERMISSIVE FOR UPDATE TO authenticated USING ((is_tenant_member(tenant_id) AND (my_role_for(tenant_id) = ANY (ARRAY['owner'::text, 'staff'::text]))) OR is_superadmin()) WITH CHECK ((is_tenant_member(tenant_id) AND (my_role_for(tenant_id) = ANY (ARRAY['owner'::text, 'staff'::text]))) OR is_superadmin());

DROP POLICY IF EXISTS "domba_breeding_health_logs_delete" ON "public"."domba_breeding_health_logs";
CREATE POLICY "domba_breeding_health_logs_delete" ON "public"."domba_breeding_health_logs" AS PERMISSIVE FOR DELETE TO authenticated USING is_superadmin();

DROP POLICY IF EXISTS "domba_breeding_health_logs_insert" ON "public"."domba_breeding_health_logs";
CREATE POLICY "domba_breeding_health_logs_insert" ON "public"."domba_breeding_health_logs" AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((is_tenant_member(tenant_id) AND (my_role_for(tenant_id) = ANY (ARRAY['owner'::text, 'staff'::text]))) OR is_superadmin());

DROP POLICY IF EXISTS "domba_breeding_health_logs_select" ON "public"."domba_breeding_health_logs";
CREATE POLICY "domba_breeding_health_logs_select" ON "public"."domba_breeding_health_logs" AS PERMISSIVE FOR SELECT TO authenticated USING (is_tenant_member(tenant_id) OR is_superadmin());

DROP POLICY IF EXISTS "domba_breeding_health_logs_update" ON "public"."domba_breeding_health_logs";
CREATE POLICY "domba_breeding_health_logs_update" ON "public"."domba_breeding_health_logs" AS PERMISSIVE FOR UPDATE TO authenticated USING ((is_tenant_member(tenant_id) AND (my_role_for(tenant_id) = ANY (ARRAY['owner'::text, 'staff'::text]))) OR is_superadmin()) WITH CHECK ((is_tenant_member(tenant_id) AND (my_role_for(tenant_id) = ANY (ARRAY['owner'::text, 'staff'::text]))) OR is_superadmin());

DROP POLICY IF EXISTS "domba_breeding_mating_records_delete" ON "public"."domba_breeding_mating_records";
CREATE POLICY "domba_breeding_mating_records_delete" ON "public"."domba_breeding_mating_records" AS PERMISSIVE FOR DELETE TO authenticated USING is_superadmin();

DROP POLICY IF EXISTS "domba_breeding_mating_records_insert" ON "public"."domba_breeding_mating_records";
CREATE POLICY "domba_breeding_mating_records_insert" ON "public"."domba_breeding_mating_records" AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((is_tenant_member(tenant_id) AND (my_role_for(tenant_id) = ANY (ARRAY['owner'::text, 'staff'::text]))) OR is_superadmin());

DROP POLICY IF EXISTS "domba_breeding_mating_records_select" ON "public"."domba_breeding_mating_records";
CREATE POLICY "domba_breeding_mating_records_select" ON "public"."domba_breeding_mating_records" AS PERMISSIVE FOR SELECT TO authenticated USING (is_tenant_member(tenant_id) OR is_superadmin());

DROP POLICY IF EXISTS "domba_breeding_mating_records_update" ON "public"."domba_breeding_mating_records";
CREATE POLICY "domba_breeding_mating_records_update" ON "public"."domba_breeding_mating_records" AS PERMISSIVE FOR UPDATE TO authenticated USING ((is_tenant_member(tenant_id) AND (my_role_for(tenant_id) = ANY (ARRAY['owner'::text, 'staff'::text]))) OR is_superadmin()) WITH CHECK ((is_tenant_member(tenant_id) AND (my_role_for(tenant_id) = ANY (ARRAY['owner'::text, 'staff'::text]))) OR is_superadmin());

DROP POLICY IF EXISTS "domba_breeding_sales_delete" ON "public"."domba_breeding_sales";
CREATE POLICY "domba_breeding_sales_delete" ON "public"."domba_breeding_sales" AS PERMISSIVE FOR DELETE TO authenticated USING is_superadmin();

DROP POLICY IF EXISTS "domba_breeding_sales_insert" ON "public"."domba_breeding_sales";
CREATE POLICY "domba_breeding_sales_insert" ON "public"."domba_breeding_sales" AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((is_tenant_member(tenant_id) AND (my_role_for(tenant_id) = ANY (ARRAY['owner'::text, 'staff'::text]))) OR is_superadmin());

DROP POLICY IF EXISTS "domba_breeding_sales_select" ON "public"."domba_breeding_sales";
CREATE POLICY "domba_breeding_sales_select" ON "public"."domba_breeding_sales" AS PERMISSIVE FOR SELECT TO authenticated USING (is_tenant_member(tenant_id) OR is_superadmin());

DROP POLICY IF EXISTS "domba_breeding_sales_update" ON "public"."domba_breeding_sales";
CREATE POLICY "domba_breeding_sales_update" ON "public"."domba_breeding_sales" AS PERMISSIVE FOR UPDATE TO authenticated USING ((is_tenant_member(tenant_id) AND (my_role_for(tenant_id) = ANY (ARRAY['owner'::text, 'staff'::text]))) OR is_superadmin()) WITH CHECK ((is_tenant_member(tenant_id) AND (my_role_for(tenant_id) = ANY (ARRAY['owner'::text, 'staff'::text]))) OR is_superadmin());

DROP POLICY IF EXISTS "domba_breeding_weight_records_delete" ON "public"."domba_breeding_weight_records";
CREATE POLICY "domba_breeding_weight_records_delete" ON "public"."domba_breeding_weight_records" AS PERMISSIVE FOR DELETE TO authenticated USING is_superadmin();

DROP POLICY IF EXISTS "domba_breeding_weight_records_insert" ON "public"."domba_breeding_weight_records";
CREATE POLICY "domba_breeding_weight_records_insert" ON "public"."domba_breeding_weight_records" AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((is_tenant_member(tenant_id) AND (my_role_for(tenant_id) = ANY (ARRAY['owner'::text, 'staff'::text]))) OR is_superadmin());

DROP POLICY IF EXISTS "domba_breeding_weight_records_select" ON "public"."domba_breeding_weight_records";
CREATE POLICY "domba_breeding_weight_records_select" ON "public"."domba_breeding_weight_records" AS PERMISSIVE FOR SELECT TO authenticated USING (is_tenant_member(tenant_id) OR is_superadmin());

DROP POLICY IF EXISTS "domba_breeding_weight_records_update" ON "public"."domba_breeding_weight_records";
CREATE POLICY "domba_breeding_weight_records_update" ON "public"."domba_breeding_weight_records" AS PERMISSIVE FOR UPDATE TO authenticated USING ((is_tenant_member(tenant_id) AND (my_role_for(tenant_id) = ANY (ARRAY['owner'::text, 'staff'::text]))) OR is_superadmin()) WITH CHECK ((is_tenant_member(tenant_id) AND (my_role_for(tenant_id) = ANY (ARRAY['owner'::text, 'staff'::text]))) OR is_superadmin());

DROP POLICY IF EXISTS "domba_kandangs_delete" ON "public"."domba_kandangs";
CREATE POLICY "domba_kandangs_delete" ON "public"."domba_kandangs" AS PERMISSIVE FOR DELETE TO authenticated USING is_superadmin();

DROP POLICY IF EXISTS "domba_kandangs_insert" ON "public"."domba_kandangs";
CREATE POLICY "domba_kandangs_insert" ON "public"."domba_kandangs" AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((is_tenant_member(tenant_id) AND (my_role_for(tenant_id) = ANY (ARRAY['owner'::text, 'staff'::text]))) OR is_superadmin());

DROP POLICY IF EXISTS "domba_kandangs_select" ON "public"."domba_kandangs";
CREATE POLICY "domba_kandangs_select" ON "public"."domba_kandangs" AS PERMISSIVE FOR SELECT TO authenticated USING (is_tenant_member(tenant_id) OR is_superadmin());

DROP POLICY IF EXISTS "domba_kandangs_update" ON "public"."domba_kandangs";
CREATE POLICY "domba_kandangs_update" ON "public"."domba_kandangs" AS PERMISSIVE FOR UPDATE TO authenticated USING ((is_tenant_member(tenant_id) AND (my_role_for(tenant_id) = ANY (ARRAY['owner'::text, 'staff'::text]))) OR is_superadmin()) WITH CHECK ((is_tenant_member(tenant_id) AND (my_role_for(tenant_id) = ANY (ARRAY['owner'::text, 'staff'::text]))) OR is_superadmin());

DROP POLICY IF EXISTS "domba_penggemukan_animals_delete" ON "public"."domba_penggemukan_animals";
CREATE POLICY "domba_penggemukan_animals_delete" ON "public"."domba_penggemukan_animals" AS PERMISSIVE FOR DELETE TO authenticated USING is_superadmin();

DROP POLICY IF EXISTS "domba_penggemukan_animals_insert" ON "public"."domba_penggemukan_animals";
CREATE POLICY "domba_penggemukan_animals_insert" ON "public"."domba_penggemukan_animals" AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((is_tenant_member(tenant_id) AND (my_role_for(tenant_id) = ANY (ARRAY['owner'::text, 'staff'::text]))) OR is_superadmin());

DROP POLICY IF EXISTS "domba_penggemukan_animals_select" ON "public"."domba_penggemukan_animals";
CREATE POLICY "domba_penggemukan_animals_select" ON "public"."domba_penggemukan_animals" AS PERMISSIVE FOR SELECT TO authenticated USING (is_tenant_member(tenant_id) OR is_superadmin());

DROP POLICY IF EXISTS "domba_penggemukan_animals_update" ON "public"."domba_penggemukan_animals";
CREATE POLICY "domba_penggemukan_animals_update" ON "public"."domba_penggemukan_animals" AS PERMISSIVE FOR UPDATE TO authenticated USING ((is_tenant_member(tenant_id) AND (my_role_for(tenant_id) = ANY (ARRAY['owner'::text, 'staff'::text]))) OR is_superadmin()) WITH CHECK ((is_tenant_member(tenant_id) AND (my_role_for(tenant_id) = ANY (ARRAY['owner'::text, 'staff'::text]))) OR is_superadmin());

DROP POLICY IF EXISTS "domba_penggemukan_batches_delete" ON "public"."domba_penggemukan_batches";
CREATE POLICY "domba_penggemukan_batches_delete" ON "public"."domba_penggemukan_batches" AS PERMISSIVE FOR DELETE TO authenticated USING is_superadmin();

DROP POLICY IF EXISTS "domba_penggemukan_batches_insert" ON "public"."domba_penggemukan_batches";
CREATE POLICY "domba_penggemukan_batches_insert" ON "public"."domba_penggemukan_batches" AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((is_tenant_member(tenant_id) AND (my_role_for(tenant_id) = ANY (ARRAY['owner'::text, 'staff'::text]))) OR is_superadmin());

DROP POLICY IF EXISTS "domba_penggemukan_batches_select" ON "public"."domba_penggemukan_batches";
CREATE POLICY "domba_penggemukan_batches_select" ON "public"."domba_penggemukan_batches" AS PERMISSIVE FOR SELECT TO authenticated USING (is_tenant_member(tenant_id) OR is_superadmin());

DROP POLICY IF EXISTS "domba_penggemukan_batches_update" ON "public"."domba_penggemukan_batches";
CREATE POLICY "domba_penggemukan_batches_update" ON "public"."domba_penggemukan_batches" AS PERMISSIVE FOR UPDATE TO authenticated USING ((is_tenant_member(tenant_id) AND (my_role_for(tenant_id) = ANY (ARRAY['owner'::text, 'staff'::text]))) OR is_superadmin()) WITH CHECK ((is_tenant_member(tenant_id) AND (my_role_for(tenant_id) = ANY (ARRAY['owner'::text, 'staff'::text]))) OR is_superadmin());

DROP POLICY IF EXISTS "domba_penggemukan_feed_logs_delete" ON "public"."domba_penggemukan_feed_logs";
CREATE POLICY "domba_penggemukan_feed_logs_delete" ON "public"."domba_penggemukan_feed_logs" AS PERMISSIVE FOR DELETE TO authenticated USING is_superadmin();

DROP POLICY IF EXISTS "domba_penggemukan_feed_logs_insert" ON "public"."domba_penggemukan_feed_logs";
CREATE POLICY "domba_penggemukan_feed_logs_insert" ON "public"."domba_penggemukan_feed_logs" AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((is_tenant_member(tenant_id) AND (my_role_for(tenant_id) = ANY (ARRAY['owner'::text, 'staff'::text]))) OR is_superadmin());

DROP POLICY IF EXISTS "domba_penggemukan_feed_logs_select" ON "public"."domba_penggemukan_feed_logs";
CREATE POLICY "domba_penggemukan_feed_logs_select" ON "public"."domba_penggemukan_feed_logs" AS PERMISSIVE FOR SELECT TO authenticated USING (is_tenant_member(tenant_id) OR is_superadmin());

DROP POLICY IF EXISTS "domba_penggemukan_feed_logs_update" ON "public"."domba_penggemukan_feed_logs";
CREATE POLICY "domba_penggemukan_feed_logs_update" ON "public"."domba_penggemukan_feed_logs" AS PERMISSIVE FOR UPDATE TO authenticated USING ((is_tenant_member(tenant_id) AND (my_role_for(tenant_id) = ANY (ARRAY['owner'::text, 'staff'::text]))) OR is_superadmin()) WITH CHECK ((is_tenant_member(tenant_id) AND (my_role_for(tenant_id) = ANY (ARRAY['owner'::text, 'staff'::text]))) OR is_superadmin());

DROP POLICY IF EXISTS "domba_penggemukan_health_logs_delete" ON "public"."domba_penggemukan_health_logs";
CREATE POLICY "domba_penggemukan_health_logs_delete" ON "public"."domba_penggemukan_health_logs" AS PERMISSIVE FOR DELETE TO authenticated USING is_superadmin();

DROP POLICY IF EXISTS "domba_penggemukan_health_logs_insert" ON "public"."domba_penggemukan_health_logs";
CREATE POLICY "domba_penggemukan_health_logs_insert" ON "public"."domba_penggemukan_health_logs" AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((is_tenant_member(tenant_id) AND (my_role_for(tenant_id) = ANY (ARRAY['owner'::text, 'staff'::text]))) OR is_superadmin());

DROP POLICY IF EXISTS "domba_penggemukan_health_logs_select" ON "public"."domba_penggemukan_health_logs";
CREATE POLICY "domba_penggemukan_health_logs_select" ON "public"."domba_penggemukan_health_logs" AS PERMISSIVE FOR SELECT TO authenticated USING (is_tenant_member(tenant_id) OR is_superadmin());

DROP POLICY IF EXISTS "domba_penggemukan_health_logs_update" ON "public"."domba_penggemukan_health_logs";
CREATE POLICY "domba_penggemukan_health_logs_update" ON "public"."domba_penggemukan_health_logs" AS PERMISSIVE FOR UPDATE TO authenticated USING ((is_tenant_member(tenant_id) AND (my_role_for(tenant_id) = ANY (ARRAY['owner'::text, 'staff'::text]))) OR is_superadmin()) WITH CHECK ((is_tenant_member(tenant_id) AND (my_role_for(tenant_id) = ANY (ARRAY['owner'::text, 'staff'::text]))) OR is_superadmin());

DROP POLICY IF EXISTS "domba_penggemukan_operational_costs_delete" ON "public"."domba_penggemukan_operational_costs";
CREATE POLICY "domba_penggemukan_operational_costs_delete" ON "public"."domba_penggemukan_operational_costs" AS PERMISSIVE FOR DELETE TO authenticated USING is_superadmin();

DROP POLICY IF EXISTS "domba_penggemukan_operational_costs_insert" ON "public"."domba_penggemukan_operational_costs";
CREATE POLICY "domba_penggemukan_operational_costs_insert" ON "public"."domba_penggemukan_operational_costs" AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((is_tenant_member(tenant_id) AND (my_role_for(tenant_id) = ANY (ARRAY['owner'::text, 'staff'::text]))) OR is_superadmin());

DROP POLICY IF EXISTS "domba_penggemukan_operational_costs_select" ON "public"."domba_penggemukan_operational_costs";
CREATE POLICY "domba_penggemukan_operational_costs_select" ON "public"."domba_penggemukan_operational_costs" AS PERMISSIVE FOR SELECT TO authenticated USING (is_tenant_member(tenant_id) OR is_superadmin());

DROP POLICY IF EXISTS "domba_penggemukan_operational_costs_update" ON "public"."domba_penggemukan_operational_costs";
CREATE POLICY "domba_penggemukan_operational_costs_update" ON "public"."domba_penggemukan_operational_costs" AS PERMISSIVE FOR UPDATE TO authenticated USING ((is_tenant_member(tenant_id) AND (my_role_for(tenant_id) = ANY (ARRAY['owner'::text, 'staff'::text]))) OR is_superadmin()) WITH CHECK ((is_tenant_member(tenant_id) AND (my_role_for(tenant_id) = ANY (ARRAY['owner'::text, 'staff'::text]))) OR is_superadmin());

DROP POLICY IF EXISTS "domba_penggemukan_sales_delete" ON "public"."domba_penggemukan_sales";
CREATE POLICY "domba_penggemukan_sales_delete" ON "public"."domba_penggemukan_sales" AS PERMISSIVE FOR DELETE TO authenticated USING is_superadmin();

DROP POLICY IF EXISTS "domba_penggemukan_sales_insert" ON "public"."domba_penggemukan_sales";
CREATE POLICY "domba_penggemukan_sales_insert" ON "public"."domba_penggemukan_sales" AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((is_tenant_member(tenant_id) AND (my_role_for(tenant_id) = ANY (ARRAY['owner'::text, 'staff'::text]))) OR is_superadmin());

DROP POLICY IF EXISTS "domba_penggemukan_sales_select" ON "public"."domba_penggemukan_sales";
CREATE POLICY "domba_penggemukan_sales_select" ON "public"."domba_penggemukan_sales" AS PERMISSIVE FOR SELECT TO authenticated USING (is_tenant_member(tenant_id) OR is_superadmin());

DROP POLICY IF EXISTS "domba_penggemukan_sales_update" ON "public"."domba_penggemukan_sales";
CREATE POLICY "domba_penggemukan_sales_update" ON "public"."domba_penggemukan_sales" AS PERMISSIVE FOR UPDATE TO authenticated USING ((is_tenant_member(tenant_id) AND (my_role_for(tenant_id) = ANY (ARRAY['owner'::text, 'staff'::text]))) OR is_superadmin()) WITH CHECK ((is_tenant_member(tenant_id) AND (my_role_for(tenant_id) = ANY (ARRAY['owner'::text, 'staff'::text]))) OR is_superadmin());

DROP POLICY IF EXISTS "domba_penggemukan_weight_records_delete" ON "public"."domba_penggemukan_weight_records";
CREATE POLICY "domba_penggemukan_weight_records_delete" ON "public"."domba_penggemukan_weight_records" AS PERMISSIVE FOR DELETE TO authenticated USING is_superadmin();

DROP POLICY IF EXISTS "domba_penggemukan_weight_records_insert" ON "public"."domba_penggemukan_weight_records";
CREATE POLICY "domba_penggemukan_weight_records_insert" ON "public"."domba_penggemukan_weight_records" AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((is_tenant_member(tenant_id) AND (my_role_for(tenant_id) = ANY (ARRAY['owner'::text, 'staff'::text]))) OR is_superadmin());

DROP POLICY IF EXISTS "domba_penggemukan_weight_records_select" ON "public"."domba_penggemukan_weight_records";
CREATE POLICY "domba_penggemukan_weight_records_select" ON "public"."domba_penggemukan_weight_records" AS PERMISSIVE FOR SELECT TO authenticated USING (is_tenant_member(tenant_id) OR is_superadmin());

DROP POLICY IF EXISTS "domba_penggemukan_weight_records_update" ON "public"."domba_penggemukan_weight_records";
CREATE POLICY "domba_penggemukan_weight_records_update" ON "public"."domba_penggemukan_weight_records" AS PERMISSIVE FOR UPDATE TO authenticated USING ((is_tenant_member(tenant_id) AND (my_role_for(tenant_id) = ANY (ARRAY['owner'::text, 'staff'::text]))) OR is_superadmin()) WITH CHECK ((is_tenant_member(tenant_id) AND (my_role_for(tenant_id) = ANY (ARRAY['owner'::text, 'staff'::text]))) OR is_superadmin());

DROP POLICY IF EXISTS "drivers_delete" ON "public"."drivers";
CREATE POLICY "drivers_delete" ON "public"."drivers" AS PERMISSIVE FOR DELETE TO authenticated USING is_superadmin();

DROP POLICY IF EXISTS "drivers_insert" ON "public"."drivers";
CREATE POLICY "drivers_insert" ON "public"."drivers" AS PERMISSIVE FOR INSERT TO authenticated USING null
   FROM profiles p
  WHERE ((p.auth_user_id = auth.uid()) AND (p.tenant_id = drivers.tenant_id)))) AND can_manage_drivers(tenant_id)) OR is_superadmin())                                                                                                                                                       |;

DROP POLICY IF EXISTS "drivers_select" ON "public"."drivers";
CREATE POLICY "drivers_select" ON "public"."drivers" AS PERMISSIVE FOR SELECT
   FROM profiles p
  WHERE ((p.auth_user_id = auth.uid()) AND (p.tenant_id = drivers.tenant_id)))) OR is_superadmin())                                                                                                                                                                                                                                                                                                                | null                                                                                                                                                                                                                                                                                                                                 | TO authenticated;

DROP POLICY IF EXISTS "drivers_update" ON "public"."drivers";
CREATE POLICY "drivers_update" ON "public"."drivers" AS PERMISSIVE FOR UPDATE
   FROM profiles p
  WHERE ((p.auth_user_id = auth.uid()) AND (p.tenant_id = drivers.tenant_id)))) AND can_manage_drivers(tenant_id)) OR is_superadmin())                                                                                                                                                                                                                                                                            | (((EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.auth_user_id = auth.uid()) AND (p.tenant_id = drivers.tenant_id)))) AND can_manage_drivers(tenant_id)) OR is_superadmin())                                                                                                                                                       | TO authenticated;

DROP POLICY IF EXISTS "egg_customers_tenant_isolation" ON "public"."egg_customers";
CREATE POLICY "egg_customers_tenant_isolation" ON "public"."egg_customers" AS PERMISSIVE FOR ALL TO authenticated USING (is_tenant_member(tenant_id) OR is_superadmin()) WITH CHECK ((is_tenant_member(tenant_id) AND (my_role_for(tenant_id) = ANY (ARRAY['owner'::text, 'admin'::text, 'sales'::text, 'gudang'::text, 'kurir'::text]))) OR is_superadmin());

DROP POLICY IF EXISTS "egg_inventory_tenant_isolation" ON "public"."egg_inventory";
CREATE POLICY "egg_inventory_tenant_isolation" ON "public"."egg_inventory" AS PERMISSIVE FOR ALL TO authenticated USING (is_tenant_member(tenant_id) OR is_superadmin()) WITH CHECK ((is_tenant_member(tenant_id) AND can_manage_inventory_egg(tenant_id)) OR is_superadmin());

DROP POLICY IF EXISTS "egg_sale_items_tenant_isolation" ON "public"."egg_sale_items";
CREATE POLICY "egg_sale_items_tenant_isolation" ON "public"."egg_sale_items" AS PERMISSIVE FOR ALL
   FROM egg_sales
  WHERE ((egg_sales.id = egg_sale_items.sale_id) AND is_tenant_member(egg_sales.tenant_id)))))                                                                                                                                                                                                                                                                                                   | (is_superadmin() OR (EXISTS ( SELECT 1
   FROM egg_sales
  WHERE ((egg_sales.id = egg_sale_items.sale_id) AND is_tenant_member(egg_sales.tenant_id) AND (my_role_for(egg_sales.tenant_id) = ANY (ARRAY['owner'::text, 'admin'::text, 'sales'::text, 'gudang'::text]))))))                                                            | TO authenticated;

DROP POLICY IF EXISTS "egg_sales_tenant_isolation" ON "public"."egg_sales";
CREATE POLICY "egg_sales_tenant_isolation" ON "public"."egg_sales" AS PERMISSIVE FOR ALL TO authenticated USING (is_tenant_member(tenant_id) OR is_superadmin()) WITH CHECK ((is_tenant_member(tenant_id) AND (my_role_for(tenant_id) = ANY (ARRAY['owner'::text, 'admin'::text, 'sales'::text]))) OR is_superadmin());

DROP POLICY IF EXISTS "egg_stock_logs_tenant_isolation" ON "public"."egg_stock_logs";
CREATE POLICY "egg_stock_logs_tenant_isolation" ON "public"."egg_stock_logs" AS PERMISSIVE FOR ALL TO authenticated USING (is_tenant_member(tenant_id) OR is_superadmin()) WITH CHECK ((is_tenant_member(tenant_id) AND can_manage_inventory_egg(tenant_id)) OR is_superadmin());

DROP POLICY IF EXISTS "egg_suppliers_tenant_isolation" ON "public"."egg_suppliers";
CREATE POLICY "egg_suppliers_tenant_isolation" ON "public"."egg_suppliers" AS PERMISSIVE FOR ALL TO authenticated USING (is_tenant_member(tenant_id) OR is_superadmin()) WITH CHECK ((is_tenant_member(tenant_id) AND can_manage_inventory_egg(tenant_id)) OR is_superadmin());

DROP POLICY IF EXISTS "extra_expenses_delete" ON "public"."extra_expenses";
CREATE POLICY "extra_expenses_delete" ON "public"."extra_expenses" AS PERMISSIVE FOR DELETE TO authenticated USING is_superadmin();

DROP POLICY IF EXISTS "extra_expenses_insert" ON "public"."extra_expenses";
CREATE POLICY "extra_expenses_insert" ON "public"."extra_expenses" AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((is_tenant_member(tenant_id) AND (my_role_for(tenant_id) = ANY (ARRAY['owner'::text, 'staff'::text]))) OR is_superadmin());

DROP POLICY IF EXISTS "extra_expenses_select" ON "public"."extra_expenses";
CREATE POLICY "extra_expenses_select" ON "public"."extra_expenses" AS PERMISSIVE FOR SELECT TO authenticated USING (is_tenant_member(tenant_id) OR is_superadmin());

DROP POLICY IF EXISTS "extra_expenses_update" ON "public"."extra_expenses";
CREATE POLICY "extra_expenses_update" ON "public"."extra_expenses" AS PERMISSIVE FOR UPDATE TO authenticated USING ((is_tenant_member(tenant_id) AND (my_role_for(tenant_id) = ANY (ARRAY['owner'::text, 'staff'::text]))) OR is_superadmin()) WITH CHECK ((is_tenant_member(tenant_id) AND (my_role_for(tenant_id) = ANY (ARRAY['owner'::text, 'staff'::text]))) OR is_superadmin());

DROP POLICY IF EXISTS "farms_delete" ON "public"."farms";
CREATE POLICY "farms_delete" ON "public"."farms" AS PERMISSIVE FOR DELETE TO authenticated USING is_superadmin();

DROP POLICY IF EXISTS "farms_insert" ON "public"."farms";
CREATE POLICY "farms_insert" ON "public"."farms" AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((is_tenant_member(tenant_id) AND (my_role_for(tenant_id) = ANY (ARRAY['owner'::text, 'staff'::text]))) OR is_superadmin());

DROP POLICY IF EXISTS "farms_select" ON "public"."farms";
CREATE POLICY "farms_select" ON "public"."farms" AS PERMISSIVE FOR SELECT TO authenticated USING (is_tenant_member(tenant_id) OR is_superadmin());

DROP POLICY IF EXISTS "farms_update" ON "public"."farms";
CREATE POLICY "farms_update" ON "public"."farms" AS PERMISSIVE FOR UPDATE TO authenticated USING ((is_tenant_member(tenant_id) AND (my_role_for(tenant_id) = ANY (ARRAY['owner'::text, 'staff'::text]))) OR is_superadmin()) WITH CHECK ((is_tenant_member(tenant_id) AND (my_role_for(tenant_id) = ANY (ARRAY['owner'::text, 'staff'::text]))) OR is_superadmin());

DROP POLICY IF EXISTS "feed_stocks_delete" ON "public"."feed_stocks";
CREATE POLICY "feed_stocks_delete" ON "public"."feed_stocks" AS PERMISSIVE FOR DELETE TO authenticated USING is_superadmin();

DROP POLICY IF EXISTS "feed_stocks_insert" ON "public"."feed_stocks";
CREATE POLICY "feed_stocks_insert" ON "public"."feed_stocks" AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((is_tenant_member(tenant_id) AND (my_role_for(tenant_id) = ANY (ARRAY['owner'::text, 'staff'::text]))) OR is_superadmin());

DROP POLICY IF EXISTS "feed_stocks_select" ON "public"."feed_stocks";
CREATE POLICY "feed_stocks_select" ON "public"."feed_stocks" AS PERMISSIVE FOR SELECT TO authenticated USING (is_tenant_member(tenant_id) OR is_superadmin());

DROP POLICY IF EXISTS "feed_stocks_update" ON "public"."feed_stocks";
CREATE POLICY "feed_stocks_update" ON "public"."feed_stocks" AS PERMISSIVE FOR UPDATE TO authenticated USING ((is_tenant_member(tenant_id) AND (my_role_for(tenant_id) = ANY (ARRAY['owner'::text, 'staff'::text]))) OR is_superadmin()) WITH CHECK ((is_tenant_member(tenant_id) AND (my_role_for(tenant_id) = ANY (ARRAY['owner'::text, 'staff'::text]))) OR is_superadmin());

DROP POLICY IF EXISTS "generated_invoices_delete" ON "public"."generated_invoices";
CREATE POLICY "generated_invoices_delete" ON "public"."generated_invoices" AS PERMISSIVE FOR DELETE TO authenticated USING is_superadmin();

DROP POLICY IF EXISTS "generated_invoices_insert" ON "public"."generated_invoices";
CREATE POLICY "generated_invoices_insert" ON "public"."generated_invoices" AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((is_tenant_member(tenant_id) AND (my_role_for(tenant_id) = ANY (ARRAY['owner'::text, 'staff'::text]))) OR is_superadmin());

DROP POLICY IF EXISTS "generated_invoices_select" ON "public"."generated_invoices";
CREATE POLICY "generated_invoices_select" ON "public"."generated_invoices" AS PERMISSIVE FOR SELECT TO authenticated USING (is_tenant_member(tenant_id) OR is_superadmin());

DROP POLICY IF EXISTS "generated_invoices_superadmin_all" ON "public"."generated_invoices";
CREATE POLICY "generated_invoices_superadmin_all" ON "public"."generated_invoices" AS PERMISSIVE FOR ALL TO authenticated USING is_superadmin() WITH CHECK is_superadmin();

DROP POLICY IF EXISTS "generated_invoices_update" ON "public"."generated_invoices";
CREATE POLICY "generated_invoices_update" ON "public"."generated_invoices" AS PERMISSIVE FOR UPDATE TO authenticated USING ((is_tenant_member(tenant_id) AND (my_role_for(tenant_id) = ANY (ARRAY['owner'::text, 'staff'::text]))) OR is_superadmin()) WITH CHECK ((is_tenant_member(tenant_id) AND (my_role_for(tenant_id) = ANY (ARRAY['owner'::text, 'staff'::text]))) OR is_superadmin());

DROP POLICY IF EXISTS "audit_logs_owner" ON "public"."global_audit_logs";
CREATE POLICY "audit_logs_owner" ON "public"."global_audit_logs" AS PERMISSIVE FOR SELECT TO authenticated USING is_my_tenant(tenant_id);

DROP POLICY IF EXISTS "audit_logs_superadmin" ON "public"."global_audit_logs";
CREATE POLICY "audit_logs_superadmin" ON "public"."global_audit_logs" AS PERMISSIVE FOR SELECT TO authenticated USING is_superadmin();

DROP POLICY IF EXISTS "global_audit_logs_superadmin_all" ON "public"."global_audit_logs";
CREATE POLICY "global_audit_logs_superadmin_all" ON "public"."global_audit_logs" AS PERMISSIVE FOR ALL TO authenticated USING is_superadmin() WITH CHECK is_superadmin();

DROP POLICY IF EXISTS "harvest_records_delete" ON "public"."harvest_records";
CREATE POLICY "harvest_records_delete" ON "public"."harvest_records" AS PERMISSIVE FOR DELETE TO authenticated USING is_superadmin();

DROP POLICY IF EXISTS "harvest_records_insert" ON "public"."harvest_records";
CREATE POLICY "harvest_records_insert" ON "public"."harvest_records" AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((is_tenant_member(tenant_id) AND (my_role_for(tenant_id) = ANY (ARRAY['owner'::text, 'staff'::text]))) OR is_superadmin());

DROP POLICY IF EXISTS "harvest_records_select" ON "public"."harvest_records";
CREATE POLICY "harvest_records_select" ON "public"."harvest_records" AS PERMISSIVE FOR SELECT TO authenticated USING (is_tenant_member(tenant_id) OR is_superadmin());

DROP POLICY IF EXISTS "harvest_records_superadmin_all" ON "public"."harvest_records";
CREATE POLICY "harvest_records_superadmin_all" ON "public"."harvest_records" AS PERMISSIVE FOR ALL TO authenticated USING is_superadmin() WITH CHECK is_superadmin();

DROP POLICY IF EXISTS "harvest_records_update" ON "public"."harvest_records";
CREATE POLICY "harvest_records_update" ON "public"."harvest_records" AS PERMISSIVE FOR UPDATE TO authenticated USING ((is_tenant_member(tenant_id) AND (my_role_for(tenant_id) = ANY (ARRAY['owner'::text, 'staff'::text]))) OR is_superadmin()) WITH CHECK ((is_tenant_member(tenant_id) AND (my_role_for(tenant_id) = ANY (ARRAY['owner'::text, 'staff'::text]))) OR is_superadmin());

DROP POLICY IF EXISTS "Deny public access" ON "public"."invite_rate_limits";
CREATE POLICY "Deny public access" ON "public"."invite_rate_limits" AS PERMISSIVE FOR ALL TO authenticated USING false;

DROP POLICY IF EXISTS "kambing_breeding_animals_delete" ON "public"."kambing_breeding_animals";
CREATE POLICY "kambing_breeding_animals_delete" ON "public"."kambing_breeding_animals" AS PERMISSIVE FOR DELETE TO authenticated USING is_superadmin();

DROP POLICY IF EXISTS "kambing_breeding_animals_insert" ON "public"."kambing_breeding_animals";
CREATE POLICY "kambing_breeding_animals_insert" ON "public"."kambing_breeding_animals" AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((is_tenant_member(tenant_id) AND (my_role_for(tenant_id) = ANY (ARRAY['owner'::text, 'staff'::text]))) OR is_superadmin());

DROP POLICY IF EXISTS "kambing_breeding_animals_select" ON "public"."kambing_breeding_animals";
CREATE POLICY "kambing_breeding_animals_select" ON "public"."kambing_breeding_animals" AS PERMISSIVE FOR SELECT TO authenticated USING (is_tenant_member(tenant_id) OR is_superadmin());

DROP POLICY IF EXISTS "kambing_breeding_animals_update" ON "public"."kambing_breeding_animals";
CREATE POLICY "kambing_breeding_animals_update" ON "public"."kambing_breeding_animals" AS PERMISSIVE FOR UPDATE TO authenticated USING ((is_tenant_member(tenant_id) AND (my_role_for(tenant_id) = ANY (ARRAY['owner'::text, 'staff'::text]))) OR is_superadmin()) WITH CHECK ((is_tenant_member(tenant_id) AND (my_role_for(tenant_id) = ANY (ARRAY['owner'::text, 'staff'::text]))) OR is_superadmin());

DROP POLICY IF EXISTS "kambing_breeding_births_delete" ON "public"."kambing_breeding_births";
CREATE POLICY "kambing_breeding_births_delete" ON "public"."kambing_breeding_births" AS PERMISSIVE FOR DELETE TO authenticated USING is_superadmin();

DROP POLICY IF EXISTS "kambing_breeding_births_insert" ON "public"."kambing_breeding_births";
CREATE POLICY "kambing_breeding_births_insert" ON "public"."kambing_breeding_births" AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((is_tenant_member(tenant_id) AND (my_role_for(tenant_id) = ANY (ARRAY['owner'::text, 'staff'::text]))) OR is_superadmin());

DROP POLICY IF EXISTS "kambing_breeding_births_select" ON "public"."kambing_breeding_births";
CREATE POLICY "kambing_breeding_births_select" ON "public"."kambing_breeding_births" AS PERMISSIVE FOR SELECT TO authenticated USING (is_tenant_member(tenant_id) OR is_superadmin());

DROP POLICY IF EXISTS "kambing_breeding_births_update" ON "public"."kambing_breeding_births";
CREATE POLICY "kambing_breeding_births_update" ON "public"."kambing_breeding_births" AS PERMISSIVE FOR UPDATE TO authenticated USING ((is_tenant_member(tenant_id) AND (my_role_for(tenant_id) = ANY (ARRAY['owner'::text, 'staff'::text]))) OR is_superadmin()) WITH CHECK ((is_tenant_member(tenant_id) AND (my_role_for(tenant_id) = ANY (ARRAY['owner'::text, 'staff'::text]))) OR is_superadmin());

DROP POLICY IF EXISTS "kambing_breeding_feed_logs_delete" ON "public"."kambing_breeding_feed_logs";
CREATE POLICY "kambing_breeding_feed_logs_delete" ON "public"."kambing_breeding_feed_logs" AS PERMISSIVE FOR DELETE TO authenticated USING is_superadmin();

DROP POLICY IF EXISTS "kambing_breeding_feed_logs_insert" ON "public"."kambing_breeding_feed_logs";
CREATE POLICY "kambing_breeding_feed_logs_insert" ON "public"."kambing_breeding_feed_logs" AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((is_tenant_member(tenant_id) AND (my_role_for(tenant_id) = ANY (ARRAY['owner'::text, 'staff'::text]))) OR is_superadmin());

DROP POLICY IF EXISTS "kambing_breeding_feed_logs_select" ON "public"."kambing_breeding_feed_logs";
CREATE POLICY "kambing_breeding_feed_logs_select" ON "public"."kambing_breeding_feed_logs" AS PERMISSIVE FOR SELECT TO authenticated USING (is_tenant_member(tenant_id) OR is_superadmin());

DROP POLICY IF EXISTS "kambing_breeding_feed_logs_update" ON "public"."kambing_breeding_feed_logs";
CREATE POLICY "kambing_breeding_feed_logs_update" ON "public"."kambing_breeding_feed_logs" AS PERMISSIVE FOR UPDATE TO authenticated USING ((is_tenant_member(tenant_id) AND (my_role_for(tenant_id) = ANY (ARRAY['owner'::text, 'staff'::text]))) OR is_superadmin()) WITH CHECK ((is_tenant_member(tenant_id) AND (my_role_for(tenant_id) = ANY (ARRAY['owner'::text, 'staff'::text]))) OR is_superadmin());

DROP POLICY IF EXISTS "kambing_breeding_health_logs_delete" ON "public"."kambing_breeding_health_logs";
CREATE POLICY "kambing_breeding_health_logs_delete" ON "public"."kambing_breeding_health_logs" AS PERMISSIVE FOR DELETE TO authenticated USING is_superadmin();

DROP POLICY IF EXISTS "kambing_breeding_health_logs_insert" ON "public"."kambing_breeding_health_logs";
CREATE POLICY "kambing_breeding_health_logs_insert" ON "public"."kambing_breeding_health_logs" AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((is_tenant_member(tenant_id) AND (my_role_for(tenant_id) = ANY (ARRAY['owner'::text, 'staff'::text]))) OR is_superadmin());

DROP POLICY IF EXISTS "kambing_breeding_health_logs_select" ON "public"."kambing_breeding_health_logs";
CREATE POLICY "kambing_breeding_health_logs_select" ON "public"."kambing_breeding_health_logs" AS PERMISSIVE FOR SELECT TO authenticated USING (is_tenant_member(tenant_id) OR is_superadmin());

DROP POLICY IF EXISTS "kambing_breeding_health_logs_update" ON "public"."kambing_breeding_health_logs";
CREATE POLICY "kambing_breeding_health_logs_update" ON "public"."kambing_breeding_health_logs" AS PERMISSIVE FOR UPDATE TO authenticated USING ((is_tenant_member(tenant_id) AND (my_role_for(tenant_id) = ANY (ARRAY['owner'::text, 'staff'::text]))) OR is_superadmin()) WITH CHECK ((is_tenant_member(tenant_id) AND (my_role_for(tenant_id) = ANY (ARRAY['owner'::text, 'staff'::text]))) OR is_superadmin());

DROP POLICY IF EXISTS "kambing_breeding_mating_records_delete" ON "public"."kambing_breeding_mating_records";
CREATE POLICY "kambing_breeding_mating_records_delete" ON "public"."kambing_breeding_mating_records" AS PERMISSIVE FOR DELETE TO authenticated USING is_superadmin();

DROP POLICY IF EXISTS "kambing_breeding_mating_records_insert" ON "public"."kambing_breeding_mating_records";
CREATE POLICY "kambing_breeding_mating_records_insert" ON "public"."kambing_breeding_mating_records" AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((is_tenant_member(tenant_id) AND (my_role_for(tenant_id) = ANY (ARRAY['owner'::text, 'staff'::text]))) OR is_superadmin());

DROP POLICY IF EXISTS "kambing_breeding_mating_records_select" ON "public"."kambing_breeding_mating_records";
CREATE POLICY "kambing_breeding_mating_records_select" ON "public"."kambing_breeding_mating_records" AS PERMISSIVE FOR SELECT TO authenticated USING (is_tenant_member(tenant_id) OR is_superadmin());

DROP POLICY IF EXISTS "kambing_breeding_mating_records_update" ON "public"."kambing_breeding_mating_records";
CREATE POLICY "kambing_breeding_mating_records_update" ON "public"."kambing_breeding_mating_records" AS PERMISSIVE FOR UPDATE TO authenticated USING ((is_tenant_member(tenant_id) AND (my_role_for(tenant_id) = ANY (ARRAY['owner'::text, 'staff'::text]))) OR is_superadmin()) WITH CHECK ((is_tenant_member(tenant_id) AND (my_role_for(tenant_id) = ANY (ARRAY['owner'::text, 'staff'::text]))) OR is_superadmin());

DROP POLICY IF EXISTS "kambing_breeding_sales_delete" ON "public"."kambing_breeding_sales";
CREATE POLICY "kambing_breeding_sales_delete" ON "public"."kambing_breeding_sales" AS PERMISSIVE FOR DELETE TO authenticated USING is_superadmin();

DROP POLICY IF EXISTS "kambing_breeding_sales_insert" ON "public"."kambing_breeding_sales";
CREATE POLICY "kambing_breeding_sales_insert" ON "public"."kambing_breeding_sales" AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((is_tenant_member(tenant_id) AND (my_role_for(tenant_id) = ANY (ARRAY['owner'::text, 'staff'::text]))) OR is_superadmin());

DROP POLICY IF EXISTS "kambing_breeding_sales_select" ON "public"."kambing_breeding_sales";
CREATE POLICY "kambing_breeding_sales_select" ON "public"."kambing_breeding_sales" AS PERMISSIVE FOR SELECT TO authenticated USING (is_tenant_member(tenant_id) OR is_superadmin());

DROP POLICY IF EXISTS "kambing_breeding_sales_update" ON "public"."kambing_breeding_sales";
CREATE POLICY "kambing_breeding_sales_update" ON "public"."kambing_breeding_sales" AS PERMISSIVE FOR UPDATE TO authenticated USING ((is_tenant_member(tenant_id) AND (my_role_for(tenant_id) = ANY (ARRAY['owner'::text, 'staff'::text]))) OR is_superadmin()) WITH CHECK ((is_tenant_member(tenant_id) AND (my_role_for(tenant_id) = ANY (ARRAY['owner'::text, 'staff'::text]))) OR is_superadmin());

DROP POLICY IF EXISTS "kambing_breeding_weight_records_delete" ON "public"."kambing_breeding_weight_records";
CREATE POLICY "kambing_breeding_weight_records_delete" ON "public"."kambing_breeding_weight_records" AS PERMISSIVE FOR DELETE TO authenticated USING is_superadmin();

DROP POLICY IF EXISTS "kambing_breeding_weight_records_insert" ON "public"."kambing_breeding_weight_records";
CREATE POLICY "kambing_breeding_weight_records_insert" ON "public"."kambing_breeding_weight_records" AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((is_tenant_member(tenant_id) AND (my_role_for(tenant_id) = ANY (ARRAY['owner'::text, 'staff'::text]))) OR is_superadmin());

DROP POLICY IF EXISTS "kambing_breeding_weight_records_select" ON "public"."kambing_breeding_weight_records";
CREATE POLICY "kambing_breeding_weight_records_select" ON "public"."kambing_breeding_weight_records" AS PERMISSIVE FOR SELECT TO authenticated USING (is_tenant_member(tenant_id) OR is_superadmin());

DROP POLICY IF EXISTS "kambing_breeding_weight_records_update" ON "public"."kambing_breeding_weight_records";
CREATE POLICY "kambing_breeding_weight_records_update" ON "public"."kambing_breeding_weight_records" AS PERMISSIVE FOR UPDATE TO authenticated USING ((is_tenant_member(tenant_id) AND (my_role_for(tenant_id) = ANY (ARRAY['owner'::text, 'staff'::text]))) OR is_superadmin()) WITH CHECK ((is_tenant_member(tenant_id) AND (my_role_for(tenant_id) = ANY (ARRAY['owner'::text, 'staff'::text]))) OR is_superadmin());

DROP POLICY IF EXISTS "kambing_kandangs_delete" ON "public"."kambing_kandangs";
CREATE POLICY "kambing_kandangs_delete" ON "public"."kambing_kandangs" AS PERMISSIVE FOR DELETE TO authenticated USING is_superadmin();

DROP POLICY IF EXISTS "kambing_kandangs_insert" ON "public"."kambing_kandangs";
CREATE POLICY "kambing_kandangs_insert" ON "public"."kambing_kandangs" AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((is_tenant_member(tenant_id) AND (my_role_for(tenant_id) = ANY (ARRAY['owner'::text, 'staff'::text]))) OR is_superadmin());

DROP POLICY IF EXISTS "kambing_kandangs_select" ON "public"."kambing_kandangs";
CREATE POLICY "kambing_kandangs_select" ON "public"."kambing_kandangs" AS PERMISSIVE FOR SELECT TO authenticated USING (is_tenant_member(tenant_id) OR is_superadmin());

DROP POLICY IF EXISTS "kambing_kandangs_update" ON "public"."kambing_kandangs";
CREATE POLICY "kambing_kandangs_update" ON "public"."kambing_kandangs" AS PERMISSIVE FOR UPDATE TO authenticated USING ((is_tenant_member(tenant_id) AND (my_role_for(tenant_id) = ANY (ARRAY['owner'::text, 'staff'::text]))) OR is_superadmin()) WITH CHECK ((is_tenant_member(tenant_id) AND (my_role_for(tenant_id) = ANY (ARRAY['owner'::text, 'staff'::text]))) OR is_superadmin());

DROP POLICY IF EXISTS "kambing_penggemukan_animals_delete" ON "public"."kambing_penggemukan_animals";
CREATE POLICY "kambing_penggemukan_animals_delete" ON "public"."kambing_penggemukan_animals" AS PERMISSIVE FOR DELETE TO authenticated USING is_superadmin();

DROP POLICY IF EXISTS "kambing_penggemukan_animals_insert" ON "public"."kambing_penggemukan_animals";
CREATE POLICY "kambing_penggemukan_animals_insert" ON "public"."kambing_penggemukan_animals" AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((is_tenant_member(tenant_id) AND (my_role_for(tenant_id) = ANY (ARRAY['owner'::text, 'staff'::text]))) OR is_superadmin());

DROP POLICY IF EXISTS "kambing_penggemukan_animals_select" ON "public"."kambing_penggemukan_animals";
CREATE POLICY "kambing_penggemukan_animals_select" ON "public"."kambing_penggemukan_animals" AS PERMISSIVE FOR SELECT TO authenticated USING (is_tenant_member(tenant_id) OR is_superadmin());

DROP POLICY IF EXISTS "kambing_penggemukan_animals_update" ON "public"."kambing_penggemukan_animals";
CREATE POLICY "kambing_penggemukan_animals_update" ON "public"."kambing_penggemukan_animals" AS PERMISSIVE FOR UPDATE TO authenticated USING ((is_tenant_member(tenant_id) AND (my_role_for(tenant_id) = ANY (ARRAY['owner'::text, 'staff'::text]))) OR is_superadmin()) WITH CHECK ((is_tenant_member(tenant_id) AND (my_role_for(tenant_id) = ANY (ARRAY['owner'::text, 'staff'::text]))) OR is_superadmin());

DROP POLICY IF EXISTS "kambing_penggemukan_batches_delete" ON "public"."kambing_penggemukan_batches";
CREATE POLICY "kambing_penggemukan_batches_delete" ON "public"."kambing_penggemukan_batches" AS PERMISSIVE FOR DELETE TO authenticated USING is_superadmin();

DROP POLICY IF EXISTS "kambing_penggemukan_batches_insert" ON "public"."kambing_penggemukan_batches";
CREATE POLICY "kambing_penggemukan_batches_insert" ON "public"."kambing_penggemukan_batches" AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((is_tenant_member(tenant_id) AND (my_role_for(tenant_id) = ANY (ARRAY['owner'::text, 'staff'::text]))) OR is_superadmin());

DROP POLICY IF EXISTS "kambing_penggemukan_batches_select" ON "public"."kambing_penggemukan_batches";
CREATE POLICY "kambing_penggemukan_batches_select" ON "public"."kambing_penggemukan_batches" AS PERMISSIVE FOR SELECT TO authenticated USING (is_tenant_member(tenant_id) OR is_superadmin());

DROP POLICY IF EXISTS "kambing_penggemukan_batches_update" ON "public"."kambing_penggemukan_batches";
CREATE POLICY "kambing_penggemukan_batches_update" ON "public"."kambing_penggemukan_batches" AS PERMISSIVE FOR UPDATE TO authenticated USING ((is_tenant_member(tenant_id) AND (my_role_for(tenant_id) = ANY (ARRAY['owner'::text, 'staff'::text]))) OR is_superadmin()) WITH CHECK ((is_tenant_member(tenant_id) AND (my_role_for(tenant_id) = ANY (ARRAY['owner'::text, 'staff'::text]))) OR is_superadmin());

DROP POLICY IF EXISTS "kambing_penggemukan_feed_logs_delete" ON "public"."kambing_penggemukan_feed_logs";
CREATE POLICY "kambing_penggemukan_feed_logs_delete" ON "public"."kambing_penggemukan_feed_logs" AS PERMISSIVE FOR DELETE TO authenticated USING is_superadmin();

DROP POLICY IF EXISTS "kambing_penggemukan_feed_logs_insert" ON "public"."kambing_penggemukan_feed_logs";
CREATE POLICY "kambing_penggemukan_feed_logs_insert" ON "public"."kambing_penggemukan_feed_logs" AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((is_tenant_member(tenant_id) AND (my_role_for(tenant_id) = ANY (ARRAY['owner'::text, 'staff'::text]))) OR is_superadmin());

DROP POLICY IF EXISTS "kambing_penggemukan_feed_logs_select" ON "public"."kambing_penggemukan_feed_logs";
CREATE POLICY "kambing_penggemukan_feed_logs_select" ON "public"."kambing_penggemukan_feed_logs" AS PERMISSIVE FOR SELECT TO authenticated USING (is_tenant_member(tenant_id) OR is_superadmin());

DROP POLICY IF EXISTS "kambing_penggemukan_feed_logs_update" ON "public"."kambing_penggemukan_feed_logs";
CREATE POLICY "kambing_penggemukan_feed_logs_update" ON "public"."kambing_penggemukan_feed_logs" AS PERMISSIVE FOR UPDATE TO authenticated USING ((is_tenant_member(tenant_id) AND (my_role_for(tenant_id) = ANY (ARRAY['owner'::text, 'staff'::text]))) OR is_superadmin()) WITH CHECK ((is_tenant_member(tenant_id) AND (my_role_for(tenant_id) = ANY (ARRAY['owner'::text, 'staff'::text]))) OR is_superadmin());

DROP POLICY IF EXISTS "kambing_penggemukan_health_logs_delete" ON "public"."kambing_penggemukan_health_logs";
CREATE POLICY "kambing_penggemukan_health_logs_delete" ON "public"."kambing_penggemukan_health_logs" AS PERMISSIVE FOR DELETE TO authenticated USING is_superadmin();

DROP POLICY IF EXISTS "kambing_penggemukan_health_logs_insert" ON "public"."kambing_penggemukan_health_logs";
CREATE POLICY "kambing_penggemukan_health_logs_insert" ON "public"."kambing_penggemukan_health_logs" AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((is_tenant_member(tenant_id) AND (my_role_for(tenant_id) = ANY (ARRAY['owner'::text, 'staff'::text]))) OR is_superadmin());

DROP POLICY IF EXISTS "kambing_penggemukan_health_logs_select" ON "public"."kambing_penggemukan_health_logs";
CREATE POLICY "kambing_penggemukan_health_logs_select" ON "public"."kambing_penggemukan_health_logs" AS PERMISSIVE FOR SELECT TO authenticated USING (is_tenant_member(tenant_id) OR is_superadmin());

DROP POLICY IF EXISTS "kambing_penggemukan_health_logs_update" ON "public"."kambing_penggemukan_health_logs";
CREATE POLICY "kambing_penggemukan_health_logs_update" ON "public"."kambing_penggemukan_health_logs" AS PERMISSIVE FOR UPDATE TO authenticated USING ((is_tenant_member(tenant_id) AND (my_role_for(tenant_id) = ANY (ARRAY['owner'::text, 'staff'::text]))) OR is_superadmin()) WITH CHECK ((is_tenant_member(tenant_id) AND (my_role_for(tenant_id) = ANY (ARRAY['owner'::text, 'staff'::text]))) OR is_superadmin());

DROP POLICY IF EXISTS "kambing_penggemukan_operational_costs_delete" ON "public"."kambing_penggemukan_operational_costs";
CREATE POLICY "kambing_penggemukan_operational_costs_delete" ON "public"."kambing_penggemukan_operational_costs" AS PERMISSIVE FOR DELETE TO authenticated USING is_superadmin();

DROP POLICY IF EXISTS "kambing_penggemukan_operational_costs_insert" ON "public"."kambing_penggemukan_operational_costs";
CREATE POLICY "kambing_penggemukan_operational_costs_insert" ON "public"."kambing_penggemukan_operational_costs" AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((is_tenant_member(tenant_id) AND (my_role_for(tenant_id) = ANY (ARRAY['owner'::text, 'staff'::text]))) OR is_superadmin());

DROP POLICY IF EXISTS "kambing_penggemukan_operational_costs_select" ON "public"."kambing_penggemukan_operational_costs";
CREATE POLICY "kambing_penggemukan_operational_costs_select" ON "public"."kambing_penggemukan_operational_costs" AS PERMISSIVE FOR SELECT TO authenticated USING (is_tenant_member(tenant_id) OR is_superadmin());

DROP POLICY IF EXISTS "kambing_penggemukan_operational_costs_update" ON "public"."kambing_penggemukan_operational_costs";
CREATE POLICY "kambing_penggemukan_operational_costs_update" ON "public"."kambing_penggemukan_operational_costs" AS PERMISSIVE FOR UPDATE TO authenticated USING ((is_tenant_member(tenant_id) AND (my_role_for(tenant_id) = ANY (ARRAY['owner'::text, 'staff'::text]))) OR is_superadmin()) WITH CHECK ((is_tenant_member(tenant_id) AND (my_role_for(tenant_id) = ANY (ARRAY['owner'::text, 'staff'::text]))) OR is_superadmin());

DROP POLICY IF EXISTS "kambing_penggemukan_sales_delete" ON "public"."kambing_penggemukan_sales";
CREATE POLICY "kambing_penggemukan_sales_delete" ON "public"."kambing_penggemukan_sales" AS PERMISSIVE FOR DELETE TO authenticated USING is_superadmin();

DROP POLICY IF EXISTS "kambing_penggemukan_sales_insert" ON "public"."kambing_penggemukan_sales";
CREATE POLICY "kambing_penggemukan_sales_insert" ON "public"."kambing_penggemukan_sales" AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((is_tenant_member(tenant_id) AND (my_role_for(tenant_id) = ANY (ARRAY['owner'::text, 'staff'::text]))) OR is_superadmin());

DROP POLICY IF EXISTS "kambing_penggemukan_sales_select" ON "public"."kambing_penggemukan_sales";
CREATE POLICY "kambing_penggemukan_sales_select" ON "public"."kambing_penggemukan_sales" AS PERMISSIVE FOR SELECT TO authenticated USING (is_tenant_member(tenant_id) OR is_superadmin());

DROP POLICY IF EXISTS "kambing_penggemukan_sales_update" ON "public"."kambing_penggemukan_sales";
CREATE POLICY "kambing_penggemukan_sales_update" ON "public"."kambing_penggemukan_sales" AS PERMISSIVE FOR UPDATE TO authenticated USING ((is_tenant_member(tenant_id) AND (my_role_for(tenant_id) = ANY (ARRAY['owner'::text, 'staff'::text]))) OR is_superadmin()) WITH CHECK ((is_tenant_member(tenant_id) AND (my_role_for(tenant_id) = ANY (ARRAY['owner'::text, 'staff'::text]))) OR is_superadmin());

DROP POLICY IF EXISTS "kambing_penggemukan_weight_records_delete" ON "public"."kambing_penggemukan_weight_records";
CREATE POLICY "kambing_penggemukan_weight_records_delete" ON "public"."kambing_penggemukan_weight_records" AS PERMISSIVE FOR DELETE TO authenticated USING is_superadmin();

DROP POLICY IF EXISTS "kambing_penggemukan_weight_records_insert" ON "public"."kambing_penggemukan_weight_records";
CREATE POLICY "kambing_penggemukan_weight_records_insert" ON "public"."kambing_penggemukan_weight_records" AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((is_tenant_member(tenant_id) AND (my_role_for(tenant_id) = ANY (ARRAY['owner'::text, 'staff'::text]))) OR is_superadmin());

DROP POLICY IF EXISTS "kambing_penggemukan_weight_records_select" ON "public"."kambing_penggemukan_weight_records";
CREATE POLICY "kambing_penggemukan_weight_records_select" ON "public"."kambing_penggemukan_weight_records" AS PERMISSIVE FOR SELECT TO authenticated USING (is_tenant_member(tenant_id) OR is_superadmin());

DROP POLICY IF EXISTS "kambing_penggemukan_weight_records_update" ON "public"."kambing_penggemukan_weight_records";
CREATE POLICY "kambing_penggemukan_weight_records_update" ON "public"."kambing_penggemukan_weight_records" AS PERMISSIVE FOR UPDATE TO authenticated USING ((is_tenant_member(tenant_id) AND (my_role_for(tenant_id) = ANY (ARRAY['owner'::text, 'staff'::text]))) OR is_superadmin()) WITH CHECK ((is_tenant_member(tenant_id) AND (my_role_for(tenant_id) = ANY (ARRAY['owner'::text, 'staff'::text]))) OR is_superadmin());

DROP POLICY IF EXISTS "kambing_perah_animal_groups_delete" ON "public"."kambing_perah_animal_groups";
CREATE POLICY "kambing_perah_animal_groups_delete" ON "public"."kambing_perah_animal_groups" AS PERMISSIVE FOR DELETE TO authenticated USING is_superadmin();

DROP POLICY IF EXISTS "kambing_perah_animal_groups_insert" ON "public"."kambing_perah_animal_groups";
CREATE POLICY "kambing_perah_animal_groups_insert" ON "public"."kambing_perah_animal_groups" AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((is_tenant_member(tenant_id) AND (my_role_for(tenant_id) = ANY (ARRAY['owner'::text, 'staff'::text]))) OR is_superadmin());

DROP POLICY IF EXISTS "kambing_perah_animal_groups_select" ON "public"."kambing_perah_animal_groups";
CREATE POLICY "kambing_perah_animal_groups_select" ON "public"."kambing_perah_animal_groups" AS PERMISSIVE FOR SELECT TO authenticated USING (is_tenant_member(tenant_id) OR is_superadmin());

DROP POLICY IF EXISTS "kambing_perah_animal_groups_update" ON "public"."kambing_perah_animal_groups";
CREATE POLICY "kambing_perah_animal_groups_update" ON "public"."kambing_perah_animal_groups" AS PERMISSIVE FOR UPDATE TO authenticated USING ((is_tenant_member(tenant_id) AND (my_role_for(tenant_id) = ANY (ARRAY['owner'::text, 'staff'::text]))) OR is_superadmin()) WITH CHECK ((is_tenant_member(tenant_id) AND (my_role_for(tenant_id) = ANY (ARRAY['owner'::text, 'staff'::text]))) OR is_superadmin());

DROP POLICY IF EXISTS "kambing_perah_breeding_animals_delete" ON "public"."kambing_perah_breeding_animals";
CREATE POLICY "kambing_perah_breeding_animals_delete" ON "public"."kambing_perah_breeding_animals" AS PERMISSIVE FOR DELETE TO authenticated USING is_superadmin();

DROP POLICY IF EXISTS "kambing_perah_breeding_animals_insert" ON "public"."kambing_perah_breeding_animals";
CREATE POLICY "kambing_perah_breeding_animals_insert" ON "public"."kambing_perah_breeding_animals" AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((is_tenant_member(tenant_id) AND (my_role_for(tenant_id) = ANY (ARRAY['owner'::text, 'staff'::text]))) OR is_superadmin());

DROP POLICY IF EXISTS "kambing_perah_breeding_animals_select" ON "public"."kambing_perah_breeding_animals";
CREATE POLICY "kambing_perah_breeding_animals_select" ON "public"."kambing_perah_breeding_animals" AS PERMISSIVE FOR SELECT TO authenticated USING (is_tenant_member(tenant_id) OR is_superadmin());

DROP POLICY IF EXISTS "kambing_perah_breeding_animals_update" ON "public"."kambing_perah_breeding_animals";
CREATE POLICY "kambing_perah_breeding_animals_update" ON "public"."kambing_perah_breeding_animals" AS PERMISSIVE FOR UPDATE TO authenticated USING ((is_tenant_member(tenant_id) AND (my_role_for(tenant_id) = ANY (ARRAY['owner'::text, 'staff'::text]))) OR is_superadmin()) WITH CHECK ((is_tenant_member(tenant_id) AND (my_role_for(tenant_id) = ANY (ARRAY['owner'::text, 'staff'::text]))) OR is_superadmin());

DROP POLICY IF EXISTS "kambing_perah_breeding_births_delete" ON "public"."kambing_perah_breeding_births";
CREATE POLICY "kambing_perah_breeding_births_delete" ON "public"."kambing_perah_breeding_births" AS PERMISSIVE FOR DELETE TO authenticated USING is_superadmin();

DROP POLICY IF EXISTS "kambing_perah_breeding_births_insert" ON "public"."kambing_perah_breeding_births";
CREATE POLICY "kambing_perah_breeding_births_insert" ON "public"."kambing_perah_breeding_births" AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((is_tenant_member(tenant_id) AND (my_role_for(tenant_id) = ANY (ARRAY['owner'::text, 'staff'::text]))) OR is_superadmin());

DROP POLICY IF EXISTS "kambing_perah_breeding_births_select" ON "public"."kambing_perah_breeding_births";
CREATE POLICY "kambing_perah_breeding_births_select" ON "public"."kambing_perah_breeding_births" AS PERMISSIVE FOR SELECT TO authenticated USING (is_tenant_member(tenant_id) OR is_superadmin());

DROP POLICY IF EXISTS "kambing_perah_breeding_births_update" ON "public"."kambing_perah_breeding_births";
CREATE POLICY "kambing_perah_breeding_births_update" ON "public"."kambing_perah_breeding_births" AS PERMISSIVE FOR UPDATE TO authenticated USING ((is_tenant_member(tenant_id) AND (my_role_for(tenant_id) = ANY (ARRAY['owner'::text, 'staff'::text]))) OR is_superadmin()) WITH CHECK ((is_tenant_member(tenant_id) AND (my_role_for(tenant_id) = ANY (ARRAY['owner'::text, 'staff'::text]))) OR is_superadmin());

DROP POLICY IF EXISTS "kambing_perah_breeding_feed_logs_delete" ON "public"."kambing_perah_breeding_feed_logs";
CREATE POLICY "kambing_perah_breeding_feed_logs_delete" ON "public"."kambing_perah_breeding_feed_logs" AS PERMISSIVE FOR DELETE TO authenticated USING is_superadmin();

DROP POLICY IF EXISTS "kambing_perah_breeding_feed_logs_insert" ON "public"."kambing_perah_breeding_feed_logs";
CREATE POLICY "kambing_perah_breeding_feed_logs_insert" ON "public"."kambing_perah_breeding_feed_logs" AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((is_tenant_member(tenant_id) AND (my_role_for(tenant_id) = ANY (ARRAY['owner'::text, 'staff'::text]))) OR is_superadmin());

DROP POLICY IF EXISTS "kambing_perah_breeding_feed_logs_select" ON "public"."kambing_perah_breeding_feed_logs";
CREATE POLICY "kambing_perah_breeding_feed_logs_select" ON "public"."kambing_perah_breeding_feed_logs" AS PERMISSIVE FOR SELECT TO authenticated USING (is_tenant_member(tenant_id) OR is_superadmin());

DROP POLICY IF EXISTS "kambing_perah_breeding_feed_logs_update" ON "public"."kambing_perah_breeding_feed_logs";
CREATE POLICY "kambing_perah_breeding_feed_logs_update" ON "public"."kambing_perah_breeding_feed_logs" AS PERMISSIVE FOR UPDATE TO authenticated USING ((is_tenant_member(tenant_id) AND (my_role_for(tenant_id) = ANY (ARRAY['owner'::text, 'staff'::text]))) OR is_superadmin()) WITH CHECK ((is_tenant_member(tenant_id) AND (my_role_for(tenant_id) = ANY (ARRAY['owner'::text, 'staff'::text]))) OR is_superadmin());

DROP POLICY IF EXISTS "kambing_perah_breeding_health_logs_delete" ON "public"."kambing_perah_breeding_health_logs";
CREATE POLICY "kambing_perah_breeding_health_logs_delete" ON "public"."kambing_perah_breeding_health_logs" AS PERMISSIVE FOR DELETE TO authenticated USING is_superadmin();

DROP POLICY IF EXISTS "kambing_perah_breeding_health_logs_insert" ON "public"."kambing_perah_breeding_health_logs";
CREATE POLICY "kambing_perah_breeding_health_logs_insert" ON "public"."kambing_perah_breeding_health_logs" AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((is_tenant_member(tenant_id) AND (my_role_for(tenant_id) = ANY (ARRAY['owner'::text, 'staff'::text]))) OR is_superadmin());

DROP POLICY IF EXISTS "kambing_perah_breeding_health_logs_select" ON "public"."kambing_perah_breeding_health_logs";
CREATE POLICY "kambing_perah_breeding_health_logs_select" ON "public"."kambing_perah_breeding_health_logs" AS PERMISSIVE FOR SELECT TO authenticated USING (is_tenant_member(tenant_id) OR is_superadmin());

DROP POLICY IF EXISTS "kambing_perah_breeding_health_logs_update" ON "public"."kambing_perah_breeding_health_logs";
CREATE POLICY "kambing_perah_breeding_health_logs_update" ON "public"."kambing_perah_breeding_health_logs" AS PERMISSIVE FOR UPDATE TO authenticated USING ((is_tenant_member(tenant_id) AND (my_role_for(tenant_id) = ANY (ARRAY['owner'::text, 'staff'::text]))) OR is_superadmin()) WITH CHECK ((is_tenant_member(tenant_id) AND (my_role_for(tenant_id) = ANY (ARRAY['owner'::text, 'staff'::text]))) OR is_superadmin());

DROP POLICY IF EXISTS "kambing_perah_breeding_mating_records_delete" ON "public"."kambing_perah_breeding_mating_records";
CREATE POLICY "kambing_perah_breeding_mating_records_delete" ON "public"."kambing_perah_breeding_mating_records" AS PERMISSIVE FOR DELETE TO authenticated USING is_superadmin();

DROP POLICY IF EXISTS "kambing_perah_breeding_mating_records_insert" ON "public"."kambing_perah_breeding_mating_records";
CREATE POLICY "kambing_perah_breeding_mating_records_insert" ON "public"."kambing_perah_breeding_mating_records" AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((is_tenant_member(tenant_id) AND (my_role_for(tenant_id) = ANY (ARRAY['owner'::text, 'staff'::text]))) OR is_superadmin());

DROP POLICY IF EXISTS "kambing_perah_breeding_mating_records_select" ON "public"."kambing_perah_breeding_mating_records";
CREATE POLICY "kambing_perah_breeding_mating_records_select" ON "public"."kambing_perah_breeding_mating_records" AS PERMISSIVE FOR SELECT TO authenticated USING (is_tenant_member(tenant_id) OR is_superadmin());

DROP POLICY IF EXISTS "kambing_perah_breeding_mating_records_update" ON "public"."kambing_perah_breeding_mating_records";
CREATE POLICY "kambing_perah_breeding_mating_records_update" ON "public"."kambing_perah_breeding_mating_records" AS PERMISSIVE FOR UPDATE TO authenticated USING ((is_tenant_member(tenant_id) AND (my_role_for(tenant_id) = ANY (ARRAY['owner'::text, 'staff'::text]))) OR is_superadmin()) WITH CHECK ((is_tenant_member(tenant_id) AND (my_role_for(tenant_id) = ANY (ARRAY['owner'::text, 'staff'::text]))) OR is_superadmin());

DROP POLICY IF EXISTS "kambing_perah_breeding_weight_records_delete" ON "public"."kambing_perah_breeding_weight_records";
CREATE POLICY "kambing_perah_breeding_weight_records_delete" ON "public"."kambing_perah_breeding_weight_records" AS PERMISSIVE FOR DELETE TO authenticated USING is_superadmin();

DROP POLICY IF EXISTS "kambing_perah_breeding_weight_records_insert" ON "public"."kambing_perah_breeding_weight_records";
CREATE POLICY "kambing_perah_breeding_weight_records_insert" ON "public"."kambing_perah_breeding_weight_records" AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((is_tenant_member(tenant_id) AND (my_role_for(tenant_id) = ANY (ARRAY['owner'::text, 'staff'::text]))) OR is_superadmin());

DROP POLICY IF EXISTS "kambing_perah_breeding_weight_records_select" ON "public"."kambing_perah_breeding_weight_records";
CREATE POLICY "kambing_perah_breeding_weight_records_select" ON "public"."kambing_perah_breeding_weight_records" AS PERMISSIVE FOR SELECT TO authenticated USING (is_tenant_member(tenant_id) OR is_superadmin());

DROP POLICY IF EXISTS "kambing_perah_breeding_weight_records_update" ON "public"."kambing_perah_breeding_weight_records";
CREATE POLICY "kambing_perah_breeding_weight_records_update" ON "public"."kambing_perah_breeding_weight_records" AS PERMISSIVE FOR UPDATE TO authenticated USING ((is_tenant_member(tenant_id) AND (my_role_for(tenant_id) = ANY (ARRAY['owner'::text, 'staff'::text]))) OR is_superadmin()) WITH CHECK ((is_tenant_member(tenant_id) AND (my_role_for(tenant_id) = ANY (ARRAY['owner'::text, 'staff'::text]))) OR is_superadmin());

DROP POLICY IF EXISTS "kambing_perah_customer_registry_delete" ON "public"."kambing_perah_customer_registry";
CREATE POLICY "kambing_perah_customer_registry_delete" ON "public"."kambing_perah_customer_registry" AS PERMISSIVE FOR DELETE TO authenticated USING is_superadmin();

DROP POLICY IF EXISTS "kambing_perah_customer_registry_insert" ON "public"."kambing_perah_customer_registry";
CREATE POLICY "kambing_perah_customer_registry_insert" ON "public"."kambing_perah_customer_registry" AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((is_tenant_member(tenant_id) AND (my_role_for(tenant_id) = ANY (ARRAY['owner'::text, 'staff'::text]))) OR is_superadmin());

DROP POLICY IF EXISTS "kambing_perah_customer_registry_select" ON "public"."kambing_perah_customer_registry";
CREATE POLICY "kambing_perah_customer_registry_select" ON "public"."kambing_perah_customer_registry" AS PERMISSIVE FOR SELECT TO authenticated USING (is_tenant_member(tenant_id) OR is_superadmin());

DROP POLICY IF EXISTS "kambing_perah_customer_registry_update" ON "public"."kambing_perah_customer_registry";
CREATE POLICY "kambing_perah_customer_registry_update" ON "public"."kambing_perah_customer_registry" AS PERMISSIVE FOR UPDATE TO authenticated USING ((is_tenant_member(tenant_id) AND (my_role_for(tenant_id) = ANY (ARRAY['owner'::text, 'staff'::text]))) OR is_superadmin()) WITH CHECK ((is_tenant_member(tenant_id) AND (my_role_for(tenant_id) = ANY (ARRAY['owner'::text, 'staff'::text]))) OR is_superadmin());

DROP POLICY IF EXISTS "kambing_perah_feed_formulations_delete" ON "public"."kambing_perah_feed_formulations";
CREATE POLICY "kambing_perah_feed_formulations_delete" ON "public"."kambing_perah_feed_formulations" AS PERMISSIVE FOR DELETE TO authenticated USING is_superadmin();

DROP POLICY IF EXISTS "kambing_perah_feed_formulations_insert" ON "public"."kambing_perah_feed_formulations";
CREATE POLICY "kambing_perah_feed_formulations_insert" ON "public"."kambing_perah_feed_formulations" AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((is_tenant_member(tenant_id) AND (my_role_for(tenant_id) = ANY (ARRAY['owner'::text, 'staff'::text]))) OR is_superadmin());

DROP POLICY IF EXISTS "kambing_perah_feed_formulations_select" ON "public"."kambing_perah_feed_formulations";
CREATE POLICY "kambing_perah_feed_formulations_select" ON "public"."kambing_perah_feed_formulations" AS PERMISSIVE FOR SELECT TO authenticated USING (is_tenant_member(tenant_id) OR is_superadmin());

DROP POLICY IF EXISTS "kambing_perah_feed_formulations_update" ON "public"."kambing_perah_feed_formulations";
CREATE POLICY "kambing_perah_feed_formulations_update" ON "public"."kambing_perah_feed_formulations" AS PERMISSIVE FOR UPDATE TO authenticated USING ((is_tenant_member(tenant_id) AND (my_role_for(tenant_id) = ANY (ARRAY['owner'::text, 'staff'::text]))) OR is_superadmin()) WITH CHECK ((is_tenant_member(tenant_id) AND (my_role_for(tenant_id) = ANY (ARRAY['owner'::text, 'staff'::text]))) OR is_superadmin());

DROP POLICY IF EXISTS "kambing_perah_inventory_items_delete" ON "public"."kambing_perah_inventory_items";
CREATE POLICY "kambing_perah_inventory_items_delete" ON "public"."kambing_perah_inventory_items" AS PERMISSIVE FOR DELETE TO authenticated USING is_superadmin();

DROP POLICY IF EXISTS "kambing_perah_inventory_items_insert" ON "public"."kambing_perah_inventory_items";
CREATE POLICY "kambing_perah_inventory_items_insert" ON "public"."kambing_perah_inventory_items" AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((is_tenant_member(tenant_id) AND (my_role_for(tenant_id) = ANY (ARRAY['owner'::text, 'staff'::text]))) OR is_superadmin());

DROP POLICY IF EXISTS "kambing_perah_inventory_items_select" ON "public"."kambing_perah_inventory_items";
CREATE POLICY "kambing_perah_inventory_items_select" ON "public"."kambing_perah_inventory_items" AS PERMISSIVE FOR SELECT TO authenticated USING (is_tenant_member(tenant_id) OR is_superadmin());

DROP POLICY IF EXISTS "kambing_perah_inventory_items_update" ON "public"."kambing_perah_inventory_items";
CREATE POLICY "kambing_perah_inventory_items_update" ON "public"."kambing_perah_inventory_items" AS PERMISSIVE FOR UPDATE TO authenticated USING ((is_tenant_member(tenant_id) AND (my_role_for(tenant_id) = ANY (ARRAY['owner'::text, 'staff'::text]))) OR is_superadmin()) WITH CHECK ((is_tenant_member(tenant_id) AND (my_role_for(tenant_id) = ANY (ARRAY['owner'::text, 'staff'::text]))) OR is_superadmin());

DROP POLICY IF EXISTS "kambing_perah_inventory_transactions_delete" ON "public"."kambing_perah_inventory_transactions";
CREATE POLICY "kambing_perah_inventory_transactions_delete" ON "public"."kambing_perah_inventory_transactions" AS PERMISSIVE FOR DELETE TO authenticated USING is_superadmin();

DROP POLICY IF EXISTS "kambing_perah_inventory_transactions_insert" ON "public"."kambing_perah_inventory_transactions";
CREATE POLICY "kambing_perah_inventory_transactions_insert" ON "public"."kambing_perah_inventory_transactions" AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((is_tenant_member(tenant_id) AND (my_role_for(tenant_id) = ANY (ARRAY['owner'::text, 'staff'::text]))) OR is_superadmin());

DROP POLICY IF EXISTS "kambing_perah_inventory_transactions_select" ON "public"."kambing_perah_inventory_transactions";
CREATE POLICY "kambing_perah_inventory_transactions_select" ON "public"."kambing_perah_inventory_transactions" AS PERMISSIVE FOR SELECT TO authenticated USING (is_tenant_member(tenant_id) OR is_superadmin());

DROP POLICY IF EXISTS "kambing_perah_inventory_transactions_update" ON "public"."kambing_perah_inventory_transactions";
CREATE POLICY "kambing_perah_inventory_transactions_update" ON "public"."kambing_perah_inventory_transactions" AS PERMISSIVE FOR UPDATE TO authenticated USING ((is_tenant_member(tenant_id) AND (my_role_for(tenant_id) = ANY (ARRAY['owner'::text, 'staff'::text]))) OR is_superadmin()) WITH CHECK ((is_tenant_member(tenant_id) AND (my_role_for(tenant_id) = ANY (ARRAY['owner'::text, 'staff'::text]))) OR is_superadmin());

DROP POLICY IF EXISTS "kambing_perah_kandangs_delete" ON "public"."kambing_perah_kandangs";
CREATE POLICY "kambing_perah_kandangs_delete" ON "public"."kambing_perah_kandangs" AS PERMISSIVE FOR DELETE TO authenticated USING is_superadmin();

DROP POLICY IF EXISTS "kambing_perah_kandangs_insert" ON "public"."kambing_perah_kandangs";
CREATE POLICY "kambing_perah_kandangs_insert" ON "public"."kambing_perah_kandangs" AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((is_tenant_member(tenant_id) AND (my_role_for(tenant_id) = ANY (ARRAY['owner'::text, 'staff'::text]))) OR is_superadmin());

DROP POLICY IF EXISTS "kambing_perah_kandangs_select" ON "public"."kambing_perah_kandangs";
CREATE POLICY "kambing_perah_kandangs_select" ON "public"."kambing_perah_kandangs" AS PERMISSIVE FOR SELECT TO authenticated USING (is_tenant_member(tenant_id) OR is_superadmin());

DROP POLICY IF EXISTS "kambing_perah_kandangs_update" ON "public"."kambing_perah_kandangs";
CREATE POLICY "kambing_perah_kandangs_update" ON "public"."kambing_perah_kandangs" AS PERMISSIVE FOR UPDATE TO authenticated USING ((is_tenant_member(tenant_id) AND (my_role_for(tenant_id) = ANY (ARRAY['owner'::text, 'staff'::text]))) OR is_superadmin()) WITH CHECK ((is_tenant_member(tenant_id) AND (my_role_for(tenant_id) = ANY (ARRAY['owner'::text, 'staff'::text]))) OR is_superadmin());

DROP POLICY IF EXISTS "kambing_perah_lactation_cycles_delete" ON "public"."kambing_perah_lactation_cycles";
CREATE POLICY "kambing_perah_lactation_cycles_delete" ON "public"."kambing_perah_lactation_cycles" AS PERMISSIVE FOR DELETE TO authenticated USING is_superadmin();

DROP POLICY IF EXISTS "kambing_perah_lactation_cycles_insert" ON "public"."kambing_perah_lactation_cycles";
CREATE POLICY "kambing_perah_lactation_cycles_insert" ON "public"."kambing_perah_lactation_cycles" AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((is_tenant_member(tenant_id) AND (my_role_for(tenant_id) = ANY (ARRAY['owner'::text, 'staff'::text]))) OR is_superadmin());

DROP POLICY IF EXISTS "kambing_perah_lactation_cycles_select" ON "public"."kambing_perah_lactation_cycles";
CREATE POLICY "kambing_perah_lactation_cycles_select" ON "public"."kambing_perah_lactation_cycles" AS PERMISSIVE FOR SELECT TO authenticated USING (is_tenant_member(tenant_id) OR is_superadmin());

DROP POLICY IF EXISTS "kambing_perah_lactation_cycles_update" ON "public"."kambing_perah_lactation_cycles";
CREATE POLICY "kambing_perah_lactation_cycles_update" ON "public"."kambing_perah_lactation_cycles" AS PERMISSIVE FOR UPDATE TO authenticated USING ((is_tenant_member(tenant_id) AND (my_role_for(tenant_id) = ANY (ARRAY['owner'::text, 'staff'::text]))) OR is_superadmin()) WITH CHECK ((is_tenant_member(tenant_id) AND (my_role_for(tenant_id) = ANY (ARRAY['owner'::text, 'staff'::text]))) OR is_superadmin());

DROP POLICY IF EXISTS "kambing_perah_milk_logs_delete" ON "public"."kambing_perah_milk_logs";
CREATE POLICY "kambing_perah_milk_logs_delete" ON "public"."kambing_perah_milk_logs" AS PERMISSIVE FOR DELETE TO authenticated USING is_superadmin();

DROP POLICY IF EXISTS "kambing_perah_milk_logs_insert" ON "public"."kambing_perah_milk_logs";
CREATE POLICY "kambing_perah_milk_logs_insert" ON "public"."kambing_perah_milk_logs" AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((is_tenant_member(tenant_id) AND (my_role_for(tenant_id) = ANY (ARRAY['owner'::text, 'staff'::text]))) OR is_superadmin());

DROP POLICY IF EXISTS "kambing_perah_milk_logs_select" ON "public"."kambing_perah_milk_logs";
CREATE POLICY "kambing_perah_milk_logs_select" ON "public"."kambing_perah_milk_logs" AS PERMISSIVE FOR SELECT TO authenticated USING (is_tenant_member(tenant_id) OR is_superadmin());

DROP POLICY IF EXISTS "kambing_perah_milk_logs_update" ON "public"."kambing_perah_milk_logs";
CREATE POLICY "kambing_perah_milk_logs_update" ON "public"."kambing_perah_milk_logs" AS PERMISSIVE FOR UPDATE TO authenticated USING ((is_tenant_member(tenant_id) AND (my_role_for(tenant_id) = ANY (ARRAY['owner'::text, 'staff'::text]))) OR is_superadmin()) WITH CHECK ((is_tenant_member(tenant_id) AND (my_role_for(tenant_id) = ANY (ARRAY['owner'::text, 'staff'::text]))) OR is_superadmin());

DROP POLICY IF EXISTS "kambing_perah_milk_quality_logs_delete" ON "public"."kambing_perah_milk_quality_logs";
CREATE POLICY "kambing_perah_milk_quality_logs_delete" ON "public"."kambing_perah_milk_quality_logs" AS PERMISSIVE FOR DELETE TO authenticated USING is_superadmin();

DROP POLICY IF EXISTS "kambing_perah_milk_quality_logs_insert" ON "public"."kambing_perah_milk_quality_logs";
CREATE POLICY "kambing_perah_milk_quality_logs_insert" ON "public"."kambing_perah_milk_quality_logs" AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((is_tenant_member(tenant_id) AND (my_role_for(tenant_id) = ANY (ARRAY['owner'::text, 'staff'::text]))) OR is_superadmin());

DROP POLICY IF EXISTS "kambing_perah_milk_quality_logs_select" ON "public"."kambing_perah_milk_quality_logs";
CREATE POLICY "kambing_perah_milk_quality_logs_select" ON "public"."kambing_perah_milk_quality_logs" AS PERMISSIVE FOR SELECT TO authenticated USING (is_tenant_member(tenant_id) OR is_superadmin());

DROP POLICY IF EXISTS "kambing_perah_milk_quality_logs_update" ON "public"."kambing_perah_milk_quality_logs";
CREATE POLICY "kambing_perah_milk_quality_logs_update" ON "public"."kambing_perah_milk_quality_logs" AS PERMISSIVE FOR UPDATE TO authenticated USING ((is_tenant_member(tenant_id) AND (my_role_for(tenant_id) = ANY (ARRAY['owner'::text, 'staff'::text]))) OR is_superadmin()) WITH CHECK ((is_tenant_member(tenant_id) AND (my_role_for(tenant_id) = ANY (ARRAY['owner'::text, 'staff'::text]))) OR is_superadmin());

DROP POLICY IF EXISTS "kambing_perah_milk_sales_delete" ON "public"."kambing_perah_milk_sales";
CREATE POLICY "kambing_perah_milk_sales_delete" ON "public"."kambing_perah_milk_sales" AS PERMISSIVE FOR DELETE TO authenticated USING is_superadmin();

DROP POLICY IF EXISTS "kambing_perah_milk_sales_insert" ON "public"."kambing_perah_milk_sales";
CREATE POLICY "kambing_perah_milk_sales_insert" ON "public"."kambing_perah_milk_sales" AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((is_tenant_member(tenant_id) AND (my_role_for(tenant_id) = ANY (ARRAY['owner'::text, 'staff'::text]))) OR is_superadmin());

DROP POLICY IF EXISTS "kambing_perah_milk_sales_select" ON "public"."kambing_perah_milk_sales";
CREATE POLICY "kambing_perah_milk_sales_select" ON "public"."kambing_perah_milk_sales" AS PERMISSIVE FOR SELECT TO authenticated USING (is_tenant_member(tenant_id) OR is_superadmin());

DROP POLICY IF EXISTS "kambing_perah_milk_sales_update" ON "public"."kambing_perah_milk_sales";
CREATE POLICY "kambing_perah_milk_sales_update" ON "public"."kambing_perah_milk_sales" AS PERMISSIVE FOR UPDATE TO authenticated USING ((is_tenant_member(tenant_id) AND (my_role_for(tenant_id) = ANY (ARRAY['owner'::text, 'staff'::text]))) OR is_superadmin()) WITH CHECK ((is_tenant_member(tenant_id) AND (my_role_for(tenant_id) = ANY (ARRAY['owner'::text, 'staff'::text]))) OR is_superadmin());

DROP POLICY IF EXISTS "kambing_perah_penggemukan_animals_delete" ON "public"."kambing_perah_penggemukan_animals";
CREATE POLICY "kambing_perah_penggemukan_animals_delete" ON "public"."kambing_perah_penggemukan_animals" AS PERMISSIVE FOR DELETE TO authenticated USING is_superadmin();

DROP POLICY IF EXISTS "kambing_perah_penggemukan_animals_insert" ON "public"."kambing_perah_penggemukan_animals";
CREATE POLICY "kambing_perah_penggemukan_animals_insert" ON "public"."kambing_perah_penggemukan_animals" AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((is_tenant_member(tenant_id) AND (my_role_for(tenant_id) = ANY (ARRAY['owner'::text, 'staff'::text]))) OR is_superadmin());

DROP POLICY IF EXISTS "kambing_perah_penggemukan_animals_select" ON "public"."kambing_perah_penggemukan_animals";
CREATE POLICY "kambing_perah_penggemukan_animals_select" ON "public"."kambing_perah_penggemukan_animals" AS PERMISSIVE FOR SELECT TO authenticated USING (is_tenant_member(tenant_id) OR is_superadmin());

DROP POLICY IF EXISTS "kambing_perah_penggemukan_animals_update" ON "public"."kambing_perah_penggemukan_animals";
CREATE POLICY "kambing_perah_penggemukan_animals_update" ON "public"."kambing_perah_penggemukan_animals" AS PERMISSIVE FOR UPDATE TO authenticated USING ((is_tenant_member(tenant_id) AND (my_role_for(tenant_id) = ANY (ARRAY['owner'::text, 'staff'::text]))) OR is_superadmin()) WITH CHECK ((is_tenant_member(tenant_id) AND (my_role_for(tenant_id) = ANY (ARRAY['owner'::text, 'staff'::text]))) OR is_superadmin());

DROP POLICY IF EXISTS "kambing_perah_penggemukan_batches_delete" ON "public"."kambing_perah_penggemukan_batches";
CREATE POLICY "kambing_perah_penggemukan_batches_delete" ON "public"."kambing_perah_penggemukan_batches" AS PERMISSIVE FOR DELETE TO authenticated USING is_superadmin();

DROP POLICY IF EXISTS "kambing_perah_penggemukan_batches_insert" ON "public"."kambing_perah_penggemukan_batches";
CREATE POLICY "kambing_perah_penggemukan_batches_insert" ON "public"."kambing_perah_penggemukan_batches" AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((is_tenant_member(tenant_id) AND (my_role_for(tenant_id) = ANY (ARRAY['owner'::text, 'staff'::text]))) OR is_superadmin());

DROP POLICY IF EXISTS "kambing_perah_penggemukan_batches_select" ON "public"."kambing_perah_penggemukan_batches";
CREATE POLICY "kambing_perah_penggemukan_batches_select" ON "public"."kambing_perah_penggemukan_batches" AS PERMISSIVE FOR SELECT TO authenticated USING (is_tenant_member(tenant_id) OR is_superadmin());

DROP POLICY IF EXISTS "kambing_perah_penggemukan_batches_update" ON "public"."kambing_perah_penggemukan_batches";
CREATE POLICY "kambing_perah_penggemukan_batches_update" ON "public"."kambing_perah_penggemukan_batches" AS PERMISSIVE FOR UPDATE TO authenticated USING ((is_tenant_member(tenant_id) AND (my_role_for(tenant_id) = ANY (ARRAY['owner'::text, 'staff'::text]))) OR is_superadmin()) WITH CHECK ((is_tenant_member(tenant_id) AND (my_role_for(tenant_id) = ANY (ARRAY['owner'::text, 'staff'::text]))) OR is_superadmin());

DROP POLICY IF EXISTS "kambing_perah_penggemukan_feed_logs_delete" ON "public"."kambing_perah_penggemukan_feed_logs";
CREATE POLICY "kambing_perah_penggemukan_feed_logs_delete" ON "public"."kambing_perah_penggemukan_feed_logs" AS PERMISSIVE FOR DELETE TO authenticated USING is_superadmin();

DROP POLICY IF EXISTS "kambing_perah_penggemukan_feed_logs_insert" ON "public"."kambing_perah_penggemukan_feed_logs";
CREATE POLICY "kambing_perah_penggemukan_feed_logs_insert" ON "public"."kambing_perah_penggemukan_feed_logs" AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((is_tenant_member(tenant_id) AND (my_role_for(tenant_id) = ANY (ARRAY['owner'::text, 'staff'::text]))) OR is_superadmin());

DROP POLICY IF EXISTS "kambing_perah_penggemukan_feed_logs_select" ON "public"."kambing_perah_penggemukan_feed_logs";
CREATE POLICY "kambing_perah_penggemukan_feed_logs_select" ON "public"."kambing_perah_penggemukan_feed_logs" AS PERMISSIVE FOR SELECT TO authenticated USING (is_tenant_member(tenant_id) OR is_superadmin());

DROP POLICY IF EXISTS "kambing_perah_penggemukan_feed_logs_update" ON "public"."kambing_perah_penggemukan_feed_logs";
CREATE POLICY "kambing_perah_penggemukan_feed_logs_update" ON "public"."kambing_perah_penggemukan_feed_logs" AS PERMISSIVE FOR UPDATE TO authenticated USING ((is_tenant_member(tenant_id) AND (my_role_for(tenant_id) = ANY (ARRAY['owner'::text, 'staff'::text]))) OR is_superadmin()) WITH CHECK ((is_tenant_member(tenant_id) AND (my_role_for(tenant_id) = ANY (ARRAY['owner'::text, 'staff'::text]))) OR is_superadmin());

DROP POLICY IF EXISTS "kambing_perah_penggemukan_health_logs_delete" ON "public"."kambing_perah_penggemukan_health_logs";
CREATE POLICY "kambing_perah_penggemukan_health_logs_delete" ON "public"."kambing_perah_penggemukan_health_logs" AS PERMISSIVE FOR DELETE TO authenticated USING is_superadmin();

DROP POLICY IF EXISTS "kambing_perah_penggemukan_health_logs_insert" ON "public"."kambing_perah_penggemukan_health_logs";
CREATE POLICY "kambing_perah_penggemukan_health_logs_insert" ON "public"."kambing_perah_penggemukan_health_logs" AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((is_tenant_member(tenant_id) AND (my_role_for(tenant_id) = ANY (ARRAY['owner'::text, 'staff'::text]))) OR is_superadmin());

DROP POLICY IF EXISTS "kambing_perah_penggemukan_health_logs_select" ON "public"."kambing_perah_penggemukan_health_logs";
CREATE POLICY "kambing_perah_penggemukan_health_logs_select" ON "public"."kambing_perah_penggemukan_health_logs" AS PERMISSIVE FOR SELECT TO authenticated USING (is_tenant_member(tenant_id) OR is_superadmin());

DROP POLICY IF EXISTS "kambing_perah_penggemukan_health_logs_update" ON "public"."kambing_perah_penggemukan_health_logs";
CREATE POLICY "kambing_perah_penggemukan_health_logs_update" ON "public"."kambing_perah_penggemukan_health_logs" AS PERMISSIVE FOR UPDATE TO authenticated USING ((is_tenant_member(tenant_id) AND (my_role_for(tenant_id) = ANY (ARRAY['owner'::text, 'staff'::text]))) OR is_superadmin()) WITH CHECK ((is_tenant_member(tenant_id) AND (my_role_for(tenant_id) = ANY (ARRAY['owner'::text, 'staff'::text]))) OR is_superadmin());

DROP POLICY IF EXISTS "kambing_perah_penggemukan_sales_delete" ON "public"."kambing_perah_penggemukan_sales";
CREATE POLICY "kambing_perah_penggemukan_sales_delete" ON "public"."kambing_perah_penggemukan_sales" AS PERMISSIVE FOR DELETE TO authenticated USING is_superadmin();

DROP POLICY IF EXISTS "kambing_perah_penggemukan_sales_insert" ON "public"."kambing_perah_penggemukan_sales";
CREATE POLICY "kambing_perah_penggemukan_sales_insert" ON "public"."kambing_perah_penggemukan_sales" AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((is_tenant_member(tenant_id) AND (my_role_for(tenant_id) = ANY (ARRAY['owner'::text, 'staff'::text]))) OR is_superadmin());

DROP POLICY IF EXISTS "kambing_perah_penggemukan_sales_select" ON "public"."kambing_perah_penggemukan_sales";
CREATE POLICY "kambing_perah_penggemukan_sales_select" ON "public"."kambing_perah_penggemukan_sales" AS PERMISSIVE FOR SELECT TO authenticated USING (is_tenant_member(tenant_id) OR is_superadmin());

DROP POLICY IF EXISTS "kambing_perah_penggemukan_sales_update" ON "public"."kambing_perah_penggemukan_sales";
CREATE POLICY "kambing_perah_penggemukan_sales_update" ON "public"."kambing_perah_penggemukan_sales" AS PERMISSIVE FOR UPDATE TO authenticated USING ((is_tenant_member(tenant_id) AND (my_role_for(tenant_id) = ANY (ARRAY['owner'::text, 'staff'::text]))) OR is_superadmin()) WITH CHECK ((is_tenant_member(tenant_id) AND (my_role_for(tenant_id) = ANY (ARRAY['owner'::text, 'staff'::text]))) OR is_superadmin());

DROP POLICY IF EXISTS "kambing_perah_penggemukan_weight_records_delete" ON "public"."kambing_perah_penggemukan_weight_records";
CREATE POLICY "kambing_perah_penggemukan_weight_records_delete" ON "public"."kambing_perah_penggemukan_weight_records" AS PERMISSIVE FOR DELETE TO authenticated USING is_superadmin();

DROP POLICY IF EXISTS "kambing_perah_penggemukan_weight_records_insert" ON "public"."kambing_perah_penggemukan_weight_records";
CREATE POLICY "kambing_perah_penggemukan_weight_records_insert" ON "public"."kambing_perah_penggemukan_weight_records" AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((is_tenant_member(tenant_id) AND (my_role_for(tenant_id) = ANY (ARRAY['owner'::text, 'staff'::text]))) OR is_superadmin());

DROP POLICY IF EXISTS "kambing_perah_penggemukan_weight_records_select" ON "public"."kambing_perah_penggemukan_weight_records";
CREATE POLICY "kambing_perah_penggemukan_weight_records_select" ON "public"."kambing_perah_penggemukan_weight_records" AS PERMISSIVE FOR SELECT TO authenticated USING (is_tenant_member(tenant_id) OR is_superadmin());

DROP POLICY IF EXISTS "kambing_perah_penggemukan_weight_records_update" ON "public"."kambing_perah_penggemukan_weight_records";
CREATE POLICY "kambing_perah_penggemukan_weight_records_update" ON "public"."kambing_perah_penggemukan_weight_records" AS PERMISSIVE FOR UPDATE TO authenticated USING ((is_tenant_member(tenant_id) AND (my_role_for(tenant_id) = ANY (ARRAY['owner'::text, 'staff'::text]))) OR is_superadmin()) WITH CHECK ((is_tenant_member(tenant_id) AND (my_role_for(tenant_id) = ANY (ARRAY['owner'::text, 'staff'::text]))) OR is_superadmin());

DROP POLICY IF EXISTS "Kandang Worker Payments Access" ON "public"."kandang_worker_payments";
CREATE POLICY "Kandang Worker Payments Access" ON "public"."kandang_worker_payments" AS PERMISSIVE FOR ALL TO authenticated USING (is_tenant_member(tenant_id) OR is_superadmin()) WITH CHECK (is_tenant_member(tenant_id) OR is_superadmin());

DROP POLICY IF EXISTS "Tenant Isolation Policy" ON "public"."kandang_workers";
CREATE POLICY "Tenant Isolation Policy" ON "public"."kandang_workers" AS PERMISSIVE FOR ALL TO authenticated USING (is_tenant_member(tenant_id) OR is_superadmin());

DROP POLICY IF EXISTS "kandang_workers_superadmin_all" ON "public"."kandang_workers";
CREATE POLICY "kandang_workers_superadmin_all" ON "public"."kandang_workers" AS PERMISSIVE FOR ALL TO authenticated USING is_superadmin() WITH CHECK is_superadmin();

DROP POLICY IF EXISTS "loss_reports_delete" ON "public"."loss_reports";
CREATE POLICY "loss_reports_delete" ON "public"."loss_reports" AS PERMISSIVE FOR DELETE TO authenticated USING is_superadmin();

DROP POLICY IF EXISTS "loss_reports_insert" ON "public"."loss_reports";
CREATE POLICY "loss_reports_insert" ON "public"."loss_reports" AS PERMISSIVE FOR INSERT TO authenticated USING null
   FROM profiles p
  WHERE ((p.auth_user_id = auth.uid()) AND (p.tenant_id = loss_reports.tenant_id))))                                                                                                                                                                                                           |;

DROP POLICY IF EXISTS "loss_reports_select" ON "public"."loss_reports";
CREATE POLICY "loss_reports_select" ON "public"."loss_reports" AS PERMISSIVE FOR SELECT
   FROM profiles p
  WHERE ((p.auth_user_id = auth.uid()) AND (p.tenant_id = loss_reports.tenant_id)))) OR is_superadmin())                                                                                                                                                                                                                                                                                                           | null                                                                                                                                                                                                                                                                                                                                 | TO authenticated;

DROP POLICY IF EXISTS "loss_reports_update" ON "public"."loss_reports";
CREATE POLICY "loss_reports_update" ON "public"."loss_reports" AS PERMISSIVE FOR UPDATE
   FROM profiles p
  WHERE ((p.auth_user_id = auth.uid()) AND (p.tenant_id = loss_reports.tenant_id)))) OR is_superadmin())                                                                                                                                                                                                                                                                                                           | ((EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.auth_user_id = auth.uid()) AND (p.tenant_id = loss_reports.tenant_id)))) OR is_superadmin())                                                                                                                                                                                      | TO authenticated;

DROP POLICY IF EXISTS "authenticated_read_market" ON "public"."market_listings";
CREATE POLICY "authenticated_read_market" ON "public"."market_listings" AS PERMISSIVE FOR SELECT TO authenticated USING ((is_deleted = false) AND (status = 'active'::text));

DROP POLICY IF EXISTS "market_listings_superadmin_all" ON "public"."market_listings";
CREATE POLICY "market_listings_superadmin_all" ON "public"."market_listings" AS PERMISSIVE FOR ALL TO authenticated USING is_superadmin() WITH CHECK is_superadmin();

DROP POLICY IF EXISTS "tenant_insert_market" ON "public"."market_listings";
CREATE POLICY "tenant_insert_market" ON "public"."market_listings" AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((is_tenant_member(tenant_id) AND (my_role_for(tenant_id) = ANY (ARRAY['owner'::text, 'admin'::text, 'sales'::text]))) OR is_superadmin());

DROP POLICY IF EXISTS "tenant_update_market" ON "public"."market_listings";
CREATE POLICY "tenant_update_market" ON "public"."market_listings" AS PERMISSIVE FOR UPDATE TO authenticated USING ((is_tenant_member(tenant_id) AND (my_role_for(tenant_id) = ANY (ARRAY['owner'::text, 'admin'::text, 'sales'::text]))) OR is_superadmin()) WITH CHECK ((is_tenant_member(tenant_id) AND (my_role_for(tenant_id) = ANY (ARRAY['owner'::text, 'admin'::text, 'sales'::text]))) OR is_superadmin());

DROP POLICY IF EXISTS "mp_delete" ON "public"."market_prices";
CREATE POLICY "mp_delete" ON "public"."market_prices" AS PERMISSIVE FOR DELETE TO authenticated USING ((submitted_by = auth.uid()) OR is_superadmin());

DROP POLICY IF EXISTS "mp_insert" ON "public"."market_prices";
CREATE POLICY "mp_insert" ON "public"."market_prices" AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (is_superadmin() OR (source = ANY (ARRAY['transaction'::text, 'auto_scraper'::text, 'arboge_scraper'::text, 'arboge_realisasi'::text, 'arboge_referensi'::text])));

DROP POLICY IF EXISTS "mp_insert_scraper" ON "public"."market_prices";
CREATE POLICY "mp_insert_scraper" ON "public"."market_prices" AS PERMISSIVE FOR INSERT TO anon WITH CHECK (source = ANY (ARRAY['auto_scraper'::text, 'arboge_scraper'::text, 'arboge_realisasi'::text, 'arboge_referensi'::text]));

DROP POLICY IF EXISTS "mp_select_public" ON "public"."market_prices";
CREATE POLICY "mp_select_public" ON "public"."market_prices" AS PERMISSIVE FOR SELECT TO anon,authenticated USING true;

DROP POLICY IF EXISTS "mp_update" ON "public"."market_prices";
CREATE POLICY "mp_update" ON "public"."market_prices" AS PERMISSIVE FOR UPDATE TO authenticated USING ((submitted_by = auth.uid()) OR is_superadmin()) WITH CHECK (((submitted_by = auth.uid()) AND (needs_review IS NOT FALSE)) OR is_superadmin());

DROP POLICY IF EXISTS "notifications_delete" ON "public"."notifications";
CREATE POLICY "notifications_delete" ON "public"."notifications" AS PERMISSIVE FOR DELETE TO authenticated USING (is_my_tenant(tenant_id) OR is_superadmin());

DROP POLICY IF EXISTS "notifications_insert" ON "public"."notifications";
CREATE POLICY "notifications_insert" ON "public"."notifications" AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((is_my_tenant(tenant_id) AND can_write_notifications()) OR is_superadmin());

DROP POLICY IF EXISTS "notifications_select" ON "public"."notifications";
CREATE POLICY "notifications_select" ON "public"."notifications" AS PERMISSIVE FOR SELECT TO authenticated USING (is_my_tenant(tenant_id) OR is_superadmin());

DROP POLICY IF EXISTS "notifications_update" ON "public"."notifications";
CREATE POLICY "notifications_update" ON "public"."notifications" AS PERMISSIVE FOR UPDATE TO authenticated USING (is_my_tenant(tenant_id) OR is_superadmin()) WITH CHECK ((is_my_tenant(tenant_id) AND can_write_notifications()) OR is_superadmin());

DROP POLICY IF EXISTS "orders_all" ON "public"."orders";
CREATE POLICY "orders_all" ON "public"."orders" AS PERMISSIVE FOR ALL TO authenticated USING (is_tenant_member(tenant_id) OR is_superadmin()) WITH CHECK is_tenant_member(tenant_id);

DROP POLICY IF EXISTS "Public Read Payment Settings" ON "public"."payment_settings";
CREATE POLICY "Public Read Payment Settings" ON "public"."payment_settings" AS PERMISSIVE FOR SELECT TO public USING true;

DROP POLICY IF EXISTS "superadmin_manage_payment_settings" ON "public"."payment_settings";
CREATE POLICY "superadmin_manage_payment_settings" ON "public"."payment_settings" AS PERMISSIVE FOR ALL TO authenticated USING is_superadmin() WITH CHECK is_superadmin();

DROP POLICY IF EXISTS "payments_delete" ON "public"."payments";
CREATE POLICY "payments_delete" ON "public"."payments" AS PERMISSIVE FOR DELETE TO authenticated USING is_superadmin();

DROP POLICY IF EXISTS "payments_insert" ON "public"."payments";
CREATE POLICY "payments_insert" ON "public"."payments" AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (can_manage_payments(tenant_id) OR is_superadmin());

DROP POLICY IF EXISTS "payments_select" ON "public"."payments";
CREATE POLICY "payments_select" ON "public"."payments" AS PERMISSIVE FOR SELECT
   FROM profiles p
  WHERE ((p.auth_user_id = auth.uid()) AND (p.tenant_id = payments.tenant_id)))) OR is_superadmin())                                                                                                                                                                                                                                                                                                               | null                                                                                                                                                                                                                                                                                                                                 | TO authenticated;

DROP POLICY IF EXISTS "payments_update" ON "public"."payments";
CREATE POLICY "payments_update" ON "public"."payments" AS PERMISSIVE FOR UPDATE TO authenticated USING (can_update_payments(tenant_id) OR is_superadmin()) WITH CHECK (can_update_payments(tenant_id) OR is_superadmin());

DROP POLICY IF EXISTS "peternak_farms_all" ON "public"."peternak_farms";
CREATE POLICY "peternak_farms_all" ON "public"."peternak_farms" AS PERMISSIVE FOR ALL TO authenticated USING (is_tenant_member(tenant_id) OR is_superadmin()) WITH CHECK ((is_tenant_member(tenant_id) AND (my_role_for(tenant_id) = ANY (ARRAY['owner'::text, 'manajer'::text, 'staff'::text]))) OR is_superadmin());

DROP POLICY IF EXISTS "peternak_profiles_delete" ON "public"."peternak_profiles";
CREATE POLICY "peternak_profiles_delete" ON "public"."peternak_profiles" AS PERMISSIVE FOR DELETE TO authenticated USING ((is_tenant_member(tenant_id) AND (my_role_for(tenant_id) = 'owner'::text)) OR is_superadmin());

DROP POLICY IF EXISTS "peternak_profiles_insert" ON "public"."peternak_profiles";
CREATE POLICY "peternak_profiles_insert" ON "public"."peternak_profiles" AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((is_tenant_member(tenant_id) AND (my_role_for(tenant_id) = ANY (ARRAY['owner'::text, 'manajer'::text]))) OR is_superadmin());

DROP POLICY IF EXISTS "peternak_profiles_select" ON "public"."peternak_profiles";
CREATE POLICY "peternak_profiles_select" ON "public"."peternak_profiles" AS PERMISSIVE FOR SELECT TO authenticated USING (is_tenant_member(tenant_id) OR is_superadmin());

DROP POLICY IF EXISTS "peternak_profiles_superadmin_all" ON "public"."peternak_profiles";
CREATE POLICY "peternak_profiles_superadmin_all" ON "public"."peternak_profiles" AS PERMISSIVE FOR ALL TO authenticated USING is_superadmin() WITH CHECK is_superadmin();

DROP POLICY IF EXISTS "peternak_profiles_update" ON "public"."peternak_profiles";
CREATE POLICY "peternak_profiles_update" ON "public"."peternak_profiles" AS PERMISSIVE FOR UPDATE TO authenticated USING ((is_tenant_member(tenant_id) AND (my_role_for(tenant_id) = ANY (ARRAY['owner'::text, 'manajer'::text]))) OR is_superadmin()) WITH CHECK ((is_tenant_member(tenant_id) AND (my_role_for(tenant_id) = ANY (ARRAY['owner'::text, 'manajer'::text]))) OR is_superadmin());

DROP POLICY IF EXISTS "peternak_task_instances_delete" ON "public"."peternak_task_instances";
CREATE POLICY "peternak_task_instances_delete" ON "public"."peternak_task_instances" AS PERMISSIVE FOR DELETE TO authenticated USING ((is_tenant_member(tenant_id) AND (my_role_for(tenant_id) = ANY (ARRAY['owner'::text, 'manajer'::text]))) OR is_superadmin());

DROP POLICY IF EXISTS "peternak_task_instances_insert" ON "public"."peternak_task_instances";
CREATE POLICY "peternak_task_instances_insert" ON "public"."peternak_task_instances" AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((is_tenant_member(tenant_id) AND (my_role_for(tenant_id) = ANY (ARRAY['owner'::text, 'manajer'::text]))) OR is_superadmin());

DROP POLICY IF EXISTS "peternak_task_instances_select" ON "public"."peternak_task_instances";
CREATE POLICY "peternak_task_instances_select" ON "public"."peternak_task_instances" AS PERMISSIVE FOR SELECT TO authenticated USING (is_tenant_member(tenant_id) OR is_superadmin());

DROP POLICY IF EXISTS "peternak_task_instances_update" ON "public"."peternak_task_instances";
CREATE POLICY "peternak_task_instances_update" ON "public"."peternak_task_instances" AS PERMISSIVE FOR UPDATE TO authenticated USING ((is_tenant_member(tenant_id) AND ((assigned_profile_id = my_profile_id()) OR (my_role_for(tenant_id) = ANY (ARRAY['owner'::text, 'manajer'::text])))) OR is_superadmin()) WITH CHECK ((is_tenant_member(tenant_id) AND ((assigned_profile_id = my_profile_id()) OR (my_role_for(tenant_id) = ANY (ARRAY['owner'::text, 'manajer'::text])))) OR is_superadmin());

DROP POLICY IF EXISTS "peternak_task_templates_all" ON "public"."peternak_task_templates";
CREATE POLICY "peternak_task_templates_all" ON "public"."peternak_task_templates" AS PERMISSIVE FOR ALL TO authenticated USING (is_tenant_member(tenant_id) OR is_superadmin()) WITH CHECK ((is_tenant_member(tenant_id) AND (my_role_for(tenant_id) = ANY (ARRAY['owner'::text, 'manajer'::text]))) OR is_superadmin());

DROP POLICY IF EXISTS "Admin Write Plan Configs" ON "public"."plan_configs";
CREATE POLICY "Admin Write Plan Configs" ON "public"."plan_configs" AS PERMISSIVE FOR ALL TO authenticated USING is_superadmin() WITH CHECK is_superadmin();

DROP POLICY IF EXISTS "Public Read Plan Configs" ON "public"."plan_configs";
CREATE POLICY "Public Read Plan Configs" ON "public"."plan_configs" AS PERMISSIVE FOR SELECT TO public USING true;

DROP POLICY IF EXISTS "Admin Write Pricing Plans" ON "public"."pricing_plans";
CREATE POLICY "Admin Write Pricing Plans" ON "public"."pricing_plans" AS PERMISSIVE FOR ALL TO authenticated USING is_superadmin() WITH CHECK is_superadmin();

DROP POLICY IF EXISTS "Public Read Pricing Plans" ON "public"."pricing_plans";
CREATE POLICY "Public Read Pricing Plans" ON "public"."pricing_plans" AS PERMISSIVE FOR SELECT TO public USING true;

DROP POLICY IF EXISTS "profiles_insert_self" ON "public"."profiles";
CREATE POLICY "profiles_insert_self" ON "public"."profiles" AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (auth_user_id = auth.uid());

DROP POLICY IF EXISTS "profiles_owner_manage_team" ON "public"."profiles";
CREATE POLICY "profiles_owner_manage_team" ON "public"."profiles" AS PERMISSIVE FOR UPDATE
   FROM profiles me
  WHERE ((me.auth_user_id = auth.uid()) AND (me.tenant_id = profiles.tenant_id) AND (me.role = ANY (ARRAY['owner'::text, 'admin'::text, 'manajer'::text, 'manager'::text])))))                                                                                                                                                                                                                                     | ((tenant_id = ANY (auth_user_tenant_ids())) AND (role <> 'superadmin'::text))                                                                                                                                                                                                                                                        | TO authenticated;

DROP POLICY IF EXISTS "profiles_select_same_tenant" ON "public"."profiles";
CREATE POLICY "profiles_select_same_tenant" ON "public"."profiles" AS PERMISSIVE FOR SELECT TO authenticated USING (tenant_id = ANY (auth_user_tenant_ids()));

DROP POLICY IF EXISTS "profiles_superadmin_all" ON "public"."profiles";
CREATE POLICY "profiles_superadmin_all" ON "public"."profiles" AS PERMISSIVE FOR ALL TO authenticated USING is_superadmin() WITH CHECK is_superadmin();

DROP POLICY IF EXISTS "profiles_update_self" ON "public"."profiles";
CREATE POLICY "profiles_update_self" ON "public"."profiles" AS PERMISSIVE FOR UPDATE TO authenticated USING (auth_user_id = auth.uid()) WITH CHECK (auth_user_id = auth.uid());

DROP POLICY IF EXISTS "purchases_delete" ON "public"."purchases";
CREATE POLICY "purchases_delete" ON "public"."purchases" AS PERMISSIVE FOR DELETE TO authenticated USING is_superadmin();

DROP POLICY IF EXISTS "purchases_insert" ON "public"."purchases";
CREATE POLICY "purchases_insert" ON "public"."purchases" AS PERMISSIVE FOR INSERT TO authenticated USING null
   FROM profiles p
  WHERE ((p.auth_user_id = auth.uid()) AND (p.tenant_id = purchases.tenant_id)))) AND can_manage_purchases(tenant_id)) OR is_superadmin())                                                                                                                                                   |;

DROP POLICY IF EXISTS "purchases_select" ON "public"."purchases";
CREATE POLICY "purchases_select" ON "public"."purchases" AS PERMISSIVE FOR SELECT
   FROM profiles p
  WHERE ((p.auth_user_id = auth.uid()) AND (p.tenant_id = purchases.tenant_id)))) OR is_superadmin())                                                                                                                                                                                                                                                                                                              | null                                                                                                                                                                                                                                                                                                                                 | TO authenticated;

DROP POLICY IF EXISTS "purchases_update" ON "public"."purchases";
CREATE POLICY "purchases_update" ON "public"."purchases" AS PERMISSIVE FOR UPDATE
   FROM profiles p
  WHERE ((p.auth_user_id = auth.uid()) AND (p.tenant_id = purchases.tenant_id)))) AND can_update_purchases(tenant_id)) OR is_superadmin())                                                                                                                                                                                                                                                                        | (((EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.auth_user_id = auth.uid()) AND (p.tenant_id = purchases.tenant_id)))) AND can_update_purchases(tenant_id)) OR is_superadmin())                                                                                                                                                   | TO authenticated;

DROP POLICY IF EXISTS "rpa_clients_tenant_isolation" ON "public"."rpa_clients";
CREATE POLICY "rpa_clients_tenant_isolation" ON "public"."rpa_clients" AS PERMISSIVE FOR ALL TO authenticated USING (is_tenant_member(tenant_id) OR is_superadmin()) WITH CHECK ((is_tenant_member(tenant_id) AND (my_role_for(tenant_id) = ANY (ARRAY['owner'::text, 'admin_rpa'::text, 'operator'::text]))) OR is_superadmin());

DROP POLICY IF EXISTS "rpa_customer_payments_delete" ON "public"."rpa_customer_payments";
CREATE POLICY "rpa_customer_payments_delete" ON "public"."rpa_customer_payments" AS PERMISSIVE FOR DELETE TO authenticated USING is_superadmin();

DROP POLICY IF EXISTS "rpa_customer_payments_insert" ON "public"."rpa_customer_payments";
CREATE POLICY "rpa_customer_payments_insert" ON "public"."rpa_customer_payments" AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((is_tenant_member(tenant_id) AND can_manage_rpa(tenant_id)) OR is_superadmin());

DROP POLICY IF EXISTS "rpa_customer_payments_select" ON "public"."rpa_customer_payments";
CREATE POLICY "rpa_customer_payments_select" ON "public"."rpa_customer_payments" AS PERMISSIVE FOR SELECT TO authenticated USING ((is_tenant_member(tenant_id) AND (my_role_for(tenant_id) = ANY (ARRAY['owner'::text, 'admin_rpa'::text]))) OR is_superadmin());

DROP POLICY IF EXISTS "rpa_customer_payments_superadmin_all" ON "public"."rpa_customer_payments";
CREATE POLICY "rpa_customer_payments_superadmin_all" ON "public"."rpa_customer_payments" AS PERMISSIVE FOR ALL TO authenticated USING is_superadmin() WITH CHECK is_superadmin();

DROP POLICY IF EXISTS "rpa_customer_payments_update" ON "public"."rpa_customer_payments";
CREATE POLICY "rpa_customer_payments_update" ON "public"."rpa_customer_payments" AS PERMISSIVE FOR UPDATE TO authenticated USING ((is_tenant_member(tenant_id) AND can_manage_rpa(tenant_id)) OR is_superadmin()) WITH CHECK ((is_tenant_member(tenant_id) AND can_manage_rpa(tenant_id)) OR is_superadmin());

DROP POLICY IF EXISTS "rpa_customers_all" ON "public"."rpa_customers";
CREATE POLICY "rpa_customers_all" ON "public"."rpa_customers" AS PERMISSIVE FOR ALL TO authenticated USING (is_tenant_member(tenant_id) OR is_superadmin()) WITH CHECK ((is_tenant_member(tenant_id) AND can_manage_rpa(tenant_id)) OR is_superadmin());

DROP POLICY IF EXISTS "rpa_customers_superadmin_all" ON "public"."rpa_customers";
CREATE POLICY "rpa_customers_superadmin_all" ON "public"."rpa_customers" AS PERMISSIVE FOR ALL TO authenticated USING is_superadmin() WITH CHECK is_superadmin();

DROP POLICY IF EXISTS "rpa_invoice_items_delete" ON "public"."rpa_invoice_items";
CREATE POLICY "rpa_invoice_items_delete" ON "public"."rpa_invoice_items" AS PERMISSIVE FOR DELETE
   FROM rpa_invoices i
  WHERE ((i.id = rpa_invoice_items.invoice_id) AND ((is_tenant_member(i.tenant_id) AND (my_role_for(i.tenant_id) = ANY (ARRAY['owner'::text, 'admin_rpa'::text]))) OR is_superadmin()))))                                                                                                                                                                                                                       | null                                                                                                                                                                                                                                                                                                                                 | TO authenticated;

DROP POLICY IF EXISTS "rpa_invoice_items_insert" ON "public"."rpa_invoice_items";
CREATE POLICY "rpa_invoice_items_insert" ON "public"."rpa_invoice_items" AS PERMISSIVE FOR INSERT TO authenticated USING null
   FROM rpa_invoices i
  WHERE ((i.id = rpa_invoice_items.invoice_id) AND ((is_tenant_member(i.tenant_id) AND can_manage_rpa(i.tenant_id)) OR is_superadmin()))))                                                                                                                                                 |;

DROP POLICY IF EXISTS "rpa_invoice_items_select" ON "public"."rpa_invoice_items";
CREATE POLICY "rpa_invoice_items_select" ON "public"."rpa_invoice_items" AS PERMISSIVE FOR SELECT
   FROM rpa_invoices i
  WHERE ((i.id = rpa_invoice_items.invoice_id) AND ((is_tenant_member(i.tenant_id) AND (my_role_for(i.tenant_id) = ANY (ARRAY['owner'::text, 'admin_rpa'::text]))) OR is_superadmin()))))                                                                                                                                                                                                                       | null                                                                                                                                                                                                                                                                                                                                 | TO authenticated;

DROP POLICY IF EXISTS "rpa_invoice_items_update" ON "public"."rpa_invoice_items";
CREATE POLICY "rpa_invoice_items_update" ON "public"."rpa_invoice_items" AS PERMISSIVE FOR UPDATE
   FROM rpa_invoices i
  WHERE ((i.id = rpa_invoice_items.invoice_id) AND ((is_tenant_member(i.tenant_id) AND can_manage_rpa(i.tenant_id)) OR is_superadmin()))))                                                                                                                                                                                                                                                                      | (EXISTS ( SELECT 1
   FROM rpa_invoices i
  WHERE ((i.id = rpa_invoice_items.invoice_id) AND ((is_tenant_member(i.tenant_id) AND can_manage_rpa(i.tenant_id)) OR is_superadmin()))))                                                                                                                                                 | TO authenticated;

DROP POLICY IF EXISTS "rpa_invoices_delete" ON "public"."rpa_invoices";
CREATE POLICY "rpa_invoices_delete" ON "public"."rpa_invoices" AS PERMISSIVE FOR DELETE TO authenticated USING is_superadmin();

DROP POLICY IF EXISTS "rpa_invoices_insert" ON "public"."rpa_invoices";
CREATE POLICY "rpa_invoices_insert" ON "public"."rpa_invoices" AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((is_tenant_member(tenant_id) AND can_manage_rpa(tenant_id)) OR is_superadmin());

DROP POLICY IF EXISTS "rpa_invoices_select" ON "public"."rpa_invoices";
CREATE POLICY "rpa_invoices_select" ON "public"."rpa_invoices" AS PERMISSIVE FOR SELECT TO authenticated USING ((is_tenant_member(tenant_id) AND (my_role_for(tenant_id) = ANY (ARRAY['owner'::text, 'admin_rpa'::text]))) OR is_superadmin());

DROP POLICY IF EXISTS "rpa_invoices_superadmin_all" ON "public"."rpa_invoices";
CREATE POLICY "rpa_invoices_superadmin_all" ON "public"."rpa_invoices" AS PERMISSIVE FOR ALL TO authenticated USING is_superadmin() WITH CHECK is_superadmin();

DROP POLICY IF EXISTS "rpa_invoices_update" ON "public"."rpa_invoices";
CREATE POLICY "rpa_invoices_update" ON "public"."rpa_invoices" AS PERMISSIVE FOR UPDATE TO authenticated USING ((is_tenant_member(tenant_id) AND can_manage_rpa(tenant_id)) OR is_superadmin()) WITH CHECK ((is_tenant_member(tenant_id) AND can_manage_rpa(tenant_id)) OR is_superadmin());

DROP POLICY IF EXISTS "rpa_payments_delete" ON "public"."rpa_payments";
CREATE POLICY "rpa_payments_delete" ON "public"."rpa_payments" AS PERMISSIVE FOR DELETE TO authenticated USING is_superadmin();

DROP POLICY IF EXISTS "rpa_payments_insert" ON "public"."rpa_payments";
CREATE POLICY "rpa_payments_insert" ON "public"."rpa_payments" AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (is_tenant_member(rpa_tenant_id) OR is_tenant_member(broker_tenant_id) OR is_superadmin());

DROP POLICY IF EXISTS "rpa_payments_select" ON "public"."rpa_payments";
CREATE POLICY "rpa_payments_select" ON "public"."rpa_payments" AS PERMISSIVE FOR SELECT TO authenticated USING ((is_tenant_member(rpa_tenant_id) AND (my_role_for(rpa_tenant_id) = ANY (ARRAY['owner'::text, 'admin_rpa'::text]))) OR (is_tenant_member(broker_tenant_id) AND (my_role_for(broker_tenant_id) = ANY (ARRAY['owner'::text, 'manajer'::text, 'admin'::text]))) OR is_superadmin());

DROP POLICY IF EXISTS "rpa_payments_superadmin_all" ON "public"."rpa_payments";
CREATE POLICY "rpa_payments_superadmin_all" ON "public"."rpa_payments" AS PERMISSIVE FOR ALL TO authenticated USING is_superadmin() WITH CHECK is_superadmin();

DROP POLICY IF EXISTS "rpa_payments_update" ON "public"."rpa_payments";
CREATE POLICY "rpa_payments_update" ON "public"."rpa_payments" AS PERMISSIVE FOR UPDATE TO authenticated USING (is_tenant_member(rpa_tenant_id) OR is_tenant_member(broker_tenant_id) OR is_superadmin()) WITH CHECK (is_tenant_member(rpa_tenant_id) OR is_tenant_member(broker_tenant_id) OR is_superadmin());

DROP POLICY IF EXISTS "rpa_products_all" ON "public"."rpa_products";
CREATE POLICY "rpa_products_all" ON "public"."rpa_products" AS PERMISSIVE FOR ALL TO authenticated USING (is_tenant_member(tenant_id) OR is_superadmin()) WITH CHECK ((is_tenant_member(tenant_id) AND can_manage_rpa(tenant_id)) OR is_superadmin());

DROP POLICY IF EXISTS "rpa_products_superadmin_all" ON "public"."rpa_products";
CREATE POLICY "rpa_products_superadmin_all" ON "public"."rpa_products" AS PERMISSIVE FOR ALL TO authenticated USING is_superadmin() WITH CHECK is_superadmin();

DROP POLICY IF EXISTS "rpa_profiles_delete" ON "public"."rpa_profiles";
CREATE POLICY "rpa_profiles_delete" ON "public"."rpa_profiles" AS PERMISSIVE FOR DELETE TO authenticated USING ((is_tenant_member(tenant_id) AND (my_role_for(tenant_id) = 'owner'::text)) OR is_superadmin());

DROP POLICY IF EXISTS "rpa_profiles_insert" ON "public"."rpa_profiles";
CREATE POLICY "rpa_profiles_insert" ON "public"."rpa_profiles" AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((is_tenant_member(tenant_id) AND (my_role_for(tenant_id) = ANY (ARRAY['owner'::text, 'admin_rpa'::text]))) OR is_superadmin());

DROP POLICY IF EXISTS "rpa_profiles_select" ON "public"."rpa_profiles";
CREATE POLICY "rpa_profiles_select" ON "public"."rpa_profiles" AS PERMISSIVE FOR SELECT TO authenticated USING (is_tenant_member(tenant_id) OR is_superadmin());

DROP POLICY IF EXISTS "rpa_profiles_update" ON "public"."rpa_profiles";
CREATE POLICY "rpa_profiles_update" ON "public"."rpa_profiles" AS PERMISSIVE FOR UPDATE TO authenticated USING ((is_tenant_member(tenant_id) AND (my_role_for(tenant_id) = ANY (ARRAY['owner'::text, 'admin_rpa'::text]))) OR is_superadmin()) WITH CHECK ((is_tenant_member(tenant_id) AND (my_role_for(tenant_id) = ANY (ARRAY['owner'::text, 'admin_rpa'::text]))) OR is_superadmin());

DROP POLICY IF EXISTS "rpa_purchase_orders_delete" ON "public"."rpa_purchase_orders";
CREATE POLICY "rpa_purchase_orders_delete" ON "public"."rpa_purchase_orders" AS PERMISSIVE FOR DELETE TO authenticated USING is_superadmin();

DROP POLICY IF EXISTS "rpa_purchase_orders_insert" ON "public"."rpa_purchase_orders";
CREATE POLICY "rpa_purchase_orders_insert" ON "public"."rpa_purchase_orders" AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (is_tenant_member(rpa_tenant_id) OR is_tenant_member(broker_tenant_id) OR is_superadmin());

DROP POLICY IF EXISTS "rpa_purchase_orders_select" ON "public"."rpa_purchase_orders";
CREATE POLICY "rpa_purchase_orders_select" ON "public"."rpa_purchase_orders" AS PERMISSIVE FOR SELECT TO authenticated USING ((is_tenant_member(rpa_tenant_id) AND (my_role_for(rpa_tenant_id) = ANY (ARRAY['owner'::text, 'admin_rpa'::text]))) OR (is_tenant_member(broker_tenant_id) AND (my_role_for(broker_tenant_id) = ANY (ARRAY['owner'::text, 'manajer'::text, 'admin'::text]))) OR is_superadmin());

DROP POLICY IF EXISTS "rpa_purchase_orders_superadmin_all" ON "public"."rpa_purchase_orders";
CREATE POLICY "rpa_purchase_orders_superadmin_all" ON "public"."rpa_purchase_orders" AS PERMISSIVE FOR ALL TO authenticated USING is_superadmin() WITH CHECK is_superadmin();

DROP POLICY IF EXISTS "rpa_purchase_orders_update" ON "public"."rpa_purchase_orders";
CREATE POLICY "rpa_purchase_orders_update" ON "public"."rpa_purchase_orders" AS PERMISSIVE FOR UPDATE TO authenticated USING (is_tenant_member(rpa_tenant_id) OR is_tenant_member(broker_tenant_id) OR is_superadmin()) WITH CHECK (is_tenant_member(rpa_tenant_id) OR is_tenant_member(broker_tenant_id) OR is_superadmin());

DROP POLICY IF EXISTS "sales_delete" ON "public"."sales";
CREATE POLICY "sales_delete" ON "public"."sales" AS PERMISSIVE FOR DELETE TO authenticated USING is_superadmin();

DROP POLICY IF EXISTS "sales_insert" ON "public"."sales";
CREATE POLICY "sales_insert" ON "public"."sales" AS PERMISSIVE FOR INSERT TO authenticated USING null
   FROM profiles p
  WHERE ((p.auth_user_id = auth.uid()) AND (p.tenant_id = sales.tenant_id)))) AND can_manage_sales(tenant_id)) OR is_superadmin())                                                                                                                                                           |;

DROP POLICY IF EXISTS "sales_select" ON "public"."sales";
CREATE POLICY "sales_select" ON "public"."sales" AS PERMISSIVE FOR SELECT
   FROM profiles p
  WHERE ((p.auth_user_id = auth.uid()) AND (p.tenant_id = sales.tenant_id)))) OR is_superadmin())                                                                                                                                                                                                                                                                                                                  | null                                                                                                                                                                                                                                                                                                                                 | TO authenticated;

DROP POLICY IF EXISTS "sales_update" ON "public"."sales";
CREATE POLICY "sales_update" ON "public"."sales" AS PERMISSIVE FOR UPDATE
   FROM profiles p
  WHERE ((p.auth_user_id = auth.uid()) AND (p.tenant_id = sales.tenant_id)))) AND can_update_sales(tenant_id)) OR is_superadmin())                                                                                                                                                                                                                                                                                | (((EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.auth_user_id = auth.uid()) AND (p.tenant_id = sales.tenant_id)))) AND can_update_sales(tenant_id)) OR is_superadmin())                                                                                                                                                           | TO authenticated;

DROP POLICY IF EXISTS "tenant_sapi_breeding_animals_delete" ON "public"."sapi_breeding_animals";
CREATE POLICY "tenant_sapi_breeding_animals_delete" ON "public"."sapi_breeding_animals" AS PERMISSIVE FOR DELETE
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid())))                                                                                                                                                                                                                                                                                                                                                 | null                                                                                                                                                                                                                                                                                                                                 | TO authenticated;

DROP POLICY IF EXISTS "tenant_sapi_breeding_animals_insert" ON "public"."sapi_breeding_animals";
CREATE POLICY "tenant_sapi_breeding_animals_insert" ON "public"."sapi_breeding_animals" AS PERMISSIVE FOR INSERT TO authenticated USING null
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid())))                                                                                                                                                                                                                            |;

DROP POLICY IF EXISTS "tenant_sapi_breeding_animals_select" ON "public"."sapi_breeding_animals";
CREATE POLICY "tenant_sapi_breeding_animals_select" ON "public"."sapi_breeding_animals" AS PERMISSIVE FOR SELECT
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid())))                                                                                                                                                                                                                                                                                                                                                 | null                                                                                                                                                                                                                                                                                                                                 | TO authenticated;

DROP POLICY IF EXISTS "tenant_sapi_breeding_animals_update" ON "public"."sapi_breeding_animals";
CREATE POLICY "tenant_sapi_breeding_animals_update" ON "public"."sapi_breeding_animals" AS PERMISSIVE FOR UPDATE
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid())))                                                                                                                                                                                                                                                                                                                                                 | (tenant_id IN ( SELECT profiles.tenant_id
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid())))                                                                                                                                                                                                                            | TO authenticated;

DROP POLICY IF EXISTS "tenant_sapi_breeding_births_delete" ON "public"."sapi_breeding_births";
CREATE POLICY "tenant_sapi_breeding_births_delete" ON "public"."sapi_breeding_births" AS PERMISSIVE FOR DELETE
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid())))                                                                                                                                                                                                                                                                                                                                                 | null                                                                                                                                                                                                                                                                                                                                 | TO authenticated;

DROP POLICY IF EXISTS "tenant_sapi_breeding_births_insert" ON "public"."sapi_breeding_births";
CREATE POLICY "tenant_sapi_breeding_births_insert" ON "public"."sapi_breeding_births" AS PERMISSIVE FOR INSERT TO authenticated USING null
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid())))                                                                                                                                                                                                                            |;

DROP POLICY IF EXISTS "tenant_sapi_breeding_births_select" ON "public"."sapi_breeding_births";
CREATE POLICY "tenant_sapi_breeding_births_select" ON "public"."sapi_breeding_births" AS PERMISSIVE FOR SELECT
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid())))                                                                                                                                                                                                                                                                                                                                                 | null                                                                                                                                                                                                                                                                                                                                 | TO authenticated;

DROP POLICY IF EXISTS "tenant_sapi_breeding_births_update" ON "public"."sapi_breeding_births";
CREATE POLICY "tenant_sapi_breeding_births_update" ON "public"."sapi_breeding_births" AS PERMISSIVE FOR UPDATE
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid())))                                                                                                                                                                                                                                                                                                                                                 | (tenant_id IN ( SELECT profiles.tenant_id
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid())))                                                                                                                                                                                                                            | TO authenticated;

DROP POLICY IF EXISTS "tenant_sapi_breeding_feed_logs_delete" ON "public"."sapi_breeding_feed_logs";
CREATE POLICY "tenant_sapi_breeding_feed_logs_delete" ON "public"."sapi_breeding_feed_logs" AS PERMISSIVE FOR DELETE
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid())))                                                                                                                                                                                                                                                                                                                                                 | null                                                                                                                                                                                                                                                                                                                                 | TO authenticated;

DROP POLICY IF EXISTS "tenant_sapi_breeding_feed_logs_insert" ON "public"."sapi_breeding_feed_logs";
CREATE POLICY "tenant_sapi_breeding_feed_logs_insert" ON "public"."sapi_breeding_feed_logs" AS PERMISSIVE FOR INSERT TO authenticated USING null
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid())))                                                                                                                                                                                                                            |;

DROP POLICY IF EXISTS "tenant_sapi_breeding_feed_logs_select" ON "public"."sapi_breeding_feed_logs";
CREATE POLICY "tenant_sapi_breeding_feed_logs_select" ON "public"."sapi_breeding_feed_logs" AS PERMISSIVE FOR SELECT
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid())))                                                                                                                                                                                                                                                                                                                                                 | null                                                                                                                                                                                                                                                                                                                                 | TO authenticated;

DROP POLICY IF EXISTS "tenant_sapi_breeding_feed_logs_update" ON "public"."sapi_breeding_feed_logs";
CREATE POLICY "tenant_sapi_breeding_feed_logs_update" ON "public"."sapi_breeding_feed_logs" AS PERMISSIVE FOR UPDATE
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid())))                                                                                                                                                                                                                                                                                                                                                 | (tenant_id IN ( SELECT profiles.tenant_id
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid())))                                                                                                                                                                                                                            | TO authenticated;

DROP POLICY IF EXISTS "tenant_sapi_breeding_health_logs_delete" ON "public"."sapi_breeding_health_logs";
CREATE POLICY "tenant_sapi_breeding_health_logs_delete" ON "public"."sapi_breeding_health_logs" AS PERMISSIVE FOR DELETE
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid())))                                                                                                                                                                                                                                                                                                                                                 | null                                                                                                                                                                                                                                                                                                                                 | TO authenticated;

DROP POLICY IF EXISTS "tenant_sapi_breeding_health_logs_insert" ON "public"."sapi_breeding_health_logs";
CREATE POLICY "tenant_sapi_breeding_health_logs_insert" ON "public"."sapi_breeding_health_logs" AS PERMISSIVE FOR INSERT TO authenticated USING null
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid())))                                                                                                                                                                                                                            |;

DROP POLICY IF EXISTS "tenant_sapi_breeding_health_logs_select" ON "public"."sapi_breeding_health_logs";
CREATE POLICY "tenant_sapi_breeding_health_logs_select" ON "public"."sapi_breeding_health_logs" AS PERMISSIVE FOR SELECT
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid())))                                                                                                                                                                                                                                                                                                                                                 | null                                                                                                                                                                                                                                                                                                                                 | TO authenticated;

DROP POLICY IF EXISTS "tenant_sapi_breeding_health_logs_update" ON "public"."sapi_breeding_health_logs";
CREATE POLICY "tenant_sapi_breeding_health_logs_update" ON "public"."sapi_breeding_health_logs" AS PERMISSIVE FOR UPDATE
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid())))                                                                                                                                                                                                                                                                                                                                                 | (tenant_id IN ( SELECT profiles.tenant_id
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid())))                                                                                                                                                                                                                            | TO authenticated;

DROP POLICY IF EXISTS "tenant_sapi_breeding_mating_records_delete" ON "public"."sapi_breeding_mating_records";
CREATE POLICY "tenant_sapi_breeding_mating_records_delete" ON "public"."sapi_breeding_mating_records" AS PERMISSIVE FOR DELETE
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid())))                                                                                                                                                                                                                                                                                                                                                 | null                                                                                                                                                                                                                                                                                                                                 | TO authenticated;

DROP POLICY IF EXISTS "tenant_sapi_breeding_mating_records_insert" ON "public"."sapi_breeding_mating_records";
CREATE POLICY "tenant_sapi_breeding_mating_records_insert" ON "public"."sapi_breeding_mating_records" AS PERMISSIVE FOR INSERT TO authenticated USING null
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid())))                                                                                                                                                                                                                            |;

DROP POLICY IF EXISTS "tenant_sapi_breeding_mating_records_select" ON "public"."sapi_breeding_mating_records";
CREATE POLICY "tenant_sapi_breeding_mating_records_select" ON "public"."sapi_breeding_mating_records" AS PERMISSIVE FOR SELECT
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid())))                                                                                                                                                                                                                                                                                                                                                 | null                                                                                                                                                                                                                                                                                                                                 | TO authenticated;

DROP POLICY IF EXISTS "tenant_sapi_breeding_mating_records_update" ON "public"."sapi_breeding_mating_records";
CREATE POLICY "tenant_sapi_breeding_mating_records_update" ON "public"."sapi_breeding_mating_records" AS PERMISSIVE FOR UPDATE
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid())))                                                                                                                                                                                                                                                                                                                                                 | (tenant_id IN ( SELECT profiles.tenant_id
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid())))                                                                                                                                                                                                                            | TO authenticated;

DROP POLICY IF EXISTS "tenant_sapi_breeding_sales_delete" ON "public"."sapi_breeding_sales";
CREATE POLICY "tenant_sapi_breeding_sales_delete" ON "public"."sapi_breeding_sales" AS PERMISSIVE FOR DELETE
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid())))                                                                                                                                                                                                                                                                                                                                                 | null                                                                                                                                                                                                                                                                                                                                 | TO authenticated;

DROP POLICY IF EXISTS "tenant_sapi_breeding_sales_insert" ON "public"."sapi_breeding_sales";
CREATE POLICY "tenant_sapi_breeding_sales_insert" ON "public"."sapi_breeding_sales" AS PERMISSIVE FOR INSERT TO authenticated USING null
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid())))                                                                                                                                                                                                                            |;

DROP POLICY IF EXISTS "tenant_sapi_breeding_sales_select" ON "public"."sapi_breeding_sales";
CREATE POLICY "tenant_sapi_breeding_sales_select" ON "public"."sapi_breeding_sales" AS PERMISSIVE FOR SELECT
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid())))                                                                                                                                                                                                                                                                                                                                                 | null                                                                                                                                                                                                                                                                                                                                 | TO authenticated;

DROP POLICY IF EXISTS "tenant_sapi_breeding_sales_update" ON "public"."sapi_breeding_sales";
CREATE POLICY "tenant_sapi_breeding_sales_update" ON "public"."sapi_breeding_sales" AS PERMISSIVE FOR UPDATE
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid())))                                                                                                                                                                                                                                                                                                                                                 | (tenant_id IN ( SELECT profiles.tenant_id
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid())))                                                                                                                                                                                                                            | TO authenticated;

DROP POLICY IF EXISTS "tenant_sapi_breeding_weight_records_delete" ON "public"."sapi_breeding_weight_records";
CREATE POLICY "tenant_sapi_breeding_weight_records_delete" ON "public"."sapi_breeding_weight_records" AS PERMISSIVE FOR DELETE
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid())))                                                                                                                                                                                                                                                                                                                                                 | null                                                                                                                                                                                                                                                                                                                                 | TO authenticated;

DROP POLICY IF EXISTS "tenant_sapi_breeding_weight_records_insert" ON "public"."sapi_breeding_weight_records";
CREATE POLICY "tenant_sapi_breeding_weight_records_insert" ON "public"."sapi_breeding_weight_records" AS PERMISSIVE FOR INSERT TO authenticated USING null
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid())))                                                                                                                                                                                                                            |;

DROP POLICY IF EXISTS "tenant_sapi_breeding_weight_records_select" ON "public"."sapi_breeding_weight_records";
CREATE POLICY "tenant_sapi_breeding_weight_records_select" ON "public"."sapi_breeding_weight_records" AS PERMISSIVE FOR SELECT
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid())))                                                                                                                                                                                                                                                                                                                                                 | null                                                                                                                                                                                                                                                                                                                                 | TO authenticated;

DROP POLICY IF EXISTS "tenant_sapi_breeding_weight_records_update" ON "public"."sapi_breeding_weight_records";
CREATE POLICY "tenant_sapi_breeding_weight_records_update" ON "public"."sapi_breeding_weight_records" AS PERMISSIVE FOR UPDATE
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid())))                                                                                                                                                                                                                                                                                                                                                 | (tenant_id IN ( SELECT profiles.tenant_id
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid())))                                                                                                                                                                                                                            | TO authenticated;

DROP POLICY IF EXISTS "tenant_sapi_kandangs_delete" ON "public"."sapi_kandangs";
CREATE POLICY "tenant_sapi_kandangs_delete" ON "public"."sapi_kandangs" AS PERMISSIVE FOR DELETE
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid())))                                                                                                                                                                                                                                                                                                                                                 | null                                                                                                                                                                                                                                                                                                                                 | TO authenticated;

DROP POLICY IF EXISTS "tenant_sapi_kandangs_insert" ON "public"."sapi_kandangs";
CREATE POLICY "tenant_sapi_kandangs_insert" ON "public"."sapi_kandangs" AS PERMISSIVE FOR INSERT TO authenticated USING null
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid())))                                                                                                                                                                                                                            |;

DROP POLICY IF EXISTS "tenant_sapi_kandangs_select" ON "public"."sapi_kandangs";
CREATE POLICY "tenant_sapi_kandangs_select" ON "public"."sapi_kandangs" AS PERMISSIVE FOR SELECT
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid())))                                                                                                                                                                                                                                                                                                                                                 | null                                                                                                                                                                                                                                                                                                                                 | TO authenticated;

DROP POLICY IF EXISTS "tenant_sapi_kandangs_update" ON "public"."sapi_kandangs";
CREATE POLICY "tenant_sapi_kandangs_update" ON "public"."sapi_kandangs" AS PERMISSIVE FOR UPDATE
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid())))                                                                                                                                                                                                                                                                                                                                                 | (tenant_id IN ( SELECT profiles.tenant_id
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid())))                                                                                                                                                                                                                            | TO authenticated;

DROP POLICY IF EXISTS "tenant_sapi_penggemukan_animals_delete" ON "public"."sapi_penggemukan_animals";
CREATE POLICY "tenant_sapi_penggemukan_animals_delete" ON "public"."sapi_penggemukan_animals" AS PERMISSIVE FOR DELETE
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid())))                                                                                                                                                                                                                                                                                                                                                 | null                                                                                                                                                                                                                                                                                                                                 | TO authenticated;

DROP POLICY IF EXISTS "tenant_sapi_penggemukan_animals_insert" ON "public"."sapi_penggemukan_animals";
CREATE POLICY "tenant_sapi_penggemukan_animals_insert" ON "public"."sapi_penggemukan_animals" AS PERMISSIVE FOR INSERT TO authenticated USING null
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid())))                                                                                                                                                                                                                            |;

DROP POLICY IF EXISTS "tenant_sapi_penggemukan_animals_select" ON "public"."sapi_penggemukan_animals";
CREATE POLICY "tenant_sapi_penggemukan_animals_select" ON "public"."sapi_penggemukan_animals" AS PERMISSIVE FOR SELECT
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid())))                                                                                                                                                                                                                                                                                                                                                 | null                                                                                                                                                                                                                                                                                                                                 | TO authenticated;

DROP POLICY IF EXISTS "tenant_sapi_penggemukan_animals_update" ON "public"."sapi_penggemukan_animals";
CREATE POLICY "tenant_sapi_penggemukan_animals_update" ON "public"."sapi_penggemukan_animals" AS PERMISSIVE FOR UPDATE
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid())))                                                                                                                                                                                                                                                                                                                                                 | (tenant_id IN ( SELECT profiles.tenant_id
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid())))                                                                                                                                                                                                                            | TO authenticated;

DROP POLICY IF EXISTS "tenant_sapi_penggemukan_batches_delete" ON "public"."sapi_penggemukan_batches";
CREATE POLICY "tenant_sapi_penggemukan_batches_delete" ON "public"."sapi_penggemukan_batches" AS PERMISSIVE FOR DELETE
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid())))                                                                                                                                                                                                                                                                                                                                                 | null                                                                                                                                                                                                                                                                                                                                 | TO authenticated;

DROP POLICY IF EXISTS "tenant_sapi_penggemukan_batches_insert" ON "public"."sapi_penggemukan_batches";
CREATE POLICY "tenant_sapi_penggemukan_batches_insert" ON "public"."sapi_penggemukan_batches" AS PERMISSIVE FOR INSERT TO authenticated USING null
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid())))                                                                                                                                                                                                                            |;

DROP POLICY IF EXISTS "tenant_sapi_penggemukan_batches_select" ON "public"."sapi_penggemukan_batches";
CREATE POLICY "tenant_sapi_penggemukan_batches_select" ON "public"."sapi_penggemukan_batches" AS PERMISSIVE FOR SELECT
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid())))                                                                                                                                                                                                                                                                                                                                                 | null                                                                                                                                                                                                                                                                                                                                 | TO authenticated;

DROP POLICY IF EXISTS "tenant_sapi_penggemukan_batches_update" ON "public"."sapi_penggemukan_batches";
CREATE POLICY "tenant_sapi_penggemukan_batches_update" ON "public"."sapi_penggemukan_batches" AS PERMISSIVE FOR UPDATE
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid())))                                                                                                                                                                                                                                                                                                                                                 | (tenant_id IN ( SELECT profiles.tenant_id
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid())))                                                                                                                                                                                                                            | TO authenticated;

DROP POLICY IF EXISTS "tenant_sapi_penggemukan_feed_logs_delete" ON "public"."sapi_penggemukan_feed_logs";
CREATE POLICY "tenant_sapi_penggemukan_feed_logs_delete" ON "public"."sapi_penggemukan_feed_logs" AS PERMISSIVE FOR DELETE
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid())))                                                                                                                                                                                                                                                                                                                                                 | null                                                                                                                                                                                                                                                                                                                                 | TO authenticated;

DROP POLICY IF EXISTS "tenant_sapi_penggemukan_feed_logs_insert" ON "public"."sapi_penggemukan_feed_logs";
CREATE POLICY "tenant_sapi_penggemukan_feed_logs_insert" ON "public"."sapi_penggemukan_feed_logs" AS PERMISSIVE FOR INSERT TO authenticated USING null
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid())))                                                                                                                                                                                                                            |;

DROP POLICY IF EXISTS "tenant_sapi_penggemukan_feed_logs_select" ON "public"."sapi_penggemukan_feed_logs";
CREATE POLICY "tenant_sapi_penggemukan_feed_logs_select" ON "public"."sapi_penggemukan_feed_logs" AS PERMISSIVE FOR SELECT
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid())))                                                                                                                                                                                                                                                                                                                                                 | null                                                                                                                                                                                                                                                                                                                                 | TO authenticated;

DROP POLICY IF EXISTS "tenant_sapi_penggemukan_feed_logs_update" ON "public"."sapi_penggemukan_feed_logs";
CREATE POLICY "tenant_sapi_penggemukan_feed_logs_update" ON "public"."sapi_penggemukan_feed_logs" AS PERMISSIVE FOR UPDATE
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid())))                                                                                                                                                                                                                                                                                                                                                 | (tenant_id IN ( SELECT profiles.tenant_id
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid())))                                                                                                                                                                                                                            | TO authenticated;

DROP POLICY IF EXISTS "tenant_sapi_penggemukan_health_logs_delete" ON "public"."sapi_penggemukan_health_logs";
CREATE POLICY "tenant_sapi_penggemukan_health_logs_delete" ON "public"."sapi_penggemukan_health_logs" AS PERMISSIVE FOR DELETE
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid())))                                                                                                                                                                                                                                                                                                                                                 | null                                                                                                                                                                                                                                                                                                                                 | TO authenticated;

DROP POLICY IF EXISTS "tenant_sapi_penggemukan_health_logs_insert" ON "public"."sapi_penggemukan_health_logs";
CREATE POLICY "tenant_sapi_penggemukan_health_logs_insert" ON "public"."sapi_penggemukan_health_logs" AS PERMISSIVE FOR INSERT TO authenticated USING null
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid())))                                                                                                                                                                                                                            |;

DROP POLICY IF EXISTS "tenant_sapi_penggemukan_health_logs_select" ON "public"."sapi_penggemukan_health_logs";
CREATE POLICY "tenant_sapi_penggemukan_health_logs_select" ON "public"."sapi_penggemukan_health_logs" AS PERMISSIVE FOR SELECT
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid())))                                                                                                                                                                                                                                                                                                                                                 | null                                                                                                                                                                                                                                                                                                                                 | TO authenticated;

DROP POLICY IF EXISTS "tenant_sapi_penggemukan_health_logs_update" ON "public"."sapi_penggemukan_health_logs";
CREATE POLICY "tenant_sapi_penggemukan_health_logs_update" ON "public"."sapi_penggemukan_health_logs" AS PERMISSIVE FOR UPDATE
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid())))                                                                                                                                                                                                                                                                                                                                                 | (tenant_id IN ( SELECT profiles.tenant_id
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid())))                                                                                                                                                                                                                            | TO authenticated;

DROP POLICY IF EXISTS "sapi_penggemukan_operational_costs_delete" ON "public"."sapi_penggemukan_operational_costs";
CREATE POLICY "sapi_penggemukan_operational_costs_delete" ON "public"."sapi_penggemukan_operational_costs" AS PERMISSIVE FOR DELETE TO authenticated USING is_superadmin();

DROP POLICY IF EXISTS "sapi_penggemukan_operational_costs_insert" ON "public"."sapi_penggemukan_operational_costs";
CREATE POLICY "sapi_penggemukan_operational_costs_insert" ON "public"."sapi_penggemukan_operational_costs" AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((is_tenant_member(tenant_id) AND (my_role_for(tenant_id) = ANY (ARRAY['owner'::text, 'staff'::text]))) OR is_superadmin());

DROP POLICY IF EXISTS "sapi_penggemukan_operational_costs_select" ON "public"."sapi_penggemukan_operational_costs";
CREATE POLICY "sapi_penggemukan_operational_costs_select" ON "public"."sapi_penggemukan_operational_costs" AS PERMISSIVE FOR SELECT TO authenticated USING (is_tenant_member(tenant_id) OR is_superadmin());

DROP POLICY IF EXISTS "sapi_penggemukan_operational_costs_update" ON "public"."sapi_penggemukan_operational_costs";
CREATE POLICY "sapi_penggemukan_operational_costs_update" ON "public"."sapi_penggemukan_operational_costs" AS PERMISSIVE FOR UPDATE TO authenticated USING ((is_tenant_member(tenant_id) AND (my_role_for(tenant_id) = ANY (ARRAY['owner'::text, 'staff'::text]))) OR is_superadmin()) WITH CHECK ((is_tenant_member(tenant_id) AND (my_role_for(tenant_id) = ANY (ARRAY['owner'::text, 'staff'::text]))) OR is_superadmin());

DROP POLICY IF EXISTS "tenant_sapi_penggemukan_sales_delete" ON "public"."sapi_penggemukan_sales";
CREATE POLICY "tenant_sapi_penggemukan_sales_delete" ON "public"."sapi_penggemukan_sales" AS PERMISSIVE FOR DELETE
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid())))                                                                                                                                                                                                                                                                                                                                                 | null                                                                                                                                                                                                                                                                                                                                 | TO authenticated;

DROP POLICY IF EXISTS "tenant_sapi_penggemukan_sales_insert" ON "public"."sapi_penggemukan_sales";
CREATE POLICY "tenant_sapi_penggemukan_sales_insert" ON "public"."sapi_penggemukan_sales" AS PERMISSIVE FOR INSERT TO authenticated USING null
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid())))                                                                                                                                                                                                                            |;

DROP POLICY IF EXISTS "tenant_sapi_penggemukan_sales_select" ON "public"."sapi_penggemukan_sales";
CREATE POLICY "tenant_sapi_penggemukan_sales_select" ON "public"."sapi_penggemukan_sales" AS PERMISSIVE FOR SELECT
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid())))                                                                                                                                                                                                                                                                                                                                                 | null                                                                                                                                                                                                                                                                                                                                 | TO authenticated;

DROP POLICY IF EXISTS "tenant_sapi_penggemukan_sales_update" ON "public"."sapi_penggemukan_sales";
CREATE POLICY "tenant_sapi_penggemukan_sales_update" ON "public"."sapi_penggemukan_sales" AS PERMISSIVE FOR UPDATE
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid())))                                                                                                                                                                                                                                                                                                                                                 | (tenant_id IN ( SELECT profiles.tenant_id
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid())))                                                                                                                                                                                                                            | TO authenticated;

DROP POLICY IF EXISTS "tenant_sapi_penggemukan_weight_records_delete" ON "public"."sapi_penggemukan_weight_records";
CREATE POLICY "tenant_sapi_penggemukan_weight_records_delete" ON "public"."sapi_penggemukan_weight_records" AS PERMISSIVE FOR DELETE
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid())))                                                                                                                                                                                                                                                                                                                                                 | null                                                                                                                                                                                                                                                                                                                                 | TO authenticated;

DROP POLICY IF EXISTS "tenant_sapi_penggemukan_weight_records_insert" ON "public"."sapi_penggemukan_weight_records";
CREATE POLICY "tenant_sapi_penggemukan_weight_records_insert" ON "public"."sapi_penggemukan_weight_records" AS PERMISSIVE FOR INSERT TO authenticated USING null
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid())))                                                                                                                                                                                                                            |;

DROP POLICY IF EXISTS "tenant_sapi_penggemukan_weight_records_select" ON "public"."sapi_penggemukan_weight_records";
CREATE POLICY "tenant_sapi_penggemukan_weight_records_select" ON "public"."sapi_penggemukan_weight_records" AS PERMISSIVE FOR SELECT
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid())))                                                                                                                                                                                                                                                                                                                                                 | null                                                                                                                                                                                                                                                                                                                                 | TO authenticated;

DROP POLICY IF EXISTS "tenant_sapi_penggemukan_weight_records_update" ON "public"."sapi_penggemukan_weight_records";
CREATE POLICY "tenant_sapi_penggemukan_weight_records_update" ON "public"."sapi_penggemukan_weight_records" AS PERMISSIVE FOR UPDATE
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid())))                                                                                                                                                                                                                                                                                                                                                 | (tenant_id IN ( SELECT profiles.tenant_id
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid())))                                                                                                                                                                                                                            | TO authenticated;

DROP POLICY IF EXISTS "sembako_customers_delete" ON "public"."sembako_customers";
CREATE POLICY "sembako_customers_delete" ON "public"."sembako_customers" AS PERMISSIVE FOR DELETE TO authenticated USING is_superadmin();

DROP POLICY IF EXISTS "sembako_customers_insert" ON "public"."sembako_customers";
CREATE POLICY "sembako_customers_insert" ON "public"."sembako_customers" AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((is_tenant_member(tenant_id) AND can_manage_sales_sembako()) OR is_superadmin());

DROP POLICY IF EXISTS "sembako_customers_select" ON "public"."sembako_customers";
CREATE POLICY "sembako_customers_select" ON "public"."sembako_customers" AS PERMISSIVE FOR SELECT TO public USING ((tenant_id = ANY (auth_user_tenant_ids())) OR is_superadmin());

DROP POLICY IF EXISTS "sembako_customers_superadmin_all" ON "public"."sembako_customers";
CREATE POLICY "sembako_customers_superadmin_all" ON "public"."sembako_customers" AS PERMISSIVE FOR ALL TO authenticated USING is_superadmin() WITH CHECK is_superadmin();

DROP POLICY IF EXISTS "sembako_customers_update" ON "public"."sembako_customers";
CREATE POLICY "sembako_customers_update" ON "public"."sembako_customers" AS PERMISSIVE FOR UPDATE TO authenticated USING ((is_tenant_member(tenant_id) AND can_manage_sales_sembako()) OR is_superadmin()) WITH CHECK ((is_tenant_member(tenant_id) AND can_manage_sales_sembako()) OR is_superadmin());

DROP POLICY IF EXISTS "sembako_deliveries_delete" ON "public"."sembako_deliveries";
CREATE POLICY "sembako_deliveries_delete" ON "public"."sembako_deliveries" AS PERMISSIVE FOR DELETE TO authenticated USING is_superadmin();

DROP POLICY IF EXISTS "sembako_deliveries_insert" ON "public"."sembako_deliveries";
CREATE POLICY "sembako_deliveries_insert" ON "public"."sembako_deliveries" AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((is_tenant_member(tenant_id) AND can_manage_delivery_sembako()) OR is_superadmin());

DROP POLICY IF EXISTS "sembako_deliveries_select" ON "public"."sembako_deliveries";
CREATE POLICY "sembako_deliveries_select" ON "public"."sembako_deliveries" AS PERMISSIVE FOR SELECT TO public USING ((tenant_id = ANY (auth_user_tenant_ids())) OR is_superadmin());

DROP POLICY IF EXISTS "sembako_deliveries_superadmin_all" ON "public"."sembako_deliveries";
CREATE POLICY "sembako_deliveries_superadmin_all" ON "public"."sembako_deliveries" AS PERMISSIVE FOR ALL TO authenticated USING is_superadmin() WITH CHECK is_superadmin();

DROP POLICY IF EXISTS "sembako_deliveries_update" ON "public"."sembako_deliveries";
CREATE POLICY "sembako_deliveries_update" ON "public"."sembako_deliveries" AS PERMISSIVE FOR UPDATE TO authenticated USING ((is_tenant_member(tenant_id) AND can_manage_delivery_sembako()) OR is_superadmin()) WITH CHECK ((is_tenant_member(tenant_id) AND can_manage_delivery_sembako()) OR is_superadmin());

DROP POLICY IF EXISTS "sembako_employees_delete" ON "public"."sembako_employees";
CREATE POLICY "sembako_employees_delete" ON "public"."sembako_employees" AS PERMISSIVE FOR DELETE TO authenticated USING is_superadmin();

DROP POLICY IF EXISTS "sembako_employees_insert" ON "public"."sembako_employees";
CREATE POLICY "sembako_employees_insert" ON "public"."sembako_employees" AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((is_tenant_member(tenant_id) AND can_manage_finance_sembako()) OR is_superadmin());

DROP POLICY IF EXISTS "sembako_employees_select" ON "public"."sembako_employees";
CREATE POLICY "sembako_employees_select" ON "public"."sembako_employees" AS PERMISSIVE FOR SELECT TO authenticated USING ((is_tenant_member(tenant_id) AND can_manage_finance_sembako()) OR is_superadmin());

DROP POLICY IF EXISTS "sembako_employees_superadmin_all" ON "public"."sembako_employees";
CREATE POLICY "sembako_employees_superadmin_all" ON "public"."sembako_employees" AS PERMISSIVE FOR ALL TO authenticated USING is_superadmin() WITH CHECK is_superadmin();

DROP POLICY IF EXISTS "sembako_employees_update" ON "public"."sembako_employees";
CREATE POLICY "sembako_employees_update" ON "public"."sembako_employees" AS PERMISSIVE FOR UPDATE TO authenticated USING ((is_tenant_member(tenant_id) AND can_manage_finance_sembako()) OR is_superadmin()) WITH CHECK ((is_tenant_member(tenant_id) AND can_manage_finance_sembako()) OR is_superadmin());

DROP POLICY IF EXISTS "sembako_expenses_delete" ON "public"."sembako_expenses";
CREATE POLICY "sembako_expenses_delete" ON "public"."sembako_expenses" AS PERMISSIVE FOR DELETE TO authenticated USING is_superadmin();

DROP POLICY IF EXISTS "sembako_expenses_insert" ON "public"."sembako_expenses";
CREATE POLICY "sembako_expenses_insert" ON "public"."sembako_expenses" AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((is_tenant_member(tenant_id) AND can_manage_finance_sembako()) OR is_superadmin());

DROP POLICY IF EXISTS "sembako_expenses_select" ON "public"."sembako_expenses";
CREATE POLICY "sembako_expenses_select" ON "public"."sembako_expenses" AS PERMISSIVE FOR SELECT TO authenticated USING ((is_tenant_member(tenant_id) AND can_manage_finance_sembako()) OR is_superadmin());

DROP POLICY IF EXISTS "sembako_expenses_superadmin_all" ON "public"."sembako_expenses";
CREATE POLICY "sembako_expenses_superadmin_all" ON "public"."sembako_expenses" AS PERMISSIVE FOR ALL TO authenticated USING is_superadmin() WITH CHECK is_superadmin();

DROP POLICY IF EXISTS "sembako_expenses_update" ON "public"."sembako_expenses";
CREATE POLICY "sembako_expenses_update" ON "public"."sembako_expenses" AS PERMISSIVE FOR UPDATE TO authenticated USING ((is_tenant_member(tenant_id) AND can_manage_finance_sembako()) OR is_superadmin()) WITH CHECK ((is_tenant_member(tenant_id) AND can_manage_finance_sembako()) OR is_superadmin());

DROP POLICY IF EXISTS "sembako_payments_delete" ON "public"."sembako_payments";
CREATE POLICY "sembako_payments_delete" ON "public"."sembako_payments" AS PERMISSIVE FOR DELETE TO authenticated USING ((is_tenant_member(tenant_id) AND can_manage_sales_sembako()) OR is_superadmin());

DROP POLICY IF EXISTS "sembako_payments_insert" ON "public"."sembako_payments";
CREATE POLICY "sembako_payments_insert" ON "public"."sembako_payments" AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((is_tenant_member(tenant_id) AND can_manage_sales_sembako()) OR is_superadmin());

DROP POLICY IF EXISTS "sembako_payments_select" ON "public"."sembako_payments";
CREATE POLICY "sembako_payments_select" ON "public"."sembako_payments" AS PERMISSIVE FOR SELECT TO authenticated USING ((is_tenant_member(tenant_id) AND can_manage_sales_sembako()) OR is_superadmin());

DROP POLICY IF EXISTS "sembako_payments_superadmin_all" ON "public"."sembako_payments";
CREATE POLICY "sembako_payments_superadmin_all" ON "public"."sembako_payments" AS PERMISSIVE FOR ALL TO authenticated USING is_superadmin() WITH CHECK is_superadmin();

DROP POLICY IF EXISTS "sembako_payments_update" ON "public"."sembako_payments";
CREATE POLICY "sembako_payments_update" ON "public"."sembako_payments" AS PERMISSIVE FOR UPDATE TO authenticated USING ((is_tenant_member(tenant_id) AND can_manage_sales_sembako()) OR is_superadmin()) WITH CHECK ((is_tenant_member(tenant_id) AND can_manage_sales_sembako()) OR is_superadmin());

DROP POLICY IF EXISTS "sembako_payroll_delete" ON "public"."sembako_payroll";
CREATE POLICY "sembako_payroll_delete" ON "public"."sembako_payroll" AS PERMISSIVE FOR DELETE TO authenticated USING is_superadmin();

DROP POLICY IF EXISTS "sembako_payroll_insert" ON "public"."sembako_payroll";
CREATE POLICY "sembako_payroll_insert" ON "public"."sembako_payroll" AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((is_tenant_member(tenant_id) AND can_manage_finance_sembako()) OR is_superadmin());

DROP POLICY IF EXISTS "sembako_payroll_select" ON "public"."sembako_payroll";
CREATE POLICY "sembako_payroll_select" ON "public"."sembako_payroll" AS PERMISSIVE FOR SELECT TO authenticated USING ((is_tenant_member(tenant_id) AND can_manage_finance_sembako()) OR is_superadmin());

DROP POLICY IF EXISTS "sembako_payroll_superadmin_all" ON "public"."sembako_payroll";
CREATE POLICY "sembako_payroll_superadmin_all" ON "public"."sembako_payroll" AS PERMISSIVE FOR ALL TO authenticated USING is_superadmin() WITH CHECK is_superadmin();

DROP POLICY IF EXISTS "sembako_payroll_update" ON "public"."sembako_payroll";
CREATE POLICY "sembako_payroll_update" ON "public"."sembako_payroll" AS PERMISSIVE FOR UPDATE TO authenticated USING ((is_tenant_member(tenant_id) AND can_manage_finance_sembako()) OR is_superadmin()) WITH CHECK ((is_tenant_member(tenant_id) AND can_manage_finance_sembako()) OR is_superadmin());

DROP POLICY IF EXISTS "sembako_products_delete" ON "public"."sembako_products";
CREATE POLICY "sembako_products_delete" ON "public"."sembako_products" AS PERMISSIVE FOR DELETE TO authenticated USING is_superadmin();

DROP POLICY IF EXISTS "sembako_products_insert" ON "public"."sembako_products";
CREATE POLICY "sembako_products_insert" ON "public"."sembako_products" AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((is_tenant_member(tenant_id) AND can_manage_inventory_sembako()) OR is_superadmin());

DROP POLICY IF EXISTS "sembako_products_select" ON "public"."sembako_products";
CREATE POLICY "sembako_products_select" ON "public"."sembako_products" AS PERMISSIVE FOR SELECT TO public USING ((tenant_id = ANY (auth_user_tenant_ids())) OR is_superadmin());

DROP POLICY IF EXISTS "sembako_products_superadmin_all" ON "public"."sembako_products";
CREATE POLICY "sembako_products_superadmin_all" ON "public"."sembako_products" AS PERMISSIVE FOR ALL TO authenticated USING is_superadmin() WITH CHECK is_superadmin();

DROP POLICY IF EXISTS "sembako_products_update" ON "public"."sembako_products";
CREATE POLICY "sembako_products_update" ON "public"."sembako_products" AS PERMISSIVE FOR UPDATE TO authenticated USING ((is_tenant_member(tenant_id) AND can_manage_inventory_sembako()) OR is_superadmin()) WITH CHECK ((is_tenant_member(tenant_id) AND can_manage_inventory_sembako()) OR is_superadmin());

DROP POLICY IF EXISTS "sembako_sale_items_all" ON "public"."sembako_sale_items";
CREATE POLICY "sembako_sale_items_all" ON "public"."sembako_sale_items" AS PERMISSIVE FOR ALL
   FROM sembako_sales
  WHERE ((sembako_sales.id = sembako_sale_items.sale_id) AND is_tenant_member(sembako_sales.tenant_id)))))                                                                                                                                                                                                                                                                                   | (is_superadmin() OR (EXISTS ( SELECT 1
   FROM sembako_sales
  WHERE ((sembako_sales.id = sembako_sale_items.sale_id) AND is_tenant_member(sembako_sales.tenant_id) AND (my_role_for(sembako_sales.tenant_id) = ANY (ARRAY['owner'::text, 'admin'::text, 'sales'::text, 'gudang'::text]))))))                                        | TO authenticated;

DROP POLICY IF EXISTS "sembako_sales_delete" ON "public"."sembako_sales";
CREATE POLICY "sembako_sales_delete" ON "public"."sembako_sales" AS PERMISSIVE FOR DELETE TO authenticated USING is_superadmin();

DROP POLICY IF EXISTS "sembako_sales_insert" ON "public"."sembako_sales";
CREATE POLICY "sembako_sales_insert" ON "public"."sembako_sales" AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((is_tenant_member(tenant_id) AND can_manage_sales_sembako()) OR is_superadmin());

DROP POLICY IF EXISTS "sembako_sales_select" ON "public"."sembako_sales";
CREATE POLICY "sembako_sales_select" ON "public"."sembako_sales" AS PERMISSIVE FOR SELECT TO public USING ((tenant_id = ANY (auth_user_tenant_ids())) OR is_superadmin());

DROP POLICY IF EXISTS "sembako_sales_superadmin_all" ON "public"."sembako_sales";
CREATE POLICY "sembako_sales_superadmin_all" ON "public"."sembako_sales" AS PERMISSIVE FOR ALL TO authenticated USING is_superadmin() WITH CHECK is_superadmin();

DROP POLICY IF EXISTS "sembako_sales_update" ON "public"."sembako_sales";
CREATE POLICY "sembako_sales_update" ON "public"."sembako_sales" AS PERMISSIVE FOR UPDATE TO authenticated USING ((is_tenant_member(tenant_id) AND can_manage_sales_sembako()) OR is_superadmin()) WITH CHECK ((is_tenant_member(tenant_id) AND can_manage_sales_sembako()) OR is_superadmin());

DROP POLICY IF EXISTS "sembako_stock_batches_delete" ON "public"."sembako_stock_batches";
CREATE POLICY "sembako_stock_batches_delete" ON "public"."sembako_stock_batches" AS PERMISSIVE FOR DELETE TO authenticated USING is_superadmin();

DROP POLICY IF EXISTS "sembako_stock_batches_insert" ON "public"."sembako_stock_batches";
CREATE POLICY "sembako_stock_batches_insert" ON "public"."sembako_stock_batches" AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((is_tenant_member(tenant_id) AND can_manage_inventory_sembako()) OR is_superadmin());

DROP POLICY IF EXISTS "sembako_stock_batches_select" ON "public"."sembako_stock_batches";
CREATE POLICY "sembako_stock_batches_select" ON "public"."sembako_stock_batches" AS PERMISSIVE FOR SELECT TO public USING ((tenant_id = ANY (auth_user_tenant_ids())) OR is_superadmin());

DROP POLICY IF EXISTS "sembako_stock_batches_superadmin_all" ON "public"."sembako_stock_batches";
CREATE POLICY "sembako_stock_batches_superadmin_all" ON "public"."sembako_stock_batches" AS PERMISSIVE FOR ALL TO authenticated USING is_superadmin() WITH CHECK is_superadmin();

DROP POLICY IF EXISTS "sembako_stock_batches_update" ON "public"."sembako_stock_batches";
CREATE POLICY "sembako_stock_batches_update" ON "public"."sembako_stock_batches" AS PERMISSIVE FOR UPDATE TO authenticated USING ((is_tenant_member(tenant_id) AND can_manage_inventory_sembako()) OR is_superadmin()) WITH CHECK ((is_tenant_member(tenant_id) AND can_manage_inventory_sembako()) OR is_superadmin());

DROP POLICY IF EXISTS "sembako_stock_out_delete" ON "public"."sembako_stock_out";
CREATE POLICY "sembako_stock_out_delete" ON "public"."sembako_stock_out" AS PERMISSIVE FOR DELETE TO authenticated USING is_superadmin();

DROP POLICY IF EXISTS "sembako_stock_out_insert" ON "public"."sembako_stock_out";
CREATE POLICY "sembako_stock_out_insert" ON "public"."sembako_stock_out" AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((is_tenant_member(tenant_id) AND can_manage_delivery_sembako()) OR is_superadmin());

DROP POLICY IF EXISTS "sembako_stock_out_select" ON "public"."sembako_stock_out";
CREATE POLICY "sembako_stock_out_select" ON "public"."sembako_stock_out" AS PERMISSIVE FOR SELECT TO public USING ((tenant_id = ANY (auth_user_tenant_ids())) OR is_superadmin());

DROP POLICY IF EXISTS "sembako_stock_out_superadmin_all" ON "public"."sembako_stock_out";
CREATE POLICY "sembako_stock_out_superadmin_all" ON "public"."sembako_stock_out" AS PERMISSIVE FOR ALL TO authenticated USING is_superadmin() WITH CHECK is_superadmin();

DROP POLICY IF EXISTS "sembako_stock_out_update" ON "public"."sembako_stock_out";
CREATE POLICY "sembako_stock_out_update" ON "public"."sembako_stock_out" AS PERMISSIVE FOR UPDATE TO authenticated USING ((is_tenant_member(tenant_id) AND can_manage_delivery_sembako()) OR is_superadmin()) WITH CHECK ((is_tenant_member(tenant_id) AND can_manage_delivery_sembako()) OR is_superadmin());

DROP POLICY IF EXISTS "sembako_supplier_payments_delete" ON "public"."sembako_supplier_payments";
CREATE POLICY "sembako_supplier_payments_delete" ON "public"."sembako_supplier_payments" AS PERMISSIVE FOR DELETE TO authenticated USING is_superadmin();

DROP POLICY IF EXISTS "sembako_supplier_payments_insert" ON "public"."sembako_supplier_payments";
CREATE POLICY "sembako_supplier_payments_insert" ON "public"."sembako_supplier_payments" AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((is_tenant_member(tenant_id) AND can_manage_finance_sembako()) OR is_superadmin());

DROP POLICY IF EXISTS "sembako_supplier_payments_select" ON "public"."sembako_supplier_payments";
CREATE POLICY "sembako_supplier_payments_select" ON "public"."sembako_supplier_payments" AS PERMISSIVE FOR SELECT TO authenticated USING ((is_tenant_member(tenant_id) AND can_manage_finance_sembako()) OR is_superadmin());

DROP POLICY IF EXISTS "sembako_supplier_payments_superadmin_all" ON "public"."sembako_supplier_payments";
CREATE POLICY "sembako_supplier_payments_superadmin_all" ON "public"."sembako_supplier_payments" AS PERMISSIVE FOR ALL TO authenticated USING is_superadmin() WITH CHECK is_superadmin();

DROP POLICY IF EXISTS "sembako_supplier_payments_update" ON "public"."sembako_supplier_payments";
CREATE POLICY "sembako_supplier_payments_update" ON "public"."sembako_supplier_payments" AS PERMISSIVE FOR UPDATE TO authenticated USING ((is_tenant_member(tenant_id) AND can_manage_finance_sembako()) OR is_superadmin()) WITH CHECK ((is_tenant_member(tenant_id) AND can_manage_finance_sembako()) OR is_superadmin());

DROP POLICY IF EXISTS "sembako_suppliers_delete" ON "public"."sembako_suppliers";
CREATE POLICY "sembako_suppliers_delete" ON "public"."sembako_suppliers" AS PERMISSIVE FOR DELETE TO authenticated USING is_superadmin();

DROP POLICY IF EXISTS "sembako_suppliers_insert" ON "public"."sembako_suppliers";
CREATE POLICY "sembako_suppliers_insert" ON "public"."sembako_suppliers" AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((is_tenant_member(tenant_id) AND can_manage_inventory_sembako()) OR is_superadmin());

DROP POLICY IF EXISTS "sembako_suppliers_select" ON "public"."sembako_suppliers";
CREATE POLICY "sembako_suppliers_select" ON "public"."sembako_suppliers" AS PERMISSIVE FOR SELECT TO public USING ((tenant_id = ANY (auth_user_tenant_ids())) OR is_superadmin());

DROP POLICY IF EXISTS "sembako_suppliers_superadmin_all" ON "public"."sembako_suppliers";
CREATE POLICY "sembako_suppliers_superadmin_all" ON "public"."sembako_suppliers" AS PERMISSIVE FOR ALL TO authenticated USING is_superadmin() WITH CHECK is_superadmin();

DROP POLICY IF EXISTS "sembako_suppliers_update" ON "public"."sembako_suppliers";
CREATE POLICY "sembako_suppliers_update" ON "public"."sembako_suppliers" AS PERMISSIVE FOR UPDATE TO authenticated USING ((is_tenant_member(tenant_id) AND can_manage_inventory_sembako()) OR is_superadmin()) WITH CHECK ((is_tenant_member(tenant_id) AND can_manage_inventory_sembako()) OR is_superadmin());

DROP POLICY IF EXISTS "Public can read site_config" ON "public"."site_config";
CREATE POLICY "Public can read site_config" ON "public"."site_config" AS PERMISSIVE FOR SELECT TO public USING true;

DROP POLICY IF EXISTS "Superadmin can upsert site_config" ON "public"."site_config";
CREATE POLICY "Superadmin can upsert site_config" ON "public"."site_config" AS PERMISSIVE FOR ALL TO authenticated USING is_superadmin() WITH CHECK is_superadmin();

DROP POLICY IF EXISTS "listings_select" ON "public"."stock_listings";
CREATE POLICY "listings_select" ON "public"."stock_listings" AS PERMISSIVE FOR SELECT
   FROM broker_connections bc
  WHERE ((bc.status = 'active'::text) AND (((bc.requester_tenant_id = stock_listings.peternak_tenant_id) AND is_tenant_member(bc.target_tenant_id)) OR (is_tenant_member(bc.requester_tenant_id) AND (bc.target_tenant_id = stock_listings.peternak_tenant_id)))))))) | null                                                                                                                                                                                                                                                                                                                                 | TO authenticated;

DROP POLICY IF EXISTS "listings_write" ON "public"."stock_listings";
CREATE POLICY "listings_write" ON "public"."stock_listings" AS PERMISSIVE FOR ALL TO authenticated USING (is_tenant_member(peternak_tenant_id) OR is_superadmin()) WITH CHECK is_tenant_member(peternak_tenant_id);

DROP POLICY IF EXISTS "invoice_insert" ON "public"."subscription_invoices";
CREATE POLICY "invoice_insert" ON "public"."subscription_invoices" AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK is_tenant_member(tenant_id);

DROP POLICY IF EXISTS "invoice_select" ON "public"."subscription_invoices";
CREATE POLICY "invoice_select" ON "public"."subscription_invoices" AS PERMISSIVE FOR SELECT TO authenticated USING (is_tenant_member(tenant_id) OR is_superadmin());

DROP POLICY IF EXISTS "invoice_update" ON "public"."subscription_invoices";
CREATE POLICY "invoice_update" ON "public"."subscription_invoices" AS PERMISSIVE FOR UPDATE TO authenticated USING is_superadmin() WITH CHECK is_superadmin();

DROP POLICY IF EXISTS "subscription_invoices_superadmin_all" ON "public"."subscription_invoices";
CREATE POLICY "subscription_invoices_superadmin_all" ON "public"."subscription_invoices" AS PERMISSIVE FOR ALL TO authenticated USING is_superadmin() WITH CHECK is_superadmin();

DROP POLICY IF EXISTS "superadmin_read_invoices" ON "public"."subscription_invoices";
CREATE POLICY "superadmin_read_invoices" ON "public"."subscription_invoices" AS PERMISSIVE FOR SELECT TO authenticated USING is_superadmin();

DROP POLICY IF EXISTS "superadmin_update_invoices" ON "public"."subscription_invoices";
CREATE POLICY "superadmin_update_invoices" ON "public"."subscription_invoices" AS PERMISSIVE FOR UPDATE TO authenticated USING is_superadmin() WITH CHECK is_superadmin();

DROP POLICY IF EXISTS "team_invitations_management_policy" ON "public"."team_invitations";
CREATE POLICY "team_invitations_management_policy" ON "public"."team_invitations" AS PERMISSIVE FOR ALL TO authenticated USING (is_tenant_member(tenant_id) OR is_superadmin()) WITH CHECK ((is_tenant_member(tenant_id) AND (my_role_for(tenant_id) = ANY (ARRAY['owner'::text]))) OR is_superadmin());

DROP POLICY IF EXISTS "memberships_delete" ON "public"."tenant_memberships";
CREATE POLICY "memberships_delete" ON "public"."tenant_memberships" AS PERMISSIVE FOR DELETE TO authenticated USING (auth_user_id = auth.uid());

DROP POLICY IF EXISTS "memberships_insert_via_invite" ON "public"."tenant_memberships";
CREATE POLICY "memberships_insert_via_invite" ON "public"."tenant_memberships" AS PERMISSIVE FOR INSERT TO authenticated USING null
   FROM team_invitations ti
  WHERE ((ti.tenant_id = tenant_memberships.tenant_id) AND (ti.status = 'pending'::text) AND (ti.expires_at > now()) AND (ti.is_deleted = false) AND ((ti.email IS NULL) OR (lower(ti.email) = lower(auth.email())))))) OR (role = 'owner'::text))) |;

DROP POLICY IF EXISTS "memberships_select" ON "public"."tenant_memberships";
CREATE POLICY "memberships_select" ON "public"."tenant_memberships" AS PERMISSIVE FOR SELECT TO authenticated USING (auth_user_id = auth.uid());

DROP POLICY IF EXISTS "tenant_memberships_superadmin_all" ON "public"."tenant_memberships";
CREATE POLICY "tenant_memberships_superadmin_all" ON "public"."tenant_memberships" AS PERMISSIVE FOR ALL TO authenticated USING is_superadmin() WITH CHECK is_superadmin();

DROP POLICY IF EXISTS "tenants_superadmin_all" ON "public"."tenants";
CREATE POLICY "tenants_superadmin_all" ON "public"."tenants" AS PERMISSIVE FOR ALL TO authenticated USING is_superadmin() WITH CHECK is_superadmin();

DROP POLICY IF EXISTS "tenants_user_select" ON "public"."tenants";
CREATE POLICY "tenants_user_select" ON "public"."tenants" AS PERMISSIVE FOR SELECT
   FROM profiles p
  WHERE ((p.tenant_id = tenants.id) AND (p.auth_user_id = auth.uid()))))                                                                                                                                                                                                                                                                                                                                            | null                                                                                                                                                                                                                                                                                                                                 | TO authenticated;

DROP POLICY IF EXISTS "tenant_vaccination_records" ON "public"."vaccination_records";
CREATE POLICY "tenant_vaccination_records" ON "public"."vaccination_records" AS PERMISSIVE FOR ALL TO authenticated USING (is_tenant_member(tenant_id) OR is_superadmin()) WITH CHECK (is_tenant_member(tenant_id) OR is_superadmin());

DROP POLICY IF EXISTS "vehicle_expenses_all" ON "public"."vehicle_expenses";
CREATE POLICY "vehicle_expenses_all" ON "public"."vehicle_expenses" AS PERMISSIVE FOR ALL TO authenticated USING (is_tenant_member(tenant_id) OR is_superadmin()) WITH CHECK (is_tenant_member(tenant_id) AND (my_role_for(tenant_id) = ANY (ARRAY['owner'::text, 'staff'::text])));

DROP POLICY IF EXISTS "Tenant Isolation Policy" ON "public"."vehicles";
CREATE POLICY "Tenant Isolation Policy" ON "public"."vehicles" AS PERMISSIVE FOR ALL TO authenticated USING (is_tenant_member(tenant_id) OR is_superadmin()) WITH CHECK (is_tenant_member(tenant_id) OR is_superadmin());

DROP POLICY IF EXISTS "Allow anon to insert valid waitlist entries" ON "public"."waitlist_signups";
CREATE POLICY "Allow anon to insert valid waitlist entries" ON "public"."waitlist_signups" AS PERMISSIVE FOR INSERT TO anon WITH CHECK ((email IS NOT NULL) AND (length(email) > 3));

DROP POLICY IF EXISTS "Allow authenticated users to view waitlist" ON "public"."waitlist_signups";
CREATE POLICY "Allow authenticated users to view waitlist" ON "public"."waitlist_signups" AS PERMISSIVE FOR SELECT TO authenticated USING true;

DROP POLICY IF EXISTS "superadmin_read_waitlist" ON "public"."waitlist_signups";
CREATE POLICY "superadmin_read_waitlist" ON "public"."waitlist_signups" AS PERMISSIVE FOR SELECT TO authenticated USING is_superadmin();

DROP POLICY IF EXISTS "worker_payments_superadmin_all" ON "public"."worker_payments";
CREATE POLICY "worker_payments_superadmin_all" ON "public"."worker_payments" AS PERMISSIVE FOR ALL TO authenticated USING is_superadmin() WITH CHECK is_superadmin();

DROP POLICY IF EXISTS "superadmin_only_xendit_config" ON "public"."xendit_config";
CREATE POLICY "superadmin_only_xendit_config" ON "public"."xendit_config" AS PERMISSIVE FOR ALL TO authenticated USING is_superadmin() WITH CHECK is_superadmin();


