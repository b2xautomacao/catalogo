import React from "react";
import { ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/hooks/useCart";

interface SimpleFloatingCartProps {
  onCheckout?: () => void;
  storeId?: string;
}

const SimpleFloatingCart: React.FC<SimpleFloatingCartProps> = ({
  onCheckout,
  storeId,
}) => {
  const { totalItems, toggleCart } = useCart();

  console.log(
    "🛒 SimpleFloatingCart: Sempre renderizando, totalItems:",
    totalItems
  );

  return (
    <div
      className="fixed z-[9999]"
      style={{
        position: "fixed",
        bottom: "80px",
        right: "24px",
        zIndex: 9999,
      }}
    >
      <Button
        size="lg"
        className="relative h-16 w-16 rounded-full shadow-2xl flex items-center justify-center border-2 border-white"
        onClick={() => {
          console.log("🛒 SimpleFloatingCart: Botão clicado!");
          toggleCart();
        }}
        style={{
          background: "linear-gradient(135deg, #0057FF, #8E2DE2)",
          color: "white",
        }}
      >
        <ShoppingCart className="h-8 w-8 text-white" />
        {totalItems > 0 && (
          <Badge
            className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center p-0 min-w-6"
            style={{ background: "#ef4444" }}
          >
            {totalItems > 99 ? "99+" : totalItems}
          </Badge>
        )}
      </Button>
    </div>
  );
};

export default SimpleFloatingCart;
