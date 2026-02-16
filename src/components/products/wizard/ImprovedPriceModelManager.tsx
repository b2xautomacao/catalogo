import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  DollarSign,
  Settings,
  Package,
  TrendingUp,
  Save,
  Loader2,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";
import { QuantityInput } from "@/components/ui/quantity-input";

interface PriceModelConfig {
  id?: string;
  store_id: string;
  price_model: string;
  simple_wholesale_enabled: boolean;
  simple_wholesale_min_qty: number;
  simple_wholesale_name: string;
  simple_wholesale_by_cart_total?: boolean;
  simple_wholesale_cart_min_qty?: number;
  gradual_wholesale_enabled: boolean;
  gradual_tiers_count: number;
  tier_1_enabled: boolean;
  tier_1_name: string;
  tier_2_enabled: boolean;
  tier_2_name: string;
  tier_3_enabled: boolean;
  tier_3_name: string;
  tier_4_enabled: boolean;
  tier_4_name: string;
  show_price_tiers: boolean;
  show_savings_indicators: boolean;
  show_next_tier_hint: boolean;
}

interface ImprovedPriceModelManagerProps {
  storeId: string;
  onConfigurationChange?: (config: PriceModelConfig) => void;
}

const ImprovedPriceModelManager: React.FC<ImprovedPriceModelManagerProps> = ({
  storeId,
  onConfigurationChange,
}) => {
  const [config, setConfig] = useState<PriceModelConfig>({
    store_id: storeId,
    price_model: "retail_only",
    simple_wholesale_enabled: false,
    simple_wholesale_min_qty: 10,
    simple_wholesale_name: "Atacado",
    simple_wholesale_by_cart_total: false,
    simple_wholesale_cart_min_qty: 10,
    gradual_wholesale_enabled: false,
    gradual_tiers_count: 2,
    tier_1_enabled: true,
    tier_1_name: "Varejo",
    tier_2_enabled: false,
    tier_2_name: "Atacarejo",
    tier_3_enabled: false,
    tier_3_name: "Atacado Pequeno",
    tier_4_enabled: false,
    tier_4_name: "Atacado Grande",
    show_price_tiers: true,
    show_savings_indicators: true,
    show_next_tier_hint: true,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const { toast } = useToast();

  console.log("💰 PRICE MODEL MANAGER - Estado:", {
    storeId,
    priceModel: config.price_model,
    loading,
    saving,
  });

  useEffect(() => {
    loadPriceModelConfig();
  }, [storeId]);

  useEffect(() => {
    if (onConfigurationChange) {
      onConfigurationChange(config);
    }
  }, [config, onConfigurationChange]);

  const loadPriceModelConfig = async () => {
    try {
      setLoading(true);
      console.log("📂 Carregando configuração de preços para loja:", storeId);

      const { data, error } = await supabase
        .from("store_price_models")
        .select("*")
        .eq("store_id", storeId)
        .maybeSingle();

      if (error && error.code !== "PGRST116") {
        console.error("❌ Erro ao carregar configuração:", error);
        throw error;
      }

      if (data) {
        console.log("✅ Configuração carregada:", data);
        setConfig((prev) => ({ ...prev, ...data }));
      } else {
        console.log("📋 Nenhuma configuração encontrada, usando padrões");
      }
    } catch (error) {
      console.error("💥 Erro ao carregar configuração de preços:", error);
      toast({
        title: "Erro ao carregar configuração",
        description: "Não foi possível carregar as configurações de preço",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const savePriceModelConfig = async () => {
    try {
      setSaving(true);
      console.log("💾 Salvando configuração de preços:", config);

      const { data, error } = await supabase
        .from("store_price_models")
        .upsert(config, {
          onConflict: "store_id",
        })
        .select()
        .single();

      if (error) {
        console.error("❌ Erro ao salvar:", error);
        throw error;
      }

      console.log("✅ Configuração salva:", data);
      setConfig((prev) => ({ ...prev, ...data }));
      setSaved(true);

      toast({
        title: "Configuração salva!",
        description: "Modelo de preços atualizado com sucesso",
      });

      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error("💥 Erro ao salvar configuração:", error);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar a configuração",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const updateConfig = (updates: Partial<PriceModelConfig>) => {
    setConfig((prev) => ({ ...prev, ...updates }));
  };

  const getPriceModelDescription = () => {
    switch (config.price_model) {
      case "retail_only":
        return "Apenas preço de varejo para todos os clientes";
      case "simple_wholesale":
        if (config.simple_wholesale_by_cart_total) {
          const min = config.simple_wholesale_cart_min_qty ?? 10;
          return `Preço de varejo + atacado quando o carrinho tiver ${min}+ unidades no total`;
        }
        return `Preço de varejo + atacado a partir de ${config.simple_wholesale_min_qty} unidades por produto`;
      case "gradual_wholesale":
        return `Sistema de níveis graduais com ${config.gradual_tiers_count} faixas de preço`;
      default:
        return "Modelo personalizado";
    }
  };

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
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Modelo de Preços
            {saved && (
              <Badge variant="secondary" className="ml-auto">
                <CheckCircle className="h-3 w-3 mr-1" />
                Salvo
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Seleção do modelo de preços */}
          <div className="space-y-4">
            <Label>Tipo de Modelo de Preços</Label>
            <div className="grid gap-4">
              {/* Apenas Varejo */}
              <div
                className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                  config.price_model === "retail_only"
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                }`}
                onClick={() => updateConfig({ price_model: "retail_only" })}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Package className="h-4 w-4" />
                  <span className="font-medium">Apenas Varejo</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Um único preço para todos os clientes. Ideal para lojas que
                  vendem apenas no varejo.
                </p>
              </div>

              {/* Varejo + Atacado Simples */}
              <div
                className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                  config.price_model === "simple_wholesale"
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                }`}
                onClick={() =>
                  updateConfig({ price_model: "simple_wholesale" })
                }
              >
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="h-4 w-4" />
                  <span className="font-medium">Varejo + Atacado</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Preço de varejo + preço de atacado com quantidade mínima.
                  Ideal para lojas mistas.
                </p>
              </div>

              {/* Apenas Atacado */}
              <div
                className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                  config.price_model === "wholesale_only"
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                }`}
                onClick={() => updateConfig({ price_model: "wholesale_only" })}
              >
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="h-4 w-4" />
                  <span className="font-medium">Apenas Atacado</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Venda apenas no atacado, com quantidade mínima obrigatória.
                  Ideal para atacadistas.
                </p>
              </div>

              {/* Atacado Gradual */}
              <div
                className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                  config.price_model === "gradual_wholesale"
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                }`}
                onClick={() =>
                  updateConfig({ price_model: "gradual_wholesale" })
                }
              >
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-4 w-4" />
                  <span className="font-medium">Atacado Gradual</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Múltiplas faixas de preço baseadas na quantidade. Ideal para
                  distribuidores.
                </p>
              </div>
            </div>

            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Modelo atual:</strong> {getPriceModelDescription()}
              </AlertDescription>
            </Alert>
          </div>

          {/* Configurações específicas do Apenas Atacado */}
          {config.price_model === "wholesale_only" && (
            <div className="space-y-4">
              <Label>Configurações do Apenas Atacado</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="wholesale_name">Nome do Atacado</Label>
                  <Input
                    id="wholesale_name"
                    value={config.simple_wholesale_name}
                    onChange={(e) =>
                      updateConfig({ simple_wholesale_name: e.target.value })
                    }
                    placeholder="Ex: Atacado, Distribuidor"
                  />
                </div>
                <div>
                  <Label htmlFor="min_qty">Quantidade Mínima</Label>
                  <QuantityInput
                    value={config.simple_wholesale_min_qty}
                    onChange={(value) =>
                      updateConfig({ simple_wholesale_min_qty: value })
                    }
                    min={1}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Configurações específicas do Atacado Simples */}
          {config.price_model === "simple_wholesale" && (
            <div className="space-y-4">
              <Label>Configurações do Atacado Simples</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="wholesale_name">Nome do Atacado</Label>
                  <Input
                    id="wholesale_name"
                    value={config.simple_wholesale_name}
                    onChange={(e) =>
                      updateConfig({ simple_wholesale_name: e.target.value })
                    }
                    placeholder="Ex: Atacado, Bulk, Varejo"
                  />
                </div>
                <div>
                  <Label htmlFor="min_qty">Quantidade Mínima (por produto)</Label>
                  <QuantityInput
                    value={config.simple_wholesale_min_qty}
                    onChange={(value) =>
                      updateConfig({ simple_wholesale_min_qty: value })
                    }
                    min={1}
                  />
                </div>
              </div>
              <div className="flex items-center justify-between rounded-lg border p-4 bg-muted/30">
                <div className="space-y-0.5">
                  <Label>Atacado por quantidade total do carrinho</Label>
                  <p className="text-sm text-muted-foreground">
                    Quando ativado, o atacado é aplicado a todos os itens da loja que tenham preço de atacado, desde que o total de unidades no carrinho atinja o mínimo.
                  </p>
                </div>
                <Switch
                  checked={config.simple_wholesale_by_cart_total === true}
                  onCheckedChange={(checked) =>
                    updateConfig({ simple_wholesale_by_cart_total: checked })
                  }
                />
              </div>
              {config.simple_wholesale_by_cart_total && (
                <div className="max-w-xs">
                  <Label htmlFor="cart_min_qty">Quantidade mínima total (unidades no carrinho)</Label>
                  <QuantityInput
                    id="cart_min_qty"
                    value={config.simple_wholesale_cart_min_qty ?? 10}
                    onChange={(value) =>
                      updateConfig({
                        simple_wholesale_cart_min_qty: Math.max(1, value),
                      })
                    }
                    min={1}
                  />
                </div>
              )}
            </div>
          )}

          {/* Configurações específicas do Atacado Gradual */}
          {config.price_model === "gradual_wholesale" && (
            <div className="space-y-4">
              <Label>Configurações do Atacado Gradual</Label>

              <div className="space-y-3">
                {[1, 2, 3, 4].map((tier) => {
                  const tierKey = `tier_${tier}` as keyof PriceModelConfig;
                  const tierNameKey =
                    `tier_${tier}_name` as keyof PriceModelConfig;
                  const tierEnabledKey =
                    `tier_${tier}_enabled` as keyof PriceModelConfig;

                  return (
                    <div
                      key={tier}
                      className="flex items-center gap-4 p-3 border rounded-lg"
                    >
                      <Switch
                        checked={config[tierEnabledKey] as boolean}
                        onCheckedChange={(checked) =>
                          updateConfig({ [tierEnabledKey]: checked })
                        }
                      />

                      <div className="flex-1">
                        <Label>Nível {tier}</Label>
                        <Input
                          value={config[tierNameKey] as string}
                          onChange={(e) =>
                            updateConfig({ [tierNameKey]: e.target.value })
                          }
                          placeholder={`Nome do nível ${tier}`}
                          disabled={!(config[tierEnabledKey] as boolean)}
                        />
                      </div>

                      <Badge
                        variant={
                          config[tierEnabledKey] ? "default" : "secondary"
                        }
                      >
                        {config[tierEnabledKey] ? "Ativo" : "Inativo"}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <Separator />

          {/* Configurações de Exibição */}
          <div className="space-y-4">
            <Label>Configurações de Exibição</Label>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Mostrar tabela de preços</Label>
                  <p className="text-sm text-muted-foreground">
                    Exibir tabela comparativa de preços no catálogo
                  </p>
                </div>
                <Switch
                  checked={config.show_price_tiers}
                  onCheckedChange={(checked) =>
                    updateConfig({ show_price_tiers: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Indicadores de economia</Label>
                  <p className="text-sm text-muted-foreground">
                    Mostrar quanto o cliente economiza em compras maiores
                  </p>
                </div>
                <Switch
                  checked={config.show_savings_indicators}
                  onCheckedChange={(checked) =>
                    updateConfig({ show_savings_indicators: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Dicas de próximo nível</Label>
                  <p className="text-sm text-muted-foreground">
                    Sugerir quantidades para atingir preços melhores
                  </p>
                </div>
                <Switch
                  checked={config.show_next_tier_hint}
                  onCheckedChange={(checked) =>
                    updateConfig({ show_next_tier_hint: checked })
                  }
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Botão de Salvar */}
          <div className="flex justify-end">
            <Button
              onClick={savePriceModelConfig}
              disabled={saving}
              className="min-w-32"
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
    </div>
  );
};

export default ImprovedPriceModelManager;
