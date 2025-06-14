
import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '@/components/layout/AppLayout';
import ProductList from '@/components/products/ProductList';
import ProductFormModal from '@/components/products/ProductFormModal';
import { Button } from '@/components/ui/button';
import { useProducts, CreateProductData, UpdateProductData } from '@/hooks/useProducts';
import { useToast } from '@/hooks/use-toast';
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
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const { products, createProduct, updateProduct, deleteProduct, loading, getProduct } = useProducts();
  const { toast } = useToast();

  const breadcrumbs = [
    { href: '/', label: 'Dashboard' },
    { label: 'Produtos', current: true },
  ];

  const handleCreateProduct = async (data: CreateProductData) => {
    setIsSubmitting(true);
    try {
      console.log('Criando produto com dados:', data);
      const result = await createProduct(data);
      if (result.error) {
        toast({
          title: "Erro",
          description: "Erro ao criar produto. Tente novamente.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Sucesso",
          description: "Produto criado com sucesso!",
        });
        setModalOpen(false);
        setEditingProduct(null);
      }
    } catch (error) {
      console.error('Erro ao criar produto:', error);
      toast({
        title: "Erro",
        description: "Erro inesperado ao criar produto.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateProduct = async (data: UpdateProductData) => {
    setIsSubmitting(true);
    try {
      console.log('Atualizando produto com dados:', data);
      const result = await updateProduct(data);
      if (result.error) {
        toast({
          title: "Erro",
          description: "Erro ao atualizar produto. Tente novamente.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Sucesso",
          description: "Produto atualizado com sucesso!",
        });
        setModalOpen(false);
        setEditingProduct(null);
      }
    } catch (error) {
      console.error('Erro ao atualizar produto:', error);
      toast({
        title: "Erro",
        description: "Erro inesperado ao atualizar produto.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (data: CreateProductData | UpdateProductData) => {
    if (editingProduct) {
      await handleUpdateProduct({ ...data, id: editingProduct.id } as UpdateProductData);
    } else {
      await handleCreateProduct(data as CreateProductData);
    }
  };

  const handleEditProduct = async (product: any) => {
    console.log('Iniciando edição do produto:', product);
    
    try {
      // Buscar dados completos do produto
      const { data: fullProductData, error } = await getProduct(product.id);
      
      if (error || !fullProductData) {
        console.error('Erro ao buscar dados completos do produto:', error);
        toast({
          title: "Erro",
          description: "Erro ao carregar dados do produto para edição.",
          variant: "destructive",
        });
        return;
      }

      console.log('Dados completos do produto carregados:', fullProductData);
      setEditingProduct(fullProductData);
      setModalOpen(true);
    } catch (error) {
      console.error('Erro ao preparar edição:', error);
      toast({
        title: "Erro",
        description: "Erro inesperado ao preparar edição do produto.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteProduct = (id: string) => {
    setProductToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!productToDelete) return;

    try {
      const result = await deleteProduct(productToDelete);
      if (result.error) {
        toast({
          title: "Erro",
          description: "Erro ao excluir produto. Tente novamente.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Sucesso",
          description: "Produto excluído com sucesso!",
        });
      }
    } catch (error) {
      console.error('Erro ao excluir produto:', error);
      toast({
        title: "Erro",
        description: "Erro inesperado ao excluir produto.",
        variant: "destructive",
      });
    } finally {
      setDeleteDialogOpen(false);
      setProductToDelete(null);
    }
  };

  const handleGenerateDescription = (id: string) => {
    // Implementar geração de descrição com IA posteriormente
    console.log('Gerar descrição IA para produto:', id);
    toast({
      title: "Em desenvolvimento",
      description: "Funcionalidade de IA será implementada em breve.",
    });
  };

  const handleNewProduct = () => {
    setEditingProduct(null);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingProduct(null);
  };

  // Converter produtos para o formato esperado pelo ProductList
  const formattedProducts = products.map(product => ({
    id: product.id,
    name: product.name,
    category: product.category || '',
    price: product.retail_price,
    stock: product.stock,
    status: product.is_active ? 'active' as const : 'inactive' as const,
    image: product.image_url || '/placeholder.svg',
    wholesalePrice: product.wholesale_price || undefined
  }));

  return (
    <AppLayout 
      title="Produtos" 
      subtitle={`${products.length} produto${products.length !== 1 ? 's' : ''} cadastrado${products.length !== 1 ? 's' : ''}`}
      breadcrumbs={breadcrumbs}
    >
      <div className="space-y-6">
        <div className="flex justify-end">
          <Button onClick={handleNewProduct} disabled={loading} className="btn-primary">
            <Plus className="mr-2 h-4 w-4" />
            Novo Produto
          </Button>
        </div>

        <ProductList 
          products={formattedProducts}
          onEdit={handleEditProduct}
          onDelete={handleDeleteProduct}
          onGenerateDescription={handleGenerateDescription}
        />

        <ProductFormModal
          open={modalOpen}
          onOpenChange={handleCloseModal}
          onSubmit={handleSubmit}
          initialData={editingProduct}
          mode={editingProduct ? 'edit' : 'create'}
        />

        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir este produto? Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AppLayout>
  );
};

export default Products;
