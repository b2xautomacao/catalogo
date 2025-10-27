import React from 'react';
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
import { Separator } from '@/components/ui/separator';
import {
  Zap,
  TrendingUp,
  Star,
  Shield,
  Video,
  MessageSquare,
  Ruler,
  Info,
} from 'lucide-react';

interface ProductPageSettingsProps {
  settings: any;
  onUpdate: (field: string, value: any) => void;
}

const ProductPageSettings: React.FC<ProductPageSettingsProps> = ({
  settings,
  onUpdate,
}) => {
  return (
    <div className="space-y-6">
      {/* Badges de Urgência */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-orange-500" />
            Badges de Urgência
          </CardTitle>
          <CardDescription>
            Gatilhos de escassez e urgência que incentivam a compra
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Toggle Master */}
          <div className="flex items-center justify-between pb-4 border-b">
            <div>
              <Label htmlFor="product-urgency-master">Exibir Badges de Urgência</Label>
              <p className="text-xs text-gray-500 mt-1">
                Ativa/desativa todos os badges de urgência
              </p>
            </div>
            <Switch
              id="product-urgency-master"
              checked={settings.product_show_urgency_badges !== false}
              onCheckedChange={(checked) => onUpdate('product_show_urgency_badges', checked)}
            />
          </div>

          {/* Badges Individuais */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="product-low-stock">Estoque Baixo</Label>
              <Switch
                id="product-low-stock"
                checked={settings.product_show_low_stock_badge !== false}
                onCheckedChange={(checked) => onUpdate('product_show_low_stock_badge', checked)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="low-stock-threshold" className="text-xs">
                Threshold de Estoque Baixo
              </Label>
              <Input
                id="low-stock-threshold"
                type="number"
                value={settings.product_low_stock_threshold || 10}
                onChange={(e) => onUpdate('product_low_stock_threshold', parseInt(e.target.value))}
                className="h-9"
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="product-best-seller">Mais Vendido</Label>
              <Switch
                id="product-best-seller"
                checked={settings.product_show_best_seller_badge !== false}
                onCheckedChange={(checked) => onUpdate('product_show_best_seller_badge', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="product-sales-count">Contador de Vendas</Label>
              <Switch
                id="product-sales-count"
                checked={settings.product_show_sales_count !== false}
                onCheckedChange={(checked) => onUpdate('product_show_sales_count', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="product-views-count">Contador de Visualizações</Label>
              <Switch
                id="product-views-count"
                checked={settings.product_show_views_count !== false}
                onCheckedChange={(checked) => onUpdate('product_show_views_count', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="product-free-shipping-badge">Frete Grátis</Label>
              <Switch
                id="product-free-shipping-badge"
                checked={settings.product_show_free_shipping_badge !== false}
                onCheckedChange={(checked) => onUpdate('product_show_free_shipping_badge', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="product-fast-delivery-badge">Entrega Rápida</Label>
              <Switch
                id="product-fast-delivery-badge"
                checked={settings.product_show_fast_delivery_badge !== false}
                onCheckedChange={(checked) => onUpdate('product_show_fast_delivery_badge', checked)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Prova Social */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-500" />
            Prova Social
          </CardTitle>
          <CardDescription>
            Elementos que mostram que outras pessoas confiam e compram
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="product-social-carousel">Carrossel de Prova Social</Label>
              <p className="text-xs text-gray-500 mt-1">
                "X pessoas viram", "Y vendidos hoje", etc
              </p>
            </div>
            <Switch
              id="product-social-carousel"
              checked={settings.product_show_social_proof_carousel !== false}
              onCheckedChange={(checked) => onUpdate('product_show_social_proof_carousel', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="product-social-autorotate">Auto-rotacionar Mensagens</Label>
            <Switch
              id="product-social-autorotate"
              checked={settings.product_social_proof_autorotate !== false}
              onCheckedChange={(checked) => onUpdate('product_social_proof_autorotate', checked)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="social-interval" className="text-xs">
              Intervalo de Rotação (ms)
            </Label>
            <Input
              id="social-interval"
              type="number"
              value={settings.product_social_proof_interval || 4000}
              onChange={(e) => onUpdate('product_social_proof_interval', parseInt(e.target.value))}
              className="h-9"
            />
          </div>
        </CardContent>
      </Card>

      {/* Avaliações */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-500" />
            Avaliações de Clientes
          </CardTitle>
          <CardDescription>
            Sistema de reviews e classificações
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="product-ratings">Exibir Avaliações</Label>
              <p className="text-xs text-gray-500 mt-1">
                Mostrar estrelas e número de avaliações
              </p>
            </div>
            <Switch
              id="product-ratings"
              checked={settings.product_show_ratings !== false}
              onCheckedChange={(checked) => onUpdate('product_show_ratings', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="product-rating-distribution">Distribuição de Estrelas</Label>
            <Switch
              id="product-rating-distribution"
              checked={settings.product_show_rating_distribution !== false}
              onCheckedChange={(checked) => onUpdate('product_show_rating_distribution', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Seção de Confiança */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-green-500" />
            Elementos de Confiança
          </CardTitle>
          <CardDescription>
            Badges de segurança, garantia e entrega
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between pb-4 border-b">
            <div>
              <Label htmlFor="product-trust-section">Exibir Seção de Confiança</Label>
              <p className="text-xs text-gray-500 mt-1">
                Ativa/desativa toda a seção
              </p>
            </div>
            <Switch
              id="product-trust-section"
              checked={settings.product_show_trust_section !== false}
              onCheckedChange={(checked) => onUpdate('product_show_trust_section', checked)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="trust-free-shipping">Frete Grátis</Label>
              <Switch
                id="trust-free-shipping"
                checked={settings.product_trust_free_shipping !== false}
                onCheckedChange={(checked) => onUpdate('product_trust_free_shipping', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="trust-money-back">Garantia de Devolução</Label>
              <Switch
                id="trust-money-back"
                checked={settings.product_trust_money_back !== false}
                onCheckedChange={(checked) => onUpdate('product_trust_money_back', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="trust-fast-delivery">Entrega Rápida</Label>
              <Switch
                id="trust-fast-delivery"
                checked={settings.product_trust_fast_delivery !== false}
                onCheckedChange={(checked) => onUpdate('product_trust_fast_delivery', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="trust-secure-payment">Pagamento Seguro</Label>
              <Switch
                id="trust-secure-payment"
                checked={settings.product_trust_secure_payment !== false}
                onCheckedChange={(checked) => onUpdate('product_trust_secure_payment', checked)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="trust-delivery-days" className="text-xs">
                Prazo de Entrega (ex: 2-5)
              </Label>
              <Input
                id="trust-delivery-days"
                value={settings.product_trust_delivery_days || '2-5'}
                onChange={(e) => onUpdate('product_trust_delivery_days', e.target.value)}
                className="h-9"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="trust-return-days" className="text-xs">
                Prazo de Devolução (dias)
              </Label>
              <Input
                id="trust-return-days"
                type="number"
                value={settings.product_trust_return_days || 7}
                onChange={(e) => onUpdate('product_trust_return_days', parseInt(e.target.value))}
                className="h-9"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Mídia e Conteúdo */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Video className="h-5 w-5 text-purple-500" />
            Vídeos e Depoimentos
          </CardTitle>
          <CardDescription>
            Conteúdo gerado por usuários e mídia adicional
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="product-videos">Exibir Vídeos</Label>
              <p className="text-xs text-gray-500 mt-1">
                Mostrar vídeos cadastrados do produto
              </p>
            </div>
            <Switch
              id="product-videos"
              checked={settings.product_show_videos !== false}
              onCheckedChange={(checked) => onUpdate('product_show_videos', checked)}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="product-testimonials">Exibir Depoimentos</Label>
              <p className="text-xs text-gray-500 mt-1">
                Mostrar depoimentos de clientes
              </p>
            </div>
            <Switch
              id="product-testimonials"
              checked={settings.product_show_testimonials !== false}
              onCheckedChange={(checked) => onUpdate('product_show_testimonials', checked)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="testimonials-max" className="text-xs">
              Máximo de Depoimentos a Exibir
            </Label>
            <Input
              id="testimonials-max"
              type="number"
              value={settings.product_testimonials_max_display || 3}
              onChange={(e) => onUpdate('product_testimonials_max_display', parseInt(e.target.value))}
              className="h-9"
            />
          </div>
        </CardContent>
      </Card>

      {/* Informações Adicionais */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5 text-blue-500" />
            Informações do Produto
          </CardTitle>
          <CardDescription>
            Tabelas de medidas e instruções de cuidados
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="product-size-chart">Tabela de Medidas Automática</Label>
                <p className="text-xs text-gray-500 mt-1">
                  Gera tabela de medidas baseada na categoria
                </p>
              </div>
              <Switch
                id="product-size-chart"
                checked={settings.product_show_size_chart !== false}
                onCheckedChange={(checked) => onUpdate('product_show_size_chart', checked)}
              />
            </div>

            <div className="flex items-center justify-between ml-6">
              <Label htmlFor="size-chart-default-open" className="text-sm">
                Expandida por Padrão
              </Label>
              <Switch
                id="size-chart-default-open"
                checked={settings.product_size_chart_default_open || false}
                onCheckedChange={(checked) => onUpdate('product_size_chart_default_open', checked)}
              />
            </div>
          </div>

          <Separator />

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="product-care-section">Cuidados do Produto</Label>
                <p className="text-xs text-gray-500 mt-1">
                  Instruções de lavagem e conservação
                </p>
              </div>
              <Switch
                id="product-care-section"
                checked={settings.product_show_care_section !== false}
                onCheckedChange={(checked) => onUpdate('product_show_care_section', checked)}
              />
            </div>

            <div className="flex items-center justify-between ml-6">
              <Label htmlFor="care-section-default-open" className="text-sm">
                Expandida por Padrão
              </Label>
              <Switch
                id="care-section-default-open"
                checked={settings.product_care_section_default_open || false}
                onCheckedChange={(checked) => onUpdate('product_care_section_default_open', checked)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dica */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="pt-6">
          <p className="text-sm text-blue-900">
            💡 <strong>Dica:</strong> Desative elementos que não se aplicam ao seu negócio. 
            Por exemplo, se você não tem depoimentos cadastrados, desative essa seção para 
            manter a página limpa e profissional.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProductPageSettings;

