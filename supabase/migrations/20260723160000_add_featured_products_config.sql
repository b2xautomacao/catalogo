-- Migration: Add Featured Products Section Configuration
-- Created: 2026-07-23 16:00:00
-- Description: Adiciona configuração de exibição da seção de produtos em destaque no catálogo (estilo hero ou cards carrossel)

ALTER TABLE store_settings
ADD COLUMN IF NOT EXISTS featured_products_enabled boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS featured_products_style text DEFAULT 'carousel';

COMMENT ON COLUMN store_settings.featured_products_enabled IS 'Ativa/desativa a seção de produtos em destaque no catálogo público';
COMMENT ON COLUMN store_settings.featured_products_style IS 'Estilo de exibição dos produtos em destaque: hero (banner full-width) ou carousel (cards em carrossel)';

UPDATE store_settings
SET
  featured_products_enabled = COALESCE(featured_products_enabled, true),
  featured_products_style = COALESCE(featured_products_style, 'carousel')
WHERE featured_products_enabled IS NULL;
