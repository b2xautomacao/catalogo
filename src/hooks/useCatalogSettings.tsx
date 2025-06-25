
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface CatalogSettingsData {
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
