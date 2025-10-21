import React from "react";
import { Badge } from "@/components/ui/badge";
import { Clock, TrendingUp, Star, Zap, AlertTriangle } from "lucide-react";

interface UrgencyBadgesProps {
  stock: number;
  isBestSeller?: boolean;
  isOnSale?: boolean;
  discountPercentage?: number;
  viewsCount?: number;
  salesCount?: number;
  isNew?: boolean;
  isLimited?: boolean;
}

const UrgencyBadges: React.FC<UrgencyBadgesProps> = ({
  stock,
  isBestSeller = false,
  isOnSale = false,
  discountPercentage = 0,
  viewsCount = 0,
  salesCount = 0,
  isNew = false,
  isLimited = false,
}) => {
  const badges = [];

  // Badge de estoque baixo
  if (stock <= 5 && stock > 0) {
    badges.push({
      text: `Apenas ${stock} restantes!`,
      variant: "destructive" as const,
      icon: AlertTriangle,
      className: "animate-pulse",
    });
  }

  // Badge de mais vendido
  if (isBestSeller) {
    badges.push({
      text: "Mais Vendido",
      variant: "default" as const,
      icon: TrendingUp,
      className: "bg-gradient-to-r from-orange-500 to-red-500 text-white",
    });
  }

  // Badge de promoção
  if (isOnSale && discountPercentage > 0) {
    badges.push({
      text: `${discountPercentage}% OFF`,
      variant: "destructive" as const,
      icon: Zap,
      className: "bg-gradient-to-r from-red-500 to-pink-500 text-white",
    });
  }

  // Badge de produto novo
  if (isNew) {
    badges.push({
      text: "Novo",
      variant: "secondary" as const,
      icon: Star,
      className: "bg-gradient-to-r from-green-500 to-emerald-500 text-white",
    });
  }

  // Badge de edição limitada
  if (isLimited) {
    badges.push({
      text: "Edição Limitada",
      variant: "outline" as const,
      icon: Clock,
      className: "border-purple-500 text-purple-600",
    });
  }

  // Badge de visualizações (se alto)
  if (viewsCount > 10) {
    badges.push({
      text: `${viewsCount} visualizando`,
      variant: "secondary" as const,
      icon: Clock,
      className: "bg-blue-100 text-blue-700",
    });
  }

  // Badge de vendas (se alto)
  if (salesCount > 50) {
    badges.push({
      text: `${salesCount}+ vendidos`,
      variant: "secondary" as const,
      icon: TrendingUp,
      className: "bg-green-100 text-green-700",
    });
  }

  if (badges.length === 0) return null;

  return (
    <div className="absolute top-2 left-2 z-10 flex flex-col gap-1">
      {badges.slice(0, 3).map((badge, index) => {
        const Icon = badge.icon;
        return (
          <Badge
            key={index}
            variant={badge.variant}
            className={`text-xs font-semibold px-2 py-1 shadow-lg ${badge.className}`}
          >
            <Icon className="h-3 w-3 mr-1" />
            {badge.text}
          </Badge>
        );
      })}
    </div>
  );
};

export default UrgencyBadges;
