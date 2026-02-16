-- Migration: Atacado por quantidade total do carrinho (unidades gerais)
-- Data: 2026-02-16
-- Adiciona opção de aplicar atacado quando o total de unidades no carrinho atinge o mínimo

ALTER TABLE store_price_models
  ADD COLUMN IF NOT EXISTS simple_wholesale_by_cart_total BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS simple_wholesale_cart_min_qty INTEGER DEFAULT 10;

COMMENT ON COLUMN store_price_models.simple_wholesale_by_cart_total IS 'Quando true, atacado é aplicado a todos os itens da loja se o total de unidades no carrinho atingir simple_wholesale_cart_min_qty';
COMMENT ON COLUMN store_price_models.simple_wholesale_cart_min_qty IS 'Quantidade mínima total no carrinho (soma de todos os itens da loja) para ativar preço de atacado em todos os itens';
