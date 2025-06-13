
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useProducts } from '@/hooks/useProducts';
import { useAuth } from '@/hooks/useAuth';
import { useCategories } from '@/hooks/useCategories';
import { supabase } from '@/integrations/supabase/client';
import ProductFormModal from '@/components/products/ProductFormModal';
import StoreSetup from '@/components/onboarding/StoreSetup';
import { Plus, Search, Filter, Edit, Trash2, MoreHorizontal, Sparkles, Package } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const Products = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, productId: null });
  const [generatingDescription, setGeneratingDescription] = useState(null);

  const { toast } = useToast();
  const { profile } = useAuth();
  const { products, loading, createProduct, updateProduct, deleteProduct } = useProducts(profile?.store_id);
  const { categories } = useCategories();

  console.log('Profile no Products:', profile);
  console.log('Store ID:', profile?.store_id);

  // Se o usuário não tem store_id, mostrar tela de configuração
  if (!profile?.store_id && profile?.role === 'store_admin') {
    return <StoreSetup />;
  }

  // Filtrar produtos
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || product.category === selectedCategory;
    const matchesStatus = !selectedStatus || 
                         (selectedStatus === 'active' && product.is_active) ||
                         (selectedStatus === 'inactive' && !product.is_active);
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const handleCreateProduct = async (data) => {
    try {
      const result = await createProduct({
        ...data,
        store_id: profile?.store_id || ''
      });
      
      if (result.error) {
        throw new Error('Erro ao criar produto');
      }

      toast({
        title: 'Produto criado',
        description: 'O produto foi criado com sucesso!'
      });
    } catch (error) {
      console.error('Erro ao criar produto:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível criar o produto. Tente novamente.',
        variant: 'destructive'
      });
    }
  };

  const handleUpdateProduct = async (data) => {
    try {
      const result = await updateProduct(data);
      
      if (result.error) {
        throw new Error('Erro ao atualizar produto');
      }

      toast({
        title: 'Produto atualizado',
        description: 'O produto foi atualizado com sucesso!'
      });
      setEditingProduct(null);
    } catch (error) {
      console.error('Erro ao atualizar produto:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar o produto. Tente novamente.',
        variant: 'destructive'
      });
    }
  };

  const handleDeleteProduct = async (productId) => {
    try {
      const result = await deleteProduct(productId);
      
      if (result.error) {
        throw new Error('Erro ao deletar produto');
      }

      toast({
        title: 'Produto deletado',
        description: 'O produto foi removido com sucesso!'
      });
      setDeleteDialog({ open: false, productId: null });
    } catch (error) {
      console.error('Erro ao deletar produto:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível deletar o produto. Tente novamente.',
        variant: 'destructive'
      });
    }
  };

  const handleGenerateDescription = async (productId) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    setGeneratingDescription(productId);
    
    try {
      const { data, error } = await supabase.functions.invoke('ai-product-description', {
        body: {
          productName: product.name,
          category: product.category
        }
      });

      if (error) throw error;

      if (data?.description) {
        await updateProduct({
          id: productId,
          description: data.description
        });
        
        toast({
          title: 'Descrição gerada',
          description: 'A descrição foi gerada e salva com sucesso!'
        });
      }
    } catch (error) {
      console.error('Erro ao gerar descrição:', error);
      toast({
        title: 'Erro ao gerar descrição',
        description: 'Verifique se a OpenAI API está configurada corretamente',
        variant: 'destructive'
      });
    } finally {
      setGeneratingDescription(null);
    }
  };

  const openEditModal = (product) => {
    setEditingProduct(product);
    setModalOpen(true);
  };

  const openCreateModal = () => {
    setEditingProduct(null);
    setModalOpen(true);
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Carregando produtos...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold gradient-text">Produtos</h1>
          <p className="text-muted-foreground">
            Gerencie o catálogo de produtos da sua loja
          </p>
        </div>
        <Button onClick={openCreateModal} className="btn-primary">
          <Plus className="h-4 w-4 mr-2" />
          Novo Produto
        </Button>
      </div>

      {/* Filtros */}
      <Card className="card-modern">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar produtos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Todas as categorias" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todas as categorias</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.name}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Todos os status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos os status</SelectItem>
                <SelectItem value="active">Ativo</SelectItem>
                <SelectItem value="inactive">Inativo</SelectItem>
              </SelectContent>
            </Select>

            <Button 
              variant="outline" 
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('');
                setSelectedStatus('');
              }}
            >
              Limpar Filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Produtos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredProducts.map((product) => (
          <Card key={product.id} className="card-modern overflow-hidden">
            <div className="aspect-square relative bg-muted">
              {product.image_url ? (
                <img 
                  src={product.image_url} 
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Package className="h-12 w-12 text-muted-foreground" />
                </div>
              )}
              <div className="absolute top-2 right-2">
                <Badge variant={product.is_active ? 'default' : 'secondary'}>
                  {product.is_active ? 'Ativo' : 'Inativo'}
                </Badge>
              </div>
            </div>
            
            <CardContent className="p-4">
              <h3 className="font-semibold text-lg mb-2 line-clamp-2">{product.name}</h3>
              {product.description && (
                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                  {product.description}
                </p>
              )}
              
              <div className="space-y-2 mb-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Varejo:</span>
                  <span className="font-medium">R$ {product.retail_price.toFixed(2)}</span>
                </div>
                {product.wholesale_price && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Atacado:</span>
                    <span className="font-medium">R$ {product.wholesale_price.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Estoque:</span>
                  <span className={`font-medium ${product.stock <= 5 ? 'text-destructive' : ''}`}>
                    {product.stock}
                  </span>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openEditModal(product)}
                  className="flex-1"
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Editar
                </Button>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem 
                      onClick={() => handleGenerateDescription(product.id)}
                      disabled={generatingDescription === product.id}
                    >
                      <Sparkles className="mr-2 h-4 w-4" />
                      {generatingDescription === product.id ? 'Gerando...' : 'Gerar Descrição IA'}
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => setDeleteDialog({ open: true, productId: product.id })}
                      className="text-destructive"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Excluir
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredProducts.length === 0 && (
        <div className="text-center py-12">
          <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Nenhum produto encontrado</h3>
          <p className="text-muted-foreground mb-4">
            {products.length === 0 
              ? 'Comece criando seu primeiro produto'
              : 'Tente ajustar os filtros ou termo de busca'
            }
          </p>
          {products.length === 0 && (
            <Button onClick={openCreateModal} className="btn-primary">
              <Plus className="h-4 w-4 mr-2" />
              Criar Primeiro Produto
            </Button>
          )}
        </div>
      )}

      {/* Modal do Formulário */}
      <ProductFormModal
        open={modalOpen}
        onOpenChange={(open) => {
          setModalOpen(open);
          if (!open) setEditingProduct(null);
        }}
        onSubmit={editingProduct ? handleUpdateProduct : handleCreateProduct}
        initialData={editingProduct}
        mode={editingProduct ? 'edit' : 'create'}
      />

      {/* Dialog de Confirmação de Exclusão */}
      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open, productId: null })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este produto? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => handleDeleteProduct(deleteDialog.productId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Products;
