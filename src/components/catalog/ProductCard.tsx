
import React from 'react';
import { Product } from '@/types/product';
import { CatalogType } from './CatalogExample';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Heart, Eye } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  catalogType: CatalogType;
  onAddToCart: () => void;
  onAddToWishlist: () => void;
  onQuickView: () => void;
  isInWishlist: boolean;
  showPrices?: boolean;
  showStock?: boolean;
}

const ProductCard: React.FC<ProductCardProps> = ({
  product,
  catalogType,
  onAddToCart,
  onAddToWishlist,
  onQuickView,
  isInWishlist,
  showPrices = true,
  showStock = true
}) => {
  const price = catalogType === 'wholesale' ? product.wholesale_price : product.retail_price;

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
      <div className="relative aspect-square bg-gray-100">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <span>Sem imagem</span>
          </div>
        )}

        <div className="absolute top-2 right-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onAddToWishlist}
            className="h-8 w-8 p-0 bg-white/80 hover:bg-white"
          >
            <Heart className={`h-4 w-4 ${isInWishlist ? 'fill-current text-red-500' : ''}`} />
          </Button>
        </div>
      </div>

      <div className="p-4">
        <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
          {product.name}
        </h3>

        {showPrices && (
          <div className="mb-3">
            <span className="text-lg font-bold text-primary">
              R$ {price?.toFixed(2)}
            </span>
            {catalogType === 'wholesale' && product.min_wholesale_qty && (
              <p className="text-xs text-gray-500 mt-1">
                Mín. {product.min_wholesale_qty} unidades
              </p>
            )}
          </div>
        )}

        {showStock && (
          <div className="text-xs text-gray-500 mb-3">
            {product.stock > 0 ? `${product.stock} disponíveis` : 'Indisponível'}
          </div>
        )}

        <div className="flex gap-2">
          <Button
            onClick={onAddToCart}
            disabled={product.stock <= 0}
            size="sm"
            className="flex-1"
          >
            <ShoppingCart className="h-4 w-4 mr-1" />
            Adicionar
          </Button>

          <Button
            variant="outline"
            onClick={onQuickView}
            size="sm"
            className="px-3"
          >
            <Eye className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
