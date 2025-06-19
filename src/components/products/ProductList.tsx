
import React, { useState, useMemo } from 'react';
import { Edit, Trash2, Sparkles, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  status: 'active' | 'inactive';
  image?: string;
  image_url?: string;
  wholesalePrice?: number;
}

interface ProductListProps {
  products: Product[];
  onEdit: (product: Product) => void;
  onDelete: (id: string) => void;
  onGenerateDescription: (id: string) => void;
}

const ProductList = ({ products, onEdit, onDelete, onGenerateDescription }: ProductListProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Filtros dinâmicos
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter;
      const matchesStatus = statusFilter === 'all' || product.status === statusFilter;
      
      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [products, searchTerm, categoryFilter, statusFilter]);

  // Obter categorias únicas
  const categories = useMemo(() => {
    const uniqueCategories = [...new Set(products.map(p => p.category))];
    return uniqueCategories.filter(Boolean);
  }, [products]);

  const getStockBadge = (stock: number) => {
    if (stock <= 0) {
      return <Badge variant="destructive" className="text-xs">Esgotado</Badge>;
    }
    if (stock <= 5) {
      return <Badge variant="secondary" className="text-xs bg-yellow-100 text-yellow-800">Baixo ({stock})</Badge>;
    }
    return <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">Estoque ({stock})</Badge>;
  };

  const getProductImage = (product: Product) => {
    return product.image_url || product.image || '/placeholder.svg';
  };

  return (
    <div className="space-y-4">
      {/* Filtros - Responsivos */}
      <div className="flex flex-col space-y-4 lg:flex-row lg:space-y-0 lg:space-x-4">
        <div className="flex-1">
          <Input
            placeholder="Buscar produtos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />
        </div>
        <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2">
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {categories.map(category => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-32">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="active">Ativo</SelectItem>
              <SelectItem value="inactive">Inativo</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Lista de produtos - Layout responsivo */}
      {filteredProducts.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p className="text-lg">Nenhum produto encontrado</p>
          <p className="text-sm">Tente ajustar os filtros ou adicione novos produtos</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Layout Desktop */}
          <div className="hidden lg:block space-y-4">
            {filteredProducts.map((product) => (
              <Card key={product.id}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    {/* Imagem com fallback melhorado */}
                    <div className="w-20 h-20 bg-gray-50 rounded-lg overflow-hidden flex-shrink-0 border">
                      <img
                        src={getProductImage(product)}
                        alt={product.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = '/placeholder.svg';
                        }}
                      />
                    </div>

                    {/* Informações */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="min-w-0 flex-1">
                          <h3 className="font-semibold text-gray-900 text-base mb-1">{product.name}</h3>
                          <p className="text-sm text-gray-600 mb-2">{product.category}</p>
                          
                          <div className="flex items-center gap-4">
                            <div className="text-sm">
                              <span className="font-semibold text-green-600 text-base">
                                R$ {product.price.toFixed(2)}
                              </span>
                              {product.wholesalePrice && (
                                <span className="text-gray-500 ml-2 text-sm">
                                  Atacado: R$ {product.wholesalePrice.toFixed(2)}
                                </span>
                              )}
                            </div>
                            
                            {getStockBadge(product.stock)}
                            
                            <Badge variant={product.status === 'active' ? 'default' : 'secondary'}>
                              <div className="flex items-center gap-1">
                                {product.status === 'active' ? (
                                  <Eye className="h-3 w-3" />
                                ) : (
                                  <EyeOff className="h-3 w-3" />
                                )}
                                {product.status === 'active' ? 'Ativo' : 'Inativo'}
                              </div>
                            </Badge>
                          </div>
                        </div>

                        {/* Ações */}
                        <div className="flex items-center gap-2 ml-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onGenerateDescription(product.id)}
                            className="text-purple-600 border-purple-200 hover:bg-purple-50"
                          >
                            <Sparkles className="h-4 w-4" />
                          </Button>
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onEdit(product)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onDelete(product.id)}
                            className="text-red-600 border-red-200 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Layout Mobile melhorado */}
          <div className="lg:hidden space-y-4">
            {filteredProducts.map((product) => (
              <Card key={product.id} className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="space-y-4">
                    {/* Header com imagem e info básica */}
                    <div className="flex gap-4">
                      <div className="w-20 h-20 bg-gray-50 rounded-lg overflow-hidden flex-shrink-0 border">
                        <img
                          src={getProductImage(product)}
                          alt={product.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = '/placeholder.svg';
                          }}
                        />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 text-base mb-1 line-clamp-2">{product.name}</h3>
                        <p className="text-sm text-gray-600 mb-2">{product.category}</p>
                        <div className="text-lg font-semibold text-green-600">
                          R$ {product.price.toFixed(2)}
                        </div>
                        {product.wholesalePrice && (
                          <div className="text-sm text-gray-500">
                            Atacado: R$ {product.wholesalePrice.toFixed(2)}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Badges */}
                    <div className="flex flex-wrap gap-2">
                      {getStockBadge(product.stock)}
                      <Badge variant={product.status === 'active' ? 'default' : 'secondary'}>
                        <div className="flex items-center gap-1">
                          {product.status === 'active' ? (
                            <Eye className="h-3 w-3" />
                          ) : (
                            <EyeOff className="h-3 w-3" />
                          )}
                          {product.status === 'active' ? 'Ativo' : 'Inativo'}
                        </div>
                      </Badge>
                    </div>

                    {/* Ações - Layout melhorado para mobile */}
                    <div className="grid grid-cols-3 gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onGenerateDescription(product.id)}
                        className="text-purple-600 border-purple-200 hover:bg-purple-50"
                      >
                        <Sparkles className="h-4 w-4 mr-1" />
                        IA
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onEdit(product)}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Editar
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onDelete(product.id)}
                        className="text-red-600 border-red-200 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Excluir
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductList;
