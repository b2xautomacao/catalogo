import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Smartphone, CreditCard, FileText, MapPin, Truck } from 'lucide-react';
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
  storeData?: any; // Dados da loja no contexto público
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

  // Estado local, definir tudo logo no início!
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

  // Lógica para identificar Whatsapp, pagamentos e métodos
  const whatsAppNumber = settings?.whatsapp_number?.trim() || currentStore?.phone?.trim() || '';
  const hasWhatsAppConfigured = Boolean(whatsAppNumber);

  // Unir as configurações
  const effectiveSettings = settings || storeSettings || {};

  // Teste de amb. de teste
  const isTestEnvironment = React.useMemo(() => {
    const paymentMethods = effectiveSettings?.payment_methods;
    const accessToken = paymentMethods?.mercadopago_access_token || '';
    const publicKey = paymentMethods?.mercadopago_public_key || '';
    return accessToken.startsWith('TEST-') || publicKey.startsWith('TEST-');
  }, [effectiveSettings]);

  // Verifica se há credenciais MercadoPago
  const hasMercadoPagoCredentials = React.useMemo(() => {
    if (catalogLoading || !effectiveSettings || checkoutType === 'whatsapp_only') {
      return false;
    }
    const paymentMethods = effectiveSettings?.payment_methods;
    return !!(paymentMethods?.mercadopago_access_token?.trim() && paymentMethods?.mercadopago_public_key?.trim());
  }, [effectiveSettings, catalogLoading, checkoutType]);

  // Pode usar pagamento online?
  const canUseOnlinePayment = React.useMemo(() => {
    const paymentMethods = effectiveSettings?.payment_methods || {};
    return (
      hasMercadoPagoCredentials &&
      (paymentMethods?.pix || paymentMethods?.credit_card || paymentMethods?.bank_slip)
    );
  }, [effectiveSettings, hasMercadoPagoCredentials]);

  // Métodos de pagamento disponíveis (usando configurações)
  const availablePaymentMethods = React.useMemo(() => {
    const paymentMethods = effectiveSettings?.payment_methods || {};
    const list: any[] = [];
    if (paymentMethods?.pix) list.push({ id: 'pix', label: 'Pix' });
    if (paymentMethods?.credit_card) list.push({ id: 'credit_card', label: 'Cartão de Crédito' });
    if (paymentMethods?.bank_slip) list.push({ id: 'bank_slip', label: 'Boleto Bancário' });
    return list;
  }, [effectiveSettings]);

  // Métodos de entrega disponíveis (simulação simples)
  const availableShippingMethods = React.useMemo(() => {
    const shippingConfig = effectiveSettings?.shipping_options || {};
    // Exemplos: retirada, entrega, correios, customizados...
    let list: any[] = [];
    if (shippingConfig?.allow_pickup !== false) {
      list.push({ id: 'pickup', label: 'Retirar na loja' });
    }
    if (shippingConfig?.allow_delivery) {
      list.push({ id: 'delivery', label: 'Entrega (loja)' });
    }
    if (shippingConfig?.allow_mail) {
      list.push({ id: 'mail', label: 'Correios/Transportadora' });
    }
    // ...adicionar mais lógicas conforme necessário
    return list;
  }, [effectiveSettings]);

  // Checkout options e variantes
  const checkoutOptions = React.useMemo(() => {
    const opts: Array<{ key: string; label: string; type: 'whatsapp_only' | 'online_payment' }> = [];
    if (canUseOnlinePayment) {
      opts.push({
        key: 'online_payment',
        label: 'Pagamento Online',
        type: 'online_payment'
      });
    }
    if (hasWhatsAppConfigured) {
      opts.push({
        key: 'whatsapp_only',
        label: 'WhatsApp',
        type: 'whatsapp_only'
      });
    }
    return opts;
  }, [canUseOnlinePayment, hasWhatsAppConfigured]);

  const availableOptions = React.useMemo(() => checkoutOptions.map(opt => opt.type), [checkoutOptions]);
  const defaultOption = React.useMemo(
    () => (canUseOnlinePayment ? 'online_payment' : hasWhatsAppConfigured ? 'whatsapp_only' : ''),
    [canUseOnlinePayment, hasWhatsAppConfigured]
  );

  // Sincronizar seleção de métodos default ao atualizar listas
  React.useEffect(() => {
    if (availablePaymentMethods.length > 0) {
      setPaymentMethod(availablePaymentMethods[0].id);
    }
    if (availableShippingMethods.length > 0) {
      setShippingMethod(availableShippingMethods[0].id);
    }
  }, [availablePaymentMethods, availableShippingMethods]);

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
    
    // Store data (público ou autenticado)
    currentStore,
  };

  return (
    <CheckoutContext.Provider value={value}>
      {children}
    </CheckoutContext.Provider>
  );
};
