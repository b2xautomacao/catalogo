
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Info, CreditCard, ExternalLink } from 'lucide-react';

const TestEnvironmentInfo = () => {
  const [showTestCards, setShowTestCards] = useState(false);

  const testCards = [
    {
      type: 'Visa',
      number: '4507 9507 9507 9509',
      cvv: '123',
      expiry: '11/25',
      description: 'Cartão aprovado'
    },
    {
      type: 'Mastercard',
      number: '5031 7557 3453 0604',
      cvv: '123', 
      expiry: '11/25',
      description: 'Cartão aprovado'
    },
    {
      type: 'Visa (Rejeitado)',
      number: '4509 9535 6623 3704',
      cvv: '123',
      expiry: '11/25',
      description: 'Cartão com fundos insuficientes'
    }
  ];

  return (
    <>
      <Card className="border-yellow-200 bg-gradient-to-r from-yellow-50 to-orange-50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center flex-shrink-0">
              <Info className="w-5 h-5 text-yellow-600" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h4 className="font-semibold text-yellow-800">Ambiente de Teste</h4>
                <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 text-xs">
                  🧪 SANDBOX
                </Badge>
              </div>
              <p className="text-yellow-700 text-sm mb-3">
                Esta loja está configurada com credenciais de teste do Mercado Pago. 
                Use os cartões de teste para simular pagamentos sem cobranças reais.
              </p>
              <div className="flex flex-wrap gap-2">
                <Dialog open={showTestCards} onOpenChange={setShowTestCards}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="border-yellow-300 text-yellow-700 hover:bg-yellow-100">
                      <CreditCard className="w-4 h-4 mr-2" />
                      Ver Cartões de Teste
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <CreditCard className="w-5 h-5" />
                        Cartões de Teste
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <p className="text-sm text-gray-600">
                        Use estes cartões para testar pagamentos. Nenhuma cobrança real será feita.
                      </p>
                      {testCards.map((card, index) => (
                        <div key={index} className="p-3 border rounded-lg bg-gray-50">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-medium">{card.type}</h4>
                            <Badge variant="outline" className="text-xs">
                              {card.description}
                            </Badge>
                          </div>
                          <div className="space-y-1 text-sm">
                            <div><strong>Número:</strong> {card.number}</div>
                            <div><strong>CVV:</strong> {card.cvv}</div>
                            <div><strong>Vencimento:</strong> {card.expiry}</div>
                          </div>
                        </div>
                      ))}
                      <div className="p-3 border border-blue-200 rounded-lg bg-blue-50">
                        <p className="text-xs text-blue-700">
                          <strong>PIX Teste:</strong> Use qualquer CPF válido para simular um pagamento PIX.
                        </p>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="border-yellow-300 text-yellow-700 hover:bg-yellow-100"
                  onClick={() => window.open('https://www.mercadopago.com.br/developers/pt/docs/checkout-pro/additional-content/test-cards', '_blank')}
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Documentação
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
};

export default TestEnvironmentInfo;
