-- Fix RLS policy for sapi_kandangs
-- The original policy in 20260417_sapi_penggemukan.sql used `id = auth.uid()`
-- instead of `auth_user_id = auth.uid()`, causing 403 on INSERT/UPDATE/DELETE.

DROP POLICY IF EXISTS "tenant_sapi_kandangs" ON sapi_kandangs;

CREATE POLICY "tenant_sapi_kandangs_select" ON sapi_kandangs
  FOR SELECT USING (
    tenant_id IN (SELECT tenant_id FROM profiles WHERE auth_user_id = auth.uid())
  );

CREATE POLICY "tenant_sapi_kandangs_insert" ON sapi_kandangs
  FOR INSERT WITH CHECK (
    tenant_id IN (SELECT tenant_id FROM profiles WHERE auth_user_id = auth.uid())
  );

CREATE POLICY "tenant_sapi_kandangs_update" ON sapi_kandangs
  FOR UPDATE USING (
    tenant_id IN (SELECT tenant_id FROM profiles WHERE auth_user_id = auth.uid())
  );

CREATE POLICY "tenant_sapi_kandangs_delete" ON sapi_kandangs
  FOR DELETE USING (
    tenant_id IN (SELECT tenant_id FROM profiles WHERE auth_user_id = auth.uid())
  );
