import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  Store,
  DollarSign,
  TrendingUp,
  Save,
  Loader2,
  CheckCircle,
  Info,
} from "lucide-react";

interface PricingMode {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  preview: string;
  config: any;
}

interface SimplePricingConfigProps {
  storeId: string;
  onConfigChange?: (config: any) => void;
  onUnsavedChanges?: (hasChanges: boolean) => void; // 🎯 NOVO: Notificar mudanças pendentes
}

const SimplePricingConfig: React.FC<SimplePricingConfigProps> = ({
  storeId,
  onConfigChange,
  onUnsavedChanges, // 🎯 NOVO: Callback para mudanças pendentes
}) => {
  const [selectedMode, setSelectedMode] = useState<string>("retail_only");
  const [originalMode, setOriginalMode] = useState<string>("retail_only");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  // Atacado por quantidade total do carrinho (apenas para simple_wholesale)
  const [simpleWholesaleByCartTotal, setSimpleWholesaleByCartTotal] = useState(false);
  const [simpleWholesaleCartMinQty, setSimpleWholesaleCartMinQty] = useState(10);
  const [originalByCartTotal, setOriginalByCartTotal] = useState(false);
  const [originalCartMinQty, setOriginalCartMinQty] = useState(10);
  const { toast } = useToast();

  const pricingModes: PricingMode[] = [
    {
      id: "retail_only",
      name: "Apenas Varejo",
      description:
        "Um único preço para todos os produtos. Ideal para lojas focadas no varejo.",
      icon: <Store className="h-5 w-5" />,
      preview: "Produtos com preço único • Simples e direto",
      config: {
        price_model: "retail_only",
        simple_wholesale_enabled: false,
        gradual_wholesale_enabled: false,
        show_price_tiers: false,
      },
    },
    {
      id: "simple_wholesale",
      name: "Varejo + Atacado",
      description:
        "Dois preços: varejo e atacado com quantidade mínima. Perfeito para lojas mistas.",
      icon: <DollarSign className="h-5 w-5" />,
      preview: "Preço varejo • Preço atacado a partir de X unidades",
      config: {
        price_model: "simple_wholesale",
        simple_wholesale_enabled: true,
        simple_wholesale_min_qty: 10,
        simple_wholesale_name: "Atacado",
        gradual_wholesale_enabled: false,
        show_price_tiers: true,
        show_savings_indicators: true,
      },
    },
    {
      id: "wholesale_only",
      name: "Apenas Atacado",
      description:
        "Venda apenas no atacado, com quantidade mínima obrigatória. Ideal para atacadistas.",
      icon: <DollarSign className="h-5 w-5" />,
      preview: "Preço único de atacado • Quantidade mínima obrigatória",
      config: {
        price_model: "wholesale_only",
        simple_wholesale_enabled: true,
        simple_wholesale_min_qty: 10,
        simple_wholesale_name: "Atacado",
        gradual_wholesale_enabled: false,
        show_price_tiers: false,
        show_savings_indicators: false,
      },
    },
    {
      id: "gradual_wholesale",
      name: "Preços Graduais",
      description:
        "Múltiplos níveis de preço baseados na quantidade. Ideal para distribuidores.",
      icon: <TrendingUp className="h-5 w-5" />,
      preview: "Varejo • Atacarejo • Atacado • Distribuidor",
      config: {
        price_model: "gradual_wholesale",
        gradual_wholesale_enabled: true,
        gradual_tiers_count: 4,
        tier_1_enabled: true,
        tier_1_name: "Varejo",
        tier_2_enabled: true,
        tier_2_name: "Atacarejo",
        tier_3_enabled: true,
        tier_3_name: "Atacado",
        tier_4_enabled: true,
        tier_4_name: "Distribuidor",
        show_price_tiers: true,
        show_savings_indicators: true,
        show_next_tier_hint: true,
      },
    },
  ];

  useEffect(() => {
    loadCurrentConfig();
  }, [storeId]);

  const loadCurrentConfig = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from("store_price_models")
        .select("*")
        .eq("store_id", storeId)
        .maybeSingle();

      if (error && error.code !== "PGRST116") {
        throw error;
      }

      if (data) {
        setSelectedMode(data.price_model || "retail_only");
        setOriginalMode(data.price_model || "retail_only");
        const byCart = data.simple_wholesale_by_cart_total === true;
        const cartMin = typeof data.simple_wholesale_cart_min_qty === "number" ? data.simple_wholesale_cart_min_qty : 10;
        setSimpleWholesaleByCartTotal(byCart);
        setSimpleWholesaleCartMinQty(cartMin);
        setOriginalByCartTotal(byCart);
        setOriginalCartMinQty(cartMin);
      } else {
        setSelectedMode("retail_only");
        setOriginalMode("retail_only");
      }
    } catch (error) {
      console.error("Erro ao carregar configuração:", error);
      toast({
        title: "Erro ao carregar",
        description: "Não foi possível carregar a configuração atual",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const saveConfiguration = async () => {
    try {
      setSaving(true);

      const selectedModeConfig = pricingModes.find(
        (mode) => mode.id === selectedMode
      );
      if (!selectedModeConfig) return;

      const configToSave: Record<string, unknown> = {
        store_id: storeId,
        ...selectedModeConfig.config,
      };
      if (selectedMode === "simple_wholesale") {
        configToSave.simple_wholesale_by_cart_total = simpleWholesaleByCartTotal;
        configToSave.simple_wholesale_cart_min_qty = simpleWholesaleCartMinQty;
      }

      const { error } = await supabase
        .from("store_price_models")
        .upsert(configToSave, {
          onConflict: "store_id",
        });

      if (error) throw error;

      setSaved(true);
      toast({
        title: "Configuração salva!",
        description: "Modelo de preços configurado com sucesso",
      });

      if (onConfigChange) {
        onConfigChange(configToSave);
      }

      setOriginalMode(selectedMode);
      if (selectedMode === "simple_wholesale") {
        setOriginalByCartTotal(simpleWholesaleByCartTotal);
        setOriginalCartMinQty(simpleWholesaleCartMinQty);
      }
      setHasUnsavedChanges(false);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error("Erro ao salvar:", error);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar a configuração",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    const modeChanged = selectedMode !== originalMode;
    const simpleExtraChanged =
      selectedMode === "simple_wholesale" &&
      (simpleWholesaleByCartTotal !== originalByCartTotal ||
        simpleWholesaleCartMinQty !== originalCartMinQty);
    const hasChanges = modeChanged || simpleExtraChanged;
    setHasUnsavedChanges(hasChanges);
    if (onUnsavedChanges) onUnsavedChanges(hasChanges);
  }, [
    selectedMode,
    originalMode,
    simpleWholesaleByCartTotal,
    simpleWholesaleCartMinQty,
    originalByCartTotal,
    originalCartMinQty,
    onUnsavedChanges,
  ]);

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin mr-2" />
          <span>Carregando configurações...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Modelo de Preços
            </span>
            {saved && (
              <Badge variant="secondary" className="ml-auto">
                <CheckCircle className="h-3 w-3 mr-1" />
                Salvo
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 🎯 NOVO: Indicador de mudanças não salvas */}
          {hasUnsavedChanges && (
            <Alert className="border-orange-200 bg-orange-50">
              <Info className="h-4 w-4 text-orange-600" />
              <AlertDescription className="text-orange-800">
                <strong>Atenção:</strong> Você tem alterações não salvas. Clique
                em "Salvar Configuração" para aplicar as mudanças.
              </AlertDescription>
            </Alert>
          )}

          {/* Status de salvamento */}
          {saved && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Configuração salva com sucesso!
              </AlertDescription>
            </Alert>
          )}

          {/* Modos de Preço */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">
              Selecione o Modelo de Preços
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pricingModes.map((mode) => (
                <div
                  key={mode.id}
                  className={`border rounded-lg p-4 cursor-pointer transition-all ${
                    selectedMode === mode.id
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                  onClick={() => setSelectedMode(mode.id)}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 text-blue-600 mt-1">
                      {mode.icon}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-lg">{mode.name}</h3>
                        {selectedMode === mode.id && (
                          <Badge variant="default" className="text-xs">
                            Selecionado
                          </Badge>
                        )}
                      </div>

                      <p className="text-gray-600 text-sm mb-3">
                        {mode.description}
                      </p>

                      <div className="text-xs text-gray-500 bg-gray-50 px-3 py-2 rounded">
                        <strong>Preview:</strong> {mode.preview}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Atacado por quantidade total do carrinho (apenas para Varejo + Atacado) */}
          {selectedMode === "simple_wholesale" && (
            <div className="space-y-4 rounded-lg border p-4 bg-gray-50/50">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Atacado por quantidade total do carrinho</Label>
                  <p className="text-sm text-muted-foreground">
                    Quando ativado, o preço de atacado é aplicado a todos os produtos do carrinho que tenham preço de atacado, desde que o total de unidades no carrinho atinja o mínimo (ex.: 3 un. do produto A + 7 un. do produto B = 10 un. → todos com preço atacado).
                  </p>
                </div>
                <Switch
                  checked={simpleWholesaleByCartTotal}
                  onCheckedChange={setSimpleWholesaleByCartTotal}
                />
              </div>
              {simpleWholesaleByCartTotal && (
                <div className="max-w-xs">
                  <Label htmlFor="simple_wholesale_cart_min_qty">
                    Quantidade mínima total (unidades no carrinho)
                  </Label>
                  <Input
                    id="simple_wholesale_cart_min_qty"
                    type="number"
                    min={1}
                    value={simpleWholesaleCartMinQty}
                    onChange={(e) =>
                      setSimpleWholesaleCartMinQty(
                        Math.max(1, parseInt(e.target.value, 10) || 10)
                      )
                    }
                  />
                </div>
              )}
            </div>
          )}

          {/* Informações sobre o modo selecionado */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>Modelo selecionado:</strong>{" "}
              {pricingModes.find((m) => m.id === selectedMode)?.name}
              <br />
              {pricingModes.find((m) => m.id === selectedMode)?.description}
            </AlertDescription>
          </Alert>

          {/* 🎯 MELHORADO: Botão de Salvar com indicador de mudanças */}
          <div className="flex justify-between items-center pt-4 border-t">
            <div className="text-sm text-gray-600">
              {hasUnsavedChanges ? (
                <span className="text-orange-600 font-medium">
                  ● Alterações não salvas
                </span>
              ) : (
                <span className="text-green-600">
                  ✓ Todas as alterações salvas
                </span>
              )}
            </div>

            <Button
              onClick={saveConfiguration}
              disabled={saving || !hasUnsavedChanges}
              className={`min-w-32 ${
                hasUnsavedChanges
                  ? "bg-orange-600 hover:bg-orange-700"
                  : "bg-green-600 hover:bg-green-700"
              }`}
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : saved ? (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Salvo!
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Salvar Configuração
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Dicas de uso */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">💡 Dicas importantes</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="text-sm text-gray-600 space-y-2">
            <li>
              • <strong>Apenas Varejo:</strong> Para lojas que vendem só no
              varejo com preço único
            </li>
            <li>
              • <strong>Varejo + Atacado:</strong> Para lojas que vendem nos
              dois mercados com quantidade mínima
            </li>
            <li>
              • <strong>Preços Graduais:</strong> Para distribuidores com
              múltiplos níveis de desconto
            </li>
            <li>
              • <strong>Configuração automática:</strong> Todos os produtos
              seguirão este modelo
            </li>
            <li>
              • <strong>Alteração a qualquer momento:</strong> Você pode mudar
              quando quiser
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default SimplePricingConfig;
