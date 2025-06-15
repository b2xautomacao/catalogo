
import React, { useEffect } from 'react';
import { Sparkles, Zap, Users, Plug, CreditCard, Palette, Megaphone, Truck, Headphones, Settings } from 'lucide-react';
import { useSystemBenefits } from '@/hooks/useSystemBenefits';
import { usePlanBenefits } from '@/hooks/usePlanBenefits';
import { usePlanBenefitsAutoSave } from '@/hooks/usePlanBenefitsAutoSave';
import { BenefitsCategoryCard } from '@/components/admin/BenefitsCategoryCard';
import { toast } from 'sonner';

interface PlanBenefitsToggleListProps {
  planId: string;
  planName: string;
}

export const PlanBenefitsToggleList: React.FC<PlanBenefitsToggleListProps> = ({
  planId,
  planName
}) => {
  const { benefits: systemBenefits, loading: loadingSystem, refetch: refetchSystemBenefits } = useSystemBenefits();
  const { getPlanBenefits, loading: loadingPlan, refetch: refetchPlanBenefits } = usePlanBenefits();
  const { toggleBenefit, updateBenefitLimit } = usePlanBenefitsAutoSave(planId);

  const planBenefits = getPlanBenefits(planId);

  console.log(`📊 PlanBenefitsToggleList - Plan: ${planId}`, {
    systemBenefits: systemBenefits.length,
    planBenefits: planBenefits.length,
    loadingSystem,
    loadingPlan
  });

  // Refresh data when component mounts or planId changes
  useEffect(() => {
    console.log(`🔄 Refreshing data for plan: ${planId}`);
    refetchSystemBenefits();
    refetchPlanBenefits(planId);
  }, [planId, refetchSystemBenefits, refetchPlanBenefits]);

  const categories = [
    { value: 'ai', label: 'Inteligência Artificial', icon: <Sparkles className="h-5 w-5 text-purple-600" /> },
    { value: 'products', label: 'Produtos', icon: <Zap className="h-5 w-5 text-blue-600" /> },
    { value: 'team', label: 'Equipe', icon: <Users className="h-5 w-5 text-green-600" /> },
    { value: 'integrations', label: 'Integrações', icon: <Plug className="h-5 w-5 text-orange-600" /> },
    { value: 'payments', label: 'Pagamentos', icon: <CreditCard className="h-5 w-5 text-red-600" /> },
    { value: 'branding', label: 'Marca', icon: <Palette className="h-5 w-5 text-pink-600" /> },
    { value: 'marketing', label: 'Marketing', icon: <Megaphone className="h-5 w-5 text-yellow-600" /> },
    { value: 'shipping', label: 'Frete', icon: <Truck className="h-5 w-5 text-indigo-600" /> },
    { value: 'support', label: 'Suporte', icon: <Headphones className="h-5 w-5 text-teal-600" /> },
    { value: 'general', label: 'Geral', icon: <Settings className="h-5 w-5 text-gray-600" /> }
  ];

  if (loadingSystem || loadingPlan) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-gray-600">Carregando benefícios...</p>
        </div>
      </div>
    );
  }

  const handleToggleBenefit = async (
    benefitId: string, 
    isEnabled: boolean, 
    existingPlanBenefitId?: string
  ) => {
    console.log(`🎯 PlanBenefitsToggleList: Handling toggle for benefit ${benefitId}`);
    try {
      await toggleBenefit(benefitId, isEnabled, existingPlanBenefitId);
    } catch (error) {
      console.error('❌ Error in handleToggleBenefit:', error);
      toast.error('Erro ao atualizar benefício. Tente novamente.');
    }
  };

  const handleUpdateLimit = async (planBenefitId: string, limitValue: string | null) => {
    // Debounce automático - atualizar após pequeno delay
    setTimeout(() => {
      updateBenefitLimit(planBenefitId, limitValue);
    }, 1000);
  };

  const activeBenefits = systemBenefits.filter(b => b.is_active);
  const enabledBenefits = planBenefits.filter(pb => pb.is_enabled);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold">Benefícios do Plano {planName}</h3>
          <p className="text-gray-600">
            Configure quais benefícios este plano oferece ({enabledBenefits.length}/{activeBenefits.length} ativos)
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map((category) => {
          const categoryBenefits = activeBenefits.filter(
            b => b.category === category.value
          );
          
          if (categoryBenefits.length === 0) return null;

          return (
            <BenefitsCategoryCard
              key={category.value}
              category={category}
              benefits={systemBenefits}
              planBenefits={planBenefits}
              onToggleBenefit={handleToggleBenefit}
              onUpdateLimit={handleUpdateLimit}
            />
          );
        })}
      </div>

      {activeBenefits.length === 0 && (
        <div className="text-center py-12">
          <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Nenhum benefício disponível
          </h3>
          <p className="text-gray-600">
            Configure primeiro os benefícios do sistema antes de associá-los aos planos.
          </p>
        </div>
      )}
    </div>
  );
};
