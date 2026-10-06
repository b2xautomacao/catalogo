export interface GradeTemplateItem {
  id: string;
  grade_template_id: string;
  size: string;
  quantity: number;
  position: number;
  created_at?: string;
}

export interface GradeTemplate {
  id: string;
  store_id: string | null;
  name: string;
  slug?: string | null;
  product_category_type?: string | null;
  is_system: boolean;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
  items: GradeTemplateItem[];
  total_units: number;
}

export interface SizePairConfig {
  size: string;
  pairs: number;
}

export interface CreateCustomTemplateInput {
  name: string;
  items: SizePairConfig[];
  productCategoryType?: string;
}
