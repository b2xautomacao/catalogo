
-- Adicionar campos de redes sociais à tabela store_settings
ALTER TABLE public.store_settings 
ADD COLUMN facebook_url text,
ADD COLUMN instagram_url text,
ADD COLUMN twitter_url text;

-- Comentários para documentar os novos campos
COMMENT ON COLUMN public.store_settings.facebook_url IS 'URL da página do Facebook da loja';
COMMENT ON COLUMN public.store_settings.instagram_url IS 'URL da página do Instagram da loja';
COMMENT ON COLUMN public.store_settings.twitter_url IS 'URL da página do Twitter da loja';
