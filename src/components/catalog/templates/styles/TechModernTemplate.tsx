
import React from 'react';
import { Store, CatalogType } from '@/hooks/useCatalog';
import BaseLayoutTemplate from '../BaseLayoutTemplate';
import { Zap, Cpu, Smartphone, Wifi } from 'lucide-react';

interface TechModernTemplateProps {
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

const TechModernTemplate: React.FC<TechModernTemplateProps> = ({
  ...props
}) => {
  const layoutConfig = {
    showHero: true,
    showPromotional: true,
    containerMaxWidth: 'xl' as const,
    headerStyle: 'default' as const,
    contentPadding: 'lg' as const
  };

  // Hero tech moderno com animações
  const customHero = (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 text-white">
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-cyan-500/20"></div>
      <div className="absolute inset-0 opacity-20">
        <div className="w-full h-full bg-repeat" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          backgroundSize: '60px 60px'
        }}></div>
      </div>
      
      <div className="relative z-10 px-8 py-16 md:px-12 md:py-24">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-blue-500/20 rounded-full border border-blue-400/30">
              <Zap className="w-8 h-8 text-cyan-400" />
            </div>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
            {props.store.name}
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-blue-100 font-light max-w-3xl mx-auto leading-relaxed">
            {props.store.description || 'Tecnologia de ponta para o futuro'}
          </p>
          
          <div className="flex flex-wrap justify-center gap-4">
            <button className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white px-8 py-3 rounded-lg font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
              Explorar Tech
            </button>
            <button className="bg-white/10 border border-white/20 text-white px-8 py-3 rounded-lg font-semibold hover:bg-white/20 transition-all duration-300 backdrop-blur-sm">
              Ver Novidades
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // Seção tech com animações
  const beforeContent = (
    <div className="mb-16">
      <div className="text-center mb-12">
        <div className="flex justify-center mb-4">
          <div className="p-3 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full">
            <Cpu className="w-6 h-6 text-white" />
          </div>
        </div>
        <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-blue-600 bg-clip-text text-transparent mb-4">
          Inovação em Cada Produto
        </h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Descubra as últimas tendências em tecnologia
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="group relative overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-50 p-8 rounded-2xl border border-blue-200 hover:shadow-xl transition-all duration-500 hover:-translate-y-2">
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-400 to-cyan-400 rounded-bl-3xl opacity-20 group-hover:opacity-30 transition-opacity"></div>
          <div className="relative z-10">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
              <Smartphone className="w-7 h-7 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Última Geração</h3>
            <p className="text-gray-600 leading-relaxed">
              Dispositivos com tecnologia de ponta e performance excepcional
            </p>
          </div>
        </div>

        <div className="group relative overflow-hidden bg-gradient-to-br from-cyan-50 to-blue-50 p-8 rounded-2xl border border-cyan-200 hover:shadow-xl transition-all duration-500 hover:-translate-y-2">
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-cyan-400 to-blue-400 rounded-bl-3xl opacity-20 group-hover:opacity-30 transition-opacity"></div>
          <div className="relative z-10">
            <div className="w-14 h-14 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
              <Wifi className="w-7 h-7 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Conectividade</h3>
            <p className="text-gray-600 leading-relaxed">
              Conexão inteligente e sincronização perfeita entre dispositivos
            </p>
          </div>
        </div>

        <div className="group relative overflow-hidden bg-gradient-to-br from-indigo-50 to-purple-50 p-8 rounded-2xl border border-indigo-200 hover:shadow-xl transition-all duration-500 hover:-translate-y-2">
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-indigo-400 to-purple-400 rounded-bl-3xl opacity-20 group-hover:opacity-30 transition-opacity"></div>
          <div className="relative z-10">
            <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
              <Cpu className="w-7 h-7 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Performance</h3>
            <p className="text-gray-600 leading-relaxed">
              Processamento avançado para máxima produtividade e eficiência
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <BaseLayoutTemplate
      {...props}
      templateStyle="dark"
      templateNiche="electronics"
      layoutConfig={layoutConfig}
      heroSlot={customHero}
      beforeContentSlot={beforeContent}
    />
  );
};

export default TechModernTemplate;
