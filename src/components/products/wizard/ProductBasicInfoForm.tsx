
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Sparkles } from 'lucide-react';
import { ProductFormData } from '@/hooks/useProductFormWizard';
import { useCategories } from '@/hooks/useCategories';
import SimpleCategoryDialog from '../SimpleCategoryDialog';
import AIContentGenerator from '@/components/ai/AIContentGenerator';

interface ProductBasicInfoFormProps {
  formData: ProductFormData;
  updateFormData: (updates: Partial<ProductFormData>) => void;
}

const ProductBasicInfoForm: React.FC<ProductBasicInfoFormProps> = ({
  formData,
  updateFormData
}) => {
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  const { categories, loading: categoriesLoading } = useCategories();

  const handleCategoryCreated = (category: any) => {
    console.log('Nova categoria criada:', category);
    updateFormData({ category: category.name });
    setShowCategoryDialog(false);
  };

  const handleDescriptionGenerated = (description: string) => {
    updateFormData({ description });
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
              <Select
                value={formData.category || ''}
                onValueChange={(value) => updateFormData({ category: value })}
              >
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent>
                  {categoriesLoading ? (
                    <SelectItem value="">Carregando...</SelectItem>
                  ) : categories.length === 0 ? (
                    <SelectItem value="">Nenhuma categoria encontrada</SelectItem>
                  ) : (
                    categories.map((category) => (
                      <SelectItem key={category.id} value={category.name}>
                        {category.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
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
            <div className="flex items-center justify-between mb-2">
              <Label htmlFor="description">Descrição</Label>
              <AIContentGenerator
                productName={formData.name}
                category={formData.category || 'produto'}
                onDescriptionGenerated={handleDescriptionGenerated}
                disabled={!formData.name}
                variant="description"
                size="sm"
              />
            </div>
            <Textarea
              id="description"
              value={formData.description || ''}
              onChange={(e) => updateFormData({ description: e.target.value })}
              placeholder="Descreva o produto em detalhes"
              rows={4}
              className="w-full resize-none"
            />
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
