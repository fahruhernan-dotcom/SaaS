-- ============================================================
-- Fix Trigger Function: aggregate_daily_market_price
-- Issue: Inserting 0 instead of NULL causes Check Constraint
--        violations and ruins historical price averages.
-- ============================================================

CREATE OR REPLACE FUNCTION public.aggregate_daily_market_price(p_date date)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_avg_buy  numeric(12,2);
  v_avg_sell numeric(12,2);
  v_tx_count int;
BEGIN
  -- Get average buy price
  SELECT ROUND(AVG(price_per_kg)::numeric, 0), COUNT(*)
  INTO v_avg_buy, v_tx_count
  FROM public.purchases
  WHERE transaction_date::date = p_date
    AND is_deleted = false
    AND price_per_kg > 0;

  -- Get average sell price
  SELECT ROUND(AVG(price_per_kg)::numeric, 0)
  INTO v_avg_sell
  FROM public.sales
  WHERE transaction_date::date = p_date
    AND is_deleted = false
    AND price_per_kg > 0;

  -- Only upsert if there are transactions OR we found an avg sell price
  IF COALESCE(v_tx_count, 0) > 0 OR v_avg_sell IS NOT NULL THEN
    INSERT INTO public.market_prices (
      price_date,
      chicken_type,
      region,
      avg_buy_price,
      avg_sell_price,
      farm_gate_price,
      buyer_price,
      transaction_count,
      source
    )
    VALUES (
      p_date,
      'broiler',
      'Nasional',
      
      -- Use NULL instead of 0 to avoid breaking CHECK constraints 
      -- and to prevent ruining weekly/monthly averages
      NULLIF(COALESCE(v_avg_buy, 0), 0),
      NULLIF(COALESCE(v_avg_sell, 0), 0),
      NULLIF(COALESCE(v_avg_buy, 0), 0),
      NULLIF(COALESCE(v_avg_sell, 0), 0),
      
      COALESCE(v_tx_count, 0),
      'transaction'
    )
    ON CONFLICT (price_date, chicken_type, region, source)
    DO UPDATE
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
$function$;
