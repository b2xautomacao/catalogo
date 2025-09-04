import React from "react";
import { Button } from "@/components/ui/button";
import { useMinimumPurchaseValidation } from "@/hooks/useMinimumPurchaseValidation";

const ButtonTest: React.FC = () => {
  const validation = useMinimumPurchaseValidation();

  return (
    <div className="p-4 space-y-4">
      <h3 className="font-bold">Teste do Botão</h3>

      <div className="space-y-2">
        <p>
          <strong>Pode prosseguir:</strong>{" "}
          {validation.canProceed ? "Sim" : "Não"}
        </p>
        <p>
          <strong>Valor atual:</strong> R$ {validation.currentAmount}
        </p>
        <p>
          <strong>Valor mínimo:</strong> R$ {validation.minimumAmount}
        </p>
      </div>

      <div className="space-y-2">
        <Button disabled={!validation.canProceed} className="w-full">
          {validation.canProceed
            ? "Finalizar Pedido"
            : "Pedido Mínimo Necessário"}
        </Button>

        <Button
          disabled={!validation.canProceed}
          className={`w-full ${
            !validation.canProceed
              ? "bg-gray-300 text-gray-500"
              : "bg-blue-500 text-white"
          }`}
        >
          Botão com CSS customizado
        </Button>

        <button
          disabled={!validation.canProceed}
          className={`w-full px-4 py-2 rounded ${
            !validation.canProceed
              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
              : "bg-blue-500 text-white hover:bg-blue-600"
          }`}
        >
          Botão HTML nativo
        </button>
      </div>
    </div>
  );
};

export default ButtonTest;
