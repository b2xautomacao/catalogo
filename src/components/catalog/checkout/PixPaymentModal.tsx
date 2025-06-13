
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Copy, Check, Clock, QrCode, Smartphone } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface PixPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  amount: number;
  pixCode?: string;
  qrCodeUrl?: string;
  onPaymentConfirmed: () => void;
}

const PixPaymentModal: React.FC<PixPaymentModalProps> = ({
  isOpen,
  onClose,
  orderId,
  amount,
  pixCode,
  qrCodeUrl,
  onPaymentConfirmed
}) => {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30 * 60); // 30 minutos em segundos

  // Timer para expiração do PIX
  useEffect(() => {
    if (!isOpen) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen]);

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const copyPixCode = async () => {
    if (!pixCode) return;

    try {
      await navigator.clipboard.writeText(pixCode);
      setCopied(true);
      toast({
        title: "✅ Código PIX copiado!",
        description: "Cole o código no seu banco ou app de pagamento",
        duration: 3000,
      });

      setTimeout(() => setCopied(false), 3000);
    } catch (error) {
      toast({
        title: "❌ Erro ao copiar",
        description: "Não foi possível copiar o código PIX",
        variant: "destructive",
      });
    }
  };

  const mockPixCode = pixCode || "00020126580014BR.GOV.BCB.PIX013636c8e2e8-4c1e-4c8b-8c9f-8c8e8c8e8c8e52040000530398654041.005802BR5925LOJA ONLINE LTDA6014SAO PAULO61058000062070503***6304ABCD";

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5 text-green-600" />
            Pagamento via PIX
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status do pagamento */}
          <Card className="border-green-200 bg-green-50">
            <CardContent className="pt-6">
              <div className="text-center space-y-2">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                  <QrCode className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="font-semibold text-green-800">PIX Gerado com Sucesso!</h3>
                <p className="text-sm text-green-700">
                  Escaneie o QR Code ou copie o código PIX
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Timer */}
          <div className="text-center">
            <Badge variant="outline" className="text-orange-600 border-orange-200">
              <Clock className="w-4 h-4 mr-1" />
              Expira em {formatTime(timeLeft)}
            </Badge>
          </div>

          {/* Valor */}
          <div className="text-center space-y-1">
            <p className="text-sm text-gray-600">Valor a pagar</p>
            <p className="text-2xl font-bold text-primary">R$ {amount.toFixed(2)}</p>
            <p className="text-xs text-gray-500">Pedido #{orderId.slice(-8)}</p>
          </div>

          {/* QR Code (placeholder - seria gerado pelo Mercado Pago) */}
          <Card>
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <div className="w-40 h-40 bg-gray-100 rounded-lg flex items-center justify-center mx-auto">
                  {qrCodeUrl ? (
                    <img src={qrCodeUrl} alt="QR Code PIX" className="w-full h-full object-contain" />
                  ) : (
                    <div className="text-center">
                      <QrCode className="w-16 h-16 text-gray-400 mx-auto mb-2" />
                      <p className="text-xs text-gray-500">QR Code será exibido aqui</p>
                    </div>
                  )}
                </div>
                <p className="text-sm text-gray-600">
                  Escaneie com a câmera do seu celular ou app do banco
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Código PIX */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Ou copie o código PIX:</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="bg-gray-50 p-3 rounded-lg border">
                <p className="text-xs font-mono break-all text-gray-700">
                  {mockPixCode}
                </p>
              </div>
              
              <Button
                onClick={copyPixCode}
                variant="outline"
                className="w-full"
                disabled={copied}
              >
                {copied ? (
                  <>
                    <Check className="mr-2 h-4 w-4 text-green-600" />
                    Copiado!
                  </>
                ) : (
                  <>
                    <Copy className="mr-2 h-4 w-4" />
                    Copiar código PIX
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Instruções */}
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="pt-4">
              <div className="space-y-2">
                <h4 className="font-medium text-blue-800">Como pagar:</h4>
                <ol className="text-sm text-blue-700 space-y-1">
                  <li>1. Abra o app do seu banco</li>
                  <li>2. Escolha a opção PIX</li>
                  <li>3. Escaneie o QR Code ou cole o código</li>
                  <li>4. Confirme o pagamento</li>
                </ol>
              </div>
            </CardContent>
          </Card>

          {/* Botões */}
          <div className="space-y-3">
            <Button
              onClick={onPaymentConfirmed}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              ✅ Já paguei - Confirmar Pagamento
            </Button>
            
            <Button
              onClick={onClose}
              variant="outline"
              className="w-full"
            >
              Cancelar
            </Button>
          </div>

          <p className="text-xs text-gray-500 text-center">
            O pagamento será confirmado automaticamente quando processado pelo banco.
            Isso pode levar alguns segundos.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PixPaymentModal;
