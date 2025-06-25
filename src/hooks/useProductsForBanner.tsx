
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface ProductOption {
  id: string;
  name: string;
  image_url?: string;
  description?: string;
  retail_price: number;
  category?: string;
}

export const useProductsForBanner = () => {
  const { profile } = useAuth();
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchProducts = async () => {
    if (!profile?.store_id) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select('id, name, image_url, description, retail_price, category')
        .eq('store_id', profile.store_id)
        .eq('is_active', true)
        .order('name');

      if (error) {
        console.error('Error fetching products for banner:', error);
        return;
      }

      setProducts(data || []);
    } catch (error) {
      console.error('Error in fetchProducts:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [profile?.store_id]);

  return {
    products,
    loading,
    refetch: fetchProducts
  };
};
