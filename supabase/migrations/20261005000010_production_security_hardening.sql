-- Migration: Production Security Hardening & RPC Search Path Configuration
-- Sprint 13 Consolidada: Production Security + Observability + Release Candidate
-- Description: Enforces explicit search_path on all SECURITY DEFINER functions to eliminate search_path hijacking risks.

-- 1. Hardening apply_stock_adjustment
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc p 
    JOIN pg_namespace n ON p.pronamespace = n.oid 
    WHERE n.nspname = 'public' AND p.proname = 'apply_stock_adjustment'
  ) THEN
    EXECUTE 'ALTER FUNCTION public.apply_stock_adjustment(UUID, UUID, UUID, TEXT, INTEGER, INTEGER, TEXT, TEXT, TEXT, TEXT) SET search_path = public, pg_temp';
  END IF;
END $$;

-- 2. Hardening create_custom_grade_template
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc p 
    JOIN pg_namespace n ON p.pronamespace = n.oid 
    WHERE n.nspname = 'public' AND p.proname = 'create_custom_grade_template'
  ) THEN
    EXECUTE 'ALTER FUNCTION public.create_custom_grade_template(UUID, TEXT, TEXT, JSONB) SET search_path = public, pg_temp';
  END IF;
END $$;

-- 3. Hardening apply_product_grade_snapshot_rpc
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc p 
    JOIN pg_namespace n ON p.pronamespace = n.oid 
    WHERE n.nspname = 'public' AND p.proname = 'apply_product_grade_snapshot_rpc'
  ) THEN
    EXECUTE 'ALTER FUNCTION public.apply_product_grade_snapshot_rpc(UUID, UUID, UUID, TEXT, TEXT, TEXT, TEXT, NUMERIC, JSONB, TEXT, JSONB, UUID) SET search_path = public, pg_temp';
  END IF;
END $$;

-- 4. Hardening bulk_update_products
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc p 
    JOIN pg_namespace n ON p.pronamespace = n.oid 
    WHERE n.nspname = 'public' AND p.proname = 'bulk_update_products'
  ) THEN
    EXECUTE 'ALTER FUNCTION public.bulk_update_products(UUID, UUID[], JSONB, TEXT) SET search_path = public, pg_temp';
  END IF;
END $$;
