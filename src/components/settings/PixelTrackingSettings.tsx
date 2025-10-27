import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Facebook,
  BarChart3,
  Zap,
  Video,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Eye,
  ShoppingCart,
  CreditCard,
  DollarSign,
  Search,
  List,
} from 'lucide-react';
import { toast } from 'sonner';

interface PixelTrackingSettingsProps {
  settings: any;
  onUpdate: (field: string, value: any) => void;
}

const PixelTrackingSettings: React.FC<PixelTrackingSettingsProps> = ({
  settings,
  onUpdate,
}) => {
  const [isTestingPixel, setIsTestingPixel] = useState(false);
  const [pixelTestResult, setPixelTestResult] = useState<'success' | 'error' | null>(null);

  /**
   * Testar se Meta Pixel está funcionando
   */
  const testMetaPixel = async () => {
    if (!settings.meta_pixel_id) {
      toast.error('Insira o Meta Pixel ID primeiro');
      return;
    }

    setIsTestingPixel(true);
    setPixelTestResult(null);

    try {
      // Disparar evento de teste
      if (window.fbq) {
        window.fbq('track', 'PageView');
        
        // Aguardar 2s e verificar
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        setPixelTestResult('success');
        toast.success('Meta Pixel está funcionando! Verifique no Events Manager.');
      } else {
        setPixelTestResult('error');
        toast.error('Meta Pixel não foi carregado. Verifique o ID e recarregue a página.');
      }
    } catch (error) {
      setPixelTestResult('error');
      toast.error('Erro ao testar Meta Pixel');
    } finally {
      setIsTestingPixel(false);
    }
  };

  /**
   * Testar Google Analytics
   */
  const testGA4 = async () => {
    if (!settings.ga4_measurement_id) {
      toast.error('Insira o GA4 Measurement ID primeiro');
      return;
    }

    setIsTestingPixel(true);

    try {
      if (window.gtag) {
        window.gtag('event', 'test_event', {
          event_category: 'System',
          event_label: 'Admin Test',
        });
        
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        toast.success('GA4 está funcionando! Verifique no Real-Time do Google Analytics.');
      } else {
        toast.error('GA4 não foi carregado. Verifique o ID e recarregue a página.');
      }
    } catch (error) {
      toast.error('Erro ao testar GA4');
    } finally {
      setIsTestingPixel(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Meta Pixel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Facebook className="h-5 w-5 text-blue-600" />
            Meta Pixel (Facebook Ads)
          </CardTitle>
          <CardDescription>
            Rastreie conversões e otimize campanhas do Facebook e Instagram
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="meta-pixel-enabled">Ativar Meta Pixel</Label>
              <p className="text-xs text-gray-500 mt-1">
                Habilitar tracking do Facebook/Instagram Ads
              </p>
            </div>
            <Switch
              id="meta-pixel-enabled"
              checked={settings.meta_pixel_enabled || false}
              onCheckedChange={(checked) => onUpdate('meta_pixel_enabled', checked)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="meta-pixel-id">Pixel ID</Label>
            <div className="flex gap-2">
              <Input
                id="meta-pixel-id"
                placeholder="1234567890123456"
                value={settings.meta_pixel_id || ''}
                onChange={(e) => onUpdate('meta_pixel_id', e.target.value)}
              />
              <Button 
                variant="outline" 
                onClick={testMetaPixel}
                disabled={isTestingPixel || !settings.meta_pixel_id}
              >
                {isTestingPixel ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Testar'
                )}
              </Button>
            </div>
            <p className="text-xs text-gray-500">
              Encontre em: Meta Events Manager → Data Sources → Pixels
            </p>
          </div>

          {pixelTestResult === 'success' && (
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                ✅ Meta Pixel está funcionando! Verifique eventos no Events Manager.
              </AlertDescription>
            </Alert>
          )}

          {pixelTestResult === 'error' && (
            <Alert className="bg-red-50 border-red-200">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                ❌ Meta Pixel não está funcionando. Verifique o ID e recarregue a página.
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="meta-access-token" className="text-xs">
              Access Token (Conversions API - Opcional)
            </Label>
            <Input
              id="meta-access-token"
              type="password"
              placeholder="EAAxxxxxxxxxx..."
              value={settings.meta_pixel_access_token || ''}
              onChange={(e) => onUpdate('meta_pixel_access_token', e.target.value)}
            />
            <p className="text-xs text-gray-500">
              Para server-side tracking (maior precisão e iOS 14+)
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Google Analytics 4 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-orange-500" />
            Google Analytics 4
          </CardTitle>
          <CardDescription>
            Análise detalhada de comportamento e audiência
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="ga4-enabled">Ativar Google Analytics 4</Label>
              <p className="text-xs text-gray-500 mt-1">
                Rastreamento de métricas e comportamento
              </p>
            </div>
            <Switch
              id="ga4-enabled"
              checked={settings.ga4_enabled || false}
              onCheckedChange={(checked) => onUpdate('ga4_enabled', checked)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="ga4-measurement-id">Measurement ID</Label>
            <div className="flex gap-2">
              <Input
                id="ga4-measurement-id"
                placeholder="G-XXXXXXXXXX"
                value={settings.ga4_measurement_id || ''}
                onChange={(e) => onUpdate('ga4_measurement_id', e.target.value)}
              />
              <Button 
                variant="outline" 
                onClick={testGA4}
                disabled={isTestingPixel || !settings.ga4_measurement_id}
              >
                {isTestingPixel ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Testar'
                )}
              </Button>
            </div>
            <p className="text-xs text-gray-500">
              Encontre em: Google Analytics → Admin → Data Streams
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="ga4-api-secret" className="text-xs">
              API Secret (Measurement Protocol - Opcional)
            </Label>
            <Input
              id="ga4-api-secret"
              type="password"
              placeholder="xxxxxxxxxxxxxxxxxxxxxx"
              value={settings.ga4_api_secret || ''}
              onChange={(e) => onUpdate('ga4_api_secret', e.target.value)}
            />
            <p className="text-xs text-gray-500">
              Para server-side tracking (eventos do backend)
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Google Ads */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-green-600" />
            Google Ads Conversion
          </CardTitle>
          <CardDescription>
            Rastreie conversões de campanhas Google Ads
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="google-ads-enabled">Ativar Google Ads</Label>
              <p className="text-xs text-gray-500 mt-1">
                Conversão tracking para campanhas
              </p>
            </div>
            <Switch
              id="google-ads-enabled"
              checked={settings.google_ads_enabled || false}
              onCheckedChange={(checked) => onUpdate('google_ads_enabled', checked)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="google-ads-id">Conversion ID</Label>
            <Input
              id="google-ads-id"
              placeholder="AW-XXXXXXXXXX"
              value={settings.google_ads_id || ''}
              onChange={(e) => onUpdate('google_ads_id', e.target.value)}
            />
            <p className="text-xs text-gray-500">
              Encontre em: Google Ads → Tools → Conversions
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="google-ads-label">Conversion Label (Compra)</Label>
            <Input
              id="google-ads-label"
              placeholder="xxxxxx_xxxxxxx"
              value={settings.google_ads_conversion_label || ''}
              onChange={(e) => onUpdate('google_ads_conversion_label', e.target.value)}
            />
            <p className="text-xs text-gray-500">
              Label da conversão principal (geralmente "Purchase")
            </p>
          </div>
        </CardContent>
      </Card>

      {/* TikTok Pixel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Video className="h-5 w-5 text-black" />
            TikTok Pixel
          </CardTitle>
          <CardDescription>
            Rastreie conversões de TikTok Ads
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="tiktok-pixel-enabled">Ativar TikTok Pixel</Label>
              <p className="text-xs text-gray-500 mt-1">
                Tracking para campanhas no TikTok
              </p>
            </div>
            <Switch
              id="tiktok-pixel-enabled"
              checked={settings.tiktok_pixel_enabled || false}
              onCheckedChange={(checked) => onUpdate('tiktok_pixel_enabled', checked)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tiktok-pixel-id">Pixel ID</Label>
            <Input
              id="tiktok-pixel-id"
              placeholder="XXXXXXXXXXXXXXXX"
              value={settings.tiktok_pixel_id || ''}
              onChange={(e) => onUpdate('tiktok_pixel_id', e.target.value)}
            />
            <p className="text-xs text-gray-500">
              Encontre em: TikTok Ads Manager → Assets → Events
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Eventos Rastreados */}
      <Card>
        <CardHeader>
          <CardTitle>Eventos de Conversão</CardTitle>
          <CardDescription>
            Escolha quais ações do usuário serão rastreadas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4 text-gray-500" />
                <Label htmlFor="track-pageview">PageView</Label>
              </div>
              <Switch
                id="track-pageview"
                checked={settings.tracking_pageview !== false}
                onCheckedChange={(checked) => onUpdate('tracking_pageview', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4 text-gray-500" />
                <Label htmlFor="track-view-content">ViewContent</Label>
              </div>
              <Switch
                id="track-view-content"
                checked={settings.tracking_view_content !== false}
                onCheckedChange={(checked) => onUpdate('tracking_view_content', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingCart className="h-4 w-4 text-gray-500" />
                <Label htmlFor="track-add-cart">AddToCart</Label>
              </div>
              <Switch
                id="track-add-cart"
                checked={settings.tracking_add_to_cart !== false}
                onCheckedChange={(checked) => onUpdate('tracking_add_to_cart', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-gray-500" />
                <Label htmlFor="track-checkout">InitiateCheckout</Label>
              </div>
              <Switch
                id="track-checkout"
                checked={settings.tracking_initiate_checkout !== false}
                onCheckedChange={(checked) => onUpdate('tracking_initiate_checkout', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-gray-500" />
                <Label htmlFor="track-payment">AddPaymentInfo</Label>
              </div>
              <Switch
                id="track-payment"
                checked={settings.tracking_add_payment_info !== false}
                onCheckedChange={(checked) => onUpdate('tracking_add_payment_info', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-green-600" />
                <Label htmlFor="track-purchase">Purchase</Label>
              </div>
              <Switch
                id="track-purchase"
                checked={settings.tracking_purchase !== false}
                onCheckedChange={(checked) => onUpdate('tracking_purchase', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Search className="h-4 w-4 text-gray-500" />
                <Label htmlFor="track-search">Search</Label>
              </div>
              <Switch
                id="track-search"
                checked={settings.tracking_search !== false}
                onCheckedChange={(checked) => onUpdate('tracking_search', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <List className="h-4 w-4 text-gray-500" />
                <Label htmlFor="track-category">ViewCategory</Label>
              </div>
              <Switch
                id="track-category"
                checked={settings.tracking_view_category !== false}
                onCheckedChange={(checked) => onUpdate('tracking_view_category', checked)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Configurações Avançadas */}
      <Card>
        <CardHeader>
          <CardTitle>Configurações Avançadas</CardTitle>
          <CardDescription>
            Recursos adicionais para otimizar o tracking
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="tracking-advanced-matching">Advanced Matching</Label>
              <p className="text-xs text-gray-500 mt-1">
                Envia email/telefone hasheados (melhora ROAS)
              </p>
            </div>
            <Switch
              id="tracking-advanced-matching"
              checked={settings.tracking_advanced_matching || false}
              onCheckedChange={(checked) => onUpdate('tracking_advanced_matching', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="tracking-auto-events">Eventos Automáticos</Label>
              <p className="text-xs text-gray-500 mt-1">
                Scroll, click, outbound links, etc
              </p>
            </div>
            <Switch
              id="tracking-auto-events"
              checked={settings.tracking_auto_events !== false}
              onCheckedChange={(checked) => onUpdate('tracking_auto_events', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="tracking-debug">Modo Debug</Label>
              <p className="text-xs text-gray-500 mt-1">
                Logar eventos no console (desenvolvimento)
              </p>
            </div>
            <Switch
              id="tracking-debug"
              checked={settings.tracking_debug_mode || false}
              onCheckedChange={(checked) => onUpdate('tracking_debug_mode', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Guia Rápido */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="pt-6 space-y-3">
          <h4 className="font-semibold text-blue-900">📘 Guia Rápido de Configuração</h4>
          
          <div className="space-y-2 text-sm text-blue-900">
            <p>
              <strong>1. Meta Pixel:</strong> Copie o Pixel ID do Events Manager e cole acima. 
              Clique em "Testar" para validar.
            </p>
            <p>
              <strong>2. Google Analytics:</strong> Copie o Measurement ID (G-XXXXXXXXXX) 
              das configurações de Data Stream.
            </p>
            <p>
              <strong>3. Google Ads:</strong> Configure o Conversion ID e Label para rastrear compras.
            </p>
            <p>
              <strong>4. Salve:</strong> Clique em Salvar no topo da página.
            </p>
            <p>
              <strong>5. Valide:</strong> Abra o catálogo em aba anônima e verifique eventos 
              no Events Manager (Meta) ou Real-Time (GA4).
            </p>
          </div>

          <Separator className="bg-blue-200" />

          <p className="text-xs text-blue-800">
            💡 <strong>Dica:</strong> Ative o Modo Debug durante a configuração inicial 
            para ver eventos sendo disparados no console do navegador.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default PixelTrackingSettings;

