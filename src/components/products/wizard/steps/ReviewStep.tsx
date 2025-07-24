
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, AlertCircle, Package, DollarSign, Image, Palette, Hash } from 'lucide-react';
import { WizardFormData } from '@/hooks/useImprovedProductFormWizard';

interface ReviewStepProps {
  formData: WizardFormData;
}

const ReviewStep: React.FC<ReviewStepProps> = ({ formData }) => {
  const getCompletionStatus = () => {
    const required = [
      { field: 'name', label: 'Nome do produto' },
      { field: 'category', label: 'Categoria' },
      { field: 'retail_price', label: 'Preço de varejo', check: (value: any) => value > 0 }
    ];

    const completed = required.filter(item => {
      const value = formData[item.field as keyof WizardFormData];
      return item.check ? item.check(value) : Boolean(value);
    });

    return {
      completed: completed.length,
      total: required.length,
      missing: required.filter(item => {
        const value = formData[item.field as keyof WizardFormData];
        return item.check ? !item.check(value) : !Boolean(value);
      })
    };
  };

  const status = getCompletionStatus();
  const isComplete = status.completed === status.total;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Revisar e Confirmar</h3>
        <Badge variant={isComplete ? "default" : "destructive"}>
          {status.completed}/{status.total} completo
        </Badge>
      </div>

      {!isComplete && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
              <div>
                <p className="font-medium text-red-900">Campos obrigatórios pendentes:</p>
                <ul className="text-sm text-red-800 mt-1">
                  {status.missing.map((item, index) => (
                    <li key={index}>• {item.label}</li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Informações Básicas */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Package className="h-4 w-4" />
              Informações Básicas
              {formData.name && formData.category && (
                <Check className="h-4 w-4 text-green-500" />
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm font-medium">Nome:</p>
              <p className="text-sm text-muted-foreground">
                {formData.name || 'Não informado'}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium">Categoria:</p>
              <p className="text-sm text-muted-foreground">
                {formData.category || 'Não informada'}
              </p>
            </div>
            {formData.description && (
              <div>
                <p className="text-sm font-medium">Descrição:</p>
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {formData.description}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Preços */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Preços e Estoque
              {formData.retail_price > 0 && (
                <Check className="h-4 w-4 text-green-500" />
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm font-medium">Preço Varejo:</p>
              <p className="text-sm text-muted-foreground">
                {formData.retail_price > 0 
                  ? `R$ ${formData.retail_price.toFixed(2)}` 
                  : 'Não informado'
                }
              </p>
            </div>
            {formData.wholesale_price && (
              <div>
                <p className="text-sm font-medium">Preço Atacado:</p>
                <p className="text-sm text-muted-foreground">
                  R$ {formData.wholesale_price.toFixed(2)}
                </p>
              </div>
            )}
            <div>
              <p className="text-sm font-medium">Estoque:</p>
              <p className="text-sm text-muted-foreground">
                {formData.stock || 0} unidades
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Variações */}
        {formData.variations && formData.variations.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Palette className="h-4 w-4" />
                Variações
                <Check className="h-4 w-4 text-green-500" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {formData.variations.length} variações configuradas
              </p>
            </CardContent>
          </Card>
        )}

        {/* SEO */}
        {(formData.meta_title || formData.meta_description || formData.keywords) && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Hash className="h-4 w-4" />
                SEO
                <Check className="h-4 w-4 text-green-500" />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {formData.meta_title && (
                <div>
                  <p className="text-sm font-medium">Título SEO:</p>
                  <p className="text-sm text-muted-foreground">
                    {formData.meta_title}
                  </p>
                </div>
              )}
              {formData.keywords && (
                <div>
                  <p className="text-sm font-medium">Palavras-chave:</p>
                  <p className="text-sm text-muted-foreground">
                    {formData.keywords}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {isComplete && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Check className="h-5 w-5 text-green-500" />
              <div>
                <p className="font-medium text-green-900">Produto pronto para salvar!</p>
                <p className="text-sm text-green-800">
                  Todos os campos obrigatórios foram preenchidos. Clique em "Salvar Produto" para finalizar.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ReviewStep;
