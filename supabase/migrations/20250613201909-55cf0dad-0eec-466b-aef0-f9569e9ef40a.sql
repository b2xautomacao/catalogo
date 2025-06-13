
-- Limpar todas as políticas conflitantes da tabela orders
DROP POLICY IF EXISTS "Store admins can view their store orders" ON public.orders;
DROP POLICY IF EXISTS "Allow order creation" ON public.orders;
DROP POLICY IF EXISTS "Store owners can view orders" ON public.orders;
DROP POLICY IF EXISTS "Store owners can update orders" ON public.orders;
DROP POLICY IF EXISTS "Store owners can delete orders" ON public.orders;

-- Limpar políticas problemáticas da tabela stock_movements
DROP POLICY IF EXISTS "Users can create stock movements for their store" ON public.stock_movements;
DROP POLICY IF EXISTS "Users can view stock movements from their store" ON public.stock_movements;
DROP POLICY IF EXISTS "Allow public stock movements" ON public.stock_movements;
DROP POLICY IF EXISTS "Store owners can view stock movements" ON public.stock_movements;

-- Criar políticas consolidadas e funcionais para orders
CREATE POLICY "Public and authenticated can create orders" ON public.orders
  FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Store owners can view their orders" ON public.orders
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.stores 
      WHERE id = orders.store_id 
      AND owner_id = auth.uid()
    )
  );

CREATE POLICY "Store owners can update their orders" ON public.orders
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.stores 
      WHERE id = orders.store_id 
      AND owner_id = auth.uid()
    )
  );

CREATE POLICY "Store owners can delete their orders" ON public.orders
  FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM public.stores 
      WHERE id = orders.store_id 
      AND owner_id = auth.uid()
    )
  );

-- Criar políticas para stock_movements que permitam operações públicas
CREATE POLICY "Public and authenticated can create stock movements" ON public.stock_movements
  FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Store owners can view their stock movements" ON public.stock_movements
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.stores 
      WHERE id = stock_movements.store_id 
      AND owner_id = auth.uid()
    )
  );

-- Garantir que RLS está habilitado em ambas as tabelas
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;
