
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useCategories, CreateCategoryData } from '@/hooks/useCategories';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Loader2, Sparkles } from 'lucide-react';
import { usePlanPermissions } from '@/hooks/usePlanPermissions';
import { PlanUpgradeModal } from '@/components/billing/PlanUpgradeModal';

interface QuickCategoryFormProps {
  onCategoryCreated: (category: any) => void;
  onCancel: () => void;
}

const QuickCategoryForm = ({ onCategoryCreated, onCancel }: QuickCategoryFormProps) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [generatingDescription, setGeneratingDescription] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const { createCategory } = useCategories();
  const { profile } = useAuth();
  const { toast } = useToast();
  const { checkFeatureAccess } = usePlanPermissions();

  const generateDescription = async () => {
    if (!name.trim()) {
      toast({
        title: "Nome obrigatório",
        description: "Digite o nome da categoria antes de gerar a descrição",
        variant: "destructive"
      });
      return;
    }

    // Verificar acesso à funcionalidade de IA
    if (!checkFeatureAccess('ai_agent', false)) {
      setShowUpgradeModal(true);
      return;
    }

    setGeneratingDescription(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('ai-product-description', {
        body: {
          productName: `Categoria: ${name.trim()}`,
          category: 'categoria de produtos'
        }
      });

      if (error) throw error;

      if (data?.description) {
        setDescription(data.description);
        toast({
          title: "Descrição gerada",
          description: "Descrição criada com sucesso pela IA"
        });
      }
    } catch (error) {
      console.error('Erro ao gerar descrição:', error);
      toast({
        title: "Erro ao gerar descrição",
        description: "Não foi possível gerar a descrição. Verifique se a OpenAI está configurada.",
        variant: "destructive"
      });
    } finally {
      setGeneratingDescription(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!name.trim()) {
      toast({
        title: "Nome obrigatório",
        description: "Por favor, insira o nome da categoria",
        variant: "destructive"
      });
      return;
    }

    if (!profile?.store_id) {
      toast({
        title: "Erro",
        description: "Loja não identificada",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      const categoryData: CreateCategoryData = {
        store_id: profile.store_id,
        name: name.trim(),
        description: description.trim() || undefined,
        is_active: true
      };

      const { data, error } = await createCategory(categoryData);

      if (error) {
        console.error('Erro ao criar categoria:', error);
        toast({
          title: "Erro ao criar categoria",
          description: "Verifique se o nome não está duplicado",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Categoria criada",
          description: `A categoria "${name}" foi criada com sucesso`
        });
        onCategoryCreated(data);
        setName('');
        setDescription('');
      }
    } catch (error) {
      console.error('Erro inesperado:', error);
      toast({
        title: "Erro inesperado",
        description: "Ocorreu um erro ao criar a categoria",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="p-4 border rounded-lg bg-gray-50">
        <div className="flex items-center gap-2 mb-3">
          <Plus className="h-4 w-4" />
          <h3 className="font-medium">Cadastro Rápido de Categoria</h3>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="categoryName">Nome da Categoria</Label>
            <Input
              id="categoryName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Roupas, Eletrônicos, Acessórios..."
              disabled={loading}
              required
            />
          </div>

          <div>
            <div className="flex items-center gap-2 mb-2">
              <Label htmlFor="categoryDescription">Descrição</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={generateDescription}
                disabled={!name.trim() || generatingDescription}
              >
                {generatingDescription ? (
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4 mr-1" />
                )}
                {generatingDescription ? 'Gerando...' : 'Gerar com IA'}
              </Button>
            </div>
            <Textarea
              id="categoryDescription"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Breve descrição da categoria..."
              rows={2}
              disabled={loading}
            />
          </div>

          <div className="flex gap-2">
            <Button 
              type="submit" 
              disabled={loading || !name.trim()}
              className="flex-1"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Criando...
                </>
              ) : (
                'Criar Categoria'
              )}
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={onCancel} 
              disabled={loading}
            >
              Cancelar
            </Button>
          </div>
        </form>
      </div>

      <PlanUpgradeModal 
        open={showUpgradeModal}
        onOpenChange={setShowUpgradeModal}
      />
    </>
  );
};

export default QuickCategoryForm;
