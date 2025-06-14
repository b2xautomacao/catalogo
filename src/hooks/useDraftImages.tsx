import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface DraftImage {
  id: string;
  url: string;
  file: File;
  uploaded: boolean;
}

export const useDraftImages = () => {
  const [draftImages, setDraftImages] = useState<DraftImage[]>([]);
  const [uploading, setUploading] = useState(false);

  const addDraftImage = (file: File) => {
    const id = Math.random().toString(36).substr(2, 9);
    const url = URL.createObjectURL(file);
    
    const newImage: DraftImage = {
      id,
      url,
      file,
      uploaded: false
    };

    setDraftImages(prev => [...prev, newImage]);
    return id;
  };

  const addDraftImages = (files: File[]) => {
    const newImages = files.map(file => {
      const id = Math.random().toString(36).substr(2, 9);
      const url = URL.createObjectURL(file);
      
      return {
        id,
        url,
        file,
        uploaded: false
      };
    });

    setDraftImages(prev => [...prev, ...newImages]);
    return newImages.map(img => img.id);
  };

  const removeDraftImage = (index: number) => {
    setDraftImages(prev => {
      const imageToRemove = prev[index];
      if (imageToRemove && !imageToRemove.uploaded) {
        URL.revokeObjectURL(imageToRemove.url);
      }
      return prev.filter((_, i) => i !== index);
    });
  };

  const uploadDraftImages = async (productId?: string) => {
    if (draftImages.length === 0) return { success: true, urls: [] };

    setUploading(true);
    const uploadedUrls: string[] = [];
    const tempProductId = productId || `temp_${Date.now()}`;
    
    try {
      for (let i = 0; i < draftImages.length; i++) {
        const image = draftImages[i];
        
        const fileExt = image.file.name.split('.').pop()?.toLowerCase();
        const fileName = `${tempProductId}/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
        
        console.log('Fazendo upload da imagem:', fileName);

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('product-images')
          .upload(fileName, image.file, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) {
          console.error('Erro no upload:', uploadError);
          continue;
        }

        console.log('Upload bem-sucedido:', uploadData);

        const { data: { publicUrl } } = supabase.storage
          .from('product-images')
          .getPublicUrl(fileName);

        console.log('URL pública gerada:', publicUrl);

        if (productId) {
          console.log('Salvando imagem no banco para produto:', productId);
          const { error: dbError } = await supabase
            .from('product_images')
            .insert({
              product_id: productId,
              image_url: publicUrl,
              image_order: i + 1,
              is_primary: i === 0,
              alt_text: image.file.name
            });

          if (dbError) {
            console.error('Erro ao salvar no banco:', dbError);
            continue;
          }
        }

        uploadedUrls.push(publicUrl);
        
        // Atualizar estado para marcar como enviado
        setDraftImages(prev => 
          prev.map(img => 
            img.id === image.id 
              ? { ...img, uploaded: true, url: publicUrl }
              : img
          )
        );
      }

      console.log('Upload concluído. URLs:', uploadedUrls);
      return { success: true, urls: uploadedUrls };
    } catch (error) {
      console.error('Erro no upload das imagens:', error);
      return { success: false, urls: [] };
    } finally {
      setUploading(false);
    }
  };

  const clearDraftImages = () => {
    draftImages.forEach(image => {
      if (!image.uploaded) {
        URL.revokeObjectURL(image.url);
      }
    });
    setDraftImages([]);
  };

  return {
    draftImages,
    uploading,
    addDraftImage,
    addDraftImages,
    removeDraftImage,
    uploadDraftImages,
    clearDraftImages
  };
};
