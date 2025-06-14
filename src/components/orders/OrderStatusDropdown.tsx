
import React, { useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Order } from '@/hooks/useOrders';

interface OrderStatusDropdownProps {
  order: Order;
  onStatusChange: (orderId: string, newStatus: Order['status']) => void;
  disabled?: boolean;
}

const OrderStatusDropdown: React.FC<OrderStatusDropdownProps> = ({
  order,
  onStatusChange,
  disabled = false
}) => {
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<Order['status'] | null>(null);

  const statusOptions: { value: Order['status']; label: string; color: string }[] = [
    { value: 'pending', label: 'Pendente', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'confirmed', label: 'Confirmado', color: 'bg-blue-100 text-blue-800' },
    { value: 'preparing', label: 'Preparando', color: 'bg-orange-100 text-orange-800' },
    { value: 'shipping', label: 'Enviado', color: 'bg-purple-100 text-purple-800' },
    { value: 'delivered', label: 'Entregue', color: 'bg-green-100 text-green-800' },
    { value: 'cancelled', label: 'Cancelado', color: 'bg-red-100 text-red-800' }
  ];

  const currentStatus = statusOptions.find(s => s.value === order.status);

  const getAvailableStatuses = (currentStatus: Order['status']): Order['status'][] => {
    switch (currentStatus) {
      case 'pending':
        return ['confirmed', 'cancelled'];
      case 'confirmed':
        return ['preparing', 'cancelled'];
      case 'preparing':
        return ['shipping', 'cancelled'];
      case 'shipping':
        return ['delivered'];
      case 'delivered':
        return []; // Não pode mudar
      case 'cancelled':
        return []; // Não pode mudar
      default:
        return [];
    }
  };

  const availableStatuses = getAvailableStatuses(order.status);
  const availableOptions = statusOptions.filter(option => 
    availableStatuses.includes(option.value)
  );

  const handleStatusSelect = (newStatus: Order['status']) => {
    setSelectedStatus(newStatus);
    setShowConfirmDialog(true);
  };

  const handleConfirmChange = () => {
    if (selectedStatus) {
      onStatusChange(order.id, selectedStatus);
    }
    setShowConfirmDialog(false);
    setSelectedStatus(null);
  };

  const selectedStatusOption = selectedStatus ? 
    statusOptions.find(s => s.value === selectedStatus) : null;

  if (availableOptions.length === 0 || disabled) {
    return (
      <Badge variant="outline" className={currentStatus?.color}>
        {currentStatus?.label}
      </Badge>
    );
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="h-6 px-2">
            <Badge variant="outline" className={`${currentStatus?.color} mr-1`}>
              {currentStatus?.label}
            </Badge>
            <ChevronDown className="h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40">
          {availableOptions.map((option) => (
            <DropdownMenuItem
              key={option.value}
              onClick={() => handleStatusSelect(option.value)}
              className="cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={`${option.color} text-xs`}>
                  {option.label}
                </Badge>
              </div>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Alteração de Status</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja alterar o status do pedido #{order.id.slice(-8)} de{' '}
              <span className="font-semibold">{currentStatus?.label}</span> para{' '}
              <span className="font-semibold">{selectedStatusOption?.label}</span>?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowConfirmDialog(false)}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmChange}>
              <Check className="h-4 w-4 mr-2" />
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default OrderStatusDropdown;
