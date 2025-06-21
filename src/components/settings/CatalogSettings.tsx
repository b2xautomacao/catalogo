import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useCatalogSettings } from '@/hooks/useCatalogSettings';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
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
  Sparkles
} from 'lucide-react';

const CatalogSettings = () => {
  const { profile } = useAuth();
  const { settings, loading, updateSettings } = useCatalogSettings();
  
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
    font_family: 'Inter',
    custom_css: ''
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
        primary_color: (settings as any).primary_color || '#0057FF',
        secondary_color: (settings as any).secondary_color || '#FF6F00',
        font_family: 'Inter',
        custom_css: ''
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
      primary_color: localSettings.primary_color,
      secondary_color: localSettings.secondary_color
    };

    const result = await updateSettings(updates);
    if (result.data && !result.error) {
      toast.success('Configurações do catálogo salvas com sucesso!');
    } else {
      toast.error('Erro ao salvar configurações: ' + (result.error?.message || 'Erro desconhecido'));
    }
  };

  const handleReset = () => {
    setLocalSettings({
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
      font_family: 'Inter',
      custom_css: ''
    });
    toast.info('Configurações resetadas para o padrão!');
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
                  onClick={() => setLocalSettings({...localSettings, template_name: template.value})}
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

      {/* Branding */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Informações do Catálogo
          </CardTitle>
          <CardDescription>
            Personalize as informações exibidas no seu catálogo
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="catalog-title">Título do Catálogo</Label>
            <Input
              id="catalog-title"
              value={localSettings.catalog_title}
              onChange={(e) => setLocalSettings({...localSettings, catalog_title: e.target.value})}
              placeholder="Ex: Catálogo de Produtos"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="catalog-description">Descrição do Catálogo</Label>
            <Input
              id="catalog-description"
              value={localSettings.catalog_description}
              onChange={(e) => setLocalSettings({...localSettings, catalog_description: e.target.value})}
              placeholder="Ex: Encontre os melhores produtos aqui"
            />
          </div>
        </CardContent>
      </Card>

      {/* Colors - Enhanced */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Cores Personalizadas
          </CardTitle>
          <CardDescription>
            Personalize as cores do template selecionado. As cores serão aplicadas a todo o catálogo.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="primary-color">Cor Primária</Label>
              <div className="flex gap-2">
                <Input
                  id="primary-color"
                  type="color"
                  value={localSettings.primary_color}
                  onChange={(e) => setLocalSettings({...localSettings, primary_color: e.target.value})}
                  className="w-16 h-10 p-1 border rounded"
                />
                <Input
                  value={localSettings.primary_color}
                  onChange={(e) => setLocalSettings({...localSettings, primary_color: e.target.value})}
                  placeholder="#0057FF"
                  className="flex-1"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="secondary-color">Cor Secundária</Label>
              <div className="flex gap-2">
                <Input
                  id="secondary-color"
                  type="color"
                  value={localSettings.secondary_color}
                  onChange={(e) => setLocalSettings({...localSettings, secondary_color: e.target.value})}
                  className="w-16 h-10 p-1 border rounded"
                />
                <Input
                  value={localSettings.secondary_color}
                  onChange={(e) => setLocalSettings({...localSettings, secondary_color: e.target.value})}
                  placeholder="#FF6F00"
                  className="flex-1"
                />
              </div>
            </div>
          </div>
          
          {/* Color Preview */}
          <div className="mt-4 p-4 rounded-lg border-2 border-dashed border-gray-300">
            <h4 className="text-sm font-medium mb-3">Preview das Cores:</h4>
            <div className="flex gap-4">
              <div 
                className="px-4 py-2 rounded text-white font-medium"
                style={{ backgroundColor: localSettings.primary_color }}
              >
                Cor Primária
              </div>
              <div 
                className="px-4 py-2 rounded text-white font-medium"
                style={{ backgroundColor: localSettings.secondary_color }}
              >
                Cor Secundária
              </div>
              <div 
                className="px-4 py-2 rounded text-white font-medium"
                style={{ 
                  background: `linear-gradient(135deg, ${localSettings.primary_color}, ${localSettings.secondary_color})` 
                }}
              >
                Gradiente
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

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
