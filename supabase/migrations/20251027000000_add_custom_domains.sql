-- Migration: Add Custom Domains Support
-- Data: 27/10/2024
-- Descrição: Adiciona suporte a subdomínios e domínios próprios para catálogos

-- ===============================================
-- 1. ADICIONAR CAMPOS DE DOMÍNIO CUSTOMIZADO
-- ===============================================

-- Adicionar campos para domínios na tabela store_settings
ALTER TABLE store_settings 
ADD COLUMN IF NOT EXISTS subdomain_enabled boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS subdomain text,
ADD COLUMN IF NOT EXISTS custom_domain text,
ADD COLUMN IF NOT EXISTS custom_domain_enabled boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS custom_domain_verified boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS custom_domain_verification_token text,
ADD COLUMN IF NOT EXISTS custom_domain_verified_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS domain_mode text DEFAULT 'slug' CHECK (domain_mode IN ('slug', 'subdomain', 'custom_domain')),
ADD COLUMN IF NOT EXISTS ssl_cert_status text DEFAULT 'pending' CHECK (ssl_cert_status IN ('pending', 'active', 'failed'));

-- ===============================================
-- 2. CONSTRAINTS E ÍNDICES
-- ===============================================

-- Criar índice único para subdomínio (case insensitive)
CREATE UNIQUE INDEX IF NOT EXISTS idx_store_settings_subdomain_unique 
ON store_settings (LOWER(subdomain)) 
WHERE subdomain IS NOT NULL AND subdomain_enabled = true;

-- Criar índice único para domínio customizado
CREATE UNIQUE INDEX IF NOT EXISTS idx_store_settings_custom_domain_unique 
ON store_settings (LOWER(custom_domain)) 
WHERE custom_domain IS NOT NULL AND custom_domain_enabled = true;

-- Índice para busca por domínio mode
CREATE INDEX IF NOT EXISTS idx_store_settings_domain_mode 
ON store_settings (domain_mode);

-- Índice para busca por subdomínio habilitado
CREATE INDEX IF NOT EXISTS idx_store_settings_subdomain_enabled 
ON store_settings (subdomain_enabled, subdomain) 
WHERE subdomain_enabled = true;

-- Índice para busca por domínio próprio verificado
CREATE INDEX IF NOT EXISTS idx_store_settings_custom_domain_verified 
ON store_settings (custom_domain_enabled, custom_domain_verified, custom_domain) 
WHERE custom_domain_enabled = true AND custom_domain_verified = true;

-- ===============================================
-- 3. COMMENTS E DOCUMENTAÇÃO
-- ===============================================

COMMENT ON COLUMN store_settings.subdomain_enabled IS 'Habilitar acesso via subdomínio (ex: loja.aoseudispor.com.br)';
COMMENT ON COLUMN store_settings.subdomain IS 'Subdomínio escolhido pela loja (ex: "mirazzi" para mirazzi.aoseudispor.com.br)';
COMMENT ON COLUMN store_settings.custom_domain IS 'Domínio próprio da loja (ex: www.mirazzi.com.br)';
COMMENT ON COLUMN store_settings.custom_domain_enabled IS 'Habilitar acesso via domínio próprio';
COMMENT ON COLUMN store_settings.custom_domain_verified IS 'Domínio próprio foi verificado via DNS TXT record';
COMMENT ON COLUMN store_settings.custom_domain_verification_token IS 'Token único para verificação DNS do domínio';
COMMENT ON COLUMN store_settings.custom_domain_verified_at IS 'Data e hora da verificação do domínio';
COMMENT ON COLUMN store_settings.domain_mode IS 'Modo de acesso principal: slug (padrão), subdomain ou custom_domain';
COMMENT ON COLUMN store_settings.ssl_cert_status IS 'Status do certificado SSL: pending, active ou failed';

-- ===============================================
-- 4. FUNÇÕES AUXILIARES
-- ===============================================

-- Função para validar formato de subdomínio
CREATE OR REPLACE FUNCTION validate_subdomain(subdomain_input text)
RETURNS boolean AS $$
BEGIN
    -- Verifica se o subdomínio é válido (apenas letras, números e hífen)
    -- Não pode começar ou terminar com hífen
    -- Deve ter entre 3 e 30 caracteres
    RETURN subdomain_input ~ '^[a-z0-9]([a-z0-9-]*[a-z0-9])?$' 
           AND LENGTH(subdomain_input) BETWEEN 3 AND 30;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Função para validar formato de domínio
CREATE OR REPLACE FUNCTION validate_custom_domain(domain_input text)
RETURNS boolean AS $$
BEGIN
    -- Verifica se o domínio tem formato válido
    -- Deve conter pelo menos um ponto
    -- Não pode começar ou terminar com ponto ou hífen
    RETURN domain_input ~ '^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?)*$'
           AND LENGTH(domain_input) BETWEEN 4 AND 253
           AND domain_input LIKE '%.%';
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ===============================================
-- 5. TRIGGERS DE VALIDAÇÃO
-- ===============================================

-- Trigger para validar subdomínio antes de inserir/atualizar
CREATE OR REPLACE FUNCTION trigger_validate_subdomain()
RETURNS TRIGGER AS $$
BEGIN
    -- Validar subdomínio se estiver sendo habilitado
    IF NEW.subdomain_enabled = true AND NEW.subdomain IS NOT NULL THEN
        -- Converter para minúsculo
        NEW.subdomain := LOWER(NEW.subdomain);
        
        -- Validar formato
        IF NOT validate_subdomain(NEW.subdomain) THEN
            RAISE EXCEPTION 'Subdomínio inválido. Use apenas letras, números e hífen. Deve ter entre 3-30 caracteres.';
        END IF;
        
        -- Verificar se não é reservado
        IF NEW.subdomain IN ('www', 'app', 'api', 'admin', 'mail', 'ftp', 'ssh', 'ssl', 'blog', 'shop', 'store') THEN
            RAISE EXCEPTION 'Subdomínio reservado. Escolha outro nome.';
        END IF;
    END IF;
    
    -- Validar domínio customizado se estiver sendo habilitado
    IF NEW.custom_domain_enabled = true AND NEW.custom_domain IS NOT NULL THEN
        -- Converter para minúsculo
        NEW.custom_domain := LOWER(NEW.custom_domain);
        
        -- Validar formato
        IF NOT validate_custom_domain(NEW.custom_domain) THEN
            RAISE EXCEPTION 'Domínio inválido. Use formato válido como www.exemplo.com.br';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger
DROP TRIGGER IF EXISTS trigger_validate_domains ON store_settings;
CREATE TRIGGER trigger_validate_domains
    BEFORE INSERT OR UPDATE ON store_settings
    FOR EACH ROW
    WHEN (NEW.subdomain_enabled = true OR NEW.custom_domain_enabled = true)
    EXECUTE FUNCTION trigger_validate_subdomain();

-- ===============================================
-- 6. POLICIES DE SEGURANÇA (RLS)
-- ===============================================

-- Policy para leitura pública de domínios verificados (necessário para roteamento)
CREATE POLICY IF NOT EXISTS "Allow public read for verified domains" ON store_settings
    FOR SELECT
    USING (
        (subdomain_enabled = true AND subdomain IS NOT NULL)
        OR 
        (custom_domain_enabled = true AND custom_domain_verified = true AND custom_domain IS NOT NULL)
    );

-- ===============================================
-- 7. DADOS DE EXEMPLO/TESTE (OPCIONAL)
-- ===============================================

-- Comentado para produção - descomente se precisar de dados de teste
/*
-- Exemplo: Habilitar subdomínio para uma loja de teste
UPDATE store_settings 
SET subdomain_enabled = true,
    subdomain = 'lojateste',
    domain_mode = 'subdomain'
WHERE store_id = 'sua-loja-id-aqui';
*/

-- ===============================================
-- FIM DA MIGRATION
-- ===============================================

-- Log de sucesso
DO $$
BEGIN
    RAISE NOTICE 'Migration 20251027000000_add_custom_domains.sql executada com sucesso!';
    RAISE NOTICE 'Campos adicionados: subdomain_enabled, subdomain, custom_domain, custom_domain_enabled, custom_domain_verified, custom_domain_verification_token, custom_domain_verified_at, domain_mode, ssl_cert_status';
    RAISE NOTICE 'Índices criados para performance e unicidade';
    RAISE NOTICE 'Funções de validação e triggers criados';
    RAISE NOTICE 'Policies RLS configuradas para segurança';
END $$;