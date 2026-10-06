-- Migration: Create agent_audit_log for AI/MCP audit trail
-- Sprint 3: Store Resolution + Active Store Selection

CREATE TABLE IF NOT EXISTS public.agent_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id TEXT NOT NULL,
    principal_type TEXT NOT NULL,
    principal_id TEXT NOT NULL,
    store_id UUID REFERENCES public.stores(id) ON DELETE SET NULL,
    event_type TEXT NOT NULL,
    tool_name TEXT,
    entity_type TEXT,
    entity_id TEXT,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indices for rapid audit querying
CREATE INDEX IF NOT EXISTS idx_agent_audit_log_session_id ON public.agent_audit_log (session_id);
CREATE INDEX IF NOT EXISTS idx_agent_audit_log_store_id ON public.agent_audit_log (store_id);
CREATE INDEX IF NOT EXISTS idx_agent_audit_log_principal_id ON public.agent_audit_log (principal_id);
CREATE INDEX IF NOT EXISTS idx_agent_audit_log_event_type ON public.agent_audit_log (event_type);
CREATE INDEX IF NOT EXISTS idx_agent_audit_log_created_at ON public.agent_audit_log (created_at DESC);

-- Enable RLS
ALTER TABLE public.agent_audit_log ENABLE ROW LEVEL SECURITY;

-- RLS: Superadmins can view audit logs
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'agent_audit_log' 
        AND policyname = 'Superadmins can view agent_audit_log'
    ) THEN
        CREATE POLICY "Superadmins can view agent_audit_log"
            ON public.agent_audit_log
            FOR SELECT
            TO authenticated
            USING (
                EXISTS (
                    SELECT 1 FROM public.profiles
                    WHERE profiles.id = auth.uid()
                    AND profiles.role = 'superadmin'
                )
            );
    END IF;
END
$$;
