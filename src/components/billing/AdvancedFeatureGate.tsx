
import React, { useEffect, useState } from 'react';
import { usePlanPermissions } from '@/hooks/usePlanPermissions';
import PlanUpgradeModal from './PlanUpgradeModal';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Lock, TrendingUp, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface AdvancedFeatureGateProps {
  feature: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showUpgradeModal?: boolean;
  blockInteraction?: boolean;
  silentCheck?: boolean;
  customMessage?: string;
}

export const AdvancedFeatureGate: React.FC<AdvancedFeatureGateProps> = ({
  feature,
  children,
  fallback,
  showUpgradeModal = true,
  blockInteraction = true,
  silentCheck = false,
  customMessage
}) => {
  const { checkFeatureAccess, subscription, isTrialing } = usePlanPermissions();
  const [showModal, setShowModal] = useState(false);
  const [hasAccess, setHasAccess] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAccess = () => {
      setLoading(true);
      const access = checkFeatureAccess(feature, false); // Verificação silenciosa
      setHasAccess(access);
      setLoading(false);
    };

    checkAccess();
    
    // Verificar novamente a cada 30 segundos para mudanças em tempo real
    const interval = setInterval(checkAccess, 30000);
    
    return () => clearInterval(interval);
  }, [feature, subscription]);

  const handleUpgradeClick = () => {
    if (!silentCheck) {
      const planName = subscription?.plan.type === 'basic' ? 'Premium' : 'Enterprise';
      toast.error(customMessage || `Esta funcionalidade está disponível apenas no plano ${planName}.`);
    }
    if (showUpgradeModal) {
      setShowModal(true);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (hasAccess) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  if (!blockInteraction) {
    return (
      <div className="relative">
        <div className="opacity-50 pointer-events-none">
          {children}
        </div>
        <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm">
          <Button onClick={handleUpgradeClick} size="sm">
            <Lock className="h-4 w-4 mr-2" />
            Fazer Upgrade
          </Button>
        </div>
      </div>
    );
  }

  const planName = subscription?.plan.type === 'basic' ? 'Premium' : 'Enterprise';
  const isTrialExpired = isTrialing() && subscription?.status !== 'trialing';

  return (
    <>
      <Card className="border-dashed border-2">
        <CardContent className="flex flex-col items-center justify-center p-8 text-center">
          {isTrialExpired ? (
            <AlertCircle className="h-12 w-12 text-orange-500 mb-4" />
          ) : (
            <Lock className="h-12 w-12 text-muted-foreground mb-4" />
          )}
          <h3 className="font-semibold mb-2">
            {isTrialExpired ? 'Trial Expirado' : 'Funcionalidade Premium'}
          </h3>
          <p className="text-muted-foreground mb-4">
            {customMessage || (
              isTrialExpired 
                ? 'Seu período de trial expirou. Faça upgrade para continuar usando esta funcionalidade.'
                : `Esta funcionalidade está disponível apenas no plano ${planName}.`
            )}
          </p>
          <Button onClick={handleUpgradeClick}>
            <TrendingUp className="h-4 w-4 mr-2" />
            {isTrialExpired ? 'Renovar Assinatura' : 'Fazer Upgrade'}
          </Button>
        </CardContent>
      </Card>

      {showUpgradeModal && (
        <PlanUpgradeModal 
          open={showModal}
          onOpenChange={setShowModal}
        />
      )}
    </>
  );
};
