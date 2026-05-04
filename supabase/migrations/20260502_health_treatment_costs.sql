-- Add treatment_cost_idr to health logs for all penggemukan modules to track HPP correctly

ALTER TABLE domba_penggemukan_health_logs
ADD COLUMN IF NOT EXISTS treatment_cost_idr NUMERIC(12, 2) DEFAULT 0;

ALTER TABLE kambing_penggemukan_health_logs
ADD COLUMN IF NOT EXISTS treatment_cost_idr NUMERIC(12, 2) DEFAULT 0;

ALTER TABLE sapi_penggemukan_health_logs
ADD COLUMN IF NOT EXISTS treatment_cost_idr NUMERIC(12, 2) DEFAULT 0;

-- Optional: Also add to breeding modules for future-proofing
ALTER TABLE domba_breeding_health_logs
ADD COLUMN IF NOT EXISTS treatment_cost_idr NUMERIC(12, 2) DEFAULT 0;

ALTER TABLE kambing_breeding_health_logs
ADD COLUMN IF NOT EXISTS treatment_cost_idr NUMERIC(12, 2) DEFAULT 0;

ALTER TABLE sapi_breeding_health_logs
ADD COLUMN IF NOT EXISTS treatment_cost_idr NUMERIC(12, 2) DEFAULT 0;
