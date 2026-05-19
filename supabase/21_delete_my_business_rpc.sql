-- ─────────────────────────────────────────────────────────────────────────────
-- delete_my_business(p_tenant_id uuid)
-- Permanently deletes one tenant/business owned by the authenticated caller.
--
-- SECURITY:
-- - SECURITY DEFINER, so it can delete across tenant-scoped tables.
-- - Caller must be owner in tenant_memberships OR profiles.
-- - Function is granted only to authenticated.
--
-- IMPORTANT:
-- - Test with a dummy tenant first.
-- - This is destructive and cannot be undone after COMMIT.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.delete_my_business(p_tenant_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_is_owner boolean := false;
  v_has_table boolean := false;
  v_has_column boolean := false;
  r record;
BEGIN
  -- ── 0. Basic guards ────────────────────────────────────────────────────────
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'AUTH_REQUIRED: authenticated user required'
      USING ERRCODE = '28000';
  END IF;

  IF p_tenant_id IS NULL THEN
    RAISE EXCEPTION 'INVALID_TENANT: tenant id is required'
      USING ERRCODE = '22023';
  END IF;

  -- Lock tenant row to avoid concurrent deletion / mutation race.
  PERFORM 1
  FROM public.tenants
  WHERE id = p_tenant_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'TENANT_NOT_FOUND: business does not exist'
      USING ERRCODE = 'P0002';
  END IF;

  -- ── 1. Ownership check ─────────────────────────────────────────────────────
  SELECT EXISTS (
    SELECT 1
    FROM public.tenant_memberships
    WHERE tenant_id = p_tenant_id
      AND auth_user_id = v_uid
      AND role = 'owner'
  )
  OR EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE tenant_id = p_tenant_id
      AND auth_user_id = v_uid
      AND role = 'owner'
  )
  INTO v_is_owner;

  IF NOT v_is_owner THEN
    RAISE EXCEPTION 'ACCESS_DENIED: only the business owner can delete this business'
      USING ERRCODE = '42501';
  END IF;

  -- ── 2. Nullify cross-tenant references ─────────────────────────────────────
  -- These are references from other tenant/business rows to this tenant.
  FOR r IN
    SELECT *
    FROM (
      VALUES
        ('rpa_payments',        'broker_tenant_id'),
        ('rpa_purchase_orders', 'broker_tenant_id'),
        ('stock_listings',      'peternak_tenant_id')
    ) AS x(table_name, column_name)
  LOOP
    SELECT to_regclass(format('%I.%I', 'public', r.table_name)) IS NOT NULL
    INTO v_has_table;

    SELECT EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = r.table_name
        AND column_name = r.column_name
    )
    INTO v_has_column;

    IF v_has_table AND v_has_column THEN
      EXECUTE format(
        'UPDATE public.%I SET %I = NULL WHERE %I = $1',
        r.table_name,
        r.column_name,
        r.column_name
      )
      USING p_tenant_id;
    END IF;
  END LOOP;

  -- ── 3. Child/detail fallback deletes ───────────────────────────────────────
  -- These handle detail tables that may not have tenant_id but reference parent rows.
  FOR r IN
    SELECT unnest(ARRAY[
      'DELETE FROM public.sembako_sale_items si USING public.sembako_sales s WHERE si.sale_id = s.id AND s.tenant_id = $1',
      'DELETE FROM public.egg_sale_items ei USING public.egg_sales s WHERE ei.sale_id = s.id AND s.tenant_id = $1',
      'DELETE FROM public.rpa_invoice_items ii USING public.rpa_invoices i WHERE ii.invoice_id = i.id AND i.tenant_id = $1',
      'DELETE FROM public.rpa_purchase_order_items poi USING public.rpa_purchase_orders po WHERE poi.purchase_order_id = po.id AND po.rpa_tenant_id = $1',
      'DELETE FROM public.order_items oi USING public.orders o WHERE oi.order_id = o.id AND o.tenant_id = $1',
      'DELETE FROM public.purchase_items pi USING public.purchases p WHERE pi.purchase_id = p.id AND p.tenant_id = $1',
      'DELETE FROM public.delivery_items di USING public.deliveries d WHERE di.delivery_id = d.id AND d.tenant_id = $1'
    ]) AS sql_stmt
  LOOP
    BEGIN
      EXECUTE r.sql_stmt USING p_tenant_id;
    EXCEPTION
      WHEN undefined_table OR undefined_column THEN
        NULL;
    END;
  END LOOP;

  -- ── 4. Tenant-scoped deletes, ordered child → parent ───────────────────────
  FOR r IN
    SELECT *
    FROM (
      VALUES
        -- System / logs / AI
        ('system_error_logs', 'tenant_id'),
        ('ai_anomaly_logs', 'tenant_id'),
        ('ai_conversations', 'tenant_id'),
        ('ai_error_logs', 'tenant_id'),
        ('ai_feedback', 'tenant_id'),
        ('ai_pending_entries', 'tenant_id'),
        ('ai_staged_transactions', 'tenant_id'),
        ('global_audit_logs', 'tenant_id'),

        -- Broker cross relations
        ('broker_connections', 'requester_tenant_id'),
        ('broker_connections', 'target_tenant_id'),

        -- Broker poultry
        ('loss_reports', 'tenant_id'),
        ('payments', 'tenant_id'),
        ('purchases', 'tenant_id'),
        ('orders', 'tenant_id'),
        ('deliveries', 'tenant_id'),
        ('sales', 'tenant_id'),
        ('vehicle_expenses', 'tenant_id'),
        ('drivers', 'tenant_id'),
        ('vehicles', 'tenant_id'),
        ('broker_employees', 'tenant_id'),
        ('broker_profiles', 'tenant_id'),

        -- Broiler / shared peternak
        ('daily_records', 'tenant_id'),
        ('extra_expenses', 'tenant_id'),
        ('harvest_records', 'tenant_id'),
        ('vaccination_records', 'tenant_id'),
        ('feed_stocks', 'tenant_id'),
        ('kandang_worker_payments', 'tenant_id'),
        ('worker_payments', 'tenant_id'),
        ('kandang_workers', 'tenant_id'),
        ('cycle_expenses', 'tenant_id'),
        ('breeding_cycles', 'tenant_id'),
        ('chicken_batches', 'tenant_id'),
        ('farms', 'tenant_id'),
        ('peternak_task_instances', 'tenant_id'),
        ('peternak_task_templates', 'tenant_id'),
        ('peternak_farms', 'tenant_id'),
        ('peternak_profiles', 'tenant_id'),

        -- Sapi penggemukan
        ('sapi_penggemukan_sales', 'tenant_id'),
        ('sapi_penggemukan_weight_records', 'tenant_id'),
        ('sapi_penggemukan_health_logs', 'tenant_id'),
        ('sapi_penggemukan_feed_logs', 'tenant_id'),
        ('sapi_penggemukan_operational_costs', 'tenant_id'),
        ('sapi_penggemukan_animals', 'tenant_id'),
        ('sapi_penggemukan_batches', 'tenant_id'),

        -- Sapi breeding
        ('sapi_breeding_sales', 'tenant_id'),
        ('sapi_breeding_weight_records', 'tenant_id'),
        ('sapi_breeding_mating_records', 'tenant_id'),
        ('sapi_breeding_health_logs', 'tenant_id'),
        ('sapi_breeding_feed_logs', 'tenant_id'),
        ('sapi_breeding_births', 'tenant_id'),
        ('sapi_breeding_animals', 'tenant_id'),
        ('sapi_kandangs', 'tenant_id'),

        -- Domba penggemukan
        ('domba_penggemukan_sales', 'tenant_id'),
        ('domba_penggemukan_weight_records', 'tenant_id'),
        ('domba_penggemukan_health_logs', 'tenant_id'),
        ('domba_penggemukan_feed_logs', 'tenant_id'),
        ('domba_penggemukan_operational_costs', 'tenant_id'),
        ('domba_penggemukan_animals', 'tenant_id'),
        ('domba_penggemukan_batches', 'tenant_id'),

        -- Domba breeding
        ('domba_breeding_sales', 'tenant_id'),
        ('domba_breeding_weight_records', 'tenant_id'),
        ('domba_breeding_mating_records', 'tenant_id'),
        ('domba_breeding_health_logs', 'tenant_id'),
        ('domba_breeding_feed_logs', 'tenant_id'),
        ('domba_breeding_births', 'tenant_id'),
        ('domba_breeding_animals', 'tenant_id'),
        ('domba_kandangs', 'tenant_id'),

        -- Kambing penggemukan
        ('kambing_penggemukan_sales', 'tenant_id'),
        ('kambing_penggemukan_weight_records', 'tenant_id'),
        ('kambing_penggemukan_health_logs', 'tenant_id'),
        ('kambing_penggemukan_feed_logs', 'tenant_id'),
        ('kambing_penggemukan_operational_costs', 'tenant_id'),
        ('kambing_penggemukan_animals', 'tenant_id'),
        ('kambing_penggemukan_batches', 'tenant_id'),

        -- Kambing breeding
        ('kambing_breeding_sales', 'tenant_id'),
        ('kambing_breeding_weight_records', 'tenant_id'),
        ('kambing_breeding_mating_records', 'tenant_id'),
        ('kambing_breeding_health_logs', 'tenant_id'),
        ('kambing_breeding_feed_logs', 'tenant_id'),
        ('kambing_breeding_births', 'tenant_id'),
        ('kambing_breeding_animals', 'tenant_id'),
        ('kambing_kandangs', 'tenant_id'),

        -- Kambing perah
        ('kambing_perah_milk_sales', 'tenant_id'),
        ('kambing_perah_milk_quality_logs', 'tenant_id'),
        ('kambing_perah_milk_logs', 'tenant_id'),
        ('kambing_perah_lactation_cycles', 'tenant_id'),
        ('kambing_perah_penggemukan_sales', 'tenant_id'),
        ('kambing_perah_penggemukan_weight_records', 'tenant_id'),
        ('kambing_perah_penggemukan_health_logs', 'tenant_id'),
        ('kambing_perah_penggemukan_feed_logs', 'tenant_id'),
        ('kambing_perah_penggemukan_animals', 'tenant_id'),
        ('kambing_perah_penggemukan_batches', 'tenant_id'),
        ('kambing_perah_breeding_weight_records', 'tenant_id'),
        ('kambing_perah_breeding_mating_records', 'tenant_id'),
        ('kambing_perah_breeding_health_logs', 'tenant_id'),
        ('kambing_perah_breeding_feed_logs', 'tenant_id'),
        ('kambing_perah_breeding_births', 'tenant_id'),
        ('kambing_perah_breeding_animals', 'tenant_id'),
        ('kambing_perah_inventory_transactions', 'tenant_id'),
        ('kambing_perah_inventory_items', 'tenant_id'),
        ('kambing_perah_feed_formulations', 'tenant_id'),
        ('kambing_perah_customer_registry', 'tenant_id'),
        ('kambing_perah_animal_groups', 'tenant_id'),
        ('kambing_perah_kandangs', 'tenant_id'),

        -- Egg broker
        ('egg_sale_items', 'tenant_id'),
        ('egg_stock_logs', 'tenant_id'),
        ('egg_payments', 'tenant_id'),
        ('egg_purchases', 'tenant_id'),
        ('egg_sales', 'tenant_id'),
        ('egg_inventory', 'tenant_id'),
        ('egg_customers', 'tenant_id'),
        ('egg_suppliers', 'tenant_id'),

        -- RPA
        ('rpa_invoice_items', 'tenant_id'),
        ('rpa_customer_payments', 'tenant_id'),
        ('rpa_invoices', 'tenant_id'),
        ('rpa_payments', 'tenant_id'),
        ('rpa_payments', 'rpa_tenant_id'),
        ('rpa_purchase_order_items', 'tenant_id'),
        ('rpa_purchase_orders', 'tenant_id'),
        ('rpa_purchase_orders', 'rpa_tenant_id'),
        ('rpa_clients', 'tenant_id'),
        ('rpa_customers', 'tenant_id'),
        ('rpa_products', 'tenant_id'),
        ('rpa_profiles', 'tenant_id'),

        -- Sembako
        ('sembako_sale_items', 'tenant_id'),
        ('sembako_stock_out', 'tenant_id'),
        ('sembako_payroll', 'tenant_id'),
        ('sembako_supplier_payments', 'tenant_id'),
        ('sembako_payments', 'tenant_id'),
        ('sembako_deliveries', 'tenant_id'),
        ('sembako_expenses', 'tenant_id'),
        ('sembako_sales', 'tenant_id'),
        ('sembako_stock_batches', 'tenant_id'),
        ('sembako_products', 'tenant_id'),
        ('sembako_customers', 'tenant_id'),
        ('sembako_suppliers', 'tenant_id'),
        ('sembako_employees', 'tenant_id'),

        -- Market / subscription / misc
        ('generated_invoices', 'tenant_id'),
        ('subscription_invoices', 'tenant_id'),
        ('market_listings', 'tenant_id'),
        ('stock_listings', 'tenant_id'),
        ('notifications', 'tenant_id'),
        ('team_invitations', 'tenant_id'),

        -- Membership / profile last
        ('tenant_memberships', 'tenant_id'),
        ('profiles', 'tenant_id')
    ) AS x(table_name, column_name)
  LOOP
    SELECT to_regclass(format('%I.%I', 'public', r.table_name)) IS NOT NULL
    INTO v_has_table;

    SELECT EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = r.table_name
        AND column_name = r.column_name
    )
    INTO v_has_column;

    IF v_has_table AND v_has_column THEN
      EXECUTE format(
        'DELETE FROM public.%I WHERE %I = $1',
        r.table_name,
        r.column_name
      )
      USING p_tenant_id;
    END IF;
  END LOOP;

  -- ── 5. Final tenant delete ─────────────────────────────────────────────────
  DELETE FROM public.tenants
  WHERE id = p_tenant_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'TENANT_DELETE_FAILED: tenant row was not deleted'
      USING ERRCODE = 'P0001';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.delete_my_business(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.delete_my_business(uuid) TO authenticated;
