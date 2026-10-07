import React, { useState } from 'react';
import {
  Sparkles,
  Bot,
  Key,
  FileCode,
  ShieldAlert,
  CheckCircle2,
  Copy,
  Check,
  ExternalLink,
  ArrowRight,
  ShieldCheck,
  Server,
  Terminal,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { ApiCredentialItem, AgentAuditItem } from '@/hooks/useTenantMcp';
import { MCP_TOOLS, MCP_SCOPES } from '@/lib/mcpDocsRegistry';

interface McpHubOverviewProps {
  credentials: ApiCredentialItem[];
  auditLogs: AgentAuditItem[];
  mcpEndpointUrl: string;
  getQuickConfigSnippet: () => string;
  onNavigateTab: (tab: string) => void;
  onOpenNewCredentialModal: () => void;
}

export const McpHubOverview: React.FC<McpHubOverviewProps> = ({
  credentials,
  auditLogs,
  mcpEndpointUrl,
  getQuickConfigSnippet,
  onNavigateTab,
  onOpenNewCredentialModal,
}) => {
  const { toast } = useToast();
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedConfig, setCopiedConfig] = useState(false);

  const activeCredentialsCount = credentials.filter((c) => c.status === 'ATIVA').length;
  const lastActivity = auditLogs.length > 0 ? auditLogs[0] : null;

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(mcpEndpointUrl);
      setCopiedUrl(true);
      toast({
        title: 'URL copiada!',
        description: 'Endpoint MCP copiado para a área de transferência.',
      });
      setTimeout(() => setCopiedUrl(false), 2000);
    } catch {
      toast({ title: 'Erro ao copiar URL', variant: 'destructive' });
    }
  };

  const handleCopyConfig = async () => {
    try {
      await navigator.clipboard.writeText(getQuickConfigSnippet());
      setCopiedConfig(true);
      toast({
        title: 'Configuração copiada!',
        description: 'Snippet JSON copiado com placeholder de chave seguro.',
      });
      setTimeout(() => setCopiedConfig(false), 2000);
    } catch {
      toast({ title: 'Erro ao copiar configuração', variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 p-8 text-white shadow-xl">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            Model Context Protocol — B2XCATALOGO
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
            Conecte seu catálogo a qualquer IA
          </h1>
          <p className="text-slate-300 text-base sm:text-lg leading-relaxed">
            Use o MCP do B2XCATALOGO para permitir que agentes (Claude, ChatGPT, Codex, Gemini ou automações)
            consultem e operem seu catálogo com permissões estritamente controladas e isolamento por loja.
          </p>

          <div className="flex flex-wrap gap-3 pt-2">
            <Button
              onClick={onOpenNewCredentialModal}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium shadow-md shadow-indigo-900/50"
            >
              <Key className="w-4 h-4 mr-2" />
              + Nova Credencial MCP
            </Button>
            <Button
              variant="outline"
              onClick={() => onNavigateTab('docs')}
              className="bg-slate-800/80 hover:bg-slate-800 text-slate-200 border-slate-700"
            >
              <FileCode className="w-4 h-4 mr-2" />
              Ver Documentação MCP
            </Button>
          </div>
        </div>
      </div>

      {/* Quick Start Flow */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold flex items-center gap-2 text-slate-900">
            <Terminal className="w-5 h-5 text-indigo-600" />
            Fluxo Rápido de Integração (Quick Start)
          </CardTitle>
          <CardDescription>
            Como habilitar sua primeira integração inteligente em 4 passos simples.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex flex-col justify-between">
              <div>
                <span className="w-7 h-7 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center mb-3">
                  1
                </span>
                <h4 className="font-semibold text-slate-800 text-sm mb-1">Gere uma Credencial</h4>
                <p className="text-xs text-slate-600">
                  Crie uma credencial dedicada para cada agente ou ferramenta (1 credencial = 1 agente).
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={onOpenNewCredentialModal}
                className="mt-3 text-xs text-indigo-600 hover:text-indigo-700 p-0 justify-start"
              >
                Gerar agora &rarr;
              </Button>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex flex-col justify-between">
              <div>
                <span className="w-7 h-7 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center mb-3">
                  2
                </span>
                <h4 className="font-semibold text-slate-800 text-sm mb-1">Copie a URL MCP</h4>
                <p className="text-xs text-slate-600">
                  O endpoint remoto HTTP responde sob JSON-RPC 2.0 padrão da especificação MCP.
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopyUrl}
                className="mt-3 text-xs text-indigo-600 hover:text-indigo-700 p-0 justify-start"
              >
                {copiedUrl ? 'URL Copiada!' : 'Copiar URL &rarr;'}
              </Button>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex flex-col justify-between">
              <div>
                <span className="w-7 h-7 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center mb-3">
                  3
                </span>
                <h4 className="font-semibold text-slate-800 text-sm mb-1">Configure sua IA</h4>
                <p className="text-xs text-slate-600">
                  Cole as configurações no Cursor, Claude Desktop, Windsurf, LangChain ou n8n.
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopyConfig}
                className="mt-3 text-xs text-indigo-600 hover:text-indigo-700 p-0 justify-start"
              >
                {copiedConfig ? 'Snippet Copiado!' : 'Copiar Config &rarr;'}
              </Button>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex flex-col justify-between">
              <div>
                <span className="w-7 h-7 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center mb-3">
                  4
                </span>
                <h4 className="font-semibold text-slate-800 text-sm mb-1">Opere com Segurança</h4>
                <p className="text-xs text-slate-600">
                  Seu agente usa 17 ferramentas oficiais sem jamais acessar credenciais do banco.
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onNavigateTab('atividade')}
                className="mt-3 text-xs text-indigo-600 hover:text-indigo-700 p-0 justify-start"
              >
                Ver auditoria &rarr;
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <Card
          className="cursor-pointer hover:border-indigo-300 transition-all shadow-sm"
          onClick={() => onNavigateTab('credenciais')}
        >
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-medium uppercase tracking-wider text-slate-500">
              Credenciais Ativas
            </CardDescription>
            <div className="flex items-center justify-between">
              <span className="text-3xl font-extrabold text-slate-900">{activeCredentialsCount}</span>
              <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Key className="w-5 h-5" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-slate-600">
              {credentials.length === 0
                ? 'Nenhuma credencial gerada ainda.'
                : `${credentials.length} credencial(is) registrada(s).`}
            </p>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:border-indigo-300 transition-all shadow-sm"
          onClick={() => onNavigateTab('docs')}
        >
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-medium uppercase tracking-wider text-slate-500">
              Tools Homologadas
            </CardDescription>
            <div className="flex items-center justify-between">
              <span className="text-3xl font-extrabold text-slate-900">{MCP_TOOLS.length}</span>
              <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Bot className="w-5 h-5" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-slate-600">
              {MCP_SCOPES.length} escopos de segurança disponíveis.
            </p>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:border-indigo-300 transition-all shadow-sm"
          onClick={() => onNavigateTab('atividade')}
        >
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-medium uppercase tracking-wider text-slate-500">
              Última Atividade
            </CardDescription>
            <div className="flex items-center justify-between">
              <span className="text-base font-bold text-slate-900 truncate">
                {lastActivity ? lastActivity.tool_name || lastActivity.event_type : 'Sem registros'}
              </span>
              <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <Server className="w-5 h-5" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-slate-600">
              {lastActivity
                ? new Date(lastActivity.created_at).toLocaleString('pt-BR')
                : 'Aguardando primeira chamada MCP.'}
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-medium uppercase tracking-wider text-slate-500">
              Segurança do Tenant
            </CardDescription>
            <div className="flex items-center justify-between">
              <span className="text-base font-bold text-emerald-600 flex items-center gap-1.5">
                <ShieldCheck className="w-5 h-5 text-emerald-500" />
                Isolado
              </span>
              <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <ShieldAlert className="w-5 h-5" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-slate-600">Zero acesso direto ao banco ou service role.</p>
          </CardContent>
        </Card>
      </div>

      {/* MCP Endpoint Card & Copy snippet */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <CardTitle className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                <Server className="w-5 h-5 text-indigo-600" />
                Endpoint do Servidor MCP
              </CardTitle>
              <CardDescription>
                Use este endereço HTTP para registrar o catálogo no seu cliente de IA preferido.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyUrl}
                className="text-xs font-medium"
              >
                {copiedUrl ? (
                  <>
                    <Check className="w-3.5 h-3.5 mr-1 text-emerald-600" /> Copiado!
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 mr-1" /> Copiar URL
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyConfig}
                className="text-xs font-medium"
              >
                {copiedConfig ? (
                  <>
                    <Check className="w-3.5 h-3.5 mr-1 text-emerald-600" /> Copiado!
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 mr-1" /> Copiar Configuração
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-3 bg-slate-900 text-slate-100 rounded-lg font-mono text-xs flex items-center justify-between overflow-x-auto">
            <span>{mcpEndpointUrl}</span>
            <Badge variant="outline" className="text-[10px] text-emerald-400 border-emerald-500/30 ml-2">
              HTTPS Obrigatório
            </Badge>
          </div>

          <div className="text-xs text-slate-500 leading-relaxed">
            <strong>Dica de Segurança:</strong> Ao colar o snippet de configuração no seu arquivo local
            (ex: <code>claude_desktop_config.json</code> ou Cursor MCP Settings), substitua{' '}
            <code>&lt;COLE_SUA_CHAVE_AQUI&gt;</code> pela API key gerada na aba de Credenciais. Nunca compartilhe a mesma chave entre múltiplos agentes.
          </div>
        </CardContent>
      </Card>

      {/* Security Best Practices */}
      <Card className="border-indigo-100 bg-indigo-50/30 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-indigo-600" />
            Boas Práticas de Segurança
          </CardTitle>
          <CardDescription>
            Diretrizes recomendadas para garantir a integridade do seu catálogo e do estoque.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-slate-700">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
              <span>
                <strong>1 credencial = 1 integração:</strong> Crie chaves separadas para cada agente ou assistente.
              </span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
              <span>
                <strong>Princípio do Menor Privilégio:</strong> Conceda somente os escopos que o agente realmente precisa.
              </span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
              <span>
                <strong>Nunca exponha em frontend público:</strong> Nunca armazene chaves em JavaScript do navegador público.
              </span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
              <span>
                <strong>Nunca comite chaves no Git:</strong> Guarde em variáveis de ambiente locais ou arquivos de config ignorados.
              </span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
              <span>
                <strong>Revogue integrações inativas:</strong> Se um agente não estiver mais em uso, revogue imediatamente.
              </span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
              <span>
                <strong>Rotação Segura:</strong> Em suspeita de vazamento, crie uma nova credencial e revogue a anterior.
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
