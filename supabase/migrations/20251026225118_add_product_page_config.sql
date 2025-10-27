-- Migration: Add Product Page Elements Configuration
-- Created: 2025-10-26 22:51:18
-- Description: Adiciona campos para configurar elementos de conversão na página do produto

ALTER TABLE store_settings
-- Badges de Urgência
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

-- Vídeos
ADD COLUMN IF NOT EXISTS product_show_videos boolean DEFAULT true,

-- Depoimentos
ADD COLUMN IF NOT EXISTS product_show_testimonials boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS product_testimonials_max_display integer DEFAULT 3,

-- Tabela de Medidas
ADD COLUMN IF NOT EXISTS product_show_size_chart boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS product_size_chart_default_open boolean DEFAULT false,

-- Cuidados do Produto
ADD COLUMN IF NOT EXISTS product_show_care_section boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS product_care_section_default_open boolean DEFAULT false;

-- Comentários
COMMENT ON COLUMN store_settings.product_show_urgency_badges IS 'Mostrar badges de urgência na página do produto';
COMMENT ON COLUMN store_settings.product_show_low_stock_badge IS 'Mostrar badge de estoque baixo';
COMMENT ON COLUMN store_settings.product_low_stock_threshold IS 'Quantidade mínima para considerar estoque baixo';
COMMENT ON COLUMN store_settings.product_show_best_seller_badge IS 'Mostrar badge de mais vendido';
COMMENT ON COLUMN store_settings.product_show_sales_count IS 'Mostrar contador de vendas';
COMMENT ON COLUMN store_settings.product_show_views_count IS 'Mostrar contador de visualizações';
COMMENT ON COLUMN store_settings.product_show_free_shipping_badge IS 'Mostrar badge de frete grátis';
COMMENT ON COLUMN store_settings.product_show_fast_delivery_badge IS 'Mostrar badge de entrega rápida';

COMMENT ON COLUMN store_settings.product_show_social_proof_carousel IS 'Mostrar carrossel de prova social';
COMMENT ON COLUMN store_settings.product_social_proof_autorotate IS 'Auto-rotacionar mensagens de prova social';
COMMENT ON COLUMN store_settings.product_social_proof_interval IS 'Intervalo de rotação em milissegundos';

COMMENT ON COLUMN store_settings.product_show_ratings IS 'Mostrar avaliações de clientes';
COMMENT ON COLUMN store_settings.product_show_rating_distribution IS 'Mostrar distribuição de estrelas';

COMMENT ON COLUMN store_settings.product_show_trust_section IS 'Mostrar seção de elementos de confiança';
COMMENT ON COLUMN store_settings.product_trust_free_shipping IS 'Incluir frete grátis na seção de confiança';
COMMENT ON COLUMN store_settings.product_trust_money_back IS 'Incluir garantia de devolução';
COMMENT ON COLUMN store_settings.product_trust_fast_delivery IS 'Incluir entrega rápida';
COMMENT ON COLUMN store_settings.product_trust_secure_payment IS 'Incluir pagamento seguro';
COMMENT ON COLUMN store_settings.product_trust_delivery_days IS 'Prazo de entrega (ex: 2-5)';
COMMENT ON COLUMN store_settings.product_trust_return_days IS 'Prazo de devolução em dias';

COMMENT ON COLUMN store_settings.product_show_videos IS 'Mostrar vídeos do produto (se cadastrados)';
COMMENT ON COLUMN store_settings.product_show_testimonials IS 'Mostrar depoimentos de clientes';
COMMENT ON COLUMN store_settings.product_testimonials_max_display IS 'Máximo de depoimentos a exibir';

COMMENT ON COLUMN store_settings.product_show_size_chart IS 'Mostrar tabela de medidas automática';
COMMENT ON COLUMN store_settings.product_size_chart_default_open IS 'Tabela de medidas expandida por padrão';

COMMENT ON COLUMN store_settings.product_show_care_section IS 'Mostrar seção de cuidados do produto';
COMMENT ON COLUMN store_settings.product_care_section_default_open IS 'Seção de cuidados expandida por padrão';

-- Atualizar registros existentes
UPDATE store_settings
SET 
  product_show_urgency_badges = COALESCE(product_show_urgency_badges, true),
  product_show_low_stock_badge = COALESCE(product_show_low_stock_badge, true),
  product_low_stock_threshold = COALESCE(product_low_stock_threshold, 10),
  product_show_best_seller_badge = COALESCE(product_show_best_seller_badge, true),
  product_show_sales_count = COALESCE(product_show_sales_count, true),
  product_show_views_count = COALESCE(product_show_views_count, true),
  product_show_social_proof_carousel = COALESCE(product_show_social_proof_carousel, true),
  product_show_ratings = COALESCE(product_show_ratings, true),
  product_show_trust_section = COALESCE(product_show_trust_section, true),
  product_trust_free_shipping = COALESCE(product_trust_free_shipping, true),
  product_trust_money_back = COALESCE(product_trust_money_back, true),
  product_trust_fast_delivery = COALESCE(product_trust_fast_delivery, true),
  product_trust_secure_payment = COALESCE(product_trust_secure_payment, true),
  product_trust_delivery_days = COALESCE(product_trust_delivery_days, '2-5'),
  product_trust_return_days = COALESCE(product_trust_return_days, 7),
  product_show_videos = COALESCE(product_show_videos, true),
  product_show_testimonials = COALESCE(product_show_testimonials, true),
  product_testimonials_max_display = COALESCE(product_testimonials_max_display, 3),
  product_show_size_chart = COALESCE(product_show_size_chart, true),
  product_show_care_section = COALESCE(product_show_care_section, true)
WHERE product_show_urgency_badges IS NULL;

