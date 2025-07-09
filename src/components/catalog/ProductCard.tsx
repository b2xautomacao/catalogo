import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { Product } from "@/types/product";
import { CatalogType } from "@/hooks/useCatalog";
import { ShoppingCart, Eye, Heart, Star, Package } from "lucide-react";
import { useProductPriceTiers } from "@/hooks/useProductPriceTiers";
import ProductImageCarousel from "./ProductImageCarousel";
import ProductPriceDisplay from "./ProductPriceDisplay";

interface ProductCardProps {
  product: Product;
  catalogType?: CatalogType;
  onClick?: () => void;
  onAddToCart?: (product: Product) => void;
  onViewDetails?: (product: Product) => void;
  onToggleWishlist?: (product: Product) => void;
  isInWishlist?: boolean;
}

const ProductCard: React.FC<ProductCardProps> = ({
  product,
  catalogType = "retail",
  onClick,
  onAddToCart,
  onViewDetails,
  onToggleWishlist,
  isInWishlist = false,
}) => {
  // ✅ HOOK PARA NÍVEIS DE PREÇO
  const { tiers: priceTiers } = useProductPriceTiers(product.id, {
    wholesale_price: product.wholesale_price,
    min_wholesale_qty: product.min_wholesale_qty,
    retail_price: product.retail_price,
  });

  // ✅ LÓGICA INTELIGENTE: Verificar se tem variações ativas
  const hasActiveVariations = () => {
    return product.variations && product.variations.length > 0;
  };

  // ✅ LÓGICA INTELIGENTE: Verificar estoque total (produto + variações)
  const getTotalStock = () => {
    let totalStock = product.stock || 0;

    if (product.variations && product.variations.length > 0) {
      const variationsStock = product.variations.reduce((sum, variation) => {
        return sum + (variation.stock || 0);
      }, 0);

      // Se tem variações, usar o estoque das variações
      if (variationsStock > 0) {
        return variationsStock;
      }
    }

    return totalStock;
  };

  // ✅ VERIFICAR SE TEM PREÇO ATACADO DISPONÍVEL
  const hasWholesalePrice =
    product.wholesale_price && product.wholesale_price < product.retail_price;

  // ✅ VERIFICAR SE TEM NÍVEIS DE PREÇO CONFIGURADOS
  const hasPriceTiers = priceTiers && priceTiers.length > 1;

  // ✅ VERIFICAR SE TEM ATACADO DISPONÍVEL (preço simples OU níveis)
  const hasWholesaleAvailable = hasWholesalePrice || hasPriceTiers;

  const hasVariations = hasActiveVariations();
  const totalStock = getTotalStock();
  const isInStock = totalStock > 0;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onAddToCart && !hasVariations) {
      onAddToCart(product);
    }
  };

  const handleViewDetails = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onViewDetails) {
      onViewDetails(product);
    }
  };

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onToggleWishlist) {
      onToggleWishlist(product);
    }
  };

  // ✅ GERAÇÃO DE AVALIAÇÃO FICTÍCIA
  const generateRating = () => {
    const hash = product.id.split("").reduce((a, b) => {
      a = (a << 5) - a + b.charCodeAt(0);
      return a & a;
    }, 0);
    return 3.5 + (Math.abs(hash) % 15) / 10;
  };

  const rating = generateRating();
  const reviewCount = Math.floor(
    5 + ((product.name.length + (product.retail_price || 0)) % 45)
  );

  // ✅ RENDERIZAR ESTRELAS
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
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
      {/* ✅ CARROSSEL DE IMAGENS INTELIGENTE */}
      <div className="relative">
        <ProductImageCarousel
          productId={product.id}
          productName={product.name}
          showThumbnails={true}
          showNavigation={true}
          showCounter={true}
          autoPlay={false}
        />

        {/* ✅ BADGES INTELIGENTES */}
        <div className="absolute top-3 left-3 flex flex-col gap-1 z-30">
          {product.is_featured && (
            <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white border-0 text-xs">
              ⭐ Destaque
            </Badge>
          )}
          {hasVariations && (
            <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0 text-xs">
              Variações
            </Badge>
          )}
          {/* Badge de atacado */}
          {priceTiers.length > 0 && (
            <Badge className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white border-0 text-xs">
              Atacado
            </Badge>
          )}
          {!isInStock && (
            <Badge variant="destructive" className="text-xs">
              Sem estoque
            </Badge>
          )}
          {isInStock && totalStock <= (product.stock_alert_threshold || 5) && (
            <Badge className="bg-orange-500 text-white text-xs">
              Estoque baixo
            </Badge>
          )}
        </div>

        {/* Botão Wishlist */}
        {onToggleWishlist && (
          <button
            onClick={handleToggleWishlist}
            className={`absolute top-3 right-3 p-2 rounded-full backdrop-blur-sm transition-all z-30 ${
              isInWishlist
                ? "bg-red-500 text-white hover:bg-red-600"
                : "bg-white/80 text-gray-600 hover:bg-white hover:text-red-500"
            }`}
          >
            <Heart
              className={`h-4 w-4 ${isInWishlist ? "fill-current" : ""}`}
            />
          </button>
        )}
      </div>

      {/* ✅ CONTEÚDO COM INFORMAÇÕES ESSENCIAIS */}
      <div className="p-4">
        <div className="space-y-3">
          {/* Título e Descrição */}
          <div className="cursor-pointer" onClick={onClick}>
            <h3 className="font-semibold text-base mb-1 line-clamp-2 hover:text-primary transition-colors">
              {product.name}
            </h3>
            {product.description && (
              <p className="text-sm text-gray-600 line-clamp-2">
                {product.description}
              </p>
            )}
          </div>

          {/* ✅ PREÇO PADRONIZADO USANDO COMPONENTE REUTILIZÁVEL */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-xl font-bold text-primary">
                  {formatCurrency(product.retail_price)}
                </span>
                {/* Preço Atacado Destacado */}
                {priceTiers.length > 0 && (
                  <div className="flex items-center gap-1">
                    <span className="text-sm text-green-600 font-semibold">
                      {priceTiers[0].tier_name}:{" "}
                      {formatCurrency(priceTiers[0].price)}
                    </span>
                    {priceTiers.length > 1 && (
                      <span
                        className="text-xs text-gray-400 cursor-pointer"
                        title={priceTiers
                          .map(
                            (tier) =>
                              `${tier.tier_name}: ${
                                tier.min_quantity
                              }+ un. - ${formatCurrency(tier.price)}`
                          )
                          .join("\n")}
                      >
                        +{priceTiers.length - 1} níveis
                      </span>
                    )}
                  </div>
                )}
              </div>
              {isInStock && (
                <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
                  {totalStock} disponível
                </span>
              )}
            </div>
          </div>

          {/* ✅ CATEGORIA E AVALIAÇÃO */}
          <div className="flex items-center justify-between">
            {product.category && (
              <span className="inline-block text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                {product.category}
              </span>
            )}
            {/* ✅ AVALIAÇÃO COM ESTRELAS */}
            <div className="flex items-center gap-1">
              <div className="flex gap-0.5">{renderStars(rating)}</div>
              <span className="text-xs text-gray-500">({reviewCount})</span>
            </div>
          </div>

          {/* ✅ BOTÕES INTELIGENTES */}
          <div className="flex gap-2 pt-2">
            {/* Se TEM variações -> Ver detalhes */}
            {hasVariations ? (
              <Button
                size="sm"
                onClick={handleViewDetails}
                className="flex-1 h-9 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
              >
                <Eye className="h-4 w-4 mr-1" />
                Ver detalhes
              </Button>
            ) : (
              // Se NÃO tem variações -> Adicionar ao carrinho (se em estoque)
              <>
                {onViewDetails && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleViewDetails}
                    className="flex-1 h-9"
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Detalhes
                  </Button>
                )}
                {onAddToCart && isInStock && (
                  <Button
                    size="sm"
                    onClick={handleAddToCart}
                    className="flex-1 h-9 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white"
                  >
                    <ShoppingCart className="h-4 w-4 mr-1" />
                    Adicionar
                  </Button>
                )}
              </>
            )}

            {/* Se sem estoque */}
            {!isInStock && (
              <Button size="sm" disabled className="flex-1 h-9">
                Indisponível
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
