import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useCatalogSettings } from '@/hooks/useCatalogSettings';
import { useProducts } from '@/hooks/useProducts';
import { useToast } from '@/hooks/use-toast';
import ShareableLinks from '@/components/settings/ShareableLinks';
import WatermarkSettings from '@/components/settings/WatermarkSettings';
import DomainSettings from '@/components/settings/DomainSettings';
import CatalogModeSettings from '@/components/settings/CatalogModeSettings';
import ModernTemplate from '@/components/catalog/templates/ModernTemplate';
import MinimalTemplate from '@/components/catalog/templates/MinimalTemplate';
import ElegantTemplate from '@/components/catalog/templates/ElegantTemplate';
import { 
  ShoppingBag, 
  Package, 
  Loader2, 
  Palette, 
  Globe, 
  Search, 
  Settings, 
  Eye,
  CreditCard,
  Truck,
  MessageSquare,
  Share2,
  Check,
  ArrowLeftRight
} from 'lucide-react';

const CatalogSettings = () => {
  const { settings, loading, updateSettings } = useCatalogSettings();
  const { products } = useProducts();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);

  // Produto de exemplo para preview dos templates
  const sampleProduct = products[0] || {
    id: 'sample',
    name: 'Produto de Exemplo',
    description: 'Esta é uma descrição de exemplo do produto',
    retail_price: 99.90,
    wholesale_price: 79.90,
    stock: 10,
    reserved_stock: 0,
    min_wholesale_qty: 1,
    allow_negative_stock: false,
    stock_alert_threshold: 5,
    image_url: '/placeholder.svg',
    store_id: '',
    category: 'Exemplo',
    is_active: true,
    is_featured: false,
    meta_title: null,
    meta_description: null,
    keywords: null,
    seo_slug: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  const templates = [
    {
      id: 'modern',
      name: 'Moderno',
      description: 'Design arrojado com gradientes e sombras vibrantes',
      component: ModernTemplate
    },
    {
      id: 'minimal',
      name: 'Minimalista',
      description: 'Layout limpo e focado no produto',
      component: MinimalTemplate
    },
    {
      id: 'elegant',
      name: 'Elegante',
      description: 'Estilo sofisticado com detalhes refinados',
      component: ElegantTemplate
    }
  ];

  const handleToggle = async (field: string, value: boolean) => {
    setSaving(true);
    const { error } = await updateSettings({ [field]: value });
    
    if (error) {
      toast({
        title: "Erro ao atualizar configuração",
        description: "Tente novamente em alguns instantes",
        variant: "destructive"
      });
    } else {
      toast({
        title: "Configuração atualizada",
        description: "As alterações foram salvas com sucesso"
      });
    }
    setSaving(false);
  };

  const handleInputChange = async (field: string, value: string) => {
    setSaving(true);
    const { error } = await updateSettings({ [field]: value });
    
    if (error) {
      toast({
        title: "Erro ao atualizar configuração",
        description: "Tente novamente em alguns instantes",
        variant: "destructive"
      });
    } else {
      toast({
        title: "Configuração atualizada",
        description: "As alterações foram salvas com sucesso"
      });
    }
    setSaving(false);
  };

  const handleTemplateChange = async (templateId: string) => {
    setSaving(true);
    try {
      const { error } = await updateSettings({
        template_name: templateId
      });

      if (error) throw error;

      toast({
        title: "Template atualizado",
        description: "O template foi alterado com sucesso!",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível alterar o template.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handlePaymentMethodChange = async (method: string, value: boolean) => {
    if (!settings) return;
    
    setSaving(true);
    const updatedPaymentMethods = {
      ...settings.payment_methods,
      [method]: value
    };
    
    const { error } = await updateSettings({ 
      payment_methods: updatedPaymentMethods 
    });
    
    if (error) {
      toast({
        title: "Erro ao atualizar forma de pagamento",
        description: "Tente novamente em alguns instantes",
        variant: "destructive"
      });
    } else {
      toast({
        title: "Forma de pagamento atualizada",
        description: "As alterações foram salvas com sucesso"
      });
    }
    setSaving(false);
  };

  const handleShippingOptionChange = async (option: string, value: boolean) => {
    if (!settings) return;
    
    setSaving(true);
    const updatedShippingOptions = {
      ...settings.shipping_options,
      [option]: value
    };
    
    const { error } = await updateSettings({ 
      shipping_options: updatedShippingOptions 
    });
    
    if (error) {
      toast({
        title: "Erro ao atualizar opção de envio",
        description: "Tente novamente em alguns instantes",
        variant: "destructive"
      });
    } else {
      toast({
        title: "Opção de envio atualizada",
        description: "As alterações foram salvas com sucesso"
      });
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-6">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  if (!settings) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-6">
          <p className="text-gray-500">Erro ao carregar configurações</p>
        </CardContent>
      </Card>
    );
  }

  const currentTemplate = settings?.template_name || 'modern';

  return (
    <div className="space-y-6">
      <Tabs defaultValue="mode" className="w-full">
        <TabsList className="grid w-full grid-cols-9">
          <TabsTrigger value="mode">Modo</TabsTrigger>
          <TabsTrigger value="catalogs">Catálogos</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="watermark">Marca d'água</TabsTrigger>
          <TabsTrigger value="sharing">Compartilhar</TabsTrigger>
          <TabsTrigger value="domain">Domínio</TabsTrigger>
          <TabsTrigger value="seo">SEO</TabsTrigger>
          <TabsTrigger value="checkout">Checkout</TabsTrigger>
          <TabsTrigger value="display">Exibição</TabsTrigger>
        </TabsList>

        {/* Modo de Catálogo */}
        <TabsContent value="mode">
          <CatalogModeSettings />
        </TabsContent>

        {/* Configurações de Catálogos */}
        <TabsContent value="catalogs">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingBag className="h-5 w-5" />
                Ativação de Catálogos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <ShoppingBag className="h-4 w-4 text-blue-600" />
                      <Label className="font-medium">Catálogo de Varejo</Label>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Permite vendas unitárias com preços de varejo
                    </p>
                  </div>
                  <Switch
                    checked={settings.retail_catalog_active}
                    onCheckedChange={(checked) => handleToggle('retail_catalog_active', checked)}
                    disabled={saving}
                  />
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-orange-600" />
                      <Label className="font-medium">Catálogo de Atacado</Label>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Permite vendas em quantidade com preços de atacado
                    </p>
                  </div>
                  <Switch
                    checked={settings.wholesale_catalog_active}
                    onCheckedChange={(checked) => handleToggle('wholesale_catalog_active', checked)}
                    disabled={saving}
                  />
                </div>
              </div>

              {/* Formas de Pagamento */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-green-600" />
                  <h3 className="text-lg font-medium">Formas de Pagamento</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <Label>PIX</Label>
                    <Switch
                      checked={settings.payment_methods.pix}
                      onCheckedChange={(checked) => handlePaymentMethodChange('pix', checked)}
                      disabled={saving}
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <Label>Boleto</Label>
                    <Switch
                      checked={settings.payment_methods.bank_slip}
                      onCheckedChange={(checked) => handlePaymentMethodChange('bank_slip', checked)}
                      disabled={saving}
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <Label>Cartão</Label>
                    <Switch
                      checked={settings.payment_methods.credit_card}
                      onCheckedChange={(checked) => handlePaymentMethodChange('credit_card', checked)}
                      disabled={saving}
                    />
                  </div>
                </div>
              </div>

              {/* Opções de Envio */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Truck className="h-5 w-5 text-blue-600" />
                  <h3 className="text-lg font-medium">Opções de Envio</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <Label>Retirada</Label>
                    <Switch
                      checked={settings.shipping_options.pickup}
                      onCheckedChange={(checked) => handleShippingOptionChange('pickup', checked)}
                      disabled={saving}
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <Label>Entrega</Label>
                    <Switch
                      checked={settings.shipping_options.delivery}
                      onCheckedChange={(checked) => handleShippingOptionChange('delivery', checked)}
                      disabled={saving}
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <Label>Envio</Label>
                    <Switch
                      checked={settings.shipping_options.shipping}
                      onCheckedChange={(checked) => handleShippingOptionChange('shipping', checked)}
                      disabled={saving}
                    />
                  </div>
                </div>
              </div>

              {/* WhatsApp */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-green-600" />
                  <h3 className="text-lg font-medium">Integração WhatsApp</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="whatsapp_number">Número do WhatsApp</Label>
                    <Input
                      id="whatsapp_number"
                      placeholder="5511999999999"
                      value={settings.whatsapp_number || ''}
                      onChange={(e) => handleInputChange('whatsapp_number', e.target.value)}
                      disabled={saving}
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <Label>Integração Ativa</Label>
                    <Switch
                      checked={settings.whatsapp_integration_active}
                      onCheckedChange={(checked) => handleToggle('whatsapp_integration_active', checked)}
                      disabled={saving}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Templates */}
        <TabsContent value="templates">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Escolha o Template do Catálogo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-6">
                Selecione o template que melhor representa sua marca. As alterações são aplicadas em tempo real.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {templates.map((template) => {
                  const TemplateComponent = template.component;
                  const isSelected = currentTemplate === template.id;
                  
                  return (
                    <Card 
                      key={template.id} 
                      className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
                        isSelected ? 'ring-2 ring-blue-500 shadow-lg' : 'hover:ring-1 hover:ring-gray-300'
                      }`}
                      onClick={() => handleTemplateChange(template.id)}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold">{template.name}</h3>
                          {isSelected && (
                            <Badge variant="default" className="text-xs">
                              <Check className="h-3 w-3 mr-1" />
                              Ativo
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {template.description}
                        </p>
                      </CardHeader>
                      
                      <CardContent className="pt-0">
                        {/* Preview do Template */}
                        <div className="bg-gray-50 p-4 rounded-lg mb-4">
                          <div className="transform scale-75 origin-top-left">
                            <TemplateComponent
                              product={sampleProduct}
                              catalogType="retail"
                              onAddToCart={() => {}}
                              onAddToWishlist={() => {}}
                              onQuickView={() => {}}
                              isInWishlist={false}
                              showPrices={true}
                              showStock={true}
                            />
                          </div>
                        </div>
                        
                        <Button 
                          variant={isSelected ? "default" : "outline"}
                          className="w-full"
                          disabled={saving}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleTemplateChange(template.id);
                          }}
                        >
                          {isSelected ? (
                            <>
                              <Check className="mr-2 h-4 w-4" />
                              Selecionado
                            </>
                          ) : (
                            <>
                              <Eye className="mr-2 h-4 w-4" />
                              Usar Este Template
                            </>
                          )}
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
              
              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">Sobre os Templates:</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• As alterações são aplicadas instantaneamente no catálogo</li>
                  <li>• Cada template é otimizado para diferentes tipos de produtos</li>
                  <li>• Todos os templates são responsivos e funcionam em mobile</li>
                  <li>• Você pode trocar o template a qualquer momento</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Marca d'água */}
        <TabsContent value="watermark">
          <WatermarkSettings />
        </TabsContent>

        {/* Links Compartilháveis */}
        <TabsContent value="sharing">
          <ShareableLinks />
        </TabsContent>

        {/* Domínio */}
        <TabsContent value="domain">
          <DomainSettings />
        </TabsContent>

        {/* SEO */}
        <TabsContent value="seo">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Otimização para Motores de Busca (SEO)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="seo_title">Título SEO</Label>
                <Input
                  id="seo_title"
                  placeholder="Título que aparece nos resultados de busca"
                  value={settings.seo_title || ''}
                  onChange={(e) => handleInputChange('seo_title', e.target.value)}
                  disabled={saving}
                />
              </div>
              <div>
                <Label htmlFor="seo_description">Descrição SEO</Label>
                <Textarea
                  id="seo_description"
                  placeholder="Descrição que aparece nos resultados de busca"
                  value={settings.seo_description || ''}
                  onChange={(e) => handleInputChange('seo_description', e.target.value)}
                  disabled={saving}
                />
              </div>
              <div>
                <Label htmlFor="seo_keywords">Palavras-chave</Label>
                <Input
                  id="seo_keywords"
                  placeholder="palavra1, palavra2, palavra3"
                  value={settings.seo_keywords || ''}
                  onChange={(e) => handleInputChange('seo_keywords', e.target.value)}
                  disabled={saving}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Checkout */}
        <TabsContent value="checkout">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Configurações de Checkout
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="checkout_type">Tipo de Checkout</Label>
                <Select 
                  value={settings.checkout_type} 
                  onValueChange={(value) => handleInputChange('checkout_type', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo de checkout" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="whatsapp">Apenas WhatsApp</SelectItem>
                    <SelectItem value="online">Apenas Online</SelectItem>
                    <SelectItem value="both">Ambos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Exibição */}
        <TabsContent value="display">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Configurações de Exibição
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <Label className="font-medium">Mostrar Preços</Label>
                    <p className="text-sm text-muted-foreground">Exibir preços dos produtos</p>
                  </div>
                  <Switch
                    checked={settings.show_prices}
                    onCheckedChange={(checked) => handleToggle('show_prices', checked)}
                    disabled={saving}
                  />
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <Label className="font-medium">Mostrar Estoque</Label>
                    <p className="text-sm text-muted-foreground">Exibir quantidade em estoque</p>
                  </div>
                  <Switch
                    checked={settings.show_stock}
                    onCheckedChange={(checked) => handleToggle('show_stock', checked)}
                    disabled={saving}
                  />
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <Label className="font-medium">Filtro por Categoria</Label>
                    <p className="text-sm text-muted-foreground">Permitir filtrar por categorias</p>
                  </div>
                  <Switch
                    checked={settings.allow_categories_filter}
                    onCheckedChange={(checked) => handleToggle('allow_categories_filter', checked)}
                    disabled={saving}
                  />
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <Label className="font-medium">Filtro por Preço</Label>
                    <p className="text-sm text-muted-foreground">Permitir filtrar por faixa de preço</p>
                  </div>
                  <Switch
                    checked={settings.allow_price_filter}
                    onCheckedChange={(checked) => handleToggle('allow_price_filter', checked)}
                    disabled={saving}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {saving && (
        <div className="fixed bottom-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          Salvando...
        </div>
      )}
    </div>
  );
};

export default CatalogSettings;
