-- Remove default 14-day trial from tenants table
-- Accounts will now stay on 'starter' plan indefinitely unless trialed/upgraded

-- 1. Remove the default value from trial_ends_at
ALTER TABLE tenants ALTER COLUMN trial_ends_at DROP DEFAULT;

-- 2. Reset existing Starter tenants who are currently on trial to have no expiration
UPDATE tenants 
SET trial_ends_at = NULL 
WHERE plan = 'starter';

-- 3. (Optional) Ensure newborn tenants via handle_new_user trigger use NULL (done via ALTER COLUMN DROP DEFAULT)
