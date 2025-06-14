
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
    console.log('[MP-WEBHOOK] Notificação recebida:', JSON.stringify(body))

    // Mercado Pago envia notificações com diferentes tipos
    if (body.type === 'payment') {
      const paymentId = body.data?.id
      
      if (!paymentId) {
        console.log('[MP-WEBHOOK] ID do pagamento não encontrado na notificação')
        return new Response('OK', { status: 200 })
      }

      // Buscar pagamento no banco pelo mercadopago_payment_id
      const { data: existingPayments, error: searchError } = await supabase
        .from('payments')
        .select('order_id, mercadopago_status')
        .eq('mercadopago_payment_id', paymentId.toString())

      if (searchError) {
        console.error('[MP-WEBHOOK] Erro ao buscar pagamento:', searchError)
        return new Response('Error', { status: 500 })
      }

      if (!existingPayments || existingPayments.length === 0) {
        console.log(`[MP-WEBHOOK] Pagamento ${paymentId} não encontrado no banco`)
        return new Response('OK', { status: 200 })
      }

      const payment = existingPayments[0]
      console.log(`[MP-WEBHOOK] Processando atualização para pedido ${payment.order_id}`)

      // Buscar access token das configurações da loja
      const { data: storeSettings, error: storeError } = await supabase
        .from('store_settings')
        .select('payment_methods')
        .limit(1)
        .single()

      if (storeError || !storeSettings) {
        console.error('[MP-WEBHOOK] Erro ao buscar configurações da loja:', storeError)
        return new Response('Error', { status: 500 })
      }

      const accessToken = storeSettings.payment_methods?.mercadopago_access_token
      if (!accessToken) {
        console.error('[MP-WEBHOOK] Access token do MP não configurado')
        return new Response('Error', { status: 500 })
      }

      // Buscar status atualizado do pagamento no Mercado Pago
      const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      })

      if (!mpResponse.ok) {
        console.error(`[MP-WEBHOOK] Erro na API do MP: ${mpResponse.status}`)
        return new Response('Error', { status: 500 })
      }

      const paymentData = await mpResponse.json()
      console.log(`[MP-WEBHOOK] Status atual do pagamento: ${paymentData.status}`)

      // Atualizar apenas se o status mudou
      if (paymentData.status !== payment.mercadopago_status) {
        const { error: updateError } = await supabase
          .rpc('update_payment_from_mercadopago', {
            _order_id: payment.order_id,
            _mp_payment_id: paymentId.toString(),
            _mp_status: paymentData.status,
            _mp_response: paymentData
          })

        if (updateError) {
          console.error('[MP-WEBHOOK] Erro ao atualizar pagamento:', updateError)
          return new Response('Error', { status: 500 })
        }

        console.log(`[MP-WEBHOOK] Pagamento ${paymentId} atualizado para status: ${paymentData.status}`)
      } else {
        console.log(`[MP-WEBHOOK] Status não mudou, ignorando atualização`)
      }
    }

    return new Response('OK', { 
      headers: corsHeaders,
      status: 200 
    })

  } catch (error) {
    console.error('[MP-WEBHOOK] Erro:', error)
    return new Response('Error', { 
      headers: corsHeaders,
      status: 500 
    })
  }
})
