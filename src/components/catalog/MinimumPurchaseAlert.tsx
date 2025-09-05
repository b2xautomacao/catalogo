import React from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ShoppingCart, AlertCircle, CheckCircle } from "lucide-react";
import { useMinimumPurchaseValidation } from "@/hooks/useMinimumPurchaseValidation";

interface MinimumPurchaseAlertProps {
  onAddMoreItems?: () => void;
  className?: string;
}

const MinimumPurchaseAlert: React.FC<MinimumPurchaseAlertProps> = ({
  onAddMoreItems,
  className = "",
}) => {
  const validation = useMinimumPurchaseValidation();

  // Se não está habilitado ou não é modo atacado, não mostrar
  if (!validation.isEnabled || !validation.isWholesaleMode) {
    return null;
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const remainingAmount = validation.minimumAmount - validation.currentAmount;

  return (
    <Alert
      className={`${className} ${
        validation.isMinimumMet
          ? "border-green-200 bg-green-50"
          : "border-orange-200 bg-orange-50"
      }`}
    >
      <div className="flex items-start gap-3">
        {validation.isMinimumMet ? (
          <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
        ) : (
          <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5" />
        )}

        <div className="flex-1">
          <AlertDescription
            className={`${
              validation.isMinimumMet ? "text-green-800" : "text-orange-800"
            }`}
          >
            <div className="space-y-2">
              <p className="font-medium">
                {validation.isMinimumMet
                  ? "✅ Pedido mínimo atingido!"
                  : "⚠️ Pedido mínimo necessário"}
              </p>

              <p className="text-sm">{validation.formattedMessage}</p>

              <div className="flex items-center justify-between">
                <div className="text-sm">
                  <span className="font-medium">Valor atual: </span>
                  <span
                    className={
                      validation.isMinimumMet
                        ? "text-green-700"
                        : "text-orange-700"
                    }
                  >
                    {formatCurrency(validation.currentAmount)}
                  </span>
                </div>

                {!validation.isMinimumMet && (
                  <div className="text-sm">
                    <span className="font-medium">Faltam: </span>
                    <span className="text-orange-700 font-semibold">
                      {formatCurrency(remainingAmount)}
                    </span>
                  </div>
                )}
              </div>

              {!validation.isMinimumMet && onAddMoreItems && (
                <Button
                  onClick={onAddMoreItems}
                  size="sm"
                  className="mt-2 bg-orange-600 hover:bg-orange-700 text-white"
                >
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Adicionar Mais Itens
                </Button>
              )}
            </div>
          </AlertDescription>
        </div>
      </div>
    </Alert>
  );
};

export default MinimumPurchaseAlert;

