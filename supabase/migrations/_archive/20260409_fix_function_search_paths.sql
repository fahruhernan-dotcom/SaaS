-- ============================================================
-- Migration: Fix function_search_path_mutable warnings (batch 2)
-- Resolves: Supabase Security Linter 0011 for new functions added after
--   the initial linter-fix migration (2026040104_resolve_linter_warnings.sql)
--
-- Affected functions:
--   1. aggregate_daily_market_price   — new in 20260409
--   2. trg_purchases_sync_market_price — new in 20260409
--   3. trg_sales_sync_market_price    — new in 20260409
--   4. downgrade_expired_plans        — exists in DB, added directly
--   5. update_ai_conversations_updated_at — added via AI migrations
--   6. update_ai_pending_entries_updated_at — added via AI migrations
--   7. set_updated_at                 — re-confirm (was set to 'public', now empty string)
--
-- Fix: SET search_path = '' forces fully-qualified table references
--      and prevents search path injection attacks.
-- ============================================================

-- Market price sync functions (created in 20260409_auto_market_prices)
-- Re-create with SET search_path = '' and explicit public. schema prefixes

CREATE OR REPLACE FUNCTION public.aggregate_daily_market_price(p_date date)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_avg_buy   numeric(12,2);
  v_avg_sell  numeric(12,2);
  v_tx_count  int;
BEGIN
  SELECT
    ROUND(AVG(price_per_kg)::numeric, 0),
    COUNT(*)
  INTO v_avg_buy, v_tx_count
  FROM public.purchases
  WHERE transaction_date::date = p_date
    AND is_deleted = false
    AND price_per_kg > 0;

  SELECT ROUND(AVG(price_per_kg)::numeric, 0)
  INTO v_avg_sell
  FROM public.sales
  WHERE transaction_date::date = p_date
    AND is_deleted = false
    AND price_per_kg > 0;

  IF COALESCE(v_tx_count, 0) > 0 OR v_avg_sell IS NOT NULL THEN
    INSERT INTO public.market_prices (
      price_date, chicken_type, region,
      avg_buy_price, avg_sell_price,
      farm_gate_price, buyer_price,
      transaction_count, source
    )
    VALUES (
      p_date, 'broiler', 'Nasional',
      COALESCE(v_avg_buy, 0), COALESCE(v_avg_sell, 0),
      COALESCE(v_avg_buy, 0), COALESCE(v_avg_sell, 0),
      COALESCE(v_tx_count, 0), 'transaction'
    )
    ON CONFLICT (price_date, chicken_type, region) DO UPDATE
    SET
      avg_buy_price     = EXCLUDED.avg_buy_price,
      avg_sell_price    = EXCLUDED.avg_sell_price,
      farm_gate_price   = EXCLUDED.farm_gate_price,
      buyer_price       = EXCLUDED.buyer_price,
      transaction_count = EXCLUDED.transaction_count,
      source            = 'transaction'
    WHERE public.market_prices.source = 'transaction'
       OR public.market_prices.source IS NULL;
  END IF;
END;
$$;


CREATE OR REPLACE FUNCTION public.trg_purchases_sync_market_price()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_date date;
BEGIN
  v_date := COALESCE(
    (NEW.transaction_date)::date,
    (OLD.transaction_date)::date
  );

  PERFORM public.aggregate_daily_market_price(v_date);

  IF TG_OP = 'UPDATE'
     AND OLD.transaction_date IS DISTINCT FROM NEW.transaction_date THEN
    PERFORM public.aggregate_daily_market_price(OLD.transaction_date::date);
  END IF;

  RETURN NEW;
END;
$$;


CREATE OR REPLACE FUNCTION public.trg_sales_sync_market_price()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_date date;
BEGIN
  v_date := COALESCE(
    (NEW.transaction_date)::date,
    (OLD.transaction_date)::date
  );

  PERFORM public.aggregate_daily_market_price(v_date);

  IF TG_OP = 'UPDATE'
     AND OLD.transaction_date IS DISTINCT FROM NEW.transaction_date THEN
    PERFORM public.aggregate_daily_market_price(OLD.transaction_date::date);
  END IF;

  RETURN NEW;
END;
$$;


-- For functions that exist in DB but whose full body we don't need to re-declare,
-- ALTER FUNCTION is sufficient to add SET search_path = ''
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid
             WHERE n.nspname = 'public' AND p.proname = 'downgrade_expired_plans') THEN
    ALTER FUNCTION public.downgrade_expired_plans() SET search_path = '';
  END IF;

  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid
             WHERE n.nspname = 'public' AND p.proname = 'update_ai_conversations_updated_at') THEN
    ALTER FUNCTION public.update_ai_conversations_updated_at() SET search_path = '';
  END IF;

  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid
             WHERE n.nspname = 'public' AND p.proname = 'update_ai_pending_entries_updated_at') THEN
    ALTER FUNCTION public.update_ai_pending_entries_updated_at() SET search_path = '';
  END IF;

  -- Re-confirm set_updated_at with stricter empty string (was previously set to 'public')
  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid
             WHERE n.nspname = 'public' AND p.proname = 'set_updated_at') THEN
    ALTER FUNCTION public.set_updated_at() SET search_path = '';
  END IF;
END $$;

-- ============================================================
-- MANUAL ACTION REQUIRED (cannot be done via SQL):
-- auth_leaked_password_protection:
--   Dashboard → Authentication → Providers → Email
--   → Enable "Leaked Password Protection" → Save
-- ============================================================
