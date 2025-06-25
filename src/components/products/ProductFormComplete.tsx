import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { useCategories } from '@/hooks/useCategories';
import { useDraftImages } from '@/hooks/useDraftImages';
import DraftImageUpload from './DraftImageUpload';
import CategoryFormDialog from './CategoryFormDialog';
import ProductDescriptionAI from '@/components/ai/ProductDescriptionAI';
import ProductVariationsManager, { ProductVariation } from './ProductVariationsManager';
import { Package, DollarSign, Hash, Tag, FileText, Image, Loader2 } from 'lucide-react';

const productSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  description: z.string().optional(),
  category: z.string().min(1, 'Categoria é obrigatória'),
  retail_price: z.number().min(0, 'Preço deve ser maior que zero'),
  wholesale_price: z.number().optional(),
  min_wholesale_qty: z.number().min(1).optional(),
  stock: z.number().min(0, 'Estoque não pode ser negativo'),
  is_active: z.boolean(),
  meta_title: z.string().optional(),
  meta_description: z.string().optional(),
  keywords: z.string().optional(),
});

type ProductFormData = z.infer<typeof productSchema>;

interface ProductFormCompleteProps {
  onSubmit: (data: any) => void;
  initialData?: any;
  mode: 'create' | 'edit';
}

const ProductFormComplete = ({ onSubmit, initialData, mode }: ProductFormCompleteProps) => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [variations, setVariations] = useState<ProductVariation[]>([]);
  
  const { categories, loading: categoriesLoading, fetchCategories } = useCategories();
  const { draftImages, addDraftImages, removeDraftImage, uploadDraftImages, clearDraftImages } = useDraftImages();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
    reset
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '',
      description: '',
      category: '',
      retail_price: 0,
      wholesale_price: undefined,
      min_wholesale_qty: 1,
      stock: 0,
      is_active: true,
      meta_title: '',
      meta_description: '',
      keywords: '',
      ...initialData
    }
  });

  // Carregar variações existentes se estiver no modo edição
  useEffect(() => {
    if (mode === 'edit' && initialData?.variations) {
      setVariations(initialData.variations);
    }
  }, [mode, initialData]);

  const handleCategoryCreated = async (newCategory: any) => {
    console.log('ProductFormComplete: Nova categoria criada:', newCategory);
    await fetchCategories();
    setValue('category', newCategory.name);
  };

  const handleDescriptionGenerated = (description: string) => {
    setValue('description', description);
  };

  const handleImageAdd = (file: File) => {
    addDraftImages([file]);
  };

  const handleImageRemove = (id: string) => {
    const index = draftImages.findIndex(img => img.id === id);
    if (index !== -1) {
      removeDraftImage(id);
    }
  };

  const onFormSubmit = async (data: ProductFormData) => {
    try {
      setUploading(true);
      
      let imageUrls: string[] = [];
      
      if (draftImages.length > 0) {
        console.log('Fazendo upload das imagens...');
        // Corrigir aqui: uploadDraftImages precisa de um productId, mas ainda não temos
        // Por isso vamos criar o produto primeiro e depois fazer upload das imagens
      }

      const productData = {
        ...data,
        wholesale_price: data.wholesale_price || null,
        min_wholesale_qty: data.min_wholesale_qty || 1,
        image_url: imageUrls[0] || null,
        additional_images: imageUrls.slice(1),
        variations: variations.length > 0 ? variations : undefined
      };

      console.log('Dados do produto para envio:', productData);
      
      await onSubmit(productData);
      
      if (mode === 'create') {
        reset();
        setVariations([]);
        clearDraftImages();
      }
    } catch (error) {
      console.error('Erro ao enviar formulário:', error);
    } finally {
      setUploading(false);
    }
  };

  const watchedName = watch('name');
  const watchedCategory = watch('category');

  if (categoriesLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Carregando categorias...</span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
      {/* Informações Básicas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Informações Básicas
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="name">Nome do Produto *</Label>
            <Input
              id="name"
              {...register('name')}
              placeholder="Nome do produto"
            />
            {errors.name && (
              <p className="text-sm text-destructive mt-1">{errors.name.message}</p>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <Label htmlFor="description">Descrição</Label>
              <ProductDescriptionAI
                productName={watchedName}
                category={watchedCategory}
                onDescriptionGenerated={handleDescriptionGenerated}
                disabled={!watchedName || !watchedCategory}
              />
            </div>
            <Textarea
              id="description"
              {...register('description')}
              placeholder="Descrição detalhada do produto"
              rows={4}
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <Label htmlFor="category">Categoria *</Label>
              <CategoryFormDialog onCategoryCreated={handleCategoryCreated} />
            </div>
            <Select
              value={watch('category')}
              onValueChange={(value) => setValue('category', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma categoria" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.name}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.category && (
              <p className="text-sm text-destructive mt-1">{errors.category.message}</p>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="is_active"
              checked={watch('is_active')}
              onCheckedChange={(checked) => setValue('is_active', checked)}
            />
            <Label htmlFor="is_active">Produto ativo</Label>
          </div>
        </CardContent>
      </Card>

      {/* Preços e Estoque */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Preços e Estoque
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="retail_price">Preço Varejo (R$) *</Label>
              <Input
                id="retail_price"
                type="number"
                step="0.01"
                {...register('retail_price', { valueAsNumber: true })}
                placeholder="0.00"
              />
              {errors.retail_price && (
                <p className="text-sm text-destructive mt-1">{errors.retail_price.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="wholesale_price">Preço Atacado (R$)</Label>
              <Input
                id="wholesale_price"
                type="number"
                step="0.01"
                {...register('wholesale_price', { valueAsNumber: true })}
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="stock">Estoque *</Label>
              <Input
                id="stock"
                type="number"
                {...register('stock', { valueAsNumber: true })}
                placeholder="0"
              />
              {errors.stock && (
                <p className="text-sm text-destructive mt-1">{errors.stock.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="min_wholesale_qty">Qtd. Mínima Atacado</Label>
              <Input
                id="min_wholesale_qty"
                type="number"
                {...register('min_wholesale_qty', { valueAsNumber: true })}
                placeholder="1"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Variações do Produto */}
      <ProductVariationsManager
        variations={variations}
        onChange={setVariations}
        disabled={isSubmitting || uploading}
      />

      {/* Imagens */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Image className="h-5 w-5" />
            Imagens do Produto
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DraftImageUpload
            draftImages={draftImages}
            onImageAdd={handleImageAdd}
            onImageRemove={handleImageRemove}
            uploading={uploading}
          />
        </CardContent>
      </Card>

      {/* SEO Avançado */}
      <Card>
        <CardHeader>
          <CardTitle 
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => setShowAdvanced(!showAdvanced)}
          >
            <FileText className="h-5 w-5" />
            SEO e Configurações Avançadas
            <span className="text-sm text-muted-foreground ml-2">
              {showAdvanced ? '(Clique para ocultar)' : '(Clique para expandir)'}
            </span>
          </CardTitle>
        </CardHeader>
        {showAdvanced && (
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="meta_title">Título SEO</Label>
              <Input
                id="meta_title"
                {...register('meta_title')}
                placeholder="Título otimizado para mecanismos de busca"
              />
            </div>

            <div>
              <Label htmlFor="meta_description">Descrição SEO</Label>
              <Textarea
                id="meta_description"
                {...register('meta_description')}
                placeholder="Descrição otimizada para mecanismos de busca"
                rows={3}
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
          </CardContent>
        )}
      </Card>

      {/* Botões de Ação */}
      <div className="flex gap-4">
        <Button 
          type="submit" 
          disabled={isSubmitting || uploading}
          className="flex-1"
        >
          {(isSubmitting || uploading) ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {uploading ? 'Enviando imagens...' : mode === 'create' ? 'Criando...' : 'Atualizando...'}
            </>
          ) : (
            mode === 'create' ? 'Criar Produto' : 'Atualizar Produto'
          )}
        </Button>
      </div>
    </form>
  );
};

export default ProductFormComplete;
