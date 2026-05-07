-- ══════════════════════════════════════════════════════════════════════
-- PRIORITY 1 FIX: RLS BUGS & SECURITY HOLES
-- Memperbaiki bug auth_user_id dan membersihkan overlapping policies
-- ══════════════════════════════════════════════════════════════════════

BEGIN;

-- ─────────────────────────────────────────────────────────────────────
-- 1. FIX BUG: profiles.id = auth.uid() pada tabel operasional
-- ─────────────────────────────────────────────────────────────────────

-- A. deliveries
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

-- B. drivers
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

-- C. kandang_workers
DROP POLICY IF EXISTS "kandang_workers_tenant_isolation" ON public.kandang_workers;
DROP POLICY IF EXISTS "tenant_kandang_workers" ON public.kandang_workers;
DROP POLICY IF EXISTS "superadmin_delete" ON public.kandang_workers;
DROP POLICY IF EXISTS "Tenant Isolation Policy" ON public.kandang_workers;

CREATE POLICY "Tenant Isolation Policy" ON public.kandang_workers
FOR ALL USING (
    tenant_id IN (
        SELECT tenant_id 
        FROM public.profiles 
        WHERE auth_user_id = auth.uid()
    )
);

-- ─────────────────────────────────────────────────────────────────────
-- 2. CLEAN UP: market_prices (Crowd-Sourced Logic)
-- Menyederhanakan 10+ policy duplikat menjadi 3 policy bersih
-- Termasuk mengakomodasi scraper Arboge dan Chick-in
-- ─────────────────────────────────────────────────────────────────────

-- DROP ALL existing policies untuk membersihkan slate
DROP POLICY IF EXISTS "Allow public read access for market prices" ON public.market_prices;
DROP POLICY IF EXISTS "Public Read Market Prices" ON public.market_prices;
DROP POLICY IF EXISTS "market_read" ON public.market_prices;
DROP POLICY IF EXISTS "Admin Write Market Prices" ON public.market_prices;
DROP POLICY IF EXISTS "Allow admins to manage market prices" ON public.market_prices;
DROP POLICY IF EXISTS "market_write_superadmin" ON public.market_prices;
DROP POLICY IF EXISTS "Allow service role full access to market prices" ON public.market_prices;
DROP POLICY IF EXISTS "Authenticated Insert/Update Market Prices" ON public.market_prices;
DROP POLICY IF EXISTS "Authenticated Manage Market Prices" ON public.market_prices;
DROP POLICY IF EXISTS "Scraper Anon Insert Arboge" ON public.market_prices;
DROP POLICY IF EXISTS "Scraper Anon Insert" ON public.market_prices;
DROP POLICY IF EXISTS "Scraper can insert market prices" ON public.market_prices;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.market_prices;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.market_prices;

-- CREATE 3 Optimized Policies

-- 1. Public Read (Semua orang bisa melihat harga pasar)
CREATE POLICY "Public Read Market Prices" 
ON public.market_prices FOR SELECT 
USING (true);

-- 2. Authenticated Manage (User yang login bisa Create/Update/Delete)
CREATE POLICY "Authenticated Manage Market Prices" 
ON public.market_prices FOR ALL 
USING (auth.role() = 'authenticated') 
WITH CHECK (auth.role() = 'authenticated');

-- 3. Scraper Insert (Untuk bot auto-scraper tanpa login, termasuk arboge dan chick-in)
CREATE POLICY "Scraper Anon Insert" 
ON public.market_prices FOR INSERT 
WITH CHECK (source IN ('auto_scraper', 'arboge_domba', 'arboge_sapi', 'chick_in', 'chickin', 'arboge', 'api_scraper'));

COMMIT;
