
-- Criar bucket para imagens de produtos se não existir
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- Criar políticas para o bucket product-images
-- Política para permitir SELECT (visualização) pública
CREATE POLICY IF NOT EXISTS "Permitir visualização pública de imagens de produtos"
ON storage.objects FOR SELECT
USING (bucket_id = 'product-images');

-- Política para permitir INSERT (upload) para usuários autenticados
CREATE POLICY IF NOT EXISTS "Permitir upload de imagens para usuários autenticados"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'product-images' AND auth.role() = 'authenticated');

-- Política para permitir UPDATE para usuários autenticados
CREATE POLICY IF NOT EXISTS "Permitir atualização de imagens para usuários autenticados"
ON storage.objects FOR UPDATE
USING (bucket_id = 'product-images' AND auth.role() = 'authenticated');

-- Política para permitir DELETE para usuários autenticados
CREATE POLICY IF NOT EXISTS "Permitir exclusão de imagens para usuários autenticados"
ON storage.objects FOR DELETE
USING (bucket_id = 'product-images' AND auth.role() = 'authenticated');
