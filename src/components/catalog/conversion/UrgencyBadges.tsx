/**
 * UrgencyBadges - Gatilhos de Urgência e Escassez
 * Aumenta conversão criando senso de urgência
 */

import React from "react";
import { Badge } from "@/components/ui/badge";
import { 
  AlertTriangle, 
  Truck, 
  Zap, 
  Clock, 
  TrendingUp,
  Star,
  Users,
  Eye,
  CheckCircle,
} from "lucide-react";

interface UrgencyBadgesProps {
  stock?: number;
  lowStockThreshold?: number;
  hasFreeShipping?: boolean;
  isFastDelivery?: boolean;
  isNew?: boolean;
  isBestSeller?: boolean;
  isOnSale?: boolean;
  discountPercentage?: number;
  viewsLast24h?: number;
  viewsCount?: number;
  salesCount?: number;
  isLimited?: boolean;
}

const UrgencyBadges: React.FC<UrgencyBadgesProps> = ({
  stock = 0,
  lowStockThreshold = 10,
  hasFreeShipping = true,
  isFastDelivery = true,
  isNew = false,
  isBestSeller = false,
  isOnSale = false,
  discountPercentage = 0,
  viewsLast24h,
  viewsCount,
  salesCount,
  isLimited = false,
}) => {
  return (
    <div className="flex flex-wrap gap-2 mb-6">
      {/* Estoque Baixo - URGÊNCIA */}
      {stock > 0 && stock <= lowStockThreshold && (
        <Badge className="bg-red-100 text-red-700 border border-red-300 px-3 py-1 text-sm font-semibold animate-pulse">
          <AlertTriangle className="w-4 h-4 mr-1" />
          Últimas {stock} unidades!
        </Badge>
      )}

      {/* Frete Grátis - VALOR */}
      {hasFreeShipping && (
        <Badge className="bg-green-100 text-green-700 border border-green-300 px-3 py-1 text-sm font-semibold">
          <Truck className="w-4 h-4 mr-1" />
          Frete Grátis
        </Badge>
      )}

      {/* Entrega Rápida - BENEFÍCIO */}
      {isFastDelivery && (
        <Badge className="bg-blue-100 text-blue-700 border border-blue-300 px-3 py-1 text-sm font-semibold">
          <Zap className="w-4 h-4 mr-1" />
          Entrega Rápida
        </Badge>
      )}

      {/* Novidade - EXCLUSIVIDADE */}
      {isNew && (
        <Badge className="bg-purple-100 text-purple-700 border border-purple-300 px-3 py-1 text-sm font-semibold">
          <Star className="w-4 h-4 mr-1" />
          Novidade
        </Badge>
      )}

      {/* Mais Vendido - PROVA SOCIAL */}
      {isBestSeller && (
        <Badge className="bg-orange-100 text-orange-700 border border-orange-300 px-3 py-1 text-sm font-semibold">
          <TrendingUp className="w-4 h-4 mr-1" />
          Mais Vendido
        </Badge>
      )}

      {/* Vendas - PROVA SOCIAL */}
      {salesCount && salesCount > 20 && (
        <Badge className="bg-blue-600 text-white px-3 py-1 text-sm font-semibold">
          <Users className="w-4 h-4 mr-1" />
          +{salesCount} vendidos
        </Badge>
      )}

      {/* Promoção - DESCONTO */}
      {isOnSale && discountPercentage > 0 && (
        <Badge className="bg-red-500 text-white px-3 py-1 text-sm font-semibold">
          <Zap className="w-4 h-4 mr-1" />
          {discountPercentage}% OFF
        </Badge>
      )}

      {/* Edição Limitada - EXCLUSIVIDADE */}
      {isLimited && (
        <Badge className="bg-purple-500 text-white border border-purple-600 px-3 py-1 text-sm font-semibold">
          <Clock className="w-4 h-4 mr-1" />
          Edição Limitada
        </Badge>
      )}

      {/* Visualizações - PROVA SOCIAL */}
      {viewsLast24h && viewsLast24h > 10 && (
        <Badge className="bg-gray-100 text-gray-700 border border-gray-300 px-3 py-1 text-sm">
          <Eye className="w-4 h-4 mr-1" />
          {viewsLast24h} pessoas viram nas últimas 24h
        </Badge>
      )}

      {/* Visualizações alternativo */}
      {viewsCount && viewsCount > 10 && !viewsLast24h && (
        <Badge className="bg-gray-100 text-gray-700 border border-gray-300 px-3 py-1 text-sm">
          <Eye className="w-4 h-4 mr-1" />
          {viewsCount} visualizando
        </Badge>
      )}

      {/* Em Estoque - DISPONIBILIDADE */}
      {stock > lowStockThreshold && (
        <Badge className="bg-green-50 text-green-700 border border-green-200 px-3 py-1 text-sm">
          <CheckCircle className="w-4 h-4 mr-1" />
          Em Estoque
        </Badge>
      )}
    </div>
  );
};

export default UrgencyBadges;
