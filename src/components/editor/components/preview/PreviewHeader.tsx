
import React from 'react';
import { useEditorStore } from '../../stores/useEditorStore';
import { Search, ShoppingCart, Menu } from 'lucide-react';

const PreviewHeader: React.FC = () => {
  const { configuration } = useEditorStore();
  const headerConfig = configuration.header;

  const getLayoutClass = () => {
    switch (headerConfig.layout) {
      case 'center':
        return 'justify-center';
      case 'right':
        return 'justify-end';
      case 'split':
        return 'justify-between';
      default:
        return 'justify-start';
    }
  };

  const getLogoPosition = () => {
    switch (headerConfig.logoPosition) {
      case 'center':
        return 'mx-auto';
      case 'right':
        return 'ml-auto';
      default:
        return '';
    }
  };

  return (
    <header 
      className={`${headerConfig.isSticky ? 'sticky top-0 z-50' : ''} border-b`}
      style={{ 
        backgroundColor: headerConfig.backgroundColor,
        color: headerConfig.textColor 
      }}
    >
      <div className="container mx-auto px-4 py-3">
        <div className={`flex items-center ${getLayoutClass()}`}>
          {/* Logo */}
          <div className={`flex items-center ${getLogoPosition()}`}>
            <div className="w-8 h-8 bg-current rounded mr-3 flex-shrink-0" />
            <div>
              <h1 className="text-xl font-bold">Minha Loja</h1>
              {headerConfig.showSlogan && (
                <p className="text-sm opacity-80">{headerConfig.slogan}</p>
              )}
            </div>
          </div>

          {/* Menu de navegação (para layout split) */}
          {headerConfig.layout === 'split' && (
            <nav className="hidden md:flex space-x-6">
              <a href="#" className="hover:opacity-80">Produtos</a>
              <a href="#" className="hover:opacity-80">Categorias</a>
              <a href="#" className="hover:opacity-80">Contato</a>
            </nav>
          )}

          {/* Ações do header */}
          <div className="flex items-center space-x-3 ml-auto">
            {headerConfig.showSearchBar && headerConfig.searchBarPosition === 'header' && (
              <div className="hidden md:flex items-center">
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 opacity-50" />
                  <input
                    type="text"
                    placeholder="Buscar produtos..."
                    className="pl-10 pr-4 py-2 border rounded-lg text-gray-900 bg-white"
                  />
                </div>
              </div>
            )}
            <button className="relative">
              <ShoppingCart size={20} />
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                0
              </span>
            </button>
            <button className="md:hidden">
              <Menu size={20} />
            </button>
          </div>
        </div>

        {/* Barra de busca abaixo do header */}
        {headerConfig.showSearchBar && headerConfig.searchBarPosition === 'below' && (
          <div className="mt-3 pt-3 border-t border-current border-opacity-20">
            <div className="relative max-w-md">
              <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 opacity-50" />
              <input
                type="text"
                placeholder="Buscar produtos..."
                className="w-full pl-10 pr-4 py-2 border rounded-lg text-gray-900 bg-white"
              />
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default PreviewHeader;
