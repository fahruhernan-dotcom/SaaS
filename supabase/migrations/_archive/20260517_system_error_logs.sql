-- =============================================================
-- TernakOS — System Error Logs
-- Central error log table for all verticals.
-- Run in Supabase SQL Editor. Safe to run multiple times.
-- =============================================================

-- TABLE
CREATE TABLE IF NOT EXISTS public.system_error_logs (
  id            uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at    timestamptz   NOT NULL DEFAULT now(),
  level         text          NOT NULL DEFAULT 'error',   -- error | warning | info
  source        text,                                     -- frontend | supabase | rpc | route | react_error_boundary | unhandled_rejection
  vertical      text,
  role          text,
  tenant_id     uuid          REFERENCES public.tenants(id) ON DELETE SET NULL,
  user_id       uuid          NOT NULL DEFAULT auth.uid(),
  page_path     text,
  component     text,
  action_name   text,
  error_code    text,
  error_message text,
  error_details text,
  stack         text,
  metadata      jsonb         NOT NULL DEFAULT '{}',
  user_agent    text,
  app_version   text          DEFAULT 'v0.9.4',
  resolved      boolean       NOT NULL DEFAULT false,
  resolved_at   timestamptz,
  resolved_by   uuid,
  note          text
);

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_sel_created_at  ON public.system_error_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sel_level        ON public.system_error_logs (level);
CREATE INDEX IF NOT EXISTS idx_sel_source       ON public.system_error_logs (source);
CREATE INDEX IF NOT EXISTS idx_sel_tenant_id    ON public.system_error_logs (tenant_id);
CREATE INDEX IF NOT EXISTS idx_sel_user_id      ON public.system_error_logs (user_id);
CREATE INDEX IF NOT EXISTS idx_sel_resolved     ON public.system_error_logs (resolved);

-- RLS
ALTER TABLE public.system_error_logs ENABLE ROW LEVEL SECURITY;

-- INSERT: authenticated users can insert only their own logs (no null user_id allowed)
DROP POLICY IF EXISTS "sel_insert_own" ON public.system_error_logs;
CREATE POLICY "sel_insert_own"
  ON public.system_error_logs FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- SELECT: superadmin can read all
DROP POLICY IF EXISTS "sel_superadmin_select" ON public.system_error_logs;
CREATE POLICY "sel_superadmin_select"
  ON public.system_error_logs FOR SELECT
  TO authenticated
  USING (public.is_superadmin());

-- UPDATE: superadmin can mark resolved / add note
DROP POLICY IF EXISTS "sel_superadmin_update" ON public.system_error_logs;
CREATE POLICY "sel_superadmin_update"
  ON public.system_error_logs FOR UPDATE
  TO authenticated
  USING (public.is_superadmin())
  WITH CHECK (public.is_superadmin());
