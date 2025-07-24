
import React from "react";
import ProductBasicInfoForm from "./ProductBasicInfoForm";
import ImprovedProductPricingForm from "./ImprovedProductPricingForm";
import ProductImagesForm from "./ProductImagesForm";
import FluidVariationsManager from "./FluidVariationsManager";
import CompleteSEOGenerator from "./CompleteSEOGenerator";
import ProductAdvancedForm from "./ProductAdvancedForm";
import { ProductFormData } from "@/hooks/useImprovedProductFormWizard";
import { useDraftImagesContext } from "@/contexts/DraftImagesContext";

interface WizardStepContentProps {
  currentStep: number;
  formData: ProductFormData;
  updateFormData: (data: Partial<ProductFormData>) => void;
  productId?: string;
}

const WizardStepContent: React.FC<WizardStepContentProps> = ({
  currentStep,
  formData,
  updateFormData,
  productId,
}) => {
  console.log(
    "📋 WIZARD STEP CONTENT - Step:",
    currentStep,
    "ProductId:",
    productId
  );

  const { uploadAllImages } = useDraftImagesContext();

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <ProductBasicInfoForm
            name={formData.name}
            description={formData.description}
            category={formData.category}
            onNameChange={(name) => updateFormData({ name })}
            onDescriptionChange={(description) =>
              updateFormData({ description })
            }
            onCategoryChange={(category) => updateFormData({ category })}
          />
        );

      case 1:
        return (
          <ImprovedProductPricingForm
            retailPrice={formData.retail_price}
            wholesalePrice={formData.wholesale_price}
            minWholesaleQty={formData.min_wholesale_qty}
            stock={formData.stock}
            enableGradualWholesale={formData.enable_gradual_wholesale}
            priceTiers={
              formData.price_tiers?.map((tier) => ({
                id: tier.id || "",
                name: tier.tier_name,
                minQuantity: tier.min_quantity,
                price: tier.price,
                enabled: tier.is_active !== false,
              })) || []
            }
            onRetailPriceChange={(retail_price) =>
              updateFormData({ retail_price })
            }
            onWholesalePriceChange={(wholesale_price) =>
              updateFormData({ wholesale_price })
            }
            onMinWholesaleQtyChange={(min_wholesale_qty) =>
              updateFormData({ min_wholesale_qty })
            }
            onStockChange={(stock) => updateFormData({ stock })}
            onEnableGradualWholesaleChange={(enable_gradual_wholesale) =>
              updateFormData({ enable_gradual_wholesale })
            }
            onPriceTiersChange={(tiers) =>
              updateFormData({
                price_tiers: tiers.map((tier) => ({
                  id: tier.id,
                  tier_name: tier.name,
                  tier_type: "custom",
                  min_quantity: tier.minQuantity,
                  price: tier.price,
                  tier_order: 1,
                  is_active: tier.enabled,
                })),
              })
            }
          />
        );

      case 2:
        return (
          <ProductImagesForm
            productId={productId}
            onImageUploadReady={(uploadFn) => {
              console.log("📷 WIZARD - Image upload function ready");
              // A função já está disponível via context
            }}
          />
        );

      case 3:
        return (
          <FluidVariationsManager
            productId={productId}
            variations={formData.variations || []}
            onChange={(variations) => {
              console.log("🎨 Variações atualizadas:", variations.length);
              updateFormData({ variations });
            }}
            storeId={formData.store_id}
            category={formData.category}
            productName={formData.name}
            useNewWizard={true}
          />
        );

      case 4:
        return (
          <CompleteSEOGenerator
            productName={formData.name}
            category={formData.category}
            metaTitle={formData.meta_title}
            metaDescription={formData.meta_description}
            keywords={formData.keywords}
            seoSlug={formData.seo_slug}
            onMetaTitleChange={(meta_title) => updateFormData({ meta_title })}
            onMetaDescriptionChange={(meta_description) =>
              updateFormData({ meta_description })
            }
            onKeywordsChange={(keywords) => updateFormData({ keywords })}
            onSeoSlugChange={(seo_slug) => updateFormData({ seo_slug })}
          />
        );

      case 5:
        return (
          <ProductAdvancedForm
            isFeatured={formData.is_featured}
            isActive={formData.is_active}
            onIsFeaturedChange={(is_featured) =>
              updateFormData({ is_featured })
            }
            onIsActiveChange={(is_active) => updateFormData({ is_active })}
          />
        );

      default:
        return <div>Step não encontrado</div>;
    }
  };

  return <div className="space-y-6">{renderStepContent()}</div>;
};

export default WizardStepContent;
