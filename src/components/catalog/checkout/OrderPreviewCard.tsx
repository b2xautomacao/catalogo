import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageCircle, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { generateWhatsAppMessage } from "./checkoutUtils";
import { useState } from "react";

interface OrderPreviewCardProps {
  orderData: {
    customer_name: string;
    customer_phone: string;
    customer_email?: string;
    total_amount: number;
    items: Array<{
      name: string;
      quantity: number;
      price: number;
      variation?: string;
    }>;
    shipping_method?: string;
    shipping_cost?: number;
    notes?: string;
  };
}

const OrderPreviewCard: React.FC<OrderPreviewCardProps> = ({ orderData }) => {
  const [copied, setCopied] = useState(false);
  const message = generateWhatsAppMessage(orderData);

  const handleCopyMessage = async () => {
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Erro ao copiar mensagem:", err);
    }
  };

  return (
    <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-green-800 text-lg">
          <MessageCircle className="h-5 w-5" />
          Preview da Mensagem WhatsApp
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-white p-4 rounded-lg border border-green-200 max-h-48 overflow-y-auto">
          <pre className="whitespace-pre-wrap text-sm text-gray-700 font-mono leading-relaxed">
            {message}
          </pre>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handleCopyMessage}
          className="w-full bg-white hover:bg-green-50 border-green-300 text-green-700"
        >
          {copied ? (
            <>
              <Check className="h-4 w-4 mr-2" />
              Copiado!
            </>
          ) : (
            <>
              <Copy className="h-4 w-4 mr-2" />
              Copiar Mensagem
            </>
          )}
        </Button>

        <div className="text-xs text-green-600 bg-green-100 p-2 rounded-lg">
           Esta mensagem será enviada automaticamente para o WhatsApp da loja
          quando você confirmar o pedido.
        </div>
      </CardContent>
    </Card>
  );
};

export default OrderPreviewCard;
