
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { useEditorStore } from '../../stores/useEditorStore';
import ColorPicker from '../ColorPicker';

const ProductCardSettings: React.FC = () => {
  const { configuration, updateConfiguration } = useEditorStore();
  const cardConfig = configuration.productCards;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">Cards de Produto</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Layout dos Cards */}
        <div className="space-y-2">
          <Label>Layout dos Cards</Label>
          <Select
            value={cardConfig.layout}
            onValueChange={(value) => updateConfiguration('productCards.layout', value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="grid">Grade</SelectItem>
              <SelectItem value="list">Lista</SelectItem>
              <SelectItem value="masonry">Masonry</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Posição da Imagem */}
        <div className="space-y-2">
          <Label>Posição da Imagem</Label>
          <Select
            value={cardConfig.imagePosition}
            onValueChange={(value) => updateConfiguration('productCards.imagePosition', value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="top">Em Cima</SelectItem>
              <SelectItem value="left">À Esquerda</SelectItem>
              <SelectItem value="right">À Direita</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Colunas por Dispositivo */}
        <div className="space-y-4">
          <Label>Colunas por Dispositivo</Label>
          
          <div className="space-y-3">
            <div>
              <Label className="text-xs text-gray-600">Desktop: {cardConfig.columns.desktop}</Label>
              <Slider
                value={[cardConfig.columns.desktop]}
                onValueChange={([value]) => updateConfiguration('productCards.columns.desktop', value)}
                max={6}
                min={1}
                step={1}
                className="mt-2"
              />
            </div>
            
            <div>
              <Label className="text-xs text-gray-600">Tablet: {cardConfig.columns.tablet}</Label>
              <Slider
                value={[cardConfig.columns.tablet]}
                onValueChange={([value]) => updateConfiguration('productCards.columns.tablet', value)}
                max={4}
                min={1}
                step={1}
                className="mt-2"
              />
            </div>
            
            <div>
              <Label className="text-xs text-gray-600">Mobile: {cardConfig.columns.mobile}</Label>
              <Slider
                value={[cardConfig.columns.mobile]}
                onValueChange={([value]) => updateConfiguration('productCards.columns.mobile', value)}
                max={3}
                min={1}
                step={1}
                className="mt-2"
              />
            </div>
          </div>
        </div>

        {/* Elementos Visíveis */}
        <div className="space-y-3">
          <Label>Elementos Visíveis</Label>
          
          {Object.entries(cardConfig.showElements).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between">
              <Label className="text-sm capitalize">
                {key === 'buyButton' ? 'Botão Comprar' : 
                 key === 'discountBadge' ? 'Selo Desconto' :
                 key === 'title' ? 'Título' :
                 key === 'price' ? 'Preço' :
                 key === 'description' ? 'Descrição' : key}
              </Label>
              <Switch
                checked={value}
                onCheckedChange={(checked) => 
                  updateConfiguration(`productCards.showElements.${key}`, checked)
                }
              />
            </div>
          ))}
        </div>

        {/* Cores e Bordas */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Mostrar Borda</Label>
            <Switch
              checked={cardConfig.showBorder}
              onCheckedChange={(checked) => updateConfiguration('productCards.showBorder', checked)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Cor de Fundo</Label>
              <ColorPicker
                color={cardConfig.backgroundColor}
                onChange={(color) => updateConfiguration('productCards.backgroundColor', color)}
              />
            </div>
            {cardConfig.showBorder && (
              <div className="space-y-2">
                <Label>Cor da Borda</Label>
                <ColorPicker
                  color={cardConfig.borderColor}
                  onChange={(color) => updateConfiguration('productCards.borderColor', color)}
                />
              </div>
            )}
          </div>
        </div>

        {/* Estilo do Botão */}
        <div className="space-y-4">
          <Label>Estilo do Botão</Label>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs">Cor de Fundo</Label>
              <ColorPicker
                color={cardConfig.buttonStyle.backgroundColor}
                onChange={(color) => updateConfiguration('productCards.buttonStyle.backgroundColor', color)}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Cor do Texto</Label>
              <ColorPicker
                color={cardConfig.buttonStyle.textColor}
                onChange={(color) => updateConfiguration('productCards.buttonStyle.textColor', color)}
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label className="text-xs">Raio da Borda: {cardConfig.buttonStyle.borderRadius}px</Label>
            <Slider
              value={[cardConfig.buttonStyle.borderRadius]}
              onValueChange={([value]) => updateConfiguration('productCards.buttonStyle.borderRadius', value)}
              max={20}
              min={0}
              step={1}
              className="mt-2"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProductCardSettings;
