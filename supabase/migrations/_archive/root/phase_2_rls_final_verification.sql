-- FINAL RLS VERIFICATION & FIX
-- Author: Antigravity
-- Date: 2026-03-29
-- Deskripsi: Memastikan semua tabel yang dilaporkan Supabase Advisor memiliki policy yang tepat.

-- 1. Standard Tenant Tables (Punya kolom tenant_id)
DO $$
DECLARE
    fix_tables text[] := ARRAY[
        'deliveries', 'drivers', 'egg_inventory', 'egg_sales', 
        'payments', 'rpa_clients', 'sembako_customers', 
        'sembako_products', 'vehicles'
    ];
    t text;
BEGIN
    FOREACH t IN ARRAY fix_tables LOOP
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', t);
        EXECUTE format('DROP POLICY IF EXISTS "Tenant Isolation Policy" ON public.%I;', t);
        EXECUTE format('
            CREATE POLICY "Tenant Isolation Policy" ON public.%I
            FOR ALL TO authenticated
            USING (tenant_id = get_my_tenant_id())
            WITH CHECK (tenant_id = get_my_tenant_id());
        ', t);
    END LOOP;
END $$;

-- 2. Inherited Tenant Tables (Cek via Parent)
-- sembako_stock_batches -> sembako_products
ALTER TABLE public.sembako_stock_batches ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Inherited Tenant Policy" ON public.sembako_stock_batches;
CREATE POLICY "Inherited Tenant Policy" ON public.sembako_stock_batches
FOR ALL TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.sembako_products 
        WHERE id = product_id AND tenant_id = get_my_tenant_id()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.sembako_products 
        WHERE id = product_id AND tenant_id = get_my_tenant_id()
    )
);

-- Tambahan: Pastikan profiles juga aman (Self-access + Tenant-access)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
CREATE POLICY "Users can read own profile" ON public.profiles
FOR SELECT TO authenticated
USING (auth_user_id = auth.uid());

DROP POLICY IF EXISTS "Tenant Isolation Policy" ON public.profiles;
CREATE POLICY "Tenant Isolation Policy" ON public.profiles
FOR ALL TO authenticated
USING (tenant_id = get_my_tenant_id());
