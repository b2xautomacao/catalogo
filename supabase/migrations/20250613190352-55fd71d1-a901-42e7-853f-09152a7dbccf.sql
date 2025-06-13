
-- Criar bucket para logos das lojas
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'store-logos',
  'store-logos',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
);

-- Política para permitir uploads de logos
CREATE POLICY "Users can upload store logos" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'store-logos' AND
    auth.role() = 'authenticated' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Política para permitir visualização pública dos logos
CREATE POLICY "Store logos are publicly viewable" ON storage.objects
  FOR SELECT USING (bucket_id = 'store-logos');

-- Política para permitir updates dos logos
CREATE POLICY "Users can update their store logos" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'store-logos' AND
    auth.role() = 'authenticated' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Política para permitir deletar logos
CREATE POLICY "Users can delete their store logos" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'store-logos' AND
    auth.role() = 'authenticated' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );
