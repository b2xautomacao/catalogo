
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Product } from '@/hooks/useProducts';

export interface CatalogStore {
  id: string;
  name: string;
  description: string | null;
  owner_id: string;
  is_active: boolean;
  url_slug: string | null;
  created_at: string;
  updated_at: string;
}

export interface CatalogSettings {
  id: string;
  store_id: string;
  retail_catalog_active: boolean | null;
  wholesale_catalog_active: boolean | null;
  whatsapp_number: string | null;
  whatsapp_integration_active: boolean | null;
  payment_methods: {
    pix: boolean;
    bank_slip: boolean;
    credit_card: boolean;
  } | null;
  shipping_options: {
    pickup: boolean;
    delivery: boolean;
    shipping: boolean;
  } | null;
  business_hours: any;
  created_at: string;
  updated_at: string;
}

export type CatalogType = 'retail' | 'wholesale';
export type CheckoutType = 'whatsapp' | 'online' | 'fluid';

export const useCatalog = (storeIdentifier?: string) => {
  const [store, setStore] = useState<CatalogStore | null>(null);
  const [settings, setSettings] = useState<CatalogSettings | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);

  const fetchStoreBySlugOrId = async (identifier: string) => {
    try {
      console.log('Buscando loja por identifier:', identifier);
      
      // Primeiro tenta buscar por slug
      let { data, error } = await supabase
        .from('stores')
        .select('*')
        .eq('url_slug', identifier)
        .eq('is_active', true)
        .single();

      // Se não encontrou por slug, tenta por ID
      if (!data || error) {
        console.log('Não encontrou por slug, tentando por ID...');
        const result = await supabase
          .from('stores')
          .select('*')
          .eq('id', identifier)
          .eq('is_active', true)
          .single();
        
        data = result.data;
        error = result.error;
      }

      if (error) {
        console.error('Erro ao buscar loja:', error);
        throw error;
      }
      
      console.log('Loja encontrada:', data);
      setStore(data);
      return data.id;
    } catch (error) {
      console.error('Erro ao buscar loja:', error);
      return null;
    }
  };

  const fetchSettings = async (storeId: string) => {
    try {
      console.log('Buscando configurações para store:', storeId);
      const { data, error } = await supabase
        .from('store_settings')
        .select('*')
        .eq('store_id', storeId)
        .single();

      if (error) {
        console.error('Erro ao buscar configurações:', error);
        throw error;
      }
      
      // Converter e validar os dados JSON
      const processedSettings: CatalogSettings = {
        ...data,
        payment_methods: data.payment_methods ? {
          pix: (data.payment_methods as any)?.pix || false,
          bank_slip: (data.payment_methods as any)?.bank_slip || false,
          credit_card: (data.payment_methods as any)?.credit_card || false,
        } : {
          pix: false,
          bank_slip: false,
          credit_card: false,
        },
        shipping_options: data.shipping_options ? {
          pickup: (data.shipping_options as any)?.pickup || false,
          delivery: (data.shipping_options as any)?.delivery || false,
          shipping: (data.shipping_options as any)?.shipping || false,
        } : {
          pickup: true,
          delivery: false,
          shipping: false,
        }
      };

      console.log('Configurações processadas:', processedSettings);
      setSettings(processedSettings);
      return processedSettings;
    } catch (error) {
      console.error('Erro ao buscar configurações:', error);
      return null;
    }
  };

  const fetchProducts = async (storeId: string, catalogType: CatalogType) => {
    try {
      setLoading(true);
      console.log('Buscando produtos para store:', storeId, 'tipo:', catalogType);
      
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('store_id', storeId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Filtrar produtos baseado no tipo de catálogo
      const filtered = data?.filter(product => {
        if (catalogType === 'wholesale') {
          return product.wholesale_price && product.min_wholesale_qty;
        }
        return true;
      }) || [];

      console.log('Produtos filtrados:', filtered.length);
      setProducts(filtered);
      setFilteredProducts(filtered);
    } catch (error) {
      console.error('Erro ao buscar produtos:', error);
    } finally {
      setLoading(false);
    }
  };

  const searchProducts = (query: string) => {
    if (!query.trim()) {
      setFilteredProducts(products);
      return;
    }

    const filtered = products.filter(product =>
      product.name.toLowerCase().includes(query.toLowerCase()) ||
      product.description?.toLowerCase().includes(query.toLowerCase()) ||
      product.category?.toLowerCase().includes(query.toLowerCase())
    );

    setFilteredProducts(filtered);
  };

  const filterProducts = (filters: {
    category?: string;
    minPrice?: number;
    maxPrice?: number;
    inStock?: boolean;
  }) => {
    let filtered = products;

    if (filters.category) {
      filtered = filtered.filter(p => p.category === filters.category);
    }

    if (filters.minPrice !== undefined) {
      filtered = filtered.filter(p => p.retail_price >= filters.minPrice!);
    }

    if (filters.maxPrice !== undefined) {
      filtered = filtered.filter(p => p.retail_price <= filters.maxPrice!);
    }

    if (filters.inStock) {
      filtered = filtered.filter(p => p.stock > 0);
    }

    setFilteredProducts(filtered);
  };

  const initializeCatalog = async (identifier: string, catalogType: CatalogType) => {
    console.log('Inicializando catálogo:', identifier, catalogType);
    const storeId = await fetchStoreBySlugOrId(identifier);
    if (storeId) {
      const settings = await fetchSettings(storeId);
      
      // Verificar se o tipo de catálogo está ativo
      if (catalogType === 'wholesale' && settings && !settings.wholesale_catalog_active) {
        console.warn('Catálogo de atacado não está ativo');
        return false;
      }
      
      if (catalogType === 'retail' && settings && !settings.retail_catalog_active) {
        console.warn('Catálogo de varejo não está ativo');
        return false;
      }
      
      await fetchProducts(storeId, catalogType);
      return true;
    }
    return false;
  };

  useEffect(() => {
    if (storeIdentifier) {
      // Resetar estado
      setStore(null);
      setSettings(null);
      setProducts([]);
      setFilteredProducts([]);
      
      // Inicializar com tipo padrão (será sobrescrito pela página)
      initializeCatalog(storeIdentifier, 'retail');
    }
  }, [storeIdentifier]);

  return {
    store,
    settings,
    products,
    filteredProducts,
    loading,
    fetchProducts: (storeId: string, catalogType: CatalogType) => fetchProducts(storeId, catalogType),
    searchProducts,
    filterProducts,
    initializeCatalog
  };
};
