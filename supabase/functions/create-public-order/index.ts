
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
    console.log('🚀 create-public-order: Iniciando processamento');
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('❌ Configurações do Supabase ausentes na Edge Function');
      throw new Error('Configuração do servidor incompleta');
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Ler body com segurança
    let body;
    try {
      body = await req.json();
    } catch (e) {
      console.error('❌ Erro ao parsear JSON do body:', e);
      throw new Error('Payload JSON inválido');
    }

    const { orderData } = body;
    
    if (!orderData) {
      console.error('❌ orderData não encontrado no body:', body);
      throw new Error('Dados do pedido não informados');
    }

    console.log('📦 Pedido recebido:', {
      customer: orderData.customer_name,
      store: orderData.store_id,
      total: orderData.total_amount,
      items_count: orderData.items?.length
    });

    // Validações obrigatórias
    if (!orderData.store_id) throw new Error('store_id é obrigatório');
    if (!orderData.customer_name) throw new Error('customer_name é obrigatório');
    if (!orderData.items || !Array.isArray(orderData.items) || orderData.items.length === 0) {
      throw new Error('O pedido deve conter itens');
    }

    // 1. Validar todos os produtos e estoque
    for (const item of orderData.items) {
      const productId = item.id || item.product_id;
      if (!productId) throw new Error('Item sem ID de produto');

      // 🔍 LOG DE DEBUG: Verificando o que está chegando para cada item
      console.log(`📦 Processando item: ${item.product_name} | Var: ${item.variation_id} | Grade: ${item.is_grade}`);

      const { data: product, error: pErr } = await supabase
        .from('products')
        .select('name, stock, reserved_stock, allow_negative_stock, is_active')
        .eq('id', productId)
        .eq('store_id', orderData.store_id)
        .single();

      if (pErr || !product) {
        throw new Error(`Produto não encontrado ou inativo: ${item.product_name || productId}`);
      }

      if (!product.is_active) {
        throw new Error(`Produto indisponível: ${product.name}`);
      }

      // Validar variação se houver
      if (item.variation_id) {
        // 🔍 DETECÇÃO DE GRADE: Mais robusta para evitar falso-negativos
        const productNameNormalized = (product.name || item.product_name || "").toUpperCase();
        const isGradeDetected = item.is_grade === true || 
                                productNameNormalized.includes('GRADE') || 
                                productNameNormalized.includes('(GRADE');

        console.log(`🔍 Verificação do item ${item.product_name || product.name}: is_grade=${item.is_grade}, detectado=${isGradeDetected}`);

        if (isGradeDetected) {
          console.log(`ℹ️ Item identificado como GRADE. Ignorando lookup obrigatório em product_variations.`);
        } else {
          const { data: vData, error: vErr } = await supabase
            .from('product_variations')
            .select('stock, reserved_stock, is_grade')
            .eq('id', item.variation_id)
            .single();

          if (vErr || !vData) {
            // Se falhou o lookup, mas o produto aceita estoque negativo, podemos prosseguir 
            if (product.allow_negative_stock) {
              console.warn(`⚠️ Variação ${item.variation_id} não encontrada para ${product.name}, mas permitindo prosseguir (estoque negativo habilitado).`);
            } else {
              console.error(`❌ Variação não encontrada no banco: ${item.variation_id} para o produto ${product.name}`);
              console.log(`DEBUG: Payload do item:`, JSON.stringify(item));
              throw new Error(`Variação não encontrada para ${product.name}. Por favor, remova o item e adicione novamente.`);
            }
          } else if (vData) {
            // Se encontrou a variação no banco, mas ela é marcada como grade no banco, também tratamos
            if (vData.is_grade) {
              console.log(`ℹ️ Variação ${item.variation_id} marcada como GRADE no banco. Prosseguindo.`);
            } else {
              const avail = (vData.stock || 0) - (vData.reserved_stock || 0);
              if (avail < item.quantity && !product.allow_negative_stock) {
                throw new Error(`Estoque insuficiente para variação de ${product.name}. Disponível: ${avail}, Solicitado: ${item.quantity}`);
              }
            }
          }
        }

      } else {
        // Sem variação: verificar se o produto tem variações de grade cadastradas.
        const { data: gradeVars } = await supabase
          .from('product_variations')
          .select('id')
          .eq('product_id', productId)
          .eq('is_grade', true)
          .limit(1);

        const hasGradeVariations = gradeVars && gradeVars.length > 0;

        if (!hasGradeVariations) {
          const avail = (product.stock || 0) - (product.reserved_stock || 0);
          if (avail < item.quantity && !product.allow_negative_stock) {
            throw new Error(`Estoque insuficiente para ${product.name}. Disponível: ${avail}, Solicitado: ${item.quantity}`);
          }
        }
      }
    }

    // 2. Criar Pedido
    const newOrder = {
      store_id: orderData.store_id,
      customer_name: orderData.customer_name,
      customer_email: orderData.customer_email || null,
      customer_phone: orderData.customer_phone || null,
      total_amount: Number(orderData.total_amount),
      items: orderData.items,
      shipping_address: orderData.shipping_address || null,
      shipping_method: orderData.shipping_method || null,
      payment_method: orderData.payment_method || null,
      shipping_cost: Number(orderData.shipping_cost || 0),
      notes: orderData.notes || null,
      order_type: orderData.order_type || 'retail',
      status: 'pending',
      stock_reserved: false, 
      reservation_expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString()
    };

    console.log('💾 Gravando pedido no banco...');
    const { data: order, error: insErr } = await supabase
      .from('orders')
      .insert([newOrder])
      .select()
      .single();

    if (insErr) {
      console.error('❌ Erro ao inserir pedido:', insErr);
      throw new Error(`Erro de banco: ${insErr.message}`);
    }

    // 3. Reservar estoque
    for (const item of orderData.items) {
      const productId = item.id || item.product_id;
      
      // Só reservar na variação se não for grade e o ID existir
      if (item.variation_id && !item.is_grade) {
        const { data: vFetch } = await supabase.from('product_variations').select('reserved_stock').eq('id', item.variation_id).single();
        if (vFetch) {
          await supabase.from('product_variations').update({ 
            reserved_stock: (vFetch.reserved_stock || 0) + item.quantity 
          }).eq('id', item.variation_id);
        }
      }
      
      // Sempre reservar no produto pai (estatística/controle geral)
      const { data: pFetch } = await supabase.from('products').select('reserved_stock').eq('id', productId).single();
      await supabase.from('products').update({ 
        reserved_stock: (pFetch?.reserved_stock || 0) + item.quantity 
      }).eq('id', productId);
    }

    // Marcar como reservado
    await supabase.from('orders').update({ stock_reserved: true }).eq('id', order.id);

    console.log('✅ Pedido concluído:', order.id);

    return new Response(JSON.stringify({ success: true, data: order }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('🔥 Erro na Edge Function:', error.message);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
