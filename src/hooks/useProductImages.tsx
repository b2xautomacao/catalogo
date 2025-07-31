import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface ProductImage {
  id: string;
  product_id: string;
  image_url: string;
  alt_text?: string;
  is_primary: boolean;
  image_order: number;
  created_at: string;
}

export const useProductImages = (productId?: string) => {
  const [images, setImages] = useState<ProductImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchImages = async (id: string) => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from("product_images")
        .select("*")
        .eq("product_id", id)
        .order("image_order", { ascending: true });

      if (fetchError) {
        setError(fetchError.message);
        return;
      }

      // 🎯 NOVA LÓGICA: Ordenar com is_primary tendo prioridade
      const sortedImages = (data || []).sort((a, b) => {
        // 1. Imagem principal sempre primeiro
        if (a.is_primary && !b.is_primary) return -1;
        if (!a.is_primary && b.is_primary) return 1;

        // 2. Se ambas são principais ou nenhuma é, usar image_order
        return a.image_order - b.image_order;
      });

      console.log(
        "🖼️ IMAGES - Imagens ordenadas:",
        sortedImages.map((img) => ({
          id: img.id.substring(0, 8),
          is_primary: img.is_primary,
          image_order: img.image_order,
          url: img.image_url.split("/").pop(),
        }))
      );

      setImages(sortedImages);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao buscar imagens");
    } finally {
      setLoading(false);
    }
  };

  const refetchImages = async () => {
    if (productId) {
      await fetchImages(productId);
    }
  };

  useEffect(() => {
    if (productId) {
      fetchImages(productId);
    }
  }, [productId]);

  return {
    images,
    loading,
    error,
    refetchImages,
  };
};
