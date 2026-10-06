-- Migration: Grade Templates & Product Grade Snapshots
-- Sprint 9: Normalized Grade Templates & Product Grade Snapshots

-- 1. Tabela grade_templates
CREATE TABLE IF NOT EXISTS public.grade_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NULL,
  product_category_type TEXT NULL DEFAULT 'calcado',
  is_system BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Unique index for store custom templates (store_id, name)
CREATE UNIQUE INDEX IF NOT EXISTS idx_grade_templates_store_name 
ON public.grade_templates(store_id, lower(name)) 
WHERE is_system IS FALSE AND store_id IS NOT NULL;

-- Unique index for system templates (name)
CREATE UNIQUE INDEX IF NOT EXISTS idx_grade_templates_system_name 
ON public.grade_templates(lower(name)) 
WHERE is_system IS TRUE;

-- 2. Tabela grade_template_items
CREATE TABLE IF NOT EXISTS public.grade_template_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  grade_template_id UUID NOT NULL REFERENCES public.grade_templates(id) ON DELETE CASCADE,
  size TEXT NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_grade_template_items_size UNIQUE (grade_template_id, size)
);

-- 3. Tabela product_grade_snapshots
CREATE TABLE IF NOT EXISTS public.product_grade_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  template_id UUID NULL REFERENCES public.grade_templates(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  color TEXT NULL,
  color_ref UUID NULL,
  total_units INTEGER NOT NULL CHECK (total_units > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Tabela product_grade_snapshot_items
CREATE TABLE IF NOT EXISTS public.product_grade_snapshot_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_id UUID NOT NULL REFERENCES public.product_grade_snapshots(id) ON DELETE CASCADE,
  size TEXT NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  position INTEGER NOT NULL DEFAULT 0,
  variation_id UUID NULL REFERENCES public.product_variations(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_product_grade_snapshot_items_size UNIQUE (snapshot_id, size)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_grade_templates_store_id ON public.grade_templates(store_id);
CREATE INDEX IF NOT EXISTS idx_grade_templates_is_system ON public.grade_templates(is_system);
CREATE INDEX IF NOT EXISTS idx_grade_template_items_template_id ON public.grade_template_items(grade_template_id);
CREATE INDEX IF NOT EXISTS idx_product_grade_snapshots_product_id ON public.product_grade_snapshots(product_id);
CREATE INDEX IF NOT EXISTS idx_product_grade_snapshots_store_id ON public.product_grade_snapshots(store_id);
CREATE INDEX IF NOT EXISTS idx_product_grade_snapshot_items_snapshot_id ON public.product_grade_snapshot_items(snapshot_id);
CREATE INDEX IF NOT EXISTS idx_product_grade_snapshot_items_variation_id ON public.product_grade_snapshot_items(variation_id);

-- RLS
ALTER TABLE public.grade_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grade_template_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_grade_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_grade_snapshot_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for grade_templates
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'grade_templates' AND policyname = 'grade_templates_select') THEN
    CREATE POLICY "grade_templates_select"
    ON public.grade_templates FOR SELECT
    USING (
      is_system = true 
      OR store_id IN (SELECT id FROM public.stores WHERE owner_id = auth.uid())
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'grade_templates' AND policyname = 'grade_templates_insert') THEN
    CREATE POLICY "grade_templates_insert"
    ON public.grade_templates FOR INSERT
    WITH CHECK (
      is_system = false AND store_id IN (SELECT id FROM public.stores WHERE owner_id = auth.uid())
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'grade_templates' AND policyname = 'grade_templates_update') THEN
    CREATE POLICY "grade_templates_update"
    ON public.grade_templates FOR UPDATE
    USING (
      is_system = false AND store_id IN (SELECT id FROM public.stores WHERE owner_id = auth.uid())
    );
  END IF;
END;
$$;

-- RLS Policies for grade_template_items
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'grade_template_items' AND policyname = 'grade_template_items_select') THEN
    CREATE POLICY "grade_template_items_select"
    ON public.grade_template_items FOR SELECT
    USING (
      EXISTS (
        SELECT 1 FROM public.grade_templates t
        WHERE t.id = grade_template_id
          AND (t.is_system = true OR t.store_id IN (SELECT id FROM public.stores WHERE owner_id = auth.uid()))
      )
    );
  END IF;
END;
$$;

-- RLS Policies for product_grade_snapshots
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'product_grade_snapshots' AND policyname = 'product_grade_snapshots_select') THEN
    CREATE POLICY "product_grade_snapshots_select"
    ON public.product_grade_snapshots FOR SELECT
    USING (
      store_id IN (SELECT id FROM public.stores WHERE owner_id = auth.uid())
    );
  END IF;
END;
$$;

-- RLS Policies for product_grade_snapshot_items
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'product_grade_snapshot_items' AND policyname = 'product_grade_snapshot_items_select') THEN
    CREATE POLICY "product_grade_snapshot_items_select"
    ON public.product_grade_snapshot_items FOR SELECT
    USING (
      EXISTS (
        SELECT 1 FROM public.product_grade_snapshots s
        WHERE s.id = snapshot_id
          AND s.store_id IN (SELECT id FROM public.stores WHERE owner_id = auth.uid())
      )
    );
  END IF;
END;
$$;

-- Seed Canonical System Templates (Idempotente)
DO $$
DECLARE
  v_alta_id UUID;
  v_baixa_id UUID;
BEGIN
  -- 1. Grade Alta (13 pares)
  SELECT id INTO v_alta_id FROM public.grade_templates WHERE is_system = true AND lower(name) = 'grade alta' LIMIT 1;
  IF v_alta_id IS NULL THEN
    INSERT INTO public.grade_templates (name, slug, product_category_type, is_system, is_active)
    VALUES ('Grade Alta', 'grade-alta', 'calcado', true, true)
    RETURNING id INTO v_alta_id;

    INSERT INTO public.grade_template_items (grade_template_id, size, quantity, position) VALUES
      (v_alta_id, '36', 1, 1),
      (v_alta_id, '37', 2, 2),
      (v_alta_id, '38', 2, 3),
      (v_alta_id, '39', 3, 4),
      (v_alta_id, '40', 2, 5),
      (v_alta_id, '41', 2, 6),
      (v_alta_id, '42', 1, 7)
    ON CONFLICT (grade_template_id, size) DO NOTHING;
  END IF;

  -- 2. Grade Baixa (8 pares)
  SELECT id INTO v_baixa_id FROM public.grade_templates WHERE is_system = true AND lower(name) = 'grade baixa' LIMIT 1;
  IF v_baixa_id IS NULL THEN
    INSERT INTO public.grade_templates (name, slug, product_category_type, is_system, is_active)
    VALUES ('Grade Baixa', 'grade-baixa', 'calcado', true, true)
    RETURNING id INTO v_baixa_id;

    INSERT INTO public.grade_template_items (grade_template_id, size, quantity, position) VALUES
      (v_baixa_id, '35', 1, 1),
      (v_baixa_id, '36', 2, 2),
      (v_baixa_id, '37', 2, 3),
      (v_baixa_id, '38', 2, 4),
      (v_baixa_id, '39', 1, 5)
    ON CONFLICT (grade_template_id, size) DO NOTHING;
  END IF;
END;
$$;
