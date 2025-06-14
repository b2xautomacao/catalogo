
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
    const { name, category } = await req.json()
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
Gere de 5 a 10 hashtags estratégicas, em formato pronto para uso no Instagram, Facebook e TikTok, relacionadas ao produto "${name}"${category ? ` da categoria "${category}"` : ''}. Comece cada hashtag com #. Apenas o texto das hashtags, separados por espaço.
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
            content: 'Você é um especialista em social media para vendas online no Brasil. Sempre gere hashtags estratégicas para maximizar alcance, somente o texto pedido.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 80,
        temperature: 0.8,
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
