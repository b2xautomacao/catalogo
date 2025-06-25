import React, { useState } from 'react';
import { Plus, Edit, Trash2, Eye, EyeOff, Image, Calendar, Upload, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useBanners, Banner } from '@/hooks/useBanners';
import { useProductsForBanner } from '@/hooks/useProductsForBanner';
import { useBannerUpload } from '@/hooks/useBannerUpload';
import { useToast } from '@/hooks/use-toast';

const BannerManager: React.FC = () => {
  const { banners, loading, createBanner, updateBanner, deleteBanner } = useBanners();
  const { products, loading: productsLoading } = useProductsForBanner();
  const { uploadBannerImage, uploading } = useBannerUpload();
  const { toast } = useToast();
  
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [sourceType, setSourceType] = useState<'manual' | 'product'>('manual');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    image_url: '',
    link_url: '',
    banner_type: 'hero' as Banner['banner_type'],
    position: 0,
    display_order: 0,
    is_active: true,
    start_date: '',
    end_date: '',
    product_id: '',
    source_type: 'manual' as 'manual' | 'product'
  });

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      image_url: '',
      link_url: '',
      banner_type: 'hero',
      position: 0,
      display_order: 0,
      is_active: true,
      start_date: '',
      end_date: '',
      product_id: '',
      source_type: 'manual'
    });
    setEditingBanner(null);
    setShowForm(false);
    setSourceType('manual');
    setSelectedFile(null);
    setPreviewUrl('');
  };

  const handleEdit = (banner: Banner) => {
    setEditingBanner(banner);
    setFormData({
      title: banner.title,
      description: banner.description || '',
      image_url: banner.image_url,
      link_url: banner.link_url || '',
      banner_type: banner.banner_type,
      position: banner.position,
      display_order: banner.display_order,
      is_active: banner.is_active,
      start_date: banner.start_date ? banner.start_date.split('T')[0] : '',
      end_date: banner.end_date ? banner.end_date.split('T')[0] : '',
      product_id: banner.product_id || '',
      source_type: banner.source_type || 'manual'
    });
    setSourceType(banner.source_type || 'manual');
    setPreviewUrl(banner.image_url);
    setShowForm(true);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      setFormData(prev => ({ ...prev, image_url: '' }));
    }
  };

  const handleProductSelect = (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (product) {
      setFormData(prev => ({
        ...prev,
        product_id: productId,
        title: product.name,
        image_url: product.image_url || '',
        description: product.description || ''
      }));
      setPreviewUrl(product.image_url || '');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      let finalImageUrl = formData.image_url;

      // Upload da imagem se for manual e houver arquivo
      if (sourceType === 'manual' && selectedFile) {
        finalImageUrl = await uploadBannerImage(selectedFile);
        if (!finalImageUrl) return;
      }

      const bannerData = {
        ...formData,
        image_url: finalImageUrl,
        source_type: sourceType,
        start_date: formData.start_date ? new Date(formData.start_date).toISOString() : undefined,
        end_date: formData.end_date ? new Date(formData.end_date).toISOString() : undefined,
        product_id: sourceType === 'product' ? formData.product_id : undefined
      };

      if (editingBanner) {
        const { error } = await updateBanner(editingBanner.id, bannerData);
        if (error) throw error;
        toast({ title: 'Banner atualizado com sucesso!' });
      } else {
        const { error } = await createBanner({
          ...bannerData,
          store_id: '',
        } as any);
        if (error) throw error;
        toast({ title: 'Banner criado com sucesso!' });
      }
      resetForm();
    } catch (error) {
      toast({
        title: 'Erro ao salvar banner',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive'
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este banner?')) return;

    try {
      const { error } = await deleteBanner(id);
      if (error) throw error;
      toast({ title: 'Banner excluído com sucesso!' });
    } catch (error) {
      toast({
        title: 'Erro ao excluir banner',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive'
      });
    }
  };

  const getBannerTypeLabel = (type: string) => {
    const types = {
      hero: 'Principal',
      category: 'Categoria',
      sidebar: 'Lateral',
      promotional: 'Promocional'
    };
    return types[type as keyof typeof types] || type;
  };

  const getBannerTypeColor = (type: string) => {
    const colors = {
      hero: 'bg-blue-100 text-blue-800',
      category: 'bg-green-100 text-green-800',
      sidebar: 'bg-orange-100 text-orange-800',
      promotional: 'bg-red-100 text-red-800'
    };
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            <Image className="h-5 w-5" />
            Gerenciar Banners
          </CardTitle>
          <Dialog open={showForm} onOpenChange={setShowForm}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="h-4 w-4 mr-2" />
                Novo Banner
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingBanner ? 'Editar Banner' : 'Novo Banner'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Seletor de Tipo de Fonte */}
                <div className="space-y-4">
                  <Label className="text-lg font-semibold">Tipo de Banner</Label>
                  <RadioGroup
                    value={sourceType}
                    onValueChange={(value: 'manual' | 'product') => {
                      setSourceType(value);
                      setFormData(prev => ({ ...prev, source_type: value }));
                      setPreviewUrl('');
                      setSelectedFile(null);
                    }}
                    className="grid grid-cols-1 md:grid-cols-2 gap-4"
                  >
                    <div className={`flex items-center space-x-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      sourceType === 'manual' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                    }`}>
                      <RadioGroupItem value="manual" id="manual" />
                      <Label htmlFor="manual" className="flex items-center gap-2 cursor-pointer">
                        <Upload className="h-5 w-5" />
                        <div>
                          <div className="font-medium">Upload Manual</div>
                          <div className="text-sm text-gray-600">Enviar imagem personalizada</div>
                        </div>
                      </Label>
                    </div>

                    <div className={`flex items-center space-x-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      sourceType === 'product' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                    }`}>
                      <RadioGroupItem value="product" id="product" />
                      <Label htmlFor="product" className="flex items-center gap-2 cursor-pointer">
                        <Package className="h-5 w-5" />
                        <div>
                          <div className="font-medium">Produto Existente</div>
                          <div className="text-sm text-gray-600">Usar dados de um produto</div>
                        </div>
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                {/* Configurações Básicas */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="banner_type">Tipo de Banner *</Label>
                    <Select
                      value={formData.banner_type}
                      onValueChange={(value: Banner['banner_type']) => 
                        setFormData(prev => ({ ...prev, banner_type: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hero">Principal (Hero)</SelectItem>
                        <SelectItem value="category">Categoria</SelectItem>
                        <SelectItem value="sidebar">Lateral</SelectItem>
                        <SelectItem value="promotional">Promocional</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center space-x-2 pt-6">
                    <Switch
                      id="is_active"
                      checked={formData.is_active}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                    />
                    <Label htmlFor="is_active">Ativo</Label>
                  </div>
                </div>

                {/* Configurações por Tipo */}
                {sourceType === 'manual' && (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="title">Título *</Label>
                      <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="file-upload">Imagem do Banner *</Label>
                      <input
                        id="file-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                      <label
                        htmlFor="file-upload"
                        className="flex items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-primary"
                      >
                        {previewUrl ? (
                          <img src={previewUrl} alt="Preview" className="h-28 w-auto object-contain" />
                        ) : (
                          <div className="text-center">
                            <Upload className="mx-auto h-8 w-8 text-gray-400" />
                            <span className="text-sm text-gray-500 mt-2">
                              {uploading ? 'Carregando...' : 'Clique para carregar imagem'}
                            </span>
                          </div>
                        )}
                      </label>
                    </div>
                  </div>
                )}

                {sourceType === 'product' && (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="product_select">Selecionar Produto *</Label>
                      <Select
                        value={formData.product_id}
                        onValueChange={handleProductSelect}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Escolha um produto..." />
                        </SelectTrigger>
                        <SelectContent>
                          {productsLoading ? (
                            <SelectItem value="" disabled>Carregando produtos...</SelectItem>
                          ) : (
                            products.map((product) => (
                              <SelectItem key={product.id} value={product.id}>
                                {product.name} - R$ {product.retail_price.toFixed(2)}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="title_override">Título (opcional - sobrescreve nome do produto)</Label>
                      <Input
                        id="title_override"
                        value={formData.title}
                        onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="Deixe vazio para usar nome do produto"
                      />
                    </div>

                    {previewUrl && (
                      <div>
                        <Label>Preview do Produto</Label>
                        <div className="border rounded-lg p-4">
                          <img src={previewUrl} alt="Preview" className="h-32 w-auto object-contain mx-auto" />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Configurações Comuns */}
                <div>
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="link_url">URL do Link</Label>
                  <Input
                    id="link_url"
                    type="url"
                    value={formData.link_url}
                    onChange={(e) => setFormData(prev => ({ ...prev, link_url: e.target.value }))}
                    placeholder="https://exemplo.com"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="position">Posição</Label>
                    <Input
                      id="position"
                      type="number"
                      value={formData.position}
                      onChange={(e) => setFormData(prev => ({ ...prev, position: parseInt(e.target.value) || 0 }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="display_order">Ordem de Exibição</Label>
                    <Input
                      id="display_order"
                      type="number"
                      value={formData.display_order}
                      onChange={(e) => setFormData(prev => ({ ...prev, display_order: parseInt(e.target.value) || 0 }))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="start_date">Data de Início</Label>
                    <Input
                      id="start_date"
                      type="date"
                      value={formData.start_date}
                      onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="end_date">Data de Fim</Label>
                    <Input
                      id="end_date"
                      type="date"
                      value={formData.end_date}
                      onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={uploading}>
                    {uploading ? 'Carregando...' : editingBanner ? 'Atualizar' : 'Criar'} Banner
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {banners.length === 0 ? (
          <div className="text-center py-8">
            <Image className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-500">Nenhum banner criado ainda.</p>
            <p className="text-sm text-gray-400">Crie seu primeiro banner para personalizar o catálogo.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {banners.map((banner) => (
              <div key={banner.id} className="flex items-center gap-4 p-4 border rounded-lg">
                <div className="w-24 h-16 bg-gray-100 rounded overflow-hidden">
                  <img
                    src={banner.image_url}
                    alt={banner.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold">{banner.title}</h4>
                    <Badge className={getBannerTypeColor(banner.banner_type)}>
                      {getBannerTypeLabel(banner.banner_type)}
                    </Badge>
                    {banner.source_type === 'product' && (
                      <Badge variant="outline" className="text-purple-600 border-purple-200">
                        <Package className="h-3 w-3 mr-1" />
                        Produto
                      </Badge>
                    )}
                    {banner.is_active ? (
                      <Badge className="bg-green-100 text-green-800">
                        <Eye className="h-3 w-3 mr-1" />
                        Ativo
                      </Badge>
                    ) : (
                      <Badge className="bg-gray-100 text-gray-800">
                        <EyeOff className="h-3 w-3 mr-1" />
                        Inativo
                      </Badge>
                    )}
                  </div>
                  
                  {banner.description && (
                    <p className="text-sm text-gray-600 mb-2">{banner.description}</p>
                  )}
                  
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span>Posição: {banner.position}</span>
                    <span>Ordem: {banner.display_order}</span>
                    {banner.start_date && (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(banner.start_date).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEdit(banner)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDelete(banner.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BannerManager;
