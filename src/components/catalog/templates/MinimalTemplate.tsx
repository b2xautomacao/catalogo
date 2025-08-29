
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Heart, ShoppingCart, Eye, Zap, Package, Star, AlertTriangle } from 'lucide-react';
import { Product } from '@/hooks/useProducts';
import { ProductVariation } from '@/types/variation';
import { CatalogType } from '@/hooks/useCatalog';
import { formatPrice } from '@/utils/formatPrice';
import { CatalogSettingsData } from './ModernTemplate';

interface MinimalTemplateProps {
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

const MinimalTemplate: React.FC<MinimalTemplateProps> = ({
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
    console.log('🛒 MINIMAL TEMPLATE - Tentativa de adicionar ao carrinho:', {
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
      className="group overflow-hidden border border-gray-200 hover:border-gray-300 transition-all duration-200 bg-white"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative aspect-square overflow-hidden">
        {/* Imagem do Produto */}
        <img
          src={imageError ? '/placeholder.svg' : (product.image_url || '/placeholder.svg')}
          alt={product.name}
          className="w-full h-full object-cover"
          onError={() => setImageError(true)}
        />

        {/* Badges Informativos - Top Left */}
        <div className="absolute top-2 left-2 flex flex-col gap-1 z-10">
          {/* Badge de Status */}
          {isOutOfStock && (
            <Badge variant="destructive" className="text-xs">
              Esgotado
            </Badge>
          )}
          
          {/* Badge de Estoque Baixo */}
          {!isOutOfStock && isLowStock && (
            <Badge className="text-xs bg-yellow-500 text-white">
              <AlertTriangle className="h-3 w-3 mr-1" />
              Últimas {totalStock}
            </Badge>
          )}

          {/* Badge de Categoria */}
          {product.category && (
            <Badge variant="secondary" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
              {product.category}
            </Badge>
          )}

          {/* Badge de Tipo de Catálogo */}
          {catalogType === 'wholesale' && (
            <Badge className="text-xs bg-gray-800 text-white">
              <Package className="h-3 w-3 mr-1" />
              Atacado
            </Badge>
          )}

          {/* Badge de Destaque */}
          {product.featured && (
            <Badge className="text-xs bg-purple-500 text-white">
              <Star className="h-3 w-3 mr-1" />
              Destaque
            </Badge>
          )}

          {/* Badge de Atacado Disponível */}
          {product.wholesale_price && catalogType === 'retail' && (
            <Badge variant="outline" className="text-xs bg-white/90 border-gray-300">
              <Zap className="h-3 w-3 mr-1" />
              Atacado
            </Badge>
          )}

          {/* Badge de Variações */}
          {hasVariations && product.variations && product.variations.length > 1 && (
            <Badge variant="outline" className="text-xs bg-white/90 text-gray-700">
              +{product.variations.length} opções
            </Badge>
          )}
        </div>

        {/* Badges de Ação - Bottom Right */}
        <div className={`absolute bottom-2 right-2 flex gap-1 transition-opacity duration-200 ${
          isHovered ? 'opacity-100' : 'opacity-0'
        }`}>
          <Button
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0 bg-white/95 hover:bg-white shadow-sm backdrop-blur-sm"
            onClick={(e) => {
              e.stopPropagation();
              onAddToWishlist(product);
            }}
          >
            <Heart 
              className={`h-4 w-4 ${isInWishlist ? 'fill-red-500 text-red-500' : 'text-gray-600'}`} 
            />
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0 bg-white/95 hover:bg-white shadow-sm backdrop-blur-sm"
            onClick={(e) => {
              e.stopPropagation();
              onQuickView(product);
            }}
          >
            <Eye className="h-4 w-4 text-gray-600" />
          </Button>
        </div>
      </div>

      <CardContent className="p-4 space-y-3">
        {/* Nome */}
        <div>
          <h3 className="font-medium text-gray-900 line-clamp-1">
            {product.name}
          </h3>
        </div>

        {/* Preços */}
        {showPrices && (
          <div>
            <div className="flex items-center justify-between">
              <span className="text-lg font-semibold text-gray-900">
                {formatPrice(currentPrice)}
              </span>
            </div>
            
            {catalogType === 'retail' && product.wholesale_price && (
              <p className="text-sm text-green-600 mt-1">
                Atacado: {formatPrice(product.wholesale_price)}
              </p>
            )}
          </div>
        )}

        {/* Estoque */}
        {showStock && (
          <div className="text-sm text-gray-600">
            Estoque: <span className={`font-medium ${
              totalStock > 10 ? 'text-green-600' : 
              totalStock > 0 ? 'text-yellow-600' : 'text-red-600'
            }`}>
              {totalStock}
            </span>
          </div>
        )}

        {/* Variações */}
        {hasVariations && (
          <div className="flex flex-wrap gap-1">
            {product.variations?.slice(0, 3).map((variation, index) => (
              <span
                key={variation.id || index}
                className="text-xs px-2 py-1 bg-gray-50 border rounded text-gray-700"
              >
                {variation.color || variation.size || 'Variação'}
              </span>
            ))}
            {product.variations && product.variations.length > 3 && (
              <span className="text-xs text-gray-500">
                +{product.variations.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Botão */}
        <Button
          className="w-full"
          variant={isOutOfStock ? "outline" : "default"}
          onClick={handleAddToCart}
          disabled={isOutOfStock}
        >
          <ShoppingCart className="h-4 w-4 mr-2" />
          {hasVariations ? 'Ver Opções' : isOutOfStock ? 'Esgotado' : 'Adicionar'}
        </Button>
      </CardContent>
    </Card>
  );
};

export default MinimalTemplate;
