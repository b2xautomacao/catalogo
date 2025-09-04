-- Migration: Verificar se as colunas de pedido mínimo existem
-- Data: 2025-01-29

-- Verificar se as colunas existem
DO $$
BEGIN
    -- Verificar se a coluna minimum_purchase_enabled existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'store_price_models' 
        AND column_name = 'minimum_purchase_enabled'
    ) THEN
        RAISE NOTICE 'Coluna minimum_purchase_enabled não existe, criando...';
        ALTER TABLE store_price_models 
        ADD COLUMN minimum_purchase_enabled BOOLEAN DEFAULT false;
    ELSE
        RAISE NOTICE 'Coluna minimum_purchase_enabled já existe';
    END IF;

    -- Verificar se a coluna minimum_purchase_amount existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'store_price_models' 
        AND column_name = 'minimum_purchase_amount'
    ) THEN
        RAISE NOTICE 'Coluna minimum_purchase_amount não existe, criando...';
        ALTER TABLE store_price_models 
        ADD COLUMN minimum_purchase_amount DECIMAL(10,2) DEFAULT 0.00;
    ELSE
        RAISE NOTICE 'Coluna minimum_purchase_amount já existe';
    END IF;

    -- Verificar se a coluna minimum_purchase_message existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'store_price_models' 
        AND column_name = 'minimum_purchase_message'
    ) THEN
        RAISE NOTICE 'Coluna minimum_purchase_message não existe, criando...';
        ALTER TABLE store_price_models 
        ADD COLUMN minimum_purchase_message TEXT DEFAULT 'Pedido mínimo de R$ {amount} para finalizar a compra';
    ELSE
        RAISE NOTICE 'Coluna minimum_purchase_message já existe';
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
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'store_price_models' 
AND column_name LIKE 'minimum_purchase%'
ORDER BY column_name;
