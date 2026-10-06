-- Migration: Fix Grade Snapshot ↔ Variation Relationship
-- Sprint 9.1: Grade Snapshot ↔ Variation Relation Hardening
-- Description: Establishes explicit 1:1 relation between Product Grade Snapshot and Pack Variation (pack_variation_id),
-- and ensures snapshot_items.variation_id is reserved strictly for future unit variations (NULL for now).

-- 1. Adicionar pack_variation_id em product_grade_snapshots
ALTER TABLE public.product_grade_snapshots 
ADD COLUMN IF NOT EXISTS pack_variation_id UUID NULL REFERENCES public.product_variations(id) ON DELETE SET NULL;

-- 2. Índice único para garantir que cada pack variation tenha no máximo 1 snapshot ativo associado
CREATE UNIQUE INDEX IF NOT EXISTS idx_product_grade_snapshots_pack_variation_id 
ON public.product_grade_snapshots(pack_variation_id) 
WHERE pack_variation_id IS NOT NULL;

-- 3. Backfill seguro para eventuais registros de homologação criados na Sprint 9
DO $$
DECLARE
  v_migrated_snapshots INTEGER := 0;
  v_cleaned_items INTEGER := 0;
BEGIN
  -- 3.1. Migrar ponteiro da pack variation para o snapshot
  WITH updated_snaps AS (
    UPDATE public.product_grade_snapshots s
    SET pack_variation_id = sub.variation_id
    FROM (
      SELECT si.snapshot_id, si.variation_id
      FROM public.product_grade_snapshot_items si
      JOIN public.product_variations v ON v.id = si.variation_id
      WHERE v.is_grade = true
      GROUP BY si.snapshot_id, si.variation_id
    ) sub
    WHERE s.id = sub.snapshot_id AND s.pack_variation_id IS NULL
    RETURNING s.id
  )
  SELECT count(*) INTO v_migrated_snapshots FROM updated_snaps;

  -- 3.2. Limpar variation_id nos itens do snapshot onde apontava incorretamente para pack variation
  WITH cleaned AS (
    UPDATE public.product_grade_snapshot_items si
    SET variation_id = NULL
    FROM public.product_variations v
    WHERE si.variation_id = v.id AND v.is_grade = true
    RETURNING si.id
  )
  SELECT count(*) INTO v_cleaned_items FROM cleaned;

  RAISE NOTICE 'Sprint 9.1 Backfill executado: % snapshots atualizados com pack_variation_id, % itens limpos (variation_id = NULL)', v_migrated_snapshots, v_cleaned_items;
END;
$$;

-- 4. Trigger de integridade: Impede que snapshot_items.variation_id aponte para variações do tipo pack (is_grade = true)
CREATE OR REPLACE FUNCTION public.validate_snapshot_item_variation()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_is_grade BOOLEAN;
BEGIN
  IF NEW.variation_id IS NOT NULL THEN
    SELECT is_grade INTO v_is_grade
    FROM public.product_variations
    WHERE id = NEW.variation_id;

    IF v_is_grade IS TRUE THEN
      RAISE EXCEPTION 'INVALID_SNAPSHOT_ITEM_RELATION: snapshot_items.variation_id must point to a unit variation, never a pack/grade variation';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_snapshot_item_variation ON public.product_grade_snapshot_items;
CREATE TRIGGER trg_validate_snapshot_item_variation
BEFORE INSERT OR UPDATE ON public.product_grade_snapshot_items
FOR EACH ROW
EXECUTE FUNCTION public.validate_snapshot_item_variation();
