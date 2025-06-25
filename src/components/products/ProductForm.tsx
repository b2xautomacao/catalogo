import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/hooks/useAuth';
import { CreateProductData } from '@/hooks/useProducts';

interface ProductFormProps {
  onSubmit: (data: CreateProductData) => void;
  initialData?: Partial<CreateProductData>;
  mode?: 'create' | 'edit';
}

const ProductForm = ({ onSubmit, initialData, mode = 'create' }: ProductFormProps) => {
  const { profile } = useAuth();
  const [formData, setFormData] = useState<Partial<CreateProductData>>({
    name: '',
    description: '',
    retail_price: 0,
    wholesale_price: undefined,
    category: '',
    stock: 0,
    min_wholesale_qty: 1,
    meta_title: '',
    meta_description: '',
    keywords: '',
    seo_slug: '',
    is_featured: false,
    allow_negative_stock: false,
    stock_alert_threshold: 5,
    is_active: true
  });

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    }
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;

    setFormData(prev => ({
      ...prev,
      [name]: newValue
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const productData: CreateProductData = {
      store_id: profile?.store_id || '',
      name: formData.name || '',
      description: formData.description || '',
      retail_price: formData.retail_price || 0,
      wholesale_price: formData.wholesale_price || undefined,
      category: formData.category || '',
      stock: formData.stock || 0,
      min_wholesale_qty: formData.min_wholesale_qty || 1,
      meta_title: formData.meta_title || '',
      meta_description: formData.meta_description || '',
      keywords: formData.keywords || '',
      seo_slug: formData.seo_slug || '',
      is_featured: formData.is_featured || false,
      allow_negative_stock: formData.allow_negative_stock || false,
      stock_alert_threshold: formData.stock_alert_threshold || 5,
      is_active: formData.is_active ?? true
    };

    onSubmit(productData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name">Nome do Produto</Label>
        <Input
          type="text"
          id="name"
          name="name"
          value={formData.name || ''}
          onChange={handleChange}
          required
        />
      </div>
      <div>
        <Label htmlFor="description">Descrição</Label>
        <Textarea
          id="description"
          name="description"
          value={formData.description || ''}
          onChange={handleChange}
        />
      </div>
      <div>
        <Label htmlFor="retail_price">Preço de Varejo</Label>
        <Input
          type="number"
          id="retail_price"
          name="retail_price"
          value={formData.retail_price || 0}
          onChange={handleChange}
          required
        />
      </div>
      <div>
        <Label htmlFor="wholesale_price">Preço de Atacado</Label>
        <Input
          type="number"
          id="wholesale_price"
          name="wholesale_price"
          value={formData.wholesale_price || ''}
          onChange={handleChange}
        />
      </div>
      <div>
        <Label htmlFor="category">Categoria</Label>
        <Input
          type="text"
          id="category"
          name="category"
          value={formData.category || ''}
          onChange={handleChange}
        />
      </div>
      <div>
        <Label htmlFor="stock">Estoque</Label>
        <Input
          type="number"
          id="stock"
          name="stock"
          value={formData.stock || 0}
          onChange={handleChange}
          required
        />
      </div>
      <div>
        <Label htmlFor="min_wholesale_qty">Quantidade Mínima para Atacado</Label>
        <Input
          type="number"
          id="min_wholesale_qty"
          name="min_wholesale_qty"
          value={formData.min_wholesale_qty || 1}
          onChange={handleChange}
        />
      </div>
      <div>
        <Label htmlFor="meta_title">Meta Título</Label>
        <Input
          type="text"
          id="meta_title"
          name="meta_title"
          value={formData.meta_title || ''}
          onChange={handleChange}
        />
      </div>
      <div>
        <Label htmlFor="meta_description">Meta Descrição</Label>
        <Textarea
          id="meta_description"
          name="meta_description"
          value={formData.meta_description || ''}
          onChange={handleChange}
        />
      </div>
      <div>
        <Label htmlFor="keywords">Palavras-chave</Label>
        <Input
          type="text"
          id="keywords"
          name="keywords"
          value={formData.keywords || ''}
          onChange={handleChange}
        />
      </div>
      <div>
        <Label htmlFor="seo_slug">SEO Slug</Label>
        <Input
          type="text"
          id="seo_slug"
          name="seo_slug"
          value={formData.seo_slug || ''}
          onChange={handleChange}
        />
      </div>
      <div className="flex items-center space-x-2">
        <Label htmlFor="is_featured">Em Destaque</Label>
        <Switch
          id="is_featured"
          name="is_featured"
          checked={formData.is_featured || false}
          onCheckedChange={(checked) => handleChange({ target: { name: 'is_featured', value: checked, type: 'checkbox' } } as any)}
        />
      </div>
      <div className="flex items-center space-x-2">
        <Label htmlFor="allow_negative_stock">Permitir Estoque Negativo</Label>
        <Switch
          id="allow_negative_stock"
          name="allow_negative_stock"
          checked={formData.allow_negative_stock || false}
          onCheckedChange={(checked) => handleChange({ target: { name: 'allow_negative_stock', value: checked, type: 'checkbox' } } as any)}
        />
      </div>
      <div>
        <Label htmlFor="stock_alert_threshold">Limite de Alerta de Estoque</Label>
        <Input
          type="number"
          id="stock_alert_threshold"
          name="stock_alert_threshold"
          value={formData.stock_alert_threshold || 5}
          onChange={handleChange}
        />
      </div>
      <div className="flex items-center space-x-2">
        <Label htmlFor="is_active">Ativo</Label>
        <Switch
          id="is_active"
          name="is_active"
          checked={formData.is_active || false}
          onCheckedChange={(checked) => handleChange({ target: { name: 'is_active', value: checked, type: 'checkbox' } } as any)}
        />
      </div>
      <Button type="submit">{mode === 'edit' ? 'Atualizar Produto' : 'Criar Produto'}</Button>
    </form>
  );
};

export default ProductForm;
