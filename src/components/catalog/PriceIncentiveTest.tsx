import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrendingUp, Package, Coins } from "lucide-react";

const PriceIncentiveTest: React.FC = () => {
  // Dados simulados para teste
  const testProduct = {
    id: "test-product-1",
    name: "Produto Teste",
    retail_price: 20.0,
    wholesale_price: 15.0,
    min_wholesale_qty: 5,
    stock: 100,
    allow_negative_stock: false,
  };

  const testPriceTiers = [
    { tier_name: "Varejo", price: 20.0, min_quantity: 1, tier_order: 1 },
    { tier_name: "Atacarejo", price: 18.0, min_quantity: 5, tier_order: 2 },
    {
      tier_name: "Atacado Pequeno",
      price: 16.0,
      min_quantity: 10,
      tier_order: 3,
    },
    {
      tier_name: "Atacado Grande",
      price: 14.0,
      min_quantity: 50,
      tier_order: 4,
    },
  ];

  const calculatePriceForQuantity = (quantity: number) => {
    // Encontrar o melhor tier baseado na quantidade
    const sortedTiers = [...testPriceTiers].sort(
      (a, b) => b.min_quantity - a.min_quantity
    );
    const currentTier =
      sortedTiers.find((tier) => quantity >= tier.min_quantity) ||
      testPriceTiers[0];

    // Encontrar próximo tier
    const nextTier = testPriceTiers
      .filter((tier) => tier.min_quantity > quantity)
      .sort((a, b) => a.min_quantity - b.min_quantity)[0];

    return { currentTier, nextTier };
  };

  const TestQuantityRow: React.FC<{ quantity: number }> = ({ quantity }) => {
    const { currentTier, nextTier } = calculatePriceForQuantity(quantity);
    const totalPrice = currentTier.price * quantity;
    const retailTotal = testProduct.retail_price * quantity;
    const savings = retailTotal - totalPrice;
    const savingsPercent = savings > 0 ? (savings / retailTotal) * 100 : 0;

    return (
      <div className="border rounded-lg p-3 bg-white">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-gray-600" />
            <span className="font-medium">{quantity} unidades</span>
            <Badge
              className={`text-xs ${
                currentTier.tier_order === 1
                  ? "bg-blue-100 text-blue-800"
                  : currentTier.tier_order === 2
                  ? "bg-orange-100 text-orange-800"
                  : currentTier.tier_order === 3
                  ? "bg-green-100 text-green-800"
                  : "bg-yellow-100 text-yellow-800"
              }`}
            >
              {currentTier.tier_name}
            </Badge>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-1">
              {savings > 0 && (
                <span className="text-xs text-gray-400 line-through">
                  R$ {retailTotal.toFixed(2)}
                </span>
              )}
              <span className="font-bold text-green-600">
                R$ {totalPrice.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {savings > 0 && (
          <div className="flex items-center justify-between text-xs bg-green-50 p-1 rounded mb-2">
            <span className="text-green-700">Economia:</span>
            <span className="text-green-700 font-bold">
              R$ {savings.toFixed(2)} ({savingsPercent.toFixed(0)}%)
            </span>
          </div>
        )}

        {nextTier && (
          <div className="flex items-center gap-1 text-xs text-blue-600 bg-blue-50 p-2 rounded">
            <TrendingUp className="h-3 w-3" />
            <span>
              Adicione +{nextTier.min_quantity - quantity} unidades para{" "}
              <strong>{nextTier.tier_name}</strong> e economize{" "}
              <strong>
                R${" "}
                {((currentTier.price - nextTier.price) * quantity).toFixed(2)}
              </strong>
            </span>
          </div>
        )}
      </div>
    );
  };

  return (
    <Card className="m-4 max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Coins className="h-5 w-5" />
           Teste de Incentivos de Preço
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="bg-gray-100 p-3 rounded text-sm">
          <div>
            <strong>Produto:</strong> {testProduct.name}
          </div>
          <div>
            <strong>Preço Varejo:</strong> R${" "}
            {testProduct.retail_price.toFixed(2)}
          </div>
          <div>
            <strong>Preço Atacado:</strong> R${" "}
            {testProduct.wholesale_price.toFixed(2)}
          </div>
          <div>
            <strong>Qtd Mín Atacado:</strong> {testProduct.min_wholesale_qty}{" "}
            unidades
          </div>
        </div>

        <div className="space-y-2">
          <h4 className="font-medium text-gray-700">
            Simulação por Quantidade:
          </h4>
          <TestQuantityRow quantity={1} />
          <TestQuantityRow quantity={3} />
          <TestQuantityRow quantity={5} />
          <TestQuantityRow quantity={10} />
          <TestQuantityRow quantity={50} />
        </div>

        <div className="pt-3 border-t">
          <h4 className="font-medium text-gray-700 mb-2">
            Níveis Configurados:
          </h4>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {testPriceTiers.map((tier, index) => (
              <div key={index} className="bg-gray-50 p-2 rounded">
                <div className="font-medium">{tier.tier_name}</div>
                <div>
                  R$ {tier.price.toFixed(2)} (min: {tier.min_quantity})
                </div>
              </div>
            ))}
          </div>
        </div>

        <Button
          onClick={() => {
            console.group(" Teste de Incentivos");
            console.log("Produto:", testProduct);
            console.log("Níveis:", testPriceTiers);
            testPriceTiers.forEach((tier) => {
              const testQty = tier.min_quantity;
              const calc = calculatePriceForQuantity(testQty);
              console.log(`Quantidade ${testQty}:`, calc);
            });
            console.groupEnd();
          }}
          variant="outline"
          className="w-full"
        >
           Log Detalhado no Console
        </Button>
      </CardContent>
    </Card>
  );
};

export default PriceIncentiveTest;
