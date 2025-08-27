
import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Store, CatalogType } from '@/hooks/useCatalog';
import { ChevronDown } from 'lucide-react';

interface BannerHeroProps {
  store: Store;
  catalogType: CatalogType;
  onScrollToCatalog?: () => void;
}

const BannerHero: React.FC<BannerHeroProps> = ({
  store,
  catalogType,
  onScrollToCatalog
}) => {
  return (
    <div className="relative h-[500px] w-full overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: store.logo_url 
            ? `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.6)), url(${store.logo_url})`
            : 'linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--primary)) 100%)'
        }}
      />
      
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/40 to-black/60" />
      
      {/* Content */}
      <div className="relative z-10 h-full flex items-center justify-center">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Logo */}
            {store.logo_url && (
              <div className="flex justify-center mb-6">
                <img
                  src={store.logo_url}
                  alt={`Logo ${store.name}`}
                  className="w-24 h-24 rounded-full object-cover border-4 border-white/20 shadow-2xl"
                />
              </div>
            )}
            
            {/* Store Name */}
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-4 drop-shadow-lg">
              {store.name}
            </h1>
            
            {/* Store Description */}
            {store.description && (
              <p className="text-xl md:text-2xl text-white/90 mb-6 max-w-3xl mx-auto leading-relaxed">
                {store.description}
              </p>
            )}
            
            {/* Badges */}
            <div className="flex items-center justify-center gap-3 mb-8">
              <Badge 
                variant="secondary" 
                className="bg-white/20 text-white border-white/30 backdrop-blur-sm text-lg px-4 py-2"
              >
                {catalogType === 'wholesale' ? '🏪 Atacado' : '🛍️ Varejo'}
              </Badge>
              
              <Badge 
                variant="secondary" 
                className="bg-white/20 text-white border-white/30 backdrop-blur-sm text-lg px-4 py-2"
              >
                ✨ Catálogo Online
              </Badge>
            </div>
            
            {/* Call to Action */}
            <div className="space-y-4">
              <Button
                size="lg"
                onClick={onScrollToCatalog}
                className="bg-white text-primary hover:bg-white/90 shadow-2xl text-lg px-8 py-4 h-auto font-semibold transition-all duration-300 hover:scale-105"
              >
                Ver Produtos
                <ChevronDown className="ml-2 h-5 w-5" />
              </Button>
              
              <p className="text-white/70 text-sm">
                Explore nosso catálogo completo
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Scroll Indicator */}
      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 animate-bounce">
        <ChevronDown className="h-6 w-6 text-white/60" />
      </div>
    </div>
  );
};

export default BannerHero;
