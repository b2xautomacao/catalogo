// FloatingCart.tsx
import React, { useEffect } from "react";
import { ShoppingCart, Trash2, Plus, Minus, X, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useCart } from "@/hooks/useCart";
import { useCartPriceCalculation } from "@/hooks/useCartPriceCalculation";
import CartItemThumbnail from "./checkout/CartItemThumbnail";
import CartItemPriceDisplay from "./CartItemPriceDisplay";
import TierProgressIndicator from "./TierProgressIndicator";
import { useStorePriceModel } from "@/hooks/useStorePriceModel";

const formatCurrency = (value: number | undefined | null): string => {
  if (typeof value !== "number" || isNaN(value)) return "R$ 0,00";
  return `R$ ${value.toFixed(2).replace(".", ",")}`;
};

// Componente separado para cada item do carrinho
const CartItem: React.FC<{
  item: any;
  onUpdateQuantity: (
    id: string,
    quantity: number,
    modelKey?: string,
    minQty?: number
  ) => void;
  onRemoveItem: (id: string) => void;
}> = ({ item, onUpdateQuantity, onRemoveItem }) => {
  const quantity = item.quantity || 1;
  const stock = item.variation && typeof item.variation.stock === "number"
    ? item.variation.stock
    : item.product?.stock ?? 0;
  const allowNegative = item.product?.allow_negative_stock ?? false;

  const { priceModel } = useStorePriceModel(item.product?.store_id);
  const modelKey = item.product?.price_model || priceModel?.price_model || "retail_only";
  const minQty = modelKey === "wholesale_only" ? item.product?.min_wholesale_qty || 1 : 1;

  // Validação de estoque
  const estoqueDisponivel = allowNegative ? Infinity : stock;
  const podeAdicionar = allowNegative || quantity < stock;
  const podeRemover = quantity > minQty;
  const erroEstoque = !allowNegative && quantity >= stock;

  // Badge baseado no modelo de preço
  const getBadgeInfo = () => {
    switch (modelKey) {
      case "wholesale_only":
        return {
          text: "Atacado",
          className: "bg-orange-100 text-orange-800 border-orange-300"
        };
      case "simple_wholesale":
        const isWholesale = quantity >= (item.product?.min_wholesale_qty || 1);
        return {
          text: isWholesale ? "Atacado" : "Varejo",
          className: isWholesale 
            ? "bg-green-100 text-green-800 border-green-300"
            : "bg-blue-100 text-blue-800 border-blue-300"
        };
      case "gradual_wholesale":
        return {
          text: item.currentTier?.tier_name || "Varejo",
          className: item.currentTier?.tier_name === "Atacado Grande"
            ? "bg-yellow-100 text-yellow-800 border-yellow-400"
            : "bg-green-100 text-green-800 border-green-300"
        };
      default:
        return {
          text: "Varejo",
          className: "bg-blue-100 text-blue-800 border-blue-300"
        };
    }
  };

  const badgeInfo = getBadgeInfo();

  const handleCompleteTier = () => {
    if (modelKey === "simple_wholesale" && item.product?.min_wholesale_qty) {
      const needed = item.product.min_wholesale_qty - quantity;
      if (needed > 0) {
        onUpdateQuantity(item.id, quantity + needed);
      }
    } else if (item.nextTier && item.nextTierQuantityNeeded > 0) {
      onUpdateQuantity(item.id, quantity + item.nextTierQuantityNeeded);
    }
  };

  const getIncentiveMessage = () => {
    if (modelKey === "simple_wholesale" && item.product?.min_wholesale_qty) {
      const needed = item.product.min_wholesale_qty - quantity;
      if (needed > 0) {
        return {
          text: `Adicione mais ${needed} unidade(s) para ativar preço de atacado!`,
          buttonText: "Ativar Atacado",
          showSavings: true,
          savings: item.product.wholesale_price ? 
            (item.product.retail_price - item.product.wholesale_price) * item.product.min_wholesale_qty : 0
        };
      }
    } else if (modelKey === "gradual_wholesale" && item.nextTierQuantityNeeded > 0) {
      return {
        text: `Adicione mais ${item.nextTierQuantityNeeded} unidade(s) para próximo nível!`,
        buttonText: `Ativar ${item.nextTier?.tier_name || "Próximo Nível"}`,
        showSavings: true,
        savings: item.nextTierPotentialSavings || 0
      };
    }
    return null;
  };

  const incentive = getIncentiveMessage();

  return (
    <div className={`cart-item-card rounded-xl p-4 border-2 ${
      badgeInfo.text === "Atacado Grande" ? "border-yellow-400" : "border-gray-200"
    } bg-white flex flex-col gap-2`}>
      <div className="flex flex-row gap-4 items-start">
        {/* Imagem */}
        <div className="w-20 h-20 flex-shrink-0 flex items-center justify-center">
          <CartItemThumbnail
            imageUrl={item.product?.image_url}
            productName={item.product?.name || "Produto"}
            size="lg"
          />
        </div>
        
        {/* Infos principais */}
        <div className="flex-1 min-w-0 flex flex-col gap-1">
          <div className="flex flex-row gap-4 items-start flex-wrap">
            <div className="flex flex-col min-w-0">
              <h4 className="text-base font-semibold text-gray-900 truncate">
                {item.product?.name || "Produto sem nome"}
              </h4>
              
              {/* Badges de Grade e Atacado Gradativo */}
              <div className="flex flex-wrap items-center gap-1 mt-1">
                {item.gradeInfo && (
                  <Badge className="bg-blue-600 text-white text-xs px-1.5 py-0.5">
                    Grade: {item.gradeInfo.name}
                  </Badge>
                )}
                {modelKey === "gradual_wholesale" && (
                  <Badge className="bg-yellow-500 text-white text-xs px-1.5 py-0.5" title="Descontos progressivos por quantidade">
                    Atacado Progressivo
                  </Badge>
                )}
              </div>
              
              {/* Tamanhos e pares por tamanho */}
              {item.gradeInfo && (
                <div className="flex flex-wrap items-center gap-1 mt-0.5">
                  {item.gradeInfo.sizes && item.gradeInfo.sizes.length > 0 && (
                    <span className="text-[10px] text-blue-900 font-semibold">
                      Tamanhos: {item.gradeInfo.sizes.join(", ")}
                    </span>
                  )}
                  {item.gradeInfo.pairs && item.gradeInfo.pairs.length > 0 && (
                    <span className="text-[10px] text-gray-700 font-normal">
                      Pares: {item.gradeInfo.pairs.join(", ")}
                    </span>
                  )}
                </div>
              )}
              
              {item.variation && (
                <p className="text-xs text-gray-500 truncate">
                  {item.variation.size} {item.variation.color}
                </p>
              )}
            </div>
            
            {/* Bloco de preço/desconto/economia */}
            <div className="flex flex-col gap-1 min-w-[120px] items-end text-right">
              <CartItemPriceDisplay item={item} />
            </div>
          </div>
        </div>
      </div>
      
      {/* Rodapé: botões, badge e incentivo individual */}
      <div className="flex flex-row items-center justify-between mt-3 gap-2 flex-wrap border-t pt-2">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onUpdateQuantity(item.id, quantity - 1, modelKey, minQty)}
            className="h-8 w-8 p-0 rounded-full"
            disabled={!podeRemover}
          >
            <Minus size={12} />
          </Button>
          <Input
            type="number"
            min={minQty}
            max={estoqueDisponivel}
            value={quantity}
            onChange={(e) => {
              let val = parseInt(e.target.value) || minQty;
              if (!allowNegative && val > stock) val = stock;
              if (val < minQty) val = minQty;
              onUpdateQuantity(item.id, val, modelKey, minQty);
            }}
            className="w-16 h-8 text-center text-sm font-semibold"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => onUpdateQuantity(item.id, quantity + 1, modelKey, minQty)}
            className="h-8 w-8 p-0 rounded-full"
            disabled={!podeAdicionar}
          >
            <Plus size={12} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onRemoveItem(item.id)}
            className="text-red-500 hover:text-red-700 h-8 w-8 p-0 rounded-full"
            title="Remover"
          >
            <Trash2 size={14} />
          </Button>
        </div>
        
        {/* Badge no rodapé */}
        <span className={`px-3 py-1 rounded-lg text-xs font-bold border ${badgeInfo.className}`}>
          {badgeInfo.text}
        </span>
      </div>
      
      {/* Incentivo individual para próximo nível */}
      {incentive && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 mt-2 bg-blue-50 border border-blue-200 rounded-lg px-2 py-2 sm:px-3 text-[11px] sm:text-xs text-blue-800 overflow-x-auto">
          <div className="flex items-center gap-1 flex-wrap">
            <TrendingUp size={13} className="flex-shrink-0" />
            {incentive.text}
            {incentive.showSavings && incentive.savings > 0 && (
              <span className="ml-1 text-green-700 font-bold">
                Economize R$ {incentive.savings.toFixed(2)} no total!
              </span>
            )}
          </div>
          <Button
            size="sm"
            variant="outline"
            className="w-full sm:w-auto px-2 py-1 h-6 text-[11px] sm:text-xs border-blue-400 text-blue-700 hover:bg-blue-100 mt-1 sm:mt-0"
            onClick={handleCompleteTier}
          >
            {incentive.buttonText}
          </Button>
        </div>
      )}
      
      {/* Mensagem de erro de estoque */}
      {erroEstoque && (
        <div className="text-xs text-red-600 mt-1">
          Estoque insuficiente para essa quantidade.
        </div>
      )}
    </div>
  );
};

const FloatingCart: React.FC<{ onCheckout?: () => void; storeId?: string }> = ({
  onCheckout,
}) => {
  const {
    items,
    totalItems,
    totalAmount,
    removeItem,
    updateQuantity,
    isOpen,
    toggleCart,
    closeCart,
    potentialSavings,
    canGetWholesalePrice,
    itemsToWholesale,
  } = useCart();

  // Debug dos valores do carrinho
  useEffect(() => {
    console.log("🛒 Debug FloatingCart:", {
      itemsCount: items.length,
      totalItems,
      totalAmount,
      isOpen,
      items: items.map((item) => ({
        id: item.id,
        name: item.product?.name,
        quantity: item.quantity,
        price: item.price,
      })),
    });
  }, [items, totalItems, totalAmount, isOpen]);

  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = `
      .floating-cart-button {
        background: linear-gradient(135deg, var(--template-primary, #0057FF), var(--template-accent, #8E2DE2)) !important;
        transition: all 0.3s ease;
        color: white !important;
      }
      .floating-cart-button:hover {
        background: linear-gradient(135deg, var(--template-secondary, #FF6F00), var(--template-accent, #8E2DE2)) !important;
        transform: scale(1.05);
      }
      .cart-header-gradient {
        background: linear-gradient(135deg, var(--template-primary, #0057FF), var(--template-accent, #8E2DE2));
      }
      .cart-checkout-button {
        background: linear-gradient(135deg, var(--template-primary, #0057FF), var(--template-accent, #8E2DE2));
      }
      .cart-checkout-button:hover {
        background: linear-gradient(135deg, var(--template-secondary, #FF6F00), var(--template-accent, #8E2DE2));
        transform: scale(1.05);
      }
      .cart-modal-overlay {
        position: fixed;
        top: 0; left: 0; right: 0; bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        z-index: 9998;
        display: flex;
        align-items: center;
        justify-content: flex-end;
      }
      .cart-modal-content {
        background: white;
        width: 100%;
        max-width: 480px;
        height: 100vh;
        overflow: hidden;
        display: flex;
        flex-direction: column;
        z-index: 9999;
        animation: slideIn 0.3s ease-out;
      }
      @keyframes slideIn {
        from { transform: translateX(100%); }
        to { transform: translateX(0); }
      }
    `;
    document.head.appendChild(style);
    return () => {
      if (document.head.contains(style)) {
        document.head.removeChild(style);
      }
    };
  }, []);

  console.log("🛒 FloatingCart: Renderizando - totalItems:", totalItems);

  // Só renderiza se houver itens no carrinho
  if (totalItems === 0) return null;

  return (
    <>
      <div className="fixed bottom-20 right-6 z-50">
        <Button
          size="lg"
          className="floating-cart-button relative h-16 w-16 rounded-full shadow-2xl flex items-center justify-center bg-blue-600 hover:bg-blue-700"
          onClick={toggleCart}
        >
          <p className=" text-white text-2xl">🛒</p>
          {totalItems > 0 && (
            <Badge className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center p-0 min-w-6">
              {totalItems > 99 ? "99+" : totalItems}
            </Badge>
          )}
        </Button>
      </div>

      {isOpen && (
        <div className="cart-modal-overlay" onClick={closeCart}>
          <div
            className="cart-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <Button
              className="absolute top-3 right-3 bg-red-600 hover:bg-red-700 text-white rounded-full p-2 z-10"
              onClick={closeCart}
            >
              <X className="w-5 h-5" />
            </Button>

            <div className="flex flex-col h-full">
              <div className="cart-header-gradient px-6 py-4">
                <h2 className="text-xl font-bold text-white text-center">
                  🛒 Carrinho de Compras ({totalItems}{" "}
                  {totalItems === 1 ? "item" : "itens"})
                </h2>
              </div>

              {/* Mensagem quando carrinho está vazio */}
              {items.length === 0 ? (
                <div className="flex-1 flex items-center justify-center p-8">
                  <div className="text-center">
                    <ShoppingCart className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-700 mb-2">
                      Seu carrinho está vazio
                    </h3>
                    <p className="text-gray-500 mb-6">
                      Adicione produtos para começar suas compras!
                    </p>
                    <Button
                      onClick={closeCart}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg"
                    >
                      Continuar Comprando
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {items.map((item) => (
                      <CartItem
                        key={item.id}
                        item={item}
                        onUpdateQuantity={updateQuantity}
                        onRemoveItem={removeItem}
                      />
                    ))}
                  </div>

                  <div className="border-t bg-gray-50 p-6 space-y-4">
                    {/* Removido: <TierProgressIndicator /> e economia potencial geral */}
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-semibold">Total:</span>
                      <span className="text-2xl font-bold text-blue-600">
                        {formatCurrency(totalAmount)}
                      </span>
                    </div>
                    <Button
                      onClick={() => {
                        closeCart();
                        onCheckout?.();
                      }}
                      className="cart-checkout-button w-full text-white font-bold py-4 text-lg rounded-xl shadow-lg"
                    >
                      <ShoppingCart className="h-5 w-5 mr-2" /> Finalizar Pedido
                    </Button>
                    <Button
                      onClick={closeCart}
                      className="w-full bg-white border border-gray-300 text-gray-800 font-semibold py-4 text-lg rounded-xl hover:bg-gray-100"
                    >
                      Continuar Comprando
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default FloatingCart;
