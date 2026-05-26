-- Migration: Grant EXECUTE permission on get_province_price_trends to anon role
-- Description: Allow anonymous users to view public market price trends on the public landing page

GRANT EXECUTE ON FUNCTION public.get_province_price_trends TO anon;
