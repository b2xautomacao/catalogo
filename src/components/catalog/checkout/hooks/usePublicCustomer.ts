
import { supabase } from "@/integrations/supabase/client";

// Use os tipos gerados do Supabase!
type CustomerRow = {
  id: string;
  name: string;
  email?: string;
  phone: string;
  store_id: string;
  created_at?: string;
  updated_at?: string;
};

export interface CustomerInfo {
  name: string;
  email?: string;
  phone: string;
  storeId: string;
}

export const usePublicCustomer = () => {
  const saveCustomer = async ({ name, email, phone, storeId }: CustomerInfo) => {
    if (!name.trim() || !phone.trim() || !storeId) return null;

    // Busca se já existe cliente com esse telefone para a loja
    const { data: existing, error: searchError } = await supabase
      .from("customers")
      .select("*")
      .eq("phone", phone)
      .eq("store_id", storeId)
      .maybeSingle<CustomerRow>();

    if (searchError) {
      console.error("Erro ao buscar cliente:", searchError);
      return null;
    }
    if (!existing) {
      // Salva novo cliente
      const { data, error } = await supabase
        .from("customers")
        .insert([{
          name,
          email,
          phone,
          store_id: storeId,
        }])
        .select()
        .maybeSingle<CustomerRow>();
      if (error) {
        console.error("Erro ao salvar cliente:", error);
        return null;
      }
      return data ?? null;
    } else {
      // Atualiza nome/email se mudou (somente se necessário)
      if (
        existing.name !== name ||
        (!!email && existing.email !== email)
      ) {
        await supabase
          .from("customers")
          .update({ name, email })
          .eq("id", existing.id);
      }
      return existing;
    }
  };

  return { saveCustomer };
};
