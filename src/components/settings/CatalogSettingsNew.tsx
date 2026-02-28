import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useCatalogSettings } from "@/hooks/useCatalogSettings";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import {
  Palette,
  Eye,
  Smartphone,
  Gift,
  Zap,
  Sparkles,
  Share2,
  ShoppingBag,
  ChevronLeft,
  Monitor,
  Crown,
  Settings as SettingsIcon,
  Globe,
  Save,
  CheckCircle2
} from "lucide-react";

// Importar componentes específicos
import TemplateSettingsCard from "./cards/TemplateSettingsCard";
import ProductPageSettings from "./ProductPageSettings";
import MobileLayoutSettings from "./MobileLayoutSettings";
import FooterSettings from "./FooterSettings";
import OrderBumpSettings from "./OrderBumpSettings";
import ShareableLinks from "./ShareableLinks";

interface ConfigCard {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  badge?: string;
}

const CatalogSettingsNew = () => {
  const { profile } = useAuth();
  const { settings, loading, updateSettings } = useCatalogSettings();
  const [selectedCard, setSelectedCard] = useState<string | null>(null);
  const [localSettings, setLocalSettings] = useState({
    template_name: "modern",
    show_prices: true,
    show_stock: true,
    show_categories: true,
    show_search: true,
    show_filters: true,
    conversion_mode: "optimized" as "simple" | "optimized",
  });

  useEffect(() => {
    if (settings) {
      setLocalSettings({
        template_name: settings.template_name || "modern",
        show_prices: settings.show_prices !== false,
        show_stock: settings.show_stock !== false,
        show_categories: settings.allow_categories_filter !== false,
        show_search: true,
        show_filters: settings.allow_price_filter !== false,
        conversion_mode: settings.conversion_mode || "optimized",
      });
    }
  }, [settings]);

  const handleSave = async () => {
    const updates = {
      template_name: localSettings.template_name,
      show_prices: localSettings.show_prices,
      show_stock: localSettings.show_stock,
      allow_categories_filter: localSettings.show_categories,
      allow_price_filter: localSettings.show_filters,
      conversion_mode: localSettings.conversion_mode,
    };

    try {
      await updateSettings(updates);
      toast.success("Configurações salvas com sucesso!");
    } catch (error) {
      console.error("Erro ao salvar:", error);
      toast.error("Erro ao salvar configurações");
    }
  };

  const templates = [
    {
      value: "modern",
      label: "Moderno",
      description: "Design limpo e contemporâneo",
      icon: Monitor,
      colors: ["#0057FF", "#FF6F00", "#8E2DE2"],
      features: ["Gradientes suaves", "Animações fluidas", "Layout responsivo"],
    },
    {
      value: "minimal",
      label: "Minimalista",
      description: "Focado no essencial",
      icon: Zap,
      colors: ["#1F2937", "#059669", "#DC2626"],
      features: ["Design limpo", "Tipografia clara", "Navegação simples"],
    },
    {
      value: "minimal_clean",
      label: "Minimalista Clean",
      description: "Ultra clean com foco em conversão",
      icon: Sparkles,
      colors: ["#000000", "#FFFFFF", "#3B82F6"],
      features: ["Banner full-width", "Header com badges", "Máximo clean"],
    },
    {
      value: "elegant",
      label: "Elegante",
      description: "Sofisticado e refinado",
      icon: Crown,
      colors: ["#D97706", "#92400E", "#7C2D12"],
      features: ["Tons dourados", "Elementos premium", "Detalhes refinados"],
    },
    {
      value: "industrial",
      label: "Industrial",
      description: "Robusto e profissional",
      icon: SettingsIcon,
      colors: ["#475569", "#F59E0B", "#DC2626"],
      features: ["Visual metálico", "Bordas definidas", "Estilo corporativo"],
    },
  ];

  const configCards: ConfigCard[] = [
    {
      id: "template",
      title: "Template",
      description: "Escolha o visual e layout do seu catálogo",
      icon: <Palette className="h-5 w-5 text-white" />,
      color: "bg-gradient-to-br from-purple-500 to-pink-500",
      badge: "Essencial"
    },
    {
      id: "display",
      title: "Exibição",
      description: "Configure o que será mostrado no catálogo",
      icon: <Eye className="h-5 w-5 text-white" />,
      color: "bg-gradient-to-br from-blue-500 to-cyan-500"
    },
    {
      id: "appearance",
      title: "Aparência",
      description: "Personalize cores, fontes e estilo visual",
      icon: <Sparkles className="h-5 w-5 text-white" />,
      color: "bg-gradient-to-br from-amber-500 to-orange-500"
    },
    {
      id: "product",
      title: "Produto",
      description: "Configurações das páginas de produtos",
      icon: <ShoppingBag className="h-5 w-5 text-white" />,
      color: "bg-gradient-to-br from-green-500 to-emerald-500"
    },
    {
      id: "mobile",
      title: "Mobile",
      description: "Otimizações para dispositivos móveis",
      icon: <Smartphone className="h-5 w-5 text-white" />,
      color: "bg-gradient-to-br from-indigo-500 to-purple-500"
    },
    {
      id: "footer",
      title: "Footer",
      description: "Configure o rodapé do catálogo",
      icon: <Globe className="h-5 w-5 text-white" />,
      color: "bg-gradient-to-br from-gray-600 to-gray-800"
    },
    {
      id: "orderbumps",
      title: "Order Bumps",
      description: "Ofertas especiais e produtos relacionados",
      icon: <Gift className="h-5 w-5 text-white" />,
      color: "bg-gradient-to-br from-red-500 to-pink-500",
      badge: "Pro"
    },
    {
      id: "sharing",
      title: "Links",
      description: "Links compartilháveis do catálogo",
      icon: <Share2 className="h-5 w-5 text-white" />,
      color: "bg-gradient-to-br from-teal-500 to-cyan-500"
    }
  ];

  const renderCardContent = () => {
    switch (selectedCard) {
      case "template":
        return (
          <TemplateSettingsCard
            templates={templates}
            selectedTemplate={localSettings.template_name}
            onTemplateChange={(value) => 
              setLocalSettings(prev => ({ ...prev, template_name: value }))
            }
          />
        );
      case "product":
        return (
          <ProductPageSettings 
            settings={settings || {}}
            onUpdate={(field, value) => {
              console.log('ProductPage Config Update:', field, value);
              updateSettings({ [field]: value });
            }}
          />
        );
      case "mobile":
        return <MobileLayoutSettings />;
      case "footer":
        return <FooterSettings />;
      case "orderbumps":
        return <OrderBumpSettings />;
      case "sharing":
        return <ShareableLinks />;
      case "display":
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Configurações de Exibição</CardTitle>
                <CardDescription>
                  Configure o que será mostrado no catálogo público
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center justify-between">
                    <span>Mostrar Preços</span>
                    <input
                      type="checkbox"
                      checked={localSettings.show_prices}
                      onChange={(e) => 
                        setLocalSettings(prev => ({ ...prev, show_prices: e.target.checked }))
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Mostrar Estoque</span>
                    <input
                      type="checkbox"
                      checked={localSettings.show_stock}
                      onChange={(e) => 
                        setLocalSettings(prev => ({ ...prev, show_stock: e.target.checked }))
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Filtro por Categorias</span>
                    <input
                      type="checkbox"
                      checked={localSettings.show_categories}
                      onChange={(e) => 
                        setLocalSettings(prev => ({ ...prev, show_categories: e.target.checked }))
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Filtro por Preço</span>
                    <input
                      type="checkbox"
                      checked={localSettings.show_filters}
                      onChange={(e) => 
                        setLocalSettings(prev => ({ ...prev, show_filters: e.target.checked }))
                      }
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );
      default:
        return (
          <div className="text-center py-8">
            <p className="text-gray-500">Componente em desenvolvimento...</p>
          </div>
        );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Vista detalhada do card
  if (selectedCard) {
    const card = configCards.find(c => c.id === selectedCard);
    
    return (
      <div className="space-y-6">
        {/* Botão Voltar */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => setSelectedCard(null)}
            className="flex items-center gap-2"
          >
            <ChevronLeft className="h-4 w-4" />
            Voltar para Configurações
          </Button>

          <Button onClick={handleSave} className="flex items-center gap-2">
            <Save className="h-4 w-4" />
            Salvar Alterações
          </Button>
        </div>

        {/* Header do Card */}
        {card && (
          <div className="flex items-center gap-3 pb-4 border-b">
            <div className={`p-3 rounded-lg ${card.color}`}>
              {card.icon}
            </div>
            <div>
              <h3 className="text-xl font-semibold flex items-center gap-2">
                {card.title}
                {card.badge && (
                  <Badge variant="secondary">{card.badge}</Badge>
                )}
              </h3>
              <p className="text-sm text-gray-600">{card.description}</p>
            </div>
          </div>
        )}

        {/* Conteúdo do Card */}
        {renderCardContent()}
      </div>
    );
  }

  // Vista principal com cards
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Configurações do Catálogo</h2>
          <p className="text-gray-600">Personalize a aparência, funcionamento e compartilhamento do seu catálogo</p>
        </div>
        <Button onClick={handleSave} className="flex items-center gap-2">
          <Save className="h-4 w-4" />
          Salvar Alterações
        </Button>
      </div>

      {/* Grid de Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {configCards.map((card) => (
          <Card
            key={card.id}
            className="cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-105"
            onClick={() => setSelectedCard(card.id)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between mb-3">
                <div className={`p-3 rounded-lg ${card.color}`}>
                  {card.icon}
                </div>
                {card.badge && (
                  <Badge variant="secondary" className="ml-auto">
                    {card.badge}
                  </Badge>
                )}
              </div>
              <CardTitle className="text-base">{card.title}</CardTitle>
              <CardDescription className="text-sm line-clamp-2">
                {card.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center justify-between">
                <span className="text-sm text-primary font-medium">
                  Configurar
                </span>
                <ChevronLeft className="h-4 w-4 text-gray-400 rotate-180" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Dica */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-blue-900 mb-1">
              Configurações Rápidas
            </p>
            <p className="text-sm text-blue-700">
              Clique em qualquer card acima para configurar as opções de forma detalhada. As alterações são salvas automaticamente.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CatalogSettingsNew;
