
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { useStoreSubscription } from '@/hooks/useStoreSubscription';
import { Crown, Clock, AlertCircle } from 'lucide-react';

export const PlanStatusBadge = () => {
  const { profile } = useAuth();
  const { subscription, loading } = useStoreSubscription();

  if (profile?.role === 'superadmin') {
    return (
      <Badge variant="default" className="bg-purple-100 text-purple-800 border-purple-200">
        <Crown className="h-3 w-3 mr-1" />
        Superadmin
      </Badge>
    );
  }

  if (loading) {
    return (
      <Badge variant="outline" className="bg-gray-50 text-gray-600">
        Carregando...
      </Badge>
    );
  }

  if (!subscription) {
    return (
      <Badge variant="outline" className="bg-gray-50 text-gray-600">
        Gratuito
      </Badge>
    );
  }

  const planLabels = {
    basic: 'Básico',
    premium: 'Premium',
    enterprise: 'Enterprise'
  };

  const planName = planLabels[subscription.plan?.type as keyof typeof planLabels] || 'Básico';

  if (subscription.status === 'trialing') {
    return (
      <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200">
        <Clock className="h-3 w-3 mr-1" />
        {planName} (Trial)
      </Badge>
    );
  }

  if (subscription.status === 'active') {
    return (
      <Badge variant="default" className="bg-green-50 text-green-700 border-green-200">
        <Crown className="h-3 w-3 mr-1" />
        {planName}
      </Badge>
    );
  }

  return (
    <Badge variant="destructive" className="bg-red-50 text-red-700 border-red-200">
      <AlertCircle className="h-3 w-3 mr-1" />
      {planName} (Inativo)
    </Badge>
  );
};
