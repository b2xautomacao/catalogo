
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import ColorPicker from '@/components/ui/color-picker';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface VariationGroup {
  id: string;
  product_id: string;
  primary_attribute: string;
  secondary_attribute?: string;
  created_at: string;
  updated_at: string;
}

interface VariationValue {
  value: string;
  hex_color: string;
  grade_sizes: string;
  grade_pairs: string;
}

const VariationGroups: React.FC = () => {
  const { profile } = useAuth();
  const [groups, setGroups] = useState<VariationGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [newGroup, setNewGroup] = useState({
    product_id: '',
    primary_attribute: '',
    secondary_attribute: ''
  });
  const [newVariation, setNewVariation] = useState<VariationValue>({
    value: '',
    hex_color: '#000000',
    grade_sizes: '',
    grade_pairs: ''
  });

  const loadGroups = async () => {
    if (!profile?.store_id) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('variation_groups')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setGroups(data || []);
    } catch (error) {
      console.error('Erro ao carregar grupos:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGroups();
  }, [profile?.store_id]);

  const handleCreateGroup = async () => {
    if (!newGroup.product_id || !newGroup.primary_attribute) return;

    try {
      const { error } = await supabase
        .from('variation_groups')
        .insert({
          product_id: newGroup.product_id,
          primary_attribute: newGroup.primary_attribute,
          secondary_attribute: newGroup.secondary_attribute || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
      
      setNewGroup({
        product_id: '',
        primary_attribute: '',
        secondary_attribute: ''
      });
      
      await loadGroups();
    } catch (error) {
      console.error('Erro ao criar grupo:', error);
    }
  };

  const handleAddVariation = async (groupId: string) => {
    if (!newVariation.value) return;

    try {
      const { error } = await supabase
        .from('hierarchical_variations')
        .insert({
          variation_group_id: groupId,
          variation_type: 'main',
          variation_value: newVariation.value,
          stock: 0,
          price_adjustment: 0,
          is_active: true,
          display_order: 1,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
      
      setNewVariation({
        value: '',
        hex_color: '#000000',
        grade_sizes: '',
        grade_pairs: ''
      });
      
      await loadGroups();
    } catch (error) {
      console.error('Erro ao adicionar variação:', error);  
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Grupos de Variações</h1>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Criar Novo Grupo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            placeholder="ID do Produto"
            value={newGroup.product_id}
            onChange={(e) => setNewGroup(prev => ({ ...prev, product_id: e.target.value }))}
          />
          <Input
            placeholder="Atributo Primário (ex: cor)"
            value={newGroup.primary_attribute}
            onChange={(e) => setNewGroup(prev => ({ ...prev, primary_attribute: e.target.value }))}
          />
          <Input
            placeholder="Atributo Secundário (opcional)"
            value={newGroup.secondary_attribute}
            onChange={(e) => setNewGroup(prev => ({ ...prev, secondary_attribute: e.target.value }))}
          />
          <Button onClick={handleCreateGroup}>
            Criar Grupo
          </Button>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {groups.map(group => (
          <Card key={group.id}>
            <CardHeader>
              <CardTitle>
                {group.primary_attribute}
                {group.secondary_attribute && ` + ${group.secondary_attribute}`}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Valor da variação"
                  value={newVariation.value}
                  onChange={(e) => setNewVariation(prev => ({ ...prev, value: e.target.value }))}
                />
                <ColorPicker
                  value={newVariation.hex_color}
                  onChange={(color) => setNewVariation(prev => ({ ...prev, hex_color: color }))}
                />
                <Button onClick={() => handleAddVariation(group.id)}>
                  Adicionar
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default VariationGroups;
