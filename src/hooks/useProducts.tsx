import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Product, ProductVariation } from "@/types/product";

export const useProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { profile } = useAuth();
  const { toast } = useToast();

  const fetchProducts = useCallback(
    async (forceRefresh = false) => {
      if (!profile?.store_id) {
        console.log("useProducts: Nenhum store_id encontrado no perfil");
        setLoading(false);
        return;
      }

      try {
        console.log(
          "useProducts: Buscando produtos para store_id:",
          profile.store_id,
          forceRefresh ? "(força refresh)" : ""
        );

        // Buscar produtos com cache invalidado se necessário
        const query = supabase
          .from("products")
          .select("*")
          .eq("store_id", profile.store_id)
          .order("created_at", { ascending: false });

        // Se forçar refresh, adicionar timestamp para evitar cache
        if (forceRefresh) {
          query.limit(1000); // Limite alto para garantir todos os produtos
        }

        const { data: productsData, error: productsError } = await query;

        if (productsError) {
          console.error("Erro ao buscar produtos:", productsError);
          throw productsError;
        }

        // Buscar todas as variações dos produtos em uma query separada
        const productIds = productsData?.map((p) => p.id) || [];
        let variationsData: any[] = [];

        if (productIds.length > 0) {
          const { data: variations, error: variationsError } = await supabase
            .from("product_variations")
            .select("*")
            .in("product_id", productIds)
            .eq("is_active", true)
            .order("display_order", { ascending: true });

          if (variationsError) {
            console.error("Erro ao buscar variações:", variationsError);
          } else {
            variationsData = variations || [];
            console.log(
              `useProducts: ${variationsData.length} variações carregadas`
            );
          }
        }

        // Mapear produtos e suas variações
        const productsWithVariations: Product[] = (productsData || []).map(
          (product) => {
            const productVariations = variationsData
              .filter((v) => v.product_id === product.id)
              .map((v) => ({
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
                name: v.name,
                is_grade: v.is_grade,
                grade_name: v.grade_name,
                grade_color: v.grade_color,
                grade_quantity: v.grade_quantity,
                grade_sizes: v.grade_sizes,
                grade_pairs: v.grade_pairs,
                display_order: v.display_order,
              })) as ProductVariation[];

            return {
              ...product,
              variations: productVariations,
            };
          }
        );

        console.log(
          `useProducts: Produtos carregados: ${productsWithVariations.length}`
        );
        console.log(
          "useProducts: Produtos com variações:",
          productsWithVariations.filter(
            (p) => p.variations && p.variations.length > 0
          ).length
        );

        setProducts(productsWithVariations);
      } catch (error) {
        console.error("useProducts: Erro ao carregar produtos:", error);
        toast({
          title: "Erro ao carregar produtos",
          description: "Não foi possível carregar a lista de produtos.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    },
    [profile?.store_id, toast]
  );

  const deleteProduct = async (id: string) => {
    try {
      console.log("useProducts: Deletando produto:", id);

      // Deletar variações primeiro
      const { error: variationsError } = await supabase
        .from("product_variations")
        .delete()
        .eq("product_id", id);

      if (variationsError) {
        console.error("Erro ao deletar variações:", variationsError);
        throw variationsError;
      }

      // Deletar imagens
      const { error: imagesError } = await supabase
        .from("product_images")
        .delete()
        .eq("product_id", id);

      if (imagesError) {
        console.error("Erro ao deletar imagens:", imagesError);
        throw imagesError;
      }

      // Deletar produto
      const { error: productError } = await supabase
        .from("products")
        .delete()
        .eq("id", id);

      if (productError) {
        console.error("Erro ao deletar produto:", productError);
        throw productError;
      }

      console.log("useProducts: Produto deletado com sucesso");
      return { error: null };
    } catch (error) {
      console.error("useProducts: Erro no deleteProduct:", error);
      return {
        error:
          error instanceof Error
            ? error.message
            : "Erro desconhecido ao deletar produto",
      };
    }
  };

  const createProduct = async (productData: any) => {
    try {
      const { data, error } = await supabase
        .from("products")
        .insert({
          ...productData,
          store_id: profile?.store_id,
        })
        .select()
        .single();

      if (error) throw error;

      await fetchProducts(); // Recarregar produtos após criação
      return { data, error: null };
    } catch (error) {
      console.error("Erro ao criar produto:", error);
      return {
        data: null,
        error: error instanceof Error ? error.message : "Erro ao criar produto",
      };
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return {
    products,
    loading,
    fetchProducts,
    deleteProduct,
    createProduct,
  };
};

// Exportar tipos para uso em outros componentes
export type { Product, ProductVariation } from "@/types/product";
