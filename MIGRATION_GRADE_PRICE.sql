-- ============================================================
-- MIGRATION: Adicionar coluna grade_price em product_variations
-- 
-- CONTEXTO:
--   grade_price = preço FIXO da grade inteira.
--   Diferente de price_adjustment (que é relativo ao preço base do produto),
--   grade_price é absoluto e independente de retail_price ou wholesale_price.
--   Isso resolve o problema de preço zero em catálogos atacado-only com grades.
--
-- COMO EXECUTAR:
--   Cole este SQL no editor SQL do Supabase Dashboard e execute.
-- ============================================================

-- 1. Adicionar coluna grade_price na tabela product_variations
ALTER TABLE product_variations
  ADD COLUMN IF NOT EXISTS grade_price NUMERIC(12, 2) DEFAULT NULL;

-- 2. Comentário na coluna para documentação
COMMENT ON COLUMN product_variations.grade_price IS 
  'Preço fixo da grade inteira (ex: R$430,00 por grade completa). '
  'Independente do número de pares e do retail_price/wholesale_price do produto. '
  'Usado como fonte primária de preço no cartHelpers para grades em catálogos atacado-only.';

-- 3. (Opcional) Migrar dados legados: se retail_price=0 e wholesale_price>0,
--    tentar popular grade_price com base em price_adjustment + wholesale_price.
--    Isso cobre variações de grade que foram salvas antes dessa migration.
UPDATE product_variations pv
SET grade_price = (
  SELECT COALESCE(p.wholesale_price, 0) + COALESCE(pv.price_adjustment, 0)
  FROM products p
  WHERE p.id = pv.product_id
    AND p.retail_price = 0
    AND p.wholesale_price > 0
)
WHERE pv.is_grade = true
  AND pv.grade_price IS NULL
  AND EXISTS (
    SELECT 1 FROM products p
    WHERE p.id = pv.product_id
      AND p.retail_price = 0
      AND p.wholesale_price > 0
  );

-- 4. Verificação
SELECT 
  pv.id,
  pv.grade_name,
  pv.grade_price,
  pv.price_adjustment,
  p.retail_price,
  p.wholesale_price
FROM product_variations pv
JOIN products p ON p.id = pv.product_id
WHERE pv.is_grade = true
ORDER BY pv.created_at DESC
LIMIT 20;
