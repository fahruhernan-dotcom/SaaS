-- Add timestamp tracking columns to sembako_deliveries
-- Flow: pending → on_route (departed_at) → arrived (arrived_at) → delivered (completed_at)

ALTER TABLE public.sembako_deliveries
  ADD COLUMN IF NOT EXISTS departed_at  timestamptz,
  ADD COLUMN IF NOT EXISTS arrived_at   timestamptz,
  ADD COLUMN IF NOT EXISTS completed_at timestamptz;

-- Allow 'arrived' as a valid status (sits between on_route and delivered)
-- No CHECK constraint on status column in this table, so just documenting the new value here.
-- Valid values: 'pending' | 'on_route' | 'arrived' | 'delivered'
