-- ============================================================
-- Fix Constraint: price_values_positive on market_prices
-- ============================================================

-- Drop the overly restrictive constraint
ALTER TABLE public.market_prices 
DROP CONSTRAINT IF EXISTS price_values_positive;

-- Recreate with a safer condition that allows NULLs (for one-sided transactions)
ALTER TABLE public.market_prices 
ADD CONSTRAINT price_values_positive 
CHECK (
  (avg_buy_price IS NULL OR avg_buy_price > 0) AND
  (avg_sell_price IS NULL OR avg_sell_price > 0) AND
  (farm_gate_price IS NULL OR farm_gate_price > 0) AND
  (buyer_price IS NULL OR buyer_price > 0)
);
