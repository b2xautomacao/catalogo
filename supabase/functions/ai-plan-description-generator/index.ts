
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { planName, planType, benefits, price } = await req.json();

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key não configurada');
    }

    // Criar contexto baseado nos benefícios selecionados
    const benefitsText = benefits?.map((b: any) => `- ${b.name}: ${b.description || ''}`).join('\n') || '';
    
    const prompt = `
Crie uma descrição poderosa e persuasiva para um plano de assinatura SaaS para um sistema de catálogos online.

Informações do plano:
- Nome: ${planName}
- Tipo: ${planType}
- Preço mensal: R$ ${price}

Benefícios inclusos:
${benefitsText}

A descrição deve:
1. Ter uma headline impactante que desperte interesse
2. Destacar os principais benefícios de forma convincente
3. Usar linguagem persuasiva mas profissional
4. Focar no valor que o plano oferece ao cliente
5. Ter entre 150-250 caracteres para a descrição principal

Formato de resposta:
{
  "headline": "Uma headline poderosa de 60-80 caracteres",
  "description": "Descrição persuasiva completa do plano"
}

Retorne apenas o JSON, sem explicações adicionais.
    `;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { 
            role: 'system', 
            content: 'Você é um especialista em copywriting para SaaS B2B, focado em criar descrições persuasivas que convertem. Sempre retorne respostas em JSON válido.' 
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.8,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      throw new Error(`Erro da OpenAI: ${response.statusText}`);
    }

    const data = await response.json();
    const generatedContent = data.choices[0].message.content;
    
    // Parse do JSON retornado pela IA
    let parsedContent;
    try {
      parsedContent = JSON.parse(generatedContent);
    } catch (e) {
      // Fallback se a IA não retornar JSON válido
      parsedContent = {
        headline: `${planName} - Potencialize seu catálogo online`,
        description: generatedContent
      };
    }

    return new Response(JSON.stringify(parsedContent), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Erro no gerador de descrição:', error);
    return new Response(JSON.stringify({ 
      error: 'Erro ao gerar descrição',
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
