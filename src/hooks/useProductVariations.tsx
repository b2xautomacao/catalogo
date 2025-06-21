
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ProductVariation {
  id: string;
  product_id: string;
  color: string | null;
  size: string | null;
  sku: string | null;
  stock: number;
  price_adjustment: number | null;
  is_active: boolean;
  image_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateVariationData {
  product_id: string;
  color?: string;
  size?: string;
  sku?: string;
  stock: number;
  price_adjustment?: number;
  is_active?: boolean;
  image_url?: string;
}

export const useProductVariations = (productId?: string) => {
  const [variations, setVariations] = useState<ProductVariation[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchVariations = async () => {
    if (!productId) {
      setVariations([]);
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      console.log('🔍 Buscando variações para produto:', productId);
      
      const { data, error } = await supabase
        .from('product_variations')
        .select('*')
        .eq('product_id', productId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Erro ao buscar variações:', error);
        throw error;
      }
      
      console.log('✅ Variações encontradas:', data?.length || 0);
      
      // Garantir que todos os campos obrigatórios estejam presentes
      const processedVariations = (data || []).map(variation => ({
        ...variation,
        image_url: variation.image_url || null,
        color: variation.color || null,
        size: variation.size || null,
        sku: variation.sku || null,
        price_adjustment: variation.price_adjustment || null,
      }));
      
      setVariations(processedVariations);
    } catch (error) {
      console.error('🚨 Erro ao buscar variações:', error);
      setVariations([]);
    } finally {
      setLoading(false);
    }
  };

  const uploadVariationImage = async (file: File, variationId: string): Promise<string | null> => {
    try {
      console.log('📤 Fazendo upload da imagem da variação:', variationId);
      
      const fileExt = file.name.split('.').pop()?.toLowerCase();
      const fileName = `variations/${variationId}/${Date.now()}.${fileExt}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('❌ Erro no upload:', uploadError);
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(fileName);

      console.log('✅ Upload concluído:', publicUrl);
      return publicUrl;
    } catch (error) {
      console.error('🚨 Erro no upload da imagem da variação:', error);
      return null;
    }
  };

  const createVariation = async (variationData: CreateVariationData & { image_file?: File }) => {
    try {
      console.log('➕ Criando variação:', variationData);
      
      const { image_file, ...cleanData } = variationData;
      let imageUrl = cleanData.image_url;

      const { data, error } = await supabase
        .from('product_variations')
        .insert([cleanData])
        .select()
        .single();

      if (error) {
        console.error('❌ Erro ao criar variação:', error);
        throw error;
      }

      // Se há arquivo de imagem, fazer upload
      if (image_file && data.id) {
        console.log('📤 Fazendo upload da imagem...');
        imageUrl = await uploadVariationImage(image_file, data.id);
        
        if (imageUrl) {
          // Atualizar variação com URL da imagem
          const { error: updateError } = await supabase
            .from('product_variations')
            .update({ image_url: imageUrl })
            .eq('id', data.id);

          if (updateError) {
            console.error('❌ Erro ao atualizar URL da imagem:', updateError);
          }
        }
      }

      await fetchVariations();
      console.log('✅ Variação criada com sucesso:', data.id);
      return { data: { ...data, image_url: imageUrl }, error: null };
    } catch (error) {
      console.error('🚨 Erro ao criar variação:', error);
      return { data: null, error };
    }
  };

  const updateVariation = async (id: string, updates: Partial<CreateVariationData> & { image_file?: File }) => {
    try {
      console.log('✏️ Atualizando variação:', id, updates);
      
      const { image_file, ...cleanUpdates } = updates;
      let imageUrl = cleanUpdates.image_url;

      // Se há arquivo de imagem, fazer upload
      if (image_file) {
        console.log('📤 Fazendo upload da nova imagem...');
        imageUrl = await uploadVariationImage(image_file, id);
        if (imageUrl) {
          cleanUpdates.image_url = imageUrl;
        }
      }

      const { data, error } = await supabase
        .from('product_variations')
        .update(cleanUpdates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('❌ Erro ao atualizar variação:', error);
        throw error;
      }

      await fetchVariations();
      console.log('✅ Variação atualizada com sucesso:', id);
      return { data, error: null };
    } catch (error) {
      console.error('🚨 Erro ao atualizar variação:', error);
      return { data: null, error };
    }
  };

  const deleteVariation = async (id: string) => {
    try {
      console.log('🗑️ Deletando variação:', id);
      
      const { error } = await supabase
        .from('product_variations')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('❌ Erro ao deletar variação:', error);
        throw error;
      }

      await fetchVariations();
      console.log('✅ Variação deletada com sucesso:', id);
      return { error: null };
    } catch (error) {
      console.error('🚨 Erro ao deletar variação:', error);
      return { error };
    }
  };

  useEffect(() => {
    if (productId) {
      fetchVariations();
    } else {
      setVariations([]);
      setLoading(false);
    }
  }, [productId]);

  return {
    variations,
    loading,
    fetchVariations,
    createVariation,
    updateVariation,
    deleteVariation
  };
};
