/**
 * Formulário Expansível de Produto
 * 
 * Div que expande no topo da lista de produtos para cadastro/edição
 * - Auto-save em cada etapa
 * - Navegação livre entre etapas
 * - Mantém contexto da lista
 */

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  X,
  Save,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  Loader2,
  AlertTriangle,
  Info,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useProductFormWizard } from "@/hooks/useProductFormWizard";
import { useAuth } from "@/hooks/useAuth";
import { DraftImagesProvider, useDraftImagesContext } from "@/contexts/DraftImagesContext";
import { ProductStepValidator } from "@/lib/validators/productStepValidator";
import { useStorePriceModel } from "@/hooks/useStorePriceModel";
import { supabase } from "@/integrations/supabase/client";

// 🔴 CORREÇÃO: Função auxiliar para evitar erro "Type instantiation is excessively deep"
const supabaseAny = supabase as any;

// Importar steps do wizard
import BasicInfoStep from "./wizard/steps/BasicInfoStep";
import ImagesStep from "./wizard/steps/ImagesStep";
import VariationsStep from "./wizard/steps/VariationsStep";
import SizeChartStep from "./wizard/steps/SizeChartStep";
import SEOStep from "./wizard/steps/SEOStep";

interface ExpandableProductFormProps {
  /** Se está visível/expandido */
  isOpen: boolean;
  /** Callback para fechar */
  onClose: () => void;
  /** ID do produto (se edição) */
  productId?: string;
  /** Callback após salvar com sucesso */
  onSaved?: (productId: string) => void;
}

interface Step {
  id: string;
  label: string;
  component: React.ComponentType<any>;
  canSkip: boolean;
}

// Função para gerar instruções de cuidado automáticas
const generateCareInstructions = (
  category?: string,
  material?: string
): Array<{ type: string; icon: string; instruction: string }> => {
  const instructions: Array<{ type: string; icon: string; instruction: string }> = [];
  const materialLower = material?.toLowerCase() || '';

  if (category === 'calcado') {
    instructions.push(
      { type: 'do', icon: 'water', instruction: 'Limpe com pano úmido e sabão neutro' },
      { type: 'do', icon: 'dry', instruction: 'Seque à sombra em local arejado' },
      { type: 'dont', icon: 'wash', instruction: 'Não lave em máquina de lavar' },
      { type: 'dont', icon: 'sun', instruction: 'Não exponha ao sol direto por longos períodos' }
    );

    if (materialLower.includes('couro') || materialLower.includes('sintético')) {
      instructions.push({ type: 'do', icon: 'protect', instruction: 'Use impermeabilizante para proteção' });
    }
  } else if (category === 'roupa_superior' || category === 'roupa_inferior') {
    instructions.push(
      { type: 'do', icon: 'wash', instruction: 'Lave com cores semelhantes' },
      { type: 'do', icon: 'water', instruction: 'Use água fria ou morna (máx. 30°C)' }
    );

    // Tecidos delicados
    if (materialLower.includes('seda') || materialLower.includes('linho') || materialLower.includes('lã')) {
      instructions.push({ type: 'warning', icon: 'wash', instruction: 'Lave no modo delicado ou à mão' });
    } else {
      instructions.push({ type: 'do', icon: 'wash', instruction: 'Pode lavar em máquina no modo normal' });
    }

    instructions.push(
      { type: 'do', icon: 'dry', instruction: 'Seque à sombra' },
      { type: 'dont', icon: 'bleach', instruction: 'Não use alvejante' }
    );

    // Passar roupa
    if (materialLower.includes('algodão') || materialLower.includes('linho')) {
      instructions.push({ type: 'do', icon: 'iron', instruction: 'Pode passar em temperatura média' });
    } else {
      instructions.push({ type: 'dont', icon: 'iron', instruction: 'Não passe em temperatura alta' });
    }
  }

  return instructions;
};

// Componente interno que carrega imagens (precisa estar dentro do Provider)
const ExpandableProductFormContent: React.FC<ExpandableProductFormProps> = ({
  isOpen,
  onClose,
  productId,
  onSaved,
}) => {
  const { loadExistingImages, uploadAllImages } = useDraftImagesContext();
  const { toast } = useToast();
  const { profile } = useAuth();
  const { priceModel } = useStorePriceModel(profile?.store_id);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isLoadingProduct, setIsLoadingProduct] = useState(false);
  const isLoading = isLoadingProduct; // Alias para compatibilidade

  // Hook do wizard
  const {
    formData,
    updateFormData,
    saveProduct,
    loadProductForEditing,
    resetForm,
  } = useProductFormWizard();
  
  // Price model da loja
  const priceModelType = priceModel?.price_model || 'retail_only';

  // Resetar formulário quando fechar (sem productId = Novo)
  useEffect(() => {
    if (!isOpen && !productId) {
      console.log("🧹 Formulário fechado - limpando dados");
      resetForm();
      setCurrentStepIndex(0);
    }
  }, [isOpen, productId, resetForm]);

  // Detectar mudança de produto em edição
  const [lastProductId, setLastProductId] = useState<string | undefined>(productId);
  
  useEffect(() => {
    if (productId !== lastProductId) {
      console.log("🔄 Mudança de produto detectada:", { de: lastProductId, para: productId });
      if (!productId) {
        // Novo produto - resetar
        resetForm();
        setCurrentStepIndex(0);
      }
      setLastProductId(productId);
    }
  }, [productId, lastProductId, resetForm]);
  
  // Definir etapas PRIMEIRO (dinâmico baseado no tipo de produto)
  const steps: Step[] = useMemo(() => {
    const baseSteps: Step[] = [
      {
        id: "basic",
        label: "Informações Básicas",
        component: BasicInfoStep,
        canSkip: false,
      },
      {
        id: "images",
        label: "Imagens e Vídeo",
        component: ImagesStep,
        canSkip: true,
      },
      {
        id: "variations",
        label: "Variações",
        component: VariationsStep,
        canSkip: true,
      },
    ];

    // Adiciona step de Tabela de Medidas SÓ se for calçado ou roupa
    const isShoeOrClothing = 
      formData.product_category_type === 'calcado' ||
      formData.product_category_type === 'roupa_superior' ||
      formData.product_category_type === 'roupa_inferior';

    if (isShoeOrClothing) {
      baseSteps.push({
        id: "sizechart",
        label: "Tabela e Cuidados",
        component: SizeChartStep,
        canSkip: true,
      });
    }

    baseSteps.push({
      id: "seo",
      label: "SEO",
      component: SEOStep,
      canSkip: true,
    });

    return baseSteps;
  }, [formData.product_category_type]);

  const currentStep = steps[currentStepIndex];
  const StepComponent = currentStep?.component;
  
  // Memoizar validação da etapa atual
  const currentStepValidation = useMemo(() => {
    if (!currentStep) {
      return { isValid: true, errors: [], warnings: [], missingFields: [] };
    }
    return ProductStepValidator.validateStep(currentStep.id, formData, priceModelType);
  }, [currentStep, formData, priceModelType]);

  // Usar diretamente os erros/avisos do useMemo (sem useState/useEffect)
  const validationErrors = currentStepValidation.errors;
  const validationWarnings = currentStepValidation.warnings;
  
  // Carregar dados do produto se estiver editando
  useEffect(() => {
    const loadProductData = async () => {
      console.log("📥 ExpandableProductForm - useEffect chamado:", {
        productId,
        isOpen,
        willLoad: !!(productId && isOpen),
      });
      
      if (!productId || !isOpen) {
        console.log("📥 Ignorando carregamento - não é edição ou form fechado");
        return;
      }
      
      console.log("📥 Carregando produto para edição:", productId);
      setIsLoadingProduct(true);
      
      try {
        // Buscar produto completo
        const { data: product, error: productError } = await supabase
          .from('products')
          .select('*')
          .eq('id', productId)
          .single();

        if (productError) throw productError;
        if (!product) throw new Error('Produto não encontrado');

        // Buscar variações
        const { data: variations, error: variationsError } = await supabase
          .from('product_variations')
          .select('*')
          .eq('product_id', productId)
          .order('display_order', { ascending: true });

        if (variationsError) console.error('Erro ao carregar variações:', variationsError);

        // Buscar imagens
        const { data: images, error: imagesError } = await supabase
          .from('product_images')
          .select('*')
          .eq('product_id', productId)
          .order('display_order', { ascending: true });

        if (imagesError) console.error('Erro ao carregar imagens:', imagesError);

        // Montar objeto produto completo
        const productData = {
          ...product,
          variations: variations || [],
          images: images || [],
        };

        console.log("✅ Produto carregado do banco:", {
          name: product.name,
          variationsCount: variations?.length || 0,
          imagesCount: images?.length || 0,
          product_gender: (product as any).product_gender,
          product_category_type: (product as any).product_category_type,
          material: (product as any).material,
          video_url: (product as any).video_url,
        });

        // Carregar no form wizard
        loadProductForEditing(productData);
        
        console.log("🔍 DEBUG - formData após loadProductForEditing:", {
          product_gender: formData.product_gender,
          product_category_type: formData.product_category_type,
          material: formData.material,
        });
        
        // Carregar imagens no DraftImagesProvider
        if (loadExistingImages) {
          console.log("📸 Carregando imagens do produto no DraftImagesProvider...");
          await loadExistingImages(productId);
        }
        
        // TODO: Buscar e carregar vídeo do produto quando a tabela product_videos for criada
        // const { data: videos } = await supabase
        //   .from('product_videos')
        //   .select('video_url, video_type, thumbnail_url')
        //   .eq('product_id', productId)
        //   .eq('is_active', true)
        //   .limit(1);

        // if (videos && videos.length > 0) {
        //   console.log("🎬 Vídeo encontrado ao editar:", videos[0]);
        //   updateFormData({
        //     video_url: videos[0].video_url,
        //     video_type: videos[0].video_type as any,
        //     video_thumbnail: videos[0].thumbnail_url || "",
        //   });
        // }
        
      } catch (error: any) {
        console.error("❌ Erro ao carregar produto:", error);
        toast({
          title: "Erro ao carregar produto",
          description: error.message || "Não foi possível carregar os dados do produto",
          variant: "destructive",
        });
      } finally {
        setIsLoadingProduct(false);
      }
    };

    loadProductData();
  }, [productId, isOpen, loadProductForEditing, loadExistingImages, toast]);

  // Auto-save desabilitado temporariamente para evitar loops
  // TODO: Reimplementar com useCallback e refs corretos
  // useEffect(() => {
  //   if (!productId || !isOpen) return;
  //   const timer = setTimeout(() => handleAutoSave(), 2000);
  //   return () => clearTimeout(timer);
  // }, [formData, productId, isOpen]);

  // Salvar manualmente
  const handleSave = async () => {
    // Validar todas as etapas obrigatórias antes de salvar
    const saveValidation = ProductStepValidator.validateForSave(formData, priceModelType);
    
    if (!saveValidation.isValid) {
      toast({
        title: "❌ Não é possível salvar",
        description: `${saveValidation.errors.length} erro(s) encontrado(s). Campos obrigatórios: ${saveValidation.missingFields.join(', ')}`,
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSaving(true);
      
      // 1. Salvar produto básico
      console.log("💾 STEP 1: Salvando produto básico...");
      const savedProduct = await saveProduct(formData);
      const savedProductId = savedProduct?.id || productId;
      
      if (!savedProductId) {
        throw new Error("ID do produto não retornado");
      }

      // 2. Salvar variações (se houver)
      if (formData.variations && formData.variations.length > 0) {
        console.log(`💾 STEP 2: Salvando ${formData.variations.length} variações...`);
        
        let savedCount = 0;
        let errorCount = 0;
        
          for (const variation of formData.variations) {
          try {
            // 🔴 CORREÇÃO: Tipar explicitamente para evitar erro "Type instantiation is excessively deep"
            const variationData: Record<string, any> = {
              product_id: savedProductId,
              color: variation.color || null,
              size: variation.size || null,
              sku: variation.sku || null,
              stock: variation.stock || 0,
              price_adjustment: variation.price_adjustment || 0,
              is_active: variation.is_active !== false,
              image_url: variation.image_url || null,
              variation_type: variation.variation_type || null,
              name: variation.name || null,
              is_grade: variation.is_grade || false,
              grade_name: variation.grade_name || null,
              grade_color: variation.grade_color || null,
              grade_quantity: variation.grade_quantity || null,
              grade_sizes: variation.grade_sizes || null,
              grade_pairs: variation.grade_pairs || null,
              display_order: variation.display_order || 0,
              flexible_grade_config: variation.flexible_grade_config || null,
              grade_sale_mode: variation.grade_sale_mode || 'full',
            };

            const isExisting = variation.id && 
              !variation.id.startsWith('new-') && 
              !variation.id.startsWith('grade-') && 
              !variation.id.startsWith('temp-') &&
              !variation.id.startsWith('color-size-');

            if (isExisting) {
              // Atualizar variação existente
              console.log(`  📝 UPDATE variação ID: ${variation.id}`);
              // 🔴 CORREÇÃO: Usar supabaseAny para evitar erro TypeScript
              const { error } = await supabaseAny
                .from('product_variations')
                .update(variationData)
                .eq('id', variation.id);
              
              if (error) {
                console.error(`❌ Erro ao atualizar variação ${variation.id}:`, error);
                errorCount++;
              } else {
                console.log(`  ✅ Variação ${variation.id} atualizada`);
                savedCount++;
              }
            } else {
              // 🔴 CORREÇÃO: Verificar TODAS as constraints possíveis antes de inserir (evitar erro 409)
              // Constraints UNIQUE:
              // 1. (product_id, color, size)
              // 2. (product_id, name)
              // 3. (product_id, grade_name, grade_color)
              let existingVariation = null;
              
              // Verificar TODAS as constraints possíveis (não apenas uma)
              const checks: Promise<any>[] = [];
              
              // Check 1: grade_name + grade_color (prioridade para grades)
              if (variationData.is_grade && variationData.grade_name && variationData.grade_color) {
                checks.push(
                  supabaseAny
                    .from('product_variations')
                    .select('id')
                    .eq('product_id', variationData.product_id)
                    .eq('grade_name', variationData.grade_name)
                    .eq('grade_color', variationData.grade_color)
                    .maybeSingle()
                );
              }
              
              // Check 2: name (pode existir junto com outros campos)
              if (variationData.name) {
                checks.push(
                  supabaseAny
                    .from('product_variations')
                    .select('id')
                    .eq('product_id', variationData.product_id)
                    .eq('name', variationData.name)
                    .maybeSingle()
                );
              }
              
              // Check 3: color + size (pode existir junto com name)
              if (variationData.color && variationData.size) {
                checks.push(
                  supabaseAny
                    .from('product_variations')
                    .select('id')
                    .eq('product_id', variationData.product_id)
                    .eq('color', variationData.color)
                    .eq('size', variationData.size)
                    .maybeSingle()
                );
              }
              
              // Executar todas as verificações
              if (checks.length > 0) {
                const results = await Promise.all(checks);
                for (const result of results) {
                  if (result.data) {
                    existingVariation = result.data;
                    break; // Encontrou uma variação existente
                  }
                }
              }
              
              if (existingVariation) {
                // Atualizar variação existente em vez de criar nova
                console.log(`  🔄 UPDATE variação existente ID: ${existingVariation.id}`);
                // 🔴 CORREÇÃO: Usar supabaseAny para evitar erro TypeScript
                const { error } = await supabaseAny
                  .from('product_variations')
                  .update(variationData)
                  .eq('id', existingVariation.id);
                
                if (error) {
                  console.error(`❌ Erro ao atualizar variação existente:`, error);
                  errorCount++;
                } else {
                  console.log(`  ✅ Variação ${existingVariation.id} atualizada`);
                  savedCount++;
                }
              } else {
                // Tentar criar nova variação
                console.log(`  ➕ INSERT nova variação:`, variation.name || variation.color);
                // 🔴 CORREÇÃO: Usar supabaseAny para evitar erro TypeScript
                const { data, error } = await supabaseAny
                  .from('product_variations')
                  .insert(variationData)
                  .select()
                  .single();
                
                if (error) {
                  // Se erro 409 (Conflict), tentar encontrar e atualizar
                  if (error.code === '23505' || error.message?.includes('duplicate') || error.message?.includes('unique')) {
                    console.log(`  ⚠️ Erro 409 detectado, tentando encontrar variação existente...`);
                    
                    // Tentar encontrar novamente verificando todas as constraints
                    let foundVariation = null;
                    
                    // Check 1: grade_name + grade_color
                    if (variationData.grade_name && variationData.grade_color) {
                      const result = await supabaseAny
                        .from('product_variations')
                        .select('id')
                        .eq('product_id', variationData.product_id)
                        .eq('grade_name', variationData.grade_name)
                        .eq('grade_color', variationData.grade_color)
                        .maybeSingle();
                      if (result.data) foundVariation = result.data;
                    }
                    
                    // Check 2: name
                    if (!foundVariation && variationData.name) {
                      const result = await supabaseAny
                        .from('product_variations')
                        .select('id')
                        .eq('product_id', variationData.product_id)
                        .eq('name', variationData.name)
                        .maybeSingle();
                      if (result.data) foundVariation = result.data;
                    }
                    
                    // Check 3: color + size
                    if (!foundVariation && variationData.color && variationData.size) {
                      const result = await supabaseAny
                        .from('product_variations')
                        .select('id')
                        .eq('product_id', variationData.product_id)
                        .eq('color', variationData.color)
                        .eq('size', variationData.size)
                        .maybeSingle();
                      if (result.data) foundVariation = result.data;
                    }
                    
                    if (foundVariation) {
                      console.log(`  🔄 UPDATE variação encontrada após erro 409 ID: ${foundVariation.id}`);
                      const { error: updateError } = await supabaseAny
                        .from('product_variations')
                        .update(variationData)
                        .eq('id', foundVariation.id);
                      
                      if (updateError) {
                        console.error(`❌ Erro ao atualizar após 409:`, updateError);
                        errorCount++;
                      } else {
                        console.log(`  ✅ Variação ${foundVariation.id} atualizada após erro 409`);
                        savedCount++;
                      }
                    } else {
                      console.error(`❌ Erro 409 mas não foi possível encontrar variação existente:`, error);
                      console.error(`❌ Detalhes:`, {
                        code: error.code,
                        message: error.message,
                        hint: error.hint,
                        details: error.details
                      });
                      errorCount++;
                    }
                  } else {
                    console.error(`❌ Erro ao inserir variação:`, error);
                    console.error(`❌ Detalhes:`, {
                      code: error.code,
                      message: error.message,
                      hint: error.hint,
                      details: error.details
                    });
                    errorCount++;
                  }
                } else {
                  console.log(`  ✅ Variação criada ID: ${data.id}`);
                  savedCount++;
                }
              }
            }
          } catch (variationError: any) {
            console.error(`❌ Erro ao processar variação:`, variationError);
            errorCount++;
          }
        }
        
        console.log(`✅ Variações processadas: ${savedCount} salvas, ${errorCount} erros`);
        
        if (errorCount > 0) {
          toast({
            title: "⚠️ Aviso",
            description: `${savedCount} variações salvas, mas ${errorCount} falharam. Verifique o console.`,
            variant: "destructive",
          });
        }
      }

      // 3. Salvar imagens (via DraftImagesProvider)
      if (uploadAllImages) {
        console.log("💾 STEP 3: Salvando imagens...");
        try {
          const uploadedImageUrls = await uploadAllImages(savedProductId);
          console.log(`✅ ${uploadedImageUrls.length} imagens salvas!`);
          
          // Atualizar image_url principal do produto se houver imagens
          if (uploadedImageUrls.length > 0) {
            await supabase
              .from('products')
              .update({ image_url: uploadedImageUrls[0] })
              .eq('id', savedProductId);
          }
        } catch (imageError) {
          console.error("⚠️ Erro ao salvar imagens:", imageError);
          // Não bloquear salvamento do produto por erro nas imagens
        }
      }

      // 🎯 FASE 2: Salvar instruções de cuidado (se for calçado ou roupa)
      const isShoeOrClothing = 
        formData.product_category_type === 'calcado' ||
        formData.product_category_type === 'roupa_superior' ||
        formData.product_category_type === 'roupa_inferior';

      // TODO: Implementar quando a tabela product_care_instructions for criada
      // if (isShoeOrClothing && savedProductId) {
      //   console.log("🧼 Salvando instruções de cuidado automáticas...");
      //   
      //   try {
      //     // Deletar instruções existentes
      //     await supabase
      //       .from('product_care_instructions')
      //       .delete()
      //       .eq('product_id', savedProductId);

      //     // Gerar instruções baseadas no tipo e material
      //     const careInstructions = generateCareInstructions(
      //       formData.product_category_type,
      //       formData.material
      //     );

      //     if (careInstructions.length > 0) {
      //       const { error: careError } = await supabase
      //         .from('product_care_instructions')
      //         .insert(
      //           careInstructions.map((instruction: any, index: number) => ({
      //             product_id: savedProductId,
      //             instruction_type: instruction.type,
      //             icon_type: instruction.icon,
      //             instruction_text: instruction.instruction,
      //             display_order: index,
      //             is_active: true,
      //           }))
      //         );

      //       if (careError) {
      //         console.error("⚠️ Erro ao salvar instruções de cuidado:", careError);
      //       } else {
      //         console.log(`✅ ${careInstructions.length} instruções de cuidado salvas`);
      //       }
      //     }
      //   } catch (careError) {
      //     console.error("⚠️ Erro ao salvar cuidados:", careError);
      //   }
      // }

      setLastSaved(new Date());
      
      toast({
        title: "✅ Produto salvo com sucesso!",
        description: productId ? "Alterações salvas" : "Produto criado",
      });

      if (onSaved && savedProductId) {
        onSaved(savedProductId);
      }

      // Se é criação, fechar após salvar
      if (!productId) {
        onClose();
      }
    } catch (error: any) {
      console.error("❌ Erro ao salvar produto:", error);
      toast({
        title: "❌ Erro ao salvar",
        description: error.message || "Tente novamente",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Navegar entre etapas
  const goToStep = (index: number) => {
    if (index >= 0 && index < steps.length) {
      // Se está avançando (não voltando), validar etapa atual
      if (index > currentStepIndex && !productId) {
        if (!currentStepValidation.isValid) {
          toast({
            title: "⚠️ Campos obrigatórios",
            description: currentStepValidation.errors[0] || "Complete os campos necessários antes de avançar",
            variant: "destructive",
          });
          return;
        }
      }
      
      setCurrentStepIndex(index);
    }
  };

  const goNext = () => {
    if (currentStepIndex < steps.length - 1) {
      // Validar antes de avançar (só em criação)
      if (!productId && !currentStepValidation.isValid) {
        toast({
          title: "⚠️ Campos obrigatórios",
          description: currentStepValidation.errors[0] || "Complete os campos necessários antes de avançar",
          variant: "destructive",
        });
        return;
      }
      
      setCurrentStepIndex(prev => prev + 1);
    }
  };

  const goPrevious = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
    }
  };

  // Indicador de salvamento
  const SavingIndicator = () => {
    if (isSaving) {
      return (
        <div className="flex items-center gap-2 text-sm text-blue-600">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Salvando...</span>
        </div>
      );
    }

    if (lastSaved && productId) {
      const minutesAgo = Math.floor((Date.now() - lastSaved.getTime()) / 60000);
      return (
        <div className="flex items-center gap-2 text-sm text-green-600">
          <CheckCircle className="w-4 h-4" />
          <span>
            Salvo {minutesAgo === 0 ? "agora" : `há ${minutesAgo} min`}
          </span>
        </div>
      );
    }

    return null;
  };

  // Verificar se pode mostrar botão Salvar
  const canShowSaveButton = productId || (formData.name && formData.name.trim() !== '');

  return (
    <>
      {isOpen && (
        <div className="mb-6 animate-in slide-in-from-top-5 duration-500 rounded-lg overflow-hidden">
          <Card className="border-l-4 border-l-blue-600 shadow-md bg-gradient-to-r from-blue-50/30 to-white">
              {/* Header */}
              <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 border-b">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-3">
                      <span className="text-xl font-bold">
                        {productId ? `✏️ Editar: ${formData.name || "Produto"}` : "➕ Cadastrar Novo Produto"}
                      </span>
                      <Badge variant="outline" className="text-sm">
                        Etapa {currentStepIndex + 1} de {steps.length}
                      </Badge>
                    </CardTitle>
                  </div>

                  <div className="flex items-center gap-4">
                    {/* Indicador de salvamento */}
                    <SavingIndicator />

                    {/* Botão fechar */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={onClose}
                      className="hover:bg-red-100"
                    >
                      <X className="w-5 h-5" />
                    </Button>
                  </div>
                </div>

                {/* Navegação por Etapas (Tabs) */}
                <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
                  {steps.map((step, index) => {
                    // Em criação, só pode acessar etapas anteriores ou próxima se atual está válida
                    const canAccessStep = productId || index <= currentStepIndex || 
                      (index === currentStepIndex + 1 && currentStepValidation.isValid);

                    return (
                      <button
                        key={step.id}
                        onClick={() => goToStep(index)}
                        disabled={!canAccessStep}
                        className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all relative ${
                          currentStepIndex === index
                            ? "bg-blue-600 text-white shadow-md"
                            : index < currentStepIndex
                            ? "bg-green-100 text-green-700 hover:bg-green-200"
                            : canAccessStep
                            ? "bg-gray-100 text-gray-600 hover:bg-gray-200"
                            : "bg-gray-50 text-gray-400 cursor-not-allowed"
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          {index < currentStepIndex && (
                            <CheckCircle className="w-4 h-4" />
                          )}
                          {index + 1}. {step.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </CardHeader>

              {/* Conteúdo da Etapa */}
              <CardContent className="p-6 max-h-[500px] overflow-y-auto bg-white">
                {/* Loading do produto */}
                {isLoadingProduct && (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-center space-y-3">
                      <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600" />
                      <p className="text-gray-600">Carregando dados do produto...</p>
                    </div>
                  </div>
                )}

                {/* Erros de validação */}
                {!isLoadingProduct && validationErrors && validationErrors.length > 0 && (
                  <Alert variant="destructive" className="mb-4">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Campos obrigatórios:</strong>
                      <ul className="list-disc list-inside mt-2">
                        {validationErrors.map((error, i) => (
                          <li key={i}>{error}</li>
                        ))}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}

                {/* Avisos de validação */}
                {!isLoadingProduct && validationWarnings && validationWarnings.length > 0 && (
                  <Alert className="mb-4">
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Recomendações:</strong>
                      <ul className="list-disc list-inside mt-2">
                        {validationWarnings.map((warning, i) => (
                          <li key={i}>{warning}</li>
                        ))}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}

                {/* Renderizar Step Component */}
                {!isLoadingProduct && currentStep && StepComponent && (
                  <div
                    key={currentStep.id}
                    className="animate-in fade-in slide-in-from-right-5 duration-200"
                  >
                    <StepComponent
                      formData={formData}
                      updateFormData={updateFormData}
                      productId={productId}
                      isEditing={!!productId}
                    />
                  </div>
                )}
              </CardContent>

              {/* Footer - Botões de Navegação */}
              <div className="border-t bg-gray-50 p-4">
                <div className="flex items-center justify-between">
                  {/* Botão Anterior */}
                  <Button
                    variant="outline"
                    onClick={goPrevious}
                    disabled={currentStepIndex === 0}
                    className="gap-2"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Anterior
                  </Button>

                  {/* Botões centrais - CONDICIONAIS */}
                  <div className="flex gap-2">
                    {/* Botão Salvar - só aparece se:
                        - É edição (productId existe) OU
                        - Já preencheu pelo menos nome do produto
                    */}
                    {canShowSaveButton && (
                      <>
                        <Button
                          onClick={handleSave}
                          disabled={isSaving || isLoading}
                          className="gap-2 bg-green-600 hover:bg-green-700"
                        >
                          {isSaving ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Save className="w-4 h-4" />
                          )}
                          Salvar {productId ? "Alterações" : "Produto"}
                        </Button>

                        {/* Botão Salvar e Fechar (só em edição) */}
                        {productId && (
                          <Button
                            onClick={async () => {
                              await handleSave();
                              onClose();
                            }}
                            disabled={isSaving || isLoading}
                            variant="outline"
                            className="gap-2"
                          >
                            Salvar e Fechar
                          </Button>
                        )}
                      </>
                    )}
                    
                    {/* Mensagem se não pode salvar ainda */}
                    {!canShowSaveButton && (
                      <div className="text-sm text-gray-500 italic">
                        Preencha o nome do produto para salvar
                      </div>
                    )}
                  </div>

                  {/* Botão Próximo */}
                  <Button
                    onClick={goNext}
                    disabled={currentStepIndex === steps.length - 1}
                    className="gap-2"
                  >
                    Próximo
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>

                {/* Dica de navegação */}
                <div className="text-center text-sm text-gray-500 mt-2">
                  💡 {productId 
                    ? "Em edição: Clique em qualquer etapa para navegar livremente. Salve manualmente suas alterações." 
                    : "Navegue entre as etapas conforme preenche os campos obrigatórios"}
                </div>
              </div>
            </Card>
          </div>
      )}
    </>
  );
};

// Wrapper component com DraftImagesProvider
const ExpandableProductForm: React.FC<ExpandableProductFormProps> = (props) => {
  return (
    <DraftImagesProvider>
      <ExpandableProductFormContent {...props} />
    </DraftImagesProvider>
  );
};

export default ExpandableProductForm;

