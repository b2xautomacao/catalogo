import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getSubdomainInfo } from '@/utils/subdomainRouter';
import { isReservedPlatformSubdomain } from '@/lib/platformHosts';

export interface SubdomainStoreInfo {
  id: string;
  name: string;
  slug: string;
  subdomain: string;
  settings: any;
  owner_id: string;
  created_at: string;
}

interface UseSubdomainStoreReturn {
  store: SubdomainStoreInfo | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook to detect and load store information based on subdomain
 * Used for SaaS multi-tenant subdomain routing
 */
export const useSubdomainStore = (): UseSubdomainStoreReturn => {
  const [store, setStore] = useState<SubdomainStoreInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStore = async () => {
    const { isSubdomain, subdomain } = getSubdomainInfo();
    
    console.log('🔍 useSubdomainStore - Detecting domain:', {
      isSubdomain,
      subdomain,
      hostname: window.location.hostname
    });

    if (!isSubdomain || !subdomain) {
      console.log('📍 Not a subdomain, skipping store load');
      setLoading(false);
      return;
    }

    if (isReservedPlatformSubdomain(subdomain)) {
      console.log('🛡️ useSubdomainStore: Subdomínio reservado de plataforma detectado, pulando busca de loja:', subdomain);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log('🔎 Searching for store with subdomain:', subdomain);

      // Query store by subdomain with settings
      const { data: storeData, error: storeError } = await (supabase as any)
        .from('stores')
        .select(`
          id,
          name,
          url_slug,
          owner_id,
          created_at,
          store_settings!inner (
            subdomain,
            subdomain_enabled,
            domain_mode,
            template_name,
            show_prices,
            show_stock,
            primary_color,
            secondary_color,
            accent_color
          )
        `)
        .eq('store_settings.subdomain', subdomain)
        .eq('store_settings.subdomain_enabled', true)
        .maybeSingle();

      if (storeError) {
        console.error('❌ Database error:', storeError);
        setError(`Erro na consulta: ${storeError.message}`);
        return;
      }

      if (!storeData) {
        console.warn('⚠️ Store not found for subdomain:', subdomain);
        setError('Loja não encontrada ou subdomínio não está ativo');
        return;
      }

      console.log('✅ Store found:', {
        id: storeData.id,
        name: storeData.name,
        subdomain: subdomain
      });

      const storeInfo: SubdomainStoreInfo = {
        id: storeData.id,
        name: storeData.name,
        slug: storeData.url_slug,
        subdomain: subdomain,
        settings: storeData.store_settings,
        owner_id: storeData.owner_id,
        created_at: storeData.created_at
      };

      setStore(storeInfo);

    } catch (err) {
      console.error('💥 Unexpected error:', err);
      setError('Erro inesperado ao carregar loja');
    } finally {
      setLoading(false);
    }
  };

  const refetch = async () => {
    await loadStore();
  };

  useEffect(() => {
    loadStore();
  }, []); // Run once on mount

  // Debug info in development
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.group('🏪 useSubdomainStore Debug');
      console.log('Store:', store);
      console.log('Loading:', loading);
      console.log('Error:', error);
      console.groupEnd();
    }
  }, [store, loading, error]);

  return { store, loading, error, refetch };
};

/**
 * Hook to get store by slug (for URL-based routing)
 * Used as fallback when not using subdomain
 */
export const useStoreBySlug = (slug: string | undefined): UseSubdomainStoreReturn => {
  const [store, setStore] = useState<SubdomainStoreInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStore = async () => {
    if (!slug) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log('🔎 Searching for store with slug:', slug);

      // Query store by URL slug
      const { data: storeData, error: storeError } = await (supabase as any)
        .from('stores')
        .select(`
          id,
          name,
          url_slug,
          owner_id,
          created_at,
          store_settings (
            subdomain,
            subdomain_enabled,
            domain_mode,
            template_name,
            show_prices,
            show_stock,
            primary_color,
            secondary_color,
            accent_color
          )
        `)
        .eq('url_slug', slug)
        .maybeSingle();

      if (storeError) {
        console.error('❌ Database error:', storeError);
        setError(`Erro na consulta: ${storeError.message}`);
        return;
      }

      if (!storeData) {
        console.warn('⚠️ Store not found for slug:', slug);
        setError('Loja não encontrada');
        return;
      }

      console.log('✅ Store found by slug:', {
        id: storeData.id,
        name: storeData.name,
        slug: slug
      });

      const storeInfo: SubdomainStoreInfo = {
        id: storeData.id,
        name: storeData.name,
        slug: storeData.url_slug,
        subdomain: storeData.store_settings?.subdomain || '',
        settings: storeData.store_settings,
        owner_id: storeData.owner_id,
        created_at: storeData.created_at
      };

      setStore(storeInfo);

    } catch (err) {
      console.error('💥 Unexpected error:', err);
      setError('Erro inesperado ao carregar loja');
    } finally {
      setLoading(false);
    }
  };

  const refetch = async () => {
    await loadStore();
  };

  useEffect(() => {
    loadStore();
  }, [slug]);

  return { store, loading, error, refetch };
};

/**
 * Combined hook that detects context and uses appropriate method
 */
export const useContextualStore = (fallbackSlug?: string): UseSubdomainStoreReturn => {
  const { isSubdomain } = getSubdomainInfo();
  
  const subdomainResult = useSubdomainStore();
  const slugResult = useStoreBySlug(isSubdomain ? undefined : fallbackSlug);

  // Return subdomain result if we're on a subdomain, otherwise slug result
  return isSubdomain ? subdomainResult : slugResult;
};
