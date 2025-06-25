
import React, { useState, useMemo } from 'react';
import { Search, Package, ShoppingCart, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useProducts } from '@/hooks/useProducts';
import { useOrders } from '@/hooks/useOrders';
import { useAuth } from '@/hooks/useAuth';

interface QuickSearchProps {
  onProductSelect?: (productId: string) => void;
  onOrderSelect?: (orderId: string) => void;
}

const QuickSearch = ({ onProductSelect, onOrderSelect }: QuickSearchProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const { profile } = useAuth();
  const { products } = useProducts();
  const { orders } = useOrders();

  const searchResults = useMemo(() => {
    if (!searchTerm || searchTerm.length < 2) return { products: [], orders: [] };

    const term = searchTerm.toLowerCase();
    
    const filteredProducts = products.filter(product =>
      product.name.toLowerCase().includes(term) ||
      product.category?.toLowerCase().includes(term) ||
      product.description?.toLowerCase().includes(term)
    ).slice(0, 5);

    const filteredOrders = orders.filter(order =>
      order.customer_name.toLowerCase().includes(term) ||
      order.id.toLowerCase().includes(term) ||
      order.customer_email?.toLowerCase().includes(term)
    ).slice(0, 3);

    return { products: filteredProducts, orders: filteredOrders };
  }, [searchTerm, products, orders]);

  const handleClear = () => {
    setSearchTerm('');
    setIsOpen(false);
  };

  return (
    <div className="relative w-full max-w-md">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          placeholder="Buscar produtos ou pedidos..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setIsOpen(e.target.value.length >= 2);
          }}
          className="pl-10 pr-10"
          onFocus={() => searchTerm.length >= 2 && setIsOpen(true)}
        />
        {searchTerm && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {isOpen && (searchResults.products.length > 0 || searchResults.orders.length > 0) && (
        <Card className="absolute top-full left-0 right-0 mt-2 z-50 max-h-96 overflow-y-auto">
          <CardContent className="p-2">
            {searchResults.products.length > 0 && (
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Produtos
                </h3>
                {searchResults.products.map((product) => (
                  <div
                    key={product.id}
                    className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer"
                    onClick={() => {
                      onProductSelect?.(product.id);
                      handleClear();
                    }}
                  >
                    <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center">
                      <Package className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{product.name}</p>
                      <div className="flex items-center gap-2">
                        {product.category && (
                          <Badge variant="outline" className="text-xs">{product.category}</Badge>
                        )}
                        <span className="text-xs text-gray-500">
                          R$ {product.retail_price.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {searchResults.orders.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <ShoppingCart className="h-4 w-4" />
                  Pedidos
                </h3>
                {searchResults.orders.map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer"
                    onClick={() => {
                      onOrderSelect?.(order.id);
                      handleClear();
                    }}
                  >
                    <div className="w-8 h-8 bg-green-100 rounded flex items-center justify-center">
                      <ShoppingCart className="h-4 w-4 text-green-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{order.customer_name}</p>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          #{order.id.slice(-8)}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          R$ {order.total_amount.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default QuickSearch;
