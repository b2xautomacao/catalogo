-- Adicionar campo business_hours_display_type à tabela store_settings
-- Esta migração adiciona a configuração para escolher entre exibição resumida ou detalhada dos horários de funcionamento no footer

ALTER TABLE store_settings 
ADD COLUMN IF NOT EXISTS business_hours_display_type TEXT 
CHECK (business_hours_display_type IN ('summary', 'detailed')) 
DEFAULT 'summary';

-- Comentário explicativo sobre o campo
COMMENT ON COLUMN store_settings.business_hours_display_type IS 
'Tipo de exibição dos horários de funcionamento no footer: summary (resumido) ou detailed (detalhado com destaque do dia atual)';

-- Criar índice para otimização (opcional, mas útil para consultas frequentes)
CREATE INDEX IF NOT EXISTS idx_store_settings_business_hours_display_type 
ON store_settings(business_hours_display_type);



