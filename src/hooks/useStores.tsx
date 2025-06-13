
import { useState, useEffect, useCallback, useRef } from 'react';
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
  const [error, setError] = useState<string | null>(null);
  const { profile, user } = useAuth();
  
  // Refs para controle de requests
  const currentStoreCache = useRef<{ data: Store; timestamp: number } | null>(null);
  const requestInProgress = useRef(false);

  // Função para aguardar o profile estar disponível
  const waitForProfile = useCallback(async (maxAttempts = 15): Promise<void> => {
    let attempts = 0;
    while (attempts < maxAttempts && (!profile || !profile.store_id)) {
      console.log(`useStores: Aguardando profile (tentativa ${attempts + 1}/${maxAttempts})`);
      await new Promise(resolve => setTimeout(resolve, 200));
      attempts++;
    }
    
    if (!profile || !profile.store_id) {
      throw new Error('Profile ou Store ID não disponível após aguardar');
    }
  }, [profile]);

  const fetchStores = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error: fetchError } = await supabase
        .from('stores')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setStores(data || []);
    } catch (error) {
      console.error('Erro ao buscar lojas:', error);
      setError(error instanceof Error ? error.message : 'Erro ao buscar lojas');
    } finally {
      setLoading(false);
    }
  };

  const fetchCurrentStore = useCallback(async (forceRefresh = false) => {
    // Evitar requests simultâneos
    if (requestInProgress.current && !forceRefresh) {
      console.log('useStores: Request já em andamento, aguardando...');
      return;
    }

    try {
      requestInProgress.current = true;
      setLoading(true);
      setError(null);
      
      // Aguardar profile estar disponível
      await waitForProfile();
      
      if (!profile?.store_id) {
        console.log('useStores: Nenhum store_id no profile');
        setCurrentStore(null);
        return;
      }

      // Verificar cache (válido por 2 minutos)
      const cached = currentStoreCache.current;
      const now = Date.now();
      if (!forceRefresh && cached && now - cached.timestamp < 120000) {
        console.log('useStores: Usando dados do cache');
        setCurrentStore(cached.data);
        return;
      }

      console.log('useStores: Buscando loja atual:', profile.store_id);

      const { data, error: fetchError } = await supabase
        .from('stores')
        .select('*')
        .eq('id', profile.store_id)
        .single();

      if (fetchError) {
        console.error('useStores: Erro ao buscar loja atual:', fetchError);
        throw fetchError;
      }
      
      console.log('useStores: Loja atual carregada:', data);
      
      // Atualizar cache
      currentStoreCache.current = {
        data,
        timestamp: now
      };
      
      setCurrentStore(data);
    } catch (error) {
      console.error('Erro ao buscar loja atual:', error);
      setError(error instanceof Error ? error.message : 'Erro ao buscar loja atual');
      setCurrentStore(null);
    } finally {
      setLoading(false);
      requestInProgress.current = false;
    }
  }, [profile, waitForProfile]);

  const createStore = async (storeData: CreateStoreData) => {
    try {
      setError(null);
      
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
      const errorMessage = error instanceof Error ? error.message : 'Erro ao criar loja';
      setError(errorMessage);
      return { data: null, error: errorMessage };
    }
  };

  const updateStore = async (id: string, updates: UpdateStoreData) => {
    try {
      setError(null);
      
      const { data, error } = await supabase
        .from('stores')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      // Invalidar cache
      currentStoreCache.current = null;
      
      await fetchStores();
      await fetchCurrentStore(true);
      return { data, error: null };
    } catch (error) {
      console.error('Erro ao atualizar loja:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro ao atualizar loja';
      setError(errorMessage);
      return { data: null, error: errorMessage };
    }
  };

  const updateCurrentStore = async (updates: UpdateStoreData) => {
    if (!profile?.store_id) {
      const errorMessage = 'Store ID não encontrado';
      setError(errorMessage);
      return { data: null, error: errorMessage };
    }
    return updateStore(profile.store_id, updates);
  };

  const updateStoreSlug = async (id: string, slug: string) => {
    try {
      setError(null);
      
      const { data, error } = await supabase
        .from('stores')
        .update({ url_slug: slug })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      // Invalidar cache
      currentStoreCache.current = null;
      
      await fetchStores();
      await fetchCurrentStore(true);
      return { data, error: null };
    } catch (error) {
      console.error('Erro ao atualizar slug da loja:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro ao atualizar slug da loja';
      setError(errorMessage);
      return { data: null, error: errorMessage };
    }
  };

  // Effect para carregar dados quando o profile estiver disponível
  useEffect(() => {
    if (profile?.store_id && !requestInProgress.current) {
      console.log('useStores: Profile disponível, carregando loja atual');
      if (profile.role === 'superadmin') {
        fetchStores();
      } else {
        fetchCurrentStore();
      }
    } else if (user && !profile) {
      console.log('useStores: Usuário logado mas profile ainda não disponível');
      // Aguardar um pouco e tentar novamente
      const timer = setTimeout(() => {
        if (profile?.store_id && !requestInProgress.current) {
          fetchCurrentStore();
        }
      }, 1000);
      
      return () => clearTimeout(timer);
    } else if (!user) {
      console.log('useStores: Usuário não logado');
      setLoading(false);
      setCurrentStore(null);
      setStores([]);
    }
  }, [profile?.store_id, profile?.role, user, fetchCurrentStore]);

  return {
    stores,
    currentStore,
    loading,
    error,
    fetchStores,
    fetchCurrentStore: () => fetchCurrentStore(true),
    createStore,
    updateStore,
    updateCurrentStore,
    updateStoreSlug
  };
};
