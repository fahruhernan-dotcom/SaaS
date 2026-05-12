-- ============================================================
-- SQL Fix: Recalibrate sembako_customers.total_outstanding
-- Author: Antigravity
-- Date: 2026-04-01
-- Purpose: Fix stale total_outstanding values and repair the
--          database trigger that maintains them.
-- ============================================================

-- 1. RECALIBRATE all customer balances from actual sales data
-- Formula: total_outstanding = SUM(remaining_amount) from their non-deleted sales
UPDATE public.sembako_customers c
SET total_outstanding = COALESCE(
    (SELECT SUM(s.remaining_amount) 
     FROM public.sembako_sales s 
     WHERE s.customer_id = c.id 
       AND s.is_deleted = false
    ), 0
);

-- 2. FIX the recalc function to use the correct formula
-- The function should recalculate from sales.remaining_amount (a generated column)
-- NOT accumulate from payment amounts.
CREATE OR REPLACE FUNCTION public.recalc_sembako_customer_balance()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
    v_customer_id uuid;
BEGIN
    -- Determine which customer to recalculate
    IF TG_OP = 'DELETE' THEN
        v_customer_id := OLD.customer_id;
    ELSE
        v_customer_id := NEW.customer_id;
    END IF;

    -- Skip if no customer linked
    IF v_customer_id IS NULL THEN
        RETURN COALESCE(NEW, OLD);
    END IF;

    -- Recalculate from the source of truth: sembako_sales.remaining_amount
    UPDATE sembako_customers
    SET total_outstanding = COALESCE(
        (SELECT SUM(remaining_amount)
         FROM sembako_sales
         WHERE customer_id = v_customer_id
           AND is_deleted = false
        ), 0
    )
    WHERE id = v_customer_id;

    RETURN COALESCE(NEW, OLD);
END;
$$;

-- 3. Verify the result
SELECT c.id, c.customer_name, c.total_outstanding,
       COALESCE(SUM(s.remaining_amount), 0) AS calculated_outstanding
FROM sembako_customers c
LEFT JOIN sembako_sales s ON s.customer_id = c.id AND s.is_deleted = false
GROUP BY c.id, c.customer_name, c.total_outstanding;

-- ============================================================
-- End of Fix
-- ============================================================
