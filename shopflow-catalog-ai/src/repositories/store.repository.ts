import { supabase } from '../lib/supabase.js';
import { StoreDescriptor } from '../domain/types.js';

export class StoreRepository {
  async searchStores(
    queryText: string,
    allowedStoreIds?: string[] | null,
    limit = 10
  ): Promise<StoreDescriptor[]> {
    const sanitizedLimit = Math.min(Math.max(1, limit), 20);
    const trimmed = queryText.trim();

    // If restricted mode has empty storeIds, return empty array immediately
    if (allowedStoreIds && allowedStoreIds.length === 0) {
      return [];
    }

    let dbQuery = supabase
      .from('stores')
      .select('id, name, url_slug, description, address, is_active')
      .ilike('name', `%${trimmed}%`)
      .order('name', { ascending: true })
      .limit(sanitizedLimit);

    if (allowedStoreIds && allowedStoreIds.length > 0) {
      dbQuery = dbQuery.in('id', allowedStoreIds);
    }

    const { data, error } = await dbQuery;

    if (error) {
      throw new Error(`Error querying stores: ${error.message}`);
    }

    return (data as StoreDescriptor[]) || [];
  }

  async getStoreById(id: string): Promise<StoreDescriptor | null> {
    const { data, error } = await supabase
      .from('stores')
      .select('id, name, url_slug, description, address, is_active')
      .eq('id', id)
      .maybeSingle();

    if (error || !data) {
      return null;
    }

    return data as StoreDescriptor;
  }
}
