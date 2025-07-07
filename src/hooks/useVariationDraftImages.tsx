
import { useState, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface VariationImageData {
  colorName: string;
  file: File;
  preview: string;
  uploaded?: boolean;
  url?: string;
}

export const useVariationDraftImages = () => {
  const [variationImages, setVariationImages] = useState<VariationImageData[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const addVariationImage = useCallback((colorName: string, file: File) => {
    console.log("📷 VARIATION DRAFT - Adicionando imagem para cor:", colorName);
    
    const preview = URL.createObjectURL(file);
    
    setVariationImages(prev => {
      // Remove imagem anterior da mesma cor se existir
      const filtered = prev.filter(img => img.colorName !== colorName);
      
      return [
        ...filtered,
        {
          colorName,
          file,
          preview,
          uploaded: false,
        }
      ];
    });
  }, []);

  const removeVariationImage = useCallback((colorName: string) => {
    console.log("🗑️ VARIATION DRAFT - Removendo imagem para cor:", colorName);
    
    setVariationImages(prev => {
      const imageToRemove = prev.find(img => img.colorName === colorName);
      if (imageToRemove?.preview) {
        URL.revokeObjectURL(imageToRemove.preview);
      }
      
      return prev.filter(img => img.colorName !== colorName);
    });
  }, []);

  const getVariationImage = useCallback((colorName: string) => {
    return variationImages.find(img => img.colorName === colorName);
  }, [variationImages]);

  const uploadVariationImages = useCallback(async (productId: string) => {
    if (variationImages.length === 0) {
      console.log("📷 VARIATION DRAFT - Nenhuma imagem para upload");
      return [];
    }

    console.log("📤 VARIATION DRAFT - Iniciando upload para produto:", productId);
    setIsUploading(true);

    const uploadResults: Array<{ colorName: string; url: string }> = [];

    try {
      for (const imageData of variationImages) {
        if (imageData.uploaded) {
          console.log("⏭️ VARIATION DRAFT - Imagem já enviada:", imageData.colorName);
          continue;
        }

        console.log("📤 VARIATION DRAFT - Fazendo upload:", imageData.colorName);
        
        const timestamp = Date.now();
        const fileName = `${productId}/variations/${imageData.colorName}-${timestamp}.${imageData.file.name.split('.').pop()}`;

        const { data, error } = await supabase.storage
          .from("product-images")
          .upload(fileName, imageData.file, {
            cacheControl: "3600",
            upsert: false,
          });

        if (error) {
          console.error("❌ VARIATION DRAFT - Erro no upload:", imageData.colorName, error);
          toast({
            title: "Erro no upload",
            description: `Erro ao enviar imagem da variação ${imageData.colorName}`,
            variant: "destructive",
          });
          continue;
        }

        // Obter URL pública
        const { data: urlData } = supabase.storage
          .from("product-images")
          .getPublicUrl(data.path);

        const publicUrl = urlData.publicUrl;
        
        uploadResults.push({
          colorName: imageData.colorName,
          url: publicUrl,
        });

        // Marcar como enviado
        setVariationImages(prev => 
          prev.map(img => 
            img.colorName === imageData.colorName 
              ? { ...img, uploaded: true, url: publicUrl }
              : img
          )
        );

        console.log("✅ VARIATION DRAFT - Upload concluído:", imageData.colorName, publicUrl);
      }

      if (uploadResults.length > 0) {
        toast({
          title: "Upload concluído",
          description: `${uploadResults.length} imagem(ns) de variação enviada(s) com sucesso`,
        });
      }

      return uploadResults;
    } catch (error) {
      console.error("💥 VARIATION DRAFT - Erro no upload:", error);
      toast({
        title: "Erro",
        description: "Erro ao enviar imagens das variações",
        variant: "destructive",
      });
      return [];
    } finally {
      setIsUploading(false);
    }
  }, [variationImages, toast]);

  const clearVariationImages = useCallback(() => {
    console.log("🧹 VARIATION DRAFT - Limpando imagens das variações");
    
    // Revogar URLs de preview
    variationImages.forEach(img => {
      if (img.preview) {
        URL.revokeObjectURL(img.preview);
      }
    });
    
    setVariationImages([]);
  }, [variationImages]);

  const getAllImages = useCallback(() => {
    return variationImages;
  }, [variationImages]);

  return {
    variationImages,
    isUploading,
    addVariationImage,
    removeVariationImage,
    getVariationImage,
    uploadVariationImages,
    clearVariationImages,
    getAllImages,
  };
};
