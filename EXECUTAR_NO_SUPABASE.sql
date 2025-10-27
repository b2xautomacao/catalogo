-- ============================================================================
-- EXECUTE ESTE SQL NO SUPABASE DASHBOARD
-- ============================================================================
-- Como executar:
-- 1. Acesse seu projeto no Supabase Dashboard
-- 2. Vá em "SQL Editor" no menu lateral
-- 3. Cole este código completo
-- 4. Clique em "Run" ou pressione Ctrl+Enter
-- ============================================================================

-- Adicionar campos de badges individuais do header
ALTER TABLE store_settings
ADD COLUMN IF NOT EXISTS header_badge_fast_delivery boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS header_badge_fast_delivery_text text DEFAULT 'Entrega Rápida em 24h',
ADD COLUMN IF NOT EXISTS header_badge_free_shipping boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS header_badge_free_shipping_text text DEFAULT 'Frete Grátis',
ADD COLUMN IF NOT EXISTS header_free_shipping_threshold numeric DEFAULT 200.00,
ADD COLUMN IF NOT EXISTS header_badge_secure_checkout boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS header_badge_secure_checkout_text text DEFAULT 'Compra 100% Segura',
ADD COLUMN IF NOT EXISTS header_badge_custom_1 boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS header_badge_custom_1_text text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS header_badge_custom_1_icon text DEFAULT 'star';

-- Adicionar campos de estilos de aparência
ALTER TABLE store_settings
ADD COLUMN IF NOT EXISTS button_style text DEFAULT 'modern' CHECK (button_style IN ('flat', 'modern', 'rounded')),
ADD COLUMN IF NOT EXISTS footer_style text DEFAULT 'dark' CHECK (footer_style IN ('dark', 'light', 'gradient')),
ADD COLUMN IF NOT EXISTS footer_bg_color text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS footer_text_color text DEFAULT NULL;

-- Adicionar campos de cores inteligentes
ALTER TABLE store_settings
ADD COLUMN IF NOT EXISTS logo_color_palette jsonb DEFAULT NULL,
ADD COLUMN IF NOT EXISTS auto_extract_colors boolean DEFAULT false;

-- ============================================================================
-- CONFIGURAÇÕES DA PÁGINA DO PRODUTO
-- ============================================================================

-- Badges de Urgência
ALTER TABLE store_settings
ADD COLUMN IF NOT EXISTS product_show_urgency_badges boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS product_show_low_stock_badge boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS product_low_stock_threshold integer DEFAULT 10,
ADD COLUMN IF NOT EXISTS product_show_best_seller_badge boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS product_show_sales_count boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS product_show_views_count boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS product_show_free_shipping_badge boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS product_show_fast_delivery_badge boolean DEFAULT true,

-- Prova Social (Carrossel)
ADD COLUMN IF NOT EXISTS product_show_social_proof_carousel boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS product_social_proof_autorotate boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS product_social_proof_interval integer DEFAULT 4000,

-- Avaliações
ADD COLUMN IF NOT EXISTS product_show_ratings boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS product_show_rating_distribution boolean DEFAULT true,

-- Seção de Confiança
ADD COLUMN IF NOT EXISTS product_show_trust_section boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS product_trust_free_shipping boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS product_trust_money_back boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS product_trust_fast_delivery boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS product_trust_secure_payment boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS product_trust_delivery_days text DEFAULT '2-5',
ADD COLUMN IF NOT EXISTS product_trust_return_days integer DEFAULT 7,

-- Vídeos e Depoimentos
ADD COLUMN IF NOT EXISTS product_show_videos boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS product_show_testimonials boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS product_testimonials_max_display integer DEFAULT 3,

-- Tabela de Medidas e Cuidados
ADD COLUMN IF NOT EXISTS product_show_size_chart boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS product_size_chart_default_open boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS product_show_care_section boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS product_care_section_default_open boolean DEFAULT false;

-- ============================================================================
-- PIXELS E TRACKING DE CONVERSÃO
-- ============================================================================

-- Meta Pixel (Facebook Ads)
ALTER TABLE store_settings
ADD COLUMN IF NOT EXISTS meta_pixel_id text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS meta_pixel_enabled boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS meta_pixel_access_token text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS meta_pixel_verified boolean DEFAULT false,

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

-- Eventos de Conversão
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
ADD COLUMN IF NOT EXISTS custom_events_config jsonb DEFAULT '[]'::jsonb;

-- ============================================================================
-- DOMÍNIOS CUSTOMIZADOS
-- ============================================================================

-- Subdomínio e Domínio Próprio
ALTER TABLE store_settings
ADD COLUMN IF NOT EXISTS subdomain_enabled boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS subdomain text DEFAULT NULL UNIQUE,
ADD COLUMN IF NOT EXISTS custom_domain text DEFAULT NULL UNIQUE,
ADD COLUMN IF NOT EXISTS custom_domain_enabled boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS custom_domain_verified boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS custom_domain_verification_token text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS custom_domain_verified_at timestamp with time zone DEFAULT NULL,
ADD COLUMN IF NOT EXISTS domain_mode text DEFAULT 'slug' CHECK (domain_mode IN ('slug', 'subdomain', 'custom_domain')),
ADD COLUMN IF NOT EXISTS ssl_cert_status text DEFAULT 'pending' CHECK (ssl_cert_status IN ('pending', 'active', 'failed'));

-- Constraint para garantir subdomínio válido
ALTER TABLE store_settings
ADD CONSTRAINT subdomain_format CHECK (
  subdomain IS NULL OR 
  subdomain ~ '^[a-z0-9-]+$'
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_store_settings_subdomain ON store_settings(LOWER(subdomain)) WHERE subdomain IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_store_settings_custom_domain ON store_settings(LOWER(custom_domain)) WHERE custom_domain IS NOT NULL;

-- Atualizar registros existentes
UPDATE store_settings
SET 
  header_badge_fast_delivery = COALESCE(header_badge_fast_delivery, true),
  header_badge_fast_delivery_text = COALESCE(header_badge_fast_delivery_text, 'Entrega Rápida em 24h'),
  header_badge_free_shipping = COALESCE(header_badge_free_shipping, true),
  header_badge_free_shipping_text = COALESCE(header_badge_free_shipping_text, 'Frete Grátis'),
  header_free_shipping_threshold = COALESCE(header_free_shipping_threshold, 200.00),
  header_badge_secure_checkout = COALESCE(header_badge_secure_checkout, true),
  header_badge_secure_checkout_text = COALESCE(header_badge_secure_checkout_text, 'Compra 100% Segura'),
  header_badge_custom_1 = COALESCE(header_badge_custom_1, false),
  header_badge_custom_1_icon = COALESCE(header_badge_custom_1_icon, 'star'),
  button_style = COALESCE(button_style, 'modern'),
  footer_style = COALESCE(footer_style, 'dark'),
  auto_extract_colors = COALESCE(auto_extract_colors, false),
  -- Página do Produto
  product_show_urgency_badges = COALESCE(product_show_urgency_badges, true),
  product_show_social_proof_carousel = COALESCE(product_show_social_proof_carousel, true),
  product_show_ratings = COALESCE(product_show_ratings, true),
  product_show_trust_section = COALESCE(product_show_trust_section, true),
  product_show_videos = COALESCE(product_show_videos, true),
  product_show_testimonials = COALESCE(product_show_testimonials, true),
  product_show_size_chart = COALESCE(product_show_size_chart, true),
  product_show_care_section = COALESCE(product_show_care_section, true)
WHERE header_badge_fast_delivery IS NULL 
   OR button_style IS NULL 
   OR product_show_urgency_badges IS NULL;

-- Verificar se funcionou
SELECT 
  id,
  store_id,
  header_badge_fast_delivery,
  header_badge_free_shipping,
  header_badge_secure_checkout,
  button_style,
  footer_style
FROM store_settings
LIMIT 5;

-- ============================================================================
-- Se aparecer uma tabela com os campos acima, está tudo certo! ✅
-- Agora volte para o admin e clique em Salvar novamente.
-- ============================================================================

