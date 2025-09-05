import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useStorePriceModel, PriceModelType } from "@/hooks/useStorePriceModel";
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
  const { priceModel, updatePriceModel, loading } = useStorePriceModel(
    profile?.store_id
  );
  const [selectedMode, setSelectedMode] = useState<PriceModelType>(
    (priceModel?.price_model as PriceModelType) || "retail_only"
  );

  // Sincronizar estado local com dados do banco
  React.useEffect(() => {
    if (priceModel?.price_model) {
      setSelectedMode(priceModel.price_model as PriceModelType);
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
      await updatePriceModel({ price_model: mode as PriceModelType });
      setSelectedMode(mode as PriceModelType);
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

  if (loading || !priceModel) {
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
    <Card
      className={`${className} border-slate-200 bg-gradient-to-br from-slate-50 to-white shadow-sm`}
    >
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-3 text-slate-800">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Settings className="h-5 w-5 text-blue-600" />
          </div>
          Modo de Preços
        </CardTitle>
        <p className="text-sm text-slate-600 leading-relaxed">
          Configure como os preços são exibidos e calculados no catálogo
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {Object.entries(PRICE_MODEL_CONFIGS).map(([key, config]) => (
            <Button
              key={key}
              variant={selectedMode === key ? "default" : "outline"}
              className={`h-auto p-5 flex flex-col items-start gap-3 transition-all duration-200 ${
                selectedMode === key
                  ? "bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-200 border-blue-500 hover:from-blue-600 hover:to-blue-700"
                  : "hover:bg-slate-50 hover:border-slate-300 hover:shadow-md border-slate-200 bg-white"
              }`}
              onClick={() => handleModeChange(key)}
              disabled={loading}
            >
              <div className="flex items-center gap-3 w-full">
                <div
                  className={`p-2 rounded-lg ${
                    selectedMode === key ? "bg-white/20" : "bg-slate-100"
                  }`}
                >
                  {getModeIcon(key)}
                </div>
                <span className="font-semibold text-left flex-1">
                  {config.displayName}
                </span>
                {selectedMode === key && (
                  <div className="p-1 bg-white/20 rounded-full">
                    <Check className="h-4 w-4" />
                  </div>
                )}
              </div>
              <p
                className={`text-sm text-left leading-relaxed ${
                  selectedMode === key ? "text-white/90" : "text-slate-600"
                }`}
              >
                {config.description}
              </p>
              <div className="flex flex-wrap gap-2 mt-2">
                {config.features.slice(0, 2).map((feature, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className={`text-xs px-3 py-1 font-medium ${
                      selectedMode === key
                        ? "bg-white/20 text-white border-white/30"
                        : "bg-slate-100 text-slate-700 border-slate-200"
                    }`}
                  >
                    {feature}
                  </Badge>
                ))}
              </div>
            </Button>
          ))}
        </div>

        {/* Status Atual */}
        <div className="mt-6 p-5 bg-gradient-to-r from-slate-50 to-blue-50 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${getModeColor(selectedMode)}`}>
              {getModeIcon(selectedMode)}
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-slate-800">
                Modo Atual:{" "}
                <span className="text-blue-600">
                  {
                    PRICE_MODEL_CONFIGS[
                      selectedMode as keyof typeof PRICE_MODEL_CONFIGS
                    ]?.displayName
                  }
                </span>
              </p>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
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
