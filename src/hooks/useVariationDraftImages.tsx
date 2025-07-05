import { useState, useCallback, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface VariationDraftImage {
  id: string;
  color: string;
  variationId: string;
  file?: File;
  preview: string;
  uploaded?: boolean;
  url?: string;
  isExisting?: boolean;
}

export const useVariationDraftImages = () => {
  const [draftImages, setDraftImages] = useState<VariationDraftImage[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const loadedProductIdRef = useRef<string | null>(null);
  const activeBlobUrls = useRef<Set<string>>(new Set());
  const { toast } = useToast();

  console.log("🎯 USE VARIATION DRAFT IMAGES - Hook inicializado");
  console.log("🎯 USE VARIATION DRAFT IMAGES - Estado atual:", {
    imagesCount: draftImages.length,
    isUploading,
    isLoading,
  });

  // Cleanup automático das blob URLs quando o componente for desmontado
  useEffect(() => {
    return () => {
      console.log(
        "🧹 USE VARIATION DRAFT IMAGES - Cleanup automático das blob URLs"
      );
      activeBlobUrls.current.forEach((url) => {
        try {
          URL.revokeObjectURL(url);
        } catch (error) {
          console.warn("⚠️ Erro ao revogar blob URL:", error);
        }
      });
      activeBlobUrls.current.clear();
    };
  }, []);

  const createBlobUrl = useCallback((file: File): string => {
    const url = URL.createObjectURL(file);
    activeBlobUrls.current.add(url);
    console.log("🔗 USE VARIATION DRAFT IMAGES - Blob URL criada:", url);
    return url;
  }, []);

  const revokeBlobUrl = useCallback((url: string) => {
    if (url && url.startsWith("blob:") && activeBlobUrls.current.has(url)) {
      try {
        URL.revokeObjectURL(url);
        activeBlobUrls.current.delete(url);
        console.log("🗑 USE VARIATION DRAFT IMAGES - Blob URL revogada:", url);
      } catch (error) {
        console.warn("⚠️ Erro ao revogar blob URL:", error);
      }
    }
  }, []);

  const cleanupAllBlobUrls = useCallback(() => {
    console.log(
      "🧹 USE VARIATION DRAFT IMAGES - Limpando todas as blob URLs:",
      activeBlobUrls.current.size
    );
    activeBlobUrls.current.forEach((url) => {
      try {
        URL.revokeObjectURL(url);
      } catch (error) {
        console.warn("⚠️ Erro ao revogar blob URL:", error);
      }
    });
    activeBlobUrls.current.clear();
  }, []);

  const addVariationImage = useCallback(
    (color: string, variationId: string, file: File) => {
      console.log(
        "➕ USE VARIATION DRAFT IMAGES - Adicionando imagem para cor:",
        color
      );

      const preview = createBlobUrl(file);
      const imageData: VariationDraftImage = {
        id: `variation-draft-${Date.now()}-${Math.random()
          .toString(36)
          .substr(2, 9)}`,
        color,
        variationId,
        file,
        preview,
        uploaded: false,
        isExisting: false,
      };

      console.log("📁 USE VARIATION DRAFT IMAGES - Nova imagem criada:", {
        id: imageData.id,
        color: imageData.color,
        variationId: imageData.variationId,
        fileName: file.name,
        fileSize: file.size,
        preview: imageData.preview,
      });

      setDraftImages((prev) => {
        // Remover imagem existente da mesma cor se houver
        const filtered = prev.filter((img) => img.color !== color);
        const updated = [...filtered, imageData];
        console.log(
          "📊 USE VARIATION DRAFT IMAGES - Total de imagens após adição:",
          updated.length
        );
        return updated;
      });

      return imageData;
    },
    [createBlobUrl]
  );

  const removeVariationImage = useCallback(
    (color: string) => {
      console.log(
        "🗑 USE VARIATION DRAFT IMAGES - Removendo imagem da cor:",
        color
      );

      setDraftImages((prev) => {
        const imageToRemove = prev.find((img) => img.color === color);

        if (imageToRemove) {
          console.log(
            "📍 USE VARIATION DRAFT IMAGES - Imagem encontrada para remoção:",
            {
              id: imageToRemove.id,
              color: imageToRemove.color,
              isExisting: imageToRemove.isExisting,
              hasPreview: !!imageToRemove.preview,
            }
          );

          // Cleanup de blob URL apenas se for uma nova imagem
          if (
            !imageToRemove.isExisting &&
            imageToRemove.preview?.startsWith("blob:")
          ) {
            revokeBlobUrl(imageToRemove.preview);
          }
        }

        const filtered = prev.filter((img) => img.color !== color);
        console.log(
          "📊 USE VARIATION DRAFT IMAGES - Imagens restantes após remoção:",
          filtered.length
        );
        return filtered;
      });
    },
    [revokeBlobUrl]
  );

  const uploadVariationImages = useCallback(
    async (productId: string): Promise<Record<string, string>> => {
      console.log(
        "📤 USE VARIATION DRAFT IMAGES - Iniciando upload de imagens de variações"
      );
      console.log("🆔 USE VARIATION DRAFT IMAGES - Product ID:", productId);
      console.log(
        "📊 USE VARIATION DRAFT IMAGES - Imagens para processar:",
        draftImages.length
      );

      if (draftImages.length === 0) {
        console.log(
          "⚠️ USE VARIATION DRAFT IMAGES - Nenhuma imagem para upload"
        );
        return {};
      }

      if (isUploading) {
        console.log(
          "⏳ USE VARIATION DRAFT IMAGES - Upload já em andamento, ignorando..."
        );
        return {};
      }

      setIsUploading(true);
      const uploadedUrls: Record<string, string> = {};

      try {
        // 1. Remover imagens de variações existentes do produto
        console.log(
          "🗑 USE VARIATION DRAFT IMAGES - Removendo imagens de variações existentes..."
        );
        const { error: deleteImagesError } = await supabase
          .from("product_variations")
          .update({ image_url: null })
          .eq("product_id", productId);

        if (deleteImagesError) {
          console.error(
            "❌ USE VARIATION DRAFT IMAGES - Erro ao remover imagens existentes:",
            deleteImagesError
          );
        } else {
          console.log(
            "✅ USE VARIATION DRAFT IMAGES - Imagens existentes removidas do BD"
          );
        }

        // 2. Remover arquivos existentes do storage (pasta variations)
        console.log(
          "🗑 USE VARIATION DRAFT IMAGES - Removendo arquivos do storage..."
        );
        const { data: existingFiles } = await supabase.storage
          .from("product-images")
          .list(`${productId}/variations`);

        if (existingFiles && existingFiles.length > 0) {
          const filesToDelete = existingFiles.map(
            (file) => `${productId}/variations/${file.name}`
          );
          const { error: deleteStorageError } = await supabase.storage
            .from("product-images")
            .remove(filesToDelete);

          if (deleteStorageError) {
            console.error(
              "❌ USE VARIATION DRAFT IMAGES - Erro ao remover do storage:",
              deleteStorageError
            );
          } else {
            console.log(
              "✅ USE VARIATION DRAFT IMAGES - Arquivos antigos removidos do storage"
            );
          }
        }

        // 3. Fazer upload apenas das imagens que têm arquivo (novas)
        const imagesToUpload = draftImages.filter(
          (img) => img.file && !img.uploaded
        );
        console.log(
          "📤 USE VARIATION DRAFT IMAGES - Imagens para upload:",
          imagesToUpload.length
        );

        for (let i = 0; i < imagesToUpload.length; i++) {
          const image = imagesToUpload[i];

          console.log(
            `📤 USE VARIATION DRAFT IMAGES - Upload imagem ${i + 1}/${
              imagesToUpload.length
            }`
          );
          console.log("📁 USE VARIATION DRAFT IMAGES - Arquivo:", {
            color: image.color,
            name: image.file!.name,
            size: image.file!.size,
            type: image.file!.type,
          });

          const fileExt = image.file!.name.split(".").pop();
          const colorSlug = image.color
            .toLowerCase()
            .replace(/\s+/g, "-")
            .replace(/[^a-z0-9-]/g, "");
          const fileName = `${productId}/variations/${colorSlug}-${Date.now()}-${i}.${fileExt}`;

          // Upload para o storage
          const { data: uploadData, error: uploadError } =
            await supabase.storage
              .from("product-images")
              .upload(fileName, image.file!, {
                cacheControl: "3600",
                upsert: false,
              });

          if (uploadError) {
            console.error(
              "❌ USE VARIATION DRAFT IMAGES - Erro no upload da imagem:",
              uploadError
            );
            continue;
          }

          console.log(
            "✅ USE VARIATION DRAFT IMAGES - Upload bem-sucedido:",
            uploadData.path
          );

          // Obter URL pública
          const { data: urlData } = supabase.storage
            .from("product-images")
            .getPublicUrl(uploadData.path);

          const imageUrl = urlData.publicUrl;
          console.log(
            "🔗 USE VARIATION DRAFT IMAGES - URL pública gerada:",
            imageUrl
          );
          uploadedUrls[image.color] = imageUrl;

          // Atualizar a variação com a URL da imagem (se a variação já existe no banco)
          if (
            image.variationId &&
            image.variationId.match(
              /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
            )
          ) {
            console.log(
              "💾 USE VARIATION DRAFT IMAGES - Salvando URL na variação:",
              image.variationId
            );
            const { error: updateError } = await supabase
              .from("product_variations")
              .update({ image_url: imageUrl })
              .eq("id", image.variationId);

            if (updateError) {
              console.error(
                "❌ USE VARIATION DRAFT IMAGES - Erro ao atualizar variação:",
                updateError
              );
            } else {
              console.log(
                "✅ USE VARIATION DRAFT IMAGES - Variação atualizada com sucesso"
              );
            }
          } else {
            console.log(
              "⚠️ USE VARIATION DRAFT IMAGES - Variação ainda não salva, URL será associada quando salvar"
            );
          }
        }

        // 4. Atualizar estado das imagens como enviadas
        setDraftImages((prev) =>
          prev.map((img) => ({
            ...img,
            uploaded: true,
            url: uploadedUrls[img.color] || img.url,
          }))
        );

        console.log(
          "✅ USE VARIATION DRAFT IMAGES - Upload concluído com sucesso"
        );
        console.log(
          "📊 USE VARIATION DRAFT IMAGES - URLs geradas:",
          Object.keys(uploadedUrls)
        );

        toast({
          title: "Sucesso!",
          description: `Imagens das variações enviadas com sucesso`,
        });

        return uploadedUrls;
      } catch (error) {
        console.error("💥 USE VARIATION DRAFT IMAGES - Erro no upload:", error);
        toast({
          title: "Erro no upload",
          description:
            error instanceof Error
              ? error.message
              : "Falha no upload das imagens",
          variant: "destructive",
        });
        return {};
      } finally {
        setIsUploading(false);
      }
    },
    [draftImages, isUploading, toast]
  );

  const loadExistingVariationImages = useCallback(
    async (productId: string) => {
      if (loadedProductIdRef.current === productId && draftImages.length > 0) {
        console.log(
          "🔄 USE VARIATION DRAFT IMAGES - Imagens já carregadas para este produto"
        );
        return;
      }

      console.log(
        "📥 USE VARIATION DRAFT IMAGES - Carregando imagens existentes do produto:",
        productId
      );
      setIsLoading(true);
      loadedProductIdRef.current = productId;

      try {
        const { data: variations, error } = await supabase
          .from("product_variations")
          .select("id, color, image_url")
          .eq("product_id", productId)
          .not("image_url", "is", null);

        if (error) {
          console.error(
            "❌ USE VARIATION DRAFT IMAGES - Erro ao carregar imagens existentes:",
            error
          );
          return;
        }

        if (variations && variations.length > 0) {
          console.log(
            "📊 USE VARIATION DRAFT IMAGES - Imagens existentes encontradas:",
            variations.length
          );
          const existingImages: VariationDraftImage[] = variations.map(
            (variation) => ({
              id: `existing-${variation.id}`,
              color: variation.color,
              variationId: variation.id,
              preview: variation.image_url,
              uploaded: true,
              url: variation.image_url,
              isExisting: true,
            })
          );

          setDraftImages(existingImages);
          console.log(
            "✅ USE VARIATION DRAFT IMAGES - Imagens existentes carregadas"
          );
        } else {
          console.log(
            "⚠️ USE VARIATION DRAFT IMAGES - Nenhuma imagem existente encontrada"
          );
          setDraftImages([]);
        }
      } catch (error) {
        console.error(
          "💥 USE VARIATION DRAFT IMAGES - Erro ao carregar imagens:",
          error
        );
      } finally {
        setIsLoading(false);
      }
    },
    [draftImages.length]
  );

  const clearVariationImages = useCallback(() => {
    console.log("🧹 USE VARIATION DRAFT IMAGES - Limpando todas as imagens");
    cleanupAllBlobUrls();
    setDraftImages([]);
    loadedProductIdRef.current = null;
  }, [cleanupAllBlobUrls]);

  const getImageForColor = useCallback(
    (color: string) => {
      const image = draftImages.find(
        (img) => img.color.toLowerCase() === color.toLowerCase()
      );
      console.log(
        "🔍 GET IMAGE FOR COLOR - Buscando imagem para cor:",
        color,
        "Resultado:",
        image
      );
      return image;
    },
    [draftImages]
  );

  return {
    draftImages,
    isUploading,
    isLoading,
    addVariationImage,
    removeVariationImage,
    uploadVariationImages,
    loadExistingVariationImages,
    clearVariationImages,
    getImageForColor,
  };
};
