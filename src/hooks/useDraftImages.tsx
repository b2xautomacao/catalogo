
import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface DraftImage {
  id: string;
  file?: File;
  preview: string;
  uploaded?: boolean;
  url?: string;
  isExisting?: boolean;
}

export const useDraftImages = () => {
  const [draftImages, setDraftImages] = useState<DraftImage[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const loadedProductIdRef = useRef<string | null>(null);
  const activeBlobUrls = useRef<Set<string>>(new Set());
  const { toast } = useToast();

  console.log('🎯 USE DRAFT IMAGES - Hook inicializado');
  console.log('🎯 USE DRAFT IMAGES - Estado atual:', {
    imagesCount: draftImages.length,
    isUploading,
    isLoading
  });

  // Cleanup automático das blob URLs quando o componente for desmontado
  useEffect(() => {
    return () => {
      console.log('🧹 USE DRAFT IMAGES - Cleanup automático das blob URLs');
      activeBlobUrls.current.forEach(url => {
        try {
          URL.revokeObjectURL(url);
        } catch (error) {
          console.warn('⚠️ Erro ao revogar blob URL:', error);
        }
      });
      activeBlobUrls.current.clear();
    };
  }, []);

  const createBlobUrl = useCallback((file: File): string => {
    const url = URL.createObjectURL(file);
    activeBlobUrls.current.add(url);
    console.log('🔗 USE DRAFT IMAGES - Blob URL criada:', url);
    return url;
  }, []);

  const revokeBlobUrl = useCallback((url: string) => {
    if (url && url.startsWith('blob:') && activeBlobUrls.current.has(url)) {
      try {
        URL.revokeObjectURL(url);
        activeBlobUrls.current.delete(url);
        console.log('🗑 USE DRAFT IMAGES - Blob URL revogada:', url);
      } catch (error) {
        console.warn('⚠️ Erro ao revogar blob URL:', error);
      }
    }
  }, []);

  const cleanupAllBlobUrls = useCallback(() => {
    console.log('🧹 USE DRAFT IMAGES - Limpando todas as blob URLs:', activeBlobUrls.current.size);
    activeBlobUrls.current.forEach(url => {
      try {
        URL.revokeObjectURL(url);
      } catch (error) {
        console.warn('⚠️ Erro ao revogar blob URL:', error);
      }
    });
    activeBlobUrls.current.clear();
  }, []);

  const addDraftImages = useCallback((files: File[]) => {
    console.log('➕ USE DRAFT IMAGES - Adicionando imagens:', files.length);
    
    const newImages: DraftImage[] = files.map((file) => {
      const preview = createBlobUrl(file);
      const imageData = {
        id: `draft-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        file,
        preview,
        uploaded: false,
        isExisting: false
      };
      
      console.log('📁 USE DRAFT IMAGES - Nova imagem criada:', {
        id: imageData.id,
        fileName: file.name,
        fileSize: file.size,
        preview: imageData.preview
      });
      
      return imageData;
    });
    
    setDraftImages(prev => {
      const updated = [...prev, ...newImages];
      console.log('📊 USE DRAFT IMAGES - Total de imagens após adição:', updated.length);
      return updated;
    });
    
    return newImages;
  }, [createBlobUrl]);

  const removeDraftImage = useCallback((id: string) => {
    console.log('🗑 USE DRAFT IMAGES - Removendo imagem:', id);
    
    setDraftImages(prev => {
      const imageToRemove = prev.find(img => img.id === id);
      
      if (imageToRemove) {
        console.log('📍 USE DRAFT IMAGES - Imagem encontrada para remoção:', {
          id: imageToRemove.id,
          isExisting: imageToRemove.isExisting,
          hasPreview: !!imageToRemove.preview
        });
        
        // Cleanup de blob URL apenas se for uma nova imagem
        if (!imageToRemove.isExisting && imageToRemove.preview?.startsWith('blob:')) {
          revokeBlobUrl(imageToRemove.preview);
        }
      }
      
      const filtered = prev.filter(img => img.id !== id);
      console.log('📊 USE DRAFT IMAGES - Imagens restantes após remoção:', filtered.length);
      return filtered;
    });
  }, [revokeBlobUrl]);

  const uploadDraftImages = useCallback(async (productId: string): Promise<string[]> => {
    console.log('📤 USE DRAFT IMAGES - Iniciando upload de imagens');
    console.log('🆔 USE DRAFT IMAGES - Product ID:', productId);
    console.log('📊 USE DRAFT IMAGES - Imagens para processar:', draftImages.length);

    if (draftImages.length === 0) {
      console.log('⚠️ USE DRAFT IMAGES - Nenhuma imagem para upload');
      return [];
    }

    if (isUploading) {
      console.log('⏳ USE DRAFT IMAGES - Upload já em andamento, ignorando...');
      return [];
    }

    setIsUploading(true);
    const uploadedUrls: string[] = [];

    try {
      // 1. Remover imagens existentes do produto
      console.log('🗑 USE DRAFT IMAGES - Removendo imagens existentes do produto...');
      const { error: deleteImagesError } = await supabase
        .from('product_images')
        .delete()
        .eq('product_id', productId);

      if (deleteImagesError) {
        console.error('❌ USE DRAFT IMAGES - Erro ao remover imagens existentes:', deleteImagesError);
      } else {
        console.log('✅ USE DRAFT IMAGES - Imagens existentes removidas do BD');
      }

      // 2. Remover arquivos existentes do storage
      console.log('🗑 USE DRAFT IMAGES - Removendo arquivos do storage...');
      const { data: existingFiles } = await supabase.storage
        .from('product-images')
        .list(productId);

      if (existingFiles && existingFiles.length > 0) {
        const filesToDelete = existingFiles.map(file => `${productId}/${file.name}`);
        const { error: deleteStorageError } = await supabase.storage
          .from('product-images')
          .remove(filesToDelete);
        
        if (deleteStorageError) {
          console.error('❌ USE DRAFT IMAGES - Erro ao remover do storage:', deleteStorageError);
        } else {
          console.log('✅ USE DRAFT IMAGES - Arquivos antigos removidos do storage');
        }
      }

      // 3. Fazer upload apenas das imagens que têm arquivo (novas)
      const imagesToUpload = draftImages.filter(img => img.file && !img.uploaded);
      console.log('📤 USE DRAFT IMAGES - Imagens para upload:', imagesToUpload.length);

      for (let i = 0; i < imagesToUpload.length; i++) {
        const image = imagesToUpload[i];
        
        console.log(`📤 USE DRAFT IMAGES - Upload imagem ${i + 1}/${imagesToUpload.length}`);
        console.log('📁 USE DRAFT IMAGES - Arquivo:', {
          name: image.file!.name,
          size: image.file!.size,
          type: image.file!.type
        });

        const fileExt = image.file!.name.split('.').pop();
        const fileName = `${productId}/${Date.now()}-${i}.${fileExt}`;

        // Upload para o storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('product-images')
          .upload(fileName, image.file!, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) {
          console.error('❌ USE DRAFT IMAGES - Erro no upload da imagem:', uploadError);
          continue;
        }

        console.log('✅ USE DRAFT IMAGES - Upload bem-sucedido:', uploadData.path);

        // Obter URL pública
        const { data: urlData } = supabase.storage
          .from('product-images')
          .getPublicUrl(uploadData.path);

        const imageUrl = urlData.publicUrl;
        console.log('🔗 USE DRAFT IMAGES - URL pública gerada:', imageUrl);
        uploadedUrls.push(imageUrl);

        // Salvar na tabela product_images
        console.log('💾 USE DRAFT IMAGES - Salvando no banco de dados...');
        const { error: dbError } = await supabase
          .from('product_images')
          .insert({
            product_id: productId,
            image_url: imageUrl,
            image_order: i + 1,
            is_primary: i === 0,
            alt_text: `Imagem ${i + 1} do produto`
          });

        if (dbError) {
          console.error('❌ USE DRAFT IMAGES - Erro ao salvar imagem no banco:', dbError);
        } else {
          console.log(`✅ USE DRAFT IMAGES - Imagem ${i + 1} salva no banco`);
        }
      }

      // 4. Atualizar imagem principal do produto
      if (uploadedUrls.length > 0) {
        console.log('🔄 USE DRAFT IMAGES - Atualizando imagem principal do produto...');
        const { error: updateError } = await supabase
          .from('products')
          .update({ image_url: uploadedUrls[0] })
          .eq('id', productId);

        if (updateError) {
          console.error('❌ USE DRAFT IMAGES - Erro ao atualizar imagem principal:', updateError);
        } else {
          console.log('✅ USE DRAFT IMAGES - Imagem principal atualizada');
        }
      }

      console.log('🎉 USE DRAFT IMAGES - Upload concluído com sucesso!');
      console.log('📊 USE DRAFT IMAGES - Total de imagens enviadas:', uploadedUrls.length);

      if (uploadedUrls.length > 0) {
        toast({
          title: 'Sucesso!',
          description: `${uploadedUrls.length} imagem(ns) enviada(s) com sucesso`,
        });
      }

      return uploadedUrls;
    } catch (error) {
      console.error('💥 USE DRAFT IMAGES - Erro no processo de upload:', error);
      toast({
        title: 'Erro no upload',
        description: 'Falha no processo de upload das imagens',
        variant: 'destructive',
      });
      return [];
    } finally {
      setIsUploading(false);
    }
  }, [draftImages, toast, isUploading]);

  const clearDraftImages = useCallback(() => {
    console.log('🧹 USE DRAFT IMAGES - Limpando imagens draft');
    console.log('📊 USE DRAFT IMAGES - Imagens a serem limpas:', draftImages.length);
    
    // Cleanup de todas as blob URLs ativas
    cleanupAllBlobUrls();
    setDraftImages([]);
    loadedProductIdRef.current = null;
    
    console.log('✅ USE DRAFT IMAGES - Imagens draft limpas');
  }, [cleanupAllBlobUrls]);

  const loadExistingImages = useCallback(async (productId: string) => {
    // Evitar carregar o mesmo produto múltiplas vezes
    if (loadedProductIdRef.current === productId || isLoading) {
      console.log('⚠️ USE DRAFT IMAGES - Imagens já carregadas ou carregando para:', productId);
      return;
    }

    console.log('📂 USE DRAFT IMAGES - Carregando imagens existentes');
    console.log('🆔 USE DRAFT IMAGES - Product ID:', productId);
    
    setIsLoading(true);
    loadedProductIdRef.current = productId;

    try {
      const { data: images, error } = await supabase
        .from('product_images')
        .select('*')
        .eq('product_id', productId)
        .order('image_order');

      if (error) {
        console.error('❌ USE DRAFT IMAGES - Erro ao carregar imagens existentes:', error);
        return;
      }

      if (images && images.length > 0) {
        console.log('📊 USE DRAFT IMAGES - Imagens existentes encontradas:', images.length);
        const existingImages: DraftImage[] = images.map((img) => ({
          id: img.id,
          preview: img.image_url,
          uploaded: true,
          url: img.image_url,
          isExisting: true
        }));
        
        setDraftImages(existingImages);
        console.log('✅ USE DRAFT IMAGES - Imagens existentes carregadas');
      } else {
        console.log('⚠️ USE DRAFT IMAGES - Nenhuma imagem existente encontrada');
        setDraftImages([]);
      }
    } catch (error) {
      console.error('💥 USE DRAFT IMAGES - Erro ao carregar imagens:', error);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading]);

  return {
    draftImages,
    isUploading,
    isLoading,
    addDraftImages,
    removeDraftImage,
    uploadDraftImages,
    clearDraftImages,
    loadExistingImages
  };
};
