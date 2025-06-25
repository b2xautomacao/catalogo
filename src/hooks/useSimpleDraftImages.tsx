
import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface SimpleDraftImage {
  id: string;
  file?: File;
  preview: string;
  uploaded?: boolean;
  url?: string;
  isExisting?: boolean;
}

export const useSimpleDraftImages = () => {
  const [images, setImages] = useState<SimpleDraftImage[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const blobUrlsRef = useRef<Set<string>>(new Set());
  const { toast } = useToast();

  // Cleanup seguro das blob URLs
  const revokeBlobUrl = useCallback((url: string) => {
    if (url?.startsWith('blob:') && blobUrlsRef.current.has(url)) {
      try {
        URL.revokeObjectURL(url);
        blobUrlsRef.current.delete(url);
        console.log('🗑️ Blob URL revogada:', url.substring(0, 50) + '...');
      } catch (error) {
        console.warn('Erro ao revogar blob URL:', error);
      }
    }
  }, []);

  // Cleanup automático apenas no unmount
  useEffect(() => {
    return () => {
      console.log('🧹 Limpeza final - revogando', blobUrlsRef.current.size, 'blob URLs');
      blobUrlsRef.current.forEach(url => {
        try {
          URL.revokeObjectURL(url);
        } catch (error) {
          console.warn('Erro na limpeza final:', error);
        }
      });
      blobUrlsRef.current.clear();
    };
  }, []);

  const createBlobUrl = useCallback((file: File): string => {
    const url = URL.createObjectURL(file);
    blobUrlsRef.current.add(url);
    console.log('🔗 Nova blob URL criada:', url.substring(0, 50) + '...');
    return url;
  }, []);

  const addImages = useCallback((files: File[]) => {
    console.log('📷 Adicionando', files.length, 'imagens');
    
    const newImages: SimpleDraftImage[] = files.map((file) => {
      const preview = createBlobUrl(file);
      return {
        id: `draft-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        file,
        preview,
        uploaded: false,
        isExisting: false
      };
    });
    
    setImages(prev => {
      const updated = [...prev, ...newImages];
      console.log('📊 Total de imagens após adição:', updated.length);
      return updated;
    });
    
    return newImages;
  }, [createBlobUrl]);

  const removeImage = useCallback((id: string) => {
    console.log('🗑️ Removendo imagem:', id);
    
    setImages(prev => {
      const imageToRemove = prev.find(img => img.id === id);
      
      if (imageToRemove?.preview) {
        revokeBlobUrl(imageToRemove.preview);
      }
      
      const filtered = prev.filter(img => img.id !== id);
      console.log('📊 Imagens restantes:', filtered.length);
      return filtered;
    });
  }, [revokeBlobUrl]);

  const uploadImages = useCallback(async (productId: string): Promise<string[]> => {
    if (!productId || images.length === 0 || isUploading) {
      console.log('⏭️ Upload pulado:', { productId, imagesCount: images.length, isUploading });
      return [];
    }

    setIsUploading(true);
    const uploadedUrls: string[] = [];

    try {
      console.log('📤 Iniciando upload de', images.length, 'imagens para produto:', productId);
      
      // Remover imagens existentes
      await supabase.from('product_images').delete().eq('product_id', productId);
      
      const { data: existingFiles } = await supabase.storage
        .from('product-images')
        .list(productId);

      if (existingFiles?.length) {
        const filesToDelete = existingFiles.map(file => `${productId}/${file.name}`);
        await supabase.storage.from('product-images').remove(filesToDelete);
      }

      // Upload novas imagens (apenas as que têm arquivo)
      const imagesToUpload = images.filter(img => img.file);
      console.log('📤 Fazendo upload de', imagesToUpload.length, 'imagens novas');
      
      for (let i = 0; i < imagesToUpload.length; i++) {
        const image = imagesToUpload[i];
        const fileExt = image.file!.name.split('.').pop();
        const fileName = `${productId}/${Date.now()}-${i}.${fileExt}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('product-images')
          .upload(fileName, image.file!);

        if (uploadError) {
          console.error('Erro no upload da imagem', i, ':', uploadError);
          continue;
        }

        const { data: urlData } = supabase.storage
          .from('product-images')
          .getPublicUrl(uploadData.path);

        const imageUrl = urlData.publicUrl;
        uploadedUrls.push(imageUrl);

        await supabase.from('product_images').insert({
          product_id: productId,
          image_url: imageUrl,
          image_order: i + 1,
          is_primary: i === 0,
          alt_text: `Imagem ${i + 1} do produto`
        });

        console.log('✅ Imagem', i + 1, 'enviada:', imageUrl.substring(0, 50) + '...');
      }

      // Atualizar imagem principal do produto
      if (uploadedUrls.length > 0) {
        await supabase
          .from('products')
          .update({ image_url: uploadedUrls[0] })
          .eq('id', productId);
      }

      toast({
        title: 'Sucesso!',
        description: `${uploadedUrls.length} imagem(ns) enviada(s) com sucesso`,
      });

      console.log('🎉 Upload concluído:', uploadedUrls.length, 'imagens');
      return uploadedUrls;
      
    } catch (error) {
      console.error('💥 Erro no upload:', error);
      toast({
        title: 'Erro no upload',
        description: 'Falha no processo de upload das imagens',
        variant: 'destructive',
      });
      return [];
    } finally {
      setIsUploading(false);
    }
  }, [images, toast, isUploading]);

  const loadExistingImages = useCallback(async (productId: string) => {
    if (!productId || isLoading) return;

    setIsLoading(true);
    console.log('📥 Carregando imagens existentes para produto:', productId);
    
    try {
      const { data: existingImages, error } = await supabase
        .from('product_images')
        .select('*')
        .eq('product_id', productId)
        .order('image_order');

      if (error) throw error;

      if (existingImages?.length) {
        const mappedImages: SimpleDraftImage[] = existingImages.map((img) => ({
          id: img.id,
          preview: img.image_url,
          uploaded: true,
          url: img.image_url,
          isExisting: true
        }));
        
        setImages(mappedImages);
        console.log('📷 Carregadas', mappedImages.length, 'imagens existentes');
      } else {
        setImages([]);
        console.log('📷 Nenhuma imagem existente encontrada');
      }
    } catch (error) {
      console.error('💥 Erro ao carregar imagens:', error);
      setImages([]);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading]);

  const clearImages = useCallback(() => {
    console.log('🧹 Limpando todas as imagens');
    
    // Revogar apenas blob URLs, preservar URLs existentes
    images.forEach(img => {
      if (img.preview?.startsWith('blob:')) {
        revokeBlobUrl(img.preview);
      }
    });
    
    setImages([]);
  }, [images, revokeBlobUrl]);

  return {
    images,
    isUploading,
    isLoading,
    addImages,
    removeImage,
    uploadImages,
    loadExistingImages,
    clearImages
  };
};
