
import React, { useState } from 'react';
import { usePlanPermissions } from '@/hooks/usePlanPermissions';
import PlanUpgradeModal from './PlanUpgradeModal';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Lock, TrendingUp, AlertCircle } from 'lucide-react';

interface BenefitGateProps {
  benefitKey: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showUpgradeModal?: boolean;
  customMessage?: string;
  silent?: boolean;
}

export const BenefitGate: React.FC<BenefitGateProps> = ({
  benefitKey,
  children,
  fallback,
  showUpgradeModal = true,
  customMessage,
  silent = false
}) => {
  const { hasBenefit, subscription, isSuperadmin } = usePlanPermissions();
  const [showModal, setShowModal] = useState(false);

  // Superadmin sempre tem acesso
  if (isSuperadmin) {
    return <>{children}</>;
  }

  const hasAccess = hasBenefit(benefitKey);

  if (hasAccess) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  if (silent) {
    return null;
  }

  const planName = subscription?.plan.type === 'basic' ? 'Premium' : 'Enterprise';

  return (
    <>
      <Card className="border-dashed border-2 border-orange-200">
        <CardContent className="flex flex-col items-center justify-center p-8 text-center">
          <Lock className="h-12 w-12 text-orange-500 mb-4" />
          <h3 className="font-semibold mb-2 text-gray-900">Funcionalidade Premium</h3>
          <p className="text-gray-600 mb-4">
            {customMessage || `Esta funcionalidade está disponível apenas no plano ${planName}.`}
          </p>
          {showUpgradeModal && (
            <Button onClick={() => setShowModal(true)} className="bg-orange-500 hover:bg-orange-600">
              <TrendingUp className="h-4 w-4 mr-2" />
              Fazer Upgrade
            </Button>
          )}
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
