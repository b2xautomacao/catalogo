import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Zap,
  Palette,
  Ruler,
  Package2,
  Sparkles,
  Settings,
  ChevronRight,
  Clock,
  CheckCircle,
} from "lucide-react";
import { ProductVariation } from "@/types/product";
import { useStoreColors } from "@/hooks/useStoreColors";
import { useToast } from "@/hooks/use-toast";

interface QuickVariationSetupProps {
  onVariationsGenerated: (variations: ProductVariation[]) => void;
  onAdvancedMode: () => void;
  productName?: string;
  storeId?: string;
}

interface QuickTemplate {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  badge?: string;
  estimatedTime: string;
  combinations: number;
  variations: ProductVariation[];
}

const QuickVariationSetup: React.FC<QuickVariationSetupProps> = ({
  onVariationsGenerated,
  onAdvancedMode,
  productName = "Produto",
  storeId,
}) => {
  const { toast } = useToast();
  const { colors: storeColors, syncDefaultColors } = useStoreColors(storeId);
  const [syncingDefaults, setSyncingDefaults] = useState(false);

  const handleSyncDefaults = async () => {
    setSyncingDefaults(true);
    try {
      const result = await syncDefaultColors();
      if ('count' in result && typeof result.count === 'number' && result.count > 0) {
        toast({
          title: "Cores importadas!",
          description: `${result.count} cores sugeridas foram adicionadas à sua loja.`,
        });
      }
    } catch (error) {
      console.error("Erro ao sincronizar cores:", error);
    } finally {
      setSyncingDefaults(false);
    }
  };

  // Templates rápidos pré-configurados
  const quickTemplates: QuickTemplate[] = [
    {
      id: "basic_colors",
      name: "5 Cores Básicas",
      description: "Preto, Branco, Azul, Vermelho, Verde",
      icon: <Palette className="w-6 h-6" />,
      badge: "Popular",
      estimatedTime: "10 seg",
      combinations: 5,
      variations: ["Preto", "Branco", "Azul", "Vermelho", "Verde"].map(
        (color, index) => ({
          id: `quick-color-${Date.now()}-${index}`,
          product_id: "",
          color,
          sku: `${color.toLowerCase()}`,
          stock: 10,
          price_adjustment: 0,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          display_order: index + 1,
          variation_type: "color_only",
        })
      ),
    },
    {
      id: "clothing_sizes",
      name: "Tamanhos P-M-G-GG",
      description: "Tamanhos básicos para roupas",
      icon: <Ruler className="w-6 h-6" />,
      badge: "Roupas",
      estimatedTime: "5 seg",
      combinations: 4,
      variations: ["P", "M", "G", "GG"].map((size, index) => ({
        id: `quick-size-${Date.now()}-${index}`,
        product_id: "",
        size,
        sku: `size-${size.toLowerCase()}`,
        stock: 15,
        price_adjustment: size === "GG" ? 5 : 0, // GG tem acréscimo
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        display_order: index + 1,
        variation_type: "size_only",
      })),
    },
    {
      id: "premium_materials",
      name: "3 Materiais Premium",
      description: "Prata, Dourado, Rosé Gold",
      icon: <Package2 className="w-6 h-6" />,
      badge: "Premium",
      estimatedTime: "8 seg",
      combinations: 3,
      variations: [
        { name: "Prata", price: 10 },
        { name: "Dourado", price: 8 },
        { name: "Rosé Gold", price: 12 },
      ].map((material, index) => ({
        id: `quick-material-${Date.now()}-${index}`,
        product_id: "",
        material: material.name,
        sku: `mat-${material.name.toLowerCase().replace(/\s+/g, "-")}`,
        stock: 8,
        price_adjustment: material.price,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        display_order: index + 1,
        variation_type: "material_only",
      })),
    },
    {
      id: "complete_clothing",
      name: "Roupas Completas",
      description: "3 cores × 4 tamanhos = 12 variações",
      icon: <Sparkles className="w-6 h-6" />,
      badge: "Completo",
      estimatedTime: "15 seg",
      combinations: 12,
      variations: (() => {
        const colors = ["Preto", "Branco", "Azul"];
        const sizes = ["P", "M", "G", "GG"];
        const variations: ProductVariation[] = [];
        let index = 0;

        colors.forEach((color) => {
          sizes.forEach((size) => {
            variations.push({
              id: `quick-complete-${Date.now()}-${index++}`,
              product_id: "",
              color,
              size,
              sku: `${color.toLowerCase()}-${size.toLowerCase()}`,
              stock: 8,
              price_adjustment: size === "GG" ? 3 : 0,
              is_active: true,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              display_order: index,
              variation_type: "color_size",
            });
          });
        });

        return variations;
      })(),
    },
    {
      id: "jewelry_set",
      name: "Set de Bijuterias",
      description: "4 cores × 2 materiais = 8 variações",
      icon: <Package2 className="w-6 h-6" />,
      badge: "Bijuteria",
      estimatedTime: "12 seg",
      combinations: 8,
      variations: (() => {
        const colors = ["Dourado", "Prateado", "Rosé", "Bronze"];
        const materials = ["Metal", "Inox"];
        const variations: ProductVariation[] = [];
        let index = 0;

        colors.forEach((color) => {
          materials.forEach((material) => {
            variations.push({
              id: `quick-jewelry-${Date.now()}-${index++}`,
              product_id: "",
              color,
              material,
              sku: `${color.toLowerCase()}-${material.toLowerCase()}`,
              stock: 6,
              price_adjustment: material === "Inox" ? 5 : 0,
              is_active: true,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              display_order: index,
              variation_type: "color_material",
            });
          });
        });

        return variations;
      })(),
    },
    {
      id: "single_product",
      name: "Produto Único",
      description: "Sem variações, apenas produto principal",
      icon: <CheckCircle className="w-6 h-6" />,
      badge: "Simples",
      estimatedTime: "1 seg",
      combinations: 0,
      variations: [], // Sem variações
    },
  ];

  const handleQuickSetup = (template: QuickTemplate) => {
    onVariationsGenerated(template.variations);

    const message =
      template.combinations === 0
        ? "Produto configurado sem variações!"
        : `${template.combinations} variações criadas em ${template.estimatedTime}!`;

    toast({
      title: "⚡ Configuração Rápida!",
      description: message,
      duration: 3000,
    });
  };

  const getBadgeColor = (badge?: string) => {
    switch (badge) {
      case "Popular":
        return "bg-blue-100 text-blue-700";
      case "Premium":
        return "bg-yellow-100 text-yellow-700";
      case "Completo":
        return "bg-purple-100 text-purple-700";
      case "Roupas":
        return "bg-green-100 text-green-700";
      case "Bijuteria":
        return "bg-pink-100 text-pink-700";
      case "Simples":
        return "bg-gray-100 text-gray-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2 mb-3">
          <Zap className="w-8 h-8 text-yellow-500" />
          <h2 className="text-2xl font-bold text-gray-900">
            Configuração Rápida
          </h2>
        </div>
        <p className="text-gray-600">
          Configure variações em segundos com nossos templates prontos
        </p>
        {productName && (
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 rounded-full">
            <span className="text-sm text-blue-700">
              Configurando: <strong>{productName}</strong>
            </span>
          </div>
        )}
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {quickTemplates.map((template) => (
          <Card
            key={template.id}
            className="cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-lg group"
            onClick={() => handleQuickSetup(template)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-100 text-blue-600 group-hover:bg-blue-200 transition-colors">
                    {template.icon}
                  </div>
                  <div>
                    <CardTitle className="text-sm font-semibold">
                      {template.name}
                    </CardTitle>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-blue-500 transition-colors" />
              </div>

              {template.badge && (
                <Badge className={getBadgeColor(template.badge)}>
                  {template.badge}
                </Badge>
              )}
            </CardHeader>

            <CardContent className="space-y-3">
              <p className="text-sm text-gray-600 leading-relaxed">
                {template.description}
              </p>

              <div className="flex items-center justify-between text-xs text-gray-500">
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {template.estimatedTime}
                </div>
                <div className="flex items-center gap-1">
                  <Package2 className="w-3 h-3" />
                  {template.combinations === 0
                    ? "Nenhuma"
                    : template.combinations}{" "}
                  variação{template.combinations !== 1 ? "ões" : ""}
                </div>
              </div>

              <Button
                className="w-full bg-blue-600 hover:bg-blue-700 group-hover:bg-blue-700 transition-colors"
                size="sm"
              >
                <Zap className="w-4 h-4 mr-2" />
                Aplicar Agora
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-4 bg-white text-gray-500">ou</span>
        </div>
      </div>

      {/* Advanced Option */}
      <Card
        className="border-dashed border-2 border-gray-300 hover:border-gray-400 cursor-pointer transition-colors"
        onClick={onAdvancedMode}
      >
        <CardContent className="flex items-center justify-center p-8">
          <div className="text-center space-y-3">
            <div className="flex items-center justify-center">
              <div className="p-3 rounded-lg bg-gray-100">
                <Settings className="w-8 h-8 text-gray-600" />
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Configuração Avançada
              </h3>
              <p className="text-gray-600">
                Precisa de algo mais específico? Use nosso sistema completo
              </p>
            </div>
            <Button variant="outline" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Ir para Configuração Avançada
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Benefits */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-yellow-500" />
          Por que usar a Configuração Rápida?
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
          <div className="flex items-start gap-2">
            <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
            <div>
              <strong>Economia de Tempo:</strong> Configure em segundos ao invés
              de minutos
            </div>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
            <div>
              <strong>Sem Erros:</strong> Templates testados e otimizados
            </div>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
            <div>
              <strong>Fácil Ajuste:</strong> Pode editar depois se necessário
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuickVariationSetup;
