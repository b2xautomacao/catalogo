import { useState, useCallback } from "react";
import { ProductVariation } from "@/types/product";
import { useToast } from "@/hooks/use-toast";

export interface VariationCombination {
  color?: string;
  size?: string;
  material?: string;
  style?: string;
}

export const useAdvancedVariationManager = (
  initialVariations: ProductVariation[] = [],
  onVariationsChange?: (variations: ProductVariation[]) => void
) => {
  const [variations, setVariations] =
    useState<ProductVariation[]>(initialVariations);
  const { toast } = useToast();

  const updateVariationsState = useCallback(
    (newVariations: ProductVariation[]) => {
      setVariations(newVariations);
      onVariationsChange?.(newVariations);
    },
    [onVariationsChange]
  );

  const combinationExists = useCallback(
    (combination: VariationCombination): boolean => {
      return variations.some(
        (v) =>
          v.color === combination.color &&
          v.size === combination.size &&
          v.material === combination.material
      );
    },
    [variations]
  );

  const getVariationByCombination = useCallback(
    (combination: VariationCombination): ProductVariation | undefined => {
      return variations.find(
        (v) =>
          v.color === combination.color &&
          v.size === combination.size &&
          v.material === combination.material
      );
    },
    [variations]
  );

  const createVariation = useCallback(
    (
      combination: VariationCombination,
      initialData?: Partial<ProductVariation>
    ) => {
      if (combinationExists(combination)) {
        toast({
          title: "Variação já existe",
          description: "Esta combinação de variação já foi criada.",
          variant: "destructive",
        });
        return false;
      }

      const uniqueId = `variation-${Date.now()}-${Math.random()
        .toString(36)
        .substr(2, 9)}`;

      const newVariation: ProductVariation = {
        id: uniqueId,
        product_id: '',
        color: combination.color,
        size: combination.size,
        material: combination.material,
        stock: 0,
        price_adjustment: 0,
        is_active: true,
        sku: "",
        image_url: "",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        ...initialData,
      };

      updateVariationsState([...variations, newVariation]);

      toast({
        title: "Variação criada",
        description: `Variação ${[combination.color, combination.size, combination.material]
          .filter(Boolean)
          .join(" - ")} criada com sucesso.`,
      });

      return true;
    },
    [variations, combinationExists, updateVariationsState, toast]
  );

  const removeVariation = useCallback(
    (combination: VariationCombination) => {
      const existingIndex = variations.findIndex(
        (v) =>
          v.color === combination.color &&
          v.size === combination.size &&
          v.material === combination.material
      );

      if (existingIndex === -1) {
        toast({
          title: "Variação não encontrada",
          description: "A variação que você tentou remover não existe.",
          variant: "destructive",
        });
        return false;
      }

      const updatedVariations = variations.filter(
        (_, i) => i !== existingIndex
      );
      updateVariationsState(updatedVariations);

      toast({
        title: "Variação removida",
        description: `Variação ${[combination.color, combination.size, combination.material]
          .filter(Boolean)
          .join(" - ")} removida com sucesso.`,
      });

      return true;
    },
    [variations, updateVariationsState, toast]
  );

  // Alternar existência de uma variação
  const toggleVariation = useCallback(
    (combination: VariationCombination) => {
      if (combinationExists(combination)) {
        return removeVariation(combination);
      } else {
        return createVariation(combination);
      }
    },
    [combinationExists, removeVariation, createVariation]
  );

  // Atualizar uma variação específica
  const updateVariation = useCallback(
    (variationId: string, updates: Partial<ProductVariation>) => {
      const updatedVariations = variations.map((variation) =>
        variation.id === variationId ? { ...variation, ...updates } : variation
      );
      updateVariationsState(updatedVariations);
    },
    [variations, updateVariationsState]
  );

  // Criar todas as combinações possíveis
  const createAllCombinations = useCallback(
    (colors: string[] = [], sizes: string[] = [], materials: string[] = []) => {
      const combinations: VariationCombination[] = [];

      if (colors.length === 0 && sizes.length === 0 && materials.length === 0) {
        return false;
      }

      // Se só há um tipo de variação
      if (colors.length > 0 && sizes.length === 0 && materials.length === 0) {
        colors.forEach((color) => combinations.push({ color }));
      } else if (
        sizes.length > 0 &&
        colors.length === 0 &&
        materials.length === 0
      ) {
        sizes.forEach((size) => combinations.push({ size }));
      } else if (
        materials.length > 0 &&
        colors.length === 0 &&
        sizes.length === 0
      ) {
        materials.forEach((material) => combinations.push({ material }));
      } else {
        // Produto cartesiano para múltiplas variações
        const colorList = colors.length > 0 ? colors : [""];
        const sizeList = sizes.length > 0 ? sizes : [""];
        const materialList = materials.length > 0 ? materials : [""];

        colorList.forEach((color) => {
          sizeList.forEach((size) => {
            materialList.forEach((material) => {
              combinations.push({
                color: color || undefined,
                size: size || undefined,
                material: material || undefined,
              });
            });
          });
        });
      }

      // Criar apenas as combinações que não existem
      let createdCount = 0;
      combinations.forEach((combination) => {
        if (!combinationExists(combination)) {
          createVariation(combination);
          createdCount++;
        }
      });

      if (createdCount > 0) {
        toast({
          title: "Combinações criadas",
          description: `${createdCount} novas combinações foram criadas.`,
        });
      } else {
        toast({
          title: "Nenhuma combinação nova",
          description: "Todas as combinações possíveis já existem.",
        });
      }

      return createdCount > 0;
    },
    [combinationExists, createVariation, toast]
  );

  // Remover todas as variações
  const clearAllVariations = useCallback(() => {
    updateVariationsState([]);
    toast({
      title: "Variações removidas",
      description: "Todas as variações foram removidas.",
    });
  }, [updateVariationsState, toast]);

  // Ativar/desativar todas as variações
  const toggleAllVariations = useCallback(
    (active: boolean) => {
      const updatedVariations = variations.map((variation) => ({
        ...variation,
        is_active: active,
      }));
      updateVariationsState(updatedVariations);

      toast({
        title: active ? "Variações ativadas" : "Variações desativadas",
        description: `Todas as variações foram ${
          active ? "ativadas" : "desativadas"
        }.`,
      });
    },
    [variations, updateVariationsState, toast]
  );

  // Aplicar estoque em lote
  const applyBulkStock = useCallback(
    (stock: number, onlyEmpty: boolean = false) => {
      const updatedVariations = variations.map((variation) => ({
        ...variation,
        stock: onlyEmpty && variation.stock > 0 ? variation.stock : stock,
      }));
      updateVariationsState(updatedVariations);

      toast({
        title: "Estoque aplicado",
        description: `Estoque de ${stock} aplicado ${
          onlyEmpty ? "apenas para variações vazias" : "para todas as variações"
        }.`,
      });
    },
    [variations, updateVariationsState, toast]
  );

  // Aplicar ajuste de preço em lote
  const applyBulkPriceAdjustment = useCallback(
    (priceAdjustment: number) => {
      const updatedVariations = variations.map((variation) => ({
        ...variation,
        price_adjustment: priceAdjustment,
      }));
      updateVariationsState(updatedVariations);

      toast({
        title: "Ajuste de preço aplicado",
        description: `Ajuste de R$ ${priceAdjustment.toFixed(
          2
        )} aplicado para todas as variações.`,
      });
    },
    [variations, updateVariationsState, toast]
  );

  // Estatísticas das variações
  const getStatistics = useCallback(() => {
    return {
      total: variations.length,
      active: variations.filter((v) => v.is_active).length,
      inactive: variations.filter((v) => !v.is_active).length,
      withStock: variations.filter((v) => v.stock > 0).length,
      withoutStock: variations.filter((v) => v.stock === 0).length,
      totalStock: variations.reduce((sum, v) => sum + v.stock, 0),
      averageStock:
        variations.length > 0
          ? variations.reduce((sum, v) => sum + v.stock, 0) / variations.length
          : 0,
      priceAdjustments: {
        positive: variations.filter((v) => v.price_adjustment > 0).length,
        negative: variations.filter((v) => v.price_adjustment < 0).length,
        neutral: variations.filter((v) => v.price_adjustment === 0).length,
      },
    };
  }, [variations]);

  return {
    variations,
    combinationExists,
    getVariationByCombination,
    createVariation,
    removeVariation,
    updateVariation,
    createAllCombinations,
    clearAllVariations,
    toggleAllVariations,
    applyBulkStock,
    applyBulkPriceAdjustment,
    getStatistics,
  };
};

export default useAdvancedVariationManager;
