
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Heart, ShoppingCart, Eye } from 'lucide-react';
import { Product } from '@/hooks/useProducts';
import { ProductVariation } from '@/types/variation';
import { CatalogType } from '@/hooks/useCatalog';
import { formatPrice } from '@/utils/formatPrice';
import { useProductDisplayPrice } from '@/hooks/useProductDisplayPrice';
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

  // Usar o hook para cálculo correto de preços
  const priceInfo = useProductDisplayPrice({
    product,
    catalogType,
    quantity: 1,
  });

  // Verificar estoque disponível
  const totalStock = hasVariations 
    ? (product.variations?.reduce((sum, v) => sum + (v.stock || 0), 0) || 0)
    : (product.stock || 0);

  const isOutOfStock = totalStock === 0 && !product.allow_negative_stock;

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

        {/* Badge de Destaque - Top Left */}
        {product.is_featured && (
          <div className="absolute top-2 left-2">
            <Badge className="bg-gradient-to-r from-yellow-500 to-amber-500 text-white text-xs font-medium shadow-sm">
              ✨ DESTAQUE
            </Badge>
          </div>
        )}

        {/* Botões de Ação - Top Right */}
        <div className={`absolute top-2 right-2 flex gap-1 transition-opacity duration-200 ${
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

        {/* Badge de Variações - Bottom Center */}
        {hasVariations && product.variations && product.variations.length > 1 && (
          <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2">
            <Badge variant="outline" className="text-xs bg-white/90 text-gray-700">
              +{product.variations.length} opções
            </Badge>
          </div>
        )}
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
                {formatPrice(priceInfo.displayPrice)}
              </span>
            </div>
            
            {priceInfo.shouldShowWholesaleInfo && 
             priceInfo.shouldShowRetailPrice && 
             !priceInfo.isWholesaleOnly && 
             priceInfo.retailPrice !== priceInfo.wholesalePrice && (
              <p className="text-sm text-green-600 mt-1">
                Atacado: {formatPrice(priceInfo.wholesalePrice || 0)}
              </p>
            )}
          </div>
        )}

        {/* Estoque - apenas se showStock for true */}
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
