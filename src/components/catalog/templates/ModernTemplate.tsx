import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, ShoppingCart, Eye } from "lucide-react";
import { Product } from "@/hooks/useProducts";
import { ProductVariation } from "@/types/variation";
import { CatalogType } from "@/hooks/useCatalog";
import { formatPrice } from "@/utils/formatPrice";
import { useProductDisplayPrice } from "@/hooks/useProductDisplayPrice";

export interface CatalogSettingsData {
  colors?: {
    primary: string;
    secondary: string;
    surface: string;
    text: string;
  };
  global?: {
    borderRadius: number;
    fontSize: {
      small: string;
      medium: string;
      large: string;
    };
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
  onAddToCart: (
    product: Product,
    quantity?: number,
    variation?: ProductVariation
  ) => void;
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
  editorSettings,
}) => {
  const [imageError, setImageError] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const hasVariations = product.variations && product.variations.length > 0;
  const hasGradeVariations =
    hasVariations &&
    product.variations?.some((v) => v.is_grade || v.variation_type === "grade");

  // Usar o hook para cálculo correto de preços
  const priceInfo = useProductDisplayPrice({
    product,
    catalogType,
    quantity: 1,
  });

  // Usar quantidade mínima do produto
  const minQuantity = priceInfo.minQuantity;

  // Verificar estoque disponível
  const totalStock = hasVariations
    ? product.variations?.reduce((sum, v) => sum + (v.stock || 0), 0) || 0
    : product.stock || 0;

  const isOutOfStock = totalStock === 0 && !product.allow_negative_stock;

  const handleAddToCart = () => {
    console.log("🛒 MODERN TEMPLATE - Tentativa de adicionar ao carrinho:", {
      productId: product.id,
      hasVariations,
      stock: totalStock,
    });

    if (hasVariations) {
      onQuickView(product);
    } else {
      onAddToCart(product, minQuantity);
    }
  };

  return (
    <Card
      className="group overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className="relative aspect-square overflow-hidden cursor-pointer"
        onClick={(e) => {
          e.stopPropagation();
          console.log('🖼️ ModernTemplate - Click na imagem:', product.name);
          onQuickView(product);
        }}
      >
        {/* Imagem do Produto */}
        <img
          src={
            imageError
              ? "/placeholder.svg"
              : product.image_url || "/placeholder.svg"
          }
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={() => setImageError(true)}
        />

        {/* Badge de Destaque - Top Left */}
        {product.is_featured && (
          <div className="absolute top-3 left-3 pointer-events-none">
            <Badge className="bg-gradient-to-r from-yellow-500 to-amber-500 text-white text-xs font-medium shadow-md">
              ✨ DESTAQUE
            </Badge>
          </div>
        )}

        {/* Botões de Ação - Top Right */}
        <div
          className={`absolute top-3 right-3 flex gap-1 transition-all duration-200 ${isHovered ? "opacity-100" : "opacity-0"
            }`}
          onClick={(e) => e.stopPropagation()}
        >
          <Button
            variant="secondary"
            size="sm"
            className="h-8 w-8 p-0 bg-white/95 hover:bg-white shadow-md backdrop-blur-sm border"
            onClick={(e) => {
              e.stopPropagation();
              onAddToWishlist(product);
            }}
          >
            <Heart
              className={`h-4 w-4 ${isInWishlist ? "fill-red-500 text-red-500" : "text-gray-600"
                }`}
            />
          </Button>

          <Button
            variant="secondary"
            size="sm"
            className="h-8 w-8 p-0 bg-white/95 hover:bg-white shadow-md backdrop-blur-sm border"
            onClick={(e) => {
              e.stopPropagation();
              onQuickView(product);
            }}
          >
            <Eye className="h-4 w-4 text-gray-600" />
          </Button>
        </div>

        {/* Badge de Variações - Bottom Center */}
        {/* {hasVariations &&
          product.variations &&
          product.variations.length > 1 && (
            <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 pointer-events-none">
              <Badge
                variant="outline"
                className={`text-xs font-medium shadow-sm ${
                  hasGradeVariations
                    ? "text-orange-700 border-orange-300 bg-orange-100"
                    : "bg-gray-100 text-gray-700 border-gray-300"
                }`}
              >
                {hasGradeVariations ? (
                  <>📦 {product.variations.length} grades</>
                ) : (
                  `+${product.variations.length} opções`
                )}
              </Badge>
            </div>
          )} */}

        {/* Overlay de hover */}
        <div
          className={`absolute inset-0 bg-black/20 transition-opacity duration-200 pointer-events-none ${isHovered ? "opacity-100" : "opacity-0"
            }`}
        />
      </div>

      <CardContent className="p-4">
        {/* Nome */}
        <div className="space-y-1 mb-3">
          <h3
            className="font-semibold text-gray-900 line-clamp-2 group-hover:text-blue-600 transition-colors cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              console.log('📝 ModernTemplate - Click no título:', product.name);
              onQuickView(product);
            }}
          >
            {product.name}
          </h3>
        </div>

        {/* Preços */}
        {showPrices && (
          <div className="mb-3">
            <div className="flex items-center justify-between">
              <span className="text-lg font-bold text-gray-900">
                {formatPrice(priceInfo.displayPrice)}
              </span>
            </div>

            {priceInfo.shouldShowWholesaleInfo &&
              priceInfo.shouldShowRetailPrice &&
              !priceInfo.isWholesaleOnly &&
              priceInfo.retailPrice !== priceInfo.wholesalePrice && (
                <p className="text-sm text-green-600 font-medium">
                  Atacado: {formatPrice(priceInfo.wholesalePrice || 0)}
                  {priceInfo.minWholesaleQty &&
                    priceInfo.minWholesaleQty > 1 &&
                    ` (mín: ${priceInfo.minWholesaleQty})`}
                </p>
              )}
          </div>
        )}

        {/* Estoque - apenas se showStock for true */}
        {showStock && (
          <div className="mb-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Estoque:</span>
              <span
                className={`font-medium ${totalStock > 10
                    ? "text-green-600"
                    : totalStock > 0
                      ? "text-yellow-600"
                      : "text-red-600"
                  }`}
              >
                {totalStock} unidades
              </span>
            </div>
          </div>
        )}

        {/* Botão de Ação Principal */}
        <Button
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium"
          onClick={handleAddToCart}
          disabled={isOutOfStock}
        >
          <ShoppingCart className="h-4 w-4 mr-2" />
          {hasVariations
            ? "Ver Opções"
            : isOutOfStock
              ? "Esgotado"
              : "Adicionar"}
        </Button>
      </CardContent>
    </Card>
  );
};

export default ModernTemplate;
