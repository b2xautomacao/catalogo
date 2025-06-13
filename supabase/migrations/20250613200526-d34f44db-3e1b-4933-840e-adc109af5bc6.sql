
-- Remover política conflitante que está bloqueando inserções públicas
DROP POLICY IF EXISTS "Store admins can manage their store orders" ON public.orders;

-- Remover outras políticas existentes para recriar de forma organizada
DROP POLICY IF EXISTS "Allow public order creation" ON public.orders;
DROP POLICY IF EXISTS "Store owners can view their orders" ON public.orders;
DROP POLICY IF EXISTS "Store owners can update their orders" ON public.orders;

-- Política para permitir criação de pedidos (público + admins autenticados)
CREATE POLICY "Allow order creation" ON public.orders
  FOR INSERT 
  WITH CHECK (true);

-- Política para permitir que donos de lojas vejam seus pedidos
CREATE POLICY "Store owners can view orders" ON public.orders
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.stores 
      WHERE id = orders.store_id 
      AND owner_id = auth.uid()
    )
  );

-- Política para permitir que donos de lojas atualizem seus pedidos
CREATE POLICY "Store owners can update orders" ON public.orders
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.stores 
      WHERE id = orders.store_id 
      AND owner_id = auth.uid()
    )
  );

-- Política para permitir que donos de lojas excluam seus pedidos
CREATE POLICY "Store owners can delete orders" ON public.orders
  FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM public.stores 
      WHERE id = orders.store_id 
      AND owner_id = auth.uid()
    )
  );

-- Garantir que RLS está habilitado
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
