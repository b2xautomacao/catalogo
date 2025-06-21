
import React from 'react';
import { ShoppingCart, Trash2, Plus, Minus, X, TrendingUp, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCart } from '@/hooks/useCart';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import CartItemThumbnail from './checkout/CartItemThumbnail';

interface FloatingCartProps {
  onCheckout?: () => void;
}

const FloatingCart: React.FC<FloatingCartProps> = ({ onCheckout }) => {
  const {
    items,
    totalItems,
    totalAmount,
    removeItem,
    updateQuantity,
    isOpen,
    toggleCart,
    closeCart,
    potentialSavings,
    canGetWholesalePrice,
    itemsToWholesale
  } = useCart();

  const handleCheckout = () => {
    closeCart();
    if (onCheckout) {
      onCheckout();
    }
  };

  if (totalItems === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-20 right-6 z-50">
      <Sheet open={isOpen} onOpenChange={toggleCart}>
        <SheetTrigger asChild>
          <Button
            size="lg"
            className="relative h-16 w-16 rounded-full bg-gradient-to-r from-primary to-accent hover:from-blue-700 hover:to-purple-700 shadow-2xl hover:shadow-xl transition-all duration-300 transform hover:scale-105"
          >
            <ShoppingCart size={24} className="text-white" />
            {totalItems > 0 && (
              <Badge
                variant="destructive"
                className="absolute -top-2 -right-2 h-8 w-8 rounded-full p-0 flex items-center justify-center bg-red-500 text-white font-bold text-sm animate-pulse"
              >
                {totalItems > 99 ? '99+' : totalItems}
              </Badge>
            )}
          </Button>
        </SheetTrigger>

        <SheetContent className="w-full sm:max-w-lg overflow-hidden p-0">
          <div className="flex flex-col h-full">
            <SheetHeader className="px-6 py-4 bg-gradient-to-r from-primary to-accent">
              <SheetTitle className="text-xl font-bold text-white text-center">
                🛒 Carrinho de Compras
              </SheetTitle>
            </SheetHeader>

            {/* Indicadores de Economia */}
            {canGetWholesalePrice && potentialSavings > 0 && (
              <div className="px-6 py-3 bg-gradient-to-r from-orange-50 to-yellow-50 border-b">
                <div className="flex items-center gap-2 text-orange-700">
                  <TrendingUp size={16} />
                  <span className="font-semibold text-sm">Oportunidade de Economia!</span>
                </div>
                <p className="text-xs text-orange-600 mt-1">
                  Adicione +{itemsToWholesale} itens e economize R$ {potentialSavings.toFixed(2)}
                </p>
              </div>
            )}

            <div className="flex-1 overflow-y-auto p-6">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <ShoppingCart size={64} className="text-gray-300 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">
                    Carrinho vazio
                  </h3>
                  <p className="text-gray-500">
                    Adicione produtos ao seu carrinho para continuar
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {items.map((item) => (
                    <div key={item.id} className="bg-white rounded-xl border shadow-sm p-4 hover:shadow-md transition-all">
                      <div className="flex items-start gap-4">
                        <CartItemThumbnail 
                          imageUrl={item.product.image_url}
                          productName={item.product.name}
                          size="md"
                        />
                        
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-gray-900 truncate">
                            {item.product.name}
                          </h4>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {item.catalogType === 'wholesale' ? 'Atacado' : 'Varejo'}
                            </Badge>
                            {item.isWholesalePrice && (
                              <Badge className="text-xs bg-green-100 text-green-700 border-green-300">
                                💰 Preço de Atacado
                              </Badge>
                            )}
                            {item.variations && (
                              <span className="text-xs text-gray-500">
                                {item.variations.size} {item.variations.color}
                              </span>
                            )}
                          </div>

                          {/* Indicador de Economia Individual */}
                          {item.product.wholesale_price && item.product.min_wholesale_qty && item.quantity < item.product.min_wholesale_qty && (
                            <div className="mt-2 p-2 bg-orange-50 rounded border border-orange-200">
                              <div className="flex items-center gap-1 text-xs text-orange-700">
                                <AlertCircle size={12} />
                                <span>Faltam {item.product.min_wholesale_qty - item.quantity} para atacado</span>
                              </div>
                              <p className="text-xs text-orange-600">
                                Economize R$ {((item.originalPrice - item.product.wholesale_price) * item.product.min_wholesale_qty).toFixed(2)}
                              </p>
                            </div>
                          )}
                          
                          <div className="flex items-center justify-between mt-3">
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                className="h-8 w-8 p-0 rounded-full hover:bg-red-50 hover:border-red-300"
                              >
                                <Minus size={12} />
                              </Button>
                              
                              <span className="font-semibold min-w-[2rem] text-center bg-gray-50 px-2 py-1 rounded">
                                {item.quantity}
                              </span>
                              
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                className="h-8 w-8 p-0 rounded-full hover:bg-green-50 hover:border-green-300"
                              >
                                <Plus size={12} />
                              </Button>
                            </div>
                            
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeItem(item.id)}
                              className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0 rounded-full"
                            >
                              <Trash2 size={14} />
                            </Button>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <p className="font-bold text-primary text-lg">
                            R$ {(item.price * item.quantity).toFixed(2)}
                          </p>
                          <p className="text-xs text-gray-500">
                            R$ {item.price.toFixed(2)} cada
                          </p>
                          {item.isWholesalePrice && item.originalPrice && (
                            <p className="text-xs text-green-600 font-medium">
                              Economia: R$ {((item.originalPrice - item.price) * item.quantity).toFixed(2)}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {items.length > 0 && (
              <div className="border-t bg-gradient-to-r from-gray-50 to-gray-100 p-6 space-y-4">
                {/* Resumo de Economia */}
                {potentialSavings > 0 && (
                  <div className="p-3 bg-orange-100 rounded-lg border border-orange-200">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-orange-800">
                        💡 Economia potencial:
                      </span>
                      <span className="font-bold text-orange-800">
                        R$ {potentialSavings.toFixed(2)}
                      </span>
                    </div>
                    <p className="text-xs text-orange-700 mt-1">
                      Adicione mais {itemsToWholesale} itens para ativar preços de atacado
                    </p>
                  </div>
                )}

                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold">Total:</span>
                  <span className="text-2xl font-bold text-primary">
                    R$ {totalAmount.toFixed(2)}
                  </span>
                </div>
                
                <Button
                  onClick={handleCheckout}
                  className="w-full bg-gradient-to-r from-primary to-accent hover:from-blue-700 hover:to-purple-700 text-white font-bold py-4 text-lg rounded-xl shadow-lg transition-all transform hover:scale-105"
                  size="lg"
                >
                  <ShoppingCart className="h-5 w-5 mr-2" />
                  Finalizar Pedido
                </Button>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default FloatingCart;
