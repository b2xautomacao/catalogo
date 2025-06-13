
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from '../_shared/cors.ts'

interface MercadoPagoItem {
  id: string;
  title: string;
  quantity: number;
  unit_price: number;
  currency_id?: string;
}

interface CheckoutRequest {
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

// Helper para logging detalhado
const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[MERCADOPAGO-CHECKOUT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Iniciando criação de checkout");

    const requestBody: CheckoutRequest = await req.json();
    const { items, payer, back_urls, auto_return, notification_url, external_reference, payment_methods, access_token } = requestBody;

    // Usar o access_token enviado pelo frontend ou fallback para variável de ambiente
    const accessToken = access_token || Deno.env.get('MERCADOPAGO_ACCESS_TOKEN');
    
    if (!accessToken) {
      throw new Error('Token de acesso do Mercado Pago não configurado');
    }
    logStep("Token do MP verificado");

    // Validar dados obrigatórios
    if (!items || !items.length) {
      return new Response(
        JSON.stringify({ error: 'Items são obrigatórios' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (!payer || !payer.name || !payer.email) {
      return new Response(
        JSON.stringify({ error: 'Dados do pagador são obrigatórios' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (!back_urls || !back_urls.success || !back_urls.failure) {
      return new Response(
        JSON.stringify({ error: 'URLs de retorno são obrigatórias' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    logStep("Dados validados", { itemsCount: items.length, payerEmail: payer.email });

    // Preparar dados da preferência
    const preferenceData = {
      items: items.map(item => ({
        id: item.id,
        title: item.title,
        quantity: item.quantity,
        unit_price: item.unit_price,
        currency_id: item.currency_id || 'BRL'
      })),
      payer: {
        name: payer.name,
        email: payer.email,
        phone: {
          number: payer.phone.replace(/\D/g, '')
        }
      },
      back_urls,
      auto_return: auto_return || 'approved',
      notification_url,
      external_reference: external_reference || `MP_${Date.now()}`,
      statement_descriptor: "LOJA_ONLINE",
      expires: false,
      binary_mode: false,
      payment_methods: payment_methods || {}
    };

    logStep("Dados da preferência preparados", { 
      external_reference: preferenceData.external_reference,
      total_amount: items.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0)
    });

    // Criar preferência no Mercado Pago
    const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(preferenceData)
    });

    if (!response.ok) {
      const errorText = await response.text();
      logStep("Erro na API do MP", { status: response.status, error: errorText });
      
      let errorMessage = `Erro na API do Mercado Pago: ${response.status}`;
      try {
        const errorData = JSON.parse(errorText);
        if (errorData.message) {
          errorMessage = errorData.message;
        } else if (errorData.cause && errorData.cause.length > 0) {
          errorMessage = errorData.cause[0].description || errorMessage;
        }
      } catch {
        // Se não conseguir parsear, usa a mensagem padrão
      }
      
      throw new Error(errorMessage);
    }

    const preferenceResult = await response.json();
    
    logStep("Preferência criada com sucesso", { 
      id: preferenceResult.id,
      init_point: preferenceResult.init_point ? 'present' : 'missing'
    });

    return new Response(
      JSON.stringify({
        id: preferenceResult.id,
        preference_id: preferenceResult.id,
        init_point: preferenceResult.init_point,
        sandbox_init_point: preferenceResult.sandbox_init_point,
        external_reference: preferenceResult.external_reference
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro interno do servidor';
    logStep("ERRO GERAL", { message: errorMessage });
    
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        details: error instanceof Error ? error.stack : undefined
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
