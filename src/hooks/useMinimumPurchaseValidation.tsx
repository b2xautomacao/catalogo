import { useMemo } from "react";
import { useStorePriceModel } from "./useStorePriceModel";
import { useAuth } from "./useAuth";
import { useCart } from "./useCart";
import { useCurrentStoreId } from "@/contexts/CurrentStoreIdContext";

export interface MinimumPurchaseValidation {
  isEnabled: boolean;
  isWholesaleMode: boolean;
  minimumAmount: number;
  currentAmount: number;
  isMinimumMet: boolean;
  message: string;
  formattedMessage: string;
  canProceed: boolean;
}

/** @param storeIdOverride - Quando no catálogo público (sem login), passar storeId da loja (ex: items[0]?.product?.store_id) */
export const useMinimumPurchaseValidation = (storeIdOverride?: string): MinimumPurchaseValidation => {
  const { profile } = useAuth();
  const currentStoreId = useCurrentStoreId();
  const storeId = storeIdOverride ?? profile?.store_id ?? currentStoreId;
  const { priceModel } = useStorePriceModel(storeId);
  const { totalAmount, items } = useCart();

  return useMemo(() => {
    // Se não há modelo de preço ou não está habilitado, permitir prosseguir
    if (!priceModel || !priceModel.minimum_purchase_enabled) {
      return {
        isEnabled: false,
        isWholesaleMode: false,
        minimumAmount: 0,
        currentAmount: totalAmount,
        isMinimumMet: true,
        message: "",
        formattedMessage: "",
        canProceed: true,
      };
    }

    // Verificar se é modo de atacado
    const isWholesaleMode =
      priceModel.price_model === "wholesale_only" ||
      priceModel.price_model === "simple_wholesale" ||
      priceModel.price_model === "gradual_wholesale";

    // Se não é modo de atacado, não aplicar pedido mínimo
    if (!isWholesaleMode) {
      console.log("❌ Não é modo de atacado:", priceModel.price_model);
      return {
        isEnabled: false,
        isWholesaleMode: false,
        minimumAmount: 0,
        currentAmount: totalAmount,
        isMinimumMet: true,
        message: "",
        formattedMessage: "",
        canProceed: true,
      };
    }

    const minimumAmount = priceModel.minimum_purchase_amount || 0;
    const currentAmount = totalAmount;
    const isMinimumMet = currentAmount >= minimumAmount;

    // Formatar mensagem com o valor
    const formatCurrency = (value: number) => {
      return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
      }).format(value);
    };

    const message =
      priceModel.minimum_purchase_message ||
      "Pedido mínimo de R$ {amount} para finalizar a compra";

    const formattedMessage = message.replace(
      "{amount}",
      formatCurrency(minimumAmount)
    );

    return {
      isEnabled: true,
      isWholesaleMode,
      minimumAmount,
      currentAmount,
      isMinimumMet,
      message,
      formattedMessage,
      canProceed: isMinimumMet,
    };
  }, [priceModel, totalAmount, items]);
};
