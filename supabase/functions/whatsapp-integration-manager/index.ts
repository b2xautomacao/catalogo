
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
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    // Verificar autenticação
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Authorization header missing');
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      throw new Error('Invalid token');
    }

    const { action, store_id } = await req.json();

    console.log(`🔧 WhatsApp Integration Manager - Action: ${action}, Store: ${store_id}`);

    // Buscar dados da loja
    const { data: store, error: storeError } = await supabase
      .from('stores')
      .select('id, name, url_slug')
      .eq('id', store_id)
      .single();

    if (storeError || !store) {
      throw new Error('Store not found');
    }

    // Buscar webhook N8N para integração WhatsApp
    const { data: webhook, error: webhookError } = await supabase
      .from('n8n_webhooks')
      .select('webhook_url, is_active')
      .eq('webhook_type', 'whatsapp_integration')
      .eq('is_active', true)
      .single();

    if (webhookError || !webhook) {
      throw new Error('N8N webhook for WhatsApp integration not configured');
    }

    const instance_name = store.url_slug || `store-${store.id.slice(0, 8)}`;

    // Payload para N8N
    const n8nPayload = {
      action,
      store_id: store.id,
      store_name: store.name,
      store_slug: store.url_slug,
      instance_name,
      user_id: user.id,
      timestamp: new Date().toISOString()
    };

    console.log(`📤 Sending to N8N:`, n8nPayload);

    // Enviar para N8N
    const n8nResponse = await fetch(webhook.webhook_url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(n8nPayload),
    });

    if (!n8nResponse.ok) {
      throw new Error(`N8N webhook failed: ${n8nResponse.status}`);
    }

    const n8nResult = await n8nResponse.json();
    console.log(`📥 N8N Response:`, n8nResult);

    // Atualizar ou criar integração no banco
    if (action === 'create' || action === 'connect') {
      const { data: integration, error: integrationError } = await supabase
        .from('whatsapp_integrations')
        .upsert({
          store_id: store.id,
          instance_name,
          status: action === 'connect' ? 'connecting' : 'disconnected',
          evolution_api_url: n8nResult.evolution_api_url || null,
          evolution_api_token: n8nResult.evolution_api_token || null,
          connection_status: 'disconnected',
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'store_id'
        })
        .select()
        .single();

      if (integrationError) {
        console.error('❌ Error upserting integration:', integrationError);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        action,
        instance_name,
        qr_code: n8nResult.qr_code || null,
        status: n8nResult.status || 'processed',
        message: n8nResult.message || 'Action processed successfully'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('❌ WhatsApp Integration Manager Error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
