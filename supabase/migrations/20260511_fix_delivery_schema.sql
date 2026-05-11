-- Sembako Delivery Schema Fix
-- This script ensures all required columns for tracking timestamps exist
-- and allows the 'arrived' status.

-- 1. Ensure timestamp columns exist
ALTER TABLE public.sembako_deliveries
  ADD COLUMN IF NOT EXISTS departed_at  timestamptz,
  ADD COLUMN IF NOT EXISTS arrived_at   timestamptz,
  ADD COLUMN IF NOT EXISTS completed_at timestamptz;

-- 2. If there's an existing check constraint on 'status', we need to update it.
-- We'll try to find and drop any status constraint first to avoid errors.
DO $$
DECLARE
    constraint_name text;
BEGIN
    SELECT con.conname INTO constraint_name
    FROM pg_constraint con
    JOIN pg_class rel ON rel.oid = con.conrelid
    JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
    WHERE nsp.nspname = 'public'
      AND rel.relname = 'sembako_deliveries'
      AND con.contype = 'c'
      AND pg_get_constraintdef(con.oid) ILIKE '%status%';

    IF constraint_name IS NOT NULL THEN
        EXECUTE 'ALTER TABLE public.sembako_deliveries DROP CONSTRAINT ' || quote_ident(constraint_name);
    END IF;
END $$;

-- 3. Apply a fresh check constraint that includes 'arrived'
ALTER TABLE public.sembako_deliveries
  ADD CONSTRAINT sembako_deliveries_status_check
  CHECK (status IN ('pending', 'on_route', 'arrived', 'delivered', 'cancelled'));
