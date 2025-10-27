-- Migration: Add Conversion Pixels and Analytics Configuration
-- Created: 2025-10-26 23:17:44
-- Description: Sistema profissional de tracking com Meta Pixel, Google Ads e Analytics

ALTER TABLE store_settings
-- Meta Pixel (Facebook Ads)
ADD COLUMN IF NOT EXISTS meta_pixel_id text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS meta_pixel_enabled boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS meta_pixel_access_token text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS meta_pixel_test_code text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS meta_pixel_verified boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS meta_pixel_verified_at timestamp with time zone DEFAULT NULL,

-- Google Analytics 4
ADD COLUMN IF NOT EXISTS ga4_measurement_id text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS ga4_enabled boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS ga4_api_secret text DEFAULT NULL,

-- Google Ads
ADD COLUMN IF NOT EXISTS google_ads_id text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS google_ads_enabled boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS google_ads_conversion_label text DEFAULT NULL,

-- TikTok Pixel
ADD COLUMN IF NOT EXISTS tiktok_pixel_id text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS tiktok_pixel_enabled boolean DEFAULT false,

-- Eventos de Conversão Habilitados
ADD COLUMN IF NOT EXISTS tracking_pageview boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS tracking_view_content boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS tracking_add_to_cart boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS tracking_initiate_checkout boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS tracking_add_payment_info boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS tracking_purchase boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS tracking_search boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS tracking_view_category boolean DEFAULT true,

-- Configurações Avançadas
ADD COLUMN IF NOT EXISTS tracking_advanced_matching boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS tracking_auto_events boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS tracking_debug_mode boolean DEFAULT false,

-- Metricas Personalizadas
ADD COLUMN IF NOT EXISTS custom_events_config jsonb DEFAULT '[]'::jsonb;

-- Comentários
COMMENT ON COLUMN store_settings.meta_pixel_id IS 'Facebook/Meta Pixel ID';
COMMENT ON COLUMN store_settings.meta_pixel_enabled IS 'Ativar Meta Pixel tracking';
COMMENT ON COLUMN store_settings.meta_pixel_access_token IS 'Token de acesso para Conversions API';
COMMENT ON COLUMN store_settings.meta_pixel_test_code IS 'Código de teste para validação do pixel';
COMMENT ON COLUMN store_settings.meta_pixel_verified IS 'Pixel foi verificado e está funcionando';
COMMENT ON COLUMN store_settings.meta_pixel_verified_at IS 'Data da última verificação';

COMMENT ON COLUMN store_settings.ga4_measurement_id IS 'Google Analytics 4 Measurement ID (G-XXXXXXXXXX)';
COMMENT ON COLUMN store_settings.ga4_enabled IS 'Ativar Google Analytics 4 tracking';
COMMENT ON COLUMN store_settings.ga4_api_secret IS 'API Secret para Measurement Protocol';

COMMENT ON COLUMN store_settings.google_ads_id IS 'Google Ads Conversion ID (AW-XXXXXXXXXX)';
COMMENT ON COLUMN store_settings.google_ads_enabled IS 'Ativar Google Ads conversion tracking';
COMMENT ON COLUMN store_settings.google_ads_conversion_label IS 'Label da conversão principal';

COMMENT ON COLUMN store_settings.tiktok_pixel_id IS 'TikTok Pixel ID';
COMMENT ON COLUMN store_settings.tiktok_pixel_enabled IS 'Ativar TikTok Pixel tracking';

COMMENT ON COLUMN store_settings.tracking_pageview IS 'Rastrear visualizações de página';
COMMENT ON COLUMN store_settings.tracking_view_content IS 'Rastrear visualizações de produto';
COMMENT ON COLUMN store_settings.tracking_add_to_cart IS 'Rastrear adições ao carrinho';
COMMENT ON COLUMN store_settings.tracking_initiate_checkout IS 'Rastrear início de checkout';
COMMENT ON COLUMN store_settings.tracking_add_payment_info IS 'Rastrear adição de informações de pagamento';
COMMENT ON COLUMN store_settings.tracking_purchase IS 'Rastrear compras finalizadas';
COMMENT ON COLUMN store_settings.tracking_search IS 'Rastrear buscas no catálogo';
COMMENT ON COLUMN store_settings.tracking_view_category IS 'Rastrear visualizações de categoria';

COMMENT ON COLUMN store_settings.tracking_advanced_matching IS 'Ativar advanced matching (email, telefone) nos pixels';
COMMENT ON COLUMN store_settings.tracking_auto_events IS 'Ativar eventos automáticos (scroll, click, etc)';
COMMENT ON COLUMN store_settings.tracking_debug_mode IS 'Modo debug - log de eventos no console';

COMMENT ON COLUMN store_settings.custom_events_config IS 'Configuração de eventos personalizados [{name, trigger, params}]';

-- Atualizar registros existentes
UPDATE store_settings
SET 
  meta_pixel_enabled = COALESCE(meta_pixel_enabled, false),
  ga4_enabled = COALESCE(ga4_enabled, false),
  google_ads_enabled = COALESCE(google_ads_enabled, false),
  tiktok_pixel_enabled = COALESCE(tiktok_pixel_enabled, false),
  tracking_pageview = COALESCE(tracking_pageview, true),
  tracking_view_content = COALESCE(tracking_view_content, true),
  tracking_add_to_cart = COALESCE(tracking_add_to_cart, true),
  tracking_initiate_checkout = COALESCE(tracking_initiate_checkout, true),
  tracking_purchase = COALESCE(tracking_purchase, true),
  tracking_auto_events = COALESCE(tracking_auto_events, true),
  tracking_debug_mode = COALESCE(tracking_debug_mode, false)
WHERE meta_pixel_enabled IS NULL;

