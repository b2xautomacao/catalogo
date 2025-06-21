
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useEditorStore } from '../stores/useEditorStore';
import { ShoppingCart, Gift, Zap, Users } from 'lucide-react';

export const CheckoutEditorPanel: React.FC = () => {
  const { configuration, updateConfiguration } = useEditorStore();

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Editor de Checkout</h3>
        <p className="text-sm text-gray-600">
          Configure experiência de compra e estratégias de conversão
        </p>
      </div>

      <Tabs defaultValue="layout" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="layout">Layout</TabsTrigger>
          <TabsTrigger value="upsells">Upsells</TabsTrigger>
          <TabsTrigger value="urgency">Urgência</TabsTrigger>
          <TabsTrigger value="social">Social Proof</TabsTrigger>
        </TabsList>

        <TabsContent value="layout" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5" />
                Layout do Checkout
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Checkout em etapas</Label>
                <Switch
                  checked={configuration.checkout.layout === 'steps'}
                  onCheckedChange={(checked) =>
                    updateConfiguration('checkout.layout', checked ? 'steps' : 'single')
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <Label>Mostrar itens do carrinho</Label>
                <Switch
                  checked={configuration.checkout.showCartItems}
                  onCheckedChange={(checked) =>
                    updateConfiguration('checkout.showCartItems', checked)
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <Label>Selos de segurança</Label>
                <Switch
                  checked={configuration.checkout.showSecurityBadges}
                  onCheckedChange={(checked) =>
                    updateConfiguration('checkout.showSecurityBadges', checked)
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Tipo de finalização</Label>
                <Select
                  value={configuration.checkout.type || 'both'}
                  onValueChange={(value) => updateConfiguration('checkout.type', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="whatsapp">Apenas WhatsApp</SelectItem>
                    <SelectItem value="online">Apenas Online</SelectItem>
                    <SelectItem value="both">Ambos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="upsells" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gift className="w-5 h-5" />
                Upsells e Cross-sells
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Mostrar produtos relacionados</Label>
                <Switch
                  checked={configuration.checkout.upsells?.showRelated || false}
                  onCheckedChange={(checked) =>
                    updateConfiguration('checkout.upsells.showRelated', checked)
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <Label>Ofertas por valor mínimo</Label>
                <Switch
                  checked={configuration.checkout.upsells?.minimumValueOffers || false}
                  onCheckedChange={(checked) =>
                    updateConfiguration('checkout.upsells.minimumValueOffers', checked)
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Valor mínimo para frete grátis</Label>
                <Input
                  type="number"
                  placeholder="150.00"
                  value={configuration.checkout.upsells?.freeShippingThreshold || ''}
                  onChange={(e) =>
                    updateConfiguration('checkout.upsells.freeShippingThreshold', e.target.value)
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Mensagem de upsell personalizada</Label>
                <Textarea
                  placeholder="Complete sua compra com estes produtos selecionados..."
                  value={configuration.checkout.upsells?.customMessage || ''}
                  onChange={(e) =>
                    updateConfiguration('checkout.upsells.customMessage', e.target.value)
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="urgency" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5" />
                Elementos de Urgência
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Contador de estoque baixo</Label>
                <Switch
                  checked={configuration.checkout.urgency?.lowStockCounter || false}
                  onCheckedChange={(checked) =>
                    updateConfiguration('checkout.urgency.lowStockCounter', checked)
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Limite para "estoque baixo"</Label>
                <Input
                  type="number"
                  placeholder="5"
                  value={configuration.checkout.urgency?.lowStockThreshold || ''}
                  onChange={(e) =>
                    updateConfiguration('checkout.urgency.lowStockThreshold', e.target.value)
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <Label>Timer de oferta limitada</Label>
                <Switch
                  checked={configuration.checkout.urgency?.offerTimer || false}
                  onCheckedChange={(checked) =>
                    updateConfiguration('checkout.urgency.offerTimer', checked)
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Duração da oferta (minutos)</Label>
                <Input
                  type="number"
                  placeholder="15"
                  value={configuration.checkout.urgency?.offerDuration || ''}
                  onChange={(e) =>
                    updateConfiguration('checkout.urgency.offerDuration', e.target.value)
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="social" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Prova Social
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Mostrar avaliações</Label>
                <Switch
                  checked={configuration.checkout.socialProof?.showReviews || false}
                  onCheckedChange={(checked) =>
                    updateConfiguration('checkout.socialProof.showReviews', checked)
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <Label>Contador de vendas recentes</Label>
                <Switch
                  checked={configuration.checkout.socialProof?.recentSales || false}
                  onCheckedChange={(checked) =>
                    updateConfiguration('checkout.socialProof.recentSales', checked)
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Mensagem de vendas recentes</Label>
                <Input
                  placeholder="X pessoas compraram este produto hoje"
                  value={configuration.checkout.socialProof?.salesMessage || ''}
                  onChange={(e) =>
                    updateConfiguration('checkout.socialProof.salesMessage', e.target.value)
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <Label>Badge "Mais vendido"</Label>
                <Switch
                  checked={configuration.checkout.socialProof?.bestSellerBadge || false}
                  onCheckedChange={(checked) =>
                    updateConfiguration('checkout.socialProof.bestSellerBadge', checked)
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
