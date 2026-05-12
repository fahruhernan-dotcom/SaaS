-- =============================================================
-- TernakOS — AI Error Logs Table
-- Tracks client-side AI failures for debugging and monitoring.
-- =============================================================

CREATE TABLE IF NOT EXISTS ai_error_logs (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id   UUID REFERENCES tenants(id),
    profile_id  UUID REFERENCES profiles(id),
    error_msg   TEXT NOT NULL,
    provider    TEXT,                    -- 'MAIA' | 'GLM-BACKUP' | null
    user_message TEXT,                  -- sanitized message that caused the error
    context_page TEXT,
    created_at  TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE ai_error_logs ENABLE ROW LEVEL SECURITY;

-- Users can insert their own error logs (fire-and-forget from client)
DO $$ BEGIN
    CREATE POLICY "Users can insert own error logs"
        ON ai_error_logs FOR INSERT
        WITH CHECK (auth.uid() = profile_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Only service role can read (for admin monitoring)
CREATE INDEX IF NOT EXISTS idx_ai_errors_tenant ON ai_error_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_ai_errors_created ON ai_error_logs(created_at DESC);
