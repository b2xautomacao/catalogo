
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { OrderPaymentStatus } from '@/hooks/useOrderPayments';

interface PaymentStatusBadgeProps {
  paymentStatus: OrderPaymentStatus | null;
  fallbackStatus?: 'pending' | 'processing' | 'paid' | 'cancelled';
}

const PaymentStatusBadge: React.FC<PaymentStatusBadgeProps> = ({ 
  paymentStatus, 
  fallbackStatus = 'pending' 
}) => {
  const getPaymentStatusColor = (status: string) => {
    const colors = {
      pending: 'bg-red-50 text-red-700 border-red-200',
      partial: 'bg-yellow-50 text-yellow-700 border-yellow-200',
      paid: 'bg-green-50 text-green-700 border-green-200',
      overpaid: 'bg-blue-50 text-blue-700 border-blue-200',
      cancelled: 'bg-gray-50 text-gray-700 border-gray-200'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-50 text-gray-700 border-gray-200';
  };

  const getPaymentStatusText = (status: string) => {
    const texts = {
      pending: 'Não Pago',
      partial: 'Pago Parcial',
      paid: 'Pago',
      overpaid: 'Pago a Mais',
      cancelled: 'Cancelado'
    };
    return texts[status as keyof typeof texts] || status;
  };

  const status = paymentStatus?.status || fallbackStatus;
  const statusText = getPaymentStatusText(status);
  const statusColor = getPaymentStatusColor(status);

  return (
    <div className="flex flex-col gap-1">
      <Badge className={statusColor} variant="outline">
        {statusText}
      </Badge>
      {paymentStatus?.lastPaymentMethod && (
        <span className="text-xs text-gray-500 uppercase">
          {paymentStatus.lastPaymentMethod}
        </span>
      )}
    </div>
  );
};

export default PaymentStatusBadge;
