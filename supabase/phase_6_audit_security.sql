-- ============================================================
-- TERNAKOS — PHASE 6: AUDIT, ACTIVITY & SECURITY HARDENING
-- ============================================================

-- 1. Create Global Audit Logs Table
CREATE TABLE IF NOT EXISTS global_audit_logs (
    id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_profile_id  uuid REFERENCES profiles(id) ON DELETE SET NULL,
    tenant_id         uuid REFERENCES tenants(id) ON DELETE CASCADE, -- NULL for global/admin actions
    action            text NOT NULL, -- e.g., 'UPDATE_PRICING', 'DELETE_TENANT', 'CHANGE_ROLE'
    entity_type       text NOT NULL, -- e.g., 'pricing_plans', 'tenants', 'profiles'
    entity_id         uuid,
    old_data          jsonb,
    new_data          jsonb,
    ip_address        text,
    user_agent        text,
    created_at        timestamptz DEFAULT now()
);

ALTER TABLE global_audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS: Superadmin can see everything, Owners can see logs for their tenant
CREATE POLICY "audit_logs_superadmin" ON global_audit_logs
    FOR SELECT USING (is_superadmin());

CREATE POLICY "audit_logs_owner" ON global_audit_logs
    FOR SELECT USING (is_my_tenant(tenant_id));

-- 2. Expand Soft Delete (is_deleted)
ALTER TABLE payments ADD COLUMN IF NOT EXISTS is_deleted boolean DEFAULT false;
ALTER TABLE team_invitations ADD COLUMN IF NOT EXISTS is_deleted boolean DEFAULT false;
ALTER TABLE rpa_customer_payments ADD COLUMN IF NOT EXISTS is_deleted boolean DEFAULT false;
ALTER TABLE sembako_payroll ADD COLUMN IF NOT EXISTS is_deleted boolean DEFAULT false;
ALTER TABLE sembako_payments ADD COLUMN IF NOT EXISTS is_deleted boolean DEFAULT false;

-- 3. Hardened RLS for Administrative Tables
-- Only Superadmins can modify pricing, discounts, and global configs

-- pricing_plans
DROP POLICY IF EXISTS "pricing_plans_admin_all" ON pricing_plans;
DROP POLICY IF EXISTS "Public Read Pricing Plans" ON pricing_plans;
DROP POLICY IF EXISTS "Admin Write Pricing Plans" ON pricing_plans;
CREATE POLICY "Public Read Pricing Plans" ON pricing_plans FOR SELECT USING (true);
CREATE POLICY "Admin Write Pricing Plans" ON pricing_plans 
    FOR ALL USING (is_superadmin()) WITH CHECK (is_superadmin());

-- discount_codes
DROP POLICY IF EXISTS "discount_codes_admin_all" ON discount_codes;
DROP POLICY IF EXISTS "Public Read Discount Codes" ON discount_codes;
DROP POLICY IF EXISTS "Admin Write Discount Codes" ON discount_codes;
CREATE POLICY "Public Read Discount Codes" ON discount_codes FOR SELECT USING (true);
CREATE POLICY "Admin Write Discount Codes" ON discount_codes 
    FOR ALL USING (is_superadmin()) WITH CHECK (is_superadmin());

-- plan_configs
DROP POLICY IF EXISTS "plan_configs_admin_all" ON plan_configs;
DROP POLICY IF EXISTS "Public Read Plan Configs" ON plan_configs;
DROP POLICY IF EXISTS "Admin Write Plan Configs" ON plan_configs;
CREATE POLICY "Public Read Plan Configs" ON plan_configs FOR SELECT USING (true);
CREATE POLICY "Admin Write Plan Configs" ON plan_configs 
    FOR ALL USING (is_superadmin()) WITH CHECK (is_superadmin());

-- 4. Audit Trigger Function
CREATE OR REPLACE FUNCTION log_audit_action()
RETURNS trigger AS $$
DECLARE
    v_actor_id uuid;
BEGIN
    v_actor_id := (SELECT id FROM profiles WHERE auth_user_id = auth.uid() LIMIT 1);
    
    INSERT INTO global_audit_logs (
        actor_profile_id,
        tenant_id,
        action,
        entity_type,
        entity_id,
        old_data,
        new_data
    ) VALUES (
        v_actor_id,
        CASE 
            WHEN TG_TABLE_NAME = 'tenants' THEN NEW.id
            WHEN TG_TABLE_NAME = 'profiles' THEN NEW.tenant_id
            ELSE NULL -- Global tables
        END,
        TG_OP || '_' || UPPER(TG_TABLE_NAME),
        TG_TABLE_NAME,
        NEW.id,
        CASE WHEN TG_OP = 'UPDATE' THEN to_jsonb(OLD) ELSE NULL END,
        to_jsonb(NEW)
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Attach Triggers to Critical Tables
DROP TRIGGER IF EXISTS tr_audit_pricing_plans ON pricing_plans;
CREATE TRIGGER tr_audit_pricing_plans
    AFTER INSERT OR UPDATE OR DELETE ON pricing_plans
    FOR EACH ROW EXECUTE PROCEDURE log_audit_action();

DROP TRIGGER IF EXISTS tr_audit_tenants ON tenants;
CREATE TRIGGER tr_audit_tenants
    AFTER UPDATE ON tenants
    FOR EACH ROW EXECUTE PROCEDURE log_audit_action();

DROP TRIGGER IF EXISTS tr_audit_profiles ON profiles;
CREATE TRIGGER tr_audit_profiles
    AFTER UPDATE ON profiles
    FOR EACH ROW EXECUTE PROCEDURE log_audit_action();

DROP TRIGGER IF EXISTS tr_audit_invoices ON subscription_invoices;
CREATE TRIGGER tr_audit_invoices
    AFTER UPDATE ON subscription_invoices
    FOR EACH ROW EXECUTE PROCEDURE log_audit_action();

DROP TRIGGER IF EXISTS tr_audit_discounts ON discount_codes;
CREATE TRIGGER tr_audit_discounts
    AFTER INSERT OR UPDATE OR DELETE ON discount_codes
    FOR EACH ROW EXECUTE PROCEDURE log_audit_action();
