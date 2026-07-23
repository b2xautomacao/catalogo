import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, ShoppingCart, Eye, Sparkles, Package } from "lucide-react";
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

interface ElegantTemplateProps {
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

const ElegantTemplate: React.FC<ElegantTemplateProps> = ({
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
    console.log("🛒 ELEGANT TEMPLATE - Tentativa de adicionar ao carrinho:", {
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
      className="group overflow-hidden border-0 shadow-md hover:shadow-2xl transition-all duration-500 bg-white rounded-xl"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div 
        className="relative aspect-square overflow-hidden rounded-t-xl cursor-pointer"
        onClick={(e) => {
          e.stopPropagation();
          console.log('🖼️ ElegantTemplate - Click na imagem:', product.name);
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
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
          onError={() => setImageError(true)}
        />

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent pointer-events-none" />

        {/* Badge de Destaque - Top Left */}
        {product.is_featured && (
          <div className="absolute top-4 left-4 pointer-events-none">
            <Badge className="bg-gradient-to-r from-yellow-500 to-amber-500 text-white text-xs font-medium shadow-lg flex items-center gap-1">
              <Sparkles className="h-3 w-3" />
              DESTAQUE
            </Badge>
          </div>
        )}

        {/* Botões de Ação - Top Right */}
        <div
          className={`absolute top-4 right-4 flex gap-2 transition-all duration-300 ${
            isHovered
              ? "opacity-100 transform translate-y-0"
              : "opacity-0 transform translate-y-2"
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          <Button
            size="sm"
            className="h-10 w-10 p-0 bg-white/95 hover:bg-white shadow-lg backdrop-blur-sm border-0 rounded-full"
            onClick={(e) => {
              e.stopPropagation();
              onAddToWishlist(product);
            }}
          >
            <Heart
              className={`h-4 w-4 ${
                isInWishlist ? "fill-red-500 text-red-500" : "text-gray-700"
              }`}
            />
          </Button>

          <Button
            size="sm"
            className="h-10 w-10 p-0 bg-white/95 hover:bg-white shadow-lg backdrop-blur-sm border-0 rounded-full"
            onClick={(e) => {
              e.stopPropagation();
              onQuickView(product);
            }}
          >
            <Eye className="h-4 w-4 text-gray-700" />
          </Button>
        </div>

        {/* Badge de Variações - Bottom Center */}
        {hasVariations &&
          product.variations &&
          product.variations.length > 1 && (
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 pointer-events-none">
              <Badge
                className={`text-xs font-medium shadow-lg ${
                  hasGradeVariations
                    ? "bg-orange-100/90 text-orange-700 border-orange-300"
                    : "bg-white/90 text-gray-700"
                }`}
              >
                {hasGradeVariations ? (
                  <span className="inline-flex items-center gap-1">
                    <Package className="h-3 w-3" />
                    {product.variations.length} grades
                  </span>
                ) : (
                  `+${product.variations.length} opções`
                )}
              </Badge>
            </div>
          )}
      </div>

      <CardContent className="p-6">
        {/* Nome */}
        <div className="space-y-2 mb-4">
          <h3 
            className="font-semibold text-lg text-gray-900 line-clamp-2 group-hover:text-amber-600 transition-colors duration-300 cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              console.log('📝 ElegantTemplate - Click no título:', product.name);
              onQuickView(product);
            }}
          >
            {product.name}
          </h3>
        </div>

        {/* Preços */}
        {showPrices && (
          <div className="mb-4">
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold text-gray-900">
                {formatPrice(priceInfo.displayPrice)}
              </span>
            </div>

            {priceInfo.shouldShowWholesaleInfo &&
              priceInfo.shouldShowRetailPrice &&
              !priceInfo.isWholesaleOnly &&
              priceInfo.retailPrice !== priceInfo.wholesalePrice && (
                <div className="mt-2 p-2 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                  <p className="text-sm text-green-700 font-semibold">
                    Atacado: {formatPrice(priceInfo.wholesalePrice || 0)}
                    {priceInfo.minWholesaleQty &&
                      priceInfo.minWholesaleQty > 1 && (
                        <span className="text-green-600 ml-1">
                          (mín: {priceInfo.minWholesaleQty})
                        </span>
                      )}
                  </p>
                </div>
              )}
          </div>
        )}

        {/* Estoque - apenas se showStock for true */}
        {showStock && (
          <div className="mb-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 font-medium">Disponível:</span>
              <div className="flex items-center gap-2">
                <div
                  className={`w-2 h-2 rounded-full ${
                    totalStock > 10
                      ? "bg-green-500"
                      : totalStock > 0
                      ? "bg-yellow-500"
                      : "bg-red-500"
                  }`}
                />
                <span
                  className={`font-semibold ${
                    totalStock > 10
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
          </div>
        )}

        {/* Botão de Ação Principal */}
        <Button
          className="w-full h-12 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold text-base shadow-lg hover:shadow-xl transition-all duration-300"
          onClick={handleAddToCart}
          disabled={isOutOfStock}
        >
          <ShoppingCart className="h-5 w-5 mr-3" />
          {hasVariations
            ? "Ver Todas as Opções"
            : isOutOfStock
            ? "Produto Esgotado"
            : "Adicionar ao Carrinho"}
        </Button>
      </CardContent>
    </Card>
  );
};

export default ElegantTemplate;
