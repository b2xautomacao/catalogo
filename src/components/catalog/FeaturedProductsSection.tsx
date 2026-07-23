import React, { useEffect, useMemo, useState } from "react";
import { Product } from "@/types/product";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ArrowRight, Star, Package } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";
import ProductCardImageGallery from "./ProductCardImageGallery";
import { useProductDisplayPrice } from "@/hooks/useProductDisplayPrice";

// Busca apenas a imagem principal do produto (sem os controles de galeria,
// que assumem um container quadrado — inadequado para o banner full-width do hero).
const usePrimaryProductImage = (productId: string) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const fetchImage = async () => {
      try {
        const { supabase } = await import("@/integrations/supabase/client");
        const { data } = await supabase
          .from("product_images")
          .select("image_url")
          .eq("product_id", productId)
          .order("is_primary", { ascending: false })
          .order("image_order", { ascending: true })
          .limit(1);

        if (!cancelled) {
          setImageUrl(data?.[0]?.image_url ?? null);
        }
      } catch (error) {
        console.error("Erro ao carregar imagem do destaque:", error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    if (productId) fetchImage();

    return () => {
      cancelled = true;
    };
  }, [productId]);

  return { imageUrl, loading };
};

const MAX_FEATURED_PRODUCTS = 12;

interface FeaturedProductsSectionProps {
  products: Product[];
  enabled?: boolean;
  style?: "hero" | "carousel";
  /** Necessário para resolver o preço correto em lojas de atacado/híbridas — sem isso, o preço exibido cai no `retail_price` bruto, que fica zerado em catálogos wholesale_only. */
  catalogType?: "retail" | "wholesale";
  onProductSelect: (product: Product) => void;
  className?: string;
}

/** Preço do destaque, resolvido pelo mesmo hook usado no resto do catálogo (ProductPriceDisplay, ProductCardOptimized) — respeita varejo/atacado/híbrido em vez de sempre ler `retail_price`. */
const FeaturedPriceLabel: React.FC<{
  product: Product;
  catalogType?: "retail" | "wholesale";
  className?: string;
}> = ({ product, catalogType, className }) => {
  const { displayPrice } = useProductDisplayPrice({ product, catalogType });
  return <span className={className}>{formatCurrency(displayPrice)}</span>;
};

const FeaturedProductsSection: React.FC<FeaturedProductsSectionProps> = ({
  products,
  enabled = true,
  style = "carousel",
  catalogType,
  onProductSelect,
  className = "",
}) => {
  const featuredProducts = useMemo(() => {
    return [...products]
      .filter((p) => p.is_featured && p.is_active !== false)
      .sort((a, b) => {
        const dateA = a.updated_at ? new Date(a.updated_at).getTime() : 0;
        const dateB = b.updated_at ? new Date(b.updated_at).getTime() : 0;
        return dateB - dateA;
      })
      .slice(0, MAX_FEATURED_PRODUCTS);
  }, [products]);

  if (!enabled || featuredProducts.length === 0) {
    return null;
  }

  if (style === "hero") {
    return (
      <FeaturedHero
        products={featuredProducts}
        catalogType={catalogType}
        onProductSelect={onProductSelect}
        className={className}
      />
    );
  }

  return (
    <FeaturedCarousel
      products={featuredProducts}
      catalogType={catalogType}
      onProductSelect={onProductSelect}
      className={className}
    />
  );
};

// ---------------------------------------------------------------------------
// Estilo Hero: banner full-width com rotação automática entre os destaques
// ---------------------------------------------------------------------------

const FeaturedHero: React.FC<{
  products: Product[];
  catalogType?: "retail" | "wholesale";
  onProductSelect: (product: Product) => void;
  className?: string;
}> = ({ products, catalogType, onProductSelect, className = "" }) => {
  const [api, setApi] = useState<CarouselApi>();

  useEffect(() => {
    if (!api || products.length <= 1) return;

    const interval = setInterval(() => {
      if (api.canScrollNext()) {
        api.scrollNext();
      } else {
        api.scrollTo(0);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [api, products.length]);

  return (
    <div
      className={`featured-products-hero relative w-screen -mx-[50vw] left-1/2 right-1/2 ${className}`}
    >
      <Carousel setApi={setApi} className="w-full">
        <CarouselContent>
          {products.map((product, index) => (
            <CarouselItem key={product.id}>
              <div
                className="relative h-[60vh] md:h-[70vh] overflow-hidden cursor-pointer group"
                onClick={() => onProductSelect(product)}
              >
                <FeaturedHeroImage productId={product.id} productName={product.name} />

                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent pointer-events-none" />

                <div className="absolute bottom-10 left-6 right-6 md:left-12 md:right-auto md:max-w-lg text-white">
                  <span className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide bg-white/15 backdrop-blur-sm px-3 py-1 rounded-full mb-3">
                    <Star className="h-3 w-3" fill="currentColor" />
                    Destaque
                  </span>
                  <h2 className="text-2xl md:text-4xl font-bold mb-2 line-clamp-2">
                    {product.name}
                  </h2>
                  <p className="text-xl md:text-2xl font-semibold mb-5">
                    <FeaturedPriceLabel product={product} catalogType={catalogType} />
                  </p>
                  <Button
                    size="lg"
                    onClick={(e) => {
                      e.stopPropagation();
                      onProductSelect(product);
                    }}
                    className="bg-white text-gray-900 hover:bg-gray-100 shadow-2xl font-semibold px-6"
                  >
                    Ver produto
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </div>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>

        {products.length > 1 && (
          <>
            <CarouselPrevious className="left-4 bg-white/90 border-none hover:bg-white text-gray-900 w-12 h-12" />
            <CarouselNext className="right-4 bg-white/90 border-none hover:bg-white text-gray-900 w-12 h-12" />

            <div className="absolute bottom-6 right-6 flex gap-2">
              {products.map((_, index) => (
                <button
                  key={index}
                  onClick={() => api?.scrollTo(index)}
                  className="w-2.5 h-2.5 rounded-full bg-white/60 hover:bg-white transition-colors"
                  aria-label={`Ir para destaque ${index + 1}`}
                />
              ))}
            </div>
          </>
        )}
      </Carousel>
    </div>
  );
};

const FeaturedHeroImage: React.FC<{ productId: string; productName: string }> = ({
  productId,
  productName,
}) => {
  const { imageUrl, loading } = usePrimaryProductImage(productId);

  if (loading || !imageUrl) {
    return (
      <div className="absolute inset-0 bg-gradient-to-br from-muted to-muted/60 flex items-center justify-center">
        <Package className="h-12 w-12 text-muted-foreground" />
      </div>
    );
  }

  return (
    <img
      src={imageUrl}
      alt={productName}
      className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
      loading="eager"
    />
  );
};

// ---------------------------------------------------------------------------
// Estilo Carrossel: cards de produto lado a lado
// ---------------------------------------------------------------------------

const FeaturedCarousel: React.FC<{
  products: Product[];
  catalogType?: "retail" | "wholesale";
  onProductSelect: (product: Product) => void;
  className?: string;
}> = ({ products, catalogType, onProductSelect, className = "" }) => {
  return (
    <div className={`featured-products-carousel ${className}`}>
      <div className="flex items-center gap-2 mb-4">
        <Star className="h-5 w-5 text-yellow-500" fill="currentColor" />
        <h2 className="text-xl font-bold text-foreground">Produtos em Destaque</h2>
      </div>

      <Carousel opts={{ align: "start" }} className="w-full">
        <CarouselContent>
          {products.map((product) => (
            <CarouselItem
              key={product.id}
              className="basis-[65%] sm:basis-1/2 md:basis-1/3 lg:basis-1/4 xl:basis-1/5"
            >
              <div
                className="rounded-xl border border-border/50 bg-white overflow-hidden cursor-pointer hover:shadow-lg transition-shadow duration-200 group h-full"
                onClick={() => onProductSelect(product)}
              >
                <ProductCardImageGallery
                  productId={product.id}
                  productName={product.name}
                  maxImages={1}
                />
                <div className="p-3 space-y-1">
                  <h3 className="font-medium text-sm line-clamp-2 text-foreground">
                    {product.name}
                  </h3>
                  <p className="font-bold text-sm text-foreground">
                    <FeaturedPriceLabel product={product} catalogType={catalogType} />
                  </p>
                </div>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>

        {products.length > 1 && (
          <>
            <CarouselPrevious className="-left-4 hidden md:flex" />
            <CarouselNext className="-right-4 hidden md:flex" />
          </>
        )}
      </Carousel>
    </div>
  );
};

export default FeaturedProductsSection;
