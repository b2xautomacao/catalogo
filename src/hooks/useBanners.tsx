
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export interface Banner {
  id: string;
  store_id: string;
  title: string;
  description?: string;
  image_url: string;
  link_url?: string;
  banner_type: 'hero' | 'category' | 'sidebar' | 'promotional';
  position: number;
  is_active: boolean;
  display_order: number;
  start_date?: string;
  end_date?: string;
  product_id?: string;
  source_type?: 'manual' | 'product';
  created_at: string;
  updated_at: string;
}

export interface BannerCreateData {
  title: string;
  description?: string;
  image_url: string;
  link_url?: string;
  banner_type: Banner['banner_type'];
  position: number;
  display_order: number;
  is_active: boolean;
  start_date?: string;
  end_date?: string;
  product_id?: string;
  source_type?: 'manual' | 'product';
  store_id: string;
}

export const useBanners = (storeId?: string, bannerType?: Banner['banner_type']) => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchBanners = async () => {
    try {
      setLoading(true);
      
      const targetStoreId = storeId || profile?.store_id;
      if (!targetStoreId) return;

      let query = supabase
        .from('catalog_banners')
        .select(`
          *,
          products!left(id, name, image_url, description)
        `)
        .eq('store_id', targetStoreId)
        .eq('is_active', true);

      if (bannerType) {
        query = query.eq('banner_type', bannerType);
      }

      // Filtrar por datas se aplicável
      const now = new Date().toISOString();
      query = query.or(`start_date.is.null,start_date.lte.${now}`)
                   .or(`end_date.is.null,end_date.gte.${now}`);

      query = query.order('display_order').order('created_at');

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching banners:', error);
        return;
      }

      // Processar banners baseados em produtos
      const processedBanners = (data || []).map((banner: any) => {
        if (banner.source_type === 'product' && banner.products) {
          return {
            ...banner,
            title: banner.title || banner.products.name,
            image_url: banner.image_url || banner.products.image_url,
            description: banner.description || banner.products.description,
          };
        }
        return banner;
      });

      setBanners(processedBanners);
    } catch (error) {
      console.error('Error in fetchBanners:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanners();
  }, [storeId, bannerType, profile?.store_id]);

  const createBanner = async (bannerData: BannerCreateData) => {
    try {
      const targetStoreId = bannerData.store_id || profile?.store_id;
      if (!targetStoreId) {
        throw new Error('Store ID não encontrado');
      }

      const { data, error } = await supabase
        .from('catalog_banners')
        .insert({
          ...bannerData,
          store_id: targetStoreId,
        })
        .select()
        .single();

      if (error) throw error;

      await fetchBanners();
      return { data, error: null };
    } catch (error) {
      console.error('Error creating banner:', error);
      return { data: null, error };
    }
  };

  const updateBanner = async (id: string, updates: Partial<BannerCreateData>) => {
    try {
      const { data, error } = await supabase
        .from('catalog_banners')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      await fetchBanners();
      return { data, error: null };
    } catch (error) {
      console.error('Error updating banner:', error);
      return { data: null, error };
    }
  };

  const deleteBanner = async (id: string) => {
    try {
      const { error } = await supabase
        .from('catalog_banners')
        .delete()
        .eq('id', id);

      if (error) throw error;

      await fetchBanners();
      return { error: null };
    } catch (error) {
      console.error('Error deleting banner:', error);
      return { error };
    }
  };

  return {
    banners,
    loading,
    createBanner,
    updateBanner,
    deleteBanner,
    refetch: fetchBanners,
  };
};
