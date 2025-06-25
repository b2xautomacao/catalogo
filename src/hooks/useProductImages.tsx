
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ProductImage {
  id: string;
  product_id: string;
  image_url: string;
  image_order: number;
  is_primary: boolean;
  alt_text?: string;
  variation_id?: string;
}

export const useProductImages = (productId?: string) => {
  const [images, setImages] = useState<ProductImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchImages = async (id: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error: fetchError } = await supabase
        .from('product_images')
        .select('*')
        .eq('product_id', id)
        .order('image_order');

      if (fetchError) {
        throw fetchError;
      }

      setImages(data || []);
    } catch (err) {
      console.error('Erro ao buscar imagens do produto:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      setImages([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (productId) {
      fetchImages(productId);
    } else {
      setImages([]);
    }
  }, [productId]);

  const primaryImage = images.find(img => img.is_primary);
  const secondaryImages = images.filter(img => !img.is_primary);

  return {
    images,
    primaryImage,
    secondaryImages,
    loading,
    error,
    refetchImages: () => productId && fetchImages(productId)
  };
};
