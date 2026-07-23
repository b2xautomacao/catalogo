import React, { useState } from "react";
import { Heart, Package, ShoppingCart, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Product } from "@/hooks/useProducts";
import { ProductVariation } from "@/types/variation";
import { CatalogType } from "@/hooks/useCatalog";
import { formatPrice } from "@/utils/formatPrice";
import { useProductDisplayPrice } from "@/hooks/useProductDisplayPrice";
import { cn } from "@/lib/utils";

export interface CatalogSettingsData {
  colors?: { primary: string; secondary: string; surface: string; text: string };
  global?: {
    borderRadius: number;
    fontSize: { small: string; medium: string; large: string };
  };
  productCard?: {
    showQuickView: boolean;
    showAddToCart: boolean;
    productCardStyle: string;
  };
}

interface ElegantTemplateProps {
  product: Product;
  catalogType: CatalogType;
  onAddToCart: (product: Product, quantity?: number, variation?: ProductVariation) => void;
  onAddToWishlist: (product: Product) => void;
  onQuickView: (product: Product) => void;
  isInWishlist: boolean;
  showPrices: boolean;
  showStock: boolean;
  editorSettings?: CatalogSettingsData;
}

const ElegantTemplate: React.FC<ElegantTemplateProps> = ({
  product,
  catalogType,
  onAddToCart,
  onAddToWishlist,
  onQuickView,
  isInWishlist,
  showPrices,
  showStock,
}) => {
  const [imageError, setImageError] = useState(false);
  const hasVariations = Boolean(product.variations?.length);
  const hasGradeVariations = Boolean(
    product.variations?.some((variation) => variation.is_grade || variation.variation_type === "grade")
  );
  const priceInfo = useProductDisplayPrice({ product, catalogType, quantity: 1 });
  const totalStock = hasVariations
    ? product.variations?.reduce((sum, variation) => sum + (variation.stock || 0), 0) || 0
    : product.stock || 0;
  const isOutOfStock = totalStock === 0 && !product.allow_negative_stock;

  const handleAction = () => {
    if (hasVariations) onQuickView(product);
    else onAddToCart(product, priceInfo.minQuantity);
  };

  return (
    <Card className="group flex h-full min-w-0 flex-col overflow-hidden border-border/70 bg-card shadow-sm transition-[box-shadow,border-color] hover:border-primary/30 hover:shadow-md">
      <div className="relative">
        <button
          type="button"
          className="block aspect-square w-full overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          onClick={() => onQuickView(product)}
          aria-label={`Ver detalhes de ${product.name}`}
        >
          <img
            src={imageError ? "/placeholder.svg" : product.image_url || "/placeholder.svg"}
            alt={product.name}
            className="size-full object-cover transition-transform duration-500 group-hover:scale-[1.025]"
            loading="lazy"
            onError={() => setImageError(true)}
          />
        </button>

        {product.is_featured && (
          <Badge variant="secondary" className="pointer-events-none absolute left-2 top-2 gap-1 px-2 py-1 text-[10px] sm:left-3 sm:top-3 sm:text-xs">
            <Sparkles />
            <span className="hidden min-[380px]:inline">Destaque</span>
          </Badge>
        )}

        <Button
          type="button"
          variant="secondary"
          size="icon"
          className="absolute right-2 top-2 size-11 rounded-full bg-background/95 shadow-sm sm:right-3 sm:top-3"
          aria-label={isInWishlist ? "Remover dos favoritos" : "Adicionar aos favoritos"}
          onClick={() => onAddToWishlist(product)}
        >
          <Heart className={cn(isInWishlist && "fill-current text-primary")} />
        </Button>

        {hasVariations && (
          <Badge variant="secondary" className="pointer-events-none absolute bottom-2 left-2 gap-1 text-[10px] sm:text-xs">
            <Package />
            {hasGradeVariations ? "Grades" : `${product.variations?.length} opções`}
          </Badge>
        )}
      </div>

      <CardContent className="flex flex-1 flex-col gap-2 p-3 sm:gap-3 sm:p-4">
        <button
          type="button"
          className="line-clamp-2 min-h-10 text-left text-[13px] font-semibold leading-5 text-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:text-sm"
          onClick={() => onQuickView(product)}
        >
          {product.name}
        </button>

        {showPrices && (
          <div>
            <p className="text-lg font-semibold tracking-[-0.02em] text-foreground sm:text-xl">
              {formatPrice(priceInfo.displayPrice)}
            </p>
            {priceInfo.shouldShowWholesaleInfo &&
              priceInfo.shouldShowRetailPrice &&
              !priceInfo.isWholesaleOnly &&
              priceInfo.retailPrice !== priceInfo.wholesalePrice && (
                <p className="mt-1 rounded-md bg-primary/10 px-2 py-1.5 text-[10px] font-medium leading-4 text-primary sm:text-xs">
                  Atacado {formatPrice(priceInfo.wholesalePrice || 0)}
                  {priceInfo.minWholesaleQty && priceInfo.minWholesaleQty > 1
                    ? ` · mín. ${priceInfo.minWholesaleQty}`
                    : ""}
                </p>
              )}
          </div>
        )}

        {showStock && (
          <p className="hidden text-xs text-muted-foreground sm:block">
            {isOutOfStock ? "Produto indisponível" : `${totalStock} unidades disponíveis`}
          </p>
        )}

        <Button
          className="mt-auto min-h-11 w-full px-2 text-xs font-semibold sm:px-4 sm:text-sm"
          onClick={handleAction}
          disabled={isOutOfStock}
        >
          <ShoppingCart data-icon="inline-start" className="hidden min-[360px]:block" />
          <span className="sm:hidden">{hasVariations ? "Opções" : isOutOfStock ? "Esgotado" : "Adicionar"}</span>
          <span className="hidden sm:inline">
            {hasVariations ? "Escolher opções" : isOutOfStock ? "Esgotado" : "Adicionar"}
          </span>
        </Button>
      </CardContent>
    </Card>
  );
};

export default ElegantTemplate;
