-- Migration: Adicionar campo hex_color na tabela product_variations
-- Data: 2026-03-23
-- Motivo: Permitir que as cores personalizadas cadastradas no wizard premium
--         sejam salvas e exibidas corretamente na página de produto.

ALTER TABLE public.product_variations
ADD COLUMN IF NOT EXISTS hex_color TEXT;

COMMENT ON COLUMN public.product_variations.hex_color IS 
  'Código hexadecimal da cor personalizada cadastrada pela loja (ex: #DAA520). '
  'Quando preenchido, é usado diretamente na exibição do produto no catálogo, '
  'tendo prioridade sobre o mapeamento de cores por nome.';

-- Índice para consultas futuras de cores
CREATE INDEX IF NOT EXISTS idx_product_variations_hex_color 
ON public.product_variations(hex_color) 
WHERE hex_color IS NOT NULL;
