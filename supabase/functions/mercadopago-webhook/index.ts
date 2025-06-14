
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const body = await req.json()
    console.log('[MP-WEBHOOK] Notificação recebida:', JSON.stringify(body, null, 2))

    // Mercado Pago envia notificações com diferentes tipos
    if (body.type === 'payment') {
      const paymentId = body.data?.id
      
      if (!paymentId) {
        console.log('[MP-WEBHOOK] ID do pagamento não encontrado na notificação')
        return new Response('OK', { status: 200, headers: corsHeaders })
      }

      console.log(`[MP-WEBHOOK] Processando payment_id: ${paymentId}`)

      // Buscar pagamento no banco pelo mercadopago_payment_id
      const { data: existingPayments, error: searchError } = await supabase
        .from('payments')
        .select('order_id, mercadopago_status, status')
        .eq('mercadopago_payment_id', paymentId.toString())

      if (searchError) {
        console.error('[MP-WEBHOOK] Erro ao buscar pagamento:', searchError)
        return new Response('Error', { status: 500, headers: corsHeaders })
      }

      if (!existingPayments || existingPayments.length === 0) {
        console.log(`[MP-WEBHOOK] Pagamento ${paymentId} não encontrado no banco`)
        return new Response('OK', { status: 200, headers: corsHeaders })
      }

      const payment = existingPayments[0]
      console.log(`[MP-WEBHOOK] Pagamento encontrado - Order: ${payment.order_id}, Status atual: ${payment.mercadopago_status}`)

      // Buscar access token das configurações da loja
      const { data: storeSettings, error: storeError } = await supabase
        .from('store_settings')
        .select('payment_methods')
        .limit(1)
        .single()

      if (storeError || !storeSettings) {
        console.error('[MP-WEBHOOK] Erro ao buscar configurações da loja:', storeError)
        return new Response('Error', { status: 500, headers: corsHeaders })
      }

      const accessToken = storeSettings.payment_methods?.mercadopago_access_token
      if (!accessToken) {
        console.error('[MP-WEBHOOK] Access token do MP não configurado')
        return new Response('Error', { status: 500, headers: corsHeaders })
      }

      // Buscar status atualizado do pagamento no Mercado Pago
      console.log(`[MP-WEBHOOK] Consultando API do MP para payment_id: ${paymentId}`)
      const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      })

      if (!mpResponse.ok) {
        const errorText = await mpResponse.text()
        console.error(`[MP-WEBHOOK] Erro na API do MP: ${mpResponse.status} - ${errorText}`)
        return new Response('Error', { status: 500, headers: corsHeaders })
      }

      const paymentData = await mpResponse.json()
      console.log(`[MP-WEBHOOK] Resposta da API MP:`, {
        id: paymentData.id,
        status: paymentData.status,
        status_detail: paymentData.status_detail,
        external_reference: paymentData.external_reference
      })

      // Atualizar apenas se o status mudou
      if (paymentData.status !== payment.mercadopago_status) {
        console.log(`[MP-WEBHOOK] Status mudou de ${payment.mercadopago_status} para ${paymentData.status}`)
        
        // Usar função RPC para atualizar pagamento e processar estoque
        const { data: updateResult, error: updateError } = await supabase
          .rpc('update_payment_from_mercadopago', {
            _order_id: payment.order_id,
            _mp_payment_id: paymentId.toString(),
            _mp_status: paymentData.status,
            _mp_response: paymentData
          })

        if (updateError) {
          console.error('[MP-WEBHOOK] Erro ao atualizar pagamento:', updateError)
          return new Response('Error', { status: 500, headers: corsHeaders })
        }

        console.log(`[MP-WEBHOOK] Pagamento ${paymentId} atualizado com sucesso para status: ${paymentData.status}`)
        
        // Se o pagamento foi aprovado, processar estoque
        if (paymentData.status === 'approved') {
          console.log(`[MP-WEBHOOK] ✅ Pagamento aprovado! Processando estoque para pedido ${payment.order_id}`)
          
          try {
            // Buscar detalhes do pedido para processar estoque
            const { data: orderData, error: orderError } = await supabase
              .from('orders')
              .select('items, store_id')
              .eq('id', payment.order_id)
              .single()

            if (orderError || !orderData) {
              console.error('[MP-WEBHOOK] Erro ao buscar pedido:', orderError)
            } else {
              // Processar cada item do pedido
              const items = Array.isArray(orderData.items) ? orderData.items : []
              
              for (const item of items) {
                const productId = item.product_id || item.id
                if (!productId) continue

                console.log(`[MP-WEBHOOK] Processando estoque para produto ${productId}`)

                // Buscar produto atual
                const { data: product, error: productError } = await supabase
                  .from('products')
                  .select('stock, reserved_stock, name')
                  .eq('id', productId)
                  .single()

                if (productError || !product) {
                  console.error(`[MP-WEBHOOK] Erro ao buscar produto ${productId}:`, productError)
                  continue
                }

                // Confirmar venda (reduzir estoque e reserva)
                const newStock = product.stock - item.quantity
                const newReservedStock = Math.max(0, (product.reserved_stock || 0) - item.quantity)

                const { error: stockUpdateError } = await supabase
                  .from('products')
                  .update({
                    stock: newStock,
                    reserved_stock: newReservedStock,
                    updated_at: new Date().toISOString()
                  })
                  .eq('id', productId)

                if (stockUpdateError) {
                  console.error(`[MP-WEBHOOK] Erro ao atualizar estoque do produto ${productId}:`, stockUpdateError)
                  continue
                }

                // Registrar movimentação de venda
                const { error: movementError } = await supabase
                  .from('stock_movements')
                  .insert({
                    product_id: productId,
                    order_id: payment.order_id,
                    movement_type: 'sale',
                    quantity: item.quantity,
                    previous_stock: product.stock,
                    new_stock: newStock,
                    notes: `Venda confirmada via webhook MercadoPago - Payment ID: ${paymentId}`,
                    store_id: orderData.store_id
                  })

                if (movementError) {
                  console.error(`[MP-WEBHOOK] Erro ao registrar movimentação do produto ${productId}:`, movementError)
                } else {
                  console.log(`[MP-WEBHOOK] ✅ Estoque processado para produto ${product.name}`)
                }
              }

              console.log(`[MP-WEBHOOK] 🎉 Estoque processado completamente para pedido ${payment.order_id}`)
            }
          } catch (stockError) {
            console.error('[MP-WEBHOOK] Erro no processamento de estoque:', stockError)
          }
        }
        
        // Se o pagamento foi rejeitado, liberar reservas
        if (paymentData.status === 'rejected' || paymentData.status === 'cancelled') {
          console.log(`[MP-WEBHOOK] ❌ Pagamento rejeitado/cancelado! Liberando reservas para pedido ${payment.order_id}`)
          
          try {
            // Atualizar status do pedido para cancelado
            await supabase
              .from('orders')
              .update({ 
                status: 'cancelled',
                updated_at: new Date().toISOString()
              })
              .eq('id', payment.order_id)

            // Buscar detalhes do pedido para liberar reservas
            const { data: orderData, error: orderError } = await supabase
              .from('orders')
              .select('items, store_id')
              .eq('id', payment.order_id)
              .single()

            if (orderError || !orderData) {
              console.error('[MP-WEBHOOK] Erro ao buscar pedido para liberação:', orderError)
            } else {
              const items = Array.isArray(orderData.items) ? orderData.items : []
              
              for (const item of items) {
                const productId = item.product_id || item.id
                if (!productId) continue

                // Buscar produto atual
                const { data: product, error: productError } = await supabase
                  .from('products')
                  .select('reserved_stock, name')
                  .eq('id', productId)
                  .single()

                if (productError || !product) {
                  console.error(`[MP-WEBHOOK] Erro ao buscar produto para liberação ${productId}:`, productError)
                  continue
                }

                // Liberar reserva
                const newReservedStock = Math.max(0, (product.reserved_stock || 0) - item.quantity)

                const { error: releaseError } = await supabase
                  .from('products')
                  .update({
                    reserved_stock: newReservedStock,
                    updated_at: new Date().toISOString()
                  })
                  .eq('id', productId)

                if (releaseError) {
                  console.error(`[MP-WEBHOOK] Erro ao liberar reserva do produto ${productId}:`, releaseError)
                  continue
                }

                // Registrar movimentação de liberação
                const { error: movementError } = await supabase
                  .from('stock_movements')
                  .insert({
                    product_id: productId,
                    order_id: payment.order_id,
                    movement_type: 'release',
                    quantity: item.quantity,
                    previous_stock: 0, // Não altera estoque real
                    new_stock: 0,
                    notes: `Reserva liberada - pagamento rejeitado/cancelado via webhook MercadoPago`,
                    store_id: orderData.store_id
                  })

                if (movementError) {
                  console.error(`[MP-WEBHOOK] Erro ao registrar liberação do produto ${productId}:`, movementError)
                } else {
                  console.log(`[MP-WEBHOOK] ✅ Reserva liberada para produto ${product.name}`)
                }
              }

              console.log(`[MP-WEBHOOK] 🔓 Reservas liberadas completamente para pedido ${payment.order_id}`)
            }
          } catch (releaseError) {
            console.error('[MP-WEBHOOK] Erro na liberação de reservas:', releaseError)
          }
        }
      } else {
        console.log(`[MP-WEBHOOK] Status não mudou (${paymentData.status}), ignorando atualização`)
      }
    } else {
      console.log(`[MP-WEBHOOK] Tipo de notificação ignorado: ${body.type}`)
    }

    return new Response('OK', { 
      headers: corsHeaders,
      status: 200 
    })

  } catch (error) {
    console.error('[MP-WEBHOOK] Erro geral:', error)
    return new Response('Error', { 
      headers: corsHeaders,
      status: 500 
    })
  }
})
