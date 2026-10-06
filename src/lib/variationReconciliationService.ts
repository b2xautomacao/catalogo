import { supabase } from '@/integrations/supabase/client';
import { ProductVariation } from '@/types/product';
import { resolveSnapshotComponentMapping } from './variationMatrixService';

export interface ReconcileOptions {
  storeId?: string;
  uploadImageFn?: (file: File, index: number, productId: string) => Promise<string | null>;
}

export interface ReconcileResult {
  success: boolean;
  variations: ProductVariation[];
  createdCount: number;
  updatedCount: number;
  deactivatedCount: number;
  deletedCount: number;
  error?: string | null;
}

interface ExistingDbVariation {
  id: string;
  product_id: string;
  color: string | null;
  size: string | null;
  material?: string | null;
  sku: string | null;
  stock: number;
  price_adjustment: number;
  is_active: boolean;
  image_url: string | null;
  hex_color: string | null;
  variation_type: string | null;
  name: string | null;
  is_grade: boolean | null;
  grade_name: string | null;
  grade_color: string | null;
  grade_quantity: number | null;
  grade_sizes: string[] | null;
  grade_pairs: number[] | null;
  grade_price: number | null;
  grade_sale_mode: string | null;
  flexible_grade_config: any | null;
  display_order: number | null;
}

/**
 * Compara se a composição de uma grade mudou determinísticamente.
 */
export function isGradeCompositionEqual(
  desired: Partial<ProductVariation>,
  existing: ExistingDbVariation
): boolean {
  if (desired.grade_name !== existing.grade_name) return false;
  if ((desired.color || null) !== (existing.color || null)) return false;
  if ((desired.grade_color || null) !== (existing.grade_color || null)) return false;

  const desiredSizes = desired.grade_sizes || [];
  const existingSizes = existing.grade_sizes || [];
  if (desiredSizes.length !== existingSizes.length) return false;
  for (let i = 0; i < desiredSizes.length; i++) {
    if (desiredSizes[i] !== existingSizes[i]) return false;
  }

  const desiredPairs = desired.grade_pairs || [];
  const existingPairs = existing.grade_pairs || [];
  if (desiredPairs.length !== existingPairs.length) return false;
  for (let i = 0; i < desiredPairs.length; i++) {
    if (Number(desiredPairs[i]) !== Number(existingPairs[i])) return false;
  }

  return true;
}

/**
 * Reconciliador não-destrutivo de variações do produto.
 * Substitui o antigo DELETE all + INSERT all.
 */
export async function reconcileProductVariations(
  productId: string,
  desiredVariations: ProductVariation[],
  options?: ReconcileOptions
): Promise<ReconcileResult> {
  if (!productId || productId.trim() === '') {
    return {
      success: false,
      variations: [],
      createdCount: 0,
      updatedCount: 0,
      deactivatedCount: 0,
      deletedCount: 0,
      error: 'ID do produto é obrigatório para reconciliação.',
    };
  }

  try {
    // 1. Buscar variações existentes no banco de dados
    const { data: existingData, error: fetchError } = await (supabase
      .from('product_variations') as any)
      .select('*')
      .eq('product_id', productId);

    if (fetchError) {
      throw new Error(`Erro ao consultar variações existentes: ${fetchError.message}`);
    }

    const existingList: ExistingDbVariation[] = (existingData || []) as ExistingDbVariation[];
    const existingById = new Map<string, ExistingDbVariation>();
    existingList.forEach((v) => existingById.set(v.id, v));

    // Mapeamento por chave natural (ex: color:size ou grade_name:color)
    const existingByNaturalKey = new Map<string, ExistingDbVariation>();
    existingList.forEach((v) => {
      if (v.is_grade || v.variation_type === 'grade') {
        const key = `grade:${(v.grade_name || '').toLowerCase()}:${(v.color || '').toLowerCase()}:${(v.material || '').toLowerCase()}`;
        existingByNaturalKey.set(key, v);
      } else {
        const key = `simple:${(v.color || '').toLowerCase()}:${(v.size || '').toLowerCase()}`;
        existingByNaturalKey.set(key, v);
      }
      if (v.sku && v.sku.trim() !== '') {
        existingByNaturalKey.set(`sku:${v.sku.trim().toLowerCase()}`, v);
      }
    });

    const finalVariations: ProductVariation[] = [];
    const matchedExistingIds = new Set<string>();

    let createdCount = 0;
    let updatedCount = 0;
    let deactivatedCount = 0;
    let deletedCount = 0;

    // 2. Processar cada variação desejada pelo Wizard
    for (let index = 0; index < desiredVariations.length; index++) {
      const desired = desiredVariations[index];

      // Upload de imagem se houver arquivo pendente
      let imageUrl = desired.image_url;
      if (desired.image_file && options?.uploadImageFn) {
        const uploadedUrl = await options.uploadImageFn(desired.image_file, index, productId);
        if (uploadedUrl) imageUrl = uploadedUrl;
      }

      // Identificar correspondência existente
      let matchedExisting: ExistingDbVariation | undefined;

      // Match 1: UUID válido presente no desired.id
      if (desired.id && !desired.id.startsWith('grade-') && existingById.has(desired.id)) {
        matchedExisting = existingById.get(desired.id);
      }

      // Match 2: Chave natural ou SKU
      if (!matchedExisting) {
        if (desired.sku && desired.sku.trim() !== '') {
          matchedExisting = existingByNaturalKey.get(`sku:${desired.sku.trim().toLowerCase()}`);
        }
      }

      if (!matchedExisting) {
        if (desired.is_grade || desired.variation_type === 'grade') {
          const key = `grade:${(desired.grade_name || '').toLowerCase()}:${(desired.color || '').toLowerCase()}:${(desired.material || '').toLowerCase()}`;
          matchedExisting = existingByNaturalKey.get(key);
        } else {
          const key = `simple:${(desired.color || '').toLowerCase()}:${(desired.size || '').toLowerCase()}`;
          matchedExisting = existingByNaturalKey.get(key);
        }
      }

      const isGrade = Boolean(desired.is_grade || desired.variation_type === 'grade');
      const variationType = isGrade ? 'grade' : (desired.variation_type || 'simple');

      if (matchedExisting) {
        // --- CASO UPDATE / UNCHANGED: Preservar ID existente ---
        matchedExistingIds.add(matchedExisting.id);

        const gradeChanged = isGrade && !isGradeCompositionEqual(desired, matchedExisting);

        // Payload de atualização: NÃO SOBRESCREVE `stock` DO BANCO
        const updatePayload: Record<string, any> = {
          variation_type: variationType,
          variation_value: desired.name || desired.color || desired.size || `Variação ${index + 1}`,
          color: desired.color || null,
          size: isGrade ? null : (desired.size || null),
          sku: desired.sku || null,
          price_adjustment: typeof desired.price_adjustment === 'number' ? desired.price_adjustment : 0,
          is_active: typeof desired.is_active === 'boolean' ? desired.is_active : true,
          image_url: imageUrl || null,
          hex_color: desired.hex_color || null,
          display_order: index,
          name: desired.name || null,
          is_grade: isGrade,
          updated_at: new Date().toISOString(),
        };

        if (isGrade) {
          updatePayload.grade_name = desired.grade_name || null;
          updatePayload.grade_color = desired.grade_color || desired.color || null;
          updatePayload.grade_quantity = typeof desired.grade_quantity === 'number' ? desired.grade_quantity : null;
          updatePayload.grade_sizes = Array.isArray(desired.grade_sizes) ? desired.grade_sizes : null;
          updatePayload.grade_pairs = Array.isArray(desired.grade_pairs) ? desired.grade_pairs : null;
          updatePayload.grade_sale_mode = desired.grade_sale_mode || null;
          updatePayload.flexible_grade_config = desired.flexible_grade_config || null;
          if (typeof desired.grade_price === 'number' && desired.grade_price > 0) {
            updatePayload.grade_price = desired.grade_price;
          }
        }

        const { error: updateErr } = await (supabase
          .from('product_variations') as any)
          .update(updatePayload)
          .eq('id', matchedExisting.id);

        if (updateErr) {
          console.error(`Erro ao atualizar variação ${matchedExisting.id}:`, updateErr);
        }

        // Se for grade e a composição foi explicitamente modificada pelo usuário (Migration-on-Write / Snapshot Update)
        if (isGrade && gradeChanged && options?.storeId) {
          try {
            const rawItems = (desired.grade_sizes || []).map((size, idx) => ({
              size,
              quantity: (desired.grade_pairs || [])[idx] || 1,
              position: idx + 1,
            }));

            // Buscar Unit Variations do produto para mapeamento inequívoco de componentes
            const unitVariations = existingList.filter((v) => !v.is_grade && v.variation_type !== 'grade');
            const mappedComponents = resolveSnapshotComponentMapping(
              rawItems,
              unitVariations,
              desired.color || desired.grade_color || null,
              productId
            );

            // Inserir novo snapshot de grade para a nova composição
            const totalUnits = rawItems.reduce((s, i) => s + i.quantity, 0);
            const { data: snapData } = await (supabase
              .from('product_grade_snapshots') as any)
              .insert({
                store_id: options.storeId,
                product_id: productId,
                template_id: desired.grade_model_id || null,
                pack_variation_id: matchedExisting.id,
                name: desired.grade_name || 'Grade Personalizada',
                color: desired.color || null,
                total_units: totalUnits,
              })
              .select('id')
              .single();

            if (snapData) {
              const snapItems = mappedComponents.map((mc) => ({
                snapshot_id: snapData.id,
                size: mc.size,
                quantity: mc.quantity,
                position: mc.position,
                variation_id: mc.variationId,
              }));
              await (supabase.from('product_grade_snapshot_items') as any).insert(snapItems);
            }
          } catch (snapErr) {
            console.warn('Aviso ao gerar snapshot para grade modificada:', snapErr);
          }
        }

        updatedCount++;
        finalVariations.push({
          ...(desired as ProductVariation),
          id: matchedExisting.id,
          stock: matchedExisting.stock, // Preserva estoque real
          image_url: imageUrl || matchedExisting.image_url || undefined,
        });
      } else {
        // --- CASO CREATE: Inserir nova variação ---
        const isNewGrade = isGrade;
        const initialStock = isNewGrade ? 0 : (typeof desired.stock === 'number' ? desired.stock : 0);

        const insertPayload: Record<string, any> = {
          product_id: productId,
          variation_type: variationType,
          variation_value: desired.name || desired.color || desired.size || `Variação ${index + 1}`,
          color: desired.color || null,
          size: isNewGrade ? null : (desired.size || null),
          sku: desired.sku || null,
          stock: initialStock, // ESTOQUE INICIAL ZERO PARA GRADE
          price_adjustment: typeof desired.price_adjustment === 'number' ? desired.price_adjustment : 0,
          is_active: typeof desired.is_active === 'boolean' ? desired.is_active : true,
          image_url: imageUrl || null,
          hex_color: desired.hex_color || null,
          display_order: index,
          name: desired.name || null,
          is_grade: isNewGrade,
        };

        if (isNewGrade) {
          insertPayload.grade_name = desired.grade_name || null;
          insertPayload.grade_color = desired.grade_color || desired.color || null;
          insertPayload.grade_quantity = typeof desired.grade_quantity === 'number' ? desired.grade_quantity : null;
          insertPayload.grade_sizes = Array.isArray(desired.grade_sizes) ? desired.grade_sizes : null;
          insertPayload.grade_pairs = Array.isArray(desired.grade_pairs) ? desired.grade_pairs : null;
          insertPayload.grade_sale_mode = desired.grade_sale_mode || null;
          insertPayload.flexible_grade_config = desired.flexible_grade_config || null;
          if (typeof desired.grade_price === 'number' && desired.grade_price > 0) {
            insertPayload.grade_price = desired.grade_price;
          }
        }

        const { data: newVar, error: insertErr } = await (supabase
          .from('product_variations') as any)
          .insert(insertPayload)
          .select()
          .single();

        if (insertErr || !newVar) {
          throw new Error(`Erro ao criar nova variação: ${insertErr?.message}`);
        }

        // Se for nova grade, gerar Snapshot Canônico e vincular a pack_variation_id
        if (isNewGrade && options?.storeId) {
           try {
             const rawItems = (desired.grade_sizes || []).map((size, idx) => ({
               size,
               quantity: (desired.grade_pairs || [])[idx] || 1,
               position: idx + 1,
             }));

             // Buscar Unit Variations conhecidas até o momento
             const unitVariations = [...existingList, ...finalVariations].filter(
               (v) => !v.is_grade && v.variation_type !== 'grade'
             );
             const mappedComponents = resolveSnapshotComponentMapping(
               rawItems,
               unitVariations,
               desired.color || desired.grade_color || null,
               productId
             );

             const totalUnits = rawItems.reduce((s, i) => s + i.quantity, 0);

             const { data: snapData, error: snapErr } = await (supabase
               .from('product_grade_snapshots') as any)
               .insert({
                 store_id: options.storeId,
                 product_id: productId,
                 template_id: desired.grade_model_id || null,
                 pack_variation_id: newVar.id,
                 name: desired.grade_name || 'Grade Personalizada',
                 color: desired.color || null,
                 total_units: totalUnits,
               })
               .select('id')
               .single();

             if (!snapErr && snapData) {
               const snapItems = mappedComponents.map((mc) => ({
                 snapshot_id: snapData.id,
                 size: mc.size,
                 quantity: mc.quantity,
                 position: mc.position,
                 variation_id: mc.variationId,
               }));
               await (supabase.from('product_grade_snapshot_items') as any).insert(snapItems);
             }
           } catch (snapErr) {
             console.warn('Aviso ao persistir snapshot de grade:', snapErr);
           }
         }

        createdCount++;
        finalVariations.push({
          ...(desired as ProductVariation),
          id: newVar.id,
          stock: newVar.stock,
          image_url: imageUrl || undefined,
        });
      }
    }

    // 3. Política de Remoção Segura para variações não mais desejadas
    const unreferencedToRemove: string[] = [];

    for (const existing of existingList) {
      if (!matchedExistingIds.has(existing.id)) {
        // Verificar se variação tem referências históricas
        let hasReferences = false;

        // Checar stock_movements
        const { data: stockMovs } = await (supabase
          .from('stock_movements') as any)
          .select('id')
          .eq('variation_id', existing.id)
          .limit(1);

        if (stockMovs && stockMovs.length > 0) {
          hasReferences = true;
        }

        // Checar snapshots como pack variation
        if (!hasReferences) {
          const { data: snaps } = await (supabase
            .from('product_grade_snapshots') as any)
            .select('id')
            .eq('pack_variation_id', existing.id)
            .limit(1);

          if (snaps && snaps.length > 0) {
            hasReferences = true;
          }
        }

        // Checar snapshot items
        if (!hasReferences) {
          const { data: snapItems } = await (supabase
            .from('product_grade_snapshot_items') as any)
            .select('id')
            .eq('variation_id', existing.id)
            .limit(1);

          if (snapItems && snapItems.length > 0) {
            hasReferences = true;
          }
        }

        if (hasReferences) {
          // Desativação suave para preservar integridade histórica do ledger
          await (supabase
            .from('product_variations') as any)
            .update({ is_active: false })
            .eq('id', existing.id);
          deactivatedCount++;
        } else {
          // Exclusão física segura (nenhum histórico ou referência)
          unreferencedToRemove.push(existing.id);
        }
      }
    }

    if (unreferencedToRemove.length > 0) {
      await (supabase
        .from('product_variations') as any)
        .delete()
        .in('id', unreferencedToRemove);
      deletedCount += unreferencedToRemove.length;
    }

    return {
      success: true,
      variations: finalVariations,
      createdCount,
      updatedCount,
      deactivatedCount,
      deletedCount,
      error: null,
    };
  } catch (error: any) {
    console.error('Erro na reconciliação de variações:', error);
    return {
      success: false,
      variations: desiredVariations,
      createdCount: 0,
      updatedCount: 0,
      deactivatedCount: 0,
      deletedCount: 0,
      error: error.message || 'Erro inesperado ao reconciliar variações.',
    };
  }
}
