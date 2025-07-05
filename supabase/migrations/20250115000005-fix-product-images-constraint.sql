-- Corrigir constraint da tabela product_images para permitir até 10 imagens
-- Primeiro, remover a constraint antiga
ALTER TABLE public.product_images DROP CONSTRAINT IF EXISTS product_images_image_order_check;

-- Adicionar nova constraint que permite até 10 imagens
ALTER TABLE public.product_images ADD CONSTRAINT product_images_image_order_check 
CHECK (image_order BETWEEN 1 AND 10);

-- Verificar se a correção foi aplicada
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'public.product_images'::regclass 
  AND conname = 'product_images_image_order_check'; 