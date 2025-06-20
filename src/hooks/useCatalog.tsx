import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type CatalogType = 'retail' | 'wholesale';

export interface Product {
  id: string;
  name: string;
  description: string;
  category: string;
  retail_price: number;
  wholesale_price?: number;
  stock: number;
  is_active: boolean;
  image_url?: string;
  created_at: string;
  variations?: any[];
}

export interface Store {
  id: string;
  name: string;
  description: string;
  logo_url: string;
  catalog_type: CatalogType;
}

export const useCatalog = (storeIdentifier?: string, catalogType: CatalogType = 'retail') => {
  const [store, setStore] = useState<Store | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [storeError, setStoreError] = useState<string | null>(null);

  const loadStore = async (identifier: string) => {
    setLoading(true);
    setStoreError(null);
    try {
      const { data: storeData, error: storeError } = await supabase
        .from('stores')
        .select('*')
        .eq('identifier', identifier)
        .single();

      if (storeError) {
        console.error('Erro ao buscar loja:', storeError);
        setStoreError(`Erro ao buscar loja: ${storeError.message}`);
        setLoading(false);
        return false;
      }

      if (!storeData) {
        console.warn('Loja não encontrada');
        setStoreError('Loja não encontrada.');
        setLoading(false);
        return false;
      }

      setStore(storeData as Store);
      return storeData as Store;

    } catch (error) {
      console.error('Erro ao carregar loja:', error);
      setStoreError('Erro ao carregar loja.');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const loadProducts = async (storeId: string, type: CatalogType) => {
    setLoading(true);
    try {
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*')
        .eq('store_id', storeId)
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (productsError) {
        console.error('Erro ao buscar produtos:', productsError);
        setLoading(false);
        return false;
      }

      const typedProducts = productsData as Product[];
      
      if (type === 'wholesale') {
        const wholesaleProducts = typedProducts.filter(product => product.wholesale_price !== null && product.wholesale_price > 0);
        setProducts(wholesaleProducts);
        setFilteredProducts(wholesaleProducts);
      } else {
        setProducts(typedProducts);
        setFilteredProducts(typedProducts);
      }

      return true;
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const initializeCatalog = async (identifier: string, type: CatalogType) => {
    setLoading(true);
    setStoreError(null);
  
    const storeData = await loadStore(identifier);
    if (!storeData) {
      setLoading(false);
      return false;
    }
  
    const productsLoaded = await loadProducts(storeData.id, type);
    setLoading(false);
    return productsLoaded;
  };

  useEffect(() => {
    if (storeIdentifier) {
      initializeCatalog(storeIdentifier, catalogType);
    }
  }, [storeIdentifier, catalogType]);

  const searchProducts = (query: string) => {
    const searchTerm = query.toLowerCase();
    const results = products.filter(product =>
      product.name.toLowerCase().includes(searchTerm) ||
      product.description.toLowerCase().includes(searchTerm) ||
      product.category.toLowerCase().includes(searchTerm)
    );
    setFilteredProducts(results);
  };

  const filterProducts = (options: {
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
    console.log('useCatalog: Aplicando filtros:', options);
    
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
      filtered = filtered.filter(product => product.stock > 0);
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
    
    console.log('useCatalog: Produtos filtrados:', filtered.length);
    setFilteredProducts(filtered);
  };

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
