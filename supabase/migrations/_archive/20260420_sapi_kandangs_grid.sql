-- Add grid positioning columns to sapi_kandangs
-- These store the top-left corner of each kandang on the floor plan grid
-- where 1 unit = 1 meter, matching panjang_m / lebar_m dimensions

ALTER TABLE sapi_kandangs
  ADD COLUMN IF NOT EXISTS grid_x INT,
  ADD COLUMN IF NOT EXISTS grid_y INT;
