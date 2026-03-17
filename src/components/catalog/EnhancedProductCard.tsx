
import React, { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { Product } from "@/types/product";
import { CatalogType } from "@/hooks/useCatalog";
import { useProductDisplayPrice } from "@/hooks/useProductDisplayPrice";
import { usePriceCalculation } from "@/hooks/usePriceCalculation";
import { useProductPriceTiers } from "@/hooks/useProductPriceTiers";
import { useProductVariations } from "@/hooks/useProductVariations";
import GradePriceDisplay from "./GradePriceDisplay";
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
  
  // Passar as variações que já temos no objeto product para o hook
  // Isso evita o flicker pois o hook usará esses dados imediatamente
  const { variations: hookVariations } = useProductVariations(product.id, product.variations);
  
  // Priorizar variações do hook, mas cair para product.variations se necessário
  const variations = useMemo(() => {
    if (hookVariations.length > 0) return hookVariations;
    return product.variations || [];
  }, [hookVariations, product.variations]);

  const { tiers } = useProductPriceTiers(product.id, {
    wholesale_price: product.wholesale_price,
    min_wholesale_qty: product.min_wholesale_qty,
    retail_price: product.retail_price,
  });

  // Usar o novo hook para cálculo de preços
  const priceInfo = useProductDisplayPrice({
    product,
    catalogType,
    quantity,
  });

  // Calcular preço usando o hook de cálculo para obter informações de tier
  const priceCalculation = usePriceCalculation(product.store_id, {
    product_id: product.id,
    retail_price: product.retail_price,
    wholesale_price: product.wholesale_price,
    min_wholesale_qty: product.min_wholesale_qty,
    quantity: priceInfo.minQuantity,
    price_tiers: product.enable_gradual_wholesale ? tiers : [],
    enable_gradual_wholesale: product.enable_gradual_wholesale,
  });

  // Informações sobre variações
  const variationInfo = useMemo(() => {
    // Se o produto explicitamente diz que tem variações via flag has_variations ou array
    const hasVariationsArray = variations.length > 0;
    const hasVariationsFlag = (product as any).has_variations === true;

    if (!hasVariationsArray && !hasVariationsFlag) return null;

    const colors = [
      ...new Set(variations.filter((v) => v.color || v.hex_color).map((v) => v.color || v.hex_color)),
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
  }, [variations, product]);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onAddToCart) {
      onAddToCart(product, priceInfo.minQuantity);
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
      {/* Image Container */}
      <div
        className="relative aspect-square bg-gray-100 overflow-hidden cursor-pointer"
        onClick={onClick}
      >
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

        {/* Badges */}
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
            {priceInfo.isWholesaleOnly && (
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
          {/* Price Display */}
          {variationInfo?.hasGrades ? (
            // Produto com Grade - Usar GradePriceDisplay compacto
            <GradePriceDisplay
              retailPrice={product.retail_price}
              wholesalePrice={product.wholesale_price}
              minWholesaleQty={product.min_wholesale_qty}
              gradeSizes={variations[0]?.grade_sizes || []}
              gradePairs={variations[0]?.grade_pairs || []}
              gradeQuantity={variations[0]?.grade_quantity || 0}
              size="sm"
              showGradeBreakdown={false}
              className="p-0"
            />
          ) : (
            // Produto Normal - Preço baseado no modelo
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-lg font-bold text-foreground">
                  {formatCurrency(priceInfo.displayPrice)}
                </span>
                {/* Mostrar preço original apenas se aplicável */}
                {priceCalculation?.percentage > 0 && 
                 priceInfo.shouldShowRetailPrice && 
                 priceInfo.originalPrice > 0 && 
                 priceInfo.originalPrice !== priceInfo.displayPrice && (
                  <span className="text-sm text-muted-foreground line-through">
                    {formatCurrency(priceInfo.originalPrice)}
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
          )}

          {/* Preços Varejo e Atacado - apenas se ambos existem e são diferentes */}
          {priceInfo.shouldShowWholesaleInfo && 
           priceInfo.shouldShowRetailPrice && 
           !priceInfo.isWholesaleOnly && (
            <div className="space-y-1 pt-1 border-t border-border/20">
              {/* Preço Varejo */}
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Varejo:</span>
                <span className="font-medium">
                  {formatCurrency(priceInfo.retailPrice || 0)}
                </span>
              </div>

              {/* Preço Atacado */}
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Atacado:</span>
                <div className="flex items-center gap-1">
                  <span className="font-medium text-green-600">
                    {formatCurrency(priceInfo.wholesalePrice || 0)}
                  </span>
                  {priceInfo.minWholesaleQty && priceInfo.minWholesaleQty > 1 && (
                    <Badge
                      variant="secondary"
                      className="text-xs bg-orange-100 text-orange-700"
                    >
                      mín. {priceInfo.minWholesaleQty}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Wholesale Minimum (quando é wholesale only) */}
          {priceInfo.isWholesaleOnly && priceInfo.minQuantity > 1 && (
            <p className="text-xs text-muted-foreground">
              Mínimo: {priceInfo.minQuantity} unidades
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
