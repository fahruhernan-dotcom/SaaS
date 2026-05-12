-- =============================================================
-- TernakOS — RLS REPAIR (FINAL PRECISION)
-- Fixing 403 Forbidden Errors based on SQL Editor Inspection
-- =============================================================

DO $$ 
BEGIN
    -- 1. REPAIR: ai_conversations
    -- Fixed: Users can insert their own conversations
    IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can insert their own conversations' AND tablename = 'ai_conversations') THEN
        DROP POLICY "Users can insert their own conversations" ON ai_conversations;
    END IF;
    CREATE POLICY "Users can insert their own conversations"
        ON ai_conversations FOR INSERT
        WITH CHECK (profile_id IN (SELECT id FROM profiles WHERE auth_user_id = auth.uid()));

    -- Fixed: Users can see their own conversations
    IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can see their own conversations' AND tablename = 'ai_conversations') THEN
        DROP POLICY "Users can see their own conversations" ON ai_conversations;
    END IF;
    CREATE POLICY "Users can see their own conversations"
        ON ai_conversations FOR SELECT
        USING (profile_id IN (SELECT id FROM profiles WHERE auth_user_id = auth.uid()));

    -- Fixed: Users can update their own conversations
    IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update their own conversations' AND tablename = 'ai_conversations') THEN
        DROP POLICY "Users can update their own conversations" ON ai_conversations;
    END IF;
    CREATE POLICY "Users can update their own conversations"
        ON ai_conversations FOR UPDATE
        USING (profile_id IN (SELECT id FROM profiles WHERE auth_user_id = auth.uid()));

    -- 2. REPAIR: ai_pending_entries
    -- Fixed: Users can insert their own pending entries
    IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can insert their own pending entries' AND tablename = 'ai_pending_entries') THEN
        DROP POLICY "Users can insert their own pending entries" ON ai_pending_entries;
    END IF;
    CREATE POLICY "Users can insert their own pending entries"
        ON ai_pending_entries FOR INSERT
        WITH CHECK (profile_id IN (SELECT id FROM profiles WHERE auth_user_id = auth.uid()));

    -- Fixed: Users can see their own pending entries
    IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can see their own pending entries' AND tablename = 'ai_pending_entries') THEN
        DROP POLICY "Users can see their own pending entries" ON ai_pending_entries;
    END IF;
    CREATE POLICY "Users can see their own pending entries"
        ON ai_pending_entries FOR SELECT
        USING (profile_id IN (SELECT id FROM profiles WHERE auth_user_id = auth.uid()));

    -- 3. REPAIR: ai_staged_transactions
    -- ADD: Consistency Tenant Access Policy (Missing in current actual data)
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Ai staged transactions tenant access' AND tablename = 'ai_staged_transactions') THEN
        CREATE POLICY "Ai staged transactions tenant access"
            ON ai_staged_transactions FOR ALL
            USING (tenant_id = get_my_tenant_id())
            WITH CHECK (tenant_id = get_my_tenant_id());
    END IF;

    -- Fixed: Users can insert their own staged transactions
    IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can insert their own staged transactions' AND tablename = 'ai_staged_transactions') THEN
        DROP POLICY "Users can insert their own staged transactions" ON ai_staged_transactions;
    END IF;
    CREATE POLICY "Users can insert their own staged transactions"
        ON ai_staged_transactions FOR INSERT
        WITH CHECK (profile_id IN (SELECT id FROM profiles WHERE auth_user_id = auth.uid()));

    -- Fixed: Users can see their own staged transactions
    IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can see their own staged transactions' AND tablename = 'ai_staged_transactions') THEN
        DROP POLICY "Users can see their own staged transactions" ON ai_staged_transactions;
    END IF;
    CREATE POLICY "Users can see their own staged transactions"
        ON ai_staged_transactions FOR SELECT
        USING (profile_id IN (SELECT id FROM profiles WHERE auth_user_id = auth.uid()));

    -- Fixed: Users can update their own staged transactions
    IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update their own staged transactions' AND tablename = 'ai_staged_transactions') THEN
        DROP POLICY "Users can update their own staged transactions" ON ai_staged_transactions;
    END IF;
    CREATE POLICY "Users can update their own staged transactions"
        ON ai_staged_transactions FOR UPDATE
        USING (profile_id IN (SELECT id FROM profiles WHERE auth_user_id = auth.uid()));

    -- 4. REPAIR: ai_anomaly_logs
    -- Fixed: Users can see anomalies in their tenant (Use auth_user_id instead of id)
    IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can see anomalies in their tenant' AND tablename = 'ai_anomaly_logs') THEN
        DROP POLICY "Users can see anomalies in their tenant" ON ai_anomaly_logs;
    END IF;
    CREATE POLICY "Users can see anomalies in their tenant"
        ON ai_anomaly_logs FOR SELECT
        USING (EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.auth_user_id = auth.uid() 
            AND profiles.tenant_id = ai_anomaly_logs.tenant_id
        ));

END $$;
