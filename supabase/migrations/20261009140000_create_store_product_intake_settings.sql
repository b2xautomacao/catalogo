-- Migration: Criação da tabela de configurações de intake de produtos por tenant (store_product_intake_settings)
-- Sprint: Product Intake Automation

CREATE TABLE IF NOT EXISTS public.store_product_intake_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  default_min_wholesale_qty INTEGER DEFAULT NULL,
  auto_generate_sku BOOLEAN NOT NULL DEFAULT true,
  auto_generate_slug BOOLEAN NOT NULL DEFAULT true,
  auto_generate_seo BOOLEAN NOT NULL DEFAULT true,
  auto_set_first_image_primary BOOLEAN NOT NULL DEFAULT true,
  inventory_import_mode TEXT NOT NULL DEFAULT 'initial_balance',
  unknown_category_policy TEXT NOT NULL DEFAULT 'ask',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT uq_store_product_intake_settings_store UNIQUE (store_id)
);

-- Habilitar RLS
ALTER TABLE public.store_product_intake_settings ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS
CREATE POLICY "Superadmins can manage all intake settings"
  ON public.store_product_intake_settings
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'superadmin'
    )
  );

CREATE POLICY "Store admins can view and manage their own intake settings"
  ON public.store_product_intake_settings
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'store_admin' AND store_id = store_product_intake_settings.store_id
    )
  );
