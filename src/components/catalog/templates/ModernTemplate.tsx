import React, { useState } from "react";
import { Heart, ShoppingCart, Sparkles } from "lucide-react";
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

interface ModernTemplateProps {
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

const ModernTemplate: React.FC<ModernTemplateProps> = ({
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
    <Card className="group overflow-hidden border-border/80 bg-card shadow-sm transition-[box-shadow,border-color] duration-300 hover:border-primary/30 hover:shadow-lg">
      <div className="relative">
        <button
          type="button"
          className="relative block aspect-square w-full overflow-hidden text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
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
          <Badge variant="secondary" className="pointer-events-none absolute left-3 top-3 gap-1 shadow-sm">
            <Sparkles />
            Destaque
          </Badge>
        )}

        <Button
          type="button"
          variant="secondary"
          size="icon"
          className="absolute right-3 top-3 size-11 rounded-full bg-background/95 shadow-sm"
          aria-label={isInWishlist ? "Remover dos favoritos" : "Adicionar aos favoritos"}
          onClick={() => onAddToWishlist(product)}
        >
          <Heart className={cn(isInWishlist && "fill-current text-primary")} />
        </Button>
      </div>

      <CardContent className="flex flex-col gap-3 p-4">
        <button
          type="button"
          className="line-clamp-2 min-h-10 text-left text-sm font-semibold leading-5 text-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          onClick={() => onQuickView(product)}
        >
          {product.name}
        </button>

        {showPrices && (
          <div>
            <p className="text-xl font-semibold tracking-[-0.02em] text-foreground">
              {formatPrice(priceInfo.displayPrice)}
            </p>
            {priceInfo.shouldShowWholesaleInfo &&
              priceInfo.shouldShowRetailPrice &&
              !priceInfo.isWholesaleOnly &&
              priceInfo.retailPrice !== priceInfo.wholesalePrice && (
                <p className="mt-1 inline-flex rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                  Atacado: {formatPrice(priceInfo.wholesalePrice || 0)}
                  {priceInfo.minWholesaleQty && priceInfo.minWholesaleQty > 1
                    ? ` · mín. ${priceInfo.minWholesaleQty}`
                    : ""}
                </p>
              )}
          </div>
        )}

        {showStock && (
          <p className="text-xs text-muted-foreground">
            {isOutOfStock ? "Produto indisponível" : `${totalStock} unidades disponíveis`}
          </p>
        )}

        <Button className="w-full font-semibold" onClick={handleAction} disabled={isOutOfStock}>
          <ShoppingCart data-icon="inline-start" />
          {hasVariations ? "Escolher opções" : isOutOfStock ? "Esgotado" : "Adicionar"}
        </Button>
      </CardContent>
    </Card>
  );
};

export default ModernTemplate;
