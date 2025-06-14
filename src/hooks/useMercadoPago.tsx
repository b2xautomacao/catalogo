import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useCatalogSettings } from '@/hooks/useCatalogSettings';

interface MercadoPagoItem {
  id: string;
  title: string;
  quantity: number;
  unit_price: number;
  currency_id?: string;
}

interface MercadoPagoCheckout {
  items: MercadoPagoItem[];
  payer: {
    name: string;
    email: string;
    phone: string;
  };
  back_urls: {
    success: string;
    failure: string;
    pending: string;
  };
  auto_return: string;
  notification_url?: string;
  external_reference?: string;
  payment_methods?: {
    excluded_payment_methods?: Array<{ id: string }>;
    excluded_payment_types?: Array<{ id: string }>;
    installments?: number;
  };
  access_token?: string;
}

interface PaymentResult {
  id: string;
  init_point: string;
  sandbox_init_point?: string;
  preference_id: string;
}

export const useMercadoPago = (storeId?: string) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { settings } = useCatalogSettings(storeId);

  const getAccessToken = (): string | null => {
    const paymentMethods = settings?.payment_methods as any;
    const token = paymentMethods?.mercadopago_access_token?.trim();
    return token || null;
  };

  const getPublicKey = (): string | null => {
    const paymentMethods = settings?.payment_methods as any;
    const key = paymentMethods?.mercadopago_public_key?.trim();
    return key || null;
  };

  const isTestEnvironment = (): boolean => {
    const accessToken = getAccessToken();
    const publicKey = getPublicKey();
    return !!((accessToken?.startsWith('TEST-')) || (publicKey?.startsWith('TEST-')));
  };

  const validateCredentials = (): { isValid: boolean; error?: string } => {
    const accessToken = getAccessToken();
    const publicKey = getPublicKey();

    if (!accessToken || !publicKey) {
      return {
        isValid: false,
        error: 'Token de acesso e chave pública do Mercado Pago não configurados. Configure nas configurações de pagamento.'
      };
    }

    if (!accessToken.startsWith('APP_USR-') && !accessToken.startsWith('TEST-')) {
      return {
        isValid: false,
        error: 'Access Token inválido. Deve começar com APP_USR- ou TEST-'
      };
    }

    if (!publicKey.startsWith('APP_USR-') && !publicKey.startsWith('TEST-')) {
      return {
        isValid: false,
        error: 'Public Key inválida. Deve começar com APP_USR- ou TEST-'
      };
    }

    // Verificar se ambos são do mesmo ambiente
    const tokenIsTest = accessToken.startsWith('TEST-');
    const keyIsTest = publicKey.startsWith('TEST-');

    if (tokenIsTest !== keyIsTest) {
      return {
        isValid: false,
        error: 'Access Token e Public Key devem ser do mesmo ambiente (ambos de teste ou ambos de produção)'
      };
    }

    return { isValid: true };
  };

  const getReturnUrls = (orderId: string) => {
    const baseUrl = window.location.origin;
    const orderParam = `external_reference=${orderId}`;
    
    return {
      success: `${baseUrl}/payment-success?${orderParam}`,
      failure: `${baseUrl}/payment-failure?${orderParam}`,
      pending: `${baseUrl}/payment-pending?${orderParam}`
    };
  };

  const createCheckout = async (checkoutData: Omit<MercadoPagoCheckout, 'access_token'>): Promise<PaymentResult | null> => {
    try {
      setLoading(true);
      setError(null);
      
      // Validar credenciais antes de prosseguir
      const validation = validateCredentials();
      if (!validation.isValid) {
        throw new Error(validation.error);
      }

      const accessToken = getAccessToken()!;
      
      // Configurar URLs de retorno baseadas no external_reference
      const orderId = checkoutData.external_reference;
      if (orderId) {
        checkoutData.back_urls = getReturnUrls(orderId);
        checkoutData.auto_return = 'approved';
        
        // Configurar webhook URL para notificações automáticas
        const webhookUrl = `${window.location.origin.replace('https://preview--', 'https://').replace('.lovable.app', '.supabase.co')}/functions/v1/mercadopago-webhook`;
        checkoutData.notification_url = webhookUrl;
      }
      
      console.log('🚀 Criando checkout no Mercado Pago:', {
        environment: isTestEnvironment() ? 'TEST' : 'PRODUCTION',
        itemsCount: checkoutData.items.length,
        totalAmount: checkoutData.items.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0),
        back_urls: checkoutData.back_urls,
        notification_url: checkoutData.notification_url
      });
      
      const checkoutWithToken = {
        ...checkoutData,
        access_token: accessToken
      };
      
      const { data, error: functionError } = await supabase.functions.invoke('mercadopago-checkout', {
        body: checkoutWithToken
      });

      if (functionError) {
        console.error('❌ Erro na edge function:', functionError);
        
        // Traduzir erros comuns
        let userFriendlyError = functionError.message;
        if (functionError.message.includes('Invalid access_token')) {
          userFriendlyError = 'Token de acesso inválido. Verifique suas credenciais nas configurações.';
        } else if (functionError.message.includes('unauthorized')) {
          userFriendlyError = 'Credenciais não autorizadas. Verifique se o token está ativo.';
        }
        
        setError(userFriendlyError);
        throw new Error(userFriendlyError);
      }

      if (!data) {
        throw new Error('Nenhum dado retornado da API do Mercado Pago');
      }

      console.log('✅ Checkout criado com sucesso:', {
        preferenceId: data.preference_id,
        environment: isTestEnvironment() ? 'TEST' : 'PRODUCTION'
      });
      
      return data;
    } catch (error) {
      console.error('❌ Erro no checkout Mercado Pago:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido ao processar pagamento';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const openCheckout = async (checkoutData: Omit<MercadoPagoCheckout, 'access_token'>) => {
    const result = await createCheckout(checkoutData);
    if (result?.init_point) {
      // Usar sandbox_init_point se estiver em ambiente de teste
      const checkoutUrl = isTestEnvironment() && result.sandbox_init_point 
        ? result.sandbox_init_point 
        : result.init_point;
      
      window.open(checkoutUrl, '_blank');
      return result;
    }
    return null;
  };

  return {
    createCheckout,
    openCheckout,
    createPixPayment: async (checkoutData: Omit<MercadoPagoCheckout, 'payment_methods' | 'access_token'>) => {
      const pixCheckoutData: Omit<MercadoPagoCheckout, 'access_token'> = {
        ...checkoutData,
        payment_methods: {
          excluded_payment_types: [
            { id: 'credit_card' },
            { id: 'debit_card' },
            { id: 'ticket' }
          ]
        }
      };
      
      return await createCheckout(pixCheckoutData);
    },
    createCardPayment: async (checkoutData: Omit<MercadoPagoCheckout, 'payment_methods' | 'access_token'>) => {
      const cardCheckoutData: Omit<MercadoPagoCheckout, 'access_token'> = {
        ...checkoutData,
        payment_methods: {
          excluded_payment_types: [
            { id: 'pix' },
            { id: 'ticket' }
          ],
          installments: 12
        }
      };
      
      return await createCheckout(cardCheckoutData);
    },
    createBankSlipPayment: async (checkoutData: Omit<MercadoPagoCheckout, 'payment_methods' | 'access_token'>) => {
      const bankSlipCheckoutData: Omit<MercadoPagoCheckout, 'access_token'> = {
        ...checkoutData,
        payment_methods: {
          excluded_payment_types: [
            { id: 'pix' },
            { id: 'credit_card' },
            { id: 'debit_card' }
          ]
        }
      };
      
      return await createCheckout(bankSlipCheckoutData);
    },
    loading,
    error,
    clearError: () => setError(null),
    hasCredentials: !!getAccessToken() && !!getPublicKey(),
    isTestEnvironment: isTestEnvironment(),
    validateCredentials
  };
};
