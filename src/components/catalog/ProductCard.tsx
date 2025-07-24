import React, { useState } from 'react';
import { Product } from '@/types/product';
import { Button } from '@/components/ui/button';
import { Package, Eye, ShoppingCart } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { useShoppingCart } from '@/hooks/useShoppingCart';
import { ProductVariation } from '@/types/product';
import { useCatalogMode } from '@/hooks/useCatalogMode';
import { useAuth } from '@/hooks/useAuth';
import { Link } from 'react-router-dom';
import { ROUTES } from '@/constants';

type CatalogType = 'retail' | 'wholesale';

export interface ProductCardProps {
  product: Product;
  catalogType: CatalogType;
  onAddToCart: (product: Product, quantity?: number, variation?: any) => void;
  onViewDetails?: (product: Product) => void; // Adicionar esta propriedade
}

const ProductCard: React.FC<ProductCardProps> = ({ product, catalogType, onAddToCart, onViewDetails }) => {
  const { addItem } = useShoppingCart();
  const { profile } = useAuth();
  const { calculatePrice } = useCatalogMode(profile?.store_id);
  const [quantity, setQuantity] = useState(1);
  const [selectedVariation, setSelectedVariation] = useState<ProductVariation | null>(null);

  const handleAddToCart = () => {
    onAddToCart(product, quantity, selectedVariation);
  };

  const price = calculatePrice(product, quantity);

  return (
    <div className="relative flex flex-col rounded-lg border bg-white text-card-foreground shadow-sm data-[state=open]:bg-accent data-[state=open]:text-accent-foreground">
      <div className="aspect-video overflow-hidden rounded-t-lg">
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
      </div>
      <div className="p-4">
        <h3 className="text-sm font-semibold line-clamp-1">{product.name}</h3>
        <p className="text-sm text-muted-foreground line-clamp-1">
          {product.description || "Sem descrição"}
        </p>
        <div className="mt-2 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-lg font-bold">{formatCurrency(price)}</p>
            {catalogType === 'wholesale' && product.wholesale_price && (
              <p className="text-xs text-muted-foreground">
                Preço de atacado
              </p>
            )}
          </div>
          <div className="flex gap-2">
            {onViewDetails && (
              <Button variant="outline" size="sm" onClick={() => onViewDetails(product)}>
                <Eye className="mr-2 h-4 w-4" />
                Ver
              </Button>
            )}
            <Button size="sm" onClick={handleAddToCart}>
              <ShoppingCart className="mr-2 h-4 w-4" />
              Comprar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
