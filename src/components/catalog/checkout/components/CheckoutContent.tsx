import React from "react";
import { useCheckoutContext } from "../context/CheckoutProvider";
import { useCheckoutLogic } from "../hooks/useCheckoutLogic";
import EnhancedCustomerDataForm from "../EnhancedCustomerDataForm";
import ShippingOptionsCard from "../ShippingOptionsCard";
import EnhancedWhatsAppCheckout from "../EnhancedWhatsAppCheckout";
import CheckoutTypeSelector from "./CheckoutTypeSelector";
import PaymentMethodSelector from "./PaymentMethodSelector";

interface CheckoutContentProps {
  onClose?: () => void;
}

const CheckoutContent: React.FC<CheckoutContentProps> = ({ onClose }) => {
  const {
    currentStep,
    checkoutType,
    cartItems,
    customerData,
    setCustomerData,
    totalAmount,
    shippingCost,
    shippingMethod,
    setShippingMethod,
    notes,
    createdOrder,
    settings,
    currentStore,
    canUseOnlinePayment,
    hasWhatsAppConfigured,
  } = useCheckoutContext();

  // Debug do total do carrinho
  console.log(" CheckoutContent - Debug:", {
    cartItemsCount: cartItems.length,
    totalAmount,
    shippingCost,
    finalTotal: totalAmount + shippingCost,
    cartItems: cartItems.map((item) => ({
      name: item.product?.name,
      price: item.price,
      quantity: item.quantity,
      subtotal: item.price * item.quantity,
      catalogType: item.catalogType,
      isWholesalePrice: item.isWholesalePrice,
      originalPrice: item.originalPrice,
    })),
  });

  const {
    handleCreateOrder,
    handleShippingCalculated,
    handleShippingMethodChange,
    isMobile,
  } = useCheckoutLogic();

  console.log(" CheckoutContent: Renderizando", {
    currentStep,
    checkoutType,
    isMobile,
    canUseOnlinePayment,
    hasWhatsAppConfigured,
  });

  // Função wrapper para incluir onClose
  const handleOrderCreation = () => {
    handleCreateOrder(onClose);
  };

  // Para checkout público, sempre mostrar o formulário principal
  if (currentStep === "payment" && createdOrder) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h3 className="text-lg font-semibold mb-4">Pedido Criado!</h3>
          <p className="text-gray-600 mb-4">
            Seu pedido foi criado com sucesso. Você será redirecionado para
            continuar.
          </p>
          <button
            onClick={onClose}
            className="bg-primary text-white px-6 py-2 rounded-lg"
          >
            Fechar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Layout principal */}
      <div className="flex-1 p-6 space-y-6 overflow-y-auto">
        {/* Seletor de tipo de checkout (se aplicável) */}
        <CheckoutTypeSelector />

        <EnhancedCustomerDataForm
          customerData={customerData}
          onDataChange={setCustomerData}
        />

        <ShippingOptionsCard
          shippingMethods={[
            {
              id: "pickup",
              name: "Retirar na Loja",
              type: "pickup",
              is_active: true,
              price: 0,
              estimated_days: undefined,
              config: {
                instructions: "Retire seu pedido diretamente na loja",
                pickup_address: "Endereço da loja",
                delivery_zones: [],
              },
            },
            {
              id: "delivery",
              name: "Entrega a Combinar",
              type: "delivery",
              is_active: true,
              price: 0,
              estimated_days: undefined,
              config: {
                instructions: "Entrega a combinar via WhatsApp",
                pickup_address: "",
                delivery_zones: [],
              },
            },
          ]}
          selectedShippingMethodId={shippingMethod}
          onSelectShippingMethod={setShippingMethod}
          onUpdateShippingAddress={() => {}}
          currentShippingAddress=""
        />

        {/* Seletor de método de pagamento (se checkout online) */}
        {checkoutType === "online_payment" && <PaymentMethodSelector />}

        {/* Checkout WhatsApp ou botão de finalização */}
        {checkoutType === "whatsapp_only" && (
          <EnhancedWhatsAppCheckout
            whatsappNumber={
              currentStore?.phone || settings?.whatsapp_number || "00000000000"
            }
            onConfirmOrder={handleOrderCreation}
            isProcessing={false}
            customerData={customerData}
            items={cartItems}
            totalAmount={totalAmount}
            shippingCost={shippingCost}
            notes={notes}
          />
        )}

        {/* Botão de finalização para pagamento online */}
        {checkoutType === "online_payment" && (
          <div className="bg-white border rounded-lg p-6">
            <button
              onClick={handleOrderCreation}
              className="w-full bg-primary text-white py-3 rounded-lg font-semibold hover:bg-primary/90 transition-colors"
            >
              Finalizar Pedido - R${" "}
              {(totalAmount + shippingCost).toFixed(2).replace(".", ",")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CheckoutContent;
