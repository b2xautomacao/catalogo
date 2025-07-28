import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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

  const isUploading = uploading;

  const addDraftImage = useCallback(
    (file: File) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const newImage: DraftImage = {
          id: `draft-${Date.now()}-${Math.random()}`,
          file,
          preview: e.target?.result as string,
          uploaded: false,
          isExisting: false,
          isPrimary: false,
          displayOrder: draftImages.length,
        };

        setDraftImages((prev) => {
          if (prev.length === 0) {
            newImage.isPrimary = true;
          }
          return [...prev, newImage];
        });
      };
      reader.readAsDataURL(file);
    },
    [draftImages.length]
  );

  const addDraftImages = useCallback(
    (files: File[]) => {
      files.forEach((file) => addDraftImage(file));
    },
    [addDraftImage]
  );

  const removeDraftImage = useCallback((imageId: string) => {
    setDraftImages((prev) => {
      const imageToRemove = prev.find((img) => img.id === imageId);
      const filtered = prev.filter((img) => img.id !== imageId);

      if (imageToRemove?.isPrimary && filtered.length > 0) {
        filtered[0].isPrimary = true;
      }

      return filtered.map((img, index) => ({ ...img, displayOrder: index }));
    });
  }, []);

  const setPrimaryImage = useCallback((imageId: string) => {
    console.log("🌟 SETTING PRIMARY IMAGE:", imageId);
    setDraftImages((prev) =>
      prev.map((img) => ({
        ...img,
        isPrimary: img.id === imageId,
      }))
    );
  }, []);

  const reorderImages = useCallback((imageId: string, newIndex: number) => {
    setDraftImages((prev) => {
      const currentIndex = prev.findIndex((img) => img.id === imageId);
      if (currentIndex === -1) return prev;

      const newArray = [...prev];
      const [movedImage] = newArray.splice(currentIndex, 1);
      newArray.splice(newIndex, 0, movedImage);

      return newArray.map((img, index) => ({ ...img, displayOrder: index }));
    });
  }, []);

  const loadExistingImages = useCallback(
    async (productId: string) => {
      if (!productId) {
        console.log("📂 LOAD IMAGES - ProductId não fornecido, pulando carregamento");
        return;
      }

      setIsLoading(true);
      try {
        console.log("📂 LOAD IMAGES - Carregando imagens existentes para produto:", productId);

        const { data, error } = await supabase
          .from("product_images")
          .select("*")
          .eq("product_id", productId)
          .order("image_order");

        if (error) {
          console.error("❌ LOAD IMAGES - Erro ao carregar imagens:", error);
          throw error;
        }

        console.log("📂 LOAD IMAGES - Dados recebidos:", data?.length || 0, "imagens");

        const existingImages: DraftImage[] =
          data?.map((img, index) => ({
            id: img.id,
            url: img.image_url,
            uploaded: true,
            isExisting: true,
            isPrimary: img.is_primary || index === 0,
            displayOrder: img.image_order || index,
          })) || [];

        console.log("✅ LOAD IMAGES - Imagens processadas:", existingImages.length);
        console.log("✅ LOAD IMAGES - Detalhes:", existingImages.map(img => ({ 
          id: img.id, 
          isPrimary: img.isPrimary, 
          isExisting: img.isExisting,
          hasUrl: !!img.url 
        })));

        setDraftImages(existingImages);
        
        if (existingImages.length > 0) {
          toast({
            title: "Imagens carregadas",
            description: `${existingImages.length} imagem(ns) carregada(s) com sucesso`,
          });
        }
      } catch (error) {
        console.error("❌ LOAD IMAGES - Erro ao carregar imagens existentes:", error);
        toast({
          title: "Erro ao carregar imagens",
          description: "Não foi possível carregar as imagens existentes. Tente novamente.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    },
    [toast]
  );

  const uploadAllImages = useCallback(
    async (productId: string): Promise<string[]> => {
      console.log("📤 UPLOAD ALL IMAGES - Iniciado para produto:", productId);
      console.log("📤 UPLOAD ALL IMAGES - Draft images:", draftImages.length);
      console.log(
        "📤 UPLOAD ALL IMAGES - Draft images detalhes:",
        draftImages.map((img) => ({
          id: img.id,
          hasFile: !!img.file,
          isExisting: img.isExisting,
          isPrimary: img.isPrimary,
        }))
      );

      if (!productId) {
        console.error("❌ UPLOAD - Product ID é obrigatório");
        return [];
      }

      const imagesToUpload = draftImages.filter(
        (img) => !img.uploaded && img.file
      );
      const existingImages = draftImages.filter(
        (img) => img.isExisting && img.uploaded
      );

      console.log("📤 UPLOAD - Imagens para upload:", imagesToUpload.length);
      console.log("📤 UPLOAD - Imagens existentes:", existingImages.length);

      if (imagesToUpload.length === 0 && existingImages.length === 0) {
        console.log("📋 Nenhuma imagem para processar");
        return [];
      }

      setUploading(true);
      const uploadedUrls: string[] = [];

      try {
        // **ESTRATÉGIA SEGURA**: Backup antes de modificar
        let backupImages: any[] = [];
        
        // Fazer backup das imagens existentes apenas se houver novas para upload
        if (imagesToUpload.length > 0 || draftImages.length !== existingImages.length) {
          console.log("💾 BACKUP - Fazendo backup das imagens existentes...");
          const { data: existingBackup } = await supabase
            .from("product_images")
            .select("*")
            .eq("product_id", productId);
          
          backupImages = existingBackup || [];
          console.log("💾 BACKUP - Backup criado com", backupImages.length, "imagens");
        }

        // **UPLOAD INCREMENTAL**: Fazer upload apenas das novas imagens primeiro
        for (const image of imagesToUpload) {
          console.log("📤 UPLOAD - Fazendo upload da nova imagem:", image.id);

          const fileExt = image.file!.name.split(".").pop()?.toLowerCase();
          const fileName = `products/${productId}/${Date.now()}-${Math.random()}.${fileExt}`;

          const { data: uploadData, error: uploadError } =
            await supabase.storage
              .from("product-images")
              .upload(fileName, image.file!, {
                cacheControl: "3600",
                upsert: false,
              });

          if (uploadError) {
            console.error("❌ UPLOAD - Erro no upload:", uploadError);
            throw uploadError;
          }

          const { data: { publicUrl } } = supabase.storage
            .from("product-images")
            .getPublicUrl(fileName);

          // Atualizar o draft image com a URL
          setDraftImages(prev => prev.map(img => 
            img.id === image.id 
              ? { ...img, url: publicUrl, uploaded: true }
              : img
          ));

          uploadedUrls.push(publicUrl);
          console.log("✅ UPLOAD - Upload concluído:", publicUrl);
        }

        // **REORGANIZAÇÃO SEGURA**: Agora reorganizar todas as imagens
        console.log("🔄 REORGANIZANDO - Removendo imagens antigas do banco...");
        await supabase
          .from("product_images")
          .delete()
          .eq("product_id", productId);

        // Obter o estado atualizado das imagens e filtrar apenas as que têm URL
        const finalImages = draftImages
          .map(img => {
            // Se era uma nova imagem que acabamos de fazer upload
            if (!img.isExisting && uploadedUrls.includes(img.url || '')) {
              return { ...img, uploaded: true, isExisting: false };
            }
            return img;
          })
          .filter(img => img.url); // Filtrar apenas imagens com URL

        const allImagesOrdered = finalImages.sort((a, b) => a.displayOrder - b.displayOrder);

        console.log("💾 REORGANIZANDO - Salvando", allImagesOrdered.length, "imagens no banco");

        for (let i = 0; i < allImagesOrdered.length; i++) {
          const image = allImagesOrdered[i];
          
          console.log("💾 REORGANIZANDO - Salvando imagem", i + 1, "Primary:", image.isPrimary, "URL:", image.url);

          const { error: dbError } = await supabase
            .from("product_images")
            .insert({
              product_id: productId,
              image_url: image.url,
              image_order: i + 1,
              is_primary: image.isPrimary,
              alt_text: `Produto ${i + 1}`,
            });

          if (dbError) {
            console.error("❌ REORGANIZANDO - Erro ao salvar no banco:", dbError);
            
            // **ROLLBACK EM CASO DE ERRO**
            console.log("🔙 ROLLBACK - Tentando restaurar backup...");
            if (backupImages.length > 0) {
              for (const backupImg of backupImages) {
                await supabase
                  .from("product_images")
                  .insert({
                    product_id: backupImg.product_id,
                    image_url: backupImg.image_url,
                    image_order: backupImg.image_order,
                    is_primary: backupImg.is_primary,
                    alt_text: backupImg.alt_text,
                  });
              }
              console.log("🔙 ROLLBACK - Backup restaurado");
            }
            throw dbError;
          }
        }

        // Atualizar a imagem principal do produto
        const primaryImage = allImagesOrdered.find((img) => img.isPrimary);
        if (primaryImage?.url) {
          console.log("🖼️ ATUALIZANDO - Imagem principal do produto:", primaryImage.url);

          await supabase
            .from("products")
            .update({ image_url: primaryImage.url })
            .eq("id", productId);
        }

        // Marcar todas as imagens como uploaded
        setDraftImages(prev => prev.map(img => ({ ...img, uploaded: true, isExisting: true })));

        const totalProcessed = allImagesOrdered.length;
        toast({
          title: "✅ Imagens salvas!",
          description: `${totalProcessed} imagem(s) processada(s) com sucesso.`,
        });

        console.log("✅ UPLOAD ALL IMAGES - Concluído com sucesso. URLs:", uploadedUrls);
        return uploadedUrls;
        
      } catch (error) {
        console.error("💥 UPLOAD ALL IMAGES - Erro no processamento:", error);
        toast({
          title: "Erro no processamento",
          description: "Ocorreu um erro ao processar as imagens. Tente novamente.",
          variant: "destructive",
        });
        return [];
      } finally {
        setUploading(false);
      }
    },
    [draftImages, toast, setDraftImages]
  );

  const uploadDraftImages = uploadAllImages;

  const clearDraftImages = useCallback(() => {
    console.log("🧹 CLEARING DRAFT IMAGES");
    setDraftImages([]);
  }, []);

  return {
    draftImages,
    uploading,
    isUploading,
    isLoading,
    addDraftImage,
    addDraftImages,
    removeDraftImage,
    setPrimaryImage,
    reorderImages,
    loadExistingImages,
    uploadAllImages,
    uploadDraftImages,
    clearDraftImages,
  };
};
