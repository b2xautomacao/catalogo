
import React, { useState } from 'react';
import { Plus, Edit, Trash2, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useSystemBenefits, SystemBenefit, CreateSystemBenefitData } from '@/hooks/useSystemBenefits';

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

export const SystemBenefitsManager: React.FC = () => {
  const { benefits, loading, createBenefit, updateBenefit, deleteBenefit, getBenefitsByCategory } = useSystemBenefits();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingBenefit, setEditingBenefit] = useState<SystemBenefit | null>(null);

  const [formData, setFormData] = useState<CreateSystemBenefitData>({
    name: '',
    description: '',
    benefit_key: '',
    category: 'general'
  });

  const handleCreate = async () => {
    if (!formData.name || !formData.benefit_key) return;

    const result = await createBenefit(formData);
    if (result.data) {
      setFormData({ name: '', description: '', benefit_key: '', category: 'general' });
      setShowCreateForm(false);
    }
  };

  const handleUpdate = async (id: string, updates: Partial<SystemBenefit>) => {
    await updateBenefit(id, updates);
    setEditingBenefit(null);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja remover este benefício? Esta ação não pode ser desfeita.')) {
      await deleteBenefit(id);
    }
  };

  const generateBenefitKey = (name: string) => {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '');
  };

  const benefitsByCategory = getBenefitsByCategory();

  if (loading) {
    return <div className="p-6 text-center">Carregando benefícios...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Gerenciar Benefícios do Sistema</h2>
          <p className="text-gray-600">Configure os benefícios disponíveis para os planos</p>
        </div>
        <Button onClick={() => setShowCreateForm(true)} disabled={showCreateForm}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Benefício
        </Button>
      </div>

      {/* Formulário de Criação */}
      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>Criar Novo Benefício</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Nome do Benefício</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => {
                    const name = e.target.value;
                    setFormData({
                      ...formData,
                      name,
                      benefit_key: generateBenefitKey(name)
                    });
                  }}
                  placeholder="Ex: Agente de IA"
                />
              </div>
              
              <div>
                <Label htmlFor="benefit_key">Chave do Benefício</Label>
                <Input
                  id="benefit_key"
                  value={formData.benefit_key}
                  onChange={(e) => setFormData({ ...formData, benefit_key: e.target.value })}
                  placeholder="Ex: ai_agent"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descreva o que este benefício oferece"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="category">Categoria</Label>
              <Select 
                value={formData.category} 
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2 pt-4">
              <Button onClick={handleCreate} disabled={!formData.name || !formData.benefit_key}>
                <Save className="h-4 w-4 mr-2" />
                Criar Benefício
              </Button>
              <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                <X className="h-4 w-4 mr-2" />
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lista de Benefícios por Categoria */}
      <div className="space-y-6">
        {Object.entries(benefitsByCategory).map(([category, categoryBenefits]) => {
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
                  {categoryBenefits.map((benefit) => (
                    <div key={benefit.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{benefit.name}</span>
                          <Badge variant={benefit.is_active ? 'default' : 'secondary'}>
                            {benefit.is_active ? 'Ativo' : 'Inativo'}
                          </Badge>
                        </div>
                        {benefit.description && (
                          <p className="text-sm text-gray-600">{benefit.description}</p>
                        )}
                        <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                          {benefit.benefit_key}
                        </code>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={benefit.is_active}
                          onCheckedChange={(checked) => 
                            handleUpdate(benefit.id, { is_active: checked })
                          }
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingBenefit(benefit)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(benefit.id)}
                        >
                          <Trash2 className="h-4 w-4" />
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
    </div>
  );
};
