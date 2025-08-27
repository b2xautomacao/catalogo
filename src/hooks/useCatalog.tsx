
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Product, ProductVariation } from '@/types/product';

export type CatalogType = 'retail' | 'wholesale';

// Interface Store alinhada com os dados reais do Supabase
export interface Store {
  id: string;
  name: string;
  description: string | null;
  logo_url: string | null;
  owner_id: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  url_slug: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  cnpj: string | null;
  plan_type: string;
  monthly_fee: number;
}

export const useCatalog = (storeIdentifier?: string, catalogType: CatalogType = 'retail') => {
  const [store, setStore] = useState<Store | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [storeError, setStoreError] = useState<string | null>(null);
  
  // Use refs to avoid recreating functions on every render
  const loadedStoreRef = useRef<string | null>(null);
  const loadedCatalogTypeRef = useRef<CatalogType | null>(null);

  const loadStore = useCallback(async (identifier: string) => {
    setLoading(true);
    setStoreError(null);
    try {
      console.log('🏪 CATÁLOGO - Carregando loja:', identifier);

      // Buscar primeiro por url_slug, depois por ID se não encontrar
      let { data: storeData, error: storeError } = await supabase
        .from('stores')
        .select('*')
        .eq('url_slug', identifier)
        .eq('is_active', true)
        .single();

      // Se não encontrou por url_slug, tentar por ID
      if (storeError && storeError.code === 'PGRST116') {
        console.log('🔄 CATÁLOGO - Tentando buscar por ID:', identifier);
        const { data: storeByIdData, error: storeByIdError } = await supabase
          .from('stores')
          .select('*')
          .eq('id', identifier)
          .eq('is_active', true)
          .single();
        
        storeData = storeByIdData;
        storeError = storeByIdError;
      }

      if (storeError) {
        console.error('❌ Erro ao buscar loja:', storeError);
        setStoreError(`Loja não encontrada ou inativa`);
        setStore(null);
        setLoading(false);
        return false;
      }

      if (!storeData) {
        console.warn('⚠️ Loja não encontrada:', identifier);
        setStoreError('Loja não encontrada.');
        setStore(null);
        setLoading(false);
        return false;
      }

      console.log('✅ Loja carregada:', {
        id: storeData.id,
        name: storeData.name,
        url_slug: storeData.url_slug,
        is_active: storeData.is_active
      });

      setStore(storeData);
      return storeData;

    } catch (error) {
      console.error('🚨 Erro ao carregar loja:', error);
      setStoreError('Erro ao carregar loja.');
      setStore(null);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const loadProducts = useCallback(async (storeId: string, type: CatalogType) => {
    setLoading(true);
    try {
      console.log('📦 CATÁLOGO - Carregando produtos com variações (LEFT JOIN):', {
        storeId,
        type,
        timestamp: new Date().toISOString()
      });

      // Usar LEFT JOIN para incluir produtos sem variações
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select(`
          *,
          product_variations (
            id,
            product_id,
            color,
            size,
            sku,
            stock,
            price_adjustment,
            is_active,
            image_url,
            created_at,
            updated_at
          )
        `)
        .eq('store_id', storeId)
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (productsError) {
        console.error('❌ Erro ao buscar produtos:', productsError);
        setLoading(false);
        return false;
      }

      // Transformar os dados para incluir variações corretamente
      const productsWithVariations = productsData?.map(product => ({
        ...product,
        variations: product.product_variations
          ?.filter(variation => variation.is_active) // Filtrar apenas variações ativas
          ?.map(variation => ({
            id: variation.id,
            product_id: variation.product_id,
            color: variation.color,
            size: variation.size,
            sku: variation.sku,
            stock: variation.stock,
            price_adjustment: variation.price_adjustment,
            is_active: variation.is_active,
            image_url: variation.image_url,
            created_at: variation.created_at,
            updated_at: variation.updated_at
          })) || []
      })) || [];

      console.log('✅ CATÁLOGO - Produtos carregados (incluindo sem variações):', {
        total: productsWithVariations.length,
        withVariations: productsWithVariations.filter(p => p.variations?.length > 0).length,
        withoutVariations: productsWithVariations.filter(p => !p.variations?.length).length,
        preview: productsWithVariations.slice(0, 3).map(p => ({
          name: p.name,
          variations: p.variations?.length || 0,
          hasStock: p.stock > 0
        }))
      });
      
      if (type === 'wholesale') {
        const wholesaleProducts = productsWithVariations.filter(product => 
          product.wholesale_price !== null && product.wholesale_price > 0
        );
        console.log('🏪 CATÁLOGO - Produtos atacado filtrados:', wholesaleProducts.length);
        setProducts(wholesaleProducts);
        setFilteredProducts(wholesaleProducts);
      } else {
        setProducts(productsWithVariations);
        setFilteredProducts(productsWithVariations);
      }

      return true;
    } catch (error) {
      console.error('🚨 Erro ao carregar produtos:', error);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const initializeCatalog = useCallback(async (identifier: string, type: CatalogType) => {
    // Avoid reloading if same store and catalog type
    if (loadedStoreRef.current === identifier && loadedCatalogTypeRef.current === type && store) {
      console.log('ℹ️ CATÁLOGO - Cache hit, não recarregando');
      return true;
    }

    console.log('🚀 CATÁLOGO - Inicializando:', { identifier, type });

    setLoading(true);
    setStoreError(null);
  
    const storeData = await loadStore(identifier);
    if (!storeData) {
      setLoading(false);
      return false;
    }
  
    const productsLoaded = await loadProducts(storeData.id, type);
    
    if (productsLoaded) {
      loadedStoreRef.current = identifier;
      loadedCatalogTypeRef.current = type;
      console.log('✅ CATÁLOGO - Inicialização concluída com sucesso');
    }
    
    setLoading(false);
    return productsLoaded;
  }, [loadStore, loadProducts, store]);

  // Only initialize when store identifier or catalog type actually changes
  useEffect(() => {
    if (storeIdentifier && 
        (loadedStoreRef.current !== storeIdentifier || loadedCatalogTypeRef.current !== catalogType)) {
      initializeCatalog(storeIdentifier, catalogType);
    }
  }, [storeIdentifier, catalogType, initializeCatalog]);

  const searchProducts = useCallback((query: string) => {
    const searchTerm = query.toLowerCase();
    const results = products.filter(product =>
      product.name.toLowerCase().includes(searchTerm) ||
      (product.description && product.description.toLowerCase().includes(searchTerm)) ||
      (product.category && product.category.toLowerCase().includes(searchTerm))
    );
    console.log('🔍 CATÁLOGO - Busca realizada:', {
      query,
      results: results.length
    });
    setFilteredProducts(results);
  }, [products]);

  const filterProducts = useCallback((options: {
    category?: string;
    minPrice?: number;
    maxPrice?: number;
    inStock?: boolean;
    variations?: {
      sizes?: string[];
      colors?: string[];
      materials?: string[];
    };
  } = {}) => {
    console.log('🎯 CATÁLOGO - Aplicando filtros:', options);
    
    let filtered = [...products];
    
    // Filtro por categoria
    if (options.category) {
      filtered = filtered.filter(product => 
        product.category === options.category
      );
    }
    
    // Filtro por preço
    if (options.minPrice !== undefined || options.maxPrice !== undefined) {
      filtered = filtered.filter(product => {
        const price = product.retail_price;
        const min = options.minPrice ?? 0;
        const max = options.maxPrice ?? Infinity;
        return price >= min && price <= max;
      });
    }
    
    // Filtro por estoque
    if (options.inStock) {
      filtered = filtered.filter(product => {
        // Verificar estoque do produto principal
        if (product.stock > 0) return true;
        
        // Verificar estoque nas variações
        if (product.variations && product.variations.length > 0) {
          return product.variations.some(v => v.stock > 0);
        }
        
        return false;
      });
    }
    
    // Filtros por variações
    if (options.variations) {
      const { sizes, colors, materials } = options.variations;
      
      if (sizes?.length || colors?.length || materials?.length) {
        filtered = filtered.filter(product => {
          if (!product.variations || !Array.isArray(product.variations)) {
            return false;
          }
          
          return product.variations.some((variation: any) => {
            let matches = true;
            
            if (sizes?.length) {
              matches = matches && sizes.includes(variation.size);
            }
            
            if (colors?.length) {
              matches = matches && colors.includes(variation.color);
            }
            
            if (materials?.length) {
              matches = matches && materials.includes(variation.material);
            }
            
            return matches;
          });
        });
      }
    }
    
    console.log('✅ CATÁLOGO - Filtros aplicados:', {
      original: products.length,
      filtered: filtered.length
    });
    
    setFilteredProducts(filtered);
  }, [products]);

  return {
    store,
    storeError,
    products,
    filteredProducts,
    loading,
    initializeCatalog,
    searchProducts,
    filterProducts
  };
};
