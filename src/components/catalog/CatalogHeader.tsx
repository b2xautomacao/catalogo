import React, { useState } from 'react';
import { Search, Heart, ShoppingCart, Menu, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { StoreData } from '@/hooks/useStoreData';
import { CatalogType } from '@/hooks/useCatalog';

interface CatalogHeaderProps {
  store: StoreData;
  catalogType: CatalogType;
  onCatalogTypeChange: (type: CatalogType) => void;
  onSearch: (query: string) => void;
  cartItemsCount: number;
  wishlistCount: number;
  whatsappNumber?: string;
  onCartClick?: () => void;
}

const CatalogHeader: React.FC<CatalogHeaderProps> = ({
  store,
  catalogType,
  onCatalogTypeChange,
  onSearch,
  cartItemsCount,
  wishlistCount,
  whatsappNumber,
  onCartClick
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    onSearch(value);
  };

  const handleWhatsAppContact = () => {
    if (whatsappNumber) {
      const message = `Olá! Estou interessado nos produtos da ${store.name}`;
      window.open(`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`, '_blank');
    }
  };

  const handleCartClick = () => {
    if (onCartClick) {
      onCartClick();
    }
  };

  return (
    <header className="bg-white shadow-lg sticky top-0 z-50">
      {/* Top Bar */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2">
        <div className="container mx-auto px-4 flex justify-between items-center text-sm">
          <div className="flex items-center gap-4">
            <span>📦 Frete grátis acima de R$ 200</span>
            <span>⚡ Entrega expressa</span>
          </div>
          {whatsappNumber && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleWhatsAppContact}
              className="text-white hover:bg-white/20"
            >
              <Phone size={16} className="mr-1" />
              WhatsApp
            </Button>
          )}
        </div>
      </div>

      {/* Main Header */}
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo e Nome da Loja */}
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-xl">
              {store.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{store.name}</h1>
              {store.description && (
                <p className="text-gray-600 text-sm">{store.description}</p>
              )}
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-6">
            {/* Catalog Type Selector */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              <Button
                variant={catalogType === 'retail' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => onCatalogTypeChange('retail')}
                className="rounded-md"
              >
                Varejo
              </Button>
              <Button
                variant={catalogType === 'wholesale' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => onCatalogTypeChange('wholesale')}
                className="rounded-md"
              >
                Atacado
              </Button>
            </div>

            {/* Search Bar */}
            <div className="relative w-96">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <Input
                placeholder="Buscar produtos..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10 bg-gray-50 border-gray-200 focus:bg-white"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" className="relative">
                <Heart size={20} />
                {wishlistCount > 0 && (
                  <Badge className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center text-xs bg-red-500">
                    {wishlistCount}
                  </Badge>
                )}
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="relative"
                onClick={handleCartClick}
              >
                <ShoppingCart size={20} />
                {cartItemsCount > 0 && (
                  <Badge className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center text-xs bg-blue-500">
                    {cartItemsCount}
                  </Badge>
                )}
              </Button>
            </div>
          </div>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <Menu size={24} />
          </Button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="lg:hidden mt-4 pb-4 border-t pt-4">
            <div className="space-y-4">
              {/* Mobile Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <Input
                  placeholder="Buscar produtos..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Mobile Catalog Type */}
              <div className="flex bg-gray-100 rounded-lg p-1">
                <Button
                  variant={catalogType === 'retail' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => onCatalogTypeChange('retail')}
                  className="flex-1"
                >
                  Varejo
                </Button>
                <Button
                  variant={catalogType === 'wholesale' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => onCatalogTypeChange('wholesale')}
                  className="flex-1"
                >
                  Atacado
                </Button>
              </div>

              {/* Mobile Actions */}
              <div className="flex justify-center gap-4">
                <Button variant="outline" className="flex items-center gap-2">
                  <Heart size={16} />
                  Lista de Desejos ({wishlistCount})
                </Button>
                <Button 
                  variant="outline" 
                  className="flex items-center gap-2"
                  onClick={handleCartClick}
                >
                  <ShoppingCart size={16} />
                  Carrinho ({cartItemsCount})
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default CatalogHeader;
