import { useMemo } from "react";
import { useProductVariations } from "@/hooks/useProductVariations";

export interface VariationStats {
  totalStock: number;
  variations: Array<{
    id: string;
    stock: number;
    color?: string;
    size?: string;
    material?: string;
    is_grade?: boolean;
    grade_name?: string;
  }>;
  hasColors: boolean;
  hasGrades: boolean;
  colorCount: number;
  gradeCount: number;
  totalVariations: number;
}

export const useVariationStats = (productId: string): VariationStats => {
  const { variations, loading } = useProductVariations(productId);

  const stats = useMemo(() => {
    if (loading || !variations || variations.length === 0) {
      return {
        totalStock: 0,
        variations: [],
        hasColors: false,
        hasGrades: false,
        colorCount: 0,
        gradeCount: 0,
        totalVariations: 0,
      };
    }

    // Calcular estoque total
    const totalStock = variations.reduce((sum, variation) => {
      return sum + (variation.stock || 0);
    }, 0);

    // Verificar tipos de variações
    const colors = new Set(
      variations
        .filter((v) => v.color && v.color.trim() !== "")
        .map((v) => v.color)
    );

    const grades = variations.filter((v) => v.is_grade || v.grade_name);

    // Mapear variações para formato simplificado
    const mappedVariations = variations.map((v) => ({
      id: v.id,
      stock: v.stock || 0,
      color: v.color,
      size: v.size,
      material: v.material,
      is_grade: v.is_grade,
      grade_name: v.grade_name,
    }));

    return {
      totalStock,
      variations: mappedVariations,
      hasColors: colors.size > 0,
      hasGrades: grades.length > 0,
      colorCount: colors.size,
      gradeCount: grades.length,
      totalVariations: variations.length,
    };
  }, [variations, loading]);

  return stats;
};
