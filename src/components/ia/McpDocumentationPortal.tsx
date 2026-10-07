import React, { useState, useMemo } from 'react';
import {
  FileText,
  Search,
  Copy,
  Check,
  Sparkles,
  Bot,
  Shield,
  Layers,
  AlertCircle,
  Database,
  ArrowRight,
  ExternalLink,
  Code2,
  Lock,
  Clock,
  Server,
  Zap,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import {
  MCP_TOOLS,
  MCP_SCOPES,
  MCP_RATE_LIMITS,
  MCP_ERROR_CATALOG,
  generateMarkdownDocs,
  generateAiGuide,
  McpToolDoc,
} from '@/lib/mcpDocsRegistry';

interface McpDocumentationPortalProps {
  storeName: string;
  mcpEndpointUrl: string;
}

export const McpDocumentationPortal: React.FC<McpDocumentationPortalProps> = ({
  storeName,
  mcpEndpointUrl,
}) => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [copiedMarkdown, setCopiedMarkdown] = useState(false);
  const [copiedAiGuide, setCopiedAiGuide] = useState(false);
  const [copiedToolSnippet, setCopiedToolSnippet] = useState<string | null>(null);

  // Categorias disponíveis
  const categories = useMemo(() => {
    const cats = Array.from(new Set(MCP_TOOLS.map((t) => t.category)));
    return ['all', ...cats];
  }, []);

  // Filtro de ferramentas
  const filteredTools = useMemo(() => {
    return MCP_TOOLS.filter((tool) => {
      const matchesSearch =
        tool.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tool.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tool.requiredScope.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tool.category.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCat = selectedCategory === 'all' || tool.category === selectedCategory;

      return matchesSearch && matchesCat;
    });
  }, [searchTerm, selectedCategory]);

  const handleCopyMarkdown = async () => {
    try {
      const md = generateMarkdownDocs(mcpEndpointUrl);
      await navigator.clipboard.writeText(md);
      setCopiedMarkdown(true);
      toast({
        title: 'Documentação Markdown copiada!',
        description: 'Todo o conteúdo estruturado foi copiado em Markdown limpo.',
      });
      setTimeout(() => setCopiedMarkdown(false), 2000);
    } catch {
      toast({ title: 'Erro ao copiar', variant: 'destructive' });
    }
  };

  const handleCopyAiGuide = async () => {
    try {
      const guide = generateAiGuide({
        storeName,
        endpointUrl: mcpEndpointUrl,
      });
      await navigator.clipboard.writeText(guide);
      setCopiedAiGuide(true);
      toast({
        title: 'Guia para IA copiado!',
        description: 'Prompt enxuto e regras essenciais copiadas para a área de transferência.',
      });
      setTimeout(() => setCopiedAiGuide(false), 2000);
    } catch {
      toast({ title: 'Erro ao copiar', variant: 'destructive' });
    }
  };

  const handleCopyCodeSnippet = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedToolSnippet(id);
      toast({ title: 'Exemplo copiado!' });
      setTimeout(() => setCopiedToolSnippet(null), 2000);
    } catch {
      toast({ title: 'Erro ao copiar', variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header com Ações Centrais */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-slate-900 to-indigo-950 text-white shadow-md">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Badge className="bg-indigo-500/20 text-indigo-300 border-indigo-500/40 text-[10px] uppercase font-semibold">
              Referência Técnica MCP
            </Badge>
            <span className="text-xs text-slate-400">17 Ferramentas Oficiais • 8 Scopes</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white">
            Documentação do Servidor MCP
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl">
            Tudo o que sua inteligência artificial precisa saber para operar sobre o catálogo de produtos, estoque e variações de forma segura e idempotente.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            onClick={handleCopyMarkdown}
            variant="outline"
            className="text-xs bg-slate-800/90 hover:bg-slate-800 text-slate-100 border-slate-700 font-medium"
          >
            {copiedMarkdown ? (
              <>
                <Check className="w-3.5 h-3.5 mr-1.5 text-emerald-400" />
                Copiado!
              </>
            ) : (
              <>
                <FileText className="w-3.5 h-3.5 mr-1.5 text-indigo-400" />
                Copiar Docs em Markdown
              </>
            )}
          </Button>

          <Button
            onClick={handleCopyAiGuide}
            className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-medium shadow-sm"
          >
            {copiedAiGuide ? (
              <>
                <Check className="w-3.5 h-3.5 mr-1.5" />
                Guia Copiado!
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                Copiar Guia para IA
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Tabs Principais da Documentação */}
      <Tabs defaultValue="tools" className="space-y-6">
        <div className="border-b border-slate-200 pb-2">
          <TabsList className="bg-slate-100 p-1 flex flex-wrap h-auto gap-1">
            <TabsTrigger value="tools" className="text-xs data-[state=active]:bg-white">
              Ferramentas ({MCP_TOOLS.length})
            </TabsTrigger>
            <TabsTrigger value="architecture" className="text-xs data-[state=active]:bg-white">
              Arquitetura & Segurança
            </TabsTrigger>
            <TabsTrigger value="scopes" className="text-xs data-[state=active]:bg-white">
              Scopes ({MCP_SCOPES.length})
            </TabsTrigger>
            <TabsTrigger value="ratelimits" className="text-xs data-[state=active]:bg-white">
              Rate Limits
            </TabsTrigger>
            <TabsTrigger value="errors" className="text-xs data-[state=active]:bg-white">
              Erros & Idempotência
            </TabsTrigger>
          </TabsList>
        </div>

        {/* TAB: TOOLS */}
        <TabsContent value="tools" className="space-y-6">
          {/* Busca e Filtro de Categoria */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Buscar ferramenta, parâmetro, escopo ou conceito..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 text-xs"
              />
            </div>
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              {categories.map((cat) => (
                <Button
                  key={cat}
                  variant={selectedCategory === cat ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory(cat)}
                  className={`text-xs h-9 capitalize whitespace-nowrap ${
                    selectedCategory === cat ? 'bg-indigo-600 text-white' : 'text-slate-600'
                  }`}
                >
                  {cat === 'all' ? 'Todas' : cat}
                </Button>
              ))}
            </div>
          </div>

          {/* Lista de Tools Filtradas */}
          <div className="space-y-4">
            {filteredTools.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-500 bg-slate-50 rounded-xl border border-slate-200">
                Nenhuma ferramenta encontrada com os critérios de busca.
              </div>
            ) : (
              filteredTools.map((tool) => (
                <Card key={tool.name} className="border-slate-200 shadow-sm overflow-hidden">
                  <CardHeader className="bg-slate-50/70 border-b border-slate-100 pb-3">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <Code2 className="w-5 h-5 text-indigo-600 flex-shrink-0" />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm font-bold text-slate-900">
                              {tool.name}
                            </span>
                            <Badge
                              variant="outline"
                              className="text-[10px] font-mono bg-indigo-50/50 text-indigo-700 border-indigo-200"
                            >
                              Scope: {tool.requiredScope}
                            </Badge>
                          </div>
                          <p className="text-xs text-slate-600 mt-0.5">{tool.description}</p>
                        </div>
                      </div>
                      <Badge variant="secondary" className="text-[10px] self-start sm:self-center capitalize">
                        {tool.category}
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="pt-4 space-y-4 text-xs">
                    {/* Quando usar */}
                    <div className="p-2.5 rounded bg-slate-50 border border-slate-100 text-slate-700">
                      <strong>Quando usar:</strong> {tool.whenToUse}
                    </div>

                    {/* Parâmetros */}
                    <div className="space-y-2">
                      <span className="font-semibold text-slate-800 uppercase tracking-wider text-[11px] block">
                        Parâmetros da Chamada (Input)
                      </span>
                      <Table>
                        <TableHeader className="bg-slate-50 text-[11px]">
                          <TableRow>
                            <TableHead className="font-semibold w-1/4">Campo</TableHead>
                            <TableHead className="font-semibold w-1/6">Tipo</TableHead>
                            <TableHead className="font-semibold w-1/6">Obrigatório?</TableHead>
                            <TableHead className="font-semibold">Descrição</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody className="text-[11px]">
                          {tool.parameters.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={4} className="text-slate-500 text-center py-2">
                                Esta ferramenta não requer parâmetros de entrada.
                              </TableCell>
                            </TableRow>
                          ) : (
                            tool.parameters.map((p) => (
                              <TableRow key={p.name}>
                                <TableCell className="font-mono font-medium text-slate-900">
                                  {p.name}
                                </TableCell>
                                <TableCell className="font-mono text-slate-600">{p.type}</TableCell>
                                <TableCell>
                                  {p.required ? (
                                    <Badge className="bg-red-50 text-red-700 border-red-200 text-[9px] px-1 py-0">
                                      Sim
                                    </Badge>
                                  ) : (
                                    <span className="text-slate-400">Opcional</span>
                                  )}
                                </TableCell>
                                <TableCell className="text-slate-600">{p.description}</TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>

                    {/* Retorno e Erros */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                      <div className="p-2.5 rounded-lg border border-slate-100 bg-slate-50/50 space-y-1">
                        <span className="font-semibold text-slate-800 block text-[11px]">
                          Retorno com Sucesso (Output):
                        </span>
                        <p className="text-slate-600">{tool.outputDescription}</p>
                      </div>

                      <div className="p-2.5 rounded-lg border border-slate-100 bg-slate-50/50 space-y-1">
                        <span className="font-semibold text-slate-800 block text-[11px]">
                          Erros Conhecidos:
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {tool.errors.map((err) => (
                            <Badge
                              key={err}
                              variant="outline"
                              className="text-[10px] font-mono text-red-600 border-red-200 bg-red-50/40"
                            >
                              {err}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Exemplo de Chamada */}
                    <div className="space-y-1.5 pt-1">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-800 text-[11px]">
                          Exemplo de Chamada JSON-RPC:
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCopyCodeSnippet(JSON.stringify({ tool: tool.name, arguments: tool.exampleRequest }, null, 2), tool.name)}
                          className="h-6 text-[10px] text-indigo-600 hover:text-indigo-700 p-0"
                        >
                          {copiedToolSnippet === tool.name ? 'Copiado!' : 'Copiar Exemplo'}
                        </Button>
                      </div>
                      <pre className="p-3 bg-slate-900 text-slate-200 font-mono text-[11px] rounded-lg overflow-x-auto">
                        {JSON.stringify({ tool: tool.name, arguments: tool.exampleRequest }, null, 2)}
                      </pre>
                    </div>

                    {/* Security Notes */}
                    {tool.securityNotes && (
                      <div className="p-2 rounded bg-amber-50/70 border border-amber-200/60 text-amber-900 text-[11px] flex items-center gap-1.5">
                        <Shield className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                        <span>
                          <strong>Nota de Segurança:</strong> {tool.securityNotes}
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* TAB: ARQUITETURA */}
        <TabsContent value="architecture" className="space-y-6">
          <Card className="border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Shield className="w-5 h-5 text-indigo-600" />
                Princípios de Isolamento e Não-Acesso Direto
              </CardTitle>
              <CardDescription>
                A arquitetura do B2XCATALOGO garante que nenhum modelo de IA toque credenciais brutas ou tabelas sem validação.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5 text-xs text-slate-700 leading-relaxed">
              <div className="p-4 rounded-xl bg-slate-900 text-slate-200 font-mono text-[11px] space-y-2">
                <div className="text-indigo-400 font-bold">// Fluxo Canônico e Seguro de Execução</div>
                <div>LLM / Agente (Claude, ChatGPT, Gemini, Codex, n8n)</div>
                <div className="text-slate-500">  ↓ [HTTP POST com Bearer b2x_live_...]</div>
                <div>MCP Runtime (Validação de Prefixo e Hash SHA-256)</div>
                <div className="text-slate-500">  ↓ [Resolução de Identidade e Permissões]</div>
                <div>AgentContext (PrincipalType, Scopes, StoreAccess)</div>
                <div className="text-slate-500">  ↓ [Guarda de Autorização por Escopo]</div>
                <div>Active Store Resolver (Injeção Forçada de store_id do Tenant)</div>
                <div className="text-slate-500">  ↓ [Operação de Negócio Validada via Zod]</div>
                <div className="text-emerald-400">Domain Services & Inventory Ledger (Audit Log Registrado)</div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-3.5 rounded-lg border border-red-200 bg-red-50/40 space-y-1.5">
                  <span className="font-bold text-red-800 text-xs flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 text-red-600" />
                    O que a IA NUNCA recebe:
                  </span>
                  <ul className="list-disc list-inside space-y-1 text-red-950">
                    <li>Acesso direto ao banco de dados Supabase / PostgreSQL;</li>
                    <li>Service Role Key ou credenciais administrativas internas;</li>
                    <li>Capacidade de definir <code>store_id</code> livremente;</li>
                    <li>Acesso a dados ou produtos de outras lojas/tenants.</li>
                  </ul>
                </div>

                <div className="p-3.5 rounded-lg border border-emerald-200 bg-emerald-50/40 space-y-1.5">
                  <span className="font-bold text-emerald-800 text-xs flex items-center gap-1.5">
                    <Check className="w-4 h-4 text-emerald-600" />
                    O que é garantido em tempo de execução:
                  </span>
                  <ul className="list-disc list-inside space-y-1 text-emerald-950">
                    <li>Autenticação por chave com verificação de SHA-256;</li>
                    <li>Verificação estrita de escopo antes de cada ferramenta;</li>
                    <li>Assinatura automática de store_id do tenant logado;</li>
                    <li>Registro obrigatório de auditoria em <code>agent_audit_log</code>.</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB: SCOPES */}
        <TabsContent value="scopes" className="space-y-6">
          <Card className="border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Lock className="w-5 h-5 text-indigo-600" />
                Matriz Canônica de Escopos (Scopes)
              </CardTitle>
              <CardDescription>
                Cada ferramenta MCP exige exatamente um dos 8 escopos canônicos do sistema.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader className="bg-slate-50 text-xs">
                  <TableRow>
                    <TableHead className="font-semibold">Escopo Técnico</TableHead>
                    <TableHead className="font-semibold">Nome Amigável</TableHead>
                    <TableHead className="font-semibold">Nível de Risco</TableHead>
                    <TableHead className="font-semibold">Descrição</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="text-xs">
                  {MCP_SCOPES.map((s) => (
                    <TableRow key={s.scope}>
                      <TableCell className="font-mono font-semibold text-slate-900">
                        {s.scope}
                      </TableCell>
                      <TableCell className="font-medium text-slate-800">{s.label}</TableCell>
                      <TableCell>
                        {s.riskTier === 'READ' && (
                          <Badge className="bg-blue-50 text-blue-700 border-blue-200 text-[10px]">
                            Leitura (Baixo)
                          </Badge>
                        )}
                        {s.riskTier === 'WRITE' && (
                          <Badge className="bg-amber-50 text-amber-700 border-amber-200 text-[10px]">
                            Escrita (Médio)
                          </Badge>
                        )}
                        {s.riskTier === 'SENSITIVE_WRITE' && (
                          <Badge className="bg-red-50 text-red-700 border-red-200 text-[10px]">
                            Sensível (Alto)
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-slate-600">{s.description}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB: RATE LIMITS */}
        <TabsContent value="ratelimits" className="space-y-6">
          <Card className="border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Clock className="w-5 h-5 text-indigo-600" />
                Limites de Taxa de Requisição (Rate Limits)
              </CardTitle>
              <CardDescription>
                O servidor MCP aplica janelas de taxa por minuto vinculadas ao hash da credencial.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader className="bg-slate-50 text-xs">
                  <TableRow>
                    <TableHead className="font-semibold">Categoria</TableHead>
                    <TableHead className="font-semibold">Limite por Minuto</TableHead>
                    <TableHead className="font-semibold">Escopos Impactados</TableHead>
                    <TableHead className="font-semibold">Descrição</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="text-xs">
                  {MCP_RATE_LIMITS.map((r) => (
                    <TableRow key={r.tier}>
                      <TableCell className="font-bold text-slate-900 capitalize">
                        {r.label}
                      </TableCell>
                      <TableCell className="font-mono font-semibold text-indigo-600">
                        {r.limitPerMinute} req/min
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {r.tools.map((t) => (
                            <Badge
                              key={t}
                              variant="secondary"
                              className="text-[9px] font-mono bg-slate-100"
                            >
                              {t}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="text-slate-600">{r.description}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB: ERROS & IDEMPOTÊNCIA */}
        <TabsContent value="errors" className="space-y-6">
          <Card className="border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-500" />
                Regras de Idempotência em Operações WRITE
              </CardTitle>
              <CardDescription>
                Como evitar cobranças ou duplicações em operações de ajuste de estoque e lote.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-xs text-slate-700 leading-relaxed">
              <p>
                Operações que alteram dados (como <code>ajustar_estoque</code> ou <code>atualizar_produtos_em_lote</code>)
                aceitam opcionalmente um parâmetro <code>operation_id</code> gerado pelo agente (ex: UUID v4).
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                <div className="p-3 rounded-lg border border-emerald-200 bg-emerald-50/40">
                  <span className="font-bold text-emerald-800 block mb-1">
                    ✓ Retry Seguro (Mesmo ID + Mesmo Payload):
                  </span>
                  <p className="text-emerald-950 text-[11px]">
                    Se a conexão cair e o agente reenviar a requisição com o mesmo <code>operation_id</code> e
                    exatamente o mesmo payload, o servidor retorna o resultado anterior sem recalcular nem duplicar a movimentação.
                  </p>
                </div>

                <div className="p-3 rounded-lg border border-red-200 bg-red-50/40">
                  <span className="font-bold text-red-800 block mb-1">
                    ✗ Conflito (Mesmo ID + Payload Diferente):
                  </span>
                  <p className="text-red-950 text-[11px]">
                    Se o agente reutilizar o mesmo <code>operation_id</code> com valores diferentes, o servidor
                    rejeita a requisição com o erro <code>IDEMPOTENCY_CONFLICT</code>.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-500" />
                Catálogo de Códigos de Erro Públicos
              </CardTitle>
              <CardDescription>
                Respostas padronizadas retornadas pelo runtime remoto do MCP.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader className="bg-slate-50 text-xs">
                  <TableRow>
                    <TableHead className="font-semibold">Código do Erro</TableHead>
                    <TableHead className="font-semibold">Significado</TableHead>
                    <TableHead className="font-semibold">Possível Causa</TableHead>
                    <TableHead className="font-semibold">Como Corrigir</TableHead>
                    <TableHead className="font-semibold">Pode Tentar de Novo?</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="text-xs">
                  {MCP_ERROR_CATALOG.map((err) => (
                    <TableRow key={err.code}>
                      <TableCell className="font-mono font-bold text-red-600">
                        {err.code}
                      </TableCell>
                      <TableCell className="font-medium text-slate-900">{err.title}</TableCell>
                      <TableCell className="text-slate-600">{err.cause}</TableCell>
                      <TableCell className="text-slate-600">{err.solution}</TableCell>
                      <TableCell>
                        {err.retryable ? (
                          <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[9px]">
                            Sim (com backoff)
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-slate-500 text-[9px]">
                            Não
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
