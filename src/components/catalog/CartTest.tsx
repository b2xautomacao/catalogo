import React from "react";
import { useCart } from "@/hooks/useCart";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const CartTest: React.FC = () => {
  const cart = useCart();

  const addTestItem = () => {
    const testItem = {
      id: "test-" + Date.now(),
      product: {
        id: "prod-test-" + Math.random(),
        name: "Produto Teste " + Math.floor(Math.random() * 100),
        retail_price: 19.99,
        wholesale_price: 15.99,
        min_wholesale_qty: 5,
        image_url: "/placeholder.svg",
        store_id: "store-1",
        stock: 100,
        allow_negative_stock: false,
      },
      quantity: 1,
      price: 19.99,
      originalPrice: 19.99,
      catalogType: "retail" as const,
      isWholesalePrice: false,
    };

    console.log("➕ Adicionando item teste:", testItem);
    cart.addItem(testItem);
  };

  const addBulkItems = () => {
    for (let i = 0; i < 3; i++) {
      addTestItem();
    }
  };

  return (
    <Card className="m-4 max-w-md">
      <CardHeader>
        <CardTitle>🧪 Teste do Carrinho</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-2">
          <Button onClick={addTestItem} variant="outline">
            ➕ Adicionar Item
          </Button>
          <Button onClick={addBulkItems} variant="outline">
            ➕ 3 Itens
          </Button>
          <Button onClick={cart.clearCart} variant="destructive">
            🗑️ Limpar
          </Button>
          <Button onClick={cart.toggleCart} variant="secondary">
            {cart.isOpen ? "❌ Fechar" : "🛒 Abrir"}
          </Button>
        </div>

        <div className="bg-gray-100 p-3 rounded text-sm">
          <div>
            <strong>Itens:</strong> {cart.totalItems}
          </div>
          <div>
            <strong>Total:</strong> R$ {cart.totalAmount.toFixed(2)}
          </div>
          <div>
            <strong>Produtos:</strong> {cart.items.length}
          </div>
          <div>
            <strong>Aberto:</strong> {cart.isOpen ? "Sim" : "Não"}
          </div>
        </div>

        <Button
          onClick={() => {
            console.group("🛒 Debug Carrinho");
            console.log("Estado completo:", cart);
            console.log("Items array:", cart.items);
            console.log("LocalStorage:", localStorage.getItem("cart-items"));
            console.groupEnd();
          }}
          variant="ghost"
          className="w-full text-xs"
        >
          📋 Log Debug no Console
        </Button>
      </CardContent>
    </Card>
  );
};

export default CartTest;
