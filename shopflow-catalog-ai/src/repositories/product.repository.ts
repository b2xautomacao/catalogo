import { supabase } from '../lib/supabase.js';
import { Product, DetailedProduct, ListProductsFilters, SafeProductResult } from '../domain/types.js';

export class ProductRepository {
  async listProducts(storeId: string, filters: ListProductsFilters): Promise<Product[]> {
    let query = supabase
      .from('products')
      .select('id, name, sku, retail_price, wholesale_price, stock, is_active')
      .eq('store_id', storeId); // TENANT GUARD

    if (filters.nome) {
      query = query.ilike('name', `%${filters.nome}%`);
    }

    if (filters.sku) {
      query = query.eq('sku', filters.sku);
    }

    if (filters.ativo !== undefined) {
      query = query.eq('is_active', filters.ativo);
    }

    query = query.order('created_at', { ascending: false });

    // Pagination
    query = query.range(filters.offset, filters.offset + filters.limit - 1);

    const { data, error } = await query;

    if (error) {
      throw new Error(`Error listing products: ${error.message}`);
    }

    return (data as any[]) || [];
  }

  async getProductById(storeId: string, id: string): Promise<DetailedProduct | null> {
    const { data: productData, error: productError } = await supabase
      .from('products')
      .select('id, name, sku, retail_price, wholesale_price, stock, is_active')
      .eq('id', id)
      .eq('store_id', storeId) // TENANT GUARD
      .maybeSingle();

    if (productError || !productData) {
      return null;
    }

    // Fetch related images
    const { data: imagesData } = await supabase
      .from('product_images')
      .select('id, image_url, image_order, is_primary')
      .eq('product_id', id)
      .order('image_order', { ascending: true });

    // Fetch related variations
    const { data: variationsData } = await supabase
      .from('product_variations')
      .select('id, name, sku, color, size, stock, price_adjustment')
      .eq('product_id', id);

    return {
      ...productData,
      images: (imagesData as any[]) || [],
      variations: (variationsData as any[]) || [],
    };
  }

  async checkSkuExists(storeId: string, sku: string, excludeProductId?: string): Promise<boolean> {
    let query = supabase
      .from('products')
      .select('id')
      .eq('store_id', storeId) // TENANT GUARD
      .eq('sku', sku);

    if (excludeProductId) {
      query = query.neq('id', excludeProductId);
    }

    const { data, error } = await query;

    if (error || !data) {
      return false;
    }

    return data.length > 0;
  }

  async createProduct(storeId: string, payload: Record<string, any>): Promise<SafeProductResult> {
    const insertData = {
      ...payload,
      store_id: storeId, // TENANT GUARD (injected)
    };

    const { data, error } = await supabase
      .from('products')
      .insert(insertData)
      .select('id, name, sku, description, category, retail_price, wholesale_price, is_active')
      .single();

    if (error || !data) {
      throw new Error(`Failed to create product: ${error?.message || 'Unknown database error'}`);
    }

    return data as SafeProductResult;
  }

  async updateProduct(
    storeId: string,
    productId: string,
    payload: Record<string, any>
  ): Promise<SafeProductResult | null> {
    const { data, error } = await supabase
      .from('products')
      .update(payload)
      .eq('id', productId)
      .eq('store_id', storeId) // DUAL TENANT GUARD (WHERE id = id AND store_id = storeId)
      .select('id, name, sku, description, category, retail_price, wholesale_price, is_active')
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to update product: ${error.message}`);
    }

    if (!data) {
      return null;
    }

    return data as SafeProductResult;
  }

  async deactivateProduct(
    storeId: string,
    productId: string
  ): Promise<SafeProductResult | null> {
    const { data, error } = await supabase
      .from('products')
      .update({ is_active: false })
      .eq('id', productId)
      .eq('store_id', storeId) // DUAL TENANT GUARD (WHERE id = id AND store_id = storeId)
      .select('id, name, sku, description, category, retail_price, wholesale_price, is_active')
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to deactivate product: ${error.message}`);
    }

    if (!data) {
      return null;
    }

    return data as SafeProductResult;
  }

  async bulkUpdateProducts(
    storeId: string,
    productIds: string[],
    updates: Record<string, any>,
    operationId: string
  ): Promise<any> {
    const { data, error } = await supabase.rpc('bulk_update_products', {
      p_store_id: storeId,
      p_product_ids: productIds,
      p_updates: updates,
      p_operation_id: operationId,
    });

    if (error) {
      throw new Error(`Failed to bulk update products: ${error.message}`);
    }

    return data;
  }

  async searchCatalog(
    storeId: string,
    input: any
  ): Promise<any> {
    let query = supabase
      .from('products')
      .select(`
        id,
        name,
        description,
        sku,
        category,
        category_id,
        material,
        product_gender,
        product_category_type,
        retail_price,
        wholesale_price,
        min_wholesale_qty,
        stock,
        is_active,
        is_featured,
        stock_alert_threshold,
        product_images ( id, image_url, is_primary ),
        product_variations ( id, name, sku, color, size, stock, is_grade, unit_kind, pack_quantity ),
        product_grade_snapshots ( id, template_name, product_grade_snapshot_items ( size, quantity ) )
      `)
      .eq('store_id', storeId);

    if (input.is_active !== undefined) {
      query = query.eq('is_active', input.is_active);
    }
    if (input.is_featured !== undefined) {
      query = query.eq('is_featured', input.is_featured);
    }
    if (input.category) {
      query = query.ilike('category', input.category);
    }
    if (input.product_gender) {
      query = query.eq('product_gender', input.product_gender);
    }
    if (input.material) {
      query = query.ilike('material', `%${input.material}%`);
    }
    if (input.min_price !== undefined) {
      query = query.gte('retail_price', input.min_price);
    }
    if (input.max_price !== undefined) {
      query = query.lte('retail_price', input.max_price);
    }

    const { data, error } = await query;
    if (error) {
      throw new Error(`Failed to search catalog: ${error.message}`);
    }

    return data || [];
  }

  async checkHealth(storeId?: string | null): Promise<boolean> {
    let query = supabase.from('stores').select('id').limit(1);

    if (storeId) {
      query = query.eq('id', storeId);
    }

    const { error } = await query;
    return !error;
  }
}
