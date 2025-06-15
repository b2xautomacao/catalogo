
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageCircle, CheckCircle, ShoppingBag, ArrowRight } from 'lucide-react';
import CartItemThumbnail from './CartItemThumbnail';
import OrderPreviewCard from './OrderPreviewCard';
import { CartItem } from '@/hooks/useCart';

interface EnhancedWhatsAppCheckoutProps {
  whatsappNumber: string;
  onConfirmOrder: () => void;
  isProcessing: boolean;
  customerData: {
    name: string;
    phone: string;
    email?: string;
  };
  items: CartItem[];
  totalAmount: number;
  shippingCost?: number;
  notes?: string;
}

const EnhancedWhatsAppCheckout: React.FC<EnhancedWhatsAppCheckoutProps> = ({
  whatsappNumber,
  onConfirmOrder,
  isProcessing,
  customerData,
  items,
  totalAmount,
  shippingCost = 0,
  notes
}) => {
  const [showPreview, setShowPreview] = useState(false);
  const finalTotal = totalAmount + shippingCost;

  const orderData = {
    customer_name: customerData.name,
    customer_phone: customerData.phone,
    customer_email: customerData.email,
    total_amount: finalTotal,
    items: items.map(item => ({
      name: item.product.name,
      quantity: item.quantity,
      price: item.price,
      variation: item.variations ? 
        `${item.variations.size || ''} ${item.variations.color || ''}`.trim() : 
        undefined
    })),
    shipping_method: 'pickup',
    shipping_cost: shippingCost,
    notes: notes
  };

  const canConfirm = customerData.name.length >= 2 && 
                    /^\(?\d{2}\)?[\s-]?\d{4,5}-?\d{4}$/.test(customerData.phone);

  return (
    <div className="space-y-6">
      <Card className="shadow-lg border-0 bg-gradient-to-br from-blue-50 to-indigo-50">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-3 text-lg text-blue-800">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 flex items-center justify-center">
              <span className="text-white font-bold">2</span>
            </div>
            Finalizar Pedido
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Como funciona */}
          <div className="bg-white p-4 rounded-xl border border-blue-200 shadow-sm">
            <h4 className="font-semibold text-blue-800 mb-4 flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Como funciona:
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-blue-600 font-bold text-sm">1</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-blue-800">Criar Pedido</p>
                  <p className="text-xs text-gray-600">Seu pedido será registrado</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-blue-600 font-bold text-sm">2</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-blue-800">Enviar WhatsApp</p>
                  <p className="text-xs text-gray-600">Mensagem enviada automaticamente</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-blue-600 font-bold text-sm">3</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-blue-800">Confirmar</p>
                  <p className="text-xs text-gray-600">A loja entrará em contato</p>
                </div>
              </div>
            </div>
          </div>

          {/* Resumo visual dos itens */}
          <div className="bg-white p-4 rounded-xl border border-blue-200 shadow-sm">
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <ShoppingBag className="h-5 w-5 text-blue-600" />
              Seus Itens ({items.length}):
            </h4>
            <div className="space-y-3 max-h-32 overflow-y-auto">
              {items.map((item) => (
                <div key={item.id} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                  <CartItemThumbnail 
                    imageUrl={item.product.image_url}
                    productName={item.product.name}
                    size="sm"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.product.name}</p>
                    <p className="text-xs text-gray-600">
                      {item.quantity}x R$ {item.price.toFixed(2)}
                    </p>
                    {item.variations && (
                      <p className="text-xs text-gray-500">
                        {item.variations.size} {item.variations.color}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-blue-600">
                      R$ {(item.price * item.quantity).toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Total */}
          <div className="bg-white p-4 rounded-xl border border-blue-200 shadow-sm">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Subtotal:</span>
                <span>R$ {totalAmount.toFixed(2)}</span>
              </div>
              {shippingCost > 0 && (
                <div className="flex justify-between text-sm">
                  <span>Frete:</span>
                  <span>R$ {shippingCost.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold text-blue-800 pt-2 border-t">
                <span>Total:</span>
                <span>R$ {finalTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Botões de ação */}
          <div className="space-y-3">
            <Button
              variant="outline"
              onClick={() => setShowPreview(!showPreview)}
              className="w-full bg-white hover:bg-blue-50 border-blue-300 text-blue-700"
            >
              {showPreview ? 'Ocultar' : 'Ver'} Preview da Mensagem
            </Button>

            <Button
              onClick={onConfirmOrder}
              disabled={isProcessing || !canConfirm}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-4 text-lg rounded-xl shadow-lg transition-all"
              size="lg"
            >
              {isProcessing ? (
                <>Criando pedido...</>
              ) : (
                <>
                  <MessageCircle className="h-5 w-5 mr-2" />
                  Confirmar Pedido
                  <ArrowRight className="h-5 w-5 ml-2" />
                </>
              )}
            </Button>

            {!canConfirm && (
              <p className="text-xs text-center text-red-600">
                Complete seus dados acima para continuar
              </p>
            )}
          </div>

          <p className="text-xs text-center text-gray-600">
            🔒 Ao confirmar, você será redirecionado para o WhatsApp da loja
          </p>
        </CardContent>
      </Card>

      {/* Preview da mensagem */}
      {showPreview && (
        <div className="animate-fade-in">
          <OrderPreviewCard orderData={orderData} />
        </div>
      )}
    </div>
  );
};

export default EnhancedWhatsAppCheckout;
