
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { DollarSign, Package, Settings } from 'lucide-react';
import { CurrencyInput } from '@/components/ui/currency-input';
import { QuantityInput } from '@/components/ui/quantity-input';
import { useStores } from '@/hooks/useStores';
import { supabase } from '@/integrations/supabase/client';

interface PriceTier {
  id: string;
  name: string;
  minQuantity: number;
  price: number;
  enabled: boolean;
}

interface PriceModel {
  price_model: string;
  simple_wholesale_enabled: boolean;
  simple_wholesale_min_qty: number;
  simple_wholesale_name: string;
  gradual_wholesale_enabled: boolean;
  tier_1_enabled: boolean;
  tier_1_name: string;
  tier_2_enabled: boolean;
  tier_2_name: string;
  tier_3_enabled: boolean;
  tier_3_name: string;
  tier_4_enabled: boolean;
  tier_4_name: string;
}

interface ImprovedProductPricingFormProps {
  retailPrice: number;
  wholesalePrice?: number;
  minWholesaleQty?: number;
  stock: number;
  priceTiers: PriceTier[];
  onRetailPriceChange: (price: number) => void;
  onWholesalePriceChange: (price: number | undefined) => void;
  onMinWholesaleQtyChange: (qty: number) => void;
  onStockChange: (stock: number) => void;
  onPriceTiersChange: (tiers: PriceTier[]) => void;
}

const ImprovedProductPricingForm: React.FC<ImprovedProductPricingFormProps> = ({
  retailPrice,
  wholesalePrice,
  minWholesaleQty = 1,
  stock,
  priceTiers,
  onRetailPriceChange,
  onWholesalePriceChange,
  onMinWholesaleQtyChange,
  onStockChange,
  onPriceTiersChange,
}) => {
  const { currentStore } = useStores();
  const [priceModel, setPriceModel] = useState<PriceModel | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPriceModel = async () => {
      if (!currentStore?.id) return;
      
      try {
        const { data, error } = await supabase
          .from('store_price_models')
          .select('*')
          .eq('store_id', currentStore.id)
          .maybeSingle();

        if (error) throw error;
        
        if (data) {
          setPriceModel(data);
          // Inicializar price tiers baseado no modelo
          initializePriceTiers(data);
        }
      } catch (error) {
        console.error('Erro ao carregar modelo de preços:', error);
      } finally {
        setLoading(false);
      }
    };

    loadPriceModel();
  }, [currentStore?.id]);

  const initializePriceTiers = (model: PriceModel) => {
    if (priceTiers.length > 0) return; // Já tem tiers

    const newTiers: PriceTier[] = [];

    if (model.gradual_wholesale_enabled) {
      if (model.tier_1_enabled) {
        newTiers.push({
          id: 'tier_1',
          name: model.tier_1_name,
          minQuantity: 1,
          price: retailPrice,
          enabled: true
        });
      }
      if (model.tier_2_enabled) {
        newTiers.push({
          id: 'tier_2',
          name: model.tier_2_name,
          minQuantity: 10,
          price: retailPrice * 0.9,
          enabled: true
        });
      }
      if (model.tier_3_enabled) {
        newTiers.push({
          id: 'tier_3',
          name: model.tier_3_name,
          minQuantity: 50,
          price: retailPrice * 0.8,
          enabled: true
        });
      }
      if (model.tier_4_enabled) {
        newTiers.push({
          id: 'tier_4',
          name: model.tier_4_name,
          minQuantity: 100,
          price: retailPrice * 0.7,
          enabled: true
        });
      }
    }

    if (newTiers.length > 0) {
      onPriceTiersChange(newTiers);
    }
  };

  const updateTierPrice = (tierId: string, price: number) => {
    const updatedTiers = priceTiers.map(tier =>
      tier.id === tierId ? { ...tier, price } : tier
    );
    onPriceTiersChange(updatedTiers);
  };

  const updateTierQuantity = (tierId: string, minQuantity: number) => {
    const updatedTiers = priceTiers.map(tier =>
      tier.id === tierId ? { ...tier, minQuantity } : tier
    );
    onPriceTiersChange(updatedTiers);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Preços Principais
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="retail_price">Preço Base (Varejo) *</Label>
              <CurrencyInput
                id="retail_price"
                value={retailPrice}
                onChange={onRetailPriceChange}
              />
            </div>

            <div>
              <Label htmlFor="stock">Estoque Disponível *</Label>
              <QuantityInput
                id="stock"
                value={stock}
                onChange={onStockChange}
                min={0}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Preços Graduais */}
      {priceModel?.gradual_wholesale_enabled && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Preços por Quantidade
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {priceTiers.map((tier) => (
              <div key={tier.id} className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border rounded-lg">
                <div>
                  <Label className="font-medium">{tier.name}</Label>
                  <p className="text-sm text-gray-500">
                    A partir de {tier.minQuantity} unidades
                  </p>
                </div>
                <div>
                  <Label>Quantidade Mínima</Label>
                  <QuantityInput
                    value={tier.minQuantity}
                    onChange={(qty) => updateTierQuantity(tier.id, qty)}
                    min={1}
                  />
                </div>
                <div>
                  <Label>Preço por Unidade</Label>
                  <CurrencyInput
                    value={tier.price}
                    onChange={(price) => updateTierPrice(tier.id, price)}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Atacado Simples */}
      {priceModel?.simple_wholesale_enabled && !priceModel?.gradual_wholesale_enabled && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              {priceModel.simple_wholesale_name}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="wholesale_price">Preço de {priceModel.simple_wholesale_name}</Label>
                <CurrencyInput
                  id="wholesale_price"
                  value={wholesalePrice || 0}
                  onChange={(value) => onWholesalePriceChange(value > 0 ? value : undefined)}
                />
              </div>

              <div>
                <Label htmlFor="min_wholesale_qty">Quantidade Mínima</Label>
                <QuantityInput
                  id="min_wholesale_qty"
                  value={minWholesaleQty}
                  onChange={onMinWholesaleQtyChange}
                  min={1}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Resumo de Preços */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Resumo de Preços
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="font-medium text-blue-900">Preço Base</div>
              <div className="text-xl font-bold text-blue-600">
                {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL'
                }).format(retailPrice)}
              </div>
            </div>

            {priceTiers.map((tier) => (
              <div key={tier.id} className="bg-green-50 p-3 rounded-lg">
                <div className="font-medium text-green-900">{tier.name}</div>
                <div className="text-xl font-bold text-green-600">
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL'
                  }).format(tier.price)}
                </div>
                <div className="text-xs text-green-700">
                  Mín. {tier.minQuantity} unidades
                </div>
              </div>
            ))}

            {wholesalePrice && (
              <div className="bg-green-50 p-3 rounded-lg">
                <div className="font-medium text-green-900">{priceModel?.simple_wholesale_name || 'Atacado'}</div>
                <div className="text-xl font-bold text-green-600">
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL'
                  }).format(wholesalePrice)}
                </div>
                <div className="text-xs text-green-700">
                  Mín. {minWholesaleQty} unidades
                </div>
              </div>
            )}

            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="font-medium text-gray-900">Estoque</div>
              <div className="text-xl font-bold text-gray-600">
                {stock} unidades
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ImprovedProductPricingForm;
