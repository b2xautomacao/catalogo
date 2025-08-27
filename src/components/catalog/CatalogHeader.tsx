
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Store } from '@/hooks/useCatalog';
import { CatalogType } from '@/hooks/useCatalog';

export interface CatalogHeaderProps {
  store: Store;
  catalogType: CatalogType;
  templateName?: string;
  cartItemsCount?: number;
  wishlistCount?: number;
  onSearch?: (query: string) => void;
  onToggleFilters?: () => void;
  onCartClick?: () => void;
}

const CatalogHeader: React.FC<CatalogHeaderProps> = ({
  store,
  catalogType,
  templateName = 'modern',
  cartItemsCount = 0,
  wishlistCount = 0,
  onSearch,
  onToggleFilters,
  onCartClick
}) => {
  return (
    <header className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {store.logo_url && (
              <img
                src={store.logo_url}
                alt={`Logo ${store.name}`}
                className="w-16 h-16 rounded-full object-cover border-2 border-white/20"
              />
            )}
            <div>
              <h1 className="text-3xl font-bold">{store.name}</h1>
              {store.description && (
                <p className="text-primary-foreground/80 mt-1">{store.description}</p>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Cart and Wishlist counters */}
            {(cartItemsCount > 0 || wishlistCount > 0) && (
              <div className="flex items-center gap-2">
                {cartItemsCount > 0 && (
                  <Badge variant="secondary" className="bg-white/10 text-primary-foreground border-white/20">
                    Carrinho: {cartItemsCount}
                  </Badge>
                )}
                {wishlistCount > 0 && (
                  <Badge variant="secondary" className="bg-white/10 text-primary-foreground border-white/20">
                    Favoritos: {wishlistCount}
                  </Badge>
                )}
              </div>
            )}
            
            <Badge 
              variant="secondary" 
              className="bg-white/10 text-primary-foreground border-white/20"
            >
              {catalogType === 'wholesale' ? 'Atacado' : 'Varejo'}
            </Badge>
          </div>
        </div>
      </div>
    </header>
  );
};

export default CatalogHeader;
