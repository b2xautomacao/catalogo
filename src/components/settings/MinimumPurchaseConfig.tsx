import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useStorePriceModel } from "@/hooks/useStorePriceModel";
import { useAuth } from "@/hooks/useAuth";
import { Minus, ShoppingCart } from "lucide-react";

interface MinimumPurchaseConfigProps {
  onConfigChange?: (config: any) => void;
}

const MinimumPurchaseConfig: React.FC<MinimumPurchaseConfigProps> = ({
  onConfigChange,
}) => {
  const { toast } = useToast();
  const { profile } = useAuth();
  const { priceModel, updatePriceModel, isLoading } = useStorePriceModel(
    profile?.store_id
  );

  const [isEnabled, setIsEnabled] = useState(
    priceModel?.minimum_purchase_enabled || false
  );
  const [amount, setAmount] = useState(
    priceModel?.minimum_purchase_amount || 0
  );
  const [message, setMessage] = useState(
    priceModel?.minimum_purchase_message ||
      "Pedido mínimo de R$ {amount} para finalizar a compra"
  );

  // Sincronizar estado local com dados do banco
  React.useEffect(() => {
    if (priceModel) {
      setIsEnabled(priceModel.minimum_purchase_enabled || false);
      setAmount(priceModel.minimum_purchase_amount || 0);
      setMessage(
        priceModel.minimum_purchase_message ||
          "Pedido mínimo de R$ {amount} para finalizar a compra"
      );
    }
  }, [priceModel]);

  const handleSave = async () => {
    if (!profile?.store_id) {
      toast({
        title: "Erro",
        description: "Loja não encontrada",
        variant: "destructive",
      });
      return;
    }

    const updateData = {
      minimum_purchase_enabled: isEnabled,
      minimum_purchase_amount: amount,
      minimum_purchase_message: message,
    };

    console.log("🔄 MinimumPurchaseConfig: Salvando dados:", updateData);
    console.log("🔄 MinimumPurchaseConfig: Store ID:", profile.store_id);

    try {
      await updatePriceModel(updateData);

      console.log("✅ MinimumPurchaseConfig: Dados salvos com sucesso");

      toast({
        title: "Configuração salva!",
        description: "As configurações de pedido mínimo foram atualizadas.",
      });

      onConfigChange?.(updateData);
    } catch (error) {
      console.error("❌ MinimumPurchaseConfig: Erro ao salvar:", error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar a configuração",
        variant: "destructive",
      });
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const previewMessage = message.replace("{amount}", formatCurrency(amount));

  if (isLoading || !priceModel) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Minus className="h-5 w-5" />
            Pedido Mínimo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Minus className="h-5 w-5" />
          Pedido Mínimo
        </CardTitle>
        <p className="text-sm text-gray-600">
          Configure um valor mínimo para finalização de pedidos no catálogo
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Habilitar/Desabilitar */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="enable-minimum">Habilitar Pedido Mínimo</Label>
            <p className="text-sm text-gray-500">
              Exigir um valor mínimo para finalizar compras
            </p>
          </div>
          <Switch
            id="enable-minimum"
            checked={isEnabled}
            onCheckedChange={setIsEnabled}
          />
        </div>

        {isEnabled && (
          <>
            {/* Valor Mínimo */}
            <div className="space-y-2">
              <Label htmlFor="minimum-amount">Valor Mínimo (R$)</Label>
              <div className="relative">
                <ShoppingCart className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="minimum-amount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={amount}
                  onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                  className="pl-10"
                  placeholder="0.00"
                />
              </div>
              <p className="text-xs text-gray-500">
                Valor mínimo em reais para finalizar o pedido
              </p>
            </div>

            {/* Mensagem Personalizada */}
            <div className="space-y-2">
              <Label htmlFor="minimum-message">Mensagem Personalizada</Label>
              <Textarea
                id="minimum-message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Pedido mínimo de R$ {amount} para finalizar a compra"
                className="min-h-[80px]"
              />
              <p className="text-xs text-gray-500">
                Use{" "}
                <code className="bg-gray-100 px-1 rounded">{`{amount}`}</code>{" "}
                para inserir o valor automaticamente
              </p>
            </div>

            {/* Preview da Mensagem */}
            <div className="space-y-2">
              <Label>Preview da Mensagem</Label>
              <div className="p-3 bg-gray-50 rounded-md border">
                <p className="text-sm text-gray-700">{previewMessage}</p>
              </div>
            </div>
          </>
        )}

        {/* Botão Salvar */}
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading ? "Salvando..." : "Salvar Configuração"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default MinimumPurchaseConfig;
