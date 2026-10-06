import { supabase } from '../lib/supabase.js';
import {
  GradeTemplateRecord,
  GradeTemplateWithItems,
  GradeTemplateListItem,
  GradeTemplateItemRecord,
  CreateGradeTemplateData,
  ApplyGradeToProductData,
  ApplyGradeToProductResult,
  ProductGradeSnapshotRecord,
} from '../domain/grade.types.js';
import {
  GradeTemplateNotFoundError,
  GradeTemplateAlreadyExistsError,
  ProductNotFoundError,
  SkuAlreadyExistsError,
} from '../domain/errors.js';

export interface ListGradeTemplatesFilter {
  query?: string;
  productCategoryType?: string;
  type?: 'system' | 'custom';
  limit?: number;
  offset?: number;
}

export class GradeRepository {
  async listTemplates(
    storeId: string,
    filter: ListGradeTemplatesFilter = {}
  ): Promise<GradeTemplateListItem[]> {
    let query = supabase
      .from('grade_templates')
      .select('id, name, slug, product_category_type, is_system, is_active, grade_template_items(id, size, quantity, position)')
      .eq('is_active', true)
      .or(`is_system.eq.true,store_id.eq.${storeId}`)
      .order('is_system', { ascending: false })
      .order('name', { ascending: true });

    if (filter.type === 'system') {
      query = query.eq('is_system', true);
    } else if (filter.type === 'custom') {
      query = query.eq('is_system', false).eq('store_id', storeId);
    }

    if (filter.productCategoryType) {
      query = query.eq('product_category_type', filter.productCategoryType);
    }

    if (filter.query) {
      query = query.ilike('name', `%${filter.query.trim()}%`);
    }

    const limit = filter.limit ?? 20;
    const offset = filter.offset ?? 0;
    query = query.range(offset, offset + limit - 1);

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to list grade templates: ${error.message}`);
    }

    if (!data) return [];

    return data.map((t: any) => {
      const items: GradeTemplateItemRecord[] = t.grade_template_items || [];
      const totalUnits = items.reduce((sum, i) => sum + (Number(i.quantity) || 0), 0);
      return {
        id: t.id,
        name: t.name,
        slug: t.slug,
        type: t.is_system ? 'system' : 'custom',
        product_category_type: t.product_category_type,
        total_units: totalUnits,
        item_count: items.length,
        is_active: t.is_active,
      };
    });
  }

  async getTemplateById(
    storeId: string,
    templateId: string
  ): Promise<GradeTemplateWithItems | null> {
    const { data, error } = await supabase
      .from('grade_templates')
      .select('id, store_id, name, slug, product_category_type, is_system, is_active, created_at, updated_at, grade_template_items(id, grade_template_id, size, quantity, position, created_at)')
      .eq('id', templateId)
      .or(`is_system.eq.true,store_id.eq.${storeId}`)
      .maybeSingle();

    if (error || !data) {
      return null;
    }

    const rawItems = (data.grade_template_items as GradeTemplateItemRecord[]) || [];
    const items = [...rawItems].sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
    const totalUnits = items.reduce((sum, i) => sum + (Number(i.quantity) || 0), 0);

    return {
      id: data.id,
      store_id: data.store_id,
      name: data.name,
      slug: data.slug,
      product_category_type: data.product_category_type,
      is_system: data.is_system,
      is_active: data.is_active,
      created_at: data.created_at,
      updated_at: data.updated_at,
      items,
      total_units: totalUnits,
    };
  }

  async createStoreTemplate(data: CreateGradeTemplateData): Promise<GradeTemplateWithItems> {
    // 1. Checar se já existe template com mesmo nome na loja
    const { data: existing } = await supabase
      .from('grade_templates')
      .select('id')
      .eq('store_id', data.storeId)
      .eq('is_system', false)
      .ilike('name', data.name.trim())
      .maybeSingle();

    if (existing) {
      throw new GradeTemplateAlreadyExistsError(
        `Já existe um modelo de grade customizado com o nome "${data.name}" nesta loja`
      );
    }

    // 2. Inserir template
    const { data: template, error: tmplError } = await supabase
      .from('grade_templates')
      .insert({
        store_id: data.storeId,
        name: data.name.trim(),
        product_category_type: data.productCategoryType || 'calcado',
        is_system: false,
        is_active: true,
      })
      .select('*')
      .single();

    if (tmplError || !template) {
      throw new Error(`Erro ao criar modelo de grade: ${tmplError?.message}`);
    }

    // 3. Inserir itens
    const itemsToInsert = data.items.map((item, idx) => ({
      grade_template_id: template.id,
      size: item.size.trim(),
      quantity: item.quantity,
      position: item.position ?? idx + 1,
    }));

    const { data: items, error: itemsError } = await supabase
      .from('grade_template_items')
      .insert(itemsToInsert)
      .select('*');

    if (itemsError || !items) {
      // Rollback se falhar inserção de itens
      await supabase.from('grade_templates').delete().eq('id', template.id);
      throw new Error(`Erro ao inserir itens da grade: ${itemsError?.message}`);
    }

    const sortedItems = [...items].sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
    const totalUnits = sortedItems.reduce((sum, i) => sum + (Number(i.quantity) || 0), 0);

    return {
      id: template.id,
      store_id: template.store_id,
      name: template.name,
      slug: template.slug,
      product_category_type: template.product_category_type,
      is_system: template.is_system,
      is_active: template.is_active,
      created_at: template.created_at,
      updated_at: template.updated_at,
      items: sortedItems,
      total_units: totalUnits,
    };
  }

  async applyGradeToProduct(
    storeId: string,
    data: ApplyGradeToProductData
  ): Promise<ApplyGradeToProductResult> {
    // 1. Validar Produto e Tenant Guard
    const { data: product, error: prodError } = await supabase
      .from('products')
      .select('id, store_id, name')
      .eq('id', data.productId)
      .eq('store_id', storeId) // TENANT GUARD
      .maybeSingle();

    if (prodError || !product) {
      throw new ProductNotFoundError(`Produto ${data.productId} não encontrado na loja ativa`);
    }

    // 2. Validar Template e Tenant Guard / System Visibility
    const template = await this.getTemplateById(storeId, data.gradeTemplateId);
    if (!template) {
      throw new GradeTemplateNotFoundError(`Modelo de grade ${data.gradeTemplateId} não encontrado`);
    }

    if (template.items.length === 0) {
      throw new Error(`Modelo de grade ${template.name} não possui itens`);
    }

    // 3. Validar Unicidade de SKU se fornecido
    if (data.sku && data.sku.trim() !== '') {
      const { data: existingSku } = await supabase
        .from('product_variations')
        .select('id')
        .eq('product_id', data.productId)
        .eq('sku', data.sku.trim())
        .maybeSingle();

      if (existingSku) {
        throw new SkuAlreadyExistsError(`SKU "${data.sku}" já existe para este produto`);
      }
    }

    // 4. Preparar Projeção de Compatibilidade para product_variations
    const gradeSizes = template.items.map((i) => i.size);
    const gradePairs = template.items.map((i) => i.quantity);
    const gradeName = data.name || template.name;
    const color = data.color || null;
    const variationName = color ? `${product.name} - ${color} (${gradeName})` : `${product.name} (${gradeName})`;

    // 5. Inserir Variação de Compatibilidade (Pack Variation) em product_variations
    // ESTOQUE INICIAL É RIGOROSAMENTE ZERO
    const { data: variation, error: varError } = await supabase
      .from('product_variations')
      .insert({
        product_id: data.productId,
        name: variationName,
        sku: data.sku ? data.sku.trim() : null,
        color: color,
        size: null,
        is_grade: true,
        grade_name: gradeName,
        grade_sizes: gradeSizes,
        grade_pairs: gradePairs,
        stock: 0, // ESTOQUE INICIAL SEMPRE ZERO
      })
      .select('*')
      .single();

    if (varError || !variation) {
      throw new Error(`Erro ao criar variação de compatibilidade: ${varError?.message}`);
    }

    // 6. Inserir Snapshot Imutável vinculado explicitamente à Pack Variation
    const { data: snapshot, error: snapError } = await supabase
      .from('product_grade_snapshots')
      .insert({
        store_id: storeId,
        product_id: data.productId,
        template_id: template.id,
        pack_variation_id: variation.id, // Vínculo explícito com a Pack Variation
        name: gradeName,
        color: color,
        total_units: template.total_units,
      })
      .select('*')
      .single();

    if (snapError || !snapshot) {
      // Rollback da variação criada
      await supabase.from('product_variations').delete().eq('id', variation.id);
      throw new Error(`Erro ao criar snapshot de grade: ${snapError?.message}`);
    }

    // 7. Inserir Itens do Snapshot (variation_id = NULL pois representa unit variation componente, não a pack)
    const snapshotItems = template.items.map((item) => ({
      snapshot_id: snapshot.id,
      size: item.size,
      quantity: item.quantity,
      position: item.position,
      variation_id: null, // NULL até a implementação da Variation Matrix
    }));

    const { error: snapItemsError } = await supabase
      .from('product_grade_snapshot_items')
      .insert(snapshotItems);

    if (snapItemsError) {
      // Rollback
      await supabase.from('product_grade_snapshots').delete().eq('id', snapshot.id);
      await supabase.from('product_variations').delete().eq('id', variation.id);
      throw new Error(`Erro ao gravar itens do snapshot: ${snapItemsError.message}`);
    }

    return {
      snapshot_id: snapshot.id,
      product_id: data.productId,
      variation_id: variation.id,
      template_id: template.id,
      name: gradeName,
      color: color,
      sku: variation.sku,
      total_units: template.total_units,
      stock: 0,
      items: template.items.map((i) => ({
        size: i.size,
        quantity: i.quantity,
        position: i.position,
      })),
    };
  }

  async getSnapshotForVariation(
    storeId: string,
    variationId: string
  ): Promise<ProductGradeSnapshotRecord | null> {
    const { data, error } = await supabase
      .from('product_grade_snapshots')
      .select('*')
      .eq('pack_variation_id', variationId)
      .eq('store_id', storeId)
      .maybeSingle();

    if (error || !data) {
      return null;
    }

    return data as ProductGradeSnapshotRecord;
  }
}
