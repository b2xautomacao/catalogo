
import { useState, useEffect } from 'react';
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

export const useCatalogSettings = (storeId?: string) => {
  const [settings, setSettings] = useState<CatalogSettingsData | null>(null);
  const [loading, setLoading] = useState(true);
  const { profile } = useAuth();

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const targetStoreId = storeId || profile?.store_id;
      
      if (!targetStoreId) return;

      const { data, error } = await supabase
        .from('store_settings')
        .select('*')
        .eq('store_id', targetStoreId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (!data) {
        // Criar configuração padrão
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
        
        const processedSettings: CatalogSettingsData = {
          ...newSettings,
          payment_methods: newSettings.payment_methods || defaultSettings.payment_methods,
          shipping_options: newSettings.shipping_options || defaultSettings.shipping_options,
        };
        
        setSettings(processedSettings);
      } else {
        const processedSettings: CatalogSettingsData = {
          ...data,
          payment_methods: data.payment_methods ? {
            pix: (data.payment_methods as any)?.pix || false,
            bank_slip: (data.payment_methods as any)?.bank_slip || false,
            credit_card: (data.payment_methods as any)?.credit_card || false,
          } : {
            pix: false,
            bank_slip: false,
            credit_card: false,
          },
          shipping_options: data.shipping_options ? {
            pickup: (data.shipping_options as any)?.pickup || false,
            delivery: (data.shipping_options as any)?.delivery || false,
            shipping: (data.shipping_options as any)?.shipping || false,
          } : {
            pickup: true,
            delivery: false,
            shipping: false,
          },
          template_name: data.template_name || 'default',
          custom_domain: data.custom_domain || null,
          catalog_url_slug: data.catalog_url_slug || null,
          seo_title: data.seo_title || null,
          seo_description: data.seo_description || null,
          seo_keywords: data.seo_keywords || null,
          checkout_type: data.checkout_type || 'both',
          show_prices: data.show_prices !== false,
          show_stock: data.show_stock !== false,
          allow_categories_filter: data.allow_categories_filter !== false,
          allow_price_filter: data.allow_price_filter !== false,
        };

        setSettings(processedSettings);
      }
    } catch (error) {
      console.error('Erro ao buscar configurações:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async (updates: Partial<CatalogSettingsData>) => {
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
        payment_methods: data.payment_methods || settings.payment_methods,
        shipping_options: data.shipping_options || settings.shipping_options,
      };
      
      setSettings(processedSettings);
      return { data: processedSettings, error: null };
    } catch (error) {
      console.error('Erro ao atualizar configurações:', error);
      return { data: null, error };
    }
  };

  useEffect(() => {
    if (profile) {
      fetchSettings();
    }
  }, [profile, storeId]);

  return {
    settings,
    loading,
    fetchSettings,
    updateSettings
  };
};
