
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ProductFormData } from '@/hooks/useProductFormWizard';

interface ProductSeoFormProps {
  formData: ProductFormData;
  updateFormData: (updates: Partial<ProductFormData>) => void;
}

const ProductSeoForm: React.FC<ProductSeoFormProps> = ({
  formData,
  updateFormData
}) => {
  return (
    <div className="space-y-6">
      <div>
        <Label htmlFor="meta_title">Título SEO</Label>
        <Input
          id="meta_title"
          value={formData.meta_title}
          onChange={(e) => updateFormData({ meta_title: e.target.value })}
          placeholder="Título para SEO (aparece no Google)"
        />
      </div>

      <div>
        <Label htmlFor="meta_description">Descrição SEO</Label>
        <Textarea
          id="meta_description"
          value={formData.meta_description}
          onChange={(e) => updateFormData({ meta_description: e.target.value })}
          placeholder="Descrição para SEO (aparece no Google)"
          rows={3}
        />
      </div>

      <div>
        <Label htmlFor="keywords">Palavras-chave</Label>
        <Input
          id="keywords"
          value={formData.keywords}
          onChange={(e) => updateFormData({ keywords: e.target.value })}
          placeholder="palavra1, palavra2, palavra3"
        />
      </div>
    </div>
  );
};

export default ProductSeoForm;
