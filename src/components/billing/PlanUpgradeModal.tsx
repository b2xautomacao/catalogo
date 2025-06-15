
import React from 'react';
import { useSubscriptionPlans, SubscriptionPlan } from '@/hooks/useSubscriptionPlans';
import { useAuth } from '@/hooks/useAuth';
import { useStoreSubscription } from '@/hooks/useStoreSubscription';
import SmartPlanUpgradeModal from './SmartPlanUpgradeModal';

interface PlanUpgradeModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  targetPlan?: SubscriptionPlan | null;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const PlanUpgradeModal: React.FC<PlanUpgradeModalProps> = ({
  isOpen,
  onClose,
  targetPlan,
  open,
  onOpenChange
}) => {
  const { user } = useAuth();
  const { getPlanById } = useSubscriptionPlans();
  const { subscription, loading: subscriptionLoading } = useStoreSubscription();

  // Suporte para ambas as APIs (isOpen/onClose e open/onOpenChange)
  const modalOpen = open ?? isOpen ?? false;
  const handleClose = () => {
    if (onOpenChange) onOpenChange(false);
    if (onClose) onClose();
  };

  if (!modalOpen) return null;

  // Converter o plano da subscription para o formato SubscriptionPlan se necessário
  const currentPlan = subscription?.plan ? {
    id: subscription.plan.id,
    name: subscription.plan.name,
    type: subscription.plan.type as 'basic' | 'premium' | 'enterprise',
    price_monthly: subscription.plan.price_monthly,
    price_yearly: subscription.plan.price_yearly,
    description: subscription.plan.description || '',
    is_active: subscription.plan.is_active ?? true,
    trial_days: subscription.plan.trial_days ?? 0,
    sort_order: subscription.plan.sort_order ?? 0,
    created_at: subscription.plan.created_at || new Date().toISOString(),
    updated_at: subscription.plan.updated_at || new Date().toISOString(),
  } as SubscriptionPlan : null;

  return (
    <SmartPlanUpgradeModal
      isOpen={modalOpen}
      onClose={handleClose}
      selectedPlan={targetPlan}
      currentPlan={currentPlan}
    />
  );
};

export default PlanUpgradeModal;
