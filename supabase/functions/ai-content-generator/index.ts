
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      productName, 
      category, 
      features, 
      targetAudience, 
      contentType 
    } = await req.json();

    console.log('🤖 AI Content Generator - Request:', {
      productName,
      category,
      contentType,
      hasApiKey: !!openAIApiKey
    });

    if (!openAIApiKey) {
      console.error('❌ OpenAI API key not found in environment');
      return new Response(JSON.stringify({ 
        error: 'Chave da API OpenAI não configurada',
        details: 'Entre em contato com o administrador para configurar a integração com IA' 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let systemPrompt = '';
    let userPrompt = '';

    switch (contentType) {
      case 'description':
        systemPrompt = 'Você é um especialista em copywriting para e-commerce. Crie descrições de produtos atrativas, informativas e que convertam vendas. Use um tom profissional mas acessível.';
        userPrompt = `Crie uma descrição detalhada e atrativa para o produto "${productName}" da categoria "${category}". ${features ? `Características: ${features}.` : ''} ${targetAudience ? `Público-alvo: ${targetAudience}.` : ''} A descrição deve ser persuasiva, destacar os benefícios do produto e ter entre 100-200 palavras.`;
        break;
        
      case 'title':
        systemPrompt = 'Você é um especialista em SEO e títulos otimizados para e-commerce.';
        userPrompt = `Crie um título SEO otimizado para o produto "${productName}" da categoria "${category}". O título deve ser atrativo, incluir palavras-chave relevantes e ter até 60 caracteres.`;
        break;
        
      case 'keywords':
        systemPrompt = 'Você é um especialista em SEO e palavras-chave para e-commerce.';
        userPrompt = `Gere palavras-chave relevantes para SEO do produto "${productName}" da categoria "${category}". ${features ? `Características: ${features}.` : ''} Retorne uma lista separada por vírgulas com 8-12 palavras-chave relevantes.`;
        break;
        
      case 'adCopy':
        systemPrompt = 'Você é um especialista em copywriting para anúncios e marketing digital.';
        userPrompt = `Crie um texto de anúncio persuasivo para o produto "${productName}" da categoria "${category}". ${features ? `Características: ${features}.` : ''} ${targetAudience ? `Público-alvo: ${targetAudience}.` : ''} O texto deve ser chamativo, incluir emojis e incentivar a compra. Máximo 150 caracteres.`;
        break;
        
      default:
        throw new Error('Tipo de conteúdo não suportado');
    }

    console.log('🤖 Sending request to OpenAI...');

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    console.log('🤖 OpenAI Response Status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ OpenAI API error:', response.status, errorText);
      throw new Error(`Erro na API OpenAI: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;

    console.log('✅ Content generated successfully');

    return new Response(JSON.stringify({ content }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('❌ Error in ai-content-generator:', error);
    return new Response(JSON.stringify({ 
      error: 'Erro ao gerar conteúdo com IA',
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
