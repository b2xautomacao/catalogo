
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface Product {
  id: string;
  store_id: string;
  name: string;
  description: string | null;
  category: string | null;
  retail_price: number;
  wholesale_price: number | null;
  stock: number;
  min_wholesale_qty: number | null;
  image_url: string | null;
  is_active: boolean;
  meta_title: string | null;
  meta_description: string | null;
  keywords: string | null;
  seo_slug: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateProductData {
  store_id: string;
  name: string;
  description?: string;
  category?: string;
  retail_price: number;
  wholesale_price?: number;
  stock: number;
  min_wholesale_qty?: number;
  image_url?: string;
  is_active?: boolean;
  meta_title?: string;
  meta_description?: string;
  keywords?: string;
  seo_slug?: string;
}

export interface UpdateProductData extends Partial<CreateProductData> {
  id: string;
}

export const useProducts = (storeId?: string) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { profile } = useAuth();

  const fetchProducts = async () => {
    try {
      setLoading(true);
      let query = supabase.from('products').select('*');
      
      if (storeId) {
        query = query.eq('store_id', storeId);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Erro ao buscar produtos:', error);
    } finally {
      setLoading(false);
    }
  };

  const createProduct = async (productData: CreateProductData) => {
    try {
      const { data, error } = await supabase
        .from('products')
        .insert([{
          ...productData,
          store_id: profile?.store_id || productData.store_id
        }])
        .select()
        .single();

      if (error) throw error;
      await fetchProducts();
      return { data, error: null };
    } catch (error) {
      console.error('Erro ao criar produto:', error);
      return { data: null, error };
    }
  };

  const updateProduct = async (productData: UpdateProductData) => {
    try {
      const { id, ...updates } = productData;
      const { data, error } = await supabase
        .from('products')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      await fetchProducts();
      return { data, error: null };
    } catch (error) {
      console.error('Erro ao atualizar produto:', error);
      return { data: null, error };
    }
  };

  const deleteProduct = async (id: string) => {
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await fetchProducts();
      return { error: null };
    } catch (error) {
      console.error('Erro ao deletar produto:', error);
      return { error };
    }
  };

  const getProduct = async (id: string) => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Erro ao buscar produto:', error);
      return { data: null, error };
    }
  };

  useEffect(() => {
    if (profile) {
      fetchProducts();
    }
  }, [profile, storeId]);

  return {
    products,
    loading,
    fetchProducts,
    createProduct,
    updateProduct,
    deleteProduct,
    getProduct
  };
};
