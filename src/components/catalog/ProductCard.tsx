import React, { useState, memo, useCallback, useMemo } from "react";
import {
  ShoppingCart,
  Star,
  AlertCircle,
  Heart,
  Eye,
  TrendingDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Product } from "@/types/product";
import { CatalogType } from "@/hooks/useCatalog";
import { useProductVariations } from "@/hooks/useProductVariations";
import { useCart } from "@/hooks/useCart";
import { useToast } from "@/hooks/use-toast";
import { createCartItem } from "@/utils/cartHelpers";
import ProductDetailsModal from "./ProductDetailsModal";
import { useStorePriceModel } from "@/hooks/useStorePriceModel";
import { PriceModelType } from "@/types/price-models";

interface ProductCardProps {
  product: Product;
  catalogType: CatalogType;
  onAddToCart: (product: Product) => void;
  onAddToWishlist: (product: Product) => void;
  onQuickView: (product: Product) => void;
  isInWishlist: boolean;
  showPrices: boolean;
  showStock: boolean;
  template?: "minimal" | "modern" | "elegant" | "industrial";
}

const ProductCard: React.FC<ProductCardProps> = memo(
  ({
    product,
    catalogType,
    onAddToCart,
    onAddToWishlist,
    onQuickView,
    isInWishlist,
    showPrices,
    showStock,
    template = "modern",
  }) => {
    const [imageLoaded, setImageLoaded] = useState(false);
    const [imageError, setImageError] = useState(false);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const { variations } = useProductVariations(product.id);
    const { addItem } = useCart();
    const { toast } = useToast();
    const { priceModel, loading } = useStorePriceModel(product.store_id);
    const modelKey = priceModel?.price_model || ("retail_only" as PriceModelType);

    const rating = useMemo(() => {
      const hash = product.id.split("").reduce((a, b) => {
        a = (a << 5) - a + b.charCodeAt(0);
        return a & a;
      }, 0);
      return 3.5 + (Math.abs(hash) % 15) / 10; // Entre 3.5 e 5.0
    }, [product.id]);

    const reviewCount = useMemo(() => {
      const hash = product.name.length + (product.retail_price || 0);
      return Math.floor(5 + (hash % 45)); // Entre 5 e 50 avaliações
    }, [product.name, product.retail_price]);

    // Calcular desconto potencial
    const potentialSavings = useMemo(() => {
      if (!product.wholesale_price || !product.retail_price) return null;

      const maxSavings = product.retail_price - product.wholesale_price;
      const maxPercent = (maxSavings / product.retail_price) * 100;

      return {
        savings: maxSavings,
        savingsPercentage: maxPercent,
        maxDiscountPercent: Math.round(maxPercent),
      };
    }, [product.wholesale_price, product.retail_price]);

    const handleAddToCart = useCallback(
      (e: React.MouseEvent) => {
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
              ...product, 
              price_model: modelKey,
              allow_negative_stock: product.allow_negative_stock || false
            },
            quantity: qty,
            price,
            originalPrice: price,
            catalogType,
            isWholesalePrice: isWholesale,
          },
          modelKey
        );
        toast({
          title: "Produto adicionado!",
          description: `${product.name} foi adicionado ao carrinho.`,
        });
      },
      [addItem, product, catalogType, modelKey, toast, loading]
    );

    const handleCardClick = useCallback(() => {
      onQuickView(product);
    }, [onQuickView, product]);

    const handleModalAddToCart = useCallback(
      (product: Product, quantity: number, variation?: any) => {
        const cartItem = createCartItem(
          product,
          catalogType,
          quantity,
          variation
        );
        addItem(cartItem);

        toast({
          title: "Produto adicionado!",
          description: `${product.name} foi adicionado ao carrinho.`,
        });
      },
      [catalogType, addItem, toast]
    );

    const handleImageLoad = useCallback(() => {
      setImageLoaded(true);
    }, []);

    const handleImageError = useCallback(() => {
      setImageError(true);
    }, []);

    const getStockStatus = () => {
      if (product.stock === 0) return { text: "Esgotado", color: "bg-red-500" };
      if (product.stock <= 5)
        return { text: "Últimas unidades", color: "bg-orange-500" };
      if (product.stock > 50)
        return { text: "Disponível", color: "bg-green-500" };
      return { text: `${product.stock} disponíveis`, color: "bg-gray-500" };
    };

    const stockStatus = getStockStatus();

    // Função para renderizar as estrelas
    const renderStars = (rating: number) => {
      const fullStars = Math.floor(rating);
      const hasHalfStar = rating % 1 >= 0.5;
      const stars = [];

      for (let i = 0; i < 5; i++) {
        if (i < fullStars) {
          stars.push(
            <Star key={i} className="h-3 w-3 fill-yellow-400 text-yellow-400" />
          );
        } else if (i === fullStars && hasHalfStar) {
          stars.push(
            <div key={i} className="relative h-3 w-3">
              <Star className="h-3 w-3 text-gray-300 absolute" />
              <div className="overflow-hidden w-1/2">
                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
              </div>
            </div>
          );
        } else {
          stars.push(<Star key={i} className="h-3 w-3 text-gray-300" />);
        }
      }
      return stars;
    };

    return (
      <>
        <Card
          className="group hover:shadow-lg transition-all duration-200 hover:scale-[1.01] overflow-hidden bg-white border border-gray-200 cursor-pointer"
          onClick={() => onQuickView(product)}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <CardContent className="p-0">
            {/* Image Container */}
            <div className="relative aspect-square overflow-hidden bg-gray-50">
              {!imageError ? (
                <img
                  src={product.image_url || "/placeholder.svg"}
                  alt={product.name}
                  className={`w-full h-full object-cover transition-transform duration-200 ${
                    imageLoaded ? "opacity-100" : "opacity-0"
                  } ${isHovered ? "scale-110" : "scale-100"}`}
                  onLoad={() => setImageLoaded(true)}
                  onError={() => setImageError(true)}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  <AlertCircle className="h-10 w-10" />
                </div>
              )}

              {/* Overlay com ações rápidas */}
              <div
                className={`absolute inset-0 bg-black/30 transition-opacity duration-300 ${
                  isHovered ? "opacity-100" : "opacity-0"
                }`}
              >
                <div className="absolute top-2 right-2 flex flex-col gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    className="h-8 w-8 p-0 rounded-full bg-white/95 hover:bg-white shadow-lg hover:shadow-xl transition-all duration-200 border border-gray-200"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowDetailsModal(true);
                    }}
                  >
                    <Eye className="h-3 w-3 text-gray-700 hover:text-blue-600 transition-colors duration-200" />
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    className="h-8 w-8 p-0 rounded-full bg-white/95 hover:bg-white shadow-lg hover:shadow-xl transition-all duration-200 border border-gray-200"
                    onClick={(e) => {
                      e.stopPropagation();
                      onAddToWishlist(product);
                    }}
                  >
                    <Heart
                      className={`h-3 w-3 ${
                        isInWishlist
                          ? "fill-red-500 text-red-500"
                          : "text-gray-700 hover:text-red-500 transition-colors duration-200"
                      }`}
                    />
                  </Button>
                </div>
              </div>

              {/* Badges */}
              {product.wholesale_price && product.retail_price && (
                <Badge className="absolute top-2 left-2 bg-red-500 text-white text-xs px-2 py-1">
                  -
                  {Math.round(
                    ((product.retail_price - product.wholesale_price) /
                      product.retail_price) *
                      100
                  )}
                  %
                </Badge>
              )}

              {showStock && (
                <Badge
                  className={`absolute bottom-2 right-2 ${
                    product.stock > 0 ? "bg-green-500" : "bg-red-500"
                  } text-white text-xs px-2 py-1`}
                >
                  {product.stock > 0 ? `${product.stock} em estoque` : "Esgotado"}
                </Badge>
              )}
            </div>

            {/* Product Info */}
            <div className="p-3 space-y-2">
              {/* Category */}
              {product.category && (
                <p className="text-xs text-gray-400 uppercase tracking-wide">
                  {product.category}
                </p>
              )}

              {/* Product Name */}
              <h3 className="font-medium text-gray-900 line-clamp-2 text-sm leading-5 min-h-[40px]">
                {product.name}
              </h3>

              {/* Prices */}
              {showPrices && (
                <div className="space-y-1">
                  {loading ? (
                    <div className="text-gray-500">Carregando preço...</div>
                  ) : modelKey === "wholesale_only" ? (
                    <>
                      <span className="text-lg font-bold text-orange-700">
                        R$ {product.wholesale_price?.toFixed(2)}
                      </span>
                      {product.min_wholesale_qty && (
                        <div className="text-xs text-gray-500 mt-1">
                          Mín. {product.min_wholesale_qty} unidades
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold text-gray-900">
                        R$ {product.retail_price?.toFixed(2)}
                      </span>
                      {product.wholesale_price && (
                        <span className="text-sm text-gray-500 line-through">
                          R$ {product.wholesale_price.toFixed(2)}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Add to Cart Button */}
              <Button
                onClick={handleAddToCart}
                disabled={product.stock <= 0 || loading}
                className="w-full mt-2 bg-blue-600 hover:bg-blue-700 text-white text-sm py-2"
                size="sm"
              >
                <ShoppingCart className="h-3 w-3 mr-2" />
                {loading
                  ? "Carregando..."
                  : product.stock <= 0
                  ? "Sem estoque"
                  : variations.length > 0
                  ? "Ver Opções"
                  : "Comprar"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Product Details Modal */}
        {showDetailsModal && (
          <ProductDetailsModal
            product={product}
            isOpen={showDetailsModal}
            onClose={() => setShowDetailsModal(false)}
            onAddToCart={(product: Product, quantity: number, variation?: any) => {
              const cartItem = createCartItem(
                product,
                catalogType,
                quantity,
                variation
              );
              addItem(cartItem);

              toast({
                title: "Produto adicionado!",
                description: `${product.name} foi adicionado ao carrinho.`,
              });
            }}
            catalogType={catalogType}
          />
        )}
      </>
    );
  }
);

ProductCard.displayName = "ProductCard";

export default ProductCard;
