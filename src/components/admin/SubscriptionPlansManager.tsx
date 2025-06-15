
import React, { useState } from 'react';
import { Plus, Edit, Trash2, Eye, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import SubscriptionPlanForm from './SubscriptionPlanForm';
import { useSubscriptionPlans } from '@/hooks/useSubscriptionPlans';

const SubscriptionPlansManager = () => {
  const { plans, loading, createPlan, updatePlan, deletePlan } = useSubscriptionPlans();
  const [showForm, setShowForm] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const { toast } = useToast();

  const handleCreatePlan = async (planData) => {
    const { error } = await createPlan(planData);
    if (!error) {
      setShowForm(false);
      toast({
        title: "Sucesso",
        description: "Plano criado com sucesso",
      });
    }
  };

  const handleUpdatePlan = async (planData) => {
    if (!editingPlan) return;
    
    const { error } = await updatePlan(editingPlan.id, planData);
    if (!error) {
      setEditingPlan(null);
      toast({
        title: "Sucesso", 
        description: "Plano atualizado com sucesso",
      });
    }
  };

  const handleDeletePlan = async (planId) => {
    if (confirm('Tem certeza que deseja excluir este plano?')) {
      const { error } = await deletePlan(planId);
      if (!error) {
        toast({
          title: "Sucesso",
          description: "Plano excluído com sucesso",
        });
      }
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="loading-spinner"></div>
          <span className="ml-2">Carregando planos...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Planos de Assinatura</h2>
          <p className="text-muted-foreground">
            Gerencie os planos disponíveis no sistema
          </p>
        </div>
        <Button onClick={() => setShowForm(true)} className="btn-primary">
          <Plus className="mr-2 h-4 w-4" />
          Novo Plano
        </Button>
      </div>

      {/* Lista de Planos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <Card key={plan.id} className="card-modern">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{plan.name}</CardTitle>
                <Badge variant={plan.is_active ? "default" : "secondary"}>
                  {plan.is_active ? "Ativo" : "Inativo"}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">{plan.description}</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Mensal:</span>
                  <span className="font-bold">R$ {plan.price_monthly.toFixed(2)}</span>
                </div>
                {plan.price_yearly && (
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Anual:</span>
                    <span className="font-bold">R$ {plan.price_yearly.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Trial:</span>
                  <span>{plan.trial_days} dias</span>
                </div>
              </div>

              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                <span>Tipo: {plan.type}</span>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingPlan(plan)}
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Editar
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDeletePlan(plan.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Excluir
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        {plans.length === 0 && (
          <Card className="col-span-full">
            <CardContent className="text-center py-8">
              <p className="text-muted-foreground">
                Nenhum plano cadastrado ainda.
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Dialog para criar plano */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Novo Plano de Assinatura</DialogTitle>
          </DialogHeader>
          <SubscriptionPlanForm
            onSubmit={handleCreatePlan}
            onCancel={() => setShowForm(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Dialog para editar plano */}
      <Dialog open={!!editingPlan} onOpenChange={() => setEditingPlan(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Plano</DialogTitle>
          </DialogHeader>
          {editingPlan && (
            <SubscriptionPlanForm
              initialData={editingPlan}
              onSubmit={handleUpdatePlan}
              onCancel={() => setEditingPlan(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SubscriptionPlansManager;
