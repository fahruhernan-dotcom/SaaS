-- Migration: Ensure unique constraint exists on market_prices
-- Root cause: triggers use ON CONFLICT (price_date, chicken_type, region)
-- but the unique constraint was missing from the live DB,
-- causing every purchase/sale INSERT to fail with:
-- "there is no unique or exclusion constraint matching the ON CONFLICT specification"

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.market_prices'::regclass
      AND contype = 'u'
      AND conname = 'market_prices_price_date_chicken_type_region_key'
  ) THEN
    ALTER TABLE public.market_prices
      ADD CONSTRAINT market_prices_price_date_chicken_type_region_key
      UNIQUE (price_date, chicken_type, region);
  END IF;
END $$;
