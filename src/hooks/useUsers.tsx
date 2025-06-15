
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { UserProfile } from '@/hooks/useAuth';

export const useUsers = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      console.log('useUsers: Buscando usuários...');
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao buscar usuários:', error);
        throw error;
      }
      
      console.log('useUsers: Usuários encontrados:', data?.length);
      setUsers(data || []);
    } catch (error) {
      console.error('Erro inesperado ao buscar usuários:', error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const updateUserStore = async (userId: string, storeId: string | null) => {
    try {
      console.log('useUsers: Atualizando usuário:', userId, 'para loja:', storeId);
      
      const { data, error } = await supabase
        .from('profiles')
        .update({ store_id: storeId })
        .eq('id', userId)
        .select();

      if (error) {
        console.error('Erro SQL ao atualizar usuário:', error);
        throw error;
      }

      if (!data || data.length === 0) {
        console.error('Nenhuma linha foi atualizada');
        throw new Error('Falha ao atualizar usuário - nenhuma linha afetada');
      }

      console.log('useUsers: Usuário atualizado com sucesso:', data[0]);
      
      // Atualizar o estado local imediatamente
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user.id === userId 
            ? { ...user, store_id: storeId }
            : user
        )
      );

      return { error: null };
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error);
      return { error };
    }
  };

  const updateUserRole = async (userId: string, role: 'superadmin' | 'store_admin') => {
    try {
      console.log('useUsers: Atualizando papel do usuário:', userId, 'para:', role);
      
      const { data, error } = await supabase
        .from('profiles')
        .update({ role })
        .eq('id', userId)
        .select();

      if (error) {
        console.error('Erro SQL ao atualizar papel:', error);
        throw error;
      }

      if (!data || data.length === 0) {
        console.error('Nenhuma linha foi atualizada ao alterar papel');
        throw new Error('Falha ao atualizar papel do usuário');
      }

      console.log('useUsers: Papel do usuário atualizado com sucesso:', data[0]);
      
      // Atualizar o estado local imediatamente
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user.id === userId 
            ? { ...user, role }
            : user
        )
      );

      return { error: null };
    } catch (error) {
      console.error('Erro ao atualizar papel do usuário:', error);
      return { error };
    }
  };

  // Carregar usuários apenas uma vez na inicialização
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
