
import React from "react";
import { WizardFormData } from "@/hooks/useImprovedProductFormWizard";

interface WizardStepContentProps {
  currentStep: number;
  formData: WizardFormData;
  updateFormData: (updates: Partial<WizardFormData>) => void;
  productId?: string;
}

const WizardStepContent: React.FC<WizardStepContentProps> = ({
  currentStep,
  formData,
  updateFormData,
  productId,
}) => {
  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Informações Básicas</h3>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Nome do Produto *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => updateFormData({ name: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg"
                  placeholder="Digite o nome do produto"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Descrição
                </label>
                <textarea
                  value={formData.description || ''}
                  onChange={(e) => updateFormData({ description: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg"
                  placeholder="Descreva o produto"
                  rows={4}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Categoria
                </label>
                <input
                  type="text"
                  value={formData.category || ''}
                  onChange={(e) => updateFormData({ category: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg"
                  placeholder="Categoria do produto"
                />
              </div>
            </div>
          </div>
        );

      case 1:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Preços e Estoque</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Preço de Varejo *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.retail_price}
                  onChange={(e) => updateFormData({ retail_price: parseFloat(e.target.value) || 0 })}
                  className="w-full p-3 border border-gray-300 rounded-lg"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Preço de Atacado
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.wholesale_price || ''}
                  onChange={(e) => updateFormData({ wholesale_price: parseFloat(e.target.value) || undefined })}
                  className="w-full p-3 border border-gray-300 rounded-lg"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Estoque *
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.stock}
                  onChange={(e) => updateFormData({ stock: parseInt(e.target.value) || 0 })}
                  className="w-full p-3 border border-gray-300 rounded-lg"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Quantidade Mínima Atacado
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.min_wholesale_qty || 1}
                  onChange={(e) => updateFormData({ min_wholesale_qty: parseInt(e.target.value) || 1 })}
                  className="w-full p-3 border border-gray-300 rounded-lg"
                  placeholder="1"
                />
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Imagens do Produto</h3>
            <p className="text-gray-600">
              Adicione imagens para seu produto. A primeira imagem será a principal.
            </p>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <p className="text-gray-500">Upload de imagens será implementado aqui</p>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Variações do Produto</h3>
            <p className="text-gray-600">
              Configure variações como cores, tamanhos, etc.
            </p>
            <div className="border border-gray-300 rounded-lg p-4">
              <p className="text-gray-500">Configuração de variações será implementada aqui</p>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">SEO e Meta Tags</h3>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Título SEO
                </label>
                <input
                  type="text"
                  value={formData.meta_title || ''}
                  onChange={(e) => updateFormData({ meta_title: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg"
                  placeholder="Título para mecanismos de busca"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Descrição SEO
                </label>
                <textarea
                  value={formData.meta_description || ''}
                  onChange={(e) => updateFormData({ meta_description: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg"
                  placeholder="Descrição para mecanismos de busca"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Palavras-chave
                </label>
                <input
                  type="text"
                  value={formData.keywords || ''}
                  onChange={(e) => updateFormData({ keywords: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg"
                  placeholder="palavra1, palavra2, palavra3"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Slug da URL
                </label>
                <input
                  type="text"
                  value={formData.seo_slug || ''}
                  onChange={(e) => updateFormData({ seo_slug: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg"
                  placeholder="url-amigavel-do-produto"
                />
              </div>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Revisar e Confirmar</h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium mb-2">Resumo do Produto</h4>
              <div className="space-y-2 text-sm">
                <p><strong>Nome:</strong> {formData.name}</p>
                <p><strong>Categoria:</strong> {formData.category || 'Não informada'}</p>
                <p><strong>Preço Varejo:</strong> R$ {formData.retail_price.toFixed(2)}</p>
                {formData.wholesale_price && (
                  <p><strong>Preço Atacado:</strong> R$ {formData.wholesale_price.toFixed(2)}</p>
                )}
                <p><strong>Estoque:</strong> {formData.stock} unidades</p>
              </div>
            </div>
          </div>
        );

      default:
        return <div>Step não encontrado</div>;
    }
  };

  return (
    <div className="min-h-[400px]">
      {renderStepContent()}
    </div>
  );
};

export default WizardStepContent;
