
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface StoreData {
  id: string;
  name: string;
  description?: string;
  logo_url?: string;
  url_slug?: string;
  phone?: string;
  email?: string;
  address?: string;
}

export const useStoreData = (storeIdentifier?: string) => {
  const [store, setStore] = useState<StoreData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStore = async () => {
      if (!storeIdentifier) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        console.log('useStoreData: Buscando loja:', storeIdentifier);

        // Primeiro, tentar buscar por URL slug
        let query = supabase
          .from('stores')
          .select('id, name, description, logo_url, url_slug, phone, email, address')
          .eq('is_active', true);

        // Se parece com UUID, buscar por ID, senão por slug
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(storeIdentifier);
        
        if (isUUID) {
          query = query.eq('id', storeIdentifier);
        } else {
          query = query.eq('url_slug', storeIdentifier);
        }

        const { data, error: fetchError } = await query.single();

        if (fetchError) {
          if (fetchError.code === 'PGRST116') {
            setError('Loja não encontrada');
          } else {
            throw fetchError;
          }
        } else {
          console.log('useStoreData: Loja encontrada:', data);
          setStore(data);
        }
      } catch (error) {
        console.error('useStoreData: Erro ao buscar loja:', error);
        setError(error instanceof Error ? error.message : 'Erro ao carregar dados da loja');
      } finally {
        setLoading(false);
      }
    };

    fetchStore();
  }, [storeIdentifier]);

  return { store, loading, error };
};
