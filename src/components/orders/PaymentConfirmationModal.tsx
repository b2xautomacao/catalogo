
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from '@/components/ui/badge';
import { Order } from '@/hooks/useOrders';
import { usePayments, CreatePaymentData } from '@/hooks/usePayments';
import { toast } from 'sonner';
import { 
  CreditCard, 
  DollarSign, 
  QrCode, 
  FileText,
  Check,
  X
} from 'lucide-react';

interface PaymentConfirmationModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  onPaymentConfirmed: () => void;
}

const PaymentConfirmationModal: React.FC<PaymentConfirmationModalProps> = ({
  order,
  isOpen,
  onClose,
  onPaymentConfirmed
}) => {
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'money' | 'card' | 'bank_slip'>('money');
  const [referenceId, setReferenceId] = useState('');
  const [notes, setNotes] = useState('');
  const [isConfirming, setIsConfirming] = useState(false);
  
  const { createPayment, confirmPayment } = usePayments();

  const handleConfirmPayment = async () => {
    if (!order || !amount) {
      toast.error('Preencha o valor do pagamento');
      return;
    }

    try {
      setIsConfirming(true);

      const paymentData: CreatePaymentData = {
        order_id: order.id,
        amount: parseFloat(amount),
        payment_method: paymentMethod,
        reference_id: referenceId || undefined,
        notes: notes || undefined
      };

      const { data: payment, error: createError } = await createPayment(paymentData);
      
      if (createError || !payment) {
        toast.error(createError || 'Erro ao criar pagamento');
        return;
      }

      const { error: confirmError } = await confirmPayment(payment.id, referenceId, notes);
      
      if (confirmError) {
        toast.error('Erro ao confirmar pagamento: ' + confirmError);
        return;
      }

      toast.success('Pagamento confirmado com sucesso!');
      onPaymentConfirmed();
      onClose();
      resetForm();
    } catch (error) {
      console.error('Erro ao confirmar pagamento:', error);
      toast.error('Erro ao confirmar pagamento');
    } finally {
      setIsConfirming(false);
    }
  };

  const resetForm = () => {
    setAmount('');
    setPaymentMethod('money');
    setReferenceId('');
    setNotes('');
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'pix': return <QrCode className="h-4 w-4" />;
      case 'card': return <CreditCard className="h-4 w-4" />;
      case 'bank_slip': return <FileText className="h-4 w-4" />;
      default: return <DollarSign className="h-4 w-4" />;
    }
  };

  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case 'pix': return 'PIX';
      case 'card': return 'Cartão';
      case 'bank_slip': return 'Boleto';
      default: return 'Dinheiro';
    }
  };

  if (!order) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Check className="h-5 w-5 text-green-600" />
            Confirmar Pagamento
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Info do Pedido */}
          <div className="p-4 bg-gray-50 rounded-lg space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Pedido:</span>
              <span className="font-medium">#{order.id.slice(-8)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Cliente:</span>
              <span className="font-medium">{order.customer_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Total:</span>
              <span className="font-bold text-lg">R$ {order.total_amount.toFixed(2)}</span>
            </div>
          </div>

          {/* Valor do Pagamento */}
          <div className="space-y-2">
            <Label htmlFor="amount">Valor Recebido *</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              placeholder="0,00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>

          {/* Método de Pagamento */}
          <div className="space-y-2">
            <Label htmlFor="payment-method">Método de Pagamento *</Label>
            <Select value={paymentMethod} onValueChange={(value: any) => setPaymentMethod(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="money">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Dinheiro
                  </div>
                </SelectItem>
                <SelectItem value="pix">
                  <div className="flex items-center gap-2">
                    <QrCode className="h-4 w-4" />
                    PIX
                  </div>
                </SelectItem>
                <SelectItem value="card">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    Cartão
                  </div>
                </SelectItem>
                <SelectItem value="bank_slip">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Boleto
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Referência/Código */}
          <div className="space-y-2">
            <Label htmlFor="reference">
              {paymentMethod === 'pix' && 'ID da Transação PIX'}
              {paymentMethod === 'card' && 'Número da Autorização'}
              {paymentMethod === 'bank_slip' && 'Código do Boleto'}
              {paymentMethod === 'money' && 'Referência (opcional)'}
            </Label>
            <Input
              id="reference"
              placeholder={
                paymentMethod === 'pix' ? 'E12345678901234567890123456789012345' :
                paymentMethod === 'card' ? '123456' :
                paymentMethod === 'bank_slip' ? '12345.67890.12345.678901.123456.7' :
                'Referência opcional'
              }
              value={referenceId}
              onChange={(e) => setReferenceId(e.target.value)}
            />
          </div>

          {/* Observações */}
          <div className="space-y-2">
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              placeholder="Observações sobre o pagamento..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          {/* Ações */}
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={isConfirming}
            >
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmPayment}
              className="flex-1"
              disabled={isConfirming || !amount}
            >
              <Check className="h-4 w-4 mr-2" />
              {isConfirming ? 'Confirmando...' : 'Confirmar Pagamento'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentConfirmationModal;
