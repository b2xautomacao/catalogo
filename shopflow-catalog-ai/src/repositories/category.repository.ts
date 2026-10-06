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
}
