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
import { CatalogSettingsData } from "./ModernTemplate";

interface IndustrialTemplateProps {
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

const IndustrialTemplate: React.FC<IndustrialTemplateProps> = ({
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
    console.log(
      "🛒 INDUSTRIAL TEMPLATE - Tentativa de adicionar ao carrinho:",
      {
        productId: product.id,
        hasVariations,
        stock: totalStock,
      }
    );

    if (hasVariations) {
      onQuickView(product);
    } else {
      onAddToCart(product, minQuantity);
    }
  };

  return (
    <Card
      className="group overflow-hidden border-2 border-gray-300 hover:border-gray-400 transition-all duration-300 bg-white"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className="relative aspect-square overflow-hidden bg-gray-50 cursor-pointer"
        onClick={(e) => {
          e.stopPropagation();
          console.log('🖼️ IndustrialTemplate - Click na imagem:', product.name);
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
            <Badge className="bg-gradient-to-r from-yellow-600 to-amber-600 text-white text-xs font-bold uppercase tracking-wide shadow-md">
              ✨ DESTAQUE
            </Badge>
          </div>
        )}

        {/* Botões de Ação - Top Right */}
        <div
          className={`absolute top-3 right-3 flex gap-1 transition-all duration-200 ${isHovered
              ? "opacity-100 transform translate-x-0"
              : "opacity-0 transform translate-x-2"
            }`}
          onClick={(e) => e.stopPropagation()}
        >
          <Button
            variant="secondary"
            size="sm"
            className="h-9 w-9 p-0 bg-white/95 hover:bg-white shadow-md backdrop-blur-sm border-2 border-gray-300"
            onClick={(e) => {
              e.stopPropagation();
              onAddToWishlist(product);
            }}
          >
            <Heart
              className={`h-4 w-4 ${isInWishlist ? "fill-red-500 text-red-500" : "text-gray-700"
                }`}
            />
          </Button>

          <Button
            variant="secondary"
            size="sm"
            className="h-9 w-9 p-0 bg-white/95 hover:bg-white shadow-md backdrop-blur-sm border-2 border-gray-300"
            onClick={(e) => {
              e.stopPropagation();
              onQuickView(product);
            }}
          >
            <Eye className="h-4 w-4 text-gray-700" />
          </Button>
        </div>

        {/* Badge de Variações - Bottom Center */}
        {/* {hasVariations &&
          product.variations &&
          product.variations.length > 1 && (
            <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 pointer-events-none">
              <Badge
                className={`text-xs font-bold uppercase tracking-wide ${
                  hasGradeVariations
                    ? "bg-orange-600 text-white"
                    : "bg-gray-600 text-white"
                }`}
              >
                {hasGradeVariations
                  ? `📦 ${product.variations.length} GRADES`
                  : `+${product.variations.length} OPÇÕES`}
              </Badge>
            </div>
          )} */}

        {/* Corner Lines - Design Industrial */}
        <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-gray-400 pointer-events-none" />
        <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-gray-400 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-gray-400 pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-gray-400 pointer-events-none" />
      </div>

      <CardContent className="p-4 bg-gray-50 border-t-2 border-gray-200">
        {/* Nome */}
        <div className="space-y-1 mb-3">
          <h3
            className="font-bold text-gray-900 line-clamp-2 uppercase tracking-wide text-sm group-hover:text-slate-600 transition-colors cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              console.log('📝 IndustrialTemplate - Click no título:', product.name);
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
              <span className="text-xl font-black text-gray-900 font-mono">
                {formatPrice(priceInfo.displayPrice)}
              </span>
            </div>

            {priceInfo.shouldShowWholesaleInfo &&
              priceInfo.shouldShowRetailPrice &&
              !priceInfo.isWholesaleOnly &&
              priceInfo.retailPrice !== priceInfo.wholesalePrice && (
                <div className="mt-2 p-2 bg-yellow-100 border-2 border-yellow-300 rounded">
                  <p className="text-xs text-yellow-800 font-bold uppercase">
                    Bulk: {formatPrice(priceInfo.wholesalePrice || 0)}
                    {priceInfo.minWholesaleQty &&
                      priceInfo.minWholesaleQty > 1 &&
                      ` (mín: ${priceInfo.minWholesaleQty})`}
                  </p>
                </div>
              )}
          </div>
        )}

        {/* Estoque - apenas se showStock for true */}
        {showStock && (
          <div className="mb-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-600 font-bold uppercase tracking-wide">
                Estoque:
              </span>
              <div className="flex items-center gap-2">
                <div
                  className={`w-3 h-1 ${totalStock > 10
                      ? "bg-green-500"
                      : totalStock > 0
                        ? "bg-yellow-500"
                        : "bg-red-500"
                    }`}
                />
                <span
                  className={`font-black font-mono ${totalStock > 10
                      ? "text-green-600"
                      : totalStock > 0
                        ? "text-yellow-600"
                        : "text-red-600"
                    }`}
                >
                  {totalStock}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Botão de Ação Principal */}
        <Button
          className="w-full h-10 bg-slate-700 hover:bg-slate-800 text-white font-bold uppercase tracking-wide text-xs border-2 border-slate-800"
          onClick={handleAddToCart}
          disabled={isOutOfStock}
        >
          <ShoppingCart className="h-4 w-4 mr-2" />
          {hasVariations
            ? "VER OPÇÕES"
            : isOutOfStock
              ? "ESGOTADO"
              : "ADICIONAR"}
        </Button>
      </CardContent>
    </Card>
  );
};

export default IndustrialTemplate;
