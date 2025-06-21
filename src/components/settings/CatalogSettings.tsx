
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCatalogSettings } from '@/hooks/useCatalogSettings';
import { useTemplateColors } from '@/hooks/useTemplateColors';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import AdvancedColorSettings from './AdvancedColorSettings';
import ShareableLinks from './ShareableLinks';
import CatalogModeSettings from './CatalogModeSettings';
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
  ArrowLeftRight,
  Search,
  Globe
} from 'lucide-react';

const CatalogSettings = () => {
  const { profile } = useAuth();
  const { settings, loading, updateSettings } = useCatalogSettings();
  const { resetToTemplateDefaults } = useTemplateColors();
  
  const [localSettings, setLocalSettings] = useState({
    template_name: 'modern',
    show_prices: true,
    show_stock: true,
    show_categories: true,
    show_search: true,
    show_filters: true,
    items_per_page: 12,
    catalog_title: '',
    catalog_description: '',
    primary_color: '#0057FF',
    secondary_color: '#FF6F00',
    accent_color: '#8E2DE2',
    background_color: '#F8FAFC',
    text_color: '#1E293B',
    border_color: '#E2E8F0',
    font_family: 'Inter',
    custom_css: '',
    seo_keywords: ''
  });

  useEffect(() => {
    if (settings) {
      setLocalSettings({
        template_name: settings.template_name || 'modern',
        show_prices: settings.show_prices !== false,
        show_stock: settings.show_stock !== false,
        show_categories: settings.allow_categories_filter !== false,
        show_search: true,
        show_filters: settings.allow_price_filter !== false,
        items_per_page: 12,
        catalog_title: settings.seo_title || '',
        catalog_description: settings.seo_description || '',
        primary_color: settings.primary_color || '#0057FF',
        secondary_color: settings.secondary_color || '#FF6F00',
        accent_color: settings.accent_color || '#8E2DE2',
        background_color: settings.background_color || '#F8FAFC',
        text_color: settings.text_color || '#1E293B',
        border_color: settings.border_color || '#E2E8F0',
        font_family: 'Inter',
        custom_css: '',
        seo_keywords: settings.seo_keywords || ''
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
    };

    const result = await updateSettings(updates);
    if (result.data && !result.error) {
      toast.success('Configurações do catálogo salvas com sucesso!');
    } else {
      toast.error('Erro ao salvar configurações: ' + (result.error?.message || 'Erro desconhecido'));
    }
  };

  const handleTemplateChange = async (templateName: string) => {
    // Aplicar cores padrão do template selecionado
    const defaultColors = resetToTemplateDefaults(templateName);
    
    setLocalSettings(prev => ({
      ...prev,
      template_name: templateName,
      ...defaultColors
    }));

    // Salvar automaticamente a mudança de template com cores padrão
    const updates = {
      template_name: templateName,
      ...defaultColors
    };

    const result = await updateSettings(updates);
    if (result.data && !result.error) {
      toast.success(`Template "${templateName}" aplicado com cores padrão!`);
    }
  };

  const handleReset = () => {
    const defaultColors = resetToTemplateDefaults(localSettings.template_name);
    setLocalSettings(prev => ({
      ...prev,
      ...defaultColors,
      show_prices: true,
      show_stock: true,
      show_categories: true,
      show_search: true,
      show_filters: true,
      items_per_page: 12,
      catalog_title: '',
      catalog_description: '',
      seo_keywords: ''
    }));
    toast.info('Configurações resetadas para o padrão!');
  };

  const handleColorChange = (colors: any) => {
    setLocalSettings(prev => ({
      ...prev,
      ...colors
    }));
  };

  const handleColorReset = () => {
    const defaultColors = resetToTemplateDefaults(localSettings.template_name);
    setLocalSettings(prev => ({
      ...prev,
      ...defaultColors
    }));
    toast.success('Cores resetadas para o padrão do template!');
  };

  const templates = [
    { 
      value: 'modern', 
      label: 'Moderno', 
      description: 'Design limpo e contemporâneo',
      icon: Monitor,
      colors: ['#0057FF', '#FF6F00', '#8E2DE2'],
      features: ['Gradientes suaves', 'Animações fluidas', 'Layout responsivo']
    },
    { 
      value: 'minimal', 
      label: 'Minimalista', 
      description: 'Focado no essencial',
      icon: Zap,
      colors: ['#1F2937', '#059669', '#DC2626'],
      features: ['Design limpo', 'Tipografia clara', 'Navegação simples']
    },
    { 
      value: 'elegant', 
      label: 'Elegante', 
      description: 'Sofisticado e refinado',
      icon: Crown,
      colors: ['#D97706', '#92400E', '#7C2D12'],
      features: ['Tons dourados', 'Elementos premium', 'Detalhes refinados']
    },
    { 
      value: 'industrial', 
      label: 'Industrial', 
      description: 'Robusto e profissional',
      icon: Settings,
      colors: ['#475569', '#F59E0B', '#DC2626'],
      features: ['Visual metálico', 'Bordas definidas', 'Estilo corporativo']
    }
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
        <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6">
          <TabsTrigger value="template" className="flex items-center gap-1">
            <Palette className="h-4 w-4" />
            <span className="hidden sm:inline">Template</span>
          </TabsTrigger>
          <TabsTrigger value="mode" className="flex items-center gap-1">
            <ArrowLeftRight className="h-4 w-4" />
            <span className="hidden sm:inline">Modo</span>
          </TabsTrigger>
          <TabsTrigger value="display" className="flex items-center gap-1">
            <Eye className="h-4 w-4" />
            <span className="hidden sm:inline">Exibição</span>
          </TabsTrigger>
          <TabsTrigger value="colors" className="flex items-center gap-1">
            <Sparkles className="h-4 w-4" />
            <span className="hidden sm:inline">Cores</span>
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
                Escolha o template visual que melhor representa sua marca. O template será aplicado a todo o catálogo.
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
                          ? 'border-blue-500 bg-blue-50 shadow-md' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => handleTemplateChange(template.value)}
                    >
                      <CardContent className="p-6">
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className={`p-2 rounded-lg ${localSettings.template_name === template.value ? 'bg-blue-500 text-white' : 'bg-gray-100'}`}>
                                <IconComponent size={20} />
                              </div>
                              <div>
                                <h4 className="font-semibold text-lg">{template.label}</h4>
                                <p className="text-sm text-gray-600">{template.description}</p>
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
                            <span className="text-xs text-gray-500">Paleta:</span>
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
                            <span className="text-xs text-gray-500 font-medium">Características:</span>
                            <div className="flex flex-wrap gap-1">
                              {template.features.map((feature, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
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

        <TabsContent value="mode" className="space-y-6">
          <CatalogModeSettings />
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
                        setLocalSettings({...localSettings, show_prices: checked})
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="show-stock">Exibir Estoque</Label>
                    <Switch
                      id="show-stock"
                      checked={localSettings.show_stock}
                      onCheckedChange={(checked) => 
                        setLocalSettings({...localSettings, show_stock: checked})
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="show-categories">Exibir Categorias</Label>
                    <Switch
                      id="show-categories"
                      checked={localSettings.show_categories}
                      onCheckedChange={(checked) => 
                        setLocalSettings({...localSettings, show_categories: checked})
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
                        setLocalSettings({...localSettings, show_search: checked})
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="show-filters">Filtros de Produto</Label>
                    <Switch
                      id="show-filters"
                      checked={localSettings.show_filters}
                      onCheckedChange={(checked) => 
                        setLocalSettings({...localSettings, show_filters: checked})
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="items-per-page">Itens por Página</Label>
                    <Select
                      value={localSettings.items_per_page.toString()}
                      onValueChange={(value) => 
                        setLocalSettings({...localSettings, items_per_page: parseInt(value)})
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

        <TabsContent value="sharing" className="space-y-6">
          <ShareableLinks />
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
                  onChange={(e) => setLocalSettings({...localSettings, catalog_title: e.target.value})}
                  placeholder="Ex: Catálogo de Produtos - Minha Loja"
                />
                <p className="text-xs text-muted-foreground">
                  Aparece na aba do navegador e nos resultados de busca
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="catalog-description">Descrição do Catálogo (SEO)</Label>
                <Input
                  id="catalog-description"
                  value={localSettings.catalog_description}
                  onChange={(e) => setLocalSettings({...localSettings, catalog_description: e.target.value})}
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
                  onChange={(e) => setLocalSettings({...localSettings, seo_keywords: e.target.value})}
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
        <Button
          onClick={handleSave}
          className="flex items-center gap-2"
        >
          <Save className="h-4 w-4" />
          Salvar Configurações
        </Button>
      </div>
    </div>
  );
};

export default CatalogSettings;
