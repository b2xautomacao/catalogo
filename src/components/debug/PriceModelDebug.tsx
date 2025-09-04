import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useStorePriceModel } from "@/hooks/useStorePriceModel";
import { useAuth } from "@/hooks/useAuth";
import { useMinimumPurchaseValidation } from "@/hooks/useMinimumPurchaseValidation";
import { useCart } from "@/hooks/useCart";

const PriceModelDebug: React.FC = () => {
  const { profile } = useAuth();
  const { priceModel, loading, error } = useStorePriceModel(profile?.store_id);
  const minimumPurchaseValidation = useMinimumPurchaseValidation();
  const { totalAmount, items } = useCart();

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Debug - Modelo de Preços</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Carregando...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Debug - Modelo de Preços</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <h4 className="font-medium">Store ID:</h4>
            <p className="text-sm text-gray-600">
              {profile?.store_id || "Não encontrado"}
            </p>
          </div>

          <div>
            <h4 className="font-medium">Erro:</h4>
            <p className="text-sm text-red-600">{error || "Nenhum"}</p>
          </div>

          <div>
            <h4 className="font-medium">Modelo de Preços:</h4>
            <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto">
              {JSON.stringify(priceModel, null, 2)}
            </pre>
          </div>

          <div>
            <h4 className="font-medium">Campos de Pedido Mínimo:</h4>
            <div className="text-sm space-y-1">
              <p>
                <strong>Habilitado:</strong>{" "}
                {priceModel?.minimum_purchase_enabled ? "Sim" : "Não"}
              </p>
              <p>
                <strong>Valor:</strong> R${" "}
                {priceModel?.minimum_purchase_amount || 0}
              </p>
              <p>
                <strong>Mensagem:</strong>{" "}
                {priceModel?.minimum_purchase_message || "Não definida"}
              </p>
            </div>
          </div>

          <div>
            <h4 className="font-medium">Validação de Pedido Mínimo:</h4>
            <div className="text-sm space-y-1">
              <p>
                <strong>Habilitado:</strong>{" "}
                {minimumPurchaseValidation.isEnabled ? "Sim" : "Não"}
              </p>
              <p>
                <strong>Modo Atacado:</strong>{" "}
                {minimumPurchaseValidation.isWholesaleMode ? "Sim" : "Não"}
              </p>
              <p>
                <strong>Valor Mínimo:</strong> R${" "}
                {minimumPurchaseValidation.minimumAmount}
              </p>
              <p>
                <strong>Valor Atual:</strong> R${" "}
                {minimumPurchaseValidation.currentAmount}
              </p>
              <p>
                <strong>Mínimo Atingido:</strong>{" "}
                {minimumPurchaseValidation.isMinimumMet ? "Sim" : "Não"}
              </p>
              <p>
                <strong>Pode Prosseguir:</strong>{" "}
                {minimumPurchaseValidation.canProceed ? "Sim" : "Não"}
              </p>
              <p>
                <strong>Total do Carrinho:</strong> R$ {totalAmount}
              </p>
              <p>
                <strong>Itens no Carrinho:</strong> {items.length}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PriceModelDebug;
