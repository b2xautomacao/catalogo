
import React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { CartItem } from '@/hooks/useCart';
import CartItemThumbnail from './CartItemThumbnail';
import { Badge } from '@/components/ui/badge';

interface OrderSummaryProps {
  items: CartItem[];
  totalAmount: number;
  shippingCost: number;
  finalTotal: number;
  isProcessing: boolean;
  isDisabled: boolean;
  onSubmit: () => void;
  isMobile?: boolean;
}

const OrderSummary: React.FC<OrderSummaryProps> = ({
  items,
  totalAmount,
  shippingCost,
  finalTotal,
  isProcessing,
  isDisabled,
  onSubmit,
  isMobile = false
}) => {
  return (
    <div className={`h-full flex flex-col ${isMobile ? 'max-h-80' : ''}`}>
      <div className={`${isMobile ? 'bg-primary text-white p-3' : 'bg-gradient-to-r from-primary to-accent text-white p-4'} shrink-0`}>
        <h3 className={`${isMobile ? 'text-lg' : 'text-xl'} font-bold text-center`}>
          Resumo do Pedido
        </h3>
      </div>

      <div className={`flex-1 ${isMobile ? 'min-h-0' : 'overflow-hidden'}`}>
        <ScrollArea className="h-full">
          <div className={`${isMobile ? 'p-3 space-y-2' : 'p-4 space-y-3'}`}>
            {items.map((item) => (
              <div key={item.id} className={`flex items-start gap-3 ${isMobile ? 'text-xs' : 'text-sm'} bg-white p-3 rounded-lg border`}>
                <div className="w-12 h-12 flex-shrink-0 flex items-center justify-center">
                  <CartItemThumbnail
                    imageUrl={item.variation?.image_url || item.product?.image_url}
                    productName={item.product?.name || "Produto"}
                    size="sm"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 truncate">{item.product.name}</p>

                  {item.gradeInfo && (
                    <div className="flex flex-col gap-1 mt-1">
                      <span className="inline-block mt-0.5">
                        <Badge className="bg-blue-600 font-semibold text-white px-1.5 py-0 text-[10px]">
                          Grade: {item.gradeInfo.name}
                        </Badge>
                      </span>
                      {item.gradeInfo.sizes && item.gradeInfo.sizes.length > 0 && (
                        <span className="text-[10px] text-gray-500">
                          Tamanhos: {item.gradeInfo.sizes.join(", ")}
                        </span>
                      )}
                    </div>
                  )}

                  {item.variation && (
                    <p className="text-xs text-gray-500 truncate mt-0.5 font-medium">
                      {[item.variation.color, item.variation.size].filter(Boolean).join(" - ")}
                    </p>
                  )}

                  <p className="text-gray-600 mt-1">
                    {item.quantity}x R$ {item.price.toFixed(2)}
                  </p>
                </div>
                <p className={`font-bold text-primary flex-shrink-0 ml-2 ${isMobile ? 'text-xs' : 'text-sm'}`}>
                  R$ {(item.price * item.quantity).toFixed(2)}
                </p>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      <div className={`shrink-0 bg-white border-t ${isMobile ? 'p-3 space-y-3' : 'p-4 space-y-4'}`}>
        <div className="space-y-3">
          <div className={`flex justify-between ${isMobile ? 'text-base' : 'text-lg'}`}>
            <span className="font-medium">Subtotal:</span>
            <span className="font-bold">R$ {totalAmount.toFixed(2)}</span>
          </div>

          {shippingCost > 0 && (
            <div className={`flex justify-between ${isMobile ? 'text-base' : 'text-lg'}`}>
              <span className="font-medium">Frete:</span>
              <span className="font-bold text-blue-600">R$ {shippingCost.toFixed(2)}</span>
            </div>
          )}

          <div className={`flex justify-between ${isMobile ? 'text-lg' : 'text-xl'} font-bold border-t pt-3`}>
            <span>Total:</span>
            <span className="text-primary">R$ {finalTotal.toFixed(2)}</span>
          </div>
        </div>

        <Button
          onClick={onSubmit}
          disabled={isDisabled}
          className={`w-full bg-gradient-to-r from-primary to-accent hover:from-blue-700 hover:to-purple-700 text-white font-bold ${isMobile ? 'py-3 text-base' : 'py-3 text-lg'} rounded-xl shadow-lg transition-all`}
          size="lg"
        >
          {isProcessing ? 'Processando...' : 'Finalizar Pedido'}
        </Button>
      </div>
    </div>
  );
};

export default OrderSummary;
