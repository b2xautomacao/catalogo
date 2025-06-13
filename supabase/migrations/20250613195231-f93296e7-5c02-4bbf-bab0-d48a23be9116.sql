
-- Permitir que qualquer pessoa veja produtos ativos de lojas ativas
CREATE POLICY "Anyone can view active products from active stores" ON public.products
FOR SELECT USING (
  is_active = true 
  AND EXISTS (
    SELECT 1 FROM public.stores 
    WHERE stores.id = products.store_id 
    AND stores.is_active = true
  )
);

-- Permitir que qualquer pessoa veja dados básicos de lojas ativas
CREATE POLICY "Anyone can view active stores" ON public.stores
FOR SELECT USING (is_active = true);

-- Permitir que qualquer pessoa veja configurações de catálogo de lojas ativas
CREATE POLICY "Anyone can view store settings for active stores" ON public.store_settings
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.stores 
    WHERE stores.id = store_settings.store_id 
    AND stores.is_active = true
  )
);
