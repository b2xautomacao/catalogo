import React, { useState, useMemo } from 'react';
import {
  Activity,
  Filter,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Shield,
  Building,
  RefreshCw,
  Search,
  Bot,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { AgentAuditItem } from '@/hooks/useTenantMcp';
import { Store } from '@/hooks/useStores';

interface McpActivityAuditProps {
  auditLogs: AgentAuditItem[];
  loading: boolean;
  isSuperadmin: boolean;
  currentStore: Store | null;
  stores: Store[];
  selectedStoreIdFilter: string | null;
  onSelectStoreFilterChange: (storeId: string | null) => void;
  onRefresh: () => void;
}

export const McpActivityAudit: React.FC<McpActivityAuditProps> = ({
  auditLogs,
  loading,
  isSuperadmin,
  currentStore,
  stores,
  selectedStoreIdFilter,
  onSelectStoreFilterChange,
  onRefresh,
}) => {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredLogs = useMemo(() => {
    return auditLogs.filter((log) => {
      // Filtro de status
      if (statusFilter !== 'all') {
        if (statusFilter === 'success' && log.status !== 'success') return false;
        if (statusFilter === 'denied' && log.status !== 'denied') return false;
        if (statusFilter === 'error' && log.status !== 'error') return false;
      }

      // Filtro de busca (tool, event_type, error_code)
      if (searchTerm.trim().length > 0) {
        const term = searchTerm.toLowerCase();
        const toolMatch = (log.tool_name || '').toLowerCase().includes(term);
        const eventMatch = (log.event_type || '').toLowerCase().includes(term);
        const errorMatch = (log.error_code || '').toLowerCase().includes(term);
        if (!toolMatch && !eventMatch && !errorMatch) return false;
      }

      return true;
    });
  }, [auditLogs, statusFilter, searchTerm]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header com Ações */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            Atividade & Auditoria MCP
          </h2>
          <p className="text-sm text-slate-600">
            Acompanhe em tempo real todas as chamadas de ferramentas e eventos executados pelas IAs e integrações.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          className="text-xs text-slate-700 hover:text-slate-900"
        >
          <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
          Atualizar Atividade
        </Button>
      </div>

      {/* Barra de Filtros */}
      <Card className="border-slate-200 shadow-sm">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {/* Campo de Busca */}
            <div className="relative col-span-1 sm:col-span-2">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Buscar por ferramenta (ex: buscar_catalogo, consultar_estoque)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 text-xs"
              />
            </div>

            {/* Filtro de Status */}
            <div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="text-xs">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-xs">Todos os Status</SelectItem>
                  <SelectItem value="success" className="text-xs">Sucesso (OK)</SelectItem>
                  <SelectItem value="denied" className="text-xs">Negado (Permissão)</SelectItem>
                  <SelectItem value="error" className="text-xs">Erros</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Filtro de Loja para Superadmin */}
            {isSuperadmin && (
              <div>
                <Select
                  value={selectedStoreIdFilter || 'all'}
                  onValueChange={(val) => onSelectStoreFilterChange(val === 'all' ? null : val)}
                >
                  <SelectTrigger className="text-xs">
                    <SelectValue placeholder="Filtrar por loja" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" className="text-xs">Todas as Lojas</SelectItem>
                    {currentStore && (
                      <SelectItem value={currentStore.id} className="text-xs">
                        Loja Atual: {currentStore.name}
                      </SelectItem>
                    )}
                    {stores
                      .filter((s) => s.id !== currentStore?.id)
                      .map((s) => (
                        <SelectItem key={s.id} value={s.id} className="text-xs">
                          {s.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Logs */}
      <Card className="border-slate-200 shadow-sm overflow-hidden">
        <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
              <Activity className="w-4 h-4 text-indigo-600" />
              Registros de Auditoria ({filteredLogs.length})
            </CardTitle>
            <span className="text-[11px] text-slate-500">
              Isolamento estrito • Logs higienizados sem dados sensíveis
            </span>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="py-12 text-center text-xs text-slate-500">
              Carregando auditoria...
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                <Bot className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h4 className="font-semibold text-slate-800 text-sm">
                  Nenhuma atividade registrada
                </h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Assim que sua IA ou agente começar a consultar o catálogo ou verificar estoques, as chamadas aparecerão aqui automaticamente.
                </p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-50 text-xs text-slate-700">
                  <TableRow>
                    <TableHead className="font-semibold">Horário</TableHead>
                    <TableHead className="font-semibold">Ferramenta / Evento</TableHead>
                    <TableHead className="font-semibold">Status</TableHead>
                    <TableHead className="font-semibold">Duração</TableHead>
                    <TableHead className="font-semibold">Detalhes / Erro</TableHead>
                    {isSuperadmin && <TableHead className="font-semibold">Loja</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody className="text-xs">
                  {filteredLogs.map((log) => (
                    <TableRow key={log.id} className="hover:bg-slate-50/80">
                      <TableCell className="font-mono text-slate-600 whitespace-nowrap">
                        <span className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          {new Date(log.created_at).toLocaleString('pt-BR')}
                        </span>
                      </TableCell>

                      <TableCell className="font-medium text-slate-900">
                        <span className="font-mono font-semibold text-slate-800 block">
                          {log.tool_name || log.event_type}
                        </span>
                        {log.tool_name && (
                          <span className="text-[10px] text-slate-400 font-normal">
                            Evento: {log.event_type}
                          </span>
                        )}
                      </TableCell>

                      <TableCell>
                        {log.status === 'success' && (
                          <Badge className="bg-emerald-500/15 text-emerald-700 border-emerald-500/30 text-[10px]">
                            <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-600" />
                            OK
                          </Badge>
                        )}
                        {log.status === 'denied' && (
                          <Badge className="bg-amber-500/15 text-amber-700 border-amber-500/30 text-[10px]">
                            <AlertTriangle className="w-3 h-3 mr-1 text-amber-600" />
                            NEGADO
                          </Badge>
                        )}
                        {log.status === 'error' && (
                          <Badge variant="destructive" className="text-[10px]">
                            <XCircle className="w-3 h-3 mr-1" />
                            ERRO
                          </Badge>
                        )}
                      </TableCell>

                      <TableCell className="font-mono text-slate-600">
                        {log.duration_ms !== null ? `${log.duration_ms} ms` : '—'}
                      </TableCell>

                      <TableCell className="text-slate-600">
                        {log.error_code ? (
                          <span className="font-mono text-[11px] text-red-600 font-semibold">
                            {log.error_code}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">Execução nominal</span>
                        )}
                      </TableCell>

                      {isSuperadmin && (
                        <TableCell className="text-slate-600">
                          <span className="inline-flex items-center gap-1 text-[11px]">
                            <Building className="w-3 h-3 text-slate-400" />
                            {log.store_name}
                          </span>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
