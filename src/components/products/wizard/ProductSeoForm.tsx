
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Sparkles, Search, Globe } from 'lucide-react';
import { ProductFormData } from '@/hooks/useProductFormWizard';

interface ProductSeoFormProps {
  formData: ProductFormData;
  updateFormData: (updates: Partial<ProductFormData>) => void;
}

const ProductSeoForm: React.FC<ProductSeoFormProps> = ({
  formData,
  updateFormData
}) => {
  const [isGenerating, setIsGenerating] = useState(false);

  const generateSeoContent = async () => {
    if (!formData.name) return;
    
    setIsGenerating(true);
    try {
      // Aqui você pode implementar a chamada para a API de IA
      // Por enquanto, vou simular a geração
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const generatedTitle = `${formData.name} - ${formData.category || 'Produto'} de Qualidade`;
      const generatedDescription = `Compre ${formData.name} com a melhor qualidade e preço. ${formData.description ? formData.description.substring(0, 100) : 'Produto de alta qualidade'}.`;
      const generatedKeywords = `${formData.name}, ${formData.category || 'produto'}, comprar, qualidade, preço`;
      
      updateFormData({
        meta_title: generatedTitle,
        meta_description: generatedDescription,
        keywords: generatedKeywords
      });
    } catch (error) {
      console.error('Erro ao gerar conteúdo SEO:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            SEO e Metadados
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Ferramenta de IA para SEO */}
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-purple-900 flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  Gerar SEO com IA
                </h4>
                <p className="text-sm text-purple-700 mt-1">
                  Gere automaticamente título, descrição e palavras-chave otimizadas
                </p>
              </div>
              <Button
                type="button"
                onClick={generateSeoContent}
                disabled={!formData.name || isGenerating}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {isGenerating ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                ) : (
                  <Sparkles className="h-4 w-4 mr-2" />
                )}
                {isGenerating ? 'Gerando...' : 'Gerar SEO'}
              </Button>
            </div>
          </div>

          {/* Título SEO */}
          <div className="space-y-2">
            <Label htmlFor="meta_title">Título SEO</Label>
            <Input
              id="meta_title"
              value={formData.meta_title || ''}
              onChange={(e) => updateFormData({ meta_title: e.target.value })}
              placeholder="Título otimizado para buscadores (até 60 caracteres)"
              maxLength={60}
            />
            <div className="text-sm text-gray-500">
              {(formData.meta_title || '').length}/60 caracteres
            </div>
          </div>

          {/* Descrição SEO */}
          <div className="space-y-2">
            <Label htmlFor="meta_description">Descrição SEO</Label>
            <Textarea
              id="meta_description"
              value={formData.meta_description || ''}
              onChange={(e) => updateFormData({ meta_description: e.target.value })}
              placeholder="Descrição que aparecerá nos resultados de busca (até 160 caracteres)"
              rows={3}
              maxLength={160}
              className="resize-none"
            />
            <div className="text-sm text-gray-500">
              {(formData.meta_description || '').length}/160 caracteres
            </div>
          </div>

          {/* Palavras-chave */}
          <div className="space-y-2">
            <Label htmlFor="keywords">Palavras-chave</Label>
            <Input
              id="keywords"
              value={formData.keywords || ''}
              onChange={(e) => updateFormData({ keywords: e.target.value })}
              placeholder="Palavras-chave separadas por vírgula"
            />
            <p className="text-sm text-gray-500">
              Separe as palavras-chave com vírgulas (ex: produto, categoria, marca)
            </p>
          </div>

          {/* Slug SEO */}
          <div className="space-y-2">
            <Label htmlFor="seo_slug">URL Amigável (Slug)</Label>
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-gray-400" />
              <Input
                id="seo_slug"
                value={formData.seo_slug || ''}
                onChange={(e) => updateFormData({ seo_slug: e.target.value })}
                placeholder="url-amigavel-do-produto"
                className="flex-1"
              />
            </div>
            <p className="text-sm text-gray-500">
              URL amigável para o produto (será gerada automaticamente se deixar em branco)
            </p>
          </div>

          {/* Preview do SEO */}
          {(formData.meta_title || formData.meta_description) && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2">Preview do Google</h4>
              <div className="space-y-1">
                <div className="text-blue-600 text-lg hover:underline cursor-pointer">
                  {formData.meta_title || formData.name}
                </div>
                <div className="text-green-700 text-sm">
                  loja.com/produto/{formData.seo_slug || 'produto'}
                </div>
                <div className="text-gray-600 text-sm">
                  {formData.meta_description || formData.description}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ProductSeoForm;
