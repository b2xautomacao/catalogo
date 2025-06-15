
import React from 'react';
import { Check, X, Star, Zap, Shield, Palette, Users, Package, Truck, HeadphonesIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Benefit {
  name: string;
  description?: string;
  category: string;
  limit?: string | null;
  hasAccess: boolean;
}

interface PlanBenefitsListProps {
  benefits: Benefit[];
  title?: string;
  showLimits?: boolean;
  compact?: boolean;
}

const getCategoryIcon = (category: string) => {
  const icons = {
    ai: Star,
    products: Package,
    team: Users,
    integrations: Zap,
    payments: Shield,
    branding: Palette,
    marketing: Star,
    shipping: Truck,
    support: HeadphonesIcon,
    general: Check
  };

  const Icon = icons[category as keyof typeof icons] || Check;
  return <Icon className="h-4 w-4" />;
};

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

const getCategoryColor = (category: string) => {
  const colors = {
    ai: 'bg-purple-100 text-purple-800',
    products: 'bg-blue-100 text-blue-800',
    team: 'bg-green-100 text-green-800',
    integrations: 'bg-orange-100 text-orange-800',
    payments: 'bg-emerald-100 text-emerald-800',
    branding: 'bg-pink-100 text-pink-800',
    marketing: 'bg-yellow-100 text-yellow-800',
    shipping: 'bg-indigo-100 text-indigo-800',
    support: 'bg-red-100 text-red-800',
    general: 'bg-gray-100 text-gray-800'
  };

  return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800';
};

export const PlanBenefitsList: React.FC<PlanBenefitsListProps> = ({
  benefits,
  title = "Benefícios do Plano",
  showLimits = true,
  compact = false
}) => {
  const groupedBenefits = benefits.reduce((acc, benefit) => {
    if (!acc[benefit.category]) {
      acc[benefit.category] = [];
    }
    acc[benefit.category].push(benefit);
    return acc;
  }, {} as Record<string, Benefit[]>);

  if (compact) {
    return (
      <div className="space-y-2">
        {title && <h3 className="font-medium text-sm text-gray-700">{title}</h3>}
        <div className="space-y-1">
          {benefits.map((benefit, index) => (
            <div key={index} className="flex items-center gap-2 text-sm">
              {benefit.hasAccess ? (
                <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
              ) : (
                <X className="h-4 w-4 text-red-500 flex-shrink-0" />
              )}
              <span className={benefit.hasAccess ? 'text-gray-900' : 'text-gray-500'}>
                {benefit.name}
                {showLimits && benefit.limit && (
                  <span className="text-gray-500 ml-1">({benefit.limit})</span>
                )}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {Object.entries(groupedBenefits).map(([category, categoryBenefits]) => (
          <div key={category} className="space-y-3">
            <div className="flex items-center gap-2">
              {getCategoryIcon(category)}
              <Badge variant="outline" className={getCategoryColor(category)}>
                {getCategoryLabel(category)}
              </Badge>
            </div>
            
            <div className="space-y-2 ml-6">
              {categoryBenefits.map((benefit, index) => (
                <div key={index} className="space-y-1">
                  <div className="flex items-center gap-2">
                    {benefit.hasAccess ? (
                      <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                    ) : (
                      <X className="h-4 w-4 text-red-500 flex-shrink-0" />
                    )}
                    <span className={`font-medium ${benefit.hasAccess ? 'text-gray-900' : 'text-gray-500'}`}>
                      {benefit.name}
                      {showLimits && benefit.limit && (
                        <span className="text-gray-500 font-normal ml-1">({benefit.limit})</span>
                      )}
                    </span>
                  </div>
                  
                  {benefit.description && (
                    <p className="text-sm text-gray-600 ml-6">
                      {benefit.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
        
        {benefits.length === 0 && (
          <p className="text-center text-gray-500 py-8">
            Nenhum benefício encontrado
          </p>
        )}
      </CardContent>
    </Card>
  );
};
