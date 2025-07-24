
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload } from 'lucide-react';

interface ProductImageManagerProps {
  productId: string;
  className?: string;
}

const ProductImageManager: React.FC<ProductImageManagerProps> = ({ 
  productId, 
  className = '' 
}) => {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Gerenciar Imagens
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">
          Gerenciador de imagens para produto ID: {productId}
        </p>
      </CardContent>
    </Card>
  );
};

export default ProductImageManager;
