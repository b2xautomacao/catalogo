import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { CreateProductData } from '@/hooks/useProducts';

interface ProductFormAdvancedProps {
  formData: CreateProductData;
  updateFormData: (updates: Partial<CreateProductData>) => void;
}

const ProductFormAdvanced = ({ formData, updateFormData }: ProductFormAdvancedProps) => {
  const handleChange = (field: string, value: any) => {
    const updates: Partial<CreateProductData> = {
      [field]: value,
      is_active: formData.is_active ?? true
    };
    updateFormData(updates);
  };

  return (
    <div className="space-y-4">
      {/* SEO Slug */}
      <div>
        <Label htmlFor="seo_slug">SEO Slug (URL amigável)</Label>
        <Input
          type="text"
          id="seo_slug"
          value={formData.seo_slug || ''}
          onChange={(e) => handleChange('seo_slug', e.target.value)}
          placeholder="Ex: nome-do-produto"
        />
      </div>

      {/* Meta Title */}
      <div>
        <Label htmlFor="meta_title">Meta Title (Título SEO)</Label>
        <Input
          type="text"
          id="meta_title"
          value={formData.meta_title || ''}
          onChange={(e) => handleChange('meta_title', e.target.value)}
          placeholder="Título para SEO"
        />
      </div>

      {/* Meta Description */}
      <div>
        <Label htmlFor="meta_description">Meta Description (Descrição SEO)</Label>
        <Input
          type="text"
          id="meta_description"
          value={formData.meta_description || ''}
          onChange={(e) => handleChange('meta_description', e.target.value)}
          placeholder="Descrição para SEO"
        />
      </div>

      {/* Keywords */}
      <div>
        <Label htmlFor="keywords">Keywords (Palavras-chave SEO)</Label>
        <Input
          type="text"
          id="keywords"
          value={formData.keywords || ''}
          onChange={(e) => handleChange('keywords', e.target.value)}
          placeholder="Palavras-chave separadas por vírgula"
        />
      </div>

      {/* Is Featured */}
      <div className="flex items-center justify-between">
        <Label htmlFor="is_featured">Produto em Destaque</Label>
        <Switch
          id="is_featured"
          checked={formData.is_featured || false}
          onCheckedChange={(checked) => handleChange('is_featured', checked)}
        />
      </div>

      {/* Allow Negative Stock */}
      <div className="flex items-center justify-between">
        <Label htmlFor="allow_negative_stock">Permitir Estoque Negativo</Label>
        <Switch
          id="allow_negative_stock"
          checked={formData.allow_negative_stock || false}
          onCheckedChange={(checked) => handleChange('allow_negative_stock', checked)}
        />
      </div>

      {/* Stock Alert Threshold */}
      <div>
        <Label htmlFor="stock_alert_threshold">
          Limite de Alerta de Estoque ({formData.stock_alert_threshold})
        </Label>
        <Slider
          id="stock_alert_threshold"
          defaultValue={[formData.stock_alert_threshold || 5]}
          min={0}
          max={50}
          step={1}
          onValueChange={(value) => handleChange('stock_alert_threshold', value[0])}
        />
      </div>
    </div>
  );
};

export default ProductFormAdvanced;
