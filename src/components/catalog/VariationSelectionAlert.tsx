
import React from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info, Package, Palette, Shirt } from "lucide-react";

interface VariationSelectionAlertProps {
  type: "select" | "none";
  variationCount?: number;
  hasGrades?: boolean;
  hasColors?: boolean;
  hasSizes?: boolean;
}

const VariationSelectionAlert: React.FC<VariationSelectionAlertProps> = ({
  type,
  variationCount = 0,
  hasGrades = false,
  hasColors = false,
  hasSizes = false,
}) => {
  if (type === "none") {
    return (
      <Alert className="border-gray-200 bg-gray-50">
        <Package className="h-4 w-4" />
        <AlertDescription>
          Este produto não possui variações disponíveis.
        </AlertDescription>
      </Alert>
    );
  }

  const getVariationTypes = () => {
    const types = [];
    if (hasGrades) types.push("grades");
    if (hasColors) types.push("cores");
    if (hasSizes) types.push("tamanhos");
    return types;
  };

  const variationTypes = getVariationTypes();
  
  return (
    <Alert className="border-blue-200 bg-blue-50">
      <Info className="h-4 w-4" />
      <AlertDescription className="flex items-center gap-2">
        <span>
          Selecione uma das {variationCount} opções disponíveis
        </span>
        {variationTypes.length > 0 && (
          <div className="flex items-center gap-1 text-xs">
            <span>({variationTypes.join(", ")})</span>
            <div className="flex gap-1">
              {hasColors && <Palette className="h-3 w-3" />}
              {hasSizes && <Shirt className="h-3 w-3" />}
              {hasGrades && <Package className="h-3 w-3" />}
            </div>
          </div>
        )}
      </AlertDescription>
    </Alert>
  );
};

export default VariationSelectionAlert;
