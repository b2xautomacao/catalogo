import React from "react";
import { cva } from "class-variance-authority";
import { ShoppingBag, Heart, Menu, MessageCircle, Truck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Store } from "@/hooks/useCatalog";
import { CatalogSettingsData } from "@/hooks/useCatalogSettings";
import { Product } from "@/types/product";
import SmartSearch from "../SmartSearch";

export type HeaderVariant = "default";

export interface StorefrontHeaderCategory {
  id: string;
  name: string;
  slug?: string;
}

export interface StorefrontHeaderProps {
  /** Só existe uma variante hoje; preparado para futuras (ex: 'compact', 'centered-logo'). */
  variant?: HeaderVariant;
  store: Store;
  sellerName?: string;
  cartItemsCount: number;
  wishlistCount: number;
  products?: Product[];
  onSearch: (query: string) => void;
  onProductSelect?: (product: Product) => void;
  onCartClick: () => void;
  onToggleFilters: () => void;
  whatsappNumber?: string;
  /** Opcional — a barra de navegação só aparece quando categorias são passadas. */
  categories?: StorefrontHeaderCategory[];
  onCategorySelect?: (categoryId: string) => void;
  storeSettings?: CatalogSettingsData | null;
}

const headerVariants = cva("sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border", {
  variants: {
    variant: {
      default: "",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

const StorefrontHeader: React.FC<StorefrontHeaderProps> = ({
  variant = "default",
  store,
  sellerName,
  cartItemsCount,
  wishlistCount,
  products = [],
  onSearch,
  onProductSelect,
  onCartClick,
  onToggleFilters,
  whatsappNumber,
  categories,
  onCategorySelect,
  storeSettings,
}) => {
  const freeShippingText = storeSettings?.header_badge_free_shipping
    ? storeSettings.header_badge_free_shipping_text ||
      (storeSettings.header_free_shipping_threshold
        ? `Frete grátis nas compras acima de R$ ${storeSettings.header_free_shipping_threshold.toFixed(2)}`
        : "Frete grátis")
    : null;

  const showUtilityBar = Boolean(freeShippingText || whatsappNumber);

  return (
    <header className={headerVariants({ variant })}>
      {showUtilityBar && (
        <div className="bg-foreground text-background text-xs">
          <div className="container mx-auto px-4 py-1.5 flex items-center justify-between gap-4">
            {freeShippingText ? (
              <span className="flex items-center gap-1.5">
                <Truck className="h-3.5 w-3.5" />
                {freeShippingText}
              </span>
            ) : (
              <span />
            )}
            {whatsappNumber && (
              <a
                href={`https://wa.me/${whatsappNumber.replace(/\D/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 hover:opacity-80 transition-opacity"
              >
                <MessageCircle className="h-3.5 w-3.5" />
                Atendimento via WhatsApp
              </a>
            )}
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center gap-4 md:gap-6">
          <div className="flex items-center gap-3 flex-shrink-0">
            {store.logo_url ? (
              <img
                src={store.logo_url}
                alt={store.name}
                className="w-9 h-9 rounded-full object-cover"
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold">
                {store.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="hidden sm:block">
              <span className="font-semibold text-foreground text-base leading-none">{store.name}</span>
              {sellerName && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  Atendimento: <span className="font-medium text-foreground">{sellerName}</span>
                </p>
              )}
            </div>
          </div>

          <div className="flex-1 max-w-xl mx-auto">
            <SmartSearch
              products={products}
              onSearch={onSearch}
              onProductSelect={onProductSelect}
              placeholder="Buscar produtos..."
            />
          </div>

          <div className="flex items-center gap-1 flex-shrink-0">
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleFilters}
              className="md:hidden"
              aria-label="Abrir filtros"
            >
              <Menu className="h-5 w-5" />
            </Button>

            {wishlistCount > 0 && (
              <button
                className="relative p-2 hover:bg-muted rounded-lg transition-colors hidden sm:flex"
                aria-label="Favoritos"
              >
                <Heart className="h-5 w-5 text-foreground/70" />
                <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs">
                  {wishlistCount}
                </Badge>
              </button>
            )}

            <button
              onClick={onCartClick}
              className="relative p-2 hover:bg-muted rounded-lg transition-colors"
              aria-label="Carrinho"
            >
              <ShoppingBag className="h-5 w-5 text-foreground/70" />
              {cartItemsCount > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs">
                  {cartItemsCount}
                </Badge>
              )}
            </button>
          </div>
        </div>
      </div>

      {categories && categories.length > 0 && (
        <div className="border-t border-border">
          <div className="container mx-auto px-4">
            <nav className="flex items-center gap-6 overflow-x-auto py-2.5 text-sm">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => onCategorySelect?.(category.id)}
                  className="text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap"
                >
                  {category.name}
                </button>
              ))}
            </nav>
          </div>
        </div>
      )}
    </header>
  );
};

export default StorefrontHeader;
