-- SQL para corrigir produtos com retail_price = 0
-- Este script atualiza todos os produtos onde retail_price é 0 para usar o valor de wholesale_price

-- 1. Verificar quantos produtos serão afetados
SELECT 
    COUNT(*) as produtos_afetados,
    SUM(CASE WHEN wholesale_price > 0 THEN 1 ELSE 0 END) as produtos_com_wholesale_price,
    SUM(CASE WHEN wholesale_price = 0 OR wholesale_price IS NULL THEN 1 ELSE 0 END) as produtos_sem_wholesale_price
FROM products 
WHERE retail_price = 0;

-- 2. Mostrar alguns exemplos dos produtos que serão atualizados
SELECT 
    id,
    name,
    retail_price,
    wholesale_price,
    'SERÁ ATUALIZADO' as status
FROM products 
WHERE retail_price = 0 AND wholesale_price > 0
LIMIT 10;

-- 3. Executar a atualização
-- ATENÇÃO: Execute este comando apenas se os resultados acima estiverem corretos
UPDATE products 
SET retail_price = wholesale_price
WHERE retail_price = 0 
  AND wholesale_price > 0;

-- 4. Verificar o resultado da atualização
SELECT 
    COUNT(*) as produtos_atualizados
FROM products 
WHERE retail_price > 0 AND retail_price = wholesale_price;

-- 5. Verificar se ainda existem produtos com retail_price = 0
SELECT 
    COUNT(*) as produtos_ainda_com_retail_zero
FROM products 
WHERE retail_price = 0;

-- 6. Mostrar produtos que ainda têm retail_price = 0 (se houver)
SELECT 
    id,
    name,
    retail_price,
    wholesale_price,
    'AINDA PRECISA ATENÇÃO' as status
FROM products 
WHERE retail_price = 0
LIMIT 10;


