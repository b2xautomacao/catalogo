
import React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import EnhancedCustomerDataForm from '../EnhancedCustomerDataForm';
import EnhancedWhatsAppCheckout from '../EnhancedWhatsAppCheckout';
import { useCheckoutContext } from '../context/CheckoutProvider';
import { useCheckoutLogic } from '../hooks/useCheckoutLogic';

const CheckoutContent: React.FC = () => {
  const {
    customerData,
    setCustomerData,
    notes,
    setNotes,
    settings,
    cartItems,
    totalAmount,
    shippingCost,
    isCreatingOrder
  } = useCheckoutContext();

  const { handleCreateOrder } = useCheckoutLogic();

  return (
    <div className="lg:col-span-2 h-full">
      <ScrollArea className="h-full w-full">
        <div className="p-4 sm:p-6 space-y-6 pb-24 lg:pb-6">
          <EnhancedCustomerDataForm
            customerData={customerData}
            onDataChange={setCustomerData}
          />

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
        </div>
      </ScrollArea>
    </div>
  );
};

export default CheckoutContent;
