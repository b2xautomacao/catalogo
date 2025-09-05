import React from 'react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Settings, 
  AlertTriangle, 
  ShoppingCart, 
  DollarSign,
  ArrowRight,
  CheckCircle
} from "lucide-react";

interface PriceModelSetupWarningProps {
  storeId: string;
  onSetupClick: () => void;
  onDismiss?: () => void;
  showDismiss?: boolean;
}

export const PriceModelSetupWarning: React.FC<PriceModelSetupWarningProps> = ({
  storeId,
  onSetupClick,
  onDismiss,
  showDismiss = true
}) => {
  return (
    <Card className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          <CardTitle className="text-amber-800 dark:text-amber-200">
            Configuração de Preços Necessária
          </CardTitle>
        </div>
        <CardDescription className="text-amber-700 dark:text-amber-300">
          Sua loja ainda não possui um modelo de preços configurado. Configure agora para começar a vender!
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Status atual */}
        <div className="flex items-center gap-2 text-sm text-amber-700 dark:text-amber-300">
          <Badge variant="outline" className="border-amber-300 text-amber-700">
            Store ID: {storeId.slice(0, 8)}...
          </Badge>
          <span>•</span>
          <span>Modelo de preços: Não configurado</span>
        </div>

        {/* Benefícios da configuração */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-amber-800 dark:text-amber-200">
            O que você pode configurar:
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-amber-700 dark:text-amber-300">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span>Preços de varejo</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span>Descontos por quantidade</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span>Níveis de atacado</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span>Pedido mínimo</span>
            </div>
          </div>
        </div>

        {/* Ações */}
        <div className="flex flex-col sm:flex-row gap-2">
          <Button 
            onClick={onSetupClick}
            className="bg-amber-600 hover:bg-amber-700 text-white"
          >
            <Settings className="h-4 w-4 mr-2" />
            Configurar Modelo de Preços
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
          
          {showDismiss && onDismiss && (
            <Button 
              variant="outline" 
              onClick={onDismiss}
              className="border-amber-300 text-amber-700 hover:bg-amber-100"
            >
              Configurar depois
            </Button>
          )}
        </div>

        {/* Informação adicional */}
        <Alert className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
          <DollarSign className="h-4 w-4 text-blue-600" />
          <AlertTitle className="text-blue-800 dark:text-blue-200">
            Dica
          </AlertTitle>
          <AlertDescription className="text-blue-700 dark:text-blue-300">
            Você pode começar com o modelo básico de varejo e expandir para atacado conforme sua loja cresce.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};

// Componente compacto para uso em headers ou sidebars
export const PriceModelSetupWarningCompact: React.FC<PriceModelSetupWarningProps> = ({
  storeId,
  onSetupClick,
  onDismiss,
  showDismiss = false
}) => {
  return (
    <Alert className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950">
      <AlertTriangle className="h-4 w-4 text-amber-600" />
      <AlertTitle className="text-amber-800 dark:text-amber-200">
        Configure seu modelo de preços
      </AlertTitle>
      <AlertDescription className="text-amber-700 dark:text-amber-300">
        Sua loja precisa de um modelo de preços para funcionar corretamente.
        <Button 
          variant="link" 
          onClick={onSetupClick}
          className="p-0 h-auto text-amber-800 hover:text-amber-900 dark:text-amber-200 dark:hover:text-amber-100 ml-1"
        >
          Configurar agora
        </Button>
      </AlertDescription>
    </Alert>
  );
};
