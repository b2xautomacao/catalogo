
import React from 'react';
import { Search, Menu, ShoppingCart, User, Phone, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface IndustrialHeaderProps {
  storeName: string;
  logoUrl?: string;
  cartItemsCount?: number;
  onCartClick?: () => void;
  onSearchChange?: (value: string) => void;
  searchValue?: string;
  storePhone?: string;
  storeAddress?: string;
}

const IndustrialHeader: React.FC<IndustrialHeaderProps> = ({
  storeName,
  logoUrl,
  cartItemsCount = 0,
  onCartClick,
  onSearchChange,
  searchValue = '',
  storePhone,
  storeAddress
}) => {
  return (
    <header className="bg-gradient-to-r from-slate-900 via-blue-900 to-slate-800 text-white shadow-2xl">
      {/* Barra superior de contato */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 py-2 px-4">
        <div className="container mx-auto flex justify-between items-center text-sm">
          <div className="flex items-center gap-6">
            {storePhone && (
              <div className="flex items-center gap-2">
                <Phone size={14} className="text-red-400" />
                <span className="text-slate-300">{storePhone}</span>
              </div>
            )}
            {storeAddress && (
              <div className="flex items-center gap-2">
                <MapPin size={14} className="text-red-400" />
                <span className="text-slate-300">{storeAddress}</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" className="text-slate-300 hover:text-white hover:bg-slate-700">
              <User size={16} className="mr-2" />
              Minha Conta
            </Button>
          </div>
        </div>
      </div>

      {/* Header principal */}
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          {/* Logo e nome */}
          <div className="flex items-center gap-4">
            <div className="relative">
              {/* Container do logo com efeito metálico */}
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-slate-700 to-slate-900 rounded-lg flex items-center justify-center border-2 border-slate-600 shadow-xl">
                {logoUrl ? (
                  <img
                    src={logoUrl}
                    alt={storeName}
                    className="w-8 h-8 sm:w-12 sm:h-12 object-contain"
                  />
                ) : (
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-red-600 to-red-700 rounded flex items-center justify-center">
                    <span className="text-white font-bold text-lg sm:text-xl">
                      {storeName.charAt(0)}
                    </span>
                  </div>
                )}
              </div>
              {/* Chanfro decorativo */}
              <div className="absolute -top-1 -right-1 w-3 h-3 sm:w-4 sm:h-4 bg-gradient-to-br from-red-600 to-red-700 clip-path-triangle"></div>
            </div>
            
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-white mb-1">
                {storeName}
              </h1>
              <p className="text-slate-300 text-xs sm:text-sm font-medium">
                SOLUÇÕES INDUSTRIAIS
              </p>
            </div>
          </div>

          {/* Barra de pesquisa - responsiva */}
          <div className="flex-1 max-w-md mx-4 sm:mx-8 order-3 sm:order-2 w-full sm:w-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
              <Input
                type="text"
                placeholder="Buscar produtos..."
                value={searchValue}
                onChange={(e) => onSearchChange?.(e.target.value)}
                className="pl-10 pr-4 py-2 sm:py-3 bg-slate-800/50 border-2 border-slate-600 text-white placeholder-slate-400 focus:border-red-500 focus:bg-slate-800 rounded-lg text-sm sm:text-base"
              />
            </div>
          </div>

          {/* Carrinho e menu */}
          <div className="flex items-center gap-2 sm:gap-4 order-2 sm:order-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={onCartClick}
              className="relative bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white border-2 border-red-500 px-3 py-2 sm:px-6 sm:py-3 font-bold text-xs sm:text-sm"
            >
              <ShoppingCart size={16} className="sm:mr-2" />
              <span className="hidden sm:inline">CARRINHO</span>
              {cartItemsCount > 0 && (
                <Badge className="absolute -top-2 -right-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full border-2 border-white text-xs">
                  {cartItemsCount > 99 ? '99+' : cartItemsCount}
                </Badge>
              )}
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="bg-slate-800/50 hover:bg-slate-700 text-white border-2 border-slate-600 p-2 sm:p-3"
            >
              <Menu size={16} />
            </Button>
          </div>
        </div>
      </div>

      {/* Barra de navegação - responsiva */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 border-t border-slate-700">
        <div className="container mx-auto px-4">
          <nav className="flex items-center gap-2 sm:gap-8 py-3 sm:py-4 overflow-x-auto">
            <Button variant="ghost" className="text-white hover:text-red-400 hover:bg-slate-700 font-bold px-2 py-1 sm:px-4 sm:py-2 text-xs sm:text-sm whitespace-nowrap">
              TODOS
            </Button>
            <Button variant="ghost" className="text-slate-300 hover:text-white hover:bg-slate-700 font-medium px-2 py-1 sm:px-4 sm:py-2 text-xs sm:text-sm whitespace-nowrap">
              MÓVEIS DE AÇO
            </Button>
            <Button variant="ghost" className="text-slate-300 hover:text-white hover:bg-slate-700 font-medium px-2 py-1 sm:px-4 sm:py-2 text-xs sm:text-sm whitespace-nowrap">
              EQUIPAMENTOS
            </Button>
            <Button variant="ghost" className="text-slate-300 hover:text-white hover:bg-slate-700 font-medium px-2 py-1 sm:px-4 sm:py-2 text-xs sm:text-sm whitespace-nowrap">
              ACESSÓRIOS
            </Button>
            <Button variant="ghost" className="text-slate-300 hover:text-white hover:bg-slate-700 font-medium px-2 py-1 sm:px-4 sm:py-2 text-xs sm:text-sm whitespace-nowrap">
              OFERTAS
            </Button>
          </nav>
        </div>
      </div>

      {/* Efeito de bordas metálicas */}
      <div className="h-1 bg-gradient-to-r from-red-600 via-orange-500 to-red-600"></div>
    </header>
  );
};

export default IndustrialHeader;
