
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

interface IndustrialTemplateProps {
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

const IndustrialTemplate: React.FC<IndustrialTemplateProps> = ({
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
      borderRadius: 4,
      fontSize: {
        small: "12px",
        medium: "14px",
        large: "18px",
      },
      ...editorSettings.global,
    },
    productCard: {
      showQuickView: true,
      showAddToCart: true,
      productCardStyle: "industrial",
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
      className="bg-gray-900 border border-gray-700 hover:border-gray-600 transition-all duration-200 overflow-hidden"
      style={{
        borderRadius: `${settings.global.borderRadius}px`,
      }}
    >
      {/* Product Image */}
      <div className="relative aspect-square bg-gray-800">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-500">
            <span>Sem imagem</span>
          </div>
        )}

        {/* Industrial overlay */}
        {settings.productCard.showQuickView && (
          <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center opacity-0 hover:opacity-100">
            <button
              onClick={() => onQuickView(product)}
              className="bg-orange-500 text-white px-3 py-1 text-xs font-bold uppercase tracking-wide hover:bg-orange-600 transition-colors"
              style={{
                borderRadius: `${settings.global.borderRadius}px`,
                fontSize: settings.global.fontSize.small,
              }}
            >
              VISUALIZAR
            </button>
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="p-3 bg-gray-900">
        {/* Product Name */}
        <h3
          className="font-bold text-white mb-2 line-clamp-2 uppercase tracking-wide"
          style={{
            fontSize: settings.global.fontSize.medium,
          }}
        >
          {product.name}
        </h3>

        {/* Price */}
        {showPrices && (
          <div className="mb-3">
            {loading ? (
              <div className="text-gray-400">Carregando preço...</div>
            ) : modelKey === "wholesale_only" ? (
              <>
                <span
                  className="text-orange-400 font-bold"
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
                    MÍN. {product.min_wholesale_qty} UNIDADES
                  </div>
                )}
              </>
            ) : (
              <span
                className="text-orange-400 font-bold"
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
            className="text-xs text-gray-400 mb-3 uppercase tracking-wide"
            style={{ fontSize: settings.global.fontSize.small }}
          >
            {product.stock > 0
              ? `${product.stock} EM ESTOQUE`
              : "FORA DE ESTOQUE"}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          {settings.productCard.showAddToCart && (
            <button
              onClick={handleAddToCart}
              disabled={product.stock <= 0 || loading}
              className="flex-1 px-3 py-2 text-white text-xs font-bold uppercase tracking-wide transition-colors disabled:opacity-50 disabled:cursor-not-allowed border"
              style={{
                backgroundColor:
                  product.stock > 0 && !loading
                    ? settings.colors.secondary
                    : "#4B5563",
                borderColor: settings.colors.secondary,
                borderRadius: `${settings.global.borderRadius}px`,
                fontSize: settings.global.fontSize.small,
              }}
            >
              {loading
                ? "CARREGANDO..."
                : product.stock > 0
                ? "ADICIONAR"
                : "SEM ESTOQUE"}
            </button>
          )}

          <button
            onClick={() => onAddToWishlist(product)}
            className="p-2 border border-gray-600 hover:border-orange-500 transition-colors"
            style={{
              borderRadius: `${settings.global.borderRadius}px`,
            }}
          >
            <span
              className={`text-sm ${
                isInWishlist ? "text-orange-500" : "text-gray-400"
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

export default IndustrialTemplate;
