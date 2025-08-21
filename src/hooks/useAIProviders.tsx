import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  AIProviderType,
  AIProviderSettings,
  OpenAIConfig,
  GeminiConfig,
  AnthropicConfig,
  CustomAIConfig,
  AIRequestOptions,
  AIResponse,
} from "@/types/ai-providers";

export const useAIProviders = (storeId: string) => {
  const [settings, setSettings] = useState<AIProviderSettings | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Buscar configurações de IA
  const fetchAISettings = useCallback(async () => {
    if (!storeId) return;

    setLoading(true);
    setError(null);

    try {
      // Por enquanto, usar configurações mockadas até a tabela ser criada
      const defaultSettings: AIProviderSettings = {
        store_id: storeId,
        default_provider: "openai",
        openai_config: {
          api_key: "",
          model: "gpt-3.5-turbo",
          max_tokens: 1000,
          temperature: 0.7,
        },
        gemini_config: {
          api_key: "",
          model: "gemini-pro",
          max_tokens: 1000,
          temperature: 0.7,
        },
        anthropic_config: {
          api_key: "",
          model: "claude-3-sonnet-20240229",
          max_tokens: 1000,
          temperature: 0.7,
        },
        custom_ai_config: {
          api_key: "",
          api_endpoint: "",
          model: "custom",
          max_tokens: 1000,
          temperature: 0.7,
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      setSettings(defaultSettings);
    } catch (err: any) {
      console.error("❌ Erro ao buscar configurações de IA:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [storeId]);

  // Criar configurações de IA
  const createAISettings = async (aiSettings: AIProviderSettings) => {
    try {
      // Por enquanto, apenas atualizar o estado local
      setSettings(aiSettings);
      toast({
        title: "Configurações de IA criadas",
        description: "Configurações padrão foram configuradas com sucesso.",
      });

      return aiSettings;
    } catch (err: any) {
      console.error("❌ Erro ao criar configurações de IA:", err);
      toast({
        title: "Erro ao criar configurações",
        description: err.message,
        variant: "destructive",
      });
      throw err;
    }
  };

  // Atualizar configurações de IA
  const updateAISettings = async (updates: Partial<AIProviderSettings>) => {
    if (!storeId || !settings) return;

    try {
      const updatedSettings = {
        ...settings,
        ...updates,
        updated_at: new Date().toISOString(),
      };

      // Por enquanto, apenas atualizar o estado local
      setSettings(updatedSettings);
      toast({
        title: "Configurações atualizadas",
        description: "Configurações de IA foram atualizadas com sucesso.",
      });

      return updatedSettings;
    } catch (err: any) {
      console.error("❌ Erro ao atualizar configurações de IA:", err);
      toast({
        title: "Erro ao atualizar",
        description: err.message,
        variant: "destructive",
      });
      throw err;
    }
  };

  // Atualizar configuração específica de um provedor
  const updateProviderConfig = async (
    provider: AIProviderType,
    config: OpenAIConfig | GeminiConfig | AnthropicConfig | CustomAIConfig
  ) => {
    if (!storeId || !settings) return;

    const updateKey = `${provider}_config` as keyof AIProviderSettings;
    const updates = {
      [updateKey]: config,
    };

    await updateAISettings(updates);
  };

  // Testar conexão com provedor
  const testProviderConnection = async (
    provider: AIProviderType
  ): Promise<boolean> => {
    if (!settings) return false;

    try {
      // Teste real com cada provedor
      const testPrompt = "Responda apenas com 'OK' para testar a conexão.";
      const response = await generateAIContent({
        provider,
        prompt: testPrompt,
        max_tokens: 10,
        temperature: 0,
      });

      return response.success && response.content?.includes("OK");
    } catch (error) {
      console.error(`❌ Erro ao testar ${provider}:`, error);
      return false;
    }
  };

  // Gerar conteúdo usando IA
  const generateAIContent = async (
    options: AIRequestOptions
  ): Promise<AIResponse> => {
    if (!settings) {
      return {
        success: false,
        error: "Configurações de IA não encontradas",
        provider: options.provider,
      };
    }

    try {
      switch (options.provider) {
        case "openai":
          return await generateOpenAIContent(options);
        case "gemini":
          return await generateGeminiContent(options);
        case "anthropic":
          return await generateAnthropicContent(options);
        case "custom":
          return await generateCustomAIContent(options);
        default:
          return {
            success: false,
            error: `Provedor não suportado: ${options.provider}`,
            provider: options.provider,
          };
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        provider: options.provider,
      };
    }
  };

  // Gerar conteúdo usando OpenAI
  const generateOpenAIContent = async (
    options: AIRequestOptions
  ): Promise<AIResponse> => {
    if (!settings?.openai_config?.api_key) {
      throw new Error("Chave da API OpenAI não configurada");
    }

    const config = settings.openai_config;
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.api_key}`,
      },
      body: JSON.stringify({
        model: options.model || config.model,
        messages: [
          {
            role: "system",
            content:
              options.system_message || "Você é um assistente útil e criativo.",
          },
          {
            role: "user",
            content: options.prompt,
          },
        ],
        max_tokens: options.max_tokens || config.max_tokens,
        temperature: options.temperature ?? config.temperature,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || "Erro na API OpenAI");
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    return {
      success: true,
      content,
      provider: "openai",
      model: data.model,
      usage: data.usage,
    };
  };

  // Gerar conteúdo usando Gemini
  const generateGeminiContent = async (
    options: AIRequestOptions
  ): Promise<AIResponse> => {
    if (!settings?.gemini_config?.api_key) {
      throw new Error("Chave da API Gemini não configurada");
    }

    const config = settings.gemini_config;
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${config.model}:generateContent?key=${config.api_key}`,
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
                  text: `${
                    options.system_message ||
                    "Você é um assistente útil e criativo."
                  }\n\n${options.prompt}`,
                },
              ],
            },
          ],
          generationConfig: {
            maxOutputTokens: options.max_tokens || config.max_tokens,
            temperature: options.temperature ?? config.temperature,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || "Erro na API Gemini");
    }

    const data = await response.json();
    const content = data.candidates[0]?.content?.parts[0]?.text;

    return {
      success: true,
      content,
      provider: "gemini",
      model: config.model,
      usage: {
        prompt_tokens: 0, // Gemini não retorna uso de tokens
        completion_tokens: 0,
        total_tokens: 0,
      },
    };
  };

  // Gerar conteúdo usando Anthropic
  const generateAnthropicContent = async (
    options: AIRequestOptions
  ): Promise<AIResponse> => {
    if (!settings?.anthropic_config?.api_key) {
      throw new Error("Chave da API Anthropic não configurada");
    }

    const config = settings.anthropic_config;
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": config.api_key,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: options.model || config.model,
        max_tokens: options.max_tokens || config.max_tokens,
        temperature: options.temperature ?? config.temperature,
        messages: [
          {
            role: "user",
            content: `${
              options.system_message || "Você é um assistente útil e criativo."
            }\n\n${options.prompt}`,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || "Erro na API Anthropic");
    }

    const data = await response.json();
    const content = data.content[0]?.text;

    return {
      success: true,
      content,
      provider: "anthropic",
      model: data.model,
      usage: data.usage,
    };
  };

  // Gerar conteúdo usando API customizada
  const generateCustomAIContent = async (
    options: AIRequestOptions
  ): Promise<AIResponse> => {
    if (
      !settings?.custom_ai_config?.api_key ||
      !settings?.custom_ai_config?.api_endpoint
    ) {
      throw new Error("Configuração de API customizada incompleta");
    }

    const config = settings.custom_ai_config;
    const response = await fetch(config.api_endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.api_key}`,
      },
      body: JSON.stringify({
        model: options.model || config.model,
        prompt: options.prompt,
        max_tokens: options.max_tokens || config.max_tokens,
        temperature: options.temperature ?? config.temperature,
        system_message: options.system_message,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || "Erro na API customizada");
    }

    const data = await response.json();
    const content = data.content || data.text || data.response;

    return {
      success: true,
      content,
      provider: "custom",
      model: config.model,
      usage: data.usage || {
        prompt_tokens: 0,
        completion_tokens: 0,
        total_tokens: 0,
      },
    };
  };

  // Buscar configurações quando storeId mudar
  useEffect(() => {
    if (storeId) {
      fetchAISettings();
    }
  }, [storeId, fetchAISettings]);

  return {
    settings,
    loading,
    error,
    fetchAISettings,
    updateAISettings,
    updateProviderConfig,
    testProviderConnection,
    generateAIContent,
    generateOpenAIContent,
    generateGeminiContent,
    generateAnthropicContent,
    generateCustomAIContent,
  };
};
