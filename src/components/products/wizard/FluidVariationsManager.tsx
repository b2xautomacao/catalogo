import React from "react";
import IntelligentVariationsForm from "./IntelligentVariationsForm";
import { ProductVariation } from "@/types/product";

interface FluidVariationsManagerProps {
  productId?: string;
  variations: ProductVariation[];
  onChange: (variations: ProductVariation[]) => void;
  storeId?: string;
}

const FluidVariationsManager: React.FC<FluidVariationsManagerProps> = ({
  productId,
  variations,
  onChange,
  storeId,
}) => {
  console.log("🌊 FLUID VARIATIONS MANAGER - Props:", {
    productId,
    storeId,
    variationsCount: variations.length,
    hasOnChange: !!onChange,
  });

  return (
    <IntelligentVariationsForm
      variations={variations}
      onVariationsChange={onChange}
      productId={productId}
      storeId={storeId}
    />
  );
};

export default FluidVariationsManager;
