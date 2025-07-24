
import React from "react";
import { Product } from "@/types/product";
import { CatalogType } from "@/hooks/useCatalog";
import { useStorePriceModel } from "@/hooks/useStorePriceModel";
import { useCart } from "@/hooks/useCart";
import { PriceModelType } from "@/types/price-models";

export interface CatalogSettingsData {
  colors?: {
    primary: string;
    secondary: string;
    surface: string;
    text: string;
  };
  global?: {
    borderRadius: number;
    fontSize: {
      small: string;
      medium: string;
      large: string;
    };
  };
  productCard?: {
    showQuickView: boolean;
    showAddToCart: boolean;
    productCardStyle: string;
  };
}

interface MinimalTemplateProps {
  product: Product;
  catalogType: CatalogType;
  onAddToCart: (product: Product) => void;
  onAddToWishlist: (product: Product) => void;
  onQuickView: (product: Product) => void;
  isInWishlist: boolean;
  showPrices: boolean;
  showStock: boolean;
  editorSettings?: CatalogSettingsData;
}

const MinimalTemplate: React.FC<MinimalTemplateProps> = ({
  product,
  catalogType,
  onAddToCart,
  onAddToWishlist,
  onQuickView,
  isInWishlist,
  showPrices,
  showStock,
  editorSettings = {},
}) => {
  const settings = {
    colors: {
      primary: "#000000",
      secondary: "#FFFFFF",
      surface: "#F9FAFB",
      text: "#111827",
      ...editorSettings.colors,
    },
    global: {
      borderRadius: 0,
      fontSize: {
        small: "12px",
        medium: "14px",
        large: "16px",
      },
      ...editorSettings.global,
    },
    productCard: {
      showQuickView: true,
      showAddToCart: true,
      productCardStyle: "minimal",
      ...editorSettings.productCard,
    },
  };

  const { addItem } = useCart();
  const { priceModel, loading } = useStorePriceModel(product.store_id);
  const modelKey = priceModel?.price_model || ("retail_only" as PriceModelType);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (loading) return;
    
    let qty = 1;
    let price = product.retail_price;
    let isWholesale = false;

    if (modelKey === "wholesale_only") {
      qty = product.min_wholesale_qty || 1;
      price = product.wholesale_price || product.retail_price;
      isWholesale = true;
    }

    addItem(
      {
        id: `${product.id}-default`,
        product: { 
          ...product, 
          price_model: modelKey,
          allow_negative_stock: product.allow_negative_stock ?? false
        },
        quantity: qty,
        price,
        originalPrice: price,
        catalogType,
        isWholesalePrice: isWholesale,
      },
      modelKey
    );
  };

  return (
    <div
      className="bg-white hover:bg-gray-50 transition-colors duration-200 overflow-hidden border-b border-gray-200"
      style={{
        borderRadius: `${settings.global.borderRadius}px`,
      }}
    >
      {/* Product Image */}
      <div className="relative aspect-square bg-gray-100">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <span>Sem imagem</span>
          </div>
        )}

        {/* Minimal overlay */}
        {settings.productCard.showQuickView && (
          <div className="absolute inset-0 bg-white bg-opacity-0 hover:bg-opacity-80 transition-all duration-200 flex items-center justify-center opacity-0 hover:opacity-100">
            <button
              onClick={() => onQuickView(product)}
              className="text-black text-xs uppercase tracking-wider underline hover:no-underline transition-all"
              style={{
                fontSize: settings.global.fontSize.small,
              }}
            >
              Ver detalhes
            </button>
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="p-4">
        {/* Product Name */}
        <h3
          className="font-light text-gray-900 mb-2 line-clamp-2"
          style={{
            color: settings.colors.text,
            fontSize: settings.global.fontSize.medium,
          }}
        >
          {product.name}
        </h3>

        {/* Price */}
        {showPrices && (
          <div className="mb-3">
            {loading ? (
              <div className="text-gray-500">Carregando preço...</div>
            ) : modelKey === "wholesale_only" ? (
              <>
                <span
                  className="font-light"
                  style={{
                    color: settings.colors.text,
                    fontSize: settings.global.fontSize.large,
                  }}
                >
                  R$ {product.wholesale_price?.toFixed(2)}
                </span>
                {product.min_wholesale_qty && (
                  <div
                    className="text-xs text-gray-500 mt-1"
                    style={{ fontSize: settings.global.fontSize.small }}
                  >
                    Mín. {product.min_wholesale_qty} unidades
                  </div>
                )}
              </>
            ) : (
              <span
                className="font-light"
                style={{
                  color: settings.colors.text,
                  fontSize: settings.global.fontSize.large,
                }}
              >
                R$ {product.retail_price?.toFixed(2)}
              </span>
            )}
          </div>
        )}

        {/* Stock */}
        {showStock && (
          <div
            className="text-xs text-gray-500 mb-3"
            style={{ fontSize: settings.global.fontSize.small }}
          >
            {product.stock > 0
              ? `${product.stock} disponíveis`
              : "Indisponível"}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 items-center">
          {settings.productCard.showAddToCart && (
            <button
              onClick={handleAddToCart}
              disabled={product.stock <= 0 || loading}
              className="text-xs uppercase tracking-wider underline hover:no-underline transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                color:
                  product.stock > 0 && !loading
                    ? settings.colors.text
                    : "#9CA3AF",
                fontSize: settings.global.fontSize.small,
              }}
            >
              {loading
                ? "Carregando..."
                : product.stock > 0
                ? "Adicionar"
                : "Indisponível"}
            </button>
          )}

          <button
            onClick={() => onAddToWishlist(product)}
            className="text-xs uppercase tracking-wider underline hover:no-underline transition-all"
            style={{
              fontSize: settings.global.fontSize.small,
            }}
          >
            <span
              className={`${
                isInWishlist ? "text-black" : "text-gray-400"
              }`}
            >
              ♥
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default MinimalTemplate;
