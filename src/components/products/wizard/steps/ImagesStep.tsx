
import React from 'react';
import { WizardFormData } from '@/hooks/useImprovedProductFormWizard';
import ImprovedProductImagesForm from '../ImprovedProductImagesForm';

interface ImagesStepProps {
  formData: WizardFormData;
  updateFormData: (updates: Partial<WizardFormData>) => void;
  productId?: string;
}

const ImagesStep: React.FC<ImagesStepProps> = ({ formData, updateFormData, productId }) => {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Imagens do Produto</h3>
      
      <ImprovedProductImagesForm
        productId={productId}
      />

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2">Dicas para Imagens</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• A primeira imagem ou a marcada como "Principal" será a capa do produto</li>
          <li>• Use imagens de alta qualidade (mínimo 800x800 pixels)</li>
          <li>• Mostre o produto de diferentes ângulos</li>
          <li>• Evite fundos muito carregados</li>
          <li>• Máximo 10 imagens por produto</li>
          <li>• Formato máximo: 5MB por imagem</li>
        </ul>
      </div>
    </div>
  );
};

export default ImagesStep;
