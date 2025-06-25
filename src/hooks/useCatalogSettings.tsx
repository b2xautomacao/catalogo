
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface CatalogSettingsData {
  store_id?: string;
  template_name?: string;
  show_prices?: boolean;
  show_stock?: boolean;
  allow_categories_filter?: boolean;
  allow_price_filter?: boolean;
  seo_title?: string;
  seo_description?: string;
  seo_keywords?: string;
  primary_color?: string;
  secondary_color?: string;
  accent_color?: string;
  background_color?: string;
  text_color?: string;
  border_color?: string;
  mobile_columns?: number;
  catalog_mode?: string;
  custom_domain?: string;
  catalog_url_slug?: string;
  checkout_type?: string;
  payment_methods?: any;
  business_hours?: any;
  shipping_options?: any;
  facebook_url?: string;
  instagram_url?: string;
  twitter_url?: string;
  whatsapp_number?: string;
  whatsapp_integration_active?: boolean;
  font_family?: string;
  layout_spacing?: number;
  border_radius?: number;
  retail_catalog_active?: boolean;
  wholesale_catalog_active?: boolean;
  watermark_enabled?: boolean;
  watermark_type?: string;
  watermark_text?: string;
  watermark_logo_url?: string;
  watermark_position?: string;
  watermark_opacity?: number;
  watermark_size?: number;
  watermark_color?: string;
}

export const useCatalogSettings = (storeIdentifier?: string) => {
  const { profile } = useAuth();
  const [settings, setSettings] = useState<CatalogSettingsData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      
      let storeId = storeIdentifier;
      
      if (!storeId && profile?.store_id) {
        storeId = profile.store_id;
      }

      if (!storeId) {
        console.log('No store ID available for settings');
        setSettings({});
        return;
      }

      const { data, error } = await supabase
        .from('store_settings')
        .select('*')
        .eq('store_id', storeId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching catalog settings:', error);
        setSettings({});
        return;
      }

      if (data) {
        setSettings({
          store_id: data.store_id,
          template_name: data.template_name,
          show_prices: data.show_prices,
          show_stock: data.show_stock,
          allow_categories_filter: data.allow_categories_filter,
          allow_price_filter: data.allow_price_filter,
          seo_title: data.seo_title,
          seo_description: data.seo_description,
          seo_keywords: data.seo_keywords,
          primary_color: data.primary_color,
          secondary_color: data.secondary_color,
          accent_color: data.accent_color,
          background_color: data.background_color,
          text_color: data.text_color,
          border_color: data.border_color,
          mobile_columns: data.mobile_columns,
          catalog_mode: data.catalog_mode,
          custom_domain: data.custom_domain,
          catalog_url_slug: data.catalog_url_slug,
          checkout_type: data.checkout_type,
          payment_methods: data.payment_methods,
          business_hours: data.business_hours,
          shipping_options: data.shipping_options,
          facebook_url: data.facebook_url,
          instagram_url: data.instagram_url,
          twitter_url: data.twitter_url,
          whatsapp_number: data.whatsapp_number,
          whatsapp_integration_active: data.whatsapp_integration_active,
          font_family: data.font_family,
          layout_spacing: data.layout_spacing,
          border_radius: data.border_radius,
          retail_catalog_active: data.retail_catalog_active,
          wholesale_catalog_active: data.wholesale_catalog_active,
          watermark_enabled: data.watermark_enabled,
          watermark_type: data.watermark_type,
          watermark_text: data.watermark_text,
          watermark_logo_url: data.watermark_logo_url,
          watermark_position: data.watermark_position,
          watermark_opacity: data.watermark_opacity,
          watermark_size: data.watermark_size,
          watermark_color: data.watermark_color,
        });
      } else {
        setSettings({});
      }
    } catch (error) {
      console.error('Error in fetchSettings:', error);
      setSettings({});
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, [profile?.store_id, storeIdentifier]);

  const updateSettings = async (updates: Partial<CatalogSettingsData>) => {
    try {
      let storeId = storeIdentifier;
      
      if (!storeId && profile?.store_id) {
        storeId = profile.store_id;
      }

      if (!storeId) {
        throw new Error('No store ID available');
      }

      const { data, error } = await supabase
        .from('store_settings')
        .upsert({
          store_id: storeId,
          ...updates
        }, {
          onConflict: 'store_id'
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      await fetchSettings();
      return { data, error: null };
    } catch (error) {
      console.error('Error updating settings:', error);
      return { data: null, error };
    }
  };

  return {
    settings,
    loading,
    updateSettings,
    refetch: fetchSettings
  };
};
