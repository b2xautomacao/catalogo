
-- Adicionar coluna is_featured na tabela products
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;

-- Criar bucket para imagens de produtos se não existir
INSERT INTO storage.buckets (id, name, public) 
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- Criar políticas RLS para o bucket product-images
CREATE POLICY "Permitir visualização pública de imagens" ON storage.objects
FOR SELECT USING (bucket_id = 'product-images');

CREATE POLICY "Permitir upload de imagens para usuários autenticados" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'product-images' AND 
  auth.role() = 'authenticated'
);

CREATE POLICY "Permitir atualização de imagens para usuários autenticados" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'product-images' AND 
  auth.role() = 'authenticated'
);

CREATE POLICY "Permitir exclusão de imagens para usuários autenticados" ON storage.objects
FOR DELETE USING (
  bucket_id = 'product-images' AND 
  auth.role() = 'authenticated'
);
