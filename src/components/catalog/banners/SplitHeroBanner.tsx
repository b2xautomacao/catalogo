import React, { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useBanners } from "@/hooks/useBanners";
import { cn } from "@/lib/utils";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel";

export type HeroVariant = "split";

export interface SplitHeroBannerProps {
  variant?: HeroVariant;
  storeId: string;
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
  const [wideArtwork, setWideArtwork] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!api) return;
    const handleSelect = () => setActiveIndex(api.selectedScrollSnap());
    handleSelect();
    api.on("select", handleSelect);
    return () => {
      api.off("select", handleSelect);
    };
  }, [api]);

  useEffect(() => {
    if (!api || banners.length <= 1 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const interval = window.setInterval(() => {
      if (api.canScrollNext()) api.scrollNext();
      else api.scrollTo(0);
    }, 5000);
    return () => window.clearInterval(interval);
  }, [api, banners.length]);

  if (loading || banners.length === 0) return null;

  const renderSlide = (banner: (typeof banners)[number], index: number) => {
    const artworkStatus = wideArtwork[banner.id];
    const isArtwork = artworkStatus === true;
    const isPending = artworkStatus === undefined;

    return (
      <div
        className={cn(
          "relative w-full min-w-0 max-w-full overflow-hidden rounded-xl border border-border/70 bg-background md:rounded-2xl",
          isArtwork || isPending
            ? "aspect-[2.25/1] md:aspect-[16/7]"
            : "grid min-h-[380px] items-center gap-8 px-6 py-10 md:grid-cols-[0.82fr_1.18fr] md:px-12 md:py-12"
        )}
      >
        {!isArtwork && !isPending && (
          <div className="order-2 flex flex-col items-start md:order-1">
            {eyebrowText && (
              <span className="mb-4 inline-flex rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                {eyebrowText}
              </span>
            )}
            <h1 className="mb-4 max-w-xl text-balance text-4xl font-semibold leading-[1.05] tracking-[-0.035em] text-foreground md:text-6xl">
              {banner.title}
            </h1>
            {banner.description && (
              <p className="mb-8 max-w-md text-pretty text-base text-muted-foreground md:text-lg">
                {banner.description}
              </p>
            )}
            {banner.link_url ? (
              <Button asChild size="lg" shape={buttonShape}>
                <a href={banner.link_url}>
                  {ctaLabel}
                  <ArrowRight data-icon="inline-end" />
                </a>
              </Button>
            ) : (
              <Button size="lg" shape={buttonShape} onClick={onCtaClick}>
                {ctaLabel}
                <ArrowRight data-icon="inline-end" />
              </Button>
            )}
          </div>
        )}

        <div className={cn("order-1 min-w-0 md:order-2", (isArtwork || isPending) && "absolute inset-0")}>
          <div className={cn("relative size-full min-w-0 overflow-hidden bg-muted/20", !isArtwork && !isPending && "aspect-[4/3] rounded-xl")}>
            <img
              src={banner.image_url}
              alt={banner.title}
              className="block size-full max-w-full object-contain"
              loading={index === 0 ? "eager" : "lazy"}
              fetchPriority={index === 0 ? "high" : "auto"}
              onLoad={(event) => {
                const image = event.currentTarget;
                const isWide = image.naturalWidth / image.naturalHeight >= 1.9;
                setWideArtwork((current) =>
                  current[banner.id] === isWide ? current : { ...current, [banner.id]: isWide }
                );
              }}
            />
          </div>
        </div>
      </div>
    );
  };

  return (
    <section className={cn("w-full max-w-full overflow-x-hidden bg-background", className)}>
      <div className="container mx-auto min-w-0 max-w-full px-3 sm:px-4">
        {banners.length === 1 ? (
          renderSlide(banners[0], 0)
        ) : (
          <div className="relative">
            <Carousel setApi={setApi} className="w-full">
              <CarouselContent>
                {banners.map((banner, index) => (
                  <CarouselItem key={banner.id}>{renderSlide(banner, index)}</CarouselItem>
                ))}
              </CarouselContent>
            </Carousel>
            <div className="mt-4 flex items-center justify-center gap-1.5">
              {banners.map((_, index) => (
                <button
                  key={index}
                  onClick={() => api?.scrollTo(index)}
                  className={cn(
                    "flex size-11 items-center justify-center rounded-full",
                    "after:h-1.5 after:rounded-full after:transition-all",
                    index === activeIndex ? "after:w-6 after:bg-primary" : "after:w-1.5 after:bg-muted-foreground/30"
                  )}
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
