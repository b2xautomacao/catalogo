
import React from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/hooks/useAuth';
import { useAuthSession } from '@/hooks/useAuthSession';
import { useStoreSubscription } from '@/hooks/useStoreSubscription';
import { LogOut, Settings, Crown, Store, User, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const SidebarUserProfile: React.FC = () => {
  const { profile } = useAuth();
  const { signOut } = useAuthSession();
  const { subscription, loading } = useStoreSubscription();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      const { error } = await signOut();
      if (error) {
        toast.error('Erro ao fazer logout');
        return;
      }
      toast.success('Logout realizado com sucesso');
      navigate('/auth');
    } catch (err) {
      toast.error('Erro inesperado');
    }
  };

  const getRoleIcon = () => {
    if (profile?.role === 'superadmin') return <Crown className="h-3 w-3" />;
    if (profile?.role === 'store_admin') return <Store className="h-3 w-3" />;
    return <User className="h-3 w-3" />;
  };

  const getRoleLabel = () => {
    if (profile?.role === 'superadmin') return 'Superadmin';
    if (profile?.role === 'store_admin') return 'Admin da Loja';
    return 'Usuário';
  };

  const getPlanInfo = () => {
    if (profile?.role === 'superadmin') {
      return { label: 'Superadmin', variant: 'default' as const, color: 'bg-purple-100 text-purple-800' };
    }

    if (loading) {
      return { label: 'Carregando...', variant: 'outline' as const, color: 'bg-gray-50 text-gray-600' };
    }

    if (!subscription) {
      return { label: 'Gratuito', variant: 'outline' as const, color: 'bg-gray-50 text-gray-600' };
    }

    const planLabels = {
      basic: 'Básico',
      premium: 'Premium',
      enterprise: 'Enterprise'
    };

    const planName = planLabels[subscription.plan?.type as keyof typeof planLabels] || 'Básico';

    if (subscription.status === 'trialing') {
      return { label: `${planName} (Trial)`, variant: 'secondary' as const, color: 'bg-blue-50 text-blue-700' };
    }

    if (subscription.status === 'active') {
      return { label: planName, variant: 'default' as const, color: 'bg-green-50 text-green-700' };
    }

    return { label: `${planName} (Inativo)`, variant: 'destructive' as const, color: 'bg-red-50 text-red-700' };
  };

  const planInfo = getPlanInfo();

  if (!profile) return null;

  return (
    <div className="p-4 border-t border-gray-200">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="w-full p-2 h-auto justify-start">
            <div className="flex items-center gap-3 w-full">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary text-white text-sm">
                  {profile.full_name 
                    ? profile.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
                    : profile.email.substring(0, 2).toUpperCase()
                  }
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 text-left min-w-0">
                <p className="text-sm font-medium truncate">
                  {profile.full_name || 'Usuário'}
                </p>
                <Badge 
                  variant={planInfo.variant}
                  className={`text-xs ${planInfo.color} border-none`}
                >
                  {planInfo.label}
                </Badge>
              </div>
            </div>
          </Button>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium">
                {profile.full_name || 'Usuário'}
              </p>
              <p className="text-xs text-muted-foreground">
                {profile.email}
              </p>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  {getRoleIcon()}
                  <span className="ml-1">{getRoleLabel()}</span>
                </Badge>
              </div>
            </div>
          </DropdownMenuLabel>
          
          <DropdownMenuSeparator />

          <DropdownMenuItem onClick={() => navigate('/billing')} className="cursor-pointer">
            <Zap className="mr-2 h-4 w-4" />
            <span>Faturamento</span>
          </DropdownMenuItem>

          <DropdownMenuItem onClick={() => navigate('/settings')} className="cursor-pointer">
            <Settings className="mr-2 h-4 w-4" />
            <span>Configurações</span>
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem onClick={handleLogout} className="text-red-600 cursor-pointer">
            <LogOut className="mr-2 h-4 w-4" />
            <span>Sair</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default SidebarUserProfile;
