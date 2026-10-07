-- Migration: Tenant MCP Hub RLS Policies
-- Sprint IA: Tenant MCP Hub (Docs + Credenciais + AI Guide + Activity)
-- Description: Enables store owners and admins to manage api_credentials and view agent_audit_log for their own store.

-- 1. Policies for public.api_credentials
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'api_credentials' 
        AND policyname = 'Store owners and admins can view api_credentials of their store'
    ) THEN
        CREATE POLICY "Store owners and admins can view api_credentials of their store"
            ON public.api_credentials
            FOR SELECT
            TO authenticated
            USING (
                store_id IS NOT NULL AND (
                    EXISTS (
                        SELECT 1 FROM public.stores s
                        WHERE s.id = api_credentials.store_id
                        AND (
                            s.owner_id = auth.uid()
                            OR EXISTS (
                                SELECT 1 FROM public.profiles prof
                                WHERE prof.id = auth.uid()
                                AND prof.store_id = s.id
                            )
                        )
                    )
                )
            );
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'api_credentials' 
        AND policyname = 'Store owners and admins can create api_credentials for their store'
    ) THEN
        CREATE POLICY "Store owners and admins can create api_credentials for their store"
            ON public.api_credentials
            FOR INSERT
            TO authenticated
            WITH CHECK (
                store_id IS NOT NULL AND (
                    EXISTS (
                        SELECT 1 FROM public.stores s
                        WHERE s.id = api_credentials.store_id
                        AND (
                            s.owner_id = auth.uid()
                            OR EXISTS (
                                SELECT 1 FROM public.profiles prof
                                WHERE prof.id = auth.uid()
                                AND prof.store_id = s.id
                            )
                        )
                    )
                )
            );
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'api_credentials' 
        AND policyname = 'Store owners and admins can update api_credentials of their store'
    ) THEN
        CREATE POLICY "Store owners and admins can update api_credentials of their store"
            ON public.api_credentials
            FOR UPDATE
            TO authenticated
            USING (
                store_id IS NOT NULL AND (
                    EXISTS (
                        SELECT 1 FROM public.stores s
                        WHERE s.id = api_credentials.store_id
                        AND (
                            s.owner_id = auth.uid()
                            OR EXISTS (
                                SELECT 1 FROM public.profiles prof
                                WHERE prof.id = auth.uid()
                                AND prof.store_id = s.id
                            )
                        )
                    )
                )
            )
            WITH CHECK (
                store_id IS NOT NULL AND (
                    EXISTS (
                        SELECT 1 FROM public.stores s
                        WHERE s.id = api_credentials.store_id
                        AND (
                            s.owner_id = auth.uid()
                            OR EXISTS (
                                SELECT 1 FROM public.profiles prof
                                WHERE prof.id = auth.uid()
                                AND prof.store_id = s.id
                            )
                        )
                    )
                )
            );
    END IF;
END $$;

-- 2. Policy for public.agent_audit_log
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'agent_audit_log' 
        AND policyname = 'Store owners and admins can view agent_audit_log of their store'
    ) THEN
        CREATE POLICY "Store owners and admins can view agent_audit_log of their store"
            ON public.agent_audit_log
            FOR SELECT
            TO authenticated
            USING (
                store_id IS NOT NULL AND (
                    EXISTS (
                        SELECT 1 FROM public.stores s
                        WHERE s.id = agent_audit_log.store_id
                        AND (
                            s.owner_id = auth.uid()
                            OR EXISTS (
                                SELECT 1 FROM public.profiles prof
                                WHERE prof.id = auth.uid()
                                AND prof.store_id = s.id
                            )
                        )
                    )
                )
            );
    END IF;
END $$;
