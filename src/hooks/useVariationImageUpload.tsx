
import { supabase } from '@/integrations/supabase/client';

export interface VariationImageUploadResult {
  success: boolean;
  imageUrl?: string;
  error?: string;
}

export const useVariationImageUpload = () => {
  const uploadVariationImage = async (
    file: File, 
    variationId: string
  ): Promise<VariationImageUploadResult> => {
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
        return { success: false, error: uploadError.message };
      }

      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(fileName);

      console.log('✅ Upload concluído:', publicUrl);
      return { success: true, imageUrl: publicUrl };
    } catch (error) {
      console.error('🚨 Erro inesperado no upload:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro desconhecido' 
      };
    }
  };

  return { uploadVariationImage };
};
