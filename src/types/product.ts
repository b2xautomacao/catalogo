
export interface ProductVariation {
  id: string;
  product_id: string;
  color?: string;
  size?: string;
  material?: string;
  sku?: string;
  stock: number;
  price_adjustment: number;
  is_active: boolean;
  image_url?: string;
  created_at: string;
  updated_at: string;
  // Propriedades adicionais para compatibilidade
  hex_color?: string;
  variation_value?: string;
  variation_type?: string;
  name?: string;
  display_order?: number;
  parent_variation_id?: string;
  stock_quantity?: number;
  price?: number;
  image_file?: File | null;
}

export interface Product {
  id: string;
  store_id: string;
  name: string;
  description?: string;
  retail_price: number;
  wholesale_price?: number;
  category?: string;
  stock: number;
  min_wholesale_qty?: number;
  image_url?: string;
  meta_title?: string;
  meta_description?: string;
  keywords?: string;
  seo_slug?: string;
  is_featured?: boolean;
  allow_negative_stock?: boolean;
  stock_alert_threshold?: number;
  is_active?: boolean;
  reserved_stock?: number;
  created_at?: string;
  updated_at?: string;
  variations?: ProductVariation[];
  // Propriedade adicional para WhatsApp
  whatsapp_number?: string;
}

export interface CreateProductData {
  store_id: string;
  name: string;
  description?: string;
  retail_price: number;
  wholesale_price?: number;
  category?: string;
  stock: number;
  min_wholesale_qty?: number;
  meta_title?: string;
  meta_description?: string;
  keywords?: string;
  seo_slug?: string;
  is_featured?: boolean;
  allow_negative_stock?: boolean;
  stock_alert_threshold?: number;
  is_active?: boolean;
}

export interface UpdateProductData extends CreateProductData {
  id: string;
}

// Interface padronizada para tiers de preço
export interface ProductPriceTier {
  id?: string;
  tier_name: string;
  tier_type: string;
  min_quantity: number;
  price: number;
  tier_order: number;
  is_active?: boolean;
}

// Interface unificada para form wizards
export interface UnifiedPriceTier {
  id: string;
  name: string;
  minQuantity: number;
  price: number;
  enabled: boolean;
}
