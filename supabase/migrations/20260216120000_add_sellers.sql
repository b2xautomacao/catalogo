-- Migration: Sistema de Vendedores no Catálogo
-- Data: 2026-02-16
-- Permite cadastrar vendedores por loja, cada um com link próprio e WhatsApp específico

CREATE TABLE IF NOT EXISTS public.sellers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  slug TEXT NOT NULL,
  name TEXT NOT NULL,
  whatsapp_phone TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(store_id, slug)
);

-- Índice para busca rápida por loja e slug
CREATE INDEX IF NOT EXISTS idx_sellers_store_slug ON public.sellers(store_id, slug);
CREATE INDEX IF NOT EXISTS idx_sellers_store_active ON public.sellers(store_id) WHERE is_active = true;

COMMENT ON TABLE public.sellers IS 'Vendedores por loja - cada um tem link próprio (ex: loja.com/daniel) e WhatsApp específico para pedidos';

-- RLS
ALTER TABLE public.sellers ENABLE ROW LEVEL SECURITY;

-- Leitura pública para vendedores ativos (catálogo público precisa buscar)
CREATE POLICY "Public can view active sellers"
  ON public.sellers
  FOR SELECT
  USING (is_active = true);

-- Donos e admins da loja podem gerenciar vendedores
CREATE POLICY "Store owners can manage sellers"
  ON public.sellers
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.stores
      WHERE stores.id = sellers.store_id
      AND stores.owner_id = auth.uid()
    )
  );

-- Admins da loja (profiles.store_id)
CREATE POLICY "Store admins can manage sellers"
  ON public.sellers
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.store_id = sellers.store_id
    )
  );

-- Superadmins
CREATE POLICY "Superadmins can manage all sellers"
  ON public.sellers
  FOR ALL
  USING (public.is_superadmin(auth.uid()));
