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
  Heart,
  Share2,
  Zap,
  Star,
  Clock,
  Users,
  Truck,
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
import GradePriceDisplay from "./GradePriceDisplay";

// Componentes de conversão
import UrgencyBadges from "./conversion/UrgencyBadges";
import ProductReviews from "./conversion/ProductReviews";
import PriceStrategy from "./conversion/PriceStrategy";
import TrustBadges from "./conversion/TrustBadges";
import UrgencyTimer from "./conversion/UrgencyTimer";

type CatalogType = "retail" | "wholesale";

export interface ProductCardOptimizedProps {
  product: Product;
  catalogType: CatalogType;
  onAddToCart: (product: Product, quantity?: number, variation?: any) => void;
  onViewDetails?: (product: Product) => void;
  onAddToWishlist?: (product: Product) => void;
  onShare?: (product: Product) => void;
  showConversionElements?: boolean;
  cartTotal?: number;
}

const ProductCardOptimized: React.FC<ProductCardOptimizedProps> = ({
  product,
  catalogType,
  onAddToCart,
  onViewDetails,
  onAddToWishlist,
  onShare,
  showConversionElements = true,
  cartTotal = 0,
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
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

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
      colorList: colors.slice(0, 3),
      sizeList: sizes.slice(0, 3),
    };
  }, [product.variations]);

  // Dados simulados para demonstração (em produção, viriam do backend)
  const mockData = {
    rating: Math.random() * 2 + 3, // 3-5 estrelas
    reviewCount: Math.floor(Math.random() * 100) + 10,
    salesCount: Math.floor(Math.random() * 500) + 50,
    viewsCount: Math.floor(Math.random() * 50) + 5,
    stock: Math.floor(Math.random() * 20) + 1,
    isBestSeller: Math.random() > 0.7,
    isOnSale: priceCalculation?.percentage > 0,
    isNew: Math.random() > 0.8,
    isLimited: Math.random() > 0.9,
  };

  // Timer de oferta (simulado)
  const offerEndTime = new Date();
  offerEndTime.setHours(offerEndTime.getHours() + 24);

  const handleAction = () => {
    if (hasVariations) {
      if (onViewDetails) {
        onViewDetails(product);
      }
    } else {
      const minQty =
        modelKey === "wholesale_only"
          ? product.min_wholesale_qty || 1
          : quantity;
      onAddToCart(product, minQty);
    }
  };

  const handleViewDetails = (e?: React.MouseEvent) => {
    console.log('🖱️ ProductCardOptimized - handleViewDetails chamado:', { 
      productId: product.id, 
      productName: product.name,
      hasOnViewDetails: !!onViewDetails,
      event: !!e 
    });
    
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    
    if (onViewDetails) {
      onViewDetails(product);
    } else {
      // Fallback: redirecionar diretamente para página do produto
      const currentHost = window.location.hostname;
      const isSubdomain = currentHost.includes('.aoseudispor.com.br') && !currentHost.startsWith('app.');
      
      console.log('🔄 ProductCardOptimized - Redirecionando:', { currentHost, isSubdomain });
      
      if (isSubdomain) {
        window.location.href = `/produto/${product.id}`;
      } else {
        window.location.href = `/catalog/${(product as any).store_slug || 'default'}/produto/${product.id}`;
      }
    }
  };

  const handleWishlist = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsWishlisted(!isWishlisted);
    onAddToWishlist?.(product);
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    onShare?.(product);
  };

  return (
    <div
      className={`relative flex flex-col rounded-xl border text-card-foreground shadow-sm hover:shadow-xl transition-all duration-300 group overflow-hidden ${
        product.is_featured
          ? "border-yellow-300 bg-gradient-to-br from-yellow-50 to-white shadow-lg ring-2 ring-yellow-200"
          : "border-border bg-white hover:border-primary/50 hover:scale-[1.02]"
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image Container com elementos de conversão */}
      <div className="relative cursor-pointer" onClick={handleViewDetails}>
        <ProductCardImageGallery
          productId={product.id}
          productName={product.name}
          maxImages={3}
          className="aspect-square"
          preloadedImages={(product as any).images}
        />

        {/* Badges de urgência e conversão */}
        {showConversionElements && (
          <UrgencyBadges
            stock={mockData.stock}
            isBestSeller={mockData.isBestSeller}
            isOnSale={mockData.isOnSale}
            discountPercentage={priceCalculation?.percentage || 0}
            viewsCount={mockData.viewsCount}
            salesCount={mockData.salesCount}
            isNew={mockData.isNew}
            isLimited={mockData.isLimited}
          />
        )}

        {/* Botões de ação no hover */}
        <div className={`absolute top-2 right-2 flex flex-col gap-2 transition-opacity duration-200 ${
          isHovered ? "opacity-100" : "opacity-0"
        }`}>
          <Button
            size="icon"
            variant="secondary"
            className="h-8 w-8 bg-white/90 hover:bg-white shadow-lg"
            onClick={handleWishlist}
          >
            <Heart className={`h-4 w-4 ${isWishlisted ? "fill-red-500 text-red-500" : ""}`} />
          </Button>
          
          <Button
            size="icon"
            variant="secondary"
            className="h-8 w-8 bg-white/90 hover:bg-white shadow-lg"
            onClick={handleShare}
          >
            <Share2 className="h-4 w-4" />
          </Button>
        </div>

        {/* Timer de oferta */}
        {showConversionElements && mockData.isOnSale && (
          <div className="absolute bottom-2 right-2">
            <UrgencyTimer
              endTime={offerEndTime}
              variant="destructive"
              showIcon={true}
            />
          </div>
        )}
      </div>

      <div className="p-4 space-y-3 flex-1 flex flex-col">
        {/* Product Info */}
        <div className="flex-1">
          <h3 
            className="font-semibold text-base line-clamp-2 leading-tight mb-2 cursor-pointer hover:text-primary transition-colors"
            onClick={handleViewDetails}
          >
            {product.name}
          </h3>
          
          {product.description && (
            <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
              {product.description}
            </p>
          )}

          {/* Avaliações e prova social */}
          {showConversionElements && (
            <ProductReviews
              rating={mockData.rating}
              reviewCount={mockData.reviewCount}
              salesCount={mockData.salesCount}
              size="sm"
            />
          )}
        </div>

        {/* Price Section com estratégias de conversão */}
        <div className="space-y-2">
          {showConversionElements ? (
            <PriceStrategy
              originalPrice={product.retail_price || 0}
              currentPrice={priceCalculation?.price || product.retail_price || 0}
              minQuantity={product.min_wholesale_qty || 1}
              showInstallments={true}
              showSavings={true}
              showFreeShipping={true}
              freeShippingThreshold={200}
              cartTotal={cartTotal}
            />
          ) : (
            // Fallback para preço simples
            <div className="flex items-center justify-between">
              <span className="text-lg font-bold text-foreground">
                {formatCurrency(priceCalculation?.price || product.retail_price || 0)}
              </span>
              {priceCalculation?.percentage > 0 && (
                <Badge variant="destructive" className="text-xs">
                  -{priceCalculation.percentage.toFixed(0)}%
                </Badge>
              )}
            </div>
          )}
        </div>

        {/* Variações Info */}
        {hasVariations && variationInfo && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Package className="h-4 w-4" />
              <span>{variationInfo.total} opções disponíveis</span>
            </div>
            
            {variationInfo.colorList.length > 0 && (
              <div className="flex items-center gap-1">
                <Palette className="h-3 w-3 text-muted-foreground" />
                <div className="flex gap-1">
                  {variationInfo.colorList.map((color, index) => (
                    <div
                      key={index}
                      className="w-4 h-4 rounded-full border border-gray-300"
                      style={{ backgroundColor: color.toLowerCase() }}
                      title={color}
                    />
                  ))}
                  {variationInfo.colors > 3 && (
                    <span className="text-xs text-muted-foreground">
                      +{variationInfo.colors - 3}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-2">
          <Button
            onClick={handleAction}
            className="w-full bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-white font-semibold py-2.5 rounded-lg transition-all duration-200 hover:shadow-lg"
          >
            {hasVariations ? (
              <>
                <Eye className="h-4 w-4 mr-2" />
                Ver Opções
              </>
            ) : (
              <>
                <ShoppingCart className="h-4 w-4 mr-2" />
                Adicionar ao Carrinho
              </>
            )}
          </Button>

          {/* Botão Ver Detalhes sempre disponível */}
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={handleViewDetails}
          >
            <Eye className="h-4 w-4 mr-2" />
            Ver Detalhes
          </Button>
        </div>

        {/* Trust Badges (compactos) */}
        {showConversionElements && (
          <TrustBadges
            showSecurity={true}
            showGuarantee={true}
            showShipping={true}
            showReturns={false}
            showAwards={false}
            compact={true}
          />
        )}
      </div>
    </div>
  );
};

export default ProductCardOptimized;


