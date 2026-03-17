import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ProductVariation } from "@/types/product";

export const useProductVariations = (productId?: string, initialData?: ProductVariation[]) => {
  const [variations, setVariations] = useState<ProductVariation[]>(initialData || []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchVariations = async (id: string) => {
    // Se já temos dados iniciais e o ID coincide, não buscamos novamente
    if (initialData && initialData.length > 0 && initialData.every(v => v.product_id === id)) {
      console.log("🎨 VARIAÇÕES - Usando dados iniciais para:", id);
      setVariations(initialData);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log("🎨 VARIAÇÕES - Carregando para produto:", id);

      const { data, error: fetchError } = await supabase
        .from("product_variations")
        .select("*")
        .eq("product_id", id)
        .eq("is_active", true)
        .order("display_order", { ascending: true });

      if (fetchError) {
        console.error("❌ Erro ao buscar variações:", fetchError);
        setError(fetchError.message);
        setVariations([]);
        return;
      }

      // Processar variações para o formato compatível
      const processedVariations =
        data?.map((v: any) => ({
          id: v.id,
          product_id: v.product_id,
          color: v.color,
          size: v.size,
          sku: v.sku,
          stock: v.stock,
          price_adjustment: v.price_adjustment,
          is_active: v.is_active,
          image_url: v.image_url,
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
        })) || [];

      console.log(
        "✅ VARIAÇÕES - Carregadas com sucesso:",
        processedVariations.length
      );
      setVariations(processedVariations);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Erro desconhecido";
      console.error("🚨 Erro inesperado ao carregar variações:", err);
      setError(errorMessage);
      setVariations([]);
    } finally {
      setLoading(false);
    }
  };

  const uploadVariationImage = async (
    file: File,
    variationIndex: number,
    productId: string
  ): Promise<string | null> => {
    try {
      console.log("📤 Upload de imagem da variação:", variationIndex);

      const fileExt = file.name.split(".").pop()?.toLowerCase();
      const fileName = `variations/${productId}/${variationIndex}-${Date.now()}.${fileExt}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("product-images")
        .upload(fileName, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        console.error("❌ Erro no upload da variação:", uploadError);
        return null;
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from("product-images").getPublicUrl(fileName);

      console.log("✅ Upload da variação concluído:", publicUrl);
      return publicUrl;
    } catch (error) {
      console.error("🚨 Erro inesperado no upload da variação:", error);
      return null;
    }
  };

  const saveVariations = async (
    productId: string,
    variations: ProductVariation[]
  ) => {
    try {
      console.log("💾 VARIAÇÕES - Salvando variações:", variations.length);
      console.log(
        "🔍 DEBUG - Variações recebidas no saveVariations:",
        JSON.stringify(variations, null, 2)
      );

      // 1. Remover variações existentes que não são hierárquicas
      const { error: deleteError } = await supabase
        .from("product_variations")
        .delete()
        .eq("product_id", productId)
        .or(
          "variation_type.is.null,variation_type.eq.simple,variation_type.eq.grade"
        );

      if (deleteError) {
        console.error("❌ Erro ao remover variações antigas:", deleteError);
        throw deleteError;
      }

      // 2. Processar upload de imagens e inserir novas variações
      if (variations.length > 0) {
        console.log(
          `🎯 PROCESSANDO ${variations.length} variações para salvamento...`
        );

        const variationsToInsert: any[] = []; // 🎯 DEFINIR ARRAY PARA INSERÇÃO

        for (let i = 0; i < variations.length; i++) {
          const variation = variations[i];
          let imageUrl = variation.image_url;

          console.log(
            `🔄 [${i + 1}/${variations.length}] Processando variação:`,
            {
              id: variation.id,
              color: variation.color,
              is_grade: variation.is_grade,
              variation_type: variation.variation_type,
            }
          );

          // Upload da imagem se houver arquivo
          if (variation.image_file) {
            const uploadedUrl = await uploadVariationImage(
              variation.image_file,
              i,
              productId
            );
            if (uploadedUrl) {
              imageUrl = uploadedUrl;
            }
          }

          // Determinar o tipo da variação
          const variationType =
            variation.variation_type === "grade" || variation.is_grade
              ? "grade"
              : variation.variation_type || "simple";

          // Verificar se é uma variação de grade
          const isGradeVariation =
            !!variation.is_grade || variationType === "grade";

          console.log(`📋 [${i + 1}] Tipo de variação determinado:`, {
            variationType,
            isGradeVariation,
            original_is_grade: variation.is_grade,
            original_variation_type: variation.variation_type,
          });

          // Preparar dados da variação
          const variationData: any = {
            product_id: productId,
            variation_type: variationType,
            variation_value:
              variation.name ||
              variation.color ||
              variation.size ||
              `Variação ${i + 1}`,
            color: variation.color || null,
            size: variation.size || null,
            sku: variation.sku || null,
            stock: typeof variation.stock === "number" ? variation.stock : 0,
            price_adjustment:
              typeof variation.price_adjustment === "number"
                ? variation.price_adjustment
                : 0,
            is_active:
              typeof variation.is_active === "boolean"
                ? variation.is_active
                : true,
            image_url: imageUrl || null,
            display_order: i,
            name: variation.name || null,
            is_grade: isGradeVariation, // 🎯 IMPORTANTE: Definir explicitamente is_grade
          };

          // Incluir campos de grade sempre que for uma variação de grade
          if (isGradeVariation) {
            variationData.grade_name =
              variation.grade_name && variation.grade_name !== ""
                ? variation.grade_name
                : null;
            variationData.grade_color =
              variation.grade_color && variation.grade_color !== ""
                ? variation.grade_color
                : variation.color || null; // 🎯 FALLBACK: Usar color se grade_color estiver vazio
            variationData.grade_quantity =
              typeof variation.grade_quantity === "number"
                ? variation.grade_quantity
                : null;
            variationData.grade_sizes =
              Array.isArray(variation.grade_sizes) &&
              variation.grade_sizes.length > 0
                ? variation.grade_sizes
                : null;
            variationData.grade_pairs =
              Array.isArray(variation.grade_pairs) &&
              variation.grade_pairs.length > 0
                ? variation.grade_pairs
                : null;

            console.log(`🎯 GRADE [${i + 1}] - Salvando campos de grade:`, {
              grade_name: variationData.grade_name,
              grade_color: variationData.grade_color,
              grade_quantity: variationData.grade_quantity,
              grade_sizes: variationData.grade_sizes,
              grade_pairs: variationData.grade_pairs,
            });
          } else {
            // Se não for grade, garantir que campos de grade sejam null
            variationData.grade_name = null;
            variationData.grade_color = null;
            variationData.grade_quantity = null;
            variationData.grade_sizes = null;
            variationData.grade_pairs = null;
          }

          console.log(
            `🔍 DEBUG [${i + 1}] - Dados da variação a serem salvos:`,
            JSON.stringify(variationData, null, 2)
          );
          variationsToInsert.push(variationData);
        }

        console.log(
          `💾 INSERINDO ${variationsToInsert.length} variações no banco de dados...`
        );

        const { data, error: insertError } = await supabase
          .from("product_variations")
          .insert(variationsToInsert)
          .select();

        if (insertError) {
          console.error("❌ Erro ao inserir variações:", insertError);
          console.error("❌ Detalhes do erro:", {
            message: insertError.message,
            code: insertError.code,
            hint: insertError.hint,
            details: insertError.details,
          });
          console.error("❌ Dados que causaram erro:", variationsToInsert);
          throw insertError;
        }

        console.log("✅ VARIAÇÕES - Salvas com sucesso:", data?.length || 0);
        console.log(
          "✅ Variações inseridas:",
          data?.map((v) => ({
            id: v.id,
            color: v.color,
            variation_type: v.variation_type,
          }))
        );

        // Atualizar estado local com todos os campos
        const processedVariations = (data as any[]) || [];

        setVariations(processedVariations);
      } else {
        setVariations([]);
      }

      toast({
        title: "Variações salvas!",
        description: `${variations.length} variação(ões) salva(s) com sucesso.`,
      });

      return { success: true, error: null };
    } catch (error) {
      console.error("💥 VARIAÇÕES - Erro no salvamento:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Erro ao salvar variações";

      toast({
        title: "Erro ao salvar variações",
        description: errorMessage,
        variant: "destructive",
        duration: 3000,
      });

      return { success: false, error: errorMessage };
    }
  };

  const deleteVariationById = async (variationId: string) => {
    try {
      const { error } = await supabase
        .from("product_variations")
        .delete()
        .eq("id", variationId);
      if (error) throw error;
      // Atualizar estado local
      setVariations((prev) => prev.filter((v) => v.id !== variationId));
      toast({
        title: "Variação excluída!",
        description: "Variação removida com sucesso.",
      });
      return true;
    } catch (error) {
      toast({
        title: "Erro ao excluir variação",
        description: String(error),
        variant: "destructive",
      });
      return false;
    }
  };

  useEffect(() => {
    // Se temos initialData e o ID coincide, usamos o que temos
    if (initialData && initialData.length > 0 && initialData.every(v => v.product_id === productId)) {
      console.log("🎨 VARIAÇÕES - useEffect: Usando dados iniciais para:", productId);
      setVariations(initialData);
      setLoading(false);
      setError(null);
      return;
    }

    if (productId && productId.trim() !== "") {
      fetchVariations(productId);
    } else {
      setVariations([]);
      setLoading(false);
      setError(null);
    }
  }, [productId, initialData]); // Incluir initialData como dependência

  return {
    variations,
    loading,
    error,
    saveVariations,
    refetch: () => productId && fetchVariations(productId),
    deleteVariationById,
  };
};
