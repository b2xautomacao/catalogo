
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useStoreResolver } from '@/hooks/useStoreResolver';

export interface PublicProduct {
  id: string;
  store_id: string;
  name: string;
  description: string | null;
  category: string | null;
  retail_price: number;
  wholesale_price: number | null;
  stock: number;
  reserved_stock: number;
  min_wholesale_qty: number | null;
  image_url: string | null;
  is_active: boolean;
  allow_negative_stock: boolean;
  stock_alert_threshold: number | null;
  meta_title: string | null;
  meta_description: string | null;
  keywords: string | null;
  seo_slug: string | null;
  created_at: string;
  updated_at: string;
}

export const useProductsPublic = (storeIdentifier?: string) => {
  const [products, setProducts] = useState<PublicProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { resolveStoreId } = useStoreResolver();

  const fetchProducts = async (identifier: string) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('useProductsPublic: Resolvendo store ID para:', identifier);
      
      // Timeout de segurança
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout: Resolução do store ID demorou mais de 5 segundos')), 5000)
      );

      // Resolver store ID com timeout
      const storeIdPromise = resolveStoreId(identifier);
      const storeId = await Promise.race([storeIdPromise, timeoutPromise]) as string | null;
      
      if (!storeId) {
        setError('Loja não encontrada');
        setProducts([]);
        return;
      }

      console.log('useProductsPublic: Buscando produtos para loja:', storeId);

      // Timeout para busca de produtos
      const productsTimeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout: Busca de produtos demorou mais de 10 segundos')), 10000)
      );

      const productsPromise = supabase
        .from('products')
        .select('*')
        .eq('store_id', storeId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      const { data, error: fetchError } = await Promise.race([productsPromise, productsTimeoutPromise]) as any;

      if (fetchError) {
        console.error('useProductsPublic: Erro ao buscar produtos:', fetchError);
        throw fetchError;
      }

      console.log('useProductsPublic: Produtos encontrados:', data?.length || 0);
      setProducts(data || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar produtos';
      console.error('useProductsPublic: Erro geral:', err);
      setError(errorMessage);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (storeIdentifier) {
      fetchProducts(storeIdentifier);
    } else {
      setProducts([]);
      setLoading(false);
      setError(null);
    }
  }, [storeIdentifier]);

  return {
    products,
    loading,
    error,
    fetchProducts: () => storeIdentifier && fetchProducts(storeIdentifier)
  };
};
