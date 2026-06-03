-- ============================================================================
-- Migration Proposal: HPP Mode & Cost Allocation (Fattening)
-- Date: 2026-06-02
-- Status: Proposal Only (Not Executed)
--
-- Description:
-- Adds columns to fattening batches to support HPP modes (Simple vs Detail)
-- and leftover offsets. Adds columns to operational costs to support
-- shared cost allocation split tracking.
-- ============================================================================

-- 1. BATCH TABLES ALTERATIONS
-- Add hpp_mode, leftover_adjustment_idr, and leftover_adjustment_notes
-- Defaults hpp_mode to 'detail' for retro-compatibility.

ALTER TABLE public.domba_penggemukan_batches 
  ADD COLUMN IF NOT EXISTS hpp_mode text NOT NULL DEFAULT 'detail',
  ADD COLUMN IF NOT EXISTS leftover_adjustment_idr numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS leftover_adjustment_notes text;

ALTER TABLE public.kambing_penggemukan_batches 
  ADD COLUMN IF NOT EXISTS hpp_mode text NOT NULL DEFAULT 'detail',
  ADD COLUMN IF NOT EXISTS leftover_adjustment_idr numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS leftover_adjustment_notes text;

ALTER TABLE public.sapi_penggemukan_batches 
  ADD COLUMN IF NOT EXISTS hpp_mode text NOT NULL DEFAULT 'detail',
  ADD COLUMN IF NOT EXISTS leftover_adjustment_idr numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS leftover_adjustment_notes text;


-- 2. OPERATIONAL COSTS TABLES ALTERATIONS
-- Add allocation_role, allocation_parent_id, allocation_method, and allocation_snapshot.
-- Note: Foreign key delete behavior is intentionally omitted (defaults to RESTRICT / NO ACTION)
-- pending final migration review to prevent orphan child allocations.

ALTER TABLE public.domba_penggemukan_operational_costs
  ADD COLUMN IF NOT EXISTS allocation_role text NOT NULL DEFAULT 'direct',
  ADD COLUMN IF NOT EXISTS allocation_parent_id uuid REFERENCES public.domba_penggemukan_operational_costs(id),
  ADD COLUMN IF NOT EXISTS allocation_method text,
  ADD COLUMN IF NOT EXISTS allocation_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE public.kambing_penggemukan_operational_costs
  ADD COLUMN IF NOT EXISTS allocation_role text NOT NULL DEFAULT 'direct',
  ADD COLUMN IF NOT EXISTS allocation_parent_id uuid REFERENCES public.kambing_penggemukan_operational_costs(id),
  ADD COLUMN IF NOT EXISTS allocation_method text,
  ADD COLUMN IF NOT EXISTS allocation_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE public.sapi_penggemukan_operational_costs
  ADD COLUMN IF NOT EXISTS allocation_role text NOT NULL DEFAULT 'direct',
  ADD COLUMN IF NOT EXISTS allocation_parent_id uuid REFERENCES public.sapi_penggemukan_operational_costs(id),
  ADD COLUMN IF NOT EXISTS allocation_method text,
  ADD COLUMN IF NOT EXISTS allocation_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb;


-- 3. RETRO-COMPATIBILITY SETUP
-- Explicitly update existing active or historical rows to fallback values.

UPDATE public.domba_penggemukan_batches 
  SET hpp_mode = 'detail' 
  WHERE hpp_mode IS NULL;

UPDATE public.kambing_penggemukan_batches 
  SET hpp_mode = 'detail' 
  WHERE hpp_mode IS NULL;

UPDATE public.sapi_penggemukan_batches 
  SET hpp_mode = 'detail' 
  WHERE hpp_mode IS NULL;

UPDATE public.domba_penggemukan_operational_costs 
  SET allocation_role = 'direct' 
  WHERE allocation_role IS NULL;

UPDATE public.kambing_penggemukan_operational_costs 
  SET allocation_role = 'direct' 
  WHERE allocation_role IS NULL;

UPDATE public.sapi_penggemukan_operational_costs 
  SET allocation_role = 'direct' 
  WHERE allocation_role IS NULL;
