
import { useState, useEffect, useMemo } from 'react';
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
  
  // Determinar se deve usar versão pública ou autenticada
  const usePublicVersion = !!storeIdentifier && !profile;
  
  // Hooks condicionais baseados no contexto
  const { products: authProducts, loading: authProductsLoading } = useProducts(
    usePublicVersion ? undefined : storeIdentifier
  );
  
  const { products: publicProducts, loading: publicProductsLoading, error: publicProductsError } = useProductsPublic(
    usePublicVersion ? storeIdentifier : undefined
  );

  // Usar configurações apropriadas
  const { settings: storeSettings, loading: storeSettingsLoading } = useStoreSettings(
    usePublicVersion ? undefined : storeIdentifier
  );
  
  const { settings: catalogSettings, loading: catalogSettingsLoading } = useCatalogSettings(
    usePublicVersion ? storeIdentifier : undefined
  );

  const { store, loading: storeLoading, error: storeError } = useStoreData(storeIdentifier);
  
  const [filters, setFilters] = useState<CatalogFilters>({});
  const [searchTerm, setSearchTerm] = useState('');

  // Unificar produtos e configurações baseado no contexto
  const products: CatalogProduct[] = useMemo(() => {
    if (usePublicVersion) {
      return publicProducts;
    }
    return authProducts;
  }, [usePublicVersion, publicProducts, authProducts]);

  const settings = useMemo(() => {
    if (usePublicVersion) {
      return catalogSettings;
    }
    return storeSettings;
  }, [usePublicVersion, catalogSettings, storeSettings]);

  const productsLoading = usePublicVersion ? publicProductsLoading : authProductsLoading;
  const settingsLoading = usePublicVersion ? catalogSettingsLoading : storeSettingsLoading;

  // Aplicar filtros e busca aos produtos
  const filteredProducts = useMemo(() => {
    console.log('useCatalog: Aplicando filtros:', filters);
    console.log('useCatalog: Produtos disponíveis:', products.length);
    
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
    
    return uniqueCategories.sort();
  }, [products]);

  // Função para atualizar filtros com validação
  const updateFilters = (newFilters: Partial<CatalogFilters>) => {
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
  };

  // Função para limpar filtros
  const clearFilters = () => {
    console.log('useCatalog: Limpando todos os filtros');
    setFilters({});
    setSearchTerm('');
  };

  // Funções de compatibilidade para Catalog.tsx
  const initializeCatalog = async (storeId: string, type: CatalogType) => {
    console.log('useCatalog: Inicializando catálogo:', storeId, type);
    
    // Verificar se o catálogo está ativo nas configurações
    if (settings) {
      const isActive = type === 'retail' 
        ? settings.retail_catalog_active !== false
        : settings.wholesale_catalog_active === true;
      
      if (!isActive) {
        console.warn('useCatalog: Catálogo não está ativo:', type);
        return false;
      }
    }
    
    return true;
  };

  const searchProducts = (query: string) => {
    setSearchTerm(query);
  };

  const filterProducts = (filterOptions: any) => {
    updateFilters(filterOptions);
  };

  // Verificar se o catálogo está ativo nas configurações
  const isCatalogActive = useMemo(() => {
    if (!settings) return true; // Default para ativo se não há configurações
    
    return catalogType === 'retail' 
      ? settings.retail_catalog_active !== false
      : settings.wholesale_catalog_active === true;
  }, [settings, catalogType]);

  const loading = productsLoading || settingsLoading || storeLoading;

  // Tratamento de erros específico para versão pública
  const error = usePublicVersion ? publicProductsError : null;

  // Obter store_id para uso no CheckoutModal
  const storeId = useMemo(() => {
    if (usePublicVersion && store) {
      return store.id;
    }
    return profile?.store_id;
  }, [usePublicVersion, store, profile?.store_id]);

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
    storeError: storeError || error,
    storeId, // Novo campo para CheckoutModal
    
    // Compatibilidade com Catalog.tsx
    filteredProducts,
    initializeCatalog,
    searchProducts,
    filterProducts
  };
};
