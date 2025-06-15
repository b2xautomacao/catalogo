import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Smartphone, CreditCard, FileText, MapPin, Truck } from 'lucide-react';
import { useCart } from '@/hooks/useCart';
import { useOrders } from '@/hooks/useOrders';
import { useToast } from '@/hooks/use-toast';
import { useCatalogSettings } from '@/hooks/useCatalogSettings';
import { useCheckoutOptions } from '@/hooks/useCheckoutOptions';
import { useStores } from '@/hooks/useStores';

interface CustomerData {
  name: string;
  email: string;
  phone: string;
}

interface ShippingAddress {
  zipCode: string;
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
}

interface CheckoutContextType {
  // Estado
  customerData: CustomerData;
  setCustomerData: (data: CustomerData) => void;
  checkoutType: 'whatsapp_only' | 'online_payment';
  setCheckoutType: (type: 'whatsapp_only' | 'online_payment') => void;
  shippingMethod: string;
  setShippingMethod: (method: string) => void;
  paymentMethod: string;
  setPaymentMethod: (method: string) => void;
  shippingAddress: ShippingAddress;
  setShippingAddress: (address: ShippingAddress) => void;
  shippingCost: number;
  setShippingCost: (cost: number) => void;
  notes: string;
  setNotes: (notes: string) => void;
  currentStep: 'checkout' | 'payment';
  setCurrentStep: (step: 'checkout' | 'payment') => void;
  createdOrder: any;
  setCreatedOrder: (order: any) => void;
  shippingOptions: any[];
  setShippingOptions: (options: any[]) => void;

  // Dados computados
  finalTotal: number;
  isWhatsappOnly: boolean;
  availablePaymentMethods: any[];
  availableShippingMethods: any[];
  isTestEnvironment: boolean;
  
  // Hooks integrados
  cartItems: any[];
  totalAmount: number;
  clearCart: () => void;
  createOrderAsync: (data: any) => Promise<any>;
  isCreatingOrder: boolean;
  toast: any;
  settings: any;
  catalogLoading: boolean;
  checkoutOptions: any;
  availableOptions: any[];
  defaultOption: string;
  canUseOnlinePayment: boolean;
  hasWhatsAppConfigured: boolean;
  
  // Adicionar currentStore ao contexto
  currentStore: any;
}

const CheckoutContext = createContext<CheckoutContextType | undefined>(undefined);

export const useCheckoutContext = () => {
  const context = useContext(CheckoutContext);
  if (!context) {
    throw new Error('useCheckoutContext deve ser usado dentro de CheckoutProvider');
  }
  return context;
};

interface CheckoutProviderProps {
  children: ReactNode;
  storeId?: string;
  storeSettings: any;
}

export const CheckoutProvider: React.FC<CheckoutProviderProps> = ({ 
  children, 
  storeId, 
  storeSettings 
}) => {
  const { items: cartItems, totalAmount, clearCart } = useCart();
  const { createOrderAsync, isCreatingOrder } = useOrders();
  const { settings, loading: catalogLoading } = useCatalogSettings(storeId);
  const { toast } = useToast();
  const { currentStore } = useStores();
  
  const {
    checkoutOptions,
    availableOptions,
    defaultOption,
    canUseOnlinePayment,
    hasWhatsAppConfigured,
  } = useCheckoutOptions(storeId);

  // Estado local
  const [customerData, setCustomerData] = useState<CustomerData>({
    name: '',
    email: '',
    phone: ''
  });
  
  const [checkoutType, setCheckoutType] = useState<'whatsapp_only' | 'online_payment'>('whatsapp_only');
  const [shippingMethod, setShippingMethod] = useState('pickup');
  const [paymentMethod, setPaymentMethod] = useState('pix');
  const [shippingAddress, setShippingAddress] = useState<ShippingAddress>({
    zipCode: '',
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: ''
  });
  
  const [shippingCost, setShippingCost] = useState(0);
  const [notes, setNotes] = useState('');
  const [currentStep, setCurrentStep] = useState<'checkout' | 'payment'>('checkout');
  const [createdOrder, setCreatedOrder] = useState<any>(null);
  const [shippingOptions, setShippingOptions] = useState<any[]>([]);

  // Configurações efetivas
  const effectiveSettings = settings || storeSettings || {};
  
  // Verificar credenciais do Mercado Pago apenas para checkout online
  const hasMercadoPagoCredentials = React.useMemo(() => {
    if (catalogLoading || !effectiveSettings || checkoutType === 'whatsapp_only') {
      return false;
    }

    const paymentMethods = effectiveSettings?.payment_methods;
    const hasCredentials = !!(paymentMethods?.mercadopago_access_token?.trim() && paymentMethods?.mercadopago_public_key?.trim());
    
    return hasCredentials;
  }, [effectiveSettings, catalogLoading, checkoutType]);

  // Verificar se está em ambiente de teste
  const isTestEnvironment = React.useMemo(() => {
    const paymentMethods = effectiveSettings?.payment_methods;
    const accessToken = paymentMethods?.mercadopago_access_token || '';
    const publicKey = paymentMethods?.mercadopago_public_key || '';
    return accessToken.startsWith('TEST-') || publicKey.startsWith('TEST-');
  }, [effectiveSettings]);

  const availablePaymentMethods = React.useMemo(() => {
    if (checkoutType === 'whatsapp_only' || !hasMercadoPagoCredentials) {
      return [];
    }

    const methods = [];
    if (effectiveSettings?.payment_methods?.pix) {
      methods.push({ 
        id: 'pix', 
        name: 'PIX', 
        icon: Smartphone,
        description: 'Pagamento instantâneo'
      });
    }
    if (effectiveSettings?.payment_methods?.credit_card) {
      methods.push({ 
        id: 'credit_card', 
        name: 'Cartão de Crédito', 
        icon: CreditCard,
        description: 'Parcelamento em até 12x'
      });
    }
    if (effectiveSettings?.payment_methods?.bank_slip) {
      methods.push({ 
        id: 'bank_slip', 
        name: 'Boleto Bancário', 
        icon: FileText,
        description: 'Vencimento em 3 dias úteis'
      });
    }
    
    return methods;
  }, [effectiveSettings, hasMercadoPagoCredentials, checkoutType]);

  const availableShippingMethods = React.useMemo(() => {
    const methods = [];
    if (effectiveSettings?.shipping_options?.pickup) {
      methods.push({ 
        id: 'pickup', 
        name: 'Retirar na Loja', 
        cost: 0, 
        icon: MapPin 
      });
    }
    if (effectiveSettings?.shipping_options?.delivery) {
      methods.push({ 
        id: 'delivery', 
        name: 'Entrega Local', 
        cost: effectiveSettings.shipping_options.delivery_fee || 0, 
        icon: Truck 
      });
    }
    if (effectiveSettings?.shipping_options?.shipping) {
      methods.push({ 
        id: 'shipping', 
        name: 'Correios', 
        cost: 0, 
        icon: Truck 
      });
    }
    return methods;
  }, [effectiveSettings]);

  // Definir métodos padrão
  React.useEffect(() => {
    if (availablePaymentMethods.length > 0) {
      setPaymentMethod(availablePaymentMethods[0].id);
    }
    if (availableShippingMethods.length > 0) {
      setShippingMethod(availableShippingMethods[0].id);
    }
  }, [availablePaymentMethods, availableShippingMethods]);

  // Definir tipo de checkout padrão baseado nas opções disponíveis
  React.useEffect(() => {
    if (availableOptions.length > 0) {
      setCheckoutType(defaultOption as 'whatsapp_only' | 'online_payment');
    }
  }, [availableOptions, defaultOption]);

  const value: CheckoutContextType = {
    // Estado
    customerData,
    setCustomerData,
    checkoutType,
    setCheckoutType,
    shippingMethod,
    setShippingMethod,
    paymentMethod,
    setPaymentMethod,
    shippingAddress,
    setShippingAddress,
    shippingCost,
    setShippingCost,
    notes,
    setNotes,
    currentStep,
    setCurrentStep,
    createdOrder,
    setCreatedOrder,
    shippingOptions,
    setShippingOptions,

    // Dados computados
    finalTotal: totalAmount + shippingCost,
    isWhatsappOnly: !canUseOnlinePayment,
    availablePaymentMethods,
    availableShippingMethods,
    isTestEnvironment,
    
    // Hooks integrados
    cartItems,
    totalAmount,
    clearCart,
    createOrderAsync,
    isCreatingOrder,
    toast,
    settings: effectiveSettings,
    catalogLoading,
    checkoutOptions,
    availableOptions,
    defaultOption,
    canUseOnlinePayment,
    hasWhatsAppConfigured,
    
    // Adicionar currentStore
    currentStore,
  };

  return (
    <CheckoutContext.Provider value={value}>
      {children}
    </CheckoutContext.Provider>
  );
};
