
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useStorePriceModel } from '@/hooks/useStorePriceModel';
import { useAuth } from '@/hooks/useAuth';
import { ProductPriceTiersManager } from './ProductPriceTiersManager';

interface ProductPriceTiersSectionProps {
  productId?: string;
  retailPrice: number;
  onTiersChange?: (tiers: any[]) => void;
}

const ProductPriceTiersSection: React.FC<ProductPriceTiersSectionProps> = ({
  productId,
  retailPrice,
  onTiersChange,
}) => {
  const { profile } = useAuth();
  const { priceModel, isModelActive } = useStorePriceModel(profile?.store_id);

  // Não mostrar se modelo não suporta níveis graduais
  if (!priceModel?.gradual_wholesale_enabled && !priceModel?.show_price_tiers) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Níveis de Preço</CardTitle>
          <Badge variant="secondary">
            {priceModel?.price_model === 'gradual_wholesale' ? 'Níveis Graduais' : 'Personalizado'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {!productId ? (
          <div className="text-center py-8 text-gray-500">
            <p>Salve o produto primeiro para configurar níveis de preço</p>
          </div>
        ) : (
          <ProductPriceTiersManager
            productId={productId}
            retailPrice={retailPrice}
            onTiersChange={onTiersChange}
          />
        )}
      </CardContent>
    </Card>
  );
};

export default ProductPriceTiersSection;
