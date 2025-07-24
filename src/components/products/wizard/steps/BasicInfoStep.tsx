
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Loader2, Plus, Sparkles } from 'lucide-react';
import { useCategories } from '@/hooks/useCategories';
import CategoryFormDialog from '@/components/products/CategoryFormDialog';
import { WizardFormData } from '@/hooks/useImprovedProductFormWizard';
import { useState } from 'react';
import ImprovedAIToolsModal from '@/components/products/ImprovedAIToolsModal';

interface BasicInfoStepProps {
  formData: WizardFormData;
  updateFormData: (updates: Partial<WizardFormData>) => void;
}

const BasicInfoStep: React.FC<BasicInfoStepProps> = ({ formData, updateFormData }) => {
  const { categories, loading: categoriesLoading } = useCategories();
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);

  const handleCategoryCreated = (newCategory: any) => {
    updateFormData({ category: newCategory.name });
    setShowCategoryDialog(false);
  };

  const handleAIDescriptionGenerated = (description: string) => {
    updateFormData({ description });
  };

  const handleAITitleGenerated = (title: string) => {
    updateFormData({ name: title });
  };

  const handleAIKeywordsGenerated = (keywords: string) => {
    updateFormData({ keywords });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Informações Básicas</h3>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setShowAIModal(true)}
          className="flex items-center gap-2"
        >
          <Sparkles className="h-4 w-4" />
          Agente de IA
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <div className="space-y-2">
          <Label htmlFor="productName" className="text-sm font-medium">
            Nome do Produto *
          </Label>
          <Input
            id="productName"
            type="text"
            value={formData.name}
            onChange={(e) => updateFormData({ name: e.target.value })}
            placeholder="Digite o nome do produto"
            className={`${!formData.name ? 'border-red-300' : ''}`}
          />
          {!formData.name && (
            <p className="text-xs text-red-500">Nome do produto é obrigatório</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="category" className="text-sm font-medium">
            Categoria *
          </Label>
          <div className="flex gap-2">
            <Select
              value={formData.category || ''}
              onValueChange={(value) => updateFormData({ category: value })}
            >
              <SelectTrigger className={`flex-1 ${!formData.category ? 'border-red-300' : ''}`}>
                <SelectValue placeholder="Selecione uma categoria" />
              </SelectTrigger>
              <SelectContent>
                {categoriesLoading ? (
                  <SelectItem value="loading" disabled>
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Carregando...
                    </div>
                  </SelectItem>
                ) : categories.length === 0 ? (
                  <SelectItem value="empty" disabled>
                    Nenhuma categoria encontrada
                  </SelectItem>
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
              size="sm"
              onClick={() => setShowCategoryDialog(true)}
              className="flex items-center gap-2 px-3"
            >
              <Plus className="h-4 w-4" />
              Nova
            </Button>
          </div>
          {!formData.category && (
            <p className="text-xs text-red-500">Categoria é obrigatória</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="description" className="text-sm font-medium">
            Descrição
          </Label>
          <Textarea
            id="description"
            value={formData.description || ''}
            onChange={(e) => updateFormData({ description: e.target.value })}
            placeholder="Descreva o produto"
            rows={4}
            className="resize-none"
          />
          <p className="text-xs text-muted-foreground">
            Uma boa descrição ajuda os clientes a entenderem o produto
          </p>
        </div>
      </div>

      <CategoryFormDialog
        open={showCategoryDialog}
        onOpenChange={setShowCategoryDialog}
        onCategoryCreated={handleCategoryCreated}
      />

      <ImprovedAIToolsModal
        open={showAIModal}
        onOpenChange={setShowAIModal}
        productName={formData.name}
        category={formData.category}
        onDescriptionGenerated={handleAIDescriptionGenerated}
        onTitleGenerated={handleAITitleGenerated}
        onKeywordsGenerated={handleAIKeywordsGenerated}
      />
    </div>
  );
};

export default BasicInfoStep;
