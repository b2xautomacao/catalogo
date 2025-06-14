
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface ProductImage {
  id: string;
  product_id: string;
  image_url: string;
  alt_text?: string;
  is_primary: boolean;
  image_order: number;
  variation_id?: string;
}

export const useProductImages = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const uploadImageToStorage = async (file: File, productId: string): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${productId}/${Date.now()}.${fileExt}`;
    
    const { data, error } = await supabase.storage
      .from('product-images')
      .upload(fileName, file);

    if (error) {
      throw new Error(`Erro ao fazer upload: ${error.message}`);
    }

    const { data: { publicUrl } } = supabase.storage
      .from('product-images')
      .getPublicUrl(data.path);

    return publicUrl;
  };

  const createProductImage = async (
    productId: string,
    imageUrl: string,
    isPrimary: boolean = false,
    order: number = 1,
    altText?: string,
    variationId?: string
  ): Promise<ProductImage> => {
    const { data, error } = await supabase
      .from('product_images')
      .insert({
        product_id: productId,
        image_url: imageUrl,
        is_primary: isPrimary,
        image_order: order,
        alt_text: altText,
        variation_id: variationId
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Erro ao salvar imagem: ${error.message}`);
    }

    return data;
  };

  const updateProductMainImage = async (productId: string, imageUrl: string) => {
    const { error } = await supabase
      .from('products')
      .update({ image_url: imageUrl })
      .eq('id', productId);

    if (error) {
      throw new Error(`Erro ao atualizar imagem principal: ${error.message}`);
    }
  };

  const uploadAndSaveImages = async (
    files: File[],
    productId: string
  ): Promise<ProductImage[]> => {
    try {
      setLoading(true);
      setError(null);

      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      const uploadedImages: ProductImage[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const imageUrl = await uploadImageToStorage(file, productId);
        const isPrimary = i === 0; // Primeira imagem é primária
        
        const productImage = await createProductImage(
          productId,
          imageUrl,
          isPrimary,
          i + 1,
          `Imagem ${i + 1} do produto`
        );

        uploadedImages.push(productImage);

        // Se é a primeira imagem, atualizar o campo image_url do produto
        if (isPrimary) {
          await updateProductMainImage(productId, imageUrl);
        }
      }

      return uploadedImages;
    } catch (error) {
      console.error('Erro no upload de imagens:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido ao fazer upload';
      setError(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const getProductImages = async (productId: string): Promise<ProductImage[]> => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('product_images')
        .select('*')
        .eq('product_id', productId)
        .order('image_order');

      if (error) {
        throw new Error(`Erro ao buscar imagens: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('Erro ao buscar imagens:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro ao buscar imagens';
      setError(errorMessage);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const deleteProductImage = async (imageId: string, imageUrl: string) => {
    try {
      setLoading(true);
      setError(null);

      // Extrair o path da URL para deletar do storage
      const url = new URL(imageUrl);
      const pathSegments = url.pathname.split('/');
      const filePath = pathSegments.slice(-2).join('/'); // Pegar últimos 2 segmentos

      // Deletar do storage
      const { error: storageError } = await supabase.storage
        .from('product-images')
        .remove([filePath]);

      if (storageError) {
        console.warn('Erro ao deletar do storage:', storageError);
      }

      // Deletar do banco
      const { error: dbError } = await supabase
        .from('product_images')
        .delete()
        .eq('id', imageId);

      if (dbError) {
        throw new Error(`Erro ao deletar imagem: ${dbError.message}`);
      }
    } catch (error) {
      console.error('Erro ao deletar imagem:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro ao deletar imagem';
      setError(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    uploadAndSaveImages,
    getProductImages,
    deleteProductImage,
    clearError: () => setError(null)
  };
};
