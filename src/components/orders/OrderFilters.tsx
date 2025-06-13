
import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Filter, 
  X, 
  Calendar,
  Package,
  CreditCard,
  Truck
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface OrderFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  paymentFilter: string;
  onPaymentFilterChange: (value: string) => void;
  typeFilter: string;
  onTypeFilterChange: (value: string) => void;
  shippingFilter: string;
  onShippingFilterChange: (value: string) => void;
  onClearFilters: () => void;
  activeFiltersCount: number;
}

const OrderFilters: React.FC<OrderFiltersProps> = ({
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  paymentFilter,
  onPaymentFilterChange,
  typeFilter,
  onTypeFilterChange,
  shippingFilter,
  onShippingFilterChange,
  onClearFilters,
  activeFiltersCount
}) => {
  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          placeholder="Buscar por cliente, telefone ou ID do pedido..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Filters Row */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Filtros:</span>
        </div>

        <Select value={statusFilter} onValueChange={onStatusFilterChange}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="pending">Pendente</SelectItem>
            <SelectItem value="confirmed">Confirmado</SelectItem>
            <SelectItem value="preparing">Preparando</SelectItem>
            <SelectItem value="shipping">Enviado</SelectItem>
            <SelectItem value="delivered">Entregue</SelectItem>
            <SelectItem value="cancelled">Cancelado</SelectItem>
          </SelectContent>
        </Select>

        <Select value={paymentFilter} onValueChange={onPaymentFilterChange}>
          <SelectTrigger className="w-[140px]">
            <CreditCard className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Pagamento" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="pending">Não Pago</SelectItem>
            <SelectItem value="partial">Pago Parcial</SelectItem>
            <SelectItem value="paid">Pago</SelectItem>
            <SelectItem value="overpaid">Pago a Mais</SelectItem>
            <SelectItem value="cancelled">Cancelado</SelectItem>
          </SelectContent>
        </Select>

        <Select value={typeFilter} onValueChange={onTypeFilterChange}>
          <SelectTrigger className="w-[140px]">
            <Package className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="retail">Varejo</SelectItem>
            <SelectItem value="wholesale">Atacado</SelectItem>
          </SelectContent>
        </Select>

        <Select value={shippingFilter} onValueChange={onShippingFilterChange}>
          <SelectTrigger className="w-[150px]">
            <Truck className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Envio" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="pickup">Retirada</SelectItem>
            <SelectItem value="delivery">Entrega Local</SelectItem>
            <SelectItem value="shipping">Correios</SelectItem>
            <SelectItem value="express">Expresso</SelectItem>
          </SelectContent>
        </Select>

        {activeFiltersCount > 0 && (
          <div className="flex items-center gap-2">
            <Badge variant="secondary">
              {activeFiltersCount} filtro(s) ativo(s)
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearFilters}
              className="h-8 px-2 text-gray-500 hover:text-gray-700"
            >
              <X className="h-4 w-4 mr-1" />
              Limpar
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderFilters;
