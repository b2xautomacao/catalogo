import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useStorePriceModel } from "@/hooks/useStorePriceModel";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import {
  ShoppingCart,
  Package,
  TrendingUp,
  Settings,
  Check,
} from "lucide-react";
import { PRICE_MODEL_CONFIGS } from "@/types/price-models";

interface PricingModeSelectorProps {
  onModeChange?: (mode: string) => void;
  className?: string;
}

const PricingModeSelector: React.FC<PricingModeSelectorProps> = ({
  onModeChange,
  className = "",
}) => {
  const { toast } = useToast();
  const { profile } = useAuth();
  const { priceModel, updatePriceModel, isLoading } = useStorePriceModel(
    profile?.store_id
  );
  const [selectedMode, setSelectedMode] = useState(
    priceModel?.price_model || "retail_only"
  );

  // Sincronizar estado local com dados do banco
  React.useEffect(() => {
    if (priceModel?.price_model) {
      setSelectedMode(priceModel.price_model);
    }
  }, [priceModel?.price_model]);

  const handleModeChange = async (mode: string) => {
    if (!profile?.store_id) {
      toast({
        title: "Erro",
        description: "Loja não encontrada",
        variant: "destructive",
      });
      return;
    }

    try {
      await updatePriceModel({ price_model: mode });
      setSelectedMode(mode);
      onModeChange?.(mode);

      toast({
        title: "Modo atualizado!",
        description: `Modo de preços alterado para ${
          PRICE_MODEL_CONFIGS[mode as keyof typeof PRICE_MODEL_CONFIGS]
            ?.displayName
        }`,
      });
    } catch (error) {
      console.error("Erro ao alterar modo:", error);
      toast({
        title: "Erro",
        description: "Não foi possível alterar o modo de preços",
        variant: "destructive",
      });
    }
  };

  const getModeIcon = (mode: string) => {
    switch (mode) {
      case "retail_only":
        return <ShoppingCart className="h-4 w-4" />;
      case "simple_wholesale":
        return <Package className="h-4 w-4" />;
      case "wholesale_only":
        return <Package className="h-4 w-4" />;
      case "gradual_wholesale":
        return <TrendingUp className="h-4 w-4" />;
      default:
        return <Settings className="h-4 w-4" />;
    }
  };

  const getModeColor = (mode: string) => {
    switch (mode) {
      case "retail_only":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "simple_wholesale":
        return "bg-green-50 text-green-700 border-green-200";
      case "wholesale_only":
        return "bg-orange-50 text-orange-700 border-orange-200";
      case "gradual_wholesale":
        return "bg-purple-50 text-purple-700 border-purple-200";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  if (isLoading || !priceModel) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="grid grid-cols-2 gap-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-16 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Modo de Preços
        </CardTitle>
        <p className="text-sm text-gray-600">
          Configure como os preços são exibidos e calculados no catálogo
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {Object.entries(PRICE_MODEL_CONFIGS).map(([key, config]) => (
            <Button
              key={key}
              variant={selectedMode === key ? "default" : "outline"}
              className={`h-auto p-4 flex flex-col items-start gap-2 ${
                selectedMode === key
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-gray-50"
              }`}
              onClick={() => handleModeChange(key)}
              disabled={isLoading}
            >
              <div className="flex items-center gap-2 w-full">
                {getModeIcon(key)}
                <span className="font-medium">{config.displayName}</span>
                {selectedMode === key && <Check className="h-4 w-4 ml-auto" />}
              </div>
              <p className="text-xs text-left opacity-80">
                {config.description}
              </p>
              <div className="flex flex-wrap gap-1 mt-1">
                {config.features.slice(0, 2).map((feature, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="text-xs px-2 py-0.5"
                  >
                    {feature}
                  </Badge>
                ))}
              </div>
            </Button>
          ))}
        </div>

        {/* Status Atual */}
        <div className="mt-4 p-3 bg-gray-50 rounded-md">
          <div className="flex items-center gap-2">
            <div className={`p-1 rounded ${getModeColor(selectedMode)}`}>
              {getModeIcon(selectedMode)}
            </div>
            <div>
              <p className="text-sm font-medium">
                Modo Atual:{" "}
                {
                  PRICE_MODEL_CONFIGS[
                    selectedMode as keyof typeof PRICE_MODEL_CONFIGS
                  ]?.displayName
                }
              </p>
              <p className="text-xs text-gray-600">
                {
                  PRICE_MODEL_CONFIGS[
                    selectedMode as keyof typeof PRICE_MODEL_CONFIGS
                  ]?.description
                }
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PricingModeSelector;
