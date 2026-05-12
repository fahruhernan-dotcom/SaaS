-- SQL untuk mengizinkan User yang sudah login membuat bisnis (Tenant) baru
-- Dan membuat Profile baru untuk bisnis tersebut

-- 1. Berikan izin INSERT pada tabel tenants untuk user yang sudah login
CREATE POLICY "Allow authenticated users to insert a tenant" 
ON tenants FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- 2. Berikan izin INSERT pada tabel profiles untuk user yang sudah login
-- Ini penting agar setelah tenant dibuat, user bisa mendaftarkan dirinya sebagai owner di tenant baru tersebut
CREATE POLICY "Allow authenticated users to insert their own profile" 
ON profiles FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = auth_user_id);

-- 3. (Opsional) Jika tabel tenants memiliki RLS aktif untuk SELECT, pastikan user bisa melihat tenant barunya
-- Biasanya ini sudah ada, tapi saya pastikan lagi:
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'tenants' AND policyname = 'Users can see their own tenants'
    ) THEN
        CREATE POLICY "Users can see their own tenants" ON tenants
        FOR SELECT TO authenticated
        USING (
            EXISTS (
                SELECT 1 FROM profiles
                WHERE profiles.tenant_id = tenants.id
                AND profiles.auth_user_id = auth.uid()
            )
        );
    END IF;
END $$;
