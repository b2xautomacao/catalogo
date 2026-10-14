import { supabase } from '../lib/supabase.js';

export interface CategoryRecord {
  id: string;
  store_id: string;
  name: string;
  description: string | null;
  is_active: boolean;
}

export class CategoryRepository {
  async findByIdAndStore(categoryId: string, storeId: string): Promise<CategoryRecord | null> {
    const { data, error } = await supabase
      .from('categories')
      .select('id, store_id, name, description, is_active')
      .eq('id', categoryId)
      .eq('store_id', storeId) // TENANT GUARD
      .maybeSingle();

    if (error || !data) {
      return null;
    }

    return data as CategoryRecord;
  }

  async listByStore(
    storeId: string,
    filter?: { query?: string; limit?: number; offset?: number }
  ): Promise<CategoryRecord[]> {
    let queryBuilder = supabase
      .from('categories')
      .select('id, store_id, name, description, is_active')
      .eq('store_id', storeId) // TENANT GUARD
      .eq('is_active', true);

    if (filter?.query && filter.query.trim()) {
      queryBuilder = queryBuilder.ilike('name', `%${filter.query.trim()}%`);
    }

    queryBuilder = queryBuilder.order('name', { ascending: true });

    if (filter?.limit) {
      const offset = filter.offset || 0;
      queryBuilder = queryBuilder.range(offset, offset + filter.limit - 1);
    }

    const { data, error } = await queryBuilder;

    if (error || !data) {
      return [];
    }

    return data as CategoryRecord[];
  }

  async findByNameAndStore(name: string, storeId: string): Promise<CategoryRecord | null> {
    const { data, error } = await supabase
      .from('categories')
      .select('id, store_id, name, description, is_active')
      .eq('store_id', storeId) // TENANT GUARD
      .ilike('name', name.trim())
      .maybeSingle();

    if (error || !data) {
      return null;
    }

    return data as CategoryRecord;
  }

  async createCategory(
    storeId: string,
    name: string,
    description?: string
  ): Promise<{ category: CategoryRecord; created: boolean }> {
    const existing = await this.findByNameAndStore(name, storeId);
    if (existing) {
      return { category: existing, created: false };
    }

    const { data, error } = await supabase
      .from('categories')
      .insert({
        store_id: storeId, // TENANT GUARD
        name: name.trim(),
        description: description?.trim() || null,
        is_active: true,
      })
      .select('id, store_id, name, description, is_active')
      .single();

    if (error || !data) {
      throw new Error(`Failed to create category: ${error?.message || 'Unknown database error'}`);
    }

    return { category: data as CategoryRecord, created: true };
  }
}
