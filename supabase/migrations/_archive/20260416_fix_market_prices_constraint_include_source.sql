-- =============================================================
-- Migration: Fix market_prices unique constraint — include source
-- =============================================================
-- Root cause:
--   Constraint unique(price_date, chicken_type, region) caused
--   auto_scraper rows (Chickin.id) and arboge_* rows to conflict
--   for the same region on the same day. During cleanup, one source
--   was deleted — causing gaps in the dashboard tooltip.
--
-- Fix:
--   1. Dedup within same (date, type, region, source)
--   2. Drop old constraint
--   3. Add new constraint including source
--   4. Update trigger ON CONFLICT clauses
-- =============================================================

-- ── Step 1: Dedup within same (price_date, chicken_type, region, source) ──
-- Safe: keeps the most recent row per (date, type, region, source) combo
DELETE FROM public.market_prices
WHERE id NOT IN (
  SELECT DISTINCT ON (price_date, chicken_type, region, source) id
  FROM public.market_prices
  ORDER BY price_date, chicken_type, region, source, updated_at DESC NULLS LAST
);

-- Verify (should show total_rows = unique_combos)
SELECT
  COUNT(*) AS total_rows,
  COUNT(DISTINCT (price_date, chicken_type, region, source)) AS unique_combos
FROM public.market_prices;

-- ── Step 2: Drop old narrow constraint ──
ALTER TABLE public.market_prices
  DROP CONSTRAINT IF EXISTS market_prices_price_date_chicken_type_region_key;

-- ── Step 3: Add correct constraint (includes source) ──
ALTER TABLE public.market_prices
  ADD CONSTRAINT market_prices_price_date_chicken_type_region_source_key
  UNIQUE (price_date, chicken_type, region, source);

-- ── Step 4: Update aggregate_daily_market_price() ──
-- Now uses ON CONFLICT (price_date, chicken_type, region, source)
CREATE OR REPLACE FUNCTION aggregate_daily_market_price(p_date date)
RETURNS void AS $$
DECLARE
  v_avg_buy  numeric(12,2);
  v_avg_sell numeric(12,2);
  v_tx_count int;
BEGIN
  SELECT ROUND(AVG(price_per_kg)::numeric, 0), COUNT(*)
  INTO v_avg_buy, v_tx_count
  FROM purchases
  WHERE transaction_date::date = p_date
    AND is_deleted = false
    AND price_per_kg > 0;

  SELECT ROUND(AVG(price_per_kg)::numeric, 0)
  INTO v_avg_sell
  FROM sales
  WHERE transaction_date::date = p_date
    AND is_deleted = false
    AND price_per_kg > 0;

  IF COALESCE(v_tx_count, 0) > 0 OR v_avg_sell IS NOT NULL THEN
    INSERT INTO market_prices (
      price_date, chicken_type, region,
      avg_buy_price, avg_sell_price,
      farm_gate_price, buyer_price,
      transaction_count, source
    )
    VALUES (
      p_date, 'broiler', 'Nasional',
      COALESCE(v_avg_buy, 0),
      COALESCE(v_avg_sell, 0),
      COALESCE(v_avg_buy, 0),
      COALESCE(v_avg_sell, 0),
      COALESCE(v_tx_count, 0),
      'transaction'
    )
    ON CONFLICT (price_date, chicken_type, region, source) DO UPDATE
    SET
      avg_buy_price     = EXCLUDED.avg_buy_price,
      avg_sell_price    = EXCLUDED.avg_sell_price,
      farm_gate_price   = EXCLUDED.farm_gate_price,
      buyer_price       = EXCLUDED.buyer_price,
      transaction_count = EXCLUDED.transaction_count
    WHERE market_prices.source = 'transaction'
       OR market_prices.source IS NULL;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── Step 5: Update record_market_price() ──
-- (trigger dari fix_market_price_trigger.sql — pakai 'Nasional' kapital)
CREATE OR REPLACE FUNCTION record_market_price()
RETURNS TRIGGER LANGUAGE plpgsql AS $func$
DECLARE
  v_date   date := new.transaction_date;
  v_region text := 'Nasional';
BEGIN
  -- PURCHASES → update avg_buy_price
  IF TG_TABLE_NAME = 'purchases' THEN
    INSERT INTO market_prices
      (price_date, chicken_type, region,
       avg_buy_price, farm_gate_price,
       transaction_count, source)
    VALUES (
      v_date, 'broiler', v_region,
      new.price_per_kg, new.price_per_kg,
      1, 'transaction'
    )
    ON CONFLICT (price_date, chicken_type, region, source)
    DO UPDATE SET
      avg_buy_price = (
        COALESCE(market_prices.avg_buy_price, 0)
        * market_prices.transaction_count
        + new.price_per_kg
      ) / (market_prices.transaction_count + 1),
      farm_gate_price = (
        COALESCE(market_prices.farm_gate_price, 0)
        * market_prices.transaction_count
        + new.price_per_kg
      ) / (market_prices.transaction_count + 1),
      transaction_count = market_prices.transaction_count + 1,
      updated_at = now()
    WHERE market_prices.source = 'transaction'
       OR market_prices.source IS NULL;
  END IF;

  -- SALES → update avg_sell_price
  IF TG_TABLE_NAME = 'sales' THEN
    INSERT INTO market_prices
      (price_date, chicken_type, region,
       avg_sell_price, buyer_price,
       transaction_count, source)
    VALUES (
      v_date, 'broiler', v_region,
      new.price_per_kg, new.price_per_kg,
      1, 'transaction'
    )
    ON CONFLICT (price_date, chicken_type, region, source)
    DO UPDATE SET
      avg_sell_price = (
        COALESCE(market_prices.avg_sell_price, 0)
        * market_prices.transaction_count
        + new.price_per_kg
      ) / (market_prices.transaction_count + 1),
      buyer_price = (
        COALESCE(market_prices.buyer_price, 0)
        * market_prices.transaction_count
        + new.price_per_kg
      ) / (market_prices.transaction_count + 1),
      transaction_count = market_prices.transaction_count + 1,
      updated_at = now()
    WHERE market_prices.source = 'transaction'
       OR market_prices.source IS NULL;
  END IF;

  RETURN new;
END;
$func$;

-- ── Verify triggers masih terpasang ──
SELECT trigger_name, event_object_table, event_manipulation
FROM information_schema.triggers
WHERE trigger_schema = 'public'
  AND event_object_table IN ('purchases', 'sales')
ORDER BY event_object_table, trigger_name;
