import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ProductImage } from "@/hooks/useProductImages";

export const useProductImageManager = (productId?: string) => {
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const uploadProductImage = useCallback(
    async (file: File, imageOrder: number): Promise<ProductImage | null> => {
      if (!productId) {
        toast({
          title: "Erro",
          description: "ID do produto não encontrado para o upload.",
          variant: "destructive",
        });
        return null;
      }

      setIsUploading(true);
      try {
        const fileExt = file.name.split(".").pop();
        const fileName = `products/${productId}/${Date.now()}.${fileExt}`;

        // 1. Upload para o Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("product-images")
          .upload(fileName, file);

        if (uploadError) {
          throw new Error(`Erro no upload: ${uploadError.message}`);
        }

        // 2. Obter URL pública
        const { data: urlData } = supabase.storage
          .from("product-images")
          .getPublicUrl(uploadData.path);

        const imageUrl = urlData.publicUrl;

        // 3. Inserir na tabela product_images
        const newImageData = {
          product_id: productId,
          image_url: imageUrl,
          image_order: imageOrder + 1, // image_order deve começar em 1, não 0
          is_primary: imageOrder === 0, // A primeira imagem é a principal
          alt_text: "", // Pode ser adicionado depois
        };

        const { data: newImage, error: insertError } = await supabase
          .from("product_images")
          .insert(newImageData)
          .select()
          .single();

        if (insertError) {
          throw new Error(`Erro ao salvar imagem: ${insertError.message}`);
        }

        toast({
          title: "Sucesso!",
          description: "Imagem do produto enviada com sucesso.",
        });

        return newImage;
      } catch (error) {
        console.error("💥 Erro no upload da imagem do produto:", error);
        toast({
          title: "Erro no upload",
          description:
            error instanceof Error
              ? error.message
              : "Falha no upload da imagem.",
          variant: "destructive",
        });
        return null;
      } finally {
        setIsUploading(false);
      }
    },
    [productId, toast]
  );

  const deleteProductImage = useCallback(
    async (imageId: string, imageUrl: string): Promise<boolean> => {
      try {
        // 1. Remover da tabela product_images
        const { error: deleteError } = await supabase
          .from("product_images")
          .delete()
          .eq("id", imageId);

        if (deleteError) {
          throw new Error(`Erro ao deletar imagem: ${deleteError.message}`);
        }

        // 2. Remover do Storage
        const pathMatch = imageUrl.match(/\/product-images\/(.+)$/);
        if (pathMatch) {
          await supabase.storage.from("product-images").remove([pathMatch[1]]);
        }

        toast({
          title: "Sucesso!",
          description: "Imagem removida.",
        });

        return true;
      } catch (error) {
        console.error("💥 Erro ao remover imagem do produto:", error);
        toast({
          title: "Erro",
          description:
            error instanceof Error ? error.message : "Falha ao remover imagem.",
          variant: "destructive",
        });
        return false;
      }
    },
    [toast]
  );

  const updateImageOrder = useCallback(
    async (
      updates: { id: string; image_order: number; is_primary: boolean }[]
    ) => {
      try {
        const { error } = await supabase.from("product_images").upsert(updates);

        if (error) {
          throw new Error(`Erro ao reordenar imagens: ${error.message}`);
        }

        toast({
          title: "Sucesso!",
          description: "Ordem das imagens atualizada.",
        });
      } catch (error) {
        console.error("💥 Erro ao reordenar imagens:", error);
        toast({
          title: "Erro",
          description:
            error instanceof Error
              ? error.message
              : "Falha ao reordenar imagens.",
          variant: "destructive",
        });
      }
    },
    [toast]
  );

  return {
    isUploading,
    uploadProductImage,
    deleteProductImage,
    updateImageOrder,
  };
};
