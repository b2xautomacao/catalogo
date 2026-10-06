-- Migration: Variation Matrix, Grade Component Trace Movements & Grade Lifecycle
-- Sprint 11 Consolidada: Product Domain Completion
-- Description: Adds grade snapshot lifecycle columns, child composition trace in stock_movements without loose stock double-counting, and safe snapshot replacement.

-- 1. Colunas de Ciclo de Vida em product_grade_snapshots
ALTER TABLE public.product_grade_snapshots
ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS replaced_by_snapshot_id UUID REFERENCES public.product_grade_snapshots(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS replaced_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Criar índice para busca eficiente de snapshot ativo por pack_variation_id
CREATE INDEX IF NOT EXISTS idx_product_grade_snapshots_active_pack
ON public.product_grade_snapshots (pack_variation_id, is_active);

-- 2. Atualizar RPC apply_stock_adjustment para gerar Child Composition Trace
CREATE OR REPLACE FUNCTION public.apply_stock_adjustment(
  p_store_id UUID,
  p_product_id UUID,
  p_variation_id UUID DEFAULT NULL,
  p_operation TEXT DEFAULT 'increase',
  p_quantity INTEGER DEFAULT NULL,
  p_counted_quantity INTEGER DEFAULT NULL,
  p_reason_code TEXT DEFAULT 'inventory_count',
  p_idempotency_key TEXT DEFAULT NULL,
  p_source_type TEXT DEFAULT 'agent',
  p_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_product RECORD;
  v_variation RECORD;
  v_existing_movement RECORD;
  v_current_stock INTEGER;
  v_delta INTEGER;
  v_new_stock INTEGER;
  v_unit_kind TEXT := 'unit';
  v_pairs_per_pack INTEGER := 1;
  v_movement_id UUID;
  v_physical_quantity INTEGER;
  v_movement_qty INTEGER;
  v_final_product_stock INTEGER;
  v_elem JSONB;
  v_req_qty INTEGER;
  v_snapshot RECORD;
  v_item RECORD;
  v_child_qty INTEGER;
  v_children_count INTEGER := 0;
BEGIN
  -- Validar se operation_id / idempotency_key foi fornecida
  IF p_idempotency_key IS NULL OR trim(p_idempotency_key) = '' THEN
    RAISE EXCEPTION 'INVALID_ARGUMENT: operation_id is required';
  END IF;

  -- 1. Checar Idempotência (store-scoped) e Detectar Conflito
  SELECT * INTO v_existing_movement
  FROM public.stock_movements
  WHERE store_id = p_store_id AND idempotency_key = p_idempotency_key
  LIMIT 1;

  IF v_existing_movement.id IS NOT NULL THEN
    IF p_operation = 'count' THEN
      v_req_qty := p_counted_quantity;
    ELSE
      v_req_qty := p_quantity;
    END IF;

    IF v_existing_movement.product_id != p_product_id OR
       COALESCE(v_existing_movement.variation_id, '00000000-0000-0000-0000-000000000000'::UUID) != COALESCE(p_variation_id, '00000000-0000-0000-0000-000000000000'::UUID) OR
       v_existing_movement.reason_code != p_reason_code OR
       (p_operation != 'count' AND v_existing_movement.quantity != v_req_qty)
    THEN
      RAISE EXCEPTION 'IDEMPOTENCY_CONFLICT: An operation with operation_id % already exists with different payload', p_idempotency_key;
    END IF;

    IF v_existing_movement.variation_id IS NOT NULL THEN
      SELECT stock INTO v_current_stock FROM public.product_variations WHERE id = v_existing_movement.variation_id;
    ELSE
      SELECT stock INTO v_current_stock FROM public.products WHERE id = v_existing_movement.product_id;
    END IF;

    SELECT stock INTO v_final_product_stock FROM public.products WHERE id = v_existing_movement.product_id;

    RETURN jsonb_build_object(
      'applied', false,
      'duplicate', true,
      'movement_id', v_existing_movement.id,
      'product_id', v_existing_movement.product_id,
      'variation_id', v_existing_movement.variation_id,
      'unit_kind', v_existing_movement.unit_kind,
      'operation', p_operation,
      'delta', v_existing_movement.new_stock - v_existing_movement.previous_stock,
      'quantity', v_existing_movement.quantity,
      'physical_quantity', COALESCE(v_existing_movement.physical_quantity, v_existing_movement.quantity),
      'previous_stock', v_existing_movement.previous_stock,
      'current_stock', COALESCE(v_current_stock, v_existing_movement.new_stock),
      'product_stock', v_final_product_stock
    );
  END IF;

  -- 2. Validar Produto e Tenant Guard
  SELECT id, store_id, name, stock, allow_negative_stock
  INTO v_product
  FROM public.products
  WHERE id = p_product_id AND store_id = p_store_id;

  IF v_product.id IS NULL THEN
    RAISE EXCEPTION 'INVENTORY_TARGET_NOT_FOUND';
  END IF;

  -- 3. Validar Variação se informada
  IF p_variation_id IS NOT NULL THEN
    SELECT id, product_id, sku, color, size, is_grade, grade_pairs, stock
    INTO v_variation
    FROM public.product_variations
    WHERE id = p_variation_id AND product_id = p_product_id;

    IF v_variation.id IS NULL THEN
      RAISE EXCEPTION 'INVENTORY_TARGET_NOT_FOUND';
    END IF;

    v_current_stock := COALESCE(v_variation.stock, 0);

    IF v_variation.is_grade IS TRUE THEN
      v_unit_kind := 'pack';
      IF v_variation.grade_pairs IS NOT NULL AND jsonb_typeof(v_variation.grade_pairs) = 'array' THEN
        v_pairs_per_pack := 0;
        FOR v_elem IN SELECT * FROM jsonb_array_elements(v_variation.grade_pairs)
        LOOP
          v_pairs_per_pack := v_pairs_per_pack + COALESCE((v_elem #>> '{}')::INTEGER, 0);
        END LOOP;
        IF v_pairs_per_pack <= 0 THEN
          v_pairs_per_pack := 1;
        END IF;
      ELSE
        v_pairs_per_pack := 1;
      END IF;
    ELSE
      v_unit_kind := 'unit';
      v_pairs_per_pack := 1;
    END IF;
  ELSE
    v_current_stock := COALESCE(v_product.stock, 0);
    v_unit_kind := 'unit';
    v_pairs_per_pack := 1;
  END IF;

  -- 4. Validar e Calcular Delta conforme Operação
  IF p_operation = 'increase' THEN
    IF p_quantity IS NULL OR p_quantity <= 0 THEN
      RAISE EXCEPTION 'INVALID_STOCK_OPERATION: Quantity must be positive for increase';
    END IF;
    v_delta := p_quantity;
    v_new_stock := v_current_stock + v_delta;
    v_movement_qty := p_quantity;
  ELSIF p_operation = 'decrease' THEN
    IF p_quantity IS NULL OR p_quantity <= 0 THEN
      RAISE EXCEPTION 'INVALID_STOCK_OPERATION: Quantity must be positive for decrease';
    END IF;
    v_delta := -p_quantity;
    v_new_stock := v_current_stock + v_delta;
    v_movement_qty := p_quantity;
  ELSIF p_operation = 'count' THEN
    IF p_counted_quantity IS NULL OR p_counted_quantity < 0 THEN
      RAISE EXCEPTION 'INVALID_STOCK_OPERATION: Counted quantity must be non-negative';
    END IF;
    v_delta := p_counted_quantity - v_current_stock;
    v_new_stock := p_counted_quantity;
    v_movement_qty := ABS(v_delta);
  ELSE
    RAISE EXCEPTION 'INVALID_STOCK_OPERATION: Unknown operation %', p_operation;
  END IF;

  -- 5. Validar Estoque Negativo
  IF v_new_stock < 0 AND v_product.allow_negative_stock IS NOT TRUE THEN
    RAISE EXCEPTION 'INSUFFICIENT_STOCK';
  END IF;

  -- 6. Calcular Equivalência Física
  IF v_unit_kind = 'pack' THEN
    v_physical_quantity := v_movement_qty * v_pairs_per_pack;
  ELSE
    v_physical_quantity := v_movement_qty;
  END IF;

  -- 7. Inserir Movimentação Parent no Ledger (stock_movements)
  INSERT INTO public.stock_movements (
    store_id,
    product_id,
    variation_id,
    movement_type,
    unit_kind,
    quantity,
    physical_quantity,
    previous_stock,
    new_stock,
    idempotency_key,
    reason_code,
    source_type,
    notes
  ) VALUES (
    p_store_id,
    p_product_id,
    p_variation_id,
    'adjustment',
    v_unit_kind,
    v_movement_qty,
    v_physical_quantity,
    v_current_stock,
    v_new_stock,
    p_idempotency_key,
    p_reason_code,
    COALESCE(p_source_type, 'agent'),
    p_notes
  ) RETURNING id INTO v_movement_id;

  -- 8. Gerar Child Composition Movements para Pack Variations (Decomposição Física sem alteração de saldo loose)
  IF v_unit_kind = 'pack' AND v_movement_qty > 0 THEN
    -- Localizar snapshot ativo para a pack variation
    SELECT id INTO v_snapshot
    FROM public.product_grade_snapshots
    WHERE pack_variation_id = p_variation_id AND is_active = true
    ORDER BY created_at DESC
    LIMIT 1;

    IF v_snapshot.id IS NOT NULL THEN
      FOR v_item IN
        SELECT size, quantity, variation_id
        FROM public.product_grade_snapshot_items
        WHERE snapshot_id = v_snapshot.id
        ORDER BY position ASC
      LOOP
        v_child_qty := v_movement_qty * v_item.quantity;

        INSERT INTO public.stock_movements (
          store_id,
          product_id,
          variation_id,
          parent_movement_id,
          movement_type,
          unit_kind,
          quantity,
          physical_quantity,
          previous_stock,
          new_stock,
          reason_code,
          source_type,
          notes
        ) VALUES (
          p_store_id,
          p_product_id,
          v_item.variation_id, -- Pode ser NULL se Unit Variation não estiver cadastrada
          v_movement_id,
          'adjustment',
          'unit',
          v_child_qty,
          v_child_qty,
          NULL, -- Saldo loose não é mutado
          NULL, -- Saldo loose não é mutado
          'grade_component_trace',
          COALESCE(p_source_type, 'agent'),
          'Decomposição física de ' || v_movement_qty || ' caixa(s): ' || v_item.size || ' (' || v_child_qty || ' pares)'
        );

        v_children_count := v_children_count + 1;
      END LOOP;
    END IF;
  END IF;

  -- 9. Atualizar Caches Operacionais e Recalcular Estoque Físico Agregado
  IF p_variation_id IS NOT NULL THEN
    UPDATE public.product_variations
    SET stock = v_new_stock, updated_at = now()
    WHERE id = p_variation_id;

    -- Recalcular agregado do produto pai usando a função física canônica
    v_final_product_stock := public.calculate_product_physical_stock(p_product_id);

    UPDATE public.products
    SET stock = v_final_product_stock, updated_at = now()
    WHERE id = p_product_id;
  ELSE
    UPDATE public.products
    SET stock = v_new_stock, updated_at = now()
    WHERE id = p_product_id
    RETURNING stock INTO v_final_product_stock;
  END IF;

  RETURN jsonb_build_object(
    'applied', true,
    'duplicate', false,
    'movement_id', v_movement_id,
    'product_id', p_product_id,
    'variation_id', p_variation_id,
    'unit_kind', v_unit_kind,
    'operation', p_operation,
    'delta', v_delta,
    'quantity', v_movement_qty,
    'physical_quantity', v_physical_quantity,
    'previous_stock', v_current_stock,
    'current_stock', v_new_stock,
    'product_stock', v_final_product_stock,
    'child_movements_count', v_children_count
  );
END;
$$;
