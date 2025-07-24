import React, { createContext, useContext, useState, ReactNode } from "react";
import { useCart } from "@/hooks/useCart";
import { useOrders } from "@/hooks/useOrders";
import { useToast } from "@/hooks/use-toast";
import { useCatalogSettings } from "@/hooks/useCatalogSettings";
import { useStores } from "@/hooks/useStores";
import { useCheckoutOptions } from "@/hooks/useCheckoutOptions";

interface CustomerData {
  name: string;
  email: string;
  phone: string;
  zipCode?: string;
  street?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
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
  checkoutType: "whatsapp_only" | "online_payment";
  setCheckoutType: (type: "whatsapp_only" | "online_payment") => void;
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
  currentStep: "checkout" | "payment";
  setCurrentStep: (step: "checkout" | "payment") => void;
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

const CheckoutContext = createContext<CheckoutContextType | undefined>(
  undefined
);

export const useCheckoutContext = () => {
  const context = useContext(CheckoutContext);
  if (!context) {
    throw new Error(
      "useCheckoutContext deve ser usado dentro de CheckoutProvider"
    );
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
  storeData,
}) => {
  const { items: cartItems, totalAmount, clearCart } = useCart();
  const { createOrderAsync, isCreatingOrder } = useOrders();
  const { settings, loading: catalogLoading } = useCatalogSettings(storeId);
  const { toast } = useToast();
  const { currentStore: authenticatedStore } = useStores();

  // Preferir storeData (catálogo público), senão o contexto autenticado
  const currentStore = storeData || authenticatedStore;

  // Usar o hook de opções de checkout para determinar as configurações corretas
  const {
    checkoutOptions,
    availableOptions,
    defaultOption,
    canUseOnlinePayment,
    hasWhatsAppConfigured,
  } = useCheckoutOptions(storeId);

  // Estado local
  const [customerData, setCustomerData] = useState<CustomerData>({
    name: "",
    email: "",
    phone: "",
    zipCode: "",
    street: "",
    number: "",
    complement: "",
    neighborhood: "",
    city: "",
    state: "",
  });

  // Determinar tipo de checkout baseado nas configurações da loja
  const effectiveSettings = settings || storeSettings || {};
  const storeCheckoutType = effectiveSettings.checkout_type || "both";

  // Lógica para determinar se é apenas WhatsApp
  const isWhatsappOnly =
    storeCheckoutType === "whatsapp" ||
    (!canUseOnlinePayment && hasWhatsAppConfigured);

  const [checkoutType, setCheckoutType] = useState<
    "whatsapp_only" | "online_payment"
  >(isWhatsappOnly ? "whatsapp_only" : "online_payment");
  const [shippingMethod, setShippingMethod] = useState("pickup");
  const [paymentMethod, setPaymentMethod] = useState("whatsapp");
  const [shippingAddress, setShippingAddress] = useState<ShippingAddress>({
    zipCode: "",
    street: "",
    number: "",
    complement: "",
    neighborhood: "",
    city: "",
    state: "",
  });

  const [shippingCost, setShippingCost] = useState(0);
  const [notes, setNotes] = useState("");
  const [currentStep, setCurrentStep] = useState<"checkout" | "payment">(
    "checkout"
  );
  const [createdOrder, setCreatedOrder] = useState<any>(null);
  const [shippingOptions, setShippingOptions] = useState<any[]>([]);

  const isTestEnvironment = false;

  // Métodos de pagamento baseados nas configurações da loja
  const availablePaymentMethods = React.useMemo(() => {
    const methods = [];

    if (hasWhatsAppConfigured) {
      methods.push({
        id: "whatsapp",
        name: "WhatsApp",
        icon: "MessageCircle",
      });
    }

    if (canUseOnlinePayment && effectiveSettings.payment_methods) {
      if (effectiveSettings.payment_methods.pix) {
        methods.push({
          id: "pix",
          name: "PIX",
          icon: "QrCode",
        });
      }

      if (effectiveSettings.payment_methods.credit_card) {
        methods.push({
          id: "credit_card",
          name: "Cartão de Crédito",
          icon: "CreditCard",
        });
      }

      if (effectiveSettings.payment_methods.bank_slip) {
        methods.push({
          id: "bank_slip",
          name: "Boleto",
          icon: "FileText",
        });
      }
    }

    return methods;
  }, [effectiveSettings, canUseOnlinePayment, hasWhatsAppConfigured]);

  const availableShippingMethods = [
    { id: "pickup", label: "Retirar na loja" },
    { id: "combine", label: "A combinar" },
  ];

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
