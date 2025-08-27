
import React from 'react';
import { Store, CatalogType } from '@/hooks/useCatalog';
import BaseLayoutTemplate from '../BaseLayoutTemplate';
import { Star, Gift, Leaf, Users } from 'lucide-react';

interface ElegantStoreTemplateProps {
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

const ElegantStoreTemplate: React.FC<ElegantStoreTemplateProps> = ({
  ...props
}) => {
  const layoutConfig = {
    showHero: true,
    showPromotional: true,
    containerMaxWidth: 'xl' as const,
    headerStyle: 'prominent' as const,
    contentPadding: 'lg' as const
  };

  // Hero elegante e premium
  const customHero = (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50">
      <div className="absolute inset-0 bg-gradient-to-r from-amber-600/10 to-rose-600/10"></div>
      
      <div className="relative z-10 px-8 py-20 md:px-12 md:py-28 text-center">
        <div className="flex justify-center mb-8">
          <div className="p-4 bg-white rounded-full shadow-lg border border-amber-200">
            <Star className="w-8 h-8 text-amber-600" />
          </div>
        </div>
        
        <h1 className="text-4xl md:text-6xl font-light text-gray-800 mb-6 tracking-wide">
          {props.store.name}
        </h1>
        <div className="w-24 h-px bg-gradient-to-r from-transparent via-amber-400 to-transparent mx-auto mb-8"></div>
        <p className="text-xl md:text-2xl text-gray-600 mb-10 font-light max-w-3xl mx-auto leading-relaxed">
          {props.store.description || 'Elegância e sofisticação em cada produto'}
        </p>
        
        <div className="flex flex-wrap justify-center gap-6">
          <button className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white px-10 py-4 rounded-full font-medium transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1">
            Descobrir Coleção
          </button>
          <button className="bg-white border-2 border-amber-300 text-amber-700 px-10 py-4 rounded-full font-medium hover:bg-amber-50 transition-all duration-300 shadow-sm">
            Ver Lançamentos
          </button>
        </div>
      </div>
    </div>
  );

  // Seção elegante de valores
  const beforeContent = (
    <div className="mb-20">
      <div className="text-center mb-16">
        <div className="flex justify-center mb-6">
          <div className="w-1 h-12 bg-gradient-to-b from-amber-400 to-rose-400 rounded-full"></div>
        </div>
        <h2 className="text-4xl font-light text-gray-800 mb-6 tracking-wide">Nossos Valores</h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto font-light leading-relaxed">
          Compromisso com a excelência em cada detalhe da sua experiência
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        <div className="group text-center">
          <div className="relative mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-amber-100 to-orange-100 rounded-2xl flex items-center justify-center mx-auto group-hover:scale-110 transition-transform duration-500 shadow-lg">
              <Star className="w-10 h-10 text-amber-600" />
            </div>
            <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-8 h-8 bg-white rounded-full border-4 border-amber-200 group-hover:border-amber-300 transition-colors"></div>
          </div>
          <h3 className="text-xl font-medium text-gray-800 mb-4">Excelência</h3>
          <p className="text-gray-600 leading-relaxed font-light">
            Produtos cuidadosamente selecionados com os mais altos padrões de qualidade
          </p>
        </div>

        <div className="group text-center">
          <div className="relative mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-rose-100 to-pink-100 rounded-2xl flex items-center justify-center mx-auto group-hover:scale-110 transition-transform duration-500 shadow-lg">
              <Gift className="w-10 h-10 text-rose-600" />
            </div>
            <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-8 h-8 bg-white rounded-full border-4 border-rose-200 group-hover:border-rose-300 transition-colors"></div>
          </div>
          <h3 className="text-xl font-medium text-gray-800 mb-4">Experiência</h3>
          <p className="text-gray-600 leading-relaxed font-light">
            Atendimento personalizado e experiência de compra diferenciada
          </p>
        </div>

        <div className="group text-center">
          <div className="relative mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-green-100 to-emerald-100 rounded-2xl flex items-center justify-center mx-auto group-hover:scale-110 transition-transform duration-500 shadow-lg">
              <Leaf className="w-10 h-10 text-green-600" />
            </div>
            <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-8 h-8 bg-white rounded-full border-4 border-green-200 group-hover:border-green-300 transition-colors"></div>
          </div>
          <h3 className="text-xl font-medium text-gray-800 mb-4">Sustentabilidade</h3>
          <p className="text-gray-600 leading-relaxed font-light">
            Compromisso com práticas sustentáveis e responsabilidade social
          </p>
        </div>

        <div className="group text-center">
          <div className="relative mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl flex items-center justify-center mx-auto group-hover:scale-110 transition-transform duration-500 shadow-lg">
              <Users className="w-10 h-10 text-blue-600" />
            </div>
            <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-8 h-8 bg-white rounded-full border-4 border-blue-200 group-hover:border-blue-300 transition-colors"></div>
          </div>
          <h3 className="text-xl font-medium text-gray-800 mb-4">Comunidade</h3>
          <p className="text-gray-600 leading-relaxed font-light">
            Conectando pessoas através de produtos que fazem a diferença
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <BaseLayoutTemplate
      {...props}
      templateStyle="neutral"
      templateNiche="cosmetics"
      layoutConfig={layoutConfig}
      heroSlot={customHero}
      beforeContentSlot={beforeContent}
    />
  );
};

export default ElegantStoreTemplate;
