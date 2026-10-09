import { supabase } from '../lib/supabase.js';
import { Product, DetailedProduct, ListProductsFilters, SafeProductResult } from '../domain/types.js';

export class ProductRepository {
  async listProducts(storeId: string, filters: ListProductsFilters): Promise<Product[]> {
    let query = supabase
      .from('products')
      .select('id, name, sku, retail_price, wholesale_price, stock, is_active')
      .eq('store_id', storeId); // TENANT GUARD

    if (filters.nome) {
      query = query.ilike('name', `%${filters.nome}%`);
    }

    if (filters.sku) {
      query = query.eq('sku', filters.sku);
    }

    if (filters.ativo !== undefined) {
      query = query.eq('is_active', filters.ativo);
    }

    query = query.order('created_at', { ascending: false });

    // Pagination
    query = query.range(filters.offset, filters.offset + filters.limit - 1);

    const { data, error } = await query;

    if (error) {
      throw new Error(`Error listing products: ${error.message}`);
    }

    return (data as any[]) || [];
  }

  async getProductById(storeId: string, id: string): Promise<DetailedProduct | null> {
    const { data: productData, error: productError } = await supabase
      .from('products')
      .select('id, name, sku, retail_price, wholesale_price, stock, is_active')
      .eq('id', id)
      .eq('store_id', storeId) // TENANT GUARD
      .maybeSingle();

    if (productError || !productData) {
      return null;
    }

    // Fetch related images
    const { data: imagesData } = await supabase
      .from('product_images')
      .select('id, image_url, image_order, is_primary')
      .eq('product_id', id)
      .order('image_order', { ascending: true });

    // Fetch related variations
    const { data: variationsData } = await supabase
      .from('product_variations')
      .select('id, name, sku, color, size, stock, price_adjustment')
      .eq('product_id', id);

    return {
      ...productData,
      images: (imagesData as any[]) || [],
      variations: (variationsData as any[]) || [],
    };
  }

  async checkSkuExists(storeId: string, sku: string, excludeProductId?: string): Promise<boolean> {
    let query = supabase
      .from('products')
      .select('id')
      .eq('store_id', storeId) // TENANT GUARD
      .eq('sku', sku);

    if (excludeProductId) {
      query = query.neq('id', excludeProductId);
    }

    const { data, error } = await query;

    if (error || !data) {
      return false;
    }

    return data.length > 0;
  }

  async checkSlugExists(storeId: string, slug: string, excludeProductId?: string): Promise<boolean> {
    let query = supabase
      .from('products')
      .select('id')
      .eq('store_id', storeId) // TENANT GUARD
      .eq('seo_slug', slug);

    if (excludeProductId) {
      query = query.neq('id', excludeProductId);
    }

    const { data, error } = await query;

    if (error || !data) {
      return false;
    }

    return data.length > 0;
  }

  async createProduct(storeId: string, payload: Record<string, any>): Promise<SafeProductResult> {
    const insertData = {
      ...payload,
      store_id: storeId, // TENANT GUARD (injected)
    };

    const { data, error } = await supabase
      .from('products')
      .insert(insertData)
      .select('id, name, sku, description, category, category_id, retail_price, wholesale_price, min_wholesale_qty, material, product_gender, product_category_type, seo_slug, meta_title, meta_description, is_active')
      .single();

    if (error || !data) {
      throw new Error(`Failed to create product: ${error?.message || 'Unknown database error'}`);
    }

    return data as SafeProductResult;
  }

  async updateProduct(
    storeId: string,
    productId: string,
    payload: Record<string, any>
  ): Promise<SafeProductResult | null> {
    const { data, error } = await supabase
      .from('products')
      .update(payload)
      .eq('id', productId)
      .eq('store_id', storeId) // DUAL TENANT GUARD (WHERE id = id AND store_id = storeId)
      .select('id, name, sku, description, category, retail_price, wholesale_price, is_active')
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to update product: ${error.message}`);
    }

    if (!data) {
      return null;
    }

    return data as SafeProductResult;
  }

  async deactivateProduct(
    storeId: string,
    productId: string
  ): Promise<SafeProductResult | null> {
    const { data, error } = await supabase
      .from('products')
      .update({ is_active: false })
      .eq('id', productId)
      .eq('store_id', storeId) // DUAL TENANT GUARD (WHERE id = id AND store_id = storeId)
      .select('id, name, sku, description, category, retail_price, wholesale_price, is_active')
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to deactivate product: ${error.message}`);
    }

    if (!data) {
      return null;
    }

    return data as SafeProductResult;
  }

  async bulkUpdateProducts(
    storeId: string,
    productIds: string[],
    updates: Record<string, any>,
    operationId: string
  ): Promise<any> {
    const { data, error } = await supabase.rpc('bulk_update_products', {
      p_store_id: storeId,
      p_product_ids: productIds,
      p_updates: updates,
      p_operation_id: operationId,
    });

    if (error) {
      throw new Error(`Failed to bulk update products: ${error.message}`);
    }

    return data;
  }

  async searchCatalog(
    storeId: string,
    input: any
  ): Promise<any> {
    let query = supabase
      .from('products')
      .select(`
        id,
        name,
        description,
        sku,
        category,
        category_id,
        material,
        product_gender,
        product_category_type,
        retail_price,
        wholesale_price,
        min_wholesale_qty,
        stock,
        is_active,
        is_featured,
        stock_alert_threshold,
        product_images ( id, image_url, is_primary ),
        product_variations ( id, name, sku, color, size, stock, is_grade ),
        product_grade_snapshots ( id, name, product_grade_snapshot_items ( size, quantity ) )
      `)
      .eq('store_id', storeId);

    if (input.is_active !== undefined) {
      query = query.eq('is_active', input.is_active);
    }
    if (input.is_featured !== undefined) {
      query = query.eq('is_featured', input.is_featured);
    }
    if (input.category) {
      query = query.ilike('category', input.category);
    }
    if (input.product_gender) {
      query = query.eq('product_gender', input.product_gender);
    }
    if (input.material) {
      query = query.ilike('material', `%${input.material}%`);
    }
    if (input.min_price !== undefined) {
      query = query.gte('retail_price', input.min_price);
    }
    if (input.max_price !== undefined) {
      query = query.lte('retail_price', input.max_price);
    }

    const { data, error } = await query;
    if (error) {
      throw new Error(`Failed to search catalog: ${error.message}`);
    }

    return data || [];
  }

  async checkHealth(storeId?: string | null): Promise<boolean> {
    let query = supabase.from('stores').select('id').limit(1);

    if (storeId) {
      query = query.eq('id', storeId);
    }

    const { error } = await query;
    return !error;
  }

  async reconcileVariations(
    storeId: string,
    input: {
      productId: string;
      variationMode?: string;
      variations: Array<{
        id?: string;
        sku?: string;
        color?: string | null;
        size?: string | null;
        price_adjustment?: number;
        is_active?: boolean;
        hex_color?: string | null;
        display_order?: number;
        image_url?: string | null;
      }>;
      operationId: string;
    }
  ): Promise<any> {
    // 1. Tenant Guard: Validar existência do produto na loja ativa
    const { data: product, error: prodErr } = await supabase
      .from('products')
      .select('id, store_id, name')
      .eq('id', input.productId)
      .eq('store_id', storeId)
      .maybeSingle();

    if (prodErr || !product) {
      throw new Error(`Produto ${input.productId} não encontrado na loja ativa`);
    }

    // 2. Buscar variações existentes do produto
    const { data: existingData, error: fetchErr } = await supabase
      .from('product_variations')
      .select('*')
      .eq('product_id', input.productId);

    if (fetchErr) {
      throw new Error(`Erro ao buscar variações existentes: ${fetchErr.message}`);
    }

    const existingList = existingData || [];
    // Separar apenas Unit Variations (is_grade = false ou null) - Pack variations NUNCA são destruídas por essa operação!
    const existingUnitVars = existingList.filter((v: any) => !v.is_grade);

    const existingById = new Map<string, any>();
    const existingBySku = new Map<string, any>();
    const existingByNaturalKey = new Map<string, any>();

    for (const v of existingUnitVars) {
      existingById.set(v.id, v);
      if (v.sku && v.sku.trim()) {
        existingBySku.set(v.sku.trim().toLowerCase(), v);
      }
      const natKey = `simple:${(v.color || '').trim().toLowerCase()}:${(v.size || '').trim().toLowerCase()}`;
      existingByNaturalKey.set(natKey, v);
    }

    const matchedIds = new Set<string>();
    const results: any[] = [];
    let createdCount = 0;
    let updatedCount = 0;
    let unchangedCount = 0;
    let deactivatedCount = 0;

    // 3. Processar cada variação desejada
    for (let i = 0; i < input.variations.length; i++) {
      const desired = input.variations[i];

      // Tentar match por ID, SKU ou Chave Natural
      let matched: any = undefined;
      if (desired.id && existingById.has(desired.id)) {
        matched = existingById.get(desired.id);
      } else if (desired.sku && desired.sku.trim() && existingBySku.has(desired.sku.trim().toLowerCase())) {
        matched = existingBySku.get(desired.sku.trim().toLowerCase());
      } else {
        const natKey = `simple:${(desired.color || '').trim().toLowerCase()}:${(desired.size || '').trim().toLowerCase()}`;
        matched = existingByNaturalKey.get(natKey);
      }

      const variationName = desired.color && desired.size
        ? `${product.name} - ${desired.color} / ${desired.size}`
        : desired.size
        ? `${product.name} - Tam ${desired.size}`
        : desired.color
        ? `${product.name} - ${desired.color}`
        : `${product.name} - Variação ${i + 1}`;

      if (matched) {
        matchedIds.add(matched.id);

        // Checar se houve alterações
        const isSkuChanged = desired.sku !== undefined && (desired.sku || null) !== (matched.sku || null);
        const isColorChanged = desired.color !== undefined && (desired.color || null) !== (matched.color || null);
        const isSizeChanged = desired.size !== undefined && (desired.size || null) !== (matched.size || null);
        const isPriceAdjChanged = desired.price_adjustment !== undefined && Number(desired.price_adjustment) !== Number(matched.price_adjustment || 0);
        const isActiveChanged = desired.is_active !== undefined && Boolean(desired.is_active) !== Boolean(matched.is_active);
        const isHexChanged = desired.hex_color !== undefined && (desired.hex_color || null) !== (matched.hex_color || null);
        const isImageChanged = desired.image_url !== undefined && (desired.image_url || null) !== (matched.image_url || null);

        const hasChanged = isSkuChanged || isColorChanged || isSizeChanged || isPriceAdjChanged || isActiveChanged || isHexChanged || isImageChanged;

        if (hasChanged) {
          const updatePayload: Record<string, any> = {
            name: variationName,
            updated_at: new Date().toISOString(),
          };
          if (desired.sku !== undefined) updatePayload.sku = desired.sku || null;
          if (desired.color !== undefined) updatePayload.color = desired.color || null;
          if (desired.size !== undefined) updatePayload.size = desired.size || null;
          if (desired.price_adjustment !== undefined) updatePayload.price_adjustment = desired.price_adjustment;
          if (desired.is_active !== undefined) updatePayload.is_active = desired.is_active;
          if (desired.hex_color !== undefined) updatePayload.hex_color = desired.hex_color || null;
          if (desired.image_url !== undefined) updatePayload.image_url = desired.image_url || null;
          if (desired.display_order !== undefined) updatePayload.display_order = desired.display_order;

          // NUNCA ALTERA STOCK!
          const { error: updErr } = await supabase
            .from('product_variations')
            .update(updatePayload)
            .eq('id', matched.id);

          if (updErr) {
            throw new Error(`Erro ao atualizar variação ${matched.id}: ${updErr.message}`);
          }

          updatedCount++;
          results.push({
            id: matched.id,
            product_id: input.productId,
            sku: desired.sku !== undefined ? desired.sku : matched.sku,
            color: desired.color !== undefined ? desired.color : matched.color,
            size: desired.size !== undefined ? desired.size : matched.size,
            stock: matched.stock ?? 0,
            is_grade: false,
            is_active: desired.is_active !== undefined ? desired.is_active : matched.is_active,
            action: 'updated',
          });
        } else {
          unchangedCount++;
          results.push({
            id: matched.id,
            product_id: input.productId,
            sku: matched.sku,
            color: matched.color,
            size: matched.size,
            stock: matched.stock ?? 0,
            is_grade: false,
            is_active: matched.is_active,
            action: 'unchanged',
          });
        }
      } else {
        // Criar nova variação
        const insertPayload: Record<string, any> = {
          product_id: input.productId,
          variation_type: 'simple',
          name: variationName,
          sku: desired.sku || null,
          color: desired.color || null,
          size: desired.size || null,
          stock: 0, // ESTOQUE INICIAL SEMPRE ZERO NO MODELO LEDGER
          is_grade: false,
          price_adjustment: desired.price_adjustment ?? 0,
          is_active: desired.is_active ?? true,
          hex_color: desired.hex_color || null,
          image_url: desired.image_url || null,
          display_order: desired.display_order ?? i,
        };

        const { data: newVar, error: insErr } = await supabase
          .from('product_variations')
          .insert(insertPayload)
          .select('id, product_id, sku, color, size, stock, is_grade, is_active')
          .single();

        if (insErr || !newVar) {
          throw new Error(`Erro ao inserir variação: ${insErr?.message}`);
        }

        createdCount++;
        results.push({
          id: newVar.id,
          product_id: input.productId,
          sku: newVar.sku,
          color: newVar.color,
          size: newVar.size,
          stock: newVar.stock ?? 0,
          is_grade: false,
          is_active: newVar.is_active,
          action: 'created',
        });
      }
    }

    // 4. Política de Remoção Segura: desativa variações unitárias existentes ausentes
    for (const existing of existingUnitVars) {
      if (!matchedIds.has(existing.id) && existing.is_active) {
        await supabase
          .from('product_variations')
          .update({ is_active: false, updated_at: new Date().toISOString() })
          .eq('id', existing.id);
        deactivatedCount++;
      }
    }

    // 5. Mapeamento de Componentes para Snapshots de Grade existentes (Fase J)
    // Sincroniza product_grade_snapshot_items com as Unit Variations correspondentes
    const { data: activeSnapshots } = await supabase
      .from('product_grade_snapshots')
      .select('id, color')
      .eq('product_id', input.productId)
      .eq('is_active', true);

    if (activeSnapshots && activeSnapshots.length > 0) {
      const activeUnits = results.filter((r) => r.is_active);
      for (const snap of activeSnapshots) {
        const { data: snapItems } = await supabase
          .from('product_grade_snapshot_items')
          .select('id, size, variation_id')
          .eq('snapshot_id', snap.id);

        if (snapItems) {
          for (const item of snapItems) {
            const matches = activeUnits.filter((u) => {
              const sizeMatch = String(u.size).trim() === String(item.size).trim();
              if (!sizeMatch) return false;
              if (snap.color) {
                return String(u.color || '').trim().toLowerCase() === String(snap.color).trim().toLowerCase();
              }
              return true;
            });

            const targetVarId = matches.length === 1 ? matches[0].id : null;
            if (item.variation_id !== targetVarId) {
              await supabase
                .from('product_grade_snapshot_items')
                .update({ variation_id: targetVarId })
                .eq('id', item.id);
            }
          }
        }
      }
    }

    return {
      product_id: input.productId,
      variation_mode: input.variationMode || 'size_only',
      created_count: createdCount,
      updated_count: updatedCount,
      unchanged_count: unchangedCount,
      deactivated_count: deactivatedCount,
      variations: results,
    };
  }
}
