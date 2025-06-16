
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MessageCircle, Phone, Mail, HelpCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { StoreWizardData } from '@/hooks/useStoreWizard';

interface ContactStepProps {
  data: StoreWizardData;
  onUpdate: (updates: Partial<StoreWizardData>) => void;
}

export const ContactStep: React.FC<ContactStepProps> = ({ data, onUpdate }) => {
  const formatPhone = (value: string) => {
    // Remove tudo que não é número
    const numbers = value.replace(/\D/g, '');
    
    // Aplica máscara (11) 99999-9999
    if (numbers.length <= 11) {
      const formatted = numbers.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
      return formatted;
    }
    return value;
  };

  const handlePhoneChange = (value: string) => {
    const formatted = formatPhone(value);
    onUpdate({ store_phone: formatted });
  };

  const handleWhatsAppChange = (value: string) => {
    const formatted = formatPhone(value);
    onUpdate({ whatsapp_number: formatted });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="h-6 w-6 text-green-600" />
          Informações de Contato
        </CardTitle>
        <p className="text-gray-600">
          Como seus clientes podem entrar em contato com você?
        </p>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label htmlFor="store_phone">Telefone principal *</Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <HelpCircle className="h-4 w-4 text-gray-400" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Será exibido no seu catálogo para os clientes entrarem em contato</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              id="store_phone"
              value={data.store_phone}
              onChange={(e) => handlePhoneChange(e.target.value)}
              placeholder="(11) 99999-9999"
              className="pl-10"
              maxLength={15}
            />
          </div>
          {data.store_phone.length > 0 && data.store_phone.length < 14 && (
            <p className="text-sm text-amber-600">
              Digite um telefone válido com DDD
            </p>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label htmlFor="whatsapp_number">WhatsApp para vendas (recomendado)</Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <HelpCircle className="h-4 w-4 text-gray-400" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Facilita muito as vendas! Clientes podem fazer pedidos direto pelo WhatsApp</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div className="relative">
            <MessageCircle className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-green-500" />
            <Input
              id="whatsapp_number"
              value={data.whatsapp_number}
              onChange={(e) => handleWhatsAppChange(e.target.value)}
              placeholder="(11) 99999-9999"
              className="pl-10"
              maxLength={15}
            />
          </div>
          <p className="text-xs text-gray-600">
            Pode ser o mesmo número do telefone principal
          </p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label htmlFor="store_email">E-mail (opcional)</Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <HelpCircle className="h-4 w-4 text-gray-400" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Para contatos mais formais e confirmações de pedido</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              id="store_email"
              type="email"
              value={data.store_email}
              onChange={(e) => onUpdate({ store_email: e.target.value })}
              placeholder="contato@minhaloja.com"
              className="pl-10"
            />
          </div>
        </div>

        {data.whatsapp_number && (
          <div className="bg-green-50 p-4 rounded-lg">
            <h4 className="font-medium text-green-900 mb-2 flex items-center gap-2">
              <MessageCircle className="h-4 w-4" />
              Ótima escolha!
            </h4>
            <p className="text-sm text-green-800">
              Com WhatsApp configurado, seus clientes poderão:
            </p>
            <ul className="text-sm text-green-800 mt-2 space-y-1">
              <li>• Fazer pedidos direto pelo WhatsApp</li>
              <li>• Tirar dúvidas sobre produtos</li>
              <li>• Negociar preços e formas de pagamento</li>
              <li>• Receber atualizações do pedido</li>
            </ul>
          </div>
        )}

        {!data.whatsapp_number && (
          <div className="bg-amber-50 p-4 rounded-lg">
            <h4 className="font-medium text-amber-900 mb-2">💡 Por que usar WhatsApp?</h4>
            <p className="text-sm text-amber-800">
              Lojas com WhatsApp vendem até 3x mais! É o canal preferido dos brasileiros para compras online.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
