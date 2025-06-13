
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface Store {
  id: string;
  name: string;
  description: string | null;
  owner_id: string;
  is_active: boolean;
  plan_type: string;
  monthly_fee: number | null;
  url_slug: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  cnpj: string | null;
  logo_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateStoreData {
  name: string;
  description?: string;
  owner_id: string;
  is_active?: boolean;
  plan_type?: string;
  monthly_fee?: number;
  url_slug?: string;
  phone?: string;
  email?: string;
  address?: string;
  cnpj?: string;
  logo_url?: string;
}

export interface UpdateStoreData {
  name?: string;
  description?: string;
  is_active?: boolean;
  plan_type?: string;
  monthly_fee?: number;
  url_slug?: string;
  phone?: string;
  email?: string;
  address?: string;
  cnpj?: string;
  logo_url?: string;
}

export const useStores = () => {
  const [stores, setStores] = useState<Store[]>([]);
  const [currentStore, setCurrentStore] = useState<Store | null>(null);
  const [loading, setLoading] = useState(true);
  const { profile } = useAuth();

  const fetchStores = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('stores')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setStores(data || []);
    } catch (error) {
      console.error('Erro ao buscar lojas:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCurrentStore = async () => {
    try {
      if (!profile?.store_id) return;

      const { data, error } = await supabase
        .from('stores')
        .select('*')
        .eq('id', profile.store_id)
        .single();

      if (error) throw error;
      setCurrentStore(data);
    } catch (error) {
      console.error('Erro ao buscar loja atual:', error);
    }
  };

  const createStore = async (storeData: CreateStoreData) => {
    try {
      const { data, error } = await supabase
        .from('stores')
        .insert([storeData])
        .select()
        .single();

      if (error) throw error;
      await fetchStores();
      return { data, error: null };
    } catch (error) {
      console.error('Erro ao criar loja:', error);
      return { data: null, error };
    }
  };

  const updateStore = async (id: string, updates: UpdateStoreData) => {
    try {
      const { data, error } = await supabase
        .from('stores')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      await fetchStores();
      await fetchCurrentStore();
      return { data, error: null };
    } catch (error) {
      console.error('Erro ao atualizar loja:', error);
      return { data: null, error };
    }
  };

  const updateCurrentStore = async (updates: UpdateStoreData) => {
    if (!profile?.store_id) {
      return { data: null, error: 'Store ID não encontrado' };
    }
    return updateStore(profile.store_id, updates);
  };

  const updateStoreSlug = async (id: string, slug: string) => {
    try {
      const { data, error } = await supabase
        .from('stores')
        .update({ url_slug: slug })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      await fetchStores();
      await fetchCurrentStore();
      return { data, error: null };
    } catch (error) {
      console.error('Erro ao atualizar slug da loja:', error);
      return { data: null, error };
    }
  };

  useEffect(() => {
    if (profile) {
      if (profile.role === 'superadmin') {
        fetchStores();
      } else {
        fetchCurrentStore();
      }
    }
  }, [profile]);

  return {
    stores,
    currentStore,
    loading,
    fetchStores,
    fetchCurrentStore,
    createStore,
    updateStore,
    updateCurrentStore,
    updateStoreSlug
  };
};
