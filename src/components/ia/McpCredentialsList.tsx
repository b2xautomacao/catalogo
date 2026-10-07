import React, { useState } from 'react';
import {
  Key,
  Plus,
  Copy,
  Check,
  AlertTriangle,
  Shield,
  Trash2,
  Calendar,
  Sparkles,
  Bot,
  ExternalLink,
  Lock,
  Building,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import {
  ApiCredentialItem,
  CreateCredentialInput,
  CreateCredentialResult,
} from '@/hooks/useTenantMcp';
import { Store } from '@/hooks/useStores';
import { MCP_SCOPES, generateAiGuide } from '@/lib/mcpDocsRegistry';

interface McpCredentialsListProps {
  credentials: ApiCredentialItem[];
  loading: boolean;
  isSubmitting: boolean;
  isSuperadmin: boolean;
  currentStore: Store | null;
  stores: Store[];
  mcpEndpointUrl: string;
  getQuickConfigSnippet: (keyPlaceholder?: string) => string;
  onCreateCredential: (input: CreateCredentialInput) => Promise<CreateCredentialResult | null>;
  onRevokeCredential: (credentialId: string) => Promise<boolean>;
  isOpenNewModal: boolean;
  onOpenNewModalChange: (open: boolean) => void;
}

export const McpCredentialsList: React.FC<McpCredentialsListProps> = ({
  credentials,
  loading,
  isSubmitting,
  isSuperadmin,
  currentStore,
  stores,
  mcpEndpointUrl,
  getQuickConfigSnippet,
  onCreateCredential,
  onRevokeCredential,
  isOpenNewModal,
  onOpenNewModalChange,
}) => {
  const { toast } = useToast();

  // Form states
  const [integrationName, setIntegrationName] = useState('');
  const [selectedScopes, setSelectedScopes] = useState<string[]>([
    'catalog:read',
    'stock:read',
    'grade:read',
  ]);
  const [expiresInDays, setExpiresInDays] = useState<number | null>(null);
  const [superadminStoreChoice, setSuperadminStoreChoice] = useState<string>('current');

  // Show-Once Modal states
  const [createdResult, setCreatedResult] = useState<CreateCredentialResult | null>(null);
  const [hasSavedKey, setHasSavedKey] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedFullConfig, setCopiedFullConfig] = useState(false);

  // Revoke confirmation modal states
  const [credentialToRevoke, setCredentialToRevoke] = useState<ApiCredentialItem | null>(null);

  // Copied AI Guide state per credential
  const [copiedGuideId, setCopiedGuideId] = useState<string | null>(null);

  // Handlers para presets de scopes
  const applyPreset = (preset: 'read_only' | 'catalog_mgmt' | 'stock_mgmt' | 'full') => {
    switch (preset) {
      case 'read_only':
        setSelectedScopes(['catalog:read', 'stock:read', 'grade:read']);
        break;
      case 'catalog_mgmt':
        setSelectedScopes(['catalog:read', 'catalog:write', 'grade:read', 'grade:write']);
        break;
      case 'stock_mgmt':
        setSelectedScopes(['catalog:read', 'stock:read', 'stock:adjust']);
        break;
      case 'full':
        setSelectedScopes([
          'catalog:read',
          'catalog:write',
          'stock:read',
          'stock:adjust',
          'grade:read',
          'grade:write',
          ...(isSuperadmin ? ['store:list', 'store:select'] : []),
        ]);
        break;
    }
  };

  const toggleScope = (scope: string) => {
    setSelectedScopes((prev) =>
      prev.includes(scope) ? prev.filter((s) => s !== scope) : [...prev, scope]
    );
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    let targetStoreId: string | null = null;
    if (isSuperadmin) {
      if (superadminStoreChoice === 'all') {
        targetStoreId = null; // Acesso global
      } else if (superadminStoreChoice === 'current') {
        targetStoreId = currentStore?.id || null;
      } else {
        targetStoreId = superadminStoreChoice;
      }
    }

    const res = await onCreateCredential({
      name: integrationName,
      scopes: selectedScopes,
      expiresInDays,
      targetStoreId,
    });

    if (res) {
      setCreatedResult(res);
      setHasSavedKey(false);
      onOpenNewModalChange(false);
      // Reset form
      setIntegrationName('');
      setSelectedScopes(['catalog:read', 'stock:read', 'grade:read']);
      setExpiresInDays(null);
    }
  };

  const handleCopyShowOnceKey = async () => {
    if (!createdResult) return;
    try {
      await navigator.clipboard.writeText(createdResult.rawApiKey);
      setCopiedKey(true);
      toast({
        title: 'Chave copiada!',
        description: 'Guarde-a em local seguro imediatamente.',
      });
      setTimeout(() => setCopiedKey(false), 2000);
    } catch {
      toast({ title: 'Erro ao copiar', variant: 'destructive' });
    }
  };

  const handleCopyShowOnceConfig = async () => {
    if (!createdResult) return;
    try {
      await navigator.clipboard.writeText(getQuickConfigSnippet(createdResult.rawApiKey));
      setCopiedFullConfig(true);
      toast({
        title: 'Configuração copiada!',
        description: 'Configuração com chave pronta copiada para o clipboard.',
      });
      setTimeout(() => setCopiedFullConfig(false), 2000);
    } catch {
      toast({ title: 'Erro ao copiar', variant: 'destructive' });
    }
  };

  const handleCopyScopedGuide = async (cred: ApiCredentialItem) => {
    try {
      const guideText = generateAiGuide({
        storeName: cred.store_name || currentStore?.name || 'Loja B2X',
        scopes: cred.scopes,
        endpointUrl: mcpEndpointUrl,
      });

      await navigator.clipboard.writeText(guideText);
      setCopiedGuideId(cred.id);
      toast({
        title: 'Guia para IA copiado!',
        description: `Guia personalizado com os ${cred.scopes.length} escopos desta credencial copiado.`,
      });
      setTimeout(() => setCopiedGuideId(null), 2500);
    } catch {
      toast({ title: 'Erro ao copiar guia', variant: 'destructive' });
    }
  };

  const handleConfirmRevoke = async () => {
    if (!credentialToRevoke) return;
    const ok = await onRevokeCredential(credentialToRevoke.id);
    if (ok) {
      setCredentialToRevoke(null);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header com Ação */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            Credenciais de Integração MCP
          </h2>
          <p className="text-sm text-slate-600">
            Cada integração ou agente inteligente deve possuir sua própria credencial com permissões mínimas necessárias.
          </p>
        </div>
        <Button
          onClick={() => onOpenNewModalChange(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nova Credencial MCP
        </Button>
      </div>

      {/* Tabela de Credenciais */}
      <Card className="border-slate-200 shadow-sm overflow-hidden">
        <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50">
          <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
            <Key className="w-4 h-4 text-indigo-600" />
            Credenciais Ativas e Revogadas
          </CardTitle>
          <CardDescription>
            Por motivos de segurança, as chaves secretas nunca são armazenadas em formato reversível nem podem ser reexibidas.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="py-12 text-center text-sm text-slate-500">
              Carregando credenciais...
            </div>
          ) : credentials.length === 0 ? (
            <div className="py-16 text-center space-y-4">
              <div className="w-14 h-14 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
                <Bot className="w-7 h-7" />
              </div>
              <div className="max-w-md mx-auto space-y-1">
                <h3 className="font-semibold text-slate-900 text-base">
                  Nenhuma credencial MCP criada
                </h3>
                <p className="text-xs text-slate-500">
                  Crie sua primeira integração para conectar seu catálogo a uma IA como Claude, Cursor, ChatGPT ou agentes autônomos.
                </p>
              </div>
              <Button
                onClick={() => onOpenNewModalChange(true)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs"
              >
                <Plus className="w-3.5 h-3.5 mr-1.5" />
                Criar primeira credencial
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-50 text-xs text-slate-700">
                  <TableRow>
                    <TableHead className="font-semibold">Nome da Integração</TableHead>
                    <TableHead className="font-semibold">Prefixo Seguro</TableHead>
                    <TableHead className="font-semibold">Permissões (Scopes)</TableHead>
                    <TableHead className="font-semibold">Acesso / Loja</TableHead>
                    <TableHead className="font-semibold">Criada em</TableHead>
                    <TableHead className="font-semibold">Status</TableHead>
                    <TableHead className="text-right font-semibold">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="text-xs">
                  {credentials.map((cred) => (
                    <TableRow key={cred.id} className="hover:bg-slate-50/80">
                      <TableCell className="font-medium text-slate-900">
                        <div className="flex items-center gap-2">
                          <Bot className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                          <div>
                            <span className="font-semibold">{cred.name}</span>
                            {cred.principal_type === 'superadmin' && (
                              <span className="block text-[10px] text-purple-600 font-mono">
                                Admin Principal
                              </span>
                            )}
                          </div>
                        </div>
                      </TableCell>

                      <TableCell className="font-mono text-slate-600">
                        {cred.masked_prefix}
                      </TableCell>

                      <TableCell>
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {cred.scopes.slice(0, 3).map((s) => (
                            <Badge
                              key={s}
                              variant="secondary"
                              className="text-[10px] px-1.5 py-0 bg-slate-100 text-slate-700 border border-slate-200"
                            >
                              {s}
                            </Badge>
                          ))}
                          {cred.scopes.length > 3 && (
                            <Badge
                              variant="secondary"
                              className="text-[10px] px-1.5 py-0 bg-slate-100 text-slate-600 border border-slate-200"
                            >
                              +{cred.scopes.length - 3} mais
                            </Badge>
                          )}
                        </div>
                      </TableCell>

                      <TableCell className="text-slate-600">
                        <span className="inline-flex items-center gap-1">
                          <Building className="w-3 h-3 text-slate-400" />
                          {cred.store_name}
                        </span>
                      </TableCell>

                      <TableCell className="text-slate-600 whitespace-nowrap">
                        {new Date(cred.created_at).toLocaleDateString('pt-BR')}
                      </TableCell>

                      <TableCell>
                        {cred.status === 'ATIVA' && (
                          <Badge className="bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/20 border-emerald-500/30 text-[10px]">
                            ATIVA
                          </Badge>
                        )}
                        {cred.status === 'REVOGADA' && (
                          <Badge variant="destructive" className="text-[10px]">
                            REVOGADA
                          </Badge>
                        )}
                        {cred.status === 'EXPIRADA' && (
                          <Badge className="bg-amber-500/15 text-amber-700 border-amber-500/30 text-[10px]">
                            EXPIRADA
                          </Badge>
                        )}
                      </TableCell>

                      <TableCell className="text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCopyScopedGuide(cred)}
                            className="h-7 text-[11px] px-2 text-indigo-600 hover:text-indigo-700 border-indigo-200"
                            title="Copiar prompt/guia específico para esta credencial"
                          >
                            {copiedGuideId === cred.id ? (
                              <>
                                <Check className="w-3 h-3 mr-1 text-emerald-600" />
                                Copiado
                              </>
                            ) : (
                              <>
                                <Sparkles className="w-3 h-3 mr-1 text-indigo-600" />
                                Guia IA
                              </>
                            )}
                          </Button>

                          {cred.status === 'ATIVA' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setCredentialToRevoke(cred)}
                              className="h-7 text-[11px] px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                              title="Revogar credencial"
                            >
                              <Trash2 className="w-3 h-3 mr-1" />
                              Revogar
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal: Nova Credencial MCP */}
      <Dialog open={isOpenNewModal} onOpenChange={onOpenNewModalChange}>
        <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
          <form onSubmit={handleCreateSubmit}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-lg font-bold text-slate-900">
                <Key className="w-5 h-5 text-indigo-600" />
                Nova Credencial MCP
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-600">
                Crie uma credencial dedicada para um agente de IA. Você terá acesso à chave secreta uma única vez.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-5 py-4">
              {/* Nome da Integração */}
              <div className="space-y-1.5">
                <Label htmlFor="integrationName" className="text-xs font-semibold text-slate-800">
                  Nome da Integração / Agente *
                </Label>
                <Input
                  id="integrationName"
                  placeholder="Ex: Claude Estoque, ChatGPT Suporte, Agente Comercial"
                  value={integrationName}
                  onChange={(e) => setIntegrationName(e.target.value)}
                  className="text-xs"
                  required
                />
                <p className="text-[11px] text-slate-500">
                  Dica: use nomes que indiquem claramente qual assistente ou sistema utilizará a chave.
                </p>
              </div>

              {/* Se Super Admin: Seleção de Loja / Acesso */}
              {isSuperadmin && (
                <div className="space-y-1.5 p-3 rounded-lg bg-slate-50 border border-slate-200">
                  <Label className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                    <Building className="w-3.5 h-3.5 text-purple-600" />
                    Escopo de Lojas (Super Admin)
                  </Label>
                  <Select
                    value={superadminStoreChoice}
                    onValueChange={(val) => setSuperadminStoreChoice(val)}
                  >
                    <SelectTrigger className="text-xs bg-white">
                      <SelectValue placeholder="Selecione o acesso" />
                    </SelectTrigger>
                    <SelectContent>
                      {currentStore && (
                        <SelectItem value="current" className="text-xs">
                          Loja Atual: {currentStore.name}
                        </SelectItem>
                      )}
                      {stores
                        .filter((s) => s.id !== currentStore?.id)
                        .map((s) => (
                          <SelectItem key={s.id} value={s.id} className="text-xs">
                            Loja: {s.name}
                          </SelectItem>
                        ))}
                      <SelectItem value="all" className="text-xs font-semibold text-red-600">
                        ⚠ Todas as Lojas (Acesso Administrativo Global)
                      </SelectItem>
                    </SelectContent>
                  </Select>

                  {superadminStoreChoice === 'all' && (
                    <div className="p-2.5 rounded bg-amber-50 border border-amber-200 text-[11px] text-amber-800 flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                      <span>
                        <strong>Atenção:</strong> Esta credencial poderá consultar e operar sobre todas as lojas da plataforma onde o usuário possui autorização. Requer escopos <code>store:list</code> e <code>store:select</code>.
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Presets Rápidos */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-800 flex items-center justify-between">
                  <span>Presets de Permissão</span>
                  <span className="text-[10px] text-indigo-600 font-normal">
                    Selecione um perfil ou personalize abaixo
                  </span>
                </Label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => applyPreset('read_only')}
                    className="text-[11px] h-8 bg-slate-50 hover:bg-indigo-50 hover:text-indigo-700"
                  >
                    Somente Leitura
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => applyPreset('catalog_mgmt')}
                    className="text-[11px] h-8 bg-slate-50 hover:bg-indigo-50 hover:text-indigo-700"
                  >
                    Gestão Catálogo
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => applyPreset('stock_mgmt')}
                    className="text-[11px] h-8 bg-slate-50 hover:bg-indigo-50 hover:text-indigo-700"
                  >
                    Gestão Estoque
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => applyPreset('full')}
                    className="text-[11px] h-8 bg-slate-50 hover:bg-indigo-50 hover:text-indigo-700"
                  >
                    Acesso Completo
                  </Button>
                </div>
              </div>

              {/* Seleção Granular de Scopes com Labels Amigáveis */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold text-slate-800">
                    Permissões Granulares (Scopes) *
                  </Label>
                  <Badge variant="outline" className="text-[10px]">
                    {selectedScopes.length} selecionado(s)
                  </Badge>
                </div>

                {/* Banner Least Privilege */}
                <div className="p-2.5 rounded-lg bg-indigo-50/50 border border-indigo-100 flex items-start gap-2 text-[11px] text-indigo-900">
                  <Shield className="w-4 h-4 text-indigo-600 flex-shrink-0 mt-0.5" />
                  <span>
                    <strong>Menor Privilégio:</strong> Conceda somente as permissões que esta integração realmente precisa para realizar suas tarefas com segurança.
                  </span>
                </div>

                {/* Grupos de Scopes */}
                <div className="space-y-4 pt-1">
                  {/* Catálogo */}
                  <div className="p-3 rounded-lg border border-slate-200 space-y-2">
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                      Catálogo de Produtos
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <label className="flex items-start gap-2 cursor-pointer">
                        <Checkbox
                          checked={selectedScopes.includes('catalog:read')}
                          onCheckedChange={() => toggleScope('catalog:read')}
                        />
                        <div>
                          <span className="font-medium text-slate-800 block">Consultar catálogo</span>
                          <span className="text-[10px] text-slate-500">catalog:read (busca, listagem)</span>
                        </div>
                      </label>
                      <label className="flex items-start gap-2 cursor-pointer">
                        <Checkbox
                          checked={selectedScopes.includes('catalog:write')}
                          onCheckedChange={() => toggleScope('catalog:write')}
                        />
                        <div>
                          <span className="font-medium text-slate-800 block">Criar e alterar produtos</span>
                          <span className="text-[10px] text-slate-500">catalog:write (edição, lote, desativação)</span>
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* Estoque */}
                  <div className="p-3 rounded-lg border border-slate-200 space-y-2">
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                      Estoque & Inventário
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <label className="flex items-start gap-2 cursor-pointer">
                        <Checkbox
                          checked={selectedScopes.includes('stock:read')}
                          onCheckedChange={() => toggleScope('stock:read')}
                        />
                        <div>
                          <span className="font-medium text-slate-800 block">Consultar estoque</span>
                          <span className="text-[10px] text-slate-500">stock:read (saldos, reservas)</span>
                        </div>
                      </label>
                      <label className="flex items-start gap-2 cursor-pointer">
                        <Checkbox
                          checked={selectedScopes.includes('stock:adjust')}
                          onCheckedChange={() => toggleScope('stock:adjust')}
                        />
                        <div>
                          <span className="font-medium text-slate-800 block">Ajustar estoque</span>
                          <span className="text-[10px] text-slate-500">stock:adjust (movimentações via ledger)</span>
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* Grades */}
                  <div className="p-3 rounded-lg border border-slate-200 space-y-2">
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                      Grades de Tamanho & Variações
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <label className="flex items-start gap-2 cursor-pointer">
                        <Checkbox
                          checked={selectedScopes.includes('grade:read')}
                          onCheckedChange={() => toggleScope('grade:read')}
                        />
                        <div>
                          <span className="font-medium text-slate-800 block">Consultar grades</span>
                          <span className="text-[10px] text-slate-500">grade:read (modelos e tamanhos)</span>
                        </div>
                      </label>
                      <label className="flex items-start gap-2 cursor-pointer">
                        <Checkbox
                          checked={selectedScopes.includes('grade:write')}
                          onCheckedChange={() => toggleScope('grade:write')}
                        />
                        <div>
                          <span className="font-medium text-slate-800 block">Criar e aplicar grades</span>
                          <span className="text-[10px] text-slate-500">grade:write (templates e aplicação)</span>
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* Lojas (apenas para superadmin ou credenciais multi-loja) */}
                  {isSuperadmin && (
                    <div className="p-3 rounded-lg border border-purple-200 bg-purple-50/30 space-y-2">
                      <span className="text-xs font-bold text-purple-900 uppercase tracking-wider block">
                        Contexto Multi-Loja (Super Admin)
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        <label className="flex items-start gap-2 cursor-pointer">
                          <Checkbox
                            checked={selectedScopes.includes('store:list')}
                            onCheckedChange={() => toggleScope('store:list')}
                          />
                          <div>
                            <span className="font-medium text-slate-800 block">Listar lojas</span>
                            <span className="text-[10px] text-slate-500">store:list (buscar_lojas)</span>
                          </div>
                        </label>
                        <label className="flex items-start gap-2 cursor-pointer">
                          <Checkbox
                            checked={selectedScopes.includes('store:select')}
                            onCheckedChange={() => toggleScope('store:select')}
                          />
                          <div>
                            <span className="font-medium text-slate-800 block">Selecionar loja ativa</span>
                            <span className="text-[10px] text-slate-500">store:select (selecionar_loja)</span>
                          </div>
                        </label>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Expiração */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" />
                  Validade da Chave
                </Label>
                <Select
                  value={expiresInDays === null ? 'never' : String(expiresInDays)}
                  onValueChange={(val) => setExpiresInDays(val === 'never' ? null : Number(val))}
                >
                  <SelectTrigger className="text-xs">
                    <SelectValue placeholder="Selecione o prazo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="never" className="text-xs">Nunca expira (Recomendado)</SelectItem>
                    <SelectItem value="30" className="text-xs">Expira em 30 dias</SelectItem>
                    <SelectItem value="60" className="text-xs">Expira em 60 dias</SelectItem>
                    <SelectItem value="90" className="text-xs">Expira em 90 dias</SelectItem>
                    <SelectItem value="365" className="text-xs">Expira em 1 ano</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onOpenNewModalChange(false)}
                className="text-xs"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isSubmitting || selectedScopes.length === 0}
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs"
              >
                {isSubmitting ? 'Gerando Credencial...' : 'Gerar Credencial'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal: SHOW-ONCE da API Key */}
      <Dialog
        open={!!createdResult}
        onOpenChange={(open) => {
          if (!open && !hasSavedKey) {
            toast({
              title: 'Atenção!',
              description: 'Você precisa confirmar que salvou a chave antes de fechar o aviso.',
              variant: 'destructive',
            });
            return;
          }
          if (!open) {
            setCreatedResult(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-bold text-slate-900">
              <Lock className="w-5 h-5 text-emerald-600" />
              Sua Credencial MCP foi Criada!
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-600">
              Copie e guarde esta chave secreta agora. Por questões de segurança, ela nunca poderá ser exibida novamente.
            </DialogDescription>
          </DialogHeader>

          {createdResult && (
            <div className="space-y-4 py-3">
              {/* Alerta Crítico */}
              <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5">
                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold">Aviso Crítico de Segurança:</p>
                  <p>
                    Copie esta chave agora. Por segurança, ela não poderá ser exibida novamente. Se você perdê-la, será necessário revogar esta credencial e gerar uma nova.
                  </p>
                </div>
              </div>

              {/* Chave com Botão Copiar */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-800">
                  Chave Secreta MCP (Bearer Token):
                </Label>
                <div className="p-3 bg-slate-950 text-emerald-400 font-mono text-xs rounded-lg border border-slate-800 break-all select-all flex items-center justify-between gap-3">
                  <span>{createdResult.rawApiKey}</span>
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleCopyShowOnceKey}
                    className="flex-shrink-0 bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-7 px-2.5"
                  >
                    {copiedKey ? (
                      <>
                        <Check className="w-3.5 h-3.5 mr-1" /> Copiado!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 mr-1" /> Copiar Chave
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Snippet Completo Pronto */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold text-slate-800">
                    Configuração Pronta (com Chave Embutida):
                  </Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleCopyShowOnceConfig}
                    className="text-xs text-indigo-600 hover:text-indigo-700 h-6 p-0"
                  >
                    {copiedFullConfig ? 'Copiado!' : 'Copiar JSON Completo'}
                  </Button>
                </div>
                <pre className="p-3 bg-slate-900 text-slate-200 font-mono text-[11px] rounded-lg border border-slate-800 overflow-x-auto max-h-36">
                  {getQuickConfigSnippet(createdResult.rawApiKey)}
                </pre>
              </div>

              {/* Checkbox Obrigatório para Fechar */}
              <div className="pt-2 border-t border-slate-200">
                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    id="confirmSavedKey"
                    checked={hasSavedKey}
                    onCheckedChange={(val) => setHasSavedKey(Boolean(val))}
                  />
                  <span className="text-xs font-medium text-slate-800">
                    Salvei esta credencial em um local seguro
                  </span>
                </label>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              disabled={!hasSavedKey}
              onClick={() => setCreatedResult(null)}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white text-xs disabled:opacity-50"
            >
              Concluir e Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal: Confirmação de Revogação */}
      <Dialog open={!!credentialToRevoke} onOpenChange={(open) => !open && setCredentialToRevoke(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-red-600">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              Revogar esta credencial?
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-600">
              Você está prestes a revogar a credencial{' '}
              <strong>"{credentialToRevoke?.name}"</strong>.
            </DialogDescription>
          </DialogHeader>

          <div className="py-2 text-xs text-slate-600">
            A integração associada a esta chave perderá imediatamente o acesso às ferramentas MCP do catálogo. Esta ação é irreversível.
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCredentialToRevoke(null)}
              className="text-xs"
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleConfirmRevoke}
              className="text-xs"
            >
              Confirmar Revogação
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
