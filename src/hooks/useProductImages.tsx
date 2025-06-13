
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ProductImage {
  id: string;
  product_id: string;
  variation_id: string | null;
  image_url: string;
  image_order: number;
  alt_text: string | null;
  is_primary: boolean;
  created_at: string;
}

export interface CreateImageData {
  product_id: string;
  variation_id?: string;
  image_url: string;
  image_order: number;
  alt_text?: string;
  is_primary?: boolean;
}

export const useProductImages = (productId?: string) => {
  const [images, setImages] = useState<ProductImage[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchImages = async () => {
    if (!productId) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('product_images')
        .select('*')
        .eq('product_id', productId)
        .order('image_order', { ascending: true });

      if (error) throw error;
      setImages(data || []);
    } catch (error) {
      console.error('Erro ao buscar imagens:', error);
    } finally {
      setLoading(false);
    }
  };

  const uploadImage = async (file: File, productId: string, imageOrder: number = 1) => {
    try {
      // Verificar se o bucket existe, se não, criar
      const { data: buckets } = await supabase.storage.listBuckets();
      const productImagesBucket = buckets?.find(bucket => bucket.name === 'product-images');
      
      if (!productImagesBucket) {
        await supabase.storage.createBucket('product-images', { public: true });
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${productId}/${Date.now()}.${fileExt}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(fileName);

      const imageData: CreateImageData = {
        product_id: productId,
        image_url: publicUrl,
        image_order: imageOrder,
        is_primary: imageOrder === 1
      };

      const { data, error } = await supabase
        .from('product_images')
        .insert([imageData])
        .select()
        .single();

      if (error) throw error;
      await fetchImages();
      return { data, error: null };
    } catch (error) {
      console.error('Erro ao fazer upload da imagem:', error);
      return { data: null, error };
    }
  };

  const deleteImage = async (id: string) => {
    try {
      // Buscar a imagem para obter a URL
      const { data: imageData } = await supabase
        .from('product_images')
        .select('image_url')
        .eq('id', id)
        .single();

      if (imageData?.image_url) {
        // Extrair o path da URL para deletar do storage
        const urlParts = imageData.image_url.split('/');
        const fileName = urlParts.slice(-2).join('/'); // produto_id/arquivo.ext
        
        await supabase.storage
          .from('product-images')
          .remove([fileName]);
      }

      const { error } = await supabase
        .from('product_images')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await fetchImages();
      return { error: null };
    } catch (error) {
      console.error('Erro ao deletar imagem:', error);
      return { error };
    }
  };

  useEffect(() => {
    if (productId) {
      fetchImages();
    }
  }, [productId]);

  return {
    images,
    loading,
    fetchImages,
    uploadImage,
    deleteImage
  };
};
