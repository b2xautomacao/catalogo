
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export interface Product {
  id: string;
  store_id: string;
  name: string;
  description?: string;
  retail_price: number;
  wholesale_price?: number;
  category?: string;
  stock: number;
  min_wholesale_qty?: number;
  image_url?: string;
  meta_title?: string;
  meta_description?: string;
  keywords?: string;
  seo_slug?: string;
  is_featured?: boolean;
  allow_negative_stock?: boolean;
  stock_alert_threshold?: number;
  is_active?: boolean;
  reserved_stock?: number;
  created_at?: string;
  updated_at?: string;
  variations?: Array<{
    id: string;
    size?: string;
    color?: string;
    price_adjustment?: number;
    stock: number;
  }>;
}

export interface CreateProductData {
  store_id: string;
  name: string;
  description?: string;
  retail_price: number;
  wholesale_price?: number;
  category?: string;
  stock: number;
  min_wholesale_qty?: number;
  meta_title?: string;
  meta_description?: string;
  keywords?: string;
  seo_slug?: string;
  is_featured?: boolean;
  allow_negative_stock?: boolean;
  stock_alert_threshold?: number;
  is_active?: boolean;
}

export interface UpdateProductData extends CreateProductData {
  id: string;
}

export const useProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { profile } = useAuth();
  const { toast } = useToast();

  const fetchProducts = useCallback(async () => {
    if (!profile?.store_id) {
      console.log('useProducts: Store ID não disponível');
      setLoading(false);
      return;
    }

    try {
      setError(null);
      console.log('useProducts: Buscando produtos para store_id:', profile.store_id);

      const { data, error: fetchError } = await supabase
        .from('products')
        .select('*')
        .eq('store_id', profile.store_id)
        .order('created_at', { ascending: false });

      if (fetchError) {
        console.error('useProducts: Erro ao buscar produtos:', fetchError);
        throw fetchError;
      }

      console.log('useProducts: Produtos carregados:', data?.length || 0);
      setProducts(data || []);
    } catch (error) {
      console.error('useProducts: Erro:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro ao carregar produtos';
      setError(errorMessage);
      toast({
        title: 'Erro ao carregar produtos',
        description: errorMessage,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [profile?.store_id, toast]);

  const createProduct = useCallback(async (productData: CreateProductData) => {
    console.log('=== CRIANDO PRODUTO ===');
    console.log('Dados recebidos:', productData);

    try {
      // Validar dados obrigatórios
      if (!productData.name?.trim()) {
        throw new Error('Nome do produto é obrigatório');
      }
      
      if (!productData.retail_price || productData.retail_price <= 0) {
        throw new Error('Preço de varejo deve ser maior que zero');
      }

      if (!productData.store_id) {
        throw new Error('Store ID é obrigatório');
      }

      // Preparar dados limpos para inserção - REMOVENDO qualquer referência a 'price'
      const cleanData = {
        store_id: productData.store_id,
        name: productData.name.trim(),
        description: productData.description?.trim() || null,
        retail_price: productData.retail_price,
        wholesale_price: productData.wholesale_price || null,
        category: productData.category?.trim() || null,
        stock: productData.stock || 0,
        min_wholesale_qty: productData.min_wholesale_qty || 1,
        meta_title: productData.meta_title?.trim() || null,
        meta_description: productData.meta_description?.trim() || null,
        keywords: productData.keywords?.trim() || null,
        seo_slug: productData.seo_slug?.trim() || null,
        is_featured: productData.is_featured || false,
        allow_negative_stock: productData.allow_negative_stock || false,
        stock_alert_threshold: productData.stock_alert_threshold || 5,
        is_active: true
      };

      console.log('Dados limpos para inserção:', cleanData);

      const { data, error } = await supabase
        .from('products')
        .insert(cleanData)
        .select()
        .single();

      if (error) {
        console.error('Erro ao criar produto:', error);
        throw error;
      }

      console.log('Produto criado com sucesso:', data);

      // Recarregar produtos
      await fetchProducts();

      toast({
        title: 'Produto criado!',
        description: `${productData.name} foi criado com sucesso.`
      });

      return { data, error: null };
    } catch (error) {
      console.error('useProducts: Erro ao criar produto:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro ao criar produto';
      
      toast({
        title: 'Erro ao criar produto',
        description: errorMessage,
        variant: 'destructive'
      });

      return { data: null, error: errorMessage };
    }
  }, [fetchProducts, toast]);

  const updateProduct = useCallback(async (productData: UpdateProductData) => {
    console.log('=== ATUALIZANDO PRODUTO ===');
    console.log('Dados recebidos:', productData);

    try {
      if (!productData.id) {
        throw new Error('ID do produto é obrigatório');
      }

      if (!productData.name?.trim()) {
        throw new Error('Nome do produto é obrigatório');
      }
      
      if (!productData.retail_price || productData.retail_price <= 0) {
        throw new Error('Preço de varejo deve ser maior que zero');
      }

      // Preparar dados limpos para atualização - REMOVENDO qualquer referência a 'price'
      const cleanData = {
        name: productData.name.trim(),
        description: productData.description?.trim() || null,
        retail_price: productData.retail_price,
        wholesale_price: productData.wholesale_price || null,
        category: productData.category?.trim() || null,
        stock: productData.stock || 0,
        min_wholesale_qty: productData.min_wholesale_qty || 1,
        meta_title: productData.meta_title?.trim() || null,
        meta_description: productData.meta_description?.trim() || null,
        keywords: productData.keywords?.trim() || null,
        seo_slug: productData.seo_slug?.trim() || null,
        is_featured: productData.is_featured || false,
        allow_negative_stock: productData.allow_negative_stock || false,
        stock_alert_threshold: productData.stock_alert_threshold || 5,
        updated_at: new Date().toISOString()
      };

      console.log('Dados limpos para atualização:', cleanData);

      const { data, error } = await supabase
        .from('products')
        .update(cleanData)
        .eq('id', productData.id)
        .eq('store_id', productData.store_id)
        .select()
        .single();

      if (error) {
        console.error('Erro ao atualizar produto:', error);
        throw error;
      }

      console.log('Produto atualizado com sucesso:', data);

      // Recarregar produtos
      await fetchProducts();

      toast({
        title: 'Produto atualizado!',
        description: `${productData.name} foi atualizado com sucesso.`
      });

      return { data, error: null };
    } catch (error) {
      console.error('useProducts: Erro ao atualizar produto:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro ao atualizar produto';
      
      toast({
        title: 'Erro ao atualizar produto',
        description: errorMessage,
        variant: 'destructive'
      });

      return { data: null, error: errorMessage };
    }
  }, [fetchProducts, toast]);

  const deleteProduct = useCallback(async (productId: string) => {
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);

      if (error) throw error;

      await fetchProducts();
      
      toast({
        title: 'Produto excluído',
        description: 'O produto foi excluído com sucesso.'
      });

      return { error: null };
    } catch (error) {
      console.error('useProducts: Erro ao excluir produto:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro ao excluir produto';
      
      toast({
        title: 'Erro ao excluir produto',
        description: errorMessage,
        variant: 'destructive'
      });

      return { error: errorMessage };
    }
  }, [fetchProducts, toast]);

  useEffect(() => {
    if (profile?.store_id) {
      fetchProducts();
    }
  }, [fetchProducts, profile?.store_id]);

  return {
    products,
    loading,
    error,
    fetchProducts,
    createProduct,
    updateProduct,
    deleteProduct
  };
};
