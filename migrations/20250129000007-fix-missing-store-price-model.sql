-- Migration: Corrigir registro faltante para loja específica
-- Data: 2025-01-29
-- Esta migração cria o registro faltante para a loja que está causando erro 406

-- Store ID que está causando o problema
-- 9f94e65a-e5ec-42cd-bfb6-0cc4782d226c

-- 1. Verificar se o registro já existe
SELECT 
    'Verificação inicial' as status,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM store_price_models 
            WHERE store_id = '9f94e65a-e5ec-42cd-bfb6-0cc4782d226c'
        ) THEN 'REGISTRO JÁ EXISTE'
        ELSE 'REGISTRO NÃO EXISTE - SERÁ CRIADO'
    END as resultado;

-- 2. Verificar se a loja existe na tabela stores
SELECT 
    'Verificação da loja' as status,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM stores 
            WHERE id = '9f94e65a-e5ec-42cd-bfb6-0cc4782d226c'
        ) THEN 'LOJA EXISTE'
        ELSE 'LOJA NÃO EXISTE'
    END as resultado;

-- 3. Inserir registro padrão para a loja (se não existir)
INSERT INTO store_price_models (
    store_id,
    price_model,
    simple_wholesale_enabled,
    simple_wholesale_name,
    simple_wholesale_min_qty,
    gradual_wholesale_enabled,
    gradual_tiers_count,
    tier_1_name,
    tier_2_name,
    tier_3_name,
    tier_4_name,
    tier_1_enabled,
    tier_2_enabled,
    tier_3_enabled,
    tier_4_enabled,
    show_price_tiers,
    show_savings_indicators,
    show_next_tier_hint,
    minimum_purchase_enabled,
    minimum_purchase_amount,
    minimum_purchase_message
) VALUES (
    '9f94e65a-e5ec-42cd-bfb6-0cc4782d226c',
    'retail_only', -- Modelo padrão
    false, -- Atacado simples desabilitado
    'Atacado',
    10,
    false, -- Atacado gradativo desabilitado
    2, -- 2 níveis
    'Varejo',
    'Atacarejo',
    'Atacado Pequeno',
    'Atacado Grande',
    true, -- Varejo habilitado
    false, -- Atacarejo desabilitado
    false, -- Atacado Pequeno desabilitado
    false, -- Atacado Grande desabilitado
    true, -- Mostrar níveis de preço
    true, -- Mostrar indicadores de economia
    true, -- Mostrar dica do próximo nível
    false, -- Pedido mínimo desabilitado
    0.00, -- Valor mínimo 0
    'Pedido mínimo de R$ {amount} para finalizar a compra'
) ON CONFLICT (store_id) DO UPDATE SET
    -- Se o registro já existir, atualizar com valores padrão
    price_model = EXCLUDED.price_model,
    simple_wholesale_enabled = EXCLUDED.simple_wholesale_enabled,
    simple_wholesale_name = EXCLUDED.simple_wholesale_name,
    simple_wholesale_min_qty = EXCLUDED.simple_wholesale_min_qty,
    gradual_wholesale_enabled = EXCLUDED.gradual_wholesale_enabled,
    gradual_tiers_count = EXCLUDED.gradual_tiers_count,
    tier_1_name = EXCLUDED.tier_1_name,
    tier_2_name = EXCLUDED.tier_2_name,
    tier_3_name = EXCLUDED.tier_3_name,
    tier_4_name = EXCLUDED.tier_4_name,
    tier_1_enabled = EXCLUDED.tier_1_enabled,
    tier_2_enabled = EXCLUDED.tier_2_enabled,
    tier_3_enabled = EXCLUDED.tier_3_enabled,
    tier_4_enabled = EXCLUDED.tier_4_enabled,
    show_price_tiers = EXCLUDED.show_price_tiers,
    show_savings_indicators = EXCLUDED.show_savings_indicators,
    show_next_tier_hint = EXCLUDED.show_next_tier_hint,
    minimum_purchase_enabled = EXCLUDED.minimum_purchase_enabled,
    minimum_purchase_amount = EXCLUDED.minimum_purchase_amount,
    minimum_purchase_message = EXCLUDED.minimum_purchase_message,
    updated_at = NOW();

-- 4. Verificar se o registro foi criado/atualizado
SELECT 
    'Verificação final' as status,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM store_price_models 
            WHERE store_id = '9f94e65a-e5ec-42cd-bfb6-0cc4782d226c'
        ) THEN 'SUCESSO - REGISTRO CRIADO/ATUALIZADO'
        ELSE 'ERRO - REGISTRO NÃO FOI CRIADO'
    END as resultado;

-- 5. Mostrar o registro criado
SELECT 
    'Registro criado' as status,
    id,
    store_id,
    price_model,
    simple_wholesale_enabled,
    gradual_wholesale_enabled,
    minimum_purchase_enabled,
    minimum_purchase_amount,
    created_at,
    updated_at
FROM store_price_models 
WHERE store_id = '9f94e65a-e5ec-42cd-bfb6-0cc4782d226c';

-- 6. Testar a consulta que estava falhando
SELECT 
    'Teste consulta específica' as status,
    CASE 
        WHEN COUNT(*) > 0 THEN 'SUCESSO - ' || COUNT(*) || ' registros encontrados'
        ELSE 'FALHA - Nenhum registro encontrado'
    END as resultado
FROM store_price_models 
WHERE store_id = '9f94e65a-e5ec-42cd-bfb6-0cc4782d226c';

-- 7. Mostrar todos os registros para comparação
SELECT 
    'Todos os registros' as status,
    store_id,
    price_model,
    minimum_purchase_enabled,
    minimum_purchase_amount,
    created_at
FROM store_price_models 
ORDER BY created_at DESC;

-- 8. Comentário final
COMMENT ON TABLE store_price_models IS 'Registro faltante para loja 9f94e65a-e5ec-42cd-bfb6-0cc4782d226c criado';
