-- ============================================================
-- Migration: Add materialize_peternak_task_instances RPC
-- Date: 2026-06-05
--
-- Description:
--   Creates a SECURITY DEFINER RPC to materialize task instances
--   from active recurring templates for a given tenant and date range.
--   Enforces caller membership and bounds date range to max 45 days.
-- ============================================================

CREATE OR REPLACE FUNCTION public.materialize_peternak_task_instances(
  p_tenant_id uuid,
  p_start_date date,
  p_end_date date,
  p_livestock_type text default null
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_template record;
  v_profile_id uuid;
  v_curr_date date;
  v_should_create boolean;
BEGIN
  -- 1. Security Check: auth.uid() must not be null
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Access Denied: Authentication required';
  END IF;

  -- 2. Security Check: Caller must be a member of p_tenant_id
  IF NOT (public.is_tenant_member(p_tenant_id) OR public.is_superadmin()) THEN
    RAISE EXCEPTION 'Access Denied: You are not a member of this tenant';
  END IF;

  -- 3. Security Check: Date range must be bounded (max 45 days)
  IF (p_end_date - p_start_date) > 45 THEN
    RAISE EXCEPTION 'Invalid Date Range: Maximum allowed range is 45 days';
  END IF;
  IF p_start_date > p_end_date THEN
    RAISE EXCEPTION 'Invalid Date Range: Start date must be before or equal to end date';
  END IF;

  -- 4. Loop through active templates for the given p_tenant_id
  FOR v_template IN 
    SELECT * FROM public.peternak_task_templates 
    WHERE tenant_id = p_tenant_id 
      AND is_active = TRUE 
      AND is_deleted = FALSE
      AND (p_livestock_type IS NULL OR livestock_type = p_livestock_type)
  LOOP
    -- Resolve assigned_profile_id from worker record if default_assignee_worker_id is linked
    v_profile_id := NULL;
    IF v_template.default_assignee_worker_id IS NOT NULL THEN
      SELECT profile_id INTO v_profile_id
      FROM public.kandang_workers
      WHERE id = v_template.default_assignee_worker_id;
    END IF;

    -- Loop day-by-day in the range [p_start_date, p_end_date] restricted to template validity
    v_curr_date := GREATEST(p_start_date, v_template.start_date);
    WHILE v_curr_date <= LEAST(p_end_date, COALESCE(v_template.end_date, p_end_date)) LOOP
      -- Idempotency check: check if task instance already exists (skip if it does)
      IF NOT EXISTS (
        SELECT 1 FROM public.peternak_task_instances 
        WHERE tenant_id = p_tenant_id 
          AND template_id = v_template.id 
          AND due_date = v_curr_date 
          AND is_deleted = FALSE
      ) THEN
        v_should_create := FALSE;

        -- Mirror existing recurrence logic
        CASE v_template.recurring_type
          WHEN 'harian' THEN
            v_should_create := TRUE;

          WHEN 'mingguan' THEN
            IF EXTRACT(isodow FROM v_curr_date) = ANY(v_template.recurring_days_of_week) THEN
              v_should_create := TRUE;
            END IF;

          WHEN 'dua_mingguan' THEN
            IF (v_curr_date - v_template.start_date) % 14 = 0 THEN
              v_should_create := TRUE;
            END IF;

          WHEN 'bulanan' THEN
            IF EXTRACT(day FROM v_curr_date) = EXTRACT(day FROM v_template.start_date) THEN
              v_should_create := TRUE;
            END IF;

          WHEN 'custom' THEN
            IF (v_curr_date - v_template.start_date) % COALESCE(v_template.recurring_interval_days, 1) = 0 THEN
              v_should_create := TRUE;
            END IF;

          WHEN 'sekali' THEN
            IF v_curr_date = v_template.start_date THEN
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
            p_tenant_id, v_template.id, v_template.kandang_name,
            v_template.title, v_template.description, v_template.task_type,
            v_curr_date, v_template.due_time,
            v_template.default_assignee_worker_id, v_profile_id
          )
          ON CONFLICT DO NOTHING;
        END IF;
      END IF;

      v_curr_date := v_curr_date + 1;
    END LOOP;
  END LOOP;
END;
$$;

GRANT EXECUTE ON FUNCTION public.materialize_peternak_task_instances(uuid, date, date, text) TO authenticated;
