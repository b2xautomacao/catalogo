import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Zap, Eye } from "lucide-react";

interface ConversionToggleProps {
  isOptimized: boolean;
  onToggle: (optimized: boolean) => void;
  className?: string;
}

const ConversionToggle: React.FC<ConversionToggleProps> = ({
  isOptimized,
  onToggle,
  className = "",
}) => {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Badge variant={isOptimized ? "default" : "outline"} className="text-xs">
        {isOptimized ? "Conversão Ativa" : "Visualização Simples"}
      </Badge>
      
      <Button
        variant="outline"
        size="sm"
        onClick={() => onToggle(!isOptimized)}
        className="h-8 px-3 text-xs"
      >
        {isOptimized ? (
          <>
            <Eye className="h-3 w-3 mr-1" />
            Modo Simples
          </>
        ) : (
          <>
            <Zap className="h-3 w-3 mr-1" />
            Ativar Conversão
          </>
        )}
      </Button>
    </div>
  );
};

export default ConversionToggle;
