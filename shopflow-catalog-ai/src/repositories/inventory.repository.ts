import { supabase } from '../lib/supabase.js';
import {
  StockMovementRecord,
  CreateStockMovementRecord,
  ProductStockState,
  VariationStockState,
  StockReconciliationResult,
  AdjustStockResult,
} from '../domain/inventory.types.js';
import {
  InventoryTargetNotFoundError,
  InsufficientStockError,
  InvalidStockOperationError,
  IdempotencyConflictError,
  InvalidArgumentError,
} from '../domain/errors.js';

export interface StockMovementFilter {
  productId?: string;
  variationId?: string;
  movementType?: string;
  unitKind?: string;
  limit?: number;
  offset?: number;
}

export class InventoryRepository {
  async getProductStockState(storeId: string, productId: string): Promise<ProductStockState | null> {
    const { data, error } = await supabase
      .from('products')
      .select('id, store_id, name, stock, reserved_stock, allow_negative_stock')
      .eq('id', productId)
      .eq('store_id', storeId) // TENANT GUARD
      .maybeSingle();

    if (error || !data) {
      return null;
    }

    // Checar se produto possui variações
    const { count } = await supabase
      .from('product_variations')
      .select('id', { count: 'exact', head: true })
      .eq('product_id', productId);

    const stock = data.stock ?? 0;
    const reservedStock = data.reserved_stock ?? 0;
    const availableStock = stock - reservedStock;

    return {
      productId: data.id,
      storeId: data.store_id,
      productName: data.name,
      stock,
      reservedStock,
      availableStock,
      allowNegativeStock: !!data.allow_negative_stock,
      hasVariations: (count ?? 0) > 0,
    };
  }

  async getVariationStockState(
    storeId: string,
    productId: string,
    variationId: string
  ): Promise<VariationStockState | null> {
    // Primeiro validar que o produto pertence à store
    const { data: prodData } = await supabase
      .from('products')
      .select('id')
      .eq('id', productId)
      .eq('store_id', storeId)
      .maybeSingle();

    if (!prodData) {
      return null;
    }

    const { data, error } = await supabase
      .from('product_variations')
      .select('id, product_id, name, sku, color, size, is_grade, grade_sizes, grade_pairs, stock')
      .eq('id', variationId)
      .eq('product_id', productId)
      .maybeSingle();

    if (error || !data) {
      return null;
    }

    let gradeSizes = data.grade_sizes;
    let gradePairs = data.grade_pairs;

    if (data.is_grade) {
      // Sprint 9.1: Resolver composição através de pack_variation_id no snapshot
      const { data: snapshot } = await supabase
        .from('product_grade_snapshots')
        .select('id, product_grade_snapshot_items(size, quantity, position)')
        .eq('pack_variation_id', variationId)
        .maybeSingle();

      if (snapshot && snapshot.product_grade_snapshot_items && (snapshot.product_grade_snapshot_items as any[]).length > 0) {
        const sortedItems = [...(snapshot.product_grade_snapshot_items as any[])].sort(
          (a: any, b: any) => (a.position ?? 0) - (b.position ?? 0)
        );
        gradeSizes = sortedItems.map((i: any) => i.size);
        gradePairs = sortedItems.map((i: any) => i.quantity);
      }
    }

    return {
      variationId: data.id,
      productId: data.product_id,
      storeId,
      name: data.name,
      sku: data.sku,
      color: data.color,
      size: data.size,
      isGrade: !!data.is_grade,
      gradeSizes,
      gradePairs,
      stock: data.stock ?? 0,
    };
  }

  async getMovementByIdempotencyKey(
    storeId: string,
    idempotencyKey: string
  ): Promise<StockMovementRecord | null> {
    const { data, error } = await supabase
      .from('stock_movements')
      .select('*')
      .eq('store_id', storeId) // TENANT GUARD
      .eq('idempotency_key', idempotencyKey)
      .maybeSingle();

    if (error || !data) {
      return null;
    }

    return data as StockMovementRecord;
  }

  async recordMovement(record: CreateStockMovementRecord): Promise<StockMovementRecord> {
    const payload = {
      store_id: record.store_id,
      product_id: record.product_id,
      variation_id: record.variation_id || null,
      order_id: record.order_id || null,
      movement_type: record.movement_type,
      unit_kind: record.unit_kind || 'unit',
      quantity: record.quantity,
      physical_quantity: record.physical_quantity ?? record.quantity,
      previous_stock: record.previous_stock,
      new_stock: record.new_stock,
      idempotency_key: record.idempotency_key || null,
      reason_code: record.reason_code || null,
      source_type: record.source_type || 'system',
      source_id: record.source_id || null,
      parent_movement_id: record.parent_movement_id || null,
      notes: record.notes || null,
      expires_at: record.expires_at || null,
    };

    const { data, error } = await supabase
      .from('stock_movements')
      .insert(payload)
      .select('*')
      .single();

    if (error) {
      throw new Error(`Failed to record stock movement: ${error.message}`);
    }

    return data as StockMovementRecord;
  }

  async listMovements(
    storeId: string,
    filter: StockMovementFilter = {}
  ): Promise<StockMovementRecord[]> {
    let query = supabase
      .from('stock_movements')
      .select('*')
      .eq('store_id', storeId) // TENANT GUARD
      .order('created_at', { ascending: false });

    if (filter.productId) {
      query = query.eq('product_id', filter.productId);
    }

    if (filter.variationId) {
      query = query.eq('variation_id', filter.variationId);
    }

    if (filter.movementType) {
      query = query.eq('movement_type', filter.movementType);
    }

    if (filter.unitKind) {
      query = query.eq('unit_kind', filter.unitKind);
    }

    const limit = filter.limit ?? 50;
    const offset = filter.offset ?? 0;
    query = query.range(offset, offset + limit - 1);

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to list stock movements: ${error.message}`);
    }

    return (data as StockMovementRecord[]) || [];
  }

  async reconcileProductStock(
    storeId: string,
    productId: string
  ): Promise<StockReconciliationResult> {
    // 1. Obter estado do produto
    const prodState = await this.getProductStockState(storeId, productId);
    if (!prodState) {
      throw new Error(`Product ${productId} not found in store ${storeId}`);
    }

    // 2. Obter variações e soma de estoques com equivalência física
    const { data: variationsData } = await supabase
      .from('product_variations')
      .select('id, sku, is_grade, grade_pairs, stock')
      .eq('product_id', productId);

    const variations = variationsData || [];
    const hasVariations = variations.length > 0;
    const variationsPhysicalTotal = hasVariations
      ? variations.reduce((sum, v) => {
          let pairsPerPack = 1;
          if (v.is_grade) {
            if (Array.isArray(v.grade_pairs) && v.grade_pairs.length > 0) {
              pairsPerPack = v.grade_pairs.reduce((pSum: number, count: any) => pSum + (Number(count) || 0), 0);
            }
            if (pairsPerPack <= 0) pairsPerPack = 1;
          }
          return sum + ((v.stock || 0) * pairsPerPack);
        }, 0)
      : null;

    // 3. Obter soma do histórico no ledger
    const { data: movements } = await supabase
      .from('stock_movements')
      .select('movement_type, quantity, physical_quantity, unit_kind')
      .eq('store_id', storeId)
      .eq('product_id', productId);

    let ledgerNetMovement = 0;
    if (movements && movements.length > 0) {
      for (const m of movements) {
        const qty = m.physical_quantity ?? m.quantity;
        if (m.movement_type === 'sale') {
          ledgerNetMovement -= qty;
        } else if (m.movement_type === 'return') {
          ledgerNetMovement += qty;
        } else if (m.movement_type === 'adjustment') {
          // Se for adjustment relativo ou baseline
          ledgerNetMovement += qty;
        }
      }
    }

    // 4. Determinar status de reconciliação
    let status: StockReconciliationResult['status'] = 'synced';

    if (hasVariations && variationsPhysicalTotal !== null) {
      // Se há variações, o estoque agregado do produto deveria bater com a soma física das variações
      if (variationsPhysicalTotal !== prodState.stock) {
        status = 'mismatch';
      }
    }

    return {
      productId,
      storeId,
      productStock: prodState.stock,
      variationsTotalStock: variationsPhysicalTotal,
      ledgerNetMovement,
      status,
      variationsBreakdown: variations.map((v) => ({
        variationId: v.id,
        sku: v.sku,
        isGrade: !!v.is_grade,
        stock: v.stock || 0,
      })),
    };
  }

  async applyStockAdjustmentRpc(
    storeId: string,
    params: {
      productId: string;
      variationId?: string | null;
      operation: 'increase' | 'decrease' | 'count';
      quantity?: number;
      countedQuantity?: number;
      reasonCode: string;
      idempotencyKey?: string | null;
      notes?: string | null;
    }
  ): Promise<AdjustStockResult> {
    const rpcPayload = {
      p_store_id: storeId,
      p_product_id: params.productId,
      p_variation_id: params.variationId || null,
      p_operation: params.operation,
      p_quantity: params.quantity ?? null,
      p_counted_quantity: params.countedQuantity ?? null,
      p_reason_code: params.reasonCode,
      p_idempotency_key: params.idempotencyKey || null,
      p_source_type: 'agent',
      p_notes: params.notes || null,
    };

    const { data, error } = await supabase.rpc('apply_stock_adjustment', rpcPayload);

    if (error) {
      const msg = error.message || '';
      if (msg.includes('IDEMPOTENCY_CONFLICT')) {
        throw new IdempotencyConflictError(msg);
      }
      if (msg.includes('INVALID_ARGUMENT')) {
        throw new InvalidArgumentError(msg);
      }
      if (msg.includes('INVENTORY_TARGET_NOT_FOUND')) {
        throw new InventoryTargetNotFoundError();
      }
      if (msg.includes('INSUFFICIENT_STOCK')) {
        throw new InsufficientStockError();
      }
      if (msg.includes('INVALID_STOCK_OPERATION')) {
        throw new InvalidStockOperationError(msg);
      }
      throw new Error(`Database error adjusting stock: ${msg}`);
    }

    return data as AdjustStockResult;
  }
}
