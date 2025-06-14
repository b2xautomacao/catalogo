
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

    const { payment_id, order_id, access_token } = await req.json()

    if (!payment_id || !order_id || !access_token) {
      throw new Error('payment_id, order_id e access_token são obrigatórios')
    }

    console.log(`[VERIFY-PAYMENT] Verificando pagamento ${payment_id} para pedido ${order_id}`)

    // Buscar status do pagamento no Mercado Pago
    const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${payment_id}`, {
      headers: {
        'Authorization': `Bearer ${access_token}`,
        'Content-Type': 'application/json'
      }
    })

    if (!mpResponse.ok) {
      const errorText = await mpResponse.text()
      console.error(`[VERIFY-PAYMENT] Erro na API do MP: ${mpResponse.status} - ${errorText}`)
      throw new Error(`Erro na API do Mercado Pago: ${mpResponse.status}`)
    }

    const paymentData = await mpResponse.json()
    
    console.log(`[VERIFY-PAYMENT] Status do pagamento: ${paymentData.status}`)

    // Atualizar pagamento no banco usando a função SQL
    const { data: paymentUpdate, error: updateError } = await supabase
      .rpc('update_payment_from_mercadopago', {
        _order_id: order_id,
        _mp_payment_id: payment_id,
        _mp_status: paymentData.status,
        _mp_response: paymentData
      })

    if (updateError) {
      console.error('[VERIFY-PAYMENT] Erro ao atualizar pagamento:', updateError)
      throw updateError
    }

    console.log(`[VERIFY-PAYMENT] Pagamento atualizado com sucesso`)

    return new Response(
      JSON.stringify({
        success: true,
        payment_status: paymentData.status,
        order_id: order_id,
        payment_id: payment_id,
        payment_data: paymentData
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('[VERIFY-PAYMENT] Erro:', error)
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
