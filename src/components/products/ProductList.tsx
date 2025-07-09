import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Edit,
  Trash2,
  Eye,
  Package,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Sparkles,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { Product } from "@/types/product";
import ProductInfoCard from "./ProductInfoCard";

interface ProductListProps {
  products: Product[];
  onEdit: (product: any) => void;
  onDelete: (id: string) => void;
  onGenerateDescription: (productId: string) => void;
}

const ProductList: React.FC<ProductListProps> = ({
  products,
  onEdit,
  onDelete,
  onGenerateDescription,
}) => {
  const getStockStatus = (stock: number, threshold: number = 5) => {
    if (stock <= 0) {
      return {
        status: "out",
        color: "bg-red-100 text-red-800",
        icon: AlertTriangle,
        text: "Sem estoque",
      };
    }
    if (stock <= threshold) {
      return {
        status: "low",
        color: "bg-yellow-100 text-yellow-800",
        icon: AlertTriangle,
        text: `${stock} restantes`,
      };
    }
    return {
      status: "good",
      color: "bg-green-100 text-green-800",
      icon: CheckCircle,
      text: `${stock} em estoque`,
    };
  };

  if (products.length === 0) {
    return (
      <div className="text-center py-12">
        <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Nenhum produto encontrado
        </h3>
        <p className="text-gray-500 mb-4">
          Comece adicionando seu primeiro produto à loja.
        </p>
        <Button>Adicionar Produto</Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Package className="h-5 w-5 text-gray-600" />
          <span className="font-medium">
            {products.length} produto{products.length !== 1 ? "s" : ""}
          </span>
        </div>
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-green-500 rounded-full" />
            Em estoque: {products.filter((p) => p.stock > 5).length}
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-yellow-500 rounded-full" />
            Estoque baixo:{" "}
            {products.filter((p) => p.stock > 0 && p.stock <= 5).length}
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-red-500 rounded-full" />
            Sem estoque: {products.filter((p) => p.stock <= 0).length}
          </div>
        </div>
      </div>

      {/* Lista de Produtos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product) => (
          <ProductInfoCard
            key={product.id}
            product={product}
            onEdit={onEdit}
            onView={(product) => {
              // Implementar visualização do produto
              console.log("Visualizando produto:", product.name);
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default ProductList;
