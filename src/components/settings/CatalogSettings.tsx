
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCatalogSettings } from '@/hooks/useCatalogSettings';
import { useToast } from '@/hooks/use-toast';
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
  MessageSquare
} from 'lucide-react';

const CatalogSettings = () => {
  const { settings, loading, updateSettings } = useCatalogSettings();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);

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

  return (
    <div className="space-y-6">
      <Tabs defaultValue="catalogs" className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="catalogs">Catálogos</TabsTrigger>
          <TabsTrigger value="template">Template</TabsTrigger>
          <TabsTrigger value="domain">Domínio</TabsTrigger>
          <TabsTrigger value="seo">SEO</TabsTrigger>
          <TabsTrigger value="checkout">Checkout</TabsTrigger>
          <TabsTrigger value="display">Exibição</TabsTrigger>
        </TabsList>

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

        {/* Template */}
        <TabsContent value="template">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Template do Catálogo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="template_name">Template</Label>
                <Select 
                  value={settings.template_name} 
                  onValueChange={(value) => handleInputChange('template_name', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um template" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">Padrão</SelectItem>
                    <SelectItem value="modern">Moderno</SelectItem>
                    <SelectItem value="minimal">Minimalista</SelectItem>
                    <SelectItem value="elegant">Elegante</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Domínio */}
        <TabsContent value="domain">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Configurações de Domínio
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="custom_domain">Domínio Personalizado</Label>
                <Input
                  id="custom_domain"
                  placeholder="meusite.com.br"
                  value={settings.custom_domain || ''}
                  onChange={(e) => handleInputChange('custom_domain', e.target.value)}
                  disabled={saving}
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Deixe em branco para usar o domínio padrão
                </p>
              </div>
              <div>
                <Label htmlFor="catalog_url_slug">URL do Catálogo</Label>
                <Input
                  id="catalog_url_slug"
                  placeholder="minha-loja"
                  value={settings.catalog_url_slug || ''}
                  onChange={(e) => handleInputChange('catalog_url_slug', e.target.value)}
                  disabled={saving}
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Personaliza a URL do seu catálogo
                </p>
              </div>
            </CardContent>
          </Card>
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
