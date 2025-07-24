
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Product } from '@/types/product';
import { CatalogType } from './CatalogExample';
import { Heart, ShoppingCart, X } from 'lucide-react';

interface QuickViewModalProps {
  product: Product;
  catalogType: CatalogType;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (product: Product) => void;
  onAddToWishlist: (product: Product) => void;
  isInWishlist: boolean;
}

const QuickViewModal: React.FC<QuickViewModalProps> = ({
  product,
  catalogType,
  isOpen,
  onClose,
  onAddToCart,
  onAddToWishlist,
  isInWishlist
}) => {
  const price = catalogType === 'wholesale' ? product.wholesale_price : product.retail_price;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            {product.name}
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
            <div>
              <h3 className="text-xl font-semibold">{product.name}</h3>
              {product.description && (
                <p className="text-gray-600 mt-2">{product.description}</p>
              )}
            </div>

            <div>
              <span className="text-2xl font-bold text-primary">
                R$ {price?.toFixed(2)}
              </span>
              {catalogType === 'wholesale' && product.min_wholesale_qty && (
                <p className="text-sm text-gray-500 mt-1">
                  Mínimo: {product.min_wholesale_qty} unidades
                </p>
              )}
            </div>

            <div>
              <span className="text-sm text-gray-500">
                {product.stock > 0 ? `${product.stock} disponíveis` : 'Indisponível'}
              </span>
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
