
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🚀 create-public-order: Iniciando criação de pedido público');
    
    // Criar cliente Supabase com service_role para bypass do RLS
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { orderData } = await req.json();
    console.log('📋 create-public-order: Dados recebidos:', {
      customer_name: orderData.customer_name,
      store_id: orderData.store_id,
      items_count: orderData.items?.length,
      total_amount: orderData.total_amount
    });

    // Validações básicas
    if (!orderData.customer_name?.trim()) {
      throw new Error('Nome do cliente é obrigatório');
    }
    
    if (!orderData.items?.length) {
      throw new Error('Pedido deve conter pelo menos um item');
    }

    if (!orderData.store_id) {
      throw new Error('Store ID é obrigatório');
    }

    // Verificar se a loja existe e está ativa
    const { data: store, error: storeError } = await supabase
      .from('stores')
      .select('id, is_active')
      .eq('id', orderData.store_id)
      .eq('is_active', true)
      .single();

    if (storeError || !store) {
      console.error('❌ create-public-order: Loja não encontrada ou inativa:', storeError);
      throw new Error('Loja não encontrada ou inativa');
    }

    console.log('✅ create-public-order: Loja validada:', store.id);

    // Validar todos os produtos antes de criar o pedido
    console.log('🔍 create-public-order: Validando produtos...');
    for (const item of orderData.items) {
      const productId = item.id || item.product_id;
      
      if (!productId) {
        throw new Error(`Item sem ID de produto válido: ${JSON.stringify(item)}`);
      }

      const { data: product, error: productError } = await supabase
        .from('products')
        .select('id, name, stock, reserved_stock, allow_negative_stock, is_active')
        .eq('id', productId)
        .eq('store_id', orderData.store_id)
        .eq('is_active', true)
        .single();

      if (productError || !product) {
        console.error(`❌ create-public-order: Produto não encontrado: ${productId}`, productError);
        throw new Error(`Produto não encontrado ou inativo: ${productId}`);
      }

      const availableStock = (product.stock || 0) - (product.reserved_stock || 0);
      
      if (availableStock < item.quantity && !product.allow_negative_stock) {
        console.error(`❌ create-public-order: Estoque insuficiente para ${product.name}`);
        throw new Error(`Estoque insuficiente para ${product.name}. Disponível: ${availableStock}, Solicitado: ${item.quantity}`);
      }

      console.log(`✅ create-public-order: Produto validado: ${product.name} (${availableStock} disponível)`);
    }

    // Preparar dados do pedido
    const reservationExpires = new Date();
    reservationExpires.setHours(reservationExpires.getHours() + 24); // 24h expiration

    const newOrder = {
      customer_name: orderData.customer_name,
      customer_email: orderData.customer_email || null,
      customer_phone: orderData.customer_phone || null,
      total_amount: orderData.total_amount,
      status: 'pending' as const,
      order_type: orderData.order_type || 'retail' as const,
      items: orderData.items,
      shipping_address: orderData.shipping_address || null,
      shipping_method: orderData.shipping_method || null,
      payment_method: orderData.payment_method || null,
      shipping_cost: orderData.shipping_cost || 0,
      notes: orderData.notes || null,
      store_id: orderData.store_id,
      stock_reserved: false, // Será marcado como true após reserva bem-sucedida
      reservation_expires_at: reservationExpires.toISOString()
    };

    console.log('💾 create-public-order: Inserindo pedido no banco...');

    // Inserir pedido usando service_role (bypass RLS)
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert([newOrder])
      .select()
      .single();

    if (orderError) {
      console.error('❌ create-public-order: Erro ao inserir pedido:', orderError);
      throw new Error(`Erro ao criar pedido: ${orderError.message}`);
    }

    console.log('✅ create-public-order: Pedido criado com sucesso:', order.id);

    // Reservar estoque para cada item
    console.log('📦 create-public-order: Iniciando reserva de estoque...');
    
    let stockReservationSuccess = true;
    const reservationErrors: string[] = [];

    for (const item of orderData.items) {
      try {
        const productId = item.id || item.product_id;
        console.log('🔒 create-public-order: Reservando estoque para produto:', productId);
        
        // Buscar produto atual novamente para garantir dados atualizados
        const { data: product, error: productError } = await supabase
          .from('products')
          .select('stock, reserved_stock, name')
          .eq('id', productId)
          .single();

        if (productError || !product) {
          throw new Error(`Produto não encontrado durante reserva: ${productId}`);
        }

        const availableStock = (product.stock || 0) - (product.reserved_stock || 0);
        
        if (availableStock < item.quantity) {
          throw new Error(`Estoque insuficiente para ${product.name}`);
        }

        // Atualizar estoque reservado
        const { error: updateError } = await supabase
          .from('products')
          .update({ 
            reserved_stock: (product.reserved_stock || 0) + item.quantity 
          })
          .eq('id', productId);

        if (updateError) {
          throw new Error(`Erro ao reservar estoque: ${updateError.message}`);
        }

        // Registrar movimentação de estoque
        const movementData = {
          product_id: productId,
          order_id: order.id,
          movement_type: 'reservation',
          quantity: item.quantity,
          previous_stock: product.stock,
          new_stock: product.stock,
          notes: `Reserva para pedido ${order.id}`,
          store_id: orderData.store_id,
          expires_at: reservationExpires.toISOString()
        };

        const { error: movementError } = await supabase
          .from('stock_movements')
          .insert([movementData]);

        if (movementError) {
          console.error('❌ create-public-order: Erro ao registrar movimentação:', movementError);
          // Não falha o processo, mas registra o erro
          reservationErrors.push(`Erro ao registrar movimentação para ${productId}: ${movementError.message}`);
        } else {
          console.log('✅ create-public-order: Estoque reservado para produto:', productId);
        }
      } catch (error) {
        console.error('❌ create-public-order: Erro na reserva de estoque:', error);
        stockReservationSuccess = false;
        reservationErrors.push(error instanceof Error ? error.message : 'Erro desconhecido');
      }
    }

    // Marcar pedido como tendo estoque reservado (se todas as reservas foram bem-sucedidas)
    if (stockReservationSuccess) {
      await supabase
        .from('orders')
        .update({ stock_reserved: true })
        .eq('id', order.id);
      
      console.log('✅ create-public-order: Estoque totalmente reservado');
    } else {
      console.warn('⚠️ create-public-order: Algumas reservas falharam:', reservationErrors);
    }

    console.log('🎉 create-public-order: Processo concluído com sucesso');

    return new Response(JSON.stringify({ 
      success: true, 
      order: order,
      stockReservationSuccess,
      reservationErrors: reservationErrors.length > 0 ? reservationErrors : undefined
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ create-public-order: Erro geral:', error);
    
    return new Response(JSON.stringify({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Erro interno do servidor' 
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
