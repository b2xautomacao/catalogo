
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useSimpleProductWizard } from '@/hooks/useSimpleProductWizard';
import ProductImagesForm from './ProductImagesForm';
import ProductPriceTiersSection from './ProductPriceTiersSection';
import WizardStepNavigation from './WizardStepNavigation';
import WizardActionButtons from './WizardActionButtons';

export interface SimpleProductWizardProps {
  onComplete?: (product: any) => void;
  onCancel?: () => void;
}

const SimpleProductWizard: React.FC<SimpleProductWizardProps> = ({
  onComplete,
  onCancel,
}) => {
  const {
    currentStep,
    formData,
    draftImages,
    isSaving,
    canProceed,
    goToNextStep,
    goToPreviousStep,
    setFormData,
    handleImageUploadReady,
    saveProduct,
    validateCurrentStep,
  } = useSimpleProductWizard({ onComplete, onCancel });

  const steps = [
    { id: 'details', title: 'Detalhes', description: 'Informações básicas do produto' },
    { id: 'pricing', title: 'Preços', description: 'Defina os preços e níveis' },
    { id: 'images', title: 'Imagens', description: 'Adicione fotos do produto' },
  ];

  const isLastStep = currentStep === steps.length - 1;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setFormData({
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      [name]: parseFloat(value) || 0,
    });
  };

  return (
    <div className="max-w-3xl mx-auto">
      <WizardStepNavigation
        steps={steps}
        currentStep={currentStep}
        onStepClick={(stepIndex) => {
          if (stepIndex < currentStep) {
            while (currentStep > stepIndex) {
              goToPreviousStep();
            }
          } else if (stepIndex > currentStep) {
            while (currentStep < stepIndex) {
              if (validateCurrentStep()) {
                goToNextStep();
              } else {
                return;
              }
            }
          }
        }}
      />

      <div className="p-4">
        {currentStep === 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Detalhes do Produto</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div>
                <Label htmlFor="name">Nome</Label>
                <Input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                />
              </div>
              <div>
                <Label htmlFor="description">Descrição</Label>
                <Input
                  type="text"
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="category">Categoria</Label>
                  <Input
                    type="text"
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <Label htmlFor="sku">SKU</Label>
                  <Input
                    type="text"
                    id="sku"
                    name="sku"
                    value={formData.sku}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="barcode">Código de Barras</Label>
                <Input
                  type="text"
                  id="barcode"
                  name="barcode"
                  value={formData.barcode}
                  onChange={handleInputChange}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {currentStep === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>Preços e Estoque</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="retail_price">Preço de Venda</Label>
                  <Input
                    type="number"
                    id="retail_price"
                    name="retail_price"
                    value={formData.retail_price}
                    onChange={handlePriceChange}
                    step="0.01"
                  />
                </div>
                <div>
                  <Label htmlFor="wholesale_price">Preço Atacado</Label>
                  <Input
                    type="number"
                    id="wholesale_price"
                    name="wholesale_price"
                    value={formData.wholesale_price}
                    onChange={handlePriceChange}
                    step="0.01"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="min_wholesale_qty">Qtd. Mínima Atacado</Label>
                <Input
                  type="number"
                  id="min_wholesale_qty"
                  name="min_wholesale_qty"
                  value={formData.min_wholesale_qty}
                  onChange={handleInputChange}
                />
              </div>
              <div>
                <Label htmlFor="stock">Estoque</Label>
                <Input
                  type="number"
                  id="stock"
                  name="stock"
                  value={formData.stock}
                  onChange={handleInputChange}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="allow_negative_stock"
                  name="allow_negative_stock"
                  checked={formData.allow_negative_stock}
                  onCheckedChange={checked => setFormData({ allow_negative_stock: !!checked })}
                />
                <Label htmlFor="allow_negative_stock">Permitir estoque negativo</Label>
              </div>
            </CardContent>
          </Card>
        )}

        {currentStep === 2 && (
          <ProductImagesForm
            productId={undefined}
            onImageUploadReady={handleImageUploadReady}
          />
        )}
      </div>

      <WizardActionButtons
        currentStep={currentStep}
        totalSteps={steps.length}
        canProceed={canProceed}
        isSaving={isSaving}
        onPrevious={goToPreviousStep}
        onNext={goToNextStep}
        onSave={saveProduct}
        onCancel={onCancel}
        isLastStep={isLastStep}
      />
    </div>
  );
};

export default SimpleProductWizard;
