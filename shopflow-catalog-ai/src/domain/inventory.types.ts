export type StockMovementType = 'reservation' | 'sale' | 'return' | 'adjustment' | 'release';

export type StockUnitKind = 'unit' | 'pack';

export type StockReasonCode =
  | 'inventory_count'
  | 'damage'
  | 'loss'
  | 'found_stock'
  | 'correction'
  | 'initial_balance'
  | 'order_fulfillment'
  | 'cancellation'
  | 'other';

export type StockSourceType =
  | 'order'
  | 'manual_adjustment'
  | 'return'
  | 'reservation'
  | 'release'
  | 'agent'
  | 'system'
  | 'import';

export interface StockMovementRecord {
  id: string;
  store_id: string;
  product_id: string;
  variation_id: string | null;
  order_id: string | null;
  movement_type: StockMovementType;
  unit_kind: StockUnitKind;
  quantity: number;
  physical_quantity: number;
  previous_stock: number;
  new_stock: number;
  idempotency_key: string | null;
  reason_code: StockReasonCode | string | null;
  source_type: StockSourceType;
  source_id: string | null;
  parent_movement_id: string | null;
  notes: string | null;
  created_at: string;
  expires_at: string | null;
}

export interface CreateStockMovementRecord {
  store_id: string;
  product_id: string;
  variation_id?: string | null;
  order_id?: string | null;
  movement_type: StockMovementType;
  unit_kind?: StockUnitKind;
  quantity: number;
  physical_quantity?: number;
  previous_stock: number;
  new_stock: number;
  idempotency_key?: string | null;
  reason_code?: StockReasonCode | string | null;
  source_type?: StockSourceType;
  source_id?: string | null;
  parent_movement_id?: string | null;
  notes?: string | null;
  expires_at?: string | null;
}

export interface ProductStockState {
  productId: string;
  storeId: string;
  productName: string;
  stock: number;
  reservedStock: number;
  availableStock: number;
  allowNegativeStock: boolean;
  hasVariations: boolean;
}

export interface VariationStockState {
  variationId: string;
  productId: string;
  storeId: string;
  name: string | null;
  sku: string | null;
  color: string | null;
  size: string | null;
  isGrade: boolean;
  gradeSizes?: number[] | string[] | null;
  gradePairs?: number[] | null;
  stock: number;
}

export interface StockReconciliationResult {
  productId: string;
  storeId: string;
  productStock: number;
  variationsTotalStock: number | null;
  ledgerNetMovement: number;
  status: 'synced' | 'mismatch' | 'untracked_legacy' | 'ambiguous';
  variationsBreakdown?: Array<{
    variationId: string;
    sku: string | null;
    isGrade: boolean;
    stock: number;
  }>;
}

export interface AdjustStockResult {
  applied: boolean;
  duplicate: boolean;
  movement_id: string;
  product_id: string;
  variation_id: string | null;
  unit_kind: StockUnitKind;
  operation: 'increase' | 'decrease' | 'count';
  delta: number;
  quantity: number;
  physical_quantity: number;
  previous_stock: number;
  current_stock: number;
  product_stock: number;
}

export interface ConsultarEstoqueResult {
  product_id: string;
  variation_id: string | null;
  target_name: string;
  sku: string | null;
  unit_kind: StockUnitKind;
  current_stock: number;
  reserved_stock: number;
  available_stock: number;
  physical_quantity_per_unit?: number;
  physical_stock?: number;
  product_stock: number;
  reconciliation_status: 'synced' | 'mismatch' | 'untracked_legacy' | 'ambiguous';
  stock?: {
    commercial_quantity: number;
    unit_kind: StockUnitKind;
    physical_quantity: number;
  };
}
