
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Product } from '@/types/product';
import { ShoppingCart, Eye, Heart } from 'lucide-react';

interface EnhancedProductCardProps {
  product: Product;
  onAddToCart?: (product: Product) => void;
  onViewDetails?: (product: Product) => void;
  onToggleFavorite?: (product: Product) => void;
  catalogType?: 'retail' | 'wholesale';
  isFavorite?: boolean;
  className?: string;
}

const EnhancedProductCard: React.FC<EnhancedProductCardProps> = ({
  product,
  onAddToCart,
  onViewDetails,
  onToggleFavorite,
  catalogType = 'retail',
  isFavorite = false,
  className = '',
}) => {
  const price = catalogType === 'wholesale' && product.wholesale_price 
    ? product.wholesale_price 
    : product.retail_price;

  const isOutOfStock = product.stock <= 0 && !product.allow_negative_stock;

  return (
    <Card className={`group cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-[1.02] ${className}`}>
      <CardContent className="p-4">
        {/* Product Image */}
        <div className="relative aspect-square mb-3 overflow-hidden rounded-lg bg-gray-100">
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={product.name}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <ShoppingCart className="h-16 w-16 text-gray-400" />
            </div>
          )}
          
          {/* Overlay Actions */}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={(e) => {
                e.stopPropagation();
                onViewDetails?.(product);
              }}
              className="h-8 w-8 p-0"
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite?.(product);
              }}
              className={`h-8 w-8 p-0 ${isFavorite ? 'text-red-500' : ''}`}
            >
              <Heart className={`h-4 w-4 ${isFavorite ? 'fill-current' : ''}`} />
            </Button>
          </div>
          
          {/* Stock Badge */}
          {isOutOfStock && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <Badge variant="destructive" className="text-sm">
                Esgotado
              </Badge>
            </div>
          )}
          
          {/* Catalog Type Badge */}
          {catalogType === 'wholesale' && (
            <Badge className="absolute top-2 left-2 text-xs bg-orange-500 hover:bg-orange-600">
              Atacado
            </Badge>
          )}
        </div>

        {/* Product Info */}
        <div className="space-y-2">
          <h3 className="font-semibold text-base leading-tight line-clamp-2">
            {product.name}
          </h3>
          
          {/* Description - More Discrete */}
          {product.description && (
            <p className="text-xs text-muted-foreground/70 line-clamp-1">
              {product.description}
            </p>
          )}
          
          {/* Price */}
          <div className="flex items-center justify-between">
            <span className="font-bold text-primary text-lg">
              R$ {price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
            
            {/* Stock indicator */}
            <span className="text-xs text-muted-foreground">
              {product.stock} disponível
            </span>
          </div>
          
          {/* Add to Cart Button */}
          <Button
            onClick={(e) => {
              e.stopPropagation();
              onAddToCart?.(product);
            }}
            disabled={isOutOfStock}
            className="w-full mt-2 transition-all duration-200 hover:scale-105"
            size="sm"
          >
            <ShoppingCart className="h-4 w-4 mr-2" />
            {isOutOfStock ? 'Indisponível' : 'Adicionar'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default EnhancedProductCard;
