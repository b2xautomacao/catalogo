
import React, { useState, useCallback, useMemo } from 'react';
import { Package } from 'lucide-react';
import { useOrders } from '@/hooks/useOrders';
import { useOrderPayments } from '@/hooks/useOrderPayments';
import OrdersHeader from '@/components/orders/OrdersHeader';
import OrderFilters from '@/components/orders/OrderFilters';
import OrdersTableMemo from '@/components/orders/OrdersTableMemo';
import OrdersGridMemo from '@/components/orders/OrdersGridMemo';
import OrdersPagination from '@/components/orders/OrdersPagination';
import OrderDetailsModal from '@/components/orders/OrderDetailsModal';
import ContentDeclarationModal from '@/components/orders/ContentDeclarationModal';
import { Order } from '@/hooks/useOrders';
import { toast } from 'sonner';

const Orders = () => {
  console.log('🔄 Orders: Component re-render');
  
  const { orders, loading, fetchOrders, updateOrderStatus, markPrintedDocument, generateTrackingCode } = useOrders();
  const { orderPayments, loading: paymentsLoading, getOrderPaymentStatus, refreshPayments } = useOrderPayments(orders);
  
  // View state
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  
  // Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [shippingFilter, setShippingFilter] = useState('all');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  
  // Modal state
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeclarationModalOpen, setIsDeclarationModalOpen] = useState(false);

  // Memorizar pedidos filtrados para evitar recálculos desnecessários
  const filteredOrders = useMemo(() => {
    console.log('🔍 Orders: Recalculando filtros');
    return orders.filter(order => {
      const matchesSearch = searchTerm === '' || 
        order.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customer_phone?.includes(searchTerm) ||
        order.id.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
      const matchesType = typeFilter === 'all' || order.order_type === typeFilter;
      const matchesShipping = shippingFilter === 'all' || order.shipping_method === shippingFilter;
      
      // Payment filter logic using real payment data
      let matchesPayment = true;
      if (paymentFilter !== 'all') {
        const paymentStatus = getOrderPaymentStatus(order.id);
        if (paymentStatus) {
          matchesPayment = paymentStatus.status === paymentFilter;
        } else {
          // Fallback for orders without payment data loaded yet
          matchesPayment = paymentFilter === 'pending';
        }
      }
      
      return matchesSearch && matchesStatus && matchesType && matchesShipping && matchesPayment;
    });
  }, [orders, searchTerm, statusFilter, paymentFilter, typeFilter, shippingFilter, getOrderPaymentStatus]);

  // Memorizar pedidos paginados
  const { paginatedOrders, totalPages } = useMemo(() => {
    const total = Math.ceil(filteredOrders.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginated = filteredOrders.slice(startIndex, startIndex + itemsPerPage);
    
    return {
      paginatedOrders: paginated,
      totalPages: total
    };
  }, [filteredOrders, currentPage, itemsPerPage]);

  // Handlers com useCallback para estabilidade
  const handleRefresh = useCallback(async () => {
    console.log('🔄 Orders: Refresh manual');
    await fetchOrders();
    refreshPayments();
    toast.success('Lista de pedidos atualizada');
  }, [fetchOrders, refreshPayments]);

  const handleExport = useCallback(() => {
    toast.info('Funcionalidade de exportação em desenvolvimento');
  }, []);

  const handleClearFilters = useCallback(() => {
    console.log('🧹 Orders: Limpando filtros');
    setSearchTerm('');
    setStatusFilter('all');
    setPaymentFilter('all');
    setTypeFilter('all');
    setShippingFilter('all');
    setCurrentPage(1);
  }, []);

  const handleViewOrder = useCallback((order: Order) => {
    setSelectedOrder(order);
    setIsModalOpen(true);
  }, []);

  const handleStatusChange = useCallback(async (orderId: string, newStatus: Order['status']) => {
    console.log(`📝 Orders: Alterando status do pedido ${orderId} para ${newStatus}`);
    const result = await updateOrderStatus(orderId, newStatus);
    if (result.error) {
      toast.error('Erro ao alterar status: ' + result.error);
    } else {
      toast.success(`Status alterado para ${getStatusText(newStatus)}`);
      // Atualizar pagamentos se necessário
      if (newStatus === 'cancelled') {
        refreshPayments();
      }
    }
  }, [updateOrderStatus, refreshPayments]);

  const handleCancelOrder = useCallback(async (orderId: string) => {
    console.log('❌ Orders: Cancelando pedido', orderId);
    await handleStatusChange(orderId, 'cancelled');
    setIsModalOpen(false);
  }, [handleStatusChange]);

  const handleSendFollowUp = useCallback((order: Order) => {
    toast.info('Enviando lembrete de pagamento via WhatsApp...');
    // Integração com WhatsApp seria implementada aqui
  }, []);

  const handlePrintLabel = useCallback(async (order: Order) => {
    // Verificar se o método de envio permite impressão de etiqueta
    if (order.shipping_method !== 'shipping' && order.shipping_method !== 'express') {
      toast.warning('Etiquetas só podem ser geradas para envios via Correios ou Expresso');
      return;
    }

    if (order.label_generated_at) {
      toast.warning('Etiqueta já foi gerada para este pedido');
      return;
    }
    
    const result = await generateTrackingCode(order.id);
    if (result.success) {
      toast.success(`Etiqueta gerada! Código: ${result.trackingCode}`);
    } else {
      toast.error('Erro ao gerar etiqueta: ' + result.error);
    }
  }, [generateTrackingCode]);

  const handlePrintDeclaration = useCallback((order: Order) => {
    setSelectedOrder(order);
    setIsDeclarationModalOpen(true);
  }, []);

  const handlePrintDeclarationDocument = () => {
    if (selectedOrder) {
      // Imprimir o conteúdo da declaração
      const printWindow = window.open('', '_blank');
      const declarationContent = document.getElementById('declaration-content');
      
      if (printWindow && declarationContent) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Declaração de Conteúdo - Pedido #${selectedOrder.id.slice(-8)}</title>
              <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                table { border-collapse: collapse; width: 100%; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                th { background-color: #f2f2f2; }
                .text-center { text-align: center; }
                .text-right { text-align: right; }
                .font-bold { font-weight: bold; }
                .mt-8 { margin-top: 32px; }
                .pt-6 { padding-top: 24px; }
                .border-t { border-top: 1px solid #ddd; }
                .border-b { border-bottom: 1px solid #ddd; }
                .pb-4 { padding-bottom: 16px; }
                .mb-2 { margin-bottom: 8px; }
                @media print {
                  body { margin: 0; }
                  .no-print { display: none; }
                }
              </style>
            </head>
            <body>
              ${declarationContent.innerHTML}
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
        
        // Marcar como impresso
        markPrintedDocument(selectedOrder.id, 'content_declaration');
        toast.success('Declaração de conteúdo enviada para impressão');
      }
    }
    setIsDeclarationModalOpen(false);
  };

  const handleDownloadPdf = () => {
    if (selectedOrder) {
      toast.info('Funcionalidade de download em PDF em desenvolvimento');
      // Aqui seria implementada a geração do PDF
    }
  };

  const handleMarkPrintedDocument = async (orderId: string, documentType: 'label' | 'picking_list' | 'content_declaration' | 'receipt') => {
    const result = await markPrintedDocument(orderId, documentType);
    if (result.success) {
      toast.success('Documento marcado como impresso');
    } else {
      toast.error('Erro ao marcar documento: ' + result.error);
    }
  };

  const handleGenerateTrackingCode = async (orderId: string) => {
    const result = await generateTrackingCode(orderId);
    if (result.success) {
      toast.success(`Código de rastreamento gerado: ${result.trackingCode}`);
    } else {
      toast.error('Erro ao gerar código: ' + result.error);
    }
  };

  const activeFiltersCount = useMemo(() => {
    return [
      statusFilter !== 'all',
      paymentFilter !== 'all',
      typeFilter !== 'all',
      shippingFilter !== 'all',
      searchTerm !== ''
    ].filter(Boolean).length;
  }, [statusFilter, paymentFilter, typeFilter, shippingFilter, searchTerm]);

  const isLoading = loading || paymentsLoading;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <OrdersHeader
        totalOrders={filteredOrders.length}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onRefresh={handleRefresh}
        onExport={handleExport}
        isLoading={isLoading}
      />

      <OrderFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        paymentFilter={paymentFilter}
        onPaymentFilterChange={setPaymentFilter}
        typeFilter={typeFilter}
        onTypeFilterChange={setTypeFilter}
        shippingFilter={shippingFilter}
        onShippingFilterChange={setShippingFilter}
        onClearFilters={handleClearFilters}
        activeFiltersCount={activeFiltersCount}
      />

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Carregando pedidos...</p>
          </div>
        </div>
      ) : paginatedOrders.length === 0 ? (
        <div className="text-center py-12">
          <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {filteredOrders.length === 0 ? 'Nenhum pedido encontrado' : 'Nenhum resultado'}
          </h3>
          <p className="text-gray-600">
            {filteredOrders.length === 0 
              ? 'Quando você receber pedidos, eles aparecerão aqui.'
              : 'Tente ajustar os filtros para encontrar o que procura.'
            }
          </p>
        </div>
      ) : (
        <>
          {viewMode === 'table' ? (
            <OrdersTableMemo
              orders={paginatedOrders}
              onViewOrder={handleViewOrder}
              onCancelOrder={handleCancelOrder}
              onSendFollowUp={handleSendFollowUp}
              onPrintLabel={handlePrintLabel}
              onPrintDeclaration={handlePrintDeclaration}
              getOrderPaymentStatus={getOrderPaymentStatus}
              onStatusChange={handleStatusChange}
            />
          ) : (
            <OrdersGridMemo
              orders={paginatedOrders}
              onViewOrder={handleViewOrder}
              onCancelOrder={handleCancelOrder}
              onSendFollowUp={handleSendFollowUp}
              onPrintLabel={handlePrintLabel}
              onPrintDeclaration={handlePrintDeclaration}
              getOrderPaymentStatus={getOrderPaymentStatus}
            />
          )}

          <OrdersPagination
            currentPage={currentPage}
            totalPages={totalPages}
            itemsPerPage={itemsPerPage}
            totalItems={filteredOrders.length}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={(newItemsPerPage) => {
              setItemsPerPage(newItemsPerPage);
              setCurrentPage(1);
            }}
          />
        </>
      )}

      <OrderDetailsModal
        order={selectedOrder}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCancelOrder={handleCancelOrder}
        onSendFollowUp={handleSendFollowUp}
        onPrintLabel={handlePrintLabel}
        onPrintDeclaration={handlePrintDeclaration}
        onMarkPrintedDocument={markPrintedDocument}
        onGenerateTrackingCode={generateTrackingCode}
      />

      <ContentDeclarationModal
        order={selectedOrder}
        isOpen={isDeclarationModalOpen}
        onClose={() => setIsDeclarationModalOpen(false)}
        onPrint={() => {
          if (selectedOrder) {
            // Imprimir o conteúdo da declaração
            const printWindow = window.open('', '_blank');
            const declarationContent = document.getElementById('declaration-content');
            
            if (printWindow && declarationContent) {
              printWindow.document.write(`
                <html>
                  <head>
                    <title>Declaração de Conteúdo - Pedido #${selectedOrder.id.slice(-8)}</title>
                    <style>
                      body { font-family: Arial, sans-serif; margin: 20px; }
                      table { border-collapse: collapse; width: 100%; }
                      th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                      th { background-color: #f2f2f2; }
                      .text-center { text-align: center; }
                      .text-right { text-align: right; }
                      .font-bold { font-weight: bold; }
                      .mt-8 { margin-top: 32px; }
                      .pt-6 { padding-top: 24px; }
                      .border-t { border-top: 1px solid #ddd; }
                      .border-b { border-bottom: 1px solid #ddd; }
                      .pb-4 { padding-bottom: 16px; }
                      .mb-2 { margin-bottom: 8px; }
                      @media print {
                        body { margin: 0; }
                        .no-print { display: none; }
                      }
                    </style>
                  </head>
                  <body>
                    ${declarationContent.innerHTML}
                  </body>
                </html>
              `);
              printWindow.document.close();
              printWindow.print();
              
              // Marcar como impresso
              markPrintedDocument(selectedOrder.id, 'content_declaration');
              toast.success('Declaração de conteúdo enviada para impressão');
            }
          }
          setIsDeclarationModalOpen(false);
        }}
        onDownloadPdf={() => {
          if (selectedOrder) {
            toast.info('Funcionalidade de download em PDF em desenvolvimento');
            // Aqui seria implementada a geração do PDF
          }
        }}
      />
    </div>
  );
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

export default Orders;
