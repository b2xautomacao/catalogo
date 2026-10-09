export interface VariationItemResult {
  id: string;
  product_id: string;
  sku: string | null;
  color: string | null;
  size: string | null;
  stock: number;
  is_grade: boolean;
  is_active: boolean;
  action: 'created' | 'updated' | 'unchanged';
}

export interface ReconcileVariationsResult {
  product_id: string;
  variation_mode: string;
  created_count: number;
  updated_count: number;
  unchanged_count: number;
  deactivated_count: number;
  variations: VariationItemResult[];
}
