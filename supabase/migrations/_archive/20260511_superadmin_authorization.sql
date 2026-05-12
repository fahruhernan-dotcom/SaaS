-- =========================================================
-- SUPERADMIN AUTHORIZATION & POLICIES
-- Implementation of centralized is_superadmin() and automated policy generation
-- Date: 2026-05-11
-- =========================================================

-- 1. HELPER FUNCTION
CREATE OR REPLACE FUNCTION public.is_superadmin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.auth_user_id = auth.uid()
    AND (
      lower(p.app_role) = 'superadmin' OR
      lower(p.role) = 'superadmin' OR
      lower(p.user_type) = 'superadmin'
    )
  );
$$;

-- 2. POLICIES (Unrolled to prevent deadlocks)
-- Table: tenants
DROP POLICY IF EXISTS tenants_superadmin_delete ON public.tenants;
DROP POLICY IF EXISTS tenants_superadmin_select ON public.tenants;
DROP POLICY IF EXISTS tenants_superadmin_update ON public.tenants;
DROP POLICY IF EXISTS tenants_superadmin_all ON public.tenants;
CREATE POLICY tenants_superadmin_all ON public.tenants FOR ALL TO authenticated USING (public.is_superadmin()) WITH CHECK (public.is_superadmin());

-- Table: profiles
DROP POLICY IF EXISTS profiles_superadmin_delete ON public.profiles;
DROP POLICY IF EXISTS profiles_superadmin_select ON public.profiles;
DROP POLICY IF EXISTS profiles_superadmin_update ON public.profiles;
DROP POLICY IF EXISTS profiles_superadmin_all ON public.profiles;
CREATE POLICY profiles_superadmin_all ON public.profiles FOR ALL TO authenticated USING (public.is_superadmin()) WITH CHECK (public.is_superadmin());

-- Table: tenant_memberships
DROP POLICY IF EXISTS tenant_memberships_superadmin_delete ON public.tenant_memberships;
DROP POLICY IF EXISTS tenant_memberships_superadmin_select ON public.tenant_memberships;
DROP POLICY IF EXISTS tenant_memberships_superadmin_update ON public.tenant_memberships;
DROP POLICY IF EXISTS tenant_memberships_superadmin_all ON public.tenant_memberships;
CREATE POLICY tenant_memberships_superadmin_all ON public.tenant_memberships FOR ALL TO authenticated USING (public.is_superadmin()) WITH CHECK (public.is_superadmin());

-- Table: subscription_invoices
DROP POLICY IF EXISTS subscription_invoices_superadmin_delete ON public.subscription_invoices;
DROP POLICY IF EXISTS subscription_invoices_superadmin_select ON public.subscription_invoices;
DROP POLICY IF EXISTS subscription_invoices_superadmin_update ON public.subscription_invoices;
DROP POLICY IF EXISTS subscription_invoices_superadmin_all ON public.subscription_invoices;
CREATE POLICY subscription_invoices_superadmin_all ON public.subscription_invoices FOR ALL TO authenticated USING (public.is_superadmin()) WITH CHECK (public.is_superadmin());

-- Table: ai_anomaly_logs
DROP POLICY IF EXISTS ai_anomaly_logs_superadmin_delete ON public.ai_anomaly_logs;
DROP POLICY IF EXISTS ai_anomaly_logs_superadmin_select ON public.ai_anomaly_logs;
DROP POLICY IF EXISTS ai_anomaly_logs_superadmin_update ON public.ai_anomaly_logs;
DROP POLICY IF EXISTS ai_anomaly_logs_superadmin_all ON public.ai_anomaly_logs;
CREATE POLICY ai_anomaly_logs_superadmin_all ON public.ai_anomaly_logs FOR ALL TO authenticated USING (public.is_superadmin()) WITH CHECK (public.is_superadmin());

-- Table: ai_staged_transactions
DROP POLICY IF EXISTS ai_staged_transactions_superadmin_delete ON public.ai_staged_transactions;
DROP POLICY IF EXISTS ai_staged_transactions_superadmin_select ON public.ai_staged_transactions;
DROP POLICY IF EXISTS ai_staged_transactions_superadmin_update ON public.ai_staged_transactions;
DROP POLICY IF EXISTS ai_staged_transactions_superadmin_all ON public.ai_staged_transactions;
CREATE POLICY ai_staged_transactions_superadmin_all ON public.ai_staged_transactions FOR ALL TO authenticated USING (public.is_superadmin()) WITH CHECK (public.is_superadmin());

-- Table: generated_invoices
DROP POLICY IF EXISTS generated_invoices_superadmin_delete ON public.generated_invoices;
DROP POLICY IF EXISTS generated_invoices_superadmin_select ON public.generated_invoices;
DROP POLICY IF EXISTS generated_invoices_superadmin_update ON public.generated_invoices;
DROP POLICY IF EXISTS generated_invoices_superadmin_all ON public.generated_invoices;
CREATE POLICY generated_invoices_superadmin_all ON public.generated_invoices FOR ALL TO authenticated USING (public.is_superadmin()) WITH CHECK (public.is_superadmin());

-- Table: global_audit_logs
DROP POLICY IF EXISTS global_audit_logs_superadmin_delete ON public.global_audit_logs;
DROP POLICY IF EXISTS global_audit_logs_superadmin_select ON public.global_audit_logs;
DROP POLICY IF EXISTS global_audit_logs_superadmin_update ON public.global_audit_logs;
DROP POLICY IF EXISTS global_audit_logs_superadmin_all ON public.global_audit_logs;
CREATE POLICY global_audit_logs_superadmin_all ON public.global_audit_logs FOR ALL TO authenticated USING (public.is_superadmin()) WITH CHECK (public.is_superadmin());

-- Table: broker_profiles
DROP POLICY IF EXISTS broker_profiles_superadmin_delete ON public.broker_profiles;
DROP POLICY IF EXISTS broker_profiles_superadmin_select ON public.broker_profiles;
DROP POLICY IF EXISTS broker_profiles_superadmin_update ON public.broker_profiles;
DROP POLICY IF EXISTS broker_profiles_superadmin_all ON public.broker_profiles;
CREATE POLICY broker_profiles_superadmin_all ON public.broker_profiles FOR ALL TO authenticated USING (public.is_superadmin()) WITH CHECK (public.is_superadmin());

-- Table: peternak_profiles
DROP POLICY IF EXISTS peternak_profiles_superadmin_delete ON public.peternak_profiles;
DROP POLICY IF EXISTS peternak_profiles_superadmin_select ON public.peternak_profiles;
DROP POLICY IF EXISTS peternak_profiles_superadmin_update ON public.peternak_profiles;
DROP POLICY IF EXISTS peternak_profiles_superadmin_all ON public.peternak_profiles;
CREATE POLICY peternak_profiles_superadmin_all ON public.peternak_profiles FOR ALL TO authenticated USING (public.is_superadmin()) WITH CHECK (public.is_superadmin());

-- Table: broker_connections
DROP POLICY IF EXISTS broker_connections_superadmin_delete ON public.broker_connections;
DROP POLICY IF EXISTS broker_connections_superadmin_select ON public.broker_connections;
DROP POLICY IF EXISTS broker_connections_superadmin_update ON public.broker_connections;
DROP POLICY IF EXISTS broker_connections_superadmin_all ON public.broker_connections;
CREATE POLICY broker_connections_superadmin_all ON public.broker_connections FOR ALL TO authenticated USING (public.is_superadmin()) WITH CHECK (public.is_superadmin());

-- Table: cycle_expenses
DROP POLICY IF EXISTS cycle_expenses_superadmin_delete ON public.cycle_expenses;
DROP POLICY IF EXISTS cycle_expenses_superadmin_select ON public.cycle_expenses;
DROP POLICY IF EXISTS cycle_expenses_superadmin_update ON public.cycle_expenses;
DROP POLICY IF EXISTS cycle_expenses_superadmin_all ON public.cycle_expenses;
CREATE POLICY cycle_expenses_superadmin_all ON public.cycle_expenses FOR ALL TO authenticated USING (public.is_superadmin()) WITH CHECK (public.is_superadmin());

-- Table: harvest_records
DROP POLICY IF EXISTS harvest_records_superadmin_delete ON public.harvest_records;
DROP POLICY IF EXISTS harvest_records_superadmin_select ON public.harvest_records;
DROP POLICY IF EXISTS harvest_records_superadmin_update ON public.harvest_records;
DROP POLICY IF EXISTS harvest_records_superadmin_all ON public.harvest_records;
CREATE POLICY harvest_records_superadmin_all ON public.harvest_records FOR ALL TO authenticated USING (public.is_superadmin()) WITH CHECK (public.is_superadmin());

-- Table: kandang_workers
DROP POLICY IF EXISTS kandang_workers_superadmin_delete ON public.kandang_workers;
DROP POLICY IF EXISTS kandang_workers_superadmin_select ON public.kandang_workers;
DROP POLICY IF EXISTS kandang_workers_superadmin_update ON public.kandang_workers;
DROP POLICY IF EXISTS kandang_workers_superadmin_all ON public.kandang_workers;
CREATE POLICY kandang_workers_superadmin_all ON public.kandang_workers FOR ALL TO authenticated USING (public.is_superadmin()) WITH CHECK (public.is_superadmin());

-- Table: worker_payments
DROP POLICY IF EXISTS worker_payments_superadmin_delete ON public.worker_payments;
DROP POLICY IF EXISTS worker_payments_superadmin_select ON public.worker_payments;
DROP POLICY IF EXISTS worker_payments_superadmin_update ON public.worker_payments;
DROP POLICY IF EXISTS worker_payments_superadmin_all ON public.worker_payments;
CREATE POLICY worker_payments_superadmin_all ON public.worker_payments FOR ALL TO authenticated USING (public.is_superadmin()) WITH CHECK (public.is_superadmin());

-- Table: market_listings
DROP POLICY IF EXISTS market_listings_superadmin_delete ON public.market_listings;
DROP POLICY IF EXISTS market_listings_superadmin_select ON public.market_listings;
DROP POLICY IF EXISTS market_listings_superadmin_update ON public.market_listings;
DROP POLICY IF EXISTS market_listings_superadmin_all ON public.market_listings;
CREATE POLICY market_listings_superadmin_all ON public.market_listings FOR ALL TO authenticated USING (public.is_superadmin()) WITH CHECK (public.is_superadmin());

-- Table: rpa_customer_payments
DROP POLICY IF EXISTS rpa_customer_payments_superadmin_delete ON public.rpa_customer_payments;
DROP POLICY IF EXISTS rpa_customer_payments_superadmin_select ON public.rpa_customer_payments;
DROP POLICY IF EXISTS rpa_customer_payments_superadmin_update ON public.rpa_customer_payments;
DROP POLICY IF EXISTS rpa_customer_payments_superadmin_all ON public.rpa_customer_payments;
CREATE POLICY rpa_customer_payments_superadmin_all ON public.rpa_customer_payments FOR ALL TO authenticated USING (public.is_superadmin()) WITH CHECK (public.is_superadmin());

-- Table: rpa_invoices
DROP POLICY IF EXISTS rpa_invoices_superadmin_delete ON public.rpa_invoices;
DROP POLICY IF EXISTS rpa_invoices_superadmin_select ON public.rpa_invoices;
DROP POLICY IF EXISTS rpa_invoices_superadmin_update ON public.rpa_invoices;
DROP POLICY IF EXISTS rpa_invoices_superadmin_all ON public.rpa_invoices;
CREATE POLICY rpa_invoices_superadmin_all ON public.rpa_invoices FOR ALL TO authenticated USING (public.is_superadmin()) WITH CHECK (public.is_superadmin());

-- Table: rpa_customers
DROP POLICY IF EXISTS rpa_customers_superadmin_delete ON public.rpa_customers;
DROP POLICY IF EXISTS rpa_customers_superadmin_select ON public.rpa_customers;
DROP POLICY IF EXISTS rpa_customers_superadmin_update ON public.rpa_customers;
DROP POLICY IF EXISTS rpa_customers_superadmin_all ON public.rpa_customers;
CREATE POLICY rpa_customers_superadmin_all ON public.rpa_customers FOR ALL TO authenticated USING (public.is_superadmin()) WITH CHECK (public.is_superadmin());

-- Table: rpa_products
DROP POLICY IF EXISTS rpa_products_superadmin_delete ON public.rpa_products;
DROP POLICY IF EXISTS rpa_products_superadmin_select ON public.rpa_products;
DROP POLICY IF EXISTS rpa_products_superadmin_update ON public.rpa_products;
DROP POLICY IF EXISTS rpa_products_superadmin_all ON public.rpa_products;
CREATE POLICY rpa_products_superadmin_all ON public.rpa_products FOR ALL TO authenticated USING (public.is_superadmin()) WITH CHECK (public.is_superadmin());

-- Table: sembako_stock_out
DROP POLICY IF EXISTS sembako_stock_out_superadmin_delete ON public.sembako_stock_out;
DROP POLICY IF EXISTS sembako_stock_out_superadmin_select ON public.sembako_stock_out;
DROP POLICY IF EXISTS sembako_stock_out_superadmin_update ON public.sembako_stock_out;
DROP POLICY IF EXISTS sembako_stock_out_superadmin_all ON public.sembako_stock_out;
CREATE POLICY sembako_stock_out_superadmin_all ON public.sembako_stock_out FOR ALL TO authenticated USING (public.is_superadmin()) WITH CHECK (public.is_superadmin());

-- Table: sembako_payroll
DROP POLICY IF EXISTS sembako_payroll_superadmin_delete ON public.sembako_payroll;
DROP POLICY IF EXISTS sembako_payroll_superadmin_select ON public.sembako_payroll;
DROP POLICY IF EXISTS sembako_payroll_superadmin_update ON public.sembako_payroll;
DROP POLICY IF EXISTS sembako_payroll_superadmin_all ON public.sembako_payroll;
CREATE POLICY sembako_payroll_superadmin_all ON public.sembako_payroll FOR ALL TO authenticated USING (public.is_superadmin()) WITH CHECK (public.is_superadmin());

-- Table: sembako_supplier_payments
DROP POLICY IF EXISTS sembako_supplier_payments_superadmin_delete ON public.sembako_supplier_payments;
DROP POLICY IF EXISTS sembako_supplier_payments_superadmin_select ON public.sembako_supplier_payments;
DROP POLICY IF EXISTS sembako_supplier_payments_superadmin_update ON public.sembako_supplier_payments;
DROP POLICY IF EXISTS sembako_supplier_payments_superadmin_all ON public.sembako_supplier_payments;
CREATE POLICY sembako_supplier_payments_superadmin_all ON public.sembako_supplier_payments FOR ALL TO authenticated USING (public.is_superadmin()) WITH CHECK (public.is_superadmin());

-- Table: sembako_payments
DROP POLICY IF EXISTS sembako_payments_superadmin_delete ON public.sembako_payments;
DROP POLICY IF EXISTS sembako_payments_superadmin_select ON public.sembako_payments;
DROP POLICY IF EXISTS sembako_payments_superadmin_update ON public.sembako_payments;
DROP POLICY IF EXISTS sembako_payments_superadmin_all ON public.sembako_payments;
CREATE POLICY sembako_payments_superadmin_all ON public.sembako_payments FOR ALL TO authenticated USING (public.is_superadmin()) WITH CHECK (public.is_superadmin());

-- Table: sembako_deliveries
DROP POLICY IF EXISTS sembako_deliveries_superadmin_delete ON public.sembako_deliveries;
DROP POLICY IF EXISTS sembako_deliveries_superadmin_select ON public.sembako_deliveries;
DROP POLICY IF EXISTS sembako_deliveries_superadmin_update ON public.sembako_deliveries;
DROP POLICY IF EXISTS sembako_deliveries_superadmin_all ON public.sembako_deliveries;
CREATE POLICY sembako_deliveries_superadmin_all ON public.sembako_deliveries FOR ALL TO authenticated USING (public.is_superadmin()) WITH CHECK (public.is_superadmin());

-- Table: sembako_expenses
DROP POLICY IF EXISTS sembako_expenses_superadmin_delete ON public.sembako_expenses;
DROP POLICY IF EXISTS sembako_expenses_superadmin_select ON public.sembako_expenses;
DROP POLICY IF EXISTS sembako_expenses_superadmin_update ON public.sembako_expenses;
DROP POLICY IF EXISTS sembako_expenses_superadmin_all ON public.sembako_expenses;
CREATE POLICY sembako_expenses_superadmin_all ON public.sembako_expenses FOR ALL TO authenticated USING (public.is_superadmin()) WITH CHECK (public.is_superadmin());

-- Table: sembako_sales
DROP POLICY IF EXISTS sembako_sales_superadmin_delete ON public.sembako_sales;
DROP POLICY IF EXISTS sembako_sales_superadmin_select ON public.sembako_sales;
DROP POLICY IF EXISTS sembako_sales_superadmin_update ON public.sembako_sales;
DROP POLICY IF EXISTS sembako_sales_superadmin_all ON public.sembako_sales;
CREATE POLICY sembako_sales_superadmin_all ON public.sembako_sales FOR ALL TO authenticated USING (public.is_superadmin()) WITH CHECK (public.is_superadmin());

-- Table: sembako_stock_batches
DROP POLICY IF EXISTS sembako_stock_batches_superadmin_delete ON public.sembako_stock_batches;
DROP POLICY IF EXISTS sembako_stock_batches_superadmin_select ON public.sembako_stock_batches;
DROP POLICY IF EXISTS sembako_stock_batches_superadmin_update ON public.sembako_stock_batches;
DROP POLICY IF EXISTS sembako_stock_batches_superadmin_all ON public.sembako_stock_batches;
CREATE POLICY sembako_stock_batches_superadmin_all ON public.sembako_stock_batches FOR ALL TO authenticated USING (public.is_superadmin()) WITH CHECK (public.is_superadmin());

-- Table: sembako_products
DROP POLICY IF EXISTS sembako_products_superadmin_delete ON public.sembako_products;
DROP POLICY IF EXISTS sembako_products_superadmin_select ON public.sembako_products;
DROP POLICY IF EXISTS sembako_products_superadmin_update ON public.sembako_products;
DROP POLICY IF EXISTS sembako_products_superadmin_all ON public.sembako_products;
CREATE POLICY sembako_products_superadmin_all ON public.sembako_products FOR ALL TO authenticated USING (public.is_superadmin()) WITH CHECK (public.is_superadmin());

-- Table: sembako_customers
DROP POLICY IF EXISTS sembako_customers_superadmin_delete ON public.sembako_customers;
DROP POLICY IF EXISTS sembako_customers_superadmin_select ON public.sembako_customers;
DROP POLICY IF EXISTS sembako_customers_superadmin_update ON public.sembako_customers;
DROP POLICY IF EXISTS sembako_customers_superadmin_all ON public.sembako_customers;
CREATE POLICY sembako_customers_superadmin_all ON public.sembako_customers FOR ALL TO authenticated USING (public.is_superadmin()) WITH CHECK (public.is_superadmin());

-- Table: sembako_suppliers
DROP POLICY IF EXISTS sembako_suppliers_superadmin_delete ON public.sembako_suppliers;
DROP POLICY IF EXISTS sembako_suppliers_superadmin_select ON public.sembako_suppliers;
DROP POLICY IF EXISTS sembako_suppliers_superadmin_update ON public.sembako_suppliers;
DROP POLICY IF EXISTS sembako_suppliers_superadmin_all ON public.sembako_suppliers;
CREATE POLICY sembako_suppliers_superadmin_all ON public.sembako_suppliers FOR ALL TO authenticated USING (public.is_superadmin()) WITH CHECK (public.is_superadmin());

-- Table: sembako_employees
DROP POLICY IF EXISTS sembako_employees_superadmin_delete ON public.sembako_employees;
DROP POLICY IF EXISTS sembako_employees_superadmin_select ON public.sembako_employees;
DROP POLICY IF EXISTS sembako_employees_superadmin_update ON public.sembako_employees;
DROP POLICY IF EXISTS sembako_employees_superadmin_all ON public.sembako_employees;
CREATE POLICY sembako_employees_superadmin_all ON public.sembako_employees FOR ALL TO authenticated USING (public.is_superadmin()) WITH CHECK (public.is_superadmin());

-- Table: rpa_payments
DROP POLICY IF EXISTS rpa_payments_superadmin_delete ON public.rpa_payments;
DROP POLICY IF EXISTS rpa_payments_superadmin_select ON public.rpa_payments;
DROP POLICY IF EXISTS rpa_payments_superadmin_update ON public.rpa_payments;
DROP POLICY IF EXISTS rpa_payments_superadmin_all ON public.rpa_payments;
CREATE POLICY rpa_payments_superadmin_all ON public.rpa_payments FOR ALL TO authenticated USING (public.is_superadmin()) WITH CHECK (public.is_superadmin());

-- Table: rpa_purchase_orders
DROP POLICY IF EXISTS rpa_purchase_orders_superadmin_delete ON public.rpa_purchase_orders;
DROP POLICY IF EXISTS rpa_purchase_orders_superadmin_select ON public.rpa_purchase_orders;
DROP POLICY IF EXISTS rpa_purchase_orders_superadmin_update ON public.rpa_purchase_orders;
DROP POLICY IF EXISTS rpa_purchase_orders_superadmin_all ON public.rpa_purchase_orders;
CREATE POLICY rpa_purchase_orders_superadmin_all ON public.rpa_purchase_orders FOR ALL TO authenticated USING (public.is_superadmin()) WITH CHECK (public.is_superadmin());

