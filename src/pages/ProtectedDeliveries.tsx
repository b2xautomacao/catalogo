
import React from 'react';
import { BenefitGate } from '@/components/billing/BenefitGate';
import AppLayout from '@/components/layout/AppLayout';
import { ShippingCalculatorCard } from '@/components/shipping/ShippingCalculatorCard';
import { ShippingZonesCard } from '@/components/shipping/ShippingZonesCard';

const ProtectedDeliveries = () => {
  const breadcrumbs = [
    { href: '/', label: 'Dashboard' },
    { label: 'Entrega', current: true }
  ];

  return (
    <AppLayout 
      title="Gestão de Entregas"
      subtitle="Configure opções de frete e entrega"
      breadcrumbs={breadcrumbs}
    >
      <BenefitGate 
        benefitKey="shipping_calculator"
        customMessage="A calculadora de frete está disponível apenas no plano Premium. Automatize o cálculo de frete para seus clientes!"
      >
        <div className="space-y-6">
          <ShippingCalculatorCard />
          <ShippingZonesCard />
        </div>
      </BenefitGate>
    </AppLayout>
  );
};

export default ProtectedDeliveries;
