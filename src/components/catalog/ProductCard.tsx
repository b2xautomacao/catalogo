
import React, { useState } from 'react';
import { Product } from '@/types/product';
import { Button } from '@/components/ui/button';
import { Package, Eye, ShoppingCart, TrendingDown } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { useShoppingCart } from '@/hooks/useShoppingCart';
import { ProductVariation } from '@/types/product';
import { useCatalogMode } from '@/hooks/useCatalogMode';
import { useStorePriceModel } from '@/hooks/useStorePriceModel';
import { usePriceCalculation } from '@/hooks/usePriceCalculation';
import { useProductPriceTiers } from '@/hooks/useProductPriceTiers';
import { useAuth } from '@/hooks/useAuth';
import { Badge } from '@/components/ui/badge';

type CatalogType = 'retail' | 'wholesale';

export interface ProductCardProps {
  product: Product;
  catalogType: CatalogType;
  onAddToCart: (product: Product, quantity?: number, variation?: any) => void;
  onViewDetails?: (product: Product) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ 
  product, 
  catalogType, 
  onAddToCart, 
  onViewDetails 
}) => {
  const { addItem } = useShoppingCart();
  const { profile } = useAuth();
  const { calculatePrice } = useCatalogMode(profile?.store_id);
  const { priceModel } = useStorePriceModel(product.store_id);
  const { tiers } = useProductPriceTiers(product.id, {
    wholesale_price: product.wholesale_price,
    min_wholesale_qty: product.min_wholesale_qty,
    retail_price: product.retail_price,
  });
  
  const [quantity] = useState(1);
  const [selectedVariation] = useState<ProductVariation | null>(null);

  const modelKey = priceModel?.price_model || "retail_only";

  // Usar o hook de cálculo de preços para obter informações precisas
  const priceCalculation = usePriceCalculation(product.store_id, {
    product_id: product.id,
    retail_price: product.retail_price,
    wholesale_price: product.wholesale_price,
    min_wholesale_qty: product.min_wholesale_qty,
    quantity: modelKey === "wholesale_only" ? (product.min_wholesale_qty || 1) : quantity,
    price_tiers: product.enable_gradual_wholesale ? tiers : [],
    enable_gradual_wholesale: product.enable_gradual_wholesale,
  });

  const handleAddToCart = () => {
    const minQty = modelKey === "wholesale_only" ? (product.min_wholesale_qty || 1) : quantity;
    onAddToCart(product, minQty, selectedVariation);
  };

  const handleViewDetails = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onViewDetails) onViewDetails(product);
  };

  return (
    <div className="relative flex flex-col rounded-lg border bg-white text-card-foreground shadow-sm hover:shadow-lg transition-shadow">
      <div className="relative aspect-video overflow-hidden rounded-t-lg">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="h-full w-full object-cover transition-all hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="relative flex h-full w-full items-center justify-center bg-muted">
            <Package className="h-6 w-6 text-muted-foreground" />
          </div>
        )}
        
        {/* Price Model Badge */}
        {modelKey === "wholesale_only" && (
          <div className="absolute top-2 left-2">
            <Badge className="bg-orange-500 text-white text-xs">
              Atacado
            </Badge>
          </div>
        )}
        
        {/* Discount Badge */}
        {priceCalculation.percentage > 0 && (
          <div className="absolute top-2 right-2">
            <Badge className="bg-green-500 text-white text-xs flex items-center gap-1">
              <TrendingDown className="h-3 w-3" />
              -{priceCalculation.percentage.toFixed(0)}%
            </Badge>
          </div>
        )}
      </div>
      
      <div className="p-4 space-y-3">
        <div>
          <h3 className="text-sm font-semibold line-clamp-1">{product.name}</h3>
          <p className="text-sm text-muted-foreground line-clamp-1">
            {product.description || "Sem descrição"}
          </p>
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <p className="text-lg font-bold text-primary">
                  {formatCurrency(priceCalculation.price)}
                </p>
                {priceCalculation.percentage > 0 && (
                  <span className="text-xs text-gray-400 line-through">
                    {formatCurrency(product.retail_price)}
                  </span>
                )}
              </div>
              
              {priceCalculation.currentTier.tier_name !== "Varejo" && (
                <p className="text-xs text-gray-600">
                  {priceCalculation.currentTier.tier_name}
                  {modelKey === "wholesale_only" && product.min_wholesale_qty && (
                    <span className="text-orange-600 ml-1">
                      (mín: {product.min_wholesale_qty})
                    </span>
                  )}
                </p>
              )}
            </div>
          </div>
          
          <div className="text-xs text-gray-500">
            {product.stock > 0 ? `${product.stock} em estoque` : 'Sem estoque'}
          </div>
        </div>
        
        <div className="flex gap-2 pt-2">
          {onViewDetails && (
            <Button variant="outline" size="sm" onClick={handleViewDetails} className="flex-1">
              <Eye className="mr-2 h-4 w-4" />
              Ver
            </Button>
          )}
          <Button 
            size="sm" 
            onClick={handleAddToCart}
            disabled={product.stock === 0 && !product.allow_negative_stock}
            className="flex-1"
          >
            <ShoppingCart className="mr-2 h-4 w-4" />
            {modelKey === "wholesale_only" ? 'Atacado' : 'Comprar'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
