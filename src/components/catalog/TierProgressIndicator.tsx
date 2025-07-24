import React from "react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Gift, Target } from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { formatCurrency } from "@/lib/utils";

const TierProgressIndicator: React.FC = () => {
  const {
    items,
    currentTierLevel,
    nextTierLevel,
    nextTierSavings,
    itemsToNextTier,
    tierProgress,
  } = useCart();

  // Se não há itens ou não há progresso de níveis, não mostrar
  if (items.length === 0 || Object.keys(tierProgress).length === 0) {
    return null;
  }

  // Se já está no nível máximo, mostrar mensagem de sucesso
  if (!nextTierLevel) {
    return (
      <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-green-800">
            <Gift className="h-5 w-5" />
            Máximo desconto ativado!
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-green-700 text-sm">
            Você já está aproveitando o melhor preço disponível em todos os
            produtos!
          </p>
        </CardContent>
      </Card>
    );
  }

  // Calcular progresso geral
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const progressPercentage = Math.min(
    100,
    (totalItems / (totalItems + itemsToNextTier)) * 100
  );

  return (
    <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-blue-800">
          <TrendingUp className="h-5 w-5" />
          Nível de Preço Atual: {currentTierLevel}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progresso para próximo nível */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-blue-700">
              Progresso para nível {nextTierLevel}
            </span>
            <span className="text-blue-600 font-medium">
              {totalItems} / {totalItems + itemsToNextTier} itens
            </span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>

        {/* Economia potencial */}
        {nextTierSavings > 0 && (
          <div className="flex items-center justify-between p-3 bg-blue-100 rounded-lg">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-800">
                Economia potencial:
              </span>
            </div>
            <Badge className="bg-green-500 text-white">
              {formatCurrency(nextTierSavings)}
            </Badge>
          </div>
        )}

        {/* Itens necessários */}
        {itemsToNextTier > 0 && (
          <div className="text-center p-3 bg-yellow-50 rounded-lg border border-yellow-200">
            <p className="text-sm text-yellow-800">
              Adicione mais <strong>{itemsToNextTier} item(ns)</strong> para
              atingir o próximo nível
            </p>
          </div>
        )}

        {/* Detalhes por produto */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-blue-800">
            Progresso por produto:
          </h4>
          {items.map((item) => {
            const progress = tierProgress[item.product.id];
            if (!progress || !progress.next) return null;

            return (
              <div
                key={item.id}
                className="flex items-center justify-between text-xs"
              >
                <span className="text-blue-700 truncate max-w-32">
                  {item.product.name}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-blue-600">
                    {item.quantity} / {progress.next} itens
                  </span>
                  {progress.savings > 0 && (
                    <Badge variant="outline" className="text-xs">
                      +{formatCurrency(progress.savings)}
                    </Badge>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default TierProgressIndicator;
