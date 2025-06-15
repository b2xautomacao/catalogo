
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Sparkles, Loader2, Copy, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useBenefitValidation } from '@/hooks/useBenefitValidation';
import { usePlanBenefits } from '@/hooks/usePlanBenefits';

interface AIDescriptionGeneratorProps {
  planName: string;
  planType: string;
  price: number;
  planId?: string;
  onDescriptionGenerated: (headline: string, description: string) => void;
}

export const AIDescriptionGenerator: React.FC<AIDescriptionGeneratorProps> = ({
  planName,
  planType,
  price,
  planId,
  onDescriptionGenerated
}) => {
  const [loading, setLoading] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<{
    headline: string;
    description: string;
  } | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  
  const { validateBenefitAccess } = useBenefitValidation();
  const { getPlanBenefits } = usePlanBenefits();

  const generateDescription = async () => {
    if (!planName.trim()) {
      toast.error('Nome do plano é obrigatório');
      return;
    }

    // Verificar acesso ao benefício de IA
    const hasAccess = await validateBenefitAccess('ai_agent', false);
    if (!hasAccess) {
      toast.error('Funcionalidade de IA não disponível no seu plano atual');
      return;
    }

    setLoading(true);

    try {
      // Buscar benefícios do plano se planId fornecido
      let benefits = [];
      if (planId) {
        const planBenefits = getPlanBenefits(planId);
        benefits = planBenefits
          .filter(pb => pb.is_enabled && pb.benefit)
          .map(pb => ({
            name: pb.benefit.name,
            description: pb.benefit.description
          }));
      }

      const { data, error } = await supabase.functions.invoke('ai-plan-description-generator', {
        body: {
          planName: planName.trim(),
          planType,
          price,
          benefits
        }
      });

      if (error) throw error;

      if (data?.headline && data?.description) {
        setGeneratedContent({
          headline: data.headline,
          description: data.description
        });
        toast.success('Descrição gerada com sucesso pela IA');
      } else {
        throw new Error('Resposta inválida da IA');
      }
    } catch (error) {
      console.error('Erro ao gerar descrição:', error);
      toast.error('Erro ao gerar descrição. Verifique se a OpenAI API está configurada');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      toast.success('Copiado para a área de transferência');
      setTimeout(() => setCopiedField(null), 2000);
    } catch (error) {
      toast.error('Erro ao copiar texto');
    }
  };

  const applyDescription = () => {
    if (generatedContent) {
      onDescriptionGenerated(generatedContent.headline, generatedContent.description);
      toast.success('Descrição aplicada ao plano');
      setGeneratedContent(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-purple-600" />
          Gerador de Descrição com IA
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          <Button 
            onClick={generateDescription}
            disabled={loading || !planName.trim()}
            className="flex items-center gap-2"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            {loading ? 'Gerando...' : 'Gerar Descrição Poderosa'}
          </Button>
          
          {generatedContent && (
            <Button 
              onClick={applyDescription}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Check className="h-4 w-4" />
              Aplicar ao Plano
            </Button>
          )}
        </div>

        {generatedContent && (
          <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
            <div>
              <Label className="text-sm font-medium text-gray-700">
                Headline Gerada
              </Label>
              <div className="flex items-center gap-2 mt-1">
                <Textarea
                  value={generatedContent.headline}
                  readOnly
                  className="resize-none bg-white"
                  rows={2}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(generatedContent.headline, 'headline')}
                >
                  {copiedField === 'headline' ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium text-gray-700">
                Descrição Gerada
              </Label>
              <div className="flex items-start gap-2 mt-1">
                <Textarea
                  value={generatedContent.description}
                  readOnly
                  className="resize-none bg-white"
                  rows={4}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(generatedContent.description, 'description')}
                >
                  {copiedField === 'description' ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}

        <p className="text-xs text-gray-600">
          A IA gerará uma headline poderosa e descrição persuasiva baseada no nome, tipo e benefícios do plano.
        </p>
      </CardContent>
    </Card>
  );
};
