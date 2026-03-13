import React from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';

interface CheckoutModalWrapperProps {
    children: React.ReactNode;
    onClose: () => void;
    title?: string;
}

const CheckoutModalWrapper: React.FC<CheckoutModalWrapperProps> = ({
    children,
    onClose,
    title = "Finalizar Pedido"
}) => {
    const isMobile = useIsMobile();

    // Bloquear scroll do body quando o modal estiver aberto
    React.useEffect(() => {
        const originalStyle = window.getComputedStyle(document.body).overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = originalStyle;
        };
    }, []);

    return (
        <div className="fixed inset-0 z-[60] flex items-start sm:items-center justify-center overflow-hidden">
            {/* Overlay - somente desktop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm hidden sm:block"
                onClick={onClose}
            />

            {/* Modal Container */}
            <div className={`
        relative bg-white w-full h-full flex flex-col
        sm:h-auto sm:max-h-[95vh] sm:max-w-7xl sm:rounded-xl sm:shadow-2xl sm:m-4
        animate-in fade-in zoom-in duration-200
      `}>
                {/* Header - visível em mobile ou como barra de ferramentas em desktop */}
                <div className={`
          flex items-center justify-between p-4 border-b bg-white sticky top-0 z-[70]
          ${isMobile ? '' : 'sm:rounded-t-xl'}
        `}>
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                            <span className="font-bold text-sm">🛒</span>
                        </div>
                        <h2 className="font-bold text-lg text-gray-900">{title}</h2>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onClose}
                        className="rounded-full hover:bg-gray-100 transition-colors"
                    >
                        <X className="h-6 w-6 text-gray-500" />
                    </Button>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto overflow-x-hidden focus-within:scroll-auto">
                    <div className={`${isMobile ? 'p-0' : 'p-2 sm:p-4'}`}>
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CheckoutModalWrapper;
