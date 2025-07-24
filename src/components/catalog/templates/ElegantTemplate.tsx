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

interface ElegantTemplateProps {
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

const ElegantTemplate: React.FC<ElegantTemplateProps> = ({
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
      primary: "#0057FF",
      secondary: "#FF6F00",
      surface: "#FFFFFF",
      text: "#1E293B",
      ...editorSettings.colors,
    },
    global: {
      borderRadius: 8,
      fontSize: {
        small: "14px",
        medium: "16px",
        large: "20px",
      },
      ...editorSettings.global,
    },
    productCard: {
      showQuickView: true,
      showAddToCart: true,
      productCardStyle: "default",
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
          allow_negative_stock: product.allow_negative_stock || false
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
      className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden border"
      style={{
        borderRadius: `${settings.global.borderRadius}px`,
        borderColor: settings.colors.surface,
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

        {/* Quick actions overlay */}
        {settings.productCard.showQuickView && (
          <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-10 transition-all duration-200 flex items-center justify-center opacity-0 hover:opacity-100">
            <button
              onClick={() => onQuickView(product)}
              className="bg-white text-gray-900 px-4 py-2 rounded-full text-sm font-medium shadow-lg hover:bg-gray-50 transition-colors"
              style={{
                borderRadius: `${settings.global.borderRadius * 2}px`,
                fontSize: settings.global.fontSize.small,
              }}
            >
              Visualizar
            </button>
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="p-4">
        {/* Product Name */}
        <h3
          className="font-medium text-gray-900 mb-2 line-clamp-2"
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
                  className="text-lg font-bold"
                  style={{
                    color: settings.colors.primary,
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
                className="text-lg font-bold"
                style={{
                  color: settings.colors.primary,
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
              ? `${product.stock} em estoque`
              : "Fora de estoque"}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          {settings.productCard.showAddToCart && (
            <button
              onClick={handleAddToCart}
              disabled={product.stock <= 0 || loading}
              className="flex-1 px-4 py-2 text-white text-sm font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                backgroundColor:
                  product.stock > 0 && !loading
                    ? settings.colors.primary
                    : "#9CA3AF",
                borderRadius: `${settings.global.borderRadius}px`,
                fontSize: settings.global.fontSize.small,
              }}
            >
              {loading
                ? "Carregando..."
                : product.stock > 0
                ? "Adicionar"
                : "Sem estoque"}
            </button>
          )}

          <button
            onClick={() => onAddToWishlist(product)}
            className="p-2 border rounded-md hover:bg-gray-50 transition-colors"
            style={{
              borderColor: settings.colors.surface,
              borderRadius: `${settings.global.borderRadius}px`,
            }}
          >
            <span
              className={`text-lg ${
                isInWishlist ? "text-red-500" : "text-gray-400"
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

export default ElegantTemplate;
