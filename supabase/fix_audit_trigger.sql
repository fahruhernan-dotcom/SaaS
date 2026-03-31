-- Fix for the 'record "new" has no field' error in log_audit_action
-- This uses dynamic JSON extraction to safely access fields that might not exist on every table.

CREATE OR REPLACE FUNCTION log_audit_action()
RETURNS trigger AS $$
DECLARE
    v_actor_id uuid;
    v_record jsonb;
    v_tenant_id uuid;
    v_entity_id uuid;
BEGIN
    -- Get the actor matching the authenticated user
    v_actor_id := (SELECT id FROM profiles WHERE auth_user_id = auth.uid() LIMIT 1);
    
    -- Determine whether we are reading from NEW or OLD based on the operation
    IF TG_OP = 'DELETE' THEN
        v_record := to_jsonb(OLD);
    ELSE
        v_record := to_jsonb(NEW);
    END IF;

    -- Extract tenant_id dynamically without strict schema validation
    IF TG_TABLE_NAME = 'tenants' THEN
        v_tenant_id := (v_record->>'id')::uuid;
    ELSIF v_record ? 'tenant_id' THEN
        v_tenant_id := (v_record->>'tenant_id')::uuid;
    ELSE
        v_tenant_id := NULL;
    END IF;

    -- Extract entity_id dynamically
    IF v_record ? 'id' THEN
        v_entity_id := (v_record->>'id')::uuid;
    ELSE
        v_entity_id := NULL;
    END IF;

    -- Insert the audit log entry
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
        v_tenant_id,
        TG_OP || '_' || UPPER(TG_TABLE_NAME),
        TG_TABLE_NAME,
        v_entity_id,
        CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN to_jsonb(OLD) ELSE NULL END,
        CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) ELSE NULL END
    );
    
    -- Return appropriate record
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
