import React, { useEffect } from 'react';
import { useBanners } from '@/hooks/useBanners';
import { Button } from '@/components/ui/button';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from '@/components/ui/carousel';

interface FullWidthHeroBannerProps {
  storeId: string;
  className?: string;
  showCTA?: boolean;
  ctaText?: string;
  onCTAClick?: () => void;
}

const FullWidthHeroBanner: React.FC<FullWidthHeroBannerProps> = ({
  storeId,
  className = '',
  showCTA = false,
  ctaText = 'Ver Produtos',
  onCTAClick,
}) => {
  const { banners, loading } = useBanners(storeId, 'hero');
  const [api, setApi] = React.useState<CarouselApi>();

  // Autoplay
  useEffect(() => {
    if (!api) return;

    const interval = setInterval(() => {
      if (api.canScrollNext()) {
        api.scrollNext();
      } else {
        api.scrollTo(0);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [api]);

  if (loading || banners.length === 0) {
    return null;
  }

  // Banner único
  if (banners.length === 1) {
    const banner = banners[0];
    return (
      <div className={`full-width-hero relative w-screen -mx-[50vw] left-1/2 right-1/2 ${className}`}>
        {banner.link_url ? (
          <a href={banner.link_url} target="_blank" rel="noopener noreferrer" className="block">
            <div className="relative h-[60vh] md:h-[70vh] overflow-hidden">
              <img
                src={banner.image_url}
                alt={banner.title}
                className="w-full h-full object-cover"
                loading="eager"
              />
              
              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

              {/* CTA Button */}
              {showCTA && (
                <div className="absolute bottom-12 left-1/2 -translate-x-1/2 md:left-12 md:translate-x-0">
                  <Button
                    size="lg"
                    onClick={(e) => {
                      e.preventDefault();
                      onCTAClick?.();
                    }}
                    className="bg-white text-gray-900 hover:bg-gray-100 shadow-2xl font-semibold px-8 py-6 text-lg"
                  >
                    {ctaText}
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </div>
              )}
            </div>
          </a>
        ) : (
          <div className="relative h-[60vh] md:h-[70vh] overflow-hidden">
            <img
              src={banner.image_url}
              alt={banner.title}
              className="w-full h-full object-cover"
              loading="eager"
            />
            
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

            {/* CTA Button */}
            {showCTA && (
              <div className="absolute bottom-12 left-1/2 -translate-x-1/2 md:left-12 md:translate-x-0">
                <Button
                  size="lg"
                  onClick={onCTAClick}
                  className="bg-white text-gray-900 hover:bg-gray-100 shadow-2xl font-semibold px-8 py-6 text-lg"
                >
                  {ctaText}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // Carousel com múltiplos banners
  return (
    <div className={`full-width-hero relative w-screen -mx-[50vw] left-1/2 right-1/2 ${className}`}>
      <Carousel setApi={setApi} className="w-full">
        <CarouselContent>
          {banners.map((banner, index) => (
            <CarouselItem key={banner.id}>
              {banner.link_url ? (
                <a href={banner.link_url} target="_blank" rel="noopener noreferrer" className="block">
                  <div className="relative h-[60vh] md:h-[70vh] overflow-hidden">
                    <img
                      src={banner.image_url}
                      alt={banner.title}
                      className="w-full h-full object-cover"
                      loading={index === 0 ? 'eager' : 'lazy'}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                  </div>
                </a>
              ) : (
                <div className="relative h-[60vh] md:h-[70vh] overflow-hidden">
                  <img
                    src={banner.image_url}
                    alt={banner.title}
                    className="w-full h-full object-cover"
                    loading={index === 0 ? 'eager' : 'lazy'}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                </div>
              )}
            </CarouselItem>
          ))}
        </CarouselContent>

        {/* Navegação */}
        <CarouselPrevious className="left-4 bg-white/90 border-none hover:bg-white text-gray-900 w-12 h-12">
          <ChevronLeft className="h-6 w-6" />
        </CarouselPrevious>
        <CarouselNext className="right-4 bg-white/90 border-none hover:bg-white text-gray-900 w-12 h-12">
          <ChevronRight className="h-6 w-6" />
        </CarouselNext>

        {/* Indicadores */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
          {banners.map((_, index) => (
            <button
              key={index}
              className="w-3 h-3 rounded-full bg-white/60 hover:bg-white transition-colors"
              onClick={() => api?.scrollTo(index)}
            />
          ))}
        </div>

        {/* CTA Button */}
        {showCTA && (
          <div className="absolute bottom-12 left-1/2 -translate-x-1/2 md:left-12 md:translate-x-0">
            <Button
              size="lg"
              onClick={onCTAClick}
              className="bg-white text-gray-900 hover:bg-gray-100 shadow-2xl font-semibold px-8 py-6 text-lg"
            >
              {ctaText}
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        )}
      </Carousel>
    </div>
  );
};

export default FullWidthHeroBanner;

