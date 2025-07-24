
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { WizardFormData } from '@/hooks/useImprovedProductFormWizard';
import { useStorePriceModel } from '@/hooks/useStorePriceModel';
import { useAuth } from '@/hooks/useAuth';

interface PricingStepProps {
  formData: WizardFormData;
  updateFormData: (updates: Partial<WizardFormData>) => void;
}

const PricingStep: React.FC<PricingStepProps> = ({ formData, updateFormData }) => {
  const { profile } = useAuth();
  const { priceModel } = useStorePriceModel(profile?.store_id);

  const supportsWholesale = priceModel?.price_model !== 'retail_only';

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Preços e Estoque</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              Preço de Varejo
              <Badge variant="destructive" className="text-xs">Obrigatório</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="retailPrice">Preço de Varejo (R$) *</Label>
              <Input
                id="retailPrice"
                type="number"
                step="0.01"
                min="0"
                value={formData.retail_price || ''}
                onChange={(e) => updateFormData({ retail_price: parseFloat(e.target.value) || 0 })}
                placeholder="0,00"
                className={`${!formData.retail_price || formData.retail_price <= 0 ? 'border-red-300' : ''}`}
              />
              {(!formData.retail_price || formData.retail_price <= 0) && (
                <p className="text-xs text-red-500">Preço de varejo é obrigatório</p>
              )}
            </div>
          </CardContent>
        </Card>

        {supportsWholesale && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Preço de Atacado</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="wholesalePrice">Preço de Atacado (R$)</Label>
                <Input
                  id="wholesalePrice"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.wholesale_price || ''}
                  onChange={(e) => updateFormData({ wholesale_price: parseFloat(e.target.value) || undefined })}
                  placeholder="0,00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="minWholesaleQty">Quantidade Mínima Atacado</Label>
                <Input
                  id="minWholesaleQty"
                  type="number"
                  min="1"
                  value={formData.min_wholesale_qty || 1}
                  onChange={(e) => updateFormData({ min_wholesale_qty: parseInt(e.target.value) || 1 })}
                  placeholder="1"
                />
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Controle de Estoque</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="stock">Estoque Inicial</Label>
              <Input
                id="stock"
                type="number"
                min="0"
                value={formData.stock || 0}
                onChange={(e) => updateFormData({ stock: parseInt(e.target.value) || 0 })}
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="stockAlert">Alerta de Estoque Baixo</Label>
              <Input
                id="stockAlert"
                type="number"
                min="0"
                value={formData.stock_alert_threshold || 5}
                onChange={(e) => updateFormData({ stock_alert_threshold: parseInt(e.target.value) || 5 })}
                placeholder="5"
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>Permitir Estoque Negativo</Label>
              <p className="text-xs text-muted-foreground">
                Permite vender mesmo sem estoque disponível
              </p>
            </div>
            <Switch
              checked={formData.allow_negative_stock || false}
              onCheckedChange={(checked) => updateFormData({ allow_negative_stock: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>Produto em Destaque</Label>
              <p className="text-xs text-muted-foreground">
                Aparecerá na seção de produtos em destaque
              </p>
            </div>
            <Switch
              checked={formData.is_featured || false}
              onCheckedChange={(checked) => updateFormData({ is_featured: checked })}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PricingStep;
