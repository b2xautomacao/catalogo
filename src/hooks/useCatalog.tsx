
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useStoreSettings } from './useStoreSettings';

export type CatalogType = 'retail' | 'wholesale';

interface Store {
  id: string;
  name: string;
  description?: string;
  logo_url?: string;
  is_active: boolean;
}

// Função para verificar se é um UUID válido
const isValidUUID = (str: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
};

export const useCatalog = (identifier?: string) => {
  const [catalogType, setCatalogType] = useState<CatalogType>('retail');

  // Query para buscar loja por ID ou slug
  const storeQuery = useQuery({
    queryKey: ['store', identifier],
    queryFn: async (): Promise<Store | null> => {
      if (!identifier) {
        console.log('useCatalog: Nenhum identificador fornecido');
        return null;
      }

      console.log('useCatalog: Buscando loja para identificador:', identifier);

      let query = supabase
        .from('stores')
        .select('id, name, description, logo_url, is_active')
        .eq('is_active', true);

      // Determinar se é UUID (buscar por ID) ou string (buscar por slug)
      if (isValidUUID(identifier)) {
        console.log('useCatalog: Identificador é UUID, buscando por ID');
        query = query.eq('id', identifier);
      } else {
        console.log('useCatalog: Identificador é slug, buscando por url_slug');
        query = query.eq('url_slug', identifier);
      }

      const { data, error } = await query.single();

      if (error) {
        console.error('useCatalog: Erro ao buscar loja:', error);
        if (error.code === 'PGRST116') {
          console.log('useCatalog: Loja não encontrada');
          return null;
        }
        throw error;
      }

      console.log('useCatalog: Loja encontrada:', data?.name);
      return data;
    },
    enabled: !!identifier,
    retry: 1,
    refetchOnWindowFocus: false
  });

  // Hook para configurações da loja
  const { settings: storeSettings, loading: settingsLoading } = useStoreSettings(storeQuery.data?.id);

  // Query para buscar produtos da loja
  const productsQuery = useQuery({
    queryKey: ['catalog-products', storeQuery.data?.id, catalogType],
    queryFn: async () => {
      if (!storeQuery.data?.id) {
        console.log('useCatalog: Store ID não disponível para buscar produtos');
        return [];
      }

      console.log('useCatalog: Buscando produtos para store_id:', storeQuery.data.id, 'tipo:', catalogType);

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
    refetchOnWindowFocus: false
  });

  return {
    // Store data
    store: storeQuery.data,
    storeLoading: storeQuery.isLoading,
    storeError: storeQuery.error,
    
    // Products data
    products: productsQuery.data || [],
    productsLoading: productsQuery.isLoading,
    productsError: productsQuery.error,
    
    // Settings data
    storeSettings,
    settingsLoading,
    
    // Catalog type
    catalogType,
    setCatalogType,
    
    // Refetch functions
    refetchStore: storeQuery.refetch,
    refetchProducts: productsQuery.refetch
  };
};
