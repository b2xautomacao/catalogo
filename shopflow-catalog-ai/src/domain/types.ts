export interface Product {
  id: string;
  name: string;
  sku: string | null;
  retail_price: number;
  wholesale_price: number | null;
  stock: number;
  is_active: boolean;
}

export interface DetailedProduct extends Product {
  images: Array<{
    id: string;
    image_url: string;
    image_order: number;
    is_primary: boolean;
  }>;
  variations: Array<{
    id: string;
    name: string | null;
    sku: string | null;
    color: string | null;
    size: string | null;
    stock: number;
    price_adjustment: number | null;
  }>;
}

export interface ListProductsFilters {
  nome?: string;
  sku?: string;
  ativo?: boolean;
  limit: number;
  offset: number;
}

export interface StoreDescriptor {
  id: string;
  name: string;
  url_slug: string | null;
  description: string | null;
  address: string | null;
  is_active: boolean;
}

export interface StoreSearchResponse {
  matches: StoreDescriptor[];
  count: number;
  selectionRequired: boolean;
}

export interface CreateProductInput {
  name: string;
  description?: string;
  sku?: string;
  retail_price: number;
  wholesale_price?: number;
  min_wholesale_qty?: number;
  category?: string;
  category_id?: string;
  material?: string;
  product_gender?: 'masculino' | 'feminino' | 'unissex' | 'infantil';
  product_category_type?: 'calcado' | 'roupa_superior' | 'roupa_inferior' | 'acessorio';
}

export interface UpdateProductInput {
  product_id: string;
  name?: string;
  description?: string;
  sku?: string;
  retail_price?: number;
  wholesale_price?: number | null;
  min_wholesale_qty?: number;
  category?: string | null;
  category_id?: string | null;
  material?: string | null;
  product_gender?: 'masculino' | 'feminino' | 'unissex' | 'infantil' | null;
  product_category_type?: 'calcado' | 'roupa_superior' | 'roupa_inferior' | 'acessorio' | null;
}

export interface SafeProductResult {
  id: string;
  name: string;
  sku: string | null;
  description: string | null;
  category: string | null;
  retail_price: number;
  wholesale_price: number | null;
  is_active: boolean;
}

export interface DeactivateProductInput {
  product_id: string;
}

export interface DeactivateProductResult {
  deactivated: boolean;
  alreadyInactive: boolean;
  product: SafeProductResult;
}

export interface ProductImageRecord {
  id: string;
  product_id: string;
  variation_id?: string | null;
  image_url: string;
  image_order: number;
  alt_text?: string | null;
  is_primary: boolean;
  color_association?: string | null;
  created_at?: string;
}

export interface ProductImageDto {
  id: string;
  product_id: string;
  image_url: string;
  alt_text: string | null;
  is_primary: boolean;
  image_order: number;
  color_association: string | null;
}

