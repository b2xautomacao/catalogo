import React, { useState, memo, useCallback, useMemo } from "react";
import {
  ShoppingCart,
  Star,
  AlertCircle,
  Eye,
  Heart,
  TrendingDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Product } from "@/types/product";
import { CatalogType } from "@/hooks/useCatalog";
import { useProductVariations } from "@/hooks/useProductVariations";
import { useCart } from "@/hooks/useCart";
import { useCatalogMode } from "@/hooks/useCatalogMode";
import { useToast } from "@/hooks/use-toast";
import { createCartItem } from "@/utils/cartHelpers";
import ProductDetailsModal from "./ProductDetailsModal";
import ProductPriceTiersDisplay from "./ProductPriceTiersDisplay";
import { useProductPriceTiers } from "@/hooks/useProductPriceTiers";

interface ProductCardProps {
  product: Product;
  catalogType: CatalogType;
  storeIdentifier?: string;
}

const ProductCard: React.FC<ProductCardProps> = memo(
  ({ product, catalogType, storeIdentifier }) => {
    const [imageLoaded, setImageLoaded] = useState(false);
    const [imageError, setImageError] = useState(false);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const { variations } = useProductVariations(product.id);
    const { addItem, items } = useCart();
    const { toast } = useToast();

    // Buscar níveis de preço do produto
    const { tiers, loading: tiersLoading } = useProductPriceTiers(
      product.id,
      product.store_id
    );

    const {
      catalogMode,
      currentCatalogType,
      calculatePrice,
      shouldShowSavingsIndicator,
      calculatePotentialSavings,
    } = useCatalogMode(storeIdentifier);

    // Usar variações do produto se disponíveis, senão usar do hook
    const productVariations = product.variations || variations;

    // Calcular quantidade atual no carrinho para este produto
    const cartQuantity = useMemo(() => {
      return items
        .filter((item) => item.product.id === product.id)
        .reduce((total, item) => total + item.quantity, 0);
    }, [items, product.id]);

    // Calcular preço baseado no modo e quantidade do carrinho
    const effectivePrice = useMemo(() => {
      return calculatePrice(product, cartQuantity + 1); // +1 para próxima unidade
    }, [calculatePrice, product, cartQuantity]);

    // Calcular desconto potencial baseado nos níveis de preço
    const potentialSavings = useMemo(() => {
      if (!product.retail_price || tiersLoading || tiers.length <= 1) {
        return null;
      }

      // Filtrar apenas níveis ativos (exceto varejo)
      const activeTiers = tiers.filter(
        (tier) => tier.tier_order > 1 && tier.is_active
      );

      if (activeTiers.length === 0) {
        return null;
      }

      // Encontrar o nível com maior desconto
      const maxDiscountTier = activeTiers.reduce(
        (max, tier) => {
          const savingsAmount = product.retail_price - tier.price;
          const savingsPercentage =
            (savingsAmount / product.retail_price) * 100;
          return savingsPercentage > max.percentage
            ? { tier, percentage: savingsPercentage, amount: savingsAmount }
            : max;
        },
        { tier: activeTiers[0], percentage: 0, amount: 0 }
      );

      return {
        savings: maxDiscountTier.amount,
        savingsPercentage: maxDiscountTier.percentage,
        maxDiscountPercent: Math.round(maxDiscountTier.percentage),
        tier: maxDiscountTier.tier,
      };
    }, [product.retail_price, tiers, tiersLoading]);

    // Calcular desconto máximo possível (fallback para atacado simples)
    const maxDiscountPercent = useMemo(() => {
      if (potentialSavings) {
        return potentialSavings.maxDiscountPercent;
      }

      // Fallback para atacado simples
      if (!product.wholesale_price || !product.retail_price) return 0;

      const maxSavings = product.retail_price - product.wholesale_price;
      const maxPercent = (maxSavings / product.retail_price) * 100;
      return Math.round(maxPercent);
    }, [potentialSavings, product.wholesale_price, product.retail_price]);

    // Gerar avaliação fictícia baseada no ID do produto
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

    const handleAddToCart = useCallback(
      (e: React.MouseEvent) => {
        e.stopPropagation(); // Evitar que o clique dispare o modal

        // Se o produto tem variações, abrir modal de detalhes
        if (productVariations.length > 0) {
          setShowDetailsModal(true);
        } else {
          // Se não tem variações, adicionar diretamente ao carrinho
          const minQuantity = 1;
          const cartItem = createCartItem(product, catalogType, minQuantity);
          addItem(cartItem);

          toast({
            title: "Produto adicionado!",
            description: `${product.name} foi adicionado ao carrinho.`,
          });
        }
      },
      [productVariations.length, product, catalogType, addItem, toast]
    );

    // Função para clique em qualquer área do card
    const handleCardClick = useCallback(() => {
      setShowDetailsModal(true);
    }, []);

    // Função para adicionar ao carrinho via modal
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
        return { text: "Em estoque", color: "bg-green-500" };
      return { text: `${product.stock} disponíveis`, color: "bg-blue-500" };
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
          className="group hover:shadow-xl transition-all duration-300 hover:scale-[1.02] overflow-hidden bg-white border border-gray-100 cursor-pointer"
          onClick={handleCardClick}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <CardContent className="p-0">
            {/* Image Container */}
            <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100">
              {!imageError ? (
                <img
                  src={
                    product.image_url ||
                    "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=400&fit=crop"
                  }
                  alt={product.name}
                  className={`w-full h-full object-cover transition-all duration-300 group-hover:scale-105 ${
                    imageLoaded ? "opacity-100" : "opacity-0"
                  } ${isHovered ? "scale-110" : "scale-100"}`}
                  onLoad={handleImageLoad}
                  onError={handleImageError}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  <AlertCircle className="h-12 w-12" />
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
                    className="h-9 w-9 p-0 rounded-full bg-white/95 hover:bg-white shadow-lg hover:shadow-xl transition-all duration-200 border border-gray-200"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowDetailsModal(true);
                    }}
                  >
                    <Eye className="h-4 w-4 text-gray-700 hover:text-blue-600 transition-colors duration-200" />
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    className="h-9 w-9 p-0 rounded-full bg-white/95 hover:bg-white shadow-lg hover:shadow-xl transition-all duration-200 border border-gray-200"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Heart className="h-4 w-4 text-gray-700 hover:text-red-500 transition-colors duration-200" />
                  </Button>
                </div>
              </div>

              {/* Stock Status Badge */}
              <Badge
                className={`absolute top-2 left-2 ${stockStatus.color} text-white text-xs px-2 py-1`}
              >
                {stockStatus.text}
              </Badge>

              {/* Desconto potencial (níveis progressivos) */}
              {potentialSavings && potentialSavings.savingsPercentage > 0 && (
                <Badge className="absolute top-2 left-12 bg-orange-500 text-white text-xs px-2 py-1">
                  <TrendingDown className="h-3 w-3 mr-1" />
                  Até -{maxDiscountPercent}%
                </Badge>
              )}

              {/* Variations Badge */}
              {productVariations.length > 0 && (
                <Badge className="absolute top-2 right-2 bg-blue-500 text-white text-xs px-2 py-1">
                  {productVariations.length} variações
                </Badge>
              )}
            </div>

            {/* Product Info */}
            <div className="p-3 space-y-2">
              {/* Product Name */}
              <h3 className="font-semibold text-gray-900 line-clamp-2 text-sm leading-5 min-h-[40px]">
                {product.name}
              </h3>

              {/* Category */}
              {product.category && (
                <p className="text-xs text-gray-500 uppercase tracking-wide">
                  {product.category}
                </p>
              )}

              {/* Rating */}
              <div className="flex items-center gap-1">
                <div className="flex gap-0.5">{renderStars(rating)}</div>
                <span className="text-xs text-gray-500">
                  {rating.toFixed(1)} ({reviewCount})
                </span>
              </div>

              {/* Prices */}
              <div className="space-y-1">
                {/* Retail Price */}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600">Varejo:</span>
                  <span className="font-bold text-green-600">
                    R$ {product.retail_price?.toFixed(2)}
                  </span>
                </div>

                {/* Remover exibição direta de wholesale_price/min_wholesale_qty */}
                {/* Toda exibição de tiers será feita pelo ProductPriceTiersDisplay */}
              </div>

              {/* Indicador de economia potencial */}
              {potentialSavings && potentialSavings.savingsPercentage > 0 && (
                <div className="p-2 bg-orange-50 border border-orange-200 rounded-lg">
                  <div className="flex items-center gap-2 text-orange-700">
                    <TrendingDown className="h-3 w-3" />
                    <span className="text-xs font-medium">
                      Economize até R$ {potentialSavings.savings.toFixed(2)}
                      {potentialSavings.tier && (
                        <span className="text-orange-600">
                          {" "}
                          ({potentialSavings.tier.tier_name})
                        </span>
                      )}
                    </span>
                  </div>
                </div>
              )}

              {/* Price Tiers Display - agora centraliza toda a exibição de atacado/tier */}
              <ProductPriceTiersDisplay
                productId={product.id}
                storeId={product.store_id}
                retailPrice={product.retail_price || 0}
                className="mt-2"
              />

              {/* Add to Cart Button */}
              <Button
                onClick={handleAddToCart}
                disabled={product.stock === 0}
                className="w-full mt-3 bg-blue-600 hover:bg-blue-700 text-white text-sm py-2"
                size="sm"
              >
                <ShoppingCart className="h-4 w-4 mr-2" />
                {productVariations.length > 0
                  ? "Ver Opções"
                  : "Adicionar ao Carrinho"}
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
            onAddToCart={handleModalAddToCart}
            catalogType={catalogType}
          />
        )}
      </>
    );
  }
);

ProductCard.displayName = "ProductCard";

export default ProductCard;
