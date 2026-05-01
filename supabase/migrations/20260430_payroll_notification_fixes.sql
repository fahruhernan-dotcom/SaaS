-- ═══════════════════════════════════════════════════════════════════════════════
-- TernakOS — PAYROLL & NOTIFICATION SYSTEM FIXES
-- ═══════════════════════════════════════════════════════════════════════════════

-- 1. FIX notifications RLS (Incorrect column name in where clause)
-- In migration 20260416_notifications_rls.sql, it used 'id = auth.uid()' 
-- but it should be 'auth_user_id = auth.uid()'.

DROP POLICY IF EXISTS "Users can view their own tenant notifications" ON public.notifications;
CREATE POLICY "Users can view their own tenant notifications" ON public.notifications
    FOR SELECT
    TO authenticated
    USING (tenant_id IN (SELECT tenant_id FROM public.profiles WHERE auth_user_id = auth.uid()));

DROP POLICY IF EXISTS "Users can insert notifications for their tenant" ON public.notifications;
CREATE POLICY "Users can insert notifications for their tenant" ON public.notifications
    FOR INSERT
    TO authenticated
    WITH CHECK (tenant_id IN (SELECT tenant_id FROM public.profiles WHERE auth_user_id = auth.uid()));

DROP POLICY IF EXISTS "Users can update notifications in their tenant" ON public.notifications;
CREATE POLICY "Users can update notifications in their tenant" ON public.notifications
    FOR UPDATE
    TO authenticated
    USING (tenant_id IN (SELECT tenant_id FROM public.profiles WHERE auth_user_id = auth.uid()));

-- 2. ENSURE kandang_worker_payments table exists
CREATE TABLE IF NOT EXISTS public.kandang_worker_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    worker_id UUID NOT NULL REFERENCES public.kandang_workers(id) ON DELETE CASCADE,
    payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    payment_type TEXT NOT NULL DEFAULT 'Gaji Bulanan',
    amount NUMERIC NOT NULL DEFAULT 0,
    notes TEXT,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. RLS for kandang_worker_payments
ALTER TABLE public.kandang_worker_payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tenant Isolation Policy" ON public.kandang_worker_payments;
CREATE POLICY "Tenant Isolation Policy" ON public.kandang_worker_payments
    FOR ALL
    TO authenticated
    USING (tenant_id IN (SELECT tenant_id FROM public.profiles WHERE auth_user_id = auth.uid()))
    WITH CHECK (tenant_id IN (SELECT tenant_id FROM public.profiles WHERE auth_user_id = auth.uid()));

-- 4. Ensure indexes for performance
CREATE INDEX IF NOT EXISTS idx_worker_payments_tenant ON public.kandang_worker_payments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_worker_payments_worker ON public.kandang_worker_payments(worker_id);
CREATE INDEX IF NOT EXISTS idx_worker_payments_date ON public.kandang_worker_payments(payment_date);

-- 5. Trigger for updated_at
DROP TRIGGER IF EXISTS set_updated_at_kandang_worker_payments ON public.kandang_worker_payments;
CREATE TRIGGER set_updated_at_kandang_worker_payments
    BEFORE UPDATE ON public.kandang_worker_payments
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
