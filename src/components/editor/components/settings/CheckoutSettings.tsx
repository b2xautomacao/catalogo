
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useEditorStore } from '../../stores/useEditorStore';
import ColorPicker from '../ColorPicker';

const CheckoutSettings: React.FC = () => {
  const { configuration, updateConfiguration } = useEditorStore();
  const checkoutConfig = configuration.checkout;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">Checkout</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Layout do Checkout */}
        <div className="space-y-2">
          <Label>Layout do Checkout</Label>
          <Select
            value={checkoutConfig.layout}
            onValueChange={(value) => updateConfiguration('checkout.layout', value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="single">Página Única</SelectItem>
              <SelectItem value="steps">Em Etapas</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Cores do Checkout */}
        <div className="space-y-4">
          <Label>Cores do Checkout</Label>
          
          <div className="grid grid-cols-1 gap-3">
            <div className="space-y-2">
              <Label className="text-xs">Cor Primária</Label>
              <ColorPicker
                color={checkoutConfig.colors.primary}
                onChange={(color) => updateConfiguration('checkout.colors.primary', color)}
              />
            </div>
            
            <div className="space-y-2">
              <Label className="text-xs">Cor Secundária</Label>
              <ColorPicker
                color={checkoutConfig.colors.secondary}
                onChange={(color) => updateConfiguration('checkout.colors.secondary', color)}
              />
            </div>
            
            <div className="space-y-2">
              <Label className="text-xs">Cor de Destaque</Label>
              <ColorPicker
                color={checkoutConfig.colors.accent}
                onChange={(color) => updateConfiguration('checkout.colors.accent', color)}
              />
            </div>
            
            <div className="space-y-2">
              <Label className="text-xs">Cor de Fundo</Label>
              <ColorPicker
                color={checkoutConfig.colors.background}
                onChange={(color) => updateConfiguration('checkout.colors.background', color)}
              />
            </div>
            
            <div className="space-y-2">
              <Label className="text-xs">Cor do Texto</Label>
              <ColorPicker
                color={checkoutConfig.colors.text}
                onChange={(color) => updateConfiguration('checkout.colors.text', color)}
              />
            </div>
          </div>
        </div>

        {/* Opções de Exibição */}
        <div className="space-y-3">
          <Label>Opções de Exibição</Label>
          
          <div className="flex items-center justify-between">
            <Label className="text-sm">Mostrar Itens do Carrinho</Label>
            <Switch
              checked={checkoutConfig.showCartItems}
              onCheckedChange={(checked) => updateConfiguration('checkout.showCartItems', checked)}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <Label className="text-sm">Mostrar Selos de Segurança</Label>
            <Switch
              checked={checkoutConfig.showSecurityBadges}
              onCheckedChange={(checked) => updateConfiguration('checkout.showSecurityBadges', checked)}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <Label className="text-sm">Mostrar Avaliações</Label>
            <Switch
              checked={checkoutConfig.showReviews}
              onCheckedChange={(checked) => updateConfiguration('checkout.showReviews', checked)}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CheckoutSettings;
