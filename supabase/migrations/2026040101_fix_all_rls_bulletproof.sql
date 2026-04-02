-- ============================================================
-- Migration: Fix ALL remaining get_my_tenant_id() RLS policies
-- Replace with bulletproof pattern:
--   tenant_id IN (SELECT tenant_id FROM profiles WHERE auth_user_id = auth.uid())
-- This supports multi-tenant users (user punya profile di banyak tenant).
-- ============================================================

-- ─── 1. Tabel dengan kolom tenant_id langsung ───────────────
DO $$
DECLARE
  t TEXT;
  tables_direct TEXT[] := ARRAY[
    'farms', 'purchases', 'sales', 'deliveries', 'rpa_clients',
    'vehicles', 'drivers', 'loss_reports', 'vehicle_expenses',
    'payments', 'extra_expenses', 'chicken_batches', 'orders',
    'team_invitations', 'notifications', 'subscription_invoices',
    'peternak_farms', 'breeding_cycles', 'daily_records',
    'cycle_expenses', 'harvest_records',
    'egg_suppliers', 'egg_inventory', 'egg_customers', 'egg_sales', 'egg_stock_logs',
    'rpa_profiles', 'rpa_products', 'rpa_customers', 'rpa_invoices',
    'market_listings', 'peternak_profiles', 'broker_profiles'
  ];
BEGIN
  FOREACH t IN ARRAY tables_direct LOOP
    EXECUTE format('DROP POLICY IF EXISTS "Tenant Isolation Policy" ON %I', t);
    EXECUTE format($p$
      CREATE POLICY "Tenant Isolation Policy" ON %I
        USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE auth_user_id = auth.uid()))
        WITH CHECK (tenant_id IN (SELECT tenant_id FROM profiles WHERE auth_user_id = auth.uid()))
    $p$, t);
  END LOOP;
END $$;


-- ─── 2. profiles table — pakai auth_user_id langsung (hindari recursive subquery) ───
DROP POLICY IF EXISTS "Tenant Isolation Policy" ON profiles;
CREATE POLICY "Tenant Isolation Policy" ON profiles
  USING (auth_user_id = auth.uid())
  WITH CHECK (auth_user_id = auth.uid());


-- ─── 3. tenants table ───────────────────────────────────────
DROP POLICY IF EXISTS "Tenants Access Policy" ON tenants;
CREATE POLICY "Tenants Access Policy" ON tenants
  FOR SELECT
  USING (id IN (SELECT tenant_id FROM profiles WHERE auth_user_id = auth.uid()));


-- ─── 4. Inherited policies (tabel tanpa tenant_id langsung) ─

-- egg_sale_items → via egg_sales
DROP POLICY IF EXISTS "Inherited Tenant Policy" ON egg_sale_items;
CREATE POLICY "Inherited Tenant Policy" ON egg_sale_items
  USING (EXISTS (
    SELECT 1 FROM egg_sales
    WHERE egg_sales.id = egg_sale_items.sale_id
      AND egg_sales.tenant_id IN (SELECT tenant_id FROM profiles WHERE auth_user_id = auth.uid())
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM egg_sales
    WHERE egg_sales.id = egg_sale_items.sale_id
      AND egg_sales.tenant_id IN (SELECT tenant_id FROM profiles WHERE auth_user_id = auth.uid())
  ));

-- sembako_sale_items → via sembako_sales
DROP POLICY IF EXISTS "Inherited Tenant Policy" ON sembako_sale_items;
CREATE POLICY "Inherited Tenant Policy" ON sembako_sale_items
  USING (EXISTS (
    SELECT 1 FROM sembako_sales
    WHERE sembako_sales.id = sembako_sale_items.sale_id
      AND sembako_sales.tenant_id IN (SELECT tenant_id FROM profiles WHERE auth_user_id = auth.uid())
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM sembako_sales
    WHERE sembako_sales.id = sembako_sale_items.sale_id
      AND sembako_sales.tenant_id IN (SELECT tenant_id FROM profiles WHERE auth_user_id = auth.uid())
  ));

-- rpa_invoice_items → via rpa_invoices
DROP POLICY IF EXISTS "Inherited Tenant Policy" ON rpa_invoice_items;
CREATE POLICY "Inherited Tenant Policy" ON rpa_invoice_items
  USING (EXISTS (
    SELECT 1 FROM rpa_invoices
    WHERE rpa_invoices.id = rpa_invoice_items.invoice_id
      AND rpa_invoices.tenant_id IN (SELECT tenant_id FROM profiles WHERE auth_user_id = auth.uid())
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM rpa_invoices
    WHERE rpa_invoices.id = rpa_invoice_items.invoice_id
      AND rpa_invoices.tenant_id IN (SELECT tenant_id FROM profiles WHERE auth_user_id = auth.uid())
  ));


-- ─── 5. Verifikasi: tidak boleh ada lagi yang pakai get_my_tenant_id() ─
-- Jalankan ini setelah migration selesai untuk konfirmasi:
-- SELECT tablename, policyname FROM pg_policies
-- WHERE schemaname = 'public'
--   AND (qual ILIKE '%get_my_tenant_id%' OR with_check ILIKE '%get_my_tenant_id%');
-- Hasil harus KOSONG (0 rows).
