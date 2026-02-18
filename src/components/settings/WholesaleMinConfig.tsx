import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { useStorePriceModel } from "@/hooks/useStorePriceModel";
import { useAuth } from "@/hooks/useAuth";
import { Package, Save, Loader2 } from "lucide-react";
import { QuantityInput } from "@/components/ui/quantity-input";

/**
 * Configuração de quantidade mínima para atacado.
 * Aparece apenas quando o modelo de preços é "Varejo + Atacado" (simple_wholesale).
 * Permite escolher: quantidade mínima por produto OU total de itens no carrinho.
 */
const WholesaleMinConfig: React.FC = () => {
  const { toast } = useToast();
  const { profile } = useAuth();
  const { priceModel, updatePriceModel, refetch, loading } = useStorePriceModel(
    profile?.store_id
  );

  const [byCartTotal, setByCartTotal] = useState(false);
  const [minQtyProduct, setMinQtyProduct] = useState(10);
  const [minQtyCart, setMinQtyCart] = useState(10);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (priceModel) {
      setByCartTotal(priceModel.simple_wholesale_by_cart_total === true);
      setMinQtyProduct(priceModel.simple_wholesale_min_qty ?? 10);
      setMinQtyCart(priceModel.simple_wholesale_cart_min_qty ?? 10);
    }
  }, [priceModel]);

  const handleSave = async () => {
    if (!profile?.store_id) return;
    setSaving(true);
    try {
      await updatePriceModel({
        simple_wholesale_by_cart_total: Boolean(byCartTotal),
        simple_wholesale_min_qty: Number(minQtyProduct) || 10,
        simple_wholesale_cart_min_qty: Number(minQtyCart) || 10,
      });
      await refetch();
      toast({
        title: "Configuração salva!",
        description: "Configurações de quantidade mínima para atacado atualizadas.",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível salvar a configuração",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  // Não exibir se não for simple_wholesale
  if (!priceModel || priceModel.price_model !== "simple_wholesale") {
    return null;
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin mr-2" />
          <span>Carregando configurações de atacado...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-slate-200 bg-gradient-to-br from-slate-50 to-white shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-3 text-slate-800">
          <div className="p-2 bg-green-100 rounded-lg">
            <Package className="h-5 w-5 text-green-600" />
          </div>
          Quantidade Mínima para Atacado
        </CardTitle>
        <p className="text-sm text-slate-600 leading-relaxed">
          Configure como o preço de atacado será aplicado: por quantidade de cada produto ou pelo total de itens no carrinho.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4 rounded-lg border p-4 bg-green-50/30 border-green-200">
          <Label className="text-base font-semibold">Tipo de Pedido Mínimo para Atacado</Label>
          <p className="text-sm text-muted-foreground mb-4">
            Escolha como o preço de atacado será aplicado aos produtos:
          </p>
          <RadioGroup
            value={byCartTotal ? "cart" : "product"}
            onValueChange={(value) => setByCartTotal(value === "cart")}
            className="space-y-3"
          >
            <div className="flex items-start space-x-3 rounded-lg border p-4 bg-white hover:bg-slate-50 transition-colors">
              <RadioGroupItem value="product" id="wh_min_product" className="mt-1" />
              <div className="flex-1">
                <Label htmlFor="wh_min_product" className="font-medium cursor-pointer">
                  Por Produto
                </Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Cada produto precisa atingir sua quantidade mínima individual para receber preço de atacado.
                </p>
                {!byCartTotal && (
                  <div className="mt-3 max-w-[160px]">
                    <Label htmlFor="min_qty_product" className="text-sm">
                      Quantidade mínima por produto
                    </Label>
                    <QuantityInput
                      id="min_qty_product"
                      value={minQtyProduct}
                      onChange={(v) => setMinQtyProduct(Math.max(1, v))}
                      min={1}
                      className="mt-1"
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-start space-x-3 rounded-lg border p-4 bg-white hover:bg-slate-50 transition-colors">
              <RadioGroupItem value="cart" id="wh_min_cart" className="mt-1" />
              <div className="flex-1">
                <Label htmlFor="wh_min_cart" className="font-medium cursor-pointer">
                  Por Carrinho (Total de Itens)
                </Label>
                <p className="text-sm text-muted-foreground mt-1">
                  O preço de atacado é aplicado a todos os produtos quando o total de unidades no carrinho atinge o mínimo configurado.
                </p>
                {byCartTotal && (
                  <div className="mt-3 max-w-[160px]">
                    <Label htmlFor="min_qty_cart" className="text-sm">
                      Quantidade mínima total no carrinho
                    </Label>
                    <QuantityInput
                      id="min_qty_cart"
                      value={minQtyCart}
                      onChange={(v) => setMinQtyCart(Math.max(1, v))}
                      min={1}
                      className="mt-1"
                    />
                  </div>
                )}
              </div>
            </div>
          </RadioGroup>
        </div>

        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Salvar
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default WholesaleMinConfig;
