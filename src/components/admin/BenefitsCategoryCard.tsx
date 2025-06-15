
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SystemBenefit } from '@/hooks/useSystemBenefits';
import { PlanBenefit } from '@/hooks/usePlanBenefits';

interface BenefitsCategoryCardProps {
  category: {
    value: string;
    label: string;
    icon?: React.ReactNode;
  };
  benefits: SystemBenefit[];
  planBenefits: PlanBenefit[];
  onToggleBenefit: (benefitId: string, isEnabled: boolean, existingPlanBenefitId?: string) => void;
  onUpdateLimit: (planBenefitId: string, limitValue: string | null) => void;
}

export const BenefitsCategoryCard: React.FC<BenefitsCategoryCardProps> = ({
  category,
  benefits,
  planBenefits,
  onToggleBenefit,
  onUpdateLimit
}) => {
  const categoryBenefits = benefits.filter(b => b.category === category.value);
  const enabledCount = categoryBenefits.filter(benefit => {
    const planBenefit = planBenefits.find(pb => pb.benefit_id === benefit.id);
    return planBenefit?.is_enabled;
  }).length;

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {category.icon}
            <span>{category.label}</span>
          </div>
          <Badge variant="outline">
            {enabledCount}/{categoryBenefits.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {categoryBenefits.map((benefit) => {
          const planBenefit = planBenefits.find(pb => pb.benefit_id === benefit.id);
          const isEnabled = planBenefit?.is_enabled || false;

          return (
            <div key={benefit.id} className="flex flex-col space-y-2 p-3 border rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <Label htmlFor={`benefit-${benefit.id}`} className="font-medium">
                    {benefit.name}
                  </Label>
                  {benefit.description && (
                    <p className="text-sm text-gray-600 mt-1">
                      {benefit.description}
                    </p>
                  )}
                </div>
                <Switch
                  id={`benefit-${benefit.id}`}
                  checked={isEnabled}
                  onCheckedChange={(checked) => 
                    onToggleBenefit(benefit.id, checked, planBenefit?.id)
                  }
                />
              </div>
              
              {isEnabled && planBenefit && (
                <div className="flex items-center gap-2 mt-2">
                  <Label htmlFor={`limit-${benefit.id}`} className="text-sm whitespace-nowrap">
                    Limite:
                  </Label>
                  <Input
                    id={`limit-${benefit.id}`}
                    value={planBenefit.limit_value || ''}
                    onChange={(e) => {
                      const value = e.target.value;
                      onUpdateLimit(planBenefit.id, value || null);
                    }}
                    placeholder="Ex: 10, ilimitado"
                    className="h-8 text-sm"
                  />
                </div>
              )}
            </div>
          );
        })}
        
        {categoryBenefits.length === 0 && (
          <p className="text-center text-gray-500 py-4">
            Nenhum benefício nesta categoria
          </p>
        )}
      </CardContent>
    </Card>
  );
};
