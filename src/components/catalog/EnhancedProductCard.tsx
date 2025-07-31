import React, { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { Product } from "@/types/product";
import { CatalogType } from "@/hooks/useCatalog";
import { useStorePriceModel } from "@/hooks/useStorePriceModel";
import { usePriceCalculation } from "@/hooks/usePriceCalculation";
import { useProductPriceTiers } from "@/hooks/useProductPriceTiers";
import { useProductVariations } from "@/hooks/useProductVariations";
import {
  ShoppingCart,
  Eye,
  Palette,
  Package,
  TrendingDown,
  AlertCircle,
  Layers,
} from "lucide-react";

interface EnhancedProductCardProps {
  product: Product;
  catalogType?: CatalogType;
  onClick?: () => void;
  onAddToCart?: (product: Product, quantity?: number) => void;
  storeIdentifier?: string;
}

const EnhancedProductCard: React.FC<EnhancedProductCardProps> = ({
  product,
  catalogType = "retail",
  onClick,
  onAddToCart,
  storeIdentifier,
}) => {
  const [quantity] = useState(1);
  const { priceModel } = useStorePriceModel(product.store_id);
  const { variations } = useProductVariations(product.id);
  const { tiers } = useProductPriceTiers(product.id, {
    wholesale_price: product.wholesale_price,
    min_wholesale_qty: product.min_wholesale_qty,
    retail_price: product.retail_price,
  });

  const modelKey = priceModel?.price_model || "retail_only";

  // Calcular preço usando o hook de cálculo
  const priceCalculation = usePriceCalculation(product.store_id, {
    product_id: product.id,
    retail_price: product.retail_price,
    wholesale_price: product.wholesale_price,
    min_wholesale_qty: product.min_wholesale_qty,
    quantity:
      modelKey === "wholesale_only" ? product.min_wholesale_qty || 1 : quantity,
    price_tiers: product.enable_gradual_wholesale ? tiers : [],
    enable_gradual_wholesale: product.enable_gradual_wholesale,
  });

  // Informações sobre variações
  const variationInfo = useMemo(() => {
    if (variations.length === 0) return null;

    const colors = [
      ...new Set(variations.filter((v) => v.color).map((v) => v.color)),
    ];
    const sizes = [
      ...new Set(variations.filter((v) => v.size).map((v) => v.size)),
    ];
    const grades = variations.filter(
      (v) => v.is_grade || v.variation_type === "grade"
    );

    return {
      hasColors: colors.length > 0,
      hasSizes: sizes.length > 0,
      hasGrades: grades.length > 0,
      colorCount: colors.length,
      sizeCount: sizes.length,
      gradeCount: grades.length,
      totalVariations: variations.length,
    };
  }, [variations]);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onAddToCart) {
      const minQty =
        modelKey === "wholesale_only" ? product.min_wholesale_qty || 1 : 1;
      onAddToCart(product, minQty);
    }
  };

  const handleViewDetails = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onClick) onClick();
  };

  return (
    <div
      className={`rounded-lg shadow-md overflow-hidden cursor-pointer hover:shadow-lg transition-all duration-200 group ${
        product.is_featured
          ? "border-2 border-yellow-300 bg-gradient-to-br from-yellow-50 to-white shadow-lg ring-1 ring-yellow-200"
          : "bg-white hover:shadow-xl"
      }`}
      onClick={onClick}
    >
      {/* 🎯 MELHORADO: Image Container com aspect ratio 1:1 */}
      <div className="relative aspect-square bg-gray-100 overflow-hidden">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <Package className="h-12 w-12" />
          </div>
        )}

        {/* 🎯 REORGANIZADOS: Badges sem sobreposição */}
        <div className="absolute inset-2 pointer-events-none">
          {/* Top Left - Badge de Destaque */}
          {product.is_featured && (
            <div className="absolute top-0 left-0">
              <Badge className="bg-gradient-to-r from-yellow-500 to-amber-500 text-white text-xs font-medium shadow-sm">
                ✨ Destaque
              </Badge>
            </div>
          )}

          {/* Top Left Column - Outros badges importantes */}
          <div
            className="absolute top-0 left-0 flex flex-col gap-1"
            style={{ marginTop: product.is_featured ? "28px" : "0" }}
          >
            {modelKey === "wholesale_only" && (
              <Badge className="bg-orange-500 text-white text-xs font-medium shadow-sm">
                Atacado
              </Badge>
            )}
            {priceCalculation?.percentage > 0 && (
              <Badge className="bg-green-500 text-white text-xs flex items-center gap-1 shadow-sm">
                <TrendingDown className="h-3 w-3" />-
                {priceCalculation.percentage.toFixed(0)}%
              </Badge>
            )}
          </div>

          {/* Top Right - Variações */}
          {variationInfo && (
            <div className="absolute top-0 right-0 flex flex-col gap-1 items-end">
              {variationInfo.hasColors && (
                <Badge
                  variant="secondary"
                  className="text-xs flex items-center gap-1 bg-white/90 shadow-sm"
                >
                  <Palette className="h-3 w-3" />
                  {variationInfo.colorCount}
                </Badge>
              )}
              {variationInfo.hasSizes && (
                <Badge
                  variant="secondary"
                  className="text-xs flex items-center gap-1 bg-white/90 shadow-sm"
                >
                  <Layers className="h-3 w-3" />
                  {variationInfo.sizeCount}
                </Badge>
              )}
              {variationInfo.hasGrades && (
                <Badge
                  variant="secondary"
                  className="text-xs flex items-center gap-1 bg-white/90 shadow-sm"
                >
                  <Layers className="h-3 w-3" />
                  {variationInfo.gradeCount}G
                </Badge>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Product Details */}
      <div className="p-4 space-y-3">
        <div>
          <h3 className="font-semibold text-base line-clamp-2 leading-tight">
            {product.name}
          </h3>
          {product.description && (
            <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
              {product.description}
            </p>
          )}
        </div>

        {/* Price Section */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-lg font-bold text-foreground">
                {priceCalculation?.price
                  ? formatCurrency(priceCalculation.price)
                  : formatCurrency(product.retail_price || 0)}
              </span>
              {priceCalculation?.percentage > 0 && product.retail_price && (
                <span className="text-sm text-muted-foreground line-through">
                  {formatCurrency(product.retail_price)}
                </span>
              )}
            </div>

            {/* Tier Info */}
            {priceCalculation?.currentTier &&
              priceCalculation.currentTier.tier_name !== "Varejo" && (
                <Badge variant="outline" className="text-xs">
                  {priceCalculation.currentTier.tier_name}
                </Badge>
              )}
          </div>

          {/* Additional Info */}
          {modelKey === "wholesale_only" && product.min_wholesale_qty && (
            <p className="text-xs text-muted-foreground">
              Mínimo: {product.min_wholesale_qty} unidades
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleViewDetails}
            className="flex-1 flex items-center gap-1"
          >
            <Eye className="h-3 w-3" />
            Ver Detalhes
          </Button>

          {!variationInfo && (
            <Button
              size="sm"
              onClick={handleAddToCart}
              className="flex items-center gap-1"
            >
              <ShoppingCart className="h-3 w-3" />
              Adicionar
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default EnhancedProductCard;
