-- SQL Migration: Add auto_scraper to market_prices source constraint
-- This script expands the allowed values for the source column in market_prices table.

-- 1. Identify and drop the existing constraint if it matches the old definition
ALTER TABLE market_prices 
DROP CONSTRAINT IF EXISTS market_prices_source_check;

-- 2. Add the new constraint including 'auto_scraper'
ALTER TABLE market_prices
ADD CONSTRAINT market_prices_source_check 
CHECK (source IN ('transaction', 'manual', 'import', 'auto_scraper'));

-- 3. Verify the changes
COMMENT ON COLUMN market_prices.source IS 'Source of the price data: transaction (automated from sales/purchases), manual (broker input), import (bulk upload), or auto_scraper (automated script).';
