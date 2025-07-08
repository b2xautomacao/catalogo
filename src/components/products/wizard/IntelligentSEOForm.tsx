
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Search, Sparkles, Wand2 } from 'lucide-react';
import AIContentGenerator from '../AIContentGenerator';

interface IntelligentSEOFormProps {
  productName: string;
  category?: string;
  metaTitle?: string;
  metaDescription?: string;
  keywords?: string;
  seoSlug?: string;
  onMetaTitleChange: (title: string) => void;
  onMetaDescriptionChange: (description: string) => void;
  onKeywordsChange: (keywords: string) => void;
  onSeoSlugChange: (slug: string) => void;
}

const IntelligentSEOForm: React.FC<IntelligentSEOFormProps> = ({
  productName,
  category,
  metaTitle,
  metaDescription,
  keywords,
  seoSlug,
  onMetaTitleChange,
  onMetaDescriptionChange,
  onKeywordsChange,
  onSeoSlugChange,
}) => {
  const generateSlugFromName = () => {
    if (!productName?.trim()) return;
    
    const slug = productName
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove acentos
      .replace(/[^a-z0-9\s-]/g, '') // Remove caracteres especiais
      .replace(/\s+/g, '-') // Substitui espaços por hífens
      .replace(/-+/g, '-') // Remove hífens duplos
      .replace(/^-|-$/g, ''); // Remove hífens do início e fim
    
    onSeoSlugChange(slug);
  };

  const generateBasicKeywords = () => {
    if (!productName?.trim()) return;
    
    const words = productName.toLowerCase().split(' ');
    const categoryWords = category ? category.toLowerCase().split(' ') : [];
    const allWords = [...words, ...categoryWords];
    const uniqueWords = [...new Set(allWords)].filter(word => word.length > 2);
    
    onKeywordsChange(uniqueWords.join(', '));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="h-5 w-5" />
          SEO Inteligente
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex items-center justify-between mb-2">
            <Label htmlFor="meta_title">Título SEO</Label>
            <AIContentGenerator
              productName={productName}
              category={category}
              variant="title"
              size="sm"
              onDescriptionGenerated={() => {}} // Não usado para título
              onTitleGenerated={onMetaTitleChange}
            />
          </div>
          <Input
            id="meta_title"
            value={metaTitle || ''}
            onChange={(e) => onMetaTitleChange(e.target.value)}
            placeholder="Título otimizado para mecanismos de busca"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <Label htmlFor="meta_description">Descrição SEO</Label>
            <AIContentGenerator
              productName={productName}
              category={category}
              variant="seo"
              size="sm"
              onDescriptionGenerated={onMetaDescriptionChange}
              onTitleGenerated={onMetaTitleChange}
              onKeywordsGenerated={onKeywordsChange}
            />
          </div>
          <Textarea
            id="meta_description"
            value={metaDescription || ''}
            onChange={(e) => onMetaDescriptionChange(e.target.value)}
            placeholder="Descrição otimizada para mecanismos de busca"
            rows={3}
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <Label htmlFor="keywords">Palavras-chave</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={generateBasicKeywords}
              className="gap-2"
            >
              <Wand2 className="h-4 w-4" />
              Gerar Básicas
            </Button>
          </div>
          <Input
            id="keywords"
            value={keywords || ''}
            onChange={(e) => onKeywordsChange(e.target.value)}
            placeholder="palavra1, palavra2, palavra3"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <Label htmlFor="seo_slug">URL Amigável</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={generateSlugFromName}
              className="gap-2"
            >
              <Sparkles className="h-4 w-4" />
              Gerar do Nome
            </Button>
          </div>
          <Input
            id="seo_slug"
            value={seoSlug || ''}
            onChange={(e) => onSeoSlugChange(e.target.value)}
            placeholder="url-amigavel-do-produto"
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default IntelligentSEOForm;
