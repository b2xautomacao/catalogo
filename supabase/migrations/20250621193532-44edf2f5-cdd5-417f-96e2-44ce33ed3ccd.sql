
-- Adicionar novas colunas para configurações de layout avançado
ALTER TABLE public.store_settings 
ADD COLUMN font_family text DEFAULT 'Inter, system-ui, sans-serif',
ADD COLUMN layout_spacing integer DEFAULT 16,
ADD COLUMN border_radius integer DEFAULT 8;
