
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { useCart } from '@/hooks/useCart';
import { useOrders } from '@/hooks/useOrders';
import { useToast } from '@/hooks/use-toast';
import { useCatalogSettings } from '@/hooks/useCatalogSettings';
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
  checkoutOptions: any[];
  availableOptions: any[];
  defaultOption: string;
  canUseOnlinePayment: boolean;
  hasWhatsAppConfigured: boolean;
  
  // Store data (público ou autenticado)
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
  storeData?: any;
}

export const CheckoutProvider: React.FC<CheckoutProviderProps> = ({
  children,
  storeId,
  storeSettings,
  storeData
}) => {
  const { items: cartItems, totalAmount, clearCart } = useCart();
  const { createOrderAsync, isCreatingOrder } = useOrders();
  const { settings, loading: catalogLoading } = useCatalogSettings(storeId);
  const { toast } = useToast();
  const { currentStore: authenticatedStore } = useStores();

  // Preferir storeData (catálogo público), senão o contexto autenticado
  const currentStore = storeData || authenticatedStore;

  // Estado local
  const [customerData, setCustomerData] = useState<CustomerData>({
    name: '',
    email: '',
    phone: ''
  });

  const [checkoutType] = useState<'whatsapp_only' | 'online_payment'>('whatsapp_only');
  const [shippingMethod] = useState('pickup');
  const [paymentMethod] = useState('whatsapp');
  const [shippingAddress, setShippingAddress] = useState<ShippingAddress>({
    zipCode: '',
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: ''
  });

  const [shippingCost] = useState(0);
  const [notes, setNotes] = useState('');
  const [currentStep, setCurrentStep] = useState<'checkout' | 'payment'>('checkout');
  const [createdOrder, setCreatedOrder] = useState<any>(null);
  const [shippingOptions, setShippingOptions] = useState<any[]>([]);

  // Unir as configurações
  const effectiveSettings = settings || storeSettings || {};

  // Para checkout público, sempre usar apenas WhatsApp
  const isWhatsappOnly = true;
  const canUseOnlinePayment = false;
  const hasWhatsAppConfigured = true;
  const isTestEnvironment = false;

  // Métodos vazios para compatibilidade
  const availablePaymentMethods: any[] = [];
  const availableShippingMethods = [{ id: 'pickup', label: 'Retirar na loja' }];
  const checkoutOptions = [{ key: 'whatsapp_only', label: 'WhatsApp', type: 'whatsapp_only' as const }];
  const availableOptions = ['whatsapp_only'];
  const defaultOption = 'whatsapp_only';

  const value: CheckoutContextType = {
    // Estado
    customerData,
    setCustomerData,
    checkoutType,
    setCheckoutType: () => {}, // não-op para checkout público
    shippingMethod,
    setShippingMethod: () => {}, // não-op para checkout público
    paymentMethod,
    setPaymentMethod: () => {}, // não-op para checkout público
    shippingAddress,
    setShippingAddress,
    shippingCost,
    setShippingCost: () => {}, // não-op para checkout público
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
    isWhatsappOnly,
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
    
    // Store data
    currentStore,
  };

  return (
    <CheckoutContext.Provider value={value}>
      {children}
    </CheckoutContext.Provider>
  );
};
