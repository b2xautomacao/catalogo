
import React from 'react';
import { useCheckoutContext } from '../context/CheckoutProvider';
import { useCheckoutLogic } from '../hooks/useCheckoutLogic';
import CheckoutConfiguration from './CheckoutConfiguration';
import EnhancedCustomerDataForm from '../EnhancedCustomerDataForm';
import ShippingOptionsCard from '../ShippingOptionsCard';
import EnhancedWhatsAppCheckout from '../EnhancedWhatsAppCheckout';
import OrderSummary from '../OrderSummary';
import MercadoPagoPayment from '../MercadoPagoPayment';
import PixPaymentModal from '../PixPaymentModal';

interface CheckoutContentProps {
  onClose?: () => void;
}

const CheckoutContent: React.FC<CheckoutContentProps> = ({ onClose }) => {
  const {
    currentStep,
    checkoutType,
    cartItems,
    customerData,
    totalAmount,
    shippingCost,
    notes,
    createdOrder,
    pixData,
    showPixModal,
    setShowPixModal,
    toast
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

  if (currentStep === 'config') {
    return <CheckoutConfiguration />;
  }

  if (currentStep === 'payment' && createdOrder) {
    return (
      <div className="p-6">
        <MercadoPagoPayment
          order={createdOrder}
          onSuccess={() => {
            toast({
              title: "Pagamento processado!",
              description: "Seu pedido foi confirmado com sucesso.",
            });
            onClose?.();
          }}
        />
        
        {showPixModal && pixData && (
          <PixPaymentModal
            isOpen={showPixModal}
            onClose={() => setShowPixModal(false)}
            pixData={pixData}
            orderId={createdOrder.id}
          />
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row h-full">
      <div className="flex-1 p-6 space-y-6 overflow-y-auto">
        <EnhancedCustomerDataForm />
        
        <ShippingOptionsCard 
          onShippingCalculated={handleShippingCalculated}
          onShippingMethodChange={handleShippingMethodChange}
        />
        
        {checkoutType === 'whatsapp_only' && (
          <EnhancedWhatsAppCheckout
            whatsappNumber="00000000000"
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
        <OrderSummary />
      </div>
    </div>
  );
};

export default CheckoutContent;
