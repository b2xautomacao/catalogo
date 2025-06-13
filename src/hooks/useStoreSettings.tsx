
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface StoreSettings {
  id: string;
  store_id: string;
  business_hours: any;
  payment_methods: any;
  shipping_options: any;
  whatsapp_number: string | null;
  whatsapp_integration_active: boolean | null;
  retail_catalog_active: boolean | null;
  wholesale_catalog_active: boolean | null;
  created_at: string;
  updated_at: string;
}

export const useStoreSettings = (storeId?: string) => {
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const { profile } = useAuth();

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      const targetStoreId = storeId || profile?.store_id;
      
      if (!targetStoreId) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('store_settings')
        .select('*')
        .eq('store_id', targetStoreId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      // Se não existir configuração, criar uma padrão
      if (!data) {
        const { data: newSettings, error: createError } = await supabase
          .from('store_settings')
          .insert([{
            store_id: targetStoreId,
            retail_catalog_active: true,
            wholesale_catalog_active: false,
            whatsapp_integration_active: false
          }])
          .select()
          .single();

        if (createError) throw createError;
        setSettings(newSettings);
      } else {
        setSettings(data);
      }
    } catch (error) {
      console.error('Erro ao buscar configurações:', error);
    } finally {
      setLoading(false);
    }
  }, [storeId, profile?.store_id]);

  const updateSettings = useCallback(async (updates: Partial<StoreSettings>) => {
    try {
      if (!settings) return { data: null, error: 'Configurações não encontradas' };

      const { data, error } = await supabase
        .from('store_settings')
        .update(updates)
        .eq('id', settings.id)
        .select()
        .single();

      if (error) throw error;
      setSettings(data);
      return { data, error: null };
    } catch (error) {
      console.error('Erro ao atualizar configurações:', error);
      return { data: null, error };
    }
  }, [settings]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  return {
    settings,
    loading,
    fetchSettings,
    updateSettings
  };
};
