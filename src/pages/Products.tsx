
import React, { useState, useEffect } from "react";
import { Plus, Search, Filter, Upload, Settings, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ProductList from "@/components/products/ProductList";
import ImprovedProductFormWizard from "@/components/products/ImprovedProductFormWizard";
import ImprovedAIToolsModal from "@/components/products/ImprovedAIToolsModal";
import SimpleBulkImportModal from "@/components/products/SimpleBulkImportModal";
import SimplePricingConfig from "@/components/catalog/SimplePricingConfig";
import BulkStockModal from "@/components/products/BulkStockModal";
import { useProducts } from "@/hooks/useProducts";
import { useStores } from "@/hooks/useStores";
import { useToast } from "@/hooks/use-toast";
import { Product } from "@/types/product";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

const Products = () => {
  const [showProductForm, setShowProductForm] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showPricingConfig, setShowPricingConfig] = useState(false);
  const [showBulkStockModal, setShowBulkStockModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [editingProduct, setEditingProduct] = useState(null);
  const {
    products,
    loading,
    deleteProduct,
    fetchProducts,
  } = useProducts();
  const { currentStore } = useStores();
  const { toast } = useToast();

  useEffect(() => {
    const interval = setInterval(() => {
      if (!showProductForm && !loading) {
        console.log("🔄 AUTO-REFRESH - Atualizando lista de produtos");
        fetchProducts();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [showProductForm, loading, fetchProducts]);

  const handleEdit = (product) => {
    console.log("✏️ PRODUCTS - Editando produto:", product.name);
    setEditingProduct(product);
    setShowProductForm(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Tem certeza que deseja excluir este produto?")) {
      console.log("🗑️ PRODUCTS - Excluindo produto:", id);
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
        await fetchProducts();
        console.log("✅ PRODUCTS - Lista atualizada após exclusão");
      }
    }
  };

  const handleGenerateDescription = (productId: string) => {
    const product = products.find((p) => p.id === productId);
    setSelectedProduct(product);
    setShowAIModal(true);
  };

  const handleAIContentApply = async (content: any) => {
    console.log("🤖 PRODUCTS - Aplicando conteúdo IA:", content);
    setShowAIModal(false);
    toast({
      title: "Conteúdo aplicado com sucesso",
      description: "O conteúdo gerado pela IA foi aplicado ao produto.",
    });
    await fetchProducts();
  };

  const handleProductSuccess = async () => {
    console.log("✅ PRODUCTS - Produto salvo com sucesso, atualizando lista");
    setShowProductForm(false);
    setEditingProduct(null);
    
    setTimeout(async () => {
      await fetchProducts();
      console.log("🔄 PRODUCTS - Lista recarregada com sucesso");
    }, 500);
  };

  const handleCloseModal = () => {
    console.log("❌ PRODUCTS - Fechando modal");
    setShowProductForm(false);
    setEditingProduct(null);
  };

  const handleNewProduct = () => {
    console.log("➕ PRODUCTS - Novo produto clicado");
    setEditingProduct(null);
    setShowProductForm(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          <div className="text-center">Carregando produtos...</div>
        </div>
      </div>
    );
  }

  const mappedProducts: Product[] = products.map((product) => ({
    ...product,
    description: product.description || "",
    category: product.category || "",
  }));

  console.log("📊 PRODUCTS - Renderizando:", {
    totalProducts: mappedProducts.length,
    showingModal: showProductForm,
    editingProduct: editingProduct?.name
  });

  return (
    <div className="space-y-6">
      {/* Header com ações */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="flex flex-col sm:flex-row gap-4 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input placeholder="Buscar produtos..." className="pl-10" />
          </div>
          <Button variant="outline" className="shrink-0">
            <Filter className="mr-2 h-4 w-4" />
            Filtros
          </Button>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowBulkStockModal(true)}
            className="shrink-0"
          >
            <Package className="mr-2 h-4 w-4" />
            Estoque em Massa
          </Button>
          
          <Dialog open={showPricingConfig} onOpenChange={setShowPricingConfig}>
            <DialogTrigger asChild>
              <Button variant="outline" className="shrink-0">
                <Settings className="mr-2 h-4 w-4" />
                Configurar Preços
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Configuração de Modelo de Preços</DialogTitle>
              </DialogHeader>
              {currentStore?.id && (
                <SimplePricingConfig
                  storeId={currentStore.id}
                  onConfigChange={(config) => {
                    console.log('Configuração atualizada:', config);
                    setShowPricingConfig(false);
                    toast({
                      title: "Configuração salva!",
                      description: "Modelo de preços configurado com sucesso.",
                    });
                  }}
                />
              )}
            </DialogContent>
          </Dialog>
          
          <Button
            variant="outline"
            onClick={() => setShowImportModal(true)}
            className="shrink-0"
          >
            <Upload className="mr-2 h-4 w-4" />
            Importar em Massa
          </Button>
          <Button onClick={handleNewProduct} className="shrink-0">
            <Plus className="mr-2 h-4 w-4" />
            Novo Produto
          </Button>
        </div>
      </div>

      {/* Lista de produtos atualizada */}
      <ProductList
        products={mappedProducts}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onGenerateDescription={handleGenerateDescription}
      />

      {/* Modal do formulário de produto */}
      <ImprovedProductFormWizard
        isOpen={showProductForm}
        onClose={handleCloseModal}
        editingProduct={editingProduct}
        onSuccess={handleProductSuccess}
      />

      {/* Modal de IA */}
      {showAIModal && selectedProduct && (
        <ImprovedAIToolsModal
          open={showAIModal}
          onOpenChange={setShowAIModal}
          productName={selectedProduct.name || "Produto"}
          category={selectedProduct.category || "Categoria"}
          onDescriptionGenerated={(description) => {
            console.log("🤖 PRODUCTS - Descrição gerada:", description);
            handleAIContentApply({ description });
          }}
        />
      )}

      {/* Modal de Importação em Massa */}
      <SimpleBulkImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        storeId={currentStore?.id}
      />

      {/* Modal de estoque em massa */}
      <BulkStockModal
        isOpen={showBulkStockModal}
        onClose={() => setShowBulkStockModal(false)}
        products={mappedProducts}
        onStockUpdated={fetchProducts}
      />
    </div>
  );
};

export default Products;
