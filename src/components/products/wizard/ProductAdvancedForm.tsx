
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Settings } from 'lucide-react';

interface ProductAdvancedFormProps {
  isFeatured?: boolean;
  isActive?: boolean;
  onIsFeaturedChange: (featured: boolean) => void;
  onIsActiveChange: (active: boolean) => void;
}

const ProductAdvancedForm: React.FC<ProductAdvancedFormProps> = ({
  isFeatured,
  isActive,
  onIsFeaturedChange,
  onIsActiveChange,
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Configurações Avançadas
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="is_featured"
            checked={isFeatured || false}
            onCheckedChange={(checked) => onIsFeaturedChange(!!checked)}
          />
          <Label htmlFor="is_featured">
            Produto em destaque
          </Label>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="is_active"
            checked={isActive !== false}
            onCheckedChange={(checked) => onIsActiveChange(!!checked)}
          />
          <Label htmlFor="is_active">
            Produto ativo
          </Label>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProductAdvancedForm;
