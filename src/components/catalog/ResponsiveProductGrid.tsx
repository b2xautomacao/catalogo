
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Heart, ShoppingCart, Eye, Package } from 'lucide-react';
import { Product } from '@/types/product';
import { CatalogType } from '@/hooks/useCatalog';
import ProductCardCarousel from './ProductCardCarousel';

interface ResponsiveProductGridProps {
  products: Product[];
  catalogType: CatalogType;
  loading: boolean;
  onAddToWishlist: (product: Product) => void;
  onQuickView: (product: Product) => void;
  onAddToCart: (product: Product, quantity?: number, variation?: any) => void;
  wishlist: Product[];
  storeIdentifier: string;
  templateName: string;
  showPrices: boolean;
  showStock: boolean;
}

const ResponsiveProductGrid: React.FC<ResponsiveProductGridProps> = ({
  products,
  catalogType,
  loading,
  onAddToWishlist,
  onQuickView,
  onAddToCart,
  wishlist,
  templateName,
  showPrices,
  showStock
}) => {
  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <Card key={index} className="animate-pulse">
            <div className="aspect-square bg-gray-200 rounded-t-lg"></div>
            <CardContent className="p-3">
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-3/4"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Package className="h-16 w-16 text-gray-300 mb-4" />
        <h3 className="text-lg font-semibold text-gray-600 mb-2">
          Nenhum produto encontrado
        </h3>
        <p className="text-gray-500 text-center max-w-md">
          Não encontramos produtos que correspondam aos seus filtros. 
          Tente ajustar os critérios de busca.
        </p>
      </div>
    );
  }

  const getPrice = (product: Product) => {
    if (catalogType === 'wholesale' && product.wholesale_price) {
      return product.wholesale_price;
    }
    return product.retail_price;
  };

  // Função para verificar se produto tem variações
  const hasVariations = (product: Product) => {
    return product.variations && product.variations.length > 0;
  };

  // Função para lidar com clique no botão de adicionar
  const handleAddToCartClick = (product: Product) => {
    if (hasVariations(product)) {
      // Se tem variações, abrir modal de detalhes
      onQuickView(product);
    } else {
      // Se não tem variações, adicionar direto ao carrinho
      onAddToCart(product, 1);
    }
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
      {products.map((product) => {
        const isInWishlist = wishlist.some(item => item.id === product.id);
        const price = getPrice(product);
        const isAvailable = product.stock > 0;
        const productHasVariations = hasVariations(product);

        return (
          <Card key={product.id} className="group overflow-hidden hover:shadow-lg transition-all duration-300 border-border/50 hover:border-primary/20">
            {/* Product Image Carousel */}
            <div className="relative">
              <ProductCardCarousel
                productId={product.id || ''}
                productName={product.name}
                onImageClick={() => onQuickView(product)}
                autoPlay={true}
                autoPlayInterval={4000}
              />

              {/* Badges */}
              <div className="absolute top-2 left-2 flex flex-col gap-1">
                {product.is_featured && (
                  <Badge className="bg-yellow-500 text-white text-xs">
                    Destaque
                  </Badge>
                )}
                {!isAvailable && (
                  <Badge variant="destructive" className="text-xs">
                    Esgotado
                  </Badge>
                )}
                {productHasVariations && (
                  <Badge variant="secondary" className="text-xs">
                    Variações
                  </Badge>
                )}
              </div>

              {/* Action Buttons */}
              <div className="absolute top-2 right-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="secondary"
                  size="sm"
                  className="w-8 h-8 p-0 bg-white/90 backdrop-blur-sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onAddToWishlist(product);
                  }}
                >
                  <Heart 
                    className={`h-4 w-4 ${isInWishlist ? 'fill-red-500 text-red-500' : ''}`} 
                  />
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  className="w-8 h-8 p-0 bg-white/90 backdrop-blur-sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onQuickView(product);
                  }}
                >
                  <Eye className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Card Content */}
            <CardContent className="p-3">
              <h3 className="font-medium text-sm line-clamp-2 mb-1 text-foreground">
                {product.name}
              </h3>

              {product.category && (
                <p className="text-xs text-muted-foreground mb-2">
                  {product.category}
                </p>
              )}

              {/* Price */}
              {showPrices && (
                <div className="mb-2">
                  <div className="font-semibold text-primary">
                    R$ {price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </div>
                  {catalogType === 'wholesale' && product.min_wholesale_qty && (
                    <p className="text-xs text-muted-foreground">
                      Mín: {product.min_wholesale_qty} un.
                    </p>
                  )}
                </div>
              )}

              {/* Stock */}
              {showStock && (
                <p className="text-xs text-muted-foreground mb-2">
                  Estoque: {product.stock} unidades
                </p>
              )}

              {/* Add to Cart Button */}
              <Button
                size="sm"
                className="w-full"
                disabled={!isAvailable}
                onClick={() => handleAddToCartClick(product)}
              >
                <ShoppingCart className="h-4 w-4 mr-1" />
                {productHasVariations 
                  ? 'Ver Opções' 
                  : isAvailable 
                    ? 'Adicionar' 
                    : 'Esgotado'
                }
              </Button>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default ResponsiveProductGrid;
