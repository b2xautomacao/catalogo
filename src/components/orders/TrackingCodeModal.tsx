import React, { useState } from "react";
import { Order } from "@/hooks/useOrders";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Truck, Hash, Calendar, MapPin, Save, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface TrackingCodeModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (
    trackingCode: string,
    carrier: string,
    estimatedDate?: string
  ) => void;
}

const TrackingCodeModal: React.FC<TrackingCodeModalProps> = ({
  order,
  isOpen,
  onClose,
  onSave,
}) => {
  const [trackingCode, setTrackingCode] = useState("");
  const [carrier, setCarrier] = useState("");
  const [estimatedDate, setEstimatedDate] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setSaving] = useState(false);
  const { toast } = useToast();

  // Resetar campos quando modal abrir
  React.useEffect(() => {
    if (isOpen && order) {
      setTrackingCode(order.tracking_code || "");
      setCarrier(order.carrier || "");
      setEstimatedDate(
        order.estimated_delivery_date
          ? new Date(order.estimated_delivery_date).toISOString().split("T")[0]
          : ""
      );
      setNotes("");
    }
  }, [isOpen, order]);

  const handleSave = async () => {
    if (!order || !trackingCode.trim()) {
      toast({
        title: "Erro",
        description: "Código de rastreio é obrigatório.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      // Atualizar no banco de dados
      const { error } = await supabase
        .from("orders")
        .update({
          tracking_code: trackingCode.trim(),
          carrier: carrier || null,
          estimated_delivery_date: estimatedDate || null,
          status: order.status === "confirmed" ? "shipping" : order.status,
          updated_at: new Date().toISOString(),
        })
        .eq("id", order.id);

      if (error) throw error;

      // Callback para atualizar a lista
      onSave(trackingCode.trim(), carrier, estimatedDate);

      toast({
        title: "Sucesso!",
        description: "Código de rastreio salvo com sucesso.",
      });

      onClose();
    } catch (error) {
      console.error("Erro ao salvar código de rastreio:", error);
      toast({
        title: "Erro",
        description: "Erro ao salvar código de rastreio.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSendToCustomer = async () => {
    if (!order || !trackingCode.trim()) {
      toast({
        title: "Erro",
        description: "Salve o código de rastreio primeiro.",
        variant: "destructive",
      });
      return;
    }

    // Gerar mensagem para WhatsApp
    const message =
      `🚚 *PEDIDO ENVIADO - ${order.id.slice(-8)}*\n\n` +
      `Olá ${order.customer_name}!\n\n` +
      `Seu pedido foi enviado e já está a caminho! 📦\n\n` +
      `📋 *Código de Rastreio:* ${trackingCode}\n` +
      `🚛 *Transportadora:* ${carrier || "Correios"}\n` +
      (estimatedDate
        ? `📅 *Previsão de Entrega:* ${new Date(
            estimatedDate
          ).toLocaleDateString("pt-BR")}\n`
        : "") +
      `\n🔍 *Rastrear seu pedido:*\n` +
      `https://www.correios.com.br/rastreamento\n\n` +
      `Obrigado pela preferência! 😊`;

    if (order.customer_phone) {
      const whatsappUrl = `https://wa.me/${order.customer_phone.replace(
        /\D/g,
        ""
      )}?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, "_blank");

      toast({
        title: "WhatsApp aberto!",
        description: "Mensagem de rastreio preparada para envio.",
      });
    } else {
      // Copiar para clipboard
      navigator.clipboard.writeText(message);
      toast({
        title: "Mensagem copiada!",
        description: "Cole no WhatsApp do cliente.",
      });
    }
  };

  if (!order) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Truck className="h-5 w-5" />
            Código de Rastreio - Pedido #{order.id.slice(-8)}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informações do Pedido */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p>
                  <strong>Cliente:</strong> {order.customer_name}
                </p>
                <p>
                  <strong>Status:</strong> {order.status}
                </p>
              </div>
              <div>
                <p>
                  <strong>Total:</strong> R$ {order.total_amount.toFixed(2)}
                </p>
                <p>
                  <strong>Itens:</strong> {order.items?.length || 0} produtos
                </p>
              </div>
            </div>
          </div>

          {/* Formulário */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label
                htmlFor="tracking-code"
                className="flex items-center gap-2"
              >
                <Hash className="h-4 w-4" />
                Código de Rastreio *
              </Label>
              <Input
                id="tracking-code"
                value={trackingCode}
                onChange={(e) => setTrackingCode(e.target.value)}
                placeholder="Ex: BR123456789BR"
                className="font-mono"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="carrier">Transportadora</Label>
              <Select value={carrier} onValueChange={setCarrier}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a transportadora" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="correios">Correios</SelectItem>
                  <SelectItem value="jadlog">JadLog</SelectItem>
                  <SelectItem value="total">Total Express</SelectItem>
                  <SelectItem value="loggi">Loggi</SelectItem>
                  <SelectItem value="mercado-envios">Mercado Envios</SelectItem>
                  <SelectItem value="outro">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="estimated-date"
                className="flex items-center gap-2"
              >
                <Calendar className="h-4 w-4" />
                Previsão de Entrega
              </Label>
              <Input
                id="estimated-date"
                type="date"
                value={estimatedDate}
                onChange={(e) => setEstimatedDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Observações</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Observações sobre o envio..."
                rows={3}
              />
            </div>
          </div>

          {/* Ações */}
          <div className="flex flex-col sm:flex-row gap-3 justify-between">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>

            <div className="flex gap-3">
              <Button
                onClick={handleSave}
                disabled={loading || !trackingCode.trim()}
                className="flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                {loading ? "Salvando..." : "Salvar"}
              </Button>

              {trackingCode.trim() && (
                <Button
                  onClick={handleSendToCustomer}
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                >
                  <Send className="h-4 w-4" />
                  Enviar ao Cliente
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TrackingCodeModal;




