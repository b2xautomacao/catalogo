
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Product } from '@/types/product';
import { ShoppingCart } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  onAddToCart?: (product: Product) => void;
  catalogType?: 'retail' | 'wholesale';
  className?: string;
}

const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onAddToCart,
  catalogType = 'retail',
  className = '',
}) => {
  const price = catalogType === 'wholesale' && product.wholesale_price 
    ? product.wholesale_price 
    : product.retail_price;

  const isOutOfStock = product.stock <= 0 && !product.allow_negative_stock;

  return (
    <Card className={`group cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-105 ${className}`}>
      <CardContent className="p-3">
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
              <ShoppingCart className="h-12 w-12 text-gray-400" />
            </div>
          )}
          
          {/* Stock Badge */}
          {isOutOfStock && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <Badge variant="destructive" className="text-xs">
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
        <div className="space-y-1">
          <h3 className="font-medium text-sm leading-tight line-clamp-2">
            {product.name}
          </h3>
          
          {/* Description - More Discrete */}
          {product.description && (
            <p className="text-xs text-muted-foreground/70 line-clamp-1">
              {product.description}
            </p>
          )}
          
          {/* Price */}
          <div className="flex items-center justify-between pt-1">
            <span className="font-semibold text-primary text-sm">
              R$ {price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
            
            {/* Stock indicator */}
            <span className="text-xs text-muted-foreground">
              {product.stock} em estoque
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProductCard;
