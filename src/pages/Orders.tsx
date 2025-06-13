import React, { useState } from 'react';
import { Package } from 'lucide-react';
import { useOrders } from '@/hooks/useOrders';
import OrdersHeader from '@/components/orders/OrdersHeader';
import OrderFilters from '@/components/orders/OrderFilters';
import OrdersTable from '@/components/orders/OrdersTable';
import OrdersGrid from '@/components/orders/OrdersGrid';
import OrdersPagination from '@/components/orders/OrdersPagination';
import OrderDetailsModal from '@/components/orders/OrderDetailsModal';
import { Order } from '@/hooks/useOrders';
import { toast } from 'sonner';

const Orders = () => {
  const { orders, loading, fetchOrders, updateOrderStatus, markPrintedDocument, generateTrackingCode } = useOrders();
  
  // View state
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  
  // Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  
  // Modal state
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Filter orders
  const filteredOrders = orders.filter(order => {
    const matchesSearch = searchTerm === '' || 
      order.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer_phone?.includes(searchTerm) ||
      order.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    const matchesType = typeFilter === 'all' || order.order_type === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  // Paginate orders
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedOrders = filteredOrders.slice(startIndex, startIndex + itemsPerPage);

  // Handlers
  const handleRefresh = () => {
    fetchOrders();
    toast.success('Lista de pedidos atualizada');
  };

  const handleExport = () => {
    toast.info('Funcionalidade de exportação em desenvolvimento');
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setPaymentFilter('all');
    setTypeFilter('all');
    setCurrentPage(1);
  };

  const handleViewOrder = (order: Order) => {
    setSelectedOrder(order);
    setIsModalOpen(true);
  };

  const handleStatusChange = async (orderId: string, newStatus: Order['status']) => {
    const result = await updateOrderStatus(orderId, newStatus);
    if (result.error) {
      toast.error('Erro ao atualizar status: ' + result.error);
    } else {
      toast.success('Status atualizado com sucesso');
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    const result = await updateOrderStatus(orderId, 'cancelled');
    if (result.error) {
      toast.error('Erro ao cancelar pedido: ' + result.error);
    } else {
      toast.success('Pedido cancelado com sucesso');
      setIsModalOpen(false);
    }
  };

  const handleSendFollowUp = (order: Order) => {
    toast.info('Enviando lembrete de pagamento via WhatsApp...');
    // Integração com WhatsApp seria implementada aqui
  };

  const handlePrintLabel = async (order: Order) => {
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
  };

  const handlePrintDeclaration = (order: Order) => {
    toast.success('Declaração de conteúdo enviada para impressão');
    // Lógica de impressão aqui
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

  const activeFiltersCount = [
    statusFilter !== 'all',
    paymentFilter !== 'all',
    typeFilter !== 'all',
    searchTerm !== ''
  ].filter(Boolean).length;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <OrdersHeader
        totalOrders={filteredOrders.length}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onRefresh={handleRefresh}
        onExport={handleExport}
        isLoading={loading}
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
        onClearFilters={handleClearFilters}
        activeFiltersCount={activeFiltersCount}
      />

      {loading ? (
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
            <OrdersTable
              orders={paginatedOrders}
              onViewOrder={handleViewOrder}
              onCancelOrder={handleCancelOrder}
              onSendFollowUp={handleSendFollowUp}
              onPrintLabel={handlePrintLabel}
              onPrintDeclaration={handlePrintDeclaration}
            />
          ) : (
            <OrdersGrid
              orders={paginatedOrders}
              onViewOrder={handleViewOrder}
              onCancelOrder={handleCancelOrder}
              onSendFollowUp={handleSendFollowUp}
              onPrintLabel={handlePrintLabel}
              onPrintDeclaration={handlePrintDeclaration}
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
        onMarkPrintedDocument={handleMarkPrintedDocument}
        onGenerateTrackingCode={handleGenerateTrackingCode}
      />
    </div>
  );
};

export default Orders;
