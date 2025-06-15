
import React from 'react';
import { useCallback } from 'react';
import { generateWhatsAppMessage } from '../checkoutUtils';
import { useStoreData } from '@/hooks/useStoreData';
import { useCheckoutContext } from '../context/CheckoutProvider';
import { usePublicCustomer } from "./usePublicCustomer";
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

  const handleShippingCalculated = useCallback((options: any[]) => {
    setShippingOptions(options);
    
    // Auto-selecionar primeira opção se não houver seleção
    if (options.length > 0 && !shippingMethod) {
      const firstOption = options[0];
      // setShippingMethod será chamado pelo componente pai
      setShippingCost(firstOption.price);
    }
  }, [shippingMethod, setShippingOptions, setShippingCost]);

  const handleShippingMethodChange = useCallback((methodId: string) => {
    const selectedOption = shippingOptions.find(opt => opt.id === methodId);
    if (selectedOption) {
      // Verificar se é frete grátis
      const freeDeliveryAmount = settings?.shipping_options?.free_delivery_amount || 0;
      const isFreeDelivery = freeDeliveryAmount > 0 && 
                           totalAmount >= freeDeliveryAmount && 
                           methodId === 'delivery';
      
      setShippingCost(isFreeDelivery ? 0 : selectedOption.price);
    }
  }, [shippingOptions, settings, totalAmount, setShippingCost]);

  // Envia para o WhatsApp o resumo do pedido, abrindo no navegador do cliente
  const handleWhatsAppCheckout = React.useCallback(
    (order: any) => {
      console.log('🚀 handleWhatsAppCheckout: Iniciando envio para WhatsApp', { order });
      
      // Gera o resumo (já pronto após criar pedido e salvar cliente)
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

      // Gera mensagem de texto formatada (mantém função existente)
      const message = generateWhatsAppMessage(orderData);
      console.log('💬 handleWhatsAppCheckout: Mensagem gerada', message);

      // Telefone da loja - usar múltiplas fontes
      const storePhone = currentStore?.phone || basicStoreData?.phone || settings?.whatsapp_number || '';
      console.log('📞 handleWhatsAppCheckout: Telefone da loja obtido', { 
        currentStore: currentStore?.phone, 
        basicStoreData: basicStoreData?.phone, 
        settings: settings?.whatsapp_number,
        final: storePhone 
      });

      const formattedPhone = storePhone.replace(/\D/g, '');
      const phoneForLink =
        formattedPhone.length >= 10
          ? formattedPhone.startsWith('55')
            ? formattedPhone
            : `55${formattedPhone}`
          : '';

      console.log('📱 handleWhatsAppCheckout: Telefone formatado', { formattedPhone, phoneForLink });

      // Notifica usuário
      toast({
        title: "Pedido enviado!",
        description: "Redirecionando para o WhatsApp da loja.",
        duration: 4000
      });

      setTimeout(() => {
        if (!phoneForLink) {
          console.error('❌ handleWhatsAppCheckout: WhatsApp não configurado');
          toast({
            title: "WhatsApp da loja não configurado",
            description: "A loja não configurou o WhatsApp corretamente.",
            variant: "destructive"
          });
          return;
        }
        
        // Abrir WhatsApp com o resumo do pedido no navegador do cliente
        const whatsappUrl = `https://wa.me/${phoneForLink}?text=${encodeURIComponent(message)}`;
        console.log('🔗 handleWhatsAppCheckout: Abrindo WhatsApp', whatsappUrl);
        window.open(whatsappUrl, '_blank');
      }, 1200);

      clearCart(); // Limpar carrinho ao final
      console.log('🛒 handleWhatsAppCheckout: Carrinho limpo');
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
      clearCart
    ]
  );

  // Função para criar pedido diretamente (público)
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

  // --------- FLUXO PRINCIPAL DE CHECKOUT ---------------
  const handleCreateOrder = React.useCallback(async () => {
    console.log('🚀 handleCreateOrder: Iniciando processo de checkout');
    console.log('📊 handleCreateOrder: Estado atual', {
      customerData,
      cartItems: cartItems.length,
      totalAmount,
      currentStore: currentStore?.id,
      basicStoreData: basicStoreData?.id
    });

    try {
      // Validação básica antes de tudo
      if (!customerData.name.trim()) {
        console.warn('⚠️ handleCreateOrder: Nome não informado');
        toast({
          title: "Nome obrigatório",
          description: "Por favor, informe seu nome.",
          variant: "destructive"
        });
        return;
      }

      // Validação de telefone mais flexível
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

      // Determinar store_id (múltiplas fontes)
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

      // ------- Salvar cliente ANTES de criar pedido -------
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

      // ------- Cria pedido normalmente -------
      toast({
        title: "Criando seu pedido...",
        description: "Só um instante! Preparando para enviar ao WhatsApp...",
      });

      // Corrigir estrutura dos itens - usar product_id em vez de id
      const orderItems = cartItems.map(item => {
        const orderItem = {
          product_id: item.product.id, // CORREÇÃO: usar product_id
          name: item.product.name,
          quantity: item.quantity,
          price: item.price,
          variation: item.variations
            ? `${item.variations.size || ''} ${item.variations.color || ''}`.trim()
            : undefined
        };
        console.log('📦 handleCreateOrder: Item do pedido processado', { original: item, processed: orderItem });
        return orderItem;
      });

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

      // Para checkout público, usar inserção direta
      const savedOrder = await createPublicOrder(orderData);
      setCreatedOrder(savedOrder);

      console.log('✅ handleCreateOrder: Pedido criado com sucesso', savedOrder);

      // Agora trata os fluxos de acordo com o tipo de checkout
      if (checkoutType === "whatsapp_only") {
        // Checkout público: redireciona WhatsApp imediatamente
        console.log('📱 handleCreateOrder: Redirecionando para WhatsApp...');
        handleWhatsAppCheckout(savedOrder);
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
    createPublicOrder
  ]);

  return {
    handleCreateOrder,
    handleWhatsAppCheckout,
    handleShippingCalculated,
    handleShippingMethodChange
  };
};
