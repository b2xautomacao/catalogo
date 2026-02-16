
import React from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { 
  ShoppingCart, 
  TrendingUp, 
  Package, 
  Info,
  AlertCircle 
} from "lucide-react";
import { useStorePriceModel } from "@/hooks/useStorePriceModel";
import { PriceModelType } from "@/types/price-models";

interface PriceModelIndicatorProps {
  storeId: string;
  className?: string;
}

const PriceModelIndicator: React.FC<PriceModelIndicatorProps> = ({
  storeId,
  className = "",
}) => {
  const { priceModel, loading } = useStorePriceModel(storeId);

  if (loading || !priceModel) return null;

  const modelKey = priceModel.price_model as PriceModelType;

  const getModelInfo = () => {
    switch (modelKey) {
      case "retail_only":
        return {
          icon: <ShoppingCart className="h-4 w-4" />,
          title: "Apenas Varejo",
          description: "Preços fixos para todos os produtos",
          color: "bg-blue-50 border-blue-200 text-blue-800",
          badgeColor: "bg-blue-500",
        };
      case "wholesale_only":
        return {
          icon: <Package className="h-4 w-4" />,
          title: "Apenas Atacado",
          description: "Vendas com quantidade mínima obrigatória",
          color: "bg-orange-50 border-orange-200 text-orange-800",
          badgeColor: "bg-orange-500",
        };
      case "simple_wholesale": {
        const byCartTotal = priceModel.simple_wholesale_by_cart_total === true;
        const cartMin = priceModel.simple_wholesale_cart_min_qty ?? 10;
        const description = byCartTotal
          ? `Atacado quando o carrinho tiver ${cartMin}+ unidades no total`
          : `Atacado a partir de ${priceModel.simple_wholesale_min_qty} unidades por produto`;
        return {
          icon: <TrendingUp className="h-4 w-4" />,
          title: "Varejo + Atacado",
          description,
          color: "bg-green-50 border-green-200 text-green-800",
          badgeColor: "bg-green-500",
        };
      }
      case "gradual_wholesale":
        return {
          icon: <TrendingUp className="h-4 w-4" />,
          title: "Atacado Gradativo",
          description: "Múltiplos níveis de desconto por quantidade",
          color: "bg-purple-50 border-purple-200 text-purple-800",
          badgeColor: "bg-purple-500",
        };
      default:
        return null;
    }
  };

  const modelInfo = getModelInfo();
  if (!modelInfo) return null;

  return (
    <Card className={`${modelInfo.color} ${className}`}>
      <CardContent className="p-3">
        <div className="flex items-center gap-2">
          <div className={`p-1 rounded ${modelInfo.badgeColor} text-white`}>
            {modelInfo.icon}
          </div>
          <div className="flex-1">
            <div className="font-medium text-sm">{modelInfo.title}</div>
            <div className="text-xs opacity-75">{modelInfo.description}</div>
          </div>
          {modelKey === "wholesale_only" && (
            <AlertCircle className="h-4 w-4 text-orange-600" />
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default PriceModelIndicator;
