-- Migration: Corrigir persistência de pedido mínimo
-- Data: 2025-01-29

-- Verificar e criar colunas se não existirem
DO $$
BEGIN
    -- Verificar se a coluna minimum_purchase_enabled existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'store_price_models' 
        AND column_name = 'minimum_purchase_enabled'
    ) THEN
        ALTER TABLE store_price_models 
        ADD COLUMN minimum_purchase_enabled BOOLEAN DEFAULT false;
        RAISE NOTICE 'Coluna minimum_purchase_enabled criada';
    END IF;

    -- Verificar se a coluna minimum_purchase_amount existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'store_price_models' 
        AND column_name = 'minimum_purchase_amount'
    ) THEN
        ALTER TABLE store_price_models 
        ADD COLUMN minimum_purchase_amount DECIMAL(10,2) DEFAULT 0.00;
        RAISE NOTICE 'Coluna minimum_purchase_amount criada';
    END IF;

    -- Verificar se a coluna minimum_purchase_message existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'store_price_models' 
        AND column_name = 'minimum_purchase_message'
    ) THEN
        ALTER TABLE store_price_models 
        ADD COLUMN minimum_purchase_message TEXT DEFAULT 'Pedido mínimo de R$ {amount} para finalizar a compra';
        RAISE NOTICE 'Coluna minimum_purchase_message criada';
    END IF;
END $$;

-- Atualizar registros existentes com valores padrão se as colunas forem NULL
UPDATE store_price_models 
SET 
    minimum_purchase_enabled = COALESCE(minimum_purchase_enabled, false),
    minimum_purchase_amount = COALESCE(minimum_purchase_amount, 0.00),
    minimum_purchase_message = COALESCE(minimum_purchase_message, 'Pedido mínimo de R$ {amount} para finalizar a compra')
WHERE 
    minimum_purchase_enabled IS NULL 
    OR minimum_purchase_amount IS NULL 
    OR minimum_purchase_message IS NULL;

-- Verificar a estrutura final da tabela
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'store_price_models' 
AND column_name LIKE 'minimum_purchase%'
ORDER BY column_name;

-- Mostrar dados atuais para debug
SELECT 
    store_id,
    price_model,
    minimum_purchase_enabled,
    minimum_purchase_amount,
    minimum_purchase_message,
    updated_at
FROM store_price_models 
ORDER BY updated_at DESC 
LIMIT 5;
