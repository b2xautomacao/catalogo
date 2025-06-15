
import React from 'react';
import { useCheckoutContext } from '../context/CheckoutProvider';
import { useCheckoutLogic } from '../hooks/useCheckoutLogic';
import EnhancedCustomerDataForm from '../EnhancedCustomerDataForm';
import ShippingOptionsCard from '../ShippingOptionsCard';
import EnhancedWhatsAppCheckout from '../EnhancedWhatsAppCheckout';
import OrderSummary from '../OrderSummary';

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
    toast,
    settings,
    currentStore
  } = useCheckoutContext();

  const {
    handleCreateOrder,
    handleShippingCalculated,
    handleShippingMethodChange,
    isMobile
  } = useCheckoutLogic();

  console.log('🖥️ CheckoutContent: Renderizando', { currentStep, checkoutType, isMobile });

  // Função wrapper para incluir onClose
  const handleOrderCreation = () => {
    handleCreateOrder(onClose);
  };

  // Para checkout público, sempre mostrar o formulário principal
  if (currentStep === 'payment' && createdOrder) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h3 className="text-lg font-semibold mb-4">Pedido Criado!</h3>
          <p className="text-gray-600 mb-4">
            Seu pedido foi criado com sucesso. Você será redirecionado para o WhatsApp para finalizar.
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

  const finalTotal = totalAmount + shippingCost;

  return (
    <div className="flex flex-col lg:flex-row h-full">
      <div className="flex-1 p-6 space-y-6 overflow-y-auto">
        <EnhancedCustomerDataForm 
          customerData={customerData}
          onDataChange={setCustomerData}
        />
        
        <ShippingOptionsCard 
          options={[
            {
              id: 'pickup',
              name: 'Retirar na loja',
              price: 0,
              deliveryTime: 'Imediato',
              carrier: 'Retirada'
            }
          ]}
          selectedOption={shippingMethod}
          onOptionChange={setShippingMethod}
          freeDeliveryAmount={settings?.shipping_options?.free_delivery_amount || 0}
          cartTotal={totalAmount}
        />
        
        {checkoutType === 'whatsapp_only' && (
          <EnhancedWhatsAppCheckout
            whatsappNumber={currentStore?.phone || settings?.whatsapp_number || "00000000000"}
            onConfirmOrder={handleOrderCreation}
            isProcessing={false}
            customerData={customerData}
            items={cartItems}
            totalAmount={totalAmount}
            shippingCost={shippingCost}
            notes={notes}
          />
        )}
      </div>

      <div className="w-full lg:w-80 bg-gray-50 border-l border-gray-200 p-6 overflow-y-auto">
        <OrderSummary 
          items={cartItems}
          totalAmount={totalAmount}
          shippingCost={shippingCost}
          finalTotal={finalTotal}
          isProcessing={false}
          isDisabled={!customerData.name || !customerData.phone}
          onSubmit={handleOrderCreation}
        />
      </div>
    </div>
  );
};

export default CheckoutContent;
