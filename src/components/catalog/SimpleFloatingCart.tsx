
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, X, Minus, Plus, Trash2 } from 'lucide-react';
import { useCart } from '@/hooks/useCart';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface SimpleFloatingCartProps {
  onCheckout?: () => void;
  storeId?: string;
}

const SimpleFloatingCart: React.FC<SimpleFloatingCartProps> = ({
  onCheckout,
  storeId
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const { items, totalItems, totalAmount, updateQuantity, removeItem, clearCart } = useCart();

  if (totalItems === 0) return null;

  const handleCheckout = () => {
    if (onCheckout) {
      onCheckout();
    }
    setIsOpen(false);
  };

  return (
    <>
      {/* Floating Cart Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          size="lg"
          onClick={() => setIsOpen(true)}
          className="relative h-14 w-14 rounded-full shadow-lg hover:shadow-xl bg-primary hover:bg-primary/90 transition-all duration-300 hover:scale-110"
        >
          <ShoppingCart className="h-6 w-6 text-white" />
          
          {/* Counter Badge */}
          <Badge className="absolute -top-1 -right-1 h-6 w-6 rounded-full bg-destructive text-white text-xs font-bold flex items-center justify-center p-0 border-2 border-white shadow-md min-w-6">
            {totalItems > 99 ? "99+" : totalItems}
          </Badge>
        </Button>
      </div>

      {/* Cart Modal */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Carrinho ({totalItems} {totalItems === 1 ? 'item' : 'itens'})</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-4">
            {items.map((item) => (
              <Card key={item.id} className="border border-border/50">
                <CardContent className="p-4">
                  <div className="flex gap-3">
                    {/* Product Image */}
                    <div className="flex-shrink-0 w-16 h-16 bg-muted rounded-lg overflow-hidden">
                      {item.product.image_url ? (
                        <img 
                          src={item.product.image_url} 
                          alt={item.product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ShoppingCart className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                    </div>

                    {/* Product Info */}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm line-clamp-2 mb-1">
                        {item.product.name}
                      </h4>
                      
                      {/* Variation Info */}
                      {item.variation && (
                        <p className="text-xs text-muted-foreground mb-1">
                          {item.variation.color} {item.variation.size && `- ${item.variation.size}`}
                        </p>
                      )}

                      {/* Price */}
                      <p className="font-semibold text-primary text-sm">
                        R$ {item.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>

                      {/* Quantity Controls */}
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            disabled={item.quantity <= 1}
                            className="h-6 w-6 p-0"
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="px-2 text-sm font-medium">{item.quantity}</span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="h-6 w-6 p-0"
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeItem(item.id)}
                          className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Cart Footer */}
          <div className="border-t pt-4 space-y-4">
            {/* Total */}
            <div className="flex justify-between items-center text-lg font-semibold">
              <span>Total:</span>
              <span className="text-primary">
                R$ {totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2">
              <Button 
                onClick={handleCheckout}
                className="w-full"
                size="lg"
              >
                Finalizar Pedido
              </Button>
              
              <Button 
                variant="outline" 
                onClick={clearCart}
                className="w-full"
                size="sm"
              >
                Limpar Carrinho
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default SimpleFloatingCart;
