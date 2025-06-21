
import React, { useEffect } from 'react';
import { ShoppingCart, Search, Menu, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { StoreData } from '@/hooks/useStoreData';
import { useCart } from '@/hooks/useCart';
import { useTemplateColors } from '@/hooks/useTemplateColors';

export type CatalogType = 'retail' | 'wholesale';

interface CatalogHeaderProps {
  store: StoreData;
  catalogType?: CatalogType;
  onCatalogTypeChange?: (type: CatalogType) => void;
  cartItemsCount?: number;
  wishlistCount?: number;
  whatsappNumber?: string;
  onSearch?: (query: string) => void;
  onToggleFilters?: () => void;
  onCartClick: () => void;
}

const CatalogHeader: React.FC<CatalogHeaderProps> = ({
  store,
  catalogType,
  onCatalogTypeChange,
  cartItemsCount = 0,
  wishlistCount = 0,
  whatsappNumber,
  onSearch,
  onToggleFilters,
  onCartClick
}) => {
  const [searchQuery, setSearchQuery] = React.useState('');
  const { toggleCart } = useCart();
  const { applyColorsToDocument } = useTemplateColors(store.url_slug || store.id);

  useEffect(() => {
    applyColorsToDocument();
  }, [applyColorsToDocument]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    onSearch?.(query);
  };

  const handleCartClick = () => {
    console.log('🛒 HEADER - Clique no carrinho, abrindo FloatingCart');  
    toggleCart();
  };

  return (
    <>
      <style>{`
        .catalog-header {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(12px);
          border-bottom: 1px solid var(--template-border, #E2E8F0);
        }
        
        .header-logo-gradient {
          background: linear-gradient(135deg, var(--template-primary, #0057FF), var(--template-accent, #8E2DE2));
        }
        
        .header-search-input {
          background: rgba(248, 250, 252, 0.8);
          border-color: var(--template-border, #E2E8F0);
          transition: all 0.2s ease;
        }
        
        .header-search-input:focus {
          border-color: var(--template-primary, #0057FF);
          box-shadow: 0 0 0 3px rgba(0, 87, 255, 0.1);
          background: white;
        }
        
        .header-cart-button {
          background: var(--template-surface, #FFFFFF);
          border-color: var(--template-border, #E2E8F0);
          color: var(--template-text, #1E293B);
          transition: all 0.2s ease;
        }
        
        .header-cart-button:hover {
          background: var(--template-primary, #0057FF);
          border-color: var(--template-primary, #0057FF);
          color: white;
        }
        
        .header-search-icon {
          color: var(--template-text-muted, #64748B);
        }
        
        .store-name {
          color: var(--template-text, #1E293B);
        }
        
        .store-description {
          color: var(--template-text-muted, #64748B);
        }
      `}</style>
      
      <header className="catalog-header sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo e Nome da Loja */}
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggleFilters}
                className="md:hidden rounded-full hover:bg-gray-100"
              >
                <Menu className="h-5 w-5" />
              </Button>
              
              <div className="flex items-center gap-3">
                {store.logo_url ? (
                  <div className="relative">
                    <img 
                      src={store.logo_url} 
                      alt={`Logo ${store.name}`}
                      className="w-10 h-10 rounded-xl object-cover shadow-sm"
                    />
                    <div className="absolute inset-0 rounded-xl ring-2" style={{ ringColor: 'var(--template-primary)' + '33' }}></div>
                  </div>
                ) : (
                  <div className="header-logo-gradient w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold shadow-sm">
                    {store.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <h1 className="store-name text-xl font-bold">{store.name}</h1>
                  {store.description && (
                    <p className="store-description text-sm hidden sm:block">{store.description}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Barra de Pesquisa */}
            <div className="flex-1 max-w-md mx-4 hidden md:block">
              <div className="relative">
                <Search className="header-search-icon absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4" />
                <Input
                  type="text"
                  placeholder="Buscar produtos..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                  className="header-search-input pl-10 pr-4 py-2 w-full rounded-xl"
                />
              </div>
            </div>

            {/* Ações do Header */}
            <div className="flex items-center gap-3">
              {/* Favoritos */}
              {wishlistCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="relative rounded-xl hover:bg-gray-50 transition-all duration-200"
                >
                  <Heart className="h-5 w-5" />
                  {wishlistCount > 0 && (
                    <Badge 
                      variant="secondary" 
                      className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
                    >
                      {wishlistCount}
                    </Badge>
                  )}
                </Button>
              )}

              {/* Carrinho */}
              <Button
                variant="outline"
                onClick={handleCartClick}
                className="header-cart-button relative rounded-xl transition-all duration-200"
              >
                <ShoppingCart className="h-5 w-5" />
                {cartItemsCount > 0 && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs bg-gradient-to-r from-red-500 to-red-600 shadow-lg animate-pulse"
                  >
                    {cartItemsCount}
                  </Badge>
                )}
                <span className="ml-2 hidden sm:inline">Carrinho</span>
              </Button>
            </div>
          </div>

          {/* Barra de Pesquisa Mobile */}
          <div className="md:hidden pb-3">
            <div className="relative">
              <Search className="header-search-icon absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4" />
              <Input
                type="text"
                placeholder="Buscar produtos..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="header-search-input pl-10 pr-4 py-2 w-full rounded-xl"
              />
            </div>
          </div>
        </div>
      </header>
    </>
  );
};

export default CatalogHeader;
