-- Migration: Adicionar configuração de pedido mínimo global
-- Data: 2025-01-29

-- Adicionar colunas de pedido mínimo na tabela store_price_models
ALTER TABLE store_price_models 
ADD COLUMN minimum_purchase_enabled BOOLEAN DEFAULT false,
ADD COLUMN minimum_purchase_amount DECIMAL(10,2) DEFAULT 0.00,
ADD COLUMN minimum_purchase_message TEXT DEFAULT 'Pedido mínimo de R$ {amount} para finalizar a compra';

-- Comentários para documentação
COMMENT ON COLUMN store_price_models.minimum_purchase_enabled IS 'Habilita pedido mínimo para o catálogo';
COMMENT ON COLUMN store_price_models.minimum_purchase_amount IS 'Valor mínimo do pedido em reais';
COMMENT ON COLUMN store_price_models.minimum_purchase_message IS 'Mensagem personalizada para pedido mínimo (use {amount} para o valor)';
