import React, { useState, useMemo } from "react";
import { Product } from "@/types/product";
import { Button } from "@/components/ui/button";
import {
  Package,
  Eye,
  ShoppingCart,
  TrendingDown,
  Palette,
  Layers,
  AlertCircle,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { useShoppingCart } from "@/hooks/useShoppingCart";
import { ProductVariation } from "@/types/product";
import { useCatalogMode } from "@/hooks/useCatalogMode";
import { useStorePriceModel } from "@/hooks/useStorePriceModel";
import { usePriceCalculation } from "@/hooks/usePriceCalculation";
import { useProductPriceTiers } from "@/hooks/useProductPriceTiers";
import { useAuth } from "@/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import ProductCardImageGallery from "./ProductCardImageGallery";

type CatalogType = "retail" | "wholesale";

export interface ProductCardProps {
  product: Product;
  catalogType: CatalogType;
  onAddToCart: (product: Product, quantity?: number, variation?: any) => void;
  onViewDetails?: (product: Product) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({
  product,
  catalogType,
  onAddToCart,
  onViewDetails,
}) => {
  const { addItem } = useShoppingCart();
  const { profile } = useAuth();
  const { calculatePrice } = useCatalogMode(profile?.store_id);
  const { priceModel } = useStorePriceModel(product.store_id);
  const { tiers } = useProductPriceTiers(product.id, {
    wholesale_price: product.wholesale_price,
    min_wholesale_qty: product.min_wholesale_qty,
    retail_price: product.retail_price,
  });

  const [quantity] = useState(1);

  const modelKey = priceModel?.price_model || "retail_only";

  // Verificar se o produto tem variações ativas
  const hasVariations = useMemo(() => {
    return product.variations && product.variations.length > 0;
  }, [product.variations]);

  // Usar o hook de cálculo de preços para obter informações precisas
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

  // Calcular informações sobre variações
  const variationInfo = useMemo(() => {
    if (!product.variations || product.variations.length === 0) {
      return null;
    }

    const colors = [
      ...new Set(product.variations.filter((v) => v.color).map((v) => v.color)),
    ];
    const sizes = [
      ...new Set(product.variations.filter((v) => v.size).map((v) => v.size)),
    ];
    const grades = product.variations.filter(
      (v) => v.is_grade || v.variation_type === "grade"
    );

    return {
      total: product.variations.length,
      colors: colors.length,
      sizes: sizes.length,
      grades: grades.length,
      hasVariations: true,
      colorList: colors.slice(0, 3), // Mostrar apenas as primeiras 3 cores
      sizeList: sizes.slice(0, 3), // Mostrar apenas os primeiros 3 tamanhos
    };
  }, [product.variations]);

  const handleAction = () => {
    if (hasVariations) {
      // Se tem variações, sempre abrir detalhes
      if (onViewDetails) {
        onViewDetails(product);
      }
    } else {
      // Se não tem variações, adicionar diretamente ao carrinho
      const minQty =
        modelKey === "wholesale_only"
          ? product.min_wholesale_qty || 1
          : quantity;
      onAddToCart(product, minQty);
    }
  };

  const handleViewDetails = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onViewDetails) onViewDetails(product);
  };

  return (
    <div
      className={`relative flex flex-col rounded-lg border text-card-foreground shadow-sm hover:shadow-lg transition-all duration-200 group overflow-hidden ${
        product.is_featured
          ? "border-yellow-300 bg-gradient-to-br from-yellow-50 to-white shadow-md ring-1 ring-yellow-200"
          : "border-border bg-white hover:border-primary/30"
      }`}
    >
      {/* 🎯 MELHORADO: Image Container com aspect ratio 1:1 */}
      <div className="relative">
        <ProductCardImageGallery
          productId={product.id}
          productName={product.name}
          maxImages={3}
          className="aspect-square" // 🎯 FORÇA ASPECT RATIO 1:1
        />

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

          {/* Top Right - Badges de preço e desconto */}
          <div className="absolute top-0 right-0 flex flex-col gap-1 items-end">
            {/* Price Model Badge */}
            {modelKey === "wholesale_only" && (
              <Badge className="bg-orange-500 text-white text-xs font-medium shadow-sm">
                Atacado
              </Badge>
            )}

            {/* Discount Badge */}
            {priceCalculation.percentage > 0 && (
              <Badge className="bg-green-500 text-white text-xs flex items-center gap-1 shadow-sm">
                <TrendingDown className="h-3 w-3" />-
                {priceCalculation.percentage.toFixed(0)}%
              </Badge>
            )}
          </div>

          {/* Bottom Left - Variações */}
          {hasVariations && (
            <div className="absolute bottom-0 left-0">
              <Badge className="bg-blue-500 text-white text-xs flex items-center gap-1 shadow-sm">
                <AlertCircle className="h-3 w-3" />
                Variações
              </Badge>
            </div>
          )}
        </div>
      </div>

      <div className="p-4 space-y-3 flex-1 flex flex-col">
        {/* Product Info */}
        <div className="flex-1">
          <h3 className="font-semibold text-base line-clamp-2 leading-tight mb-1">
            {product.name}
          </h3>
          {product.description && (
            <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
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

          {/* Wholesale Minimum */}
          {modelKey === "wholesale_only" && product.min_wholesale_qty && (
            <p className="text-xs text-muted-foreground">
              Mínimo: {product.min_wholesale_qty} unidades
            </p>
          )}

          {/* Variation Info */}
          {hasVariations && (
            <p className="text-xs text-muted-foreground">
              Produto com variações disponíveis
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

          {!hasVariations && (
            <Button
              size="sm"
              onClick={handleAction}
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

export default ProductCard;
