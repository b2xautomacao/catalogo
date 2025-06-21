
import React from 'react';
import { useEditorStore } from '../stores/useEditorStore';
import PreviewHeader from './preview/PreviewHeader';
import PreviewProductGrid from './preview/PreviewProductGrid';
import PreviewFooter from './preview/PreviewFooter';
import PreviewBanner from './preview/PreviewBanner';
import PreviewCategories from './preview/PreviewCategories';
import { CheckoutPreview } from './CheckoutPreview';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const EditorPreview: React.FC = () => {
  const { configuration } = useEditorStore();

  // Aplicar estilos globais
  const globalStyles = {
    '--editor-primary': configuration.global.primaryColor,
    '--editor-secondary': configuration.global.secondaryColor,
    '--editor-accent': configuration.global.accentColor,
    '--editor-bg': configuration.global.backgroundColor,
    '--editor-text': configuration.global.textColor,
    '--editor-font': configuration.global.fontFamily,
  } as React.CSSProperties;

  const renderSection = (sectionKey: string) => {
    if (!configuration.sections[sectionKey as keyof typeof configuration.sections]) {
      return null;
    }

    switch (sectionKey) {
      case 'banner':
        return <PreviewBanner key={sectionKey} />;
      case 'categories':
        return <PreviewCategories key={sectionKey} />;
      case 'featuredProducts':
        return <PreviewProductGrid key={sectionKey} />;
      case 'testimonials':
        return (
          <div key={sectionKey} className="py-12 bg-gray-50">
            <div className="container mx-auto px-4 text-center">
              <h2 className="text-2xl font-bold mb-8">Depoimentos</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-white p-6 rounded-lg shadow-sm">
                    <p className="text-gray-600 mb-4">
                      "Excelente atendimento e produtos de qualidade!"
                    </p>
                    <div className="font-semibold">Cliente {i}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      case 'newsletter':
        return (
          <div key={sectionKey} className="py-12 bg-blue-50">
            <div className="container mx-auto px-4 text-center">
              <h2 className="text-2xl font-bold mb-4">Newsletter</h2>
              <p className="text-gray-600 mb-6">
                Receba nossas ofertas especiais
              </p>
              <div className="max-w-md mx-auto flex gap-2">
                <input
                  type="email"
                  placeholder="Seu email"
                  className="flex-1 px-4 py-2 border rounded-lg"
                />
                <button className="px-6 py-2 bg-blue-600 text-white rounded-lg">
                  Assinar
                </button>
              </div>
            </div>
          </div>
        );
      case 'footer':
        return <PreviewFooter key={sectionKey} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen" style={globalStyles}>
      <style>
        {`
          .editor-preview {
            font-family: var(--editor-font, 'Inter'), sans-serif;
            color: var(--editor-text, #1E293B);
          }
          
          .editor-preview .btn-primary {
            background-color: var(--editor-primary, #0057FF);
            color: white;
            border: none;
          }
          
          .editor-preview .btn-secondary {
            background-color: var(--editor-secondary, #FF6F00);
            color: white;
            border: none;
          }
          
          .editor-preview .text-primary {
            color: var(--editor-primary, #0057FF);
          }
        `}
      </style>

      <div className="editor-preview">
        <Tabs defaultValue="catalog" className="w-full">
          <div className="sticky top-0 z-50 bg-white border-b border-gray-200">
            <TabsList className="w-full justify-start h-12 bg-transparent p-2">
              <TabsTrigger value="catalog" className="px-6">
                Catálogo
              </TabsTrigger>
              <TabsTrigger value="checkout" className="px-6">
                Checkout
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="catalog" className="mt-0">
            {/* Header sempre visível */}
            <PreviewHeader />

            {/* Seções dinâmicas baseadas na configuração */}
            {configuration.sectionOrder.map(renderSection)}
          </TabsContent>

          <TabsContent value="checkout" className="mt-0 bg-gray-50 min-h-screen py-8">
            <CheckoutPreview />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default EditorPreview;
