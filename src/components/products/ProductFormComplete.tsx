
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Product } from '@/types/product';
import { validateProduct, type ProductValidationData } from '@/lib/validations/product';
import ProductImageManager from './ProductImageManager';

interface ProductFormCompleteProps {
  productId?: string;
  onSuccess?: (productId: string) => void;
  onCancel?: () => void;
}

const ProductFormComplete: React.FC<ProductFormCompleteProps> = ({
  productId,
  onSuccess,
  onCancel
}) => {
  const { toast } = useToast();
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [existingProduct, setExistingProduct] = useState<Product | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors }
  } = useForm<ProductValidationData>({
    defaultValues: {
      name: '',
      description: '',
      retail_price: 0,
      wholesale_price: 0,
      category: '',
      stock: 0,
      min_wholesale_qty: 1,
      is_featured: false,
      is_active: true,
      allow_negative_stock: false,
      stock_alert_threshold: 5,
      meta_title: '',
      meta_description: '',
      keywords: '',
      seo_slug: ''
    }
  });

  // Carregar produto existente se editando
  useEffect(() => {
    if (productId) {
      loadProduct(productId);
    }
  }, [productId]);

  const loadProduct = async (id: string) => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      if (data) {
        setExistingProduct(data);
        // Preencher formulário
        setValue('name', data.name);
        setValue('description', data.description || '');
        setValue('retail_price', data.retail_price);
        setValue('wholesale_price', data.wholesale_price || 0);
        setValue('category', data.category || '');
        setValue('stock', data.stock);
        setValue('min_wholesale_qty', data.min_wholesale_qty || 1);
        setValue('is_featured', data.is_featured || false);
        setValue('is_active', data.is_active !== false);
        setValue('allow_negative_stock', data.allow_negative_stock || false);
        setValue('stock_alert_threshold', data.stock_alert_threshold || 5);
        setValue('meta_title', data.meta_title || '');
        setValue('meta_description', data.meta_description || '');
        setValue('keywords', data.keywords || '');
        setValue('seo_slug', data.seo_slug || '');
      }
    } catch (error) {
      console.error('Erro ao carregar produto:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar o produto',
        variant: 'destructive'
      });
    }
  };

  const onSubmit = async (data: ProductValidationData) => {
    if (!profile?.store_id) {
      toast({
        title: 'Erro',
        description: 'Store ID não encontrado',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);

    try {
      // Validar dados
      const validatedData = validateProduct(data);

      const productData = {
        ...validatedData,
        store_id: profile.store_id,
        updated_at: new Date().toISOString()
      };

      let result;

      if (productId) {
        // Atualizar produto existente
        const { data: updatedProduct, error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', productId)
          .select()
          .single();

        if (error) throw error;
        result = updatedProduct;

        toast({
          title: 'Sucesso',
          description: 'Produto atualizado com sucesso'
        });
      } else {
        // Criar novo produto
        const { data: newProduct, error } = await supabase
          .from('products')
          .insert({
            ...productData,
            created_at: new Date().toISOString()
          })
          .select()
          .single();

        if (error) throw error;
        result = newProduct;

        toast({
          title: 'Sucesso',
          description: 'Produto criado com sucesso'
        });
      }

      if (result?.id && onSuccess) {
        onSuccess(result.id);
      }

    } catch (error: any) {
      console.error('Erro ao salvar produto:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível salvar o produto',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>
            {productId ? 'Editar Produto' : 'Novo Produto'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Nome */}
            <div>
              <Label htmlFor="name">Nome do Produto *</Label>
              <Input
                id="name"
                {...register('name', { required: 'Nome é obrigatório' })}
                placeholder="Digite o nome do produto"
              />
              {errors.name && (
                <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
              )}
            </div>

            {/* Descrição */}
            <div>
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                {...register('description')}
                placeholder="Descrição do produto"
                rows={3}
              />
            </div>

            {/* Preços */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="retail_price">Preço de Varejo *</Label>
                <Input
                  id="retail_price"
                  type="number"
                  step="0.01"
                  {...register('retail_price', {
                    required: 'Preço é obrigatório',
                    min: { value: 0, message: 'Preço deve ser positivo' }
                  })}
                  placeholder="0.00"
                />
                {errors.retail_price && (
                  <p className="text-red-500 text-sm mt-1">{errors.retail_price.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="wholesale_price">Preço de Atacado</Label>
                <Input
                  id="wholesale_price"
                  type="number"
                  step="0.01"
                  {...register('wholesale_price', {
                    min: { value: 0, message: 'Preço deve ser positivo' }
                  })}
                  placeholder="0.00"
                />
              </div>
            </div>

            {/* Estoque e Categoria */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="stock">Estoque *</Label>
                <Input
                  id="stock"
                  type="number"
                  {...register('stock', {
                    required: 'Estoque é obrigatório',
                    min: { value: 0, message: 'Estoque deve ser positivo' }
                  })}
                  placeholder="0"
                />
                {errors.stock && (
                  <p className="text-red-500 text-sm mt-1">{errors.stock.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="category">Categoria</Label>
                <Input
                  id="category"
                  {...register('category')}
                  placeholder="Categoria do produto"
                />
              </div>
            </div>

            {/* Quantidade mínima atacado */}
            <div>
              <Label htmlFor="min_wholesale_qty">Quantidade Mínima Atacado</Label>
              <Input
                id="min_wholesale_qty"
                type="number"
                {...register('min_wholesale_qty', {
                  min: { value: 1, message: 'Quantidade deve ser pelo menos 1' }
                })}
                placeholder="1"
              />
            </div>

            {/* SEO */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="meta_title">Título SEO</Label>
                <Input
                  id="meta_title"
                  {...register('meta_title')}
                  placeholder="Título para SEO"
                />
              </div>

              <div>
                <Label htmlFor="meta_description">Descrição SEO</Label>
                <Textarea
                  id="meta_description"
                  {...register('meta_description')}
                  placeholder="Descrição para SEO"
                  rows={2}
                />
              </div>

              <div>
                <Label htmlFor="keywords">Palavras-chave</Label>
                <Input
                  id="keywords"
                  {...register('keywords')}
                  placeholder="palavra1, palavra2, palavra3"
                />
              </div>

              <div>
                <Label htmlFor="seo_slug">Slug SEO</Label>
                <Input
                  id="seo_slug"
                  {...register('seo_slug')}
                  placeholder="slug-do-produto"
                />
              </div>
            </div>

            {/* Configurações */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="is_featured"
                  checked={watch('is_featured')}
                  onCheckedChange={(checked) => setValue('is_featured', checked)}
                />
                <Label htmlFor="is_featured">Produto em Destaque</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={watch('is_active')}
                  onCheckedChange={(checked) => setValue('is_active', checked)}
                />
                <Label htmlFor="is_active">Produto Ativo</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="allow_negative_stock"
                  checked={watch('allow_negative_stock')}
                  onCheckedChange={(checked) => setValue('allow_negative_stock', checked)}
                />
                <Label htmlFor="allow_negative_stock">Permitir Estoque Negativo</Label>
              </div>

              <div>
                <Label htmlFor="stock_alert_threshold">Alerta de Estoque Baixo</Label>
                <Input
                  id="stock_alert_threshold"
                  type="number"
                  {...register('stock_alert_threshold', {
                    min: { value: 0, message: 'Valor deve ser positivo' }
                  })}
                  placeholder="5"
                />
              </div>
            </div>

            {/* Botões */}
            <div className="flex gap-4 pt-4">
              <Button
                type="submit"
                disabled={loading}
                className="flex-1"
              >
                {loading ? 'Salvando...' : (productId ? 'Atualizar' : 'Criar')}
              </Button>
              {onCancel && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCancel}
                  disabled={loading}
                >
                  Cancelar
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Gerenciador de Imagens */}
      {productId && (
        <ProductImageManager 
          productId={productId} 
          className="mt-6"
        />
      )}
    </div>
  );
};

export default ProductFormComplete;
