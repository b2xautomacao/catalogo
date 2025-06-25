
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Sparkles, Search, Globe } from 'lucide-react';
import { ProductFormData } from '@/hooks/useProductFormWizard';
import AIContentGenerator from '@/components/ai/AIContentGenerator';

interface ProductSeoFormProps {
  formData: ProductFormData;
  updateFormData: (updates: Partial<ProductFormData>) => void;
}

const ProductSeoForm: React.FC<ProductSeoFormProps> = ({
  formData,
  updateFormData
}) => {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleSeoGenerated = (seoContent: string) => {
    try {
      // Tentar parsear como JSON se vier estruturado
      const parsed = JSON.parse(seoContent);
      updateFormData({
        meta_title: parsed.title || formData.meta_title,
        meta_description: parsed.description || formData.meta_description,
        keywords: parsed.keywords || formData.keywords
      });
    } catch {
      // Se não for JSON, usar como meta_description
      updateFormData({ meta_description: seoContent });
    }
  };

  const generateSeoSlug = () => {
    if (formData.name) {
      const slug = formData.name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove acentos
        .replace(/[^a-z0-9\s-]/g, '') // Remove caracteres especiais
        .replace(/\s+/g, '-') // Substitui espaços por hífens
        .replace(/-+/g, '-') // Remove hífens duplicados
        .trim();
      
      updateFormData({ seo_slug: slug });
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
              <AIContentGenerator
                productName={formData.name}
                category={formData.category || 'produto'}
                onDescriptionGenerated={handleSeoGenerated}
                disabled={!formData.name || isGenerating}
                variant="seo"
                size="sm"
              />
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
              <Globe className="h-4 w-4 text-gray-400 shrink-0" />
              <Input
                id="seo_slug"
                value={formData.seo_slug || ''}
                onChange={(e) => updateFormData({ seo_slug: e.target.value })}
                placeholder="url-amigavel-do-produto"
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={generateSeoSlug}
                disabled={!formData.name}
              >
                Gerar
              </Button>
            </div>
            <p className="text-sm text-gray-500">
              URL amigável para o produto (clique em "Gerar" para criar automaticamente)
            </p>
          </div>

          {/* Preview do SEO */}
          {(formData.meta_title || formData.meta_description || formData.name) && (
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
                  {formData.meta_description || formData.description || 'Descrição do produto...'}
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
