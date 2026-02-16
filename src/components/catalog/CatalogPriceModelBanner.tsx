
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ShoppingCart, 
  TrendingUp, 
  Package, 
  Info,
  AlertTriangle,
  Layers
} from "lucide-react";
import { useStorePriceModel } from "@/hooks/useStorePriceModel";
import { PriceModelType } from "@/types/price-models";

interface CatalogPriceModelBannerProps {
  storeId: string;
  className?: string;
}

const CatalogPriceModelBanner: React.FC<CatalogPriceModelBannerProps> = ({
  storeId,
  className = "",
}) => {
  const { priceModel, loading } = useStorePriceModel(storeId);

  if (loading || !priceModel) return null;

  const modelKey = priceModel.price_model as PriceModelType;

  // Não mostrar banner para retail_only (comportamento padrão)
  if (modelKey === "retail_only") return null;

  const getBannerContent = () => {
    switch (modelKey) {
      case "wholesale_only":
        return {
          icon: <Package className="h-5 w-5" />,
          title: "Loja de Atacado",
          description: `Vendas apenas no atacado com quantidade mínima de ${priceModel.simple_wholesale_min_qty} unidades por produto.`,
          bgColor: "bg-gradient-to-r from-orange-50 to-orange-100",
          borderColor: "border-orange-200",
          textColor: "text-orange-800",
          badgeColor: "bg-orange-500 text-white",
          badge: "Atacado Exclusivo"
        };
      case "simple_wholesale": {
        const byCartTotal = priceModel.simple_wholesale_by_cart_total === true;
        const cartMin = priceModel.simple_wholesale_cart_min_qty ?? 10;
        const description = byCartTotal
          ? `Atacado quando o carrinho tiver ${cartMin}+ unidades no total.`
          : `Preços especiais de atacado para compras a partir de ${priceModel.simple_wholesale_min_qty} unidades por produto.`;
        return {
          icon: <TrendingUp className="h-5 w-5" />,
          title: "Varejo e Atacado",
          description,
          bgColor: "bg-gradient-to-r from-green-50 to-green-100",
          borderColor: "border-green-200",
          textColor: "text-green-800",
          badgeColor: "bg-green-500 text-white",
          badge: "Atacado Disponível"
        };
      }
      case "gradual_wholesale":
        return {
          icon: <Layers className="h-5 w-5" />,
          title: "Atacado Gradativo",
          description: "Quanto mais você compra, maior o desconto! Descontos progressivos baseados na quantidade.",
          bgColor: "bg-gradient-to-r from-purple-50 to-purple-100",
          borderColor: "border-purple-200",
          textColor: "text-purple-800",
          badgeColor: "bg-purple-500 text-white",
          badge: "Múltiplos Níveis"
        };
      default:
        return null;
    }
  };

  const content = getBannerContent();
  if (!content) return null;

  return (
    <Card className={`${content.bgColor} ${content.borderColor} border-2 ${className}`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <div className={`p-2 rounded-lg ${content.badgeColor}`}>
            {content.icon}
          </div>
          
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-3">
              <h3 className={`font-semibold text-lg ${content.textColor}`}>
                {content.title}
              </h3>
              <Badge className={content.badgeColor}>
                {content.badge}
              </Badge>
            </div>
            
            <p className={`text-sm ${content.textColor} opacity-90`}>
              {content.description}
            </p>

            {/* Informações adicionais específicas do modelo */}
            {modelKey === "wholesale_only" && (
              <div className="flex items-center gap-2 mt-3 p-2 bg-orange-100 rounded-lg border border-orange-200">
                <AlertTriangle className="h-4 w-4 text-orange-600" />
                <span className="text-sm text-orange-700 font-medium">
                  Atenção: Todos os produtos têm quantidade mínima obrigatória
                </span>
              </div>
            )}

            {modelKey === "gradual_wholesale" && (
              <div className="flex items-center gap-2 mt-3 p-2 bg-purple-100 rounded-lg border border-purple-200">
                <Info className="h-4 w-4 text-purple-600" />
                <span className="text-sm text-purple-700 font-medium">
                  Os preços são calculados automaticamente baseados na quantidade no carrinho
                </span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CatalogPriceModelBanner;
