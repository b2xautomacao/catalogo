import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { resolveHostname } from '@/lib/platformHosts';

export type DomainType = 'app' | 'platform_mcp' | 'subdomain' | 'custom_domain' | 'slug';

interface DomainInfo {
  type: DomainType;
  subdomain?: string;
  customDomain?: string;
  storeId?: string;
  storeSlug?: string;
}

export const useDomainDetection = () => {
  const [domainInfo, setDomainInfo] = useState<DomainInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Resolve loja a partir do domínio/subdomínio usando a política central de hosts da plataforma.
   * Hostnames reservados de plataforma (como mcp.gargalozero.com.br) JAMAIS consultam banco por tenant.
   */
  const resolveStoreFromDomain = useCallback(async (): Promise<DomainInfo | null> => {
    const rawHost = window.location.host;
    const resolution = resolveHostname(rawHost);

    console.log('🔍 useDomainDetection: Resolvendo host com política central:', { rawHost, resolution });

    try {
      // 1. Plataforma MCP (mcp.gargalozero.com.br, mcp.aoseudispor.com.br)
      // NUNCA consultar o banco por loja/slug!
      if (resolution.type === 'platform' && resolution.service === 'mcp') {
        return {
          type: 'platform_mcp',
        };
      }

      // 2. Outros hosts de plataforma (app, admin, api, www, root, dev)
      // NUNCA consultar o banco por loja/slug!
      if (resolution.type === 'platform' || resolution.type === 'root' || resolution.type === 'development') {
        return {
          type: 'app',
        };
      }

      // 3. Subdomínio de Tenant (ex: lojax.gargalozero.com.br ou lojax.aoseudispor.com.br)
      if (resolution.type === 'tenant') {
        const subdomain = resolution.slug;
        console.log('🔍 Buscando loja por subdomínio de tenant:', subdomain);

        const queryResult: any = await (supabase as any)
          .from('store_settings')
          .select('store_id, subdomain, subdomain_enabled')
          .ilike('subdomain', subdomain)
          .eq('subdomain_enabled', true)
          .maybeSingle();

        const data = queryResult.data;
        const queryError = queryResult.error;

        if (queryError) {
          console.error('❌ Erro ao buscar por subdomínio:', queryError);
          return null;
        }

        if (!data) {
          console.warn('⚠️ Loja não encontrada para subdomínio:', subdomain);
          return null;
        }

        console.log('✅ Loja encontrada via subdomínio:', data);

        return {
          type: 'subdomain',
          subdomain,
          storeId: data.store_id,
        };
      }

      // 4. Domínio Próprio de Terceiro (ex: www.minhaloja.com.br)
      if (resolution.type === 'custom_domain') {
        const host = resolution.hostname;
        console.log('🔍 Buscando loja por domínio próprio:', host);

        const queryResult: any = await (supabase as any)
          .from('store_settings')
          .select('store_id, custom_domain, custom_domain_enabled, custom_domain_verified')
          .ilike('custom_domain', host)
          .eq('custom_domain_enabled', true)
          .eq('custom_domain_verified', true)
          .maybeSingle();

        const data = queryResult.data;
        const queryError = queryResult.error;

        if (queryError) {
          console.error('❌ Erro ao buscar por domínio próprio:', queryError);
          return null;
        }

        if (!data) {
          console.warn('⚠️ Loja não encontrada ou domínio não verificado:', host);
          return null;
        }

        console.log('✅ Loja encontrada via domínio próprio:', data);

        return {
          type: 'custom_domain',
          customDomain: host,
          storeId: data.store_id,
        };
      }

      return {
        type: 'app',
      };
    } catch (err) {
      console.error('💥 Erro ao resolver domínio:', err);
      return null;
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    const initDetection = async () => {
      try {
        setLoading(true);
        setError(null);

        const info = await resolveStoreFromDomain();

        if (isMounted) {
          setDomainInfo(info);
          setLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          console.error('💥 Erro na detecção de domínio:', err);
          setError(err instanceof Error ? err.message : 'Erro desconhecido');
          setLoading(false);
        }
      }
    };

    initDetection();

    return () => {
      isMounted = false;
    };
  }, [resolveStoreFromDomain]);

  return {
    domainInfo,
    loading,
    error,
    refreshDomain: resolveStoreFromDomain,
  };
};
