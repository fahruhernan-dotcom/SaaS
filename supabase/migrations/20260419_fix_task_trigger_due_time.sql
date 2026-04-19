-- ============================================================
-- Migration: Fix Task Trigger — Add due_time to templates + propagate to instances
-- Date: 2026-04-19
--
-- Fixes:
--   1. Add due_time column to peternak_task_templates (was missing)
--   2. Rewrite trigger to copy due_time into generated instances
--   3. Extend trigger UPDATE columns to include due_time changes
-- ============================================================

-- ──────────────────────────────────────────────────────────────
-- 1. Add due_time to templates table (idempotent)
-- ──────────────────────────────────────────────────────────────

ALTER TABLE public.peternak_task_templates
  ADD COLUMN IF NOT EXISTS due_time TIME NOT NULL DEFAULT '08:00:00';


-- ──────────────────────────────────────────────────────────────
-- 2. Replace trigger function — add due_time to INSERT
--    Rule: NEVER DROP FUNCTION ... CASCADE (Rule 12 CONTEXT.md)
--          Always use CREATE OR REPLACE FUNCTION
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
  -- 1. Resolve assigned_profile_id from worker record if linked
  IF NEW.default_assignee_worker_id IS NOT NULL THEN
    SELECT profile_id INTO v_profile_id
    FROM public.kandang_workers
    WHERE id = NEW.default_assignee_worker_id;
  END IF;

  -- 2. Setup date range: next 30 days or until template end_date
  v_curr_date := GREATEST(NEW.start_date, CURRENT_DATE);
  v_end_loop  := LEAST(
    CURRENT_DATE + INTERVAL '30 days',
    COALESCE(NEW.end_date, CURRENT_DATE + INTERVAL '30 days')
  );

  -- 3. On UPDATE: wipe future pending instances to avoid stale/duplicate data
  IF TG_OP = 'UPDATE' THEN
    DELETE FROM public.peternak_task_instances
    WHERE template_id = NEW.id
      AND status = 'pending'
      AND due_date >= v_curr_date;
  END IF;

  -- 4. Generate instances in date range
  WHILE v_curr_date <= v_end_loop LOOP
    v_should_create := FALSE;

    CASE NEW.recurring_type
      WHEN 'harian' THEN
        v_should_create := TRUE;

      WHEN 'mingguan' THEN
        IF EXTRACT(isodow FROM v_curr_date) = ANY(NEW.recurring_days_of_week) THEN
          v_should_create := TRUE;
        END IF;

      WHEN 'dua_mingguan' THEN
        IF (v_curr_date - NEW.start_date) % 14 = 0 THEN
          v_should_create := TRUE;
        END IF;

      WHEN 'bulanan' THEN
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
      INSERT INTO public.peternak_task_instances (
        tenant_id, template_id, kandang_name,
        title, description, task_type,
        due_date, due_time,
        assigned_worker_id, assigned_profile_id
      ) VALUES (
        NEW.tenant_id, NEW.id, NEW.kandang_name,
        NEW.title, NEW.description, NEW.task_type,
        v_curr_date, NEW.due_time,
        NEW.default_assignee_worker_id, v_profile_id
      )
      ON CONFLICT DO NOTHING;
    END IF;

    v_curr_date := v_curr_date + 1;
  END LOOP;

  RETURN NEW;
END;
$$;


-- ──────────────────────────────────────────────────────────────
-- 3. Recreate trigger — extend UPDATE columns to include due_time
--    so changing the time on a template regenerates instances
-- ──────────────────────────────────────────────────────────────

DROP TRIGGER IF EXISTS peternak_generate_task_instances ON public.peternak_task_templates;

CREATE TRIGGER peternak_generate_task_instances
  AFTER INSERT OR UPDATE OF
    is_active, is_deleted, start_date, end_date,
    recurring_type, recurring_days_of_week, recurring_interval_days,
    due_time
  ON public.peternak_task_templates
  FOR EACH ROW
  WHEN (NEW.is_active = TRUE AND NEW.is_deleted = FALSE)
  EXECUTE FUNCTION public.trg_peternak_generate_task_instances();
