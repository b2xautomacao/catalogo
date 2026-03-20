import React, { useState } from "react";
import { Plus, Upload, Package, Settings, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import BulkImportModal from "./BulkImportModal";
import BulkStockModal from "./BulkStockModal";
import ProductFormModal from "./ProductFormModal";
import ProductStockManagerModal from "./ProductStockManagerModal";
import PricingModeSelector from "./PricingModeSelector";
import ExpandableProductForm from "./ExpandableProductForm";
import PremiumProductWizard from "./PremiumProductWizard";
import { useAuth } from "@/hooks/useAuth";
import { useProducts } from "@/hooks/useProducts";
import ProductList from "./ProductList";
import { Product } from "@/types/product";
import { useToast } from "@/hooks/use-toast";

const ProductsPage = () => {
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isBulkStockModalOpen, setIsBulkStockModalOpen] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [stockManagerProduct, setStockManagerProduct] =
    useState<Product | null>(null);
  const [isStockManagerOpen, setIsStockManagerOpen] = useState(false);
  const [showPriceModeSelector, setShowPriceModeSelector] = useState(false);
  
  // Estados para ExpandableProductForm
  const [isExpandableFormOpen, setIsExpandableFormOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | undefined>(undefined);
  
  // Estado para Premium Wizard
  const [isPremiumWizardOpen, setIsPremiumWizardOpen] = useState(false);
  
  const { profile } = useAuth();
  const currentStore = profile?.store_id;
  const { toast } = useToast();

  const {
    products,
    fetchProducts,
    deleteProduct,
    duplicateProduct,
    toggleProductStatus,
  } = useProducts();

  // Função para editar produto (usando div expansível)
  const handleEdit = (product: Product) => {
    console.log("🔧 ProductsPage - handleEdit chamado para:", {
      productId: product.id,
      productName: product.name,
    });
    setEditingProductId(product.id);
    setIsExpandableFormOpen(true);
    // Scroll suave para o topo
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  // Função para novo produto (usando div expansível)
  const handleNewProduct = () => {
    setEditingProductId(undefined);
    setIsExpandableFormOpen(true);
    // Scroll suave para o topo
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  // Função para fechar form expansível
  const handleCloseExpandableForm = () => {
    setIsExpandableFormOpen(false);
    setEditingProductId(undefined);
  };

  // Função para deletar produto
  const handleDelete = async (productId: string) => {
    if (window.confirm("Tem certeza que deseja deletar este produto?")) {
      try {
        await deleteProduct(productId);
        toast({
          title: "Produto deletado",
          description: "O produto foi removido com sucesso.",
        });
        await fetchProducts(); // Recarregar lista
      } catch (error) {
        console.error("Erro ao deletar produto:", error);
        toast({
          title: "Erro ao deletar",
          description: "Não foi possível deletar o produto.",
          variant: "destructive",
        });
      }
    }
  };

  // Função para duplicar produto
  const handleDuplicate = async (product: Product) => {
    try {
      const result = await duplicateProduct(product);
      if (result.error) {
        throw new Error(result.error);
      }
      // O toast já é mostrado dentro da função duplicateProduct
    } catch (error) {
      console.error("Erro ao duplicar produto:", error);
      // O toast de erro já é mostrado dentro da função duplicateProduct
    }
  };

  // Função para gerenciar estoque das variações
  const handleManageStock = (product: Product) => {
    setStockManagerProduct(product);
    setIsStockManagerOpen(true);
  };

  // Função para ativar/desativar produto
  const handleToggleStatus = async (product: Product, isActive: boolean) => {
    try {
      const result = await toggleProductStatus(product.id, isActive);
      if (result.error) {
        throw new Error(result.error);
      }
      // O toast já é mostrado dentro da função toggleProductStatus
    } catch (error) {
      console.error("Erro ao alterar status do produto:", error);
      // O toast de erro já é mostrado dentro da função toggleProductStatus
    }
  };

  // Função para fechar modal de gerenciamento de estoque
  const handleCloseStockManager = () => {
    setIsStockManagerOpen(false);
    setStockManagerProduct(null);
  };

  // Função para fechar modal de edição
  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setEditingProduct(null);
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Produtos</h1>
          <p className="text-gray-600">Gerencie seus produtos e estoque</p>
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => setShowPriceModeSelector(!showPriceModeSelector)}
            className="flex items-center gap-2"
          >
            <Settings className="h-4 w-4" />
            Modo de Preços
          </Button>

          <Button
            variant="outline"
            onClick={() => setIsBulkStockModalOpen(true)}
            className="flex items-center gap-2"
          >
            <Package className="h-4 w-4" />
            Estoque em Massa
          </Button>

          <Button
            variant="outline"
            onClick={() => setIsImportModalOpen(true)}
            className="flex items-center gap-2"
          >
            <Upload className="h-4 w-4" />
            Importar em Massa
          </Button>

          <Button
            onClick={() => setIsPremiumWizardOpen(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 shadow-lg shadow-amber-500/20 border-none"
          >
            <Sparkles className="h-4 w-4" />
            Wizard Premium
          </Button>

          <Button
            onClick={handleNewProduct}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            <Plus className="h-4 w-4" />
            Novo Produto
          </Button>
        </div>
      </div>

      {/* Seletor de Modo de Preços */}
      <div className={`mb-6 ${showPriceModeSelector ? "block" : "hidden"}`}>
        <PricingModeSelector
          onModeChange={() => {
            // Recarregar produtos quando o modo mudar
            fetchProducts();
          }}
        />
      </div>

      {/* Formulário Expansível de Produto */}
      <ExpandableProductForm
        isOpen={isExpandableFormOpen}
        onClose={handleCloseExpandableForm}
        productId={editingProductId}
        onSaved={async (productId) => {
          await fetchProducts();
          toast({
            title: "✅ Sucesso!",
            description: editingProductId ? "Produto atualizado" : "Produto criado",
          });
        }}
      />

      {/* Wizard Premium */}
      <PremiumProductWizard 
        open={isPremiumWizardOpen}
        onOpenChange={setIsPremiumWizardOpen}
        onSuccess={async () => {
          await fetchProducts();
        }}
      />

      {/* Modal de Importação */}
      <BulkImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        storeId={currentStore}
      />

      {/* Modal de Estoque em Massa */}
      <BulkStockModal
        isOpen={isBulkStockModalOpen}
        onClose={() => setIsBulkStockModalOpen(false)}
        products={products}
        onStockUpdated={fetchProducts}
      />

      {/* Modal de Novo Produto */}
      <ProductFormModal
        open={showProductModal}
        onOpenChange={setShowProductModal}
        onSubmit={async () => {
          // Recarregar lista de produtos após criar
          await fetchProducts();
        }}
        mode="create"
      />

      {/* Modal de Editar Produto */}
      <ProductFormModal
        open={isEditModalOpen}
        onOpenChange={handleCloseEditModal}
        initialData={editingProduct}
        onSubmit={async () => {
          // Recarregar lista de produtos após editar
          await fetchProducts();
        }}
        mode="edit"
      />

      {/* Lista de produtos */}
      <ProductList
        products={products}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onDuplicate={handleDuplicate}
        onManageStock={handleManageStock}
        onToggleStatus={handleToggleStatus}
        onGenerateDescription={() => {}}
        onListUpdate={fetchProducts}
      />

      {/* Modal de Gerenciamento de Estoque */}
      {stockManagerProduct && (
        <ProductStockManagerModal
          isOpen={isStockManagerOpen}
          onClose={handleCloseStockManager}
          product={stockManagerProduct}
          onStockUpdated={fetchProducts}
        />
      )}
    </div>
  );
};

export default ProductsPage;
