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
  color_association?: string;
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

  const setPrimaryImage = useCallback(
    (imageId: string) => {
      console.log("🌟 SETTING PRIMARY IMAGE - Início:", imageId);

      setDraftImages((prev) => {
        // Verificar se a imagem existe
        const targetImage = prev.find((img) => img.id === imageId);
        if (!targetImage) {
          console.warn(
            "⚠️ AVISO - Imagem não encontrada para definir como principal:",
            imageId
          );
          return prev;
        }

        // Log do estado anterior
        console.log(
          "🌟 ANTES - Estado das imagens:",
          prev.map((img) => ({
            id: img.id.substring(0, 8),
            isPrimary: img.isPrimary,
            hasUrl: !!img.url,
            hasFile: !!img.file,
          }))
        );

        // Atualizar todas as imagens - FORÇA a desmarcação de todas as outras
        const updated = prev.map((img) => {
          const newIsPrimary = img.id === imageId;
          return {
            ...img,
            isPrimary: newIsPrimary,
          };
        });

        // Log para debug
        console.log(
          "🌟 DEPOIS - Estado após setPrimary:",
          updated.map((img) => ({
            id: img.id.substring(0, 8),
            isPrimary: img.isPrimary,
            hasUrl: !!img.url,
            hasFile: !!img.file,
          }))
        );

        // Verificação de segurança
        const primaryCount = updated.filter((img) => img.isPrimary).length;
        console.log(
          "🌟 VERIFICAÇÃO - Quantidade de imagens principais:",
          primaryCount
        );

        if (primaryCount !== 1) {
          console.error(
            "❌ ERRO - Deveria haver exatamente 1 imagem principal, mas há:",
            primaryCount
          );
          console.error(
            "❌ ERRO - IDs das imagens principais:",
            updated.filter((img) => img.isPrimary).map((img) => img.id)
          );
        } else {
          console.log("✅ SUCESSO - Exatamente 1 imagem principal definida");
        }

        return updated;
      });

      // Toast para feedback visual
      toast({
        title: "✅ Imagem principal definida",
        description: "Esta imagem será a capa do produto",
        duration: 2000,
      });
    },
    [toast]
  );

  const setColorAssociation = useCallback((imageId: string, color: string | undefined) => {
    setDraftImages(prev => prev.map(img => 
      img.id === imageId ? { ...img, color_association: color } : img
    ));
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
        console.log(
          "📂 LOAD IMAGES - ProductId não fornecido, pulando carregamento"
        );
        return;
      }

      setIsLoading(true);
      try {
        console.log(
          "📂 LOAD IMAGES - Carregando imagens existentes para produto:",
          productId
        );

        const { data, error } = await supabase
          .from("product_images")
          .select("*")
          .eq("product_id", productId)
          .order("image_order");

        if (error) {
          console.error("❌ LOAD IMAGES - Erro ao carregar imagens:", error);
          throw error;
        }

        console.log(
          "📂 LOAD IMAGES - Dados recebidos:",
          data?.length || 0,
          "imagens"
        );

        const existingImages: DraftImage[] =
          data?.map((img, index) => ({
            id: img.id,
            url: img.image_url,
            uploaded: true,
            isExisting: true,
            isPrimary: img.is_primary || index === 0,
            displayOrder: img.image_order || index,
          })) || [];

        console.log(
          "✅ LOAD IMAGES - Imagens processadas:",
          existingImages.length
        );
        console.log(
          "✅ LOAD IMAGES - Detalhes:",
          existingImages.map((img) => ({
            id: img.id,
            isPrimary: img.isPrimary,
            isExisting: img.isExisting,
            hasUrl: !!img.url,
          }))
        );

        setDraftImages(existingImages);

        if (existingImages.length > 0) {
          toast({
            title: "Imagens carregadas",
            description: `${existingImages.length} imagem(ns) carregada(s) com sucesso`,
          });
        }
      } catch (error) {
        console.error(
          "❌ LOAD IMAGES - Erro ao carregar imagens existentes:",
          error
        );
        toast({
          title: "Erro ao carregar imagens",
          description:
            "Não foi possível carregar as imagens existentes. Tente novamente.",
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
        if (
          imagesToUpload.length > 0 ||
          draftImages.length !== existingImages.length
        ) {
          console.log("💾 BACKUP - Fazendo backup das imagens existentes...");
          const { data: existingBackup } = await supabase
            .from("product_images")
            .select("*")
            .eq("product_id", productId);

          backupImages = existingBackup || [];
          console.log(
            "💾 BACKUP - Backup criado com",
            backupImages.length,
            "imagens"
          );
        }

        // **UPLOAD INCREMENTAL**: Fazer upload apenas das novas imagens primeiro
        const uploadedImagesMap = new Map<string, string>(); // Mapa imageId -> URL

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

          const {
            data: { publicUrl },
          } = supabase.storage.from("product-images").getPublicUrl(fileName);

          // Mapear o ID da imagem com a URL carregada
          uploadedImagesMap.set(image.id, publicUrl);
          uploadedUrls.push(publicUrl);
          console.log("✅ UPLOAD - Upload concluído:", publicUrl);
        }

        // **REORGANIZAÇÃO SEGURA**: Agora reorganizar todas as imagens
        console.log("🔄 REORGANIZANDO - Removendo imagens antigas do banco...");
        await supabase
          .from("product_images")
          .delete()
          .eq("product_id", productId);

        // Obter o estado mais atual das imagens com as URLs atualizadas
        const updatedImages = draftImages.map((img) => {
          const uploadedUrl = uploadedImagesMap.get(img.id);
          if (uploadedUrl) {
            return {
              ...img,
              url: uploadedUrl,
              uploaded: true,
              isExisting: true,
            };
          }
          // Marcar imagens existentes também como uploaded e existing
          return { ...img, uploaded: true, isExisting: true };
        });

        // Filtrar apenas imagens com URL
        const finalImages = updatedImages.filter((img) => img.url);

        // 🎯 GARANTIR IMAGEM PRINCIPAL: Se não houver nenhuma principal ou múltiplas principais, corrigir
        const primaryImages = finalImages.filter((img) => img.isPrimary);

        if (primaryImages.length === 0 && finalImages.length > 0) {
          console.log(
            "🌟 CORRIGINDO - Nenhuma imagem principal definida, definindo a primeira como principal"
          );
          finalImages[0].isPrimary = true;
        } else if (primaryImages.length > 1) {
          console.log(
            "🌟 CORRIGINDO - Múltiplas imagens principais encontradas, mantendo apenas a primeira"
          );
          finalImages.forEach((img, index) => {
            img.isPrimary = index === 0 && primaryImages.includes(img);
          });
        }

        console.log(
          "🔄 REORGANIZANDO - Estado atual das imagens:",
          finalImages.map((img) => ({
            id: img.id,
            hasUrl: !!img.url,
            isPrimary: img.isPrimary,
            isExisting: img.isExisting,
            uploaded: img.uploaded,
          }))
        );

        // Atualizar o estado das imagens draft com as correções
        setDraftImages(updatedImages);

        const allImagesOrdered = finalImages.sort((a, b) => {
          // 🎯 NOVA LÓGICA: Principal sempre primeiro, depois por displayOrder
          if (a.isPrimary && !b.isPrimary) return -1;
          if (!a.isPrimary && b.isPrimary) return 1;
          return a.displayOrder - b.displayOrder;
        });

        console.log(
          "💾 REORGANIZANDO - Salvando",
          allImagesOrdered.length,
          "imagens no banco (principal sempre na ordem 1)"
        );

        for (let i = 0; i < allImagesOrdered.length; i++) {
          const image = allImagesOrdered[i];
          const newImageOrder = i + 1; // Ordem sequencial a partir de 1

          console.log(
            "💾 REORGANIZANDO - Salvando imagem",
            newImageOrder,
            "Primary:",
            image.isPrimary,
            "Order:",
            newImageOrder,
            "URL:",
            image.url
          );

          const { error: dbError } = await supabase
            .from("product_images")
            .insert({
              product_id: productId,
              image_url: image.url,
              image_order: newImageOrder, // 🎯 ORDEM SINCRONIZADA: Principal = 1, outras sequenciais
              is_primary: image.isPrimary,
              alt_text: `Produto ${newImageOrder}`,
            });

          if (dbError) {
            console.error(
              "❌ REORGANIZANDO - Erro ao salvar no banco:",
              dbError
            );

            // **ROLLBACK EM CASO DE ERRO**
            console.log("🔙 ROLLBACK - Tentando restaurar backup...");
            if (backupImages.length > 0) {
              for (const backupImg of backupImages) {
                await supabase.from("product_images").insert({
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

        // 🎯 ATUALIZAR IMAGEM PRINCIPAL NO PRODUTO: Buscar a imagem principal e atualizar o registro do produto
        const primaryImage = allImagesOrdered.find((img) => img.isPrimary);
        if (primaryImage?.url) {
          console.log(
            "🖼️ ATUALIZANDO - Imagem principal do produto:",
            primaryImage.url
          );

          const { error: updateError } = await supabase
            .from("products")
            .update({ image_url: primaryImage.url })
            .eq("id", productId);

          if (updateError) {
            console.error(
              "❌ ERRO - Falha ao atualizar imagem principal do produto:",
              updateError
            );
          } else {
            console.log("✅ SUCESSO - Imagem principal do produto atualizada!");
          }
        } else {
          console.warn(
            "⚠️ AVISO - Nenhuma imagem principal encontrada para atualizar o produto"
          );
        }

        // As imagens já foram marcadas como uploaded durante o processo acima

        const totalProcessed = allImagesOrdered.length;
        toast({
          title: "✅ Imagens salvas!",
          description: `${totalProcessed} imagem(s) processada(s) com sucesso.`,
        });

        console.log(
          "✅ UPLOAD ALL IMAGES - Concluído com sucesso. URLs:",
          uploadedUrls
        );
        return uploadedUrls;
      } catch (error) {
        console.error("❌ UPLOAD ALL IMAGES - Erro:", error);
        setUploading(false);
        toast({
          title: "❌ Erro ao processar imagens",
          description: "Houve um problema ao salvar as imagens.",
          variant: "destructive",
        });
        throw error;
      } finally {
        setUploading(false);
      }
    },
    [draftImages, toast]
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
    setColorAssociation,
    reorderImages,
    loadExistingImages,
    uploadAllImages,
    uploadDraftImages,
    clearDraftImages,
  };
};
