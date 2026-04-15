-- Migration: Add business_limit to profiles
-- Default limit is 1 (the initial business)

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS business_limit INT4 DEFAULT 1;

-- Add comment for clarity
COMMENT ON COLUMN public.profiles.business_limit IS 'Maximum number of businesses (tenants) this user account is allowed to own/participate in.';
