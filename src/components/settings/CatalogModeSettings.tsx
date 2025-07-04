import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useCatalogSettings } from "@/hooks/useCatalogSettings";
import { useToast } from "@/hooks/use-toast";
import {
  Store,
  ArrowLeftRight,
  ToggleLeft,
  ShoppingCart,
  Package,
  Zap,
  Users,
  TrendingUp,
} from "lucide-react";
import { useStorePriceModel } from "@/hooks/useStorePriceModel";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";

const CatalogModeSettings = () => {
  const { settings, updateSettings } = useCatalogSettings();
  const { toast } = useToast();
  const {
    priceModel,
    changePriceModel,
    updatePriceModel,
    loading: loadingPriceModel,
  } = useStorePriceModel(settings?.store_id);

  // Estado local para seleção do modelo de atacado e níveis
  const [selectedWholesale, setSelectedWholesale] = React.useState<string>(
    priceModel?.price_model || "simple_wholesale"
  );
  const [localTiers, setLocalTiers] = React.useState([
    { key: 2, label: "Atacarejo", enabled: priceModel?.tier_2_enabled ?? true },
    {
      key: 3,
      label: "Atacado Pequeno",
      enabled: priceModel?.tier_3_enabled ?? true,
    },
    {
      key: 4,
      label: "Atacado Grande",
      enabled: priceModel?.tier_4_enabled ?? true,
    },
  ]);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (priceModel) {
      setSelectedWholesale(priceModel.price_model);
      setLocalTiers([
        {
          key: 2,
          label: priceModel.tier_2_name || "Atacarejo",
          enabled: priceModel.tier_2_enabled,
        },
        {
          key: 3,
          label: priceModel.tier_3_name || "Atacado Pequeno",
          enabled: priceModel.tier_3_enabled,
        },
        {
          key: 4,
          label: priceModel.tier_4_name || "Atacado Grande",
          enabled: priceModel.tier_4_enabled,
        },
      ]);
    }
  }, [priceModel]);

  const handleSaveWholesale = async () => {
    setSaving(true);
    try {
      await changePriceModel(selectedWholesale);
      if (selectedWholesale === "gradual_wholesale") {
        await updatePriceModel({
          tier_2_enabled: localTiers[0].enabled,
          tier_3_enabled: localTiers[1].enabled,
          tier_4_enabled: localTiers[2].enabled,
        });
      }
      toast({
        title: "Configuração de atacado salva!",
        description: "Modelo de preço atualizado com sucesso.",
      });
    } catch (e) {
      toast({
        title: "Erro ao salvar modelo de preço",
        description: "Tente novamente.",
        variant: "destructive",
      });
    }
    setSaving(false);
  };

  const handleModeChange = async (
    newMode: "separated" | "hybrid" | "toggle"
  ) => {
    try {
      const { error } = await updateSettings({ catalog_mode: newMode });

      if (error) {
        toast({
          title: "Erro ao atualizar configuração",
          description: "Tente novamente em alguns instantes",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Modo de catálogo atualizado",
        description: `Modo ${getModeLabel(newMode)} ativado com sucesso!`,
      });
    } catch (error) {
      toast({
        title: "Erro ao salvar configuração",
        description: "Tente novamente em alguns instantes",
        variant: "destructive",
      });
    }
  };

  const getModeLabel = (mode: string) => {
    switch (mode) {
      case "separated":
        return "Separado";
      case "hybrid":
        return "Híbrido";
      case "toggle":
        return "Alternável";
      default:
        return "Separado";
    }
  };

  if (!settings) return null;

  const catalogModes = [
    {
      id: "separated",
      label: "Catálogos Separados",
      description: "Links distintos para varejo e atacado",
      icon: Store,
      benefits: [
        "Experiência focada por tipo de público",
        "SEO otimizado para cada catálogo",
        "Configurações independentes",
        "Controle total sobre visibilidade",
      ],
      recommended: "Recomendado para lojas com públicos muito distintos",
    },
    {
      id: "hybrid",
      label: "Catálogo Híbrido",
      description: "Preços mudam automaticamente por quantidade",
      icon: Zap,
      benefits: [
        "Conversão automática para atacado",
        "Experiência fluida para o cliente",
        "Incentiva compras em maior quantidade",
        "Reduz fricção no processo de compra",
      ],
      recommended: "Ideal para produtos com desconto progressivo",
      badge: "Inteligente",
    },
    {
      id: "toggle",
      label: "Catálogo Alternável",
      description: "Cliente pode alternar entre varejo e atacado",
      icon: ToggleLeft,
      benefits: [
        "Flexibilidade total para o cliente",
        "Comparação fácil entre preços",
        "Controle na mão do usuário",
        "Experiência personalizada",
      ],
      recommended: "Perfeito para clientes que compram nos dois modos",
      badge: "Flexível",
    },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowLeftRight className="h-5 w-5 text-blue-600" />
            Modo de Exibição dos Catálogos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-6">
            Escolha como seus clientes vão acessar e visualizar os preços de
            varejo e atacado.
          </p>

          <RadioGroup
            value={settings.catalog_mode}
            onValueChange={handleModeChange}
            className="grid md:grid-cols-3 gap-4"
          >
            {catalogModes.map((mode) => {
              const IconComponent = mode.icon;
              const isSelected = settings.catalog_mode === mode.id;
              return (
                <label
                  key={mode.id}
                  htmlFor={mode.id}
                  className={`relative rounded-lg border-2 p-6 cursor-pointer transition-all duration-200 flex flex-col h-full ${
                    isSelected
                      ? "border-blue-500 bg-blue-50 shadow-lg"
                      : "border-gray-200 hover:border-gray-300 hover:shadow-md"
                  }`}
                >
                  <div className="flex items-center space-x-2 mb-4">
                    <RadioGroupItem value={mode.id} id={mode.id} />
                    <div className="flex items-center gap-3">
                      <IconComponent
                        className={`h-5 w-5 ${
                          isSelected ? "text-blue-600" : "text-gray-600"
                        }`}
                      />
                      <span className="font-semibold text-lg">
                        {mode.label}
                      </span>
                      {mode.badge && (
                        <Badge variant="secondary" className="text-xs">
                          {mode.badge}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <p className="text-gray-600 mb-4 ml-6">{mode.description}</p>
                  {/* Só mostra a configuração de atacado se for o híbrido e estiver selecionado */}
                  {mode.id === "hybrid" && isSelected && (
                    <div className="mt-8 p-4 border rounded-lg bg-green-50">
                      <h4 className="font-semibold mb-2 text-green-800">
                        Configuração de Atacado
                      </h4>
                      <div className="flex flex-col gap-4">
                        <div>
                          <label className="font-medium">
                            Modelo de Atacado:
                          </label>
                          <div className="flex gap-4 mt-2">
                            <Button
                              variant={
                                selectedWholesale === "simple_wholesale"
                                  ? "default"
                                  : "outline"
                              }
                              onClick={() =>
                                setSelectedWholesale("simple_wholesale")
                              }
                              disabled={saving || loadingPriceModel}
                            >
                              Atacado Simples
                            </Button>
                            <Button
                              variant={
                                selectedWholesale === "gradual_wholesale"
                                  ? "default"
                                  : "outline"
                              }
                              onClick={() =>
                                setSelectedWholesale("gradual_wholesale")
                              }
                              disabled={saving || loadingPriceModel}
                            >
                              Atacado Gradativo
                            </Button>
                          </div>
                        </div>
                        {selectedWholesale === "gradual_wholesale" && (
                          <div>
                            <label className="font-medium mb-2 block">
                              Níveis de Atacado:
                            </label>
                            <div className="flex flex-col md:flex-row md:items-center md:justify-start gap-4 md:gap-8 mb-8">
                              {localTiers.map((tier, idx) => (
                                <div
                                  key={tier.key}
                                  className="flex items-center gap-2"
                                >
                                  <Switch
                                    checked={tier.enabled}
                                    onCheckedChange={(checked) => {
                                      setLocalTiers((prev) =>
                                        prev.map((t, i) =>
                                          i === idx
                                            ? { ...t, enabled: checked }
                                            : t
                                        )
                                      );
                                    }}
                                  />
                                  <span>{tier.label}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        <Button
                          onClick={handleSaveWholesale}
                          disabled={saving || loadingPriceModel}
                          className="mt-4 md:mt-8"
                        >
                          Salvar Configuração de Atacado
                        </Button>
                      </div>
                    </div>
                  )}
                </label>
              );
            })}
          </RadioGroup>

          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
              <Users className="h-4 w-4" />
              Como isso afeta seus clientes:
            </h4>
            <div className="space-y-2 text-sm text-gray-600">
              {settings.catalog_mode === "separated" && (
                <>
                  <p>
                    • Clientes acessam links diferentes para varejo e atacado
                  </p>
                  <p>• Experiência focada no tipo de compra desejada</p>
                  <p>• Ideal para segmentação clara de público</p>
                </>
              )}
              {settings.catalog_mode === "hybrid" && (
                <>
                  <p>
                    • Preços mudam automaticamente ao atingir quantidade mínima
                  </p>
                  <p>• Cliente vê economia em tempo real</p>
                  <p>• Incentiva compras maiores naturalmente</p>
                  <p>• Cada produto pode ter seus próprios níveis de preço</p>
                </>
              )}
              {settings.catalog_mode === "toggle" && (
                <>
                  <p>• Cliente pode alternar entre modo varejo e atacado</p>
                  <p>• Comparação fácil entre preços</p>
                  <p>• Flexibilidade total na experiência de compra</p>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Informação sobre configuração de níveis */}
      {settings.catalog_mode === "hybrid" && (
        <Card className="border-l-4 border-l-green-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-700">
              <Zap className="h-5 w-5" />
              Configuração de Níveis por Produto
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm text-gray-700">
              <p>
                <strong>Como funciona:</strong> No modo híbrido, cada produto
                pode ter seus próprios níveis de preço configurados
                individualmente.
              </p>
              <ul className="space-y-1 ml-4">
                <li>
                  • <strong>Atacado Simples:</strong> Apenas 1 nível de atacado
                  por produto
                </li>
                <li>
                  • <strong>Atacado Gradativo:</strong> Múltiplos níveis (até 4)
                  por produto
                </li>
                <li>
                  • <strong>Configuração:</strong> Feita no wizard de
                  cadastro/edição de cada produto
                </li>
              </ul>
              <p className="text-green-700 font-medium">
                💡 Dica: Configure os níveis de cada produto durante o cadastro
                para máxima flexibilidade!
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CatalogModeSettings;
