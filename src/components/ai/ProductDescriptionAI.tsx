
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Sparkles, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { AdvancedFeatureGate } from '@/components/billing/AdvancedFeatureGate';

interface ProductDescriptionAIProps {
  productName: string;
  category?: string;
  onDescriptionGenerated: (description: string) => void;
  onSEOGenerated?: (seo: any) => void;
  disabled?: boolean;
  showSEOButton?: boolean;
}

const ProductDescriptionAI = ({ 
  productName, 
  category, 
  onDescriptionGenerated,
  onSEOGenerated,
  disabled,
  showSEOButton = false
}: ProductDescriptionAIProps) => {
  const [loading, setLoading] = useState(false);
  const [loadingSEO, setLoadingSEO] = useState(false);
  const { toast } = useToast();

  const generateDescription = async () => {
    if (!productName.trim()) {
      toast({
        title: "Nome do produto obrigatório",
        description: "Por favor, insira o nome do produto antes de gerar a descrição",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('ai-product-description', {
        body: {
          productName: productName.trim(),
          category: category || undefined
        }
      });

      if (error) throw error;

      if (data?.description) {
        onDescriptionGenerated(data.description);
        toast({
          title: "Descrição gerada",
          description: "A descrição foi gerada com sucesso pela IA"
        });
      } else {
        throw new Error('Descrição não retornada');
      }
    } catch (error) {
      console.error('Erro ao gerar descrição:', error);
      toast({
        title: "Erro ao gerar descrição",
        description: "Verifique se a OpenAI API está configurada corretamente",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const generateSEO = async () => {
    if (!productName.trim()) {
      toast({
        title: "Nome do produto obrigatório",
        description: "Por favor, insira o nome do produto antes de gerar o SEO",
        variant: "destructive"
      });
      return;
    }

    setLoadingSEO(true);

    try {
      const { data, error } = await supabase.functions.invoke('ai-seo-generator', {
        body: {
          productName: productName.trim(),
          category: category || undefined
        }
      });

      if (error) throw error;

      if (data && onSEOGenerated) {
        onSEOGenerated(data);
        toast({
          title: "SEO gerado",
          description: "Meta dados SEO foram gerados com sucesso pela IA"
        });
      }
    } catch (error) {
      console.error('Erro ao gerar SEO:', error);
      toast({
        title: "Erro ao gerar SEO",
        description: "Verifique se a OpenAI API está configurada corretamente",
        variant: "destructive"
      });
    } finally {
      setLoadingSEO(false);
    }
  };

  return (
    <AdvancedFeatureGate feature="ai_agent" blockInteraction={true}>
      <div className="flex gap-2">
        <Button 
          type="button"
          variant="outline" 
          size="sm"
          onClick={generateDescription}
          disabled={disabled || loading || !productName.trim()}
          className="flex items-center gap-2"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
          {loading ? 'Gerando...' : 'Gerar Descrição'}
        </Button>

        {showSEOButton && (
          <Button 
            type="button"
            variant="outline" 
            size="sm"
            onClick={generateSEO}
            disabled={disabled || loadingSEO || !productName.trim()}
            className="flex items-center gap-2"
          >
            {loadingSEO ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            {loadingSEO ? 'Gerando...' : 'Gerar SEO'}
          </Button>
        )}
      </div>
    </AdvancedFeatureGate>
  );
};

export default ProductDescriptionAI;
