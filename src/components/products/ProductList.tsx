
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
  Sparkles
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { Product } from "@/types/product";

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
        status: 'out', 
        color: 'bg-red-100 text-red-800',
        icon: AlertTriangle,
        text: 'Sem estoque' 
      };
    }
    if (stock <= threshold) {
      return { 
        status: 'low', 
        color: 'bg-yellow-100 text-yellow-800',
        icon: AlertTriangle,
        text: `${stock} restantes` 
      };
    }
    return { 
      status: 'good', 
      color: 'bg-green-100 text-green-800',
      icon: CheckCircle,
      text: `${stock} em estoque` 
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
        <Button>
          Adicionar Produto
        </Button>
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
            {products.length} produto{products.length !== 1 ? 's' : ''}
          </span>
        </div>
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-green-500 rounded-full" />
            Em estoque: {products.filter(p => p.stock > 5).length}
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-yellow-500 rounded-full" />
            Estoque baixo: {products.filter(p => p.stock > 0 && p.stock <= 5).length}
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-red-500 rounded-full" />
            Sem estoque: {products.filter(p => p.stock <= 0).length}
          </div>
        </div>
      </div>

      {/* Lista de Produtos */}
      <div className="grid gap-4">
        {products.map((product) => {
          const stockInfo = getStockStatus(product.stock, product.stock_alert_threshold);
          const StockIcon = stockInfo.icon;

          return (
            <div
              key={product.id}
              className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start gap-4">
                {/* Imagem do Produto */}
                <div className="flex-shrink-0">
                  <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden">
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="h-8 w-8 text-gray-400" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Informações do Produto */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-gray-900 truncate">
                        {product.name}
                      </h3>
                      {product.description && (
                        <p className="text-sm text-gray-600 line-clamp-2 mt-1">
                          {product.description}
                        </p>
                      )}
                    </div>
                    
                    {/* Badges */}
                    <div className="flex items-center gap-2 ml-4">
                      {product.is_featured && (
                        <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white">
                          <Sparkles className="h-3 w-3 mr-1" />
                          Destaque
                        </Badge>
                      )}
                      {!product.is_active && (
                        <Badge variant="secondary">
                          Inativo
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Informações detalhadas */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <span className="text-sm text-gray-500">Preço Varejo</span>
                      <p className="font-semibold text-lg text-primary">
                        {formatCurrency(product.retail_price)}
                      </p>
                    </div>
                    
                    {product.wholesale_price && (
                      <div>
                        <span className="text-sm text-gray-500">Preço Atacado</span>
                        <p className="font-semibold text-green-600">
                          {formatCurrency(product.wholesale_price)}
                        </p>
                        <span className="text-xs text-gray-500">
                          Min. {product.min_wholesale_qty || 1}
                        </span>
                      </div>
                    )}

                    <div>
                      <span className="text-sm text-gray-500">Estoque</span>
                      <div className="flex items-center gap-2">
                        <Badge className={stockInfo.color} variant="secondary">
                          <StockIcon className="h-3 w-3 mr-1" />
                          {stockInfo.text}
                        </Badge>
                      </div>
                    </div>

                    {product.category && (
                      <div>
                        <span className="text-sm text-gray-500">Categoria</span>
                        <p className="font-medium">
                          {product.category}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Ações */}
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => onEdit(product)}
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-1"
                    >
                      <Edit className="h-4 w-4" />
                      Editar
                    </Button>
                    
                    <Button
                      onClick={() => onGenerateDescription(product.id)}
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-1"
                    >
                      <Sparkles className="h-4 w-4" />
                      IA
                    </Button>
                    
                    <Button
                      onClick={() => onDelete(product.id)}
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                      Excluir
                    </Button>

                    <div className="flex-1" />
                    
                    <span className="text-xs text-gray-500">
                      Atualizado {new Date(product.updated_at).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ProductList;
