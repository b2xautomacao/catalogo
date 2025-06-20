
-- Adicionar campos de marca d'água na tabela store_settings
ALTER TABLE public.store_settings 
ADD COLUMN IF NOT EXISTS watermark_enabled boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS watermark_type text DEFAULT 'text',
ADD COLUMN IF NOT EXISTS watermark_text text DEFAULT 'Minha Loja',
ADD COLUMN IF NOT EXISTS watermark_logo_url text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS watermark_position text DEFAULT 'bottom-right',
ADD COLUMN IF NOT EXISTS watermark_opacity numeric DEFAULT 0.7,
ADD COLUMN IF NOT EXISTS watermark_size integer DEFAULT 24,
ADD COLUMN IF NOT EXISTS watermark_color text DEFAULT '#ffffff';

-- Adicionar constraint para validar watermark_type
ALTER TABLE public.store_settings 
ADD CONSTRAINT check_watermark_type 
CHECK (watermark_type IN ('text', 'logo'));

-- Adicionar constraint para validar watermark_position
ALTER TABLE public.store_settings 
ADD CONSTRAINT check_watermark_position 
CHECK (watermark_position IN ('top-left', 'top-right', 'bottom-left', 'bottom-right', 'center'));

-- Adicionar constraint para validar watermark_opacity (0 a 1)
ALTER TABLE public.store_settings 
ADD CONSTRAINT check_watermark_opacity 
CHECK (watermark_opacity >= 0 AND watermark_opacity <= 1);

-- Criar bucket para logos de marca d'água se não existir
INSERT INTO storage.buckets (id, name, public) 
VALUES ('watermark-logos', 'watermark-logos', true)
ON CONFLICT (id) DO NOTHING;

-- Remover políticas existentes se existirem e criar novas
DROP POLICY IF EXISTS "Public can view watermark logos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload watermark logos" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their watermark logos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their watermark logos" ON storage.objects;

-- Políticas para o bucket watermark-logos
CREATE POLICY "Public can view watermark logos" ON storage.objects
  FOR SELECT USING (bucket_id = 'watermark-logos');

CREATE POLICY "Authenticated users can upload watermark logos" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (
    bucket_id = 'watermark-logos' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can update their watermark logos" ON storage.objects
  FOR UPDATE TO authenticated USING (
    bucket_id = 'watermark-logos' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can delete their watermark logos" ON storage.objects
  FOR DELETE TO authenticated USING (
    bucket_id = 'watermark-logos' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );
