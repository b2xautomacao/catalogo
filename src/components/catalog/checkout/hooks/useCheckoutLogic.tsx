
import React from 'react';
import { useCallback } from 'react';
import { generateWhatsAppMessage } from '../checkoutUtils';
import { useStoreData } from '@/hooks/useStoreData';
import { useCheckoutContext } from '../context/CheckoutProvider';
import { usePublicCustomer } from "./usePublicCustomer";
import { useMobileWhatsApp } from './useMobileWhatsApp';
import { supabase } from '@/integrations/supabase/client';

export const useCheckoutLogic = () => {
  const {
    customerData,
    cartItems,
    totalAmount,
    shippingCost,
    shippingMethod,
    paymentMethod,
    checkoutType,
    shippingAddress,
    notes,
    createOrderAsync,
    clearCart,
    toast,
    setCreatedOrder,
    setCurrentStep,
    setShippingOptions,
    setShippingCost,
    shippingOptions,
    settings,
    currentStore
  } = useCheckoutContext();

  const { store: basicStoreData } = useStoreData();
  const { saveCustomer } = usePublicCustomer();
  const { isMobile, openWhatsApp } = useMobileWhatsApp();

  const handleShippingCalculated = useCallback((options: any[]) => {
    setShippingOptions(options);
    
    if (options.length > 0 && !shippingMethod) {
      const firstOption = options[0];
      setShippingCost(firstOption.price);
    }
  }, [shippingMethod, setShippingOptions, setShippingCost]);

  const handleShippingMethodChange = useCallback((methodId: string) => {
    const selectedOption = shippingOptions.find(opt => opt.id === methodId);
    if (selectedOption) {
      const freeDeliveryAmount = settings?.shipping_options?.free_delivery_amount || 0;
      const isFreeDelivery = freeDeliveryAmount > 0 && 
                           totalAmount >= freeDeliveryAmount && 
                           methodId === 'delivery';
      
      setShippingCost(isFreeDelivery ? 0 : selectedOption.price);
    }
  }, [shippingOptions, settings, totalAmount, setShippingCost]);

  // Função para fechar modal após sucesso
  const handleWhatsAppCheckout = React.useCallback(
    (order: any, onClose?: () => void) => {
      console.log('🚀 handleWhatsAppCheckout: Iniciando envio para WhatsApp', { order, isMobile });
      
      const orderData = {
        customer_name: customerData.name,
        customer_phone: customerData.phone,
        customer_email: customerData.email,
        total_amount: totalAmount + shippingCost,
        items: cartItems.map(item => ({
          name: item.product.name,
          quantity: item.quantity,
          price: item.price,
          variation: item.variations
            ? `${item.variations.size || ''} ${item.variations.color || ''}`.trim()
            : undefined
        })),
        shipping_method: shippingMethod,
        payment_method: 'whatsapp',
        shipping_cost: shippingCost,
        notes: notes
      };

      console.log('📋 handleWhatsAppCheckout: Dados do pedido para WhatsApp', orderData);

      const message = generateWhatsAppMessage(orderData);
      console.log('💬 handleWhatsAppCheckout: Mensagem gerada', message);

      const storePhone = currentStore?.phone || basicStoreData?.phone || settings?.whatsapp_number || '';
      console.log('📞 handleWhatsAppCheckout: Telefone da loja obtido', { 
        currentStore: currentStore?.phone, 
        basicStoreData: basicStoreData?.phone, 
        settings: settings?.whatsapp_number,
        final: storePhone 
      });

      // Notifica usuário com feedback específico para mobile/desktop
      toast({
        title: "Pedido enviado!",
        description: isMobile 
          ? "Abrindo WhatsApp no seu celular..."
          : "Redirecionando para o WhatsApp da loja.",
        duration: 4000
      });

      // Delay menor para mobile
      const redirectDelay = isMobile ? 800 : 1200;

      setTimeout(() => {
        const success = openWhatsApp(storePhone, message);
        
        if (!success) {
          console.error('❌ handleWhatsAppCheckout: WhatsApp não configurado');
          toast({
            title: "WhatsApp da loja não configurado",
            description: "A loja não configurou o WhatsApp corretamente.",
            variant: "destructive"
          });
          return;
        }

        // Fechar modal após sucesso
        if (onClose) {
          console.log('🚪 handleWhatsAppCheckout: Fechando modal');
          setTimeout(() => {
            onClose();
          }, isMobile ? 500 : 1000);
        }

        clearCart();
        console.log('🛒 handleWhatsAppCheckout: Carrinho limpo');
      }, redirectDelay);
    },
    [
      customerData,
      cartItems,
      totalAmount,
      shippingCost,
      shippingMethod,
      notes,
      basicStoreData,
      currentStore,
      settings,
      toast,
      clearCart,
      isMobile,
      openWhatsApp
    ]
  );

  const createPublicOrder = React.useCallback(async (orderData: any) => {
    console.log('🔨 createPublicOrder: Criando pedido público diretamente', orderData);
    
    try {
      const { data, error } = await supabase
        .from('orders')
        .insert([orderData])
        .select()
        .single();

      if (error) {
        console.error('❌ createPublicOrder: Erro na inserção', error);
        throw error;
      }

      console.log('✅ createPublicOrder: Pedido criado com sucesso', data);
      return data;
    } catch (error) {
      console.error('❌ createPublicOrder: Erro geral', error);
      throw error;
    }
  }, []);

  const handleCreateOrder = React.useCallback(async (onClose?: () => void) => {
    console.log('🚀 handleCreateOrder: Iniciando processo de checkout', { isMobile });
    console.log('📊 handleCreateOrder: Estado atual', {
      customerData,
      cartItems: cartItems.length,
      totalAmount,
      currentStore: currentStore?.id,
      basicStoreData: basicStoreData?.id
    });

    try {
      // Validação básica
      if (!customerData.name.trim()) {
        console.warn('⚠️ handleCreateOrder: Nome não informado');
        toast({
          title: "Nome obrigatório",
          description: "Por favor, informe seu nome.",
          variant: "destructive"
        });
        return;
      }

      const phoneNumbers = customerData.phone.replace(/\D/g, '');
      if (!phoneNumbers || phoneNumbers.length < 10) {
        console.warn('⚠️ handleCreateOrder: Telefone inválido', { phone: customerData.phone, numbers: phoneNumbers });
        toast({
          title: "Telefone obrigatório",
          description: "Por favor, informe um telefone válido.",
          variant: "destructive"
        });
        return;
      }

      if (cartItems.length === 0) {
        console.warn('⚠️ handleCreateOrder: Carrinho vazio');
        toast({
          title: "Carrinho vazio",
          description: "Adicione produtos ao carrinho antes de finalizar.",
          variant: "destructive"
        });
        return;
      }

      const storeId = currentStore?.id || basicStoreData?.id;
      console.log('🏪 handleCreateOrder: Store ID determinado', { 
        currentStore: currentStore?.id, 
        basicStoreData: basicStoreData?.id, 
        final: storeId 
      });

      if (!storeId) {
        console.error('❌ handleCreateOrder: Store ID não encontrado');
        toast({
          title: "Erro de configuração",
          description: "Não foi possível identificar a loja. Tente recarregar a página.",
          variant: "destructive"
        });
        return;
      }

      // Salvar cliente ANTES de criar pedido
      console.log('👤 handleCreateOrder: Salvando cliente...');
      const savedCustomer = await saveCustomer({
        name: customerData.name.trim(),
        email: customerData.email?.trim() || undefined,
        phone: customerData.phone.trim(),
        storeId: storeId
      });

      if (!savedCustomer) {
        console.error('❌ handleCreateOrder: Falha ao salvar cliente');
        toast({
          title: "Erro ao salvar cliente",
          description: "Não foi possível salvar os dados do cliente. Tente novamente.",
          variant: "destructive"
        });
        return;
      }

      console.log('✅ handleCreateOrder: Cliente salvo com sucesso', savedCustomer);

      // Loading específico para mobile/desktop
      toast({
        title: "Criando seu pedido...",
        description: isMobile 
          ? "Preparando para abrir WhatsApp..." 
          : "Só um instante! Preparando para enviar ao WhatsApp...",
      });

      const orderItems = cartItems.map(item => ({
        product_id: item.product.id,
        name: item.product.name,
        quantity: item.quantity,
        price: item.price,
        variation: item.variations
          ? `${item.variations.size || ''} ${item.variations.color || ''}`.trim()
          : undefined
      }));

      const orderData = {
        customer_name: customerData.name.trim(),
        customer_email: customerData.email?.trim() || null,
        customer_phone: customerData.phone.trim(),
        status: "pending" as const,
        order_type: cartItems[0]?.catalogType || "retail",
        total_amount: totalAmount + shippingCost,
        items: orderItems,
        shipping_address:
          shippingMethod !== "pickup"
            ? {
                street: shippingAddress.street,
                number: shippingAddress.number,
                district: shippingAddress.neighborhood,
                city: shippingAddress.city,
                state: shippingAddress.state,
                zip_code: shippingAddress.zipCode
              }
            : null,
        shipping_method: shippingMethod,
        payment_method: checkoutType === "whatsapp_only" ? "whatsapp" : paymentMethod,
        shipping_cost: shippingCost,
        notes: notes.trim() || null,
        store_id: storeId
      };

      console.log('📋 handleCreateOrder: Dados finais do pedido', orderData);

      // Criar pedido e aguardar confirmação
      const savedOrder = await createPublicOrder(orderData);
      setCreatedOrder(savedOrder);

      console.log('✅ handleCreateOrder: Pedido criado com sucesso', savedOrder);

      // Tratar fluxos de acordo com o tipo de checkout
      if (checkoutType === "whatsapp_only") {
        console.log('📱 handleCreateOrder: Redirecionando para WhatsApp...');
        handleWhatsAppCheckout(savedOrder, onClose);
      } else if (["pix", "credit_card", "bank_slip"].includes(paymentMethod)) {
        console.log('💳 handleCreateOrder: Redirecionando para pagamento...');
        setCurrentStep("payment");
      }
      
    } catch (error) {
      console.error('❌ handleCreateOrder: Erro geral no processo', error);
      const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
      toast({
        title: "❌ Erro ao criar pedido",
        description: `Não foi possível criar seu pedido: ${errorMessage}. Tente novamente.`,
        variant: "destructive",
        duration: 7000
      });
    }
  }, [
    customerData,
    cartItems,
    totalAmount,
    shippingCost,
    shippingMethod,
    paymentMethod,
    checkoutType,
    shippingAddress,
    notes,
    toast,
    setCreatedOrder,
    setCurrentStep,
    saveCustomer,
    currentStore,
    basicStoreData,
    handleWhatsAppCheckout,
    createPublicOrder,
    isMobile
  ]);

  return {
    handleCreateOrder,
    handleWhatsAppCheckout,
    handleShippingCalculated,
    handleShippingMethodChange,
    isMobile
  };
};
