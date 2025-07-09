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
      if (!productId) return;

      setIsLoading(true);
      try {
        console.log("📂 LOADING EXISTING IMAGES para produto:", productId);

        const { data, error } = await supabase
          .from("product_images")
          .select("*")
          .eq("product_id", productId)
          .order("image_order");

        if (error) {
          console.error("❌ Erro ao carregar imagens:", error);
          throw error;
        }

        const existingImages: DraftImage[] =
          data?.map((img, index) => ({
            id: img.id,
            url: img.image_url,
            uploaded: true,
            isExisting: true,
            isPrimary: img.is_primary || index === 0,
            displayOrder: img.image_order || index,
          })) || [];

        console.log("✅ Imagens carregadas:", existingImages.length);
        setDraftImages(existingImages);
      } catch (error) {
        console.error("❌ Erro ao carregar imagens existentes:", error);
        toast({
          title: "Erro ao carregar imagens",
          description: "Não foi possível carregar as imagens existentes",
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
        // Primeiro remover todas as imagens existentes do produto
        console.log("🗑️ Removendo imagens existentes do produto...");
        await supabase
          .from("product_images")
          .delete()
          .eq("product_id", productId);

        // Processar todas as imagens na ordem correta
        const allImagesOrdered = draftImages.sort(
          (a, b) => a.displayOrder - b.displayOrder
        );

        for (let i = 0; i < allImagesOrdered.length; i++) {
          const image = allImagesOrdered[i];
          let imageUrl = image.url;

          // Se é uma nova imagem, fazer upload
          if (!image.uploaded && image.file) {
            console.log("📤 Fazendo upload da nova imagem:", i + 1);

            const fileExt = image.file.name.split(".").pop()?.toLowerCase();
            const fileName = `products/${productId}/${Date.now()}-${i}.${fileExt}`;

            const { data: uploadData, error: uploadError } =
              await supabase.storage
                .from("product-images")
                .upload(fileName, image.file, {
                  cacheControl: "3600",
                  upsert: false,
                });

            if (uploadError) {
              console.error("❌ Erro no upload:", uploadError);
              throw uploadError;
            }

            const {
              data: { publicUrl },
            } = supabase.storage.from("product-images").getPublicUrl(fileName);

            imageUrl = publicUrl;
            uploadedUrls.push(publicUrl);
          }

          // Salvar no banco de dados
          if (imageUrl) {
            console.log(
              "💾 Salvando imagem no banco:",
              i + 1,
              "Primary:",
              image.isPrimary
            );

            const { error: dbError } = await supabase
              .from("product_images")
              .insert({
                product_id: productId,
                image_url: imageUrl,
                image_order: i + 1, // image_order deve começar em 1
                is_primary: image.isPrimary,
                alt_text: `Produto ${i + 1}`,
              });

            if (dbError) {
              console.error("❌ Erro ao salvar no banco:", dbError);
              throw dbError;
            }
          }
        }

        // Atualizar a imagem principal do produto
        const primaryImage = allImagesOrdered.find((img) => img.isPrimary);
        if (primaryImage && (primaryImage.url || uploadedUrls.length > 0)) {
          const primaryUrl = primaryImage.url || uploadedUrls[0];

          console.log(
            "🖼️ Atualizando imagem principal do produto:",
            primaryUrl
          );

          await supabase
            .from("products")
            .update({ image_url: primaryUrl })
            .eq("id", productId);
        }

        const totalProcessed = allImagesOrdered.length;
        if (totalProcessed > 0) {
          toast({
            title: "✅ Imagens salvas!",
            description: `${totalProcessed} imagem(s) processada(s) com sucesso.`,
          });
        }

        console.log("✅ UPLOAD ALL IMAGES - Concluído com sucesso");
        return uploadedUrls;
      } catch (error) {
        console.error("💥 Erro no processamento das imagens:", error);
        toast({
          title: "Erro no processamento",
          description: "Ocorreu um erro ao processar as imagens",
          variant: "destructive",
        });
        return [];
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
    reorderImages,
    loadExistingImages,
    uploadAllImages,
    uploadDraftImages,
    clearDraftImages,
  };
};
