
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ProductVariation } from "@/types/product";

export interface SimpleGradeWizardProps {
  variations?: ProductVariation[];
  onVariationsChange?: (variations: ProductVariation[]) => void;
  productId?: string;
  storeId?: string;
  category?: string;
  productName?: string;
  onClose?: () => void;
  onSave?: (variations: ProductVariation[]) => void;
}

type WizardMode = "single" | "variations" | "grade";

const SimpleGradeWizard: React.FC<SimpleGradeWizardProps> = ({
  variations = [],
  onVariationsChange,
  productId,
  storeId,
  category,
  productName,
  onClose,
  onSave,
}) => {
  const [mode, setMode] = useState<WizardMode>("single");
  const [currentVariations, setCurrentVariations] = useState<ProductVariation[]>(variations);

  const handleModeChange = (newMode: WizardMode) => {
    setMode(newMode);
  };

  const handleVariationsUpdate = (newVariations: ProductVariation[]) => {
    setCurrentVariations(newVariations);
    if (onVariationsChange) {
      onVariationsChange(newVariations);
    }
  };

  const handleSave = () => {
    if (onSave) {
      onSave(currentVariations);
    }
  };

  const renderModeSelector = () => (
    <Card>
      <CardHeader>
        <CardTitle>Escolha o tipo de produto</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button
            variant={mode === "single" ? "default" : "outline"}
            onClick={() => handleModeChange("single")}
            className="h-20 flex flex-col"
          >
            <span className="font-semibold">Produto Único</span>
            <span className="text-xs">Sem variações</span>
          </Button>
          
          <Button
            variant={mode === "variations" ? "default" : "outline"}
            onClick={() => handleModeChange("variations")}
            className="h-20 flex flex-col"
          >
            <span className="font-semibold">Com Variações</span>
            <span className="text-xs">Cores, tamanhos, etc.</span>
          </Button>
          
          <Button
            variant={mode === "grade" ? "default" : "outline"}
            onClick={() => handleModeChange("grade")}
            className="h-20 flex flex-col"
          >
            <span className="font-semibold">Grade</span>
            <span className="text-xs">Kit de tamanhos</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const renderContent = () => {
    if (mode === "single") {
      return (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-gray-600">
              Produto único, sem variações de cor, tamanho ou outros atributos.
            </p>
          </CardContent>
        </Card>
      );
    }

    if (mode === "variations") {
      return (
        <Card>
          <CardHeader>
            <CardTitle>Configurar Variações</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              Configuração de variações individuais (cores, tamanhos, etc.)
            </p>
          </CardContent>
        </Card>
      );
    }

    if (mode === "grade") {
      return (
        <Card>
          <CardHeader>
            <CardTitle>Configurar Grade</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              Configuração de grade (kit de tamanhos vendidos juntos)
            </p>
          </CardContent>
        </Card>
      );
    }

    return null;
  };

  return (
    <div className="space-y-6">
      {renderModeSelector()}
      {renderContent()}
      
      <div className="flex justify-between">
        {onClose && (
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
        )}
        <Button onClick={handleSave}>
          Salvar
        </Button>
      </div>
    </div>
  );
};

export default SimpleGradeWizard;
