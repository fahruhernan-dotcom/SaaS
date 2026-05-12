-- ============================================================
-- TernakOS — Egg Broker Migration (Enhanced)
-- Project: TernakOS
-- Date: 2026-03-24
-- ============================================================

-- ------------------------------------------------------------
-- 1. TENANTS MODIFICATION
-- ------------------------------------------------------------
ALTER TABLE tenants
  ADD COLUMN IF NOT EXISTS business_vertical text DEFAULT 'poultry_broker',
  ADD COLUMN IF NOT EXISTS is_hidden_beta boolean DEFAULT false;

COMMENT ON COLUMN tenants.business_vertical IS 'Model bisnis tenant: poultry_broker | egg_broker | peternak | rpa';
COMMENT ON COLUMN tenants.is_hidden_beta IS 'Jika true, tidak tampil di landing page publik';

-- ------------------------------------------------------------
-- 2. EGG_SUPPLIERS
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS egg_suppliers (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name          text NOT NULL,
  phone         text,
  address       text,
  is_deleted    boolean NOT NULL DEFAULT false,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------
-- 3. EGG_INVENTORY
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS egg_inventory (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id             uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  product_name          text NOT NULL,
  egg_grade             text NOT NULL DEFAULT 'standard', -- 'hero' | 'standard' | 'salted'
  current_stock_butir   integer NOT NULL DEFAULT 0,
  cost_per_egg          integer NOT NULL DEFAULT 0,
  packaging_cost        integer NOT NULL DEFAULT 0,
  eggs_per_pack         integer NOT NULL DEFAULT 10,
  sell_price_per_pack   integer NOT NULL DEFAULT 0,
  low_stock_threshold   integer NOT NULL DEFAULT 20,
  notes                 text,
  is_deleted            boolean NOT NULL DEFAULT false,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE egg_inventory
  ADD COLUMN IF NOT EXISTS cost_per_pack integer
  GENERATED ALWAYS AS ((cost_per_egg * eggs_per_pack) + packaging_cost) STORED;

-- ------------------------------------------------------------
-- 4. EGG_CUSTOMERS
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS egg_customers (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name          text NOT NULL,
  phone         text,
  address       text,
  total_spent   bigint NOT NULL DEFAULT 0, 
  total_orders  integer NOT NULL DEFAULT 0,
  notes         text,
  is_deleted    boolean NOT NULL DEFAULT false,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------
-- 5. EGG_SALES
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS egg_sales (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  customer_id         uuid REFERENCES egg_customers(id),
  invoice_number      text NOT NULL UNIQUE,
  customer_name       text NOT NULL,
  customer_phone      text,
  total_price         bigint NOT NULL DEFAULT 0,
  total_cost          bigint NOT NULL DEFAULT 0,
  payment_status      text NOT NULL DEFAULT 'pending', -- 'lunas' | 'piutang' | 'pending'
  payment_method      text, -- 'tunai' | 'transfer' | 'tempo'
  fulfillment_status  text NOT NULL DEFAULT 'processing', -- 'processing' | 'on_delivery' | 'completed'
  transaction_date    date NOT NULL DEFAULT CURRENT_DATE,
  due_date            date,
  notes               text,
  is_deleted          boolean NOT NULL DEFAULT false,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE egg_sales
  ADD COLUMN IF NOT EXISTS net_profit bigint
  GENERATED ALWAYS AS (total_price - total_cost) STORED;

-- ------------------------------------------------------------
-- 6. EGG_SALE_ITEMS
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS egg_sale_items (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id         uuid NOT NULL REFERENCES egg_sales(id) ON DELETE CASCADE,
  inventory_id    uuid NOT NULL REFERENCES egg_inventory(id),
  qty_pack        integer NOT NULL DEFAULT 1,
  price_per_pack  integer NOT NULL DEFAULT 0,
  cost_per_pack   integer NOT NULL DEFAULT 0,
  created_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE egg_sale_items
  ADD COLUMN IF NOT EXISTS subtotal bigint
  GENERATED ALWAYS AS (qty_pack * price_per_pack) STORED;

-- ------------------------------------------------------------
-- 7. EGG_STOCK_LOGS
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS egg_stock_logs (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  inventory_id  uuid NOT NULL REFERENCES egg_inventory(id),
  sale_id       uuid REFERENCES egg_sales(id),
  supplier_id   uuid REFERENCES egg_suppliers(id),
  log_type      text NOT NULL, -- 'in' | 'out' | 'adj'
  qty_butir     integer NOT NULL,
  unit_price    integer,
  notes         text,
  created_by    uuid REFERENCES profiles(id),
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------
-- 8. INDEXES
-- ------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_egg_inventory_tenant ON egg_inventory(tenant_id) WHERE is_deleted = false;
CREATE INDEX IF NOT EXISTS idx_egg_sales_tenant ON egg_sales(tenant_id) WHERE is_deleted = false;
CREATE INDEX IF NOT EXISTS idx_egg_sales_date ON egg_sales(tenant_id, transaction_date) WHERE is_deleted = false;
CREATE INDEX IF NOT EXISTS idx_egg_sale_items_sale ON egg_sale_items(sale_id);
CREATE INDEX IF NOT EXISTS idx_egg_stock_logs_inventory ON egg_stock_logs(inventory_id);
CREATE INDEX IF NOT EXISTS idx_egg_customers_tenant ON egg_customers(tenant_id) WHERE is_deleted = false;
CREATE INDEX IF NOT EXISTS idx_egg_suppliers_tenant ON egg_suppliers(tenant_id) WHERE is_deleted = false;

-- ------------------------------------------------------------
-- 9. ROW LEVEL SECURITY (RLS)
-- ------------------------------------------------------------
ALTER TABLE egg_suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE egg_inventory  ENABLE ROW LEVEL SECURITY;
ALTER TABLE egg_sales       ENABLE ROW LEVEL SECURITY;
ALTER TABLE egg_sale_items  ENABLE ROW LEVEL SECURITY;
ALTER TABLE egg_stock_logs  ENABLE ROW LEVEL SECURITY;
ALTER TABLE egg_customers   ENABLE ROW LEVEL SECURITY;

CREATE POLICY "egg_suppliers_tenant_isolation" ON egg_suppliers FOR ALL USING (is_my_tenant(tenant_id));
CREATE POLICY "egg_inventory_tenant_isolation" ON egg_inventory FOR ALL USING (is_my_tenant(tenant_id));
CREATE POLICY "egg_sales_tenant_isolation" ON egg_sales FOR ALL USING (is_my_tenant(tenant_id));
CREATE POLICY "egg_sale_items_tenant_isolation" ON egg_sale_items FOR ALL USING (exists (select 1 from egg_sales where id = egg_sale_items.sale_id and is_my_tenant(tenant_id)));
CREATE POLICY "egg_stock_logs_tenant_isolation" ON egg_stock_logs FOR ALL USING (is_my_tenant(tenant_id));
CREATE POLICY "egg_customers_tenant_isolation" ON egg_customers FOR ALL USING (is_my_tenant(tenant_id));

-- ------------------------------------------------------------
-- 10. FUNCTIONS & TRIGGERS
-- ------------------------------------------------------------

-- A. Invoice Generation (EP-YYYYMMDD-001)
CREATE OR REPLACE FUNCTION generate_egg_invoice_number(p_tenant_id uuid)
RETURNS text LANGUAGE plpgsql AS $$
DECLARE
  v_date    text;
  v_count   integer;
BEGIN
  v_date  := to_char(now(), 'YYYYMMDD');
  SELECT COUNT(*) + 1 INTO v_count FROM egg_sales WHERE tenant_id = p_tenant_id AND to_char(transaction_date, 'YYYYMMDD') = v_date;
  RETURN 'EP-' || v_date || '-' || LPAD(v_count::text, 3, '0');
END;
$$;

-- B. Stock Deduction Trigger
CREATE OR REPLACE FUNCTION deduct_egg_stock_on_sale()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  v_item record;
  v_qty_total integer;
BEGIN
  IF NEW.fulfillment_status = 'completed' AND (OLD.fulfillment_status IS NULL OR OLD.fulfillment_status != 'completed') THEN
    FOR v_item IN SELECT si.inventory_id, si.qty_pack, inv.eggs_per_pack FROM egg_sale_items si JOIN egg_inventory inv ON inv.id = si.inventory_id WHERE si.sale_id = NEW.id
    LOOP
      v_qty_total := v_item.qty_pack * v_item.eggs_per_pack;
      UPDATE egg_inventory SET current_stock_butir = current_stock_butir - v_qty_total, updated_at = now() WHERE id = v_item.inventory_id;
      INSERT INTO egg_stock_logs (tenant_id, inventory_id, sale_id, log_type, qty_butir, notes)
      VALUES (NEW.tenant_id, v_item.inventory_id, NEW.id, 'out', -v_qty_total, 'Auto deduct dari penjualan ' || NEW.invoice_number);
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_deduct_egg_stock AFTER UPDATE OF fulfillment_status ON egg_sales FOR EACH ROW EXECUTE FUNCTION deduct_egg_stock_on_sale();

-- C. Customer Stats Update (ENHANCED)
CREATE OR REPLACE FUNCTION update_egg_customer_stats()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.fulfillment_status = 'completed' AND (OLD.fulfillment_status IS NULL OR OLD.fulfillment_status != 'completed') THEN
    IF NEW.customer_id IS NOT NULL THEN
      UPDATE egg_customers
         SET total_spent = total_spent + NEW.total_price,
             total_orders = total_orders + 1,
             updated_at = now()
       WHERE id = NEW.customer_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_update_egg_customer_stats AFTER UPDATE OF fulfillment_status ON egg_sales FOR EACH ROW EXECUTE FUNCTION update_egg_customer_stats();
