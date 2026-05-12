-- ══════════════════════════════════════════════════════════════════════
-- CLEANUP & TECH DEBT REDUCTION
-- 1. Menyederhanakan 11 policy profil
-- 2. Menghapus duplikasi di payment_settings
-- 3. Mengamankan AI anomaly logs (FK constraint)
-- ══════════════════════════════════════════════════════════════════════

BEGIN;

-- ─────────────────────────────────────────────────────────────────────
-- 1. CLEAN UP: profiles (Mengurangi 11 Policy menjadi lebih sederhana)
-- ─────────────────────────────────────────────────────────────────────


DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile." ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile." ON public.profiles;
DROP POLICY IF EXISTS "Profiles are viewable by users who created them." ON public.profiles;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.profiles;
DROP POLICY IF EXISTS "Enable update for users based on email" ON public.profiles;
DROP POLICY IF EXISTS "profiles_read" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update" ON public.profiles;
DROP POLICY IF EXISTS "profiles_delete" ON public.profiles;

-- CREATE 3 Unified Policies for Profiles
-- 1. Anyone can view profiles (needed for public pages and cross-tenant interactions)
CREATE POLICY "Public Read Profiles" 
ON public.profiles FOR SELECT 
USING (true);

-- 2. Users can insert their own profile (during sign-up)
CREATE POLICY "User Insert Own Profile" 
ON public.profiles FOR INSERT 
WITH CHECK (auth_user_id = auth.uid());

-- 3. Users can update their own profile
CREATE POLICY "User Update Own Profile" 
ON public.profiles FOR UPDATE 
USING (auth_user_id = auth.uid())
WITH CHECK (auth_user_id = auth.uid());


-- ─────────────────────────────────────────────────────────────────────
-- 2. CLEAN UP: payment_settings (Hapus duplikasi)
-- ─────────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Enable read access for all users" ON public.payment_settings;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.payment_settings;
DROP POLICY IF EXISTS "Enable update for users based on email" ON public.payment_settings;
DROP POLICY IF EXISTS "Admin Full Access Payment Settings" ON public.payment_settings;
DROP POLICY IF EXISTS "Tenant Isolation Policy" ON public.payment_settings;
DROP POLICY IF EXISTS "payment_settings_tenant_isolation" ON public.payment_settings;

-- Tabel payment_settings adalah tabel global (tidak memiliki tenant_id)
-- Kita buat 2 policy yang bersih: Public Read dan Superadmin Write
CREATE POLICY "Public Read Payment Settings" 
ON public.payment_settings FOR SELECT 
USING (true);

CREATE POLICY "Superadmin Manage Payment Settings" 
ON public.payment_settings FOR ALL 
USING (public.is_superadmin())
WITH CHECK (public.is_superadmin());


-- ─────────────────────────────────────────────────────────────────────
-- 3. SECURITY: Tambah FK Constraint di ai_anomaly_logs & ai_error_logs
-- Memastikan AI system tidak meninggalkan orphan data
-- ─────────────────────────────────────────────────────────────────────

-- Bersihkan data orphan (jika ada) sebelum tambah constraint
DELETE FROM public.ai_anomaly_logs 
WHERE tenant_id IS NOT NULL AND tenant_id NOT IN (SELECT id FROM public.tenants);

-- Tambah FK constraint dengan CASCADE DELETE
ALTER TABLE public.ai_anomaly_logs
  DROP CONSTRAINT IF EXISTS fk_ai_anomaly_tenant;

ALTER TABLE public.ai_anomaly_logs
  ADD CONSTRAINT fk_ai_anomaly_tenant 
  FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;

-- Lakukan hal yang sama untuk ai_error_logs (nullable)
UPDATE public.ai_error_logs 
SET tenant_id = NULL 
WHERE tenant_id NOT IN (SELECT id FROM public.tenants);

ALTER TABLE public.ai_error_logs
  DROP CONSTRAINT IF EXISTS fk_ai_error_tenant;

ALTER TABLE public.ai_error_logs
  ADD CONSTRAINT fk_ai_error_tenant 
  FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;

COMMIT;
