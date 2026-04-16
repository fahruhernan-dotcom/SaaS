-- =============================================================
-- Migration: Remove redundant record_market_price() trigger
-- =============================================================
-- Root cause:
--   Two triggers fire on purchases/sales INSERT:
--     1. record_market_price()     — incremental running average (old)
--     2. aggregate_daily_market_price() — full recompute (new, safer)
--
--   Running both causes double-counting and drift:
--     - record_market_price() increments transaction_count +1 each row
--     - aggregate_daily_market_price() then overwrites with a fresh COUNT(*)
--   They conflict on the same ON CONFLICT target, leading to inconsistent
--   transaction_count values depending on trigger execution order.
--
-- Fix: Drop the record_market_price() triggers (incremental approach).
--      Keep sync_market_price_on_purchase / sync_market_price_on_sale
--      which call aggregate_daily_market_price() (full recompute).
-- =============================================================

-- Drop record_market_price trigger from purchases (try common names)
DROP TRIGGER IF EXISTS record_market_price_on_purchases ON public.purchases;
DROP TRIGGER IF EXISTS record_market_price_on_purchase  ON public.purchases;
DROP TRIGGER IF EXISTS market_price_on_purchases        ON public.purchases;
DROP TRIGGER IF EXISTS market_price_trigger_purchases   ON public.purchases;
DROP TRIGGER IF EXISTS trg_record_market_price_purchase ON public.purchases;

-- Drop record_market_price trigger from sales (try common names)
DROP TRIGGER IF EXISTS record_market_price_on_sales     ON public.sales;
DROP TRIGGER IF EXISTS record_market_price_on_sale      ON public.sales;
DROP TRIGGER IF EXISTS market_price_on_sales            ON public.sales;
DROP TRIGGER IF EXISTS market_price_trigger_sales       ON public.sales;
DROP TRIGGER IF EXISTS trg_record_market_price_sale     ON public.sales;

-- Ensure the correct aggregate triggers are in place
-- (idempotent — safe to re-create)
DROP TRIGGER IF EXISTS sync_market_price_on_purchase ON public.purchases;
CREATE TRIGGER sync_market_price_on_purchase
  AFTER INSERT OR UPDATE OR DELETE ON public.purchases
  FOR EACH ROW
  EXECUTE FUNCTION trg_purchases_sync_market_price();

DROP TRIGGER IF EXISTS sync_market_price_on_sale ON public.sales;
CREATE TRIGGER sync_market_price_on_sale
  AFTER INSERT OR UPDATE OR DELETE ON public.sales
  FOR EACH ROW
  EXECUTE FUNCTION trg_sales_sync_market_price();

-- Verify: should show exactly 2 triggers on purchases and 2 on sales
-- (set_updated_at_* + sync_market_price_*)
SELECT trigger_name, event_object_table, event_manipulation
FROM information_schema.triggers
WHERE trigger_schema = 'public'
  AND event_object_table IN ('purchases', 'sales')
ORDER BY event_object_table, trigger_name;
