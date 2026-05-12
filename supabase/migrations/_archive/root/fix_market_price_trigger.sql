-- =============================================================
-- fix_market_price_trigger.sql
-- Tujuan: Fix trigger harga pasar agar gunakan price_per_kg
--         langsung dari input form, bukan hasil kalkulasi.
--
-- Cara pakai:
--   1. Buka Supabase SQL Editor
--   2. Copy-paste SELURUH isi file ini
--   3. Jalankan (Run)
--   4. Lanjut ke fix_market_price_today.sql
-- =============================================================

-- Step 1: Drop trigger lama (jika ada)
DROP TRIGGER IF EXISTS trigger_record_market_price_purchases ON purchases;
DROP TRIGGER IF EXISTS trigger_record_market_price_sales ON sales;

-- Step 2: Buat ulang function dengan logika yang benar
--   BENAR: pakai new.price_per_kg  (inputan langsung dari broker)
--   SALAH: total_cost / quantity, atau total_revenue / total_weight_kg
CREATE OR REPLACE FUNCTION record_market_price()
RETURNS TRIGGER LANGUAGE plpgsql AS $func$
DECLARE
  v_date   date := new.transaction_date;
  v_region text := 'nasional';
BEGIN
  -- ── PURCHASES → update avg_buy_price ─────────────────────
  IF TG_TABLE_NAME = 'purchases' THEN
    INSERT INTO market_prices
      (price_date, chicken_type, region,
       avg_buy_price, farm_gate_price,
       transaction_count, source)
    VALUES (
      v_date, 'broiler', v_region,
      new.price_per_kg,
      new.price_per_kg,
      1, 'transaction'
    )
    ON CONFLICT (price_date, chicken_type, region)
    DO UPDATE SET
      avg_buy_price = (
        COALESCE(market_prices.avg_buy_price, 0)
        * market_prices.transaction_count
        + new.price_per_kg
      ) / (market_prices.transaction_count + 1),
      farm_gate_price = (
        COALESCE(market_prices.farm_gate_price, 0)
        * market_prices.transaction_count
        + new.price_per_kg
      ) / (market_prices.transaction_count + 1),
      transaction_count = market_prices.transaction_count + 1,
      updated_at = now();
  END IF;

  -- ── SALES → update avg_sell_price ────────────────────────
  IF TG_TABLE_NAME = 'sales' THEN
    INSERT INTO market_prices
      (price_date, chicken_type, region,
       avg_sell_price, buyer_price,
       transaction_count, source)
    VALUES (
      v_date, 'broiler', v_region,
      new.price_per_kg,
      new.price_per_kg,
      1, 'transaction'
    )
    ON CONFLICT (price_date, chicken_type, region)
    DO UPDATE SET
      avg_sell_price = (
        COALESCE(market_prices.avg_sell_price, 0)
        * market_prices.transaction_count
        + new.price_per_kg
      ) / (market_prices.transaction_count + 1),
      buyer_price = (
        COALESCE(market_prices.buyer_price, 0)
        * market_prices.transaction_count
        + new.price_per_kg
      ) / (market_prices.transaction_count + 1),
      transaction_count = market_prices.transaction_count + 1,
      updated_at = now();
  END IF;

  RETURN new;
END;
$func$;

-- Step 3: Pasang kembali trigger ke kedua tabel
CREATE TRIGGER trigger_record_market_price_purchases
  AFTER INSERT ON purchases
  FOR EACH ROW EXECUTE FUNCTION record_market_price();

CREATE TRIGGER trigger_record_market_price_sales
  AFTER INSERT ON sales
  FOR EACH ROW EXECUTE FUNCTION record_market_price();

-- Step 4: Verifikasi trigger terpasang
SELECT
  trigger_name,
  event_object_table AS "table",
  action_timing,
  event_manipulation AS "event"
FROM information_schema.triggers
WHERE trigger_schema = 'public'
  AND trigger_name LIKE 'trigger_record_market%'
ORDER BY event_object_table;
