
import React from 'react';
import { Check, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface PlanComparisonBenefit {
  name: string;
  description?: string;
  category: string;
  plans: Record<string, {
    hasAccess: boolean;
    limit?: string | null;
  }>;
}

interface PlanComparisonProps {
  plans: Array<{
    id: string;
    name: string;
    type: string;
    price_monthly: number;
    description?: string;
  }>;
  benefits: PlanComparisonBenefit[];
  currentPlanId?: string;
  onSelectPlan?: (planId: string) => void;
  showPricing?: boolean;
}

export const PlanComparison: React.FC<PlanComparisonProps> = ({
  plans,
  benefits,
  currentPlanId,
  onSelectPlan,
  showPricing = true
}) => {
  const groupedBenefits = benefits.reduce((acc, benefit) => {
    if (!acc[benefit.category]) {
      acc[benefit.category] = [];
    }
    acc[benefit.category].push(benefit);
    return acc;
  }, {} as Record<string, PlanComparisonBenefit[]>);

  const getCategoryLabel = (category: string) => {
    const labels = {
      ai: 'Inteligência Artificial',
      products: 'Produtos',
      team: 'Equipe',
      integrations: 'Integrações',
      payments: 'Pagamentos',
      branding: 'Marca',
      marketing: 'Marketing',
      shipping: 'Frete',
      support: 'Suporte',
      general: 'Geral'
    };

    return labels[category as keyof typeof labels] || category;
  };

  return (
    <div className="space-y-6">
      {/* Header dos Planos */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {plans.map((plan) => (
          <Card key={plan.id} className={currentPlanId === plan.id ? 'ring-2 ring-blue-500' : ''}>
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center gap-2">
                {plan.name}
                {currentPlanId === plan.id && (
                  <Badge variant="default">Atual</Badge>
                )}
              </CardTitle>
              {showPricing && (
                <div className="space-y-2">
                  <div className="text-3xl font-bold">
                    R$ {plan.price_monthly.toFixed(2)}
                    <span className="text-sm font-normal text-gray-500">/mês</span>
                  </div>
                  {plan.description && (
                    <p className="text-sm text-gray-600">{plan.description}</p>
                  )}
                </div>
              )}
              {onSelectPlan && currentPlanId !== plan.id && (
                <Button onClick={() => onSelectPlan(plan.id)} className="w-full">
                  Escolher Plano
                </Button>
              )}
            </CardHeader>
          </Card>
        ))}
      </div>

      {/* Comparação de Benefícios */}
      <div className="space-y-6">
        {Object.entries(groupedBenefits).map(([category, categoryBenefits]) => (
          <div key={category} className="space-y-4">
            <h3 className="font-semibold text-lg text-gray-900 border-b pb-2">
              {getCategoryLabel(category)}
            </h3>
            
            <div className="space-y-3">
              {categoryBenefits.map((benefit, benefitIndex) => (
                <div key={benefitIndex} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-start">
                  <div className="col-span-1">
                    <div className="font-medium text-gray-900">{benefit.name}</div>
                    {benefit.description && (
                      <div className="text-sm text-gray-600 mt-1">
                        {benefit.description}
                      </div>
                    )}
                  </div>
                  
                  <div className="col-span-3 grid grid-cols-3 gap-4">
                    {plans.map((plan) => {
                      const planBenefit = benefit.plans[plan.id];
                      const hasAccess = planBenefit?.hasAccess || false;
                      const limit = planBenefit?.limit;
                      
                      return (
                        <div key={plan.id} className="flex items-center justify-center p-2">
                          {hasAccess ? (
                            <div className="text-center">
                              <Check className="h-5 w-5 text-green-600 mx-auto" />
                              {limit && (
                                <div className="text-xs text-gray-600 mt-1">
                                  {limit}
                                </div>
                              )}
                            </div>
                          ) : (
                            <X className="h-5 w-5 text-red-500" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
