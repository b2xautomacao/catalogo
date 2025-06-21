
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

        console.log('🔍 useStoreData: Iniciando busca para:', storeIdentifier);

        // Verificar se é UUID
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        const isUUID = uuidRegex.test(storeIdentifier);

        let query = supabase
          .from('stores')
          .select('id, name, description, logo_url, url_slug, phone, email, address')
          .eq('is_active', true);

        if (isUUID) {
          console.log('🆔 useStoreData: Buscando por UUID:', storeIdentifier);
          query = query.eq('id', storeIdentifier);
        } else {
          console.log('🏷️ useStoreData: Buscando por slug:', storeIdentifier);
          query = query.eq('url_slug', storeIdentifier);
        }

        const { data, error: fetchError } = await query.maybeSingle();

        if (fetchError) {
          console.error('❌ useStoreData: Erro na consulta:', fetchError);
          throw fetchError;
        }

        if (data) {
          console.log('✅ useStoreData: Loja encontrada:', data);
          setStore(data);
          setError(null);
        } else {
          // Tentar busca flexível apenas se não for UUID
          if (!isUUID) {
            console.log('🔄 useStoreData: Tentando busca flexível por nome');
            
            const flexibleQuery = supabase
              .from('stores')
              .select('id, name, description, logo_url, url_slug, phone, email, address')
              .eq('is_active', true)
              .or(`name.ilike.%${storeIdentifier}%,url_slug.ilike.%${storeIdentifier}%`)
              .limit(1);
            
            const { data: flexibleData, error: flexibleError } = await flexibleQuery.maybeSingle();
            
            if (flexibleError) {
              console.error('❌ useStoreData: Erro na busca flexível:', flexibleError);
              throw flexibleError;
            }
            
            if (flexibleData) {
              console.log('✅ useStoreData: Loja encontrada via busca flexível:', flexibleData);
              setStore(flexibleData);
              setError(null);
            } else {
              console.log('❌ useStoreData: Nenhuma loja encontrada para:', storeIdentifier);
              setError('Loja não encontrada');
              setStore(null);
            }
          } else {
            console.log('❌ useStoreData: UUID não encontrado:', storeIdentifier);
            setError('Loja não encontrada');
            setStore(null);
          }
        }
      } catch (error) {
        console.error('💥 useStoreData: Erro crítico:', error);
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
