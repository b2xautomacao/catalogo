
import { useState, useEffect, useMemo, useCallback } from 'react';
import { useProducts } from '@/hooks/useProducts';
import { useProductsPublic, PublicProduct } from '@/hooks/useProductsPublic';
import { useStoreSettings } from '@/hooks/useStoreSettings';
import { useCatalogSettings } from '@/hooks/useCatalogSettings';
import { useStoreData } from '@/hooks/useStoreData';
import { useAuth } from '@/hooks/useAuth';

export type CatalogType = 'retail' | 'wholesale';

export interface CatalogFilters {
  category?: string | null;
  minPrice?: number | null;
  maxPrice?: number | null;
  inStock?: boolean;
  search?: string;
}

// Tipo unificado para produtos (com ou sem auth)
type CatalogProduct = PublicProduct & {
  // Campos que podem estar presentes apenas em produtos autenticados
};

export const useCatalog = (storeIdentifier?: string, catalogType: CatalogType = 'retail') => {
  const { profile } = useAuth();
  
  // Log inicial para debug
  console.log('useCatalog: Inicializando com:', { 
    storeIdentifier, 
    catalogType, 
    hasProfile: !!profile,
    profileStoreId: profile?.store_id 
  });
  
  // Determinar se deve usar versão pública ou autenticada
  const usePublicVersion = useMemo(() => {
    const shouldUsePublic = !!storeIdentifier && !profile;
    console.log('useCatalog: Determinando versão:', { 
      storeIdentifier: !!storeIdentifier, 
      hasProfile: !!profile, 
      usePublicVersion: shouldUsePublic 
    });
    return shouldUsePublic;
  }, [storeIdentifier, profile]);
  
  const [filters, setFilters] = useState<CatalogFilters>({});
  const [searchTerm, setSearchTerm] = useState('');

  // Hooks condicionais baseados no contexto
  const { products: authProducts, loading: authProductsLoading } = useProducts(
    usePublicVersion ? undefined : (profile?.store_id || storeIdentifier)
  );
  
  const { products: publicProducts, loading: publicProductsLoading, error: publicProductsError } = useProductsPublic(
    usePublicVersion ? storeIdentifier : undefined
  );

  // Usar configurações apropriadas
  const { settings: storeSettings, loading: storeSettingsLoading } = useStoreSettings(
    usePublicVersion ? undefined : (profile?.store_id || storeIdentifier)
  );
  
  const { settings: catalogSettings, loading: catalogSettingsLoading } = useCatalogSettings(
    usePublicVersion ? storeIdentifier : undefined
  );

  const { store, loading: storeLoading, error: storeError } = useStoreData(storeIdentifier);

  // Log do estado dos dados
  console.log('useCatalog: Estado dos dados:', {
    usePublicVersion,
    authProductsCount: authProducts.length,
    publicProductsCount: publicProducts.length,
    hasStoreSettings: !!storeSettings,
    hasCatalogSettings: !!catalogSettings,
    hasStore: !!store,
    authProductsLoading,
    publicProductsLoading,
    storeSettingsLoading,
    catalogSettingsLoading,
    storeLoading
  });

  // Unificar produtos e configurações baseado no contexto
  const products: CatalogProduct[] = useMemo(() => {
    const result = usePublicVersion ? publicProducts : authProducts;
    console.log('useCatalog: Produtos unificados:', { 
      usePublicVersion, 
      count: result.length 
    });
    return result;
  }, [usePublicVersion, publicProducts, authProducts]);

  const settings = useMemo(() => {
    const result = usePublicVersion ? catalogSettings : storeSettings;
    console.log('useCatalog: Configurações unificadas:', { 
      usePublicVersion, 
      hasSettings: !!result 
    });
    return result;
  }, [usePublicVersion, catalogSettings, storeSettings]);

  const productsLoading = usePublicVersion ? publicProductsLoading : authProductsLoading;
  const settingsLoading = usePublicVersion ? catalogSettingsLoading : storeSettingsLoading;

  // Aplicar filtros e busca aos produtos
  const filteredProducts = useMemo(() => {
    console.log('useCatalog: Aplicando filtros:', { 
      filters, 
      searchTerm, 
      productsCount: products.length 
    });
    
    if (!products.length) return [];

    let filtered = products.filter(product => {
      // Filtrar apenas produtos ativos (já garantido no público, mas mantendo para auth)
      if (!product.is_active) return false;

      // Filtro de categoria
      if (filters.category && product.category !== filters.category) {
        return false;
      }

      // Determinar preço baseado no tipo de catálogo
      const price = catalogType === 'wholesale' 
        ? (product.wholesale_price || product.retail_price)
        : product.retail_price;

      // Filtro de preço mínimo
      if (filters.minPrice !== null && filters.minPrice !== undefined) {
        if (price < filters.minPrice) return false;
      }

      // Filtro de preço máximo
      if (filters.maxPrice !== null && filters.maxPrice !== undefined) {
        if (price > filters.maxPrice) return false;
      }

      // Filtro de estoque
      if (filters.inStock) {
        const availableStock = (product.stock || 0) - (product.reserved_stock || 0);
        if (availableStock <= 0) return false;
      }

      // Filtro de busca
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const matchesName = product.name.toLowerCase().includes(searchLower);
        const matchesDescription = product.description?.toLowerCase().includes(searchLower);
        const matchesCategory = product.category?.toLowerCase().includes(searchLower);
        
        if (!matchesName && !matchesDescription && !matchesCategory) {
          return false;
        }
      }

      return true;
    });

    console.log('useCatalog: Produtos após filtros:', filtered.length);
    return filtered;
  }, [products, filters, searchTerm, catalogType]);

  // Obter categorias únicas dos produtos
  const categories = useMemo(() => {
    const uniqueCategories = Array.from(new Set(
      products
        .filter(product => product.is_active && product.category)
        .map(product => product.category!)
    ));
    
    console.log('useCatalog: Categorias encontradas:', uniqueCategories);
    return uniqueCategories.sort();
  }, [products]);

  // Função para atualizar filtros com validação
  const updateFilters = useCallback((newFilters: Partial<CatalogFilters>) => {
    console.log('useCatalog: Atualizando filtros:', newFilters);
    
    // Sanitizar filtros para evitar valores undefined
    const sanitizedFilters: CatalogFilters = {};
    
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        (sanitizedFilters as any)[key] = value;
      }
    });

    setFilters(prev => ({
      ...prev,
      ...sanitizedFilters
    }));
  }, []);

  // Função para limpar filtros
  const clearFilters = useCallback(() => {
    console.log('useCatalog: Limpando todos os filtros');
    setFilters({});
    setSearchTerm('');
  }, []);

  // Funções de compatibilidade para Catalog.tsx
  const initializeCatalog = useCallback(async (storeId: string, type: CatalogType) => {
    console.log('useCatalog: Inicializando catálogo:', { storeId, type });
    
    // Verificar se o catálogo está ativo nas configurações
    if (settings) {
      const isActive = type === 'retail' 
        ? settings.retail_catalog_active !== false
        : settings.wholesale_catalog_active === true;
      
      console.log('useCatalog: Status do catálogo:', { type, isActive });
      
      if (!isActive) {
        console.warn('useCatalog: Catálogo não está ativo:', type);
        return false;
      }
    } else {
      console.log('useCatalog: Configurações ainda não carregadas, assumindo ativo');
    }
    
    return true;
  }, [settings]);

  const searchProducts = useCallback((query: string) => {
    console.log('useCatalog: Buscando produtos:', query);
    setSearchTerm(query);
  }, []);

  const filterProducts = useCallback((filterOptions: any) => {
    console.log('useCatalog: Aplicando filtros de produtos:', filterOptions);
    updateFilters(filterOptions);
  }, [updateFilters]);

  // Verificar se o catálogo está ativo nas configurações
  const isCatalogActive = useMemo(() => {
    if (!settings) {
      console.log('useCatalog: Configurações não disponíveis, assumindo catálogo ativo');
      return true; // Default para ativo se não há configurações
    }
    
    const isActive = catalogType === 'retail' 
      ? settings.retail_catalog_active !== false
      : settings.wholesale_catalog_active === true;
    
    console.log('useCatalog: Status do catálogo:', { catalogType, isActive });
    return isActive;
  }, [settings, catalogType]);

  const loading = productsLoading || settingsLoading || storeLoading;

  // Tratamento de erros específico para versão pública
  const error = usePublicVersion ? (publicProductsError || storeError) : storeError;

  // Obter store_id para uso no CheckoutModal
  const storeId = useMemo(() => {
    const result = usePublicVersion && store ? store.id : profile?.store_id;
    console.log('useCatalog: Store ID para checkout:', { usePublicVersion, storeId: result });
    return result;
  }, [usePublicVersion, store, profile?.store_id]);

  // Log final do estado
  console.log('useCatalog: Estado final:', {
    filteredProductsCount: filteredProducts.length,
    allProductsCount: products.length,
    categoriesCount: categories.length,
    loading,
    hasError: !!error,
    isCatalogActive,
    storeId
  });

  return {
    // Retorno original
    products: filteredProducts,
    allProducts: products,
    categories,
    filters,
    searchTerm,
    loading,
    settings,
    isCatalogActive,
    updateFilters,
    setSearchTerm,
    clearFilters,
    hasActiveFilters: Object.keys(filters).length > 0 || searchTerm.length > 0,
    
    // Dados da loja (agora reais)
    store,
    storeError: error,
    storeId,
    
    // Compatibilidade com Catalog.tsx
    filteredProducts,
    initializeCatalog,
    searchProducts,
    filterProducts
  };
};
