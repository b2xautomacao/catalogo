import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { DollarSign, Tag, TrendingDown, Info } from "lucide-react";
import { PremiumWizardFormData } from "@/hooks/usePremiumProductWizard";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface PricingStepProps {
  formData: PremiumWizardFormData;
  updateFormData: (updates: Partial<PremiumWizardFormData>) => void;
  priceModel?: any;
}

const PricingStep: React.FC<PricingStepProps> = ({ formData, updateFormData, priceModel }) => {
  const modelType = priceModel?.price_model || 'simple_wholesale';

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Varejo */}
        {(modelType !== 'wholesale_only') && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg text-green-600">
                <Tag className="w-5 h-5" />
              </div>
              <div>
                <Label className="text-lg font-bold text-slate-900">Varejo</Label>
                <p className="text-xs text-slate-500 font-medium">Preço para venda individual</p>
              </div>
            </div>
            
            <Card className="border-green-100 bg-green-50/20">
              <CardContent className="p-6">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-green-800">Valor Unitário</Label>
                  <CurrencyInput
                    value={formData.retail_price}
                    onChange={(v) => updateFormData({ retail_price: v })}
                    className="text-2xl font-bold h-14 bg-white border-green-200"
                    placeholder="R$ 0,00"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Atacado */}
        {(modelType !== 'retail_only') && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                <TrendingDown className="w-5 h-5" />
              </div>
              <div>
                <Label className="text-lg font-bold text-slate-900">Atacado</Label>
                <p className="text-xs text-slate-500 font-medium">Preço para revendedores e lotes</p>
              </div>
            </div>

            <Card className="border-blue-100 bg-blue-50/20">
              <CardContent className="p-6 space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-blue-800">Valor no Atacado</Label>
                  <CurrencyInput
                    value={formData.wholesale_price}
                    onChange={(v) => updateFormData({ wholesale_price: v })}
                    className="text-2xl font-bold h-14 bg-white border-blue-200"
                    placeholder="R$ 0,00"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-blue-700">Quantidade Mínima</Label>
                  <div className="relative">
                    <Input
                      type="number"
                      min="1"
                      value={formData.min_wholesale_qty}
                      onChange={(e) => updateFormData({ min_wholesale_qty: parseInt(e.target.value) || 1 })}
                      className="h-10 pl-4 bg-white border-blue-200 font-bold"
                    />
                    <span className="absolute right-4 top-2.5 text-xs text-slate-400 uppercase">Peças</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Dica de Lucratividade */}
      {formData.retail_price > 0 && formData.wholesale_price > 0 && (
        <Alert className="bg-slate-50 border-slate-200">
          <Info className="w-4 h-4 text-slate-500" />
          <AlertDescription className="text-slate-600 text-xs">
            A diferença entre Varejo e Atacado é de 
            <span className="font-bold text-slate-900 mx-1">
              R$ {(formData.retail_price - formData.wholesale_price).toFixed(2)}
            </span> 
            por peça (
            <span className="font-bold text-slate-900">
              {((1 - formData.wholesale_price / formData.retail_price) * 100).toFixed(1)}%
            </span> 
            de desconto).
          </AlertDescription>
        </Alert>
      )}

      {/* Estoque e Alerta */}
      <div className="pt-6 border-t border-slate-100">
        <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
           <DollarSign className="w-4 h-4 text-slate-400" />
           Controle de Estoque e Regras
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border border-slate-200 bg-white flex items-center justify-between shadow-sm">
              <div>
                 <Label className="text-xs font-bold text-slate-900">Estoque Inicial Total</Label>
                 <p className="text-[10px] text-slate-500 font-medium">Pode ser ajustado por variação depois</p>
              </div>
              <Input
                type="number"
                value={formData.stock}
                onChange={(e) => updateFormData({ stock: parseInt(e.target.value) || 0 })}
                className="w-24 text-center font-bold bg-slate-50"
              />
           </div>

           <div className="p-4 rounded-xl border border-slate-200 bg-white flex items-center justify-between shadow-sm">
              <div>
                 <Label className="text-xs font-bold text-slate-900">Alerta de Estoque Baixo</Label>
                 <p className="text-[10px] text-slate-500 font-medium">Notificar quando atingir este valor</p>
              </div>
              <Input
                type="number"
                value={formData.stock_alert_threshold}
                onChange={(e) => updateFormData({ stock_alert_threshold: parseInt(e.target.value) || 5 })}
                className="w-20 text-center font-bold bg-slate-50"
              />
           </div>
        </div>
      </div>
    </div>
  );
};

export default PricingStep;
