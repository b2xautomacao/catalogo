
import React, { useState, useEffect } from 'react';
import { Order } from '@/hooks/useOrders';
import { usePayments, Payment } from '@/hooks/usePayments';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  Package, 
  CreditCard,
  Truck,
  Calendar,
  FileText,
  MessageCircle,
  X,
  CheckCircle,
  DollarSign
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import PrintOptionsDropdown from './PrintOptionsDropdown';
import PaymentConfirmationModal from './PaymentConfirmationModal';
import { toast } from 'sonner';

interface OrderDetailsModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  onCancelOrder: (orderId: string) => void;
  onSendFollowUp: (order: Order) => void;
  onPrintLabel: (order: Order) => void;
  onPrintDeclaration: (order: Order) => void;
  onMarkPrintedDocument: (orderId: string, documentType: 'label' | 'picking_list' | 'content_declaration' | 'receipt') => void;
  onGenerateTrackingCode: (orderId: string) => void;
}

const OrderDetailsModal: React.FC<OrderDetailsModalProps> = ({
  order,
  isOpen,
  onClose,
  onCancelOrder,
  onSendFollowUp,
  onPrintLabel,
  onPrintDeclaration,
  onMarkPrintedDocument,
  onGenerateTrackingCode
}) => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const { fetchPaymentsByOrder } = usePayments();

  useEffect(() => {
    if (order?.id) {
      loadPayments();
    }
  }, [order?.id]);

  const loadPayments = async () => {
    if (!order?.id) return;
    
    const { data } = await fetchPaymentsByOrder(order.id);
    setPayments(data || []);
  };

  if (!order) return null;

  const getStatusColor = (status: string) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      confirmed: 'bg-blue-100 text-blue-800 border-blue-200',
      preparing: 'bg-orange-100 text-orange-800 border-orange-200',
      shipping: 'bg-purple-100 text-purple-800 border-purple-200',
      delivered: 'bg-green-100 text-green-800 border-green-200',
      cancelled: 'bg-red-100 text-red-800 border-red-200'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getStatusText = (status: string) => {
    const texts = {
      pending: 'Pendente',
      confirmed: 'Confirmado',
      preparing: 'Preparando',
      shipping: 'Enviado',
      delivered: 'Entregue',
      cancelled: 'Cancelado'
    };
    return texts[status as keyof typeof texts] || status;
  };

  const getPaymentStatus = (): { status: string; color: string; text: string } => {
    const confirmedPayments = payments.filter(p => p.status === 'confirmed');
    const totalPaid = confirmedPayments.reduce((sum, p) => sum + p.amount, 0);
    
    if (order.status === 'cancelled') {
      return { status: 'cancelled', color: 'bg-gray-50 text-gray-700 border-gray-200', text: 'Cancelado' };
    }
    
    if (totalPaid === 0) {
      return { status: 'pending', color: 'bg-red-50 text-red-700 border-red-200', text: 'Não Pago' };
    }
    
    if (totalPaid >= order.total_amount) {
      return { status: 'paid', color: 'bg-green-50 text-green-700 border-green-200', text: 'Pago' };
    }
    
    return { status: 'partial', color: 'bg-yellow-50 text-yellow-700 border-yellow-200', text: 'Pago Parcial' };
  };

  const paymentStatus = getPaymentStatus();

  const handlePrintPickingList = (order: Order) => {
    // Simular impressão de romaneio
    toast.success('Romaneio de separação enviado para impressão');
    onMarkPrintedDocument(order.id, 'picking_list');
  };

  const handlePrintLabelClick = (order: Order) => {
    if (order.label_generated_at) {
      toast.warning('Etiqueta já foi gerada para este pedido');
      return;
    }
    
    onGenerateTrackingCode(order.id);
    toast.success('Etiqueta de envio gerada com sucesso');
  };

  const handlePrintDeclarationClick = (order: Order) => {
    onPrintDeclaration(order);
    onMarkPrintedDocument(order.id, 'content_declaration');
    toast.success('Declaração de conteúdo enviada para impressão');
  };

  const handlePrintReceipt = (order: Order) => {
    toast.success('Recibo de pagamento enviado para impressão');
    onMarkPrintedDocument(order.id, 'receipt');
  };

  const handlePaymentConfirmed = () => {
    loadPayments();
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <Package className="h-5 w-5" />
              Pedido #{order.id.slice(-8)}
              <Badge variant="outline" className="ml-auto">
                {order.order_type === 'retail' ? 'Varejo' : 'Atacado'}
              </Badge>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Status e Info Geral */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-600">Status do Pedido</label>
                <Badge className={getStatusColor(order.status)} variant="outline">
                  {getStatusText(order.status)}
                </Badge>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-600">Status do Pagamento</label>
                <Badge className={paymentStatus.color} variant="outline">
                  {paymentStatus.text}
                </Badge>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-600">Data do Pedido</label>
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  {format(new Date(order.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-600">Código de Rastreamento</label>
                {order.tracking_code ? (
                  <div className="text-sm font-mono bg-gray-100 p-2 rounded">
                    {order.tracking_code}
                  </div>
                ) : (
                  <span className="text-sm text-gray-500">Não gerado</span>
                )}
              </div>
            </div>

            <Separator />

            {/* Informações do Cliente */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <User className="h-5 w-5" />
                Informações do Cliente
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-600">Nome</label>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-400" />
                    {order.customer_name}
                  </div>
                </div>
                {order.customer_phone && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-600">Telefone</label>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-gray-400" />
                      {order.customer_phone}
                    </div>
                  </div>
                )}
                {order.customer_email && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-600">Email</label>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-gray-400" />
                      {order.customer_email}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Pagamentos */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Histórico de Pagamentos
                </h3>
                {paymentStatus.status !== 'paid' && order.status !== 'cancelled' && (
                  <Button 
                    onClick={() => setShowPaymentModal(true)}
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <CheckCircle className="h-4 w-4" />
                    Confirmar Pagamento
                  </Button>
                )}
              </div>
              
              {payments.length > 0 ? (
                <div className="space-y-2">
                  {payments.map((payment) => (
                    <div key={payment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <CreditCard className="h-4 w-4 text-gray-500" />
                        <div>
                          <div className="font-medium">
                            R$ {payment.amount.toFixed(2)} - {payment.payment_method.toUpperCase()}
                          </div>
                          <div className="text-sm text-gray-600">
                            {format(new Date(payment.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                          </div>
                        </div>
                      </div>
                      <Badge variant={payment.status === 'confirmed' ? 'default' : 'secondary'}>
                        {payment.status === 'confirmed' ? 'Confirmado' : 'Pendente'}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-gray-500">
                  Nenhum pagamento registrado
                </div>
              )}
            </div>

            <Separator />

            {/* Itens do Pedido */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Package className="h-5 w-5" />
                Itens do Pedido
              </h3>
              <div className="space-y-3">
                {order.items?.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium">{item.name}</div>
                      <div className="text-sm text-gray-600">
                        Quantidade: {item.quantity}x - Preço unitário: R$ {item.price?.toFixed(2) || '0.00'}
                      </div>
                    </div>
                    <div className="font-semibold">
                      R$ {((item.price || 0) * (item.quantity || 0)).toFixed(2)}
                    </div>
                  </div>
                )) || (
                  <div className="text-gray-500 text-center py-4">
                    Nenhum item encontrado
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Endereço de Entrega */}
            {order.shipping_address && (
              <>
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Endereço de Entrega
                  </h3>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="space-y-2">
                      <div>{order.shipping_address.street}, {order.shipping_address.number}</div>
                      {order.shipping_address.complement && (
                        <div>{order.shipping_address.complement}</div>
                      )}
                      <div>{order.shipping_address.district}</div>
                      <div>{order.shipping_address.city} - {order.shipping_address.state}</div>
                      <div>CEP: {order.shipping_address.zip_code}</div>
                    </div>
                  </div>
                </div>
                <Separator />
              </>
            )}

            {/* Resumo Financeiro */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Resumo Financeiro
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>R$ {(order.total_amount - (order.shipping_cost || 0)).toFixed(2)}</span>
                </div>
                {order.shipping_cost && order.shipping_cost > 0 && (
                  <div className="flex justify-between">
                    <span>Frete</span>
                    <span>R$ {order.shipping_cost.toFixed(2)}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between text-lg font-semibold">
                  <span>Total</span>
                  <span>R$ {order.total_amount.toFixed(2)}</span>
                </div>
                {payments.length > 0 && (
                  <>
                    <div className="flex justify-between text-green-600">
                      <span>Total Pago</span>
                      <span>R$ {payments.filter(p => p.status === 'confirmed').reduce((sum, p) => sum + p.amount, 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-red-600">
                      <span>Saldo Restante</span>
                      <span>R$ {Math.max(0, order.total_amount - payments.filter(p => p.status === 'confirmed').reduce((sum, p) => sum + p.amount, 0)).toFixed(2)}</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Observações */}
            {order.notes && (
              <>
                <Separator />
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Observações
                  </h3>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    {order.notes}
                  </div>
                </div>
              </>
            )}

            {/* Ações */}
            <Separator />
            <div className="flex flex-wrap gap-3 justify-between">
              <div className="flex gap-3">
                <PrintOptionsDropdown
                  order={order}
                  onPrintPickingList={handlePrintPickingList}
                  onPrintLabel={handlePrintLabelClick}
                  onPrintDeclaration={handlePrintDeclarationClick}
                  onPrintReceipt={handlePrintReceipt}
                />
                
                {paymentStatus.status === 'pending' && (
                  <Button
                    onClick={() => onSendFollowUp(order)}
                    className="flex items-center gap-2"
                    variant="outline"
                  >
                    <MessageCircle className="h-4 w-4" />
                    Enviar Cobrança
                  </Button>
                )}
              </div>
              
              {order.status !== 'cancelled' && order.status !== 'delivered' && (
                <Button
                  onClick={() => onCancelOrder(order.id)}
                  variant="destructive"
                  className="flex items-center gap-2"
                >
                  <X className="h-4 w-4" />
                  Cancelar Pedido
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <PaymentConfirmationModal
        order={order}
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onPaymentConfirmed={handlePaymentConfirmed}
      />
    </>
  );
};

export default OrderDetailsModal;
