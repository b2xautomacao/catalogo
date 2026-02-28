-- Migration: Add Checkout Configuration Fields
-- Created: 2026-02-28
-- Description: Adiciona campos para configurar o comportamento do checkout na página do produto

ALTER TABLE store_settings
ADD COLUMN IF NOT EXISTS checkout_require_address boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS checkout_whatsapp_only boolean DEFAULT true;

-- Comentários
COMMENT ON COLUMN store_settings.checkout_require_address IS 'Se verdadeiro, solicita endereço de entrega no checkout';
COMMENT ON COLUMN store_settings.checkout_whatsapp_only IS 'Se verdadeiro, finaliza pedido direto pelo WhatsApp (sem etapa de pagamento online)';

-- Atualizar registros existentes com valores padrão
UPDATE store_settings
SET
  checkout_require_address = COALESCE(checkout_require_address, true),
  checkout_whatsapp_only   = COALESCE(checkout_whatsapp_only, true)
WHERE checkout_require_address IS NULL;
