-- 1. Fix BUG: `profiles.id = auth.uid()`
-- -------------------------------------------------------------------------
-- Deliveries
DROP POLICY IF EXISTS "Tenant Isolation Policy" ON public.deliveries;
DROP POLICY IF EXISTS "Deliveries Tenant Isolation" ON public.deliveries;

CREATE POLICY "Tenant Isolation Policy" ON public.deliveries
FOR ALL USING (
    tenant_id IN (
        SELECT tenant_id 
        FROM public.profiles 
        WHERE auth_user_id = auth.uid()
    )
);

-- Drivers
DROP POLICY IF EXISTS "Tenant Isolation Policy" ON public.drivers;
DROP POLICY IF EXISTS "Drivers Tenant Isolation" ON public.drivers;

CREATE POLICY "Tenant Isolation Policy" ON public.drivers
FOR ALL USING (
    tenant_id IN (
        SELECT tenant_id 
        FROM public.profiles 
        WHERE auth_user_id = auth.uid()
    )
);

-- Kandang Workers
DROP POLICY IF EXISTS "kandang_workers_tenant_isolation" ON public.kandang_workers;
DROP POLICY IF EXISTS "tenant_kandang_workers" ON public.kandang_workers;
DROP POLICY IF EXISTS "superadmin_delete" ON public.kandang_workers;

CREATE POLICY "Tenant Isolation Policy" ON public.kandang_workers
FOR ALL USING (
    tenant_id IN (
        SELECT tenant_id 
        FROM public.profiles 
        WHERE auth_user_id = auth.uid()
    )
);


-- 2. Clean Up: market_prices (Crowd-Sourced Logic)
-- -------------------------------------------------------------------------
-- DROP ALL existing policies to clean the slate
DROP POLICY IF EXISTS "Allow public read access for market prices" ON public.market_prices;
DROP POLICY IF EXISTS "Public Read Market Prices" ON public.market_prices;
DROP POLICY IF EXISTS "market_read" ON public.market_prices;
DROP POLICY IF EXISTS "Admin Write Market Prices" ON public.market_prices;
DROP POLICY IF EXISTS "Allow admins to manage market prices" ON public.market_prices;
DROP POLICY IF EXISTS "market_write_superadmin" ON public.market_prices;
DROP POLICY IF EXISTS "Allow service role full access to market prices" ON public.market_prices;
DROP POLICY IF EXISTS "Authenticated Insert/Update Market Prices" ON public.market_prices;
DROP POLICY IF EXISTS "Scraper Anon Insert Arboge" ON public.market_prices;
DROP POLICY IF EXISTS "Scraper can insert market prices" ON public.market_prices;

-- CREATE the 3 correct, optimized policies

-- A. Public Read (Anyone can see the prices)
CREATE POLICY "Public Read Market Prices" 
ON public.market_prices FOR SELECT 
USING (true);

-- B. Authenticated Manage (User login bisa Create/Update/Delete)
CREATE POLICY "Authenticated Manage Market Prices" 
ON public.market_prices FOR ALL 
USING (auth.role() = 'authenticated') 
WITH CHECK (auth.role() = 'authenticated');

-- C. Scraper Insert (Untuk bot auto-scraper tanpa login)
CREATE POLICY "Scraper Anon Insert" 
ON public.market_prices FOR INSERT 
WITH CHECK (source IN ('auto_scraper', 'arboge_scraper', 'arboge_referensi', 'arboge_realisasi', 'arboge_domba', 'arboge_sapi'));
