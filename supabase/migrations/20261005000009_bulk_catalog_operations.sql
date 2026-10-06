-- Migration: Bulk Catalog Operations RPC
-- Sprint 12 Consolidada: Catalog Operations + Intelligence + Remote MCP + Multi-Agent Identity
-- Description: Transactional RPC for safe bulk product updates with strict allowlist, tenant guard, idempotency, and audit logging.

CREATE OR REPLACE FUNCTION public.bulk_update_products(
  p_store_id UUID,
  p_product_ids UUID[],
  p_updates JSONB,
  p_operation_id TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_product_id UUID;
  v_updated_count INTEGER := 0;
  v_failed_count INTEGER := 0;
  v_skipped_count INTEGER := 0;
  v_details JSONB := '[]'::JSONB;
  v_key TEXT;
  v_allowed_keys TEXT[] := ARRAY['is_active', 'category', 'material', 'gender', 'is_featured', 'featured', 'retail_price', 'wholesale_price', 'min_wholesale_qty'];
  v_prohibited_keys TEXT[] := ARRAY['stock', 'reserved_stock', 'grade_composition', 'snapshots', 'variations', 'ledger', 'api_credentials', 'store_id'];
  v_existing_log RECORD;
  v_applied_fields TEXT[] := ARRAY[]::TEXT[];
  v_target_product RECORD;
  v_is_featured_val BOOLEAN;
BEGIN
  -- 1. Validar operation_id
  IF p_operation_id IS NULL OR trim(p_operation_id) = '' THEN
    RAISE EXCEPTION 'INVALID_ARGUMENT: operation_id is required for bulk operations';
  END IF;

  -- 2. Validar Limite de Lote (máximo 100 produtos)
  IF p_product_ids IS NULL OR array_length(p_product_ids, 1) IS NULL OR array_length(p_product_ids, 1) = 0 THEN
    RAISE EXCEPTION 'INVALID_ARGUMENT: product_ids array must not be empty';
  END IF;

  IF array_length(p_product_ids, 1) > 100 THEN
    RAISE EXCEPTION 'LIMIT_EXCEEDED: Maximum 100 products per bulk operation';
  END IF;

  -- 3. Checar Idempotência em agent_audit_log
  SELECT id, event_type, metadata INTO v_existing_log
  FROM public.agent_audit_log
  WHERE store_id = p_store_id 
    AND event_type = 'catalog_bulk_update'
    AND metadata->>'operation_id' = p_operation_id
  LIMIT 1;

  IF v_existing_log.id IS NOT NULL THEN
    RETURN jsonb_build_object(
      'success', true,
      'duplicate', true,
      'operation_id', p_operation_id,
      'updated_count', COALESCE((v_existing_log.metadata->>'updated_count')::INTEGER, 0),
      'message', 'Operation already processed'
    );
  END IF;

  -- 4. Validar Mass Assignment & Strict Allowlist
  IF p_updates IS NULL OR jsonb_typeof(p_updates) != 'object' OR p_updates = '{}'::JSONB THEN
    RAISE EXCEPTION 'INVALID_ARGUMENT: updates object is required and cannot be empty';
  END IF;

  FOR v_key IN SELECT jsonb_object_keys(p_updates)
  LOOP
    -- Rejeição imediata se houver campo proibido
    IF v_key = ANY(v_prohibited_keys) THEN
      RAISE EXCEPTION 'PROHIBITED_BULK_FIELD: Field "%" cannot be modified via bulk operations', v_key;
    END IF;

    -- Rejeição se não pertencer à allowlist
    IF NOT (v_key = ANY(v_allowed_keys)) THEN
      RAISE EXCEPTION 'UNALLOWED_BULK_FIELD: Field "%" is not allowed in bulk operations', v_key;
    END IF;

    v_applied_fields := array_append(v_applied_fields, v_key);
  END LOOP;

  -- 5. Processar Atualizações
  FOREACH v_product_id IN ARRAY p_product_ids
  LOOP
    -- Tenant Guard: Verificar se produto pertence à loja
    SELECT id, store_id INTO v_target_product
    FROM public.products
    WHERE id = v_product_id AND store_id = p_store_id;

    IF v_target_product.id IS NULL THEN
      v_failed_count := v_failed_count + 1;
      v_details := v_details || jsonb_build_object(
        'product_id', v_product_id,
        'status', 'FAILED',
        'error', 'PRODUCT_NOT_FOUND'
      );
      CONTINUE;
    END IF;

    -- Montar update com campos permitidos
    UPDATE public.products
    SET
      is_active = CASE WHEN p_updates ? 'is_active' THEN (p_updates->>'is_active')::BOOLEAN ELSE is_active END,
      category = CASE WHEN p_updates ? 'category' THEN (p_updates->>'category')::TEXT ELSE category END,
      material = CASE WHEN p_updates ? 'material' THEN (p_updates->>'material')::TEXT ELSE material END,
      gender = CASE WHEN p_updates ? 'gender' THEN (p_updates->>'gender')::TEXT ELSE gender END,
      is_featured = CASE 
        WHEN p_updates ? 'is_featured' THEN (p_updates->>'is_featured')::BOOLEAN 
        WHEN p_updates ? 'featured' THEN (p_updates->>'featured')::BOOLEAN
        ELSE is_featured 
      END,
      retail_price = CASE WHEN p_updates ? 'retail_price' THEN (p_updates->>'retail_price')::NUMERIC ELSE retail_price END,
      wholesale_price = CASE WHEN p_updates ? 'wholesale_price' THEN (p_updates->>'wholesale_price')::NUMERIC ELSE wholesale_price END,
      min_wholesale_qty = CASE WHEN p_updates ? 'min_wholesale_qty' THEN (p_updates->>'min_wholesale_qty')::INTEGER ELSE min_wholesale_qty END,
      updated_at = now()
    WHERE id = v_product_id AND store_id = p_store_id;

    v_updated_count := v_updated_count + 1;
    v_details := v_details || jsonb_build_object(
      'product_id', v_product_id,
      'status', 'UPDATED'
    );
  END LOOP;

  -- 6. Registrar Auditoria
  INSERT INTO public.agent_audit_log (
    session_id,
    principal_type,
    principal_id,
    store_id,
    event_type,
    tool_name,
    entity_type,
    metadata
  ) VALUES (
    'system_bulk_rpc',
    'system',
    'bulk_update_rpc',
    p_store_id,
    'catalog_bulk_update',
    'bulk_update_products',
    'product',
    jsonb_build_object(
      'operation_id', p_operation_id,
      'total_requested', array_length(p_product_ids, 1),
      'updated_count', v_updated_count,
      'failed_count', v_failed_count,
      'fields', to_jsonb(v_applied_fields)
    )
  );

  RETURN jsonb_build_object(
    'success', true,
    'duplicate', false,
    'operation_id', p_operation_id,
    'updated_count', v_updated_count,
    'failed_count', v_failed_count,
    'applied_fields', to_jsonb(v_applied_fields),
    'details', v_details
  );
END;
$$;
