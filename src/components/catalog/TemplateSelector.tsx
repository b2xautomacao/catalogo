
import React from "react";
import { Product } from "@/types/product";
import { CatalogType } from "./CatalogExample";
import ResponsiveProductGrid from "./ResponsiveProductGrid";

export interface TemplateSelectorProps {
  selectedTemplate: 'minimal' | 'modern' | 'elegant' | 'industrial';
  onTemplateChange: (template: 'minimal' | 'modern' | 'elegant' | 'industrial') => void;
  catalogType: CatalogType;
  editorSettings: any;
}

const TemplateSelector: React.FC<TemplateSelectorProps> = ({
  selectedTemplate,
  onTemplateChange,
  catalogType,
  editorSettings
}) => {
  const sampleProduct: Product = {
    id: "sample-1",
    name: "Produto de Exemplo",
    retail_price: 49.99,
    wholesale_price: 35.99,
    min_wholesale_qty: 10,
    image_url: "/placeholder.svg?height=300&width=300",
    store_id: "sample-store",
    stock: 25,
    allow_negative_stock: false,
    category: "sample-category",
    description: "Este é um produto de exemplo para visualização do template.",
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  const templates = [
    {
      id: 'minimal',
      name: 'Minimalista',
      description: 'Design limpo e simples',
    },
    {
      id: 'modern',
      name: 'Moderno',
      description: 'Design com foco na imagem',
    },
    {
      id: 'elegant',
      name: 'Elegante',
      description: 'Design sofisticado e atraente',
    },
    {
      id: 'industrial',
      name: 'Industrial',
      description: 'Design robusto e direto',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Escolha um Template</h3>
        <p className="text-gray-600 text-sm">
          Selecione o design que melhor representa sua marca
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {templates.map((template) => (
          <div
            key={template.id}
            className={`border rounded-lg p-4 cursor-pointer transition-all ${
              selectedTemplate === template.id
                ? 'border-primary ring-2 ring-primary/20'
                : 'border-gray-200 hover:border-gray-300'
            }`}
            onClick={() => onTemplateChange(template.id as any)}
          >
            <div className="flex items-center justify-between mb-3">
              <div>
                <h4 className="font-medium">{template.name}</h4>
                <p className="text-sm text-gray-600">{template.description}</p>
              </div>
              <div className={`w-4 h-4 rounded-full border-2 ${
                selectedTemplate === template.id
                  ? 'bg-primary border-primary'
                  : 'border-gray-300'
              }`} />
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4 transform scale-75 origin-top-left">
              <ResponsiveProductGrid
                products={[sampleProduct]}
                catalogType={catalogType}
                template={template.id as any}
                editorSettings={editorSettings}
                loading={false}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TemplateSelector;
