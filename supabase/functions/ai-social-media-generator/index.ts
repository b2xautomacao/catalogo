
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
Crie um post para redes sociais (Instagram/Facebook) promovendo o produto "${name}"${category ? ` da categoria "${category}"` : ''}.
O post deve ser empolgante, convidativo, focado em engajamento, pronto para publicação, conter até 50 palavras e chamar o público à ação (ex: comente, curta, aproveite).
Se houver descrição do produto, utilize para contextualizar: ${description || ''}
Responda apenas com o texto final do post.
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
            content: 'Você é um social media especialista em vendas e engajamento no Brasil. Sempre gere posts prontos para uso, só retorne o texto pedido.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 100,
        temperature: 0.85,
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
