
import React from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ProductFormData } from '@/hooks/useProductFormWizard';

interface ProductAdvancedFormProps {
  formData: ProductFormData;
  updateFormData: (updates: Partial<ProductFormData>) => void;
}

const ProductAdvancedForm: React.FC<ProductAdvancedFormProps> = ({
  formData,
  updateFormData
}) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Label htmlFor="is_featured">Produto em Destaque</Label>
        <Switch
          id="is_featured"
          checked={formData.is_featured || false}
          onCheckedChange={(checked) => updateFormData({ is_featured: checked })}
        />
      </div>
    </div>
  );
};

export default ProductAdvancedForm;
