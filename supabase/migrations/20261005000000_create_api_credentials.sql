-- Migration: Create api_credentials table for Agent/MCP Auth
-- Sprint 2: Authenticated Multi-Tenant Runtime + API Keys

CREATE TABLE IF NOT EXISTS public.api_credentials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key_prefix TEXT NOT NULL UNIQUE,
    key_hash TEXT NOT NULL,
    principal_type TEXT NOT NULL CHECK (principal_type IN ('tenant', 'user', 'superadmin')),
    principal_id UUID,
    store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE,
    scopes TEXT[] NOT NULL DEFAULT '{catalog:read}',
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at TIMESTAMPTZ,
    revoked_at TIMESTAMPTZ,
    last_used_at TIMESTAMPTZ
);

-- Indices
CREATE INDEX IF NOT EXISTS idx_api_credentials_key_prefix ON public.api_credentials (key_prefix);
CREATE INDEX IF NOT EXISTS idx_api_credentials_store_id ON public.api_credentials (store_id);
CREATE INDEX IF NOT EXISTS idx_api_credentials_principal_type ON public.api_credentials (principal_type);

-- Enable Row Level Security
ALTER TABLE public.api_credentials ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Superadmins can manage API credentials
CREATE POLICY "Superadmins can manage api_credentials"
    ON public.api_credentials
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'superadmin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'superadmin'
        )
    );
