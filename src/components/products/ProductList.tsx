import React, { useState } from 'react';
import { Edit, Trash2, Eye, Sparkles, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import AIProductToolsModal from './AIProductToolsModal';

interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  status: 'active' | 'inactive';
  image: string;
  wholesalePrice?: number;
}

interface ProductListProps {
  products: Product[];
  onEdit: (product: Product) => void;
  onDelete: (id: string) => void;
  onGenerateDescription: (id: string) => void;
}

const ProductList = ({ products, onEdit, onDelete, onGenerateDescription }: ProductListProps) => {
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [iaModalProduct, setIaModalProduct] = useState<any | null>(null);

  const toggleProductSelection = (id: string) => {
    setSelectedProducts(prev => 
      prev.includes(id) 
        ? prev.filter(pid => pid !== id)
        : [...prev, id]
    );
  };

  return (
    <div className="card-modern">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-4 px-4">
                <input
                  type="checkbox"
                  className="rounded border-border"
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedProducts(products.map(p => p.id));
                    } else {
                      setSelectedProducts([]);
                    }
                  }}
                />
              </th>
              <th className="text-left py-4 px-4 font-semibold">Produto</th>
              <th className="text-left py-4 px-4 font-semibold">Categoria</th>
              <th className="text-left py-4 px-4 font-semibold">Preço Varejo</th>
              <th className="text-left py-4 px-4 font-semibold">Preço Atacado</th>
              <th className="text-left py-4 px-4 font-semibold">Estoque</th>
              <th className="text-left py-4 px-4 font-semibold">Status</th>
              <th className="text-left py-4 px-4 font-semibold">IA</th>
              <th className="text-left py-4 px-4 font-semibold">Ações</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                <td className="py-4 px-4">
                  <input
                    type="checkbox"
                    className="rounded border-border"
                    checked={selectedProducts.includes(product.id)}
                    onChange={() => toggleProductSelection(product.id)}
                  />
                </td>
                <td className="py-4 px-4">
                  <div className="flex items-center gap-3">
                    <img 
                      src={product.image} 
                      alt={product.name}
                      className="w-12 h-12 rounded-lg object-cover bg-muted"
                    />
                    <div>
                      <p className="font-medium text-foreground">{product.name}</p>
                      <p className="text-sm text-muted-foreground">ID: {product.id}</p>
                    </div>
                  </div>
                </td>
                <td className="py-4 px-4">
                  <span className="text-sm text-muted-foreground">{product.category}</span>
                </td>
                <td className="py-4 px-4">
                  <span className="font-medium">R$ {product.price.toFixed(2)}</span>
                </td>
                <td className="py-4 px-4">
                  <span className="font-medium">
                    {product.wholesalePrice ? `R$ ${product.wholesalePrice.toFixed(2)}` : '-'}
                  </span>
                </td>
                <td className="py-4 px-4">
                  <span className={`font-medium ${product.stock <= 5 ? 'text-destructive' : 'text-foreground'}`}>
                    {product.stock}
                  </span>
                </td>
                <td className="py-4 px-4">
                  <Badge variant={product.status === 'active' ? 'default' : 'secondary'}>
                    {product.status === 'active' ? 'Ativo' : 'Inativo'}
                  </Badge>
                </td>
                <td className="py-4 px-4">
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => setIaModalProduct(product)}
                    title="Ferramentas de IA"
                  >
                    🤖
                  </Button>
                </td>
                <td className="py-4 px-4">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal size={16} />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onEdit(product)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onGenerateDescription(product.id)}>
                        <Sparkles className="mr-2 h-4 w-4" />
                        Gerar Descrição IA
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Eye className="mr-2 h-4 w-4" />
                        Visualizar
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => onDelete(product.id)}
                        className="text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {selectedProducts.length > 0 && (
        <div className="mt-4 p-4 bg-primary-50 rounded-lg border-l-4 border-primary">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-primary">
              {selectedProducts.length} produto(s) selecionado(s)
            </span>
            <div className="flex gap-2">
              <Button size="sm" variant="outline">
                Exportar Selecionados
              </Button>
              <Button size="sm" className="btn-secondary">
                <Sparkles className="mr-2 h-4 w-4" />
                Gerar Descrições IA
              </Button>
            </div>
          </div>
        </div>
      )}
      
      {iaModalProduct && (
        <AIProductToolsModal
          product={iaModalProduct}
          open={!!iaModalProduct}
          onClose={() => setIaModalProduct(null)}
        />
      )}
    </div>
  );
};

export default ProductList;
