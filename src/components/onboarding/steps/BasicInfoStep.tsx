
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Store, HelpCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { StoreWizardData } from '@/hooks/useStoreWizard';

interface BasicInfoStepProps {
  data: StoreWizardData;
  onUpdate: (updates: Partial<StoreWizardData>) => void;
  businessTypes: Array<{ value: string; label: string; emoji: string }>;
}

export const BasicInfoStep: React.FC<BasicInfoStepProps> = ({ 
  data, 
  onUpdate, 
  businessTypes 
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Store className="h-6 w-6 text-blue-600" />
          Informações Básicas da Sua Loja
        </CardTitle>
        <p className="text-gray-600">
          Vamos começar com as informações essenciais sobre seu negócio
        </p>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label htmlFor="store_name">Nome da sua loja *</Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <HelpCircle className="h-4 w-4 text-gray-400" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Este será o nome que seus clientes verão no catálogo</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <Input
            id="store_name"
            value={data.store_name}
            onChange={(e) => onUpdate({ store_name: e.target.value })}
            placeholder="Ex: Loja da Maria, Boutique Elegante, Eletrônicos Tech..."
            className="text-lg"
          />
          {data.store_name.length > 0 && data.store_name.length < 3 && (
            <p className="text-sm text-amber-600">
              O nome precisa ter pelo menos 3 caracteres
            </p>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label htmlFor="business_type">Que tipo de produtos você vende? *</Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <HelpCircle className="h-4 w-4 text-gray-400" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Isso nos ajuda a configurar sua loja com as melhores opções</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <Select value={data.business_type} onValueChange={(value) => onUpdate({ business_type: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Escolha a categoria que melhor descreve seu negócio" />
            </SelectTrigger>
            <SelectContent>
              {businessTypes.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  <span className="flex items-center gap-2">
                    <span>{type.emoji}</span>
                    <span>{type.label}</span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label htmlFor="store_description">Conte um pouco sobre sua loja (opcional)</Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <HelpCircle className="h-4 w-4 text-gray-400" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Uma descrição atrativa pode ajudar a conquistar mais clientes</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <Textarea
            id="store_description"
            value={data.store_description}
            onChange={(e) => onUpdate({ store_description: e.target.value })}
            placeholder="Ex: Roupas femininas com estilo único, eletrônicos com os melhores preços, comida caseira feita com amor..."
            rows={3}
            className="resize-none"
          />
          <p className="text-xs text-gray-500">
            {data.store_description.length}/500 caracteres
          </p>
        </div>

        {data.business_type && (
          <div className="bg-green-50 p-4 rounded-lg">
            <h4 className="font-medium text-green-900 mb-2">✨ Perfeito!</h4>
            <p className="text-sm text-green-800">
              Vamos configurar sua loja com as melhores práticas para o setor de{' '}
              <strong>{businessTypes.find(t => t.value === data.business_type)?.label}</strong>.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
