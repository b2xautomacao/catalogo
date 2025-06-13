
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { useCategories } from '@/hooks/useCategories';
import { useStoreSettings } from '@/hooks/useStoreSettings';
import { useProductImages } from '@/hooks/useProductImages';
import { useProductVariations } from '@/hooks/useProductVariations';
import { CreateProductData, UpdateProductData } from '@/hooks/useProducts';
import { useToast } from '@/hooks/use-toast';
import QuickCategoryForm from './QuickCategoryForm';
import ProductDescriptionAI from '@/components/ai/ProductDescriptionAI';
import ProductImageUpload from './ProductImageUpload';
import ProductVariationsForm from './ProductVariationsForm';
import { Plus, ArrowLeft, Package, Image, Palette, Search, Sparkles } from 'lucide-react';

interface ProductFormCompleteProps {
  onSubmit: (data: CreateProductData | UpdateProductData) => void;
  onCancel: () => void;
  initialData?: any;
  mode?: 'create' | 'edit';
}

interface Variation {
  color?: string;
  size?: string;
  stock: number;
  price_adjustment: number;
  sku?: string;
}

const ProductFormComplete = ({ onSubmit, onCancel, initialData, mode = 'create' }: ProductFormCompleteProps) => {
  const [activeTab, setActiveTab] = useState('basic');
  const [showQuickCategory, setShowQuickCategory] = useState(false);
  const [saving, setSaving] = useState(false);
  const [variations, setVariations] = useState<Variation[]>([]);
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    description: initialData?.description || '',
    category: initialData?.category || '',
    retail_price: initialData?.retail_price || 0,
    wholesale_price: initialData?.wholesale_price || '',
    stock: initialData?.stock || 0,
    min_wholesale_qty: initialData?.min_wholesale_qty || 1,
    is_active: initialData?.is_active ?? true,
    meta_title: initialData?.meta_title || '',
    meta_description: initialData?.meta_description || '',
    keywords: initialData?.keywords || '',
    seo_slug: initialData?.seo_slug || ''
  });

  const { categories, loading: categoriesLoading } = useCategories();
  const { settings } = useStoreSettings();
  const { images, uploadImage, deleteImage } = useProductImages(initialData?.id);
  const { variations: dbVariations, createVariation, updateVariation, deleteVariation } = useProductVariations(initialData?.id);

  // Carregar variações do banco quando em modo de edição
  useEffect(() => {
    if (mode === 'edit' && dbVariations.length > 0) {
      setVariations(dbVariations.map(v => ({
        color: v.color || '',
        size: v.size || '',
        stock: v.stock,
        price_adjustment: v.price_adjustment || 0,
        sku: v.sku || ''
      })));
    }
  }, [dbVariations, mode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const productData = {
        ...(mode === 'edit' && { id: initialData.id }),
        name: formData.name,
        description: formData.description || undefined,
        category: formData.category || undefined,
        retail_price: formData.retail_price,
        wholesale_price: formData.wholesale_price ? parseFloat(formData.wholesale_price.toString()) : undefined,
        stock: formData.stock,
        min_wholesale_qty: formData.min_wholesale_qty || undefined,
        is_active: formData.is_active,
        meta_title: formData.meta_title || undefined,
        meta_description: formData.meta_description || undefined,
        keywords: formData.keywords || undefined,
        seo_slug: formData.seo_slug || undefined,
        store_id: initialData?.store_id || '',
        image_url: images[0]?.image_url || undefined
      };

      await onSubmit(productData as CreateProductData | UpdateProductData);

      // Salvar variações se existirem
      if (variations.length > 0 && mode === 'create') {
        // Para produtos novos, as variações serão salvas após a criação do produto
        // Isso será feito no componente pai após obter o ID do produto criado
      }

      toast({
        title: mode === 'edit' ? 'Produto atualizado' : 'Produto criado',
        description: mode === 'edit' ? 'As alterações foram salvas com sucesso' : 'O produto foi criado com sucesso'
      });

    } catch (error) {
      console.error('Erro ao salvar produto:', error);
      toast({
        title: 'Erro ao salvar',
        description: 'Ocorreu um erro ao salvar o produto. Tente novamente.',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCategoryCreated = (category: any) => {
    setFormData({ ...formData, category: category.name });
    setShowQuickCategory(false);
  };

  const handleDescriptionGenerated = (description: string) => {
    setFormData({ ...formData, description });
  };

  const handleImageUpload = async (file: File, order: number) => {
    if (initialData?.id) {
      await uploadImage(file, initialData.id, order);
    }
  };

  const handleImageRemove = async (index: number) => {
    if (images[index]?.id) {
      await deleteImage(images[index].id);
    }
  };

  const showRetailFields = settings?.retail_catalog_active !== false;
  const showWholesaleFields = settings?.wholesale_catalog_active === true;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={onCancel}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        <div>
          <h2 className="text-2xl font-bold gradient-text">
            {mode === 'edit' ? 'Editar Produto' : 'Novo Produto'}
          </h2>
          <p className="text-muted-foreground">
            Complete todas as informações do produto
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="basic" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Básico
            </TabsTrigger>
            <TabsTrigger value="images" className="flex items-center gap-2">
              <Image className="h-4 w-4" />
              Imagens
            </TabsTrigger>
            <TabsTrigger value="variations" className="flex items-center gap-2">
              <Palette className="h-4 w-4" />
              Variações
            </TabsTrigger>
            <TabsTrigger value="seo" className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              SEO
            </TabsTrigger>
          </TabsList>

          {/* Aba Básico */}
          <TabsContent value="basic" className="space-y-6">
            <Card className="card-modern">
              <CardHeader>
                <CardTitle>Informações Básicas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="name">Nome do Produto *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ex: Camiseta Premium Cotton"
                    required
                  />
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Label htmlFor="description">Descrição</Label>
                    <ProductDescriptionAI
                      productName={formData.name}
                      category={formData.category}
                      onDescriptionGenerated={handleDescriptionGenerated}
                      disabled={!formData.name.trim()}
                    />
                  </div>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Descrição detalhada do produto..."
                    rows={4}
                  />
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Label htmlFor="category">Categoria</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowQuickCategory(!showQuickCategory)}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Nova
                    </Button>
                  </div>

                  {showQuickCategory && (
                    <div className="mb-4">
                      <QuickCategoryForm
                        onCategoryCreated={handleCategoryCreated}
                        onCancel={() => setShowQuickCategory(false)}
                      />
                    </div>
                  )}

                  <Select 
                    value={formData.category} 
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                    disabled={categoriesLoading}
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
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                  <Label htmlFor="is_active">Produto ativo</Label>
                </div>
              </CardContent>
            </Card>

            <Card className="card-modern">
              <CardHeader>
                <CardTitle>Preços e Estoque</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {showRetailFields && (
                    <div>
                      <Label htmlFor="retail_price">Preço Varejo (R$) *</Label>
                      <Input
                        id="retail_price"
                        type="number"
                        step="0.01"
                        value={formData.retail_price}
                        onChange={(e) => setFormData({ ...formData, retail_price: parseFloat(e.target.value) || 0 })}
                        required
                      />
                    </div>
                  )}

                  {showWholesaleFields && (
                    <div>
                      <Label htmlFor="wholesale_price">Preço Atacado (R$)</Label>
                      <Input
                        id="wholesale_price"
                        type="number"
                        step="0.01"
                        value={formData.wholesale_price}
                        onChange={(e) => setFormData({ ...formData, wholesale_price: e.target.value })}
                      />
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="stock">Estoque *</Label>
                    <Input
                      id="stock"
                      type="number"
                      value={formData.stock}
                      onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })}
                      required
                    />
                  </div>

                  {showWholesaleFields && (
                    <div>
                      <Label htmlFor="min_wholesale_qty">Qtd. Mín. Atacado</Label>
                      <Input
                        id="min_wholesale_qty"
                        type="number"
                        value={formData.min_wholesale_qty}
                        onChange={(e) => setFormData({ ...formData, min_wholesale_qty: parseInt(e.target.value) || 1 })}
                      />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Aba Imagens */}
          <TabsContent value="images" className="space-y-6">
            <Card className="card-modern">
              <CardHeader>
                <CardTitle>Imagens do Produto</CardTitle>
              </CardHeader>
              <CardContent>
                <ProductImageUpload
                  onImageUpload={handleImageUpload}
                  images={images.map(img => img.image_url)}
                  onImageRemove={handleImageRemove}
                  maxImages={5}
                />
                {mode === 'create' && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Salve o produto primeiro para adicionar imagens
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Aba Variações */}
          <TabsContent value="variations" className="space-y-6">
            <Card className="card-modern">
              <CardHeader>
                <CardTitle>Variações do Produto</CardTitle>
              </CardHeader>
              <CardContent>
                <ProductVariationsForm
                  variations={variations}
                  onVariationsChange={setVariations}
                />
                {mode === 'create' && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Salve o produto primeiro para gerenciar variações
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Aba SEO */}
          <TabsContent value="seo" className="space-y-6">
            <Card className="card-modern">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  Otimização SEO
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="meta_title">Título SEO</Label>
                  <Input
                    id="meta_title"
                    value={formData.meta_title}
                    onChange={(e) => setFormData({ ...formData, meta_title: e.target.value })}
                    placeholder="Título otimizado para buscadores"
                    maxLength={60}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {formData.meta_title.length}/60 caracteres
                  </p>
                </div>

                <div>
                  <Label htmlFor="meta_description">Meta Descrição</Label>
                  <Textarea
                    id="meta_description"
                    value={formData.meta_description}
                    onChange={(e) => setFormData({ ...formData, meta_description: e.target.value })}
                    placeholder="Descrição que aparece nos resultados de busca"
                    maxLength={160}
                    rows={3}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {formData.meta_description.length}/160 caracteres
                  </p>
                </div>

                <div>
                  <Label htmlFor="keywords">Palavras-chave</Label>
                  <Input
                    id="keywords"
                    value={formData.keywords}
                    onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
                    placeholder="palavra1, palavra2, palavra3"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Separe as palavras-chave com vírgulas
                  </p>
                </div>

                <div>
                  <Label htmlFor="seo_slug">URL Amigável (Slug)</Label>
                  <Input
                    id="seo_slug"
                    value={formData.seo_slug}
                    onChange={(e) => setFormData({ ...formData, seo_slug: e.target.value })}
                    placeholder="produto-exemplo"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Deixe vazio para gerar automaticamente baseado no nome
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Botões de Ação */}
        <div className="flex gap-4 sticky bottom-0 bg-background p-4 border-t">
          <Button type="submit" className="flex-1 btn-primary" disabled={saving}>
            {saving ? 'Salvando...' : (mode === 'edit' ? 'Atualizar' : 'Criar')} Produto
          </Button>
          <Button type="button" variant="outline" onClick={onCancel} disabled={saving}>
            Cancelar
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ProductFormComplete;
