
-- Remover todas as políticas existentes da tabela orders
DROP POLICY IF EXISTS "Store owners can view their orders" ON public.orders;
DROP POLICY IF EXISTS "Store owners can update their orders" ON public.orders;
DROP POLICY IF EXISTS "Store owners can delete their orders" ON public.orders;
DROP POLICY IF EXISTS "Enable public order creation" ON public.orders;

-- Criar política que permite apenas SELECT para donos de loja autenticados
CREATE POLICY "Store owners can view their orders" ON public.orders
  FOR SELECT 
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.stores 
      WHERE stores.id = orders.store_id 
      AND stores.owner_id = auth.uid()
    )
  );

-- Criar política que permite UPDATE para donos de loja autenticados
CREATE POLICY "Store owners can update their orders" ON public.orders
  FOR UPDATE 
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.stores 
      WHERE stores.id = orders.store_id 
      AND stores.owner_id = auth.uid()
    )
  );

-- Criar política que permite DELETE para donos de loja autenticados
CREATE POLICY "Store owners can delete their orders" ON public.orders
  FOR DELETE 
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.stores 
      WHERE stores.id = orders.store_id 
      AND stores.owner_id = auth.uid()
    )
  );

-- Para INSERT, vamos permitir apenas via service_role (Edge Function)
-- Não criar política de INSERT público - apenas service_role pode inserir
