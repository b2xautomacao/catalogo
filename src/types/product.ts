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
  // Suporte a variação composta (grade)
  grade_model_id?: string; // Referência ao modelo de grade
  grade_name?: string; // Nome da grade (ex: Baixa, Alta)
  grade_color?: string; // Cor da grade
  grade_quantity?: number; // Quantidade de grades
  grade_sizes?: string[]; // Tamanhos da grade
  grade_pairs?: number[]; // Quantidade de pares por tamanho
  is_grade?: boolean; // Indica se é variação de grade
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
  whatsapp_number?: string;
  price_tiers?: ProductPriceTier[];
  enable_gradual_wholesale?: boolean; // Toggle para ativar/desativar atacado gradativo
  price_model?: string; // Adicionar propriedade price_model
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

// Interface unificada para price tiers - suporta ambos os formatos
export interface ProductPriceTier {
  id: string;
  tier_name: string;
  tier_type: string;
  min_quantity: number;
  price: number;
  tier_order: number;
  is_active?: boolean;
  // Propriedades de compatibilidade para wizards
  name?: string;
  minQuantity?: number;
  enabled?: boolean;
}

// Interface alternativa para wizard forms
export interface UnifiedPriceTier {
  id: string;
  name: string;
  minQuantity: number;
  price: number;
  enabled: boolean;
}
