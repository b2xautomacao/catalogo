
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { CreateSubscriptionPlanData, UpdateSubscriptionPlanData } from '@/hooks/useSubscriptionPlans';
import { AIDescriptionGenerator } from '@/components/admin/AIDescriptionGenerator';

interface SubscriptionPlanFormProps {
  initialData?: any;
  onSubmit: (data: CreateSubscriptionPlanData | UpdateSubscriptionPlanData) => void;
  onCancel: () => void;
}

const SubscriptionPlanForm: React.FC<SubscriptionPlanFormProps> = ({
  initialData,
  onSubmit,
  onCancel
}) => {
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    type: initialData?.type || 'basic',
    description: initialData?.description || '',
    price_monthly: initialData?.price_monthly || '',
    price_yearly: initialData?.price_yearly || '',
    is_active: initialData?.is_active ?? true,
    trial_days: initialData?.trial_days || 7,
    sort_order: initialData?.sort_order || 0
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const submitData = {
      ...formData,
      price_monthly: parseFloat(formData.price_monthly) || 0,
      price_yearly: formData.price_yearly ? parseFloat(formData.price_yearly) : null,
      trial_days: parseInt(formData.trial_days) || 0,
      sort_order: parseInt(formData.sort_order) || 0
    };

    onSubmit(submitData);
  };

  const handleDescriptionGenerated = (headline: string, description: string) => {
    setFormData(prev => ({
      ...prev,
      description: description
    }));
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="name">Nome do Plano</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            placeholder="Ex: Plano Premium"
            required
          />
        </div>

        <div>
          <Label htmlFor="type">Tipo do Plano</Label>
          <Select 
            value={formData.type} 
            onValueChange={(value) => setFormData(prev => ({ ...prev, type: value as any }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="basic">Básico</SelectItem>
              <SelectItem value="premium">Premium</SelectItem>
              <SelectItem value="enterprise">Enterprise</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="price_monthly">Preço Mensal (R$)</Label>
            <Input
              id="price_monthly"
              type="number"
              step="0.01"
              value={formData.price_monthly}
              onChange={(e) => setFormData(prev => ({ ...prev, price_monthly: e.target.value }))}
              placeholder="0.00"
              required
            />
          </div>

          <div>
            <Label htmlFor="price_yearly">Preço Anual (R$) - Opcional</Label>
            <Input
              id="price_yearly"
              type="number"
              step="0.01"
              value={formData.price_yearly}
              onChange={(e) => setFormData(prev => ({ ...prev, price_yearly: e.target.value }))}
              placeholder="0.00"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="description">Descrição</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Descrição do plano..."
            rows={3}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="trial_days">Dias de Trial</Label>
            <Input
              id="trial_days"
              type="number"
              value={formData.trial_days}
              onChange={(e) => setFormData(prev => ({ ...prev, trial_days: e.target.value }))}
            />
          </div>

          <div>
            <Label htmlFor="sort_order">Ordem de Exibição</Label>
            <Input
              id="sort_order"
              type="number"
              value={formData.sort_order}
              onChange={(e) => setFormData(prev => ({ ...prev, sort_order: e.target.value }))}
            />
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="is_active"
            checked={formData.is_active}
            onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
          />
          <Label htmlFor="is_active">Plano Ativo</Label>
        </div>

        <div className="flex gap-2 pt-4">
          <Button type="submit">
            {initialData ? 'Atualizar' : 'Criar'} Plano
          </Button>
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
        </div>
      </form>

      {/* Gerador de Descrição com IA */}
      {formData.name && (
        <AIDescriptionGenerator
          planName={formData.name}
          planType={formData.type}
          price={parseFloat(formData.price_monthly) || 0}
          planId={initialData?.id}
          onDescriptionGenerated={handleDescriptionGenerated}
        />
      )}
    </div>
  );
};

export default SubscriptionPlanForm;
