
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { order_id, webhook_type = 'order_notifications', retry_count = 0 } = await req.json();

    console.log(`📨 N8N Webhook Sender - Order: ${order_id}, Type: ${webhook_type}`);

    // Buscar dados do pedido
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select(`
        *,
        stores (
          id,
          name,
          url_slug
        )
      `)
      .eq('id', order_id)
      .single();

    if (orderError || !order) {
      throw new Error('Order not found');
    }

    // Buscar integração WhatsApp da loja
    const { data: integration, error: integrationError } = await supabase
      .from('whatsapp_integrations')
      .select('instance_name, status, connection_status')
      .eq('store_id', order.store_id)
      .eq('status', 'connected')
      .single();

    if (integrationError || !integration) {
      console.log(`⚠️ WhatsApp not configured for store ${order.store_id}`);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'WhatsApp integration not active for this store'
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Buscar webhook N8N
    const { data: webhook, error: webhookError } = await supabase
      .from('n8n_webhooks')
      .select('webhook_url, is_active')
      .eq('webhook_type', webhook_type)
      .eq('is_active', true)
      .single();

    if (webhookError || !webhook) {
      throw new Error(`N8N webhook for ${webhook_type} not configured`);
    }

    // Preparar payload para N8N
    const n8nPayload = {
      webhook_type,
      order: {
        id: order.id,
        order_number: order.id.slice(0, 8).toUpperCase(),
        status: order.status,
        total_amount: order.total_amount,
        customer_name: order.customer_name,
        customer_phone: order.customer_phone,
        customer_email: order.customer_email,
        items: order.items,
        created_at: order.created_at,
        shipping_address: order.shipping_address
      },
      store: {
        id: order.stores.id,
        name: order.stores.name,
        slug: order.stores.url_slug
      },
      whatsapp: {
        instance_name: integration.instance_name,
        status: integration.status
      },
      retry_count,
      timestamp: new Date().toISOString()
    };

    console.log(`📤 Sending order notification to N8N:`, {
      order_id: order.id,
      instance_name: integration.instance_name,
      webhook_url: webhook.webhook_url
    });

    // Enviar para N8N
    const n8nResponse = await fetch(webhook.webhook_url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(n8nPayload),
    });

    if (!n8nResponse.ok) {
      const errorText = await n8nResponse.text();
      console.error(`❌ N8N webhook failed: ${n8nResponse.status} - ${errorText}`);
      
      // Retry logic (máximo 3 tentativas)
      if (retry_count < 3) {
        console.log(`🔄 Retrying... Attempt ${retry_count + 1}`);
        
        // Aguardar um pouco antes de tentar novamente
        await new Promise(resolve => setTimeout(resolve, 2000 * (retry_count + 1)));
        
        // Chamada recursiva para retry
        return await fetch(req.url, {
          method: 'POST',
          headers: req.headers,
          body: JSON.stringify({ order_id, webhook_type, retry_count: retry_count + 1 })
        });
      }
      
      throw new Error(`N8N webhook failed after ${retry_count + 1} attempts`);
    }

    const n8nResult = await n8nResponse.json();
    console.log(`✅ N8N notification sent successfully:`, n8nResult);

    return new Response(
      JSON.stringify({
        success: true,
        order_id,
        webhook_type,
        instance_name: integration.instance_name,
        n8n_result: n8nResult,
        retry_count
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('❌ N8N Webhook Sender Error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
