import React from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle, Settings, X } from "lucide-react";

interface AutoSetupNotificationProps {
  isVisible: boolean;
  isSettingUp: boolean;
  isSuccess: boolean;
  onDismiss: () => void;
  storeId?: string;
}

export const AutoSetupNotification: React.FC<AutoSetupNotificationProps> = ({
  isVisible,
  isSettingUp,
  isSuccess,
  onDismiss,
  storeId,
}) => {
  if (!isVisible) return null;

  return (
    <Alert
      className={`border-l-4 ${
        isSettingUp
          ? "border-blue-500 bg-blue-50 dark:bg-blue-950"
          : isSuccess
          ? "border-green-500 bg-green-50 dark:bg-green-950"
          : "border-amber-500 bg-amber-50 dark:bg-amber-950"
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          {isSettingUp ? (
            <Loader2 className="h-5 w-5 text-blue-600 animate-spin mt-0.5" />
          ) : isSuccess ? (
            <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
          ) : (
            <Settings className="h-5 w-5 text-amber-600 mt-0.5" />
          )}

          <div className="flex-1">
            <AlertDescription
              className={`${
                isSettingUp
                  ? "text-blue-800 dark:text-blue-200"
                  : isSuccess
                  ? "text-green-800 dark:text-green-200"
                  : "text-amber-800 dark:text-amber-200"
              }`}
            >
              {isSettingUp ? (
                <>
                  <strong>Configurando modelo de preços...</strong>
                  <br />
                  Estamos configurando automaticamente o modelo de preços padrão
                  para sua loja.
                  {storeId && (
                    <span className="text-xs block mt-1 opacity-75">
                      Store ID: {storeId.slice(0, 8)}...
                    </span>
                  )}
                </>
              ) : isSuccess ? (
                <>
                  <strong>Modelo de preços configurado!</strong>
                  <br />
                  Seu modelo de preços padrão foi criado com sucesso. Você pode
                  personalizá-lo nas configurações.
                </>
              ) : (
                <>
                  <strong>Configuração necessária</strong>
                  <br />
                  Sua loja precisa de um modelo de preços para funcionar
                  corretamente.
                </>
              )}
            </AlertDescription>
          </div>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={onDismiss}
          className="h-6 w-6 p-0 hover:bg-transparent"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </Alert>
  );
};

// Componente compacto para toasts
export const AutoSetupToast: React.FC<{
  isSettingUp: boolean;
  isSuccess: boolean;
  message?: string;
}> = ({ isSettingUp, isSuccess, message }) => {
  return (
    <div className="flex items-center gap-2">
      {isSettingUp ? (
        <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
      ) : (
        <CheckCircle className="h-4 w-4 text-green-600" />
      )}
      <span className="text-sm">
        {message ||
          (isSettingUp
            ? "Configurando modelo de preços..."
            : "Modelo de preços configurado!")}
      </span>
    </div>
  );
};
