
-- Remover TODAS as políticas existentes da tabela orders
DROP POLICY IF EXISTS "Store owners can view their orders" ON public.orders;
DROP POLICY IF EXISTS "Store owners can update their orders" ON public.orders;
DROP POLICY IF EXISTS "Store owners can delete their orders" ON public.orders;
DROP POLICY IF EXISTS "Store admins can view their store orders" ON public.orders;
DROP POLICY IF EXISTS "Store admins can manage their store orders" ON public.orders;
DROP POLICY IF EXISTS "Superadmins can view all orders" ON public.orders;
DROP POLICY IF EXISTS "Superadmins can manage all orders" ON public.orders;
DROP POLICY IF EXISTS "Enable public order creation" ON public.orders;

-- Criar novas políticas que usam a relação através de profiles
CREATE POLICY "Store admins can view their store orders" ON public.orders
  FOR SELECT 
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.store_id = orders.store_id
    )
  );

CREATE POLICY "Store admins can update their store orders" ON public.orders
  FOR UPDATE 
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.store_id = orders.store_id
    )
  );

CREATE POLICY "Store admins can delete their store orders" ON public.orders
  FOR DELETE 
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.store_id = orders.store_id
    )
  );

-- Políticas para superadmins
CREATE POLICY "Superadmins can view all orders" ON public.orders
  FOR SELECT 
  TO authenticated
  USING (public.is_superadmin(auth.uid()));

CREATE POLICY "Superadmins can manage all orders" ON public.orders
  FOR ALL 
  TO authenticated
  USING (public.is_superadmin(auth.uid()));
