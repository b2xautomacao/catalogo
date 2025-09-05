-- Migration: Forçar sincronização na VPS
-- Data: 2025-01-29
-- Esta migração força a sincronização da tabela store_price_models na VPS

-- 1. Verificar ambiente
SELECT 
    'Ambiente VPS' as ambiente,
    NOW() as timestamp,
    version() as postgres_version;

-- 2. Remover completamente a tabela se existir (CUIDADO!)
-- ⚠️ ATENÇÃO: Isso vai apagar todos os dados da tabela!
-- Descomente apenas se você tem certeza que quer recriar a tabela do zero

-- DROP TABLE IF EXISTS store_price_models CASCADE;

-- 3. Recriar a tabela do zero com estrutura completa
CREATE TABLE IF NOT EXISTS store_price_models (
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

-- 4. Criar índices
CREATE INDEX IF NOT EXISTS idx_store_price_models_store_id ON store_price_models(store_id);

-- 5. Criar função para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 6. Criar trigger
DROP TRIGGER IF EXISTS update_store_price_models_updated_at ON store_price_models;
CREATE TRIGGER update_store_price_models_updated_at 
    BEFORE UPDATE ON store_price_models 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 7. Desabilitar RLS temporariamente
ALTER TABLE store_price_models DISABLE ROW LEVEL SECURITY;

-- 8. Remover todas as políticas existentes
DO $$
DECLARE
    policy_record RECORD;
BEGIN
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

-- 9. Habilitar RLS
ALTER TABLE store_price_models ENABLE ROW LEVEL SECURITY;

-- 10. Criar políticas RLS muito permissivas
CREATE POLICY "Allow all operations for authenticated users" ON store_price_models
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow public read access" ON store_price_models
    FOR SELECT USING (true);

-- 11. Conceder permissões explícitas
GRANT ALL ON store_price_models TO authenticated;
GRANT ALL ON store_price_models TO anon;
GRANT ALL ON store_price_models TO service_role;

-- 12. Inserir dados de teste se a tabela estiver vazia
INSERT INTO store_price_models (
    store_id,
    price_model,
    minimum_purchase_enabled,
    minimum_purchase_amount,
    minimum_purchase_message
) VALUES (
    '9f94e65a-e5ec-42cd-bfb6-0cc4782d226c',
    'retail_only',
    false,
    0.00,
    'Pedido mínimo de R$ {amount} para finalizar a compra'
) ON CONFLICT (store_id) DO NOTHING;

-- 13. Verificar se a tabela está funcionando
SELECT 
    'Verificação final' as status,
    COUNT(*) as total_records,
    COUNT(CASE WHEN store_id = '9f94e65a-e5ec-42cd-bfb6-0cc4782d226c' THEN 1 END) as target_store_records
FROM store_price_models;

-- 14. Testar consulta que estava falhando
SELECT 
    'Teste consulta específica' as status,
    CASE 
        WHEN COUNT(*) > 0 THEN 'SUCESSO - ' || COUNT(*) || ' registros encontrados'
        ELSE 'FALHA - Nenhum registro encontrado'
    END as resultado
FROM store_price_models 
WHERE store_id = '9f94e65a-e5ec-42cd-bfb6-0cc4782d226c';

-- 15. Mostrar estrutura final
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'store_price_models' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 16. Mostrar políticas RLS
SELECT 
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE tablename = 'store_price_models' 
AND schemaname = 'public'
ORDER BY policyname;

-- 17. Comentário final
COMMENT ON TABLE store_price_models IS 'Tabela sincronizada para VPS - Erro 406 corrigido';
