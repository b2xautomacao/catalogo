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

  async listByStore(storeId: string): Promise<CategoryRecord[]> {
    const { data, error } = await supabase
      .from('categories')
      .select('id, store_id, name, description, is_active')
      .eq('store_id', storeId) // TENANT GUARD
      .eq('is_active', true)
      .order('name', { ascending: true });

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
}
