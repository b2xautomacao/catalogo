
import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface DraftImage {
  id: string;
  file: File;
  preview: string;
  uploaded?: boolean;
  url?: string;
}

export const useDraftImages = () => {
  const [draftImages, setDraftImages] = useState<DraftImage[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const loadedProductIdRef = useRef<string | null>(null);
  const { toast } = useToast();

  const addDraftImages = useCallback((files: File[]) => {
    console.log('=== ADICIONANDO IMAGENS DRAFT ===');
    console.log('Arquivos recebidos:', files.length);
    
    const newImages: DraftImage[] = files.map((file) => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      preview: URL.createObjectURL(file),
      uploaded: false
    }));
    
    console.log('Imagens criadas:', newImages.length);
    setDraftImages(prev => {
      const updated = [...prev, ...newImages];
      console.log('Total de imagens após adição:', updated.length);
      return updated;
    });
    
    return newImages;
  }, []);

  const removeDraftImage = useCallback((id: string) => {
    console.log('=== REMOVENDO IMAGEM DRAFT ===');
    console.log('ID para remoção:', id);
    
    setDraftImages(prev => {
      const imageToRemove = prev.find(img => img.id === id);
      if (imageToRemove && imageToRemove.preview) {
        URL.revokeObjectURL(imageToRemove.preview);
      }
      const filtered = prev.filter(img => img.id !== id);
      console.log('Imagens restantes após remoção:', filtered.length);
      return filtered;
    });
  }, []);

  const uploadDraftImages = useCallback(async (productId: string): Promise<string[]> => {
    console.log('=== INICIANDO UPLOAD DE IMAGENS ===');
    console.log('Product ID:', productId);
    console.log('Imagens para upload:', draftImages.length);

    if (draftImages.length === 0) {
      console.log('Nenhuma imagem para upload');
      return [];
    }

    if (isUploading) {
      console.log('Upload já em andamento, ignorando...');
      return [];
    }

    setIsUploading(true);
    const uploadedUrls: string[] = [];

    try {
      // 1. Primeiro, remover imagens existentes do produto
      console.log('Removendo imagens existentes do produto...');
      const { error: deleteError } = await supabase
        .from('product_images')
        .delete()
        .eq('product_id', productId);

      if (deleteError) {
        console.error('Erro ao remover imagens existentes:', deleteError);
      } else {
        console.log('Imagens existentes removidas com sucesso');
      }

      // 2. Fazer upload das novas imagens
      for (let i = 0; i < draftImages.length; i++) {
        const image = draftImages[i];
        
        console.log(`=== UPLOAD IMAGEM ${i + 1}/${draftImages.length} ===`);
        console.log('Imagem ID:', image.id);
        console.log('Arquivo:', image.file.name, image.file.size);

        if (image.uploaded && image.url) {
          console.log('Imagem já enviada, pulando...');
          uploadedUrls.push(image.url);
          continue;
        }

        const fileExt = image.file.name.split('.').pop();
        const fileName = `${productId}/${Date.now()}-${i}.${fileExt}`;

        console.log('Nome do arquivo no storage:', fileName);

        // Upload para o storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('product-images')
          .upload(fileName, image.file, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) {
          console.error('Erro no upload da imagem:', uploadError);
          continue;
        }

        console.log('Upload bem-sucedido:', uploadData.path);

        // Obter URL pública
        const { data: urlData } = supabase.storage
          .from('product-images')
          .getPublicUrl(uploadData.path);

        const imageUrl = urlData.publicUrl;
        console.log('URL pública gerada:', imageUrl);
        uploadedUrls.push(imageUrl);

        // Salvar na tabela product_images
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
          console.error('Erro ao salvar imagem no banco:', dbError);
        } else {
          console.log(`Imagem ${i + 1} salva no banco com sucesso`);
        }

        // Marcar como enviada
        setDraftImages(prev => prev.map(img => 
          img.id === image.id 
            ? { ...img, uploaded: true, url: imageUrl }
            : img
        ));
      }

      // 3. Atualizar imagem principal do produto
      if (uploadedUrls.length > 0) {
        console.log('Atualizando imagem principal do produto...');
        const { error: updateError } = await supabase
          .from('products')
          .update({ image_url: uploadedUrls[0] })
          .eq('id', productId);

        if (updateError) {
          console.error('Erro ao atualizar imagem principal:', updateError);
        } else {
          console.log('Imagem principal atualizada com sucesso');
        }
      }

      console.log('=== UPLOAD CONCLUÍDO COM SUCESSO ===');
      console.log('Total de imagens enviadas:', uploadedUrls.length);

      toast({
        title: 'Sucesso!',
        description: `${uploadedUrls.length} imagem(ns) enviada(s) com sucesso`,
      });

      return uploadedUrls;
    } catch (error) {
      console.error('=== ERRO NO PROCESSO DE UPLOAD ===');
      console.error('Erro:', error);
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
    console.log('=== LIMPANDO IMAGENS DRAFT ===');
    console.log('Imagens a serem limpas:', draftImages.length);
    
    draftImages.forEach(image => {
      if (image.preview) {
        URL.revokeObjectURL(image.preview);
      }
    });
    setDraftImages([]);
    loadedProductIdRef.current = null;
    
    console.log('Imagens draft limpas');
  }, [draftImages]);

  const loadExistingImages = useCallback(async (productId: string) => {
    // Evitar carregar o mesmo produto múltiplas vezes
    if (loadedProductIdRef.current === productId || isLoading) {
      console.log('Imagens já carregadas ou carregando para:', productId);
      return;
    }

    console.log('=== CARREGANDO IMAGENS EXISTENTES ===');
    console.log('Product ID:', productId);
    
    setIsLoading(true);
    loadedProductIdRef.current = productId;

    try {
      const { data: images, error } = await supabase
        .from('product_images')
        .select('*')
        .eq('product_id', productId)
        .order('image_order');

      if (error) {
        console.error('Erro ao carregar imagens existentes:', error);
        return;
      }

      if (images && images.length > 0) {
        console.log('Imagens existentes encontradas:', images.length);
        const existingImages: DraftImage[] = images.map((img) => ({
          id: img.id,
          file: new File([], ''), // File vazio para imagens já salvas
          preview: img.image_url,
          uploaded: true,
          url: img.image_url
        }));
        
        setDraftImages(existingImages);
        console.log('Imagens existentes carregadas com sucesso');
      } else {
        console.log('Nenhuma imagem existente encontrada');
        setDraftImages([]);
      }
    } catch (error) {
      console.error('Erro ao carregar imagens:', error);
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
