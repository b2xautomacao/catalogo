import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ProductVariation } from "@/types/product";
import { reconcileProductVariations } from "@/lib/variationReconciliationService";

export const useProductVariations = (
  productId?: string,
  initialData?: ProductVariation[],
  storeId?: string
) => {
  const [variations, setVariations] = useState<ProductVariation[]>(initialData || []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchVariations = useCallback(async (id: string) => {
    if (initialData && initialData.length > 0 && initialData.every(v => v.product_id === id)) {
      setVariations(initialData);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from("product_variations")
        .select("*")
        .eq("product_id", id)
        .eq("is_active", true)
        .order("display_order", { ascending: true });

      if (fetchError) {
        setError(fetchError.message);
        setVariations([]);
        return;
      }

      const processedVariations = data?.map((v: any) => ({
        id: v.id,
        product_id: v.product_id,
        color: v.color,
        size: v.size,
        sku: v.sku,
        stock: v.stock,
        price_adjustment: v.price_adjustment,
        is_active: v.is_active,
        image_url: v.image_url,
        hex_color: v.hex_color || null,
        created_at: v.created_at,
        updated_at: v.updated_at,
        variation_type: v.variation_type,
        name: v.name || null,
        is_grade: v.is_grade || false,
        grade_name: v.grade_name || null,
        grade_color: v.grade_color || null,
        grade_quantity: v.grade_quantity || null,
        grade_sizes: v.grade_sizes || null,
        grade_pairs: v.grade_pairs || null,
        grade_sale_mode: v.grade_sale_mode || null,
        flexible_grade_config: v.flexible_grade_config || null,
        grade_price: typeof v.grade_price === 'number' ? v.grade_price : null,
      })) || [];

      setVariations(processedVariations);
    } catch (err: any) {
      setError(err.message || "Erro desconhecido");
      setVariations([]);
    } finally {
      setLoading(false);
    }
  }, [initialData]);

  const uploadVariationImage = useCallback(async (
    file: File,
    variationIndex: number,
    id: string
  ): Promise<string | null> => {
    try {
      const fileExt = file.name.split(".").pop()?.toLowerCase();
      const fileName = `variations/${id}/${variationIndex}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("product-images")
        .upload(fileName, file, { cacheControl: "3600", upsert: false });

      if (uploadError) return null;

      const { data: { publicUrl } } = supabase.storage.from("product-images").getPublicUrl(fileName);
      return publicUrl;
    } catch (error) {
      return null;
    }
  }, []);

  const saveVariations = useCallback(async (
    prodId: string,
    vars: ProductVariation[],
    targetStoreId?: string
  ) => {
    try {
      const effectiveStoreId = targetStoreId || storeId;
      const result = await reconcileProductVariations(prodId, vars, {
        storeId: effectiveStoreId,
        uploadImageFn: uploadVariationImage,
      });

      if (!result.success) {
        throw new Error(result.error || "Falha na reconciliação de variações");
      }

      setVariations(result.variations);
      toast({
        title: "Variações sincronizadas!",
        description: `${result.variations.length} variação(ões) salva(s) com sucesso.`,
      });
      return { success: true, error: null };
    } catch (error: any) {
      toast({ title: "Erro ao salvar variações", description: error.message, variant: "destructive" });
      return { success: false, error: error.message };
    }
  }, [storeId, uploadVariationImage, toast]);

  const deleteVariationById = useCallback(async (variationId: string) => {
    try {
      const { error: delError } = await supabase.from("product_variations").delete().eq("id", variationId);
      if (delError) throw delError;
      setVariations((prev) => prev.filter((v) => v.id !== variationId));
      toast({ title: "Variação excluída!", description: "Variação removida com sucesso." });
      return true;
    } catch (error: any) {
      toast({ title: "Erro ao excluir variação", description: error.message, variant: "destructive" });
      return false;
    }
  }, [toast]);

  useEffect(() => {
    if (initialData && initialData.length > 0 && initialData.every(v => v.product_id === productId)) {
      setVariations(initialData);
      setLoading(false);
      setError(null);
      return;
    }

    if (productId && productId.trim() !== "") {
      fetchVariations(productId);
    } else if (productId === undefined || productId === null || productId === "") {
      setVariations([]);
      setLoading(false);
      setError(null);
    }
  }, [productId, initialData, fetchVariations]);

  const refetch = useCallback(() => {
    if (productId) fetchVariations(productId);
  }, [productId, fetchVariations]);

  return useMemo(() => ({
    variations,
    loading,
    error,
    saveVariations,
    refetch,
    deleteVariationById,
  }), [variations, loading, error, saveVariations, refetch, deleteVariationById]);
};
