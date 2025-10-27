-- Migration: Add Custom Domains and Subdomains Support
-- Created: 2025-10-27 00:00:00
-- Description: Permite subdomínios wildcard e domínios próprios para catálogos

ALTER TABLE store_settings
-- Subdomínio
ADD COLUMN IF NOT EXISTS subdomain_enabled boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS subdomain text DEFAULT NULL UNIQUE,

-- Domínio Próprio
ADD COLUMN IF NOT EXISTS custom_domain text DEFAULT NULL UNIQUE,
ADD COLUMN IF NOT EXISTS custom_domain_enabled boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS custom_domain_verified boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS custom_domain_verification_token text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS custom_domain_verified_at timestamp with time zone DEFAULT NULL,

-- Configuração
ADD COLUMN IF NOT EXISTS domain_mode text DEFAULT 'slug' CHECK (domain_mode IN ('slug', 'subdomain', 'custom_domain')),
ADD COLUMN IF NOT EXISTS ssl_cert_status text DEFAULT 'pending' CHECK (ssl_cert_status IN ('pending', 'active', 'failed'));

-- Comentários
COMMENT ON COLUMN store_settings.subdomain_enabled IS 'Habilitar acesso via subdomínio (ex: mirazzi.aoseudispor.com.br)';
COMMENT ON COLUMN store_settings.subdomain IS 'Subdomínio escolhido (único, case insensitive)';
COMMENT ON COLUMN store_settings.custom_domain IS 'Domínio próprio (ex: www.mirazzi.com.br)';
COMMENT ON COLUMN store_settings.custom_domain_enabled IS 'Habilitar acesso via domínio próprio';
COMMENT ON COLUMN store_settings.custom_domain_verified IS 'Domínio próprio foi verificado via DNS';
COMMENT ON COLUMN store_settings.custom_domain_verification_token IS 'Token único para validação DNS (registro TXT)';
COMMENT ON COLUMN store_settings.custom_domain_verified_at IS 'Data da verificação do domínio';
COMMENT ON COLUMN store_settings.domain_mode IS 'Modo de acesso preferido: slug (padrão), subdomain ou custom_domain';
COMMENT ON COLUMN store_settings.ssl_cert_status IS 'Status do certificado SSL: pending, active ou failed';

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_store_settings_subdomain ON store_settings(LOWER(subdomain)) WHERE subdomain IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_store_settings_custom_domain ON store_settings(LOWER(custom_domain)) WHERE custom_domain IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_store_settings_domain_mode ON store_settings(domain_mode);

-- Constraint para garantir subdomínio válido (apenas letras, números e hífen)
ALTER TABLE store_settings
ADD CONSTRAINT subdomain_format CHECK (
  subdomain IS NULL OR 
  subdomain ~ '^[a-z0-9-]+$'
);

-- Atualizar registros existentes
UPDATE store_settings
SET 
  subdomain_enabled = COALESCE(subdomain_enabled, false),
  custom_domain_enabled = COALESCE(custom_domain_enabled, false),
  custom_domain_verified = COALESCE(custom_domain_verified, false),
  domain_mode = COALESCE(domain_mode, 'slug'),
  ssl_cert_status = COALESCE(ssl_cert_status, 'pending')
WHERE subdomain_enabled IS NULL 
   OR domain_mode IS NULL;

