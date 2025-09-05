import React, { useState } from "react";
import { Plus, Upload, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import BulkImportModal from "./BulkImportModal";
import BulkStockModal from "./BulkStockModal";
import ProductFormModal from "./ProductFormModal";
import PricingModeSelector from "./PricingModeSelector";
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
  const { profile } = useAuth();
  const currentStore = profile?.store_id;
  const { toast } = useToast();

  const { products, fetchProducts, deleteProduct } = useProducts();

  // Função para editar produto
  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setIsEditModalOpen(true);
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
            onClick={() => setShowProductModal(true)}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Novo Produto
          </Button>
        </div>
      </div>

      {/* Seletor de Modo de Preços */}
      <div className="mb-6">
        <PricingModeSelector
          onModeChange={() => {
            // Recarregar produtos quando o modo mudar
            fetchProducts();
          }}
        />
      </div>

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
        onGenerateDescription={() => {}}
        onListUpdate={fetchProducts}
      />
    </div>
  );
};

export default ProductsPage;
