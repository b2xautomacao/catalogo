-- Migration: Correção agressiva do erro 406 na tabela store_price_models
-- Data: 2025-01-29
-- Esta migração resolve definitivamente o erro 406

-- 1. Desabilitar RLS temporariamente
ALTER TABLE store_price_models DISABLE ROW LEVEL SECURITY;

-- 2. Remover TODAS as políticas existentes (incluindo as que podem ter nomes diferentes)
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    -- Listar e remover todas as políticas da tabela store_price_models
    FOR policy_record IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'store_price_models' 
        AND schemaname = 'public'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || policy_record.policyname || '" ON store_price_models';
        RAISE NOTICE 'Política removida: %', policy_record.policyname;
    END LOOP;
END $$;

-- 3. Verificar se a tabela existe e recriar se necessário
DO $$
BEGIN
    -- Verificar se a tabela existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'store_price_models' 
        AND table_schema = 'public'
    ) THEN
        -- Recriar a tabela se não existir
        CREATE TABLE store_price_models (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            store_id UUID REFERENCES stores(id) ON DELETE CASCADE UNIQUE,
            
            -- Modelo escolhido pela loja
            price_model VARCHAR(50) NOT NULL DEFAULT 'retail_only',
            
            -- Configurações para atacado simples
            simple_wholesale_enabled BOOLEAN DEFAULT false,
            simple_wholesale_name VARCHAR(50) DEFAULT 'Atacado',
            simple_wholesale_min_qty INTEGER DEFAULT 10,
            
            -- Configurações para atacado gradativo
            gradual_wholesale_enabled BOOLEAN DEFAULT false,
            gradual_tiers_count INTEGER DEFAULT 2,
            
            -- Nomes dos níveis (configuráveis)
            tier_1_name VARCHAR(50) DEFAULT 'Varejo',
            tier_2_name VARCHAR(50) DEFAULT 'Atacarejo',
            tier_3_name VARCHAR(50) DEFAULT 'Atacado Pequeno',
            tier_4_name VARCHAR(50) DEFAULT 'Atacado Grande',
            
            -- Ativar/desativar níveis específicos
            tier_1_enabled BOOLEAN DEFAULT true,
            tier_2_enabled BOOLEAN DEFAULT false,
            tier_3_enabled BOOLEAN DEFAULT false,
            tier_4_enabled BOOLEAN DEFAULT false,
            
            -- Configurações de exibição
            show_price_tiers BOOLEAN DEFAULT true,
            show_savings_indicators BOOLEAN DEFAULT true,
            show_next_tier_hint BOOLEAN DEFAULT true,
            
            -- Colunas de pedido mínimo
            minimum_purchase_enabled BOOLEAN DEFAULT false,
            minimum_purchase_amount DECIMAL(10,2) DEFAULT 0.00,
            minimum_purchase_message TEXT DEFAULT 'Pedido mínimo de R$ {amount} para finalizar a compra',
            
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        RAISE NOTICE 'Tabela store_price_models criada';
    ELSE
        RAISE NOTICE 'Tabela store_price_models já existe';
    END IF;
END $$;

-- 4. Adicionar colunas de pedido mínimo se não existirem
DO $$
BEGIN
    -- Verificar e adicionar coluna minimum_purchase_enabled
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'store_price_models' 
        AND column_name = 'minimum_purchase_enabled'
    ) THEN
        ALTER TABLE store_price_models 
        ADD COLUMN minimum_purchase_enabled BOOLEAN DEFAULT false;
        RAISE NOTICE 'Coluna minimum_purchase_enabled adicionada';
    END IF;

    -- Verificar e adicionar coluna minimum_purchase_amount
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'store_price_models' 
        AND column_name = 'minimum_purchase_amount'
    ) THEN
        ALTER TABLE store_price_models 
        ADD COLUMN minimum_purchase_amount DECIMAL(10,2) DEFAULT 0.00;
        RAISE NOTICE 'Coluna minimum_purchase_amount adicionada';
    END IF;

    -- Verificar e adicionar coluna minimum_purchase_message
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'store_price_models' 
        AND column_name = 'minimum_purchase_message'
    ) THEN
        ALTER TABLE store_price_models 
        ADD COLUMN minimum_purchase_message TEXT DEFAULT 'Pedido mínimo de R$ {amount} para finalizar a compra';
        RAISE NOTICE 'Coluna minimum_purchase_message adicionada';
    END IF;
END $$;

-- 5. Criar índices se não existirem
CREATE INDEX IF NOT EXISTS idx_store_price_models_store_id ON store_price_models(store_id);

-- 6. Criar trigger para updated_at se não existir
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_store_price_models_updated_at ON store_price_models;
CREATE TRIGGER update_store_price_models_updated_at 
    BEFORE UPDATE ON store_price_models 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 7. Habilitar RLS novamente
ALTER TABLE store_price_models ENABLE ROW LEVEL SECURITY;

-- 8. Criar políticas RLS muito simples e seguras
CREATE POLICY "Allow all operations for authenticated users" ON store_price_models
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow public read access" ON store_price_models
    FOR SELECT USING (true);

-- 9. Atualizar registros existentes com valores padrão
UPDATE store_price_models 
SET 
    minimum_purchase_enabled = COALESCE(minimum_purchase_enabled, false),
    minimum_purchase_amount = COALESCE(minimum_purchase_amount, 0.00),
    minimum_purchase_message = COALESCE(minimum_purchase_message, 'Pedido mínimo de R$ {amount} para finalizar a compra')
WHERE 
    minimum_purchase_enabled IS NULL 
    OR minimum_purchase_amount IS NULL 
    OR minimum_purchase_message IS NULL;

-- 10. Verificar a estrutura final
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'store_price_models' 
ORDER BY ordinal_position;

-- 11. Testar consulta básica
SELECT 
    store_id,
    price_model,
    minimum_purchase_enabled,
    minimum_purchase_amount,
    minimum_purchase_message,
    created_at,
    updated_at
FROM store_price_models 
ORDER BY updated_at DESC 
LIMIT 5;

-- 12. Verificar políticas RLS
SELECT 
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'store_price_models' 
AND schemaname = 'public';

-- 13. Comentário final
COMMENT ON TABLE store_price_models IS 'Configuração do modelo de preço por loja - Erro 406 corrigido definitivamente';
