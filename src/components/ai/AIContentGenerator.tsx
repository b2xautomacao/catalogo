
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Sparkles, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { AdvancedFeatureGate } from '@/components/billing/AdvancedFeatureGate';

interface AIContentGeneratorProps {
  productName: string;
  category?: string;
  description?: string;
  onDescriptionGenerated?: (description: string) => void;
  onSEOGenerated?: (seo: any) => void;
  disabled?: boolean;
  variant?: 'description' | 'seo' | 'both';
  size?: 'sm' | 'lg' | 'default';
}

const AIContentGenerator = ({ 
  productName, 
  category, 
  description,
  onDescriptionGenerated,
  onSEOGenerated,
  disabled,
  variant = 'description',
  size = 'sm'
}: AIContentGeneratorProps) => {
  const [loadingDescription, setLoadingDescription] = useState(false);
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

    setLoadingDescription(true);

    try {
      console.log('Chamando função ai-product-description...');
      const { data, error } = await supabase.functions.invoke('ai-product-description', {
        body: {
          productName: productName.trim(),
          category: category || undefined
        }
      });

      console.log('Resposta da função:', { data, error });

      if (error) {
        console.error('Erro da função:', error);
        throw error;
      }

      if (data?.description && onDescriptionGenerated) {
        onDescriptionGenerated(data.description);
        toast({
          title: "Descrição gerada",
          description: "A descrição foi gerada com sucesso pela IA"
        });
      } else {
        throw new Error('Descrição não retornada pela IA');
      }
    } catch (error) {
      console.error('Erro ao gerar descrição:', error);
      toast({
        title: "Erro ao gerar descrição",
        description: error.message || "Verifique se a OpenAI API está configurada corretamente",
        variant: "destructive"
      });
    } finally {
      setLoadingDescription(false);
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
      console.log('Chamando função ai-seo-generator...');
      const { data, error } = await supabase.functions.invoke('ai-seo-generator', {
        body: {
          productName: productName.trim(),
          category: category || undefined,
          description: description || undefined
        }
      });

      console.log('Resposta da função SEO:', { data, error });

      if (error) {
        console.error('Erro da função SEO:', error);
        throw error;
      }

      if (data && onSEOGenerated) {
        onSEOGenerated(data);
        toast({
          title: "SEO gerado",
          description: "Meta dados SEO foram gerados com sucesso pela IA"
        });
      } else {
        throw new Error('Dados SEO não retornados pela IA');
      }
    } catch (error) {
      console.error('Erro ao gerar SEO:', error);
      toast({
        title: "Erro ao gerar SEO",
        description: error.message || "Verifique se a OpenAI API está configurada corretamente",
        variant: "destructive"
      });
    } finally {
      setLoadingSEO(false);
    }
  };

  const generateBoth = async () => {
    await generateDescription();
    await generateSEO();
  };

  return (
    <AdvancedFeatureGate feature="ai_agent" blockInteraction={true}>
      {variant === 'description' && (
        <Button 
          type="button"
          variant="outline" 
          size={size}
          onClick={generateDescription}
          disabled={disabled || loadingDescription || !productName.trim()}
          className="flex items-center gap-2"
        >
          {loadingDescription ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
          {loadingDescription ? 'Gerando...' : 'Gerar com IA'}
        </Button>
      )}

      {variant === 'seo' && (
        <Button 
          type="button"
          variant="outline" 
          size={size}
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

      {variant === 'both' && (
        <div className="flex gap-2">
          <Button 
            type="button"
            variant="outline" 
            size={size}
            onClick={generateDescription}
            disabled={disabled || loadingDescription || !productName.trim()}
            className="flex items-center gap-2"
          >
            {loadingDescription ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            {loadingDescription ? 'Gerando...' : 'Descrição'}
          </Button>

          <Button 
            type="button"
            variant="outline" 
            size={size}
            onClick={generateSEO}
            disabled={disabled || loadingSEO || !productName.trim()}
            className="flex items-center gap-2"
          >
            {loadingSEO ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            {loadingSEO ? 'Gerando...' : 'SEO'}
          </Button>

          <Button 
            type="button"
            variant="default" 
            size={size}
            onClick={generateBoth}
            disabled={disabled || loadingDescription || loadingSEO || !productName.trim()}
            className="flex items-center gap-2"
          >
            {(loadingDescription || loadingSEO) ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            {(loadingDescription || loadingSEO) ? 'Gerando...' : 'Gerar Tudo'}
          </Button>
        </div>
      )}
    </AdvancedFeatureGate>
  );
};

export default AIContentGenerator;
