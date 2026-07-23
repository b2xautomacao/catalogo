import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Smartphone, CreditCard, Banknote, Receipt } from "lucide-react";

interface PaymentMethod {
  id: string;
  name: string;
  type: string;
  is_active: boolean;
  config?: {
    instructions?: string;
    pix_key?: string;
  };
}

interface PaymentOptionsCardProps {
  paymentMethods: PaymentMethod[];
  selectedPaymentMethodId: string;
  onSelectPaymentMethod: (id: string) => void;
}

const PaymentOptionsCard: React.FC<PaymentOptionsCardProps> = ({
  paymentMethods,
  selectedPaymentMethodId,
  onSelectPaymentMethod,
}) => {
  const getPaymentIcon = (type: string) => {
    switch (type) {
      case "pix":
        return Smartphone;
      case "credit_card":
        return CreditCard;
      case "bank_transfer":
        return Banknote;
      case "bank_slip":
        return Receipt;
      case "combine":
        return Smartphone;
      default:
        return CreditCard;
    }
  };

  // Opções padrão quando não há métodos configurados
  const defaultMethods = [
    {
      id: "pix",
      name: "PIX",
      type: "pix",
      instructions: "Pagamento instantâneo via PIX",
    },
    {
      id: "combine",
      name: "A combinar",
      type: "combine",
      instructions: "Forma de pagamento será definida via WhatsApp",
    },
  ];

  const methodsToShow =
    paymentMethods.length > 0 ? paymentMethods : defaultMethods;

  return (
    <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-gray-50">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-3 text-lg">
          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-primary to-accent flex items-center justify-center">
            <CreditCard className="h-5 w-5 text-white" />
          </div>
          Método de Pagamento
        </CardTitle>
      </CardHeader>
      <CardContent>
        <RadioGroup
          value={selectedPaymentMethodId}
          onValueChange={onSelectPaymentMethod}
          className="space-y-3"
        >
          {methodsToShow.map((method) => {
            const IconComponent = getPaymentIcon(method.type);
            return (
              <div
                key={method.id}
                className={`flex items-center space-x-4 p-4 border-2 rounded-xl hover:bg-blue-50 transition-all cursor-pointer ${
                  selectedPaymentMethodId === method.id
                    ? "border-primary bg-blue-50"
                    : "border-gray-200"
                }`}
              >
                <RadioGroupItem value={method.id} id={method.id} />
                <div className="flex items-center gap-3 flex-1">
                  <IconComponent size={20} className="text-primary" />
                  <div>
                    <label
                      htmlFor={method.id}
                      className="font-semibold cursor-pointer text-lg"
                    >
                      {method.name}
                    </label>
                    {method.config?.instructions && (
                      <p className="text-sm text-gray-600 mt-1">
                        {method.config.instructions}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </RadioGroup>

        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-blue-800 text-sm flex items-center gap-2">
            <span className="text-blue-600"></span>
            Todos os pagamentos são processados de forma segura
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default PaymentOptionsCard;
