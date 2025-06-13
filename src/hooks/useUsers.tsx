
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { UserProfile } from '@/hooks/useAuth';

export const useUsers = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Erro ao buscar usuários:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateUserStore = async (userId: string, storeId: string | null) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ store_id: storeId })
        .eq('id', userId);

      if (error) throw error;
      await fetchUsers();
      return { error: null };
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error);
      return { error };
    }
  };

  const updateUserRole = async (userId: string, role: 'superadmin' | 'store_admin') => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role })
        .eq('id', userId);

      if (error) throw error;
      await fetchUsers();
      return { error: null };
    } catch (error) {
      console.error('Erro ao atualizar papel do usuário:', error);
      return { error };
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return {
    users,
    loading,
    fetchUsers,
    updateUserStore,
    updateUserRole
  };
};
