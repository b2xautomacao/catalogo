
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { usePlanPermissions } from '@/hooks/usePlanPermissions';
import { useBenefitValidation } from '@/hooks/useBenefitValidation';
import { Check, X, Crown } from 'lucide-react';

export const PlanBenefitsDisplay = () => {
  const { subscription, isSuperadmin } = usePlanPermissions();
  const { benefits, loading } = useBenefitValidation();

  if (isSuperadmin) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-purple-600" />
            Acesso Superadmin
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600">
            Como superadmin, você tem acesso completo a todas as funcionalidades do sistema.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Benefícios do Plano</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-2">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!subscription) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Benefícios do Plano</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600">
            Não foi possível carregar informações do plano.
          </p>
        </CardContent>
      </Card>
    );
  }

  const planLabels = {
    basic: 'Básico',
    premium: 'Premium',
    enterprise: 'Enterprise'
  };

  const planName = planLabels[subscription.plan.type] || subscription.plan.type;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Benefícios do Plano
          <Badge variant="outline">
            {planName}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {benefits.length === 0 ? (
            <p className="text-sm text-gray-600">
              Nenhum benefício configurado para este plano.
            </p>
          ) : (
            benefits.map((benefit) => (
              <div key={benefit.id} className="flex items-center justify-between p-2 rounded-lg bg-gray-50">
                <div className="flex items-center gap-2">
                  {benefit.is_enabled ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <X className="h-4 w-4 text-red-600" />
                  )}
                  <span className="text-sm font-medium">
                    {benefit.benefit?.name}
                  </span>
                </div>
                {benefit.limit_value && benefit.limit_value !== 'unlimited' && (
                  <Badge variant="outline" className="text-xs">
                    Limite: {benefit.limit_value}
                  </Badge>
                )}
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};
