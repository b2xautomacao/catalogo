import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, X, Phone } from "lucide-react";
import { useCart } from "@/hooks/useCart";

interface FloatingWhatsAppProps {
  phoneNumber?: string;
  storeName?: string;
  isVisible?: boolean;
}

const FloatingWhatsApp: React.FC<FloatingWhatsAppProps> = ({
  phoneNumber,
  storeName = "Loja",
  isVisible = true,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [cartOffset, setCartOffset] = useState(0);
  const { totalItems } = useCart();

  // Função para formatar o número de telefone
  const formatPhoneNumber = (phone: string) => {
    // Remove tudo que não for número
    const cleanPhone = phone.replace(/\D/g, "");

    // Se não tem código do país, adiciona 55 (Brasil)
    if (cleanPhone.length === 11 && !cleanPhone.startsWith("55")) {
      return `55${cleanPhone}`;
    }

    return cleanPhone;
  };

  // Função para gerar a mensagem padrão
  const generateMessage = () => {
    const baseMessage = `Olá! Vim do catálogo online da ${storeName}`;

    if (totalItems > 0) {
      return `${baseMessage} e tenho interesse em alguns produtos. Podem me ajudar?`;
    }

    return `${baseMessage}. Gostaria de mais informações sobre os produtos.`;
  };

  // Função para abrir o WhatsApp
  const openWhatsApp = () => {
    if (!phoneNumber) return;

    const formattedPhone = formatPhoneNumber(phoneNumber);
    const message = encodeURIComponent(generateMessage());
    const whatsappUrl = `https://wa.me/${formattedPhone}?text=${message}`;

    window.open(whatsappUrl, "_blank");
    setIsOpen(false);
  };

  // Animação de entrada
  useEffect(() => {
    if (isVisible) {
      setIsAnimating(true);
      const timer = setTimeout(() => setIsAnimating(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [isVisible]);

  // Calcular offset baseado no carrinho
  useEffect(() => {
    if (totalItems > 0) {
      // Desktop: FloatingCart está em bottom-20 (80px) + altura do botão (64px) + margem segura (24px)
      // Total: 168px para evitar sobreposição
      setCartOffset(168);
    } else {
      setCartOffset(0);
    }
  }, [totalItems]);

  // Não renderizar se não há número ou não está visível
  if (!phoneNumber || !isVisible) {
    return null;
  }

  return (
    <>
      {/* Overlay para fechar o popup */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20"
          style={{ zIndex: 40 }}
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Popup de informações */}
      {isOpen && (
        <div
          className="fixed z-50 transition-all duration-300 ease-out"
          style={{
            right: "20px",
            bottom: `${88 + cartOffset}px`, // 8px acima do botão WhatsApp
          }}
        >
          <Card className="w-72 shadow-lg border-green-200">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                    <MessageCircle className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{storeName}</p>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-xs text-green-600">Online</span>
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                  className="h-6 w-6 p-0"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>

              <p className="text-sm text-gray-600 mb-4">
                Olá!  Como posso ajudar você hoje?
              </p>

              {totalItems > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 mb-3">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      {totalItems} {totalItems === 1 ? "item" : "itens"} no
                      carrinho
                    </Badge>
                  </div>
                  <p className="text-xs text-blue-700 mt-1">
                    Posso ajudar com seu pedido!
                  </p>
                </div>
              )}

              <Button
                onClick={openWhatsApp}
                className="w-full bg-green-500 hover:bg-green-600 text-white"
                size="sm"
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                Iniciar Conversa
              </Button>

              <p className="text-xs text-gray-500 text-center mt-2">
                Resposta rápida garantida
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Botão flutuante principal */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          fixed w-14 h-14 rounded-full shadow-lg transition-all duration-300 
          bg-green-500 hover:bg-green-600 text-white
          ${isAnimating ? "animate-bounce" : "hover:scale-110"}
          ${isOpen ? "scale-90" : ""}
        `}
        style={{
          right: "20px",
          bottom: `${20 + cartOffset}px`,
          zIndex: totalItems > 0 ? 45 : 50, // Fica abaixo do carrinho quando há itens
        }}
      >
        {isOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <MessageCircle className="h-6 w-6" />
        )}

        {/* Indicador de mensagens (pulsing dot) */}
        {!isOpen && (
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
          </div>
        )}
      </Button>

      {/* Estilo customizado para animações */}
      <style>{`
        @keyframes float {
          0%,
          100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-10px);
          }
        }

        .floating-animation {
          animation: float 3s ease-in-out infinite;
        }
      `}</style>
    </>
  );
};

export default FloatingWhatsApp;
