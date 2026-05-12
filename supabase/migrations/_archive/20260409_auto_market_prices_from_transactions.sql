-- ============================================================
-- Migration: Auto-populate market_prices from broker transactions
-- ============================================================
-- Flow:
--   1. Broker catat purchases (beli dari kandang) → avg_buy_price
--   2. Broker catat sales (jual ke RPA) → avg_sell_price
--   3. Trigger recalculates daily averages → upsert market_prices
--
-- Priority rules:
--   - source='transaction': auto-computed dari real transactions, bisa di-overwrite
--   - source='manual': diisi admin, TIDAK akan di-overwrite oleh trigger
--   - source='import': data scraper, TIDAK akan di-overwrite oleh trigger
--
-- broker_margin is a GENERATED column — never insert it directly
-- ============================================================


-- ──────────────────────────────────────────────────────────────
-- Core aggregation function
-- Called by both purchase and sale triggers
-- ──────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION aggregate_daily_market_price(p_date date)
RETURNS void AS $$
DECLARE
  v_avg_buy      numeric(12,2);
  v_avg_sell     numeric(12,2);
  v_tx_count     int;
BEGIN
  -- Average buy price from purchases on this date (cross-tenant, all brokers)
  SELECT
    ROUND(AVG(price_per_kg)::numeric, 0),
    COUNT(*)
  INTO v_avg_buy, v_tx_count
  FROM purchases
  WHERE transaction_date::date = p_date
    AND is_deleted = false
    AND price_per_kg > 0;

  -- Average sell price from sales on this date (cross-tenant, all brokers)
  SELECT ROUND(AVG(price_per_kg)::numeric, 0)
  INTO v_avg_sell
  FROM sales
  WHERE transaction_date::date = p_date
    AND is_deleted = false
    AND price_per_kg > 0;

  -- Only write if there's at least one transaction (buy or sell)
  IF COALESCE(v_tx_count, 0) > 0 OR v_avg_sell IS NOT NULL THEN
    INSERT INTO market_prices (
      price_date,
      chicken_type,
      region,
      avg_buy_price,
      avg_sell_price,
      farm_gate_price,    -- legacy fallback column
      buyer_price,        -- legacy fallback column
      transaction_count,
      source
    )
    VALUES (
      p_date,
      'broiler',
      'Nasional',
      COALESCE(v_avg_buy, 0),
      COALESCE(v_avg_sell, 0),
      COALESCE(v_avg_buy, 0),
      COALESCE(v_avg_sell, 0),
      COALESCE(v_tx_count, 0),
      'transaction'
    )
    ON CONFLICT (price_date, chicken_type, region) DO UPDATE
    SET
      avg_buy_price     = EXCLUDED.avg_buy_price,
      avg_sell_price    = EXCLUDED.avg_sell_price,
      farm_gate_price   = EXCLUDED.farm_gate_price,
      buyer_price       = EXCLUDED.buyer_price,
      transaction_count = EXCLUDED.transaction_count,
      source            = 'transaction'
    -- NEVER overwrite manual or imported data
    WHERE market_prices.source = 'transaction'
       OR market_prices.source IS NULL;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ──────────────────────────────────────────────────────────────
-- Trigger functions (thin wrappers — extract date, call core fn)
-- ──────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION trg_purchases_sync_market_price()
RETURNS trigger AS $$
DECLARE
  v_date date;
BEGIN
  -- Handle INSERT/UPDATE → use NEW; DELETE → use OLD
  v_date := COALESCE(
    (NEW.transaction_date)::date,
    (OLD.transaction_date)::date
  );

  PERFORM aggregate_daily_market_price(v_date);

  -- If date changed, also recalculate the OLD date
  IF TG_OP = 'UPDATE'
     AND OLD.transaction_date IS DISTINCT FROM NEW.transaction_date THEN
    PERFORM aggregate_daily_market_price(OLD.transaction_date::date);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


CREATE OR REPLACE FUNCTION trg_sales_sync_market_price()
RETURNS trigger AS $$
DECLARE
  v_date date;
BEGIN
  v_date := COALESCE(
    (NEW.transaction_date)::date,
    (OLD.transaction_date)::date
  );

  PERFORM aggregate_daily_market_price(v_date);

  IF TG_OP = 'UPDATE'
     AND OLD.transaction_date IS DISTINCT FROM NEW.transaction_date THEN
    PERFORM aggregate_daily_market_price(OLD.transaction_date::date);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ──────────────────────────────────────────────────────────────
-- Attach triggers
-- ──────────────────────────────────────────────────────────────
DROP TRIGGER IF EXISTS sync_market_price_on_purchase ON purchases;
CREATE TRIGGER sync_market_price_on_purchase
  AFTER INSERT OR UPDATE OR DELETE ON purchases
  FOR EACH ROW
  EXECUTE FUNCTION trg_purchases_sync_market_price();


DROP TRIGGER IF EXISTS sync_market_price_on_sale ON sales;
CREATE TRIGGER sync_market_price_on_sale
  AFTER INSERT OR UPDATE OR DELETE ON sales
  FOR EACH ROW
  EXECUTE FUNCTION trg_sales_sync_market_price();


-- ──────────────────────────────────────────────────────────────
-- Backfill: compute averages for all existing transaction dates
-- Run once to populate historical data
-- ──────────────────────────────────────────────────────────────
DO $$
DECLARE
  r record;
BEGIN
  -- Get all distinct transaction dates from purchases + sales
  FOR r IN
    SELECT DISTINCT transaction_date::date AS tx_date
    FROM (
      SELECT transaction_date FROM purchases WHERE is_deleted = false AND price_per_kg > 0
      UNION
      SELECT transaction_date FROM sales    WHERE is_deleted = false AND price_per_kg > 0
    ) combined
    WHERE transaction_date IS NOT NULL
    ORDER BY tx_date
  LOOP
    PERFORM aggregate_daily_market_price(r.tx_date);
  END LOOP;
END $$;
