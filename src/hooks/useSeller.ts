import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface Seller {
  id: string;
  store_id: string;
  slug: string;
  name: string;
  whatsapp_phone: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Busca vendedor por store_id e slug (usado na URL do catálogo)
 * Retorna null se slug não informado ou vendedor não encontrado/inativo
 */
export function useSeller(storeId: string | undefined, sellerSlug: string | undefined) {
  const [seller, setSeller] = useState<Seller | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSeller = useCallback(async (store: string, slug: string) => {
    if (!store || !slug) {
      setSeller(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from("sellers")
        .select("*")
        .eq("store_id", store)
        .eq("slug", slug.toLowerCase().trim())
        .eq("is_active", true)
        .maybeSingle();

      if (fetchError) {
        setError(fetchError.message);
        setSeller(null);
        return;
      }

      setSeller(data as Seller | null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao buscar vendedor");
      setSeller(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (storeId && sellerSlug) {
      loadSeller(storeId, sellerSlug);
    } else {
      setSeller(null);
      setLoading(false);
      setError(null);
    }
  }, [storeId, sellerSlug, loadSeller]);

  return { seller, loading, error };
}
