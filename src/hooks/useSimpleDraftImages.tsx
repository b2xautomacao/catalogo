import { useState, useCallback, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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
  const loadedProductIdRef = useRef<string | null>(null);
  const { toast } = useToast();

  // Cleanup seguro das blob URLs
  const revokeBlobUrl = useCallback((url: string) => {
    if (url?.startsWith("blob:") && blobUrlsRef.current.has(url)) {
      try {
        URL.revokeObjectURL(url);
        blobUrlsRef.current.delete(url);
      } catch (error) {
        console.warn("Erro ao revogar blob URL:", error);
      }
    }
  }, []);

  // Cleanup automático apenas no unmount
  useEffect(() => {
    return () => {
      blobUrlsRef.current.forEach((url) => {
        try {
          URL.revokeObjectURL(url);
        } catch (error) {
          console.warn("Erro na limpeza final:", error);
        }
      });
      blobUrlsRef.current.clear();
    };
  }, []);

  const createBlobUrl = useCallback((file: File): string => {
    const url = URL.createObjectURL(file);
    blobUrlsRef.current.add(url);
    return url;
  }, []);

  const addImages = useCallback(
    (files: File[]) => {
      console.log(
        "🔄 ADD IMAGES - Iniciando adição de",
        files.length,
        "imagens"
      );
      console.log("🔄 ADD IMAGES - Imagens atuais:", images.length);

      const newImages: SimpleDraftImage[] = files.map((file) => {
        const preview = createBlobUrl(file);
        console.log("🔄 ADD IMAGES - Criando preview para:", file.name);
        return {
          id: `draft-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          file,
          preview,
          uploaded: false,
          isExisting: false,
        };
      });

      setImages((prev) => {
        const updated = [...prev, ...newImages];
        console.log(
          "🔄 ADD IMAGES - Total de imagens após adição:",
          updated.length
        );
        return updated;
      });

      console.log("✅ ADD IMAGES - Imagens adicionadas com sucesso");
      return newImages;
    },
    [createBlobUrl, images.length]
  );

  const removeImage = useCallback(
    (id: string) => {
      setImages((prev) => {
        const imageToRemove = prev.find((img) => img.id === id);

        if (
          imageToRemove?.preview &&
          imageToRemove.preview.startsWith("blob:")
        ) {
          revokeBlobUrl(imageToRemove.preview);
        }

        const filtered = prev.filter((img) => img.id !== id);
        return filtered;
      });
    },
    [revokeBlobUrl]
  );

  const uploadImages = useCallback(
    async (productId: string): Promise<string[]> => {
      if (!productId || images.length === 0 || isUploading) {
        return [];
      }

      setIsUploading(true);
      const uploadedUrls: string[] = [];

      try {
        // Buscar imagens já existentes
        const { data: existingImages, error: existingError } = await supabase
          .from("product_images")
          .select("image_url")
          .eq("product_id", productId);

        const existingUrls = (existingImages || []).map((img) => img.image_url);

        // Upload novas imagens (apenas as que têm arquivo)
        const imagesToUpload = images.filter(
          (img) => img.file && !img.uploaded
        );

        for (let i = 0; i < imagesToUpload.length; i++) {
          const image = imagesToUpload[i];
          const fileExt = image.file!.name.split(".").pop();
          const fileName = `${productId}/${Date.now()}-${i}.${fileExt}`;

          const { data: uploadData, error: uploadError } =
            await supabase.storage
              .from("product-images")
              .upload(fileName, image.file!);

          if (uploadError) {
            console.error("Erro no upload da imagem", i, ":", uploadError);
            continue;
          }

          const { data: urlData } = supabase.storage
            .from("product-images")
            .getPublicUrl(uploadData.path);

          const imageUrl = urlData.publicUrl;
          uploadedUrls.push(imageUrl);

          await supabase.from("product_images").insert({
            product_id: productId,
            image_url: imageUrl,
            image_order: existingUrls.length + uploadedUrls.length,
            is_primary: existingUrls.length + uploadedUrls.length === 1,
            alt_text: `Imagem ${
              existingUrls.length + uploadedUrls.length
            } do produto`,
          });
        }

        // Atualizar imagem principal do produto
        const allUrls = [...existingUrls, ...uploadedUrls];
        if (allUrls.length > 0) {
          await supabase
            .from("products")
            .update({ image_url: allUrls[0] })
            .eq("id", productId);
        }

        toast({
          title: "Sucesso!",
          description: `${uploadedUrls.length} imagem(ns) enviada(s) com sucesso`,
        });

        return [...existingUrls, ...uploadedUrls];
      } catch (error) {
        console.error("💥 Erro no upload:", error);
        toast({
          title: "Erro no upload",
          description: "Falha no processo de upload das imagens",
          variant: "destructive",
        });
        return [];
      } finally {
        setIsUploading(false);
      }
    },
    [images, toast, isUploading]
  );

  const loadExistingImages = useCallback(
    async (productId: string) => {
      // Evitar chamadas duplicadas para o mesmo produto
      if (!productId || isLoading || loadedProductIdRef.current === productId) {
        return;
      }

      setIsLoading(true);
      loadedProductIdRef.current = productId;

      try {
        const { data: productImages, error } = await supabase
          .from("product_images")
          .select("*")
          .eq("product_id", productId)
          .order("image_order");

        if (error) {
          console.error("Erro ao carregar imagens:", error);
          return;
        }

        if (productImages && productImages.length > 0) {
          const existingImages: SimpleDraftImage[] = productImages.map(
            (img) => ({
              id: `existing-${img.id}`,
              preview: img.image_url,
              url: img.image_url,
              uploaded: true,
              isExisting: true,
            })
          );

          // Manter as imagens existentes sem limpar imagens novas já adicionadas
          setImages((prev) => {
            // Filtrar imagens existentes antigas e manter apenas as novas (não enviadas)
            const newImages = prev.filter((img) => !img.isExisting);
            return [...existingImages, ...newImages];
          });
        }
      } catch (error) {
        console.error("💥 Erro no carregamento de imagens:", error);
      } finally {
        setIsLoading(false);
      }
    },
    [isLoading]
  );

  const clearImages = useCallback(() => {
    // Revogar apenas blob URLs de imagens não enviadas
    images.forEach((img) => {
      if (img.preview?.startsWith("blob:") && !img.uploaded) {
        revokeBlobUrl(img.preview);
      }
    });

    setImages([]);
    loadedProductIdRef.current = null;
  }, [images, revokeBlobUrl]);

  // Função para fazer upload apenas das imagens novas (preservando existentes)
  const uploadNewImages = useCallback(
    async (productId: string): Promise<string[]> => {
      console.log("🚀 UPLOAD NEW IMAGES - Iniciando com productId:", productId);
      console.log("🚀 UPLOAD NEW IMAGES - isUploading:", isUploading);
      console.log("🚀 UPLOAD NEW IMAGES - Total de imagens:", images.length);

      if (!productId || isUploading) {
        console.log("⏭️ Upload de novas imagens pulado:", {
          productId,
          isUploading,
        });
        return [];
      }

      const newImages = images.filter((img) => img.file && !img.uploaded);
      console.log(
        "🚀 UPLOAD NEW IMAGES - Imagens novas encontradas:",
        newImages.length
      );
      console.log(
        "🚀 UPLOAD NEW IMAGES - Detalhes das imagens novas:",
        newImages.map((img) => ({
          id: img.id,
          fileName: img.file?.name,
          uploaded: img.uploaded,
          isExisting: img.isExisting,
        }))
      );

      if (newImages.length === 0) {
        console.log("📭 Nenhuma imagem nova para upload");
        return [];
      }

      setIsUploading(true);
      const uploadedUrls: string[] = [];

      try {
        console.log(
          "📤 Iniciando upload de",
          newImages.length,
          "imagens novas para produto:",
          productId
        );

        // Obter a maior ordem atual
        const { data: maxOrderData } = await supabase
          .from("product_images")
          .select("image_order")
          .eq("product_id", productId)
          .order("image_order", { ascending: false })
          .limit(1);

        // Sempre começar do 1 se não há imagens, ou usar o próximo valor disponível
        let nextOrder = 1;
        if (maxOrderData && maxOrderData.length > 0) {
          nextOrder = Math.min(maxOrderData[0].image_order + 1, 10);
        }

        console.log("🚀 UPLOAD NEW IMAGES - Próxima ordem:", nextOrder);
        console.log(
          "🚀 UPLOAD NEW IMAGES - Máxima ordem atual:",
          maxOrderData?.[0]?.image_order || 0
        );

        // Upload apenas das novas imagens
        for (let i = 0; i < newImages.length; i++) {
          const image = newImages[i];
          console.log(
            "🚀 UPLOAD NEW IMAGES - Processando imagem",
            i + 1,
            "de",
            newImages.length,
            ":",
            image.file?.name
          );

          const fileExt = image.file!.name.split(".").pop();
          const fileName = `${productId}/${Date.now()}-${i}.${fileExt}`;
          console.log("🚀 UPLOAD NEW IMAGES - Nome do arquivo:", fileName);

          const { data: uploadData, error: uploadError } =
            await supabase.storage
              .from("product-images")
              .upload(fileName, image.file!);

          if (uploadError) {
            console.error(
              "❌ UPLOAD NEW IMAGES - Erro no upload da imagem",
              i,
              ":",
              uploadError
            );
            continue;
          }

          console.log(
            "✅ UPLOAD NEW IMAGES - Upload do storage concluído:",
            uploadData.path
          );

          const { data: urlData } = supabase.storage
            .from("product-images")
            .getPublicUrl(uploadData.path);

          const imageUrl = urlData.publicUrl;
          uploadedUrls.push(imageUrl);

          // Calcular ordem da imagem (1-10)
          const imageOrder = Math.min(nextOrder + i, 10);

          console.log("🚀 UPLOAD NEW IMAGES - Inserindo no banco:", {
            product_id: productId,
            image_url: imageUrl,
            image_order: imageOrder,
          });

          const { error: insertError } = await supabase
            .from("product_images")
            .insert({
              product_id: productId,
              image_url: imageUrl,
              image_order: imageOrder,
              is_primary: false, // Não sobrescrever imagem principal
              alt_text: `Imagem ${imageOrder} do produto`,
            });

          if (insertError) {
            console.error(
              "❌ UPLOAD NEW IMAGES - Erro ao inserir no banco:",
              insertError
            );
          } else {
            console.log("✅ UPLOAD NEW IMAGES - Inserido no banco com sucesso");
          }

          console.log(
            "✅ Nova imagem",
            i + 1,
            "enviada:",
            imageUrl.substring(0, 50) + "..."
          );
        }

        toast({
          title: "Sucesso!",
          description: `${uploadedUrls.length} nova(s) imagem(ns) adicionada(s)`,
        });

        console.log(
          "🎉 Upload de novas imagens concluído:",
          uploadedUrls.length
        );
        return uploadedUrls;
      } catch (error) {
        console.error("💥 Erro no upload de novas imagens:", error);
        toast({
          title: "Erro no upload",
          description: "Falha no upload das novas imagens",
          variant: "destructive",
        });
        return [];
      } finally {
        setIsUploading(false);
      }
    },
    [images, toast, isUploading]
  );

  // Novo método para upload imediato ao adicionar imagens
  const addAndUploadImages = useCallback(
    async (files: File[], productId?: string) => {
      const newImages = addImages(files);
      if (productId) {
        // Upload imediato
        for (let i = 0; i < newImages.length; i++) {
          const image = newImages[i];
          const fileExt = image.file!.name.split(".").pop();
          const fileName = `${productId}/${Date.now()}-${i}.${fileExt}`;
          const { data: uploadData, error: uploadError } =
            await supabase.storage
              .from("product-images")
              .upload(fileName, image.file!);
          if (uploadError) continue;
          const { data: urlData } = supabase.storage
            .from("product-images")
            .getPublicUrl(uploadData.path);
          const imageUrl = urlData.publicUrl;
          await supabase.from("product_images").insert({
            product_id: productId,
            image_url: imageUrl,
            image_order: i + 1,
            is_primary: i === 0, // Primeira imagem como principal
            alt_text: `Imagem ${i + 1} do produto`,
          });
          // Atualizar image_url do produto se for a primeira
          if (i === 0) {
            await supabase
              .from("products")
              .update({ image_url: imageUrl })
              .eq("id", productId);
          }
        }
      }
      return newImages;
    },
    [addImages]
  );

  // Função para deletar todas as imagens órfãs de um productId
  const deleteAllProductImages = useCallback(async (productId: string) => {
    await supabase.from("product_images").delete().eq("product_id", productId);
    // Opcional: deletar do storage também
  }, []);

  return {
    images,
    isUploading,
    isLoading,
    addImages,
    removeImage,
    uploadImages, // Upload completo (limpa e refaz tudo)
    uploadNewImages, // Upload apenas de novas (preserva existentes)
    loadExistingImages,
    clearImages,
    addAndUploadImages,
    deleteAllProductImages,
  };
};
