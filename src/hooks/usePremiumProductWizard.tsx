import { useState, useCallback, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useStorePriceModel } from "@/hooks/useStorePriceModel";
import { useProductVariations } from "@/hooks/useProductVariations";
import { ProductVariation } from "@/types/product";
import { resolveColorHex } from "@/lib/colors";

export interface PremiumWizardFormData {
  name: string;
  description: string;
  category: string;
  retail_price: number;
  wholesale_price: number;
  stock: number;
  min_wholesale_qty: number;
  is_featured: boolean;
  is_active: boolean;
  allow_negative_stock: boolean;
  stock_alert_threshold: number;
  store_id: string;
  variations: ProductVariation[];
  // Novos campos Premium
  product_gender?: 'masculino' | 'feminino' | 'unissex' | 'infantil';
  product_category_type?: 'calcado' | 'roupa_superior' | 'roupa_inferior' | 'acessorio';
  material?: string;
  video_url?: string;
  video_type?: 'youtube' | 'vimeo' | 'upload';
  seo_slug?: string;
  meta_title?: string;
  meta_description?: string;
  keywords?: string;
  measurements?: string;
  care_instructions?: string;
}

export const usePremiumProductWizard = (
  editingProduct?: any,
  onSuccess?: (productId: string) => void
) => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const { saveVariations } = useProductVariations();
  const { priceModel } = useStorePriceModel(profile?.store_id);

  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<PremiumWizardFormData>({
    name: "",
    description: "",
    category: "",
    retail_price: 0,
    wholesale_price: 0,
    stock: 0,
    min_wholesale_qty: 1,
    is_featured: false,
    is_active: true,
    allow_negative_stock: false,
    stock_alert_threshold: 5,
    store_id: profile?.store_id || "",
    variations: [],
    material: "",
    video_url: "",
    video_type: "youtube",
    seo_slug: "",
    meta_title: "",
    meta_description: "",
    keywords: "",
    measurements: "",
    care_instructions: "",
  });

  const updateFormData = useCallback((updates: Partial<PremiumWizardFormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  }, []);

  const resetForm = useCallback(() => {
    setFormData({
      name: "",
      description: "",
      category: "",
      retail_price: 0,
      wholesale_price: 0,
      stock: 0,
      min_wholesale_qty: 1,
      is_featured: false,
      is_active: true,
      allow_negative_stock: false,
      stock_alert_threshold: 5,
      store_id: profile?.store_id || "",
      variations: [],
      material: "",
      video_url: "",
      video_type: "youtube",
      seo_slug: "",
      meta_title: "",
      meta_description: "",
      keywords: "",
      measurements: "",
      care_instructions: "",
    });
    setCurrentStep(0);
  }, [profile?.store_id]);

  // Efeito para carregar dados ao editar
  useEffect(() => {
    if (editingProduct) {
      console.log("📝 usePremiumProductWizard - Populando formulário para edição:", editingProduct.name);
      setFormData({
        name: editingProduct.name || "",
        description: editingProduct.description || "",
        category: editingProduct.category || "",
        retail_price: editingProduct.retail_price || 0,
        wholesale_price: editingProduct.wholesale_price || 0,
        stock: editingProduct.stock || 0,
        min_wholesale_qty: editingProduct.min_wholesale_qty || 1,
        is_featured: !!editingProduct.is_featured,
        is_active: editingProduct.is_active !== false,
        allow_negative_stock: !!editingProduct.allow_negative_stock,
        stock_alert_threshold: editingProduct.stock_alert_threshold || 5,
        store_id: editingProduct.store_id || profile?.store_id || "",
        variations: editingProduct.variations || [],
        material: editingProduct.material || "",
        video_url: editingProduct.video_url || "",
        video_type: editingProduct.video_type || "youtube",
        product_gender: editingProduct.product_gender,
        product_category_type: editingProduct.product_category_type,
        seo_slug: editingProduct.seo_slug || "",
        meta_title: editingProduct.meta_title || "",
        meta_description: editingProduct.meta_description || "",
        keywords: editingProduct.keywords || "",
        measurements: editingProduct.measurements || "",
        care_instructions: editingProduct.care_instructions || "",
      });
    }
  }, [editingProduct, profile?.store_id]);

  const saveProduct = async (
    editingProductId?: string,
    uploadAllImages?: (productId: string) => Promise<string[]>
  ) => {
    setLoading(true);
    try {
      const productData = {
        name: formData.name,
        description: formData.description,
        category: formData.category,
        retail_price: formData.retail_price,
        wholesale_price: formData.wholesale_price,
        stock: formData.stock,
        min_wholesale_qty: formData.min_wholesale_qty,
        is_featured: formData.is_featured,
        is_active: formData.is_active,
        allow_negative_stock: formData.allow_negative_stock,
        stock_alert_threshold: formData.stock_alert_threshold,
        store_id: formData.store_id || profile?.store_id,
        material: formData.material,
        video_url: formData.video_url,
        video_type: formData.video_type,
        product_gender: formData.product_gender,
        product_category_type: formData.product_category_type,
        seo_slug: formData.seo_slug,
        meta_title: formData.meta_title,
        meta_description: formData.meta_description,
        keywords: formData.keywords,
        measurements: formData.measurements,
        care_instructions: formData.care_instructions,
      };

      let productId = editingProductId;

      if (editingProductId) {
        const { error: updateError } = await supabase
          .from("products")
          .update(productData)
          .eq("id", editingProductId);
        if (updateError) throw updateError;
      } else {
        const { data: newProduct, error: createError } = await supabase
          .from("products")
          .insert(productData)
          .select()
          .single();
        if (createError) throw createError;
        productId = newProduct.id;
      }

      // Upload de imagens
      if (uploadAllImages && productId) {
        await uploadAllImages(productId);
      }

      // Salvar variações com foco no hex_color correto
      if (formData.variations.length > 0 && productId) {
        const processedVariations = formData.variations.map(v => ({
          ...v,
          product_id: productId,
          hex_color: v.hex_color || resolveColorHex(v.color)
        }));
        await saveVariations(productId, processedVariations);
      }

      toast({
        title: "Sucesso!",
        description: "Produto salvo com perfeição.",
      });

      if (onSuccess && productId) {
        onSuccess(productId);
      }

      return productId;
    } catch (error: any) {
      console.error("Erro ao salvar produto no Premium Wizard:", error);
      toast({
        title: "Erro ao salvar",
        description: error.message || "Ocorreu um problema ao salvar o produto.",
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    formData,
    updateFormData,
    currentStep,
    setCurrentStep,
    loading,
    saveProduct,
    resetForm,
    priceModel,
  };
};
