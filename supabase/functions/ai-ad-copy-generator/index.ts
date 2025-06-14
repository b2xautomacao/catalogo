
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  try {
    const { name, category, description } = await req.json()
    if (!name) {
      return new Response(
        JSON.stringify({ error: 'Nome do produto é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    const openaiApiKey = Deno.env.get('OPENAI_KEY')
    if (!openaiApiKey) {
      return new Response(
        JSON.stringify({ error: 'OpenAI API key não configurada' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    const prompt = `
Crie um texto persuasivo para anúncio do produto "${name}"${category ? ` da categoria "${category}"` : ''}. O texto deve ter até 50 palavras, chamar para ação (call to action), usar gatilhos de urgência e exclusividade, focar em conversão para e-commerce brasileiro e ser 100% pronto para uso em anúncios do Facebook/Instagram. Caso haja descrição, utilize como referência: ${description || ''}
Responda apenas com o texto final, não explique nada.
    `
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'Você é especialista em anúncios para e-commerce brasileiro. Gere um texto vendedor, só retorne o texto pedido.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 90,
        temperature: 0.9,
      }),
    })
    const data = await response.json()
    const content = data.choices?.[0]?.message?.content?.trim()
    return new Response(
      JSON.stringify({ content }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Erro interno', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
