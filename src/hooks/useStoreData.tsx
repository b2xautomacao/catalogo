
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
        setStore(null);
        setError(null);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        console.log('useStoreData: Buscando loja:', storeIdentifier);

        // Timeout de segurança de 10 segundos
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout: Operação demorou mais de 10 segundos')), 10000)
        );

        // Primeiro, tentar buscar por URL slug
        let query = supabase
          .from('stores')
          .select('id, name, description, logo_url, url_slug, phone, email, address')
          .eq('is_active', true);

        // Se parece com UUID, buscar por ID, senão por slug
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(storeIdentifier);
        
        if (isUUID) {
          query = query.eq('id', storeIdentifier);
          console.log('useStoreData: Buscando por UUID:', storeIdentifier);
        } else {
          query = query.eq('url_slug', storeIdentifier);
          console.log('useStoreData: Buscando por slug:', storeIdentifier);
        }

        // Usar Promise.race para implementar timeout
        const fetchPromise = query.maybeSingle();
        const { data, error: fetchError } = await Promise.race([fetchPromise, timeoutPromise]) as any;

        if (fetchError) {
          console.error('useStoreData: Erro na consulta:', fetchError);
          throw fetchError;
        }

        if (!data) {
          console.log('useStoreData: Loja não encontrada para identificador:', storeIdentifier);
          setError('Loja não encontrada');
          setStore(null);
        } else {
          console.log('useStoreData: Loja encontrada:', data);
          setStore(data);
          setError(null);
        }
      } catch (error) {
        console.error('useStoreData: Erro ao buscar loja:', error);
        const errorMessage = error instanceof Error ? error.message : 'Erro ao carregar dados da loja';
        setError(errorMessage);
        setStore(null);
      } finally {
        setLoading(false);
      }
    };

    fetchStore();
  }, [storeIdentifier]);

  return { store, loading, error };
};
