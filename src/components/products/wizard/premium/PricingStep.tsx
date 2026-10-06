import React, { useMemo, useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DollarSign, Tag, TrendingDown, Info, Layers, Package, AlertCircle, Plus, Trash2, Scale } from "lucide-react";
import { PremiumWizardFormData } from "@/hooks/usePremiumProductWizard";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { ProductVariation } from "@/types/product";
import { PriceTierItem, validatePriceTiers, normalizePriceTiers } from "@/lib/priceTierDomainService";

interface PricingStepProps {
  formData: PremiumWizardFormData;
  updateFormData: (updates: Partial<PremiumWizardFormData>) => void;
  priceModel?: any;
}

const PricingStep: React.FC<PricingStepProps> = ({ formData, updateFormData, priceModel }) => {
  const modelType = priceModel?.price_model || 'simple_wholesale';
  const isWholesaleOnly = modelType === 'wholesale_only';
  const isRetailOnly = modelType === 'retail_only';

  const priceTiers = formData.price_tiers || [];
  const [isTiersExpanded, setIsTiersExpanded] = useState(priceTiers.length > 0);

  // Validação dinâmica das faixas
  const tierValidation = useMemo(
    () => validatePriceTiers(priceTiers, formData.retail_price, formData.wholesale_price),
    [priceTiers, formData.retail_price, formData.wholesale_price]
  );

  const handleAddTier = () => {
    if (priceTiers.length >= 4) return;
    const nextOrder = priceTiers.length + 1;
    const lastTier = priceTiers[priceTiers.length - 1];
    const nextMinQty = lastTier ? lastTier.min_quantity + 3 : 3;
    const nextPrice = lastTier
      ? Math.max(0, Number((lastTier.price * 0.9).toFixed(2)))
      : formData.wholesale_price && formData.wholesale_price > 0
      ? formData.wholesale_price
      : formData.retail_price && formData.retail_price > 0
      ? Number((formData.retail_price * 0.9).toFixed(2))
      : 0;

    const newTier: PriceTierItem = {
      tier_name: `A partir de ${nextMinQty} un`,
      min_quantity: nextMinQty,
      price: nextPrice,
      tier_order: nextOrder,
      tier_type: "gradual_wholesale",
      is_active: true,
    };

    updateFormData({
      price_tiers: [...priceTiers, newTier],
    });
    setIsTiersExpanded(true);
  };

  const handleUpdateTier = (index: number, updates: Partial<PriceTierItem>) => {
    const updated = priceTiers.map((tier, i) => (i === index ? { ...tier, ...updates } : tier));
    updateFormData({ price_tiers: updated });
  };

  const handleRemoveTier = (index: number) => {
    const filtered = priceTiers.filter((_, i) => i !== index);
    const normalized = normalizePriceTiers(filtered);
    updateFormData({ price_tiers: normalized });
  };

  // Separar variações de grade e variações simples
  const gradeVariations = useMemo(
    () => formData.variations.filter(v => v.is_grade),
    [formData.variations]
  );
  const simpleVariations = useMemo(
    () => formData.variations.filter(v => !v.is_grade),
    [formData.variations]
  );

  const hasVariations = formData.variations.length > 0;
  const hasGrades = gradeVariations.length > 0;

  // Atualizar grade_price de uma variação de grade
  const updateGradePrice = (variationId: string, value: number) => {
    updateFormData({
      variations: formData.variations.map(v =>
        v.id === variationId ? { ...v, grade_price: value } : v
      ),
    });
  };

  // Atualizar price_adjustment de variação simples
  const updateVariationAdjustment = (variationId: string, absolutePrice: number) => {
    const base = isWholesaleOnly
      ? (formData.wholesale_price || 0)
      : (formData.retail_price || 0);
    const adjustment = absolutePrice - base;
    updateFormData({
      variations: formData.variations.map(v =>
        v.id === variationId ? { ...v, price_adjustment: adjustment } : v
      ),
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* ── PREÇOS BASE DO PRODUTO ── */}
      <div>
        <h2 className="text-base font-bold text-slate-900 mb-1 flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-slate-500" />
          Preço Base do Produto
        </h2>
        <p className="text-xs text-slate-500 mb-4">
          {hasGrades
            ? "Defina o preço de referência. O preço de cada grade é configurado individualmente abaixo."
            : "Defina os preços que serão usados na loja."}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Varejo */}
          {!isWholesaleOnly && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-green-100 rounded-lg text-green-600">
                  <Tag className="w-4 h-4" />
                </div>
                <div>
                  <Label className="text-sm font-bold text-slate-900">Varejo</Label>
                  <p className="text-[10px] text-slate-500">Venda unitária ao consumidor final</p>
                </div>
              </div>
              <Card className="border-green-100 bg-green-50/30">
                <CardContent className="p-4">
                  <Label className="text-xs font-semibold text-green-800 mb-2 block">Valor Unitário</Label>
                  <CurrencyInput
                    value={formData.retail_price}
                    onChange={(v) => updateFormData({ retail_price: v })}
                    className="text-xl font-bold h-12 bg-white border-green-200"
                    placeholder="R$ 0,00"
                  />
                </CardContent>
              </Card>
            </div>
          )}

          {/* Atacado */}
          {!isRetailOnly && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-blue-100 rounded-lg text-blue-600">
                  <TrendingDown className="w-4 h-4" />
                </div>
                <div>
                  <Label className="text-sm font-bold text-slate-900">Atacado</Label>
                  <p className="text-[10px] text-slate-500">
                    {hasGrades ? "Preço base (referência para grades)" : "Preço para revendedores e lotes"}
                  </p>
                </div>
              </div>
              <Card className="border-blue-100 bg-blue-50/30">
                <CardContent className="p-4 space-y-3">
                  <div>
                    <Label className="text-xs font-semibold text-blue-800 mb-2 block">
                      {hasGrades ? "Valor Base (Referência)" : "Valor no Atacado"}
                    </Label>
                    <CurrencyInput
                      value={formData.wholesale_price}
                      onChange={(v) => updateFormData({ wholesale_price: v })}
                      className="text-xl font-bold h-12 bg-white border-blue-200"
                      placeholder="R$ 0,00"
                    />
                  </div>
                  {!hasGrades && (
                    <div>
                      <Label className="text-xs font-semibold text-blue-700 mb-1 block">Qtd. Mínima</Label>
                      <div className="relative">
                        <Input
                          type="number"
                          min="1"
                          value={formData.min_wholesale_qty}
                          onChange={(e) => updateFormData({ min_wholesale_qty: parseInt(e.target.value) || 1 })}
                          className="h-10 pl-4 bg-white border-blue-200 font-bold"
                        />
                        <span className="absolute right-3 top-2.5 text-xs text-slate-400 uppercase">Pcs</span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* Dica de margem */}
        {formData.retail_price > 0 && formData.wholesale_price > 0 && (
          <Alert className="mt-4 bg-slate-50 border-slate-200">
            <Info className="w-4 h-4 text-slate-400" />
            <AlertDescription className="text-slate-600 text-xs">
              Diferença Varejo → Atacado:{" "}
              <span className="font-bold text-slate-900">
                R$ {(formData.retail_price - formData.wholesale_price).toFixed(2)}
              </span>{" "}
              por peça (
              <span className="font-bold text-slate-900">
                {((1 - formData.wholesale_price / formData.retail_price) * 100).toFixed(1)}%
              </span>{" "}
              de desconto).
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* ── NÍVEIS DE PREÇO POR QUANTIDADE (ATACAREJO / PROGRESSIVO) ── */}
      <div className="pt-6 border-t border-slate-100">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-amber-100 rounded-lg text-amber-600">
              <Scale className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-slate-900">Faixas de Preço por Quantidade</h2>
                <Badge variant="outline" className="text-[10px] border-amber-300 text-amber-700 bg-amber-50">
                  {priceTiers.length > 0 ? `${priceTiers.length} faixa${priceTiers.length > 1 ? "s" : ""}` : "Atacarejo / Opcional"}
                </Badge>
              </div>
              <p className="text-xs text-slate-500">
                Ofereça descontos automáticos no carrinho conforme a quantidade adquirida (ex: 3+, 6+, 12+ peças).
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsTiersExpanded(!isTiersExpanded)}
            className="text-xs border-slate-200 hover:bg-slate-50"
          >
            {isTiersExpanded ? "Ocultar Faixas" : priceTiers.length > 0 ? "Editar Faixas" : "+ Configurar Faixas"}
          </Button>
        </div>

        {isTiersExpanded && (
          <Card className="border-amber-100 bg-amber-50/20 mt-3">
            <CardContent className="p-4 space-y-4">
              {priceTiers.length === 0 ? (
                <div className="text-center py-5 space-y-2">
                  <p className="text-xs text-slate-600 font-medium">
                    Nenhuma faixa de atacarejo configurada para este produto.
                  </p>
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleAddTier}
                    className="bg-amber-600 hover:bg-amber-700 text-white text-xs"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1.5" />
                    Adicionar Primeira Faixa
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="space-y-2">
                    {priceTiers.map((tier, idx) => {
                      const discount =
                        formData.retail_price > 0 && tier.price > 0
                          ? ((1 - tier.price / formData.retail_price) * 100).toFixed(1)
                          : null;

                      return (
                        <div
                          key={tier.id || idx}
                          className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 bg-white rounded-xl border border-amber-100 shadow-sm"
                        >
                          <div className="flex items-center gap-2 flex-1">
                            <Badge variant="secondary" className="bg-amber-100 text-amber-800 text-[10px] font-bold">
                              Faixa {idx + 1}
                            </Badge>
                            <Input
                              type="text"
                              value={tier.tier_name}
                              onChange={(e) => handleUpdateTier(idx, { tier_name: e.target.value })}
                              placeholder={`Ex: A partir de ${tier.min_quantity} un`}
                              className="h-8 text-xs font-semibold bg-slate-50/50 border-slate-200 flex-1 min-w-[120px]"
                            />
                          </div>

                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1.5">
                              <Label className="text-[11px] font-bold text-slate-600 whitespace-nowrap">Qtd. Mín:</Label>
                              <Input
                                type="number"
                                min="1"
                                value={tier.min_quantity}
                                onChange={(e) => handleUpdateTier(idx, { min_quantity: parseInt(e.target.value) || 1 })}
                                className="h-8 w-20 text-xs font-bold text-center bg-slate-50 border-slate-200"
                              />
                            </div>

                            <div className="flex items-center gap-1.5">
                              <Label className="text-[11px] font-bold text-slate-600 whitespace-nowrap">Preço Un:</Label>
                              <div className="w-28">
                                <CurrencyInput
                                  value={tier.price}
                                  onChange={(v) => handleUpdateTier(idx, { price: v })}
                                  className="h-8 text-xs font-bold bg-white border-amber-200 text-amber-900"
                                  placeholder="R$ 0,00"
                                />
                              </div>
                            </div>

                            {discount && Number(discount) > 0 && (
                              <Badge className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] whitespace-nowrap">
                                -{discount}%
                              </Badge>
                            )}

                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveTier(idx)}
                              className="h-8 w-8 p-0 text-slate-400 hover:text-red-600"
                              title="Remover faixa"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Feedback de Validação */}
                  {!tierValidation.valid && tierValidation.errors.length > 0 && (
                    <Alert className="bg-red-50 border-red-200 py-2">
                      <AlertCircle className="w-4 h-4 text-red-500" />
                      <AlertDescription className="text-red-700 text-xs">
                        {tierValidation.errors.map((err, i) => (
                          <div key={i}>{err}</div>
                        ))}
                      </AlertDescription>
                    </Alert>
                  )}

                  {tierValidation.warnings.length > 0 && (
                    <Alert className="bg-amber-50 border-amber-200 py-2">
                      <Info className="w-4 h-4 text-amber-500" />
                      <AlertDescription className="text-amber-700 text-xs">
                        {tierValidation.warnings.map((warn, i) => (
                          <div key={i}>{warn}</div>
                        ))}
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="flex items-center justify-between pt-2">
                    <p className="text-[11px] text-slate-500">
                      Máximo de 4 faixas permitidas por produto.
                    </p>
                    {priceTiers.length < 4 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleAddTier}
                        className="text-xs border-amber-300 text-amber-800 hover:bg-amber-100"
                      >
                        <Plus className="w-3.5 h-3.5 mr-1" />
                        Adicionar Mais uma Faixa ({priceTiers.length}/4)
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* ── PREÇOS DE GRADE (ajuste individual por grade) ── */}
      {hasGrades && (
        <div className="pt-6 border-t border-slate-100">
          <div className="flex items-center gap-2 mb-1">
            <Layers className="w-4 h-4 text-emerald-600" />
            <h2 className="text-sm font-bold text-slate-900">Preço por Grade</h2>
            <Badge variant="outline" className="text-[10px] border-emerald-300 text-emerald-700 bg-emerald-50">
              {gradeVariations.length} grade{gradeVariations.length > 1 ? "s" : ""}
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mb-4">
            Defina o preço fixo de <strong>cada grade completa</strong>. O sistema calcula automaticamente o valor por par.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {gradeVariations.map((v) => {
              const totalPairs = Array.isArray(v.grade_pairs)
                ? (v.grade_pairs as number[]).reduce((s, p) => s + p, 0)
                : (v.grade_quantity || 0);
              const currentGradePrice = v.grade_price ?? (formData.wholesale_price || 0);
              const pricePerPair = totalPairs > 0 ? currentGradePrice / totalPairs : 0;

              return (
                <Card key={v.id} className="border-emerald-100 bg-emerald-50/20 hover:border-emerald-300 transition-colors">
                  <CardHeader className="p-3 pb-0 flex flex-row items-center justify-between">
                    <div className="flex items-center gap-2">
                      {v.grade_color && (
                        <div
                          className="w-4 h-4 rounded-full border border-white shadow-sm ring-1 ring-slate-200"
                          style={{ backgroundColor: v.grade_color }}
                        />
                      )}
                      <span className="text-xs font-bold text-slate-900">
                        {v.grade_name || v.color || "Grade"}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Package className="w-3 h-3 text-slate-400" />
                      <span className="text-[10px] text-slate-500 font-medium">
                        {totalPairs} par{totalPairs !== 1 ? "es" : ""}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="p-3 pt-2 space-y-2">
                    <div>
                      <Label className="text-[10px] font-semibold text-emerald-800 mb-1 block uppercase tracking-wide">
                        💰 Preço da Grade
                      </Label>
                      <CurrencyInput
                        value={currentGradePrice}
                        onChange={(val) => updateGradePrice(v.id!, val)}
                        className="h-10 text-sm font-bold bg-white border-emerald-200 text-emerald-800"
                        placeholder="R$ 0,00"
                      />
                    </div>
                    {totalPairs > 0 && (
                      <div className="flex items-center justify-between px-2 py-1.5 bg-white rounded-lg border border-emerald-100">
                        <span className="text-[9px] text-slate-500 font-medium uppercase">Amostragem / par</span>
                        <span className="text-xs font-bold text-emerald-700">
                          R$ {pricePerPair.toFixed(2)}
                        </span>
                      </div>
                    )}
                    {/* Mostrar tamanhos da grade */}
                    {Array.isArray(v.grade_sizes) && v.grade_sizes.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {(v.grade_sizes as (string | number)[]).map((sz, i) => (
                          <span
                            key={i}
                            className="px-1.5 py-0.5 bg-emerald-100 text-emerald-700 rounded text-[9px] font-bold"
                          >
                            {sz}
                            {Array.isArray(v.grade_pairs) && v.grade_pairs[i] !== undefined
                              ? `×${v.grade_pairs[i]}`
                              : ""}
                          </span>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* ── AJUSTE DE PREÇO POR VARIAÇÃO SIMPLES ── */}
      {simpleVariations.length > 0 && (
        <div className="pt-6 border-t border-slate-100">
          <div className="flex items-center gap-2 mb-1">
            <Tag className="w-4 h-4 text-violet-600" />
            <h2 className="text-sm font-bold text-slate-900">Ajuste por Variação</h2>
            <Badge variant="outline" className="text-[10px] border-violet-300 text-violet-700 bg-violet-50">
              {simpleVariations.length} variação{simpleVariations.length > 1 ? "ões" : ""}
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mb-4">
            Ajuste o preço de cada variação em relação ao preço base. Deixe igual ao base para sem diferença.
          </p>

          <div className="space-y-2">
            {simpleVariations.map((v) => {
              const base = isWholesaleOnly
                ? (formData.wholesale_price || 0)
                : (formData.retail_price || 0);
              const currentPrice = base + (v.price_adjustment || 0);
              const label = [v.color, v.size].filter(Boolean).join(" / ") || v.sku || "Variação";

              return (
                <div
                  key={v.id}
                  className="flex items-center gap-3 p-3 border border-slate-100 bg-white rounded-xl hover:border-violet-200 transition-colors"
                >
                  {v.hex_color && (
                    <div
                      className="w-6 h-6 rounded-full border border-white shadow ring-1 ring-slate-200 flex-shrink-0"
                      style={{ backgroundColor: v.hex_color }}
                    />
                  )}
                  <span className="text-xs font-semibold text-slate-700 flex-1 truncate">{label}</span>
                  <div className="relative w-28">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-violet-500">R$</span>
                    <Input
                      type="number"
                      step="0.01"
                      value={currentPrice}
                      onChange={(e) => updateVariationAdjustment(v.id!, parseFloat(e.target.value) || 0)}
                      className="pl-6 h-8 text-xs font-bold text-right bg-violet-50/30 border-violet-100 focus:border-violet-300"
                    />
                  </div>
                  {v.price_adjustment !== 0 && (
                    <Badge
                      variant="outline"
                      className={`text-[9px] flex-shrink-0 ${(v.price_adjustment || 0) > 0
                        ? "border-red-200 text-red-600 bg-red-50"
                        : "border-green-200 text-green-600 bg-green-50"
                      }`}
                    >
                      {(v.price_adjustment || 0) > 0 ? "+" : ""}
                      R$ {(v.price_adjustment || 0).toFixed(2)}
                    </Badge>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── AVISO quando não há variações ainda ── */}
      {!hasVariations && (
        <Alert className="bg-amber-50 border-amber-200">
          <AlertCircle className="w-4 h-4 text-amber-500" />
          <AlertDescription className="text-amber-700 text-xs">
            Nenhuma variação cadastrada ainda. O preço base será usado no catálogo.
            Você pode adicionar variações no passo <strong>Oferta</strong> e voltar aqui para ajustar os preços.
          </AlertDescription>
        </Alert>
      )}

      {/* ── ESTOQUE ── */}
      <div className="pt-6 border-t border-slate-100">
        <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
          <Package className="w-4 h-4 text-slate-400" />
          Controle de Estoque
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl border border-slate-200 bg-white flex items-center justify-between shadow-sm">
            <div>
              <Label className="text-xs font-bold text-slate-900">Estoque Inicial Total</Label>
              <p className="text-[10px] text-slate-500 font-medium">Pode ser ajustado por variação</p>
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
              <p className="text-[10px] text-slate-500 font-medium">Notificar ao atingir este valor</p>
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
