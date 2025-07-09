import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface ProductImage {
  id: string;
  product_id: string;
  image_url: string;
  image_order: number;
  is_primary: boolean;
  alt_text?: string;
  variation_id?: string;
}

export const useProductImages = (productId?: string) => {
  const [images, setImages] = useState<ProductImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastProductIdRef = useRef<string | undefined>(undefined);
  const isFetchingRef = useRef(false);

  const fetchImages = useCallback(async (id: string) => {
    // Evitar múltiplas requisições simultâneas
    if (isFetchingRef.current || lastProductIdRef.current === id) {
      return;
    }

    isFetchingRef.current = true;
    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from("product_images")
        .select("*")
        .eq("product_id", id)
        .order("image_order", { ascending: true });

      if (fetchError) {
        throw fetchError;
      }

      setImages(data || []);
      lastProductIdRef.current = id;
    } catch (err) {
      console.error("Erro ao buscar imagens do produto:", err);
      setError(err instanceof Error ? err.message : "Erro desconhecido");
      setImages([]);
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  }, []);

  useEffect(() => {
    if (productId && productId !== lastProductIdRef.current) {
      fetchImages(productId);
    } else if (!productId) {
      setImages([]);
      lastProductIdRef.current = undefined;
    }
  }, [productId, fetchImages]);

  const primaryImage = images.find((img) => img.is_primary);
  const secondaryImages = images.filter((img) => !img.is_primary);

  const refetchImages = useCallback(() => {
    if (productId) {
      lastProductIdRef.current = undefined; // Reset para forçar nova busca
      fetchImages(productId);
    }
  }, [productId, fetchImages]);

  return {
    images,
    primaryImage,
    secondaryImages,
    loading,
    error,
    refetchImages,
  };
};
