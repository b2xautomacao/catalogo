
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useUsers } from '@/hooks/useUsers';
import { useStores } from '@/hooks/useStores';
import { useToast } from '@/hooks/use-toast';
import { Users, Store, AlertCircle } from 'lucide-react';

const UserManagement = () => {
  const { users, loading: usersLoading, updateUserStore, updateUserRole } = useUsers();
  const { stores, loading: storesLoading } = useStores();
  const { toast } = useToast();
  const [updating, setUpdating] = useState<string | null>(null);

  const handleUpdateUserStore = async (userId: string, storeId: string) => {
    setUpdating(userId);
    const { error } = await updateUserStore(userId, storeId === 'none' ? null : storeId);
    
    if (error) {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar a associação da loja",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Sucesso",
        description: "Usuário associado à loja com sucesso",
      });
    }
    setUpdating(null);
  };

  const handleUpdateUserRole = async (userId: string, role: 'superadmin' | 'store_admin') => {
    setUpdating(userId);
    const { error } = await updateUserRole(userId, role);
    
    if (error) {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o papel do usuário",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Sucesso",
        description: "Papel do usuário atualizado com sucesso",
      });
    }
    setUpdating(null);
  };

  const usersWithoutStore = users.filter(user => user.role === 'store_admin' && !user.store_id);

  if (usersLoading || storesLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando usuários...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold gradient-text">Gerenciamento de Usuários</h1>
        <p className="text-muted-foreground">
          Gerencie usuários e suas associações com lojas
        </p>
      </div>

      {/* Usuários sem loja */}
      {usersWithoutStore.length > 0 && (
        <Card className="card-modern border-orange-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-600">
              <AlertCircle className="h-5 w-5" />
              Usuários sem Loja Associada ({usersWithoutStore.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {usersWithoutStore.map((user) => (
                <div key={user.id} className="flex items-center justify-between p-4 border rounded-xl bg-orange-50">
                  <div>
                    <h3 className="font-semibold">{user.full_name || 'Nome não informado'}</h3>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                    <Badge variant="secondary" className="mt-1">
                      {user.role === 'superadmin' ? 'Super Admin' : 'Admin da Loja'}
                    </Badge>
                  </div>
                  <div className="flex gap-2">
                    <Select
                      value={user.store_id || 'none'}
                      onValueChange={(value) => handleUpdateUserStore(user.id, value)}
                      disabled={updating === user.id}
                    >
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="Selecionar loja" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Nenhuma loja</SelectItem>
                        {stores.map((store) => (
                          <SelectItem key={store.id} value={store.id}>
                            {store.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Todos os usuários */}
      <Card className="card-modern">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Todos os Usuários ({users.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {users.map((user) => (
              <div key={user.id} className="flex items-center justify-between p-4 border rounded-xl hover:bg-gray-50 transition-colors">
                <div className="flex-1">
                  <h3 className="font-semibold">{user.full_name || 'Nome não informado'}</h3>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                  <div className="flex gap-2 mt-2">
                    <Badge variant={user.role === 'superadmin' ? 'default' : 'secondary'}>
                      {user.role === 'superadmin' ? 'Super Admin' : 'Admin da Loja'}
                    </Badge>
                    <Badge variant={user.is_active ? 'default' : 'secondary'}>
                      {user.is_active ? 'Ativo' : 'Inativo'}
                    </Badge>
                    {user.store_id && (
                      <Badge variant="outline">
                        Loja: {stores.find(s => s.id === user.store_id)?.name || 'Desconhecida'}
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Select
                    value={user.role}
                    onValueChange={(value) => handleUpdateUserRole(user.id, value as 'superadmin' | 'store_admin')}
                    disabled={updating === user.id}
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="store_admin">Admin da Loja</SelectItem>
                      <SelectItem value="superadmin">Super Admin</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select
                    value={user.store_id || 'none'}
                    onValueChange={(value) => handleUpdateUserStore(user.id, value)}
                    disabled={updating === user.id}
                  >
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Selecionar loja" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Nenhuma loja</SelectItem>
                      {stores.map((store) => (
                        <SelectItem key={store.id} value={store.id}>
                          {store.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserManagement;
