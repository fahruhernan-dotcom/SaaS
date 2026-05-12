-- Safety net trigger: otomatis update tenants.plan + plan_expires_at
-- ketika subscription_invoices.status berubah menjadi 'paid'.
-- Frontend (useConfirmInvoice) sudah melakukan ini, tapi trigger ini
-- memastikan konsistensi jika admin update langsung via SQL / dashboard Supabase.

CREATE OR REPLACE FUNCTION public.activate_plan_on_invoice_paid()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_base_date timestamptz;
BEGIN
  IF NEW.status = 'paid' AND (OLD.status IS NULL OR OLD.status != 'paid') THEN
    -- Hitung expiry: kalau masih ada sisa waktu, extend dari sana; kalau tidak, dari sekarang
    SELECT
      CASE WHEN plan_expires_at IS NOT NULL AND plan_expires_at > now()
           THEN plan_expires_at
           ELSE now()
      END INTO v_base_date
    FROM public.tenants WHERE id = NEW.tenant_id;

    UPDATE public.tenants SET
      plan             = NEW.plan,
      plan_expires_at  = v_base_date + (NEW.billing_months || ' months')::interval
    WHERE id = NEW.tenant_id
      AND NEW.plan NOT LIKE 'addon_%';  -- skip addon invoices (handled separately)
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_activate_plan_on_invoice_paid ON public.subscription_invoices;
CREATE TRIGGER trg_activate_plan_on_invoice_paid
  AFTER UPDATE ON public.subscription_invoices
  FOR EACH ROW EXECUTE FUNCTION public.activate_plan_on_invoice_paid();
