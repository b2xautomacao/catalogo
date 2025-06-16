
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Truck, MapPin, Package, HelpCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { StoreWizardData } from '@/hooks/useStoreWizard';

interface DeliveryStepProps {
  data: StoreWizardData;
  onUpdate: (updates: Partial<StoreWizardData>) => void;
}

export const DeliveryStep: React.FC<DeliveryStepProps> = ({ data, onUpdate }) => {
  const hasAnyDeliveryMethod = data.offers_pickup || data.offers_delivery || data.offers_shipping;

  const formatCurrency = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    const formatted = (Number(numbers) / 100).toFixed(2);
    return formatted;
  };

  const handleDeliveryFeeChange = (value: string) => {
    const formatted = formatCurrency(value);
    onUpdate({ delivery_fee: Number(formatted) });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Truck className="h-6 w-6 text-orange-600" />
          Como Você Entrega Seus Produtos?
        </CardTitle>
        <p className="text-gray-600">
          Escolha as opções de entrega que você oferece
        </p>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
            <div className="flex items-center gap-3">
              <MapPin className="h-8 w-8 text-blue-600" />
              <div>
                <Label className="text-base font-medium">Retirada na loja</Label>
                <p className="text-sm text-gray-600">Cliente busca no seu endereço</p>
              </div>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <HelpCircle className="h-4 w-4 text-gray-400" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Sem custo de frete, cliente vai até você</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Switch
              checked={data.offers_pickup}
              onCheckedChange={(checked) => onUpdate({ offers_pickup: checked })}
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
              <div className="flex items-center gap-3">
                <Truck className="h-8 w-8 text-green-600" />
                <div>
                  <Label className="text-base font-medium">Entrega local</Label>
                  <p className="text-sm text-gray-600">Você entrega na região</p>
                </div>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <HelpCircle className="h-4 w-4 text-gray-400" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Para entregas na sua cidade ou região</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Switch
                checked={data.offers_delivery}
                onCheckedChange={(checked) => onUpdate({ offers_delivery: checked })}
              />
            </div>

            {data.offers_delivery && (
              <div className="ml-11 space-y-2">
                <Label htmlFor="delivery_fee">Taxa de entrega local</Label>
                <div className="relative max-w-xs">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">R$</span>
                  <Input
                    id="delivery_fee"
                    value={data.delivery_fee.toFixed(2)}
                    onChange={(e) => handleDeliveryFeeChange(e.target.value)}
                    placeholder="0,00"
                    className="pl-8"
                  />
                </div>
                <p className="text-xs text-gray-600">
                  Digite 0,00 se a entrega for gratuita
                </p>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
            <div className="flex items-center gap-3">
              <Package className="h-8 w-8 text-purple-600" />
              <div>
                <Label className="text-base font-medium">Envio pelos Correios</Label>
                <p className="text-sm text-gray-600">Entrega em todo o Brasil</p>
              </div>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <HelpCircle className="h-4 w-4 text-gray-400" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Frete calculado automaticamente pelos Correios</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Switch
              checked={data.offers_shipping}
              onCheckedChange={(checked) => onUpdate({ offers_shipping: checked })}
            />
          </div>
        </div>

        {!hasAnyDeliveryMethod && (
          <div className="bg-red-50 p-4 rounded-lg">
            <p className="text-sm text-red-800">
              ⚠️ Selecione pelo menos uma opção de entrega para continuar
            </p>
          </div>
        )}

        {data.offers_pickup && (
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">📍 Retirada na loja</h4>
            <p className="text-sm text-blue-800">
              Lembre-se de informar seu endereço e horários de funcionamento 
              nas configurações da loja após concluir este assistente.
            </p>
          </div>
        )}

        {data.offers_shipping && (
          <div className="bg-purple-50 p-4 rounded-lg">
            <h4 className="font-medium text-purple-900 mb-2">📦 Correios</h4>
            <p className="text-sm text-purple-800">
              Para calcular frete automaticamente, você precisará configurar as 
              dimensões e peso dos produtos no cadastro de cada item.
            </p>
          </div>
        )}

        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-2">💡 Dica profissional:</h4>
          <p className="text-sm text-gray-700">
            Ofereça múltiplas opções de entrega! Isso aumenta suas chances de venda.
            Muitos clientes preferem retirar na loja para economizar o frete.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
