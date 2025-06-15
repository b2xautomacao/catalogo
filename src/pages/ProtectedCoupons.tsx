
import React from 'react';
import { BenefitGate } from '@/components/billing/BenefitGate';
import AppLayout from '@/components/layout/AppLayout';
import CouponsList from '@/components/coupons/CouponsList';

const ProtectedCoupons = () => {
  const breadcrumbs = [
    { href: '/', label: 'Dashboard' },
    { label: 'Cupons', current: true }
  ];

  return (
    <AppLayout 
      title="Cupons de Desconto"
      subtitle="Gerencie cupons promocionais para sua loja"
      breadcrumbs={breadcrumbs}
    >
      <BenefitGate 
        benefitKey="discount_coupons"
        customMessage="Os cupons de desconto estão disponíveis apenas no plano Premium. Faça upgrade para criar promoções personalizadas!"
      >
        <CouponsList />
      </BenefitGate>
    </AppLayout>
  );
};

export default ProtectedCoupons;
