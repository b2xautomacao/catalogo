
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ProductFormData } from '@/hooks/useProductFormWizard';

interface ProductBasicInfoFormProps {
  formData: ProductFormData;
  updateFormData: (updates: Partial<ProductFormData>) => void;
}

const ProductBasicInfoForm: React.FC<ProductBasicInfoFormProps> = ({
  formData,
  updateFormData
}) => {
  return (
    <div className="space-y-6">
      <div>
        <Label htmlFor="name">Nome do Produto *</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => updateFormData({ name: e.target.value })}
          placeholder="Digite o nome do produto"
        />
      </div>

      <div>
        <Label htmlFor="description">Descrição</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => updateFormData({ description: e.target.value })}
          placeholder="Descreva o produto"
          rows={4}
        />
      </div>

      <div>
        <Label htmlFor="category">Categoria</Label>
        <Input
          id="category"
          value={formData.category}
          onChange={(e) => updateFormData({ category: e.target.value })}
          placeholder="Ex: Eletrônicos, Roupas, etc."
        />
      </div>
    </div>
  );
};

export default ProductBasicInfoForm;
