import React, { useEffect, useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useCatalogSettings } from "@/hooks/useCatalogSettings";
import { useStorePriceModel } from "@/hooks/useStorePriceModel";
import { useAuth } from "@/hooks/useAuth";
import {
  DollarSign,
  TrendingDown,
  Package,
  Info,
  Plus,
  Minus,
} from "lucide-react";

interface GenericProductFormData {
  name: string;
  description?: string;
  retail_price: number;
  wholesale_price?: number;
  min_wholesale_qty?: number;
  stock: number;
  category?: string;
  keywords?: string;
  meta_title?: string;
  meta_description?: string;
  seo_slug?: string;
  is_featured?: boolean;
  allow_negative_stock?: boolean;
  stock_alert_threshold?: number;
  variations?: any[];
  store_id?: string;
  price_tiers?: Array<{
    id: string;
    name: string;
    minQuantity: number;
    price: number;
    enabled: boolean;
  }>;
}

interface ProductPricingFormProps {
  formData: GenericProductFormData;
  updateFormData: (updates: Partial<GenericProductFormData>) => void;
  productId?: string;
}

interface PriceTier {
  id: string;
  name: string;
  minQuantity: number;
  price: number;
  enabled: boolean;
}

const ProductPricingForm: React.FC<ProductPricingFormProps> = ({
  formData,
  updateFormData,
  productId,
}) => {
  const { profile } = useAuth();
  const { settings: catalogSettings } = useCatalogSettings();
  const { priceModel: storePriceModel } = useStorePriceModel(profile?.store_id);

  const [priceTiers, setPriceTiers] = useState<PriceTier[]>([
    {
      id: "retail",
      name: "Varejo",
      minQuantity: 1,
      price: formData.retail_price || 0,
      enabled: true,
    },
  ]);

  // Sincronizar price_tiers do formData com o estado local
  useEffect(() => {
    console.log(
      "🔄 PRODUCT PRICING FORM - Sincronizando price_tiers do formData:",
      formData.price_tiers
    );
    if (formData.price_tiers && formData.price_tiers.length > 0) {
      setPriceTiers(formData.price_tiers);
    }
  }, [formData.price_tiers]);

  // Carregar configuração baseada no modelo do catálogo (apenas para novos produtos)
  useEffect(() => {
    if (!catalogSettings || !storePriceModel || productId) return; // Não carregar para produtos existentes

    const tiers: PriceTier[] = [
      {
        id: "retail",
        name: "Varejo",
        minQuantity: 1,
        price: formData.retail_price || 0,
        enabled: true,
      },
    ];

    // Se catálogo híbrido, adicionar níveis configuráveis
    if (catalogSettings.catalog_mode === "hybrid") {
      if (storePriceModel.price_model === "simple_wholesale") {
        tiers.push({
          id: "wholesale",
          name: storePriceModel.simple_wholesale_name || "Atacado",
          minQuantity:
            formData.min_wholesale_qty ||
            storePriceModel.simple_wholesale_min_qty,
          price: formData.wholesale_price || 0,
          enabled: true,
        });
      } else if (storePriceModel.price_model === "gradual_wholesale") {
        // Adicionar níveis gradativos baseados na configuração da loja
        if (storePriceModel.tier_2_enabled) {
          tiers.push({
            id: "tier2",
            name: storePriceModel.tier_2_name || "Atacarejo",
            minQuantity: 5,
            price: 0,
            enabled: true,
          });
        }
        if (storePriceModel.tier_3_enabled) {
          tiers.push({
            id: "tier3",
            name: storePriceModel.tier_3_name || "Atacado Pequeno",
            minQuantity: 10,
            price: 0,
            enabled: true,
          });
        }
        if (storePriceModel.tier_4_enabled) {
          tiers.push({
            id: "tier4",
            name: storePriceModel.tier_4_name || "Atacado Grande",
            minQuantity: 50,
            price: 0,
            enabled: true,
          });
        }
      }
    }

    setPriceTiers(tiers);
  }, [
    catalogSettings,
    storePriceModel,
    formData.retail_price,
    formData.wholesale_price,
    formData.min_wholesale_qty,
    productId, // Adicionar productId para evitar carregamento em edição
  ]);

  // Atualizar preço de varejo quando mudar
  useEffect(() => {
    setPriceTiers((prev) =>
      prev.map((tier) =>
        tier.id === "retail"
          ? { ...tier, price: formData.retail_price || 0 }
          : tier
      )
    );
  }, [formData.retail_price]);

  // Atualizar preço de atacado quando mudar
  useEffect(() => {
    setPriceTiers((prev) =>
      prev.map((tier) =>
        tier.id === "wholesale"
          ? { ...tier, price: formData.wholesale_price || 0 }
          : tier
      )
    );
  }, [formData.wholesale_price]);

  // Carregamento de price_tiers agora é feito centralmente no hook principal
  // Este useEffect foi removido para evitar carregamento duplicado

  // Garantir que os preços sejam sempre sincronizados com o formData
  useEffect(() => {
    console.log("🔄 PRODUCT PRICING FORM - Sincronizando preços com formData");
    console.log(
      "🔄 PRODUCT PRICING FORM - retail_price:",
      formData.retail_price
    );
    console.log(
      "🔄 PRODUCT PRICING FORM - wholesale_price:",
      formData.wholesale_price
    );

    // Atualizar preço de varejo se mudou no formData
    if (formData.retail_price !== undefined && formData.retail_price !== null) {
      setPriceTiers((prev) =>
        prev.map((tier) =>
          tier.id === "retail"
            ? { ...tier, price: formData.retail_price || 0 }
            : tier
        )
      );
    }

    // Atualizar preço de atacado se mudou no formData
    if (
      formData.wholesale_price !== undefined &&
      formData.wholesale_price !== null
    ) {
      setPriceTiers((prev) =>
        prev.map((tier) =>
          tier.id === "wholesale"
            ? { ...tier, price: formData.wholesale_price || 0 }
            : tier
        )
      );
    }
  }, [formData.retail_price, formData.wholesale_price]);

  const handleTierChange = (
    tierId: string,
    field: keyof PriceTier,
    value: any
  ) => {
    console.log("🔧 PRODUCT PRICING FORM - handleTierChange chamado:", {
      tierId,
      field,
      value,
    });

    // Atualizar priceTiers local
    const updatedTiers = priceTiers.map((tier) =>
      tier.id === tierId ? { ...tier, [field]: value } : tier
    );

    console.log(
      "🔧 PRODUCT PRICING FORM - priceTiers atualizados:",
      updatedTiers
    );
    setPriceTiers(updatedTiers);

    // Atualizar formData baseado no tipo de tier
    if (field === "price") {
      if (tierId === "retail") {
        console.log(
          "🔧 PRODUCT PRICING FORM - Atualizando retail_price:",
          value
        );
        updateFormData({ retail_price: value });
      } else if (tierId === "wholesale") {
        console.log(
          "🔧 PRODUCT PRICING FORM - Atualizando wholesale_price:",
          value
        );
        updateFormData({ wholesale_price: value });
      }
    } else if (field === "minQuantity") {
      if (tierId === "wholesale") {
        console.log(
          "🔧 PRODUCT PRICING FORM - Atualizando min_wholesale_qty:",
          value
        );
        updateFormData({ min_wholesale_qty: value });
      }
    }

    // Atualizar price_tiers no formData com os dados atualizados
    const tiersForFormData = updatedTiers.map((tier) => ({
      id: tier.id,
      name: tier.name,
      minQuantity: tier.minQuantity,
      price: tier.price,
      enabled: tier.enabled,
    }));

    console.log(
      "🔧 PRODUCT PRICING FORM - Atualizando price_tiers no formData:",
      tiersForFormData
    );

    // Forçar atualização completa do formData
    updateFormData({
      price_tiers: tiersForFormData,
    });

    // Garantir que os preços básicos também sejam atualizados
    const retailTier = updatedTiers.find((tier) => tier.id === "retail");
    const wholesaleTier = updatedTiers.find((tier) => tier.id === "wholesale");

    if (retailTier && field === "price") {
      updateFormData({ retail_price: retailTier.price });
    }

    if (wholesaleTier && field === "price") {
      updateFormData({ wholesale_price: wholesaleTier.price });
    }

    if (wholesaleTier && field === "minQuantity") {
      updateFormData({ min_wholesale_qty: wholesaleTier.minQuantity });
    }
  };

  const getCatalogModeInfo = () => {
    if (!catalogSettings) return null;

    switch (catalogSettings.catalog_mode) {
      case "separated":
        return {
          title: "Catálogos Separados",
          description: "Este produto será exibido apenas no catálogo de varejo",
          icon: Package,
          color: "bg-blue-100 text-blue-800",
        };
      case "hybrid":
        return {
          title: "Catálogo Híbrido",
          description: "Preços mudam automaticamente por quantidade",
          icon: TrendingDown,
          color: "bg-green-100 text-green-800",
        };
      case "toggle":
        return {
          title: "Catálogo Alternável",
          description: "Cliente pode alternar entre varejo e atacado",
          icon: DollarSign,
          color: "bg-purple-100 text-purple-800",
        };
      default:
        return null;
    }
  };

  const catalogInfo = getCatalogModeInfo();

  return (
    <div className="space-y-6">
      {/* Informação do Modo do Catálogo */}
      {catalogInfo && (
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <catalogInfo.icon className="h-5 w-5 text-blue-600" />
              <div>
                <h4 className="font-medium text-gray-900">
                  {catalogInfo.title}
                </h4>
                <p className="text-sm text-gray-600">
                  {catalogInfo.description}
                </p>
              </div>
              <Badge className={catalogInfo.color}>
                {catalogSettings?.catalog_mode}
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Preço de Varejo (Sempre visível) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-green-600" />
            Preço de Varejo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="retail_price">Preço Unitário *</Label>
              <CurrencyInput
                value={formData.retail_price}
                onChange={(value) => updateFormData({ retail_price: value })}
                placeholder="R$ 0,00"
              />
            </div>
            <div>
              <Label htmlFor="stock">Estoque</Label>
              <Input
                id="stock"
                type="number"
                min="0"
                value={formData.stock || undefined}
                onChange={(e) =>
                  updateFormData({ stock: parseInt(e.target.value) || 0 })
                }
                placeholder="0"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Níveis de Preço (Apenas para catálogo híbrido) */}
      {catalogSettings?.catalog_mode === "hybrid" && priceTiers.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-orange-600" />
              Níveis de Preço por Quantidade
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {priceTiers.slice(1).map((tier) => (
                <div key={tier.id} className="p-4 border rounded-lg bg-gray-50">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-gray-900">{tier.name}</h4>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={tier.enabled}
                        onCheckedChange={(checked) =>
                          handleTierChange(tier.id, "enabled", checked)
                        }
                      />
                      <span className="text-sm text-gray-600">Ativo</span>
                    </div>
                  </div>

                  {tier.enabled && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Quantidade Mínima</Label>
                        <Input
                          type="number"
                          min="1"
                          value={tier.minQuantity}
                          onChange={(e) =>
                            handleTierChange(
                              tier.id,
                              "minQuantity",
                              parseInt(e.target.value) || 1
                            )
                          }
                          placeholder="1"
                        />
                      </div>
                      <div>
                        <Label>Preço Unitário</Label>
                        <CurrencyInput
                          value={tier.price}
                          onChange={(value) =>
                            handleTierChange(tier.id, "price", value)
                          }
                          placeholder="R$ 0,00"
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-2 text-blue-800">
                <Info className="h-4 w-4" />
                <span className="text-sm font-medium">Como funciona:</span>
              </div>
              <p className="text-sm text-blue-700 mt-1">
                Clientes que comprarem a quantidade mínima ou mais pagarão o
                preço do nível correspondente.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Configurações Avançadas */}
      <Card>
        <CardHeader>
          <CardTitle>Configurações Avançadas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="allow_negative_stock">
                Permitir Estoque Negativo
              </Label>
              <Switch
                id="allow_negative_stock"
                checked={formData.allow_negative_stock || false}
                onCheckedChange={(checked) =>
                  updateFormData({ allow_negative_stock: checked })
                }
              />
            </div>

            <div>
              <Label htmlFor="stock_alert_threshold">
                Alerta de Estoque Baixo
              </Label>
              <Input
                id="stock_alert_threshold"
                type="number"
                min="0"
                value={formData.stock_alert_threshold || undefined}
                onChange={(e) =>
                  updateFormData({
                    stock_alert_threshold: parseInt(e.target.value) || 5,
                  })
                }
                placeholder="5"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProductPricingForm;
