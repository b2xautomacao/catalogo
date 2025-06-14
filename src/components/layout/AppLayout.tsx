
import React from 'react';
import { Navigate } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';
import MobileNavigation from './MobileNavigation';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { useAuth } from '@/hooks/useAuth';
import { useOnboarding } from '@/hooks/useOnboarding';
import OnboardingWizard from '@/components/onboarding/OnboardingWizard';
import { Loader2 } from 'lucide-react';

interface BreadcrumbItem {
  href?: string;
  label: string;
  current?: boolean;
}

interface AppLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  breadcrumbs?: BreadcrumbItem[];
}

const AppLayout: React.FC<AppLayoutProps> = ({ 
  children, 
  title = 'Dashboard', 
  subtitle, 
  breadcrumbs = [] 
}) => {
  const { user, profile, loading } = useAuth();
  const { needsOnboarding, loading: onboardingLoading, completeOnboarding } = useOnboarding();

  // Mostrar loading se ainda estiver carregando auth ou onboarding
  if (loading || onboardingLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  // Redirecionar para login se não estiver autenticado
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Redirecionar para auth se não tiver profile
  if (!profile) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Wizard de Onboarding */}
      {needsOnboarding && (
        <OnboardingWizard
          open={needsOnboarding}
          onComplete={completeOnboarding}
        />
      )}

      {/* Header fixo no topo */}
      <Header title={title} subtitle={subtitle} />

      <div className="flex h-[calc(100vh-4rem)] overflow-hidden pt-16">
        {/* Sidebar para desktop */}
        <Sidebar />

        {/* Conteúdo principal */}
        <main className="flex-1 overflow-auto lg:ml-64">
          <div className="p-4 lg:p-6 space-y-6">
            {/* Breadcrumbs */}
            {breadcrumbs.length > 0 && (
              <Breadcrumb>
                <BreadcrumbList>
                  {breadcrumbs.map((item, index) => (
                    <React.Fragment key={index}>
                      <BreadcrumbItem>
                        {item.current ? (
                          <BreadcrumbPage>{item.label}</BreadcrumbPage>
                        ) : (
                          <BreadcrumbLink href={item.href || '#'}>
                            {item.label}
                          </BreadcrumbLink>
                        )}
                      </BreadcrumbItem>
                      {index < breadcrumbs.length - 1 && <BreadcrumbSeparator />}
                    </React.Fragment>
                  ))}
                </BreadcrumbList>
              </Breadcrumb>
            )}

            {/* Conteúdo da página */}
            {children}
          </div>
        </main>
      </div>

      {/* Navegação mobile fixa na parte inferior */}
      <MobileNavigation />
    </div>
  );
};

export default AppLayout;
