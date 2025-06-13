
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { OrderPaymentStatus } from '@/hooks/useOrderPayments';
import { 
  CreditCard, 
  DollarSign, 
  QrCode, 
  FileText 
} from 'lucide-react';

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

  const getPaymentMethodIcon = (method: string) => {
    const iconProps = { className: "h-3 w-3" };
    
    switch (method?.toLowerCase()) {
      case 'pix':
        return <QrCode {...iconProps} />;
      case 'card':
      case 'credit_card':
        return <CreditCard {...iconProps} />;
      case 'money':
      case 'cash':
        return <DollarSign {...iconProps} />;
      case 'bank_slip':
        return <FileText {...iconProps} />;
      default:
        return <DollarSign {...iconProps} />;
    }
  };

  const getPaymentMethodText = (method: string) => {
    const texts = {
      pix: 'PIX',
      card: 'Cartão',
      credit_card: 'Cartão',
      money: 'Dinheiro',
      cash: 'Dinheiro',
      bank_slip: 'Boleto'
    };
    return texts[method?.toLowerCase() as keyof typeof texts] || method;
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
        <div className="flex items-center gap-1 text-xs text-gray-500">
          {getPaymentMethodIcon(paymentStatus.lastPaymentMethod)}
          <span className="uppercase">
            {getPaymentMethodText(paymentStatus.lastPaymentMethod)}
          </span>
        </div>
      )}
    </div>
  );
};

export default PaymentStatusBadge;
