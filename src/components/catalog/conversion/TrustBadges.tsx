import React from "react";
import { Shield, Lock, Truck, RotateCcw, Award, CheckCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface TrustBadgesProps {
  showSecurity?: boolean;
  showGuarantee?: boolean;
  showShipping?: boolean;
  showReturns?: boolean;
  showAwards?: boolean;
  compact?: boolean;
}

const TrustBadges: React.FC<TrustBadgesProps> = ({
  showSecurity = true,
  showGuarantee = true,
  showShipping = true,
  showReturns = true,
  showAwards = false,
  compact = false,
}) => {
  const badges = [];

  if (showSecurity) {
    badges.push({
      icon: Lock,
      text: "Compra 100% Segura",
      description: "SSL e dados protegidos",
      color: "text-green-600",
      bgColor: "bg-green-50",
    });
  }

  if (showGuarantee) {
    badges.push({
      icon: Shield,
      text: "Garantia Estendida",
      description: "Até 12 meses",
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    });
  }

  if (showShipping) {
    badges.push({
      icon: Truck,
      text: "Entrega Rápida",
      description: "2-5 dias úteis",
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    });
  }

  if (showReturns) {
    badges.push({
      icon: RotateCcw,
      text: "Troca Fácil",
      description: "30 dias para trocar",
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    });
  }

  if (showAwards) {
    badges.push({
      icon: Award,
      text: "Loja Certificada",
      description: "5 anos no mercado",
      color: "text-yellow-600",
      bgColor: "bg-yellow-50",
    });
  }

  if (badges.length === 0) return null;

  return (
    <div className={`space-y-2 ${compact ? "space-y-1" : ""}`}>
      {badges.map((badge, index) => {
        const Icon = badge.icon;
        return (
          <div
            key={index}
            className={`flex items-center gap-2 p-2 rounded-lg ${badge.bgColor} ${
              compact ? "p-1" : ""
            }`}
          >
            <Icon className={`h-4 w-4 ${badge.color} ${compact ? "h-3 w-3" : ""}`} />
            <div className="flex-1">
              <div className={`font-medium ${badge.color} ${compact ? "text-xs" : "text-sm"}`}>
                {badge.text}
              </div>
              {!compact && (
                <div className="text-xs text-gray-500">{badge.description}</div>
              )}
            </div>
            <CheckCircle className={`h-4 w-4 ${badge.color} ${compact ? "h-3 w-3" : ""}`} />
          </div>
        );
      })}
    </div>
  );
};

export default TrustBadges;
