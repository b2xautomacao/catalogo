import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useStores } from '@/hooks/useStores';
import { generateClientApiKey, maskKeyPrefix, getCredentialStatus } from '@/lib/apiKeyCrypto';
import { useToast } from '@/hooks/use-toast';

export interface ApiCredentialItem {
  id: string;
  name: string;
  key_prefix: string;
  masked_prefix: string;
  principal_type: string;
  principal_id: string;
  store_id: string | null;
  store_name?: string;
  scopes: string[];
  created_at: string;
  expires_at: string | null;
  revoked_at: string | null;
  last_used_at: string | null;
  status: 'ATIVA' | 'REVOGADA' | 'EXPIRADA';
}

export interface AgentAuditItem {
  id: string;
  created_at: string;
  event_type: string;
  principal_id: string;
  principal_type: string;
  store_id: string | null;
  store_name?: string;
  tool_name: string | null;
  status: 'success' | 'error' | 'denied' | string;
  duration_ms: number | null;
  error_code: string | null;
  metadata: any;
}

export interface CreateCredentialInput {
  name: string;
  scopes: string[];
  expiresInDays?: number | null;
  targetStoreId?: string | null; // Apenas para superadmin
}

export interface CreateCredentialResult {
  credential: ApiCredentialItem;
  rawApiKey: string;
}

export const useTenantMcp = () => {
  const { user, profile, isSuperadmin } = useAuth();
  const { currentStore, stores } = useStores();
  const { toast } = useToast();

  const [credentials, setCredentials] = useState<ApiCredentialItem[]>([]);
  const [auditLogs, setAuditLogs] = useState<AgentAuditItem[]>([]);
  const [loadingCredentials, setLoadingCredentials] = useState(true);
  const [loadingAudit, setLoadingAudit] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Superadmin store filter (null = all stores for superadmin, or specific store ID)
  const [selectedStoreIdFilter, setSelectedStoreIdFilter] = useState<string | null>(null);

  // Store ID efetivo para o tenant logado (nunca nulo para tenant normal)
  const tenantEffectiveStoreId = currentStore?.id || profile?.store_id || null;

  // Endpoint canônico do MCP
  const mcpEndpointUrl = (import.meta.env.VITE_MCP_URL as string) || 'https://mcp.aoseudispor.com.br/mcp';

  /**
   * Snippet de configuração rápida (sanitizado por padrão)
   */
  const getQuickConfigSnippet = useCallback((keyPlaceholder = '<COLE_SUA_CHAVE_AQUI>') => {
    return JSON.stringify(
      {
        mcpServers: {
          b2xcatalogo: {
            url: mcpEndpointUrl,
            transport: 'http',
            headers: {
              Authorization: `Bearer ${keyPlaceholder}`,
            },
          },
        },
      },
      null,
      2
    );
  }, [mcpEndpointUrl]);

  /**
   * Mapeamento de nome de loja para exibição
   */
  const getStoreName = useCallback(
    (storeId: string | null) => {
      if (!storeId) return 'Todas as lojas (Acesso Global)';
      if (currentStore?.id === storeId) return currentStore.name;
      const found = stores.find((s) => s.id === storeId);
      return found ? found.name : storeId.slice(0, 8) + '...';
    },
    [currentStore, stores]
  );

  /**
   * Buscar credenciais
   */
  const fetchCredentials = useCallback(async () => {
    if (!user) return;
    setLoadingCredentials(true);

    try {
      let query: any = (supabase.from('api_credentials' as any) as any)
        .select('*')
        .order('created_at', { ascending: false });

      if (isSuperadmin) {
        if (selectedStoreIdFilter) {
          query = query.eq('store_id', selectedStoreIdFilter);
        }
      } else {
        // Tenant comum: estritamente restrito à sua própria loja
        if (!tenantEffectiveStoreId) {
          setCredentials([]);
          setLoadingCredentials(false);
          return;
        }
        query = query.eq('store_id', tenantEffectiveStoreId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Erro ao buscar credenciais MCP:', error);
        toast({
          title: 'Erro ao carregar credenciais',
          description: error.message,
          variant: 'destructive',
        });
        return;
      }

      const items: ApiCredentialItem[] = (data || []).map((row: any) => ({
        id: row.id,
        name: row.name || 'Integração IA',
        key_prefix: row.key_prefix,
        masked_prefix: maskKeyPrefix(row.key_prefix),
        principal_type: row.principal_type,
        principal_id: row.principal_id,
        store_id: row.store_id,
        store_name: getStoreName(row.store_id),
        scopes: Array.isArray(row.scopes) ? row.scopes : [],
        created_at: row.created_at,
        expires_at: row.expires_at,
        revoked_at: row.revoked_at,
        last_used_at: row.last_used_at,
        status: getCredentialStatus(row.revoked_at, row.expires_at),
      }));

      setCredentials(items);
    } catch (err: any) {
      console.error('Falha inesperada ao carregar credenciais:', err);
    } finally {
      setLoadingCredentials(false);
    }
  }, [user, isSuperadmin, selectedStoreIdFilter, tenantEffectiveStoreId, getStoreName, toast]);

  /**
   * Buscar audit log (agent_audit_log)
   */
  const fetchAuditLogs = useCallback(async () => {
    if (!user) return;
    setLoadingAudit(true);

    try {
      let query: any = (supabase.from('agent_audit_log' as any) as any)
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (isSuperadmin) {
        if (selectedStoreIdFilter) {
          query = query.eq('store_id', selectedStoreIdFilter);
        }
      } else {
        // Tenant comum: apenas registros da própria loja
        if (!tenantEffectiveStoreId) {
          setAuditLogs([]);
          setLoadingAudit(false);
          return;
        }
        query = query.eq('store_id', tenantEffectiveStoreId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Erro ao buscar auditoria MCP:', error);
        return;
      }

      const items: AgentAuditItem[] = (data || []).map((row: any) => ({
        id: row.id,
        created_at: row.created_at,
        event_type: row.event_type,
        principal_id: row.principal_id,
        principal_type: row.principal_type,
        store_id: row.store_id,
        store_name: getStoreName(row.store_id),
        tool_name: row.tool_name,
        status: row.status,
        duration_ms: row.duration_ms,
        error_code: row.error_code,
        metadata: row.metadata,
      }));

      setAuditLogs(items);
    } catch (err) {
      console.error('Falha ao carregar auditoria MCP:', err);
    } finally {
      setLoadingAudit(false);
    }
  }, [user, isSuperadmin, selectedStoreIdFilter, tenantEffectiveStoreId, getStoreName]);

  /**
   * Criar uma nova credencial MCP com geração criptograficamente segura
   */
  const createCredential = async (
    input: CreateCredentialInput
  ): Promise<CreateCredentialResult | null> => {
    if (!user) {
      toast({
        title: 'Usuário não autenticado',
        variant: 'destructive',
      });
      return null;
    }

    if (!input.name || input.name.trim().length === 0) {
      toast({
        title: 'Nome obrigatório',
        description: 'Informe um nome descritivo para a integração (ex: "Claude Estoque").',
        variant: 'destructive',
      });
      return null;
    }

    if (!input.scopes || input.scopes.length === 0) {
      toast({
        title: 'Permissões obrigatórias',
        description: 'Selecione pelo menos um escopo para a credencial.',
        variant: 'destructive',
      });
      return null;
    }

    // Regra Hard: Tenant normal NUNCA escolhe store_id
    let targetStoreId: string | null = null;
    if (isSuperadmin) {
      targetStoreId = input.targetStoreId !== undefined ? input.targetStoreId : tenantEffectiveStoreId;
    } else {
      targetStoreId = tenantEffectiveStoreId;
      if (!targetStoreId) {
        toast({
          title: 'Loja não identificada',
          description: 'Não foi possível associar a credencial a uma loja ativa.',
          variant: 'destructive',
        });
        return null;
      }
    }

    setIsSubmitting(true);

    try {
      // 1. Gera API key criptograficamente segura
      const { apiKey, keyPrefix, keyHash } = await generateClientApiKey();

      // 2. Calcula data de expiração se solicitada
      let expiresAt: string | null = null;
      if (input.expiresInDays && input.expiresInDays > 0) {
        const expDate = new Date();
        expDate.setDate(expDate.getDate() + input.expiresInDays);
        expiresAt = expDate.toISOString();
      }

      // 3. Insere no banco com apenas key_hash e key_prefix (NUNCA O RAW SECRET)
      const { data, error } = await (supabase.from('api_credentials' as any) as any)
        .insert({
          name: input.name.trim(),
          key_prefix: keyPrefix,
          key_hash: keyHash,
          principal_type: isSuperadmin ? 'superadmin' : 'store_admin',
          principal_id: user.id,
          store_id: targetStoreId,
          scopes: input.scopes,
          expires_at: expiresAt,
        })
        .select()
        .single();

      if (error) {
        console.error('Erro ao persistir credencial:', error);
        toast({
          title: 'Erro ao criar credencial',
          description: error.message,
          variant: 'destructive',
        });
        return null;
      }

      const createdItem: ApiCredentialItem = {
        id: data?.id || String(Date.now()),
        name: data?.name || input.name.trim(),
        key_prefix: data?.key_prefix || keyPrefix,
        masked_prefix: maskKeyPrefix(data?.key_prefix || keyPrefix),
        principal_type: data?.principal_type || (isSuperadmin ? 'superadmin' : 'store_admin'),
        principal_id: data?.principal_id || user.id,
        store_id: data?.store_id !== undefined ? data.store_id : targetStoreId,
        store_name: getStoreName(data?.store_id !== undefined ? data.store_id : targetStoreId),
        scopes: data?.scopes || input.scopes,
        created_at: data?.created_at || new Date().toISOString(),
        expires_at: data?.expires_at || expiresAt,
        revoked_at: data?.revoked_at || null,
        last_used_at: data?.last_used_at || null,
        status: 'ATIVA',
      };

      // Atualiza listagem local
      setCredentials((prev) => [createdItem, ...prev]);

      toast({
        title: 'Credencial MCP criada com sucesso!',
        description: 'Copie a chave agora. Ela não poderá ser exibida novamente.',
      });

      return {
        credential: createdItem,
        rawApiKey: apiKey,
      };
    } catch (err: any) {
      console.error('Erro na criação de credencial MCP:', err);
      toast({
        title: 'Falha na geração da credencial',
        description: err.message || 'Erro inesperado',
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Revogar credencial imediatamente
   */
  const revokeCredential = async (credentialId: string): Promise<boolean> => {
    try {
      const { error } = await (supabase.from('api_credentials' as any) as any)
        .update({ revoked_at: new Date().toISOString() })
        .eq('id', credentialId);

      if (error) {
        toast({
          title: 'Erro ao revogar credencial',
          description: error.message,
          variant: 'destructive',
        });
        return false;
      }

      setCredentials((prev) =>
        prev.map((item) =>
          item.id === credentialId
            ? { ...item, revoked_at: new Date().toISOString(), status: 'REVOGADA' }
            : item
        )
      );

      toast({
        title: 'Credencial revogada',
        description: 'O acesso da integração foi encerrado imediatamente.',
      });

      return true;
    } catch (err: any) {
      toast({
        title: 'Erro inesperado',
        description: err.message,
        variant: 'destructive',
      });
      return false;
    }
  };

  useEffect(() => {
    fetchCredentials();
    fetchAuditLogs();
  }, [fetchCredentials, fetchAuditLogs]);

  return {
    credentials,
    auditLogs,
    loadingCredentials,
    loadingAudit,
    isSubmitting,
    isSuperadmin,
    currentStore,
    stores,
    tenantEffectiveStoreId,
    selectedStoreIdFilter,
    setSelectedStoreIdFilter,
    mcpEndpointUrl,
    getQuickConfigSnippet,
    fetchCredentials,
    fetchAuditLogs,
    createCredential,
    revokeCredential,
  };
};
