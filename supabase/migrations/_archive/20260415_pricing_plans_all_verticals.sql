-- Migration: Expand pricing_plans to cover all business verticals
-- Previously only had: broker, peternak, rpa
-- Now adding: egg_broker, sembako_broker
-- Note: 'broker' key maps to business_vertical='poultry_broker' (kept for backward compat)

-- 1. Drop existing role check constraint and recreate with all verticals
ALTER TABLE pricing_plans DROP CONSTRAINT IF EXISTS pricing_plans_role_check;

ALTER TABLE pricing_plans
  ADD CONSTRAINT pricing_plans_role_check
  CHECK (role IN ('broker', 'peternak', 'rpa', 'egg_broker', 'sembako_broker'));

-- 2. Add unique constraint on (role, plan) if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'pricing_plans_role_plan_key'
      AND conrelid = 'pricing_plans'::regclass
  ) THEN
    ALTER TABLE pricing_plans ADD CONSTRAINT pricing_plans_role_plan_key UNIQUE (role, plan);
  END IF;
END $$;

-- 3. Insert new verticals (safe to re-run)
INSERT INTO pricing_plans (role, plan, price, original_price) VALUES
  ('egg_broker',     'pro',      199000, 249000),
  ('egg_broker',     'business', 399000, 499000),
  ('sembako_broker', 'pro',      249000, 299000),
  ('sembako_broker', 'business', 499000, 599000)
ON CONFLICT (role, plan) DO NOTHING;
