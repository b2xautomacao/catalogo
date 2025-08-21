# 🤖 Sistema de Provedores de IA

Este sistema permite configurar e gerenciar diferentes provedores de inteligência artificial no dashboard SaaS, oferecendo flexibilidade para escolher entre OpenAI, Google Gemini, Anthropic Claude e APIs customizadas.

## 🚀 Funcionalidades

- **Múltiplos Provedores**: Suporte para OpenAI, Gemini, Anthropic e APIs customizadas
- **Configuração Flexível**: Cada provedor tem suas próprias configurações (chave API, modelo, tokens, temperatura)
- **Provedor Padrão**: Defina qual provedor será usado por padrão em todas as funcionalidades de IA
- **Teste de Conexão**: Verifique se as configurações estão funcionando corretamente
- **Interface Unificada**: Todas as configurações em um local centralizado

## 📋 Provedores Suportados

### 1. OpenAI (GPT)

- **Modelos**: GPT-3.5 Turbo, GPT-4, GPT-4 Turbo
- **Configurações**: Chave API, modelo, máximo de tokens, temperatura
- **Uso**: Geração de conteúdo, análise de texto, conversas

### 2. Google Gemini

- **Modelos**: Gemini Pro, Gemini Pro Vision
- **Configurações**: Chave API, modelo, máximo de tokens, temperatura
- **Uso**: Análise de texto, geração de conteúdo, tarefas criativas

### 3. Anthropic (Claude)

- **Modelos**: Claude 3 Haiku, Claude 3 Sonnet, Claude 3 Opus
- **Configurações**: Chave API, modelo, máximo de tokens, temperatura
- **Uso**: Conversas, análise, geração de conteúdo

### 4. API Customizada

- **Configurações**: Endpoint personalizado, chave API, modelo, tokens, temperatura
- **Uso**: Integração com provedores próprios ou de terceiros

## 🛠️ Configuração

### 1. Acesse as Configurações

- Vá para **Dashboard** → **Configurações** → **Aba IA**

### 2. Configure o Provedor Padrão

- Selecione qual provedor será usado por padrão
- Esta escolha afetará todas as funcionalidades de IA

### 3. Configure Cada Provedor

- **OpenAI**: Adicione sua chave API (sk-...) e escolha o modelo
- **Gemini**: Adicione sua chave API (AIza...) e escolha o modelo
- **Anthropic**: Adicione sua chave API (sk-ant-...) e escolha o modelo
- **Custom**: Configure endpoint e chave da sua API personalizada

### 4. Teste a Conexão

- Use o botão de teste para verificar se as configurações estão funcionando
- O sistema enviará um prompt simples para validar a conexão

## 🔧 Uso no Código

### Hook Principal

```typescript
import { useAIProviders } from "@/hooks/useAIProviders";

const { generateAIContent, settings } = useAIProviders(storeId);
```

### Gerar Conteúdo

```typescript
const response = await generateAIContent({
  provider: "openai", // ou "gemini", "anthropic", "custom"
  prompt: "Seu prompt aqui",
  max_tokens: 1000,
  temperature: 0.7,
  system_message: "Mensagem do sistema",
});
```

### Verificar Configurações

```typescript
if (settings?.default_provider) {
  // Usar provedor padrão
  const response = await generateAIContent({
    provider: settings.default_provider,
    prompt: "Prompt",
  });
}
```

## 📊 Estrutura do Banco de Dados

### Tabela: `ai_provider_settings`

```sql
CREATE TABLE ai_provider_settings (
  id UUID PRIMARY KEY,
  store_id UUID REFERENCES stores(id),
  default_provider TEXT DEFAULT 'openai',

  -- Configurações OpenAI
  openai_config JSONB,

  -- Configurações Gemini
  gemini_config JSONB,

  -- Configurações Anthropic
  anthropic_config JSONB,

  -- Configurações Custom
  custom_ai_config JSONB,

  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

## 🔐 Segurança

- **Row Level Security (RLS)**: Usuários só podem acessar configurações de suas próprias lojas
- **Chaves API Criptografadas**: As chaves são armazenadas de forma segura
- **Validação de Acesso**: Verificação de permissões antes de executar operações

## 🚨 Solução de Problemas

### Erro: "Chave da API não configurada"

- Verifique se a chave foi inserida corretamente
- Confirme se o provedor está ativo

### Erro: "Falha na conexão"

- Verifique se a chave API é válida
- Confirme se o endpoint está correto (para APIs customizadas)
- Teste a conexão usando o botão de teste

### Erro: "Provedor não suportado"

- Verifique se o tipo de provedor está correto
- Confirme se todas as dependências estão instaladas

## 🔄 Migração

Para migrar de um provedor para outro:

1. Configure o novo provedor com suas chaves
2. Teste a conexão
3. Altere o provedor padrão
4. Teste as funcionalidades de IA
5. Remova as configurações antigas se necessário

## 📈 Monitoramento

O sistema registra:

- Provedor usado em cada requisição
- Modelo utilizado
- Uso de tokens (quando disponível)
- Erros e falhas de conexão

## 🎯 Casos de Uso

- **Geração de Descrições**: Produtos, categorias, páginas
- **SEO Automático**: Títulos, meta descriptions, palavras-chave
- **Suporte ao Cliente**: Chatbots, respostas automáticas
- **Análise de Conteúdo**: Resumos, categorização, sentimentos
- **Personalização**: Recomendações, conteúdo dinâmico

## 🤝 Contribuição

Para adicionar novos provedores:

1. Crie os tipos no `src/types/ai-providers.ts`
2. Implemente a lógica no hook `useAIProviders`
3. Adicione a interface no componente `AIProviderSettings`
4. Atualize a documentação

## 📞 Suporte

Em caso de dúvidas ou problemas:

- Verifique os logs do console
- Teste a conexão com o provedor
- Consulte a documentação da API do provedor
- Entre em contato com o suporte técnico
