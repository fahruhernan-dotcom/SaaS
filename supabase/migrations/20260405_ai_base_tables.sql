-- =============================================================
-- TernakOS — AI Base Infrastructure Tables (DEFENSIVE)
-- Fixing 400 Error WITHOUT dropping tables
-- =============================================================

-- 1. Create Tables if they don't exist
CREATE TABLE IF NOT EXISTS ai_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    profile_id UUID NOT NULL REFERENCES profiles(id),
    user_type TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ai_pending_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES ai_conversations(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    profile_id UUID NOT NULL REFERENCES profiles(id),
    intent TEXT NOT NULL,
    extracted_data JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Ensure Columns exist (Fixing potential 400 Bad Request)
DO $$ 
BEGIN 
    -- ai_conversations additions
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='ai_conversations' AND column_name='messages') THEN
        ALTER TABLE ai_conversations ADD COLUMN messages JSONB DEFAULT '[]';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='ai_conversations' AND column_name='metadata') THEN
        ALTER TABLE ai_conversations ADD COLUMN metadata JSONB DEFAULT '{}';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='ai_conversations' AND column_name='context_page') THEN
        ALTER TABLE ai_conversations ADD COLUMN context_page TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='ai_conversations' AND column_name='context_snapshot') THEN
        ALTER TABLE ai_conversations ADD COLUMN context_snapshot JSONB;
    END IF;

    -- ai_pending_entries additions
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='ai_pending_entries' AND column_name='target_table') THEN
        ALTER TABLE ai_pending_entries ADD COLUMN target_table TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='ai_pending_entries' AND column_name='status') THEN
        ALTER TABLE ai_pending_entries ADD COLUMN status TEXT DEFAULT 'pending';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='ai_pending_entries' AND column_name='confidence') THEN
        ALTER TABLE ai_pending_entries ADD COLUMN confidence DECIMAL DEFAULT 1.0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='ai_pending_entries' AND column_name='raw_ai_response') THEN
        ALTER TABLE ai_pending_entries ADD COLUMN raw_ai_response JSONB;
    END IF;
END $$;

-- 3. RLS Policies
ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_pending_entries ENABLE ROW LEVEL SECURITY;

-- 3.1 ai_conversations Policies
DO $$ BEGIN
    CREATE POLICY "Users can see their own conversations" ON ai_conversations FOR SELECT USING (auth.uid() = profile_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "Users can insert their own conversations" ON ai_conversations FOR INSERT WITH CHECK (auth.uid() = profile_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "Users can update their own conversations" ON ai_conversations FOR UPDATE USING (auth.uid() = profile_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 3.2 ai_pending_entries Policies
DO $$ BEGIN
    CREATE POLICY "Users can see their own pending entries" ON ai_pending_entries FOR SELECT USING (auth.uid() = profile_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "Users can insert their own pending entries" ON ai_pending_entries FOR INSERT WITH CHECK (auth.uid() = profile_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 4. Indexes
CREATE INDEX IF NOT EXISTS idx_ai_conv_tenant ON ai_conversations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_ai_conv_profile ON ai_conversations(profile_id);
CREATE INDEX IF NOT EXISTS idx_ai_pending_conv ON ai_pending_entries(conversation_id);
