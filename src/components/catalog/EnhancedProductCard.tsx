
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
  Layers
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
  catalogType = 'retail',
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
    quantity: modelKey === "wholesale_only" ? (product.min_wholesale_qty || 1) : quantity,
    price_tiers: product.enable_gradual_wholesale ? tiers : [],
    enable_gradual_wholesale: product.enable_gradual_wholesale,
  });

  // Informações sobre variações
  const variationInfo = useMemo(() => {
    if (variations.length === 0) return null;

    const colors = [...new Set(variations.filter(v => v.color).map(v => v.color))];
    const sizes = [...new Set(variations.filter(v => v.size).map(v => v.size))];
    const grades = variations.filter(v => v.is_grade || v.variation_type === 'grade');

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
      const minQty = modelKey === "wholesale_only" ? (product.min_wholesale_qty || 1) : 1;
      onAddToCart(product, minQty);
    }
  };

  const handleViewDetails = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onClick) onClick();
  };

  return (
    <div
      className="bg-white rounded-lg shadow-md overflow-hidden cursor-pointer hover:shadow-lg transition-all duration-200 group"
      onClick={onClick}
    >
      {/* Image Container */}
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
        
        {/* Badges Overlay */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {product.is_featured && (
            <Badge className="bg-yellow-500 text-white text-xs">
              Destaque
            </Badge>
          )}
          {modelKey === "wholesale_only" && (
            <Badge className="bg-orange-500 text-white text-xs">
              Atacado
            </Badge>
          )}
          {priceCalculation.percentage > 0 && (
            <Badge className="bg-green-500 text-white text-xs flex items-center gap-1">
              <TrendingDown className="h-3 w-3" />
              -{priceCalculation.percentage.toFixed(0)}%
            </Badge>
          )}
        </div>

        {/* Variation Indicators */}
        {variationInfo && (
          <div className="absolute top-2 right-2 flex flex-col gap-1">
            {variationInfo.hasColors && (
              <Badge variant="secondary" className="text-xs flex items-center gap-1">
                <Palette className="h-3 w-3" />
                {variationInfo.colorCount}
              </Badge>
            )}
            {variationInfo.hasGrades && (
              <Badge variant="secondary" className="text-xs flex items-center gap-1">
                <Layers className="h-3 w-3" />
                {variationInfo.gradeCount} grades
              </Badge>
            )}
          </div>
        )}

        {/* Stock Warning */}
        {product.stock === 0 && !product.allow_negative_stock && (
          <div className="absolute bottom-2 left-2">
            <Badge variant="destructive" className="text-xs flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              Esgotado
            </Badge>
          </div>
        )}
      </div>
      
      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Title and Category */}
        <div className="space-y-1">
          <h3 className="font-semibold text-lg line-clamp-2 leading-tight">
            {product.name}
          </h3>
          {product.category && (
            <Badge variant="outline" className="text-xs">
              {product.category}
            </Badge>
          )}
        </div>
        
        {/* Description */}
        {product.description && (
          <p className="text-gray-600 text-sm line-clamp-2">
            {product.description}
          </p>
        )}
        
        {/* Price Information */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold text-primary">
                  {formatCurrency(priceCalculation.price)}
                </span>
                {priceCalculation.percentage > 0 && (
                  <span className="text-sm text-gray-400 line-through">
                    {formatCurrency(product.retail_price)}
                  </span>
                )}
              </div>
              
              {/* Price Model Info */}
              {modelKey !== "retail_only" && (
                <div className="text-xs text-gray-600">
                  {priceCalculation.currentTier.tier_name}
                  {modelKey === "wholesale_only" && product.min_wholesale_qty && (
                    <span className="text-orange-600 ml-1">
                      (mín: {product.min_wholesale_qty})
                    </span>
                  )}
                </div>
              )}
              
              {/* Next Tier Hint */}
              {priceCalculation.nextTierHint && (
                <div className="text-xs text-blue-600">
                  +{priceCalculation.nextTierHint.quantityNeeded} para próximo nível
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Stock and Variations Info */}
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>
            {product.stock > 0 ? `${product.stock} em estoque` : 'Sem estoque'}
          </span>
          {variationInfo && (
            <span className="text-xs">
              {variationInfo.totalVariations} variações
            </span>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleViewDetails}
            className="flex-1"
          >
            <Eye className="h-4 w-4 mr-1" />
            Ver
          </Button>
          <Button 
            size="sm" 
            onClick={handleAddToCart}
            disabled={product.stock === 0 && !product.allow_negative_stock}
            className="flex-1"
          >
            <ShoppingCart className="h-4 w-4 mr-1" />
            {modelKey === "wholesale_only" ? 'Atacado' : 'Comprar'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default EnhancedProductCard;
