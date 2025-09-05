-- Script de diagnóstico para tabela store_price_models
-- Execute este script no SQL Editor do Supabase para diagnosticar problemas

-- 1. Verificar se a tabela existe
SELECT 
    table_name,
    table_type,
    is_insertable_into
FROM information_schema.tables 
WHERE table_name = 'store_price_models' 
AND table_schema = 'public';

-- 2. Verificar estrutura da tabela
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default,
    ordinal_position
FROM information_schema.columns 
WHERE table_name = 'store_price_models' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. Verificar se RLS está habilitado
SELECT 
    schemaname,
    tablename,
    rowsecurity,
    forcerowsecurity
FROM pg_tables 
WHERE tablename = 'store_price_models' 
AND schemaname = 'public';

-- 4. Listar todas as políticas RLS
SELECT 
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'store_price_models' 
AND schemaname = 'public'
ORDER BY policyname;

-- 5. Verificar permissões da tabela
SELECT 
    grantee,
    privilege_type,
    is_grantable
FROM information_schema.table_privileges 
WHERE table_name = 'store_price_models' 
AND table_schema = 'public'
ORDER BY grantee, privilege_type;

-- 6. Verificar se há dados na tabela
SELECT 
    COUNT(*) as total_records,
    COUNT(DISTINCT store_id) as unique_stores
FROM store_price_models;

-- 7. Testar consulta simples
SELECT 
    store_id,
    price_model,
    created_at
FROM store_price_models 
LIMIT 3;

-- 8. Verificar se há erros de constraint
SELECT 
    conname,
    contype,
    confrelid::regclass as referenced_table
FROM pg_constraint 
WHERE conrelid = 'store_price_models'::regclass;

-- 9. Verificar índices
SELECT 
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'store_price_models' 
AND schemaname = 'public';

-- 10. Verificar triggers
SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'store_price_models' 
AND event_object_schema = 'public';
