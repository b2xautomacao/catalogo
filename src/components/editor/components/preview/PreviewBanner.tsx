
import React from 'react';
import { ArrowRight } from 'lucide-react';

const PreviewBanner: React.FC = () => {
  return (
    <section className="relative bg-gradient-to-r from-blue-600 to-purple-600 text-white py-20">
      <div className="container mx-auto px-4 text-center">
        <h1 className="text-4xl md:text-6xl font-bold mb-6">
          Bem-vindo à Nossa Loja
        </h1>
        <p className="text-xl md:text-2xl mb-8 opacity-90">
          Encontre os melhores produtos com preços incríveis
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button className="bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold hover:bg-gray-100 transition-colors flex items-center justify-center gap-2">
            Ver Produtos
            <ArrowRight size={20} />
          </button>
          <button className="border-2 border-white px-8 py-4 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors">
            Saiba Mais
          </button>
        </div>
      </div>
      
      {/* Elemento decorativo */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="w-full h-12 fill-white">
          <path d="M0,60 C300,120 900,0 1200,60 L1200,120 L0,120 Z"></path>
        </svg>
      </div>
    </section>
  );
};

export default PreviewBanner;
