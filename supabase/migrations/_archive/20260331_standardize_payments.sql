-- Migration: Stabilize Sembako Module Schema
-- Created: 2026-03-31
-- Purpose: Resolve "relation does not exist" and missing column errors across Sembako module.

-- 1. Create sembako_supplier_payments if it doesn't exist
CREATE TABLE IF NOT EXISTS public.sembako_supplier_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id),
    supplier_id UUID NOT NULL REFERENCES public.sembako_suppliers(id),
    amount BIGINT NOT NULL CHECK (amount >= 0),
    payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    payment_method TEXT NOT NULL CHECK (payment_method IN ('cash', 'transfer', 'qris', 'giro')),
    reference_number TEXT,
    notes TEXT,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Idempotently add missing columns and enable RLS
DO $$ 
DECLARE
    t text;
    sembako_tables text[] := ARRAY[
        'sembako_sales', 'sembako_payments', 'sembako_supplier_payments', 
        'sembako_products', 'sembako_suppliers', 'sembako_customers', 
        'sembako_employees', 'sembako_expenses', 'sembako_payroll', 
        'sembako_stock_batches', 'sembako_stock_out'
    ];
BEGIN 
    FOREACH t IN ARRAY sembako_tables LOOP
        -- Add is_deleted
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name=t AND column_name='is_deleted') THEN
            EXECUTE format('ALTER TABLE public.%I ADD COLUMN is_deleted boolean DEFAULT false', t);
        END IF;

        -- Add reference_number specifically to payment tables
        IF t IN ('sembako_payments', 'sembako_supplier_payments') THEN
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name=t AND column_name='reference_number') THEN
                EXECUTE format('ALTER TABLE public.%I ADD COLUMN reference_number text', t);
            END IF;
        END IF;

        -- Enable RLS
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);

        -- Add/Update Tenant Isolation Policy
        EXECUTE format('DROP POLICY IF EXISTS "Tenant Isolation Policy" ON public.%I', t);
        EXECUTE format('
            CREATE POLICY "Tenant Isolation Policy" ON public.%I
            FOR ALL USING (tenant_id = (SELECT tenant_id FROM profiles WHERE auth_user_id = auth.uid() LIMIT 1))
        ', t);
    END LOOP;
END $$;
