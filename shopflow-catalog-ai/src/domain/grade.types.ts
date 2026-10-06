export type GradeTemplateType = 'system' | 'custom';

export interface GradeTemplateItemRecord {
  id: string;
  grade_template_id: string;
  size: string;
  quantity: number;
  position: number;
  created_at: string;
}

export interface GradeTemplateRecord {
  id: string;
  store_id: string | null;
  name: string;
  slug: string | null;
  product_category_type: string | null;
  is_system: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface GradeTemplateWithItems extends GradeTemplateRecord {
  items: GradeTemplateItemRecord[];
  total_units: number;
}

export interface GradeTemplateListItem {
  id: string;
  name: string;
  slug: string | null;
  type: GradeTemplateType;
  product_category_type: string | null;
  total_units: number;
  item_count: number;
  is_active: boolean;
}

export interface CreateGradeTemplateInputItem {
  size: string;
  quantity: number;
  position?: number;
}

export interface CreateGradeTemplateData {
  storeId: string;
  name: string;
  productCategoryType?: string | null;
  items: CreateGradeTemplateInputItem[];
}

export interface ProductGradeSnapshotRecord {
  id: string;
  store_id: string;
  product_id: string;
  template_id: string | null;
  pack_variation_id: string | null;
  name: string;
  color: string | null;
  color_ref: string | null;
  total_units: number;
  created_at: string;
}

export interface ProductGradeSnapshotItemRecord {
  id: string;
  snapshot_id: string;
  size: string;
  quantity: number;
  position: number;
  variation_id: string | null; // Component unit variation (NULL until Variation Matrix)
  created_at: string;
}

export interface ApplyGradeToProductData {
  productId: string;
  gradeTemplateId: string;
  color?: string;
  sku?: string;
  name?: string;
}

export interface ApplyGradeToProductResult {
  snapshot_id: string;
  product_id: string;
  variation_id: string;
  template_id: string;
  name: string;
  color: string | null;
  sku: string | null;
  total_units: number;
  stock: number;
  items: Array<{
    size: string;
    quantity: number;
    position: number;
  }>;
}
