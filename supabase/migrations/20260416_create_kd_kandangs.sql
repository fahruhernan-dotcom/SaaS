-- Tabel untuk Manajemen Kandang (Helicopter View)
CREATE TABLE IF NOT EXISTS public.kd_kandangs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    batch_id UUID NOT NULL REFERENCES public.kd_penggemukan_batches(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    capacity INTEGER NOT NULL DEFAULT 0,
    panjang_m NUMERIC(10, 2),
    lebar_m NUMERIC(10, 2),
    luas_m2 NUMERIC(10, 2) GENERATED ALWAYS AS (panjang_m * lebar_m) STORED,
    is_holding BOOLEAN NOT NULL DEFAULT false,
    notes TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexing untuk performa
CREATE INDEX IF NOT EXISTS idx_kd_kandangs_tenant ON public.kd_kandangs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_kd_kandangs_batch ON public.kd_kandangs(batch_id);

-- Aktifkan RLS
ALTER TABLE public.kd_kandangs ENABLE ROW LEVEL SECURITY;

-- Policies untuk tenant
CREATE POLICY "Users can manage their tenant's kd_kandangs" 
ON public.kd_kandangs FOR ALL TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.tenant_id = kd_kandangs.tenant_id 
        AND profiles.auth_user_id = auth.uid()
    )
);

-- Tambahkan kolom kandang_id ke kd_penggemukan_animals (foreign key ke kd_kandangs)
ALTER TABLE public.kd_penggemukan_animals
ADD COLUMN IF NOT EXISTS kandang_id UUID REFERENCES public.kd_kandangs(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_kd_animals_kandang_id ON public.kd_penggemukan_animals(kandang_id);
