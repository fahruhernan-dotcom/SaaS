-- ==========================================
-- EMERGENCY RLS RESTORE PATCH
-- Deskripsi: Mengembalikan policy RLS yang terhapus karena efek CASCADE.
-- ==========================================

-- 1. Pastikan fungsi Helper aman (tanpa CASCADE drop untuk menghindari penghapusan policy)
CREATE OR REPLACE FUNCTION public.get_my_tenant_id()
 RETURNS uuid
 LANGUAGE plpgsql
 STABLE
 SECURITY DEFINER
 SET search_path = public
AS $$
DECLARE
  _tenant_id uuid;
BEGIN
  SELECT tenant_id INTO _tenant_id
  FROM public.profiles
  WHERE auth_user_id = auth.uid()
  LIMIT 1;
  RETURN _tenant_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.is_my_tenant(_tenant_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE
 SECURITY DEFINER
 SET search_path = public
AS $$
BEGIN
  RETURN _tenant_id = get_my_tenant_id();
END;
$$;

-- 2. Restore KATEGORI TABEL STANDARD
DO $$
DECLARE
    standard_tables text[] := ARRAY[
        'profiles', 'farms', 'purchases', 'sales', 'deliveries', 
        'rpa_clients', 'vehicles', 'drivers', 'loss_reports', 'vehicle_expenses', 
        'payments', 'extra_expenses', 'chicken_batches', 'orders', 
        'team_invitations', 'notifications', 'subscription_invoices',
        'peternak_farms', 'breeding_cycles', 'daily_records', 'cycle_expenses', 
        'harvest_records', 'egg_suppliers', 'egg_inventory', 'egg_customers', 
        'egg_sales', 'egg_stock_logs', 'sembako_products', 'sembako_suppliers', 
        'sembako_customers', 'sembako_sales', 'sembako_payments', 'sembako_employees', 
        'sembako_expenses', 'rpa_profiles', 'rpa_products', 'rpa_customers', 
        'rpa_invoices', 'market_listings', 'peternak_profiles', 'broker_profiles'
    ];
    t text;
BEGIN
    FOREACH t IN ARRAY standard_tables LOOP
        -- Aktifkan RLS
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', t);
        -- Bersihkan policy lama (jika ada)
        EXECUTE format('DROP POLICY IF EXISTS "Tenant Isolation Policy" ON public.%I;', t);
        -- Buat ulang policy dengan `FOR ALL` dan `WITH CHECK`
        EXECUTE format('
            CREATE POLICY "Tenant Isolation Policy" ON public.%I
            FOR ALL TO authenticated
            USING (tenant_id = get_my_tenant_id())
            WITH CHECK (tenant_id = get_my_tenant_id());
        ', t);
    END LOOP;
END $$;

-- 3. Restore KATEGORI TABEL INHERITED (Child Tables)
-- (Sembako Stock Batches)
ALTER TABLE public.sembako_stock_batches ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Inherited Tenant Policy" ON public.sembako_stock_batches;
CREATE POLICY "Inherited Tenant Policy" ON public.sembako_stock_batches FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.sembako_products WHERE id = product_id AND tenant_id = get_my_tenant_id()))
WITH CHECK (EXISTS (SELECT 1 FROM public.sembako_products WHERE id = product_id AND tenant_id = get_my_tenant_id()));

-- (Egg Sale Items)
ALTER TABLE public.egg_sale_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Inherited Tenant Policy" ON public.egg_sale_items;
CREATE POLICY "Inherited Tenant Policy" ON public.egg_sale_items FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.egg_sales WHERE id = sale_id AND tenant_id = get_my_tenant_id()))
WITH CHECK (EXISTS (SELECT 1 FROM public.egg_sales WHERE id = sale_id AND tenant_id = get_my_tenant_id()));

-- (Sembako Sale Items)
ALTER TABLE public.sembako_sale_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Inherited Tenant Policy" ON public.sembako_sale_items;
CREATE POLICY "Inherited Tenant Policy" ON public.sembako_sale_items FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.sembako_sales WHERE id = sale_id AND tenant_id = get_my_tenant_id()))
WITH CHECK (EXISTS (SELECT 1 FROM public.sembako_sales WHERE id = sale_id AND tenant_id = get_my_tenant_id()));

-- (RPA Invoice Items)
ALTER TABLE public.rpa_invoice_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Inherited Tenant Policy" ON public.rpa_invoice_items;
CREATE POLICY "Inherited Tenant Policy" ON public.rpa_invoice_items FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.rpa_invoices WHERE id = invoice_id AND tenant_id = get_my_tenant_id()))
WITH CHECK (EXISTS (SELECT 1 FROM public.rpa_invoices WHERE id = invoice_id AND tenant_id = get_my_tenant_id()));

-- (Sembako Payroll)
ALTER TABLE public.sembako_payroll ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Inherited Tenant Policy" ON public.sembako_payroll;
CREATE POLICY "Inherited Tenant Policy" ON public.sembako_payroll FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.sembako_employees WHERE id = employee_id AND tenant_id = get_my_tenant_id()))
WITH CHECK (EXISTS (SELECT 1 FROM public.sembako_employees WHERE id = employee_id AND tenant_id = get_my_tenant_id()));

-- 4. KATEGORI KHUSUS
-- profiles: Users can read own profile
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
CREATE POLICY "Users can read own profile" ON public.profiles FOR SELECT USING (auth_user_id = auth.uid());

-- Tenants: Root access
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenants Access Policy" ON public.tenants;
CREATE POLICY "Tenants Access Policy" ON public.tenants FOR ALL TO authenticated USING (id = get_my_tenant_id());

-- Market Prices: Public Read, Admin Write
ALTER TABLE public.market_prices ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Read Market Prices" ON public.market_prices;
CREATE POLICY "Public Read Market Prices" ON public.market_prices FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Admin Write Market Prices" ON public.market_prices;
CREATE POLICY "Admin Write Market Prices" ON public.market_prices
FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE auth_user_id = auth.uid() AND role = 'superadmin'));

-- team_invitations: Public can read invitations by token (for onboarding)
DROP POLICY IF EXISTS "Public can read invitations by token" ON public.team_invitations;
CREATE POLICY "Public can read invitations by token" ON public.team_invitations FOR SELECT TO anon, authenticated USING (status = 'pending');
