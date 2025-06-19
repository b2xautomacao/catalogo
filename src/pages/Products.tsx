import React, { useState } from 'react';
import { Plus, Search, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import AppLayout from '@/components/layout/AppLayout';
import ProductList from '@/components/products/ProductList';
import ProductFormWizard from '@/components/products/ProductFormWizard';
import ImprovedAIToolsModal from '@/components/products/ImprovedAIToolsModal';
import { useProducts } from '@/hooks/useProducts';
import { useToast } from '@/hooks/use-toast';

const Products = () => {
  const [showProductForm, setShowProductForm] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [editingProduct, setEditingProduct] = useState(null);
  const { products, loading, deleteProduct, fetchProducts } = useProducts();
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
    setSelectedProductId(productId);
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
      // Lógica para salvar/atualizar produto
      console.log('Salvando produto:', data);
      toast({
        title: "Produto salvo com sucesso",
      });
      setShowProductForm(false);
      setEditingProduct(null);
      fetchProducts();
    } catch (error) {
      console.error('Erro ao salvar produto:', error);
      toast({
        title: "Erro ao salvar produto",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <AppLayout title="Produtos" breadcrumbs={breadcrumbs}>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">Carregando produtos...</div>
        </div>
      </AppLayout>
    );
  }

  // Mapear produtos para o formato esperado pelo ProductList
  const mappedProducts = products.map(product => ({
    ...product,
    price: product.retail_price || 0,
    status: product.is_active ? 'active' as const : 'inactive' as const,
    wholesalePrice: product.wholesale_price
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

        {/* Modal do formulário de produto com props corretas */}
        {showProductForm && (
          <ProductFormWizard
            initialData={editingProduct}
            onSubmit={handleProductSubmit}
            mode={editingProduct ? 'edit' : 'create'}
          />
        )}

        {/* Modal de IA com props corretas */}
        {showAIModal && selectedProductId && (
          <ImprovedAIToolsModal
            open={showAIModal}
            onOpenChange={setShowAIModal}
            productName="Produto Selecionado"
            category="Categoria"
            onContentApply={handleAIContentApply}
          />
        )}
      </div>
    </AppLayout>
  );
};

export default Products;
