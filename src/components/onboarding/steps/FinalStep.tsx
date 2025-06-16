
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, 
  Store, 
  ImageIcon, 
  MessageCircle, 
  CreditCard, 
  Truck,
  Sparkles 
} from 'lucide-react';
import { StoreWizardData } from '@/hooks/useStoreWizard';

interface FinalStepProps {
  data: StoreWizardData;
  businessTypes: Array<{ value: string; label: string; emoji: string }>;
}

export const FinalStep: React.FC<FinalStepProps> = ({ data, businessTypes }) => {
  const businessType = businessTypes.find(t => t.value === data.business_type);

  return (
    <div className="space-y-6">
      <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-blue-50">
        <CardHeader className="text-center">
          <div className="mx-auto w-20 h-20 bg-gradient-to-r from-green-500 to-blue-600 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="h-10 w-10 text-white" />
          </div>
          <CardTitle className="text-3xl font-bold gradient-text">
            Tudo Pronto! 🎉
          </CardTitle>
          <p className="text-lg text-gray-600 mt-4">
            Vamos revisar as configurações da sua loja antes de criar
          </p>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Informações Básicas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Store className="h-5 w-5 text-blue-600" />
              Informações Básicas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-gray-600">Nome da loja:</p>
              <p className="font-semibold">{data.store_name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Tipo de negócio:</p>
              <Badge variant="outline" className="gap-1">
                <span>{businessType?.emoji}</span>
                <span>{businessType?.label}</span>
              </Badge>
            </div>
            {data.store_description && (
              <div>
                <p className="text-sm text-gray-600">Descrição:</p>
                <p className="text-sm">{data.store_description}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Identidade Visual */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <ImageIcon className="h-5 w-5 text-purple-600" />
              Identidade Visual
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.logo_file || data.logo_url ? (
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 border rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
                  {data.logo_file ? (
                    <img 
                      src={URL.createObjectURL(data.logo_file)} 
                      alt="Logo" 
                      className="max-w-full max-h-full object-contain"
                    />
                  ) : (
                    <img 
                      src={data.logo_url} 
                      alt="Logo" 
                      className="max-w-full max-h-full object-contain"
                    />
                  )}
                </div>
                <div>
                  <p className="font-semibold text-green-700">✓ Logo configurado</p>
                  <p className="text-sm text-gray-600">Sua loja terá identidade visual</p>
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-gray-600">Nenhum logo configurado</p>
                <p className="text-sm text-gray-500">Você pode adicionar depois</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Contato */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <MessageCircle className="h-5 w-5 text-green-600" />
              Contato
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-gray-600">Telefone:</p>
              <p className="font-semibold">{data.store_phone}</p>
            </div>
            {data.whatsapp_number && (
              <div>
                <p className="text-sm text-gray-600">WhatsApp:</p>
                <p className="font-semibold text-green-700">{data.whatsapp_number}</p>
              </div>
            )}
            {data.store_email && (
              <div>
                <p className="text-sm text-gray-600">E-mail:</p>
                <p className="font-semibold">{data.store_email}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pagamentos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <CreditCard className="h-5 w-5 text-green-600" />
              Formas de Pagamento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {data.accepts_pix && (
                <Badge variant="default" className="bg-blue-100 text-blue-800">
                  PIX
                </Badge>
              )}
              {data.accepts_credit_card && (
                <Badge variant="default" className="bg-purple-100 text-purple-800">
                  Cartão de Crédito
                </Badge>
              )}
              {data.accepts_cash && (
                <Badge variant="default" className="bg-green-100 text-green-800">
                  Dinheiro
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Entrega */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Truck className="h-5 w-5 text-orange-600" />
            Opções de Entrega
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {data.offers_pickup && (
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <p className="font-semibold text-blue-800">Retirada na loja</p>
                <p className="text-sm text-blue-600">Sem custo de frete</p>
              </div>
            )}
            {data.offers_delivery && (
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <p className="font-semibold text-green-800">Entrega local</p>
                <p className="text-sm text-green-600">
                  Taxa: R$ {data.delivery_fee.toFixed(2)}
                </p>
              </div>
            )}
            {data.offers_shipping && (
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <p className="font-semibold text-purple-800">Correios</p>
                <p className="text-sm text-purple-600">Todo o Brasil</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Próximos passos */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-purple-600" />
            Próximos Passos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-semibold text-gray-800">Após criar sua loja:</h4>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>• Adicione seus primeiros produtos</li>
                <li>• Configure categorias</li>
                <li>• Personalize as cores do catálogo</li>
                <li>• Teste um pedido de exemplo</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-gray-800">Para vender mais:</h4>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>• Compartilhe o link do catálogo</li>
                <li>• Configure promoções e cupons</li>
                <li>• Ative notificações do WhatsApp</li>
                <li>• Acompanhe relatórios de vendas</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
