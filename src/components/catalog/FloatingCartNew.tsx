
import React, { useEffect } from "react";
import {
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  X,
  TrendingUp,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useCart } from "@/hooks/useCart";
import CartItemThumbnail from "./checkout/CartItemThumbnail";
import CartItemPriceDisplay from "./CartItemPriceDisplay";

interface FloatingCartProps {
  onCheckout?: () => void;
  storeId?: string;
}

// Função utilitária para formatar valores monetários com segurança
const formatCurrency = (value: number | undefined | null): string => {
  if (typeof value !== "number" || isNaN(value)) {
    return "R$ 0,00";
  }
  return `R$ ${value.toFixed(2).replace(".", ",")}`;
};

// Função utilitária para calcular valores com segurança
const safeCalculate = (
  a: number | undefined | null,
  b: number | undefined | null
): number => {
  const numA = typeof a === "number" && !isNaN(a) ? a : 0;
  const numB = typeof b === "number" && !isNaN(b) ? b : 0;
  return numA * numB;
};

const FloatingCart: React.FC<FloatingCartProps> = ({ onCheckout, storeId }) => {
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

  useEffect(() => {
    // Aplicar cores do template
    if (typeof document !== "undefined") {
      const style = document.createElement("style");
      style.textContent = `
        .floating-cart-button {
          background: linear-gradient(135deg, var(--template-primary, #0057FF), var(--template-accent, #8E2DE2));
          transition: all 0.3s ease;
        }
        
        .floating-cart-button:hover {
          background: linear-gradient(135deg, var(--template-secondary, #FF6F00), var(--template-accent, #8E2DE2));
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
        
        .cart-item-card {
          background: var(--template-surface, #FFFFFF);
          border: 1px solid var(--template-border, #E2E8F0);
        }
        
        .cart-item-card:hover {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }
        
        .cart-price-text {
          color: var(--template-primary, #0057FF);
        }

        /* Modal personalizado */
        .cart-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
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
          max-height: 100vh;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          z-index: 9999;
          animation: slideIn 0.3s ease-out;
        }

        @keyframes slideIn {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(0);
          }
        }
      `;
      document.head.appendChild(style);

      return () => {
        document.head.removeChild(style);
      };
    }
  }, []);

  const handleCheckout = () => {
    closeCart();
    if (onCheckout) {
      onCheckout();
    }
  };

  // Sempre mostrar o botão, mesmo com carrinho vazio
  console.log("🛒 FloatingCartNew: Renderizando - totalItems:", totalItems);

  return (
    <>
      {/* Botão flutuante */}
      <div className="fixed bottom-20 right-6 z-50">
        <Button
          size="lg"
          className="floating-cart-button relative h-16 w-16 rounded-full shadow-2xl hover:shadow-xl flex items-center justify-center p-0"
          onClick={toggleCart}
        >
          <ShoppingCart className="h-6 w-6 text-white" />
          {totalItems > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-2 -right-2 h-8 w-8 rounded-full p-0 flex items-center justify-center bg-red-500 text-white font-bold text-sm animate-pulse"
            >
              {totalItems > 99 ? "99+" : totalItems}
            </Badge>
          )}
        </Button>
      </div>

      {/* Modal do carrinho */}
      {isOpen && (
        <div className="cart-modal-overlay" onClick={closeCart}>
          <div
            className="cart-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Botão fechar com contraste */}
            <Button
              className="absolute top-3 right-3 bg-red-600 hover:bg-red-700 text-white rounded-full p-2 shadow z-20"
              onClick={closeCart}
            >
              <X className="w-5 h-5" />
            </Button>

            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="cart-header-gradient px-6 py-4">
                <h2 className="text-xl font-bold text-white text-center">
                  🛒 Carrinho de Compras
                </h2>
              </div>

              {/* Indicadores de Economia */}
              {canGetWholesalePrice && potentialSavings > 0 && (
                <div className="px-6 py-3 bg-gradient-to-r from-orange-50 to-yellow-50 border-b">
                  <div className="flex items-center gap-2 text-orange-700">
                    <TrendingUp size={16} />
                    <span className="font-semibold text-sm">
                      Oportunidade de Economia!
                    </span>
                  </div>
                  <p className="text-xs text-orange-600 mt-1">
                    Adicione +{itemsToWholesale} itens e economize{" "}
                    {formatCurrency(potentialSavings)}
                  </p>
                </div>
              )}

              {/* Lista de itens */}
              <div className="flex-1 overflow-y-auto p-6">
                {items.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <ShoppingCart size={64} className="text-gray-300 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-600 mb-2">
                      Carrinho vazio
                    </h3>
                    <p className="text-gray-500">
                      Adicione produtos ao seu carrinho para continuar
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {items.map((item) => {
                      // Validações de segurança para cada item
                      const itemPrice =
                        typeof item.price === "number" && !isNaN(item.price)
                          ? item.price
                          : 0;
                      const itemQuantity =
                        typeof item.quantity === "number" &&
                        !isNaN(item.quantity)
                          ? item.quantity
                          : 1;
                      const itemOriginalPrice =
                        typeof item.originalPrice === "number" &&
                        !isNaN(item.originalPrice)
                          ? item.originalPrice
                          : itemPrice;
                      const itemTotal = safeCalculate(itemPrice, itemQuantity);

                      return (
                        <div
                          key={item.id}
                          className="cart-item-card rounded-xl shadow-sm p-4 hover:shadow-md transition-all relative flex flex-col sm:flex-row gap-3"
                        >
                          {/* Badge tipo de compra no canto superior esquerdo */}
                          <span
                            className={`absolute top-2 left-2 px-2 py-1 rounded text-xs font-bold z-10
                            ${
                              item.isWholesalePrice
                                ? "bg-green-100 text-green-800 border border-green-300"
                                : "bg-blue-100 text-blue-800 border border-blue-300"
                            }`}
                          >
                            {item.isWholesalePrice ? "Atacado" : "Varejo"}
                          </span>

                          <CartItemThumbnail
                            imageUrl={item.product?.image_url}
                            productName={item.product?.name || "Produto"}
                            size="md"
                          />

                          <div className="flex-1 min-w-0 flex flex-col justify-between">
                            <div>
                              <h4 className="font-semibold text-gray-900 truncate">
                                {item.product?.name || "Produto sem nome"}
                              </h4>
                              <div className="flex items-center gap-2 mt-1 flex-wrap">
                                {item.variation && (
                                  <span className="text-xs text-gray-500">
                                    {item.variation.size} {item.variation.color}
                                  </span>
                                )}
                              </div>

                              {/* Indicador de Economia Individual */}
                              {item.product?.wholesale_price &&
                                item.product?.min_wholesale_qty &&
                                itemQuantity <
                                  item.product.min_wholesale_qty && (
                                  <div className="mt-2 p-2 bg-orange-50 rounded border border-orange-200">
                                    <div className="flex items-center gap-1 text-xs text-orange-700">
                                      <AlertCircle size={12} />
                                      <span>
                                        Faltam{" "}
                                        {item.product.min_wholesale_qty -
                                          itemQuantity}{" "}
                                        para atacado
                                      </span>
                                    </div>
                                    <p className="text-xs text-orange-600">
                                      Economize{" "}
                                      {formatCurrency(
                                        safeCalculate(
                                          itemOriginalPrice -
                                            (item.product.wholesale_price || 0),
                                          item.product.min_wholesale_qty
                                        )
                                      )}
                                    </p>
                                  </div>
                                )}
                            </div>

                            <div className="flex items-end justify-between mt-3 gap-2">
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    updateQuantity(item.id, itemQuantity - 1)
                                  }
                                  className="h-8 w-8 p-0 rounded-full hover:bg-red-50 hover:border-red-300"
                                >
                                  <Minus size={12} />
                                </Button>

                                <Input
                                  type="number"
                                  min="1"
                                  value={itemQuantity}
                                  onChange={(e) => {
                                    const newQuantity =
                                      parseInt(e.target.value) || 1;
                                    updateQuantity(item.id, newQuantity);
                                  }}
                                  className="w-16 h-8 text-center text-sm font-semibold"
                                />

                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    updateQuantity(item.id, itemQuantity + 1)
                                  }
                                  className="h-8 w-8 p-0 rounded-full hover:bg-green-50 hover:border-green-300"
                                >
                                  <Plus size={12} />
                                </Button>
                              </div>

                              {/* Botão excluir no canto inferior esquerdo */}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeItem(item.id)}
                                className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0 rounded-full absolute bottom-2 left-2 z-10"
                              >
                                <Trash2 size={14} />
                              </Button>

                              <div className="text-right ml-auto">
                                <CartItemPriceDisplay item={item} />
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Footer com total e botões */}
              {items.length > 0 && (
                <div className="border-t bg-gradient-to-r from-gray-50 to-gray-100 p-6 space-y-4">
                  {/* Resumo de Economia */}
                  {potentialSavings > 0 && (
                    <div className="p-3 bg-orange-100 rounded-lg border border-orange-200">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-orange-800">
                          💡 Economia potencial:
                        </span>
                        <span className="font-bold text-orange-800">
                          {formatCurrency(potentialSavings)}
                        </span>
                      </div>
                      <p className="text-xs text-orange-700 mt-1">
                        Adicione mais {itemsToWholesale} itens para ativar
                        preços de atacado
                      </p>
                    </div>
                  )}

                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold">Total:</span>
                    <span className="cart-price-text text-2xl font-bold">
                      {formatCurrency(totalAmount)}
                    </span>
                  </div>

                  <Button
                    onClick={handleCheckout}
                    className="cart-checkout-button w-full text-white font-bold py-4 text-lg rounded-xl shadow-lg transition-all"
                    size="lg"
                  >
                    <ShoppingCart className="h-5 w-5 mr-2" />
                    Finalizar Pedido
                  </Button>
                  {/* Botão Continuar Comprando */}
                  <Button
                    onClick={closeCart}
                    className="w-full bg-gray-100 text-gray-800 font-semibold py-4 text-lg rounded-xl border border-gray-300 hover:bg-gray-200 transition-all"
                    size="lg"
                    variant="outline"
                  >
                    Continuar Comprando
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default FloatingCart;
