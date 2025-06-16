
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { CreditCard, Smartphone, Banknote, HelpCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { StoreWizardData } from '@/hooks/useStoreWizard';

interface PaymentStepProps {
  data: StoreWizardData;
  onUpdate: (updates: Partial<StoreWizardData>) => void;
}

export const PaymentStep: React.FC<PaymentStepProps> = ({ data, onUpdate }) => {
  const hasAnyPaymentMethod = data.accepts_pix || data.accepts_credit_card || data.accepts_cash;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-6 w-6 text-green-600" />
          Como Você Recebe Pagamentos?
        </CardTitle>
        <p className="text-gray-600">
          Escolha as formas de pagamento que você aceita
        </p>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
            <div className="flex items-center gap-3">
              <Smartphone className="h-8 w-8 text-blue-600" />
              <div>
                <Label className="text-base font-medium">PIX</Label>
                <p className="text-sm text-gray-600">Receba na hora, sem taxas</p>
              </div>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <HelpCircle className="h-4 w-4 text-gray-400" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Pagamento instantâneo, muito popular no Brasil</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Switch
              checked={data.accepts_pix}
              onCheckedChange={(checked) => onUpdate({ accepts_pix: checked })}
            />
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
            <div className="flex items-center gap-3">
              <CreditCard className="h-8 w-8 text-purple-600" />
              <div>
                <Label className="text-base font-medium">Cartão de Crédito</Label>
                <p className="text-sm text-gray-600">Aceite parcelamento</p>
              </div>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <HelpCircle className="h-4 w-4 text-gray-400" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Requer configuração de gateway de pagamento (taxa aplicável)</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Switch
              checked={data.accepts_credit_card}
              onCheckedChange={(checked) => onUpdate({ accepts_credit_card: checked })}
            />
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
            <div className="flex items-center gap-3">
              <Banknote className="h-8 w-8 text-green-600" />
              <div>
                <Label className="text-base font-medium">Dinheiro</Label>
                <p className="text-sm text-gray-600">Pagamento na entrega</p>
              </div>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <HelpCircle className="h-4 w-4 text-gray-400" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Para vendas presenciais ou entrega em mãos</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Switch
              checked={data.accepts_cash}
              onCheckedChange={(checked) => onUpdate({ accepts_cash: checked })}
            />
          </div>
        </div>

        {!hasAnyPaymentMethod && (
          <div className="bg-red-50 p-4 rounded-lg">
            <p className="text-sm text-red-800">
              ⚠️ Selecione pelo menos uma forma de pagamento para continuar
            </p>
          </div>
        )}

        {data.accepts_pix && (
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">💡 PIX é a melhor opção!</h4>
            <p className="text-sm text-blue-800">
              • Sem taxas para você<br />
              • Dinheiro cai na hora<br />
              • Clientes adoram a praticidade
            </p>
          </div>
        )}

        {data.accepts_credit_card && (
          <div className="bg-purple-50 p-4 rounded-lg">
            <h4 className="font-medium text-purple-900 mb-2">💳 Cartão de Crédito</h4>
            <p className="text-sm text-purple-800">
              Você precisará configurar um gateway de pagamento nas configurações após criar a loja.
              Recomendamos o Mercado Pago (taxas competitivas e fácil integração).
            </p>
          </div>
        )}

        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-2">📝 Lembre-se:</h4>
          <p className="text-sm text-gray-700">
            Quanto mais opções de pagamento, mais vendas você pode conseguir!
            Você pode alterar essas configurações a qualquer momento.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
