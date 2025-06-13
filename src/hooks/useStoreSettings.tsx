
import { useState, useEffect, useRef, useCallback } from 'react';
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
  
  // Usar useRef para valores estáveis e evitar loops
  const stableStoreId = useRef<string | null>(null);
  const hasFetched = useRef(false);

  // Determinar store_id de forma estável
  const targetStoreId = storeId || profile?.store_id;

  const fetchSettings = useCallback(async (forceRefresh = false) => {
    // Evitar requisições duplicadas
    if (!forceRefresh && hasFetched.current && stableStoreId.current === targetStoreId) {
      return;
    }

    try {
      setLoading(true);
      
      if (!targetStoreId) {
        console.log('useStoreSettings: Nenhum store_id disponível');
        setSettings(null);
        setLoading(false);
        return;
      }

      console.log('useStoreSettings: Buscando configurações para store_id:', targetStoreId);
      stableStoreId.current = targetStoreId;

      const { data, error } = await supabase
        .from('store_settings')
        .select('*')
        .eq('store_id', targetStoreId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('useStoreSettings: Erro ao buscar configurações:', error);
        throw error;
      }
      
      // Se não existir configuração, criar uma padrão
      if (!data) {
        console.log('useStoreSettings: Criando configurações padrão');
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

        if (createError) {
          console.error('useStoreSettings: Erro ao criar configurações:', createError);
          throw createError;
        }
        
        console.log('useStoreSettings: Configurações criadas com sucesso');
        setSettings(newSettings);
      } else {
        console.log('useStoreSettings: Configurações encontradas');
        setSettings(data);
      }
      
      hasFetched.current = true;
    } catch (error) {
      console.error('useStoreSettings: Erro geral:', error);
      setSettings(null);
    } finally {
      setLoading(false);
    }
  }, []); // Sem dependências para manter estável

  const updateSettings = useCallback(async (updates: Partial<StoreSettings>) => {
    try {
      if (!settings) {
        console.error('useStoreSettings: Configurações não encontradas para atualizar');
        return { data: null, error: 'Configurações não encontradas' };
      }

      console.log('useStoreSettings: Atualizando configurações:', updates);

      const { data, error } = await supabase
        .from('store_settings')
        .update(updates)
        .eq('id', settings.id)
        .select()
        .single();

      if (error) {
        console.error('useStoreSettings: Erro ao atualizar:', error);
        throw error;
      }
      
      console.log('useStoreSettings: Configurações atualizadas com sucesso');
      setSettings(data);
      return { data, error: null };
    } catch (error) {
      console.error('useStoreSettings: Erro na atualização:', error);
      return { data: null, error };
    }
  }, [settings?.id]); // Apenas o ID como dependência

  // Effect para buscar dados quando store_id mudar
  useEffect(() => {
    if (targetStoreId && targetStoreId !== stableStoreId.current) {
      hasFetched.current = false; // Reset flag quando store_id mudar
      fetchSettings();
    }
  }, [targetStoreId, fetchSettings]);

  return {
    settings,
    loading,
    fetchSettings: () => fetchSettings(true), // Force refresh
    updateSettings
  };
};
