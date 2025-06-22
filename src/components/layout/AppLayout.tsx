
import React from 'react';
import { Navigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import MobileNavigation from './MobileNavigation';
import Footer from './Footer';
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
    <div className="min-h-screen bg-gray-50">
      {/* Wizard de Onboarding */}
      {needsOnboarding && (
        <OnboardingWizard
          open={needsOnboarding}
          onComplete={completeOnboarding}
        />
      )}

      {/* Sidebar fixa para desktop */}
      <Sidebar />

      {/* Conteúdo principal com margem para não sobrepor a sidebar */}
      <main className="lg:pl-64 min-h-screen flex flex-col">
        <div className="flex-1 p-4 lg:p-6 space-y-6">
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

        {/* Footer */}
        <Footer />
      </main>

      {/* Navegação mobile fixa na parte inferior */}
      <MobileNavigation />
    </div>
  );
};

export default AppLayout;
