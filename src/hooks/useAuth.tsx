
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useAuthSession } from '@/hooks/useAuthSession';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  role: 'superadmin' | 'store_admin';
  store_id: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type UserRole = 'superadmin' | 'store_admin';

interface AuthContextType {
  user: User | null;
  session: any;
  profile: UserProfile | null;
  loading: boolean;
  signOut: () => Promise<{ error: any }>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<{ data: UserProfile | null; error: any }>;
  createStoreForUser: (userId: string, storeName: string, storeDescription?: string) => Promise<{ data: any; error: any }>;
  refreshProfile: () => Promise<void>;
  isSuperadmin: boolean;
  isStoreAdmin: boolean;
  refetchProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, session, loading: sessionLoading, signOut } = useAuthSession();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    try {
      console.log('Buscando perfil para usuário:', userId);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Erro ao buscar perfil:', error);
        return null;
      }

      console.log('Perfil encontrado:', data);
      return data;
    } catch (err) {
      console.error('Erro inesperado ao buscar perfil:', err);
      return null;
    }
  };

  useEffect(() => {
    const loadProfile = async () => {
      if (!sessionLoading) {
        if (user) {
          console.log('Usuário autenticado, carregando perfil...');
          const userProfile = await fetchProfile(user.id);
          setProfile(userProfile);
        } else {
          console.log('Usuário não autenticado, limpando perfil');
          setProfile(null);
        }
        setLoading(false);
      }
    };

    loadProfile();
  }, [user, sessionLoading]);

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!profile) return { data: null, error: 'Perfil não encontrado' };

    try {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', profile.id)
        .select()
        .single();

      if (error) throw error;
      
      setProfile(data);
      return { data, error: null };
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      return { data: null, error };
    }
  };

  const createStoreForUser = async (userId: string, storeName: string, storeDescription?: string) => {
    try {
      console.log('Criando loja para usuário:', userId, storeName);
      
      // Criar a loja
      const { data: storeData, error: storeError } = await supabase
        .from('stores')
        .insert([{
          name: storeName,
          description: storeDescription,
          owner_id: userId,
          is_active: true
        }])
        .select()
        .single();

      if (storeError) {
        console.error('Erro ao criar loja:', storeError);
        return { data: null, error: storeError };
      }

      console.log('Loja criada:', storeData);

      // Atualizar o perfil do usuário com o store_id
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .update({ store_id: storeData.id })
        .eq('id', userId)
        .select()
        .single();

      if (profileError) {
        console.error('Erro ao atualizar perfil com store_id:', profileError);
        return { data: null, error: profileError };
      }

      console.log('Perfil atualizado com store_id:', profileData);
      return { data: storeData, error: null };
    } catch (error) {
      console.error('Erro inesperado ao criar loja:', error);
      return { data: null, error };
    }
  };

  const refreshProfile = async () => {
    if (user) {
      const userProfile = await fetchProfile(user.id);
      setProfile(userProfile);
    }
  };

  const refetchProfile = async () => {
    if (user) {
      const userProfile = await fetchProfile(user.id);
      setProfile(userProfile);
    }
  };

  const isSuperadmin = profile?.role === 'superadmin';
  const isStoreAdmin = profile?.role === 'store_admin';

  const value: AuthContextType = {
    user,
    session,
    profile,
    loading,
    signOut,
    updateProfile,
    createStoreForUser,
    refreshProfile,
    isSuperadmin,
    isStoreAdmin,
    refetchProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
