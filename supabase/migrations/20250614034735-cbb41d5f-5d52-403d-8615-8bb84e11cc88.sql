
-- Criar bucket store-logos se não existir
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('store-logos', 'store-logos', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
ON CONFLICT (id) DO NOTHING;

-- Remover políticas existentes do bucket store-logos se existirem
DROP POLICY IF EXISTS "Public can view store logos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload store logos" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their store logos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their store logos" ON storage.objects;

-- Criar políticas para o bucket store-logos
CREATE POLICY "Public can view store logos" ON storage.objects
  FOR SELECT USING (bucket_id = 'store-logos');

CREATE POLICY "Authenticated users can upload store logos" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (
    bucket_id = 'store-logos' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can update their store logos" ON storage.objects
  FOR UPDATE TO authenticated USING (
    bucket_id = 'store-logos' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can delete their store logos" ON storage.objects
  FOR DELETE TO authenticated USING (
    bucket_id = 'store-logos' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Verificar e melhorar políticas RLS da tabela stores
DROP POLICY IF EXISTS "Store admins can view their own store" ON public.stores;
DROP POLICY IF EXISTS "Store admins can update their own store" ON public.stores;

-- Criar política para admins da loja visualizarem sua loja
CREATE POLICY "Store admins can view their own store" ON public.stores
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.store_id = stores.id
    )
  );

-- Criar política para admins da loja atualizarem sua loja
CREATE POLICY "Store admins can update their own store" ON public.stores
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.store_id = stores.id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.store_id = stores.id
    )
  );
