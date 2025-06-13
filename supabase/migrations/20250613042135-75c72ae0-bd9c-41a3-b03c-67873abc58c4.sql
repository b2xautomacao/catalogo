
-- Adicionar colunas faltantes na tabela store_settings
ALTER TABLE public.store_settings 
ADD COLUMN IF NOT EXISTS template_name TEXT DEFAULT 'default',
ADD COLUMN IF NOT EXISTS custom_domain TEXT,
ADD COLUMN IF NOT EXISTS catalog_url_slug TEXT,
ADD COLUMN IF NOT EXISTS seo_title TEXT,
ADD COLUMN IF NOT EXISTS seo_description TEXT,
ADD COLUMN IF NOT EXISTS seo_keywords TEXT,
ADD COLUMN IF NOT EXISTS checkout_type TEXT DEFAULT 'both' CHECK (checkout_type IN ('whatsapp', 'online', 'both')),
ADD COLUMN IF NOT EXISTS show_prices BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS show_stock BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS allow_categories_filter BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS allow_price_filter BOOLEAN DEFAULT true;
