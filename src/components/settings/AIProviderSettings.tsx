import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Bot,
  Sparkles,
  Zap,
  Shield,
  Globe,
  CheckCircle,
  AlertCircle,
  Loader2,
  Play,
  Copy,
  Check,
} from "lucide-react";
import { useAIProviders } from "@/hooks/useAIProviders";
import { useToast } from "@/hooks/use-toast";
import { AIProviderType } from "@/types/ai-providers";

const AIProviderSettings = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<AIProviderType>("openai");
  const [isLoading, setIsLoading] = useState(false);
  const [testResults, setTestResults] = useState<
    Record<AIProviderType, boolean | null>
  >({
    openai: null,
    gemini: null,
    anthropic: null,
    custom: null,
  });

  // Estados para teste de IA
  const [testPrompt, setTestPrompt] = useState(
    "Escreva uma descrição curta para um produto de tecnologia."
  );
  const [testResponse, setTestResponse] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  // Para configurações globais, usamos um ID fixo ou null
  const {
    settings,
    loading,
    error,
    updateAISettings,
    updateProviderConfig,
    testProviderConnection,
    generateAIContent,
  } = useAIProviders("global"); // ID fixo para configurações globais

  // Estados para cada provedor
  const [openaiConfig, setOpenaiConfig] = useState({
    api_key: "",
    model: "gpt-3.5-turbo",
    max_tokens: 1000,
    temperature: 0.7,
  });

  const [geminiConfig, setGeminiConfig] = useState({
    api_key: "",
    model: "gemini-pro",
    max_tokens: 1000,
    temperature: 0.7,
  });

  const [anthropicConfig, setAnthropicConfig] = useState({
    api_key: "",
    model: "claude-3-sonnet-20240229",
    max_tokens: 1000,
    temperature: 0.7,
  });

  const [customConfig, setCustomConfig] = useState({
    api_key: "",
    api_endpoint: "",
    model: "custom",
    max_tokens: 1000,
    temperature: 0.7,
  });

  // Carregar configurações quando settings mudar
  useEffect(() => {
    if (settings) {
      if (settings.openai_config) {
        setOpenaiConfig(settings.openai_config);
      }
      if (settings.gemini_config) {
        setGeminiConfig(settings.gemini_config);
      }
      if (settings.anthropic_config) {
        setAnthropicConfig(settings.anthropic_config);
      }
      if (settings.custom_ai_config) {
        setCustomConfig(settings.custom_ai_config);
      }
    }
  }, [settings]);

  // Salvar configurações de um provedor
  const saveProviderConfig = async (provider: AIProviderType) => {
    setIsLoading(true);
    try {
      let config;
      switch (provider) {
        case "openai":
          config = openaiConfig;
          break;
        case "gemini":
          config = geminiConfig;
          break;
        case "anthropic":
          config = anthropicConfig;
          break;
        case "custom":
          config = customConfig;
          break;
      }

      await updateProviderConfig(provider, config);

      toast({
        title: "Configuração salva!",
        description: `Configurações do ${provider.toUpperCase()} foram salvas com sucesso.`,
      });
    } catch (error: any) {
      toast({
        title: "Erro ao salvar",
        description: error.message || "Erro ao salvar configurações",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Testar conexão de um provedor
  const testConnection = async (provider: AIProviderType) => {
    setIsLoading(true);
    try {
      const isConnected = await testProviderConnection(provider);
      setTestResults((prev) => ({ ...prev, [provider]: isConnected }));

      if (isConnected) {
        toast({
          title: "Conexão bem-sucedida!",
          description: `${provider.toUpperCase()} está funcionando corretamente.`,
        });
      } else {
        toast({
          title: "Falha na conexão",
          description: `Não foi possível conectar com ${provider.toUpperCase()}.`,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      setTestResults((prev) => ({ ...prev, [provider]: false }));
      toast({
        title: "Erro no teste",
        description: error.message || "Erro ao testar conexão",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Testar geração de conteúdo
  const testContentGeneration = async () => {
    if (!settings?.default_provider) {
      toast({
        title: "Erro",
        description: "Configure um provedor padrão primeiro",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    setTestResponse("");

    try {
      const response = await generateAIContent({
        provider: settings.default_provider,
        prompt: testPrompt,
        max_tokens: 200,
        temperature: 0.7,
        system_message:
          "Você é um assistente especializado em marketing e vendas. Seja conciso e persuasivo.",
      });

      if (response.success && response.content) {
        setTestResponse(response.content);
        toast({
          title: "Conteúdo gerado!",
          description: `Resposta gerada usando ${settings.default_provider.toUpperCase()}`,
        });
      } else {
        setTestResponse(`Erro: ${response.error}`);
        toast({
          title: "Erro na geração",
          description: response.error || "Erro desconhecido",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      setTestResponse(`Erro: ${error.message}`);
      toast({
        title: "Erro na geração",
        description: error.message || "Erro desconhecido",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Copiar resposta para clipboard
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(testResponse);
      setCopied(true);
      toast({
        title: "Copiado!",
        description: "Resposta copiada para a área de transferência",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: "Erro ao copiar",
        description: "Não foi possível copiar para a área de transferência",
        variant: "destructive",
      });
    }
  };

  // Alterar provedor padrão
  const changeDefaultProvider = async (provider: AIProviderType) => {
    if (!settings) return;

    try {
      await updateAISettings({ default_provider: provider });
      toast({
        title: "Provedor padrão alterado!",
        description: `${provider.toUpperCase()} agora é o provedor padrão para todo o sistema.`,
      });
    } catch (error: any) {
      toast({
        title: "Erro ao alterar",
        description: error.message || "Erro ao alterar provedor padrão",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
        <p className="text-muted-foreground">
          Carregando configurações de IA...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-4" />
        <p className="text-red-600 mb-2">Erro ao carregar configurações</p>
        <p className="text-muted-foreground text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Provedor Padrão */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            Provedor Padrão do Sistema
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              Provedor atual:
            </span>
            <Badge variant="secondary" className="text-lg px-3 py-1">
              {settings?.default_provider?.toUpperCase() || "Nenhum"}
            </Badge>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {(
              ["openai", "gemini", "anthropic", "custom"] as AIProviderType[]
            ).map((provider) => (
              <Button
                key={provider}
                variant={
                  settings?.default_provider === provider
                    ? "default"
                    : "outline"
                }
                size="sm"
                onClick={() => changeDefaultProvider(provider)}
                disabled={isLoading}
              >
                {provider.toUpperCase()}
              </Button>
            ))}
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Esta configuração será aplicada a todas as lojas do sistema
          </p>
        </CardContent>
      </Card>

      {/* Teste de Geração de Conteúdo */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Play className="h-5 w-5" />
            Teste de Geração de Conteúdo
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="test-prompt">Prompt de Teste</Label>
            <Textarea
              id="test-prompt"
              placeholder="Digite um prompt para testar a IA..."
              value={testPrompt}
              onChange={(e) => setTestPrompt(e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex gap-2">
            <Button
              onClick={testContentGeneration}
              disabled={isGenerating || !settings?.default_provider}
              className="flex items-center gap-2"
            >
              {isGenerating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Play className="h-4 w-4" />
              )}
              {isGenerating ? "Gerando..." : "Gerar Conteúdo"}
            </Button>
            {testResponse && (
              <Button
                variant="outline"
                onClick={copyToClipboard}
                className="flex items-center gap-2"
              >
                {copied ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
                {copied ? "Copiado!" : "Copiar"}
              </Button>
            )}
          </div>

          {testResponse && (
            <div className="mt-4">
              <Label>Resposta da IA:</Label>
              <div className="mt-2 p-4 bg-muted rounded-lg border">
                <p className="whitespace-pre-wrap text-sm">{testResponse}</p>
              </div>
            </div>
          )}

          <p className="text-sm text-muted-foreground">
            Este teste usa o provedor padrão configurado acima
          </p>
        </CardContent>
      </Card>

      {/* Configurações dos Provedores */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            Configurações dos Provedores
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs
            value={activeTab}
            onValueChange={(value) => setActiveTab(value as AIProviderType)}
          >
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="openai">
                <Sparkles className="h-4 w-4 mr-2" />
                OpenAI
              </TabsTrigger>
              <TabsTrigger value="gemini">
                <Zap className="h-4 w-4 mr-2" />
                Gemini
              </TabsTrigger>
              <TabsTrigger value="anthropic">
                <Shield className="h-4 w-4 mr-2" />
                Anthropic
              </TabsTrigger>
              <TabsTrigger value="custom">
                <Globe className="h-4 w-4 mr-2" />
                Custom
              </TabsTrigger>
            </TabsList>

            <TabsContent value="openai" className="space-y-4 mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="openai-key">Chave da API OpenAI</Label>
                  <Input
                    id="openai-key"
                    type="password"
                    placeholder="sk-..."
                    value={openaiConfig.api_key}
                    onChange={(e) =>
                      setOpenaiConfig((prev) => ({
                        ...prev,
                        api_key: e.target.value,
                      }))
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="openai-model">Modelo</Label>
                  <Select
                    value={openaiConfig.model}
                    onValueChange={(value) =>
                      setOpenaiConfig((prev) => ({ ...prev, model: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gpt-3.5-turbo">
                        GPT-3.5 Turbo
                      </SelectItem>
                      <SelectItem value="gpt-4">GPT-4</SelectItem>
                      <SelectItem value="gpt-4-turbo">GPT-4 Turbo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="openai-tokens">Máximo de Tokens</Label>
                  <Input
                    id="openai-tokens"
                    type="number"
                    value={openaiConfig.max_tokens}
                    onChange={(e) =>
                      setOpenaiConfig((prev) => ({
                        ...prev,
                        max_tokens: parseInt(e.target.value) || 1000,
                      }))
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="openai-temperature">Temperatura</Label>
                  <Input
                    id="openai-temperature"
                    type="number"
                    step="0.1"
                    min="0"
                    max="2"
                    value={openaiConfig.temperature}
                    onChange={(e) =>
                      setOpenaiConfig((prev) => ({
                        ...prev,
                        temperature: parseFloat(e.target.value) || 0.7,
                      }))
                    }
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => saveProviderConfig("openai")}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  Salvar Configurações
                </Button>
                <Button
                  variant="outline"
                  onClick={() => testConnection("openai")}
                  disabled={isLoading || !openaiConfig.api_key}
                >
                  {testResults.openai === true && (
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  )}
                  {testResults.openai === false && (
                    <AlertCircle className="h-4 w-4 text-red-500 mr-2" />
                  )}
                  Testar Conexão
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="gemini" className="space-y-4 mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="gemini-key">Chave da API Gemini</Label>
                  <Input
                    id="gemini-key"
                    type="password"
                    placeholder="AIza..."
                    value={geminiConfig.api_key}
                    onChange={(e) =>
                      setGeminiConfig((prev) => ({
                        ...prev,
                        api_key: e.target.value,
                      }))
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="gemini-model">Modelo</Label>
                  <Select
                    value={geminiConfig.model}
                    onValueChange={(value) =>
                      setGeminiConfig((prev) => ({ ...prev, model: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gemini-pro">Gemini Pro</SelectItem>
                      <SelectItem value="gemini-pro-vision">
                        Gemini Pro Vision
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="gemini-tokens">Máximo de Tokens</Label>
                  <Input
                    id="gemini-tokens"
                    type="number"
                    value={geminiConfig.max_tokens}
                    onChange={(e) =>
                      setGeminiConfig((prev) => ({
                        ...prev,
                        max_tokens: parseInt(e.target.value) || 1000,
                      }))
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="gemini-temperature">Temperatura</Label>
                  <Input
                    id="gemini-temperature"
                    type="number"
                    step="0.1"
                    min="0"
                    max="2"
                    value={geminiConfig.temperature}
                    onChange={(e) =>
                      setGeminiConfig((prev) => ({
                        ...prev,
                        temperature: parseFloat(e.target.value) || 0.7,
                      }))
                    }
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => saveProviderConfig("gemini")}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  Salvar Configurações
                </Button>
                <Button
                  variant="outline"
                  onClick={() => testConnection("gemini")}
                  disabled={isLoading || !geminiConfig.api_key}
                >
                  {testResults.gemini === true && (
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  )}
                  {testResults.gemini === false && (
                    <AlertCircle className="h-4 w-4 text-red-500 mr-2" />
                  )}
                  Testar Conexão
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="anthropic" className="space-y-4 mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="anthropic-key">Chave da API Anthropic</Label>
                  <Input
                    id="anthropic-key"
                    type="password"
                    placeholder="sk-ant-..."
                    value={anthropicConfig.api_key}
                    onChange={(e) =>
                      setAnthropicConfig((prev) => ({
                        ...prev,
                        api_key: e.target.value,
                      }))
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="anthropic-model">Modelo</Label>
                  <Select
                    value={anthropicConfig.model}
                    onValueChange={(value) =>
                      setAnthropicConfig((prev) => ({ ...prev, model: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="claude-3-haiku-20240307">
                        Claude 3 Haiku
                      </SelectItem>
                      <SelectItem value="claude-3-sonnet-20240229">
                        Claude 3 Sonnet
                      </SelectItem>
                      <SelectItem value="claude-3-opus-20240229">
                        Claude 3 Opus
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="anthropic-tokens">Máximo de Tokens</Label>
                  <Input
                    id="anthropic-tokens"
                    type="number"
                    value={anthropicConfig.max_tokens}
                    onChange={(e) =>
                      setAnthropicConfig((prev) => ({
                        ...prev,
                        max_tokens: parseInt(e.target.value) || 1000,
                      }))
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="anthropic-temperature">Temperatura</Label>
                  <Input
                    id="anthropic-temperature"
                    type="number"
                    step="0.1"
                    min="0"
                    max="2"
                    value={anthropicConfig.temperature}
                    onChange={(e) =>
                      setAnthropicConfig((prev) => ({
                        ...prev,
                        temperature: parseFloat(e.target.value) || 0.7,
                      }))
                    }
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => saveProviderConfig("anthropic")}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  Salvar Configurações
                </Button>
                <Button
                  variant="outline"
                  onClick={() => testConnection("anthropic")}
                  disabled={isLoading || !anthropicConfig.api_key}
                >
                  {testResults.anthropic === true && (
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  )}
                  {testResults.anthropic === false && (
                    <AlertCircle className="h-4 w-4 text-red-500 mr-2" />
                  )}
                  Testar Conexão
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="custom" className="space-y-4 mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="custom-endpoint">Endpoint da API</Label>
                  <Input
                    id="custom-endpoint"
                    placeholder="https://api.exemplo.com/v1/chat"
                    value={customConfig.api_endpoint}
                    onChange={(e) =>
                      setCustomConfig((prev) => ({
                        ...prev,
                        api_endpoint: e.target.value,
                      }))
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="custom-key">Chave da API</Label>
                  <Input
                    id="custom-key"
                    type="password"
                    placeholder="Sua chave"
                    value={customConfig.api_key}
                    onChange={(e) =>
                      setCustomConfig((prev) => ({
                        ...prev,
                        api_key: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="custom-model">Modelo</Label>
                  <Input
                    id="custom-model"
                    placeholder="custom"
                    value={customConfig.model}
                    onChange={(e) =>
                      setCustomConfig((prev) => ({
                        ...prev,
                        model: e.target.value,
                      }))
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="custom-tokens">Máximo de Tokens</Label>
                  <Input
                    id="custom-tokens"
                    type="number"
                    value={customConfig.max_tokens}
                    onChange={(e) =>
                      setCustomConfig((prev) => ({
                        ...prev,
                        max_tokens: parseInt(e.target.value) || 1000,
                      }))
                    }
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="custom-temperature">Temperatura</Label>
                <Input
                  id="custom-temperature"
                  type="number"
                  step="0.1"
                  min="0"
                  max="2"
                  value={customConfig.temperature}
                  onChange={(e) =>
                    setCustomConfig((prev) => ({
                      ...prev,
                      temperature: parseFloat(e.target.value) || 0.7,
                    }))
                  }
                />
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => saveProviderConfig("custom")}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  Salvar Configurações
                </Button>
                <Button
                  variant="outline"
                  onClick={() => testConnection("custom")}
                  disabled={
                    isLoading ||
                    !customConfig.api_key ||
                    !customConfig.api_endpoint
                  }
                >
                  {testResults.custom === true && (
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  )}
                  {testResults.custom === false && (
                    <AlertCircle className="h-4 w-4 text-red-500 mr-2" />
                  )}
                  Testar Conexão
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default AIProviderSettings;
