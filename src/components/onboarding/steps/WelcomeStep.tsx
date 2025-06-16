
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, Store, Sparkles, Zap } from 'lucide-react';

interface WelcomeStepProps {
  onNext: () => void;
}

export const WelcomeStep: React.FC<WelcomeStepProps> = ({ onNext }) => {
  return (
    <div className="space-y-6">
      <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-purple-50">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-4">
            <Store className="h-10 w-10 text-white" />
          </div>
          <CardTitle className="text-3xl font-bold gradient-text">
            Bem-vindo ao seu catálogo online!
          </CardTitle>
          <p className="text-lg text-gray-600 mt-4">
            Vamos configurar sua loja em poucos minutos para você começar a vender
          </p>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-white rounded-lg border">
              <Sparkles className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <h3 className="font-semibold text-gray-800">Fácil de usar</h3>
              <p className="text-sm text-gray-600">
                Interface simples, feita para quem não tem conhecimento técnico
              </p>
            </div>
            
            <div className="text-center p-4 bg-white rounded-lg border">
              <Zap className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <h3 className="font-semibold text-gray-800">Configuração rápida</h3>
              <p className="text-sm text-gray-600">
                Apenas 6 passos simples para ter sua loja funcionando
              </p>
            </div>
            
            <div className="text-center p-4 bg-white rounded-lg border">
              <Store className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <h3 className="font-semibold text-gray-800">Loja profissional</h3>
              <p className="text-sm text-gray-600">
                Catálogo bonito e funcional para impressionar seus clientes
              </p>
            </div>
          </div>

          <div className="bg-blue-50 p-6 rounded-lg">
            <h4 className="font-semibold text-blue-900 mb-3">O que vamos configurar:</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-blue-800">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                Informações básicas da sua loja
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                Identidade visual (logo)
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                WhatsApp para vendas
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                Formas de pagamento
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                Opções de entrega
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                Configurações finais
              </div>
            </div>
          </div>

          <div className="text-center">
            <Button onClick={onNext} size="lg" className="btn-primary px-8">
              Vamos começar!
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <p className="text-xs text-gray-500 mt-2">
              Você pode pausar e continuar depois a qualquer momento
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
