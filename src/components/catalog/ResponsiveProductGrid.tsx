import React, { useState, useEffect } from 'react';
import { Product, ProductVariation } from '@/types/product';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { toast } from "@/components/ui/use-toast"
import { useCart } from '@/hooks/useCart';
import { AspectRatio } from "@/components/ui/aspect-ratio"
import { Skeleton } from "@/components/ui/skeleton"
import { Link } from 'react-router-dom';
import { Store } from '@/types/store';
import { useStores } from '@/hooks/useStores';
import { useCatalogSettings } from '@/hooks/useCatalogSettings';
import { useTheme } from 'next-themes';

interface ResponsiveProductGridProps {
  products: Product[];
  loading: boolean;
  onAddToCart?: (product: Product, quantity: number, variation?: any) => void;
  catalogType: string;
  storeId: string;
}

const ResponsiveProductGrid: React.FC<ResponsiveProductGridProps> = ({
  products,
  loading,
  onAddToCart,
  catalogType,
  storeId
}) => {
  const { addItem } = useCart();
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const { stores } = useStores();
  const store = stores?.find(store => store.id === storeId) as Store;
  const { settings } = useCatalogSettings();
  const { theme } = useTheme();

  useEffect(() => {
    if (products) {
      const filtered = products.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredProducts(filtered);
    }
  }, [products, searchTerm]);

  const handleAddToCart = (product: Product, quantity: number = 1, variation?: any) => {
    // Corrigir: passar apenas o produto, não um objeto com propriedade product
    addItem(product, quantity, variation);
    
    toast({
      title: "Produto adicionado!",
      description: `${product.name} foi adicionado ao carrinho`,
      duration: 2000,
    });
  };

  const getThemeVariables = () => {
    const isDarkTheme = theme === 'dark';

    return {
      textColor: isDarkTheme ? 'white' : 'black',
      backgroundColor: isDarkTheme ? '#121212' : 'white',
      cardBackgroundColor: isDarkTheme ? '#333' : '#f9f9f9',
      borderColor: isDarkTheme ? '#555' : '#ddd',
    };
  };

  const themeVars = getThemeVariables();

  return (
    <div className="w-full">
      {/* Search Bar */}
      <div className="mb-4">
        <Input
          type="text"
          placeholder="Buscar produtos..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full"
        />
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="mb-2">
                  <Skeleton className="h-4 w-32" />
                </div>
                <div>
                  <Skeleton className="h-4 w-48" />
                </div>
                <div className="mt-4">
                  <Skeleton className="h-8 w-24" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredProducts.map((product) => (
            <Card key={product.id} className="overflow-hidden">
              <Link to={`/product/${product.id}`}>
                <div className="relative">
                  <AspectRatio ratio={4 / 3}>
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="object-cover rounded-md"
                      />
                    ) : (
                      <div className="bg-gray-100 flex items-center justify-center rounded-md">
                        <span className="text-gray-500">Sem imagem</span>
                      </div>
                    )}
                  </AspectRatio>
                </div>
              </Link>
              <CardContent className="p-4">
                <CardTitle className="text-lg font-semibold truncate">
                  {product.name}
                </CardTitle>
                <CardDescription>
                  R$ {product.retail_price.toFixed(2)}
                </CardDescription>
                <Button
                  className="w-full mt-4"
                  onClick={() => handleAddToCart(product)}
                >
                  Adicionar ao Carrinho
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default ResponsiveProductGrid;
