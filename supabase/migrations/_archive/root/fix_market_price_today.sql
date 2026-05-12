-- =============================================================
-- fix_market_price_today.sql
-- Tujuan: Koreksi data market_prices hari ini yang sudah
--         terlanjur terisi dengan nilai salah.
--
-- Cara pakai:
--   Jalankan SETELAH fix_market_price_trigger.sql berhasil.
-- =============================================================

-- Step 1: Koreksi data hari ini
UPDATE market_prices
SET
  avg_buy_price = (
    SELECT ROUND(AVG(price_per_kg))
    FROM purchases
    WHERE transaction_date = current_date
      AND is_deleted = false
  ),
  farm_gate_price = (
    SELECT ROUND(AVG(price_per_kg))
    FROM purchases
    WHERE transaction_date = current_date
      AND is_deleted = false
  ),
  avg_sell_price = (
    SELECT ROUND(AVG(price_per_kg))
    FROM sales
    WHERE transaction_date = current_date
      AND is_deleted = false
  ),
  buyer_price = (
    SELECT ROUND(AVG(price_per_kg))
    FROM sales
    WHERE transaction_date = current_date
      AND is_deleted = false
  ),
  updated_at = now()
WHERE price_date = current_date
  AND chicken_type = 'broiler'
  AND region = 'nasional';

-- Step 2: Verifikasi hasil
--   Harap sesuai dengan inputan broker:
--   harga_beli = nilai di form "Harga Beli Rp/kg"
--   harga_jual = nilai di form "Harga Jual Rp/kg"
SELECT
  price_date,
  avg_buy_price  AS harga_beli,
  avg_sell_price AS harga_jual,
  avg_sell_price - avg_buy_price AS margin,
  transaction_count              AS jumlah_tx,
  source
FROM market_prices
WHERE price_date = current_date;
