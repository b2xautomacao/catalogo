
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Plus, Sparkles } from 'lucide-react';
import { ProductFormData } from '@/hooks/useProductFormWizard';
import SimpleCategoryDialog from '../SimpleCategoryDialog';
import { useState } from 'react';

interface ProductBasicInfoFormProps {
  formData: ProductFormData;
  updateFormData: (updates: Partial<ProductFormData>) => void;
}

const ProductBasicInfoForm: React.FC<ProductBasicInfoFormProps> = ({
  formData,
  updateFormData
}) => {
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);

  const handleCategoryCreated = (categoryName: string) => {
    updateFormData({ category: categoryName });
    setShowCategoryDialog(false);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Informações Básicas do Produto</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Nome do Produto */}
          <div className="space-y-2">
            <Label htmlFor="name">Nome do Produto *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => updateFormData({ name: e.target.value })}
              placeholder="Digite o nome do produto"
              className="w-full"
            />
          </div>

          {/* Categoria */}
          <div className="space-y-2">
            <Label htmlFor="category">Categoria</Label>
            <div className="flex gap-2">
              <Input
                id="category"
                value={formData.category || ''}
                onChange={(e) => updateFormData({ category: e.target.value })}
                placeholder="Digite ou selecione uma categoria"
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowCategoryDialog(true)}
                className="shrink-0"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Descrição */}
          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={formData.description || ''}
              onChange={(e) => updateFormData({ description: e.target.value })}
              placeholder="Descreva o produto em detalhes"
              rows={4}
              className="w-full resize-none"
            />
          </div>

          {/* Ferramenta de IA */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-blue-900 flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  Gerar com IA
                </h4>
                <p className="text-sm text-blue-700 mt-1">
                  Use inteligência artificial para gerar descrição automática
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-blue-700 border-blue-300 hover:bg-blue-100"
                disabled={!formData.name}
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Gerar Descrição
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dialog de Categoria */}
      <SimpleCategoryDialog
        open={showCategoryDialog}
        onOpenChange={setShowCategoryDialog}
        onCategoryCreated={handleCategoryCreated}
      />
    </div>
  );
};

export default ProductBasicInfoForm;
