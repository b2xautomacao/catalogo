import { supabase } from '../lib/supabase.js';
import { TenantIntakeDefaults, UpdateTenantIntakeDefaultsInput } from '../domain/types.js';

export const SYSTEM_DEFAULT_INTAKE_SETTINGS: TenantIntakeDefaults = {
  default_min_wholesale_qty: null,
  auto_generate_sku: true,
  auto_generate_slug: true,
  auto_generate_seo: true,
  auto_set_first_image_primary: true,
  inventory_import_mode: 'initial_balance',
  unknown_category_policy: 'ask',
};

export class ProductIntakeSettingsRepository {
  private inMemoryStore = new Map<string, TenantIntakeDefaults>();

  /**
   * For testing purposes, allows setting in-memory tenant defaults
   */
  setInMemorySettings(storeId: string, settings: Partial<TenantIntakeDefaults>): void {
    const existing = this.inMemoryStore.get(storeId) || { ...SYSTEM_DEFAULT_INTAKE_SETTINGS, store_id: storeId };
    this.inMemoryStore.set(storeId, {
      ...existing,
      ...settings,
      store_id: storeId,
    });
  }

  async getSettings(storeId: string): Promise<TenantIntakeDefaults> {
    if (this.inMemoryStore.has(storeId)) {
      return { ...this.inMemoryStore.get(storeId)! };
    }

    try {
      const { data, error } = await supabase
        .from('store_product_intake_settings')
        .select('*')
        .eq('store_id', storeId)
        .maybeSingle();

      if (error || !data) {
        return {
          ...SYSTEM_DEFAULT_INTAKE_SETTINGS,
          store_id: storeId,
        };
      }

      return {
        store_id: data.store_id,
        default_min_wholesale_qty: data.default_min_wholesale_qty ?? null,
        auto_generate_sku: data.auto_generate_sku ?? true,
        auto_generate_slug: data.auto_generate_slug ?? true,
        auto_generate_seo: data.auto_generate_seo ?? true,
        auto_set_first_image_primary: data.auto_set_first_image_primary ?? true,
        inventory_import_mode: data.inventory_import_mode || 'initial_balance',
        unknown_category_policy: data.unknown_category_policy || 'ask',
        created_at: data.created_at,
        updated_at: data.updated_at,
      };
    } catch {
      return {
        ...SYSTEM_DEFAULT_INTAKE_SETTINGS,
        store_id: storeId,
      };
    }
  }

  async updateSettings(
    storeId: string,
    updates: UpdateTenantIntakeDefaultsInput
  ): Promise<TenantIntakeDefaults> {
    const current = await this.getSettings(storeId);
    const updated: TenantIntakeDefaults = {
      ...current,
      ...updates,
      store_id: storeId,
      updated_at: new Date().toISOString(),
    };

    // Update in-memory if present
    this.inMemoryStore.set(storeId, updated);

    try {
      const { data, error } = await supabase
        .from('store_product_intake_settings')
        .upsert(
          {
            store_id: storeId,
            default_min_wholesale_qty: updated.default_min_wholesale_qty,
            auto_generate_sku: updated.auto_generate_sku,
            auto_generate_slug: updated.auto_generate_slug,
            auto_generate_seo: updated.auto_generate_seo,
            auto_set_first_image_primary: updated.auto_set_first_image_primary,
            inventory_import_mode: updated.inventory_import_mode,
            unknown_category_policy: updated.unknown_category_policy,
            updated_at: updated.updated_at,
          },
          { onConflict: 'store_id' }
        )
        .select()
        .single();

      if (!error && data) {
        return {
          store_id: data.store_id,
          default_min_wholesale_qty: data.default_min_wholesale_qty ?? null,
          auto_generate_sku: data.auto_generate_sku ?? true,
          auto_generate_slug: data.auto_generate_slug ?? true,
          auto_generate_seo: data.auto_generate_seo ?? true,
          auto_set_first_image_primary: data.auto_set_first_image_primary ?? true,
          inventory_import_mode: data.inventory_import_mode || 'initial_balance',
          unknown_category_policy: data.unknown_category_policy || 'ask',
          created_at: data.created_at,
          updated_at: data.updated_at,
        };
      }
    } catch {
      // In tests or offline fallback, return memory state
    }

    return updated;
  }
}
