
import React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import EnhancedCustomerDataForm from '../EnhancedCustomerDataForm';
import EnhancedWhatsAppCheckout from '../EnhancedWhatsAppCheckout';
import CheckoutTypeSelector from '../CheckoutTypeSelector';
import ShippingMethodCard from '../ShippingMethodCard';
import ShippingAddressForm from '../ShippingAddressForm';
import ShippingOptionsCard from '../ShippingOptionsCard';
import PaymentMethodCard from '../PaymentMethodCard';
import TestEnvironmentInfo from '../TestEnvironmentInfo';
import { useCheckoutContext } from '../context/CheckoutProvider';
import { useCheckoutLogic } from '../hooks/useCheckoutLogic';

const CheckoutContent: React.FC = () => {
  const {
    customerData,
    setCustomerData,
    checkoutType,
    setCheckoutType,
    shippingMethod,
    setShippingMethod,
    paymentMethod,
    setPaymentMethod,
    shippingAddress,
    setShippingAddress,
    notes,
    setNotes,
    isWhatsappOnly,
    settings,
    checkoutOptions,
    availablePaymentMethods,
    availableShippingMethods,
    shippingOptions,
    isTestEnvironment,
    cartItems,
    totalAmount,
    shippingCost,
    isCreatingOrder
  } = useCheckoutContext();

  const {
    handleCreateOrder,
    handleShippingCalculated,
    handleShippingMethodChange
  } = useCheckoutLogic();

  return (
    <div className="lg:col-span-2 h-full">
      <ScrollArea className="h-full w-full">
        <div className="p-4 sm:p-6 space-y-6 pb-24 lg:pb-6">
          {/* Alerta de ambiente de teste */}
          {isTestEnvironment && checkoutType === 'online_payment' && (
            <TestEnvironmentInfo />
          )}

          <EnhancedCustomerDataForm
            customerData={customerData}
            onDataChange={setCustomerData}
          />

          {/* WHATSAPP checkout BASICO */}
          {isWhatsappOnly && (
            <EnhancedWhatsAppCheckout
              whatsappNumber={settings?.phone || ''}
              onConfirmOrder={handleCreateOrder}
              isProcessing={isCreatingOrder}
              customerData={customerData}
              items={cartItems}
              totalAmount={totalAmount}
              shippingCost={shippingCost}
              notes={notes}
            />
          )}

          {/* PREMIUM: online payment+entregas */}
          {!isWhatsappOnly && (
            <>
              <CheckoutTypeSelector
                options={checkoutOptions}
                selectedType={checkoutType}
                onTypeChange={(type) => setCheckoutType(type as 'whatsapp_only' | 'online_payment')}
                isPremiumRequired={false}
                onUpgradeClick={() => {}}
              />

              {checkoutType === 'online_payment' && (
                <>
                  {/* Métodos de entrega só premium */}
                  {shippingOptions.length === 0 ? (
                    <ShippingMethodCard
                      shippingMethods={availableShippingMethods}
                      selectedMethod={shippingMethod}
                      onMethodChange={setShippingMethod}
                    />
                  ) : (
                    <ShippingOptionsCard
                      options={shippingOptions}
                      selectedOption={shippingMethod}
                      onOptionChange={handleShippingMethodChange}
                      freeDeliveryAmount={settings?.shipping_options?.free_delivery_amount}
                      cartTotal={totalAmount}
                    />
                  )}

                  {(shippingMethod === 'shipping' || shippingMethod === 'delivery') && (
                    <ShippingAddressForm
                      address={shippingAddress}
                      onAddressChange={setShippingAddress}
                      onCalculateShipping={() => {}}
                      onShippingCalculated={handleShippingCalculated}
                      storeSettings={settings}
                    />
                  )}

                  {availablePaymentMethods.length > 0 && (
                    <PaymentMethodCard
                      paymentMethods={availablePaymentMethods}
                      selectedMethod={paymentMethod}
                      onMethodChange={setPaymentMethod}
                    />
                  )}

                  <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-gray-50">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-lg">Observações</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Textarea
                        placeholder="Observações sobre o pedido (opcional)"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        rows={3}
                      />
                    </CardContent>
                  </Card>
                </>
              )}
            </>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default CheckoutContent;
