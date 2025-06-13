
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
  
  // Cache para evitar requests repetidos
  const cacheRef = useRef<Map<string, { data: StoreSettings; timestamp: number }>>(new Map());
  const lastStoreIdRef = useRef<string | null>(null);
  const isFetchingRef = useRef(false);
  
  const targetStoreId = storeId || profile?.store_id;

  // Função de fetch com cache e throttling
  const fetchSettings = useCallback(async (forceRefresh = false) => {
    if (!targetStoreId) {
      console.log('useStoreSettings: Nenhum store_id disponível');
      setSettings(null);
      setLoading(false);
      return;
    }

    // Verificar cache (válido por 5 minutos)
    const cached = cacheRef.current.get(targetStoreId);
    const now = Date.now();
    if (!forceRefresh && cached && now - cached.timestamp < 300000) {
      console.log('useStoreSettings: Usando dados do cache');
      setSettings(cached.data);
      setLoading(false);
      return;
    }

    // Evitar requests simultâneos
    if (isFetchingRef.current) {
      console.log('useStoreSettings: Request já em andamento');
      return;
    }

    try {
      setLoading(true);
      isFetchingRef.current = true;
      
      console.log('useStoreSettings: Buscando configurações para store_id:', targetStoreId);

      const { data, error } = await supabase
        .from('store_settings')
        .select('*')
        .eq('store_id', targetStoreId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('useStoreSettings: Erro ao buscar configurações:', error);
        throw error;
      }
      
      let finalData = data;
      
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
        
        finalData = newSettings;
      }

      // Atualizar cache
      cacheRef.current.set(targetStoreId, {
        data: finalData,
        timestamp: now
      });
      
      setSettings(finalData);
      lastStoreIdRef.current = targetStoreId;
      
    } catch (error) {
      console.error('useStoreSettings: Erro geral:', error);
      setSettings(null);
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  }, [targetStoreId]); // APENAS targetStoreId como dependência

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
      
      // Atualizar cache
      if (targetStoreId) {
        cacheRef.current.set(targetStoreId, {
          data,
          timestamp: Date.now()
        });
      }
      
      setSettings(data);
      return { data, error: null };
    } catch (error) {
      console.error('useStoreSettings: Erro na atualização:', error);
      return { data: null, error };
    }
  }, [settings, targetStoreId]);

  // Effect simplificado - SEM fetchSettings nas dependências
  useEffect(() => {
    // Apenas buscar se mudou o store_id ou é a primeira vez
    if (targetStoreId !== lastStoreIdRef.current) {
      console.log('useStoreSettings: Store ID mudou, fazendo fetch');
      fetchSettings();
    }
  }, [targetStoreId]); // APENAS targetStoreId

  return {
    settings,
    loading,
    fetchSettings: () => fetchSettings(true),
    updateSettings
  };
};
