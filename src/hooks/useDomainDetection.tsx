import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

const BASE_DOMAIN = 'aoseudispor.com.br';
const APP_DOMAIN = `app.${BASE_DOMAIN}`;

export type DomainType = 'app' | 'subdomain' | 'custom_domain' | 'slug';

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
   * Detecta o tipo de domínio baseado no host atual
   */
  const detectDomainType = useCallback((): DomainType => {
    const host = window.location.host.toLowerCase();

    console.log('🌐 Detectando tipo de domínio:', host);

    // App principal (admin)
    if (host === APP_DOMAIN || host === 'localhost:5173' || host === 'localhost:8080') {
      return 'app';
    }

    // Subdomínio wildcard
    if (host.endsWith(`.${BASE_DOMAIN}`)) {
      return 'subdomain';
    }

    // Domínio próprio
    return 'custom_domain';
  }, []);

  /**
   * Extrai subdomínio de xxx.aoseudispor.com.br
   */
  const extractSubdomain = useCallback((): string | null => {
    const host = window.location.host.toLowerCase();
    
    if (!host.endsWith(`.${BASE_DOMAIN}`)) {
      return null;
    }

    const subdomain = host.split('.')[0];
    
    // Ignorar subdomínios do sistema
    const systemSubdomains = ['app', 'www', 'admin', 'api'];
    if (systemSubdomains.includes(subdomain)) {
      return null;
    }

    return subdomain;
  }, []);

  /**
   * Verifica se é domínio customizado
   */
  const isCustomDomain = useCallback((): boolean => {
    const type = detectDomainType();
    return type === 'custom_domain';
  }, [detectDomainType]);

  /**
   * Resolve loja a partir do domínio/subdomínio
   */
  const resolveStoreFromDomain = useCallback(async (): Promise<DomainInfo | null> => {
    const domainType = detectDomainType();
    const host = window.location.host.toLowerCase();

    console.log('🔍 Resolvendo loja para domínio:', { domainType, host });

    try {
      // Tipo 1: Subdomínio
      if (domainType === 'subdomain') {
        const subdomain = extractSubdomain();
        
        if (!subdomain) {
          console.warn('⚠️ Subdomínio inválido ou do sistema');
          return null;
        }

        console.log('🔍 Buscando loja por subdomínio:', subdomain);

        const { data, error } = await supabase
          .from('store_settings')
          .select('store_id, subdomain, subdomain_enabled')
          .ilike('subdomain', subdomain)
          .eq('subdomain_enabled', true)
          .maybeSingle();

        if (error) {
          console.error('❌ Erro ao buscar por subdomínio:', error);
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

      // Tipo 2: Domínio Próprio
      if (domainType === 'custom_domain') {
        console.log('🔍 Buscando loja por domínio próprio:', host);

        const { data, error } = await supabase
          .from('store_settings')
          .select('store_id, custom_domain, custom_domain_enabled, custom_domain_verified')
          .ilike('custom_domain', host)
          .eq('custom_domain_enabled', true)
          .eq('custom_domain_verified', true)
          .maybeSingle();

        if (error) {
          console.error('❌ Erro ao buscar por domínio próprio:', error);
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

      // Tipo 3: App/Admin - não é catálogo público
      return {
        type: 'app',
      };

    } catch (err) {
      console.error('💥 Erro ao resolver loja:', err);
      return null;
    }
  }, [detectDomainType, extractSubdomain]);

  /**
   * Auto-detecta domínio ao montar
   */
  useEffect(() => {
    const detectAndResolve = async () => {
      setLoading(true);
      setError(null);

      try {
        const info = await resolveStoreFromDomain();
        setDomainInfo(info);
      } catch (err) {
        console.error('Erro na detecção de domínio:', err);
        setError('Erro ao detectar domínio');
        setDomainInfo(null);
      } finally {
        setLoading(false);
      }
    };

    detectAndResolve();
  }, [resolveStoreFromDomain]);

  return {
    domainInfo,
    loading,
    error,
    detectDomainType,
    extractSubdomain,
    isCustomDomain,
    resolveStoreFromDomain,
    isPublicCatalog: domainInfo?.type === 'subdomain' || domainInfo?.type === 'custom_domain',
    storeId: domainInfo?.storeId,
  };
};

