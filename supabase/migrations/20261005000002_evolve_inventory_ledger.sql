-- Migration: Evolve Inventory Ledger Foundations
-- Sprint 7: Product Commerce & Grade Domain Audit -> Inventory Ledger
-- Description: Additive evolution of public.stock_movements with variation_id, unit_kind, idempotency, reason_code, source tracking, parent_movement_id, and cross-entity consistency triggers.

-- 1. Adicionar variation_id (nullable, FK para product_variations)
ALTER TABLE public.stock_movements 
ADD COLUMN IF NOT EXISTS variation_id UUID REFERENCES public.product_variations(id) ON DELETE SET NULL;

-- 2. Adicionar unit_kind (unit = unidade física vendável, pack = caixa/grade fechada)
ALTER TABLE public.stock_movements 
ADD COLUMN IF NOT EXISTS unit_kind TEXT NOT NULL DEFAULT 'unit';

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'stock_movements_unit_kind_check'
  ) THEN
    ALTER TABLE public.stock_movements 
    ADD CONSTRAINT stock_movements_unit_kind_check 
    CHECK (unit_kind IN ('unit', 'pack'));
  END IF;
END $$;

-- 3. Adicionar physical_quantity (quantidade física real representada, ex: 1 pack de 13 pares = 13 pares físicos)
ALTER TABLE public.stock_movements 
ADD COLUMN IF NOT EXISTS physical_quantity INTEGER;

-- 4. Adicionar idempotency_key (para garantir idempotência de chamadas contra duplicidade)
ALTER TABLE public.stock_movements 
ADD COLUMN IF NOT EXISTS idempotency_key TEXT;

-- 5. Adicionar reason_code estruturado
ALTER TABLE public.stock_movements 
ADD COLUMN IF NOT EXISTS reason_code TEXT;

-- 6. Adicionar source_type e source_id
ALTER TABLE public.stock_movements 
ADD COLUMN IF NOT EXISTS source_type TEXT NOT NULL DEFAULT 'system';

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'stock_movements_source_type_check'
  ) THEN
    ALTER TABLE public.stock_movements 
    ADD CONSTRAINT stock_movements_source_type_check 
    CHECK (source_type IN ('order', 'manual_adjustment', 'return', 'reservation', 'release', 'agent', 'system', 'import'));
  END IF;
END $$;

ALTER TABLE public.stock_movements 
ADD COLUMN IF NOT EXISTS source_id TEXT;

-- 7. Adicionar parent_movement_id (hierarquia de movimentos pack -> children)
ALTER TABLE public.stock_movements 
ADD COLUMN IF NOT EXISTS parent_movement_id UUID REFERENCES public.stock_movements(id) ON DELETE SET NULL;

-- 8. Índices otimizados para consultas, concorrência e idempotência
CREATE INDEX IF NOT EXISTS idx_stock_movements_store_product 
ON public.stock_movements(store_id, product_id);

CREATE INDEX IF NOT EXISTS idx_stock_movements_store_variation 
ON public.stock_movements(store_id, variation_id);

CREATE INDEX IF NOT EXISTS idx_stock_movements_parent_movement 
ON public.stock_movements(parent_movement_id);

CREATE INDEX IF NOT EXISTS idx_stock_movements_created_at 
ON public.stock_movements(created_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS idx_stock_movements_store_idempotency 
ON public.stock_movements(store_id, idempotency_key) 
WHERE idempotency_key IS NOT NULL;

-- 9. Trigger de validação de consistência entre Store, Product e Variation
CREATE OR REPLACE FUNCTION public.validate_stock_movement_consistency()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_prod_store_id UUID;
  v_var_prod_id UUID;
BEGIN
  -- Validar se o produto pertence à mesma loja informada
  SELECT store_id INTO v_prod_store_id 
  FROM public.products 
  WHERE id = NEW.product_id;

  IF v_prod_store_id IS NULL THEN
    RAISE EXCEPTION 'Produto % não existe', NEW.product_id;
  END IF;

  IF v_prod_store_id != NEW.store_id THEN
    RAISE EXCEPTION 'Produto % não pertence à loja % (inconsistência cross-tenant)', NEW.product_id, NEW.store_id;
  END IF;

  -- Se variation_id foi informado, validar se pertence ao mesmo produto
  IF NEW.variation_id IS NOT NULL THEN
    SELECT product_id INTO v_var_prod_id
    FROM public.product_variations
    WHERE id = NEW.variation_id;

    IF v_var_prod_id IS NULL THEN
      RAISE EXCEPTION 'Variação % não existe', NEW.variation_id;
    END IF;

    IF v_var_prod_id != NEW.product_id THEN
      RAISE EXCEPTION 'Variação % não pertence ao produto %', NEW.variation_id, NEW.product_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_stock_movement_consistency ON public.stock_movements;
CREATE TRIGGER trg_validate_stock_movement_consistency
BEFORE INSERT OR UPDATE ON public.stock_movements
FOR EACH ROW
EXECUTE FUNCTION public.validate_stock_movement_consistency();
