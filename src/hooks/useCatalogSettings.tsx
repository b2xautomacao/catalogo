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
    mercadopago_access_token?: string;
    mercadopago_public_key?: string;
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
  facebook_url: string | null;
  instagram_url: string | null;
  twitter_url: string | null;
  catalog_mode: 'separated' | 'hybrid' | 'toggle';
  // Configurações de marca d'água
  watermark_enabled: boolean;
  watermark_type: 'text' | 'logo';
  watermark_text: string;
  watermark_logo_url: string | null;
  watermark_position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
  watermark_opacity: number;
  watermark_size: number;
  watermark_color: string;
  created_at: string;
  updated_at: string;
}

export const useCatalogSettings = (storeIdentifier?: string) => {
  const [settings, setSettings] = useState<CatalogSettingsData | null>(null);
  const [loading, setLoading] = useState(true);
  const { profile } = useAuth();
  
  const cacheRef = useRef<Map<string, { data: CatalogSettingsData; timestamp: number }>>(new Map());
  const isFetchingRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchStoreIdByIdentifier = useCallback(async (identifier: string): Promise<string | null> => {
    try {
      console.log('useCatalogSettings: Resolvendo store ID para:', identifier);
      
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      
      if (uuidRegex.test(identifier)) {
        const { data, error } = await supabase
          .from('stores')
          .select('id')
          .eq('id', identifier)
          .eq('is_active', true)
          .maybeSingle();
        
        if (error) throw error;
        return data?.id || null;
      } else {
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
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    if (isFetchingRef.current) return;
    
    try {
      setLoading(true);
      isFetchingRef.current = true;
      
      abortControllerRef.current = new AbortController();
      
      let targetStoreId: string | null = null;

      if (storeIdentifier) {
        targetStoreId = await fetchStoreIdByIdentifier(storeIdentifier);
      } else {
        targetStoreId = profile?.store_id || null;
      }
      
      if (!targetStoreId) {
        console.log('useCatalogSettings: Nenhum store_id disponível');
        setSettings(null);
        return;
      }

      const cached = cacheRef.current.get(targetStoreId);
      if (cached && Date.now() - cached.timestamp < 300000) {
        console.log('useCatalogSettings: Usando cache para store ID:', targetStoreId);
        setSettings(cached.data);
        return;
      }

      console.log('useCatalogSettings: Buscando configurações para store ID:', targetStoreId);

      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout: Busca de configurações demorou mais de 8 segundos')), 8000)
      );

      const fetchPromise = supabase
        .from('store_settings')
        .select('*')
        .eq('store_id', targetStoreId)
        .maybeSingle();

      const { data, error } = await Promise.race([fetchPromise, timeoutPromise]) as any;

      if (abortControllerRef.current?.signal.aborted) {
        console.log('useCatalogSettings: Request cancelado');
        return;
      }

      if (error && error.code !== 'PGRST116') throw error;
      
      let processedSettings: CatalogSettingsData;
      
      if (!data) {
        if (!profile) {
          console.log('useCatalogSettings: Configurações não encontradas e usuário não logado');
          setSettings(null);
          return;
        }

        console.log('useCatalogSettings: Criando configurações padrão para store:', targetStoreId);

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
          facebook_url: null,
          instagram_url: null,
          twitter_url: null,
          catalog_mode: 'separated' as const,
          watermark_enabled: false,
          watermark_type: 'text' as const,
          watermark_text: 'Minha Loja',
          watermark_logo_url: null,
          watermark_position: 'bottom-right' as const,
          watermark_opacity: 0.7,
          watermark_size: 24,
          watermark_color: '#ffffff',
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
          facebook_url: null,
          instagram_url: null,
          twitter_url: null,
          catalog_mode: 'separated' as const,
          watermark_enabled: false,
          watermark_type: 'text' as const,
          watermark_text: 'Minha Loja',
          watermark_logo_url: null,
          watermark_position: 'bottom-right' as const,
          watermark_opacity: 0.7,
          watermark_size: 24,
          watermark_color: '#ffffff',
        };
      } else {
        const existingPaymentMethods = typeof data.payment_methods === 'object' && data.payment_methods !== null 
          ? data.payment_methods as any 
          : {};

        processedSettings = {
          ...data,
          payment_methods: {
            pix: existingPaymentMethods?.pix || false,
            bank_slip: existingPaymentMethods?.bank_slip || false,
            credit_card: existingPaymentMethods?.credit_card || false,
            mercadopago_access_token: existingPaymentMethods?.mercadopago_access_token || undefined,
            mercadopago_public_key: existingPaymentMethods?.mercadopago_public_key || undefined,
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
          facebook_url: data.facebook_url || null,
          instagram_url: data.instagram_url || null,
          twitter_url: data.twitter_url || null,
          catalog_mode: (['separated', 'hybrid', 'toggle'].includes(data.catalog_mode)) ? 
            data.catalog_mode as 'separated' | 'hybrid' | 'toggle' : 'separated',
          watermark_enabled: data.watermark_enabled || false,
          watermark_type: (data.watermark_type === 'logo' ? 'logo' : 'text') as 'text' | 'logo',
          watermark_text: data.watermark_text || 'Minha Loja',
          watermark_logo_url: data.watermark_logo_url || null,
          watermark_position: (['top-left', 'top-right', 'bottom-left', 'bottom-right', 'center'].includes(data.watermark_position)) 
            ? data.watermark_position as 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center'
            : 'bottom-right',
          watermark_opacity: data.watermark_opacity || 0.7,
          watermark_size: data.watermark_size || 24,
          watermark_color: data.watermark_color || '#ffffff',
        };
      }

      cacheRef.current.set(targetStoreId, {
        data: processedSettings,
        timestamp: Date.now()
      });
      
      setSettings(processedSettings);
      console.log('useCatalogSettings: Configurações carregadas com sucesso');
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('useCatalogSettings: Request abortado');
        return;
      }
      console.error('useCatalogSettings: Erro ao buscar configurações:', error);
      setSettings(null);
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
      abortControllerRef.current = null;
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
      
      const updatedPaymentMethods = typeof data.payment_methods === 'object' && data.payment_methods !== null 
        ? data.payment_methods as any 
        : settings.payment_methods;

      const processedSettings: CatalogSettingsData = {
        ...data,
        payment_methods: {
          pix: updatedPaymentMethods?.pix || false,
          bank_slip: updatedPaymentMethods?.bank_slip || false,
          credit_card: updatedPaymentMethods?.credit_card || false,
          mercadopago_access_token: updatedPaymentMethods?.mercadopago_access_token || undefined,
          mercadopago_public_key: updatedPaymentMethods?.mercadopago_public_key || undefined,
        },
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
        facebook_url: data.facebook_url || null,
        instagram_url: data.instagram_url || null,
        twitter_url: data.twitter_url || null,
        catalog_mode: (['separated', 'hybrid', 'toggle'].includes(data.catalog_mode)) ? 
          data.catalog_mode as 'separated' | 'hybrid' | 'toggle' : 'separated',
        watermark_enabled: data.watermark_enabled || false,
        watermark_type: (data.watermark_type === 'logo' ? 'logo' : 'text') as 'text' | 'logo',
        watermark_text: data.watermark_text || 'Minha Loja',
        watermark_logo_url: data.watermark_logo_url || null,
        watermark_position: (['top-left', 'top-right', 'bottom-left', 'bottom-right', 'center'].includes(data.watermark_position)) 
          ? data.watermark_position as 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center'
          : 'bottom-right',
        watermark_opacity: data.watermark_opacity || 0.7,
        watermark_size: data.watermark_size || 24,
        watermark_color: data.watermark_color || '#ffffff',
      };
      
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
    
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchSettings]);

  return {
    settings,
    loading,
    fetchSettings,
    updateSettings
  };
};
