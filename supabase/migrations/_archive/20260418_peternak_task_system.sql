-- ============================================================
-- Migration: Peternak Daily Task System
-- Date: 2026-04-18
--
-- This migration implements:
--   1. RLS Helper functions: my_tenant_id() and my_role()
--   2. kandang_workers: linking to profiles for notifications
--   3. peternak_task_templates: recurring task definitions
--   4. peternak_task_instances: daily tasks generated from templates
-- ============================================================

-- ──────────────────────────────────────────────────────────────
-- 0. Helper Functions (Idempotent)
-- ──────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.my_tenant_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT tenant_id FROM public.profiles WHERE auth_user_id = auth.uid() LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.my_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT role FROM public.profiles WHERE auth_user_id = auth.uid() LIMIT 1;
$$;


-- ──────────────────────────────────────────────────────────────
-- 1. ALTER kandang_workers
--    Linking physical worker records to system user profiles
-- ──────────────────────────────────────────────────────────────

ALTER TABLE public.kandang_workers
  ADD COLUMN IF NOT EXISTS profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_kandang_workers_profile_id ON public.kandang_workers(profile_id);


-- ──────────────────────────────────────────────────────────────
-- 2. peternak_task_templates
--    Blueprint for recurring activities
-- ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.peternak_task_templates (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  
  -- Reference physical stall by name (Option A) to avoid batch lifecycle issues
  kandang_name    TEXT, 

  title           TEXT NOT NULL,
  description     TEXT,
  task_type       TEXT NOT NULL CHECK (task_type IN (
                    'timbang', 'vaksinasi', 'pakan', 'kesehatan',
                    'kebersihan_kandang', 'reproduksi', 'lainnya'
                  )),

  linked_data_entry BOOLEAN NOT NULL DEFAULT FALSE,
  
  recurring_type   TEXT NOT NULL CHECK (recurring_type IN (
                    'harian', 'mingguan', 'dua_mingguan', 'bulanan', 'custom', 'sekali'
                  )),
  recurring_interval_days INTEGER,
  recurring_days_of_week INTEGER[], -- [1,3,5] = Mon, Wed, Fri
  
  start_date      DATE NOT NULL,
  end_date        DATE, -- NULL = forever
  
  default_assignee_worker_id UUID REFERENCES public.kandang_workers(id) ON DELETE SET NULL,
  
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  is_deleted      BOOLEAN NOT NULL DEFAULT FALSE,
  created_by      UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_peternak_task_templates_tenant 
  ON public.peternak_task_templates(tenant_id, is_deleted, is_active);


-- ──────────────────────────────────────────────────────────────
-- 3. peternak_task_instances
--    Daily execution records generated from templates
-- ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.peternak_task_instances (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  template_id     UUID REFERENCES public.peternak_task_templates(id) ON DELETE SET NULL,
  
  kandang_name    TEXT,
  title           TEXT NOT NULL,
  description     TEXT,
  task_type       TEXT NOT NULL CHECK (task_type IN (
                    'timbang', 'vaksinasi', 'pakan', 'kesehatan',
                    'kebersihan_kandang', 'reproduksi', 'lainnya'
                  )),
                  
  due_date        DATE NOT NULL,
  due_time        TIME,
  
  assigned_worker_id  UUID REFERENCES public.kandang_workers(id) ON DELETE SET NULL,
  assigned_profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  
  status          TEXT NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'in_progress', 'selesai', 'dilewati', 'terlambat')),
                    
  completed_at    TIMESTAMPTZ,
  completed_by_profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  
  -- Record reference (e.g. link to the weight record created)
  linked_record_id    UUID,
  linked_record_table TEXT,
  
  notes           TEXT,
  is_deleted      BOOLEAN NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_peternak_task_instances_tenant_date
  ON public.peternak_task_instances(tenant_id, due_date, status) WHERE NOT is_deleted;
CREATE INDEX IF NOT EXISTS idx_peternak_task_instances_profile
  ON public.peternak_task_instances(assigned_profile_id) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_peternak_task_instances_template
  ON public.peternak_task_instances(template_id);


-- ──────────────────────────────────────────────────────────────
-- 4. Triggers: Updated At
-- ──────────────────────────────────────────────────────────────

DROP TRIGGER IF EXISTS set_updated_at_task_templates ON public.peternak_task_templates;
CREATE TRIGGER set_updated_at_task_templates
  BEFORE UPDATE ON public.peternak_task_templates
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_task_instances ON public.peternak_task_instances;
CREATE TRIGGER set_updated_at_task_instances
  BEFORE UPDATE ON public.peternak_task_instances
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


-- ──────────────────────────────────────────────────────────────
-- 5. Trigger: Generate Instances from Template
--    Generates tasks for the next 30 days based on recurring logic
-- ──────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.trg_peternak_generate_task_instances()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_curr_date DATE;
  v_end_loop  DATE;
  v_profile_id UUID;
  v_should_create BOOLEAN;
BEGIN
  -- 1. Determine local assigned_profile_id from worker if available
  IF NEW.default_assignee_worker_id IS NOT NULL THEN
    SELECT profile_id INTO v_profile_id 
    FROM public.kandang_workers 
    WHERE id = NEW.default_assignee_worker_id;
  END IF;

  -- 2. Setup date range (Next 30 days, or until template end_date)
  v_curr_date := GREATEST(NEW.start_date, CURRENT_DATE);
  v_end_loop  := LEAST(CURRENT_DATE + INTERVAL '30 days', COALESCE(NEW.end_date, CURRENT_DATE + INTERVAL '30 days'));

  -- 3. Cleanup future pending tasks if updating template to prevent duplicates/stale data
  IF TG_OP = 'UPDATE' THEN
    DELETE FROM public.peternak_task_instances
    WHERE template_id = NEW.id
      AND status = 'pending'
      AND due_date >= v_curr_date;
  END IF;

  -- 4. Generate loop
  WHILE v_curr_date <= v_end_loop LOOP
    v_should_create := FALSE;

    -- Recurring Logic
    CASE NEW.recurring_type
      WHEN 'harian' THEN 
        v_should_create := TRUE;
      WHEN 'mingguan' THEN
        -- Check if current day of week (1=Mon, 7=Sun) is in the array
        -- extract(isodow from date) returns 1 for Monday
        IF EXTRACT(isodow FROM v_curr_date) = ANY(NEW.recurring_days_of_week) THEN
          v_should_create := TRUE;
        END IF;
      WHEN 'dua_mingguan' THEN
        -- Every 14 days from start_date
        IF (v_curr_date - NEW.start_date) % 14 = 0 THEN
          v_should_create := TRUE;
        END IF;
      WHEN 'bulanan' THEN
        -- Same day of month as start_date
        IF EXTRACT(day FROM v_curr_date) = EXTRACT(day FROM NEW.start_date) THEN
          v_should_create := TRUE;
        END IF;
      WHEN 'custom' THEN
        IF (v_curr_date - NEW.start_date) % COALESCE(NEW.recurring_interval_days, 1) = 0 THEN
          v_should_create := TRUE;
        END IF;
      WHEN 'sekali' THEN
        IF v_curr_date = NEW.start_date THEN
          v_should_create := TRUE;
        END IF;
    END CASE;

    IF v_should_create THEN
      -- Avoid duplicates if running logic multiple times
      INSERT INTO public.peternak_task_instances (
        tenant_id, template_id, kandang_name,
        title, description, task_type,
        due_date, assigned_worker_id, assigned_profile_id
      ) VALUES (
        NEW.tenant_id, NEW.id, NEW.kandang_name,
        NEW.title, NEW.description, NEW.task_type,
        v_curr_date, NEW.default_assignee_worker_id, v_profile_id
      )
      ON CONFLICT DO NOTHING;
    END IF;

    v_curr_date := v_curr_date + 1;
  END LOOP;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS peternak_generate_task_instances ON public.peternak_task_templates;
CREATE TRIGGER peternak_generate_task_instances
  AFTER INSERT OR UPDATE OF 
    is_active, is_deleted, start_date, end_date, 
    recurring_type, recurring_days_of_week, recurring_interval_days 
  ON public.peternak_task_templates
  FOR EACH ROW
  WHEN (NEW.is_active = TRUE AND NEW.is_deleted = FALSE)
  EXECUTE FUNCTION public.trg_peternak_generate_task_instances();


-- ──────────────────────────────────────────────────────────────
-- 6. RLS Policies
-- ──────────────────────────────────────────────────────────────

ALTER TABLE public.peternak_task_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.peternak_task_instances ENABLE ROW LEVEL SECURITY;

-- Template Policies
DROP POLICY IF EXISTS "Peternak Task Templates Access" ON public.peternak_task_templates;
CREATE POLICY "Peternak Task Templates Access" ON public.peternak_task_templates
  FOR ALL
  USING (tenant_id = public.my_tenant_id())
  WITH CHECK (
    tenant_id = public.my_tenant_id() 
    AND public.my_role() IN ('owner', 'manajer')
  );

-- Instance Policies
DROP POLICY IF EXISTS "Peternak Task Instances Select" ON public.peternak_task_instances;
CREATE POLICY "Peternak Task Instances Select" ON public.peternak_task_instances
  FOR SELECT
  USING (tenant_id = public.my_tenant_id());

DROP POLICY IF EXISTS "Peternak Task Instances Manage" ON public.peternak_task_instances;
CREATE POLICY "Peternak Task Instances Manage" ON public.peternak_task_instances
  FOR ALL
  USING (
    tenant_id = public.my_tenant_id() 
    AND public.my_role() IN ('owner', 'manajer')
  )
  WITH CHECK (
    tenant_id = public.my_tenant_id() 
    AND public.my_role() IN ('owner', 'manajer')
  );

DROP POLICY IF EXISTS "Peternak Task Instances Staff Update" ON public.peternak_task_instances;
CREATE POLICY "Peternak Task Instances Staff Update" ON public.peternak_task_instances
  FOR UPDATE
  USING (
    tenant_id = public.my_tenant_id() 
    AND (
      assigned_profile_id = (SELECT id FROM public.profiles WHERE auth_user_id = auth.uid() LIMIT 1)
      OR public.my_role() IN ('owner', 'manajer')
    )
  )
  WITH CHECK (
    tenant_id = public.my_tenant_id()
    AND (
      assigned_profile_id = (SELECT id FROM public.profiles WHERE auth_user_id = auth.uid() LIMIT 1)
      OR public.my_role() IN ('owner', 'manajer')
    )
  );
