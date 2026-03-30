-- ==========================================
-- PHASE 2: SUPABASE RLS HARDENING (FIXED)
-- ==========================================
-- Deskripsi: Mengaktifkan isolasi data antar-tenant (bisnis)
-- Perbaikan: Menangani tabel yang tidak punya kolom tenant_id secara langsung (Inherited RLS)

-- 1. FUNGSI HELPER: Ambil tenant_id pengguna aktif
CREATE OR REPLACE FUNCTION public.get_my_tenant_id()
RETURNS uuid AS $$
  SELECT tenant_id FROM public.profiles 
  WHERE auth_user_id = auth.uid() 
  AND is_active = true
  LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- 2. KATEGORI TABEL: STANDARD (Punya kolom tenant_id)
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
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', t);
        EXECUTE format('DROP POLICY IF EXISTS "Tenant Isolation Policy" ON public.%I;', t);
        EXECUTE format('
            CREATE POLICY "Tenant Isolation Policy" ON public.%I
            FOR ALL USING (tenant_id = get_my_tenant_id());
        ', t);
    END LOOP;
END $$;

-- 3. KATEGORI TABEL: INHERITED (Tidak punya tenant_id, cek via Parent)
-- egg_sale_items -> egg_sales
ALTER TABLE public.egg_sale_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Inherited Tenant Policy" ON public.egg_sale_items;
CREATE POLICY "Inherited Tenant Policy" ON public.egg_sale_items
FOR ALL USING (
    EXISTS (SELECT 1 FROM public.egg_sales WHERE id = sale_id AND tenant_id = get_my_tenant_id())
);

-- sembako_sale_items -> sembako_sales
ALTER TABLE public.sembako_sale_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Inherited Tenant Policy" ON public.sembako_sale_items;
CREATE POLICY "Inherited Tenant Policy" ON public.sembako_sale_items
FOR ALL USING (
    EXISTS (SELECT 1 FROM public.sembako_sales WHERE id = sale_id AND tenant_id = get_my_tenant_id())
);

-- rpa_invoice_items -> rpa_invoices
ALTER TABLE public.rpa_invoice_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Inherited Tenant Policy" ON public.rpa_invoice_items;
CREATE POLICY "Inherited Tenant Policy" ON public.rpa_invoice_items
FOR ALL USING (
    EXISTS (SELECT 1 FROM public.rpa_invoices WHERE id = invoice_id AND tenant_id = get_my_tenant_id())
);

-- sembako_stock_batches -> sembako_products
ALTER TABLE public.sembako_stock_batches ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Inherited Tenant Policy" ON public.sembako_stock_batches;
CREATE POLICY "Inherited Tenant Policy" ON public.sembako_stock_batches
FOR ALL USING (
    EXISTS (SELECT 1 FROM public.sembako_products WHERE id = product_id AND tenant_id = get_my_tenant_id())
);

-- sembako_payroll -> sembako_employees
ALTER TABLE public.sembako_payroll ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Inherited Tenant Policy" ON public.sembako_payroll;
CREATE POLICY "Inherited Tenant Policy" ON public.sembako_payroll
FOR ALL USING (
    EXISTS (SELECT 1 FROM public.sembako_employees WHERE id = employee_id AND tenant_id = get_my_tenant_id())
);

-- 4. KATEGORI KHUSUS (tenants & global)

-- Tenants: Root access
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenants Access Policy" ON public.tenants;
CREATE POLICY "Tenants Access Policy" ON public.tenants
FOR ALL USING (id = get_my_tenant_id());

-- Market Prices: Public Read, Admin Write
ALTER TABLE public.market_prices ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Read Market Prices" ON public.market_prices;
CREATE POLICY "Public Read Market Prices" ON public.market_prices
FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Admin Write Market Prices" ON public.market_prices;
CREATE POLICY "Admin Write Market Prices" ON public.market_prices
FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE auth_user_id = auth.uid() AND role = 'superadmin')
);

-- profiles: Setiap user harus bisa baca profilenya sendiri saat login
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
CREATE POLICY "Users can read own profile" ON public.profiles
FOR SELECT USING (auth_user_id = auth.uid());

-- team_invitations: Public can read invitations by token (for onboarding)
DROP POLICY IF EXISTS "Public can read invitations by token" ON public.team_invitations;
CREATE POLICY "Public can read invitations by token" ON public.team_invitations
FOR SELECT TO anon, authenticated USING (status = 'pending');

-- ==========================================
-- SELESAI: Database Anda sekarang benar-benar terisolasi.
-- ==========================================
