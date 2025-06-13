
-- Remover todas as políticas existentes da tabela profiles
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Superadmins can view all profiles" ON public.profiles;

-- Recriar políticas RLS simples sem recursão
CREATE POLICY "Users can view own profile" 
  ON public.profiles 
  FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
  ON public.profiles 
  FOR UPDATE 
  USING (auth.uid() = id);

-- Criar função segura para verificar se usuário é superadmin
CREATE OR REPLACE FUNCTION public.is_superadmin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = _user_id
      AND role = 'superadmin'
      AND is_active = true
  )
$$;

-- Política para superadmins verem todos os perfis usando função segura
CREATE POLICY "Superadmins can view all profiles" 
  ON public.profiles 
  FOR SELECT 
  USING (public.is_superadmin(auth.uid()));

-- Remover políticas existentes de produtos e recriar
DROP POLICY IF EXISTS "Superadmins can view all products" ON public.products;
DROP POLICY IF EXISTS "Store admins can manage their store products" ON public.products;
DROP POLICY IF EXISTS "Users can view products from their store" ON public.products;
DROP POLICY IF EXISTS "Users can create products for their store" ON public.products;
DROP POLICY IF EXISTS "Users can update products from their store" ON public.products;
DROP POLICY IF EXISTS "Users can delete products from their store" ON public.products;

-- Recriar políticas RLS para produtos
CREATE POLICY "Users can view products from their store" 
  ON public.products 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.store_id = products.store_id
    )
  );

CREATE POLICY "Users can create products for their store" 
  ON public.products 
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.store_id = products.store_id
    )
  );

CREATE POLICY "Users can update products from their store" 
  ON public.products 
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.store_id = products.store_id
    )
  );

CREATE POLICY "Users can delete products from their store" 
  ON public.products 
  FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.store_id = products.store_id
    )
  );
