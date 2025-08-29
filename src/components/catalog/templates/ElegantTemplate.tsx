
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Heart, ShoppingCart, Eye, Zap, Star, Package, AlertTriangle } from 'lucide-react';
import { Product } from '@/hooks/useProducts';
import { ProductVariation } from '@/types/variation';
import { CatalogType } from '@/hooks/useCatalog';
import { formatPrice } from '@/utils/formatPrice';

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
  onAddToCart: (product: Product, quantity?: number, variation?: ProductVariation) => void;
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
  editorSettings
}) => {
  const [imageError, setImageError] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const hasVariations = product.variations && product.variations.length > 0;
  const currentPrice = catalogType === 'wholesale' && product.wholesale_price 
    ? product.wholesale_price 
    : product.retail_price;

  // Verificar estoque disponível
  const totalStock = hasVariations 
    ? (product.variations?.reduce((sum, v) => sum + (v.stock || 0), 0) || 0)
    : (product.stock || 0);

  const isOutOfStock = totalStock === 0 && !product.allow_negative_stock;
  const isLowStock = totalStock > 0 && totalStock <= 5;

  const handleAddToCart = () => {
    console.log('🛒 ELEGANT TEMPLATE - Tentativa de adicionar ao carrinho:', {
      productId: product.id,
      hasVariations,
      stock: totalStock
    });

    if (hasVariations) {
      onQuickView(product);
    } else {
      onAddToCart(product, 1);
    }
  };

  return (
    <Card 
      className="group overflow-hidden border-0 shadow-md hover:shadow-2xl transition-all duration-500 bg-white rounded-xl"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative aspect-square overflow-hidden rounded-t-xl">
        {/* Imagem do Produto */}
        <img
          src={imageError ? '/placeholder.svg' : (product.image_url || '/placeholder.svg')}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
          onError={() => setImageError(true)}
        />

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />

        {/* Badges Informativos - Top Left */}
        <div className="absolute top-4 left-4 flex flex-col gap-2 z-10">
          {/* Badge de Status */}
          {isOutOfStock && (
            <Badge variant="destructive" className="text-xs font-medium shadow-lg">
              Esgotado
            </Badge>
          )}
          
          {/* Badge de Estoque Baixo */}
          {!isOutOfStock && isLowStock && (
            <Badge className="text-xs font-medium bg-yellow-500 text-white shadow-lg">
              <AlertTriangle className="h-3 w-3 mr-1" />
              Últimas {totalStock}
            </Badge>
          )}

          {/* Badge de Categoria */}
          {product.category && (
            <Badge className="text-xs font-medium bg-white/90 text-gray-800 shadow-lg">
              {product.category}
            </Badge>
          )}

          {/* Badge de Tipo de Catálogo */}
          {catalogType === 'wholesale' && (
            <Badge className="text-xs font-medium bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg">
              <Star className="h-3 w-3 mr-1" />
              Atacado
            </Badge>
          )}

          {/* Badge de Destaque */}
          {product.featured && (
            <Badge className="text-xs font-medium bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg">
              <Star className="h-3 w-3 mr-1" />
              Destaque
            </Badge>
          )}

          {/* Badge de Atacado Disponível */}
          {product.wholesale_price && catalogType === 'retail' && (
            <Badge className="text-xs font-medium bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg">
              <Zap className="h-3 w-3 mr-1" />
              Atacado Disponível
            </Badge>
          )}

          {/* Badge de Variações */}
          {hasVariations && product.variations && product.variations.length > 1 && (
            <Badge className="text-xs font-medium bg-white/90 text-gray-700 shadow-lg">
              +{product.variations.length} opções
            </Badge>
          )}
        </div>

        {/* Badges de Ação - Bottom Right */}
        <div className={`absolute bottom-4 right-4 flex gap-2 transition-all duration-300 ${
          isHovered ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-2'
        }`}>
          <Button
            size="sm"
            className="h-10 w-10 p-0 bg-white/95 hover:bg-white shadow-lg backdrop-blur-sm border-0 rounded-full"
            onClick={(e) => {
              e.stopPropagation();
              onAddToWishlist(product);
            }}
          >
            <Heart 
              className={`h-4 w-4 ${isInWishlist ? 'fill-red-500 text-red-500' : 'text-gray-700'}`} 
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
      </div>

      <CardContent className="p-6">
        {/* Nome e Categoria */}
        <div className="space-y-2 mb-4">
          <h3 className="font-semibold text-lg text-gray-900 line-clamp-2 group-hover:text-amber-600 transition-colors duration-300">
            {product.name}
          </h3>
          {product.description && (
            <p className="text-sm text-gray-500">{product.description}</p>
          )}
        </div>

        {/* Preços */}
        {showPrices && (
          <div className="mb-4">
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold text-gray-900">
                {formatPrice(currentPrice)}
              </span>
              {catalogType === 'wholesale' && product.min_wholesale_qty && (
                <span className="text-xs text-amber-600 font-medium">
                  Mín: {product.min_wholesale_qty}
                </span>
              )}
            </div>
            
            {catalogType === 'retail' && product.wholesale_price && (
              <div className="mt-2 p-2 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                <p className="text-sm text-green-700 font-semibold">
                  Atacado: {formatPrice(product.wholesale_price)}
                  {product.min_wholesale_qty && (
                    <span className="text-green-600 ml-1">(mín: {product.min_wholesale_qty})</span>
                  )}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Estoque */}
        {showStock && (
          <div className="mb-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 font-medium">Disponível:</span>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${
                  totalStock > 10 ? 'bg-green-500' : 
                  totalStock > 0 ? 'bg-yellow-500' : 'bg-red-500'
                }`} />
                <span className={`font-semibold ${
                  totalStock > 10 ? 'text-green-600' : 
                  totalStock > 0 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {totalStock} unidades
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Variações Preview */}
        {hasVariations && (
          <div className="mb-4">
            <p className="text-sm text-gray-600 font-medium mb-2">Opções disponíveis:</p>
            <div className="flex flex-wrap gap-2">
              {product.variations?.slice(0, 4).map((variation, index) => (
                <div
                  key={variation.id || index}
                  className="text-xs px-3 py-1 bg-gradient-to-r from-gray-100 to-gray-50 border border-gray-200 rounded-full text-gray-700 font-medium"
                >
                  {variation.color && variation.size 
                    ? `${variation.color} • ${variation.size}`
                    : variation.color || variation.size || 'Variação'
                  }
                </div>
              ))}
              {product.variations && product.variations.length > 4 && (
                <div className="text-xs px-3 py-1 bg-amber-100 border border-amber-200 rounded-full text-amber-700 font-medium">
                  +{product.variations.length - 4} opções
                </div>
              )}
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
          {hasVariations ? 'Ver Todas as Opções' : isOutOfStock ? 'Produto Esgotado' : 'Adicionar ao Carrinho'}
        </Button>
      </CardContent>
    </Card>
  );
};

export default ElegantTemplate;
