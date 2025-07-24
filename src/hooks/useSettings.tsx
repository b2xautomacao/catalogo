
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

export const useSettings = (storeId?: string) => {
  const [settings, setSettings] = useState<Settings[]>([]);
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

  useEffect(() => {
    if (storeId) {
      fetchSettings(storeId);
    }
  }, [storeId]);

  return {
    settings,
    loading,
    error,
    updateSetting,
    refetch: () => storeId ? fetchSettings(storeId) : Promise.resolve()
  };
};
