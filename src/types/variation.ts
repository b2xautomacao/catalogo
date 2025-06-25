
export interface ProductVariation {
  id?: string;
  product_id?: string;
  color?: string | null;
  size?: string | null;
  sku?: string | null;
  stock: number;
  price_adjustment: number;
  is_active: boolean;
  image_url?: string | null;
  image_file?: File;
  created_at?: string;
  updated_at?: string;
}

export interface VariationFormData {
  color?: string;
  size?: string;
  sku?: string;
  stock: number;
  price_adjustment: number;
  is_active: boolean;
  image_url?: string;
  image_file?: File;
}

// Interface para compatibilidade com formulários existentes
export interface LegacyProductVariation {
  color?: string;
  size?: string;
  sku?: string;
  stock: number;
  price_adjustment: number;
}
