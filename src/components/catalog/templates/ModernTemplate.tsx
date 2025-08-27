
import React, { useMemo } from "react";
import { Product } from "@/types/product";
import { CatalogType } from "@/hooks/useCatalog";
import { useStorePriceModel } from "@/hooks/useStorePriceModel";
import { useCart } from "@/hooks/useCart";
import { useProductVariations } from "@/hooks/useProductVariations";
import { useProductImages } from "@/hooks/useProductImages";
import { usePriceCalculation } from "@/hooks/usePriceCalculation";
import { useProductPriceTiers } from "@/hooks/useProductPriceTiers";
import { PriceModelType } from "@/types/price-models";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Eye, 
  ShoppingCart, 
  TrendingDown, 
  Palette, 
  Layers, 
  AlertCircle,
  Package,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { useState } from "react";

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
  onAddToCart: (product: Product) => void;
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
  editorSettings = {},
}) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  const settings = {
    colors: {
      primary: "#0057FF",
      secondary: "#FF6F00",
      surface: "#FFFFFF",
      text: "#1E293B",
      ...editorSettings.colors,
    },
    global: {
      borderRadius: 12,
      fontSize: {
        small: "14px",
        medium: "16px",
        large: "20px",
      },
      ...editorSettings.global,
    },
    productCard: {
      showQuickView: true,
      showAddToCart: true,
      productCardStyle: "modern",
      ...editorSettings.productCard,
    },
  };

  const { addItem } = useCart();
  const { priceModel, loading } = useStorePriceModel(product.store_id);
  const { variations } = useProductVariations(product.id);
  const { images } = useProductImages(product.id);
  const { tiers } = useProductPriceTiers(product.id, {
    wholesale_price: product.wholesale_price,
    min_wholesale_qty: product.min_wholesale_qty,
    retail_price: product.retail_price,
  });

  const modelKey = priceModel?.price_model || ("retail_only" as PriceModelType);

  // Usar o hook de cálculo de preços
  const priceCalculation = usePriceCalculation(product.store_id, {
    product_id: product.id,
    retail_price: product.retail_price,
    wholesale_price: product.wholesale_price,
    min_wholesale_qty: product.min_wholesale_qty,
    quantity: modelKey === "wholesale_only" ? product.min_wholesale_qty || 1 : 1,
    price_tiers: product.enable_gradual_wholesale ? tiers : [],
    enable_gradual_wholesale: product.enable_gradual_wholesale,
  });

  // Calcular informações sobre variações
  const variationInfo = useMemo(() => {
    if (!variations || variations.length === 0) {
      return null;
    }

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

  // Verificar se tem variações
  const hasVariations = variationInfo && variationInfo.totalVariations > 0;

  // Preparar imagens (incluindo imagem principal do produto)
  const allImages = useMemo(() => {
    const productImages = [];
    
    // Adicionar imagem principal se existir
    if (product.image_url) {
      productImages.push({
        id: 'main',
        image_url: product.image_url,
        is_primary: true,
        image_order: 0
      });
    }
    
    // Adicionar imagens adicionais
    if (images && images.length > 0) {
      images.forEach((img, index) => {
        // Não duplicar se já existe a imagem principal
        if (img.image_url !== product.image_url) {
          productImages.push({
            ...img,
            image_order: index + 1
          });
        }
      });
    }
    
    return productImages;
  }, [product.image_url, images]);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (loading) return;

    let qty = 1;
    let price = product.retail_price;
    let isWholesale = false;

    if (modelKey === "wholesale_only") {
      qty = product.min_wholesale_qty || 1;
      price = product.wholesale_price || product.retail_price;
      isWholesale = true;
    }

    addItem(
      {
        id: `${product.id}-default`,
        product: {
          id: product.id,
          name: product.name,
          retail_price: product.retail_price,
          wholesale_price: product.wholesale_price,
          min_wholesale_qty: product.min_wholesale_qty,
          image_url: product.image_url,
          store_id: product.store_id,
          stock: product.stock,
          allow_negative_stock: product.allow_negative_stock ?? false,
          price_model: modelKey,
        },
        quantity: qty,
        price,
        originalPrice: price,
        catalogType,
        isWholesalePrice: isWholesale,
      },
      modelKey
    );
  };

  const handleViewDetails = (e: React.MouseEvent) => {
    e.stopPropagation();
    onQuickView(product);
  };

  const handlePrevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => 
      prev === 0 ? allImages.length - 1 : prev - 1
    );
  };

  const handleNextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => 
      prev === allImages.length - 1 ? 0 : prev + 1
    );
  };

  return (
    <div
      className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden border border-gray-100 hover:border-gray-200 group"
      style={{
        borderRadius: `${settings.global.borderRadius}px`,
      }}
    >
      {/* Product Image Container */}
      <div className="relative aspect-square bg-gradient-to-br from-gray-50 to-gray-100">
        {allImages.length > 0 ? (
          <>
            <img
              src={allImages[currentImageIndex]?.image_url}
              alt={product.name}
              className="w-full h-full object-cover"
            />
            
            {/* Image Navigation Controls */}
            {allImages.length > 1 && (
              <>
                <button
                  onClick={handlePrevImage}
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-1 rounded-full transition-all opacity-0 group-hover:opacity-100"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={handleNextImage}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-1 rounded-full transition-all opacity-0 group-hover:opacity-100"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
                
                {/* Image Dots Indicator */}
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                  {allImages.map((_, index) => (
                    <div
                      key={index}
                      className={`w-2 h-2 rounded-full ${
                        index === currentImageIndex ? 'bg-white' : 'bg-white/50'
                      }`}
                    />
                  ))}
                </div>
              </>
            )}
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <Package className="h-12 w-12" />
          </div>
        )}

        {/* Badges System com melhor contraste */}
        <div className="absolute inset-2 pointer-events-none">
          {/* Top Left - Badge de Destaque */}
          {product.is_featured && (
            <div className="absolute top-0 left-0">
              <Badge className="bg-gradient-to-r from-yellow-500 to-amber-500 text-white text-xs font-medium shadow-lg border-2 border-white/20">
                ✨ Destaque
              </Badge>
            </div>
          )}

          {/* Top Left Column - Outros badges importantes */}
          <div
            className="absolute top-0 left-0 flex flex-col gap-1"
            style={{ marginTop: product.is_featured ? "32px" : "0" }}
          >
            {modelKey === "wholesale_only" && (
              <Badge className="bg-orange-500 text-white text-xs font-medium shadow-lg border-2 border-white/20">
                Atacado
              </Badge>
            )}
            {priceCalculation?.percentage > 0 && (
              <Badge className="bg-green-500 text-white text-xs flex items-center gap-1 shadow-lg border-2 border-white/20">
                <TrendingDown className="h-3 w-3" />-
                {priceCalculation.percentage.toFixed(0)}%
              </Badge>
            )}
          </div>

          {/* Top Right - Variações com melhor contraste */}
          {variationInfo && (
            <div className="absolute top-0 right-0 flex flex-col gap-1 items-end">
              {variationInfo.hasColors && (
                <Badge
                  variant="secondary"
                  className="text-xs flex items-center gap-1 bg-white/95 text-gray-800 shadow-lg border-2 border-gray-200/80 backdrop-blur-sm"
                >
                  <Palette className="h-3 w-3" />
                  {variationInfo.colorCount}
                </Badge>
              )}
              {variationInfo.hasSizes && (
                <Badge
                  variant="secondary"
                  className="text-xs flex items-center gap-1 bg-white/95 text-gray-800 shadow-lg border-2 border-gray-200/80 backdrop-blur-sm"
                >
                  <Layers className="h-3 w-3" />
                  {variationInfo.sizeCount}
                </Badge>
              )}
              {variationInfo.hasGrades && (
                <Badge
                  variant="secondary"
                  className="text-xs flex items-center gap-1 bg-white/95 text-gray-800 shadow-lg border-2 border-gray-200/80 backdrop-blur-sm"
                >
                  <Layers className="h-3 w-3" />
                  {variationInfo.gradeCount}G
                </Badge>
              )}
            </div>
          )}

          {/* Bottom Left - Badge de Variações */}
          {hasVariations && (
            <div className="absolute bottom-0 left-0">
              <Badge className="bg-blue-500 text-white text-xs flex items-center gap-1 shadow-lg border-2 border-white/20">
                <AlertCircle className="h-3 w-3" />
                Variações
              </Badge>
            </div>
          )}
        </div>
      </div>

      {/* Product Info */}
      <div className="p-5">
        {/* Product Name */}
        <h3
          className="font-semibold text-gray-900 mb-3 line-clamp-2 leading-snug"
          style={{
            color: settings.colors.text,
            fontSize: settings.global.fontSize.medium,
          }}
        >
          {product.name}
        </h3>

        {/* Product Description */}
        {product.description && (
          <p
            className="text-gray-500 mb-3 line-clamp-2 text-sm"
            style={{ fontSize: settings.global.fontSize.small }}
          >
            {product.description}
          </p>
        )}

        {/* Price */}
        {showPrices && (
          <div className="mb-4">
            {loading ? (
              <div className="text-gray-500">Carregando preço...</div>
            ) : (
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <span
                    className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"
                    style={{
                      fontSize: settings.global.fontSize.large,
                    }}
                  >
                    {priceCalculation?.price
                      ? formatCurrency(priceCalculation.price)
                      : modelKey === "wholesale_only" && product.wholesale_price
                      ? formatCurrency(product.wholesale_price)
                      : formatCurrency(product.retail_price || 0)}
                  </span>
                  {priceCalculation?.percentage > 0 && product.retail_price && (
                    <span className="text-sm text-gray-500 line-through">
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
            )}

            {modelKey === "wholesale_only" && product.min_wholesale_qty && (
              <div
                className="text-xs text-gray-500 mt-1"
                style={{ fontSize: settings.global.fontSize.small }}
              >
                Mín. {product.min_wholesale_qty} unidades
              </div>
            )}
          </div>
        )}

        {/* Stock */}
        {showStock && (
          <div
            className="text-sm text-gray-500 mb-4 flex items-center gap-2"
            style={{ fontSize: settings.global.fontSize.small }}
          >
            <div
              className={`w-2 h-2 rounded-full ${
                product.stock > 0 ? "bg-green-400" : "bg-red-400"
              }`}
            />
            {product.stock > 0
              ? `${product.stock} em estoque`
              : "Fora de estoque"}
          </div>
        )}

        {/* Variation Info */}
        {hasVariations && (
          <p
            className="text-xs text-gray-500 mb-4"
            style={{ fontSize: settings.global.fontSize.small }}
          >
            Produto com {variationInfo?.totalVariations} variação(ões) disponível(is)
          </p>
        )}

        {/* Action Buttons - Reorganizados */}
        <div className="flex gap-2">
          {/* Botão Ver Detalhes - SEMPRE PRESENTE */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleViewDetails}
            className="flex-1 flex items-center gap-2 hover:bg-gray-50"
            style={{
              borderRadius: `${settings.global.borderRadius - 2}px`,
              fontSize: settings.global.fontSize.small,
            }}
          >
            <Eye className="h-4 w-4" />
            Ver Detalhes
          </Button>

          {/* Botão Adicionar - SOMENTE SEM VARIAÇÕES */}
          {!hasVariations && settings.productCard.showAddToCart && (
            <Button
              onClick={handleAddToCart}
              disabled={product.stock <= 0 || loading}
              size="sm"
              className="flex items-center gap-2 text-white font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98]"
              style={{
                background:
                  product.stock > 0 && !loading
                    ? `linear-gradient(135deg, ${settings.colors.primary}, ${settings.colors.secondary})`
                    : "#9CA3AF",
                borderRadius: `${settings.global.borderRadius - 2}px`,
                fontSize: settings.global.fontSize.small,
              }}
            >
              <ShoppingCart className="h-4 w-4" />
              {loading
                ? "Carregando..."
                : product.stock > 0
                ? "Adicionar"
                : "Sem estoque"}
            </Button>
          )}

          {/* Botão Wishlist */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAddToWishlist(product);
            }}
            className="p-3 rounded-lg border-2 border-gray-200 hover:border-red-300 hover:bg-red-50 transition-all duration-200 flex items-center justify-center"
            style={{
              borderRadius: `${settings.global.borderRadius - 2}px`,
            }}
          >
            <span
              className={`text-lg ${
                isInWishlist ? "text-red-500" : "text-gray-400"
              }`}
            >
              ♥
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModernTemplate;
