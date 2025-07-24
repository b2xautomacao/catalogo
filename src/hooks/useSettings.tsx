
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Settings {
  id: string;
  store_id: string;
  setting_key: string;
  setting_value: any;
  created_at: string;
  updated_at: string;
}

export interface CatalogSettings {
  catalog_mode: 'separated' | 'hybrid' | 'toggle';
  retail_catalog_active: boolean;
  wholesale_catalog_active: boolean;
}

export const useSettings = (storeId?: string) => {
  const [settings, setSettings] = useState<Settings[]>([]);
  const [catalogSettings, setCatalogSettings] = useState<CatalogSettings | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSettings = async (id: string) => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('store_settings')
        .select('*')
        .eq('store_id', id);

      if (fetchError) {
        setError(fetchError.message);
        return;
      }

      setSettings(data || []);
      
      // Convert settings array to catalog settings object
      const catalogData: CatalogSettings = {
        catalog_mode: 'separated',
        retail_catalog_active: true,
        wholesale_catalog_active: false
      };

      data?.forEach(setting => {
        if (setting.setting_key === 'catalog_mode') {
          catalogData.catalog_mode = setting.setting_value;
        } else if (setting.setting_key === 'retail_catalog_active') {
          catalogData.retail_catalog_active = setting.setting_value;
        } else if (setting.setting_key === 'wholesale_catalog_active') {
          catalogData.wholesale_catalog_active = setting.setting_value;
        }
      });

      setCatalogSettings(catalogData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao buscar configurações');
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = async (key: string, value: any) => {
    if (!storeId) return;

    try {
      const { error } = await supabase
        .from('store_settings')
        .upsert({
          store_id: storeId,
          setting_key: key,
          setting_value: value,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
      
      await fetchSettings(storeId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar configuração');
    }
  };

  const updateSettings = async (newSettings: Partial<CatalogSettings>) => {
    if (!storeId) return;

    try {
      setLoading(true);
      
      // Update each setting individually
      for (const [key, value] of Object.entries(newSettings)) {
        await updateSetting(key, value);
      }
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar configurações');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (storeId) {
      fetchSettings(storeId);
    }
  }, [storeId]);

  return {
    settings: catalogSettings,
    loading,
    isLoading: loading,
    error,
    updateSetting,
    updateSettings,
    refetch: () => storeId ? fetchSettings(storeId) : Promise.resolve()
  };
};
