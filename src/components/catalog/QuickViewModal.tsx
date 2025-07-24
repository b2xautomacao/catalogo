
import React from 'react';
import { Product } from '@/types/product';
import { CatalogType } from './CatalogExample';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Heart, X } from 'lucide-react';
import ProductPriceDisplay from './ProductPriceDisplay';
import { useProductPriceTiers } from '@/hooks/useProductPriceTiers';

interface QuickViewModalProps {
  product: Product;
  catalogType: CatalogType;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (product: Product) => void;
  onAddToWishlist: (product: Product) => void;
  isInWishlist: boolean;
  storeId?: string;
}

const QuickViewModal: React.FC<QuickViewModalProps> = ({
  product,
  catalogType,
  isOpen,
  onClose,
  onAddToCart,
  onAddToWishlist,
  isInWishlist,
  storeId
}) => {
  const { tiers } = useProductPriceTiers(product.id, {
    wholesale_price: product.wholesale_price,
    min_wholesale_qty: product.min_wholesale_qty,
    retail_price: product.retail_price,
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Visualização Rápida</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
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
          </div>
          
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-900">{product.name}</h2>
            
            {product.description && (
              <p className="text-gray-600">{product.description}</p>
            )}
            
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
              size="lg"
            />
            
            <div className="text-sm text-gray-500">
              {product.stock > 0 ? `${product.stock} disponíveis` : 'Indisponível'}
            </div>
            
            <div className="flex gap-3">
              <Button
                onClick={() => onAddToCart(product)}
                disabled={product.stock <= 0}
                className="flex-1"
              >
                <ShoppingCart className="h-4 w-4 mr-2" />
                Adicionar ao Carrinho
              </Button>
              
              <Button
                variant="outline"
                onClick={() => onAddToWishlist(product)}
                className="px-4"
              >
                <Heart className={`h-4 w-4 ${isInWishlist ? 'fill-current text-red-500' : ''}`} />
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default QuickViewModal;
