import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCatalogSettings } from "@/hooks/useCatalogSettings";
import { useTemplateColors } from "@/hooks/useTemplateColors";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import AdvancedColorSettings from "./AdvancedColorSettings";
import ShareableLinks from "./ShareableLinks";
import MobileLayoutSettings from "./MobileLayoutSettings";
import FooterSettings from "./FooterSettings";
import OrderBumpSettings from "./OrderBumpSettings";
import ProductPageSettings from "./ProductPageSettings";
import {
  Palette,
  Eye,
  Settings,
  Save,
  RotateCw,
  Monitor,
  Smartphone,
  Crown,
  Zap,
  Sparkles,
  Share2,
  Search,
  Globe,
  Gift,
  Truck,
  Shield,
  Star,
  ShoppingBag,
} from "lucide-react";

const CatalogSettings = () => {
  const { profile } = useAuth();
  const { settings, loading, updateSettings } = useCatalogSettings();
  const { resetToTemplateDefaults } = useTemplateColors();

  const [localSettings, setLocalSettings] = useState({
    template_name: "modern",
    show_prices: true,
    show_stock: true,
    show_categories: true,
    show_search: true,
    show_filters: true,
    items_per_page: 12,
    catalog_title: "",
    catalog_description: "",
    primary_color: "#0057FF",
    secondary_color: "#FF6F00",
    accent_color: "#8E2DE2",
    background_color: "#F8FAFC",
    text_color: "#1E293B",
    border_color: "#E2E8F0",
    font_family: "Inter",
    custom_css: "",
    seo_keywords: "",
    conversion_mode: "optimized" as "simple" | "optimized",
    // Estilos de aparência
    button_style: "modern" as "flat" | "modern" | "rounded",
    footer_style: "dark" as "dark" | "light" | "gradient",
    footer_bg_color: "",
    footer_text_color: "",
    // Badges do header
    header_badges_enabled: true,
    header_badge_fast_delivery: true,
    header_badge_fast_delivery_text: "Entrega Rápida em 24h",
    header_badge_free_shipping: true,
    header_badge_free_shipping_text: "Frete Grátis",
    header_free_shipping_threshold: 200,
    header_badge_secure_checkout: true,
    header_badge_secure_checkout_text: "Compra 100% Segura",
    header_badge_custom_1: false,
    header_badge_custom_1_text: "",
    header_badge_custom_1_icon: "star",
    // Configurações da Página do Produto
    product_show_urgency_badges: true,
    product_show_low_stock_badge: true,
    product_low_stock_threshold: 10,
    product_show_best_seller_badge: true,
    product_show_sales_count: true,
    product_show_views_count: true,
    product_show_free_shipping_badge: true,
    product_show_fast_delivery_badge: true,
    product_show_social_proof_carousel: true,
    product_social_proof_autorotate: true,
    product_social_proof_interval: 4000,
    product_show_ratings: true,
    product_show_rating_distribution: true,
    product_show_trust_section: true,
    product_trust_free_shipping: true,
    product_trust_money_back: true,
    product_trust_fast_delivery: true,
    product_trust_secure_payment: true,
    product_trust_delivery_days: "2-5",
    product_trust_return_days: 7,
    product_show_videos: true,
    product_show_testimonials: true,
    product_testimonials_max_display: 3,
    product_show_size_chart: true,
    product_size_chart_default_open: false,
    product_show_care_section: true,
    product_care_section_default_open: false,
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
        items_per_page: 12,
        catalog_title: settings.seo_title || "",
        catalog_description: settings.seo_description || "",
        primary_color: settings.primary_color || "#0057FF",
        secondary_color: settings.secondary_color || "#FF6F00",
        accent_color: settings.accent_color || "#8E2DE2",
        background_color: settings.background_color || "#F8FAFC",
        text_color: settings.text_color || "#1E293B",
        border_color: settings.border_color || "#E2E8F0",
        font_family: "Inter",
        custom_css: "",
        seo_keywords: settings.seo_keywords || "",
        conversion_mode: settings.conversion_mode || "optimized",
        // Estilos de aparência
        button_style: (settings.button_style as any) || "modern",
        footer_style: (settings.footer_style as any) || "dark",
        footer_bg_color: (settings.footer_bg_color as any) || "",
        footer_text_color: (settings.footer_text_color as any) || "",
        // Badges do header
        header_badges_enabled: (settings.header_badges_enabled as any) !== false,
        header_badge_fast_delivery: (settings.header_badge_fast_delivery as any) !== false,
        header_badge_fast_delivery_text: (settings.header_badge_fast_delivery_text as any) || "Entrega Rápida em 24h",
        header_badge_free_shipping: (settings.header_badge_free_shipping as any) !== false,
        header_badge_free_shipping_text: (settings.header_badge_free_shipping_text as any) || "Frete Grátis",
        header_free_shipping_threshold: (settings.header_free_shipping_threshold as any) || 200,
        header_badge_secure_checkout: (settings.header_badge_secure_checkout as any) !== false,
        header_badge_secure_checkout_text: (settings.header_badge_secure_checkout_text as any) || "Compra 100% Segura",
        header_badge_custom_1: (settings.header_badge_custom_1 as any) || false,
        header_badge_custom_1_text: (settings.header_badge_custom_1_text as any) || "",
        header_badge_custom_1_icon: (settings.header_badge_custom_1_icon as any) || "star",
        // Configurações da Página do Produto
        product_show_urgency_badges: (settings.product_show_urgency_badges as any) !== false,
        product_show_low_stock_badge: (settings.product_show_low_stock_badge as any) !== false,
        product_low_stock_threshold: (settings.product_low_stock_threshold as any) || 10,
        product_show_best_seller_badge: (settings.product_show_best_seller_badge as any) !== false,
        product_show_sales_count: (settings.product_show_sales_count as any) !== false,
        product_show_views_count: (settings.product_show_views_count as any) !== false,
        product_show_free_shipping_badge: (settings.product_show_free_shipping_badge as any) !== false,
        product_show_fast_delivery_badge: (settings.product_show_fast_delivery_badge as any) !== false,
        product_show_social_proof_carousel: (settings.product_show_social_proof_carousel as any) !== false,
        product_social_proof_autorotate: (settings.product_social_proof_autorotate as any) !== false,
        product_social_proof_interval: (settings.product_social_proof_interval as any) || 4000,
        product_show_ratings: (settings.product_show_ratings as any) !== false,
        product_show_rating_distribution: (settings.product_show_rating_distribution as any) !== false,
        product_show_trust_section: (settings.product_show_trust_section as any) !== false,
        product_trust_free_shipping: (settings.product_trust_free_shipping as any) !== false,
        product_trust_money_back: (settings.product_trust_money_back as any) !== false,
        product_trust_fast_delivery: (settings.product_trust_fast_delivery as any) !== false,
        product_trust_secure_payment: (settings.product_trust_secure_payment as any) !== false,
        product_trust_delivery_days: (settings.product_trust_delivery_days as any) || "2-5",
        product_trust_return_days: (settings.product_trust_return_days as any) || 7,
        product_show_videos: (settings.product_show_videos as any) !== false,
        product_show_testimonials: (settings.product_show_testimonials as any) !== false,
        product_testimonials_max_display: (settings.product_testimonials_max_display as any) || 3,
        product_show_size_chart: (settings.product_show_size_chart as any) !== false,
        product_size_chart_default_open: (settings.product_size_chart_default_open as any) || false,
        product_show_care_section: (settings.product_show_care_section as any) !== false,
        product_care_section_default_open: (settings.product_care_section_default_open as any) || false,
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
      seo_title: localSettings.catalog_title,
      seo_description: localSettings.catalog_description,
      seo_keywords: localSettings.seo_keywords,
      primary_color: localSettings.primary_color,
      secondary_color: localSettings.secondary_color,
      accent_color: localSettings.accent_color,
      background_color: localSettings.background_color,
      text_color: localSettings.text_color,
      border_color: localSettings.border_color,
      conversion_mode: localSettings.conversion_mode,
      // Estilos de aparência
      button_style: localSettings.button_style,
      footer_style: localSettings.footer_style,
      footer_bg_color: localSettings.footer_bg_color || null,
      footer_text_color: localSettings.footer_text_color || null,
      // Badges do header
      header_badges_enabled: localSettings.header_badges_enabled,
      header_badge_fast_delivery: localSettings.header_badge_fast_delivery,
      header_badge_fast_delivery_text: localSettings.header_badge_fast_delivery_text,
      header_badge_free_shipping: localSettings.header_badge_free_shipping,
      header_badge_free_shipping_text: localSettings.header_badge_free_shipping_text,
      header_free_shipping_threshold: localSettings.header_free_shipping_threshold,
      header_badge_secure_checkout: localSettings.header_badge_secure_checkout,
      header_badge_secure_checkout_text: localSettings.header_badge_secure_checkout_text,
      header_badge_custom_1: localSettings.header_badge_custom_1,
      header_badge_custom_1_text: localSettings.header_badge_custom_1_text || null,
      header_badge_custom_1_icon: localSettings.header_badge_custom_1_icon,
      // Página do Produto
      product_show_urgency_badges: localSettings.product_show_urgency_badges,
      product_show_low_stock_badge: localSettings.product_show_low_stock_badge,
      product_low_stock_threshold: localSettings.product_low_stock_threshold,
      product_show_best_seller_badge: localSettings.product_show_best_seller_badge,
      product_show_sales_count: localSettings.product_show_sales_count,
      product_show_views_count: localSettings.product_show_views_count,
      product_show_free_shipping_badge: localSettings.product_show_free_shipping_badge,
      product_show_fast_delivery_badge: localSettings.product_show_fast_delivery_badge,
      product_show_social_proof_carousel: localSettings.product_show_social_proof_carousel,
      product_social_proof_autorotate: localSettings.product_social_proof_autorotate,
      product_social_proof_interval: localSettings.product_social_proof_interval,
      product_show_ratings: localSettings.product_show_ratings,
      product_show_rating_distribution: localSettings.product_show_rating_distribution,
      product_show_trust_section: localSettings.product_show_trust_section,
      product_trust_free_shipping: localSettings.product_trust_free_shipping,
      product_trust_money_back: localSettings.product_trust_money_back,
      product_trust_fast_delivery: localSettings.product_trust_fast_delivery,
      product_trust_secure_payment: localSettings.product_trust_secure_payment,
      product_trust_delivery_days: localSettings.product_trust_delivery_days,
      product_trust_return_days: localSettings.product_trust_return_days,
      product_show_videos: localSettings.product_show_videos,
      product_show_testimonials: localSettings.product_show_testimonials,
      product_testimonials_max_display: localSettings.product_testimonials_max_display,
      product_show_size_chart: localSettings.product_show_size_chart,
      product_size_chart_default_open: localSettings.product_size_chart_default_open,
      product_show_care_section: localSettings.product_show_care_section,
      product_care_section_default_open: localSettings.product_care_section_default_open,
    } as any; // Type assertion para novos campos

    const result = await updateSettings(updates);
    if (result.data && !result.error) {
      toast.success("Configurações do catálogo salvas com sucesso!");
    } else {
      toast.error(
        "Erro ao salvar configurações: " +
          (result.error?.message || "Erro desconhecido")
      );
    }
  };

  const handleTemplateChange = async (templateName: string) => {
    const defaultColors = resetToTemplateDefaults(templateName);

    setLocalSettings((prev) => ({
      ...prev,
      template_name: templateName,
      ...defaultColors,
    }));

    const updates = {
      template_name: templateName,
      ...defaultColors,
    };

    const result = await updateSettings(updates);
    if (result.data && !result.error) {
      toast.success(`Template "${templateName}" aplicado com cores padrão!`);
    }
  };

  const handleReset = () => {
    const defaultColors = resetToTemplateDefaults(localSettings.template_name);
    setLocalSettings((prev) => ({
      ...prev,
      ...defaultColors,
      show_prices: true,
      show_stock: true,
      show_categories: true,
      show_search: true,
      show_filters: true,
      items_per_page: 12,
      catalog_title: "",
      catalog_description: "",
      seo_keywords: "",
    }));
    toast.info("Configurações resetadas para o padrão!");
  };

  const handleColorChange = (colors: any) => {
    setLocalSettings((prev) => ({
      ...prev,
      ...colors,
    }));
  };

  const handleColorReset = () => {
    const defaultColors = resetToTemplateDefaults(localSettings.template_name);
    setLocalSettings((prev) => ({
      ...prev,
      ...defaultColors,
    }));
    toast.success("Cores resetadas para o padrão do template!");
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
      icon: Settings,
      colors: ["#475569", "#F59E0B", "#DC2626"],
      features: ["Visual metálico", "Bordas definidas", "Estilo corporativo"],
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="template" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 lg:grid-cols-11">
          <TabsTrigger value="template" className="flex items-center gap-1">
            <Palette className="h-4 w-4" />
            <span className="hidden sm:inline">Template</span>
          </TabsTrigger>
          <TabsTrigger value="display" className="flex items-center gap-1">
            <Eye className="h-4 w-4" />
            <span className="hidden sm:inline">Exibição</span>
          </TabsTrigger>
          <TabsTrigger value="appearance" className="flex items-center gap-1">
            <Zap className="h-4 w-4" />
            <span className="hidden sm:inline">Aparência</span>
          </TabsTrigger>
          <TabsTrigger value="product-page" className="flex items-center gap-1">
            <ShoppingBag className="h-4 w-4" />
            <span className="hidden sm:inline">Produto</span>
          </TabsTrigger>
          <TabsTrigger value="mobile" className="flex items-center gap-1">
            <Smartphone className="h-4 w-4" />
            <span className="hidden sm:inline">Mobile</span>
          </TabsTrigger>
          <TabsTrigger value="colors" className="flex items-center gap-1">
            <Sparkles className="h-4 w-4" />
            <span className="hidden sm:inline">Cores</span>
          </TabsTrigger>
          <TabsTrigger value="footer" className="flex items-center gap-1">
            <Globe className="h-4 w-4" />
            <span className="hidden sm:inline">Footer</span>
          </TabsTrigger>
          <TabsTrigger value="orderbumps" className="flex items-center gap-1">
            <Gift className="h-4 w-4" />
            <span className="hidden sm:inline">Order Bumps</span>
          </TabsTrigger>
          <TabsTrigger value="sharing" className="flex items-center gap-1">
            <Share2 className="h-4 w-4" />
            <span className="hidden sm:inline">Links</span>
          </TabsTrigger>
          <TabsTrigger value="seo" className="flex items-center gap-1">
            <Search className="h-4 w-4" />
            <span className="hidden sm:inline">SEO</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="template" className="space-y-6">
          {/* Template Selection with Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Template do Catálogo
              </CardTitle>
              <CardDescription>
                Escolha o template visual que melhor representa sua marca. O
                template será aplicado a todo o catálogo.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {templates.map((template) => {
                  const IconComponent = template.icon;
                  return (
                    <Card
                      key={template.value}
                      className={`cursor-pointer transition-all border-2 hover:shadow-lg ${
                        localSettings.template_name === template.value
                          ? "border-blue-500 bg-blue-50 shadow-md"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                      onClick={() => handleTemplateChange(template.value)}
                    >
                      <CardContent className="p-6">
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div
                                className={`p-2 rounded-lg ${
                                  localSettings.template_name === template.value
                                    ? "bg-blue-500 text-white"
                                    : "bg-gray-100"
                                }`}
                              >
                                <IconComponent size={20} />
                              </div>
                              <div>
                                <h4 className="font-semibold text-lg">
                                  {template.label}
                                </h4>
                                <p className="text-sm text-gray-600">
                                  {template.description}
                                </p>
                              </div>
                            </div>
                            {localSettings.template_name === template.value && (
                              <Badge className="bg-blue-500">
                                <Sparkles size={12} className="mr-1" />
                                Ativo
                              </Badge>
                            )}
                          </div>

                          {/* Color Preview */}
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500">
                              Paleta:
                            </span>
                            {template.colors.map((color, index) => (
                              <div
                                key={index}
                                className="w-6 h-6 rounded-full border-2 border-white shadow-sm"
                                style={{ backgroundColor: color }}
                              />
                            ))}
                          </div>

                          {/* Features */}
                          <div className="space-y-2">
                            <span className="text-xs text-gray-500 font-medium">
                              Características:
                            </span>
                            <div className="flex flex-wrap gap-1">
                              {template.features.map((feature, index) => (
                                <Badge
                                  key={index}
                                  variant="outline"
                                  className="text-xs"
                                >
                                  {feature}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="display" className="space-y-6">
          {/* Appearance Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Configurações de Exibição
              </CardTitle>
              <CardDescription>
                Configure o que será exibido em seu catálogo
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium">Elementos Visuais</h4>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="show-prices">Exibir Preços</Label>
                    <Switch
                      id="show-prices"
                      checked={localSettings.show_prices}
                      onCheckedChange={(checked) =>
                        setLocalSettings({
                          ...localSettings,
                          show_prices: checked,
                        })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="show-stock">Exibir Estoque</Label>
                    <Switch
                      id="show-stock"
                      checked={localSettings.show_stock}
                      onCheckedChange={(checked) =>
                        setLocalSettings({
                          ...localSettings,
                          show_stock: checked,
                        })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="show-categories">Exibir Categorias</Label>
                    <Switch
                      id="show-categories"
                      checked={localSettings.show_categories}
                      onCheckedChange={(checked) =>
                        setLocalSettings({
                          ...localSettings,
                          show_categories: checked,
                        })
                      }
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium">Funcionalidades</h4>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="show-search">Barra de Pesquisa</Label>
                    <Switch
                      id="show-search"
                      checked={localSettings.show_search}
                      onCheckedChange={(checked) =>
                        setLocalSettings({
                          ...localSettings,
                          show_search: checked,
                        })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="show-filters">Filtros de Produto</Label>
                    <Switch
                      id="show-filters"
                      checked={localSettings.show_filters}
                      onCheckedChange={(checked) =>
                        setLocalSettings({
                          ...localSettings,
                          show_filters: checked,
                        })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="conversion-mode">Modo de Conversão</Label>
                    <Select
                      value={localSettings.conversion_mode}
                      onValueChange={(value: "simple" | "optimized") =>
                        setLocalSettings({
                          ...localSettings,
                          conversion_mode: value,
                        })
                      }
                    >
                      <SelectTrigger id="conversion-mode">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="simple">
                          <div className="flex items-center gap-2">
                            <Eye className="h-4 w-4" />
                            <div>
                              <div className="font-medium">Modo Simples</div>
                              <div className="text-xs text-gray-500">Interface básica e limpa</div>
                            </div>
                          </div>
                        </SelectItem>
                        <SelectItem value="optimized">
                          <div className="flex items-center gap-2">
                            <Zap className="h-4 w-4" />
                            <div>
                              <div className="font-medium">Conversão Ativa</div>
                              <div className="text-xs text-gray-500">Com badges, avaliações e urgência</div>
                            </div>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-gray-500">
                      {localSettings.conversion_mode === "optimized" 
                        ? "✨ Modo otimizado com elementos de conversão: badges de urgência, avaliações, timer de ofertas e mais."
                        : "👁️ Modo simples com interface básica sem elementos de conversão adicionais."
                      }
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="items-per-page">Itens por Página</Label>
                    <Select
                      value={localSettings.items_per_page.toString()}
                      onValueChange={(value) =>
                        setLocalSettings({
                          ...localSettings,
                          items_per_page: parseInt(value),
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="8">8 itens</SelectItem>
                        <SelectItem value="12">12 itens</SelectItem>
                        <SelectItem value="16">16 itens</SelectItem>
                        <SelectItem value="24">24 itens</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appearance" className="space-y-6">
          {/* Estilo de Botões */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Estilo de Botões
              </CardTitle>
              <CardDescription>
                Escolha o estilo dos botões que melhor combina com sua marca
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Flat */}
                <Card 
                  className={`cursor-pointer transition-all ${
                    localSettings.button_style === 'flat' 
                      ? 'ring-2 ring-primary shadow-lg' 
                      : 'hover:shadow-lg'
                  }`}
                  onClick={() => setLocalSettings({ ...localSettings, button_style: 'flat' })}
                >
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <h4 className="font-semibold flex items-center gap-2">
                        Flat
                        {localSettings.button_style === 'flat' && (
                          <Badge className="text-xs">Selecionado</Badge>
                        )}
                      </h4>
                      <p className="text-xs text-gray-500">Minimalista sem sombras</p>
                      <div className="flex items-center gap-2">
                        <button className="px-4 py-2 bg-primary text-white text-sm rounded" style={{borderRadius: '4px', boxShadow: 'none'}}>
                          Exemplo
                        </button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Modern */}
                <Card 
                  className={`cursor-pointer transition-all ${
                    localSettings.button_style === 'modern' 
                      ? 'ring-2 ring-primary shadow-lg' 
                      : 'hover:shadow-lg'
                  }`}
                  onClick={() => setLocalSettings({ ...localSettings, button_style: 'modern' })}
                >
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <h4 className="font-semibold flex items-center gap-2">
                        Modern
                        {localSettings.button_style === 'modern' && (
                          <Badge className="text-xs">Selecionado</Badge>
                        )}
                      </h4>
                      <p className="text-xs text-gray-500">Arredondado com sombras</p>
                      <div className="flex items-center gap-2">
                        <button className="px-4 py-2 bg-primary text-white text-sm rounded-lg shadow-md">
                          Exemplo
                        </button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Rounded */}
                <Card 
                  className={`cursor-pointer transition-all ${
                    localSettings.button_style === 'rounded' 
                      ? 'ring-2 ring-primary shadow-lg' 
                      : 'hover:shadow-lg'
                  }`}
                  onClick={() => setLocalSettings({ ...localSettings, button_style: 'rounded' })}
                >
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <h4 className="font-semibold flex items-center gap-2">
                        Rounded
                        {localSettings.button_style === 'rounded' && (
                          <Badge className="text-xs">Selecionado</Badge>
                        )}
                      </h4>
                      <p className="text-xs text-gray-500">Muito arredondado</p>
                      <div className="flex items-center gap-2">
                        <button className="px-6 py-3 bg-primary text-white text-sm rounded-full shadow-lg">
                          Exemplo
                        </button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>

          {/* Header Badges */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Badges no Header
              </CardTitle>
              <CardDescription>
                Gatilhos de urgência e conversão no topo do catálogo - Configure individualmente quais mostrar
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Toggle geral */}
              <div className="flex items-center justify-between pb-4 border-b">
                <div>
                  <Label htmlFor="header-badges-master">Exibir Badges no Header</Label>
                  <p className="text-xs text-gray-500 mt-1">
                    Ativar/desativar todos os badges de conversão
                  </p>
                </div>
                <Switch 
                  id="header-badges-master" 
                  checked={localSettings.header_badges_enabled}
                  onCheckedChange={(checked) => 
                    setLocalSettings({ ...localSettings, header_badges_enabled: checked })
                  }
                />
              </div>

              {/* Badge: Entrega Rápida */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Truck className="h-4 w-4 text-green-700" />
                    <Label htmlFor="badge-fast-delivery">Entrega Rápida</Label>
                  </div>
                  <Switch 
                    id="badge-fast-delivery" 
                    checked={localSettings.header_badge_fast_delivery}
                    onCheckedChange={(checked) =>
                      setLocalSettings({ ...localSettings, header_badge_fast_delivery: checked })
                    }
                  />
                </div>
                <div className="ml-6">
                  <Label htmlFor="badge-fast-delivery-text" className="text-xs text-gray-500">
                    Texto Personalizado
                  </Label>
                  <Input
                    id="badge-fast-delivery-text"
                    placeholder="Entrega Rápida em 24h"
                    className="mt-1"
                    value={localSettings.header_badge_fast_delivery_text}
                    onChange={(e) =>
                      setLocalSettings({ ...localSettings, header_badge_fast_delivery_text: e.target.value })
                    }
                  />
                </div>
              </div>

              {/* Badge: Frete Grátis */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-blue-700" />
                    <Label htmlFor="badge-free-shipping">Frete Grátis</Label>
                  </div>
                  <Switch 
                    id="badge-free-shipping" 
                    checked={localSettings.header_badge_free_shipping}
                    onCheckedChange={(checked) =>
                      setLocalSettings({ ...localSettings, header_badge_free_shipping: checked })
                    }
                  />
                </div>
                <div className="ml-6 space-y-2">
                  <div>
                    <Label htmlFor="badge-free-shipping-text" className="text-xs text-gray-500">
                      Texto Personalizado
                    </Label>
                    <Input
                      id="badge-free-shipping-text"
                      placeholder="Frete Grátis"
                      className="mt-1"
                      value={localSettings.header_badge_free_shipping_text}
                      onChange={(e) =>
                        setLocalSettings({ ...localSettings, header_badge_free_shipping_text: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="free-shipping-threshold" className="text-xs text-gray-500">
                      Valor Mínimo (deixe 0 para não mostrar)
                    </Label>
                    <Input
                      id="free-shipping-threshold"
                      type="number"
                      placeholder="200.00"
                      step="0.01"
                      className="mt-1"
                      value={localSettings.header_free_shipping_threshold}
                      onChange={(e) =>
                        setLocalSettings({ ...localSettings, header_free_shipping_threshold: parseFloat(e.target.value) || 0 })
                      }
                    />
                  </div>
                </div>
              </div>

              {/* Badge: Compra Segura */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-purple-700" />
                    <Label htmlFor="badge-secure-checkout">Compra Segura</Label>
                  </div>
                  <Switch 
                    id="badge-secure-checkout" 
                    checked={localSettings.header_badge_secure_checkout}
                    onCheckedChange={(checked) =>
                      setLocalSettings({ ...localSettings, header_badge_secure_checkout: checked })
                    }
                  />
                </div>
                <div className="ml-6">
                  <Label htmlFor="badge-secure-checkout-text" className="text-xs text-gray-500">
                    Texto Personalizado
                  </Label>
                  <Input
                    id="badge-secure-checkout-text"
                    placeholder="Compra 100% Segura"
                    className="mt-1"
                    value={localSettings.header_badge_secure_checkout_text}
                    onChange={(e) =>
                      setLocalSettings({ ...localSettings, header_badge_secure_checkout_text: e.target.value })
                    }
                  />
                </div>
              </div>

              {/* Badge Customizado */}
              <div className="space-y-3 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Star className="h-4 w-4 text-orange-700" />
                    <Label htmlFor="badge-custom-1">Badge Customizado</Label>
                  </div>
                  <Switch 
                    id="badge-custom-1" 
                    checked={localSettings.header_badge_custom_1}
                    onCheckedChange={(checked) =>
                      setLocalSettings({ ...localSettings, header_badge_custom_1: checked })
                    }
                  />
                </div>
                <div className="ml-6 space-y-2">
                  <div>
                    <Label htmlFor="badge-custom-1-text" className="text-xs text-gray-500">
                      Texto Personalizado
                    </Label>
                    <Input
                      id="badge-custom-1-text"
                      placeholder="Ex: Garantia de 30 dias"
                      className="mt-1"
                      value={localSettings.header_badge_custom_1_text}
                      onChange={(e) =>
                        setLocalSettings({ ...localSettings, header_badge_custom_1_text: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="badge-custom-1-icon" className="text-xs text-gray-500">
                      Ícone
                    </Label>
                    <Select 
                      value={localSettings.header_badge_custom_1_icon}
                      onValueChange={(value) =>
                        setLocalSettings({ ...localSettings, header_badge_custom_1_icon: value })
                      }
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="star">⭐ Estrela</SelectItem>
                        <SelectItem value="gift">🎁 Presente</SelectItem>
                        <SelectItem value="trophy">🏆 Troféu</SelectItem>
                        <SelectItem value="tag">🏷️ Tag</SelectItem>
                        <SelectItem value="zap">⚡ Raio</SelectItem>
                        <SelectItem value="truck">🚚 Caminhão</SelectItem>
                        <SelectItem value="shield">🛡️ Escudo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t">
                <p className="text-xs text-gray-500">
                  💡 <strong>Dica:</strong> Marque apenas os badges que fazem sentido para seu negócio. 
                  Por exemplo, se você não oferece frete grátis, desmarque essa opção.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Footer Style */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Estilo do Footer
              </CardTitle>
              <CardDescription>
                Personalize a aparência do rodapé
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { value: 'dark', label: 'Escuro', bg: '#1E293B', text: '#FFFFFF' },
                  { value: 'light', label: 'Claro', bg: '#FFFFFF', text: '#1E293B' },
                  { value: 'gradient', label: 'Gradiente', bg: 'linear-gradient(135deg, #0057FF, #8E2DE2)', text: '#FFFFFF' },
                ].map((style) => (
                  <Card 
                    key={style.value} 
                    className={`cursor-pointer transition-all ${
                      localSettings.footer_style === style.value
                        ? 'ring-2 ring-primary shadow-lg'
                        : 'hover:shadow-lg'
                    }`}
                    onClick={() => setLocalSettings({ ...localSettings, footer_style: style.value as any })}
                  >
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <h4 className="font-semibold flex items-center gap-2">
                          {style.label}
                          {localSettings.footer_style === style.value && (
                            <Badge className="text-xs">Selecionado</Badge>
                          )}
                        </h4>
                        <div 
                          className="h-16 rounded-lg flex items-center justify-center text-sm font-medium"
                          style={{ 
                            background: style.bg,
                            color: style.text 
                          }}
                        >
                          Footer Preview
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="product-page" className="space-y-6">
          <ProductPageSettings 
            settings={localSettings}
            onUpdate={(field, value) => setLocalSettings({ ...localSettings, [field]: value })}
          />
        </TabsContent>

        <TabsContent value="mobile" className="space-y-6">
          <MobileLayoutSettings />
        </TabsContent>

        <TabsContent value="colors" className="space-y-6">
          <AdvancedColorSettings
            colors={{
              primary_color: localSettings.primary_color,
              secondary_color: localSettings.secondary_color,
              accent_color: localSettings.accent_color,
              background_color: localSettings.background_color,
              text_color: localSettings.text_color,
              border_color: localSettings.border_color,
            }}
            onChange={handleColorChange}
            onReset={handleColorReset}
          />
        </TabsContent>

        <TabsContent value="footer" className="space-y-6">
          <FooterSettings />
        </TabsContent>

        <TabsContent value="sharing" className="space-y-6">
          <ShareableLinks />
        </TabsContent>

        <TabsContent value="orderbumps" className="space-y-6">
          <OrderBumpSettings />
        </TabsContent>

        <TabsContent value="seo" className="space-y-6">
          {/* SEO Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Configurações de SEO
              </CardTitle>
              <CardDescription>
                Otimize seu catálogo para mecanismos de busca
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="catalog-title">Título do Catálogo (SEO)</Label>
                <Input
                  id="catalog-title"
                  value={localSettings.catalog_title}
                  onChange={(e) =>
                    setLocalSettings({
                      ...localSettings,
                      catalog_title: e.target.value,
                    })
                  }
                  placeholder="Ex: Catálogo de Produtos - Minha Loja"
                />
                <p className="text-xs text-muted-foreground">
                  Aparece na aba do navegador e nos resultados de busca
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="catalog-description">
                  Descrição do Catálogo (SEO)
                </Label>
                <Input
                  id="catalog-description"
                  value={localSettings.catalog_description}
                  onChange={(e) =>
                    setLocalSettings({
                      ...localSettings,
                      catalog_description: e.target.value,
                    })
                  }
                  placeholder="Ex: Encontre os melhores produtos com os melhores preços"
                />
                <p className="text-xs text-muted-foreground">
                  Aparece nos resultados de busca do Google
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="seo-keywords">Palavras-chave (SEO)</Label>
                <Input
                  id="seo-keywords"
                  value={localSettings.seo_keywords}
                  onChange={(e) =>
                    setLocalSettings({
                      ...localSettings,
                      seo_keywords: e.target.value,
                    })
                  }
                  placeholder="Ex: produtos, loja online, varejo, atacado"
                />
                <p className="text-xs text-muted-foreground">
                  Separe as palavras-chave por vírgulas
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3 justify-end">
        <Button
          variant="outline"
          onClick={handleReset}
          className="flex items-center gap-2"
        >
          <RotateCw className="h-4 w-4" />
          Resetar
        </Button>
        <Button onClick={handleSave} className="flex items-center gap-2">
          <Save className="h-4 w-4" />
          Salvar Configurações
        </Button>
      </div>
    </div>
  );
};

export default CatalogSettings;
