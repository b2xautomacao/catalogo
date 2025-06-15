
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CheckoutProvider, useCheckoutContext } from './checkout/context/CheckoutProvider';
import CheckoutContent from './checkout/components/CheckoutContent';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  storeSettings: any;
  storeId?: string;
  storeData?: any;
}

const CheckoutModalContent: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { catalogLoading } = useCheckoutContext();

  // Aguardar carregamento das configurações do catálogo
  if (catalogLoading) {
    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Carregando...</DialogTitle>
          </DialogHeader>
          <div className="text-center py-6">
            <p className="text-gray-600">Carregando configurações do catálogo...</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-[95vw] h-[90vh] p-0 gap-0 flex flex-col overflow-hidden">
        <DialogHeader className="shrink-0 px-6 py-4 border-b bg-gradient-to-r from-primary to-accent">
          <DialogTitle className="text-2xl font-bold text-white text-center">
            🛒 Finalizar Pedido
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 min-h-0">
          <CheckoutContent />
        </div>
      </DialogContent>
    </Dialog>
  );
};

const CheckoutModal: React.FC<CheckoutModalProps> = ({ 
  isOpen, 
  onClose, 
  storeSettings, 
  storeId, 
  storeData 
}) => {
  if (!isOpen) return null;

  return (
    <CheckoutProvider 
      storeSettings={storeSettings} 
      storeId={storeId}
      storeData={storeData}
    >
      <CheckoutModalContent onClose={onClose} />
    </CheckoutProvider>
  );
};

export default CheckoutModal;
