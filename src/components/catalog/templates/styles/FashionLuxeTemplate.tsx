
import React from 'react';
import { Store, CatalogType } from '@/hooks/useCatalog';
import BaseLayoutTemplate from '../BaseLayoutTemplate';
import { Sparkles, Heart, Crown } from 'lucide-react';

interface FashionLuxeTemplateProps {
  store: Store;
  catalogType: CatalogType;
  cartItemsCount: number;
  wishlistCount: number;
  whatsappNumber?: string;
  onSearch: (query: string) => void;
  onToggleFilters: () => void;
  onCartClick: () => void;
  children: React.ReactNode;
  editorSettings?: any;
}

const FashionLuxeTemplate: React.FC<FashionLuxeTemplateProps> = ({
  ...props
}) => {
  const layoutConfig = {
    showHero: true,
    showPromotional: true,
    containerMaxWidth: 'xl' as const,
    headerStyle: 'prominent' as const,
    contentPadding: 'lg' as const
  };

  // Hero banner luxuoso com gradiente fashion
  const customHero = (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-pink-500 via-purple-500 to-indigo-600 text-white">
      <div className="absolute inset-0 bg-black/20"></div>
      <div className="relative z-10 px-8 py-16 md:px-12 md:py-24 text-center">
        <div className="flex justify-center mb-6">
          <Crown className="w-12 h-12 text-yellow-300" />
        </div>
        <h1 className="text-4xl md:text-6xl font-bold mb-6 tracking-tight">
          {props.store.name}
        </h1>
        <p className="text-xl md:text-2xl mb-8 font-light max-w-3xl mx-auto leading-relaxed">
          {props.store.description || 'Descubra nossa coleção exclusiva de moda premium'}
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <button className="bg-white text-purple-600 px-8 py-3 rounded-full font-semibold hover:bg-gray-100 transition-colors shadow-lg">
            Ver Coleção
          </button>
          <button className="border-2 border-white text-white px-8 py-3 rounded-full font-semibold hover:bg-white hover:text-purple-600 transition-colors">
            Novidades
          </button>
        </div>
      </div>
    </div>
  );

  // Seção de destaque luxuosa
  const beforeContent = (
    <div className="mb-16">
      <div className="text-center mb-12">
        <div className="flex justify-center mb-4">
          <Sparkles className="w-8 h-8 text-pink-500" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Por que escolher nossa loja?</h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Experiência premium em cada detalhe
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-gradient-to-br from-pink-50 to-purple-50 p-8 rounded-2xl border border-pink-200 hover:shadow-lg transition-all duration-300">
          <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-purple-500 rounded-2xl flex items-center justify-center mb-6 mx-auto">
            <Heart className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-3 text-center">Qualidade Premium</h3>
          <p className="text-gray-600 text-center leading-relaxed">
            Produtos selecionados com os mais altos padrões de qualidade e exclusividade
          </p>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-indigo-50 p-8 rounded-2xl border border-purple-200 hover:shadow-lg transition-all duration-300">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-2xl flex items-center justify-center mb-6 mx-auto">
            <Crown className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-3 text-center">Experiência VIP</h3>
          <p className="text-gray-600 text-center leading-relaxed">
            Atendimento personalizado e experiência de compra diferenciada
          </p>
        </div>

        <div className="bg-gradient-to-br from-indigo-50 to-pink-50 p-8 rounded-2xl border border-indigo-200 hover:shadow-lg transition-all duration-300">
          <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-pink-500 rounded-2xl flex items-center justify-center mb-6 mx-auto">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-3 text-center">Exclusividade</h3>
          <p className="text-gray-600 text-center leading-relaxed">
            Peças únicas e lançamentos exclusivos para clientes especiais
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <BaseLayoutTemplate
      {...props}
      templateStyle="vibrant"
      templateNiche="fashion"
      layoutConfig={layoutConfig}
      heroSlot={customHero}
      beforeContentSlot={beforeContent}
    />
  );
};

export default FashionLuxeTemplate;
