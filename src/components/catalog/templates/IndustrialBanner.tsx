
import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Zap, Star } from 'lucide-react';

interface BannerData {
  id: string;
  title: string;
  description?: string;
  image_url: string;
  link_url?: string;
  banner_type: 'hero' | 'category' | 'sidebar' | 'promotional';
}

interface IndustrialBannerProps {
  banner: BannerData;
  onClick?: () => void;
}

const IndustrialBanner: React.FC<IndustrialBannerProps> = ({ banner, onClick }) => {
  const handleClick = () => {
    if (banner.link_url) {
      window.open(banner.link_url, '_blank');
    }
    onClick?.();
  };

  // Banner Hero - Principal
  if (banner.banner_type === 'hero') {
    return (
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 rounded-lg shadow-2xl">
        <div className="absolute inset-0">
          <img
            src={banner.image_url}
            alt={banner.title}
            className="w-full h-full object-cover opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900/80 via-transparent to-slate-900/60"></div>
        </div>
        
        <div className="relative z-10 p-8 lg:p-12">
          <div className="max-w-2xl">
            <Badge className="mb-4 bg-gradient-to-r from-red-600 to-red-700 text-white font-bold px-4 py-2 clip-path-badge">
              <Zap size={16} className="mr-2" />
              OFERTA ESPECIAL
            </Badge>
            
            <h2 className="text-4xl lg:text-6xl font-bold text-white mb-4 leading-tight">
              {banner.title}
            </h2>
            
            {banner.description && (
              <p className="text-xl text-slate-300 mb-8 leading-relaxed">
                {banner.description}
              </p>
            )}
            
            <Button
              onClick={handleClick}
              className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold px-8 py-4 text-lg clip-path-button-large shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
            >
              CONFERIR OFERTA
              <ArrowRight size={20} className="ml-2" />
            </Button>
          </div>
        </div>
        
        {/* Chanfros decorativos */}
        <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-red-600 to-red-700 clip-path-triangle"></div>
        <div className="absolute bottom-0 left-0 w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 clip-path-triangle rotate-180"></div>
      </div>
    );
  }

  // Banner de Categoria
  if (banner.banner_type === 'category') {
    return (
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 cursor-pointer" onClick={handleClick}>
        <div className="aspect-video relative">
          <img
            src={banner.image_url}
            alt={banner.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent"></div>
        </div>
        
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <h3 className="text-xl font-bold text-white mb-2">
            {banner.title}
          </h3>
          {banner.description && (
            <p className="text-slate-200 text-sm">
              {banner.description}
            </p>
          )}
        </div>
        
        <div className="absolute top-2 right-2 w-6 h-6 bg-gradient-to-br from-red-600 to-red-700 clip-path-triangle"></div>
      </div>
    );
  }

  // Banner Lateral
  if (banner.banner_type === 'sidebar') {
    return (
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer" onClick={handleClick}>
        <div className="aspect-square relative">
          <img
            src={banner.image_url}
            alt={banner.title}
            className="w-full h-full object-cover opacity-80"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-slate-900/40"></div>
        </div>
        
        <div className="absolute inset-0 p-4 flex flex-col justify-end">
          <Badge className="mb-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold px-3 py-1 clip-path-badge self-start">
            <Star size={12} className="mr-1" />
            DESTAQUE
          </Badge>
          
          <h4 className="text-lg font-bold text-white mb-1">
            {banner.title}
          </h4>
          
          <Button
            size="sm"
            className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold px-4 py-2 clip-path-button self-start"
          >
            Ver Mais
          </Button>
        </div>
        
        <div className="absolute top-2 right-2 w-4 h-4 bg-gradient-to-br from-red-600 to-red-700 clip-path-triangle"></div>
      </div>
    );
  }

  // Banner Promocional
  return (
    <div className="relative overflow-hidden bg-gradient-to-r from-orange-500 to-red-600 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 cursor-pointer" onClick={handleClick}>
      <div className="p-6 relative">
        <div className="flex items-center justify-between">
          <div>
            <Badge className="mb-2 bg-white/20 text-white font-bold px-3 py-1 clip-path-badge">
               PROMOÇÃO
            </Badge>
            <h4 className="text-xl font-bold text-white mb-2">
              {banner.title}
            </h4>
            {banner.description && (
              <p className="text-white/90 text-sm mb-4">
                {banner.description}
              </p>
            )}
            <Button
              size="sm"
              className="bg-white hover:bg-slate-100 text-slate-900 font-bold px-4 py-2 clip-path-button"
            >
              APROVEITAR
            </Button>
          </div>
          
          <div className="w-24 h-24 relative">
            <img
              src={banner.image_url}
              alt={banner.title}
              className="w-full h-full object-cover rounded-lg"
            />
          </div>
        </div>
      </div>
      
      <div className="absolute top-0 right-0 w-8 h-8 bg-gradient-to-br from-yellow-400 to-orange-500 clip-path-triangle"></div>
    </div>
  );
};

export default IndustrialBanner;
