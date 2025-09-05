import React from "react";
import {
  PriceModelManager,
  usePriceModelData,
} from "@/components/PriceModelManager";
import { AutoSetupNotification } from "@/components/ui/AutoSetupNotification";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// Exemplo 1: Usando o componente PriceModelManager (recomendado)
export const PriceModelAutoSetupExample: React.FC<{ storeId: string }> = ({
  storeId,
}) => {
  return (
    <PriceModelManager storeId={storeId}>
      {/* Seu conteúdo aqui - será renderizado normalmente quando o modelo estiver configurado */}
      <Card>
        <CardHeader>
          <CardTitle>Configurações de Preços</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Seu modelo de preços está configurado e funcionando!</p>
        </CardContent>
      </Card>
    </PriceModelManager>
  );
};

// Exemplo 2: Usando apenas o hook para controle manual
export const PriceModelManualExample: React.FC<{ storeId: string }> = ({
  storeId,
}) => {
  const {
    priceModel,
    loading,
    error,
    isAutoSettingUp,
    showAutoSetupNotification,
    autoSetupSuccess,
  } = usePriceModelData(storeId);

  return (
    <div className="space-y-4">
      {/* Notificação de configuração automática */}
      {showAutoSetupNotification && (
        <AutoSetupNotification
          isVisible={showAutoSetupNotification}
          isSettingUp={isAutoSettingUp}
          isSuccess={autoSetupSuccess}
          onDismiss={() => {}}
          storeId={storeId}
        />
      )}

      {/* Conteúdo principal */}
      {loading ? (
        <div className="flex items-center justify-center p-4">
          <span>Carregando...</span>
        </div>
      ) : error ? (
        <div className="p-4 border border-red-200 bg-red-50 rounded-lg">
          <p className="text-red-800">Erro: {error}</p>
        </div>
      ) : priceModel ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Modelo de Preços
              <Badge variant="outline">Configurado</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p>
                <strong>Modelo:</strong> {priceModel.price_model}
              </p>
              <p>
                <strong>Atacado Simples:</strong>{" "}
                {priceModel.simple_wholesale_enabled
                  ? "Habilitado"
                  : "Desabilitado"}
              </p>
              <p>
                <strong>Atacado Gradativo:</strong>{" "}
                {priceModel.gradual_wholesale_enabled
                  ? "Habilitado"
                  : "Desabilitado"}
              </p>
              <p>
                <strong>Pedido Mínimo:</strong>{" "}
                {priceModel.minimum_purchase_enabled
                  ? `R$ ${priceModel.minimum_purchase_amount}`
                  : "Desabilitado"}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
};

// Exemplo 3: Integração com página de dashboard
export const DashboardWithPriceModel: React.FC<{ storeId: string }> = ({
  storeId,
}) => {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      {/* O PriceModelManager cuida automaticamente da configuração */}
      <PriceModelManager storeId={storeId}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Produtos</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Lista de produtos com preços configurados</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Vendas</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Relatórios de vendas</p>
            </CardContent>
          </Card>
        </div>
      </PriceModelManager>
    </div>
  );
};
