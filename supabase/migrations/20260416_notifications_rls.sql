-- =============================================================
-- Migration: Fix notifications RLS — allow tenant users to INSERT
-- =============================================================
-- Root cause:
--   POST /notifications returning 403 because authenticated users
--   (owners, staff) had no INSERT policy on the notifications table.
--   The useNotificationGenerator hook inserts piutang & subscription
--   alerts as the authenticated user, so RLS must allow this.
-- =============================================================

-- SELECT: tenant members can read their own tenant's notifications
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'notifications' AND policyname = 'tenant members can read notifications'
  ) THEN
    CREATE POLICY "tenant members can read notifications"
    ON public.notifications FOR SELECT
    TO authenticated
    USING (
      tenant_id IN (
        SELECT tenant_id FROM public.profiles WHERE id = auth.uid()
      )
    );
  END IF;
END $$;

-- INSERT: tenant members can insert notifications for their own tenant
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'notifications' AND policyname = 'tenant members can insert notifications'
  ) THEN
    CREATE POLICY "tenant members can insert notifications"
    ON public.notifications FOR INSERT
    TO authenticated
    WITH CHECK (
      tenant_id IN (
        SELECT tenant_id FROM public.profiles WHERE id = auth.uid()
      )
    );
  END IF;
END $$;

-- UPDATE: tenant members can update (mark read/deleted) their own notifications
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'notifications' AND policyname = 'tenant members can update notifications'
  ) THEN
    CREATE POLICY "tenant members can update notifications"
    ON public.notifications FOR UPDATE
    TO authenticated
    USING (
      tenant_id IN (
        SELECT tenant_id FROM public.profiles WHERE id = auth.uid()
      )
    );
  END IF;
END $$;

-- Verify
SELECT policyname, cmd, roles
FROM pg_policies
WHERE tablename = 'notifications'
ORDER BY policyname;
