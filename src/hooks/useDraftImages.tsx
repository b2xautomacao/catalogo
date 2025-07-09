
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface DraftImage {
  id: string;
  file?: File;
  preview?: string;
  url?: string;
  uploaded: boolean;
  isExisting: boolean;
  isPrimary: boolean;
  displayOrder: number;
}

export const useDraftImages = () => {
  const [draftImages, setDraftImages] = useState<DraftImage[]>([]);
  const [uploading, setUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Manter compatibilidade com código existente
  const isUploading = uploading;

  const addDraftImage = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const newImage: DraftImage = {
        id: `draft-${Date.now()}-${Math.random()}`,
        file,
        preview: e.target?.result as string,
        uploaded: false,
        isExisting: false,
        isPrimary: draftImages.length === 0,
        displayOrder: draftImages.length,
      };

      setDraftImages(prev => [...prev, newImage]);
    };
    reader.readAsDataURL(file);
  }, [draftImages.length]);

  // Versão plural para compatibilidade
  const addDraftImages = useCallback((files: File[]) => {
    files.forEach(file => addDraftImage(file));
  }, [addDraftImage]);

  const removeDraftImage = useCallback((imageId: string) => {
    setDraftImages(prev => {
      const filtered = prev.filter(img => img.id !== imageId);
      if (prev.find(img => img.id === imageId)?.isPrimary && filtered.length > 0) {
        filtered[0].isPrimary = true;
      }
      return filtered.map((img, index) => ({ ...img, displayOrder: index }));
    });
  }, []);

  const setPrimaryImage = useCallback((imageId: string) => {
    setDraftImages(prev => 
      prev.map(img => ({
        ...img,
        isPrimary: img.id === imageId
      }))
    );
  }, []);

  const reorderImages = useCallback((imageId: string, newIndex: number) => {
    setDraftImages(prev => {
      const currentIndex = prev.findIndex(img => img.id === imageId);
      if (currentIndex === -1) return prev;

      const newArray = [...prev];
      const [movedImage] = newArray.splice(currentIndex, 1);
      newArray.splice(newIndex, 0, movedImage);

      return newArray.map((img, index) => ({ ...img, displayOrder: index }));
    });
  }, []);

  const loadExistingImages = useCallback(async (productId: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('product_images')
        .select('*')
        .eq('product_id', productId)
        .order('display_order');

      if (error) throw error;

      const existingImages: DraftImage[] = data?.map((img, index) => ({
        id: img.id,
        url: img.image_url,
        uploaded: true,
        isExisting: true,
        isPrimary: img.is_primary || index === 0,
        displayOrder: img.display_order || index,
      })) || [];

      setDraftImages(existingImages);
    } catch (error) {
      console.error('Erro ao carregar imagens existentes:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const uploadAllImages = useCallback(async (productId: string): Promise<string[]> => {
    const imagesToUpload = draftImages.filter(img => !img.uploaded && img.file);
    
    if (imagesToUpload.length === 0) {
      return [];
    }

    setUploading(true);
    const uploadedUrls: string[] = [];

    try {
      for (let i = 0; i < imagesToUpload.length; i++) {
        const image = imagesToUpload[i];
        if (!image.file) continue;

        const fileExt = image.file.name.split('.').pop()?.toLowerCase();
        const fileName = `products/${productId}/${Date.now()}-${i}.${fileExt}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('product-images')
          .upload(fileName, image.file, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('product-images')
          .getPublicUrl(fileName);

        const { error: dbError } = await supabase
          .from('product_images')
          .insert({
            product_id: productId,
            image_url: publicUrl,
            display_order: image.displayOrder,
            is_primary: image.isPrimary,
            alt_text: `Produto ${image.displayOrder + 1}`
          });

        if (dbError) throw dbError;

        uploadedUrls.push(publicUrl);

        setDraftImages(prev => 
          prev.map(img => 
            img.id === image.id 
              ? { ...img, uploaded: true, url: publicUrl }
              : img
          )
        );
      }

      toast({
        title: "Imagens enviadas!",
        description: `${uploadedUrls.length} imagem(ns) enviada(s) com sucesso.`,
      });

      return uploadedUrls;
    } catch (error) {
      console.error('Erro no upload das imagens:', error);
      toast({
        title: "Erro no upload",
        description: "Ocorreu um erro ao enviar as imagens",
        variant: "destructive",
      });
      return [];
    } finally {
      setUploading(false);
    }
  }, [draftImages, toast]);

  // Alias para compatibilidade
  const uploadDraftImages = uploadAllImages;

  const clearDraftImages = useCallback(() => {
    setDraftImages([]);
  }, []);

  return {
    draftImages,
    uploading,
    isUploading, // Compatibilidade
    isLoading,
    addDraftImage,
    addDraftImages, // Compatibilidade
    removeDraftImage,
    setPrimaryImage,
    reorderImages,
    loadExistingImages,
    uploadAllImages,
    uploadDraftImages, // Compatibilidade
    clearDraftImages,
  };
};
