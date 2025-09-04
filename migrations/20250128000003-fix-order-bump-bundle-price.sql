-- Adicionar coluna bundle_price se não existir
ALTER TABLE store_order_bump_configs 
ADD COLUMN IF NOT EXISTS bundle_price DECIMAL(10,2);

-- Adicionar outras colunas que podem estar faltando
ALTER TABLE store_order_bump_configs 
ADD COLUMN IF NOT EXISTS trigger_conditions JSONB DEFAULT '{}';

-- Verificar se a tabela tem todas as colunas necessárias
DO $$
BEGIN
    -- Verificar se a coluna bundle_price existe
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'store_order_bump_configs' 
        AND column_name = 'bundle_price'
    ) THEN
        ALTER TABLE store_order_bump_configs ADD COLUMN bundle_price DECIMAL(10,2);
    END IF;
    
    -- Verificar se a coluna trigger_conditions existe
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'store_order_bump_configs' 
        AND column_name = 'trigger_conditions'
    ) THEN
        ALTER TABLE store_order_bump_configs ADD COLUMN trigger_conditions JSONB DEFAULT '{}';
    END IF;
END $$;


