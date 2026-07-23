import React, { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useBanners } from "@/hooks/useBanners";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel";

export type HeroVariant = "split";

export interface SplitHeroBannerProps {
  /** Só existe uma variante hoje; preparado para futuras (ex: 'banner', 'carousel', 'video'). */
  variant?: HeroVariant;
  storeId: string;
  /** Texto pequeno acima do título — não vem do banco, é definido por quem chama. */
  eyebrowText?: string;
  ctaLabel?: string;
  onCtaClick?: () => void;
  buttonShape?: "flat" | "modern" | "rounded";
  className?: string;
}

const SplitHeroBanner: React.FC<SplitHeroBannerProps> = ({
  storeId,
  eyebrowText = "Novidades",
  ctaLabel = "Ver coleção",
  onCtaClick,
  buttonShape = "modern",
  className = "",
}) => {
  const { banners, loading } = useBanners(storeId, "hero");
  const [api, setApi] = useState<CarouselApi>();
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (!api) return;

    setActiveIndex(api.selectedScrollSnap());
    api.on("select", () => setActiveIndex(api.selectedScrollSnap()));
  }, [api]);

  useEffect(() => {
    if (!api || banners.length <= 1) return;

    const interval = setInterval(() => {
      if (api.canScrollNext()) {
        api.scrollNext();
      } else {
        api.scrollTo(0);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [api, banners.length]);

  if (loading || banners.length === 0) {
    return null;
  }

  const renderSlide = (banner: (typeof banners)[number]) => (
    <div className="grid md:grid-cols-2 items-center gap-8 md:gap-12 min-h-[420px] md:min-h-[520px] py-10 md:py-0">
      <div className="order-2 md:order-1">
        {eyebrowText && (
          <span className="inline-block text-xs font-semibold uppercase tracking-wider text-accent bg-accent/10 px-3 py-1 rounded-full mb-4">
            {eyebrowText}
          </span>
        )}
        <h1 className="text-4xl md:text-6xl font-bold text-foreground leading-tight mb-4 text-balance">
          {banner.title}
        </h1>
        {banner.description && (
          <p className="text-base md:text-lg text-muted-foreground mb-8 max-w-md text-pretty">
            {banner.description}
          </p>
        )}
        {banner.link_url ? (
          <Button asChild size="lg" shape={buttonShape}>
            <a href={banner.link_url}>
              {ctaLabel}
              <ArrowRight className="ml-2 h-4 w-4" />
            </a>
          </Button>
        ) : (
          <Button size="lg" shape={buttonShape} onClick={onCtaClick}>
            {ctaLabel}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>

      <div className="order-1 md:order-2">
        <div className="relative aspect-[4/3] md:aspect-square rounded-xl overflow-hidden bg-surface">
          <img
            src={banner.image_url}
            alt={banner.title}
            className="w-full h-full object-cover"
            loading="eager"
          />
        </div>
      </div>
    </div>
  );

  return (
    <section className={`bg-surface ${className}`}>
      <div className="container mx-auto px-4">
        {banners.length === 1 ? (
          renderSlide(banners[0])
        ) : (
          <div className="relative">
            <Carousel setApi={setApi} className="w-full">
              <CarouselContent>
                {banners.map((banner) => (
                  <CarouselItem key={banner.id}>{renderSlide(banner)}</CarouselItem>
                ))}
              </CarouselContent>
            </Carousel>

            <div className="flex items-center gap-1.5 pb-6 md:pb-0 md:absolute md:bottom-8 md:left-0">
              {banners.map((_, index) => (
                <button
                  key={index}
                  onClick={() => api?.scrollTo(index)}
                  className={`h-1.5 rounded-full transition-all ${
                    index === activeIndex ? "w-6 bg-primary" : "w-1.5 bg-muted-foreground/30"
                  }`}
                  aria-label={`Ir para o destaque ${index + 1}`}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default SplitHeroBanner;
