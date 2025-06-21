
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useEditorStore } from '../stores/useEditorStore';
import { ShoppingCart, Clock, Users, Star, Truck, Shield } from 'lucide-react';

export const CheckoutPreview: React.FC = () => {
  const { configuration } = useEditorStore();
  const [cartItems] = useState([
    { id: 1, name: 'Produto de Exemplo', price: 99.90, quantity: 2, image: '/placeholder.svg' },
    { id: 2, name: 'Produto Relacionado', price: 49.90, quantity: 1, image: '/placeholder.svg' }
  ]);

  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const shipping = subtotal > 150 ? 0 : 15.90;
  const total = subtotal + shipping;

  const globalStyles = {
    '--checkout-primary': configuration.checkout.colors.primary,
    '--checkout-secondary': configuration.checkout.colors.secondary,
    '--checkout-accent': configuration.checkout.colors.accent,
    '--checkout-bg': configuration.checkout.colors.background,
    '--checkout-text': configuration.checkout.colors.text,
  } as React.CSSProperties;

  return (
    <div className="max-w-2xl mx-auto p-4" style={globalStyles}>
      <style>
        {`
          .checkout-preview {
            color: var(--checkout-text, #1E293B);
          }
          
          .checkout-btn-primary {
            background-color: var(--checkout-primary, #0057FF);
            color: white;
            border: none;
          }
          
          .checkout-btn-primary:hover {
            opacity: 0.9;
          }
          
          .checkout-accent {
            color: var(--checkout-accent, #8E2DE2);
          }
        `}
      </style>

      <div className="checkout-preview space-y-6">
        {/* Header do Checkout */}
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">🛒 Finalizar Pedido</h2>
          {configuration.checkout.urgency?.offerTimer && (
            <div className="flex items-center justify-center gap-2 text-orange-600 mb-4">
              <Clock className="w-4 h-4" />
              <span className="text-sm font-medium">Oferta expira em: 14:32</span>
            </div>
          )}
        </div>

        {/* Itens do Carrinho */}
        {configuration.checkout.showCartItems && (
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold mb-3">Seus Produtos</h3>
              <div className="space-y-3">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gray-200 rounded" />
                    <div className="flex-1">
                      <h4 className="text-sm font-medium">{item.name}</h4>
                      <p className="text-sm text-gray-600">Qtd: {item.quantity}</p>
                      {configuration.checkout.urgency?.lowStockCounter && item.id === 1 && (
                        <Badge variant="destructive" className="text-xs">
                          Restam apenas 3 unidades
                        </Badge>
                      )}
                    </div>
                    <span className="font-medium">R$ {(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Upsells */}
        {configuration.checkout.upsells?.showRelated && (
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="p-4">
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <ShoppingCart className="w-4 h-4" />
                Complete sua compra
              </h3>
              <p className="text-sm text-gray-600 mb-3">
                {configuration.checkout.upsells?.customMessage || 
                 "Clientes que compraram estes produtos também gostaram de:"}
              </p>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-white rounded border">
                  <div className="w-full h-20 bg-gray-200 rounded mb-2" />
                  <h4 className="text-sm font-medium">Produto Adicional</h4>
                  <p className="text-green-600 font-medium">R$ 29,90</p>
                  <Button size="sm" className="w-full mt-2 checkout-btn-primary">
                    Adicionar
                  </Button>
                </div>
                <div className="p-3 bg-white rounded border">
                  <div className="w-full h-20 bg-gray-200 rounded mb-2" />
                  <h4 className="text-sm font-medium">Acessório</h4>
                  <p className="text-green-600 font-medium">R$ 19,90</p>
                  <Button size="sm" className="w-full mt-2 checkout-btn-primary">
                    Adicionar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Resumo do Pedido */}
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold mb-3">Resumo do Pedido</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>R$ {subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Frete:</span>
                <span className={shipping === 0 ? 'text-green-600 font-medium' : ''}>
                  {shipping === 0 ? 'GRÁTIS' : `R$ ${shipping.toFixed(2)}`}
                </span>
              </div>
              {shipping > 0 && configuration.checkout.upsells?.freeShippingThreshold && (
                <div className="text-sm text-blue-600 bg-blue-50 p-2 rounded">
                  Adicione mais R$ {(150 - subtotal).toFixed(2)} e ganhe frete grátis!
                </div>
              )}
              <div className="border-t pt-2 flex justify-between font-bold text-lg">
                <span>Total:</span>
                <span className="checkout-accent">R$ {total.toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Dados do Cliente */}
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold mb-3">Dados para Entrega</h3>
            <div className="grid grid-cols-2 gap-3">
              <Input placeholder="Nome completo" />
              <Input placeholder="WhatsApp" />
              <Input placeholder="CEP" />
              <Input placeholder="Endereço" />
            </div>
          </CardContent>
        </Card>

        {/* Selos de Segurança */}
        {configuration.checkout.showSecurityBadges && (
          <div className="flex items-center justify-center gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <Shield className="w-4 h-4" />
              <span>Compra Segura</span>
            </div>
            <div className="flex items-center gap-1">
              <Truck className="w-4 h-4" />
              <span>Entrega Garantida</span>
            </div>
          </div>
        )}

        {/* Prova Social */}
        {configuration.checkout.socialProof?.recentSales && (
          <div className="text-center text-sm text-gray-600">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Users className="w-4 h-4" />
              <span>
                {configuration.checkout.socialProof?.salesMessage || 
                 "23 pessoas compraram este produto hoje"}
              </span>
            </div>
            {configuration.checkout.socialProof?.showReviews && (
              <div className="flex items-center justify-center gap-1">
                <div className="flex text-yellow-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3 h-3 fill-current" />
                  ))}
                </div>
                <span>4.8 (127 avaliações)</span>
              </div>
            )}
          </div>
        )}

        {/* Botões de Finalização */}
        <div className="space-y-3">
          {(configuration.checkout.type === 'both' || configuration.checkout.type === 'online') && (
            <Button className="w-full checkout-btn-primary py-3 text-lg">
              Finalizar Compra Online
            </Button>
          )}
          
          {(configuration.checkout.type === 'both' || configuration.checkout.type === 'whatsapp') && (
            <Button variant="outline" className="w-full py-3 text-lg">
              Continuar pelo WhatsApp
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
