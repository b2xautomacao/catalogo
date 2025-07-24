
import React from 'react';
import { Product } from '@/types/product';
import { CatalogType } from './CatalogExample';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, Heart, Eye, Package, TrendingDown } from 'lucide-react';
import ProductPriceDisplay from './ProductPriceDisplay';
import { useProductPriceTiers } from '@/hooks/useProductPriceTiers';

interface ProductCardProps {
  product: Product;
  catalogType: CatalogType;
  onAddToCart: () => void;
  onAddToWishlist: () => void;
  onQuickView: () => void;
  isInWishlist: boolean;
  showPrices?: boolean;
  showStock?: boolean;
  storeId?: string;
  className?: string;
  imageClassName?: string;
  contentClassName?: string;
}

const ProductCard: React.FC<ProductCardProps> = ({
  product,
  catalogType,
  onAddToCart,
  onAddToWishlist,
  onQuickView,
  isInWishlist,
  showPrices = true,
  showStock = true,
  storeId,
  className = "",
  imageClassName = "",
  contentClassName = ""
}) => {
  const { tiers } = useProductPriceTiers(product.id, {
    wholesale_price: product.wholesale_price,
    min_wholesale_qty: product.min_wholesale_qty,
    retail_price: product.retail_price,
  });

  // Calcular economia se houver preço de atacado
  const hasWholesalePrice = product.wholesale_price && product.wholesale_price < product.retail_price;
  const savingsPercentage = hasWholesalePrice 
    ? Math.round(((product.retail_price - product.wholesale_price) / product.retail_price) * 100)
    : 0;

  return (
    <div className={`group relative bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden ${className}`}>
      {/* Container da imagem */}
      <div className={`relative aspect-square bg-gray-50 overflow-hidden ${imageClassName}`}>
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <Package className="h-12 w-12" />
          </div>
        )}

        {/* Badges promocionais no topo esquerdo */}
        <div className="absolute top-3 left-3 flex flex-col gap-1">
          {product.is_featured && (
            <Badge className="bg-orange-500 hover:bg-orange-600 text-white text-xs font-medium px-2 py-1">
              Destaque
            </Badge>
          )}
          {catalogType === 'wholesale' && (
            <Badge className="bg-blue-500 hover:bg-blue-600 text-white text-xs font-medium px-2 py-1">
              Atacado
            </Badge>
          )}
          {savingsPercentage > 0 && (
            <Badge className="bg-green-500 hover:bg-green-600 text-white text-xs font-medium px-2 py-1 flex items-center gap-1">
              <TrendingDown className="h-3 w-3" />
              -{savingsPercentage}%
            </Badge>
          )}
        </div>

        {/* Badge de estoque no canto inferior esquerdo */}
        {product.stock === 0 && (
          <div className="absolute bottom-3 left-3">
            <Badge variant="destructive" className="text-xs font-medium">
              Sem estoque
            </Badge>
          </div>
        )}

        {/* Botão de favorito no topo direito */}
        <div className="absolute top-3 right-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={onAddToWishlist}
            className="h-8 w-8 p-0 bg-white/90 hover:bg-white shadow-sm"
          >
            <Heart className={`h-4 w-4 ${isInWishlist ? 'fill-current text-red-500' : 'text-gray-600'}`} />
          </Button>
        </div>
      </div>

      {/* Conteúdo do card */}
      <div className={`p-5 ${contentClassName}`}>
        <h3 className="font-semibold text-gray-900 mb-3 line-clamp-2 text-lg leading-snug">
          {product.name}
        </h3>

        {product.description && (
          <p className="text-sm text-gray-600 mb-4 line-clamp-2 leading-relaxed">
            {product.description}
          </p>
        )}

        {showPrices && (
          <div className="mb-4">
            <ProductPriceDisplay
              storeId={storeId || product.store_id || ''}
              productId={product.id}
              retailPrice={product.retail_price}
              wholesalePrice={product.wholesale_price}
              minWholesaleQty={product.min_wholesale_qty}
              quantity={1}
              priceTiers={tiers}
              catalogType={catalogType}
              showSavings={true}
              showNextTierHint={true}
              showTierName={true}
              size="md"
            />
          </div>
        )}

        {showStock && (
          <div className="text-sm text-gray-500 mb-4">
            {product.stock > 0 ? (
              <span className="text-green-600 font-medium">{product.stock} em estoque</span>
            ) : (
              <span className="text-red-600 font-medium">Indisponível</span>
            )}
          </div>
        )}

        {/* Botões de ação */}
        <div className="flex gap-2">
          <Button
            onClick={onAddToCart}
            disabled={product.stock <= 0}
            className="flex-1 bg-primary hover:bg-primary/90 text-white font-medium py-2.5"
          >
            <ShoppingCart className="h-4 w-4 mr-2" />
            {catalogType === 'wholesale' ? 'Atacado' : 'Adicionar'}
          </Button>

          <Button
            variant="outline"
            onClick={onQuickView}
            className="px-4 py-2.5 border-gray-300 hover:bg-gray-50"
          >
            <Eye className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
