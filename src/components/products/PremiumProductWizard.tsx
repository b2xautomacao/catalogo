import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { usePremiumProductWizard } from "@/hooks/usePremiumProductWizard";
import { DraftImagesProvider, useDraftImagesContext } from "@/contexts/DraftImagesContext";
import { useToast } from "@/hooks/use-toast";
import { ChevronRight, ChevronLeft, Save, Sparkles, X, CheckCircle2 } from "lucide-react";

// Importando os passos
import BasicInfoStep from "./wizard/premium/BasicInfoStep";
import PricingStep from "./wizard/premium/PricingStep";
import ImagesStep from "./wizard/premium/ImagesStep";
import VariationsStep from "./wizard/premium/VariationsStep";
import SEOStep from "./wizard/premium/SEOStep";

interface PremiumProductWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (productId: string) => void;
  editingProduct?: any;
}

const PremiumWizardContent: React.FC<PremiumProductWizardProps> = ({ 
  open, 
  onOpenChange, 
  onSuccess,
  editingProduct 
}) => {
  const { 
    formData, 
    updateFormData, 
    currentStep, 
    setCurrentStep, 
    loading, 
    saveProduct, 
    resetForm,
    priceModel
  } = usePremiumProductWizard(editingProduct, (id) => {
    if (onSuccess) onSuccess(id);
    onOpenChange(false);
  });

  const { uploadAllImages, loadExistingImages, clearDraftImages } = useDraftImagesContext();
  const { toast } = useToast();

  const steps = [
    { title: "Informações", description: "Dados, Medidas e Cuidados", icon: "📌" },
    { title: "Oferta", description: "Cores, Tamanhos e Grade", icon: "🎨" },
    { title: "Precificação", description: "Varejo, Atacado e Ajustes", icon: "💰" },
    { title: "Imagens & Vídeo", description: "Identidade Visual (10f/2v)", icon: "📸" },
    { title: "Search (SEO)", description: "Busca e Meta Tags", icon: "🌐" },
  ];

  const handleNext = () => {
    // Validação simples
    if (currentStep === 0 && !formData.name) {
      toast({ title: "Ei!", description: "Dê um nome para o produto primeiro.", variant: "destructive" });
      return;
    }
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  };

  const handleSave = async () => {
    await saveProduct(editingProduct?.id, uploadAllImages);
  };

  // Resetar ao abrir ou carregar existentes
  useEffect(() => {
    if (open) {
      if (editingProduct?.id) {
        console.log("📂 PremiumWizard - Carregando imagens para edição:", editingProduct.id);
        loadExistingImages(editingProduct.id);
      } else {
        console.log("📂 PremiumWizard - Novo produto, limpando rascunhos.");
        resetForm();
        clearDraftImages();
      }
    }
  }, [open, editingProduct?.id, resetForm, loadExistingImages, clearDraftImages]);

  return (
    <DialogContent className="max-w-6xl h-[92vh] flex flex-col p-0 gap-0 overflow-hidden bg-white border-slate-200 shadow-2xl rounded-3xl !dark:bg-white">
      {/* Header Customizado */}
      <div className="p-6 bg-white border-b flex items-center justify-between">
        <div className="flex items-center gap-4">
           <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
              <Sparkles className="w-6 h-6" />
           </div>
            <div>
             <DialogTitle className="text-xl font-bold text-slate-900">
               {editingProduct ? `Editar ${editingProduct.name}` : "Novo Produto Premium"}
             </DialogTitle>
             <p className="text-xs text-slate-500 font-medium italic">
               {editingProduct ? "Aprimore os detalhes deste produto" : "Novo fluxo de cadastro de alta performance"}
             </p>
           </div>
        </div>
        
        <div className="flex items-center gap-2">
           <div className="hidden md:flex flex-col items-end mr-4">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Passo {currentStep + 1} de {steps.length}</span>
              <span className="text-sm font-bold text-slate-700">{steps[currentStep].title}</span>
           </div>
           <button 
             onClick={() => onOpenChange(false)}
             className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400"
            >
              <X className="w-6 h-6" />
           </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar de Navegação */}
        <aside className="w-64 bg-slate-50 border-r p-6 hidden lg:flex flex-col gap-8">
           <div className="space-y-6">
              {steps.map((step, idx) => (
                <div key={idx} className="relative">
                  <div className={`flex items-center gap-4 transition-all duration-300 ${idx === currentStep ? "opacity-100 scale-105" : "opacity-40"}`}>
                     <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg shadow-sm border ${
                       idx === currentStep ? "bg-white border-blue-200 text-blue-600" : "bg-slate-100 border-slate-200"
                     }`}>
                        {idx < currentStep ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : step.icon}
                     </div>
                     <div className="flex flex-col">
                        <span className="text-xs font-bold text-slate-900">{step.title}</span>
                        <span className="text-[10px] text-slate-500 font-medium">{step.description}</span>
                     </div>
                  </div>
                  {idx < steps.length - 1 && (
                    <div className="absolute left-[20px] top-[40px] w-[2px] h-[24px] bg-slate-200" />
                  )}
                </div>
              ))}
           </div>

           <div className="mt-auto p-4 bg-blue-600 rounded-2xl text-white space-y-2">
              <p className="text-xs font-bold uppercase tracking-tight opacity-80">Beta v2.0</p>
              <p className="text-[10px] leading-relaxed">Este assistente usa IA para otimizar a exibição das cores no catálogo.</p>
           </div>
        </aside>

        {/* Formulário Interativo */}
        <main className="flex-1 overflow-y-auto p-8 lg:p-12 scroll-smooth">
          <div className="max-w-3xl mx-auto h-full">
            {currentStep === 0 && <BasicInfoStep formData={formData} updateFormData={updateFormData} />}
            {currentStep === 1 && <VariationsStep formData={formData} updateFormData={updateFormData} productId={editingProduct?.id} />}
            {currentStep === 2 && <PricingStep formData={formData} updateFormData={updateFormData} priceModel={priceModel} />}
            {currentStep === 3 && <ImagesStep formData={formData} updateFormData={updateFormData} />}
            {currentStep === 4 && <SEOStep formData={formData} updateFormData={updateFormData} />}
          </div>
        </main>
      </div>

      {/* Footer Fixo */}
      <div className="p-6 bg-white border-t flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={handleBack}
          disabled={currentStep === 0}
          className="h-12 px-6 rounded-xl font-bold flex items-center gap-2"
        >
          <ChevronLeft className="w-4 h-4" />
          Voltar
        </Button>

        <div className="flex items-center gap-3">
          {currentStep < steps.length - 1 ? (
            <Button
              onClick={handleNext}
              className="h-12 px-8 rounded-xl bg-slate-900 hover:bg-black text-white font-bold flex items-center gap-2 shadow-xl shadow-slate-200"
            >
              Continuar
              <ChevronRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              onClick={handleSave}
              disabled={loading}
              className="h-12 px-8 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center gap-2 shadow-xl shadow-blue-500/20"
            >
              {loading ? "Salvando..." : "Concluir Cadastro"}
              <Save className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    </DialogContent>
  );
};

const PremiumProductWizard: React.FC<PremiumProductWizardProps> = (props) => {
  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DraftImagesProvider>
        <PremiumWizardContent {...props} />
      </DraftImagesProvider>
    </Dialog>
  );
};

export default PremiumProductWizard;
