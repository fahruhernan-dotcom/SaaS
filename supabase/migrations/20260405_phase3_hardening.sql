-- =============================================================
-- TernakOS — Phase 3: Staging & Hardening Migration
-- =============================================================

-- 1. Staging table for "True Undo" pattern
CREATE TABLE IF NOT EXISTS ai_staged_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pending_entry_id UUID REFERENCES ai_pending_entries(id) ON DELETE SET NULL,
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    profile_id UUID NOT NULL REFERENCES profiles(id),
    target_table TEXT NOT NULL,
    intent TEXT NOT NULL,
    payload JSONB NOT NULL,
    original_data JSONB, -- For audit/dirty tracking
    is_edited BOOLEAN DEFAULT false,
    status TEXT DEFAULT 'staged' CHECK (status IN ('staged', 'committed', 'undone', 'failed')),
    error_message TEXT,
    staged_at TIMESTAMPTZ DEFAULT now(),
    committed_at TIMESTAMPTZ,
    production_id UUID, -- Reference to the final row in the target table
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_ai_staged_tenant ON ai_staged_transactions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_ai_staged_status ON ai_staged_transactions(status) WHERE status = 'staged';

-- 3. RLS for safety
ALTER TABLE ai_staged_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can see their own staged transactions"
    ON ai_staged_transactions FOR SELECT
    USING (auth.uid() = profile_id);

CREATE POLICY "Users can insert their own staged transactions"
    ON ai_staged_transactions FOR INSERT
    WITH CHECK (auth.uid() = profile_id);

CREATE POLICY "Users can update their own staged transactions"
    ON ai_staged_transactions FOR UPDATE
    USING (auth.uid() = profile_id);

-- 4. Anomaly Logs (for Telemetry & BI)
CREATE TABLE IF NOT EXISTS ai_anomaly_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    staged_transaction_id UUID REFERENCES ai_staged_transactions(id),
    field_name TEXT,
    anomaly_reason TEXT,
    severity TEXT,
    detected_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE ai_anomaly_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can see anomalies in their tenant"
    ON ai_anomaly_logs FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.tenant_id = ai_anomaly_logs.tenant_id
    ));
