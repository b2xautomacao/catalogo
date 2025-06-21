
import React, { useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CheckoutProvider, useCheckoutContext } from './checkout/context/CheckoutProvider';
import CheckoutContent from './checkout/components/CheckoutContent';
import { useIsMobile } from '@/hooks/use-mobile';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  storeSettings: any;
  storeId?: string;
  storeData?: any;
}

const CheckoutModalContent: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { catalogLoading } = useCheckoutContext();
  const isMobile = useIsMobile();

  useEffect(() => {
    // Aplicar cores do template ao modal de checkout
    if (typeof document !== 'undefined') {
      const style = document.createElement('style');
      style.textContent = `
        .checkout-modal-header {
          background: linear-gradient(135deg, var(--template-primary, #0057FF), var(--template-accent, #8E2DE2));
        }
        
        .checkout-modal-content {
          background: var(--template-surface, #FFFFFF);
        }
      `;
      document.head.appendChild(style);
      
      return () => {
        document.head.removeChild(style);
      };
    }
  }, []);

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
      <DialogContent 
        className={`${
          isMobile 
            ? 'max-w-full w-full h-full m-0 rounded-none' 
            : 'max-w-4xl w-[95vw] h-[90vh]'
        } p-0 gap-0 flex flex-col overflow-hidden checkout-modal-content`}
      >
        <DialogHeader className="checkout-modal-header shrink-0 px-6 py-4 border-b">
          <DialogTitle className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold text-white text-center`}>
            🛒 Finalizar Pedido
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 min-h-0">
          <CheckoutContent onClose={onClose} />
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
