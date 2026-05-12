-- Migration: Add secondary_unit and conversion_rate to sembako_products
-- Needed for selling products in a secondary unit (e.g., sell per "karung" where 1 karung = 50 kg)

ALTER TABLE public.sembako_products
  ADD COLUMN IF NOT EXISTS secondary_unit  text    DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS conversion_rate numeric DEFAULT NULL;

COMMENT ON COLUMN public.sembako_products.secondary_unit  IS 'Optional secondary selling unit (e.g., karung, dus)';
COMMENT ON COLUMN public.sembako_products.conversion_rate IS 'How many primary units equal 1 secondary unit (e.g., 50 means 1 karung = 50 kg)';
