
import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type CatalogType = 'retail' | 'wholesale';

export interface Store {
  id: string;
  name: string;
  description?: string;
  logo_url?: string;
  is_active: boolean;
}

export type CatalogStore = Store;

export interface CatalogSettings {
  id: string;
  store_id: string;
  business_hours: any;
  payment_methods: any;
  shipping_options: any;
  whatsapp_number: string | null;
  whatsapp_integration_active: boolean | null;
  retail_catalog_active: boolean | null;
  wholesale_catalog_active: boolean | null;
  created_at: string;
  updated_at: string;
}

interface FilterOptions {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
}

// Validação UUID mais rigorosa
const isValidUUID = (str: string): boolean => {
  if (!str || typeof str !== 'string') return false;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
};

export const useCatalog = (identifier?: string) => {
  const [catalogType, setCatalogType] = useState<CatalogType>('retail');
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<FilterOptions>({});
  
  // Cache para evitar re-queries desnecessárias
  const queryCache = useRef<Map<string, any>>(new Map());
  const lastIdentifier = useRef<string | null>(null);

  // Query para buscar loja por ID ou slug - CORRIGINDO O ERRO 406
  const storeQuery = useQuery({
    queryKey: ['store', identifier],
    queryFn: async (): Promise<Store | null> => {
      if (!identifier) {
        console.log('useCatalog: Nenhum identificador fornecido');
        return null;
      }

      console.log('useCatalog: Buscando loja para identificador:', identifier);

      // CORREÇÃO CRÍTICA: Detectar corretamente UUID vs slug
      const isUUID = isValidUUID(identifier);
      console.log('useCatalog: Tipo detectado:', isUUID ? 'UUID' : 'slug');

      let query = supabase
        .from('stores')
        .select('id, name, description, logo_url, is_active')
        .eq('is_active', true);

      // NUNCA usar UUID como url_slug - isso causa o erro 406
      if (isUUID) {
        console.log('useCatalog: Buscando por ID (UUID)');
        query = query.eq('id', identifier);
      } else {
        console.log('useCatalog: Buscando por url_slug');
        query = query.eq('url_slug', identifier);
      }

      const { data, error } = await query.maybeSingle();

      if (error) {
        console.error('useCatalog: Erro ao buscar loja:', error);
        throw error;
      }

      if (!data) {
        console.log('useCatalog: Loja não encontrada para:', identifier);
        return null;
      }

      console.log('useCatalog: Loja encontrada:', data.name);
      return data;
    },
    enabled: !!identifier,
    retry: 1,
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000
  });

  // Hook simplificado para configurações - SEM dependência circular
  const [storeSettings, setStoreSettings] = useState<CatalogSettings | null>(null);
  const [settingsLoading, setSettingsLoading] = useState(false);

  const fetchStoreSettings = useCallback(async (storeId: string) => {
    if (!storeId) return;
    
    try {
      setSettingsLoading(true);
      console.log('useCatalog: Buscando configurações para store_id:', storeId);
      
      const { data, error } = await supabase
        .from('store_settings')
        .select('*')
        .eq('store_id', storeId)
        .maybeSingle();

      if (error) {
        console.error('useCatalog: Erro ao buscar configurações:', error);
        return;
      }

      setStoreSettings(data);
    } catch (error) {
      console.error('useCatalog: Erro nas configurações:', error);
    } finally {
      setSettingsLoading(false);
    }
  }, []);

  // Buscar configurações quando store mudar
  useEffect(() => {
    if (storeQuery.data?.id) {
      fetchStoreSettings(storeQuery.data.id);
    }
  }, [storeQuery.data?.id, fetchStoreSettings]);

  // Query para produtos com cache otimizado
  const productsQuery = useQuery({
    queryKey: ['catalog-products', storeQuery.data?.id, catalogType],
    queryFn: async () => {
      if (!storeQuery.data?.id) {
        console.log('useCatalog: Store ID não disponível');
        return [];
      }

      console.log('useCatalog: Buscando produtos para store_id:', storeQuery.data.id);

      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('store_id', storeQuery.data.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('useCatalog: Erro ao buscar produtos:', error);
        throw error;
      }

      console.log('useCatalog: Produtos encontrados:', data?.length || 0);
      return data || [];
    },
    enabled: !!storeQuery.data?.id,
    retry: 1,
    refetchOnWindowFocus: false,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000
  });

  // Filtrar produtos otimizado
  const filteredProducts = useMemo(() => {
    if (!productsQuery.data) return [];

    let filtered = [...productsQuery.data];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(product => 
        product.name.toLowerCase().includes(query) ||
        (product.description && product.description.toLowerCase().includes(query)) ||
        (product.category && product.category.toLowerCase().includes(query))
      );
    }

    if (filters.category) {
      filtered = filtered.filter(product => product.category === filters.category);
    }

    if (filters.minPrice !== undefined) {
      filtered = filtered.filter(product => product.retail_price >= filters.minPrice!);
    }

    if (filters.maxPrice !== undefined) {
      filtered = filtered.filter(product => product.retail_price <= filters.maxPrice!);
    }

    if (filters.inStock) {
      filtered = filtered.filter(product => product.stock > 0);
    }

    return filtered;
  }, [productsQuery.data, searchQuery, filters]);

  // Funções otimizadas
  const initializeCatalog = useCallback(async (storeId: string, type: CatalogType): Promise<boolean> => {
    console.log('useCatalog: Inicializando catálogo:', storeId, type);
    setCatalogType(type);
    return true;
  }, []);

  const searchProducts = useCallback((query: string) => {
    console.log('useCatalog: Pesquisando:', query);
    setSearchQuery(query);
  }, []);

  const filterProducts = useCallback((filterOptions: FilterOptions) => {
    console.log('useCatalog: Aplicando filtros:', filterOptions);
    setFilters(filterOptions);
  }, []);

  const loading = storeQuery.isLoading || productsQuery.isLoading;

  return {
    // Store data
    store: storeQuery.data,
    storeLoading: storeQuery.isLoading,
    storeError: storeQuery.error,
    
    // Products data
    products: productsQuery.data || [],
    filteredProducts,
    productsLoading: productsQuery.isLoading,
    productsError: productsQuery.error,
    
    // Settings data
    storeSettings,
    settingsLoading,
    
    // Catalog type
    catalogType,
    setCatalogType,
    
    // Search and filter
    searchQuery,
    filters,
    loading,
    
    // Actions
    initializeCatalog,
    searchProducts,
    filterProducts,
    
    // Refetch functions
    refetchStore: storeQuery.refetch,
    refetchProducts: productsQuery.refetch
  };
};
