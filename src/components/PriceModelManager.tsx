import React from "react";
import { useStorePriceModelWithWarning } from "@/hooks/useStorePriceModelWithWarning";
import { AutoSetupNotification } from "@/components/ui/AutoSetupNotification";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw } from "lucide-react";

interface PriceModelManagerProps {
  storeId: string | undefined;
  onSetupClick?: () => void;
  compact?: boolean;
  showRefresh?: boolean;
  children?: React.ReactNode;
}

export const PriceModelManager: React.FC<PriceModelManagerProps> = ({
  storeId,
  onSetupClick,
  compact = false,
  showRefresh = true,
  children,
}) => {
  const {
    priceModel,
    loading,
    error,
    isAutoSettingUp,
    showAutoSetupNotification,
    autoSetupSuccess,
    fetchPriceModel,
    createDefaultPriceModel,
    dismissNotification,
    handleSetupClick,
  } = useStorePriceModelWithWarning(storeId);

  const handleSetup = () => {
    if (onSetupClick) {
      onSetupClick();
    } else {
      handleSetupClick();
    }
  };

  const handleCreateDefault = async () => {
    await createDefaultPriceModel();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="h-4 w-4 animate-spin mr-2" />
        <span>Carregando configurações de preço...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="p-4 border border-red-200 bg-red-50 rounded-lg">
          <h3 className="text-red-800 font-medium">
            Erro ao carregar configurações
          </h3>
          <p className="text-red-600 text-sm mt-1">{error}</p>
          {showRefresh && (
            <Button
              variant="outline"
              size="sm"
              onClick={fetchPriceModel}
              className="mt-2"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Tentar novamente
            </Button>
          )}
        </div>
        {children}
      </div>
    );
  }

  // Mostrar notificação de configuração automática
  if (showAutoSetupNotification) {
    return (
      <div className="space-y-4">
        <AutoSetupNotification
          isVisible={showAutoSetupNotification}
          isSettingUp={isAutoSettingUp}
          isSuccess={autoSetupSuccess}
          onDismiss={dismissNotification}
          storeId={storeId}
        />
        {children}
      </div>
    );
  }

  // Se tem modelo de preços, renderizar children normalmente
  return <div className="space-y-4">{children}</div>;
};

// Hook simplificado que retorna apenas os dados essenciais
export const usePriceModelData = (storeId: string | undefined) => {
  const {
    priceModel,
    loading,
    error,
    isAutoSettingUp,
    showAutoSetupNotification,
    autoSetupSuccess,
  } = useStorePriceModelWithWarning(storeId);

  return {
    priceModel,
    loading,
    error,
    isAutoSettingUp,
    showAutoSetupNotification,
    autoSetupSuccess,
    hasPriceModel: !!priceModel,
  };
};
