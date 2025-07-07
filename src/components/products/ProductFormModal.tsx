
import React from "react";
import SimpleProductWizard from "./SimpleProductWizard";

interface ProductFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit?: (data: any) => Promise<void>;
  initialData?: any;
  mode: "create" | "edit";
}

const ProductFormModal = ({
  open,
  onOpenChange,
  onSubmit,
  initialData,
  mode,
}: ProductFormModalProps) => {
  if (!open) return null;

  const handleSuccess = (productData?: any) => {
    if (onSubmit) {
      try {
        onSubmit(productData || {});
      } catch (error) {
        console.error("❌ Erro ao atualizar lista:", error);
      }
    }

    // Aguardar um pouco antes de fechar para garantir que o refresh terminou
    setTimeout(() => {
      onOpenChange(false);
    }, 100);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <SimpleProductWizard
          onComplete={handleSuccess}
          onCancel={() => onOpenChange(false)}
        />
      </div>
    </div>
  );
};

export default ProductFormModal;
