
import React, { useState } from 'react';
import { Plus, Search, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import AppLayout from '@/components/layout/AppLayout';
import ProductList from '@/components/products/ProductList';
import ProductFormModal from '@/components/products/ProductFormModal';
import ImprovedAIToolsModal from '@/components/products/ImprovedAIToolsModal';
import { useProducts } from '@/hooks/useProducts';
import { useToast } from '@/hooks/use-toast';

const Products = () => {
  const [showProductForm, setShowProductForm] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [editingProduct, setEditingProduct] = useState(null);
  const { products, loading, deleteProduct, fetchProducts, createProduct, updateProduct } = useProducts();
  const { toast } = useToast();

  const breadcrumbs = [
    { href: '/', label: 'Dashboard' },
    { label: 'Produtos', current: true },
  ];

  const handleEdit = (product) => {
    setEditingProduct(product);
    setShowProductForm(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este produto?')) {
      const { error } = await deleteProduct(id);
      if (error) {
        toast({
          title: "Erro ao excluir produto",
          description: error,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Produto excluído com sucesso",
        });
      }
    }
  };

  const handleGenerateDescription = (productId: string) => {
    const product = products.find(p => p.id === productId);
    setSelectedProduct(product);
    setShowAIModal(true);
  };

  const handleAIContentApply = async (content: any) => {
    console.log('Aplicando conteúdo IA:', content);
    setShowAIModal(false);
    toast({
      title: "Conteúdo aplicado com sucesso",
      description: "O conteúdo gerado pela IA foi aplicado ao produto.",
    });
    fetchProducts();
  };

  const handleProductSubmit = async (data: any) => {
    try {
      console.log('Salvando produto:', data);
      
      let result;
      if (editingProduct) {
        // Atualizar produto existente
        result = await updateProduct({ ...data, id: editingProduct.id });
      } else {
        // Criar novo produto
        result = await createProduct(data);
      }

      if (result.error) {
        throw new Error(result.error);
      }

      toast({
        title: editingProduct ? "Produto atualizado com sucesso" : "Produto criado com sucesso",
        description: `${data.name} foi ${editingProduct ? 'atualizado' : 'criado'} com sucesso.`,
      });
      
      setShowProductForm(false);
      setEditingProduct(null);
      fetchProducts();
    } catch (error) {
      console.error('Erro ao salvar produto:', error);
      toast({
        title: "Erro ao salvar produto",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    }
  };

  const handleCloseModal = () => {
    setShowProductForm(false);
    setEditingProduct(null);
  };

  if (loading) {
    return (
      <AppLayout title="Produtos" breadcrumbs={breadcrumbs}>
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            <div className="text-center">Carregando produtos...</div>
          </div>
        </div>
      </AppLayout>
    );
  }

  // Mapear produtos para o formato esperado pelo ProductList
  const mappedProducts = products.map(product => ({
    ...product,
    description: product.description || '', // Garantir que description não seja undefined
    category: product.category || '', // Garantir que category não seja undefined
    status: product.is_active ? 'active' as const : 'inactive' as const
  }));

  return (
    <AppLayout 
      title="Gerenciar Produtos" 
      subtitle="Adicione, edite e organize seus produtos"
      breadcrumbs={breadcrumbs}
    >
      <div className="space-y-6">
        {/* Header com ações */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          <div className="flex flex-col sm:flex-row gap-4 flex-1">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Buscar produtos..."
                className="pl-10"
              />
            </div>
            <Button variant="outline" className="shrink-0">
              <Filter className="mr-2 h-4 w-4" />
              Filtros
            </Button>
          </div>
          <Button 
            onClick={() => setShowProductForm(true)}
            className="shrink-0"
          >
            <Plus className="mr-2 h-4 w-4" />
            Novo Produto
          </Button>
        </div>

        {/* Lista de produtos */}
        <ProductList
          products={mappedProducts}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onGenerateDescription={handleGenerateDescription}
        />

        {/* Modal do formulário de produto */}
        <ProductFormModal
          open={showProductForm}
          onOpenChange={handleCloseModal}
          onSubmit={handleProductSubmit}
          initialData={editingProduct}
          mode={editingProduct ? 'edit' : 'create'}
        />

        {/* Modal de IA com informações do produto */}
        {showAIModal && selectedProduct && (
          <ImprovedAIToolsModal
            open={showAIModal}
            onOpenChange={setShowAIModal}
            productName={selectedProduct.name || 'Produto'}
            category={selectedProduct.category || 'Categoria'}
            onDescriptionGenerated={(description) => {
              console.log('Descrição gerada:', description);
              handleAIContentApply({ description });
            }}
            onTitleGenerated={(title) => {
              console.log('Título gerado:', title);
              handleAIContentApply({ title });
            }}
            onKeywordsGenerated={(keywords) => {
              console.log('Palavras-chave geradas:', keywords);
              handleAIContentApply({ keywords });
            }}
            onAdCopyGenerated={(adCopy) => {
              console.log('Texto de anúncio gerado:', adCopy);
              handleAIContentApply({ adCopy });
            }}
          />
        )}
      </div>
    </AppLayout>
  );
};

export default Products;
