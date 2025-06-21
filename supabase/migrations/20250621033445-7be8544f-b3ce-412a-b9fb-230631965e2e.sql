
-- Adicionar campo para configurar o modo de exibição dos catálogos
ALTER TABLE public.store_settings 
ADD COLUMN catalog_mode text DEFAULT 'separated' CHECK (catalog_mode IN ('separated', 'hybrid', 'toggle'));

-- Comentário para documentar as opções:
-- 'separated': Catálogos separados (atual) - Links distintos para varejo e atacado
-- 'hybrid': Híbrido - Preços mudam automaticamente baseado na quantidade
-- 'toggle': Toggle - Usuario pode alternar entre modos no mesmo catálogo
