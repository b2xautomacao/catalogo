import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface ProductImage {
  id: string;
  image_url: string;
  alt_text: string;
  is_primary: boolean;
  image_order: number;
  product_id: string;
  is_variation_image: boolean;
  display_order: number;
  color_association: string | null;
  variation_id: string | null;
  created_at: string;
}

export const useProductImageManager = (productId?: string) => {
  const [images, setImages] = useState<ProductImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchImages = async (productId: string) => {
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from("product_images")
        .select("*")
        .eq("product_id", productId)
        .order("image_order", { ascending: true });

      if (error) {
        setError(error.message);
        return;
      }

      setImages(
        data.map((img) => ({
          id: img.id,
          image_url: img.image_url,
          alt_text: img.alt_text || "",
          is_primary: img.is_primary || false,
          image_order: img.image_order || 0,
          product_id: img.product_id,
          is_variation_image: img.is_variation_image || false,
          display_order: img.display_order || 0,
          color_association: img.color_association || null,
          variation_id: img.variation_id || null,
          created_at: img.created_at,
        }))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao buscar imagens");
    } finally {
      setLoading(false);
    }
  };

  const addImage = async (
    image_url: string,
    alt_text: string,
    is_primary: boolean
  ) => {
    try {
      const { data, error } = await supabase.from("product_images").insert([
        {
          image_url,
          alt_text,
          is_primary,
          product_id: productId,
          image_order: images.length,
        },
      ]);

      if (error) throw error;

      setImages([
        ...images,
        {
          id: data![0].id,
          image_url,
          alt_text,
          is_primary,
          product_id: productId,
          image_order: images.length,
          is_variation_image: false,
          display_order: images.length,
          color_association: null,
          variation_id: null,
          created_at: new Date().toISOString(),
        },
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao adicionar imagem");
    }
  };

  const updateImage = async (
    id: string,
    updates: Partial<{
      image_url: string;
      alt_text: string;
      is_primary: boolean;
      image_order: number;
    }>
  ) => {
    try {
      const { data, error } = await supabase
        .from("product_images")
        .update(updates)
        .eq("id", id);

      if (error) throw error;

      setImages(
        images.map((img) =>
          img.id === id ? { ...img, ...updates } : img
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao atualizar imagem");
    }
  };

  const deleteImage = async (id: string) => {
    try {
      const { error } = await supabase.from("product_images").delete().eq("id", id);

      if (error) throw error;

      setImages(images.filter((img) => img.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao deletar imagem");
    }
  };

  const updateImageOrder = async (reorderedImages: { id: string; image_order: number; is_primary: boolean; image_url: string; product_id: string }[]) => {
    try {
      console.log('🔄 Atualizando ordem das imagens:', reorderedImages);
      
      // Preparar dados com todas as propriedades necessárias
      const updates = reorderedImages.map(img => ({
        id: img.id,
        image_order: img.image_order,
        is_primary: img.is_primary,
        image_url: img.image_url,
        product_id: img.product_id,
      }));
      
      const { error } = await supabase
        .from('product_images')
        .upsert(updates);

      if (error) throw error;
      
      console.log('✅ Ordem das imagens atualizada com sucesso');
      
      // Atualizar estado local
      setImages(reorderedImages.map(img => ({
        id: img.id,
        image_url: img.image_url,
        is_primary: img.is_primary,
        image_order: img.image_order,
        product_id: img.product_id,
        alt_text: '',
        is_variation_image: false,
        display_order: img.image_order,
        color_association: null,
        variation_id: null,
        created_at: new Date().toISOString(),
      })));
      
    } catch (error) {
      console.error('❌ Erro ao atualizar ordem das imagens:', error);
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
    fetchImages,
    addImage,
    updateImage,
    deleteImage,
    updateImageOrder,
    setImages,
  };
};
