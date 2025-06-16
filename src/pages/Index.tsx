
import React from 'react';
import { useNavigate } from 'react-router-dom';
import SuperadminDashboard from '@/components/dashboard/SuperadminDashboard';
import StoreDashboard from '@/components/dashboard/StoreDashboard';
import { ImprovedStoreWizard } from '@/components/onboarding/ImprovedStoreWizard';
import { useOnboarding } from '@/hooks/useOnboarding';
import AppLayout from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { LogOut, Loader2 } from 'lucide-react';

const Index = () => {
  const { profile, signOut, loading } = useAuth();
  const { needsOnboarding, loading: onboardingLoading, completeOnboarding } = useOnboarding();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut();
      toast({
        title: "Logout realizado",
        description: "Você foi desconectado com sucesso",
      });
      navigate('/auth');
    } catch (error) {
      toast({
        title: "Erro ao sair",
        description: "Ocorreu um erro ao fazer logout",
        variant: "destructive",
      });
    }
  };

  // Mostrar loading enquanto carrega o perfil e onboarding
  if (loading || onboardingLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  // Se não há perfil após loading, algo deu errado
  if (!profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Erro ao carregar perfil</h2>
          <p className="text-muted-foreground mb-4">
            Não foi possível carregar suas informações de perfil.
          </p>
          <Button onClick={handleLogout}>
            Fazer Logout
          </Button>
        </div>
      </div>
    );
  }

  console.log('Renderizando Index - Perfil:', profile);

  // Para store_admin, verificar se precisa de onboarding
  if (profile.role === 'store_admin') {
    console.log('Store admin detectado - store_id:', profile.store_id);
    console.log('Needs onboarding:', needsOnboarding);
    
    // Se precisa de onboarding, mostrar o wizard melhorado
    if (needsOnboarding) {
      console.log('Store admin precisa de onboarding - mostrando ImprovedStoreWizard');
      return (
        <ImprovedStoreWizard
          open={true}
          onComplete={completeOnboarding}
        />
      );
    }

    // Se tem tudo configurado, mostrar o dashboard da loja
    console.log('Store admin com loja configurada - mostrando StoreDashboard');
    return (
      <AppLayout 
        title="Dashboard da Loja"
        subtitle="Gerencie seus produtos e vendas"
        breadcrumbs={[
          { label: 'Dashboard', current: true }
        ]}
      >
        <StoreDashboard />
      </AppLayout>
    );
  }

  // Para superadmin, mostrar dashboard administrativo
  if (profile.role === 'superadmin') {
    return (
      <AppLayout 
        title="Dashboard Administrativo"
        subtitle="Visão geral de todas as lojas do sistema"
        breadcrumbs={[
          { label: 'Dashboard', current: true }
        ]}
      >
        <SuperadminDashboard />
      </AppLayout>
    );
  } 

  // Fallback - papel não reconhecido
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-4">Perfil não reconhecido</h2>
        <p className="text-muted-foreground mb-4">
          Seu perfil não está configurado corretamente. Entre em contato com o administrador.
        </p>
        <p className="text-sm text-gray-500 mb-4">
          Papel atual: {profile.role}
        </p>
        <Button onClick={handleLogout}>
          Fazer Logout
        </Button>
      </div>
    </div>
  );
};

export default Index;
