-- Migration: Add additional_slots to profiles
-- This tracks purchased add-on slots, independent of the plan-based limits.

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS additional_slots INT4 DEFAULT 0;

-- Add comment
COMMENT ON COLUMN public.profiles.additional_slots IS 'Number of extra business slots purchased as add-ons by this user.';
