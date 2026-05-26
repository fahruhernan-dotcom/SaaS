-- Migration: Grant EXECUTE permission on get_public_market_stats to anon role
-- Description: Allow anonymous users to view public market statistics on the public landing page

GRANT EXECUTE ON FUNCTION public.get_public_market_stats() TO anon;
