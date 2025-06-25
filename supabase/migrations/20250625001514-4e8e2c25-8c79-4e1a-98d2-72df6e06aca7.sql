
-- Apenas adicionar o campo para layout mobile no store_settings
ALTER TABLE public.store_settings 
ADD COLUMN IF NOT EXISTS mobile_columns integer DEFAULT 2 CHECK (mobile_columns IN (1, 2));

-- Adicionar políticas de storage se ainda não existirem
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' 
        AND policyname = 'Users can upload product images'
    ) THEN
        CREATE POLICY "Users can upload product images" ON storage.objects
        FOR INSERT WITH CHECK (bucket_id = 'product-images');
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' 
        AND policyname = 'Public can view product images'
    ) THEN
        CREATE POLICY "Public can view product images" ON storage.objects
        FOR SELECT USING (bucket_id = 'product-images');
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' 
        AND policyname = 'Users can delete product images'
    ) THEN
        CREATE POLICY "Users can delete product images" ON storage.objects
        FOR DELETE USING (bucket_id = 'product-images' AND auth.uid() IS NOT NULL);
    END IF;
END
$$;
