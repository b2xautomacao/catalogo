
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

interface ModernTemplateProps {
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

const ModernTemplate: React.FC<ModernTemplateProps> = ({
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
      borderRadius: 12,
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
      productCardStyle: "modern",
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
      className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden border border-gray-100 hover:border-gray-200"
      style={{
        borderRadius: `${settings.global.borderRadius}px`,
      }}
    >
      {/* Product Image */}
      <div className="relative aspect-square bg-gradient-to-br from-gray-50 to-gray-100">
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

        {/* Modern gradient overlay */}
        {settings.productCard.showQuickView && (
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-4">
            <button
              onClick={() => onQuickView(product)}
              className="bg-white/90 backdrop-blur-sm text-gray-900 px-4 py-2 rounded-full text-sm font-medium hover:bg-white transition-colors"
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
      <div className="p-5">
        {/* Product Name */}
        <h3
          className="font-semibold text-gray-900 mb-3 line-clamp-2 leading-snug"
          style={{
            color: settings.colors.text,
            fontSize: settings.global.fontSize.medium,
          }}
        >
          {product.name}
        </h3>

        {/* Price */}
        {showPrices && (
          <div className="mb-4">
            {loading ? (
              <div className="text-gray-500">Carregando preço...</div>
            ) : modelKey === "wholesale_only" ? (
              <>
                <span
                  className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"
                  style={{
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
                className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"
                style={{
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
            className="text-sm text-gray-500 mb-4 flex items-center gap-2"
            style={{ fontSize: settings.global.fontSize.small }}
          >
            <div
              className={`w-2 h-2 rounded-full ${
                product.stock > 0 ? "bg-green-400" : "bg-red-400"
              }`}
            />
            {product.stock > 0
              ? `${product.stock} em estoque`
              : "Fora de estoque"}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          {settings.productCard.showAddToCart && (
            <button
              onClick={handleAddToCart}
              disabled={product.stock <= 0 || loading}
              className="flex-1 px-4 py-3 text-white text-sm font-semibold rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98]"
              style={{
                background:
                  product.stock > 0 && !loading
                    ? `linear-gradient(135deg, ${settings.colors.primary}, ${settings.colors.secondary})`
                    : "#9CA3AF",
                borderRadius: `${settings.global.borderRadius - 2}px`,
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
            className="p-3 rounded-lg border-2 border-gray-200 hover:border-red-300 hover:bg-red-50 transition-all duration-200"
            style={{
              borderRadius: `${settings.global.borderRadius - 2}px`,
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

export default ModernTemplate;
