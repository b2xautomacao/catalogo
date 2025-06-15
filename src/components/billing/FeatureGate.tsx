
import React from 'react';
import { usePlanPermissions } from '@/hooks/usePlanPermissions';
import { PlanUpgradeModal } from './PlanUpgradeModal';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Lock, TrendingUp } from 'lucide-react';

interface FeatureGateProps {
  feature: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showUpgradeModal?: boolean;
}

export const FeatureGate: React.FC<FeatureGateProps> = ({
  feature,
  children,
  fallback,
  showUpgradeModal = false
}) => {
  const { hasBenefit, subscription, isSuperadmin } = usePlanPermissions();
  const [showModal, setShowModal] = React.useState(false);

  // Superadmin sempre tem acesso
  if (isSuperadmin) {
    return <>{children}</>;
  }

  const hasAccess = hasBenefit(feature);

  if (hasAccess) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  const planName = subscription?.plan.type === 'basic' ? 'Premium' : 'Enterprise';

  return (
    <>
      <Card className="border-dashed border-2 border-orange-200">
        <CardContent className="flex flex-col items-center justify-center p-8 text-center">
          <Lock className="h-12 w-12 text-orange-500 mb-4" />
          <h3 className="font-semibold mb-2 text-gray-900">Funcionalidade Premium</h3>
          <p className="text-gray-600 mb-4">
            Esta funcionalidade está disponível apenas no plano {planName}.
          </p>
          <Button onClick={() => setShowModal(true)} className="bg-orange-500 hover:bg-orange-600">
            <TrendingUp className="h-4 w-4 mr-2" />
            Fazer Upgrade
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
