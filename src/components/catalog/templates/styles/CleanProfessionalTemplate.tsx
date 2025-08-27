
import React from 'react';
import { Store, CatalogType } from '@/hooks/useCatalog';
import BaseLayoutTemplate from '../BaseLayoutTemplate';
import { Shield, Truck, Award, CheckCircle } from 'lucide-react';

interface CleanProfessionalTemplateProps {
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

const CleanProfessionalTemplate: React.FC<CleanProfessionalTemplateProps> = ({
  ...props
}) => {
  const layoutConfig = {
    showHero: true,
    showPromotional: false,
    containerMaxWidth: 'xl' as const,
    headerStyle: 'minimal' as const,
    contentPadding: 'md' as const
  };

  // Hero clean e profissional
  const customHero = (
    <div className="bg-white border-2 border-gray-200 rounded-xl overflow-hidden">
      <div className="px-8 py-16 md:px-12 md:py-20 text-center bg-gradient-to-r from-blue-50 to-indigo-50">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">
          {props.store.name}
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
          {props.store.description || 'Soluções profissionais com qualidade garantida'}
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors shadow-sm">
            Ver Produtos
          </button>
          <button className="bg-white border-2 border-blue-600 text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors">
            Saiba Mais
          </button>
        </div>
      </div>
    </div>
  );

  // Seção de vantagens profissional
  const beforeContent = (
    <div className="mb-16">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Nossos Diferenciais</h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Compromisso com excelência em cada detalhe
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl border-2 border-gray-100 hover:border-blue-200 hover:shadow-md transition-all duration-300">
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
            <Shield className="w-6 h-6 text-blue-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Segurança</h3>
          <p className="text-gray-600 text-sm leading-relaxed">
            Compra 100% segura com certificado SSL
          </p>
        </div>

        <div className="bg-white p-6 rounded-xl border-2 border-gray-100 hover:border-green-200 hover:shadow-md transition-all duration-300">
          <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
            <Truck className="w-6 h-6 text-green-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Entrega Rápida</h3>
          <p className="text-gray-600 text-sm leading-relaxed">
            Entrega expressa em todo o território nacional
          </p>
        </div>

        <div className="bg-white p-6 rounded-xl border-2 border-gray-100 hover:border-purple-200 hover:shadow-md transition-all duration-300">
          <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
            <Award className="w-6 h-6 text-purple-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Qualidade</h3>
          <p className="text-gray-600 text-sm leading-relaxed">
            Produtos com garantia de qualidade certificada
          </p>
        </div>

        <div className="bg-white p-6 rounded-xl border-2 border-gray-100 hover:border-orange-200 hover:shadow-md transition-all duration-300">
          <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
            <CheckCircle className="w-6 h-6 text-orange-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Suporte</h3>
          <p className="text-gray-600 text-sm leading-relaxed">
            Atendimento especializado pré e pós-venda
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <BaseLayoutTemplate
      {...props}
      templateStyle="neutral"
      templateNiche="electronics"
      layoutConfig={layoutConfig}
      heroSlot={customHero}
      beforeContentSlot={beforeContent}
    />
  );
};

export default CleanProfessionalTemplate;
