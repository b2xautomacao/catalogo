-- Migration: Atomic Grade Template and Snapshot RPCs
-- Sprint 10.2: Atomic Snapshot Generation & Non-Destructive Variation Reconciliation
-- Description: Provides transactional PostgreSQL functions for atomic custom template creation and product grade snapshot application.

-- 1. RPC: create_custom_grade_template
-- Cria atômica e transacionalmente o modelo de grade customizado e seus itens vinculados
CREATE OR REPLACE FUNCTION public.create_custom_grade_template(
  p_store_id UUID,
  p_name TEXT,
  p_product_category_type TEXT DEFAULT 'calcado',
  p_items JSONB DEFAULT '[]'::jsonb
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_trimmed_name TEXT;
  v_template_id UUID;
  v_template_record RECORD;
  v_item RECORD;
  v_total_units INTEGER := 0;
  v_items_array JSONB := '[]'::jsonb;
  v_item_count INTEGER;
BEGIN
  -- 1. Validações básicas
  IF p_store_id IS NULL THEN
    RAISE EXCEPTION 'STORE_ID_REQUIRED: store_id é obrigatório para criar modelo de grade da loja.';
  END IF;

  v_trimmed_name := trim(p_name);
  IF v_trimmed_name IS NULL OR v_trimmed_name = '' THEN
    RAISE EXCEPTION 'TEMPLATE_NAME_REQUIRED: Nome do modelo de grade é obrigatório.';
  END IF;

  v_item_count := jsonb_array_length(p_items);
  IF v_item_count IS NULL OR v_item_count = 0 THEN
    RAISE EXCEPTION 'TEMPLATE_ITEMS_REQUIRED: O modelo de grade deve possuir pelo menos um tamanho.';
  END IF;

  -- 2. Checagem de nome duplicado na mesma loja
  IF EXISTS (
    SELECT 1 FROM public.grade_templates 
    WHERE store_id = p_store_id 
      AND is_system = false 
      AND lower(name) = lower(v_trimmed_name)
  ) THEN
    RAISE EXCEPTION 'GRADE_TEMPLATE_ALREADY_EXISTS: Já existe um modelo de grade com o nome "%" nesta loja.', v_trimmed_name;
  END IF;

  -- 3. Inserir cabeçalho do template
  INSERT INTO public.grade_templates (
    store_id,
    name,
    product_category_type,
    is_system,
    is_active
  )
  VALUES (
    p_store_id,
    v_trimmed_name,
    COALESCE(p_product_category_type, 'calcado'),
    false,
    true
  )
  RETURNING * INTO v_template_record;

  v_template_id := v_template_record.id;

  -- 4. Inserir itens vinculados
  FOR v_item IN 
    SELECT 
      (value->>'size')::TEXT AS size,
      (value->>'quantity')::INTEGER AS quantity,
      COALESCE((value->>'position')::INTEGER, ordinality::INTEGER) AS position
    FROM jsonb_array_elements(p_items) WITH ORDINALITY
  LOOP
    IF v_item.size IS NOT NULL AND trim(v_item.size) != '' AND v_item.quantity > 0 THEN
      INSERT INTO public.grade_template_items (
        grade_template_id,
        size,
        quantity,
        position
      )
      VALUES (
        v_template_id,
        trim(v_item.size),
        v_item.quantity,
        v_item.position
      );

      v_total_units := v_total_units + v_item.quantity;
      v_items_array := v_items_array || jsonb_build_object(
        'size', trim(v_item.size),
        'quantity', v_item.quantity,
        'position', v_item.position
      );
    END IF;
  END LOOP;

  -- 5. Retornar payload estruturado
  RETURN jsonb_build_object(
    'id', v_template_record.id,
    'store_id', v_template_record.store_id,
    'name', v_template_record.name,
    'slug', v_template_record.slug,
    'product_category_type', v_template_record.product_category_type,
    'is_system', false,
    'is_active', true,
    'created_at', v_template_record.created_at,
    'updated_at', v_template_record.updated_at,
    'total_units', v_total_units,
    'items', v_items_array
  );
END;
$$;

-- 2. RPC: apply_product_grade_snapshot_rpc
-- Cria de forma atômica e transacional a pack variation, o snapshot de grade e os snapshot items
CREATE OR REPLACE FUNCTION public.apply_product_grade_snapshot_rpc(
  p_store_id UUID,
  p_product_id UUID,
  p_template_id UUID,
  p_name TEXT,
  p_color TEXT,
  p_hex_color TEXT,
  p_sku TEXT,
  p_grade_price NUMERIC DEFAULT NULL,
  p_flexible_grade_config JSONB DEFAULT NULL,
  p_grade_sale_mode TEXT DEFAULT 'full',
  p_items JSONB DEFAULT '[]'::jsonb,
  p_existing_variation_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_prod_store_id UUID;
  v_prod_name TEXT;
  v_variation_id UUID;
  v_snapshot_id UUID;
  v_variation_record RECORD;
  v_snapshot_record RECORD;
  v_item RECORD;
  v_total_units INTEGER := 0;
  v_sizes_array TEXT[] := ARRAY[]::TEXT[];
  v_pairs_array INTEGER[] := ARRAY[]::INTEGER[];
  v_items_json JSONB := '[]'::jsonb;
  v_grade_title TEXT;
  v_variation_title TEXT;
BEGIN
  -- 1. Tenant guard e verificação do produto
  SELECT store_id, name INTO v_prod_store_id, v_prod_name
  FROM public.products
  WHERE id = p_product_id;

  IF v_prod_store_id IS NULL THEN
    RAISE EXCEPTION 'PRODUCT_NOT_FOUND: Produto % não encontrado.', p_product_id;
  END IF;

  IF v_prod_store_id != p_store_id THEN
    RAISE EXCEPTION 'CROSS_TENANT_FORBIDDEN: Produto % não pertence à loja %.', p_product_id, p_store_id;
  END IF;

  v_grade_title := COALESCE(trim(p_name), 'Grade');
  v_variation_title := CASE 
    WHEN p_color IS NOT NULL AND trim(p_color) != '' THEN v_prod_name || ' - ' || trim(p_color) || ' (' || v_grade_title || ')'
    ELSE v_prod_name || ' (' || v_grade_title || ')'
  END;

  -- 2. Processar itens de tamanho e quantidade
  FOR v_item IN 
    SELECT 
      (value->>'size')::TEXT AS size,
      (value->>'quantity')::INTEGER AS quantity,
      COALESCE((value->>'position')::INTEGER, ordinality::INTEGER) AS position
    FROM jsonb_array_elements(p_items) WITH ORDINALITY
    ORDER BY (COALESCE((value->>'position')::INTEGER, ordinality::INTEGER)) ASC
  LOOP
    IF v_item.size IS NOT NULL AND trim(v_item.size) != '' AND v_item.quantity > 0 THEN
      v_sizes_array := array_append(v_sizes_array, trim(v_item.size));
      v_pairs_array := array_append(v_pairs_array, v_item.quantity);
      v_total_units := v_total_units + v_item.quantity;
    END IF;
  END LOOP;

  IF v_total_units = 0 THEN
    RAISE EXCEPTION 'GRADE_ITEMS_REQUIRED: Grade deve possuir pelo menos um tamanho com quantidade maior que zero.';
  END IF;

  -- 3. Inserir ou Atualizar a Pack Variation em product_variations
  IF p_existing_variation_id IS NOT NULL AND EXISTS (SELECT 1 FROM public.product_variations WHERE id = p_existing_variation_id AND product_id = p_product_id) THEN
    -- Preservar ID existente e PRESERVAR ESTOQUE DO BANCO
    UPDATE public.product_variations
    SET
      name = v_variation_title,
      color = p_color,
      hex_color = p_hex_color,
      sku = p_sku,
      is_grade = true,
      grade_name = v_grade_title,
      grade_color = p_color,
      grade_sizes = v_sizes_array,
      grade_pairs = v_pairs_array,
      grade_quantity = v_total_units,
      grade_price = p_grade_price,
      flexible_grade_config = p_flexible_grade_config,
      grade_sale_mode = COALESCE(p_grade_sale_mode, 'full'),
      updated_at = now()
    WHERE id = p_existing_variation_id
    RETURNING * INTO v_variation_record;

    v_variation_id := v_variation_record.id;
  ELSE
    -- Nova Pack Variation: ESTOQUE INICIAL SEMPRE 0
    INSERT INTO public.product_variations (
      product_id,
      name,
      variation_type,
      variation_value,
      color,
      size,
      sku,
      stock,
      price_adjustment,
      is_active,
      hex_color,
      is_grade,
      grade_name,
      grade_color,
      grade_sizes,
      grade_pairs,
      grade_quantity,
      grade_price,
      flexible_grade_config,
      grade_sale_mode
    )
    VALUES (
      p_product_id,
      v_variation_title,
      'grade',
      v_grade_title,
      p_color,
      NULL,
      p_sku,
      0, -- ESTOQUE INICIAL RIGOROSAMENTE ZERO
      0,
      true,
      p_hex_color,
      true,
      v_grade_title,
      p_color,
      v_sizes_array,
      v_pairs_array,
      v_total_units,
      p_grade_price,
      p_flexible_grade_config,
      COALESCE(p_grade_sale_mode, 'full')
    )
    RETURNING * INTO v_variation_record;

    v_variation_id := v_variation_record.id;
  END IF;

  -- 4. Inserir Snapshot Imutável de Grade vinculado à Pack Variation
  INSERT INTO public.product_grade_snapshots (
    store_id,
    product_id,
    template_id,
    pack_variation_id,
    name,
    color,
    total_units
  )
  VALUES (
    p_store_id,
    p_product_id,
    p_template_id,
    v_variation_id,
    v_grade_title,
    p_color,
    v_total_units
  )
  RETURNING * INTO v_snapshot_record;

  v_snapshot_id := v_snapshot_record.id;

  -- 5. Inserir Snapshot Items vinculados
  FOR v_item IN 
    SELECT 
      (value->>'size')::TEXT AS size,
      (value->>'quantity')::INTEGER AS quantity,
      COALESCE((value->>'position')::INTEGER, ordinality::INTEGER) AS position
    FROM jsonb_array_elements(p_items) WITH ORDINALITY
    ORDER BY (COALESCE((value->>'position')::INTEGER, ordinality::INTEGER)) ASC
  LOOP
    IF v_item.size IS NOT NULL AND trim(v_item.size) != '' AND v_item.quantity > 0 THEN
      INSERT INTO public.product_grade_snapshot_items (
        snapshot_id,
        size,
        quantity,
        position,
        variation_id
      )
      VALUES (
        v_snapshot_id,
        trim(v_item.size),
        v_item.quantity,
        v_item.position,
        NULL -- NULL nesta fase conforme Sprint 9.1 / 10.2
      );

      v_items_json := v_items_json || jsonb_build_object(
        'size', trim(v_item.size),
        'quantity', v_item.quantity,
        'position', v_item.position
      );
    END IF;
  END LOOP;

  -- 6. Retornar payload unificado
  RETURN jsonb_build_object(
    'snapshot_id', v_snapshot_id,
    'pack_variation_id', v_variation_id,
    'product_id', p_product_id,
    'store_id', p_store_id,
    'template_id', p_template_id,
    'name', v_grade_title,
    'color', p_color,
    'sku', p_sku,
    'total_units', v_total_units,
    'stock', v_variation_record.stock,
    'items', v_items_json
  );
END;
$$;
