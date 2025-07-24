
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useStorePriceModel } from '@/hooks/useStorePriceModel';
import { PriceModelType } from '@/types/price-models';

export interface WizardFormData {
  // Basic product info
  name: string;
  description?: string;
  category?: string;
  retail_price: number;
  wholesale_price?: number;
  stock: number;
  min_wholesale_qty?: number;
  
  // Advanced settings
  is_featured?: boolean;
  is_active?: boolean;
  allow_negative_stock?: boolean;
  stock_alert_threshold?: number;
  
  // SEO
  meta_title?: string;
  meta_description?: string;
  keywords?: string;
  seo_slug?: string;
  
  // Price model settings
  price_model?: PriceModelType;
  simple_wholesale_enabled?: boolean;
  gradual_wholesale_enabled?: boolean;
  
  // Store reference
  store_id?: string;
}

export const useImprovedProductFormWizard = () => {
  const { profile } = useAuth();
  const { priceModel } = useStorePriceModel(profile?.store_id);
  
  const [formData, setFormData] = useState<WizardFormData>({
    name: '',
    description: '',
    category: '',
    retail_price: 0,
    wholesale_price: 0,
    stock: 0,
    min_wholesale_qty: 1,
    is_featured: false,
    is_active: true,
    allow_negative_stock: false,
    stock_alert_threshold: 5,
    store_id: profile?.store_id
  });

  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);

  // Update store_id when profile changes
  useEffect(() => {
    if (profile?.store_id) {
      setFormData(prev => ({
        ...prev,
        store_id: profile.store_id
      }));
    }
  }, [profile?.store_id]);

  // Update price model settings when model changes
  useEffect(() => {
    if (priceModel) {
      setFormData(prev => ({
        ...prev,
        price_model: priceModel.price_model,
        simple_wholesale_enabled: priceModel.simple_wholesale_enabled,
        gradual_wholesale_enabled: priceModel.gradual_wholesale_enabled
      }));
    }
  }, [priceModel]);

  const updateFormData = (updates: Partial<WizardFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const nextStep = () => {
    setCurrentStep(prev => prev + 1);
  };

  const previousStep = () => {
    setCurrentStep(prev => Math.max(0, prev - 1));
  };

  const canProceedToNext = (): boolean => {
    switch (currentStep) {
      case 0: // Basic info
        return !!(formData.name && formData.retail_price > 0);
      case 1: // Pricing
        return true;
      case 2: // Advanced
        return true;
      default:
        return true;
    }
  };

  const resetWizard = () => {
    setCurrentStep(0);
    setFormData({
      name: '',
      description: '',
      category: '',
      retail_price: 0,
      wholesale_price: 0,
      stock: 0,
      min_wholesale_qty: 1,
      is_featured: false,
      is_active: true,
      allow_negative_stock: false,
      stock_alert_threshold: 5,
      store_id: profile?.store_id
    });
  };

  // Check if current price model supports wholesale
  const supportsWholesale = (): boolean => {
    if (!priceModel) return false;
    return priceModel.price_model !== 'retail_only';
  };

  return {
    formData,
    updateFormData,
    currentStep,
    setCurrentStep,
    nextStep,
    previousStep,
    canProceedToNext,
    loading,
    setLoading,
    resetWizard,
    supportsWholesale,
    priceModel
  };
};
