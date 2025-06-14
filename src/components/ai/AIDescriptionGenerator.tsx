
import React, { useState } from 'react';
import { Sparkles, Loader2, Copy, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { usePlanPermissions } from '@/hooks/usePlanPermissions';
import { PlanUpgradeModal } from '@/components/billing/PlanUpgradeModal';

interface AIDescriptionGeneratorProps {
  productName: string;
  category: string;
  onDescriptionGenerated: (description: string, seo: string) => void;
}

const AIDescriptionGenerator = ({ productName, category, onDescriptionGenerated }: AIDescriptionGeneratorProps) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [keywords, setKeywords] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [generatedDescription, setGeneratedDescription] = useState('');
  const [generatedSEO, setGeneratedSEO] = useState('');
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const { toast } = useToast();
  const { checkFeatureAccess } = usePlanPermissions();

  const generateContent = async () => {
    if (!productName.trim()) {
      toast({
        title: "Erro",
        description: "Nome do produto é obrigatório para gerar descrição",
        variant: "destructive",
      });
      return;
    }

    // Verificar acesso à funcionalidade de IA
    if (!checkFeatureAccess('ai_agent', false)) {
      setShowUpgradeModal(true);
      return;
    }

    setIsGenerating(true);
    
    // Simulação da API de IA - Em produção, substituir por chamada real à API
    try {
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simula delay da API
      
      const mockDescription = `${productName} é um produto excepcional da categoria ${category}. 
      
Desenvolvido com alta qualidade e atenção aos detalhes, este produto oferece excelente custo-benefício para ${targetAudience || 'nossos clientes'}. 

Características principais:
• Design moderno e funcional
• Material de alta durabilidade  
• Fácil utilização
• Garantia de qualidade

${keywords && `Palavras-chave relacionadas: ${keywords}`}

Ideal para quem busca qualidade, confiabilidade e bom atendimento. Adquira já o seu!`;

      const mockSEO = `${productName} - ${category} de Qualidade | Loja Online
      
Meta Description: Compre ${productName} com o melhor preço e qualidade. ${category} premium com entrega rápida e garantia. ${keywords}`;

      setGeneratedDescription(mockDescription);
      setGeneratedSEO(mockSEO);
      
      toast({
        title: "Conteúdo gerado com sucesso!",
        description: "Descrição e SEO foram criados pela IA",
      });
    } catch (error) {
      toast({
        title: "Erro ao gerar conteúdo",
        description: "Tente novamente em alguns instantes",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copiado!",
      description: `${type} copiado para a área de transferência`,
    });
  };

  const applyGenerated = () => {
    onDescriptionGenerated(generatedDescription, generatedSEO);
    toast({
      title: "Conteúdo aplicado!",
      description: "Descrição e SEO foram aplicados ao produto",
    });
  };

  return (
    <>
      <div className="space-y-6 p-6 card-modern">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="text-accent" size={24} />
          <h3 className="text-lg font-semibold">Gerador de Descrição com IA</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="keywords">Palavras-chave (opcional)</Label>
            <Input
              id="keywords"
              placeholder="Ex: durável, moderno, econômico"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              className="input-modern"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="audience">Público-alvo (opcional)</Label>
            <Input
              id="audience"
              placeholder="Ex: jovens, profissionais, famílias"
              value={targetAudience}
              onChange={(e) => setTargetAudience(e.target.value)}
              className="input-modern"
            />
          </div>
        </div>

        <Button 
          onClick={generateContent} 
          disabled={isGenerating}
          className="btn-accent w-full"
        >
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Gerando conteúdo...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              Gerar Descrição e SEO
            </>
          )}
        </Button>

        {generatedDescription && (
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Descrição Gerada</Label>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(generatedDescription, 'Descrição')}
                  >
                    <Copy className="mr-1 h-3 w-3" />
                    Copiar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={generateContent}
                  >
                    <RefreshCw className="mr-1 h-3 w-3" />
                    Regenerar
                  </Button>
                </div>
              </div>
              <Textarea
                value={generatedDescription}
                onChange={(e) => setGeneratedDescription(e.target.value)}
                rows={8}
                className="input-modern"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>SEO Gerado</Label>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copyToClipboard(generatedSEO, 'SEO')}
                >
                  <Copy className="mr-1 h-3 w-3" />
                  Copiar
                </Button>
              </div>
              <Textarea
                value={generatedSEO}
                onChange={(e) => setGeneratedSEO(e.target.value)}
                rows={4}
                className="input-modern"
              />
            </div>

            <Button onClick={applyGenerated} className="btn-primary w-full">
              Aplicar ao Produto
            </Button>
          </div>
        )}
      </div>

      <PlanUpgradeModal 
        open={showUpgradeModal}
        onOpenChange={setShowUpgradeModal}
      />
    </>
  );
};

export default AIDescriptionGenerator;
