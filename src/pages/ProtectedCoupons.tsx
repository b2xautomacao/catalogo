
import React from 'react';
import { BenefitGate } from '@/components/billing/BenefitGate';
import AppLayout from '@/components/layout/AppLayout';
import { useCoupons } from '@/hooks/useCoupons';

const ProtectedCoupons = () => {
  const { coupons, loading, updateCoupon, deleteCoupon } = useCoupons();

  const breadcrumbs = [
    { href: '/', label: 'Dashboard' },
    { label: 'Cupons', current: true }
  ];

  const handleEdit = (couponId: string) => {
    // Logic for editing coupon
    console.log('Edit coupon:', couponId);
  };

  const handleDelete = async (couponId: string) => {
    const result = await deleteCoupon(couponId);
    if (result.error) {
      console.error('Erro ao deletar cupom:', result.error);
    }
  };

  const handleToggleStatus = async (couponId: string, isActive: boolean) => {
    const result = await updateCoupon(couponId, {
      is_active: !isActive
    });
    if (result.error) {
      console.error('Erro ao atualizar cupom:', result.error);
    }
  };

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
        <div className="space-y-6">
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Carregando cupons...</p>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg border p-6">
              <h3 className="text-lg font-medium mb-4">Seus Cupons</h3>
              {coupons && coupons.length > 0 ? (
                <div className="space-y-4">
                  {coupons.map((coupon) => (
                    <div key={coupon.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h4 className="font-medium">{coupon.code}</h4>
                        <p className="text-sm text-gray-600">
                          {coupon.discount_type === 'percentage' ? `${coupon.discount_value}%` : `R$ ${coupon.discount_value}`} de desconto
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEdit(coupon.id)}
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleToggleStatus(coupon.id, coupon.is_active)}
                          className={`text-sm ${coupon.is_active ? 'text-orange-600 hover:text-orange-800' : 'text-green-600 hover:text-green-800'}`}
                        >
                          {coupon.is_active ? 'Desativar' : 'Ativar'}
                        </button>
                        <button
                          onClick={() => handleDelete(coupon.id)}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          Excluir
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600 text-center py-8">
                  Nenhum cupom criado ainda. Crie seu primeiro cupom para oferecer descontos aos seus clientes.
                </p>
              )}
            </div>
          )}
        </div>
      </BenefitGate>
    </AppLayout>
  );
};

export default ProtectedCoupons;
