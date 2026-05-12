-- ============================================================
-- Migration: Public Market Stats RPC
-- Path: supabase/migrations/20260413_public_market_stats_rpc.sql
-- Purpose: Safely expose aggregate platform stats to public users
--          bypassing RLS via SECURITY DEFINER.
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_public_market_stats()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_map json;
BEGIN
  -- Build a map of province -> transaction_count in last 7 days
  SELECT json_object_agg(province, tx_count) INTO v_map
  FROM (
    SELECT province, COUNT(*) as tx_count
    FROM (
      SELECT farms.province 
      FROM public.purchases p
      JOIN public.farms farms ON p.farm_id = farms.id
      WHERE p.transaction_date >= (CURRENT_DATE - INTERVAL '7 days')::date 
        AND p.is_deleted = false
      
      UNION ALL
      
      SELECT rpa.province 
      FROM public.sales s
      JOIN public.rpa_clients rpa ON s.rpa_id = rpa.id
      WHERE s.transaction_date >= (CURRENT_DATE - INTERVAL '7 days')::date 
        AND s.is_deleted = false
    ) all_tx
    WHERE province IS NOT NULL
    GROUP BY province
  ) grouped;

  RETURN COALESCE(v_map, '{}'::json);
END;
$$;

-- Grant access to both authenticated and anonymous users
GRANT EXECUTE ON FUNCTION public.get_public_market_stats() TO anon, authenticated, service_role;
