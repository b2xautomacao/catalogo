import React, { useState, memo, useCallback } from 'react';
import { Heart, ShoppingCart, Eye, Star, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Product } from '@/hooks/useCatalog';
import { CatalogType } from '@/hooks/useCatalog';
import { useProductVariations } from '@/hooks/useProductVariations';
import { useCart } from '@/hooks/useCart';
import { useToast } from '@/hooks/use-toast';
import { createCartItem } from '@/utils/cartHelpers';
import ProductDetailsModal from './ProductDetailsModal';

interface ProductCardProps {
  product: Product;
  catalogType: CatalogType;
  onAddToWishlist: (product: Product) => void;
  onQuickView: (product: Product) => void;
  isInWishlist?: boolean;
}

const ProductCard: React.FC<ProductCardProps> = memo(({
  product,
  catalogType,
  onAddToWishlist,
  onQuickView,
  isInWishlist = false
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const { variations } = useProductVariations(product.id);
  const { addItem } = useCart();
  const { toast } = useToast();

  // Usar variações do produto se disponíveis, senão usar do hook
  const productVariations = product.variations || variations;

  const price = catalogType === 'wholesale' && product.wholesale_price 
    ? product.wholesale_price 
    : product.retail_price;

  const minQuantity = catalogType === 'wholesale' && product.min_wholesale_qty 
    ? product.min_wholesale_qty 
    : 1;

  const discountPercentage = catalogType === 'wholesale' && product.wholesale_price
    ? Math.round(((product.retail_price - product.wholesale_price) / product.retail_price) * 100)
    : 0;

  const handleShare = useCallback(async () => {
    const shareData = {
      title: product.name,
      text: product.description || 'Confira este produto incrível!',
      url: window.location.href + `/produto/${product.id}`
    };

    if (navigator.share) {
      await navigator.share(shareData);
    } else {
      navigator.clipboard.writeText(shareData.url);
      toast({
        title: "Link copiado!",
        description: "O link do produto foi copiado para a área de transferência.",
      });
    }
  }, [product.name, product.description, product.id, toast]);

  const handleAddToCart = useCallback(() => {
    // Se o produto tem variações, abrir modal de detalhes
    if (productVariations.length > 0) {
      setShowDetailsModal(true);
    } else {
      // Se não tem variações, adicionar diretamente ao carrinho
      const minQuantity = catalogType === 'wholesale' && product.min_wholesale_qty 
        ? product.min_wholesale_qty 
        : 1;

      const cartItem = createCartItem(product, catalogType, minQuantity);
      addItem(cartItem);
    }
  }, [productVariations.length, product, catalogType, addItem]);

  const handleAddToWishlist = useCallback(() => {
    onAddToWishlist(product);
  }, [onAddToWishlist, product]);

  const handleQuickView = useCallback(() => {
    setShowDetailsModal(true);
  }, []);

  const handleImageLoad = useCallback(() => {
    setImageLoaded(true);
  }, []);

  const handleImageError = useCallback(() => {
    setImageError(true);
  }, []);

  const getStockStatus = () => {
    if (product.stock === 0) return { text: 'Esgotado', color: 'bg-red-500' };
    if (product.stock <= 5) return { text: 'Últimas unidades', color: 'bg-orange-500' };
    return null;
  };

  const stockStatus = getStockStatus();

  return (
    <>
      <Card className="group hover:shadow-2xl transition-all duration-500 hover:scale-[1.02] overflow-hidden bg-white border-0 shadow-lg hover:shadow-blue-100/50">
        <CardContent className="p-0">
          {/* Image Container */}
          <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100">
            {!imageError ? (
              <img
                src={product.image_url || 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=400&fit=crop'}
                alt={product.name}
                className={`w-full h-full object-cover transition-all duration-500 group-hover:scale-110 ${
                  imageLoaded ? 'opacity-100' : 'opacity-0'
                }`}
                onLoad={handleImageLoad}
                onError={handleImageError}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                <span className="text-gray-400 text-sm font-medium">Sem imagem</span>
              </div>
            )}

            {/* Overlay Actions */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-end justify-center pb-4">
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={handleQuickView}
                  className="bg-white/95 hover:bg-white text-gray-900 shadow-lg backdrop-blur-sm"
                >
                  <Eye size={16} />
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={handleAddToWishlist}
                  className={`bg-white/95 hover:bg-white shadow-lg backdrop-blur-sm ${
                    isInWishlist ? 'text-red-500' : 'text-gray-900'
                  }`}
                >
                  <Heart size={16} fill={isInWishlist ? 'currentColor' : 'none'} />
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={handleShare}
                  className="bg-white/95 hover:bg-white text-gray-900 shadow-lg backdrop-blur-sm"
                >
                  <Share2 size={16} />
                </Button>
              </div>
            </div>

            {/* Badges */}
            <div className="absolute top-3 left-3 flex flex-col gap-2">
              {catalogType === 'wholesale' && discountPercentage > 0 && (
                <Badge className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-lg">
                  -{discountPercentage}%
                </Badge>
              )}
              {stockStatus && (
                <Badge className={`${stockStatus.color} text-white shadow-lg`}>
                  {stockStatus.text}
                </Badge>
              )}
              {productVariations.length > 0 && (
                <Badge className="bg-blue-500 text-white shadow-lg">
                  {productVariations.length} variações
                </Badge>
              )}
            </div>

            {/* Wishlist Button */}
            <Button
              size="sm"
              variant="ghost"
              onClick={handleAddToWishlist}
              className="absolute top-3 right-3 w-9 h-9 p-0 bg-white/90 hover:bg-white shadow-lg backdrop-blur-sm"
            >
              <Heart size={16} fill={isInWishlist ? 'red' : 'none'} className={isInWishlist ? 'text-red-500' : 'text-gray-600'} />
            </Button>
          </div>

          {/* Product Info */}
          <div className="p-3">
            {/* Category */}
            {product.category && (
              <p className="text-xs text-blue-600 uppercase tracking-wider mb-1 font-semibold">
                {product.category}
              </p>
            )}

            {/* Name */}
            <h3 className="font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors text-base">
              {product.name}
            </h3>

            {/* Description */}
            {product.description && (
              <p className="text-xs text-gray-600 mb-2 line-clamp-2 leading-relaxed">
                {product.description}
              </p>
            )}

            {/* Rating (Mock) */}
            <div className="flex items-center gap-1 mb-3">
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={12} className="text-yellow-400" fill="currentColor" />
              ))}
              <span className="text-xs text-gray-500 ml-1">(24)</span>
            </div>

            {/* Price */}
            <div className="mb-3">
              <div className="flex items-center gap-1 mb-1">
                <span className="text-lg font-bold text-gray-900">
                  R$ {price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
                {catalogType === 'wholesale' && product.wholesale_price && (
                  <span className="text-xs text-gray-500 line-through">
                    R$ {product.retail_price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                )}
              </div>
              
              {catalogType === 'wholesale' && minQuantity > 1 && (
                <p className="text-xs text-gray-600">
                  Mín. {minQuantity} un.
                </p>
              )}
            </div>

            {/* Add to Cart Button */}
            <Button
              onClick={handleAddToCart}
              disabled={product.stock === 0}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium text-xs py-2 px-2 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed h-9"
            >
              <ShoppingCart size={14} className="mr-1" />
              {product.stock === 0 ? 'Esgotado' : productVariations.length > 0 ? 'Ver Opções' : 'Adicionar'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Product Details Modal */}
      <ProductDetailsModal
        product={product}
        catalogType={catalogType}
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
      />
    </>
  );
});

ProductCard.displayName = 'ProductCard';

export default ProductCard;
