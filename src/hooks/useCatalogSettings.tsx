
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface CatalogSettingsData {
  id: string;
  store_id: string;
  retail_catalog_active: boolean;
  wholesale_catalog_active: boolean;
  whatsapp_number: string | null;
  whatsapp_integration_active: boolean;
  payment_methods: {
    pix: boolean;
    bank_slip: boolean;
    credit_card: boolean;
  };
  shipping_options: {
    pickup: boolean;
    delivery: boolean;
    shipping: boolean;
  };
  business_hours: any;
  template_name: string;
  custom_domain: string | null;
  catalog_url_slug: string | null;
  seo_title: string | null;
  seo_description: string | null;
  seo_keywords: string | null;
  checkout_type: 'whatsapp' | 'online' | 'both';
  show_prices: boolean;
  show_stock: boolean;
  allow_categories_filter: boolean;
  allow_price_filter: boolean;
  created_at: string;
  updated_at: string;
}

export const useCatalogSettings = (storeIdentifier?: string) => {
  const [settings, setSettings] = useState<CatalogSettingsData | null>(null);
  const [loading, setLoading] = useState(true);
  const { profile } = useAuth();
  
  // Cache para evitar requests repetidos
  const cacheRef = useRef<Map<string, { data: CatalogSettingsData; timestamp: number }>>(new Map());
  const isFetchingRef = useRef(false);

  const fetchStoreIdByIdentifier = useCallback(async (identifier: string): Promise<string | null> => {
    try {
      // Verificar se é UUID
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      
      if (uuidRegex.test(identifier)) {
        // É UUID, buscar diretamente
        const { data, error } = await supabase
          .from('stores')
          .select('id')
          .eq('id', identifier)
          .eq('is_active', true)
          .maybeSingle();
        
        if (error) throw error;
        return data?.id || null;
      } else {
        // É slug, buscar por url_slug
        const { data, error } = await supabase
          .from('stores')
          .select('id')
          .eq('url_slug', identifier)
          .eq('is_active', true)
          .maybeSingle();

        if (error) throw error;
        return data?.id || null;
      }
    } catch (error) {
      console.error('useCatalogSettings: Erro ao buscar ID da loja:', error);
      return null;
    }
  }, []);

  const fetchSettings = useCallback(async () => {
    if (isFetchingRef.current) return;
    
    try {
      setLoading(true);
      isFetchingRef.current = true;
      
      let targetStoreId: string | null = null;

      if (storeIdentifier) {
        targetStoreId = await fetchStoreIdByIdentifier(storeIdentifier);
      } else {
        targetStoreId = profile?.store_id || null;
      }
      
      if (!targetStoreId) {
        console.log('useCatalogSettings: Nenhum store_id disponível');
        return;
      }

      // Verificar cache
      const cached = cacheRef.current.get(targetStoreId);
      if (cached && Date.now() - cached.timestamp < 300000) {
        console.log('useCatalogSettings: Usando cache');
        setSettings(cached.data);
        return;
      }

      console.log('useCatalogSettings: Buscando configurações para store ID:', targetStoreId);

      const { data, error } = await supabase
        .from('store_settings')
        .select('*')
        .eq('store_id', targetStoreId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;
      
      let processedSettings: CatalogSettingsData;
      
      if (!data) {
        // Criar configuração padrão apenas se usuário estiver logado
        if (!profile) {
          console.log('useCatalogSettings: Configurações não encontradas e usuário não logado');
          return;
        }

        const defaultSettings = {
          store_id: targetStoreId,
          retail_catalog_active: true,
          wholesale_catalog_active: false,
          whatsapp_integration_active: false,
          payment_methods: {
            pix: false,
            bank_slip: false,
            credit_card: false,
          },
          shipping_options: {
            pickup: true,
            delivery: false,
            shipping: false,
          },
          business_hours: {},
          template_name: 'default',
          custom_domain: null,
          catalog_url_slug: null,
          seo_title: null,
          seo_description: null,
          seo_keywords: null,
          checkout_type: 'both' as const,
          show_prices: true,
          show_stock: true,
          allow_categories_filter: true,
          allow_price_filter: true,
        };

        const { data: newSettings, error: createError } = await supabase
          .from('store_settings')
          .insert([defaultSettings])
          .select()
          .single();

        if (createError) throw createError;
        
        processedSettings = {
          ...newSettings,
          payment_methods: defaultSettings.payment_methods,
          shipping_options: defaultSettings.shipping_options,
          template_name: 'default',
          checkout_type: 'both' as const,
          show_prices: true,
          show_stock: true,
          allow_categories_filter: true,
          allow_price_filter: true,
        };
      } else {
        processedSettings = {
          ...data,
          payment_methods: typeof data.payment_methods === 'object' && data.payment_methods !== null ? {
            pix: (data.payment_methods as any)?.pix || false,
            bank_slip: (data.payment_methods as any)?.bank_slip || false,
            credit_card: (data.payment_methods as any)?.credit_card || false,
          } : {
            pix: false,
            bank_slip: false,
            credit_card: false,
          },
          shipping_options: typeof data.shipping_options === 'object' && data.shipping_options !== null ? {
            pickup: (data.shipping_options as any)?.pickup || false,
            delivery: (data.shipping_options as any)?.delivery || false,
            shipping: (data.shipping_options as any)?.shipping || false,
          } : {
            pickup: true,
            delivery: false,
            shipping: false,
          },
          template_name: data.template_name || 'default',
          checkout_type: (['whatsapp', 'online', 'both'].includes(data.checkout_type)) ? 
            data.checkout_type as 'whatsapp' | 'online' | 'both' : 'both',
          show_prices: data.show_prices !== false,
          show_stock: data.show_stock !== false,
          allow_categories_filter: data.allow_categories_filter !== false,
          allow_price_filter: data.allow_price_filter !== false,
        };
      }

      // Atualizar cache
      cacheRef.current.set(targetStoreId, {
        data: processedSettings,
        timestamp: Date.now()
      });
      
      setSettings(processedSettings);
    } catch (error) {
      console.error('useCatalogSettings: Erro ao buscar configurações:', error);
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  }, [storeIdentifier, profile, fetchStoreIdByIdentifier]);

  const updateSettings = useCallback(async (updates: Partial<CatalogSettingsData>) => {
    try {
      if (!settings) return { data: null, error: 'Configurações não encontradas' };

      const { data, error } = await supabase
        .from('store_settings')
        .update(updates)
        .eq('id', settings.id)
        .select()
        .single();

      if (error) throw error;
      
      const processedSettings: CatalogSettingsData = {
        ...data,
        payment_methods: typeof data.payment_methods === 'object' && data.payment_methods !== null ? {
          pix: (data.payment_methods as any)?.pix || false,
          bank_slip: (data.payment_methods as any)?.bank_slip || false,
          credit_card: (data.payment_methods as any)?.credit_card || false,
        } : settings.payment_methods,
        shipping_options: typeof data.shipping_options === 'object' && data.shipping_options !== null ? {
          pickup: (data.shipping_options as any)?.pickup || false,
          delivery: (data.shipping_options as any)?.delivery || false,
          shipping: (data.shipping_options as any)?.shipping || false,
        } : settings.shipping_options,
        template_name: data.template_name || 'default',
        checkout_type: (['whatsapp', 'online', 'both'].includes(data.checkout_type)) ? 
          data.checkout_type as 'whatsapp' | 'online' | 'both' : 'both',
        show_prices: data.show_prices !== false,
        show_stock: data.show_stock !== false,
        allow_categories_filter: data.allow_categories_filter !== false,
        allow_price_filter: data.allow_price_filter !== false,
      };
      
      // Atualizar cache
      if (settings.store_id) {
        cacheRef.current.set(settings.store_id, {
          data: processedSettings,
          timestamp: Date.now()
        });
      }
      
      setSettings(processedSettings);
      return { data: processedSettings, error: null };
    } catch (error) {
      console.error('useCatalogSettings: Erro ao atualizar configurações:', error);
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
