
import React from 'react';
import { X, ShoppingCart, Plus, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useFloatingCart } from '@/hooks/useFloatingCart';
import { useShoppingCart } from '@/hooks/useShoppingCart';

export const FloatingCart: React.FC = () => {
  const { isVisible, hideCart, totalItems, totalPrice } = useFloatingCart();
  const { items, updateQuantity, removeItem } = useShoppingCart();

  if (!isVisible || totalItems === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-white rounded-lg shadow-2xl border max-w-sm w-80">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center space-x-2">
            <ShoppingCart className="h-5 w-5" />
            <span className="font-semibold">Carrinho ({totalItems})</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={hideCart}
            className="p-1"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Items */}
        <div className="max-h-64 overflow-y-auto p-4 space-y-3">
          {items.map((item) => (
            <div key={item.id} className="flex items-center space-x-3">
              <img
                src={item.product.image_url || '/placeholder.svg'}
                alt={item.product.name}
                className="w-12 h-12 object-cover rounded"
              />
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-sm truncate">
                  {item.product.name}
                </h4>
                {item.variation && (
                  <p className="text-xs text-gray-500">
                    {item.variation.color && `${item.variation.color}`}
                    {item.variation.color && item.variation.size && ' • '}
                    {item.variation.size && `${item.variation.size}`}
                  </p>
                )}
                <p className="text-sm font-semibold">
                  R$ {item.price.toFixed(2)}
                </p>
              </div>
              <div className="flex items-center space-x-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => updateQuantity(item.id, Math.max(0, item.quantity - 1))}
                  className="p-1 h-8 w-8"
                >
                  <Minus className="h-3 w-3" />
                </Button>
                <span className="text-sm w-8 text-center">{item.quantity}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                  className="p-1 h-8 w-8"
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-4 border-t">
          <div className="flex justify-between items-center mb-3">
            <span className="font-semibold">Total:</span>
            <span className="font-bold text-lg">
              R$ {totalPrice.toFixed(2)}
            </span>
          </div>
          <Button className="w-full" size="lg">
            Finalizar Compra
          </Button>
        </div>
      </div>
    </div>
  );
};
