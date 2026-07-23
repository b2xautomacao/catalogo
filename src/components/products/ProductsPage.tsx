import React, { useState } from "react";
import { Plus, Upload, Package, Settings, Sparkles, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import BulkImportModal from "./BulkImportModal";
import BulkStockModal from "./BulkStockModal";
import ProductStockManagerModal from "./ProductStockManagerModal";
import PricingModeSelector from "./PricingModeSelector";
import PremiumProductWizard from "./PremiumProductWizard";
import { useAuth } from "@/hooks/useAuth";
import { useProducts } from "@/hooks/useProducts";
import ProductList from "./ProductList";
import { Product } from "@/types/product";
import { useToast } from "@/hooks/use-toast";

const FEATURED_SOFT_LIMIT = 12;

const ProductsPage = () => {
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isBulkStockModalOpen, setIsBulkStockModalOpen] = useState(false);
  // Estado para Premium Wizard
  const [isPremiumWizardOpen, setIsPremiumWizardOpen] = useState(false);
  const [editingProductForWizard, setEditingProductForWizard] = useState<Product | null>(null);
  
  const [stockManagerProduct, setStockManagerProduct] = useState<Product | null>(null);
  const [isStockManagerOpen, setIsStockManagerOpen] = useState(false);
  const [showPriceModeSelector, setShowPriceModeSelector] = useState(false);
  
  const { profile } = useAuth();
  const currentStore = profile?.store_id;
  const { toast } = useToast();

  const {
    products,
    fetchProducts,
    deleteProduct,
    duplicateProduct,
    toggleProductStatus,
    toggleFeaturedStatus,
  } = useProducts();

  const featuredCount = products.filter((p) => p.is_featured).length;

  // Função para editar produto usando o Wizard Premium
  const handleEdit = (product: Product) => {
    setEditingProductForWizard(product);
    setIsPremiumWizardOpen(true);
  };
  
  // Função para novo produto usando o Wizard Premium
  const handleNewProduct = () => {
    setEditingProductForWizard(null);
    setIsPremiumWizardOpen(true);
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

  // Função para destacar/remover destaque de um produto direto da listagem
  const handleToggleFeatured = async (product: Product, isFeatured: boolean) => {
    try {
      const result = await toggleFeaturedStatus(product.id, isFeatured);
      if (result.error) {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error("Erro ao alterar destaque do produto:", error);
    }
  };

  // Função para fechar modal de gerenciamento de estoque
  const handleCloseStockManager = () => {
    setIsStockManagerOpen(false);
    setStockManagerProduct(null);
  };


  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Produtos</h1>
          <div className="flex items-center gap-2">
            <p className="text-gray-600">Gerencie seus produtos e estoque</p>
            {featuredCount > 0 && (
              <Badge
                variant="outline"
                className={`flex items-center gap-1 ${
                  featuredCount > FEATURED_SOFT_LIMIT
                    ? "border-amber-400 text-amber-700 bg-amber-50"
                    : "border-yellow-300 text-yellow-700 bg-yellow-50"
                }`}
                title={
                  featuredCount > FEATURED_SOFT_LIMIT
                    ? `Recomendamos até ${FEATURED_SOFT_LIMIT} produtos em destaque para não sobrecarregar a vitrine`
                    : "Produtos marcados como destaque no catálogo"
                }
              >
                <Star className="h-3 w-3" fill="currentColor" />
                {featuredCount} em destaque
              </Badge>
            )}
          </div>
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
            onClick={handleNewProduct}
            className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 shadow-lg shadow-amber-500/20 border-none px-6"
          >
            <Sparkles className="h-4 w-4" />
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

      {/* Wizard Premium para Cadastro e Edição */}
      <PremiumProductWizard 
        open={isPremiumWizardOpen}
        onOpenChange={setIsPremiumWizardOpen}
        editingProduct={editingProductForWizard}
        onSuccess={async () => {
          await fetchProducts();
          setEditingProductForWizard(null);
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

      {/* Lista de produtos */}

      {/* Lista de produtos */}
      <ProductList
        products={products}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onDuplicate={handleDuplicate}
        onManageStock={handleManageStock}
        onToggleStatus={handleToggleStatus}
        onToggleFeatured={handleToggleFeatured}
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
