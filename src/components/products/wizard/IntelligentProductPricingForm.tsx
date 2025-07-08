
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { DollarSign, Info } from 'lucide-react';
import { useStorePriceModel } from '@/hooks/useStorePriceModel';
import { useAuth } from '@/hooks/useAuth';

interface PriceTier {
  id: string;
  name: string;
  minQuantity: number;
  price: number;
  enabled: boolean;
}

interface IntelligentProductPricingFormProps {
  retailPrice: number;
  wholesalePrice?: number;
  minWholesaleQty?: number;
  stock: number;
  priceTiers: PriceTier[];
  onRetailPriceChange: (price: number) => void;
  onWholesalePriceChange: (price: number) => void;
  onMinWholesaleQtyChange: (qty: number) => void;
  onStockChange: (stock: number) => void;
  onPriceTiersChange: (tiers: PriceTier[]) => void;
}

const IntelligentProductPricingForm: React.FC<IntelligentProductPricingFormProps> = ({
  retailPrice,
  wholesalePrice,
  minWholesaleQty,
  stock,
  priceTiers,
  onRetailPriceChange,
  onWholesalePriceChange,
  onMinWholesaleQtyChange,
  onStockChange,
  onPriceTiersChange,
}) => {
  const { profile } = useAuth();
  const { priceModel } = useStorePriceModel(profile?.store_id);

  console.log('💰 INTELLIGENT PRICING - Modelo de preço:', priceModel?.price_model);

  const handleTierPriceChange = (tierId: string, price: number) => {
    const updatedTiers = priceTiers.map(tier =>
      tier.id === tierId ? { ...tier, price } : tier
    );
    onPriceTiersChange(updatedTiers);
  };

  const renderPriceFields = () => {
    const catalogMode = priceModel?.price_model || 'retail_only';

    switch (catalogMode) {
      case 'retail_only':
        return (
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-blue-800">
                <Info className="h-4 w-4" />
                <span className="font-medium">Modo: Apenas Varejo</span>
              </div>
              <p className="text-sm text-blue-700 mt-1">
                Apenas o preço de varejo será configurado.
              </p>
            </div>
            
            <div>
              <Label htmlFor="retail_price">Preço Varejo (R$) *</Label>
              <Input
                id="retail_price"
                type="number"
                step="0.01"
                value={retailPrice}
                onChange={(e) => onRetailPriceChange(parseFloat(e.target.value) || 0)}
                placeholder="0.00"
              />
            </div>
          </div>
        );

      case 'simple_wholesale':
        return (
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-green-800">
                <Info className="h-4 w-4" />
                <span className="font-medium">Modo: Atacado Simples</span>
              </div>
              <p className="text-sm text-green-700 mt-1">
                Configure preços de varejo e atacado com quantidade mínima.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="retail_price">Preço Varejo (R$) *</Label>
                <Input
                  id="retail_price"
                  type="number"
                  step="0.01"
                  value={retailPrice}
                  onChange={(e) => onRetailPriceChange(parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                />
              </div>

              <div>
                <Label htmlFor="wholesale_price">
                  Preço {priceModel?.simple_wholesale_name || 'Atacado'} (R$) *
                </Label>
                <Input
                  id="wholesale_price"
                  type="number"
                  step="0.01"
                  value={wholesalePrice || ''}
                  onChange={(e) => onWholesalePriceChange(parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="min_wholesale_qty">
                Quantidade Mínima para {priceModel?.simple_wholesale_name || 'Atacado'}
              </Label>
              <Input
                id="min_wholesale_qty"
                type="number"
                value={minWholesaleQty || 1}
                onChange={(e) => onMinWholesaleQtyChange(parseInt(e.target.value) || 1)}
                placeholder="1"
              />
            </div>
          </div>
        );

      case 'gradual_wholesale':
        return (
          <div className="space-y-4">
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-purple-800">
                <Info className="h-4 w-4" />
                <span className="font-medium">Modo: Atacado Gradativo</span>
              </div>
              <p className="text-sm text-purple-700 mt-1">
                Configure múltiplos níveis de preço com quantidades mínimas.
              </p>
            </div>

            <div>
              <Label htmlFor="retail_price">Preço Varejo (R$) *</Label>
              <Input
                id="retail_price"
                type="number"
                step="0.01"
                value={retailPrice}
                onChange={(e) => onRetailPriceChange(parseFloat(e.target.value) || 0)}
                placeholder="0.00"
              />
            </div>

            <Separator />

            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Níveis de Atacado</h4>
              
              {priceModel?.tier_2_enabled && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>{priceModel.tier_2_name || 'Atacarejo'} (R$)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={priceTiers.find(t => t.id === 'tier2')?.price || ''}
                      onChange={(e) => handleTierPriceChange('tier2', parseFloat(e.target.value) || 0)}
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <Label>Quantidade Mínima</Label>
                    <Input
                      type="number"
                      value={priceTiers.find(t => t.id === 'tier2')?.minQuantity || 5}
                      onChange={(e) => {
                        const updatedTiers = priceTiers.map(tier =>
                          tier.id === 'tier2' ? { ...tier, minQuantity: parseInt(e.target.value) || 5 } : tier
                        );
                        onPriceTiersChange(updatedTiers);
                      }}
                      placeholder="5"
                    />
                  </div>
                </div>
              )}

              {priceModel?.tier_3_enabled && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>{priceModel.tier_3_name || 'Atacado Pequeno'} (R$)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={priceTiers.find(t => t.id === 'tier3')?.price || ''}
                      onChange={(e) => handleTierPriceChange('tier3', parseFloat(e.target.value) || 0)}
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <Label>Quantidade Mínima</Label>
                    <Input
                      type="number"
                      value={priceTiers.find(t => t.id === 'tier3')?.minQuantity || 10}
                      onChange={(e) => {
                        const updatedTiers = priceTiers.map(tier =>
                          tier.id === 'tier3' ? { ...tier, minQuantity: parseInt(e.target.value) || 10 } : tier
                        );
                        onPriceTiersChange(updatedTiers);
                      }}
                      placeholder="10"
                    />
                  </div>
                </div>
              )}

              {priceModel?.tier_4_enabled && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>{priceModel.tier_4_name || 'Atacado Grande'} (R$)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={priceTiers.find(t => t.id === 'tier4')?.price || ''}
                      onChange={(e) => handleTierPriceChange('tier4', parseFloat(e.target.value) || 0)}
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <Label>Quantidade Mínima</Label>
                    <Input
                      type="number"
                      value={priceTiers.find(t => t.id === 'tier4')?.minQuantity || 20}
                      onChange={(e) => {
                        const updatedTiers = priceTiers.map(tier =>
                          tier.id === 'tier4' ? { ...tier, minQuantity: parseInt(e.target.value) || 20 } : tier
                        );
                        onPriceTiersChange(updatedTiers);
                      }}
                      placeholder="20"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      default:
        return (
          <div>
            <Label htmlFor="retail_price">Preço Varejo (R$) *</Label>
            <Input
              id="retail_price"
              type="number"
              step="0.01"
              value={retailPrice}
              onChange={(e) => onRetailPriceChange(parseFloat(e.target.value) || 0)}
              placeholder="0.00"
            />
          </div>
        );
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Preços Inteligentes
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {renderPriceFields()}
        
        <Separator />
        
        <div>
          <Label htmlFor="stock">Estoque *</Label>
          <Input
            id="stock"
            type="number"
            value={stock}
            onChange={(e) => onStockChange(parseInt(e.target.value) || 0)}
            placeholder="0"
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default IntelligentProductPricingForm;
