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
import { Minus, ShoppingCart, Save, Loader2 } from "lucide-react";

interface MinimumPurchaseConfigProps {
  onConfigChange?: (config: any) => void;
}

const MinimumPurchaseConfig: React.FC<MinimumPurchaseConfigProps> = ({
  onConfigChange,
}) => {
  const { toast } = useToast();
  const { profile } = useAuth();
  const { priceModel, updatePriceModel, loading } = useStorePriceModel(
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

  if (loading || !priceModel) {
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
    <Card className="border-slate-200 bg-gradient-to-br from-slate-50 to-white shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-3 text-slate-800">
          <div className="p-2 bg-amber-100 rounded-lg">
            <Minus className="h-5 w-5 text-amber-600" />
          </div>
          Pedido Mínimo
        </CardTitle>
        <p className="text-sm text-slate-600 leading-relaxed">
          Configure um valor mínimo para finalização de pedidos no catálogo
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Habilitar/Desabilitar */}
        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-slate-50 to-amber-50 rounded-xl border border-slate-200">
          <div className="space-y-1">
            <Label
              htmlFor="enable-minimum"
              className="text-slate-800 font-semibold"
            >
              Habilitar Pedido Mínimo
            </Label>
            <p className="text-sm text-slate-600">
              Exigir um valor mínimo para finalizar compras
            </p>
          </div>
          <Switch
            id="enable-minimum"
            checked={isEnabled}
            onCheckedChange={setIsEnabled}
            className="data-[state=checked]:bg-amber-500"
          />
        </div>

        {isEnabled && (
          <div className="space-y-6 p-5 bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl border border-amber-200">
            {/* Valor Mínimo */}
            <div className="space-y-3">
              <Label
                htmlFor="minimum-amount"
                className="text-slate-800 font-semibold"
              >
                Valor Mínimo (R$)
              </Label>
              <div className="relative">
                <ShoppingCart className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-amber-500" />
                <Input
                  id="minimum-amount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={amount}
                  onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                  className="pl-10 border-amber-200 focus:border-amber-400 focus:ring-amber-200"
                  placeholder="0.00"
                />
              </div>
              <p className="text-xs text-slate-600">
                Valor mínimo em reais para finalizar o pedido
              </p>
            </div>

            {/* Mensagem Personalizada */}
            <div className="space-y-3">
              <Label
                htmlFor="minimum-message"
                className="text-slate-800 font-semibold"
              >
                Mensagem Personalizada
              </Label>
              <Textarea
                id="minimum-message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Pedido mínimo de R$ {amount} para finalizar a compra"
                className="min-h-[80px] border-amber-200 focus:border-amber-400 focus:ring-amber-200"
              />
              <p className="text-xs text-slate-600">
                Use{" "}
                <code className="bg-amber-100 text-amber-800 px-2 py-1 rounded text-xs font-mono">{`{amount}`}</code>{" "}
                para inserir o valor automaticamente
              </p>
            </div>

            {/* Preview da Mensagem */}
            <div className="space-y-3">
              <Label className="text-slate-800 font-semibold">
                Preview da Mensagem
              </Label>
              <div className="p-4 bg-white rounded-lg border border-amber-200 shadow-sm">
                <p className="text-sm text-slate-700 font-medium">
                  {previewMessage}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Botão Salvar */}
        <div className="flex justify-end pt-4">
          <Button
            onClick={handleSave}
            disabled={loading}
            className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg shadow-amber-200 transition-all duration-200"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Salvar Configuração
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default MinimumPurchaseConfig;
