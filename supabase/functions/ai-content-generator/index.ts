import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      productName,
      category,
      features,
      targetAudience,
      contentType,
      storeId = "global", // Usar configuração global por padrão
    } = await req.json();

    console.log("🤖 AI Content Generator - Request:", {
      productName,
      category,
      contentType,
      storeId,
    });

    // Criar cliente Supabase para acessar as configurações de IA
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("❌ Supabase environment variables not configured");
      return new Response(
        JSON.stringify({
          error: "Configuração do Supabase não encontrada",
          details: "Entre em contato com o administrador",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Buscar configurações de IA do banco
    const { data: aiSettings, error: fetchError } = await supabase
      .from("ai_provider_settings")
      .select("*")
      .eq("store_id", storeId)
      .single();

    if (fetchError || !aiSettings) {
      console.error("❌ AI settings not found:", fetchError);
      return new Response(
        JSON.stringify({
          error: "Configurações de IA não encontradas",
          details: "Configure as integrações de IA no painel administrativo",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Verificar se o provedor padrão está configurado
    if (!aiSettings.default_provider) {
      return new Response(
        JSON.stringify({
          error: "Provedor de IA não configurado",
          details: "Configure um provedor padrão no painel administrativo",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    let systemPrompt = "";
    let userPrompt = "";

    switch (contentType) {
      case "description":
        systemPrompt =
          "Você é um especialista em copywriting para e-commerce. Crie descrições de produtos atrativas, informativas e que convertam vendas. Use um tom profissional mas acessível.";
        userPrompt = `Crie uma descrição detalhada e atrativa para o produto "${productName}" da categoria "${category}". ${
          features ? `Características: ${features}.` : ""
        } ${
          targetAudience ? `Público-alvo: ${targetAudience}.` : ""
        } A descrição deve ser persuasiva, destacar os benefícios do produto e ter entre 100-200 palavras.`;
        break;

      case "title":
        systemPrompt =
          "Você é um especialista em SEO e títulos otimizados para e-commerce.";
        userPrompt = `Crie um título SEO otimizado para o produto "${productName}" da categoria "${category}". O título deve ser atrativo, incluir palavras-chave relevantes e ter até 60 caracteres.`;
        break;

      case "keywords":
        systemPrompt =
          "Você é um especialista em SEO e palavras-chave para e-commerce.";
        userPrompt = `Gere palavras-chave relevantes para SEO do produto "${productName}" da categoria "${category}". ${
          features ? `Características: ${features}.` : ""
        } Retorne uma lista separada por vírgulas com 8-12 palavras-chave relevantes.`;
        break;

      case "adCopy":
        systemPrompt =
          "Você é um especialista em copywriting para anúncios e marketing digital.";
        userPrompt = `Crie um texto de anúncio persuasivo para o produto "${productName}" da categoria "${category}". ${
          features ? `Características: ${features}.` : ""
        } ${
          targetAudience ? `Público-alvo: ${targetAudience}.` : ""
        } O texto deve ser chamativo, incluir emojis e incentivar a compra. Máximo 150 caracteres.`;
        break;

      case "measurements":
        systemPrompt =
          "Você é um assistente técnico de moda e calçados. Crie tabelas de medidas realistas e precisas baseadas no tipo de produto.";
        userPrompt = `Crie uma tabela de medidas detalhada em formato de texto para o produto "${productName}" (Tipo: ${category}). Os tamanhos devem ser compatíveis com o padrão brasileiro. Retorne no formato "P: Altura X, Largura Y | M: Altura Z..." ou similar para calçados.`;
        break;

      case "care_instructions":
        systemPrompt =
          "Você é um especialista em conservação de têxteis e calçados.";
        userPrompt = `Crie instruções de cuidado e lavagem para o produto "${productName}" feito de "${category}". Inclua dicas para aumentar a durabilidade e o que evitar.`;
        break;

      default:
        throw new Error("Tipo de conteúdo não suportado");
    }

    console.log("🤖 Using AI provider:", aiSettings.default_provider);

    let content: string;
    let model: string;

    // Gerar conteúdo usando o provedor configurado
    switch (aiSettings.default_provider) {
      case "openai":
        if (!aiSettings.openai_config?.api_key) {
          throw new Error("Chave da API OpenAI não configurada");
        }

        const openaiResponse = await fetch(
          "https://api.openai.com/v1/chat/completions",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${aiSettings.openai_config.api_key}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: aiSettings.openai_config.model || "gpt-4o-mini",
              messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt },
              ],
              temperature: aiSettings.openai_config.temperature || 0.7,
              max_tokens: aiSettings.openai_config.max_tokens || 500,
            }),
          }
        );

        if (!openaiResponse.ok) {
          const errorText = await openaiResponse.text();
          throw new Error(
            `Erro na API OpenAI: ${openaiResponse.status} - ${errorText}`
          );
        }

        const openaiData = await openaiResponse.json();
        content = openaiData.choices[0].message.content;
        model = openaiData.model;
        break;

      case "gemini":
        if (!aiSettings.gemini_config?.api_key) {
          throw new Error("Chave da API Gemini não configurada");
        }

        const geminiResponse = await fetch(
          `https://generativelanguage.googleapis.com/v1/models/${
            aiSettings.gemini_config.model || "gemini-1.5-pro"
          }:generateContent?key=${aiSettings.gemini_config.api_key}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    {
                      text: `${systemPrompt}\n\n${userPrompt}`,
                    },
                  ],
                },
              ],
              generationConfig: {
                maxOutputTokens: aiSettings.gemini_config.max_tokens || 500,
                temperature: aiSettings.gemini_config.temperature || 0.7,
              },
            }),
          }
        );

        if (!geminiResponse.ok) {
          const errorText = await geminiResponse.text();
          throw new Error(
            `Erro na API Gemini: ${geminiResponse.status} - ${errorText}`
          );
        }

        const geminiData = await geminiResponse.json();
        content = geminiData.candidates[0]?.content?.parts[0]?.text;
        model = aiSettings.gemini_config.model || "gemini-1.5-pro";
        break;

      case "anthropic":
        if (!aiSettings.anthropic_config?.api_key) {
          throw new Error("Chave da API Anthropic não configurada");
        }

        const anthropicResponse = await fetch(
          "https://api.anthropic.com/v1/messages",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-api-key": aiSettings.anthropic_config.api_key,
              "anthropic-version": "2023-06-01",
            },
            body: JSON.stringify({
              model:
                aiSettings.anthropic_config.model || "claude-3-sonnet-20240229",
              max_tokens: aiSettings.anthropic_config.max_tokens || 500,
              temperature: aiSettings.anthropic_config.temperature || 0.7,
              messages: [
                {
                  role: "user",
                  content: `${systemPrompt}\n\n${userPrompt}`,
                },
              ],
            }),
          }
        );

        if (!anthropicResponse.ok) {
          const errorText = await anthropicResponse.text();
          throw new Error(
            `Erro na API Anthropic: ${anthropicResponse.status} - ${errorText}`
          );
        }

        const anthropicData = await anthropicResponse.json();
        content = anthropicData.content[0]?.text;
        model = anthropicData.model;
        break;

      default:
        throw new Error(
          `Provedor de IA não suportado: ${aiSettings.default_provider}`
        );
    }

    if (!content) {
      throw new Error("Nenhum conteúdo foi gerado pela IA");
    }

    console.log("✅ Content generated successfully using:", model);

    return new Response(
      JSON.stringify({ content, model, provider: aiSettings.default_provider }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("❌ Error in ai-content-generator:", error);
    return new Response(
      JSON.stringify({
        error: "Erro ao gerar conteúdo com IA",
        details: error.message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
