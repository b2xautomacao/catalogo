
import React from "react";
import ProductBasicInfoForm from "./ProductBasicInfoForm";
import IntelligentProductPricingForm from "./IntelligentProductPricingForm";
import ProductImagesForm from "./ProductImagesForm";
import HierarchicalVariationsManager from "../HierarchicalVariationsManager";
import IntelligentSEOForm from "./IntelligentSEOForm";
import ProductAdvancedForm from "./ProductAdvancedForm";
import { ProductFormData } from "@/hooks/useImprovedProductFormWizard";

interface WizardStepContentProps {
  currentStep: number;
  formData: ProductFormData;
  updateFormData: (data: Partial<ProductFormData>) => void;
  productId?: string;
  onImageUploadReady?: (uploadFn: (productId: string) => Promise<string[]>) => void;
}

const WizardStepContent: React.FC<WizardStepContentProps> = ({
  currentStep,
  formData,
  updateFormData,
  productId,
  onImageUploadReady,
}) => {
  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <ProductBasicInfoForm
            name={formData.name}
            description={formData.description}
            category={formData.category}
            onNameChange={(name) => updateFormData({ name })}
            onDescriptionChange={(description) => updateFormData({ description })}
            onCategoryChange={(category) => updateFormData({ category })}
          />
        );

      case 1:
        return (
          <IntelligentProductPricingForm
            retailPrice={formData.retail_price}
            wholesalePrice={formData.wholesale_price}
            minWholesaleQty={formData.min_wholesale_qty}
            stock={formData.stock}
            priceTiers={formData.price_tiers?.map(tier => ({
              id: tier.id || '',
              name: tier.tier_name,
              minQuantity: tier.min_quantity,
              price: tier.price,
              enabled: tier.is_active !== false
            })) || []}
            onRetailPriceChange={(retail_price) => updateFormData({ retail_price })}
            onWholesalePriceChange={(wholesale_price) => updateFormData({ wholesale_price })}
            onMinWholesaleQtyChange={(min_wholesale_qty) => updateFormData({ min_wholesale_qty })}
            onStockChange={(stock) => updateFormData({ stock })}
            onPriceTiersChange={(tiers) => updateFormData({ 
              price_tiers: tiers.map(tier => ({
                id: tier.id,
                tier_name: tier.name,
                tier_type: 'custom',
                min_quantity: tier.minQuantity,
                price: tier.price,
                tier_order: 1,
                is_active: tier.enabled
              }))
            })}
          />
        );

      case 2:
        return (
          <ProductImagesForm
            productId={productId}
            onImageUploadReady={onImageUploadReady}
          />
        );

      case 3:
        return (
          <HierarchicalVariationsManager
            productId={productId}
            variations={formData.variations || []}
            onChange={(variations) => updateFormData({ variations })}
          />
        );

      case 4:
        return (
          <IntelligentSEOForm
            productName={formData.name}
            category={formData.category}
            metaTitle={formData.meta_title}
            metaDescription={formData.meta_description}
            keywords={formData.keywords}
            seoSlug={formData.seo_slug}
            onMetaTitleChange={(meta_title) => updateFormData({ meta_title })}
            onMetaDescriptionChange={(meta_description) => updateFormData({ meta_description })}
            onKeywordsChange={(keywords) => updateFormData({ keywords })}
            onSeoSlugChange={(seo_slug) => updateFormData({ seo_slug })}
          />
        );

      case 5:
        return (
          <ProductAdvancedForm
            isFeatured={formData.is_featured}
            isActive={formData.is_active}
            onIsFeaturedChange={(is_featured) => updateFormData({ is_featured })}
            onIsActiveChange={(is_active) => updateFormData({ is_active })}
          />
        );

      default:
        return <div>Step não encontrado</div>;
    }
  };

  return (
    <div className="space-y-6">
      {renderStepContent()}
    </div>
  );
};

export default WizardStepContent;
