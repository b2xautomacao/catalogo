
-- Adicionar campo url_slug à tabela stores para URLs amigáveis
ALTER TABLE public.stores ADD COLUMN url_slug TEXT UNIQUE;

-- Criar índice para busca rápida por slug
CREATE INDEX idx_stores_url_slug ON public.stores(url_slug) WHERE url_slug IS NOT NULL;

-- Políticas RLS públicas para visualização de catálogos

-- Política pública para stores (apenas lojas ativas)
CREATE POLICY "Public can view active stores" 
  ON public.stores 
  FOR SELECT 
  USING (is_active = true);

-- Política pública para products (apenas produtos ativos de lojas ativas)
CREATE POLICY "Public can view active products from active stores" 
  ON public.products 
  FOR SELECT 
  USING (
    is_active = true AND 
    EXISTS (
      SELECT 1 FROM public.stores 
      WHERE stores.id = products.store_id 
      AND stores.is_active = true
    )
  );

-- Política pública para store_settings (apenas de lojas ativas)
CREATE POLICY "Public can view settings from active stores" 
  ON public.store_settings 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.stores 
      WHERE stores.id = store_settings.store_id 
      AND stores.is_active = true
    )
  );

-- Política pública para categories (apenas de lojas ativas)
CREATE POLICY "Public can view categories from active stores" 
  ON public.categories 
  FOR SELECT 
  USING (
    is_active = true AND
    EXISTS (
      SELECT 1 FROM public.stores 
      WHERE stores.id = categories.store_id 
      AND stores.is_active = true
    )
  );

-- Política pública para product_images (apenas de produtos ativos)
CREATE POLICY "Public can view images from active products" 
  ON public.product_images 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.products 
      JOIN public.stores ON stores.id = products.store_id
      WHERE products.id = product_images.product_id 
      AND products.is_active = true 
      AND stores.is_active = true
    )
  );

-- Política pública para product_variations (apenas de produtos ativos)
CREATE POLICY "Public can view variations from active products" 
  ON public.product_variations 
  FOR SELECT 
  USING (
    is_active = true AND
    EXISTS (
      SELECT 1 FROM public.products 
      JOIN public.stores ON stores.id = products.store_id
      WHERE products.id = product_variations.product_id 
      AND products.is_active = true 
      AND stores.is_active = true
    )
  );
