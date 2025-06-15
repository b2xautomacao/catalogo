
import React, { useState, useEffect } from 'react';
import { Plus, Save, X, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSystemBenefits } from '@/hooks/useSystemBenefits';
import { usePlanBenefits } from '@/hooks/usePlanBenefits';

interface PlanBenefitsManagerProps {
  planId: string;
  planName: string;
}

export const PlanBenefitsManager: React.FC<PlanBenefitsManagerProps> = ({
  planId,
  planName
}) => {
  const { benefits: systemBenefits, loading: loadingSystem } = useSystemBenefits();
  const { 
    getPlanBenefits, 
    addBenefitToPlan, 
    updatePlanBenefit, 
    removeBenefitFromPlan,
    loading: loadingPlan 
  } = usePlanBenefits();

  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedBenefitId, setSelectedBenefitId] = useState('');
  const [limitValue, setLimitValue] = useState('');

  const planBenefits = getPlanBenefits(planId);
  const availableSystemBenefits = systemBenefits.filter(sb => 
    sb.is_active && !planBenefits.some(pb => pb.benefit_id === sb.id)
  );

  const handleAddBenefit = async () => {
    if (!selectedBenefitId) return;

    const result = await addBenefitToPlan({
      plan_id: planId,
      benefit_id: selectedBenefitId,
      limit_value: limitValue || null,
      is_enabled: true
    });

    if (result.data) {
      setSelectedBenefitId('');
      setLimitValue('');
      setShowAddForm(false);
    }
  };

  const handleUpdateBenefit = async (benefitId: string, updates: { limit_value?: string; is_enabled?: boolean }) => {
    await updatePlanBenefit(benefitId, updates);
  };

  const handleRemoveBenefit = async (benefitId: string) => {
    if (confirm('Remover este benefício do plano?')) {
      await removeBenefitFromPlan(benefitId);
    }
  };

  const groupedBenefits = planBenefits.reduce((acc, benefit) => {
    const category = benefit.benefit?.category || 'general';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(benefit);
    return acc;
  }, {} as Record<string, typeof planBenefits>);

  const categories = [
    { value: 'ai', label: 'Inteligência Artificial' },
    { value: 'products', label: 'Produtos' },
    { value: 'team', label: 'Equipe' },
    { value: 'integrations', label: 'Integrações' },
    { value: 'payments', label: 'Pagamentos' },
    { value: 'branding', label: 'Marca' },
    { value: 'marketing', label: 'Marketing' },
    { value: 'shipping', label: 'Frete' },
    { value: 'support', label: 'Suporte' },
    { value: 'general', label: 'Geral' }
  ];

  if (loadingSystem || loadingPlan) {
    return <div className="p-6 text-center">Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold">Benefícios do Plano {planName}</h3>
          <p className="text-gray-600">Configure quais benefícios este plano oferece</p>
        </div>
        <Button 
          onClick={() => setShowAddForm(true)} 
          disabled={showAddForm || availableSystemBenefits.length === 0}
        >
          <Plus className="h-4 w-4 mr-2" />
          Adicionar Benefício
        </Button>
      </div>

      {/* Formulário de Adição */}
      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle>Adicionar Benefício ao Plano</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="benefit-select">Selecionar Benefício</Label>
              <Select value={selectedBenefitId} onValueChange={setSelectedBenefitId}>
                <SelectTrigger>
                  <SelectValue placeholder="Escolha um benefício" />
                </SelectTrigger>
                <SelectContent>
                  {availableSystemBenefits.map((benefit) => (
                    <SelectItem key={benefit.id} value={benefit.id}>
                      <div>
                        <div className="font-medium">{benefit.name}</div>
                        <div className="text-sm text-gray-600">{benefit.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="limit-value">Limite/Valor (opcional)</Label>
              <Input
                id="limit-value"
                value={limitValue}
                onChange={(e) => setLimitValue(e.target.value)}
                placeholder="Ex: 10, ilimitado, etc."
              />
              <p className="text-sm text-gray-500 mt-1">
                Deixe vazio para benefícios sem limite específico
              </p>
            </div>

            <div className="flex gap-2 pt-4">
              <Button onClick={handleAddBenefit} disabled={!selectedBenefitId}>
                <Save className="h-4 w-4 mr-2" />
                Adicionar
              </Button>
              <Button variant="outline" onClick={() => setShowAddForm(false)}>
                <X className="h-4 w-4 mr-2" />
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lista de Benefícios do Plano */}
      <div className="space-y-6">
        {Object.entries(groupedBenefits).map(([category, categoryBenefits]) => {
          const categoryInfo = categories.find(c => c.value === category);
          
          return (
            <Card key={category}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {categoryInfo?.label || category}
                  <Badge variant="outline">{categoryBenefits.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {categoryBenefits.map((planBenefit) => (
                    <div key={planBenefit.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{planBenefit.benefit?.name}</span>
                          <Badge variant={planBenefit.is_enabled ? 'default' : 'secondary'}>
                            {planBenefit.is_enabled ? 'Ativo' : 'Inativo'}
                          </Badge>
                          {planBenefit.limit_value && (
                            <Badge variant="outline">
                              Limite: {planBenefit.limit_value}
                            </Badge>
                          )}
                        </div>
                        {planBenefit.benefit?.description && (
                          <p className="text-sm text-gray-600">{planBenefit.benefit.description}</p>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Label htmlFor={`limit-${planBenefit.id}`} className="text-sm">
                              Limite:
                            </Label>
                            <Input
                              id={`limit-${planBenefit.id}`}
                              value={planBenefit.limit_value || ''}
                              onChange={(e) => {
                                const value = e.target.value;
                                handleUpdateBenefit(planBenefit.id, { 
                                  limit_value: value || null 
                                });
                              }}
                              placeholder="Ex: 10"
                              className="w-20 h-8"
                            />
                          </div>
                        </div>
                        
                        <Switch
                          checked={planBenefit.is_enabled}
                          onCheckedChange={(checked) => 
                            handleUpdateBenefit(planBenefit.id, { is_enabled: checked })
                          }
                        />
                        
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleRemoveBenefit(planBenefit.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  
                  {categoryBenefits.length === 0 && (
                    <p className="text-center text-gray-500 py-8">
                      Nenhum benefício nesta categoria
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {planBenefits.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nenhum benefício configurado
            </h3>
            <p className="text-gray-600 mb-4">
              Este plano ainda não possui benefícios configurados.
            </p>
            <Button onClick={() => setShowAddForm(true)}>
              Adicionar Primeiro Benefício
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
