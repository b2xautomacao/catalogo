-- Script para verificar se as migrações foram aplicadas na VPS
-- Execute este script no SQL Editor do Supabase Dashboard

-- 1. Verificar se a tabela store_price_models existe
SELECT 
    'Tabela store_price_models' as check_name,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_name = 'store_price_models' 
            AND table_schema = 'public'
        ) THEN 'EXISTE' 
        ELSE 'NÃO EXISTE' 
    END as status;

-- 2. Verificar estrutura da tabela
SELECT 
    'Estrutura da tabela' as check_name,
    COUNT(*) as total_columns
FROM information_schema.columns 
WHERE table_name = 'store_price_models' 
AND table_schema = 'public';

-- 3. Verificar colunas específicas
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'store_price_models' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 4. Verificar se RLS está habilitado
SELECT 
    'RLS habilitado' as check_name,
    CASE 
        WHEN relrowsecurity THEN 'SIM' 
        ELSE 'NÃO' 
    END as status
FROM pg_class 
WHERE relname = 'store_price_models' 
AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

-- 5. Verificar políticas RLS
SELECT 
    'Políticas RLS' as check_name,
    COUNT(*) as total_policies
FROM pg_policies 
WHERE tablename = 'store_price_models' 
AND schemaname = 'public';

-- 6. Listar todas as políticas
SELECT 
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'store_price_models' 
AND schemaname = 'public'
ORDER BY policyname;

-- 7. Verificar se há dados na tabela
SELECT 
    'Dados na tabela' as check_name,
    COUNT(*) as total_records
FROM store_price_models;

-- 8. Verificar store_id específico
SELECT 
    'Store ID específico' as check_name,
    COUNT(*) as records_for_store
FROM store_price_models 
WHERE store_id = '9f94e65a-e5ec-42cd-bfb6-0cc4782d226c';

-- 9. Verificar permissões da tabela
SELECT 
    grantee,
    privilege_type,
    is_grantable
FROM information_schema.table_privileges 
WHERE table_name = 'store_price_models' 
AND table_schema = 'public'
ORDER BY grantee, privilege_type;

-- 10. Verificar se há constraints
SELECT 
    conname,
    contype,
    confrelid::regclass as referenced_table
FROM pg_constraint 
WHERE conrelid = 'store_price_models'::regclass;

-- 11. Verificar índices
SELECT 
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'store_price_models' 
AND schemaname = 'public';

-- 12. Verificar triggers
SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'store_price_models' 
AND event_object_schema = 'public';

-- 13. Testar consulta que está falhando
SELECT 
    'Teste consulta falhando' as check_name,
    CASE 
        WHEN COUNT(*) > 0 THEN 'SUCESSO - ' || COUNT(*) || ' registros'
        ELSE 'FALHA - Nenhum registro encontrado'
    END as status
FROM store_price_models 
WHERE store_id = '9f94e65a-e5ec-42cd-bfb6-0cc4782d226c';

-- 14. Verificar logs de erro (se disponível)
SELECT 
    'Logs de erro' as check_name,
    'Verifique os logs do Supabase Dashboard' as status;

-- 15. Verificar versão do PostgreSQL
SELECT 
    'Versão PostgreSQL' as check_name,
    version() as status;
