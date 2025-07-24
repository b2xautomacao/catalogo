import React, { useState, useEffect } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/hooks/useAuth";
import { useStorePriceModel } from "@/hooks/useStorePriceModel";
import { StorePriceModel } from "@/types/price-models";

interface IntelligentProductPricingFormProps {
  formData: any;
  onFormDataChange: (data: any) => void;
}

const IntelligentProductPricingForm: React.FC<IntelligentProductPricingFormProps> = ({
  formData,
  onFormDataChange,
}) => {
  const { profile } = useAuth();
  const { priceModel, loading: modelLoading } = useStorePriceModel(
    formData.store_id || profile?.store_id || ""
  );

  const { register, setValue, watch } = useFormContext<any>();

  useEffect(() => {
    if (priceModel) {
      // Atualizar valores do formulário com base no modelo de preço
      setValue("simple_wholesale_enabled", priceModel.simple_wholesale_enabled);
      setValue("simple_wholesale_name", priceModel.simple_wholesale_name);
      setValue("simple_wholesale_min_qty", priceModel.simple_wholesale_min_qty);
      setValue("gradual_wholesale_enabled", priceModel.gradual_wholesale_enabled);
      setValue("gradual_tiers_count", priceModel.gradual_tiers_count);
      setValue("tier_1_name", priceModel.tier_1_name);
      setValue("tier_2_name", priceModel.tier_2_name);
      setValue("tier_3_name", priceModel.tier_3_name);
      setValue("tier_4_name", priceModel.tier_4_name);
      setValue("tier_1_enabled", priceModel.tier_1_enabled);
      setValue("tier_2_enabled", priceModel.tier_2_enabled);
      setValue("tier_3_enabled", priceModel.tier_3_enabled);
      setValue("tier_4_enabled", priceModel.tier_4_enabled);
      setValue("show_price_tiers", priceModel.show_price_tiers);
      setValue("show_savings_indicators", priceModel.show_savings_indicators);
      setValue("show_next_tier_hint", priceModel.show_next_tier_hint);
    }
  }, [priceModel, setValue]);

  // Handlers para atualizar o formulário
  const handleSimpleWholesaleToggle = (checked: boolean) => {
    setValue("simple_wholesale_enabled", checked);
    onFormDataChange({ ...formData, simple_wholesale_enabled: checked });
  };

  const handleSimpleWholesaleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setValue("simple_wholesale_name", name);
    onFormDataChange({ ...formData, simple_wholesale_name: name });
  };

  const handleSimpleWholesaleQtyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const qty = parseInt(e.target.value);
    setValue("simple_wholesale_min_qty", qty);
    onFormDataChange({ ...formData, simple_wholesale_min_qty: qty });
  };

  const handleGradualWholesaleToggle = (checked: boolean) => {
    setValue("gradual_wholesale_enabled", checked);
    onFormDataChange({ ...formData, gradual_wholesale_enabled: checked });
  };

  const handleTiersCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const count = parseInt(e.target.value);
    setValue("gradual_tiers_count", count);
    onFormDataChange({ ...formData, gradual_tiers_count: count });
  };

  const handleTierNameChange = (tier: number, name: string) => {
    setValue(`tier_${tier}_name`, name);
    onFormDataChange({ ...formData, [`tier_${tier}_name`]: name });
  };

  const handleTierEnabledToggle = (tier: number, enabled: boolean) => {
    setValue(`tier_${tier}_enabled`, enabled);
    onFormDataChange({ ...formData, [`tier_${tier}_enabled`]: enabled });
  };

  const handleShowPriceTiersToggle = (checked: boolean) => {
    setValue("show_price_tiers", checked);
    onFormDataChange({ ...formData, show_price_tiers: checked });
  };

  const handleShowSavingsIndicatorsToggle = (checked: boolean) => {
    setValue("show_savings_indicators", checked);
    onFormDataChange({ ...formData, show_savings_indicators: checked });
  };

  const handleShowNextTierHintToggle = (checked: boolean) => {
    setValue("show_next_tier_hint", checked);
    onFormDataChange({ ...formData, show_next_tier_hint: checked });
  };

  // Função para renderizar campos de tier
  const renderTierFields = () => {
    if (!priceModel || priceModel.price_model !== "gradual_wholesale") return null;

    const tiersCount = priceModel.gradual_tiers_count || 2;
    const tiers = [];

    for (let i = 1; i <= Math.min(tiersCount, 4); i++) {
      const tierName = `tier_${i}_name` as keyof StorePriceModel;
      const tierEnabled = `tier_${i}_enabled` as keyof StorePriceModel;
      
      tiers.push(
        <div key={i} className="space-y-2">
          <div className="flex items-center gap-2">
            <Switch
              checked={!!watch(tierEnabled)}
              onCheckedChange={(checked) => setValue(tierEnabled, checked)}
            />
            <Label>Nível {i} Ativo</Label>
          </div>
          
          {watch(tierEnabled) && (
            <Input
              {...register(tierName)}
              placeholder={`Nome do Nível ${i}`}
              value={String(watch(tierName) || "")}
            />
          )}
        </div>
      );
    }

    return tiers;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configurações de Preços Inteligentes</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {modelLoading ? (
          <p>Carregando modelo de preços...</p>
        ) : (
          <>
            {/* Atacado Simples */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Switch
                  id="simple_wholesale_enabled"
                  checked={watch("simple_wholesale_enabled")}
                  onCheckedChange={handleSimpleWholesaleToggle}
                />
                <Label htmlFor="simple_wholesale_enabled">Atacado Simples</Label>
              </div>

              {watch("simple_wholesale_enabled") && (
                <div className="space-y-2 pl-4">
                  <div>
                    <Label htmlFor="simple_wholesale_name">Nome do Nível</Label>
                    <Input
                      id="simple_wholesale_name"
                      type="text"
                      value={watch("simple_wholesale_name") || ""}
                      onChange={handleSimpleWholesaleNameChange}
                      placeholder="Atacado"
                    />
                  </div>
                  <div>
                    <Label htmlFor="simple_wholesale_min_qty">Quantidade Mínima</Label>
                    <Input
                      id="simple_wholesale_min_qty"
                      type="number"
                      value={watch("simple_wholesale_min_qty") || ""}
                      onChange={handleSimpleWholesaleQtyChange}
                      placeholder="10"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Atacado Gradual */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Switch
                  id="gradual_wholesale_enabled"
                  checked={watch("gradual_wholesale_enabled")}
                  onCheckedChange={handleGradualWholesaleToggle}
                />
                <Label htmlFor="gradual_wholesale_enabled">Atacado Gradual</Label>
              </div>

              {watch("gradual_wholesale_enabled") && (
                <div className="space-y-2 pl-4">
                  <div>
                    <Label htmlFor="gradual_tiers_count">Número de Níveis</Label>
                    <Input
                      id="gradual_tiers_count"
                      type="number"
                      value={watch("gradual_tiers_count") || ""}
                      onChange={handleTiersCountChange}
                      placeholder="2"
                    />
                  </div>

                  {renderTierFields()}
                </div>
              )}
            </div>

            {/* Configurações de Exibição */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Switch
                  id="show_price_tiers"
                  checked={watch("show_price_tiers")}
                  onCheckedChange={handleShowPriceTiersToggle}
                />
                <Label htmlFor="show_price_tiers">Mostrar Níveis de Preço</Label>
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  id="show_savings_indicators"
                  checked={watch("show_savings_indicators")}
                  onCheckedChange={handleShowSavingsIndicatorsToggle}
                />
                <Label htmlFor="show_savings_indicators">Mostrar Indicadores de Economia</Label>
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  id="show_next_tier_hint"
                  checked={watch("show_next_tier_hint")}
                  onCheckedChange={handleShowNextTierHintToggle}
                />
                <Label htmlFor="show_next_tier_hint">Mostrar Dica do Próximo Nível</Label>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default IntelligentProductPricingForm;
