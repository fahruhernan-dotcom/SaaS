-- Fix RLS Policies for sapi_penggemukan and sapi_breeding where 'id = auth.uid()' was incorrectly used instead of 'auth_user_id = auth.uid()'

DO $$
DECLARE
  tbl TEXT;
BEGIN
  -- Fix sapi_penggemukan tables
  FOREACH tbl IN ARRAY ARRAY[
    'sapi_penggemukan_batches',
    'sapi_penggemukan_animals',
    'sapi_penggemukan_weight_records',
    'sapi_penggemukan_feed_logs',
    'sapi_penggemukan_health_logs',
    'sapi_penggemukan_sales'
  ]
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS "tenant_%s" ON %I', tbl, tbl);
    EXECUTE format(
      'CREATE POLICY "tenant_%s_select" ON %I FOR SELECT USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE auth_user_id = auth.uid()))',
      tbl, tbl
    );
    EXECUTE format(
      'CREATE POLICY "tenant_%s_insert" ON %I FOR INSERT WITH CHECK (tenant_id IN (SELECT tenant_id FROM profiles WHERE auth_user_id = auth.uid()))',
      tbl, tbl
    );
    EXECUTE format(
      'CREATE POLICY "tenant_%s_update" ON %I FOR UPDATE USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE auth_user_id = auth.uid()))',
      tbl, tbl
    );
    EXECUTE format(
      'CREATE POLICY "tenant_%s_delete" ON %I FOR DELETE USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE auth_user_id = auth.uid()))',
      tbl, tbl
    );
  END LOOP;

  -- Fix sapi_breeding tables
  FOREACH tbl IN ARRAY ARRAY[
    'sapi_breeding_animals',
    'sapi_breeding_health_logs',
    'sapi_breeding_mating_records',
    'sapi_breeding_births',
    'sapi_breeding_weight_records',
    'sapi_breeding_feed_logs',
    'sapi_breeding_sales'
  ]
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS "tenant_%s" ON %I', tbl, tbl);
    EXECUTE format(
      'CREATE POLICY "tenant_%s_select" ON %I FOR SELECT USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE auth_user_id = auth.uid()))',
      tbl, tbl
    );
    EXECUTE format(
      'CREATE POLICY "tenant_%s_insert" ON %I FOR INSERT WITH CHECK (tenant_id IN (SELECT tenant_id FROM profiles WHERE auth_user_id = auth.uid()))',
      tbl, tbl
    );
    EXECUTE format(
      'CREATE POLICY "tenant_%s_update" ON %I FOR UPDATE USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE auth_user_id = auth.uid()))',
      tbl, tbl
    );
    EXECUTE format(
      'CREATE POLICY "tenant_%s_delete" ON %I FOR DELETE USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE auth_user_id = auth.uid()))',
      tbl, tbl
    );
  END LOOP;
END $$;
