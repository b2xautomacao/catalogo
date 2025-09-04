-- VERIFICAÇÃO DAS TABELAS EXISTENTES NO SUPABASE
-- Execute estes comandos no Supabase SQL Editor para verificar o que já existe

-- 1. LISTAR TODAS AS TABELAS RELACIONADAS AO PROJETO
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
    AND (table_name LIKE 'store_%' OR table_name LIKE '%product%' OR table_name LIKE '%user%')
ORDER BY table_name;

-- 2. VERIFICAR COLUNAS DA TABELA STORE_SETTINGS
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'store_settings' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. VERIFICAR SE AS TABELAS NECESSÁRIAS JÁ EXISTEM
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'store_payment_methods') 
        THEN 'EXISTS' 
        ELSE 'MISSING' 
    END as store_payment_methods,
    
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'store_shipping_methods') 
        THEN 'EXISTS' 
        ELSE 'MISSING' 
    END as store_shipping_methods,
    
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'store_order_bump_configs') 
        THEN 'EXISTS' 
        ELSE 'MISSING' 
    END as store_order_bump_configs,
    
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'products') 
        THEN 'EXISTS' 
        ELSE 'MISSING' 
    END as products_table,
    
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'stores') 
        THEN 'EXISTS' 
        ELSE 'MISSING' 
    END as stores_table;

-- 4. VERIFICAR ESTRUTURA DA TABELA PRODUCTS (SE EXISTIR)
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'products' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- 5. VERIFICAR ESTRUTURA DA TABELA STORES (SE EXISTIR)
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'stores' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- 6. VERIFICAR TIPOS ENUM EXISTENTES
SELECT 
    t.typname as enum_name,
    e.enumlabel as enum_value
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid  
WHERE t.typname IN ('payment_method_type', 'shipping_method_type', 'business_hours_display')
ORDER BY t.typname, e.enumsortorder;

-- 7. CONTAR REGISTROS EXISTENTES (SE AS TABELAS EXISTIREM)
DO $$
DECLARE
    payment_count INTEGER;
    shipping_count INTEGER;
    orderbump_count INTEGER;
    product_count INTEGER;
BEGIN
    -- Contar payment methods
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'store_payment_methods') THEN
        SELECT COUNT(*) INTO payment_count FROM store_payment_methods;
        RAISE NOTICE 'Payment Methods: % registros', payment_count;
    ELSE
        RAISE NOTICE 'Tabela store_payment_methods não existe';
    END IF;
    
    -- Contar shipping methods
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'store_shipping_methods') THEN
        SELECT COUNT(*) INTO shipping_count FROM store_shipping_methods;
        RAISE NOTICE 'Shipping Methods: % registros', shipping_count;
    ELSE
        RAISE NOTICE 'Tabela store_shipping_methods não existe';
    END IF;
    
    -- Contar order bumps
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'store_order_bump_configs') THEN
        SELECT COUNT(*) INTO orderbump_count FROM store_order_bump_configs;
        RAISE NOTICE 'Order Bump Configs: % registros', orderbump_count;
    ELSE
        RAISE NOTICE 'Tabela store_order_bump_configs não existe';
    END IF;
    
    -- Contar products
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'products') THEN
        SELECT COUNT(*) INTO product_count FROM products;
        RAISE NOTICE 'Products: % registros', product_count;
    ELSE
        RAISE NOTICE 'Tabela products não existe';
    END IF;
END $$;

-- 8. VERIFICAR RELACIONAMENTOS/FOREIGN KEYS
SELECT
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name IN ('store_payment_methods', 'store_shipping_methods', 'store_order_bump_configs');

-- RESULTADO ESPERADO:
-- Se tudo estiver correto, você deve ver:
-- ✅ store_payment_methods: EXISTS
-- ✅ store_shipping_methods: EXISTS  
-- ✅ store_order_bump_configs: EXISTS
-- ✅ products: EXISTS
-- ✅ stores: EXISTS (ou equivalente como 'store_settings')

-- COLUNAS MÍNIMAS NECESSÁRIAS EM PRODUCTS:
-- - id (UUID)
-- - store_id (UUID) 
-- - name (VARCHAR)
-- - retail_price (DECIMAL)
-- - category (VARCHAR, opcional)
-- - is_active (BOOLEAN)

-- COLUNAS MÍNIMAS NECESSÁRIAS EM STORE_SETTINGS:
-- - store_id (UUID)
-- - checkout_upsell_enabled (BOOLEAN)
-- - urgency_timer_enabled (BOOLEAN)  
-- - social_proof_enabled (BOOLEAN)
-- - trust_badges_enabled (BOOLEAN)
-- - quick_add_enabled (BOOLEAN)
-- - business_hours_display_type (ENUM)




