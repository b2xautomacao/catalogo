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

      // Deletar tiers de preço
      const { error: tiersError } = await supabase
        .from("product_price_tiers")
        .delete()
        .eq("product_id", id);

      if (tiersError) {
        console.error("Erro ao deletar price tiers:", tiersError);
        // Não lançar erro se a tabela não existir ou estiver vazia
      }

      // Deletar histórico de estoque
      const { error: stockError } = await supabase
        .from("stock_movements")
        .delete()
        .eq("product_id", id);

      if (stockError) {
        console.error("Erro ao deletar stock movements:", stockError);
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

  const toggleProductStatus = async (productId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from("products")
        .update({ is_active: isActive })
        .eq("id", productId);

      if (error) throw error;

      await fetchProducts(); // Recarregar produtos após alteração

      toast({
        title: isActive ? "Produto ativado!" : "Produto desativado!",
        description: `O produto foi ${
          isActive ? "ativado" : "desativado"
        } com sucesso.`,
      });

      return { data: null, error: null };
    } catch (error) {
      console.error("Erro ao alterar status do produto:", error);
      toast({
        title: "Erro ao alterar status",
        description: "Não foi possível alterar o status do produto.",
        variant: "destructive",
      });
      return {
        data: null,
        error:
          error instanceof Error ? error.message : "Erro ao alterar status",
      };
    }
  };

  const duplicateProduct = async (originalProduct: Product) => {
    try {
      console.log("useProducts: Duplicando produto:", originalProduct.name);

      // 1. Criar o produto duplicado (sem ID e com nome modificado)
      const duplicatedProductData = {
        name: `${originalProduct.name} (Cópia)`,
        description: originalProduct.description,
        retail_price: originalProduct.retail_price,
        wholesale_price: originalProduct.wholesale_price,
        category: originalProduct.category,
        stock: 0, // Estoque zerado para o produto duplicado
        min_wholesale_qty: originalProduct.min_wholesale_qty,
        meta_title: originalProduct.meta_title,
        meta_description: originalProduct.meta_description,
        keywords: originalProduct.keywords,
        seo_slug: originalProduct.seo_slug
          ? `${originalProduct.seo_slug}-copia`
          : undefined,
        is_featured: false, // Não destacar produto duplicado
        allow_negative_stock: originalProduct.allow_negative_stock,
        stock_alert_threshold: originalProduct.stock_alert_threshold,
        is_active: false, // Produto duplicado inativo por padrão
        whatsapp_number: originalProduct.whatsapp_number,
        enable_gradual_wholesale: originalProduct.enable_gradual_wholesale,
        price_model: originalProduct.price_model,
      };

      const { data: newProduct, error: productError } = await supabase
        .from("products")
        .insert({
          ...duplicatedProductData,
          store_id: profile?.store_id,
        })
        .select()
        .single();

      if (productError) throw productError;

      // 2. Duplicar as variações se existirem
      if (originalProduct.variations && originalProduct.variations.length > 0) {
        const duplicatedVariations = originalProduct.variations.map(
          (variation) => ({
            product_id: newProduct.id,
            color: variation.color,
            size: variation.size,
            material: variation.material,
            sku: variation.sku ? `${variation.sku}-COPY` : undefined,
            stock: 0, // Estoque zerado para variações duplicadas
            price_adjustment: variation.price_adjustment,
            is_active: false, // Variações inativas por padrão
            image_url: variation.image_url,
            variation_type: variation.variation_type,
            name: variation.name,
            is_grade: variation.is_grade,
            grade_name: variation.grade_name,
            grade_color: variation.grade_color,
            grade_quantity: variation.grade_quantity,
            grade_sizes: variation.grade_sizes,
            grade_pairs: variation.grade_pairs,
            display_order: variation.display_order,
          })
        );

        const { error: variationsError } = await supabase
          .from("product_variations")
          .insert(duplicatedVariations);

        if (variationsError) {
          console.error("Erro ao duplicar variações:", variationsError);
          // Não falhar a operação se as variações falharem
        }
      }

      // 3. Duplicar as imagens se existirem
      const { data: originalImages, error: imagesError } = await supabase
        .from("product_images")
        .select("*")
        .eq("product_id", originalProduct.id);

      if (!imagesError && originalImages && originalImages.length > 0) {
        const duplicatedImages = originalImages.map((image) => ({
          product_id: newProduct.id,
          image_url: image.image_url,
          alt_text: image.alt_text,
          display_order: image.display_order,
          is_primary: image.is_primary,
        }));

        const { error: insertImagesError } = await supabase
          .from("product_images")
          .insert(duplicatedImages);

        if (insertImagesError) {
          console.error("Erro ao duplicar imagens:", insertImagesError);
          // Não falhar a operação se as imagens falharem
        }
      }

      // 4. Duplicar os price tiers se existirem
      const { data: originalPriceTiers, error: priceTiersError } =
        await supabase
          .from("product_price_tiers")
          .select("*")
          .eq("product_id", originalProduct.id);

      if (
        !priceTiersError &&
        originalPriceTiers &&
        originalPriceTiers.length > 0
      ) {
        const duplicatedPriceTiers = originalPriceTiers.map((tier) => ({
          product_id: newProduct.id,
          tier_name: tier.tier_name,
          tier_type: tier.tier_type,
          min_quantity: tier.min_quantity,
          price: tier.price,
          tier_order: tier.tier_order,
          is_active: tier.is_active,
        }));

        const { error: insertPriceTiersError } = await supabase
          .from("product_price_tiers")
          .insert(duplicatedPriceTiers);

        if (insertPriceTiersError) {
          console.error("Erro ao duplicar price tiers:", insertPriceTiersError);
          // Não falhar a operação se os price tiers falharem
        }
      }

      await fetchProducts(); // Recarregar produtos após duplicação

      toast({
        title: "Produto duplicado com sucesso!",
        description: `"${originalProduct.name}" foi duplicado como "${newProduct.name}". O produto duplicado está inativo por padrão.`,
      });

      return { data: newProduct, error: null };
    } catch (error) {
      console.error("Erro ao duplicar produto:", error);
      toast({
        title: "Erro ao duplicar produto",
        description: "Não foi possível duplicar o produto. Tente novamente.",
        variant: "destructive",
      });
      return {
        data: null,
        error:
          error instanceof Error ? error.message : "Erro ao duplicar produto",
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
    duplicateProduct,
    toggleProductStatus,
  };
};

// Exportar tipos para uso em outros componentes
export type { Product, ProductVariation } from "@/types/product";
