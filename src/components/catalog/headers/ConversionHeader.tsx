import React from 'react';
import { Store } from '@/hooks/useCatalog';
import { ShoppingCart, Heart, Truck, Shield, Zap, Menu } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import SmartSearch from '../SmartSearch';

interface ConversionHeaderProps {
  store: Store;
  cartItemsCount: number;
  wishlistCount: number;
  products?: any[];
  onSearch: (query: string) => void;
  onProductSelect?: (product: any) => void;
  onCartClick: () => void;
  onToggleFilters: () => void;
  showBadges?: boolean;
  freeShippingThreshold?: number;
}

const ConversionHeader: React.FC<ConversionHeaderProps> = ({
  store,
  cartItemsCount,
  wishlistCount,
  products = [],
  onSearch,
  onProductSelect,
  onCartClick,
  onToggleFilters,
  showBadges = true,
  freeShippingThreshold = 200,
}) => {
  return (
    <div className="sticky top-0 z-50 bg-white shadow-sm">
      {/* Top Bar com badges de conversão */}
      {showBadges && (
        <div className="bg-gradient-to-r from-primary/10 via-accent/10 to-secondary/10 border-b border-gray-200">
          <div className="container mx-auto px-4 py-2">
            <div className="flex items-center justify-center gap-4 md:gap-8 flex-wrap text-xs md:text-sm">
              <div className="flex items-center gap-2 text-green-700 font-medium">
                <Truck className="h-4 w-4" />
                <span className="hidden sm:inline">Entrega Rápida em 24h</span>
                <span className="sm:hidden">Entrega 24h</span>
              </div>
              
              <div className="flex items-center gap-2 text-blue-700 font-medium">
                <Zap className="h-4 w-4" />
                <span className="hidden sm:inline">Frete Grátis acima de R$ {freeShippingThreshold}</span>
                <span className="sm:hidden">Frete Grátis</span>
              </div>
              
              <div className="flex items-center gap-2 text-purple-700 font-medium">
                <Shield className="h-4 w-4" />
                <span className="hidden sm:inline">Compra 100% Segura</span>
                <span className="sm:hidden">100% Segura</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Navbar */}
      <div className="border-b border-gray-200">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center gap-4">
            {/* Logo e nome da loja */}
            <div className="flex items-center gap-3 flex-shrink-0">
              {store.logo_url ? (
                <img
                  src={store.logo_url}
                  alt={store.name}
                  className="w-10 h-10 md:w-12 md:h-12 rounded-full object-cover ring-2 ring-primary/20"
                />
              ) : (
                <div 
                  className="w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center text-white font-bold text-lg"
                  style={{ background: 'var(--template-primary, #0057FF)' }}
                >
                  {store.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="hidden md:block">
                <h1 className="font-bold text-gray-900 text-lg md:text-xl">{store.name}</h1>
                {store.description && (
                  <p className="text-xs text-gray-500 line-clamp-1">{store.description}</p>
                )}
              </div>
            </div>

            {/* Busca inteligente */}
            <div className="flex-1 max-w-2xl">
              <SmartSearch
                products={products}
                onSearch={onSearch}
                onProductSelect={onProductSelect}
                placeholder="Buscar produtos..."
              />
            </div>

            {/* Ações */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {/* Menu mobile */}
              <Button
                variant="ghost"
                size="icon"
                onClick={onToggleFilters}
                className="md:hidden"
              >
                <Menu className="h-5 w-5" />
              </Button>

              {/* Wishlist */}
              {wishlistCount > 0 && (
                <button className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors hidden sm:flex">
                  <Heart className="h-5 w-5 text-gray-600" />
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-red-500">
                    {wishlistCount}
                  </Badge>
                </button>
              )}
              
              {/* Carrinho */}
              <button 
                onClick={onCartClick}
                className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ShoppingCart className="h-5 w-5 text-gray-600" />
                {cartItemsCount > 0 && (
                  <Badge 
                    className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                    style={{ background: 'var(--template-primary, #0057FF)' }}
                  >
                    {cartItemsCount}
                  </Badge>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConversionHeader;

