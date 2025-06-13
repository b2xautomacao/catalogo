
import React from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Printer, 
  FileText, 
  Package, 
  Tag, 
  Receipt,
  Check,
  Clock
} from 'lucide-react';
import { Order } from '@/hooks/useOrders';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface PrintOptionsDropdownProps {
  order: Order;
  onPrintPickingList: (order: Order) => void;
  onPrintLabel: (order: Order) => void;
  onPrintDeclaration: (order: Order) => void;
  onPrintReceipt: (order: Order) => void;
}

const PrintOptionsDropdown: React.FC<PrintOptionsDropdownProps> = ({
  order,
  onPrintPickingList,
  onPrintLabel,
  onPrintDeclaration,
  onPrintReceipt
}) => {
  const isPrinted = (date: string | null) => !!date;
  
  const formatPrintDate = (date: string | null) => {
    if (!date) return null;
    return format(new Date(date), "dd/MM 'às' HH:mm", { locale: ptBR });
  };

  const getStatusIcon = (date: string | null) => {
    return isPrinted(date) ? (
      <Check className="h-3 w-3 text-green-600" />
    ) : (
      <Clock className="h-3 w-3 text-gray-400" />
    );
  };

  const getStatusBadge = (date: string | null) => {
    return isPrinted(date) ? (
      <Badge variant="default" className="bg-green-100 text-green-800 text-xs">
        Impresso
      </Badge>
    ) : (
      <Badge variant="secondary" className="text-xs">
        Pendente
      </Badge>
    );
  };

  const canPrintLabel = order.status !== 'pending' && order.status !== 'cancelled';
  const hasTrackingCode = !!order.tracking_code;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center gap-2">
          <Printer className="h-4 w-4" />
          Impressões
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        {/* Romaneio de Separação */}
        <DropdownMenuItem 
          onClick={() => onPrintPickingList(order)}
          className="flex items-center justify-between p-3"
          disabled={order.status === 'cancelled'}
        >
          <div className="flex items-center gap-3">
            <Package className="h-4 w-4 text-blue-600" />
            <div className="flex flex-col">
              <span className="font-medium">Romaneio de Separação</span>
              {isPrinted(order.picking_list_printed_at) && (
                <span className="text-xs text-gray-500">
                  {formatPrintDate(order.picking_list_printed_at)}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {getStatusIcon(order.picking_list_printed_at)}
            {getStatusBadge(order.picking_list_printed_at)}
          </div>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* Etiqueta de Envio */}
        <DropdownMenuItem 
          onClick={() => onPrintLabel(order)}
          className="flex items-center justify-between p-3"
          disabled={!canPrintLabel}
        >
          <div className="flex items-center gap-3">
            <Tag className="h-4 w-4 text-purple-600" />
            <div className="flex flex-col">
              <span className="font-medium">Etiqueta de Envio</span>
              {hasTrackingCode && (
                <span className="text-xs text-gray-500">
                  Código: {order.tracking_code}
                </span>
              )}
              {isPrinted(order.label_generated_at) && (
                <span className="text-xs text-gray-500">
                  {formatPrintDate(order.label_generated_at)}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {getStatusIcon(order.label_generated_at)}
            {isPrinted(order.label_generated_at) ? (
              <Badge variant="destructive" className="text-xs">
                Já Gerada
              </Badge>
            ) : (
              <Badge variant="secondary" className="text-xs">
                {canPrintLabel ? 'Disponível' : 'Bloqueada'}
              </Badge>
            )}
          </div>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* Declaração de Conteúdo */}
        <DropdownMenuItem 
          onClick={() => onPrintDeclaration(order)}
          className="flex items-center justify-between p-3"
          disabled={order.status === 'cancelled'}
        >
          <div className="flex items-center gap-3">
            <FileText className="h-4 w-4 text-orange-600" />
            <div className="flex flex-col">
              <span className="font-medium">Declaração de Conteúdo</span>
              {isPrinted(order.content_declaration_printed_at) && (
                <span className="text-xs text-gray-500">
                  {formatPrintDate(order.content_declaration_printed_at)}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {getStatusIcon(order.content_declaration_printed_at)}
            {getStatusBadge(order.content_declaration_printed_at)}
          </div>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* Recibo de Pagamento */}
        <DropdownMenuItem 
          onClick={() => onPrintReceipt(order)}
          className="flex items-center justify-between p-3"
          disabled={order.status === 'cancelled'}
        >
          <div className="flex items-center gap-3">
            <Receipt className="h-4 w-4 text-green-600" />
            <div className="flex flex-col">
              <span className="font-medium">Recibo de Pagamento</span>
              {isPrinted(order.receipt_printed_at) && (
                <span className="text-xs text-gray-500">
                  {formatPrintDate(order.receipt_printed_at)}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {getStatusIcon(order.receipt_printed_at)}
            {getStatusBadge(order.receipt_printed_at)}
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default PrintOptionsDropdown;
