import { useMemo } from "react";
import { useStorePriceModel } from "./useStorePriceModel";
import { useAuth } from "./useAuth";
import { useCart } from "./useCart";

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

export const useMinimumPurchaseValidation = (): MinimumPurchaseValidation => {
  const { profile } = useAuth();
  const { priceModel } = useStorePriceModel(profile?.store_id);
  const { totalAmount, items } = useCart();

  console.log("🔍 useMinimumPurchaseValidation - Inputs:", {
    profile: profile?.store_id,
    priceModel: priceModel ? "existe" : "null",
    totalAmount,
    itemsCount: items.length,
  });

  return useMemo(() => {
    console.log("🔍 useMinimumPurchaseValidation - Debug:", {
      priceModel,
      totalAmount,
      items: items.length,
      minimum_purchase_enabled: priceModel?.minimum_purchase_enabled,
      minimum_purchase_amount: priceModel?.minimum_purchase_amount,
      price_model: priceModel?.price_model,
    });

    // Debug específico para identificar o problema
    console.log("🔍 useMinimumPurchaseValidation - Validação específica:", {
      hasPriceModel: !!priceModel,
      isEnabled: priceModel?.minimum_purchase_enabled,
      isWholesaleMode:
        priceModel?.price_model === "wholesale_only" ||
        priceModel?.price_model === "simple_wholesale" ||
        priceModel?.price_model === "gradual_wholesale",
      minimumAmount: priceModel?.minimum_purchase_amount || 0,
      currentAmount: totalAmount,
      isMinimumMet: totalAmount >= (priceModel?.minimum_purchase_amount || 0),
    });

    // Se não há modelo de preço ou não está habilitado, permitir prosseguir
    if (!priceModel || !priceModel.minimum_purchase_enabled) {
      console.log("❌ Pedido mínimo não habilitado ou sem priceModel");
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

    console.log("✅ Validação de pedido mínimo:", {
      minimumAmount,
      currentAmount,
      isMinimumMet,
      canProceed: isMinimumMet,
    });

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
